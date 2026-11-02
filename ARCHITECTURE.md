# Architecture et règles du projet

Ce fichier dit comment le simulateur est organisé et comment le faire évoluer sans casser l'existant. Le README décrit le contenu ; ici, on parle de code.

## Règles du projet

- **On ajoute ou on améliore, on ne supprime pas de contenu existant** (chapitre, leçon, explication, aléa, commande). Un texte inexact est corrigé, pas retiré.
- **Sources publiques uniquement.** Aucune valeur tirée d'un document interne d'exploitant, de constructeur ou d'autorité. Les valeurs sont génériques et annoncées comme telles (fenêtre « Limites et méthode »).
- **TMI est cloisonné** : tout ce qui est propre au scénario Three Mile Island (`kind:'histo'`) est gardé par `s.tmi`, `s.era79` ou la classe `body.tmi` (éléments `.tmi-only`). Il ne doit rien changer aux autres scénarios.
- **Le simulateur électrique s'arrête aux deux voies et aux tableaux 6,6 kV** ; la visite explique la suite.
- **Pas de framework ni d'étape de construction** : la page doit s'ouvrir telle quelle en `file://`.
- **Changements visibles** : validés sur l'aperçu Netlify de la PR avant fusion.

## Chargement des scripts

Scripts classiques (pas de modules, à cause de `file://`), chargés dans l'ordre de `index.html`. Ils partagent la portée globale : un fichier ne peut utiliser **au chargement** que ce qui est défini dans les fichiers précédents ; dans une fonction appelée plus tard, tout est accessible.

| Ordre | Fichier | Rôle |
| --- | --- | --- |
| 1 | `js/outils.js` | `$`, `clamp`, `fmt`, `store` (stockage local protégé) |
| 2 | `js/electrique.js` | sources, tableaux, diesels, batteries ; `dispo(s, équipement)` |
| 3 | `js/physique.js` | constantes, `makeState`, `step`, protections ; testé seul sous Node |
| 4 | `js/scenarios.js` | alarmes (`ALM`), scénarios (`SCN`), chaîne TMI |
| 5 | `js/lecons.js` | `STEPX`, `ECLAIR`, niveau d'explication, `COACH` |
| 6 | `js/interface.js` | état de l'application `A`, `launch`, `tick`, `act`, `syncAll`, `updateUI`, mission, débriefing, menu |
| 7 | `js/corrections.js` | corrections commentées (`DM`), voix |
| 8 | `js/aide.js` | aide des cartes (`HELP`), lexique (`GLOSS`) |
| 9 | `js/bandeau.js` | cases du bandeau (`BG`), pictogrammes (`pic`) |
| 10 | `js/sons.js` | sons synthétisés (`SFX`) |
| 11 | `js/visite-chapitres.js` | textes des chapitres (`TOUR`, `NEWCH`) et ordre des thèmes (`THEMES`) |
| 12 | `js/visite.js` | moteur de la visite, schémas (`INSET`), animations (`ANIM`) |
| 13 | `js/domaine-pt.js` | domaine pression-température |
| 14 | `js/synoptique.js`, `js/vue-electrique.js` | synoptique cliquable, vue Électrique |
| 15 | `js/panneaux.js` | retours, thème, « Pourquoi l'AAR ? », carte « En cours », tendances |
| 16 | `js/demarrage.js` | construction des éléments, boucle, démarrage (toujours en dernier) |

Un nouveau fichier se place juste après ce dont il a besoin au chargement, et s'ajoute au tableau ci-dessus et au README.

## Données et état

- `A` (interface.js) : l'application (`A.s` état physique, `A.scn` scénario, `A.ctx` contexte de séance, vitesse, pause).
- `s` (physique.js) : l'état de la tranche ; un pas `step(s)` dure `DT` = 0,05 s. Unités : puissance en fraction de la nominale (1 = 100 % PN), températures en °C, pressions en bar, niveaux en %.
- `s.el.av` : disponibilités électriques. **Toujours passer par `dispo(s, …)`** dans les commandes comme dans le moteur, pour que l'une ne laisse pas faire ce que l'autre interdit.

## Recettes

**Ajouter une commande opérateur.** Un bouton `data-act="nom"` (et `data-v` si besoin) dans `index.html` ; un `case 'nom':` dans `act()` (interface.js), qui refuse par `toast()` ce qui est impossible et journalise par `op()` ; si l'état change un libellé ou un bouton, le mettre à jour dans `syncAll()`.

**Ajouter un scénario.** Une entrée dans `SCN` (scenarios.js) : `id`, `kind` (`lecon`, `exo`, `alea`, `histo`, `libre`, `tuto`), `title`, `desc`, `init`, puis selon le type `steps`, `fire`, `update`, `end`, `evaluate`. Les textes d'accompagnement vont dans lecons.js, la correction commentée dans `DM` (corrections.js).

**Ajouter un chapitre de visite.** Une entrée dans `NEWCH` (visite-chapitres.js) avec sa clé, `t`, `inset` et `h` ; ajouter la clé à sa place dans `THEMES` (chaque thème est rangé dans une des trois `PARTIES` : Comprendre, Piloter, Sûreté ; le sommaire de la visite se construit seul). Le schéma va dans `INSET` ou l'animation dans `ANIM` (visite.js). Un test vérifie que chaque clé de `THEMES` existe.

**Ajouter du style.** Classes globales déjà prises, à ne pas réutiliser pour autre chose : `.prog`, `.crit`, `.tag`, `.chip`, `.sec`. Les couleurs passent par les variables CSS des thèmes clair et sombre.

## Vérifier un changement

- `npm test` : physique sous Node, puis interface dans Chromium à 320, 390 et 1 440 px.
- `npm run instantane -- avant.json` puis, après le changement, `npm run instantane -- apres.json` et `node tests/instantane.mjs --compare avant.json apres.json` : rejoue les 32 scénarios 30 minutes sans action opérateur (hasard fixé) et compare l'état final, les chapitres, l'aide, le lexique et les corrections. Un changement censé ne rien modifier doit donner « identique ».
