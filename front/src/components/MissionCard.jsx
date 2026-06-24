// La carte de mission : qui joue, et où le paquet doit aller.
export default function MissionCard({ quest }) {
  return (
    <div className="mission" style={{ '--accent': quest.couleur }}>
      <div className="mission-tete">
        <span className="mission-emoji" aria-hidden="true">{quest.emoji}</span>
        <div>
          <p className="mission-eyebrow">Ta mission</p>
          <h2 className="mission-nom">{quest.perso}</h2>
        </div>
      </div>
      <p className="mission-histoire">{quest.narrationMaison}</p>
      <div className="mission-cible">
        <span className="mission-label">Destination</span>
        <span className="mission-site">{quest.siteEmoji} {quest.site}</span>
        <span className="mission-lieu">{quest.drapeau} {quest.ville}, {quest.pays}</span>
      </div>
    </div>
  );
}
