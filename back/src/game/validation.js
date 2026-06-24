// Logique de validation des réponses, zone par zone.
const { stripStages } = require('./routerGraph');

// Enchaînement des zones du jeu.
const ZONES = { maison: 'dns', dns: 'routeur', routeur: 'serveur', serveur: 'fin' };

// ── Outils d'adresses IP (pour le routage / longest-prefix-match) ──
function ipToInt(ip) {
  return ip.split('.').reduce((acc, oct) => ((acc << 8) + (parseInt(oct, 10) & 255)) >>> 0, 0) >>> 0;
}
function prefixLen(masque) {
  return parseInt(String(masque).slice(1), 10); // "/24" -> 24
}
function prefixMatch(dest, reseau, len) {
  if (len === 0) return true; // route par défaut : correspond à tout
  const mask = (0xffffffff << (32 - len)) >>> 0;
  return ((ipToInt(dest) & mask) >>> 0) === ((ipToInt(reseau) & mask) >>> 0);
}

// Normalise un nom de site pour une comparaison tolérante :
// minuscules, sans "https://", sans "www.", sans chemin, sans espaces.
function normalizeSite(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .replace(/\s+/g, '');
}

// Renvoie l'extension (TLD) d'un site : "wikipedia.org" -> ".org".
function tldOf(site) {
  const parts = String(site).split('.');
  return '.' + parts[parts.length - 1];
}

function validate(zone, answer, quest, state) {
  if (zone === 'maison') {
    const correct = normalizeSite(answer) === normalizeSite(quest.site);
    if (correct) {
      return {
        correct: true,
        tokenAwarded: null, // pas de jeton à la maison : le 1er jeton se gagne au DNS
        nextZone: 'dns',
        feedback: `Parfait ! Le paquet de ${quest.perso} est créé et part chercher l'adresse de ${quest.site}.`,
        explication:
          "Ton ordinateur ne connaît pas encore l'adresse exacte (l'IP) du site. " +
          "Il doit d'abord la demander au DNS, l'annuaire géant d'Internet.",
      };
    }
    return {
      correct: false,
      tokenAwarded: null,
      nextZone: null,
      feedback: `Ce n'est pas tout à fait ça. Relis la mission : ${quest.perso} veut aller sur « ${quest.site} ».`,
      explication:
        "Si tu te trompes dans le nom du site, ton paquet ne saura pas où aller. " +
        "Vérifie bien l'orthographe, sans faute !",
    };
  }

  if (zone === 'dns') {
    // L'enfant doit interroger l'annuaire dans le bon ordre :
    // Racine -> TLD -> Autoritaire (du plus général au plus précis).
    const ordre = ['racine', 'tld', 'autoritaire'];
    const correct =
      Array.isArray(answer) &&
      answer.length === ordre.length &&
      ordre.every((k, i) => answer[i] === k);

    if (correct) {
      return {
        correct: true,
        tokenAwarded: 'dns',
        nextZone: 'routeur',
        ip: quest.ip,
        feedback: `L'annuaire a parlé : ${quest.site} → ${quest.ip}. Tu gagnes le jeton DNS !`,
        explication:
          `Tu as suivi la hiérarchie du DNS : la Racine t'envoie vers le serveur « ${tldOf(quest.site)} », ` +
          `qui t'envoie vers le serveur de ${quest.site}, qui connaît enfin l'adresse IP. ` +
          'Personne ne connaît tout : chaque niveau délègue au suivant.',
      };
    }
    return {
      correct: false,
      tokenAwarded: null,
      nextZone: null,
      feedback: "Ce n'est pas le bon ordre. On demande toujours à la Racine d'abord, puis au TLD, puis au serveur Autoritaire.",
      explication: 'Le DNS est hiérarchique : on part du plus général (la Racine) vers le plus précis (le serveur du site).',
    };
  }

  if (zone === 'routeur') {
    // Parcours multi-routeurs : on avance saut par saut dans le graphe stocké en session.
    const rt = state && state.routeur;
    if (!rt) {
      return { correct: false, tokenAwarded: null, nextZone: null, feedback: "Le routeur n'est pas prêt.", explication: '' };
    }
    const idx = Number(answer);

    // Évalue un choix de route (logique commune : la route la plus précise qui correspond).
    const evalRoute = (stage) => {
      const cand = stage && stage.candidates[idx];
      if (!cand) return { invalid: true };
      if (cand.correct) return { ok: true, cand };
      const estDefaut = cand.masque === '/0';
      const correspond = prefixMatch(quest.ip, cand.reseau, prefixLen(cand.masque));
      const feedback = estDefaut
        ? 'La route par défaut mène un peu partout… mais une route plus précise existe ! 🧭'
        : correspond
          ? 'Cette route correspond… mais une autre est plus précise !'
          : `Cul-de-sac ! L'adresse ${quest.ip} ne commence pas comme « ${cand.reseau} ».`;
      return { ok: false, cand, feedback };
    };

    // ── Détour (après la panne) : on reprend un routage NORMAL, par un autre chemin (2 routeurs). ──
    if (rt.panne && !rt.done) {
      const r = evalRoute(rt.reroute[rt.rerouteHop]);
      if (r.invalid) return { correct: false, panne: true, tokenAwarded: null, nextZone: null, feedback: 'Choisis une route.', explication: '' };
      if (!r.ok) return { correct: false, panne: true, tokenAwarded: null, nextZone: null, feedback: r.feedback, explication: '' };

      rt.rerouteHop += 1;
      const fini = rt.rerouteHop >= rt.reroute.length;
      if (fini) {
        rt.done = true;
        return {
          correct: true,
          done: true,
          panne: true,
          detourHop: rt.rerouteHop,
          hop: rt.graph.length,
          chosen: { nom: r.cand.nom, ip: r.cand.ip },
          tokenAwarded: 'ip',
          nextZone: 'serveur',
          feedback: `Par ce chemin plus long, le paquet arrive à ${quest.ville} ${quest.drapeau} ! Jeton IP gagné.`,
          explication: 'Internet a plusieurs chemins. Quand un routeur tombe en panne, le paquet en prend un autre — parfois plus long — et arrive quand même.',
        };
      }
      return {
        correct: true,
        done: false,
        panne: true,
        detourHop: rt.rerouteHop,
        chosen: { nom: r.cand.nom, ip: r.cand.ip },
        tokenAwarded: null,
        nextZone: null,
        feedback: `Bon saut ! Le paquet passe par le routeur ${r.cand.ip}.`,
        explication: '',
      };
    }

    // ── Hops normaux ──
    const r = evalRoute(rt.graph[rt.hop]);
    if (r.invalid) return { correct: false, tokenAwarded: null, nextZone: null, feedback: 'Choisis une route.', explication: '' };
    if (!r.ok) return { correct: false, done: false, panne: false, hop: rt.hop, tokenAwarded: null, nextZone: null, feedback: r.feedback, explication: '' };

    const dernier = rt.hop === rt.graph.length - 1;
    if (dernier) {
      // ⚠️ Au dernier routeur : panne ! On passe en mode détour (2 routeurs, routage normal).
      rt.panne = true;
      rt.rerouteHop = 0;
      return {
        correct: true,
        panne: true,
        done: false,
        hop: rt.hop,
        chosen: { nom: r.cand.nom, ip: r.cand.ip },
        reroute: stripStages(rt.reroute),
        tokenAwarded: null,
        nextZone: null,
        feedback: `⚠️ Le routeur ${r.cand.ip} est cassé ! Il ne répond plus. Prends un autre chemin, même s'il est plus long.`,
        explication: '',
      };
    }
    rt.hop += 1;
    return {
      correct: true,
      done: false,
      panne: false,
      hop: rt.hop,
      chosen: { nom: r.cand.nom, ip: r.cand.ip },
      tokenAwarded: null,
      nextZone: null,
      feedback: `Bon saut ! Le paquet avance vers le routeur ${r.cand.ip}.`,
      explication: '',
    };
  }

  if (zone === 'serveur') {
    const a = answer || {};

    // Phase 1 — la poignée de main TCP : SYN -> SYN-ACK -> ACK.
    if (a.phase === 'tcp') {
      const ok = Array.isArray(a.ordre) && a.ordre.join(',') === 'syn,syn_ack,ack';
      if (ok) {
        return {
          correct: true,
          phase: 'tcp',
          nextPhase: 'http',
          tokenAwarded: 'tcp',
          nextZone: null,
          feedback: 'Connexion établie ! Maintenant on peut parler.',
          explication: "Comme au téléphone : tu sonnes, l'autre décroche, tu dis « allô ».",
        };
      }
      return {
        correct: false,
        phase: 'tcp',
        tokenAwarded: null,
        nextZone: null,
        feedback: 'Pas le bon ordre : SYN, puis SYN-ACK, puis ACK.',
        explication: '',
      };
    }

    // Phase 2 — la requête HTTP : la bonne méthode pour LIRE la page.
    if (a.phase === 'http') {
      const methode = String(a.methode || '').toLowerCase();
      if (methode === 'get') {
        return {
          correct: true,
          phase: 'http',
          done: true,
          tokenAwarded: 'http',
          nextZone: 'fin',
          code: '200',
          feedback: '200 OK ! Le serveur envoie la page. 🎉',
          explication: 'GET veut dire « lire ». Le serveur répond 200 OK avec la page.',
        };
      }
      return {
        correct: false,
        phase: 'http',
        tokenAwarded: null,
        nextZone: null,
        code: '405',
        feedback:
          methode === 'delete'
            ? '405 interdit : on ne supprime pas une page publique !'
            : 'Pour lire une page, c’est GET.',
        explication: '',
      };
    }

    // Phase UDP — streaming sans connexion.
    if (a.phase === 'udp') {
      const ok = a.reponse === 'sans_connexion';
      if (ok) {
        return {
          correct: true,
          phase: 'udp',
          done: true,
          tokenAwarded: 'udp',
          nextZone: 'fin',
          feedback: "Exactement ! UDP envoie sans vérifier — c'est pour ça que la vidéo ne se fige pas.",
          explication: "UDP est rapide car il n'attend pas de confirmation. Quelques images perdues ? La vidéo continue quand même !",
        };
      }
      return {
        correct: false,
        phase: 'udp',
        tokenAwarded: null,
        nextZone: null,
        feedback: "Regarde bien comment les paquets arrivent. UDP n'attend pas de réponse du destinataire.",
        explication: '',
      };
    }

    // Phase SMTP — envoi d'e-mail commande par commande.
    if (a.phase === 'smtp') {
      const ORDRE = ['helo', 'mail_from', 'rcpt_to', 'data', 'quit'];
      const ok = Array.isArray(a.ordre) && a.ordre.join(',') === ORDRE.join(',');
      if (ok) {
        return {
          correct: true,
          phase: 'smtp',
          done: true,
          tokenAwarded: 'smtp',
          nextZone: 'fin',
          feedback: 'E-mail envoyé ! Lucas a prévenu son patron. 📧',
          explication: 'SMTP suit toujours le même dialogue : HELO, MAIL FROM, RCPT TO, DATA, QUIT.',
        };
      }
      return {
        correct: false,
        phase: 'smtp',
        tokenAwarded: null,
        nextZone: null,
        feedback: 'Pas le bon ordre. SMTP : HELO → MAIL FROM → RCPT TO → DATA → QUIT.',
        explication: '',
      };
    }

    return { correct: false, tokenAwarded: null, nextZone: null, feedback: 'Étape inconnue.', explication: '' };
  }

  // Zone inconnue
  return {
    correct: false,
    tokenAwarded: null,
    nextZone: null,
    feedback: 'Cette zone arrive très bientôt ! 🚧',
    explication: '',
  };
}

module.exports = { validate, normalizeSite, ZONES };
