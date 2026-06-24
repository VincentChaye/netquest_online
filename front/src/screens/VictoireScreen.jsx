import { useGame } from '../game/GameContext.jsx';
import PacketSprite from '../components/PacketSprite.jsx';

const JETONS_TCP_HTTP = [
  { key: 'dns',  label: 'DNS',  sous: "Trouver l’adresse", color: 'var(--dns)'  },
  { key: 'ip',   label: 'IP',   sous: 'Voyager',                 color: 'var(--ip)'   },
  { key: 'tcp',  label: 'TCP',  sous: 'Se connecter',            color: 'var(--tcp)'  },
  { key: 'http', label: 'HTTP', sous: 'Demander la page',        color: 'var(--http)' },
];
const JETONS_UDP = [
  { key: 'dns', label: 'DNS', sous: "Trouver l’adresse",  color: 'var(--dns)' },
  { key: 'ip',  label: 'IP',  sous: 'Voyager',                  color: 'var(--ip)'  },
  { key: 'udp', label: 'UDP', sous: 'Streamer sans pause',      color: 'var(--tcp)' },
];
const JETONS_SMTP = [
  { key: 'dns',  label: 'DNS',  sous: "Trouver l’adresse", color: 'var(--dns)'  },
  { key: 'ip',   label: 'IP',   sous: 'Voyager',                 color: 'var(--ip)'   },
  { key: 'smtp', label: 'SMTP', sous: "Envoyer l’e-mail",  color: 'var(--http)' },
];

function RecapTCP() {
  return (
    <>
      Tu as compris comment marche Internet : le <strong>DNS</strong> trouve l'adresse, le{' '}
      <strong>routage IP</strong> fait voyager le paquet de routeur en routeur,{' '}
      <strong>TCP</strong> ouvre la connexion, et <strong>HTTP</strong> demande la page. Bravo ! 👏
    </>
  );
}
function RecapUDP() {
  return (
    <>
      Tu as compris le streaming : le <strong>DNS</strong> trouve l'adresse, le{' '}
      <strong>routage IP</strong> achemine les paquets, et <strong>UDP</strong> envoie les
      datagrammes en rafale — pas de connexion, pas de renvoi, la vidéo coule à flots ! 🎬
    </>
  );
}
function RecapSMTP() {
  return (
    <>
      Tu as compris l'e-mail : le <strong>DNS</strong> trouve l'adresse, le{' '}
      <strong>routage IP</strong> achemine les paquets, et <strong>SMTP</strong> dialogue
      commande par commande avec le serveur pour livrer l'e-mail. 📧
    </>
  );
}

function sousTitre(flow, quest) {
  if (flow === 'udp') {
    return `Le paquet de ${quest.perso} a filé jusqu'à ${quest.ville} ${quest.drapeau} en UDP — rapide, sans cérémonie ! 🎬`;
  }
  if (flow === 'smtp') {
    return `L'e-mail de ${quest.perso} est arrivé à ${quest.ville} ${quest.drapeau} grâce à SMTP. 📧`;
  }
  return `Le paquet de ${quest.perso} a traversé tout Internet jusqu'à ${quest.ville} ${quest.drapeau} et est revenu avec la page. 🎉`;
}

export default function VictoireScreen() {
  const { state, dispatch } = useGame();
  const { quest } = state;
  const flow  = quest?.serverFlow ?? 'tcp-http';
  const JETONS = flow === 'udp' ? JETONS_UDP : flow === 'smtp' ? JETONS_SMTP : JETONS_TCP_HTTP;

  return (
    <main className="victoire">
      <span className="victoire-trophee" aria-hidden="true">🏆</span>
      <h1 className="victoire-titre">Mission accomplie !</h1>
      <p className="victoire-sous">{sousTitre(flow, quest)}</p>

      <div className="victoire-packet"><PacketSprite size={72} color={quest.couleur} /></div>

      <p className="victoire-histoire">« {quest.victoire} »</p>

      <div className="victoire-jetons">
        {JETONS.map((j) => (
          <div className="vj" key={j.key} style={{ '--c': j.color }}>
            <span className="vj-pastille">{j.label}</span>
            <span className="vj-sous">{j.sous}</span>
          </div>
        ))}
      </div>

      <p className="victoire-recap">
        {flow === 'udp'  && <RecapUDP  />}
        {flow === 'smtp' && <RecapSMTP />}
        {flow !== 'udp' && flow !== 'smtp' && <RecapTCP />}
      </p>

      <button className="btn-principal" onClick={() => dispatch({ type: 'RESET' })}>
        Rejouer une autre aventure
      </button>
    </main>
  );
}
