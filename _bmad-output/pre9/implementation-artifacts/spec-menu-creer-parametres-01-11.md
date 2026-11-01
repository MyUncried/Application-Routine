# PRE-9 — Menu Créer et Paramètres d'exécution (01/11/2026)

## Menu Créer

Mis en œuvre sur `pre9-bmad/dev` (départ `90f4135f`). Règles écrites : documentation de `main` intégrée par `90f4135f` (`3759d1fa`, « docs: actualiser paramètres d'exécution et menu Créer »).

### Ordre (texte de Hermann, 01/11/2026, point 1)

> « 1. Menu Créer et transformation du bouton
> Présenter exactement quatre options, dans cet ordre : 1. Créer un exercice ; 2. Utiliser une séance existante ; 3. Ajouter un circuit ; 4. Ajouter un cycle.
> Chaque option possède son icône ronde à droite. Créer un exercice reprend la silhouette de l'ancienne option Utiliser un mouvement existant.
> Supprimer les entrées Utiliser un mouvement existant et Annuler. La recherche de mouvements reste disponible par la saisie du nom dans Créer un exercice.
> À l'ouverture : le bouton + devient une croix Annuler standard sur fond gris, de 34 px, au même emplacement, au-dessus du voile ; son action ferme le menu sans ajout ni mutation ; à la fermeture, il reprend sa forme + et son action d'ouverture ; Pause / Ajouter un arrêt reste à gauche, sous le voile ; l'axe vertical est au-dessus du voile, sous les options, relie Annuler aux icônes et s'arrête à Ajouter un cycle.
> L'éditeur ouvert et la confirmation du mouvement sélectionné affichent « Créer un exercice ».
> Ne pas ajouter d'entrée Format : son accès de remplacement reste réservé par MENU-FMT-01. »

Confirmation de Hermann du 01/11/2026 sur le rendu d'Annuler : « c'est la croix qui est correcte » (croix sur fond gris confirmée, contre le fond blanc de Figma `11059:18868`).

### Classe : A — conformité

Le code rejoint des règles déjà écrites sur la branche :

- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`, CE-T03-08, « **Menu Créer — état cible** » (ancre `composition-menu-creer`, l.1817-1825) : quatre options dans l'ordre ; icône ronde à droite, silhouette pour « Créer un exercice » ; pas d'entrée « Utiliser un mouvement existant » ; « + » → Annuler (croix standard, fond gris, 34 px, emplacement exact du +, au-dessus du voile) ; fermeture sans action, retour du + ; Pause / Ajouter un arrêt à gauche sous le voile ; axe au-dessus du voile, sous les options, d'Annuler à « Ajouter un cycle » ; aucune option Annuler ; écran ouvert et confirmation du mouvement : « Créer un exercice » ; **À CLARIFIER — MENU-FMT-01** (pas d'entrée Format).
- Même chapitre, l.5269 : « Depuis le menu Créer de la Composition, le titre de l’écran et la confirmation du mouvement sont « Créer un exercice ». Les autres contextes conservent leurs libellés propres. »
- Texte identique : ch06 l.13-17, ch08 l.7-11, ch10 l.27-31, ch07 l.181-185 (registre), `docs/KODJO-Composition-conteneurs-2026-10-28.md` l.70-74 (§5), `docs/PRODUCT.md` l.13.

Aucune modification de `docs/` : la règle y est déjà écrite (lot `3759d1fa`).

### Réalisation

- `src/features/sessions/CreateMenu.tsx` : plus de rangée « Annuler » ni de « + » reposé ; Annuler = cercle de 34 (`#E5E8F0`, contour `#BABFCC`, ombre du menu) portant la croix standard `icon/fermer` (`KodjoIcon` `control-close`, 24), cible de 44 centrée sur le « + » mesuré (contre-recette du 30/10 conservée) ; rendu après l'axe et les options, au-dessus du voile ; nom accessible « Annuler ». Axe : du centre d'Annuler (recouvert par son cercle) au centre de la dernière icône. Icône « exercise » (haltère) supprimée, « Créer un exercice » prend la silhouette (`menu-mouvement.svg`). Repli sans mesure : Figma `11059:18868` (47 au-dessus de la première rangée, au lieu de 40).
- `src/features/sessions/CompositionScreen.tsx` : options « Créer un exercice » (icône silhouette, même action : `/movement?context=session`), « Utiliser une séance existante » (indisponible, B.8), « Ajouter un circuit », « Ajouter un cycle ». Entrée « Utiliser un mouvement existant » retirée (et l'import `markMovementsInSession` devenu inutile). Pas d'entrée Format.
- `src/features/activities/MovementScreen.tsx` : en contexte Séance (`onMovementChosen` fourni), titre `movement.titles.sessionCreate` et bouton de confirmation `movement.sessionFinish`, tous deux « Créer un exercice » ; Catalogue et autres contextes inchangés (« Créer un mouvement », « Terminer »). Les actions distinctes « Créer un nouveau mouvement » du dialogue de sauvegarde ne sont pas renommées (ch13 l.1821).
- `src/shared/i18n/resources/fr.ts` : `addToSession.newActivity` = « Créer un exercice » ; ajout de `movement.titles.sessionCreate`, `movement.sessionFinish`. `existingActivity` conservé (titre de l'écran `/movement-selection`).
- Inchangés : voile et fondu d'apparition de 600 ms (recette du 29/10, f) ; axe bleu `#1414F5` (recette du 29/10, cre-figma) ; options inactives (obs-4) ; « Pause / Ajouter un arrêt » sous le voile (non reposé au premier plan).

### Contrôle Figma (lecture seule, `G6RY5Ebhgwb4AHIOYDwwvg`, `10705:20223`)

Conforme : quatre options dans l'ordre ; pilules 243 × 32, écart 10, première rangée à 212 ; icônes rondes 32 centrées sur x = 361 ; silhouette (`11035:43233` / `11035:43234`, fond + pictogramme de 20 à 6) pour « Créer un exercice » ; « Action / Fermer — Annuler » (`11059:18868`) de 34 à l'emplacement du « + » (centre 361, 165), croix `icon/fermer` (tracé 6 → 18 dans 24, trait 2,2) ; axe s'arrêtant au centre de l'icône du cycle (y 354) ; aucune rangée Annuler ; « Pause / Ajouter un arrêt » sous le voile.

Écarts assumés :
- Fond d'Annuler : Figma `#FCFCFE` (blanc, liseré blanc) ; règle écrite et ordre : « fond gris » → `#E5E8F0` / `#BABFCC`, gris de l'ancien Annuler de Figma `10705:20223` (confirmé par Hermann le 01/11 : « c'est la croix qui est correcte »).
- Couleur de l'axe : gris `#9499A8` dans Figma, bleu `#1414F5` conservé (recette du 29/10, cre-figma, décision de Hermann qui prime sur Figma).
- Départ de l'axe : Figma le fait partir à y 194 (bas de l'ancienne cible du +, 12 sous Annuler) ; l'implémentation le fait partir sous le cercle d'Annuler pour qu'il « relie Annuler aux icônes ».
- Ombre d'Annuler : ombre des boutons du menu (0, 2, rayon 2, 14 %) au lieu de celle du composant (0, 2, rayon 10, 8 %).

### Hors périmètre, constats

- L'écran `/movement-selection` (`MovementSelectionScreen`) n'est plus atteint depuis la Composition ; conservé (aucune demande de retrait). Ses tests unitaires restent valides.
- MENU-FMT-01 reste À CLARIFIER (accès Format de remplacement non spécifié) : aucune entrée ajoutée.
- `assets/composition/menu-annuler.svg` n'est plus référencé ; non supprimé.

### Formulations contraires annotées (dev, `_bmad-output/pre9`)

Annotation datée entre crochets, texte d'origine conservé : `recette-iphone-apres-b2.md` (l.22), `spec-a-2-exercice-depuis-mouvement.md` (l.12), `spec-a-2b-durees-phases-mouvement.md` (l.80-81), `spec-b-2-menu-creer-enveloppe.md` (l.8, 27), `spec-b-3-series-par-circuit-cibles-zero.md` (l.75), `spec-recette-1-corrections.md` (l.61), `planning-artifacts/recherche/02-decisions-seance-composition.md` (B21), `planning-artifacts/recherche/04-figma.md` (l.13, 79). Commentaires de code : `CreateMenu.tsx`, `CompositionScreen.tsx`, `fr.ts`, `movementExercises.ts`, `MovementSelectionScreen.tsx`.

### Tests

- `CreateMenu.test.tsx` : axe d'Annuler à la dernière option ; Annuler = croix 34 sur gris, sans pilule ni libellé, plus de « + » reposé ; Annuler recouvre le « + » mesuré ; repli Figma (47).
- `CompositionScreen.b2.test.tsx` : exactement quatre options dans l'ordre (puis Annuler, hors liste), icône ronde pour chacune, pas de « Utiliser un mouvement existant » ni de Format ; « Créer un exercice » → `/movement?context=session` ; transformation + → Annuler (34, gris), fermeture sans navigation ni mutation du brouillon (même objet), retour du + et réouverture.
- `CompositionScreen.test.tsx`, `ExerciseEditingPaths.integration.test.tsx` : entrée « mouvement existant » absente ; Annuler ferme sans action.
- `CompositionMovementFlow.integration.test.tsx`, `movementPhaseDurations.a2b.integration.test.tsx` : les parcours « Utiliser un mouvement existant » passent par « Créer un exercice » + saisie du nom + toucher de la carte de suggestion ; titre et confirmation « Créer un exercice » en contexte Séance. Les assertions propres à la sélection multiple (ordre du Catalogue, coin « dans la séance ») sont retirées : parcours non atteint depuis la Composition.
- Résultats (`--maxWorkers=1`) : CreateMenu + CompositionScreen.b2 + CompositionScreen 495/495 ; CompositionMovementFlow + ExerciseEditingPaths + movementPhaseDurations.a2b 48/48 ; MovementScreen.b2.integration + i18n `index.test` 102/102. `tsc` et eslint propres sur les fichiers touchés.

Jest ne prouve pas le rendu sur iPhone : recette sur appareil à faire (Annuler à l'emplacement exact du +, fondu, axe).

## Paramètres d'exécution — blocs, Objectif de durée, côtés

Ordre de Hermann du 01/11/2026, points 3 à 5 (texte cité) :

> « 3. Phases dans leur bloc — La ligne « Phases du mouvement » et son tableau Libellé/Durée forment un bloc autonome entre Exécution et Séries. Séries commence par la ligne Séries. Ordre final des six blocs : Exécution → Phases du mouvement → Séries → Côtés → Cadence et durée → Récupération. Conserver les comportements des phases. Le libellé normatif est « Phases du mouvement », même si Figma indique encore « Phases de l'exercice ».
> 4. Libellé de durée — En séries identiques, mode Durée, remplacer « Durée d'une série » par « Objectif de durée ». Il s'agit du titre de la cible commune : la ligne calculée « Durée de l'exercice » conserve son nom. Les en-têtes du tableau des séries variables ne changent pas.
> 5. Options de changement de côté — Afficher dans Avec et dans le déroulant : DD… → GG… : un côté après l'autre, par défaut ; DG → DG → … : les deux côtés à chaque série. Utiliser la taille standard des options, sans réduction de police, avec largeur adaptée au contenu, environ 104 px dans la référence. D et G désignent graphiquement les côtés 1 et 2, jamais droite et gauche. Libellés accessibles : « Chaque série d'un côté, puis chaque série de l'autre » ; « Les deux côtés à chaque série ». La ligne visible s'intitule « De chaque côté », sur une ligne. Conserver le concept Changement de côté et les règles existantes à N=1. »

### Règles appliquées (sources normatives, fusionnées de `main`, commit `3759d1fa`)

- CE-UI-10 (ch13) : six blocs successifs (D-413), lignes 2b « Phases du mouvement », 5 « Cible et Pause » (Objectif de durée), 7 « De chaque côté », 8 « Enchainement » (notations, libellés accessibles, ~104 px, N = 1 selon D-415), 14 « Récupération » (REC-PARAM-01).
- ch07 D-413 (six blocs, 8 px), D-431 (notations), D-415 (N = 1) ; DSF-INTERFACE-GENERALE, DSF-SEGMENTES-TITRES, DSF-PARAMETRES-MODALE (taille standard des notations, ligne sur une ligne).

### Classe : A — Conformité

Le code rejoint des règles déjà écrites sur `main` (ch13, ch07, DSF). Aucune spécification produit modifiée par cette livraison.

### Modifications

- `src/features/activities/ExecutionParametersSheet.tsx` :
  - bloc autonome `execution-sheet-frame-phases` (cadre gris, marge 8) entre Exécution et Séries, contenant la ligne « Phases du mouvement », le tableau des phases et le message de retrait ; le séparateur `execution-sheet-phases-separator` est retiré (l'écart entre blocs le remplace) ; comportements des phases inchangés (repli initial, rouge/orange du champ « n phases », stepper, glisser) ;
  - `SheetFrame` / `SHEET_FRAMES` : ajout de `phases` (repère des panneaux, réserve sous les cadres) ;
  - ligne de cible commune en Durée : `t.durationGoal` (« Objectif de durée ») pour le titre et le nom accessible de la pastille ;
  - Changement de côté : ligne et nom accessible du segmenté `t.sideModeRow` (« De chaque côté ») ; option Avec et déroulant de l'Enchainement en Semi Bold / Regular 12 (plus de `compact`, plus de police 10), largeur adaptée au contenu (`sideOrderOptionWidth` : marge 8 + notation + écart 6 + chevron 10 + marge 8 → 104 pour « DD… → GG… », 116 pour « DG → DG → … ») ; place réservée de la ligne = option la plus large + Sans 62 + 2 + 6 = 186 ;
  - **point d'insertion du bloc 6 « Récupération »** : commentaire `PRE-9 — POINT D'INSERTION DU BLOC 6 « Récupération »`, juste après la fermeture du cadre `execution-sheet-frame-cadence` et avant la réserve `execution-sheet-panel-room`. Bloc non rendu (modèle de données du point 2 non livré ici).
- `src/shared/i18n/index.ts` : `durationGoal` (« Objectif de durée ») ajouté — `durationTarget` (« Durée d'une série ») reste employé par l'étape de complétion (`SiblingCompletionStep`), hors périmètre de l'ordre ; `sideModeRow` (« De chaque côté ») ; `sideOrderSubtitles` = « DD… → GG… » / « DG → DG → … » ; `sideOrders.BY_SIDE` = « Chaque série d'un côté, puis chaque série de l'autre ». Les en-têtes `columns` du tableau variable et `exerciseDuration` sont inchangés.
- Tests : `ExecutionParametersSheet.test.tsx` (nouveau groupe « PRE-9, ordre de Hermann du 01/11/2026 (points 3 à 5) » ; anciens tests de largeur 146/216, police 10, notations « (D1 → D2) ➜ (G1 → G2) », libellé « Un côté après l'autre », « Changement de côté », « Durée d'une série » adaptés avec annotation datée), `ExecutionParametersSheet.phases.test.tsx` (bloc Phases autonome, séparateurs), `src/shared/i18n/index.test.ts`.

### Contrôle Figma (lecture seule, `G6RY5Ebhgwb4AHIOYDwwvg`, `8328:37972`, `8328:38193`, `9207:18817`)

- Conforme : six cadres de 354 espacés de 8 (Mode et cible ; Phases ; Séries ; Côtés ; Cadence et durée ; Récupération) ; tableau des phases dans le bloc Phases ; ligne « Objectif de durée » ; ligne « De chaque côté » ; option Avec 104 × 26 (marge 8, notation Semi Bold 12 de 72, écart 6, chevron 10), Sans 62, segmenté 174 ; déroulant 104 × 88, rangées de 44, notation à x 8.
- Écarts assumés : Figma nomme encore « Phases de l'exercice » (libellé normatif « Phases du mouvement », ordre de Hermann) ; « DG → DG → … » mesure 82 en Regular dans le déroulant Figma, porté à 84 en Semi Bold dans l'option sélectionnée (estimation d'intégration, aucune frame Figma de ce cas) — d'où 116 au lieu de 104 quand cette notation est choisie (« largeur adaptée au contenu »).

### Hors périmètre / à faire

- Point 2 (bloc Récupération, valeur Profil en orange jusqu'au premier ✓) : autre agent, au point d'insertion indiqué. À vérifier alors : `revealSignals` suppose que Cadence et durée est le dernier cadre du corps.
- `INLINE_OPTION_WIDTHS.notation` (146, `SegmentedControl` partagé) n'est plus employé par la Feuille ; laissé en place (composant partagé, aucun refactor hors périmètre).

### Formulations de développement annotées

- `spec-b-3-series-par-circuit-cibles-zero.md` : citation « Durée d'une série » annotée (libellé « Objectif de durée » depuis le 01/11/2026).
- Commentaires du code et des tests contraires annotés « [Remplacé le 01/11/2026 …] ».

## Récupération de l'Exercice et défauts du Profil

Ordre de Hermann du 01/11/2026, point 2 (texte cité) :

> « 2. Récupération dans son bloc — Ajouter le bloc Récupération après Cadence et durée, avec sa seule ligne « Récupération » et le contrôle de durée existant.
> La récupération appartient directement à l'Exercice. La Composition affiche exactement la même valeur ; aucune seconde source ni double récupération.
> * Nouvel Exercice : initialiser depuis « Récupération après un exercice » du Profil.
> * Exercice existant : conserver sa valeur ; sans récupération antérieure, afficher 0 s.
> * Déplacement et duplication : conserver cette valeur.
> * 0 s : aucune récupération exécutée ; règles de Pause terminale inchangées.
> Retirer du bouton Pause / Ajouter un arrêt et du mode Placement toute possibilité d'ajouter, modifier ou retirer une récupération. Ils ne gèrent désormais que les Points d'arrêt. La modale devient l'unique accès de réglage.
> Adapter le stockage et les lecteurs si nécessaire, sans perdre les valeurs existantes ni réécrire les historiques.
> Toute valeur initialisée depuis le Profil apparaît dans un cadre orange jusqu'au premier ✓ validant les paramètres de l'Exercice. Cette règle concerne tous les défauts Profil repris dans la feuille. ✕ annule ; ✓ applique au brouillon parent ; l'enregistrement définitif reste celui de la Séance.
> REC-PARAM-01 est clos : ne plus différer ce développement. »

### Sources normatives (fusionnées de `main`, commit `f5239bfa`)

ch07 « Récupération de l'Exercice et défauts du Profil » (ancre `recuperation-exercice-et-defauts-profil`, remplace D-208, D-304, D-307, D-435, D-442 et RM-209 sur ce périmètre, clôt REC-PARAM-01), D-304, D-307, D-441 (libellé de Confirmer sans récupération), RM-209 (ch10), ch09 (DM-001, ligne « Récupération après exercice par défaut »), ch11, ch12, ch13 CE-UI-10 ligne 14 et CE-T03-08 (Placement « ne porte que sur les Points d'arrêt »), ch08, `DSF-PARAMETRES-MODALE` « Défauts Profil et Récupération », `KODJO-Composition-conteneurs-2026-10-28.md`, `PRODUCT.md`.

### Classe : A — Conformité

La règle (classe B, décision de Hermann) est déjà écrite sur `main` et fusionnée dans `pre9-bmad/dev` : le code la rejoint. Seul ajout documentaire : une note d'implémentation datée dans ch12 (choix technique de stockage, sans règle nouvelle).

### Décisions d'implémentation (avec preuves)

- **Stockage — aucune migration.** L'occurrence de Séance porte déjà une seule valeur de récupération (`SessionDraftExercise.postActivityRecoverySeconds`, colonnes `post_activity_recovery_seconds` / `post_activity_recovery_present`, `migration011`) ; c'est désormais la Récupération propre de l'Exercice (Exercice de Séance = occurrence portant ses paramètres). Une seule source, déjà lue par la carte (`OccurrenceRecovery`), les calculs (`calculations.ts`, `planExpansion.ts` : `?? 0`), l'instantané (`sessionSnapshot.ts`) et l'exécution (phase seulement si R > 0, Pause terminale RM-038 inchangée). `null` (ancien Exercice sans récupération) s'affiche 0 s et n'est jamais remplacé par le défaut du Profil ; un ✓ à 0 s laisse `null` tel quel (`withExerciseRecovery`, aucun brouillon modifié pour rien). Aucune donnée réécrite, aucun historique touché ; le numéro de migration 020 reste libre (A.4 / A.5 inchangés).
- **Défauts du Profil en attente — état du brouillon, non persisté** (`SessionDraftExercise.profileDefaultsPending`, comme `phasesToVerify` : ni comparé par `exerciseEquals`, ni transmis à `toCreateSessionInput`). Preuve qu'aucune persistance n'est nécessaire : un nouvel Exercice naît avec une Cible `UNSET` (`createEmptyExecutionParameters`), Continuer reste indisponible tant qu'elle n'est pas renseignée (D-389, ch13 CE-T03-08), et seul le ✓ de la feuille la renseigne — ce ✓ valide aussi les défauts. Abandonner le brouillon restaure l'état enregistré (où l'attente n'existe pas). La duplication d'un Exercice encore en attente garde l'attente (même valeur reprise du Profil).
- **Exercices du Catalogue et fiche Mouvement** : pas de bloc Récupération (la récupération n'appartient qu'à l'Exercice de Séance, ch07 « dans le modèle cible de Séance ») ; la règle de l'orange s'y applique aux défauts du Profil effectivement repris et affichés : Compte à rebours et Fin d'un nouvel Exercice du Catalogue (`withProfilePhases`), jusqu'au premier ✓.
- **Défauts du Profil repris dans la feuille** (relevé du code) : Récupération après un exercice (création d'un Exercice de Séance : `exerciseOfMovement`, ancien éditeur) ; Compte à rebours et Fin d'exercice (création ; affichés seulement hors Séance) ; Pause entre les côtés (copiée du Profil à l'activation de « De chaque côté », `setSideMode`) — orange seulement si l'activation a lieu avant le premier ✓. Ne sont pas des défauts du Profil : Pause entre séries, Cadence, nombre de séries (constantes du domaine), Compte à rebours initial et Fin de Séance (réglages de Séance, hors feuille).
- **Rendu orange** : fond `toVerifyColors.surface` (orange pâle de « Paramètre à vérifier ») sur le cadre de la valeur (pastille `ValuePill` / `RevealStepper`), sans liseré, texte inchangé ; la valeur à renseigner (rouge) prime ; indice VoiceOver « Valeur par défaut du Profil, à confirmer par ✓. ». Rendu choisi sans maquette Figma de cet état : à juger en recette.

### Modifications

- `src/features/activities/ExecutionParametersSheet.tsx` : bloc 6 `execution-sheet-frame-recovery` (au point d'insertion laissé par l'agent des blocs), seule ligne `execution-sheet-row-recovery` « Récupération », pastille `execution-sheet-recovery` et roulette existante `DurationWheelPicker` (grille `RECOVERY_WHEEL_VALUES` 0..300 s, panneau sous la ligne sur iOS, en ligne ailleurs ; valeur historique hors grille conservée si la roue n'est pas tournée) ; `SheetFrame`/`SHEET_FRAMES` + `recovery`, `PanelControl` + `recovery`, sélecteur `recovery` (`sheetSurface.ts`) ; props `recovery` (`{ seconds, onApply }`, ✓ → `onApply(seconds)` avant `onApply` des paramètres ; ✕ : rien) et `profileDefaultsPending` (fond orange) ; commentaire de `revealSignals` annoté.
- `src/shared/i18n/index.ts` : `sheet.recovery` (« Récupération »), `sheet.profileDefaultHint`.
- `src/domain/sessions/SessionDraft.ts` : `profileDefaultsPending?`, `withProfileDefaultsValidated`, `withExerciseRecovery`.
- `src/features/sessions/movementExercises.ts` : `MovementExerciseDefaults.recoverySeconds` ; nouvel Exercice = Récupération du Profil + `profileDefaultsPending` (formulation « aucune Récupération automatique » annotée).
- `src/features/sessions/useMovementExerciseIntake.tsx` : défaut Profil de récupération lu ; feuille avec `recovery` et `profileDefaultsPending` ; ✓ applique la récupération et retire l'attente.
- `src/features/activities/ActivityEditorForm.tsx`, `src/features/sessions/ExerciseScreen.tsx` : même bloc dans l'éditeur d'Exercice de Séance (copie locale, appliquée au brouillon par Terminer) ; nouvel Exercice de l'ancien éditeur : Récupération du Profil + attente ; Catalogue : Compte à rebours et Fin repris du Profil en orange jusqu'au premier ✓.
- Placement : `src/domain/sessions/placement.ts`, `layoutPlacement.ts` (plus de zone, de sous-brouillon ni de fonction de récupération ; Confirmer ne compte que les Points d'arrêt ; `applyPlacementDraft` ne touche plus les Exercices) ; `src/features/sessions/CompositionScreen.tsx` (zones, roulette, lecture du défaut du Profil à l'entrée et annonces de récupération retirées ; « Ajouter un arrêt » disponible seulement si un Point peut être ajouté ou retiré ; la ligne 3 de la carte affiche toujours la valeur de l'Exercice) ; `PlacementLayer.tsx` (`PlacementRecoveryFrame` retiré). Libellés i18n de la récupération en placement laissés en place (inutilisés).
- Documentation de code : `src/domain/README.md`, `src/features/sessions/README.md` annotés ; ch12 : note d'implémentation datée.

### Formulations de développement annotées (`_bmad-output/pre9`)

`spec-b-6-pauses-points-arret.md` (placement sous chaque carte « zone de récupération », scénario de recette 10), `planning-artifacts/epics.md` (B.6), `prd-pre9.md` (FR-B8), `recherche/02-decisions-seance-composition.md` (B45), `recherche/01-etat-du-code.md` (placement) : annotation datée « [Remplacé le 01/11/2026 pour la récupération …] ». Commentaires de code et de tests contraires annotés de même.

### Tests

- Nouveaux : `ExecutionParametersSheet.recovery.test.tsx` (10 : bloc 6 après Cadence et durée, seule ligne, 0 s sans récupération, absent hors Séance, roulette 0..300 s, ✓ applique avant les paramètres, ✕ n'applique rien, valeur hors grille conservée ; orange : Récupération, Pause entre les côtés activée avant ✓, Compte à rebours / Fin du Catalogue, texte inchangé, rouge prioritaire) ; `ExerciseRecovery.integration.test.tsx` (2, routeur + SQLite : Récupération du Profil (45 s) sur la carte et dans la feuille, orange jusqu'au premier ✓, ✕ garde l'attente, ✓ valide, réouverture normale, modification suivie par la carte, Profil changé ensuite sans effet ; Placement sans zone de récupération, Points seuls, récupérations inchangées) ; `src/domain/sessions/__tests__/exerciseRecovery.test.ts` (3 : `withExerciseRecovery`, déplacement et duplication conservent la valeur, attente jamais comparée ni enregistrée).
- Adaptés (annotations datées) : `placement.test.ts`, `layoutPlacement.b6.test.ts`, `CompositionScreen.test.tsx` (22 tests de récupération en placement retirés, 15 adaptés, 1 ajouté), `CompositionScreen.b6.test.tsx`, `CompositionPausesFlow.integration.test.tsx` (récupération réglée par la feuille, points par le placement, enregistrement et relecture ; retour à 0 s), `ExerciseEditingPaths.integration.test.tsx` (AC11 : nouvel Exercice à 30 s, copie Catalogue à 0 ; bloc Récupération à 0 s), `CompositionMovementFlow.integration.test.tsx` (libellés avec « récupération 30 s »), `movementExercises.a2.test.ts`, `CompositionScreen.recette1.test.tsx`, `ExecutionParametersSheet.test.tsx` (commentaire).
- Résultats (`--maxWorkers=1`, ciblés) : CompositionScreen 449/449 ; CompositionScreen.b6 7/7 ; ExecutionParametersSheet* + ActivityEditorForm + sheetSurface 527/527 ; placement + layoutPlacement.b6 + movementExercises.a2 + exerciseRecovery 72/72 ; CompositionPausesFlow 3/3 ; CompositionMovementFlow + ExerciseEditingPaths 46/46 ; ExerciseRecovery 2/2 ; ExerciseScreen + ActivitySelectionScreen + SessionDraft + composition 258/258 ; CompositionScreen.b1b/b2/b4/recette1/recette2/recette2composition, CatalogueCompositionEditFlow, CompositionExerciseFlow, CompositionSaveFlow, PlacementBar, ExerciseScreen r5/r6/r10/mfn.a31, SessionCompositionTree.e3, SessionDraftProvider, i18n : verts. `tsc` sans erreur ; eslint propre sur les fichiers touchés ; motif `target === null/0 / target ??` absent du code ajouté. Suite complète : à lancer par le coordinateur.

### Limites

- Jest ne prouve ni le rendu ni VoiceOver sur iPhone : recette à faire (bloc 6, roulette en panneau, fond orange avant le premier ✓ puis rendu normal, carte de la Composition, placement sans récupération).
- La copie d'une ancienne définition du Catalogue dans une Séance (route `/activity-selection`, plus atteinte depuis le menu Créer) garde une récupération absente (0 s) : la définition n'en porte pas ; aucune valeur n'est inventée.
- Les libellés i18n de l'ancienne récupération en placement (`recoveryWheelTitle`, `addRecoveryAccessibilityLabel`, annonces…) restent dans `fr.ts` sans usage ; leur retrait relève d'un nettoyage séparé.
