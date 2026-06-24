// L'encadré pédagogique : explique « pourquoi », avec des mots simples.
export default function ExplainBox({ titre, children, ton = 'info' }) {
  return (
    <div className={`explain explain--${ton}`}>
      <span className="explain-icone" aria-hidden="true">
        {ton === 'succes' ? '🎉' : ton === 'oups' ? '🤔' : '💡'}
      </span>
      <div className="explain-corps">
        {titre && <p className="explain-titre">{titre}</p>}
        <p className="explain-texte">{children}</p>
      </div>
    </div>
  );
}
