import { useGame } from '../game/GameContext.jsx';

const ETAPES_TCP_HTTP = [
  { key: 'dns',  zone: 'dns',     label: 'DNS',  sous: 'Trouver',   color: 'var(--dns)'  },
  { key: 'ip',   zone: 'routeur', label: 'IP',   sous: 'Voyager',   color: 'var(--ip)'   },
  { key: 'tcp',  zone: 'serveur', label: 'TCP',  sous: 'Connecter', color: 'var(--tcp)'  },
  { key: 'http', zone: 'serveur', label: 'HTTP', sous: 'Demander',  color: 'var(--http)' },
];
const ETAPES_UDP = [
  { key: 'dns', zone: 'dns',     label: 'DNS', sous: 'Trouver',  color: 'var(--dns)' },
  { key: 'ip',  zone: 'routeur', label: 'IP',  sous: 'Voyager',  color: 'var(--ip)'  },
  { key: 'udp', zone: 'serveur', label: 'UDP', sous: 'Streamer', color: 'var(--tcp)' },
];
const ETAPES_SMTP = [
  { key: 'dns',  zone: 'dns',     label: 'DNS',  sous: 'Trouver', color: 'var(--dns)'  },
  { key: 'ip',   zone: 'routeur', label: 'IP',   sous: 'Voyager', color: 'var(--ip)'   },
  { key: 'smtp', zone: 'serveur', label: 'SMTP', sous: 'Envoyer', color: 'var(--http)' },
];

export default function TokenBar({ tokens = [], zone = 'maison' }) {
  const { state } = useGame();
  const flow = state?.quest?.serverFlow ?? 'tcp-http';
  const ETAPES =
    flow === 'udp'  ? ETAPES_UDP  :
    flow === 'smtp' ? ETAPES_SMTP :
    ETAPES_TCP_HTTP;

  return (
    <ol className="parcours" aria-label="Les étapes du voyage du paquet">
      <li className={`parcours-etape ${zone === 'maison' ? 'est-ici' : 'est-faite'}`}>
        <span className="parcours-pastille" style={{ '--c': '#ffce6a' }}>🏠</span>
        <span className="parcours-txt">Maison</span>
      </li>
      {ETAPES.map((e) => {
        const fait = tokens.includes(e.key);
        const ici  = zone === e.zone && !fait;
        return (
          <li key={e.key} className={`parcours-etape ${fait ? 'est-faite' : ''} ${ici ? 'est-ici' : ''}`}>
            <span className="parcours-pastille" style={{ '--c': e.color }}>
              {fait ? '✓' : e.label}
            </span>
            <span className="parcours-txt">{e.sous}</span>
          </li>
        );
      })}
      <li className="parcours-etape">
        <span className="parcours-pastille" style={{ '--c': '#ffce6a' }}>🏆</span>
        <span className="parcours-txt">Arrivé !</span>
      </li>
    </ol>
  );
}
