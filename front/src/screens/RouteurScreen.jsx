import { Fragment, useState } from 'react';
import { sendAnswer } from '../api/client.js';
import { useGame } from '../game/GameContext.jsx';
import GameHeader from '../components/GameHeader.jsx';
import MissionCard from '../components/MissionCard.jsx';
import ExplainBox from '../components/ExplainBox.jsx';
import PacketSprite from '../components/PacketSprite.jsx';

// Combien de nombres de l'adresse ce préfixe « fixe » : /24 -> 3, /16 -> 2, /8 -> 1, /0 -> 0.
function nombresFixes(masque) {
  return parseInt(masque.slice(1), 10) / 8;
}

// Une petite jauge visuelle de précision : 4 carrés, N remplis.
function JaugePrecision({ fixes }) {
  return (
    <span className="rt-precision" aria-hidden="true">
      {[0, 1, 2, 3].map((k) => (
        <i key={k} className={k < fixes ? 'plein' : ''} />
      ))}
    </span>
  );
}

// La liste des routes à choisir (identique pour le routage normal et le détour).
function RouteList({ candidates, onChoose, shakeIdx }) {
  return (
    <ul className="rt-table">
      {candidates.map((c, i) => {
        const fixes = nombresFixes(c.masque);
        const reseau = c.reseau.split('.');
        const defaut = c.masque === '/0';
        return (
          <li key={i}>
            <button className={`rt-ligne ${defaut ? 'est-defaut' : ''} ${shakeIdx === i ? 'tremble' : ''}`} onClick={() => onChoose(i)}>
              <span className="rt-reseau">
                {reseau.map((o, k) => (
                  <span key={k} className={k < fixes ? 'octet-fixe' : 'octet-libre'}>
                    {k < fixes ? o : '×'}
                    {k < 3 ? '.' : ''}
                  </span>
                ))}
              </span>
              <span className="rt-masque">{c.masque}</span>
              <JaugePrecision fixes={fixes} />
              <span className="rt-direction">{defaut ? '🧭 ' : ''}{c.nom}</span>
              <span className="rt-vers">{c.ip ? `→ ${c.ip}` : '🧭 partout'}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function RouteurScreen() {
  const { state, dispatch } = useGame();
  const { quest, sessionId } = state;
  const graph = quest.routeurs; // [{ from, candidates:[{reseau,masque,nom,ip}] }, ...]
  const destOctets = quest.ip.split('.');

  const [hop, setHop] = useState(0);
  const [routeurs, setRouteurs] = useState([]); // routeurs traversés : [{nom, ip}]
  const [phase, setPhase] = useState('jeu'); // 'jeu' | 'panne' | 'resolu'
  const [reroute, setReroute] = useState([]); // étapes du détour
  const [detourStep, setDetourStep] = useState(0);
  const [detourNodes, setDetourNodes] = useState([]); // routeurs du détour traversés : [{nom, ip}]
  const [message, setMessage] = useState(null);
  const [shakeIdx, setShakeIdx] = useState(null);

  // La carte principale : Ta Box -> Routeur 1 -> Routeur 2 -> Serveur (chaque routeur a une IP).
  const slots = [
    { ico: '🏠', nom: 'Ta Box', ip: '192.168.1.1' },
    { ico: '📡', nom: routeurs[0]?.nom || '?', ip: routeurs[0]?.ip || '' },
    { ico: '📡', nom: routeurs[1]?.nom || '?', ip: routeurs[1]?.ip || '' },
    { ico: '🖥', nom: phase === 'resolu' ? `Serveur ${quest.ville}` : '?', ip: phase === 'resolu' ? quest.ip : '' },
  ];
  const lienCasse = phase === 'panne' || phase === 'resolu';

  async function choisir(i) {
    if (phase === 'resolu') return;
    try {
      const res = await sendAnswer(sessionId, 'routeur', i);
      if (res.correct) {
        if (res.done) {
          if (res.chosen) setDetourNodes((p) => [...p, { nom: res.chosen.nom, ip: res.chosen.ip }]);
          setHop(res.hop);
          setPhase('resolu');
          setMessage({ ton: 'succes', titre: 'Arrivé !', texte: res.feedback });
          dispatch({ type: 'SYNC', zone: 'routeur', tokens: res.tokens });
        } else if (res.panne && phase !== 'panne') {
          setReroute(res.reroute || []);
          setDetourStep(0);
          setPhase('panne');
          setMessage({ ton: 'oups', titre: 'Panne !', texte: res.feedback });
        } else if (res.panne) {
          if (res.chosen) setDetourNodes((p) => [...p, { nom: res.chosen.nom, ip: res.chosen.ip }]);
          setDetourStep(res.detourHop);
          setMessage({ ton: 'succes', titre: 'Bon saut !', texte: res.feedback });
        } else {
          if (res.chosen) setRouteurs((p) => [...p, { nom: res.chosen.nom, ip: res.chosen.ip }]);
          setHop(res.hop);
          setMessage({ ton: 'succes', titre: 'Bon saut !', texte: res.feedback });
        }
      } else {
        setMessage({ ton: 'oups', titre: 'Mauvaise route', texte: res.feedback });
        setShakeIdx(i);
        window.setTimeout(() => setShakeIdx(null), 500);
      }
    } catch (e) {
      setMessage({ ton: 'oups', titre: 'Oups', texte: e.message });
    }
  }

  return (
    <main className="jeu-ecran">
      <GameHeader />

      <div className="scene">
        {/* ── Le routeur et la carte du voyage ── */}
        <div className="stage stage--routeur">
          <p className="rt-titre">🌍 Le Routeur — le GPS des paquets</p>

          <div className="rt-dest">
            <span className="rt-dest-label">Adresse de destination du paquet</span>
            <span className="rt-ip-octets">
              {destOctets.map((o, idx) => (
                <span key={idx}>
                  <b>{o}</b>
                  {idx < 3 && <i>.</i>}
                </span>
              ))}
            </span>
          </div>

          {/* La carte qui se construit, saut par saut */}
          <div className="rt-carte" aria-label="Le chemin du paquet">
            {slots.map((s, i) => (
              <Fragment key={i}>
                {i > 0 && (
                  <span
                    className={`rt-lien ${i <= hop && !(i === 3 && lienCasse) ? 'est-fait' : ''} ${i === 3 && lienCasse ? 'est-casse' : ''}`}
                    aria-hidden="true"
                  />
                )}
                <div
                  className={`rt-noeud ${i <= hop ? 'est-fait' : ''} ${i === hop && phase === 'jeu' ? 'est-courant' : ''} ${i === 3 && phase === 'resolu' ? 'est-arrivee' : ''}`}
                >
                  {i === hop && phase === 'jeu' && (
                    <span className="rt-noeud-packet"><PacketSprite size={24} color={quest.couleur} /></span>
                  )}
                  <span className="rt-noeud-ico">{i === 3 && phase === 'panne' ? '💥' : s.ico}</span>
                  <span className="rt-noeud-nom">{s.nom}</span>
                  {s.ip && <span className="rt-noeud-ip">{s.ip}</span>}
                </div>
              </Fragment>
            ))}
          </div>

          {/* Le détour (chemin plus long, 2 routeurs) */}
          {lienCasse && (
            <div className="rt-detour">
              <span className="rt-detour-label">🛟 Chemin de secours (plus long)</span>
              <div className="rt-detour-path">
                <span className="rt-mininode est-fait"><b>📡</b><i>{routeurs[1]?.ip}</i></span>
                {[0, 1].map((k) => (
                  <Fragment key={k}>
                    <span className="rt-fleche">→</span>
                    <span className={`rt-mininode ${detourNodes[k] ? 'est-fait' : ''}`}>
                      <b>{detourNodes[k] ? '📡' : '…'}</b>
                      <i>{detourNodes[k]?.ip || ''}</i>
                    </span>
                  </Fragment>
                ))}
                <span className="rt-fleche">→</span>
                <span className={`rt-mininode ${phase === 'resolu' ? 'est-arrivee' : ''}`}>
                  <b>🖥</b>
                  <i>{phase === 'resolu' ? quest.ip : ''}</i>
                </span>
              </div>
            </div>
          )}

          {/* Décision : routage normal */}
          {phase === 'jeu' && (
            <div className="rt-decision">
              <p className="rt-ou">
                📡 Tu es au routeur <strong>{graph[hop].from}</strong>. Quelle route prendre ensuite&nbsp;?
              </p>
              <RouteList candidates={graph[hop].candidates} onChoose={choisir} shakeIdx={shakeIdx} />
              <p className="rt-aide">
                <span className="rt-precision rt-precision--legende" aria-hidden="true"><i className="plein" /><i className="plein" /><i className="plein" /><i /></span>
                = précision de la route. Plus il y a de carrés pleins, plus la route est précise.
              </p>
            </div>
          )}

          {/* Décision : détour après la panne (même routage normal, autre chemin) */}
          {phase === 'panne' && (
            <div className="rt-decision">
              <p className="rt-panne-warn">💥 Routeur cassé ! Continue le routage par un autre chemin — étape {detourStep + 1}/2 :</p>
              <RouteList candidates={reroute[detourStep].candidates} onChoose={choisir} shakeIdx={shakeIdx} />
            </div>
          )}
        </div>

        {/* ── Le panneau ── */}
        <aside className="panneau">
          <MissionCard quest={quest} />

          <ExplainBox ton="info" titre="C'est quoi un routeur ?">
            Un routeur est une machine avec sa propre <strong>adresse IP</strong>. Le paquet saute de
            routeur en routeur : chacun choisit la route la <strong>plus précise</strong> vers la destination.
            <strong> Aucun routeur ne connaît tout le chemin.</strong>
          </ExplainBox>

          {phase === 'jeu' && !message && (
            <ExplainBox ton="info" titre={`Saut ${hop + 1} sur 3`}>
              Compare le début de l'adresse de destination avec chaque route, et clique sur la plus précise.
            </ExplainBox>
          )}
          {phase === 'panne' && (
            <ExplainBox ton="info" titre="Un autre chemin">
              Le routeur direct est cassé. Pas grave : on <strong>continue le routage normalement</strong>,
              juste par un autre chemin un peu plus long. Sur Internet, il y a <strong>toujours une autre route</strong>.
            </ExplainBox>
          )}
          {message && (
            <ExplainBox ton={message.ton} titre={message.titre}>{message.texte}</ExplainBox>
          )}

          {phase === 'resolu' && (
            <div className="rt-resultat">
              <p className="rt-resultat-titre">
                <PacketSprite size={26} color={quest.couleur} /> Arrivé à {quest.ville} {quest.drapeau} !
              </p>
              <p className="jeton-gagne"><span className="jeton-pastille jeton-ip">IP</span> Jeton IP gagné !</p>
              <p className="rt-recap">
                Le routeur direct était en panne, alors le paquet a pris un <strong>chemin plus long</strong>
                {' '}par d'autres routeurs, et il est arrivé quand même. C'est la force d'Internet :
                <strong> toujours un autre chemin.</strong>
              </p>
              <div className="prochaine-actions">
                <button className="btn-principal" onClick={() => dispatch({ type: 'SYNC', zone: 'serveur', tokens: state.tokens })}>
                  Continuer vers le Serveur →
                </button>
                <button className="btn-fantome" onClick={() => dispatch({ type: 'RESET' })}>
                  Rejouer une aventure
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
