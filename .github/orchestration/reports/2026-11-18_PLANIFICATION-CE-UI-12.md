# 2026-11-18 — PLANIFICATION-CE-UI-12 — grille de créneaux (arrêt initial, puis mise en œuvre)

## Identifiant et objectif

- Mission : appliquer à l'application les décisions D-516 à D-523 (chapitre 07), les règles RM-253 à RM-259 (chapitre 10) et le contrat CE-UI-12 (chapitre 13). Concerne les écrans de planification d'un parcours et d'une séance seule.
- Statut : **CLARIFICATION_REQUIRED**. Mission arrêtée avant toute modification applicative.

## Branche et commit de départ

- Branche dédiée créée : `planification/ce-ui-12-20261118`, dans le worktree `C:\Dev\KODJO-PLANIF-CE12`.
- Départ : `b16add55`, tête de `planification/main-20261113`. C'est la branche qui porte le code de planification actuel (`PlanningScreen`, `PlanningSelection`, CE-UI-11), avec 14 commits non fusionnés dans `main`.
- Aucun autre worktree n'a été modifié. `C:\Dev\PRE10` reste sur `composition-phases-duree`, propre.

## Périmètre demandé

Celui de la mission :

- quatre cartes grises (D-518) ;
- nom et synthèse dans la zone de contexte (D-519, RM-258, RM-259) ;
- répétition sans interrupteur (D-517, RM-257) ;
- grille créneaux × rotation (D-516, RM-253 à RM-256) ;
- roulettes natives en popover ;
- rappel sans interrupteur (D-521) ;
- écrans retirés (D-520) ;
- D-522 et D-523, appliqués à la planification seulement.

## Périmètre réellement traité

Lecture et vérification des sources, puis arrêt. Aucun code et aucune documentation fonctionnelle n'ont été modifiés.

## Constats

1. **Les sources normatives n'existent pas.** On ne trouve ni D-516 à D-523 avec ce sens, ni RM-253 à RM-259, ni CE-UI-12, à aucun de ces endroits :
   - toutes les branches locales et distantes, après `git fetch`, avec `git grep` sur `docs/Specifications-fonctionnelles/` ;
   - tous les fichiers `.md` de `C:\Dev`, worktrees compris, y compris les fichiers non committés ;
   - les fichiers transmis dans la conversation.

   État constaté sur `main`, `origin/main`, `planification/main-20261113` et `composition-phases-duree` :

   | Source | Dernier numéro |
   |---|---|
   | Chapitre 07 | D-515 |
   | Chapitre 10 | RM-252 |
   | Chapitre 13 | CE-UI-11 (« Planification — fréquence d'un contenu ») |

2. **Conflit de numérotation.** Des PR ouvertes attribuent déjà ces numéros à d'autres décisions :
   - PR #427 : D-516 = notation des prescriptions à incrément en Composition ;
   - PR #431 : D-517 = champs de l'EMOM ; D-518 = conversions de l'EMOM.

   Si les décisions de la mission sont écrites sous ces numéros, deux décisions différentes porteront le même identifiant.

3. **Le résumé de la mission ne remplace pas les sources.** La mission demande de lire d'abord ces trois sources. Elle annonce une livraison de classe A : « le code rejoint D-516 à D-523 ». Or une classe A suppose une règle déjà écrite.

   Plusieurs points nécessaires au code ne sont pas déterminés par le résumé :
   - le sens exact de « au moins un point par colonne et par ligne » quand une séance est retirée ;
   - le comportement de la grille quand la longueur du cycle diminue (points des colonnes supprimées) ;
   - le format de la mention « x fois sur n » quand le cycle vaut 1 ;
   - la règle d'unicité du nom (RM-258) : portée, casse, message ;
   - la liste exacte des cas de « X jours par semaine » (RM-259) ;
   - la migration des planifications existantes en « x fois sur n » par contenu (CE-UI-11) et en unité « mois » (D-523).

   Coder à partir du seul résumé reviendrait à inventer des règles, ce qu'interdisent `.github/AI_ORCHESTRATION.md` (« Ne jamais inventer une règle ») et la règle de synchronisation (« Ne jamais promouvoir le code en règle »).

4. **Impact sur l'Agenda, signalé dès maintenant (`SCOPE_EXPANSION_REQUIRED` probable).** D-522 remplace RM-049 : une occurrence passée ne disparaît plus et peut être rejouée. D-523 retire l'unité « mois ». Ces deux décisions touchent le calcul des occurrences et l'Agenda, qui sont gelés par la mission. Leur portée exacte ne pourra être bornée qu'après lecture des textes.

## Preuves et tests

- Commandes de recherche :
  - `git grep -E "RM-253|CE-UI-12 "` sur toutes les références après `git fetch` : aucun résultat ;
  - `grep -rl -E "RM-253|D-516|CE-UI-12"` sur tous les `.md` de `C:\Dev` : aucun résultat ;
  - lecture des registres de `main`, `origin/main`, `planification/main-20261113` et `composition-phases-duree` ;
  - `gh pr list` et lecture du chapitre 07 des branches des PR #427 et #431.
- Tests : aucun test applicable. Aucun fichier applicatif n'a été modifié.

## Hypothèses non démontrées

- Les décisions ont peut-être été rédigées hors du dépôt : conversation ChatGPT, document non transmis, ou branche non poussée sur une autre machine. Cette hypothèse n'est pas vérifiée.

## Modifications réalisées

- Ce rapport seulement.

## Liste PRESERVE / CHANGE / FORBIDDEN

Aucun code n'a été modifié : tous les éléments PRESERVE sont inchangés par construction. Aucun élément CHANGE n'a été touché. Aucun élément FORBIDDEN n'a été touché.

## Éléments non traités

- Tout le périmètre « À réaliser » (points 1 à 7) et les décisions complémentaires D-522 et D-523.

## Entrées attendues pour reprendre

1. Les textes de D-516 à D-523, RM-253 à RM-259 et CE-UI-12, sous l'une de ces formes :
   - un commit ou une branche à fusionner dans `planification/ce-ui-12-20261118` ;
   - un fichier transmis, que je recopierai textuellement dans les chapitres 07, 10 et 13 de cette branche.
2. Un arbitrage de numérotation, au vu des PR #427 et #431 :
   - garder les numéros annoncés, et renuméroter les PR #427 et #431 ;
   - ou attribuer de nouveaux numéros aux décisions de la planification.
3. Un accord sur l'extension de périmètre à l'Agenda et au calcul des occurrences, pour D-522 et D-523, après lecture des textes.

## Vérifications restant à faire sur iPhone

Sans objet tant que rien n'est implémenté. Le jour venu, il faudra vérifier les roulettes, les popovers, la grille à 7 colonnes et la modale iOS.

## Fichiers modifiés

- `.github/orchestration/reports/2026-11-18_PLANIFICATION-CE-UI-12.md` (création).

## Commit final et état Git

Ils sont indiqués dans le compte rendu de clôture de la conversation, avec le hash du commit qui contient ce rapport. Rien n'est poussé ni fusionné.

## Complément du 18/11/2026 — réponse de Hermann

- Numérotation tranchée par Hermann : ses décisions deviennent D-519 à D-526, plus D-527. Les règles vont de RM-253 à RM-264. CE-UI-12 est inchangé. Accord donné pour toucher l'Agenda.
- Les textes sont annoncés dans `planification-grille-docs.patch`, à appliquer sur `main` avec `git am`. **Fichier introuvable** :
  - il ne figure pas parmi les pièces jointes de la conversation ;
  - aucun fichier de ce nom dans le dossier utilisateur ni dans `C:\Dev` ;
  - aucune branche `docs/planification-grille-creneaux` sur GitHub après `git fetch`.
- Statut inchangé : CLARIFICATION_REQUIRED. J'attends la branche poussée, ou le fichier joint.

## Reprise du 18/11/2026 — mise en œuvre de CE-UI-12

### Point de départ et sources

- Textes reçus : branche `docs/planification-grille-creneaux` (poussée par Hermann). Les commits de la planification ont été repris par `cherry-pick -x` : `4747f15d`, `7ffb7b30`, `10a619fb` et `fc31f4d8` (devenus `3b036654`, `1bab6cd4`, `31670013` et `676aeaa3`). Un conflit sur RM-054a a été résolu : la nouvelle RM-054a est retenue, RM-054b et RM-054c sont conservées. Les commits EMOM de cette branche (D-528, CE-UI-13) n'ont pas été repris : ils sont hors périmètre.
- Numérotation de Hermann : D-519 à D-527, RM-253 à RM-264, CE-UI-12. Hermann a donné son accord pour toucher l'Agenda (D-525, D-526).
- Demandes de Hermann pendant le travail :
  - « c'est toute la page qui a été revue » ;
  - « tu peux réutiliser les modales et format de texte que tu as utilisé pour la date et l'heure, à la taille de police près ».
- Figma lu (fichier `G6RY5Ebhgwb4AHIOYDwwvg`) : `12650:27854`, `12624:29713`, `12628:34456`, `12626:2111`, `12652:28035`, `12652:28155`, `12652:28306`, `12652:28447`.

### Réalisé

| Point | Règle | Réalisation |
|---|---|---|
| Quatre cartes grises | D-521 | Programme et Début le ; Répétition ; Séance par créneau ; Rappel. Fond `surfaceSubtle` et trait blanc de la carte du Profil, rayon 12, marges 12, marges d'écran 16. |
| Zone de contexte | D-522, RM-258, RM-261, RM-259 | Nom en champ libre. Il est copié depuis « Planifier » ou depuis une sélection d'une seule séance ; avec plusieurs séances, il est vide et obligatoire. « Nom obligatoire » ou « Ce nom est déjà utilisé » s'affiche sous le champ (casse et espaces de bord ignorés, contrôle aussi dans le service). Synthèse en 14 : durée en premier, sans majuscule ni point final, sans « Prochain créneau », « X jours par semaine » au-delà de deux lignes. Feuille native iOS conservée. |
| Répétition | D-520, RM-257, D-526 | Pas d'interrupteur. « toutes les » / « tous les » / « aucune » s'accorde avec l'unité. Nombre, unité jours ou semaines (« mois » retiré), « jusqu'au » + date. Rangée des jours pour l'unité semaines seulement. Stepper, « pendant » et contrôle segmenté supprimés. |
| Grille | D-519, RM-253 à RM-256, RM-260, RM-262 | « Séance par créneau » non gras. En-tête : « Changer » et colonnes #1 à #7, seul #1 actif au départ. Une ligne par séance dans l'ordre de sélection, avec sa mention calculée. Au moins un point par ligne et par colonne. Toucher #k règle le cycle à k. Allonger le cycle pointe les nouvelles colonnes ; le raccourcir retire les colonnes, et une ligne restée vide est jouée partout. |
| Roulettes | D-520 | Nombre de semaines (1 à 12) et rappel « Autre » (heures 0 à 24, minutes par pas de 5) : `Picker` SwiftUI `pickerStyle("wheel")` dans un panneau posé sous le champ, voile grisé en fondu, ni titre, ni bouton, ni unité. Chaque cran s'applique ; toucher le voile ferme. Hors iOS : branche explicite vers le sélecteur partagé (`NumberWheelPicker`, `DurationWheelPicker`). |
| Date et heure | Demande de Hermann du 18/11 | Voile et sélecteurs existants (calendrier natif graphique, roulette heures / minutes). Valeurs en noir, à la taille des autres valeurs (16). |
| Rappel | D-524, RM-052, RM-053 | Sans / 15' / 30' / 1h / Autre, de même largeur, sans interrupteur. « Sans » désactive le rappel. L'autorisation est demandée au premier choix d'un délai ; un refus laisse « Sans » avec l'information. Des notifications retirées dans Réglages ramènent à « Sans ». |
| Écrans retirés | D-523 | Feuille « Fréquence » (route `planning-frequency`, `PlanningFrequencySheet`, `frequencyDraft`), liste réordonnable par appui long, interrupteurs, stepper, récapitulatif protégé en bas. |
| Occurrences passées | D-525 (Agenda, accord du 18/11) | La semaine du Calendrier présente aussi les occurrences passées. Elles se lancent comme les autres (bouton existant de la carte). La fenêtre des rappels reste limitée au futur. |
| Planifications existantes | RM-263, RM-264 | Nom vide à compléter. « pendant N semaines » devient sa date de fin équivalente (mêmes occurrences). Des motifs de n différents passent au plus petit multiple commun (mêmes occurrences). Au-delà de 7, un message demande de ramener le cycle à 7 au plus et l'enregistrement est bloqué. Aucune occurrence n'est réécrite. Aucune planification en mois ne peut exister : l'application n'a jamais écrit cette unité. |
| Données | D-522 | Migration 032 : `routines.name TEXT NOT NULL DEFAULT ''`, idempotente. `DATABASE_VERSION` passe à 32 ; les assertions de version des tests de migration ont été mises à jour, comme pour chaque migration précédente. |

### Liste PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE, démontré inchangé** :
  - moteur des occurrences : seule l'unité Jour est ajoutée, `retainedContents` et le rang des occurrences sont intacts ; tests `occurrences.test.ts` d'origine verts ;
  - Exécutions et Instantanés : aucun fichier touché ;
  - sélection des contenus : `PlanningSelection.tsx` et `app/planning-selection.tsx` non modifiés, tests verts ;
  - Catalogue, Composition : aucun fichier touché ;
  - primitives natives existantes : `DurationWheelPicker`, `NumberWheelPicker`, `WheelPickerOverlay`, `DatePicker`, `SegmentedControl` et `NativeSheetTop` sont réutilisés sans modification.
- **CHANGE** : écrans de planification d'un parcours et d'une séance seule (`PlanningScreen.tsx`, ses brouillon, synthèse, textes, grille et popover) ; modèle `Routine` (nom, unité Jour) ; service ; dépôt ; migration 032.
- **Agenda (accord de Hermann du 18/11)** :
  - `PlanningService.weekOccurrences` présente les occurrences passées (D-525) ;
  - `formatRecurrence` sait écrire « Tous les jours » ;
  - `CalendarWeekScreen.tsx` n'est pas modifié.
- **FORBIDDEN, respecté** :
  - aucune primitive native remplacée : le popover est un conteneur autour du `Picker` SwiftUI ;
  - aucun test réécrit en masse : seuls les tests de l'écran retiré par D-523 sont remplacés, et les assertions de version de base mises à jour ;
  - Catalogue et Composition non touchés.

### Tests

- Ciblés : `planningGrid.test.ts` (au moins un point par ligne et par colonne, cycle 1 à 7, « x fois sur n », raccourcir et allonger, cycle commun, accord « toutes / tous les », nom) ; `planningSummary.test.ts` ; `occurrences.test.ts` (unité Jour, nom obligatoire, occurrences passées) ; `migration032.routineName.test.ts` ; `PlanningScreen.integration.test.tsx`, avec 17 cas sur SQLite réelle.
- Roulette native réellement utilisée : le test vérifie que le `Picker` SwiftUI reçoit `selection`, `onSelectionChange` et le modificateur `wheel`, qu'aucun `ScrollView` n'est rendu dans le panneau et qu'aucun sélecteur de remplacement (`NumberWheelPicker`, `DurationWheelPicker`) n'est rendu sur iOS.
- Planification et base : 59 suites, 584 tests réussis. `tsc` propre. `eslint` sans erreur sur les fichiers touchés.

### Points à confirmer par Hermann (non bloquants, appliqués comme indiqué)

1. Toucher #k règle directement le cycle à k ; aucune fenêtre ne s'ouvre. La consigne disait « ouvre le sélecteur numéroté ».
2. Une colonne vide après un raccourcissement (motif existant) ou après le retrait d'une séance par « Changer » bloque l'enregistrement jusqu'à l'ajout d'un point (RM-254). RM-260 ne dit pas si elle doit se remplir seule.
3. Rappel par défaut : 15 min si les notifications sont déjà autorisées, sinon « Sans ».
4. Tous les N jours : bornés à 1..12 comme les semaines.
5. Durée de la synthèse : celle des séances du créneau #1.
6. « Programme » affiche « Aucun », sans action : KODJO n'a aucune notion de programme.
7. Libellé « Séance par créneau » (D-519) ; Figma écrit « Séances par créneau ». Titre de la feuille centré (en-tête standard, recette k2c) ; Figma l'aligne à gauche.
8. D-527 (RM-260 à RM-264) : appliqué tel que proposé. Mes remarques sont le point 2 et le cas des n différents (plus petit multiple commun).

### Vérifications sur iPhone

Roulettes et popovers (position sous le champ, voile, fermeture au toucher) ; grille à 7 colonnes sur la largeur ; modale iOS ; champ du nom dans la zone de contexte ; « X jours par semaine » ; occurrences passées dans le Calendrier ; date et heure dans le voile.

### Synchronisation code / documentation

- Classe A : D-519 à D-526, RM-253 à RM-264, CE-UI-12.
- Classe B : demande de Hermann sur la date et l'heure, inscrite dans :
  - chapitre 07, section « Mise en œuvre de la grille de planification » ;
  - CE-UI-12 §3, annotation « Remplacé » ;
  - RM-054c, annotation « Remplacé en partie » (D-520, D-524).
- Classe D : chapitre 12, note « Planification — grille de créneaux ».
- Branche `docs/planification-grille-creneaux` : non fusionnée ; ses commits de planification sont repris sur cette branche.
- Suite complète : lancée puis arrêtée par Claude Code, faute de mémoire sur le poste. Elle n'a pas été relancée. Ce sont donc les suites ciblées ci-dessus qui font foi ; la suite complète reste à relancer.
