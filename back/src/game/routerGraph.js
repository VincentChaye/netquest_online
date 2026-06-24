// Construit le « graphe » de routeurs que le paquet doit traverser pour une quête.
// 3 sauts : Ta Box -> routeur /8 -> routeur /16 -> serveur /24 (la destination).
// Chaque routeur a une adresse IP. Au dernier saut, le routeur tombe en panne :
// il faut alors prendre un détour un peu plus long, qui passe par 2 routeurs.
const routing = require('../data/routing.json');

// Petit générateur pseudo-aléatoire déterministe (pour mélanger sans dépendre du hasard).
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, seed) {
  const rng = mulberry32(hashString(seed));
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildGraph(quest) {
  const table = routing[quest.continent];
  if (!table) return [];
  const [a, b, c] = table.dest.split('.').map(Number);
  const rows = table.rows; // [10/8, a.0.0.0/8, a.b.0.0/16, a.b.c.0/24, 0.0.0.0/0]
  const strip = (s) => s.replace('✓', '').trim();
  // une route -> mène à un routeur qui a une adresse IP
  const C = (reseau, masque, nom, ip, correct = false) => ({ reseau, masque, nom, ip, correct });

  const otherA = a > 40 ? a - 23 : a + 23;
  const otherB = ((b + 57) % 254) + 1;
  const otherC = ((c + 83) % 254) + 1;

  const hop0 = shuffle(
    [
      C(rows[1][0], rows[1][1], strip(rows[1][2]), `${a}.0.0.1`, true),
      C('10.0.0.0', '/8', 'Réseau local (la maison)', '10.0.0.1'),
      C(`${otherA}.0.0.0`, '/8', 'Routeur d’un autre continent', `${otherA}.0.0.1`),
    ],
    quest.id + '-0'
  );
  const hop1 = shuffle(
    [
      C(rows[2][0], rows[2][1], strip(rows[2][2]), `${a}.${b}.0.1`, true),
      C(`${a}.${otherB}.0.0`, '/16', 'Routeur d’une autre région', `${a}.${otherB}.0.1`),
      C('0.0.0.0', '/0', 'Passerelle par défaut', null),
    ],
    quest.id + '-1'
  );
  const hop2 = shuffle(
    [
      C(rows[3][0], rows[3][1], strip(rows[3][2]), `${a}.${b}.${c}.1`, true), // ce routeur va tomber en panne
      C(`${a}.${b}.${otherC}.0`, '/24', 'Serveur d’une autre ville', `${a}.${b}.${otherC}.1`),
    ],
    quest.id + '-2'
  );

  return [
    { from: 'Ta Box', candidates: hop0 },
    { from: strip(rows[1][2]), candidates: hop1 },
    { from: strip(rows[2][2]), candidates: hop2 },
  ];
}

// Le détour (après la panne) : un autre chemin un peu plus long, 2 routeurs.
// On reprend un routage NORMAL (choix du préfixe le plus précis), pas de « routeur en panne ».
function buildReroute(quest) {
  const table = routing[quest.continent];
  if (!table) return [];
  const [a, b, c] = table.dest.split('.').map(Number);
  const rows = table.rows;
  const strip = (s) => s.replace('✓', '').trim();
  const C = (reseau, masque, nom, ip, correct = false) => ({ reseau, masque, nom, ip, correct });
  const otherB = ((b + 99) % 254) + 1;
  const otherC = ((c + 111) % 254) + 1;

  // Étape A : revenir vers la bonne région (/16) par un autre lien.
  const detourA = shuffle(
    [
      C(rows[2][0], rows[2][1], strip(rows[2][2]) + ' (autre lien)', `${a}.${b}.0.2`, true),
      C(`${a}.${otherB}.0.0`, '/16', 'Routeur d’une autre région', `${a}.${otherB}.0.2`),
      C('0.0.0.0', '/0', 'Passerelle par défaut', null),
    ],
    quest.id + '-dA'
  );
  // Étape B : atteindre le réseau du serveur (/24) par un autre routeur.
  const detourB = shuffle(
    [
      C(rows[3][0], rows[3][1], strip(rows[3][2]) + ' (autre lien)', `${a}.${b}.${c}.2`, true),
      C(`${a}.${b}.${otherC}.0`, '/24', 'Serveur d’une autre ville', `${a}.${b}.${otherC}.2`),
    ],
    quest.id + '-dB'
  );

  return [
    { from: 'détour', candidates: detourA },
    { from: 'détour', candidates: detourB },
  ];
}

// Retire le drapeau `correct` (pas de triche côté front), pour une liste d'étapes.
function strip(c) {
  const { correct, ...rest } = c;
  return rest;
}
function stripStages(stages) {
  return stages.map((s) => ({ from: s.from, candidates: s.candidates.map(strip) }));
}

module.exports = { buildGraph, buildReroute, stripStages };
