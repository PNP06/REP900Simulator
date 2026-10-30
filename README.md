# Simulateur REP 900

Simulateur pédagogique de conduite d'un réacteur à eau pressurisée de 900 MWe générique (trois boucles, pilotage en mode G), jouable dans le navigateur sur ordinateur et téléphone.

**Jouer :** https://rep900-simulateur.netlify.app/

## Avertissement

Simulateur pédagogique d'un REP **générique**. Aucun document interne d'entreprise (exploitant, constructeur ou autorité) n'a été utilisé : il repose uniquement sur des connaissances publiques (physique des réacteurs, ouvrages d'enseignement, informations publiques). Les valeurs, seuils, automatismes et conduites sont génériques et simplifiés et ne reproduisent aucune installation réelle ni ses procédures. Projet personnel et indépendant.

## Sources

Le simulateur repose sur des sources publiques, listées dans la rubrique « Sources » du menu : IRSN, *Éléments de sûreté nucléaire – Les réacteurs à eau sous pression* (2020) ; ASN, rapport annuel 2019, chapitre « Les centrales nucléaires d'EDF » ; ANCCLI, fiche thématique n° 5 ; DOE Fundamentals Handbook *Nuclear Physics and Reactor Theory* ; NRC, *Reactor Concepts Manual* ; AIEA, Training Course Series n° 65 ; IAPWS-IF97 ; ouvrages d'enseignement de neutronique.

Depuis le 30 octobre 2026, la page Sources est classée par thème (réacteurs et parc 900 MWe, physique du cœur, critères de sûreté, alimentations électriques et Fukushima, accidents historiques, simulateurs pédagogiques) et indique, pour chaque source, les valeurs du simulateur qu'elle étaye. Elle cite aussi l'IRSN (chapitre 28 des *Éléments de sûreté nucléaire*, avis de synthèse RP4 900 MWe, *Repères* n° 48, dossiers TMI de 2009 et 2019), le DOE-HDBK-1019 volume 2, le 10 CFR 50.46, la NRC (fiche et NUREG/KM-0001 sur TMI), Keepin (1965) et Way et Wigner (1948). Aucun document non public n'est cité.

## Limites et méthode

La fenêtre « Limites et méthode » (menu d'accueil, À propos, Sources) détaille les choix de conception, les hypothèses de calcul avec leurs valeurs, ce que le modèle ne représente pas et la manière dont il est vérifié.

## Contenu

- **Visite guidée de la centrale** : 37 chapitres illustrés, rangés en 7 thèmes et animés, sans manipulation (fission, réaction en chaîne, neutrons retardés, combustible, modérateur, circuits, mode G, xénon, sûreté, puissance résiduelle), dont les trois familles de grappes et un thème « Manœuvres » sur les principes de conduite : états de la tranche, comptage des neutrons et 1/M, divergence, couplage, montée en puissance, variations de charge et réglage de fréquence, repli, arrêts imprévus, règles d'or.
- **Tutoriel** de prise de quart, avec repères animés et flèche vers les commandes.
- **8 leçons guidées** : cinétique et temps de doublement, contre-réactions et mode G, ΔI et diagramme de pilotage, xénon 135, pressuriseur et RCV, générateurs de vapeur et eau alimentaire, protections et permissifs, divergence guidée.
- **4 exercices notés** : divergence, couplage et montée en charge, suivi de charge et xénon, mise à l'arrêt à chaud.
- **9 aléas** avec débriefing : perte de TPA, îlotage, chute de grappe, aspersion bloquée ouverte, fuite sur la décharge RCV, défaillance de la régulation ARE, dilution intempestive, retrait incontrôlé à puissance nulle, déclenchement d'une pompe primaire. Plus un aléa mystère et le pilotage libre.
- **13 corrections commentées** : le pilote automatique joue chaque aléa et chaque exercice noté en temps réel, déplace un pointeur, clique au bon endroit et explique chaque action ; accessibles depuis le menu et depuis le débriefing (« Voir la correction »).
- Fenêtre **« Pourquoi l'AAR ? »** à chaque arrêt automatique ou manuel, sans mettre la simulation en pause : protection déclenchée avec la valeur mesurée et son seuil, rôle de la protection, origine probable d'après l'état de la tranche et les dernières actions, suite de l'arrêt et vérifications avant réarmement cochées en direct. Rouvrable depuis la carte « En cours » et le débriefing.
- Diagramme pression-température du primaire (« chaussette ») en direct.
- Aide « ? » sur chaque carte, lexique de 98 termes, bandeau catégorisé avec jauges.
- Deux niveaux d'explication : « Débutant » ajoute à chaque consigne une explication simple (« En clair ») et un plan pas à pas pour les exercices ; « Confirmé » garde le seul texte technique.
- Sons synthétisés : avertisseurs d'alarme façon salle de commande (klaxon pour les alarmes rouges, ronfleur pour les ambre, jusqu'à l'acquittement), AAR, réussite d'étape, ambiance des machines discrète et réglable, comptage neutronique audible. Le pictogramme du haut-parleur ouvre les réglages : chaque famille de sons s'active séparément.

## Retours et suggestions

Le simulateur comporte un formulaire « Retours et suggestions » (menu, et en fin d'exercice). Chaque retour est classé par niveau d'importance (critique, incohérence, manquant, amélioration, détail) et envoyé par Netlify Forms (formulaire `retour`), sans compte ni inscription pour l'utilisateur. L'auteur reçoit un courriel à chaque envoi (notification réglée dans Netlify, l'adresse n'apparaît pas dans le code). Un champ piège filtre les robots. Hors du site en ligne (fichier ouvert en local), l'envoi échoue proprement et propose de copier le texte.

L'onglet « Retours publiés » lit le fichier `retours.json` publié avec le site. Pour publier un retour, l'ajouter au tableau `retours`, anonymisé :

```json
{ "n": 1, "date": "2026-10-20", "niveau": "incohérence", "partie": "Modèle physique",
  "titre": "…", "description": "…", "statut": "ouvert", "reponse": "…", "date_reponse": "2026-10-22" }
```

`niveau` reprend les clés du formulaire (`critique`, `incohérence`, `manquant`, `amélioration`, `détail`), `statut` vaut `ouvert` ou `résolu`, `reponse` et `date_reponse` sont facultatifs.

## Mise en ligne

Le site est publié par Netlify (`netlify.toml` : racine du dépôt publiée telle quelle, sans construction ; page et `retours.json` toujours revalidés).

## Modèle

Cinétique ponctuelle à 6 groupes de neutrons retardés, puissance résiduelle, chaîne iode-xénon, contre-réactions Doppler et modérateur (fonction du bore), efficacités intégrales des grappes en S, thermohydraulique primaire et secondaire en paramètres concentrés, gonflement et contraction du niveau GV, régulations (température, GCP, pressuriseur, RCV, ARE, GCT) et protections simplifiées.

Les valeurs sont représentatives mais simplifiées : ce n'est pas un outil de formation agréé.

## Technique

Thème clair et sombre (automatique selon le système, ou au choix). Site statique sans dépendance ni build : il suffit d'ouvrir `index.html` dans un navigateur. Le code est réparti en quelques fichiers, chargés dans cet ordre par la page :

- `index.html` : structure de la page (cartes, fenêtres, formulaire de retours) ;
- `css/simulateur.css` : styles, thèmes clair et sombre ;
- `js/outils.js` : utilitaires communs (formats, stockage local) ;
- `js/electrique.js` : alimentations électriques (sources, tableaux, diesels, batteries) et `dispo()` ;
- `js/physique.js` : modèle physique (cinétique, thermohydraulique, régulations, protections), testé seul ;
- `js/scenarios.js` : alarmes et scénarios (leçons, exercices, aléas, TMI) ;
- `js/lecons.js` : accompagnement des leçons, explications « En clair », niveau d'explication ;
- `js/interface.js` : application, actions opérateur, synchronisation, mission, débriefing, menu ;
- `js/corrections.js` : corrections commentées (pilote automatique, voix) ;
- `js/aide.js` : aide « ? » des cartes et lexique ;
- `js/bandeau.js` : bandeau du haut ;
- `js/sons.js` : bruitages et avertisseurs ;
- `js/visite-chapitres.js` : textes des chapitres de la visite et ordre des thèmes ;
- `js/visite.js` : repères d'attention, moteur, schémas et animations de la visite ;
- `js/domaine-pt.js` : domaine pression-température (« chaussette ») ;
- `js/synoptique.js`, `js/vue-electrique.js` : synoptique cliquable et vue Électrique ;
- `js/panneaux.js` : retours, thème, fenêtre « Pourquoi l'AAR ? », carte « En cours », tendances ;
- `js/demarrage.js` : boucle de simulation et démarrage (en dernier).

Ce sont des scripts classiques partagés : un fichier ne peut appeler, au chargement, que ce qui est défini dans les fichiers précédents. Les scores et préférences sont conservés localement dans le navigateur. Les règles du projet et les recettes pour le faire évoluer sont dans [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Tests

`npm test` lance les deux suites ; elles tournent aussi à chaque modification du dépôt (action GitHub « Tests »).

- `node tests/physique.test.mjs` vérifie les grandeurs de référence du modèle (états stables à 100 % et 50 %, AAR, puissance résiduelle, xénon, criticité à l'arrêt à chaud, perte de pompe primaire). Aucune dépendance n'est nécessaire.
- `node tests/interface.test.mjs` ouvre la page dans Chromium à 320, 390 et 1 440 px, en thème clair et sombre, parcourt scénarios, visite et retours (envoi au formulaire Netlify et lecture de `retours.json` via un petit serveur local), déroule les huit leçons de bout en bout (dont cinétique et xénon) et vérifie la fenêtre « Pourquoi l'AAR ? » (nécessite Playwright : `npm install` puis `npx playwright install chromium`).
