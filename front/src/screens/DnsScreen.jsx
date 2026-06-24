import { useState } from 'react';
import { sendAnswer } from '../api/client.js';
import { useGame } from '../game/GameContext.jsx';
import GameHeader from '../components/GameHeader.jsx';
import MissionCard from '../components/MissionCard.jsx';
import ExplainBox from '../components/ExplainBox.jsx';
import PacketSprite from '../components/PacketSprite.jsx';

const ORDRE = ['racine', 'tld', 'autoritaire'];

export default function DnsScreen() {
  const { state, dispatch } = useGame();
  const { quest, sessionId } = state;

  const tld = '.' + quest.site.split('.').pop();
  const domaine = quest.site;

  const serveurs = [
    {
      key: 'racine',
      niveau: 'Niveau 1 · le plus général',
      sigle: '.',
      nom: 'Serveur Racine',
      role: "Le tout premier annuaire d'Internet",
      dit: `Je ne connais pas ${domaine}… mais je sais qui s'occupe du « ${tld} ». Va lui demander !`,
    },
    {
      key: 'tld',
      niveau: `Niveau 2 · les sites en ${tld}`,
      sigle: tld,
      nom: `Serveur ${tld}`,
      role: `Le responsable de tous les sites en ${tld}`,
      dit: `${domaine} ? Je connais son serveur ! Va voir le serveur autoritaire, il a l'adresse exacte.`,
    },
    {
      key: 'autoritaire',
      niveau: 'Niveau 3 · le plus précis',
      sigle: quest.siteEmoji,
      nom: `Serveur de ${domaine}`,
      role: `Il connaît ${domaine} par cœur`,
      dit: `Bien sûr ! ${domaine}, c'est l'adresse IP ${quest.ip}. La voilà ! 🎉`,
    },
  ];

  const consignes = [
    'Clique sur le Serveur Racine pour commencer ta recherche.',
    `Bravo ! Maintenant, demande au Serveur ${tld}.`,
    `Presque ! Demande au serveur de ${domaine} pour obtenir l'adresse.`,
  ];

  const [faits, setFaits] = useState([]); // serveurs consultés, dans l'ordre
  const [phase, setPhase] = useState('jeu'); // 'jeu' | 'resolu'
  const [message, setMessage] = useState(null);
  const [shakeKey, setShakeKey] = useState(null);

  const etape = faits.length; // index du prochain serveur attendu

  async function consulter(key) {
    if (phase !== 'jeu' || faits.includes(key)) return;
    const attendu = ORDRE[etape];

    if (key !== attendu) {
      const nomAttendu = serveurs.find((s) => s.key === attendu).nom;
      setMessage({
        ton: 'oups',
        titre: 'Pas encore !',
        texte: `Tu dois d'abord demander au « ${nomAttendu} ». Le DNS va toujours du plus général au plus précis.`,
      });
      setShakeKey(key);
      window.setTimeout(() => setShakeKey(null), 500);
      return;
    }

    const nouveaux = [...faits, key];
    setFaits(nouveaux);
    setMessage(null);

    if (nouveaux.length === ORDRE.length) {
      try {
        const res = await sendAnswer(sessionId, 'dns', nouveaux);
        if (res.correct) {
          setPhase('resolu');
          dispatch({ type: 'SYNC', zone: 'dns', tokens: res.tokens });
        }
      } catch (e) {
        setMessage({ ton: 'oups', titre: 'Oups', texte: e.message });
      }
    }
  }

  return (
    <main className="jeu-ecran">
      <GameHeader />

      <div className="scene">
        {/* ── L'annuaire DNS ── */}
        <div className="stage stage--dns">
          <p className="dns-titre">🌐 L'annuaire d'Internet — le DNS</p>

          <ol className="dns-liste">
            {serveurs.map((s, i) => {
              const fait = i < etape || (phase === 'resolu' && i === ORDRE.length - 1);
              const actif = i === etape && phase === 'jeu';
              const verrou = i > etape && phase === 'jeu';
              const cls = `dns-serveur ${actif ? 'est-actif' : ''} ${fait ? 'est-fait' : ''} ${verrou ? 'est-verrou' : ''} ${shakeKey === s.key ? 'tremble' : ''}`;
              return (
                <li key={s.key}>
                  <button className={cls} onClick={() => consulter(s.key)}>
                    <span className="dns-sigle" aria-hidden="true">{fait ? '✓' : verrou ? '🔒' : s.sigle}</span>
                    <span className="dns-infos">
                      <span className="dns-niveau">{s.niveau}</span>
                      <span className="dns-nom">{s.nom}</span>
                      <span className="dns-role">{s.role}</span>
                    </span>
                    {actif && (
                      <span className="dns-ici">
                        <PacketSprite size={30} color={quest.couleur} />
                        <span>à toi !</span>
                      </span>
                    )}
                  </button>
                  {fait && <span className="dns-bulle">{s.dit}</span>}
                  {i < serveurs.length - 1 && (
                    <span className={`dns-fleche ${i < etape ? 'est-active' : ''}`}>↓ délègue à…</span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* ── Le panneau ── */}
        <aside className="panneau">
          <MissionCard quest={quest} />

          <ExplainBox ton="info" titre="C'est quoi le DNS ?">
            Internet ne comprend que des <strong>adresses IP</strong> (des chiffres). Le DNS est
            l'annuaire qui traduit le nom <strong>{domaine}</strong> en adresse IP. Il a 3 niveaux :
            on demande du plus général au plus précis.
          </ExplainBox>

          {phase === 'jeu' && !message && (
            <ExplainBox ton="info" titre={`Étape ${etape + 1} sur 3`}>{consignes[etape]}</ExplainBox>
          )}
          {message && (
            <ExplainBox ton={message.ton} titre={message.titre}>{message.texte}</ExplainBox>
          )}

          {phase === 'resolu' && (
            <div className="dns-resultat">
              <p className="dns-resultat-titre">✅ Adresse trouvée !</p>
              <p className="dns-ip">{domaine} → <strong>{quest.ip}</strong></p>
              <p className="jeton-gagne"><span className="jeton-pastille">DNS</span> Jeton DNS gagné !</p>
              <p className="dns-recap">
                Chaque niveau t'a renvoyé au suivant : <strong>personne ne connaît tout</strong>,
                le DNS délègue. C'est pour ça qu'il est si solide.
              </p>
              <div className="prochaine-actions">
                <button
                  className="btn-principal"
                  onClick={() => dispatch({ type: 'SYNC', zone: 'routeur', tokens: state.tokens })}
                >
                  Continuer vers le Routeur →
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
