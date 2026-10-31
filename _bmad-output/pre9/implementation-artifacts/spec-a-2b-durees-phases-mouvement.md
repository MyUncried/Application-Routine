# A.2b — Durées des phases portées par le Mouvement

Story PRE-9, epic A. Plan : `../planning-artifacts/epics.md` § A.2b (dépend de A.2 ; placée après B.3 par décision de Hermann du 30/10/2026). Branche `pre9-bmad/dev`, départ `fd22d991`. **Migration 018** (approuvée par Hermann le 31/10/2026). Aucun changement Figma ; `tokens.ts` inchangé (constantes locales).

## Décisions appliquées (textes de Hermann)

| Date | Texte | Portée |
|---|---|---|
| 30/10/2026 (contre-recette PRE-9 n° 1, ch07 « Contre-recette PRE-9 n° 1 ») | « Créer un mouvement : les durées de la phase peuvent faire partie du mouvement, si elles sont renseignées elles sont reprises par défaut et peuvent être changées dans la séance, si elles n'existent pas elles sont à renseigner dans la séance. » | Remplace DSF Mouvements §2 « sa durée n'est pas une propriété du mouvement » et MVT-09 « aucune durée […] sur la fiche » (déjà annotés le 30/10). |
| 31/10/2026 (ch07 « A.2b et B.4b — précisions de Hermann du 31/10/2026 ») | Modification ultérieure des durées d'un Mouvement → Exercices déjà créés : « Inchangés » — « les durées du Mouvement ne servent que de valeurs par défaut à la création d'un nouvel Exercice ; les Exercices existants gardent leurs durées locales. » | Aucune propagation. |
| 31/10/2026 (approbation de la migration) | « Oui, migration 018 (Recommandé) » — « Colonne ajoutée, existant intact (durées vides), preuves de conservation, d'échec et de reprise ; A.4 → 019, A.5 → 020, plan annoté. » | Persistance (classe D) ; renumérotation des migrations prévues. |
| 31/10/2026 (réponses aux questions À CLARIFIER, ch07 « A.2b et B.4b … 31/10 ») | (1) « Non, enregistrement direct (Recommandé) » ; (2) « Oui, je jugerai en recette » ; (3) « Oui, la Cible reste à saisir » ; (4) « les durées par défaut de toutes les phases sont reprises ». | (1) pas de dialogue C03 pour les seules durées ; (2) rendu conservé, **choix** à juger en recette n° 2 ; (3) règles existantes ; (4) changement de niveau, voir Réalisé 7. |

Règles existantes réutilisées : identité stable de phase (MFN-02, MFN/AC30 ; DSF §2 « conserver les `WorkPhase.id` des phases conservées, même déplacées. Ne pas recycler une identité supprimée ») ; bornes des phases 1..3535 s (`WORK_PATTERN_DURATION_BOUNDS`, D-430 ; COMP §3 : « Cette ouverture ne rend pas nulles les durées de phases du mouvement ») ; « Paramètres à compléter » (D-389, D-448 point 7) ; table C03 (R-4) ; lecture seule d'un Mouvement existant depuis une Séance (A.2, CE-MVT-01 §3) ; changement de niveau par rang (R-6, DSF §6 l.91), inchangé.

## Choix de stockage (classe D)

Les phases du Mouvement sont des LIGNES (`movement_phases(movement_id, phase_id, position, label)`, `migration013`), pas un JSON : aucune colonne existante ne pouvait porter la durée sans détournement. Arrêt et compte rendu avant d'écrire la migration (consigne), puis approbation de Hermann le 31/10.

- `migration018` : `ALTER TABLE movement_phases ADD COLUMN duration_seconds INTEGER CHECK ((duration_seconds IS NULL) OR (duration_seconds BETWEEN 1 AND 3535))`, idempotente (`PRAGMA table_info`), dans la transaction exclusive unique ; aucune reprise : toute phase existante reste sans durée. `DATABASE_VERSION = 18`. Un échec laisse `user_version` à 17.
- Domaine : `MovementPhase.durationSeconds?: number | null` — nombre = durée par défaut ; `null` = retirée ; **absente** = non renseignée par l'appelant (Mouvement relu sans durée, ou structure reconstruite depuis les paramètres d'un Exercice).
- Dépôt : écrit la durée renseignée (`null`/absente → `NULL`) ; relit `durationSeconds` seulement si elle est renseignée ; à la mise à jour, une phase reçue sans `durationSeconds` garde la durée enregistrée de la même identité (le chemin Séance / Catalogue qui reconstruit la structure depuis l'Exercice ne réécrit donc jamais les durées du Mouvement). `withPhaseStructure` / `allocatePhaseIdentities` reportent de même la durée par identité.
- Renumérotation : A.4 → 019, A.5 → 020 (`epics.md`, `architecture-pre9.md`, `etat-initial-et-ecarts.md` annotés, texte d'origine conservé).

## Réalisé

1. **Fiche Mouvement** (`MovementPhasesEditor.tsx`, variante `movement` d'`ActivityEditorForm`) : à droite du libellé de chaque phase, sa durée (« 30 s », « 1 min 15 s ») ou l'invite « Durée » en gris clair (#AEB3BA, comme les autres invites de la fiche). La toucher ferme le clavier et ouvre, sous la ligne, la roulette de durée partagée (`DurationWheelPicker`, native iOS ; bornes 1..3535 s ; ouverture sur `00:00` quand la phase n'a pas de durée, ✓ indisponible tant qu'aucune durée n'est tournée — recette du 29/10) ; titre « Durée par défaut » ; ✓ applique, ✕ ferme sans rien changer ; « Sans durée » (si une durée existe) la retire. Création et édition depuis le Catalogue ; **lecture seule** en consultation (durée affichée, rien pour une phase vide, aucune roulette) — y compris depuis une Séance, qui n'ouvre qu'une création (A.2). L'invite d'une nouvelle phase n'a pas de durée.
2. **Nouvel Exercice depuis un Mouvement** : `repriseExecutionParameters` reprend la durée du Mouvement par identité de phase, 0 (« — », à renseigner) sinon. Tous les chemins y passent : Composition « Créer un nouveau mouvement » et « Utiliser un mouvement existant » (`exerciseOfMovement`), reprise d'un geste dans l'éditeur d'Exercice (`ExerciseScreen`, deux chemins). Changement de niveau : voir 7. [31/10 : « inchangé (durées locales par rang, règle existante) » — remplacé par la réponse (4) de Hermann.]
3. **Aucune propagation Mouvement → Exercices** : les durées sont COPIÉES dans les paramètres de l'Exercice ; une modification ultérieure du Mouvement ne touche ni `activities` ni `activity_definitions`.
4. **Aucune propagation Exercice → Mouvement** : la modification d'un Exercice dans la Séance n'écrit que ses paramètres ; une correction du Mouvement depuis la Séance (`EDITED`, structure reconstruite sans durées) conserve les durées du Mouvement.
5. **Identité de phase** : renommer ou déplacer garde la durée ; une phase retirée perd la sienne ; une phase nouvelle n'en a aucune.
6. **Sauvegarde C03** (`movementSave.ts`) : une modification des SEULES durées est enregistrée sans dialogue (`SILENT`), même avec d'autres Exercices liés — confirmé par Hermann le 31/10 : « Non, enregistrement direct (Recommandé) ». Toute autre modification suit la table C03 inchangée ; une phase sans durée renseignée (`undefined`) n'est pas une modification.
7. **Changement de niveau** (menu Niveau : `transferParametersByRank`, appelé par `withOccurrenceMovement` en Séance et par l'éditeur d'Exercice). Réponse de Hermann du 31/10 : « les durées par défaut de toutes les phases sont reprises ». **Lecture appliquée** (interprétation de cette réponse) : toute phase du Mouvement choisi qui porte une durée par défaut la reçoit, en REMPLAÇANT la durée locale du même rang ; une phase sans durée par défaut suit la règle existante R-6 (durée locale du même rang, sinon vide). Un Mouvement choisi sans aucune durée par défaut donne exactement le transfert d'avant. Le reste de l'occurrence (mode, séries, cibles, pauses, côtés, récupération, position) est inchangé.

## Synchronisation code / documentation

- **Classe B** (décisions de Hermann des 30 et 31/10) : durée facultative par phase, reprise par défaut, aucune propagation. Documents mis à jour (annotations datées entre crochets, texte d'origine conservé) :
  - `docs/DSF-MOUVEMENTS-CREATION-EDITION-2026-10-27.md` : en-tête recette A/B (« phases en liste d'étapes textuelles, sans durée »), §2 (« sa durée n'est pas une propriété du mouvement »), MVT-09 (« aucune durée ni cible de série sur la fiche »).
  - ch07 « Registre des décisions » : section « A.2b et B.4b — précisions de Hermann du 31/10/2026 » complétée (approbation de la migration 018, renumérotation, réalisation, interprétation C03, rendu choisi).
  - ch09 « Modèle de données fonctionnel » l.13 et tableau Mouvement l.266.
  - ch10 « Processus métier » : référence ciblée l.35 (« structure des phases sans durées ») ; l.485 et l.501 (« Une nouvelle phase n'hérite d'aucune durée inventée ») complétées (« Inchangés »).
  - Changement de niveau (réponse (4) du 31/10) : DSF Mouvements l.91 ; ch09 l.1452 ; ch10 l.27, l.487, l.503 ; ch13 l.5762 ; ch07 (les quatre réponses recopiées).
  - ch13 « Contrats d'écran » : l.202 (« Paramètres d'exécution et durées des phases absents. ») et l.268 (« structure des phases sans durées »).
  - Commentaires de code remplacés et annotés : `Movement.ts` (type `MovementPhase`, `withPhaseStructure`, `repriseExecutionParameters`), `movementPhaseList.ts`, `MovementPhasesEditor.tsx`, `ActivityEditorForm.tsx`, `movementExercises.ts`, `movementSave.ts`.
- **Classe D** : migration 018, colonne `duration_seconds`, sémantique « absente = conserver » du dépôt ; `src/infrastructure/database/README.md` (section version 18) ; plan (`epics.md`, `architecture-pre9.md`, `etat-initial-et-ecarts.md`) annoté pour la renumérotation.
- **Classe C** : les quatre questions de la première livraison sont tranchées par Hermann le 31/10 (voir ci-dessous) ; la réponse (4) devient une évolution de classe B.
- Recherche ciblée (« jamais de durée », « sans durée », « aucune durée », « propriété du mouvement », « durées des phases absents ») dans `docs/` (DSF Mouvements, ch07, ch09, ch10, ch13, `PRODUCT.md`) : toutes les formulations contraires trouvées sont annotées ; `PRODUCT.md` ne contient aucune formulation contraire. Les mentions « sans durée » des autres sujets (Pause, Récupération, échec, cartes) ne concernent pas le Mouvement.

## Questions À CLARIFIER — réponses de Hermann du 31/10/2026

Questions posées dans la première livraison (texte d'origine conservé ci-dessous, entre crochets) ; réponses recopiées.

1. **Modification des seules durées : sans dialogue C03 ?** — « Non, enregistrement direct (Recommandé) » : comportement en place conservé (`SILENT`). [Question : « confirmer, ou demander la confirmation C03 aussi pour ce cas ».]
2. **Rendu de la durée sur la fiche** — « Oui, je jugerai en recette » : rendu conservé ; **choix**, à juger en recette n° 2 (valeur à droite du libellé sur 76 pt, invite « Durée » en gris clair, roulette partagée sous la ligne, « Sans durée »).
3. **Exercice « à compléter » malgré toutes les phases renseignées (mode Durée)** — « Oui, la Cible reste à saisir » : règles existantes conservées (D-446, D-448 PH-5).
4. **Changement de niveau** — « les durées par défaut de toutes les phases sont reprises » : réalisé (Réalisé 7, lecture appliquée explicitée). Règle écrite remplacée et annotée : DSF Mouvements l.91 (« un changement effectif de mouvement conserve les durées locales des phases de rang commun […] ne pas recréer cet objet ni déduire des durées par défaut du mouvement »), ch10 l.27, l.487 et l.503 (transfert par rang), ch09 l.1452, ch13 l.5762 (« durée transférée par rang, complément des seules valeurs manquantes »). [Question : « les rangs sans durée restent vides même si le Mouvement choisi a des durées par défaut […] à décider si ces durées doivent aussi y être reprises ».]

Aucune question ouverte restante pour A.2b.

## Tests (ciblés, `npx jest --maxWorkers=1 …`)

- `src/infrastructure/database/__tests__/migration018.test.ts` (5, nouveau) : version 18 et bornes figées ; copie de base FICHIER au schéma 017 (Mouvements avec et sans phases, alias, Exercice du Catalogue, Séance et occurrences) : colonne ajoutée, toutes les lignes inchangées, phases sans durée, relecture par le dépôt, second démarrage sans effet ; CHECK ; échec injecté APRÈS l'ajout de la colonne → base intacte au schéma 017, reprise au démarrage suivant ; installation neuve.
- `src/infrastructure/database/__tests__/movementPhaseDurations.a2b.test.ts` (5, nouveau) : aller-retour ; mise à jour (absente → conservée par identité, `null` → retirée, nombre → remplacée, phase retirée → perdue, phase nouvelle → aucune) ; durée hors bornes refusée sans écriture ; Exercice de Séance modifié → Mouvement inchangé ; Mouvement modifié → Exercice existant inchangé ; Mouvement `EDITED` depuis la Séance → durées conservées.
- `src/domain/activities/__tests__/movementPhaseDurations.a2b.test.ts` (13, nouveau) : validation, identité (fiche, `withPhaseStructure`, `allocatePhaseIdentities`), valeurs par défaut (`repriseExecutionParameters`, copie), décision C03 (seules durées → `SILENT`, sans dialogue) ; changement de niveau (défauts sur toutes les phases → toutes remplacées ; sur certaines → défaut là où il existe, durée locale du même rang sinon, vide au-delà ; sans aucun défaut → R-6 inchangée ; `withOccurrenceMovement` en Séance).
- `src/features/activities/__tests__/MovementScreen.b2.integration.test.tsx` (+4) : invite et roulette en création ; édition depuis le Catalogue avec Exercice lié (pas de dialogue, Exercice inchangé) ; « Sans durée », renommer, déplacer, retirer ; consultation en lecture seule.
- `src/features/sessions/__tests__/movementPhaseDurations.a2b.integration.test.tsx` (2, nouveau, vrai navigateur) : « Créer un nouveau mouvement » avec une durée → Mouvement enregistré et durée reprise dans la feuille de l'Exercice (« 30 s », « — ») ; « Utiliser un mouvement existant » → reprise, puis Mouvement modifié → Exercice posé inchangé, nouvel Exercice → nouvelles valeurs.
- Tests mis à jour : `Movement.test.ts` (« aucune durée portée » → durée portée par l'identité, annoté) ; `migration015.test.ts` (base 014 écrite en SQL : le dépôt courant lit la colonne de la 018) ; version courante 18 dans `migrateDatabase`, `migration012` à `migration017`, `executionParametersV3.roundTrip` ; titres de deux tests de la fiche annotés.
- Complément du 31/10 (changement de niveau) : `transferParametersByRank.r6`, `phasesDurations.r7`, `occurrenceLevelChange.r6`, `ExecutionParametersSheet.r7`, `CompositionScreen.r7`, `ExerciseScreen.r6`, `ExerciseScreen.mfn.a31/a32` : 59 / 59 ; nouveau fichier domaine 13 / 13.
- Résultats : base de données (migrations 010–018, `migrateDatabase`, `targetSchema`, `initializeDatabase`, `preservation.*`, `mfn*`, dépôts Sqlite*, `copiesAndSnapshots`, `occurrenceWithoutCopy`, `cycleMembers`, `elementFormats`, `sessionStructure`, `seriesPerCircuit`, `movementFamilies`, `sessionCatalogue`, `sessionLifecycle`) 523 / 523 ; domaine Mouvement 72 / 72 ; fonctionnalités Mouvement et Composition 212 / 212 ; `ExerciseScreen.*` et `ExerciseEditorNoWrite` 95 / 95 ; nouveau test d'intégration 2 / 2. `npx tsc --noEmit -p .` : OK. ESLint sur les fichiers modifiés : OK. **Suite complète non exécutée** (Hermann). Une suite verte ne vaut pas recette sur iPhone.

## Recette iPhone (Hermann)

Prérequis : l'application démarre sur la base existante de l'iPhone (migration 018 appliquée au lancement).

1. Au lancement, aucune erreur ; les Mouvements, Séances et Exercices existants sont intacts ; aucune phase n'a de durée.
2. Catalogue → Mouvements → « Créer un mouvement » : saisir deux phases. À droite de chaque phase apparaît « Durée » en gris clair.
3. Toucher « Durée » de la phase 1 : le clavier se ferme, la roulette s'ouvre sous la ligne sur 00:00 (✓ indisponible) ; choisir 30 s, ✓ : « 30 s » s'affiche. Laisser la phase 2 sans durée. Terminer.
4. Rouvrir ce Mouvement (consultation) : « 30 s » affiché en lecture seule pour la phase 1, rien pour la phase 2 ; aucune roulette.
5. En édition : toucher « 30 s », puis « Sans durée » : l'invite « Durée » revient. Remettre 45 s, renommer la phase 1, la déplacer (VoiceOver Monter / Descendre) : la durée suit la phase. Terminer : aucun dialogue de confirmation, même si le Mouvement est déjà utilisé dans une Séance (réponse (1) du 31/10).
6. Séance → Créer → « Utiliser un mouvement existant » → ce Mouvement : la carte est « Paramètres à compléter » ; la toucher : dans la feuille, le tableau des phases montre 45 s pour la phase 1 et « — » pour la phase 2. Les modifier dans la feuille : rouvrir le Mouvement depuis le Catalogue, ses durées n'ont pas changé.
7. Séance → Créer → « Créer un nouveau mouvement » : saisir des phases et une durée sur la fiche, Terminer : l'Exercice posé reprend cette durée.
8. Modifier ensuite les durées du Mouvement dans le Catalogue : les Exercices déjà posés (Séance enregistrée ou brouillon) gardent leurs durées ; un nouvel Exercice du même Mouvement reçoit les nouvelles.
9. Rendu (choix, recette n° 2) : position et taille de la durée, invite grise, roulette sous la ligne et « Sans durée ».
10. Changement de niveau : Exercice d'un Mouvement d'une famille, durées locales réglées ; menu Niveau → un niveau dont certaines phases ont une durée par défaut : ces phases prennent la durée par défaut, les autres gardent la durée locale du même rang (ou « — »).

## Fichiers

- Code : `src/domain/activities/Movement.ts`, `src/domain/activities/movementPhaseList.ts`, `src/domain/activities/movementSave.ts`, `src/features/activities/MovementPhasesEditor.tsx`, `src/features/activities/ActivityEditorForm.tsx` (commentaires), `src/features/sessions/movementExercises.ts` (commentaire), `src/infrastructure/database/migrations/migration018.ts` (nouveau), `src/infrastructure/database/migrateDatabase.ts`, `src/infrastructure/database/constants.ts`, `src/infrastructure/database/types/DatabaseRows.ts`, `src/infrastructure/database/repositories/SqliteMovementRepository.ts`, `src/infrastructure/database/README.md`, `src/shared/i18n/resources/fr.ts`.
- Tests : voir § Tests.
- Documentation : voir § Synchronisation ; plan : `epics.md`, `architecture-pre9.md`, `etat-initial-et-ecarts.md`, `sprint-status.yaml` (a-2b → review).
