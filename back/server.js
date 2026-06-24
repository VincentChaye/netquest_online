// ══════════════════════════════════════════════════════════
// NetQuest — Serveur Express
// API de jeu (solo) + service du front React buildé (en prod).
// ══════════════════════════════════════════════════════════
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORT, APP, VERSION } = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

// ── API ──────────────────────────────────────────────────
// Vérifier que le serveur tourne
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: APP, version: VERSION });
});

app.use('/api/quests', require('./src/routes/quests'));
app.use('/api/game', require('./src/routes/game'));

// ── Front (production) ───────────────────────────────────
// En dev, le front tourne sur Vite (:5173) avec un proxy /api.
// En prod, on sert le build React (front/dist) depuis Express.
const distPath = path.join(__dirname, '..', 'front', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`${APP} v${VERSION} — API sur http://localhost:${PORT}`);
});
