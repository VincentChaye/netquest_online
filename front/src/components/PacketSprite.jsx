// Le paquet de données : le héros du jeu. Une petite enveloppe-cube avec des yeux.
export default function PacketSprite({ size = 56, color = '#29A8D9', className = '', style }) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="paquet de données"
    >
      <defs>
        <linearGradient id="packet-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <rect x="8" y="14" width="48" height="38" rx="11" fill={color} />
      <rect x="8" y="14" width="48" height="38" rx="11" fill="url(#packet-shine)" />
      <path
        d="M8 22 L32 38 L56 22"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.75"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="41" r="3.6" fill="#0b1026" />
      <circle cx="40" cy="41" r="3.6" fill="#0b1026" />
      <circle cx="25.3" cy="39.7" r="1.2" fill="#fff" />
      <circle cx="41.3" cy="39.7" r="1.2" fill="#fff" />
    </svg>
  );
}
