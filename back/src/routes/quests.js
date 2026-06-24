// Routes des quêtes : la liste des 4 aventures et le détail d'une quête.
const express = require('express');
const router = express.Router();
const quests = require('../data/quests.json');

// GET /api/quests -> les 4 quêtes
router.get('/', (req, res) => {
  res.json(quests);
});

// GET /api/quests/:id -> une quête précise
router.get('/:id', (req, res) => {
  const quest = quests.find((q) => q.id === req.params.id);
  if (!quest) return res.status(404).json({ error: 'Quête introuvable' });
  res.json(quest);
});

module.exports = router;
