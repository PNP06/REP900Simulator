# Simulateur REP 900

Simulateur pédagogique de conduite d'un réacteur à eau pressurisée de 900 MWe générique (trois boucles, pilotage en mode G), jouable dans le navigateur sur ordinateur et téléphone.

**Jouer :** https://pnp06.github.io/REP900Simulator/

## Avertissement

Simulateur pédagogique d'un REP **générique**. Aucun document interne d'entreprise (exploitant, constructeur ou autorité) n'a été utilisé : il repose uniquement sur des connaissances publiques (physique des réacteurs, ouvrages d'enseignement, informations publiques). Les valeurs, seuils, automatismes et conduites sont génériques et simplifiés et ne reproduisent aucune installation réelle ni ses procédures. Projet personnel et indépendant.

## Sources

Le simulateur repose sur des sources publiques, listées dans la rubrique « Sources » du menu : IRSN, *Éléments de sûreté nucléaire – Les réacteurs à eau sous pression* (2020) ; ASN, rapport annuel 2019, chapitre « Les centrales nucléaires d'EDF » ; ANCCLI, fiche thématique n° 5 ; DOE Fundamentals Handbook *Nuclear Physics and Reactor Theory* ; NRC, *Reactor Concepts Manual* ; AIEA, Training Course Series n° 65 ; IAPWS-IF97 ; ouvrages d'enseignement de neutronique.

## Contenu

- **Visite guidée de la centrale** : 35 chapitres illustrés, rangés en 7 thèmes et animés, sans manipulation (fission, réaction en chaîne, neutrons retardés, combustible, modérateur, circuits, mode G, xénon, sûreté, puissance résiduelle), dont un thème « Manœuvres » sur les principes de conduite : états de la tranche, divergence, couplage, montée en puissance, variations de charge et réglage de fréquence, repli, arrêts imprévus, règles d'or.
- **Tutoriel** de prise de quart, avec repères animés et flèche vers les commandes.
- **8 leçons guidées** : cinétique et temps de doublement, contre-réactions et mode G, ΔI et diagramme de pilotage, xénon 135, pressuriseur et RCV, générateurs de vapeur et eau alimentaire, protections et permissifs, divergence guidée.
- **4 exercices notés** : divergence, couplage et montée en charge, suivi de charge et xénon, mise à l'arrêt à chaud.
- **9 aléas** avec débriefing : perte de TPA, îlotage, chute de grappe, aspersion bloquée ouverte, fuite sur la décharge RCV, défaillance de la régulation ARE, dilution intempestive, retrait incontrôlé à puissance nulle, déclenchement d'une pompe primaire. Plus un aléa mystère et le pilotage libre.
- Diagramme pression-température du primaire (« chaussette ») en direct.
- Aide « ? » sur chaque carte, lexique de 88 termes, bandeau catégorisé avec jauges.
- Deux niveaux d'explication : « Débutant » ajoute à chaque consigne une explication simple (« En clair ») et un plan pas à pas pour les exercices ; « Confirmé » garde le seul texte technique.
- Sons synthétisés : avertisseurs d'alarme façon salle de commande (klaxon pour les alarmes rouges, ronfleur pour les ambre, jusqu'à l'acquittement), AAR, réussite d'étape, ambiance des machines discrète et réglable, comptage neutronique audible. Le pictogramme du haut-parleur ouvre les réglages : chaque famille de sons s'active séparément.

## Retours et suggestions

Le simulateur comporte un formulaire « Retours et suggestions » (menu, et en fin d'exercice). Chaque retour est classé par niveau d'importance (critique, incohérence, manquant, amélioration, détail) et publié comme *issue* GitHub à partir du modèle `.github/ISSUE_TEMPLATE/retour.yml`. Une action GitHub ajoute automatiquement l'étiquette correspondant au niveau.

Pour répondre : ouvrir l'issue sur GitHub et commenter, puis la fermer une fois traitée. Les retours, leur statut et les réponses s'affichent dans l'onglet « Retours publiés » du simulateur. La lecture est libre ; publier demande un compte GitHub.

## Modèle

Cinétique ponctuelle à 6 groupes de neutrons retardés, puissance résiduelle, chaîne iode-xénon, contre-réactions Doppler et modérateur (fonction du bore), efficacités intégrales des grappes en S, thermohydraulique primaire et secondaire en paramètres concentrés, gonflement et contraction du niveau GV, régulations (température, GCP, pressuriseur, RCV, ARE, GCT) et protections simplifiées.

Les valeurs sont représentatives mais simplifiées : ce n'est pas un outil de formation agréé.

## Technique

Thème clair et sombre (automatique selon le système, ou au choix). Un seul fichier `index.html` autonome (HTML, CSS, JavaScript sans dépendance ni build). Il suffit de l'ouvrir dans un navigateur. Les scores et préférences sont conservés localement dans le navigateur.

## Tests

`npm test` lance les deux suites ; elles tournent aussi à chaque modification du dépôt (action GitHub « Tests »).

- `node tests/physique.test.mjs` vérifie les grandeurs de référence du modèle (états stables à 100 % et 50 %, AAR, puissance résiduelle, xénon, criticité à l'arrêt à chaud, perte de pompe primaire). Aucune dépendance n'est nécessaire.
- `node tests/interface.test.mjs` ouvre la page dans Chromium à 320, 390 et 1 440 px, en thème clair et sombre, parcourt scénarios, visite et retours, et déroule six leçons de bout en bout (nécessite Playwright : `npm install` puis `npx playwright install chromium`).
