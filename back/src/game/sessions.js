// Stockage des parties en mémoire (Map). Suffisant pour le mode solo.
// ⚠️ État éphémère : tout est perdu si le serveur redémarre.
const crypto = require('crypto');

const sessions = new Map();

function createSession(quest) {
  const sessionId = crypto.randomUUID();
  const state = {
    sessionId,
    quest,
    zone: 'maison',
    tokens: [],
    createdAt: Date.now(),
  };
  sessions.set(sessionId, state);
  return state;
}

function getSession(id) {
  return sessions.get(id);
}

module.exports = { createSession, getSession, sessions };
