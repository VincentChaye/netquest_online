// Routes de jeu : démarrer une partie, valider une réponse, lire l'état.
const express = require('express');
const router = express.Router();
const quests = require('../data/quests.json');
const { createSession, getSession } = require('../game/sessions');
const { validate } = require('../game/validation');
const { buildGraph, buildReroute, stripStages } = require('../game/routerGraph');

// POST /api/game/start { questId } -> crée une partie
router.post('/start', (req, res) => {
  const { questId } = req.body || {};
  const quest = quests.find((q) => q.id === questId);
  if (!quest) return res.status(400).json({ error: 'questId inconnu' });

  const state = createSession(quest);
  // parcours multi-routeurs + détour de secours (2 routeurs, en cas de panne au dernier routeur)
  state.routeur = { hop: 0, graph: buildGraph(quest), reroute: buildReroute(quest), panne: false, done: false, rerouteHop: 0 };

  res.json({
    sessionId: state.sessionId,
    quest: { ...quest, routeurs: stripStages(state.routeur.graph) },
    zone: state.zone,
    tokens: state.tokens,
  });
});

// POST /api/game/answer { sessionId, zone, answer } -> valide une réponse
router.post('/answer', (req, res) => {
  const { sessionId, zone, answer } = req.body || {};
  const state = getSession(sessionId);
  if (!state) {
    return res.status(404).json({ error: 'Partie introuvable (sessionId invalide)' });
  }

  const result = validate(zone, answer, state.quest, state);

  // Met à jour l'état si la réponse est correcte
  if (result.correct) {
    if (result.tokenAwarded && !state.tokens.includes(result.tokenAwarded)) {
      state.tokens.push(result.tokenAwarded);
    }
    if (result.nextZone) state.zone = result.nextZone;
  }

  res.json({ ...result, tokens: state.tokens, zone: state.zone });
});

// GET /api/game/:sessionId -> état courant de la partie
router.get('/:sessionId', (req, res) => {
  const state = getSession(req.params.sessionId);
  if (!state) return res.status(404).json({ error: 'Partie introuvable' });
  res.json(state);
});

module.exports = router;
