const API = import.meta.env.VITE_API_URL ?? '/api';

async function readJson(res, erreur) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || erreur);
  }
  return res.json();
}

export function getQuests() {
  return fetch(`${API}/quests`).then((r) => readJson(r, 'Impossible de charger les quêtes.'));
}

export function startGame(questId) {
  return fetch(`${API}/game/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questId }),
  }).then((r) => readJson(r, 'Impossible de démarrer la partie.'));
}

export function sendAnswer(sessionId, zone, answer) {
  return fetch(`${API}/game/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, zone, answer }),
  }).then((r) => readJson(r, "Impossible d'envoyer la réponse."));
}
