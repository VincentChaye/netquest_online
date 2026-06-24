// Les 4 aventures, présentées comme des cartes « choisis ton personnage ».
export default function QuestPicker({ quests, onPick, busyId }) {
  return (
    <div className="quetes">
      {quests.map((q) => (
        <button
          key={q.id}
          className="quete-carte"
          style={{ '--accent': q.couleur }}
          onClick={() => onPick(q)}
          disabled={!!busyId}
          aria-busy={busyId === q.id}
        >
          <span className="quete-emoji" aria-hidden="true">{q.emoji}</span>
          <span className="quete-nom">{q.perso}</span>
          <span className="quete-resume">{q.resume}</span>
          <span className="quete-site">
            <span aria-hidden="true">{q.siteEmoji}</span> {q.site}
          </span>
          <span className="quete-go">{busyId === q.id ? 'On y va…' : 'Jouer ▸'}</span>
        </button>
      ))}
    </div>
  );
}
