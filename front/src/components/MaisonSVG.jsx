// La diorama : une maison en coupe (vue « maison de poupée »), éclairée,
// face au vaste Internet sombre et étoilé. Le toit prend la couleur de la quête.
export default function MaisonSVG({ accent = '#29A8D9', url = '', perso = '👧', sending = false }) {
  const ecran = url ? url : '|';
  return (
    <svg
      className="diorama"
      viewBox="0 0 1000 640"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Une maison en coupe avec un ordinateur, une box, et un câble qui part vers le nuage Internet"
    >
      <defs>
        <radialGradient id="lampe" cx="50%" cy="32%" r="60%">
          <stop offset="0" stopColor="#ffe6a8" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#ffd27d" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffd27d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mur" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f3e6c6" />
          <stop offset="1" stopColor="#e3d2a8" />
        </linearGradient>
        <linearGradient id="sol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c79a63" />
          <stop offset="1" stopColor="#a97c47" />
        </linearGradient>
      </defs>

      {/* ── INTERNET : le nuage et quelques machines lointaines ── */}
      <g className="internet" opacity="0.96">
        <line x1="492" y1="506" x2="700" y2="250" stroke={accent} strokeWidth="3" strokeDasharray="5 9" opacity="0.28" />
        <g opacity="0.5" stroke="#39477f" strokeWidth="2">
          <line x1="800" y1="150" x2="900" y2="90" />
          <line x1="800" y1="150" x2="910" y2="220" />
          <line x1="800" y1="150" x2="720" y2="92" />
        </g>
        <g fill="#26305c">
          <circle cx="908" cy="86" r="7" />
          <circle cx="918" cy="224" r="7" />
          <circle cx="714" cy="86" r="7" />
        </g>
        {/* nuage */}
        <g className="nuage">
          <circle cx="760" cy="180" r="46" fill="#222c54" />
          <circle cx="812" cy="160" r="56" fill="#283264" />
          <circle cx="864" cy="188" r="42" fill="#222c54" />
          <rect x="744" y="180" width="140" height="44" rx="22" fill="#283264" />
          <text x="812" y="208" textAnchor="middle" className="nuage-label">Internet</text>
        </g>
      </g>

      {/* ── LE SOL ── */}
      <path d="M0 556 Q 260 528 540 552 T 1000 556 L1000 640 L0 640 Z" fill="#171f3e" />
      <path d="M0 560 Q 260 534 540 556 T 1000 560" fill="none" stroke="#26305c" strokeWidth="2" opacity="0.7" />

      {/* ── LA MAISON ── */}
      <g className="maison">
        {/* toit (couleur de la quête) */}
        <polygon points="92,304 300,168 508,304" fill={accent} />
        <polygon points="300,168 508,304 508,290 300,154" fill="#000" opacity="0.12" />
        {/* corps */}
        <rect x="118" y="300" width="372" height="256" rx="8" fill="url(#mur)" />
        {/* fenêtre du grenier (lumière chaude) */}
        <circle cx="300" cy="268" r="20" fill="#ffe09a" stroke={accent} strokeWidth="4" />
        <line x1="300" y1="248" x2="300" y2="288" stroke={accent} strokeWidth="3" />
        <line x1="280" y1="268" x2="320" y2="268" stroke={accent} strokeWidth="3" />

        {/* pièce ouverte (coupe) */}
        <rect x="144" y="322" width="322" height="212" fill="#f7ecd2" />
        <rect x="144" y="500" width="322" height="34" fill="url(#sol)" />
        <ellipse className="lampglow" cx="305" cy="360" rx="190" ry="150" fill="url(#lampe)" />
        {/* lampe au plafond */}
        <line x1="305" y1="322" x2="305" y2="336" stroke="#7b6a3a" strokeWidth="3" />
        <path d="M293 336 h24 l-5 14 h-14 z" fill="#ffce6a" />

        {/* bureau */}
        <rect x="162" y="452" width="158" height="13" rx="3" fill="#9c6b3c" />
        <rect x="170" y="465" width="9" height="44" fill="#85572f" />
        <rect x="304" y="465" width="9" height="44" fill="#85572f" />

        {/* écran d'ordinateur */}
        <rect x="178" y="386" width="126" height="70" rx="7" fill="#0d1430" stroke="#33406f" strokeWidth="2" />
        <rect x="186" y="394" width="110" height="54" rx="3" fill="#0b1026" />
        {/* barre d'adresse */}
        <rect x="192" y="399" width="98" height="15" rx="7" fill="#1b2547" />
        <circle cx="201" cy="406" r="3" fill={accent} />
        <text x="209" y="411" className="ecran-url">{ecran}</text>
        <text x="241" y="438" textAnchor="middle" className="ecran-site">{url ? '⌛' : '·_·'}</text>
        <rect x="232" y="456" width="18" height="10" fill="#33406f" />
        <rect x="218" y="466" width="46" height="6" rx="3" fill="#9c6b3c" />

        {/* l'enfant sur sa chaise */}
        <rect x="350" y="430" width="40" height="74" rx="14" fill={accent} opacity="0.85" />
        <text x="370" y="470" textAnchor="middle" className="perso-emoji">{perso}</text>

        {/* la Box (routeur domestique) */}
        <g className={sending ? 'box box--actif' : 'box'}>
          <line x1="372" y1="486" x2="368" y2="470" stroke="#5b6690" strokeWidth="2.5" />
          <line x1="392" y1="486" x2="398" y2="470" stroke="#5b6690" strokeWidth="2.5" />
          <circle cx="368" cy="468" r="3" fill="#5b6690" />
          <circle cx="398" cy="468" r="3" fill="#5b6690" />
          <rect x="350" y="486" width="78" height="22" rx="6" fill="#10182f" stroke="#33406f" strokeWidth="1.5" />
          <circle className="led led-1" cx="362" cy="497" r="3.4" fill="#4CB68A" />
          <circle className="led led-2" cx="376" cy="497" r="3.4" fill={accent} />
          <circle className="led led-3" cx="390" cy="497" r="3.4" fill="#F5C000" />
          <text x="408" y="501" className="box-label">box</text>
        </g>

        {/* câble réseau : écran → box */}
        <path d="M304 444 C 330 470, 344 482, 360 490" fill="none" stroke="#6b7280" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
