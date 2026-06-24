# NetQuest — version jouable en ligne 🌐

Une version **web, solo** du jeu NetQuest de Terra Numerica : tu deviens un **paquet de
données** et tu apprends comment fonctionne Internet en voyageant de la **Maison** jusqu'au
serveur d'un site, à l'autre bout du monde.

> Le jeu est **complet** : les 4 aventures (Noémie, Lucas, Mamie Suzanne, Théo) et les
> 4 zones jouables de bout en bout :
> **🏠 Maison** (vue 2D, on envoie le paquet) → **🌐 DNS** (l'annuaire à 3 niveaux, jeton DNS)
> → **🌍 Routeur** (voyage multi-routeurs avec IP, longest-prefix-match et une panne à
> contourner, jeton IP) → **🖥 Serveur** (poignée de main TCP + requête HTTP, jetons TCP & HTTP)
> → **🏆 Victoire** quand les 4 jetons sont réunis.

## L'architecture en deux mots

```
network/
├── back/   →  le SERVEUR (Express, Node.js)
│            il connaît les aventures, vérifie les réponses, garde le score.
└── front/  →  l'ÉCRAN (React, Vite)
             ce que l'enfant voit et touche : la maison, la barre d'adresse, le paquet.
```

Le **front** ne calcule rien tout seul : dès qu'il a besoin d'une info ou veut vérifier une
réponse, il **demande au back** (par des messages `/api/...`). C'est exactement comme un
navigateur qui parle à un serveur — le jeu fonctionne comme le vrai Internet. 🙂

## Lancer le jeu (2 terminaux)

**1) Le serveur (back)**
```bash
cd back
npm install      # la première fois seulement
npm run dev      # démarre sur http://localhost:3000
```

**2) L'écran (front)**
```bash
cd front
npm install      # la première fois seulement
npm run dev      # ouvre http://localhost:5173
```

Ouvre **http://localhost:5173** dans le navigateur. Choisis une aventure, puis dans la
maison, tape l'adresse du site et appuie sur **Entrée** : le paquet part vers Internet !

> Le front (5173) transmet automatiquement ses messages `/api` au back (3000).

## Tout lancer avec un seul serveur (optionnel)
```bash
cd front && npm run build   # fabrique front/dist
cd ../back && npm start      # le back sert aussi le jeu sur http://localhost:3000
```

## L'API du jeu
| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/health` | Vérifie que le serveur tourne |
| GET | `/api/quests` | La liste des 4 aventures |
| GET | `/api/quests/:id` | Une aventure précise |
| POST | `/api/game/start` | Démarre une partie (`{ questId }`) |
| POST | `/api/game/answer` | Vérifie une réponse (`{ sessionId, zone, answer }`) |
| GET | `/api/game/:sessionId` | L'état de la partie |

> ⚠️ Les parties sont gardées **en mémoire** : si on redémarre le serveur, les parties en
> cours sont perdues. C'est suffisant pour le mode solo.

## D'où vient le contenu ?
- Les 4 quêtes viennent de `../network/wokwi/game-config.json`.
- Les histoires et le ton pédagogique viennent de `../network/Creation_atelier/fil-rouge.md`.
- Les couleurs et polices reprennent `../network/site/css/style.css`.
