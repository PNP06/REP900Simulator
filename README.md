# Simulateur REP 900

Simulateur pédagogique de conduite d'un réacteur à eau pressurisée de 900 MWe (trois boucles, palier CPY, pilotage en mode G), jouable dans le navigateur sur ordinateur et téléphone.

**Jouer :** https://pnp06.github.io/REP900Simulator/

## Contenu

- **Visite guidée de la centrale** : 18 chapitres illustrés et animés, sans manipulation (fission, réaction en chaîne, neutrons retardés, combustible, modérateur, circuits, mode G, xénon, sûreté, puissance résiduelle).
- **Tutoriel** de prise de quart, avec repères animés et flèche vers les commandes.
- **8 leçons guidées** : cinétique et temps de doublement, contre-réactions et mode G, ΔI et diagramme de pilotage, xénon 135, pressuriseur et RCV, générateurs de vapeur et eau alimentaire, protections et permissifs, divergence guidée.
- **4 exercices notés** : divergence, couplage et montée en charge, suivi de charge et xénon, mise à l'arrêt à chaud.
- **9 aléas** avec débriefing : perte de TPA, îlotage, chute de grappe, aspersion bloquée ouverte, fuite sur la décharge RCV, défaillance de la régulation ARE, dilution intempestive, retrait incontrôlé à puissance nulle, déclenchement d'une pompe primaire. Plus un aléa mystère et le pilotage libre.
- Aide « ? » sur chaque carte, lexique de 88 termes, bandeau catégorisé avec jauges.
- Sons synthétisés : alarmes, AAR, réussite d'étape, ambiance des machines, comptage neutronique audible.

## Modèle

Cinétique ponctuelle à 6 groupes de neutrons retardés, puissance résiduelle, chaîne iode-xénon, contre-réactions Doppler et modérateur (fonction du bore), efficacités intégrales des grappes en S, thermohydraulique primaire et secondaire en paramètres concentrés, gonflement et contraction du niveau GV, régulations (température, GCP, pressuriseur, RCV, ARE, GCT) et protections simplifiées.

Les valeurs sont représentatives mais simplifiées : ce n'est pas un outil de formation agréé.

## Technique

Un seul fichier `index.html` autonome (HTML, CSS, JavaScript sans dépendance ni build). Il suffit de l'ouvrir dans un navigateur. Les scores et préférences sont conservés localement dans le navigateur.
