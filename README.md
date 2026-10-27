# Simulateur REP 900

Simulateur pédagogique de conduite d'un réacteur à eau pressurisée de 900 MWe générique (trois boucles, pilotage en mode G), jouable dans le navigateur sur ordinateur et téléphone.

**Jouer :** https://pnp06.github.io/REP900Simulator/

## Avertissement

Simulateur pédagogique d'un REP **générique**. Aucun document interne d'entreprise (exploitant, constructeur ou autorité) n'a été utilisé : il repose uniquement sur des connaissances publiques (physique des réacteurs, ouvrages d'enseignement, informations publiques). Les valeurs, seuils, automatismes et conduites sont génériques et simplifiés et ne reproduisent aucune installation réelle ni ses procédures. Projet personnel et indépendant.

## Contenu

- **Visite guidée de la centrale** : 19 chapitres illustrés et animés, sans manipulation (fission, réaction en chaîne, neutrons retardés, combustible, modérateur, circuits, mode G, xénon, sûreté, puissance résiduelle).
- **Tutoriel** de prise de quart, avec repères animés et flèche vers les commandes.
- **8 leçons guidées** : cinétique et temps de doublement, contre-réactions et mode G, ΔI et diagramme de pilotage, xénon 135, pressuriseur et RCV, générateurs de vapeur et eau alimentaire, protections et permissifs, divergence guidée.
- **4 exercices notés** : divergence, couplage et montée en charge, suivi de charge et xénon, mise à l'arrêt à chaud.
- **9 aléas** avec débriefing : perte de TPA, îlotage, chute de grappe, aspersion bloquée ouverte, fuite sur la décharge RCV, défaillance de la régulation ARE, dilution intempestive, retrait incontrôlé à puissance nulle, déclenchement d'une pompe primaire. Plus un aléa mystère et le pilotage libre.
- Diagramme pression-température du primaire (« chaussette ») en direct.
- Aide « ? » sur chaque carte, lexique de 88 termes, bandeau catégorisé avec jauges.
- Sons synthétisés : alarmes, AAR, réussite d'étape, ambiance des machines, comptage neutronique audible.

## Retours et suggestions

Le simulateur comporte un formulaire « Retours et suggestions » (menu, et en fin d'exercice). Chaque retour est classé par niveau d'importance (critique, incohérence, manquant, amélioration, détail) et publié comme *issue* GitHub à partir du modèle `.github/ISSUE_TEMPLATE/retour.yml`. Une action GitHub ajoute automatiquement l'étiquette correspondant au niveau.

Pour répondre : ouvrir l'issue sur GitHub et commenter, puis la fermer une fois traitée. Les retours, leur statut et les réponses s'affichent dans l'onglet « Retours publiés » du simulateur. La lecture est libre ; publier demande un compte GitHub.

## Modèle

Cinétique ponctuelle à 6 groupes de neutrons retardés, puissance résiduelle, chaîne iode-xénon, contre-réactions Doppler et modérateur (fonction du bore), efficacités intégrales des grappes en S, thermohydraulique primaire et secondaire en paramètres concentrés, gonflement et contraction du niveau GV, régulations (température, GCP, pressuriseur, RCV, ARE, GCT) et protections simplifiées.

Les valeurs sont représentatives mais simplifiées : ce n'est pas un outil de formation agréé.

## Technique

Thème clair et sombre (automatique selon le système, ou au choix). Un seul fichier `index.html` autonome (HTML, CSS, JavaScript sans dépendance ni build). Il suffit de l'ouvrir dans un navigateur. Les scores et préférences sont conservés localement dans le navigateur.
