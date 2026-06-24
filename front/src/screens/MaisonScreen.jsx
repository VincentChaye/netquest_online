import { useEffect, useRef, useState } from 'react';
import { sendAnswer } from '../api/client.js';
import { useGame } from '../game/GameContext.jsx';
import MaisonSVG from '../components/MaisonSVG.jsx';
import PacketSprite from '../components/PacketSprite.jsx';
import MissionCard from '../components/MissionCard.jsx';
import ExplainBox from '../components/ExplainBox.jsx';
import GameHeader from '../components/GameHeader.jsx';

export default function MaisonScreen() {
  const { state, dispatch } = useGame();
  const { quest, sessionId } = state;

  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState('intro'); // 'intro' | 'sending' | 'sent'
  const [feedback, setFeedback] = useState(null);
  const [explain, setExplain] = useState(null);
  const [shake, setShake] = useState(false);
  const [result, setResult] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function envoyer(e) {
    e.preventDefault();
    if (phase !== 'intro') return;
    const valeur = url.trim();
    if (!valeur) return;

    try {
      const res = await sendAnswer(sessionId, 'maison', valeur);
      if (res.correct) {
        setFeedback({ ton: 'succes', titre: 'Bravo, le paquet part !', texte: res.feedback });
        setPhase('sending');
        timer.current = window.setTimeout(() => {
          setPhase('sent');
          setExplain({ titre: 'Et maintenant ?', texte: res.explication });
          setResult(res);
        }, 2500);
      } else {
        setFeedback({ ton: 'oups', titre: 'Presque !', texte: res.feedback });
        setShake(true);
        window.setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      setFeedback({ ton: 'oups', titre: 'Oups', texte: err.message });
    }
  }

  function recommencer() {
    window.clearTimeout(timer.current);
    dispatch({ type: 'RESET' });
  }

  return (
    <main className="maison-ecran">
      <GameHeader />

      <div className="scene">
        {/* LA DIORAMA 2D */}
        <div className={`stage ${phase === 'sending' ? 'stage--sending' : ''} ${phase === 'sent' ? 'stage--sent' : ''}`}>
          <MaisonSVG accent={quest.couleur} url={url} perso={quest.emoji} sending={phase !== 'intro'} />
          <div className="packet-overlay">
            <PacketSprite size={46} color={quest.couleur} />
          </div>
          {phase === 'sent' && <div className="bulle-arrivee">Direction : le DNS 🌐</div>}
        </div>

        {/* LE PANNEAU DE JEU */}
        <aside className="panneau">
          <MissionCard quest={quest} />

          {phase !== 'sent' ? (
            <form className={`barre-adresse ${shake ? 'tremble' : ''}`} onSubmit={envoyer}>
              <label htmlFor="url" className="barre-label">
                Aide {quest.perso} : tape l'adresse du site, puis appuie sur Entrée.
              </label>
              <div className="barre-champ">
                <span className="barre-cadenas" aria-hidden="true">🔒</span>
                <input
                  id="url"
                  className="barre-input"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="ex : wikipedia.org"
                  autoComplete="off"
                  spellCheck="false"
                  disabled={phase === 'sending'}
                  autoFocus
                />
                <button className="barre-btn" type="submit" disabled={phase === 'sending' || !url.trim()}>
                  {phase === 'sending' ? 'Le paquet voyage…' : 'Entrée ↵'}
                </button>
              </div>
            </form>
          ) : (
            <div className="prochaine">
              <p className="prochaine-titre">🌐 Étape suivante : le DNS</p>
              <p className="prochaine-texte">
                Le paquet va demander à l'annuaire d'Internet l'adresse exacte de {quest.site}.
              </p>
              <div className="prochaine-actions">
                <button
                  className="btn-principal"
                  onClick={() => dispatch({ type: 'SYNC', zone: 'dns', tokens: result?.tokens || [] })}
                >
                  Continuer vers le DNS →
                </button>
                <button className="btn-fantome" onClick={recommencer}>Rejouer une aventure</button>
              </div>
            </div>
          )}

          {feedback && (
            <ExplainBox ton={feedback.ton} titre={feedback.titre}>{feedback.texte}</ExplainBox>
          )}
          {phase === 'intro' && !feedback && (
            <ExplainBox ton="info" titre="C'est quoi un paquet ?">
              Tu es un petit paquet de données. Pour partir en voyage, ton ordinateur a
              d'abord besoin de savoir <strong>quel site</strong> tu veux visiter.
            </ExplainBox>
          )}
          {explain && (
            <ExplainBox ton="info" titre={explain.titre}>{explain.texte}</ExplainBox>
          )}
        </aside>
      </div>
    </main>
  );
}
