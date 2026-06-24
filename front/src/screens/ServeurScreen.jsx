import { useState } from 'react';
import { sendAnswer } from '../api/client.js';
import { useGame } from '../game/GameContext.jsx';
import GameHeader from '../components/GameHeader.jsx';
import MissionCard from '../components/MissionCard.jsx';
import ExplainBox from '../components/ExplainBox.jsx';
import PacketSprite from '../components/PacketSprite.jsx';

// ── TCP ──────────────────────────────────────────────────────────────────────
const MSGS = {
  syn:     { label: 'SYN',     de: 'client',  dit: 'Tu es là ?' },
  syn_ack: { label: 'SYN-ACK', de: 'serveur', dit: 'Oui, et toi ?' },
  ack:     { label: 'ACK',     de: 'client',  dit: 'Oui ! On est connectés.' },
};
const ORDRE_TCP   = ['syn', 'syn_ack', 'ack'];
const AFFICHE_TCP = ['syn_ack', 'ack', 'syn'];

// ── SMTP ─────────────────────────────────────────────────────────────────────
const SMTP_CMDS = [
  { key: 'helo',      label: 'HELO client.fr',              repCode: '250', rep: 'Bonjour client.fr !' },
  { key: 'mail_from', label: 'MAIL FROM:<lucas@gmail.com>',  repCode: '250', rep: 'Expéditeur accepté' },
  { key: 'rcpt_to',   label: 'RCPT TO:<patron@boulot.fr>',  repCode: '250', rep: 'Destinataire accepté' },
  { key: 'data',      label: 'DATA + message + "."',         repCode: '250', rep: 'Message accepté ✓' },
  { key: 'quit',      label: 'QUIT',                         repCode: '221', rep: 'Au revoir !' },
];
const ORDRE_SMTP   = ['helo', 'mail_from', 'rcpt_to', 'data', 'quit'];
const AFFICHE_SMTP = ['rcpt_to', 'helo', 'quit', 'data', 'mail_from'];

// ── UDP ──────────────────────────────────────────────────────────────────────
const UDP_PERDUS = new Set([2, 7]);
const UDP_TOTAL  = 10;
const UDP_QUIZ = [
  { key: 'fiable',         label: 'UDP est plus fiable : il garantit chaque paquet' },
  { key: 'sans_connexion', label: 'UDP est plus rapide : pas de connexion ni de renvoi si perdu ✓' },
  { key: 'chiffrement',    label: 'UDP chiffre les données automatiquement' },
  { key: 'ordre',          label: 'UDP garantit que les paquets arrivent dans le bon ordre' },
];

const wait = (ms) => new Promise((r) => window.setTimeout(r, ms));

export default function ServeurScreen() {
  const { state, dispatch } = useGame();
  const { quest, sessionId } = state;
  const flow = quest?.serverFlow ?? 'tcp-http';

  const [phase, setPhase] = useState(() =>
    flow === 'udp' ? 'udp' : flow === 'smtp' ? 'smtp' : 'tcp'
  );

  // ── État TCP/HTTP ─────────────────────────────────────────────────────────
  const [tcpOrder, setTcpOrder] = useState([]);
  const [httpLog,  setHttpLog]  = useState([]);
  const [vol,      setVol]      = useState(null);

  // ── État SMTP ─────────────────────────────────────────────────────────────
  const [smtpOrder,    setSmtpOrder]    = useState([]);
  const [smtpDialogue, setSmtpDialogue] = useState([
    { de: 'serveur', code: '220', txt: 'smtp.gmail.com prêt à recevoir' },
  ]);

  // ── État UDP ──────────────────────────────────────────────────────────────
  const [udpPaquets,  setUdpPaquets]  = useState([]);
  const [udpProgress, setUdpProgress] = useState(0);
  const [udpStreamed,  setUdpStreamed]  = useState(false);
  const [udpQuizDone, setUdpQuizDone] = useState(false);

  // ── Partagé ───────────────────────────────────────────────────────────────
  const [message,  setMessage]  = useState(null);
  const [shakeKey, setShakeKey] = useState(null);
  const occupe = !!vol;

  const etat =
    phase === 'tcp' && tcpOrder.length === 0
      ? { cls: 'fermee',  txt: '🔌 Connexion fermée' }
      : phase === 'tcp'
        ? { cls: 'encours', txt: '🤝 Connexion en cours…' }
        : { cls: 'etablie', txt: '✓ Connexion établie' };

  // ─────────────────────────────── TCP ─────────────────────────────────────
  async function jouer(key) {
    if (phase !== 'tcp' || occupe) return;
    const attendu = ORDRE_TCP[tcpOrder.length];
    if (key !== attendu) {
      setMessage({ ton: 'oups', titre: 'Pas encore', texte: 'On commence toujours par SYN.' });
      setShakeKey(key);
      window.setTimeout(() => setShakeKey(null), 500);
      return;
    }
    setMessage(null);
    setVol({ dir: MSGS[key].de === 'client' ? 'aller' : 'retour', label: MSGS[key].label });
    await wait(720);
    setVol(null);
    const nouveaux = [...tcpOrder, key];
    setTcpOrder(nouveaux);
    if (nouveaux.length === ORDRE_TCP.length) {
      try {
        const res = await sendAnswer(sessionId, 'serveur', { phase: 'tcp', ordre: nouveaux });
        if (res.correct) {
          setPhase('http');
          setMessage({ ton: 'succes', titre: 'Connexion établie !', texte: res.feedback });
          dispatch({ type: 'SYNC', zone: 'serveur', tokens: res.tokens });
        }
      } catch (e) {
        setMessage({ ton: 'oups', titre: 'Oups', texte: e.message });
      }
    }
  }

  // ─────────────────────────────── HTTP ────────────────────────────────────
  async function envoyerHttp(methode) {
    if (phase !== 'http' || occupe) return;
    setMessage(null);
    setHttpLog((log) => [...log, { de: 'client', label: methode, txt: quest.chemin }]);
    setVol({ dir: 'aller', label: methode, kind: 'http' });
    await wait(680);
    setVol(null);
    let res;
    try {
      res = await sendAnswer(sessionId, 'serveur', { phase: 'http', methode });
    } catch (e) {
      setMessage({ ton: 'oups', titre: 'Oups', texte: e.message });
      return;
    }
    setVol({ dir: 'retour', label: res.code || '200', kind: 'http', ton: res.correct ? 'ok' : 'err' });
    await wait(680);
    setVol(null);
    setHttpLog((log) => [
      ...log,
      { de: 'serveur', label: res.code || '200', txt: res.correct ? `${quest.siteEmoji} page envoyée` : 'refusé', ok: res.correct },
    ]);
    if (res.correct) {
      setPhase('fini');
      setMessage({ ton: 'succes', titre: '200 OK', texte: res.feedback });
      dispatch({ type: 'SYNC', zone: 'serveur', tokens: res.tokens });
    } else {
      setMessage({ ton: 'oups', titre: res.code || 'Erreur', texte: res.feedback });
    }
  }

  // ─────────────────────────────── SMTP ────────────────────────────────────
  async function jouerSMTP(key) {
    const attendu = ORDRE_SMTP[smtpOrder.length];
    if (key !== attendu) {
      const attenduCmd = SMTP_CMDS.find((c) => c.key === attendu);
      setMessage({ ton: 'oups', titre: 'Pas encore !', texte: `La prochaine commande est : ${attenduCmd.label}` });
      setShakeKey(key);
      window.setTimeout(() => setShakeKey(null), 500);
      return;
    }
    setMessage(null);
    const cmd = SMTP_CMDS.find((c) => c.key === key);
    setSmtpDialogue((prev) => [
      ...prev,
      { de: 'client',  code: '→',        txt: cmd.label },
      { de: 'serveur', code: cmd.repCode, txt: cmd.rep   },
    ]);
    const nouveaux = [...smtpOrder, key];
    setSmtpOrder(nouveaux);
    if (nouveaux.length === ORDRE_SMTP.length) {
      try {
        const res = await sendAnswer(sessionId, 'serveur', { phase: 'smtp', ordre: nouveaux });
        if (res.correct) {
          setPhase('fini');
          setMessage({ ton: 'succes', titre: 'E-mail envoyé !', texte: res.feedback });
          dispatch({ type: 'SYNC', zone: 'serveur', tokens: res.tokens });
        }
      } catch (e) {
        setMessage({ ton: 'oups', titre: 'Oups', texte: e.message });
      }
    }
  }

  // ─────────────────────────────── UDP ─────────────────────────────────────
  function lancerFluxUDP() {
    for (let i = 0; i < UDP_TOTAL; i++) {
      window.setTimeout(() => {
        setUdpPaquets((prev) => [...prev, { id: i, perdu: UDP_PERDUS.has(i) }]);
        setUdpProgress(Math.round(((i + 1) / UDP_TOTAL) * 100));
        if (i === UDP_TOTAL - 1) setUdpStreamed(true);
      }, i * 220 + 80);
    }
  }

  async function repondreUDP(key) {
    if (udpQuizDone) return;
    setUdpQuizDone(true);
    try {
      const res = await sendAnswer(sessionId, 'serveur', { phase: 'udp', reponse: key });
      if (res.correct) {
        setPhase('fini');
        setMessage({ ton: 'succes', titre: 'UDP compris !', texte: res.feedback });
        dispatch({ type: 'SYNC', zone: 'serveur', tokens: res.tokens });
      } else {
        setUdpQuizDone(false);
        setMessage({ ton: 'oups', titre: 'Pas tout à fait', texte: res.feedback });
      }
    } catch (e) {
      setUdpQuizDone(false);
      setMessage({ ton: 'oups', titre: 'Oups', texte: e.message });
    }
  }

  // ─────────────────────────────── RENDER ──────────────────────────────────
  return (
    <main className="jeu-ecran">
      <GameHeader />
      <div className="scene">
        <div className="stage stage--serveur">

          {/* ══ TCP / HTTP ══════════════════════════════════════════════════ */}
          {flow === 'tcp-http' && (
            <>
              <p className="srv-titre">🖥 Le Serveur — on se connecte, puis on demande la page</p>

              <div className="srv-rail">
                <div className="srv-bout srv-bout--client">
                  <span className="srv-bout-ico" style={{ borderColor: quest.couleur }}>📦</span>
                  <span>Toi</span>
                </div>
                <div className={`srv-track ${etat.cls === 'etablie' ? 'est-etablie' : ''}`}>
                  <span className={`srv-etat ${etat.cls}`}>{etat.txt}</span>
                  {vol && (
                    <span className={`srv-vol vol-${vol.dir} ${vol.kind === 'http' ? 'est-http' : ''} ${vol.ton || ''}`}>
                      <i className="srv-vol-tag">{vol.label}</i>
                      <PacketSprite size={26} color={quest.couleur} />
                    </span>
                  )}
                </div>
                <div className="srv-bout srv-bout--serveur">
                  <span className="srv-bout-ico">🖥</span>
                  <span>{quest.ville}</span>
                </div>
              </div>

              {phase === 'tcp' && (
                <div className="srv-steps" aria-hidden="true">
                  {ORDRE_TCP.map((k, i) => (
                    <span key={k} className={`srv-step ${i < tcpOrder.length ? 'ok' : ''} ${i === tcpOrder.length ? 'now' : ''}`}>
                      {i + 1}. {MSGS[k].label}
                    </span>
                  ))}
                </div>
              )}

              <ul className="srv-dialogue">
                {tcpOrder.map((k) => (
                  <li key={k} className={`srv-bulle de-${MSGS[k].de}`}>
                    <b>{MSGS[k].label}</b> {MSGS[k].dit}
                  </li>
                ))}
                {httpLog.map((l, i) => (
                  <li key={`h${i}`} className={`srv-bulle de-${l.de} srv-http ${l.ok ? 'srv-ok' : ''}`}>
                    <b>{l.label}</b> {l.txt}
                  </li>
                ))}
              </ul>

              {phase === 'fini' && (
                <div className="srv-page" style={{ '--c': quest.couleur }}>
                  <div className="srv-page-bar">
                    <span className="srv-page-dots"><i /><i /><i /></span>
                    <span className="srv-page-url">🔒 {quest.site}{quest.chemin}</span>
                  </div>
                  <div className="srv-page-body">
                    <span className="srv-page-emoji">{quest.siteEmoji}</span>
                    <strong className="srv-page-site">{quest.site}</strong>
                    <span className="srv-page-cap">La page de {quest.perso} est arrivée ! ✨</span>
                  </div>
                </div>
              )}

              {phase === 'tcp' && (
                <div className="srv-actions">
                  <p className="srv-consigne">Étape 1 — la connexion. Envoie les 3 messages dans le bon ordre :</p>
                  <div className="srv-cartes">
                    {AFFICHE_TCP.map((k) => {
                      const joue = tcpOrder.includes(k);
                      return (
                        <button
                          key={k}
                          className={`srv-carte de-${MSGS[k].de} ${joue ? 'est-joue' : ''} ${shakeKey === k ? 'tremble' : ''}`}
                          disabled={joue || occupe}
                          onClick={() => jouer(k)}
                        >
                          <b>{MSGS[k].label}</b>
                          <span>{MSGS[k].de === 'client' ? 'tu envoies →' : '← serveur répond'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {phase === 'http' && (
                <div className="srv-actions">
                  <p className="srv-consigne">Étape 2 — la demande. Pour <strong>lire</strong> la page, quelle méthode ?</p>
                  <div className="srv-cartes">
                    {[{ m: 'GET', sous: 'lire' }, { m: 'POST', sous: 'envoyer' }, { m: 'DELETE', sous: 'supprimer' }].map(({ m, sous }) => (
                      <button key={m} className="srv-carte srv-methode" disabled={occupe} onClick={() => envoyerHttp(m)}>
                        <b>{m}</b>
                        <span>{sous}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {phase === 'fini' && (
                <div className="srv-actions">
                  <button className="btn-principal" onClick={() => dispatch({ type: 'SYNC', zone: 'fin', tokens: state.tokens })}>
                    Voir la victoire 🏆
                  </button>
                </div>
              )}
            </>
          )}

          {/* ══ UDP ═════════════════════════════════════════════════════════ */}
          {flow === 'udp' && (
            <>
              <p className="srv-titre">📺 Serveur YouTube Tokyo — diffusion UDP</p>

              <div className="udp-flux">
                <div className="srv-bout">
                  <span className="srv-bout-ico">📺</span>
                  <span>YouTube Tokyo</span>
                </div>
                <div className="udp-tuyau">
                  {udpPaquets.length === 0 && (
                    <span className="udp-attente">En attente du flux…</span>
                  )}
                  {udpPaquets.map((p) => (
                    <div key={p.id} className={`udp-paquet ${p.perdu ? 'udp-perdu' : ''}`}>
                      <span className="udp-tag">{p.perdu ? 'LOST' : 'UDP'}</span>
                      <span className="udp-ligne" />
                      <span className="udp-note">{p.perdu ? 'perdu ✗' : `datagramme ${p.id + 1} ✓`}</span>
                    </div>
                  ))}
                </div>
                <div className="srv-bout">
                  <span className="srv-bout-ico" style={{ borderColor: quest.couleur }}>👵</span>
                  <span>Mamie Suzanne</span>
                </div>
              </div>

              <div className="udp-progress-wrap">
                <span className="udp-progress-label">Lecture vidéo</span>
                <div className="udp-progress-bar">
                  <div className="udp-progress-fill" style={{ width: `${udpProgress}%` }} />
                </div>
                <span className="udp-progress-pct">{udpProgress}%</span>
              </div>

              {phase === 'udp' && !udpStreamed && (
                <div className="srv-actions">
                  <button className="btn-principal" disabled={udpPaquets.length > 0} onClick={lancerFluxUDP}>
                    ▶ Lancer le flux vidéo
                  </button>
                </div>
              )}

              {udpStreamed && phase === 'udp' && (
                <div className="srv-actions">
                  <p className="srv-consigne">Pourquoi le streaming vidéo utilise UDP et non TCP ?</p>
                  <div className="srv-cartes udp-quiz-cartes">
                    {UDP_QUIZ.map(({ key, label }) => (
                      <button
                        key={key}
                        className="srv-carte"
                        disabled={udpQuizDone}
                        onClick={() => repondreUDP(key)}
                      >
                        <b className="udp-quiz-label">{label}</b>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {phase === 'fini' && (
                <>
                  <div className="srv-page" style={{ '--c': quest.couleur }}>
                    <div className="srv-page-body">
                      <span className="srv-page-emoji">🎹</span>
                      <strong className="srv-page-site">youtube.com</strong>
                      <span className="srv-page-cap">Mamie Suzanne regarde la vidéo du chat ! ✨</span>
                    </div>
                  </div>
                  <div className="srv-actions">
                    <button className="btn-principal" onClick={() => dispatch({ type: 'SYNC', zone: 'fin', tokens: state.tokens })}>
                      Voir la victoire 🏆
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ══ SMTP ════════════════════════════════════════════════════════ */}
          {flow === 'smtp' && (
            <>
              <p className="srv-titre">📮 Serveur Gmail — envoi d'e-mail via SMTP</p>

              <ul className="srv-dialogue smtp-dialogue">
                {smtpDialogue.map((l, i) => (
                  <li key={i} className={`srv-bulle smtp-bulle de-${l.de}`}>
                    <b className="smtp-code">{l.code}</b>
                    <span>{l.txt}</span>
                  </li>
                ))}
              </ul>

              {phase === 'smtp' && (
                <div className="srv-actions">
                  <p className="srv-consigne">
                    Envoie les commandes SMTP dans le bon ordre pour expédier l'e-mail de Lucas :
                  </p>
                  <div className="srv-cartes smtp-cartes">
                    {AFFICHE_SMTP.map((key) => {
                      const cmd  = SMTP_CMDS.find((c) => c.key === key);
                      const joue = smtpOrder.includes(key);
                      return (
                        <button
                          key={key}
                          className={`srv-carte smtp-cmd ${joue ? 'est-joue' : ''} ${shakeKey === key ? 'tremble' : ''}`}
                          disabled={joue}
                          onClick={() => jouerSMTP(key)}
                        >
                          <b>{cmd.label}</b>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {phase === 'fini' && (
                <>
                  <div className="srv-page" style={{ '--c': quest.couleur }}>
                    <div className="srv-page-body">
                      <span className="srv-page-emoji">📧</span>
                      <strong className="srv-page-site">E-mail livré !</strong>
                      <span className="srv-page-cap">Lucas a prévenu son patron. SMTP a tout géré. ✨</span>
                    </div>
                  </div>
                  <div className="srv-actions">
                    <button className="btn-principal" onClick={() => dispatch({ type: 'SYNC', zone: 'fin', tokens: state.tokens })}>
                      Voir la victoire 🏆
                    </button>
                  </div>
                </>
              )}
            </>
          )}

        </div>

        {/* ── Panneau ─────────────────────────────────────────────────────── */}
        <aside className="panneau">
          <MissionCard quest={quest} />

          {flow === 'tcp-http' && phase === 'tcp' && (
            <ExplainBox ton="info" titre="TCP : la poignée de main">
              Comme au téléphone : tu sonnes (<strong>SYN</strong>), il décroche (<strong>SYN-ACK</strong>),
              tu dis « allô » (<strong>ACK</strong>).
            </ExplainBox>
          )}
          {flow === 'tcp-http' && phase === 'http' && (
            <ExplainBox ton="info" titre="HTTP : la demande">
              C'est ouvert ! On demande la page. <strong>GET</strong> = lire,
              <strong> POST</strong> = envoyer, <strong>DELETE</strong> = supprimer.
            </ExplainBox>
          )}
          {flow === 'tcp-http' && phase === 'fini' && (
            <ExplainBox ton="succes" titre="La page est arrivée !">
              Code <strong>200</strong> : tout va bien, le serveur a envoyé la page.
              Jetons <strong>TCP</strong> et <strong>HTTP</strong> gagnés !
            </ExplainBox>
          )}

          {flow === 'udp' && phase !== 'fini' && (
            <ExplainBox ton="info" titre="UDP : sans connexion">
              UDP envoie les datagrammes <strong>sans établir de connexion</strong>.
              Pas de poignée de main, pas de renvoi si un paquet se perd.
              La vidéo ne s'arrête jamais, même si quelques images disparaissent.
            </ExplainBox>
          )}
          {flow === 'udp' && phase === 'fini' && (
            <ExplainBox ton="succes" titre="Vidéo reçue !">
              {UDP_PERDUS.size} datagrammes perdus, mais Mamie Suzanne n'a rien remarqué.
              Jeton <strong>UDP</strong> gagné !
            </ExplainBox>
          )}

          {flow === 'smtp' && phase === 'smtp' && (
            <ExplainBox ton="info" titre="SMTP : le dialogue de l'e-mail">
              SMTP suit toujours le même ordre :<br />
              <strong>HELO</strong> → je me présente<br />
              <strong>MAIL FROM</strong> → l'expéditeur<br />
              <strong>RCPT TO</strong> → le destinataire<br />
              <strong>DATA</strong> → le contenu du message<br />
              <strong>QUIT</strong> → au revoir !
            </ExplainBox>
          )}
          {flow === 'smtp' && phase === 'fini' && (
            <ExplainBox ton="succes" titre="E-mail remis !">
              Chaque commande a reçu un code <strong>250</strong> (OK) et la session
              s'est terminée par <strong>221</strong>.
              Jeton <strong>SMTP</strong> gagné !
            </ExplainBox>
          )}

          {message && (
            <ExplainBox ton={message.ton} titre={message.titre}>{message.texte}</ExplainBox>
          )}
        </aside>
      </div>
    </main>
  );
}
