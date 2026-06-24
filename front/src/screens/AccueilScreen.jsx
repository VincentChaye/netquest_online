import { useEffect, useState } from 'react';
import { getQuests, startGame } from '../api/client.js';
import { useGame } from '../game/GameContext.jsx';
import QuestPicker from '../components/QuestPicker.jsx';
import PacketSprite from '../components/PacketSprite.jsx';

export default function AccueilScreen() {
  const { dispatch } = useGame();
  const [quests, setQuests] = useState([]);
  const [statut, setStatut] = useState('chargement'); // 'chargement' | 'pret' | 'erreur'
  const [erreur, setErreur] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    getQuests()
      .then((data) => {
        setQuests(data);
        setStatut('pret');
      })
      .catch((e) => {
        setErreur(e.message);
        setStatut('erreur');
      });
  }, []);

  async function choisir(quest) {
    setBusyId(quest.id);
    try {
      const partie = await startGame(quest.id);
      dispatch({ type: 'START', quest: partie.quest, sessionId: partie.sessionId, zone: partie.zone, tokens: partie.tokens });
    } catch (e) {
      setErreur(e.message);
      setStatut('erreur');
      setBusyId(null);
    }
  }

  return (
    <main className="accueil">
      <header className="accueil-tete">
        <span className="marque">Net<span>Quest</span></span>
        <span className="marque-sous">Terra Numerica</span>
      </header>

      <section className="hero">
        <PacketSprite size={88} color="#29A8D9" className="hero-mascotte" />
        <h1 className="hero-titre">
          Deviens un <span className="surligne">paquet de données</span><br />et traverse Internet&nbsp;!
        </h1>
        <p className="hero-texte">
          Quand tu tapes l'adresse d'un site, ton ordinateur fabrique un petit paquet.
          Ce paquet, c'est <strong>toi</strong>. Choisis une aventure et fais-le voyager
          jusqu'au bon serveur, à l'autre bout du monde.
        </p>
      </section>

      <section className="accueil-choix">
        <h2 className="section-titre">Choisis ton aventure</h2>
        {statut === 'chargement' && <p className="info-ligne">Chargement des aventures…</p>}
        {statut === 'erreur' && (
          <p className="info-ligne info-erreur">
            {erreur} — vérifie que le serveur (back) est bien lancé.
          </p>
        )}
        {statut === 'pret' && <QuestPicker quests={quests} onPick={choisir} busyId={busyId} />}
      </section>
    </main>
  );
}
