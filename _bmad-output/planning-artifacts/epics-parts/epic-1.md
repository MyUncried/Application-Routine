## Epic 1 : Mes Exercices passent au modèle à Cible typée, sans perte

Après la mise à jour, Hermann retrouve tous ses Exercices, Copies en Séance, Médias et référentiels. Les anciens Exercices « À l'échec » deviennent des Exercices en Répétitions dont toutes les Cibles sont à l'échec. Les Exercices illisibles sont écartés et dénombrés (Q19). Les copies et les Instantanés portent les Cibles typées. L'application reste utilisable de bout en bout avec l'interface PRE-3, adaptée au minimum.

**Architecture :** AD-1, AD-3, AD-4, AD-9, AD-10, AD-12, AD-13, AD-14 (socle atomique d'abord). **Ordre :** 1.1 → 1.2 → 1.3 → 1.4 (squelette `00-squelette.md`).

*Révision du 2026-10-17 (recette iPhone) : Q35 (Cible à renseigner signalée par un fond `#FFF1F0`, sans liseré ni contour, reporté dans le texte de 1.1 : jalon J6 et AC de la Définition migrée à Cible `UNSET`) ; Q36 (Cible Durée à la seconde, bornes 5..3535 inchangées, plus de multiple de 5) : AC6, tableau d'AC7, AC14 et « Hors story » corrigés.*

**Conventions de cet epic.**
- Les littéraux d'interface et de phrase sont écrits avec l'apostrophe typographique `’` (U+2019), comme le Corpus 276 et le lexique.
- « Base v9 » : base SQLite construite par `migration001` à `migration009` du code de départ, sur `node:sqlite` réel (`src/infrastructure/database/testing/NodeSqliteDatabase.ts`), puis alimentée en données anciennes par des `INSERT` directs (AD-10). Aucune simulation de la persistance.
- « Injection d'échec » : motif `FailingDatabase` existant (`src/infrastructure/database/__tests__/migrateDatabase.test.ts:1607`).
- Les scénarios de recette `R-1.M-xx` suivent le modèle de `docs/preparation/PRE-4/bmad/recette-iphone.md` §3. Ils sont exécutés par Hermann dans le dev client « Routine Dev » déjà installé sur l'iPhone (Q22), une fois sa compatibilité vérifiée en ouverture de la story 3.1 ; si un nouveau build est nécessaire, il est signalé à Hermann. Une suite verte n'est jamais une preuve visuelle ou tactile (NFR-04).

---

### Story 1.1 : Socle : Cible typée, format v2 et migration 010

En tant que Hermann (utilisateur de KODJO),
je veux que l'application passe au modèle « deux Modes, une Cible typée par Série » et que mes données existantes y soient converties sans perte ni valeur inventée,
afin que mes anciens Exercices « À l'échec » restent identiques à l'usage et que les fonctions suivantes de PRE-4 reposent sur un seul format de données.

**Exigences :** FR-05-05 (Mode à deux valeurs, conversion, carte « N séries à l’échec ») ; FR-06-02 (partie domaine et données) ; FR-09-01, FR-09-02, FR-09-03, FR-09-05 (bornes et tolérance historique, domaine) ; FR-15-01 (transport v2 dans `activities`, consommateurs à deux Modes) ; FR-15-07 (formules inchangées pour les Cibles numériques) ; FR-18-01 à FR-18-16 ; FR-18-20 (partie données) ; FR-21-57 ; vérifiées ici sans en être le porteur principal : FR-17-02, FR-17-03 (corpus 276 gardé vert par l'adaptation minimale, P43 ; porteur : 2.3), FR-19-06 (AC12 : écart des illisibles sans effet sur les copies ; porteur : 1.3), FR-19-09 (AC22 : transition mécanique de la Feuille PRE-3 ; porteur : 1.3) ; NFR-05, NFR-06, NFR-07, NFR-11, NFR-12, NFR-13 ; H6, H7, H21, H25 ; P3, P20, P22, P26 (gabarit tout à l'échec conservé), P28, P29, P43 (corpus : adaptation minimale), P44 (amendée par Q28), P45 et Q28 (prédicat d'illisibilité, voir AC9 et AC14).
**Architecture :** AD-1, AD-3, AD-4, AD-13, AD-14 (story atomique, non découpable), AD-10 (preuves) ; inventaire des lecteurs de scalaires de la spine (toutes les lignes). Fichiers principalement touchés (indicatif, le code fait foi) : `src/domain/activities/ExecutionParameters.ts`, `ExecutionParametersDraft.ts`, `executionCalculations.ts`, `executionPhrase.ts`, `ActivityDefinition.ts`, `exerciseSnapshot.ts` ; `src/domain/sessions/Session.ts`, `validation.ts`, `calculations.ts`, `SessionDraft.ts`, `composition.ts`, `errors.ts` ; `src/infrastructure/database/migrations/migration010.ts` (nouveau), `migrateDatabase.ts`, `constants.ts`, `types/DatabaseRows.ts`, `repositories/SqliteActivityDefinitionRepository.ts`, `repositories/SqliteSessionRepository.ts`, `repositories/SqliteMigrationNoticeRepository.ts` (nouveau, nom indicatif) ; `src/features/activities/ExecutionParametersSheet.tsx`, `ActivityEditorForm.tsx`, `ActivityCard.tsx` ; `src/features/sessions/ExerciseScreen.tsx`, `compositionPresentation.ts`, `SessionServiceProvider.tsx` ; `src/shared/i18n/` ; tests `TO_FAILURE` existants (au départ, le littéral est porté par 17 fichiers de test, dont le test du corpus traité à part en AC21, et par 19 fichiers de production ; relevé de la porte de préparation, à recompter à l'ouverture de la story).
**Dépend de :** rien.
**Hypothèses non validées :** H6, H7, H21, H24 (partie données), H25 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Tâches indicatives et jalons internes (ordre conseillé).** La story reste atomique (AD-14) : une seule livraison, verte à la fin, et aucun jalon n'est livré seul. Chaque jalon est un point de contrôle local, consigné dans le fichier de la story (commande lancée, résultat) ; tant que le jalon J5 n'est pas atteint, l'arbre peut ne pas compiler hors des modules visés.
1. Types du domaine (AD-1) dans `ExecutionParameters.ts` ; réexport depuis `Session.ts` ; `LegacyExecutionMode` cantonné. **J1 :** tests unitaires d'AC1 verts (`npx jest src/domain/activities`, fichiers des types).
2. `readV1`, `readV2`, `serializeV2`, `ExecutionParametersDataError` (AD-3) ; `validateForSave(params, baseline)` aux deux niveaux (AD-13). **J2 :** tests d'AC2, AC3, AC5, AC6, AC7 verts.
3. `migration010` avec convertisseur figé embarqué, prédicat d'illisibilité (cas (a) à (c11) d'AC9), étapes 1 à 7 d'AD-4, table `migration_notices` ; `DATABASE_VERSION = 10`. **J3 :** tests `node:sqlite` d'AC9 à AC15 et AC17 verts (`npx jest src/infrastructure/database`).
4. Repositories : lecture `readV2` seule, écriture v2, projection scalaire unique ; `assertSessionAggregateRow` et revalidations alignées sur le nouveau CHECK ; repository des avis (exposé par `SessionServiceProvider`, sans affichage). **J4 :** tests d'AC16, AC18, AC19 et parité CHECK réel / assertion verts.
5. Adaptation mécanique de tous les consommateurs de l'inventaire (brouillon, calculs, phrase, Composition, Éditeur, copies) ; suppression de `formatExerciseRecap`, `formatExerciseDurationLine`, `projectLegacyScalars` et des chemins scalaires. **J5 :** `npx tsc --noEmit` vert sur tout l'arbre ; test de garde d'AC4 vert.
6. Interface minimale : segmenté Mode à 2 options ; Cible `FAILURE` affichée en lecture ; Cible `UNSET` affichée `—` sur fond `#FFF1F0` (`color.dangerSurface`), sans contour (Q35). **J6 :** tests de composants d'AC21 à AC24 verts.
7. Adaptation des tests `TO_FAILURE` ; tests nouveaux (parité, prédicat, migration, garde) ; trois contrôles. **J7 = livraison :** AC20 et AC25, `npm test`, `npx tsc --noEmit`, `npm run lint` verts.

**Critères d'acceptation :**

*A. Types et format (AD-1, AD-3)*

**AC1 — Deux Modes, Cible typée unique.**
**Given** le code livré **When** on recherche les définitions de type du Mode et de la Cible **Then** un seul type de Cible existe, `SeriesTarget` = `{ kind: "NUMBER", value }` | `{ kind: "FAILURE" }` | `{ kind: "UNSET" }`, défini dans `src/domain/activities/ExecutionParameters.ts` **And** le Mode d'un Exercice est `"DURATION" | "REPETITIONS"` seulement, réexporté par `Session.ts` **And** `LegacyExecutionMode` (`DURATION | REPETITIONS | TO_FAILURE`) n'apparaît que dans `readV1`, les types de ligne SQL (`DatabaseRows.ts`) et `migration010` **And** aucun module ne teste une Cible par `=== null` ni par une valeur numérique sentinelle (0 compris). *(FR-18-01, FR-18-02, FR-06-02 ; AD-1)*

**AC2 — Forme v2 figée et sérialiseur.**
**Given** les paramètres `{ mode: REPETITIONS, series: UNIFORM, count 3, target FAILURE, pause 10, sideMode UNILATERAL, sideOrder BY_SIDE, sideRecovery 0, Bip 2, countdown 0, end 0 }` **When** `serializeV2` les écrit **Then** la chaîne vaut exactement `{"version":2,"mode":"REPETITIONS","series":{"kind":"UNIFORM","count":3,"target":{"kind":"FAILURE"},"pauseSeconds":10},"sideMode":"UNILATERAL","sideOrder":"BY_SIDE","sideRecoverySeconds":0,"cadenceBeepIntervalSeconds":2,"countdownSeconds":0,"endSeconds":0}` (mêmes clés et même ordre que le sérialiseur v1, sans espace) **And** une Cible numérique s'écrit `{"kind":"NUMBER","value":30}` **And** en Régime variables, `series` vaut `{"kind":"VARIABLE","rows":[{"target":…,"pauseSeconds":…},…]}` sans aucun Bip par ligne **And** ni identité de ligne, ni Réserve, ni mémoire de Mode, ni phrase, ni total ne sont sérialisés. *(FR-18-02, FR-18-04 invariant du Bip, FR-18-05 ; P22 ; AD-3)*

**AC3 — Lecteurs v1 et v2.**
**Given** une chaîne v2 valide **When** `readV2` la lit **Then** elle renvoie les paramètres typés, et `serializeV2(readV2(s))` = `s` octet pour octet **And Given** une chaîne NULL, v1 ou de version inconnue **When** `readV2` la lit **Then** elle lève `ExecutionParametersDataError` **And Given** un JSON v1 `TO_FAILURE` à 3 Séries **When** `readV1` le lit **Then** il renvoie Répétitions, 3 Cibles `FAILURE`, Pauses, côtés et Bip inchangés **And Given** des scalaires sans JSON et sans Bip **When** `readV1` les lit **Then** Régime identiques, ordre `BY_SIDE` (« Un côté après l’autre »), Bip 0, Compte à rebours et Fin 0, N = max(`series_count`, 1). *(FR-18-01, FR-18-06 deuxième conséquence, FR-18-07 troisième conséquence ; AD-3)*

**AC4 — Garde de cantonnement.**
**Given** l'arbre `src/` et `app/` **When** le test de garde recherche le littéral `TO_FAILURE` dans le code (hors commentaires) et les imports de `readV1` **Then** `TO_FAILURE` n'apparaît que dans `readV1` (et son module de tests), `DatabaseRows.ts`, `migration010.ts`, les migrations historiques 003, 004 et 006 (inchangées), les tests de parité ou de migration, et le test du corpus `src/domain/activities/__tests__/executionPhrase.test.ts`, au seul endroit de son adaptation (minimale ici, AC21 ; explicite et nommée en 2.3 AC13) **And** `readV1` n'est importé que par les tests de parité et le lecteur d'Instantané v1 **And** `legacyExecutionParameters` et `resolveExecutionParameters` n'ont plus d'appelant de production. *(FR-18-01 ; AD-3)*

*B. Validation unique (AD-13)*

**AC5 — Niveau structurel, toujours appliqué : forme, types et nombres entiers non négatifs, pas les bornes (P44 amendée par Q28).**
**Given** `validateForSave(params, "STORAGE")` **When** les paramètres contiennent une Cible `UNSET` (héritée comprise), un Mode `TO_FAILURE` ou inconnu, un `kind` de Cible ou de Régime inconnu, une chaîne ou un booléen à la place d'un nombre, un Régime variables sans ligne, ou une valeur numérique négative ou non entière (Cible, Pause, Pause au changement de côté, Bip, Compte à rebours, Fin ; Q28 : aucune donnée de cette forme ne subsiste après la migration) **Then** chaque cas renvoie une violation en union discriminée, sans exception levée **And** une Cible `FAILURE` seule, une Cible Durée de 5999 s, une Cible Répétitions de 150, un Bip de 11, une Pause de 400 s hérités (valeurs **positives** hors bornes) sont acceptés à ce niveau : les bornes relèvent du niveau saisie (AC6), appliqué aux seules valeurs modifiées (AC7) **And** les contraintes de la base restent appliquées par le repository : une Copie en Séance dont la projection viole le CHECK d'`activities` (Durée 1..5999, Répétitions ≥ 1, Pauses et Récupération 0..5999, N ≥ 1) est refusée par `assertSessionAggregateRow`, sans écriture (P44, « dans la limite des contraintes de la base »). *(FR-06-02, FR-18-01, FR-18-02, FR-18-03 ; P44, Q28 ; AD-13)*

**AC6 — Niveau saisie, appliqué aux seules valeurs modifiées.**
**Given** une création (aucune ligne de base) **When** `validateForSave` évalue une Cible Durée **Then** 5, 7, 30, 31 et 3535 s sont acceptées ; 0, 1, 4, 3536, 3540 et 5999 s sont refusées (à la seconde, sans multiple de 5 : Q36) **And** une Cible Répétitions de 1 et 100 est acceptée ; 0, 101 et 1,5 sont refusées **And** N est accepté de 1 à 99 ; Pause après chaque série et Pause entre les côtés de 0 à 300 s ; Bip de 0 à 10 (−1, 11 et 2,5 refusés) ; Compte à rebours et Fin de 0 à 60 s. *(FR-09-01, FR-09-02, FR-09-03 ; FR-18-06 troisième conséquence ; AD-13)*

**AC7 — Tolérance historique (H25).**
**Given** une ligne de base relue avec Cible Durée 5999 s, ou Cible Répétitions 150, ou Bip 11 **When** `validateForSave(params, baseline)` évalue des paramètres où cette valeur est inchangée et où seul le nom, ou une Pause dans ses bornes, a changé **Then** aucune violation n'est renvoyée **And When** la valeur historique est modifiée **Then** seule la nouvelle valeur est soumise au niveau saisie, selon ce tableau unique :

| Champ (bornes de saisie) | Cas | Valeur évaluée | Verdict |
|---|---|---|---|
| Cible Répétitions (1..100) | ancienne valeur inchangée | 150 (seul le nom de l'Exercice, ou une Pause dans ses bornes, a changé) | tolérée (H25) |
| Cible Répétitions (1..100) | nouvelle valeur | 150 → 100 | valide |
| Cible Répétitions (1..100) | nouvelle valeur | 150 → 101 | refusée |
| Cible Répétitions (1..100) | nouvelle valeur | 150 → 120 | refusée |
| Cible Durée (5..3535, à la seconde, Q36) | ancienne valeur inchangée | 5999 | tolérée (H25) |
| Cible Durée (5..3535, à la seconde, Q36) | nouvelle valeur | 5999 → 5995 | refusée |
| Cible Durée (5..3535, à la seconde, Q36) | nouvelle valeur | 5999 → 3535 | valide |
| Bip (0..10) | ancienne valeur inchangée | 11 | toléré (H25) |
| Bip (0..10) | nouvelle valeur | 11 → 12 | refusé |
| Bip (0..10) | nouvelle valeur | 11 → 10 | valide |

**And** ni le renommage de l'Exercice ni la modification d'une Pause (ou de tout autre champ) ne transforment une valeur inchangée en nouvelle saisie : la comparaison se fait champ par champ avec la ligne de base **And** une Cible n'est tolérée que si le Mode est celui de la ligne de base **And** une Cible `UNSET` héritée est toujours une violation (bloque ✓ et `Terminer`). *(FR-09-05 huitième et neuvième conséquences, FR-18-06 quatrième conséquence, FR-18-07 deuxième conséquence, FR-18-14 quatrième conséquence ; H7, H25 ; AD-13)*

**AC8 — Appelants de la validation.**
**Given** le code livré **When** on recense les chemins de validation des Paramètres d'exécution **Then** le ✓ de la Feuille et `Terminer` (Catalogue et Séance) appellent `validateForSave` avec la ligne de base relue à l'ouverture de l'Éditeur (aucune base en création) **And** la validation de Séance au `Continuer` et les repositories l'appellent avec `"STORAGE"` **And** aucun autre chemin ne valide les paramètres (les chemins `validation.ts:579-617` et `ActivityDefinition.ts:250-333` sont supprimés) **And** une demande d'enregistrement refusée par le repository ne laisse aucune ligne, aucune Série, aucun lien Catégorie, Zone ou Média ajouté ou modifié (base relue identique, `node:sqlite`). *(FR-18-03, FR-09-06 troisième conséquence en données ; AD-13)*

*C. Migration 010 (AD-4)*

**AC9 — Prédicat d'illisibilité fermé, cas par cas (P44 amendée par Q28, P45, Q28).**
**Given** une base v9 contenant, pour chacun des cas (a) à (c9) et (c11), une Définition d'Exercice et une Copie en Séance, et pour le cas (c10) une Copie en Séance, dont les paramètres présentent : (a) un texte non analysable ; (b) un JSON de `version` 2 ou 7 ; (c1) une racine non objet (`[]`, `3`) ; (c2) une clé requise absente ; (c3) un type impossible : chaîne, booléen, objet ou tableau là où un nombre est attendu ; (c4) `mode` hors `DURATION | REPETITIONS | TO_FAILURE` ; (c5) `sideMode` ou `sideOrder` inconnu ; (c6) `series.kind` inconnu ; (c7) nombre de lignes incohérent avec N : `count` < 1 (aucune Série) ; (c8) `rows` absent, vide ou non tableau ; (c9) N non entier (P45) : `count` du JSON v1 à 2,5, et, dans une autre ligne sans JSON, `series_count` à 2,5 ; (c10) Copie en Séance seulement (P45) : JSON v1 lisible selon (a) à (c9) et (c11) dont la projection scalaire d'AD-3 violerait le nouveau CHECK d'`activities` (AC15) par une valeur **positive** hors bornes, un test pour une Cible Durée de première ligne à 6 000 s, un pour une Pause de première ligne à 6 000 s ; (c11) valeur numérique **négative ou non entière** (Q28), dans un JSON v1 ou dans les scalaires d'une ligne sans JSON, quelle que soit la ligne (première ou non) : un test par champ et par forme, Cible −3 et 7,5 ; Pause −5 et 2,5 (ligne 1 et ligne 2) ; Pause au changement de côté −5 et 2,5 ; Bip −1 et 2,5 ; Compte à rebours −3 ; Fin 1,5 ; et, sans JSON, `pause_seconds` −5, `side_recovery_seconds` 2,5, cible scalaire −3 **When** `migration010` s'exécute **Then** chacune de ces lignes est écartée et dénombrée dans l'avis (AC13), un test par cas, sans erreur structurelle ni annulation **And** les cas (c9), (c10) et (c11) sont classés à l'étape 1 d'AD-4, avant toute écriture **And** une Définition d'Exercice portant le même JSON que les Copies de (c10) n'est pas écartée (aucun CHECK composite sur `activity_definitions`, AC14) **And** aucune autre cause n'écarte une ligne : hors (c9) à (c11), une valeur numérique **positive** hors grille ou hors bornes est lisible et conservée (AC14) ; une Cible absente, `null` ou 0 devient `UNSET` (AC11, H7) et n'écarte pas la ligne **And** une ligne sans JSON (scalaires seuls) n'est écartée que pour un `series_count` non entier (c9) ou un scalaire négatif ou non entier (c11) **And** les scalaires d'une ligne qui porte un JSON sont ignorés pour la décision. *(FR-18-20 ; Q19, Q28, P44, P45 ; AD-4)*

**AC10 — Conversion de l'Ancien mode À l'échec.**
**Given** une base v9 contenant une Définition et une Copie en Séance en `TO_FAILURE`, l'une en JSON v1 uniforme à 3 Séries (Pause 10 s, Bip 2, côtés `RIGHT_LEFT`, ordre `BY_SERIES`, Pause au changement de côté 5 s, Compte à rebours 3 s, Fin 4 s), l'autre en JSON v1 variable à 2 lignes (Pauses 10 s et 20 s), et une Définition `TO_FAILURE` sans JSON (scalaires, `series_count` 3) **When** `migration010` s'exécute **Then** chacune est relue en Mode Répétitions, toutes ses Cibles `FAILURE`, sans aucune valeur numérique de Cible **And** le Régime, le nombre de Séries, l'ordre des lignes, les Pauses, le Bip, les côtés, l'ordre des côtés, la Pause au changement de côté, le Compte à rebours, la Fin, le nom, la description, la Catégorie, les Zones et les Médias ordonnés sont identiques avant et après **And** la Définition sans JSON est relue en Régime identiques, ordre `BY_SIDE`, Bip 0, N = 3 **And** aucune ligne d'`activity_definitions` ni d'`activities` ne garde `execution_mode = 'TO_FAILURE'`. *(FR-05-05 deuxième conséquence, FR-18-01 troisième conséquence, FR-18-10, FR-18-11, FR-18-12 première conséquence, FR-18-13 ; P28 ; AD-4)*

**AC11 — Données lisibles mais invalides conservées, jamais converties en échec.**
**Given** une base v9 contenant : une Définition Répétitions sans nombre et sans JSON ; une Définition Durée sans valeur et sans JSON ; une Définition en JSON v1 Durée dont la deuxième ligne variable a une cible 0, et une autre dont la cible est `null` ; une Définition Durée de 7 s, une de 3 s et une de 5999 s ; une Définition Bip 11 ; une Copie en Séance en JSON v1 dont une ligne non première porte 0 **When** `migration010` s'exécute **Then** les Cibles sans nombre, à 0 ou `null` sont relues `UNSET`, jamais `FAILURE`, et l'Exercice n'est pas écarté **And** 7 s, 3 s et 5999 s sont relues à 7, 3 et 5999 s, sans arrondi ni bornage **And** le Bip 11 est relu 11 **And** aucun nombre de répétitions n'est calculé à partir d'une durée et aucun 0 n'est écrit à la place d'une valeur absente. *(FR-09-05 première et deuxième conséquences, FR-18-07 première conséquence, FR-18-13 deuxième conséquence, FR-18-14 première et deuxième conséquences ; H7 ; AD-4)*

**AC12 — Écart des illisibles : intégrité, Séances et Médias.**
**Given** une base v9 contenant trois Définitions dont une illisible (avec Catégorie, 2 Zones et 2 Médias dont l'un partagé avec une Définition lisible) ; une Séance A de deux Copies dont la deuxième, illisible, est au milieu d'une zone de trois occurrences ; une Séance B dont toutes les Copies sont illisibles ; un Circuit (zone `IN_TOUR`) dont l'unique Copie est illisible ; une Copie lisible dont la Définition source est illisible **When** `migration010` s'exécute **Then** les deux Définitions lisibles sont présentes et migrées, la Définition illisible n'existe plus, et la migration réussit (`user_version` = 10, pas d'erreur de démarrage) **And** aucun lien `activity_definition_body_zones`, `activity_media`, `activity_body_zones` ni `session_activity_media` ne référence un Exercice absent **And** les Catégories, Zones et lignes `media_assets` sont toutes présentes et inchangées, y compris celles dont l'Exercice écarté était le seul utilisateur, et aucun fichier n'est supprimé ni lu par la migration **And** la Séance A existe avec son identifiant, ses paramètres et sa Copie lisible ; seule l'occurrence illisible est retirée avec sa Récupération (colonne de la ligne) ; les positions des occurrences restantes sont contiguës et dans le même ordre relatif **And** la Séance B et le Circuit vidé existent toujours, sans occurrence **And** la Copie lisible dont la source est écartée est intacte, et une Définition lisible n'est pas touchée par l'écart d'une de ses Copies **And** aucune table, ligne ni fichier de sauvegarde ou de quarantaine de l'Exercice écarté n'est créé. *(FR-18-12 troisième conséquence, FR-18-15 troisième conséquence, FR-18-16, FR-18-20 première à sixième et neuvième conséquences, FR-21-57 deuxième conséquence ; Q19, P29 ; AD-4)*

**AC13 — Avis de migration enregistré (sans affichage).**
**Given** la base de l'AC12 (une Définition et des Copies illisibles) **When** `migration010` s'exécute **Then** la table `migration_notices` existe avec exactement ce schéma (AD-12) : `id INTEGER PRIMARY KEY`, `kind TEXT NOT NULL`, `count INTEGER NOT NULL CHECK (count >= 1)`, `created_at TEXT NOT NULL`, `acknowledged_at TEXT` (nullable), les deux dates au format ISO 8601 UTC de `Date.prototype.toISOString()`, comme les colonnes `created_at` existantes **And** elle contient exactement une ligne, `kind = 'UNREADABLE_EXERCISES_DROPPED'`, `count` = nombre de Définitions + Copies en Séance écartées, date de création renseignée, date d'acquittement NULL **And** aucune colonne ne contient d'identifiant, de nom ni de contenu d'Exercice écarté **And Given** une base sans Exercice illisible **When** la migration s'exécute **Then** la table existe et ne contient aucune ligne **And** le repository des avis est exposé par le contexte de services de `SessionServiceProvider`, sans aucun lecteur d'interface dans cette story. Exemple : 1 Définition + 1 Copie illisibles → `count` = 2. *(FR-18-20 septième conséquence, partie données ; H24 ; AD-12)*

**AC14 — Valeurs numériques positives hors bornes lisibles et conservées, en JSON v1 comme en scalaires (Q28, Q15, Q21, H25 ; limites de P45).**
**Given** une Définition sans JSON dont `pause_seconds` vaut 400 (hors 0..300) ; une Définition en JSON v1 dont une Pause vaut 400 et dont la Pause au changement de côté vaut 400 ; une Définition en JSON v1 dont les Cibles Durée valent 7 s et 6 000 s ; une Définition en JSON v1 en Répétitions dont une Cible vaut 150 ; une Définition en JSON v1 dont le Compte à rebours vaut 90 s (hors 0..60) **When** `migration010` s'exécute **Then** aucune n'est écartée **And** chaque valeur est recopiée telle quelle dans le v2 : Pauses 400, Cibles `NUMBER` 7, 6 000 et 150, Compte à rebours 90, jamais `UNSET` ni `FAILURE` (seules une Cible absente, `null` ou 0 deviennent `UNSET`, AC11) **And** l'Éditeur les affiche telles quelles ; une valeur non modifiée est réenregistrée telle quelle, une valeur modifiée doit respecter les bornes de saisie (AC7, H25 ; Q36 : 7 s est désormais dans les bornes) **And** le convertisseur de `migration010` n'importe ni le sérialiseur ni les lecteurs du domaine (copie figée de l'adaptateur `ExecutionParameters.ts:395-415`) **And** cette conservation vaut pour les Définitions, qui n'ont pas de CHECK composite ; dans une Copie en Séance, une valeur positive hors bornes de saisie mais dans les bornes du CHECK est conservée de même (exemple testé : Copie en JSON v1 dont la Pause de la ligne 2 vaut 400 → conservée, Pause relue 400), alors qu'une Cible ou une Pause de première ligne dont la projection violerait le CHECK d'`activities` relève d'AC9 (c10) **And** une valeur négative ou non entière relève d'AC9 (c11), et un N non entier d'AC9 (c9), dans les deux tables : aucune n'est conservée, aucun calcul ne l'utilise (Q28). *(FR-18-14, FR-18-20 ; H7, H25, Q15, Q21, Q28, P45 ; AD-4)*

**AC15 — Reconstruction d'`activities`, CHECK et parité.**
**Given** une base v9 migrée **When** on compare le schéma d'`activities` avant et après **Then** colonnes, clés étrangères (dont `category_id` et les FK composites), unicité et index `activities_session_position_idx`, `session_activity_media_activity_idx`, `session_activity_media_asset_idx` sont identiques, seul le CHECK composite diffère **And** le nouveau CHECK reprend les bornes de 004 à l'identique (Durée 1..5999, Répétitions ≥ 1, Pauses et Récupération 0..5999, N ≥ 1), retire `TO_FAILURE`, admet une cible scalaire NULL en Durée et en Répétitions, refuse les deux cibles non nulles, et laisse la branche `RECOVERY` inchangée **And** les comptes de `activity_body_zones` et `session_activity_media` sont égaux avant et après, hors liens des illisibles **And** `PRAGMA foreign_key_check` est vide **And** un test de parité soumet les mêmes lignes au CHECK réel (`node:sqlite`) et à `assertSessionAggregateRow` et obtient le même verdict pour chacune **And** `activity_definitions` n'est pas reconstruite **And** `migration001.ts` est inchangé (`git diff` vide). *(FR-18-11, FR-18-16, FR-21-57 première conséquence ; NFR-12 ; AD-4)*

**AC16 — Projection scalaire unique.**
**Given** un enregistrement par repository **When** les paramètres sont VARIABLE en Durée `[FAILURE / 10 s, NUMBER 30 / 10 s]` **Then** `execution_mode` = `DURATION`, `duration_seconds` = NULL (jamais 30), `repetition_count` = NULL, `series_count` = 2, `pause_seconds` = 10 **And** pour UNIFORM Répétitions 12 × 3, `repetition_count` = 12, `duration_seconds` = NULL, `series_count` = 3 **And** la même projection est produite par `migration010` pour les lignes converties **And** les repositories renvoient des paramètres analysés (type du domaine), jamais la chaîne JSON ni les scalaires. *(FR-18-02, FR-18-04 ; AD-3)*

**AC17 — Atomicité et nouvelle tentative (erreur structurelle).**
**Given** la base v9 de l'AC12 (illisibles compris) **When** une erreur est injectée successivement à chaque écriture de `migration010` (lecture, suppression des illisibles, renumérotation, mise à jour des Définitions, recopie d'`activities`, restauration des tables filles, contrôle des comptes, création de `migration_notices`), puis par un schéma inattendu et par une seconde FK vers `activities` **Then** chaque fois la base relue est identique à son état de départ (tables, lignes, liens, Exercices illisibles compris, `user_version` = 9) et l'erreur remonte au comportement d'erreur de démarrage existant, sans repli silencieux **And When** la migration est relancée sur cette base sans injection **Then** elle réussit. *(FR-18-15 ; H6 ; AD-4)*

**AC18 — Aller-retour exact sur SQLite réelle.**
**Given** une base migrée (version 10) **When** on enregistre puis relit, après fermeture et réouverture de la base, une Définition d'Exercice et une Copie en Séance pour chaque combinaison Durée/Répétitions × identiques/variables, avec des Cibles toutes numériques, toutes à l'échec et mixtes (`[NUMBER, NUMBER, FAILURE]`, `[FAILURE, NUMBER, NUMBER]`, `[NUMBER, FAILURE, NUMBER]`), Bip, côtés, ordre des côtés, Pause au changement de côté, Compte à rebours, Fin, nom, description, Catégorie, Zones et Médias ordonnés **Then** l'Exercice relu est égal à l'Exercice enregistré, types et ordre compris **And** la Récupération de chaque Copie est relue exacte **And** un Exercice en Régime variables dont toutes les Cibles sont égales est relu en variables ; un Exercice en identiques est relu en identiques **And** le Bip relu est une valeur unique, aucune Série n'ayant un Bip différent **And** un échec injecté pendant l'enregistrement d'une Séance laisse la base dans son état précédent, sans lien Zone, Catégorie ou Média orphelin. *(FR-05-05 première conséquence, FR-06-02, FR-15-01 première conséquence, FR-18-02, FR-18-04, FR-18-08, FR-18-09 ; AD-10)*

**AC19 — Refus d'un troisième Mode à l'écriture.**
**Given** une base migrée **When** un appel de repository tente d'enregistrer une Définition ou une Copie avec le Mode `TO_FAILURE`, ou une Cible `UNSET` **Then** l'appel est refusé sans aucune écriture (base relue identique). *(FR-18-01 deuxième conséquence, FR-18-03 ; AD-1)*

*D. Consommateurs et interface minimale*

**AC20 — Consommateurs adaptés, sans régression numérique.**
**Given** l'inventaire des lecteurs de scalaires de la spine **When** la story est livrée **Then** chaque ligne de l'inventaire a reçu le sort indiqué (lecture de `executionParameters` obligatoire, scalaires non exposés, `formatExerciseRecap` et `formatExerciseDurationLine` supprimés avec leurs tests, égalité de brouillon de Composition par `executionParametersEqual`) **And** pour tout Exercice à Cibles toutes numériques, les montants et natures de Durée totale, les phrases et les résumés de carte attendus par les tests existants sont inchangés (seuls les tests `TO_FAILURE` sont réécrits en « Répétitions, toutes Cibles `FAILURE` », avec les mêmes attendus) **And** Composition, détail de Séance et calcul acceptent Durée et Répétitions sans troisième Mode. *(FR-15-01 deuxième conséquence, FR-15-07 deuxième conséquence ; AD-14)*

**AC21 — Exercice migré tout à l'échec : comportement observable inchangé.**
**Given** un ancien Exercice `TO_FAILURE` à 3 Séries, Pause 10 s, Bip 2, migré **When** Hermann l'ouvre dans l'Éditeur **Then** la Carte Paramètres d'exécution affiche la Phrase « **3 séries** menées jusqu’à l’échec » (gabarit tout à l'échec existant, sans clause de Bip) et aucune Durée totale **And** la carte Catalogue affiche le résumé de tout échec (« 3 séries à l’échec » selon FR-05-05 et P3 ; libellé confirmé par Hermann en Q24), sans ligne de durée, jamais « 0 s » ni « 0 rép. » ; le changement de ce texte dans le lexique (`fr.ts:380`, « {N} séries jusqu’à l’échec » → « {N} séries à l’échec ») est porté par cette story, et 2.4 AC4 le réutilise sans le modifier **And** dans la Feuille, le Mode affiché est `Répétitions` **And** les 276 phrases du corpus restent vertes : le test du corpus applique l'adaptation **minimale** nécessaire, lire chaque cas `TO_FAILURE` en Répétitions avec toutes ses Cibles `FAILURE`, avec le même attendu ; ni `docs/archives/evolutions-v15-2026-10-07/phrases-276.json` (oracle source) ni `docs/preparation/PRE-3/planification/attendus-phrases-276.json` (encodage de test, phrases identiques) ne sont modifiés (P43). L'adaptation explicite et nommée et le rejeu en Durée viennent en 2.3. *(FR-05-05 deuxième à quatrième conséquences, FR-18-10 deuxième conséquence ; P3, P26 ; AD-10)*

**AC22 — Feuille PRE-3 adaptée au minimum.**
**Given** la Feuille Paramètres d'exécution existante **When** Hermann ouvre le choix du Mode **Then** le segmenté propose exactement `Durée` puis `Répétitions`, sans option `À l’échec` (le segmenté est ensuite remplacé par le popover en 3.3) **And Given** un Exercice dont des Cibles sont `FAILURE` **When** la Feuille s'affiche **Then** la Cible commune (Régime identiques) et chaque cellule de Cible du tableau (Régime variables) affichent `à l’échec`, en lecture, sans stepper ni roulette, sans valeur numérique **And** l'en-tête de colonne reste celui du Mode (`Durée` ou `Répétitions`) et le tableau garde ses colonnes Cible et Pause **And** augmenter N quand la dernière ligne est à l'échec ajoute une ligne à l'échec avec la même Pause (transition mécanique du brouillon) **And** changer de Mode conserve les Cibles `FAILURE` **And** le libellé `À l’échec` disparaît de la liste des Modes du lexique (`sheet.modes`), et le texte `à l’échec` d'une Cible y reste présent (FR-05-04 : il désigne une Cible, jamais un Mode). *(FR-05-05, FR-06-02 ; FR-05-01 deuxième conséquence en lecture minimale ; AD-14 ; squelette 1.1)*

**AC23 — Cible à renseigner héritée dans l'interface existante.**
**Given** une Définition migrée dont la Cible est `UNSET` (ancienne Répétitions sans nombre) **When** Hermann l'ouvre **Then** la Cible affiche `—` sur le fond `#FFF1F0` (`color.dangerSurface`), sans contour (Q35), la Carte affiche le texte existant « Paramètres à compléter. », le ✓ de la Feuille et `Terminer` sont indisponibles **And When** il règle une Cible par la commande existante puis ✓ et `Terminer` **Then** l'Exercice est enregistré avec cette Cible `NUMBER` **And** à aucun moment la Cible n'est convertie en `FAILURE`. *(FR-06-02, FR-09-05 dixième conséquence, FR-18-14 première et quatrième conséquences ; H25)*

**AC24 — Exercice ancien hors bornes réenregistré sans modification.**
**Given** un Exercice ancien à Cible Durée 5999 s **When** Hermann change seulement son nom et touche `Terminer` **Then** l'Exercice est enregistré et la Cible relue vaut 5999 s **And Given** le même Exercice **When** il ouvre la Feuille et touche ✓ sans toucher la Cible **Then** ✓ est disponible et la Cible vaut toujours 5999 s **And Given** un Exercice ancien à Bip 11 **When** il change une Pause, touche ✓ puis `Terminer` **Then** le Bip relu vaut 11. *(FR-09-05 huitième conséquence, FR-18-06 quatrième conséquence, FR-18-07 deuxième conséquence, FR-18-14 quatrième conséquence ; H25)*

*E. Contrôles*

**AC25 — Trois contrôles verts, rien hors périmètre.**
**Given** la story terminée **When** on exécute `npm test`, `npx tsc --noEmit` et `npm run lint` **Then** les trois passent **And** les garde-fous zéro `ScrollView` iOS (`DurationWheelPicker.test.tsx`, `NumberWheelPicker.test.tsx`) et `tokensSpecification.test.ts` sont inchangés et verts **And** aucun jeton de `src/shared/ui/tokens.ts` n'est modifié **And** aucun identifiant historique n'est renommé (`ActivityDefinition`, `ACTIVITY`, `tour*`, `IN_TOUR`). *(NFR-11, NFR-13 ; AD-11)*

**Preuves attendues :**
- Tests unitaires du domaine : types, `serializeV2`, `readV1`, `readV2`, `validateForSave` aux deux niveaux avec ligne de base (AC1 à AC7) ; garde de cantonnement (AC4).
- Tests SQLite réelle `node:sqlite` : migration depuis une base v9 (AC9 à AC17), un test par cas du prédicat ; parité `readV2(sortie 010)` = `readV1(entrée)` et `serializeV2(readV2(sortie 010))` = sortie 010 octet pour octet, pour chaque fixture ; parité CHECK réel / `assertSessionAggregateRow` ; injection d'échec à chaque étape ; aller-retour après fermeture et réouverture (AC18, AC19).
- Tests de composants : segmenté à 2 options, cellules `à l’échec`, Cible `UNSET` (AC21 à AC24) ; corpus 276 vert.
- `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22 ; compatibilité vérifiée en ouverture de 3.1) :
  - **R-1.1-01** — Préconditions : installation PRE-4 sur données antérieures (procédure de la story 1.4). Gestes : Catalogue → ouvrir un ancien Exercice « À l’échec » → toucher la Carte Paramètres d'exécution → toucher le champ Mode. Attendu fonctionnel : Phrase « 3 séries menées jusqu’à l’échec » (FR-18-10, P3) ; Mode `Répétitions` ; deux options `Durée`, `Répétitions` (FR-05-01) ; Cibles `à l’échec` (FR-06-05) ; aucune Durée totale. Attendu visuel : rendu PRE-3 de la Feuille conservé (état transitoire, aucune frame Figma propre : NON VÉRIFIABLE) ; texte de cellule comparé à 8328:38848 et 8470:13303 pour le seul libellé `à l’échec`.
  - **R-1.1-02** — Préconditions : ancien Exercice à Cible Durée 5999 s ou Bip 11, si présent dans les données antérieures. Gestes : renommer → `Terminer` → rouvrir. Attendu fonctionnel : enregistré, valeur inchangée (H25, FR-18-07). Attendu visuel : NON VÉRIFIABLE (aucune frame propre).
  - **R-1.1-03** — Préconditions : carte Catalogue d'un ancien Exercice « À l’échec ». Attendu fonctionnel : « 3 séries à l’échec » (Q24), aucune ligne de durée, jamais « 0 s » ni « 0 rép. » (FR-05-05, Q17). Attendu visuel : cartes Catalogue existantes (ch. 13 l. 556).
  - Rappel : une suite verte n'est pas une preuve visuelle ou tactile (NFR-04) ; la validation appartient à Hermann.

**Hors story :**
- Popovers natifs, Sélecteur de cible avec option échec, grisé manipulable, passage d'une Cible à l'échec vers le numérique et inversement : E3 (3.3 à 3.6). **Entre 1.1 et 3.4, Hermann ne peut ni créer une Cible à l'échec, ni rendre numérique une Cible à l'échec migrée** ; seule la Cible `UNSET` se règle par les commandes existantes. Cette perte transitoire de fonction est assumée : aucune livraison n'a lieu avant la fin de PRE-4, et la recette porte sur la version finale.
- Roulette Durée bornée à 5..3535 s, à la seconde : 3.4. D'ici là, la roulette existante (pas 1 s, maximum 5999 s) peut proposer une valeur hors bornes qu'AC6 refuse (✓ indisponible), comportement transitoire signalé. *Q36 (2026-10-17) : la grille initiale « au pas de 5 » est levée ; seule la borne haute reste à appliquer.*
- `nearestGridValue` (bornage à 5..3535 depuis Q36), `stepTarget`, correction de `steppedValue`, maintien de la Cible Durée (Q21, P38, H19, AD-16 ; politique existante conservée depuis Q36) : E3.
- Nature `lowerBound`, calcul des Cibles mixtes, formateur unique, agrégation ≥ : E2 (2.1, 2.2). Dans 1.1, aucune donnée ni aucun geste ne produit de Cible mixte ; toute Cible `FAILURE` donne un total omis, comme l'ancien Mode.
- Phrase des Cibles mixtes, rejeu du corpus en Durée tout à l'échec, variantes : 2.3. Textes de carte H20 et H28 vérifiés : 2.4.
- Affichage de l'avis de migration et Séance vide visible : 1.2. Copies, duplications et Instantanés vérifiés de bout en bout : 1.3. Jeu de données v9 complet et procédure de recette : 1.4.
- Valeur numérique négative ou non entière (Cible, Pause, Pause au changement de côté, Bip, Compte à rebours, Fin), dans une Définition ou une Copie, quelle que soit la ligne : tranché par Q28 (Exercice écarté et dénombré selon Q19, AC9 (c11)). Valeur positive hors bornes : conservée (AC14), sauf en première ligne d'une Copie en Séance quand sa projection violerait le CHECK d'`activities` (P45, AC9 (c10)).

---

### Story 1.2 : Avis des Exercices écartés et Séance vide visible

En tant que Hermann (utilisateur de KODJO),
je veux être informé une fois du nombre d'Exercices illisibles écartés par la mise à jour, et retrouver mes Séances même si elles ont perdu tous leurs Exercices,
afin de savoir ce qui n'a pas pu être repris et de ne perdre aucune Séance.

**Exigences :** FR-18-20 (septième et huitième conséquences : signalement ; sixième conséquence : Séance vide visible et ouvrable) ; FR-18-16 (toutes les Séances présentes) ; NFR-04, NFR-08, NFR-09 ; Q19, H24, P39.
**Architecture :** AD-12, AD-11 ; piège `SQLiteProvider` (AGENTS.md). Fichiers principalement touchés (indicatif) : `src/features/migration/MigrationNoticeGate.tsx` (nouveau, emplacement indicatif), `app/_layout.tsx` (montage unique sous `SessionServiceProvider`), `src/features/sessions/SessionServiceProvider.tsx`, repository des avis de 1.1, `src/infrastructure/database/repositories/SqliteSessionRepository.ts` (lectures `:229-235` et liste `:470-475`, `JOIN activities`), `src/shared/i18n/`.
**Dépend de :** 1.1.
**Hypothèses non validées :** H24 (forme du signalement, texte singulier d'AC4 compris) — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Message unique au premier lancement après la migration.**
**Given** une base migrée dont `migration_notices` contient une ligne non acquittée `count` = 2 **When** l'application démarre **Then** une `Alert` native s'affiche une seule fois, avec le texte du lexique « 2 exercices illisibles n’ont pas pu être repris. » et un seul bouton de fermeture **And** aucun identifiant, nom ni contenu d'Exercice écarté n'est affiché. *(FR-18-20 septième et huitième conséquences ; H24 ; AD-12)*

**AC2 — Acquittement à l'appui, aucune réapparition.**
**Given** l'avis de l'AC1 affiché **When** Hermann touche le bouton **Then** le repository écrit la date d'acquittement **And When** l'application est relancée **Then** aucun avis ne s'affiche **And Given** l'application fermée avant l'appui sur le bouton **When** elle est relancée **Then** l'avis s'affiche de nouveau : il ne disparaît qu'une fois fermé par son bouton (H24 précisée ; AD-12). *(FR-18-20 huitième conséquence ; H24 ; AD-12)*

**AC3 — Aucun avis sans Exercice écarté.**
**Given** une migration qui n'a écarté aucun Exercice (table vide) **When** l'application démarre **Then** aucun avis ne s'affiche. *(FR-18-20 septième conséquence)*

**AC4 — Nombre singulier.**
**Given** une ligne non acquittée `count` = 1 **When** l'application démarre **Then** le texte, issu du lexique, indique le nombre 1 avec un accord grammatical correct. La forme exacte au singulier n'a pas de source : elle est proposée dans le lexique (par exemple « 1 exercice illisible n’a pas pu être repris. ») et validée par Hermann à la recette (H24 n'en donne que l'exemple au pluriel). *(FR-18-20 ; H24 ; NFR-08)*

**AC5 — Lecteur unique, montage sûr.**
**Given** le code livré **When** on recherche les lecteurs de `migration_notices` **Then** seul `MigrationNoticeGate`, monté une fois à la racine sous `SessionServiceProvider`, lit l'avis **And** il n'est pas passé en `children` de `SQLiteProvider` (piège de l'écran blanc, `SessionServiceProvider.test.tsx:36-47` reste vert) **And** le texte passe par une clé du lexique (RM-092). *(AD-12, AD-11 ; NFR-08)*

**AC6 — Séance sans occurrence visible dans la liste.**
**Given** une Séance dont toutes les Copies ont été écartées par la migration (Séance B de la story 1.1) **When** Hermann ouvre la liste des Séances **Then** la Séance y figure ; sa carte affiche « 0 exercice · {n} tours » et la durée « 0 min » (zéro au singulier, Q32 ; « 0 exercice · 0 min » est le résumé de Composition, visible à l'ouverture) **And** les autres Séances gardent leur résumé, leur ordre et leur durée inchangés. *(FR-18-20 sixième conséquence, FR-18-16 ; P39)*

**AC7 — Séance sans occurrence ouvrable.**
**Given** la même Séance **When** Hermann la touche **Then** l'écran existant de la Séance s'ouvre, sans Exercice et sans erreur **And** la lecture par identifiant renvoie la Séance avec ses paramètres et une composition vide, au lieu de l'absence actuelle due à `JOIN activities`. Les règles existantes d'enregistrement d'une Séance (au `Continuer`) sont inchangées. *(FR-18-20 sixième conséquence ; P39 ; Q4)*

**Preuves attendues :**
- Tests de composant de `MigrationNoticeGate` (avis présent, absent, acquitté, singulier) avec un repository de test ; test SQLite réelle du repository (écriture de l'acquittement, relecture).
- Tests `node:sqlite` de `SqliteSessionRepository` : liste et lecture d'une Séance sans occurrence, à partir de la base migrée de 1.1.
- `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22 ; compatibilité vérifiée en ouverture de 3.1) :
  - **R-1.2-01** — Préconditions : installation de départ contenant une Définition et une Copie illisibles (procédure de 1.4). Gestes : lancer l'application après mise à jour ; lire le message ; quitter l'application sans toucher le bouton ; relancer ; toucher le bouton ; relancer. Attendu fonctionnel : un message « 2 exercices illisibles n’ont pas pu être repris. », un bouton ; message de nouveau présent après la sortie sans fermeture ; plus de message après fermeture par le bouton (FR-18-20, H24). Attendu visuel : `Alert` native iOS, aucune frame Figma (NON VÉRIFIABLE).
  - **R-1.2-02** — Préconditions : Séance dont toutes les Copies étaient illisibles. Gestes : onglet des Séances → toucher la Séance. Attendu fonctionnel : Séance présente, carte « 0 exercice · {n} tours » et « 0 min » (Q32) ; elle s'ouvre vide, avec le résumé de Composition « 0 exercice · 0 min » (P39). Attendu visuel : rendu existant de la liste et de la Séance, aucune frame propre (NON VÉRIFIABLE).
  - Rappel NFR-04 : une suite verte ne vaut pas recette.

**Hors story :** toute refonte de Composition ou de l'écran de Séance (Q4) ; le comportement sur Android et sur le web de l'`Alert` n'est pas recetté (Q5).

---

### Story 1.3 : Copies, duplications et Instantanés à Cibles typées

En tant que Hermann (utilisateur de KODJO),
je veux que copier un Exercice dans une Séance, le dupliquer, en faire un Instantané ou annuler une édition conserve exactement ses Cibles typées, ses Médias et ses autres propriétés,
afin que mes Séances et mon historique restent fidèles, sans synchronisation cachée ni donnée perdue ou inventée.

**Exigences :** FR-05-05 (première conséquence : copie et Instantané) ; FR-06-06 ; FR-15-01 ; FR-15-07 (première conséquence) ; FR-18-17 ; FR-18-18 ; FR-19-01 à FR-19-13 ; FR-21-50 à FR-21-56 ; FR-21-58 ; NFR-05, NFR-06, NFR-07 ; H11, H12, H29 ; P8, P15, P27, P28, P36.
**Architecture :** AD-9, AD-3 (Instantanés), AD-13 (validation au `Continuer`). Fichiers principalement touchés (indicatif) : `src/domain/activities/ActivityDefinition.ts` (`activityDefinitionToDraftExercise`), `src/domain/sessions/composition.ts` (`duplicateActivity`), `SessionDraft.ts`, `src/domain/activities/exerciseSnapshot.ts`, `src/features/sessions/ExerciseScreen.tsx`, `CompositionScreen.tsx`, `src/domain/media/`, repositories de Séance, de Définitions et de Médias.
**Dépend de :** 1.1.
**Hypothèses non validées :** H11, H12, H29 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Copie Catalogue → Séance complète.**
**Given** une Définition d'Exercice Durée, Régime variables, Cibles `[NUMBER 30, NUMBER 45, FAILURE]`, Pauses 10 s × 3, Bip 0, côtés `RIGHT_LEFT`, ordre `BY_SERIES`, Pause au changement de côté 5 s, Compte à rebours 3 s, Fin 4 s, une Catégorie, 2 Zones, 3 Médias ordonnés **When** elle est ajoutée à une Séance puis la Séance enregistrée au `Continuer` et relue **Then** la Copie porte le même nom, la même description, la même Catégorie, les mêmes Zones, les mêmes Médias dans le même ordre et des Paramètres d'exécution égaux champ par champ, types de Cible et ordre compris **And** sa Récupération vaut 0 **And** la Définition ne porte ni position de Séance ni Récupération. *(FR-05-05, FR-06-06, FR-15-01 première conséquence, FR-19-01 première conséquence, FR-19-02, FR-19-04 ; P27)*

**AC2 — Isolation dans les deux sens, clonage profond.**
**Given** la Copie de l'AC1 **When** on modifie la Définition (Cible, Pause, ordre) puis on relit la Copie **Then** la Copie est inchangée **And When** on modifie la Copie (Cible de la ligne 1, ordre des lignes, retrait d'un Média), puis `Terminer` et `Continuer` **Then** la Définition et les autres Copies sont inchangées et aucune collection mutable n'est partagée (modifier l'objet copié ne modifie pas l'objet source en mémoire). *(FR-19-01 deuxième et troisième conséquences, FR-19-02 troisième conséquence, FR-19-03, FR-21-54 ; AD-9)*

**AC3 — Copie groupée atomique et ordonnée (non-régression).**
**Given** trois Définitions sélectionnées dans la liste filtrée **When** la copie groupée réussit **Then** les Copies apparaissent dans l'ordre de présentation de la liste filtrée, chacune avec ses Cibles typées **And When** un échec est provoqué pendant la copie groupée **Then** la Composition est inchangée, sans sous-ensemble inséré. *(FR-19-05)*

**AC4 — Copie d'une Définition à Cible héritée à renseigner (H29).**
**Given** une Définition dont une Cible est `UNSET` **When** Hermann l'ajoute à une Séance **Then** la Copie entre dans le Brouillon de Composition avec sa Cible `UNSET`, jamais `FAILURE` **And When** il touche `Continuer` sans la renseigner **Then** l'enregistrement est refusé (comportement existant) et la base est inchangée. *(FR-06-02 ; H29 ; AD-13)*

**AC5 — Duplication d'un Exercice de Séance.**
**Given** une Copie en Séance à Cibles `[NUMBER 10, NUMBER 12, FAILURE]` en Répétitions, Récupération 40 s, Catégorie, Zones et 2 Médias **When** Hermann la duplique **Then** la nouvelle Copie a un identifiant différent, est placée immédiatement après la source, et porte des Paramètres d'exécution (types et ordre compris), une Récupération de 40 s, une Catégorie, des Zones et des Médias ordonnés égaux **And** le nombre de Définitions au Catalogue est inchangé **And** modifier l'une ne modifie pas l'autre. *(FR-19-07, FR-19-08 première conséquence)*

**AC6 — Duplications non offertes : sans objet.**
**Given** le code de départ, qui n'offre ni duplication de Séance ni duplication d'Exercice au Catalogue **When** la story est livrée **Then** aucun nouveau parcours de duplication n'existe (routes et actions inchangées) et les deuxième et troisième conséquences de FR-19-08 sont consignées sans objet dans le compte rendu de la story. *(FR-19-08 ; P36 ; Q4)*

**AC7 — Augmentation de N depuis une ligne à l'échec.**
**Given** un Exercice Répétitions, Régime variables, Cibles `[NUMBER 10, FAILURE]`, Pauses 10 s et 20 s (fixture de domaine ; Exercice migré tout à l'échec pour le parcours d'interface) **When** N passe de 2 à 3 **Then** la ligne ajoutée est `FAILURE`, avec une Pause de 20 s et sans valeur numérique **And** après `Terminer` et réouverture, elle est relue ainsi. *(FR-19-09)*

**AC8 — Suppression d'une source sans effet sur les copies.**
**Given** le code de départ, qui n'expose aucune suppression ni archivage de Définition (`ActivityDefinitionRepository.ts:7`) **When** la story est livrée **Then** le seul cas de disparition d'une source est l'écart par la migration, couvert en 1.1 (AC12 : Copie lisible intacte, Cibles typées et Médias compris) **And** FR-19-06 est consigné sans autre objet dans le compte rendu. *(FR-19-06 ; Q4)*

**AC9 — Instantanés v1 relus selon leur version, jamais réécrits.**
**Given** des enveloppes d'Instantané v1 en mémoire (H11) : l'une sans Bip, l'une en Ancien mode `TO_FAILURE` à 3 Séries avec `actualDurationSeconds` NULL, l'une avec `actualDurationSeconds` = 95 **When** elles sont relues après la migration et après modification de leur Définition source **Then** leur contenu sérialisé est identique octet pour octet à celui d'avant **And** l'Instantané sans Bip est lu avec un Bip 0 (non cadencé) **And** l'Instantané `TO_FAILURE` est lu sans erreur, en Répétitions avec 3 Cibles `FAILURE`, sans aucun nombre de répétitions **And** `actualDurationSeconds` NULL reste NULL (jamais 0) et 95 reste 95, sans recalcul depuis la source. *(FR-15-07 première conséquence, FR-19-10, FR-19-12 ; H11, P28 ; AD-3)*

**AC10 — Nouveaux Instantanés typés et immuables.**
**Given** une Copie à Cibles `[NUMBER 30, FAILURE, NUMBER 45]`, côtés `RIGHT_LEFT`, Bip 2, 3 Médias ordonnés **When** un Instantané est créé puis relu **Then** sa version est 2, il restitue les mêmes types, valeurs, ordre et Bip (une seule valeur de Bip pour toutes les Séries et les deux côtés) **And** il restitue les Médias dans leur ordre, par référence, sans copie de fichier **And** modifier ensuite la Copie ne change pas l'Instantané relu (objet gelé). *(FR-05-05, FR-06-06, FR-19-11 ; AD-3)*

**AC11 — Aucune écriture à l'annulation ni avant l'enregistrement validé.**
**Given** chacun des quatre Parcours d'édition **When** Hermann modifie des paramètres, touche ✓ de la Feuille puis ferme l'application sans `Terminer`, ou touche ✕ de la Feuille, ou abandonne l'Éditeur avec confirmation **Then** la base relue est identique à son état d'avant ouverture, et aucun fichier de Média encore référencé n'est supprimé **And** après ✕ de la Feuille, le Brouillon de l'Éditeur garde ses paramètres d'avant ouverture **And** en Séance, `Terminer` n'écrit que dans le Brouillon de Composition ; la Copie n'est écrite en base qu'au `Continuer`. *(FR-18-17, FR-19-13 ; P8)*

**AC12 — Échec d'écriture sans perte du Brouillon.**
**Given** une Définition modifiée dans l'Éditeur **When** une erreur d'écriture est injectée à `Terminer` **Then** la base est inchangée, l'Éditeur reste affiché avec toutes les valeurs saisies, et une nouvelle tentative réussie les enregistre **And Given** une Définition supprimée en base entre l'ouverture et `Terminer` (par le test) **When** Hermann touche `Terminer` **Then** une erreur est signalée et aucune Définition n'est recréée. *(FR-18-18)*

**AC13 — Médias ordonnés, référencés, jamais supprimés s'ils sont référencés.**
**Given** un Exercice avec 3 Médias **When** on importe un quatrième, réordonne, touche `Terminer` et rouvre **Then** les Médias sont relus dans l'ordre affiché avant `Terminer`, avec la même identité, sans deux positions égales, et la vignette de carte utilise le premier **And** avant `Terminer`, aucun lien du Média ajouté n'existe en base ; après, tous existent dans l'ordre du Brouillon **And** la base ne contient aucun contenu de fichier, et chaque référence pointe vers un fichier existant, inchangée depuis l'import **And** réordonner les Médias d'un Exercice ne change pas l'ordre de ceux de sa copie **And** après copie Catalogue → Séance ou duplication, le nombre de fichiers de Médias est inchangé et la copie référence les mêmes fichiers dans le même ordre. *(FR-21-50, FR-21-51, FR-21-52, FR-21-53)*

**AC14 — Fichiers référencés conservés en toutes circonstances.**
**Given** un fichier référencé par une Définition, une Copie, un Instantané seul, ou un Exercice ou une Séance archivés (H12) **When** on exécute chacune des opérations de PRE-4 (enregistrement, retrait d'un Média d'un autre Exercice, abandon, migration) **Then** le fichier existe toujours **And** retirer un Média d'une Copie puis `Continuer` ne retire que ce lien : la Définition source et les autres Copies le gardent, et le fichier existe. *(FR-21-54, FR-21-55, FR-19-13 deuxième conséquence ; H12)*

**AC15 — Import annulé ou en erreur (non-régression PRE-3).**
**Given** un Exercice à 2 Médias **When** un import est annulé puis `Terminer` **Then** l'Exercice relu a les mêmes 2 Médias **And When** un import échoue, puis un réessai réussit, puis `Terminer` **Then** l'Exercice relu a 3 Médias, le nouveau en dernière position, sans lien ni fichier référencé orphelin. *(FR-21-56 ; P18)*

**AC16 — Média indisponible.**
**Given** un Exercice, une Copie et un Instantané dont un fichier de Média a disparu **When** ils sont relus **Then** la lecture réussit avec tous les autres paramètres et tous les liens de Médias, et le lien du fichier disparu n'est pas supprimé. *(FR-21-58)*

**AC17 — Réouverture d'une Copie : mêmes Cibles, même montant.**
**Given** une Copie en Séance enregistrée **When** elle est rouverte dans l'Éditeur **Then** elle a les mêmes Mode et Cibles typées, et la Durée totale affichée est produite par la même fonction de calcul que pour une Définition aux mêmes paramètres (même montant, même nature). *(FR-15-01 troisième et quatrième conséquences)*

**Preuves attendues :**
- Tests unitaires du domaine : clonage profond de `activityDefinitionToDraftExercise` et `duplicateActivity`, transition N + 1, Instantanés v1 et v2.
- Tests SQLite réelle `node:sqlite` : copie, `Continuer`, duplication, réouverture, injection d'échec à `Terminer` et au `Continuer`, Médias et comptes de fichiers (fichiers simulés par un magasin de test dont on compte les appels de suppression).
- Tests d'intégration `*.integration.test.tsx` : quatre Parcours d'édition avec ✕, abandon et fermeture sans `Terminer` (AC11).
- `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22 ; compatibilité vérifiée en ouverture de 3.1) :
  - **R-1.3-01** — Préconditions : ancien Exercice « À l’échec » migré, avec Médias. Gestes : Composition → `Ajouter un exercice` → le choisir → ouvrir la Copie → changer une Pause → `Terminer` → `Continuer` → rouvrir la Définition au Catalogue. Attendu fonctionnel : Copie à Cibles `à l’échec` et Médias dans le même ordre ; Définition inchangée (FR-19-01, FR-19-03). Attendu visuel : rendu existant de Composition et de l'Éditeur ; aucune frame propre à la copie (NON VÉRIFIABLE).
  - **R-1.3-02** — Gestes : dupliquer cette Copie dans Composition. Attendu fonctionnel : nouvelle Copie juste après la source, mêmes Cibles, Récupération et Médias ; Catalogue inchangé (FR-19-07). Attendu visuel : NON VÉRIFIABLE.
  - **R-1.3-03** — Gestes : ouvrir la Feuille d'un Exercice, modifier, ✓, puis quitter l'Éditeur par abandon confirmé ; rouvrir. Attendu fonctionnel : rien n'a changé (FR-18-17). Attendu visuel : dialogue d'abandon existant.
  - Rappel NFR-04.

**Hors story :** l'adaptation d'une Copie à un circuit de séries et les relevés qualifiés (Composition, moteur, hors périmètre) ; le calcul des natures `lowerBound` (E2) : AC17 n'exige que l'identité du calcul ; l'interface des Médias dans l'Éditeur (4.4).

---

### Story 1.4 : Preuve de préservation sur une base antérieure réelle

En tant que Hermann (utilisateur de KODJO),
je veux une preuve, sur une vraie base SQLite contenant des données d'avant PRE-4, que la migration conserve tout ce qui est lisible, écarte proprement l'illisible et s'annule entièrement en cas d'erreur, ainsi qu'une procédure pour préparer ces données sur mon iPhone,
afin de pouvoir installer PRE-4 sur mes données réelles en confiance et de recetter la préservation moi-même.

**Exigences :** FR-18-19 ; FR-18-10 à FR-18-16 (dont FR-18-13, aucune valeur factice, AC2), FR-18-20, FR-21-57 (vérifiés sur le jeu complet) ; FR-18-08, FR-18-09 (relus après réouverture) ; NFR-04, NFR-05, NFR-06 ; Q5, Q6, Q19, Q22, Q28 ; P29.
**Architecture :** AD-10, AD-4. Fichiers principalement touchés (indicatif) : un module de fixture de base v9 sous `src/infrastructure/database/__tests__/` (ou `testing/`), un test d'intégration de migration ; `docs/preparation/PRE-4/bmad/recette-iphone.md` §2 (procédure) ; aucun code de production nouveau.
**Dépend de :** 1.1, 1.2, 1.3.
**Hypothèses non validées :** H21 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Jeu de données v9 complet.**
**Given** une base fichier `node:sqlite` construite par `migration001` à `migration009` **When** la fixture l'alimente **Then** elle contient au moins : des Définitions et des Copies en Séance en Ancien mode À l'échec, en JSON v1 et en scalaires seuls, uniformes et variables ; des Exercices en Durée et en Répétitions avec côtés bilatéraux, Bip, Pauses, Catégorie, plusieurs Zones et plusieurs Médias ordonnés ; des Médias partagés entre une Définition et une Copie ; des données anciennes sans Bip ni Régime explicite ; des valeurs positives hors grille ou hors bornes, conservées (Durée 7 s et 5999 s, Répétitions 150, Bip 11) ; une Définition Répétitions sans nombre ; des Récupérations, une zone `IN_TOUR` et plusieurs Séances **And** la fixture consigne, avant migration, le compte de chaque table et la liste des identifiants. *(FR-18-19 premier critère ; AD-10)*

**AC2 — Migration du jeu complet : tout le lisible est conservé.**
**Given** la base de l'AC1 **When** `migration010` s'exécute **Then** FR-18-10 à FR-18-14 et FR-21-57 sont vérifiés sur chaque Exercice : Mode et Cibles convertis selon 1.1, tous les autres paramètres identiques **And** les comptes après migration sont égaux aux comptes avant pour `sessions`, `activity_definitions`, `activities`, `categories`, les Zones, `media_assets`, `activity_media`, `session_activity_media` et les tables de Zones liées **And** l'ensemble des identifiants est identique **And** `migration_notices` est vide. *(FR-18-11, FR-18-12, FR-18-16, FR-18-19 troisième critère, FR-21-57 ; H21)*

**AC3 — Variante avec illisibles.**
**Given** la base de l'AC1 complétée d'au moins une Définition et une Copie illisibles parmi des Exercices lisibles, avec Catégorie, Zones et Médias dont l'un est partagé avec un Exercice lisible, et d'une Définition et d'une Copie portant une valeur négative ou non entière (Pause −5 en ligne 2 ; Bip 2,5), illisibles selon Q28 **When** `migration010` s'exécute **Then** FR-18-20 est vérifiée : les comptes après migration valent les comptes avant moins exactement les Exercices écartés et leurs liens ; les Catégories, Zones, `media_assets` et toutes les Séances sont présents (une Séance dont l'occurrence est retirée est conservée, P39) ; aucun lien orphelin ; `migration_notices` contient `count` = 4 (2 illisibles de structure + 2 selon Q28) ; les valeurs positives hors bornes de l'AC1 sont conservées. *(FR-18-19 deuxième et troisième critères, FR-18-20 ; Q19, Q28)*

**AC4 — Annulation sur le jeu complet.**
**Given** la variante de l'AC3 **When** une erreur structurelle est injectée pendant la migration **Then** l'état relu est identique à l'état de départ, Exercices illisibles compris, `user_version` = 9. *(FR-18-19 quatrième critère, FR-18-15)*

**AC5 — Allers-retours relus depuis la base.**
**Given** la base migrée de l'AC2 **When** on enregistre une Définition et une Séance (Cibles mixtes, Médias ordonnés), on ferme la base, puis on la rouvre **Then** les valeurs relues proviennent de la base rouverte (nouvelle connexion, aucun état en mémoire) et sont égales à celles enregistrées. *(FR-18-19 cinquième critère, FR-18-08, FR-18-09)*

**AC6 — Procédure de préparation des données de recette.**
**Given** `docs/preparation/PRE-4/bmad/recette-iphone.md` §2 **When** la story est livrée **Then** la section décrit pas à pas : (1) le chargement de la version de départ `c32e360d` dans le dev client « Routine Dev » déjà installé sur l'iPhone, par `npx expo start` depuis ce clone (Q22) ; (2) la création, par l'interface de cette version, de chaque donnée de la liste du §2 (Exercices `À l’échec` en Durée et en Répétitions, Régimes identiques et variables, Pauses et Bip, Copies en Séance, Médias ordonnés, Catégories et Zones), avec les valeurs exactes à saisir ; (3) la production d'au moins une Définition et une Copie aux paramètres illisibles (Q19), par un moyen qui ne laisse aucun code dans la branche livrée et qui est décrit précisément ; (4) le relevé, avant mise à jour, des données présentes (comptes visibles, liste des Exercices et Séances) ; (5) le chargement de la version PRE-4 dans le même dev client, sans réinstallation ni effacement des données **And** la procédure indique qu'elle n'est exécutée qu'après la vérification de compatibilité du dev client faite en ouverture de la story 3.1 (Q22) ; si un nouveau build est nécessaire, elle s'arrête et le signale à Hermann **And** aucune mesure (durée de migration, temps) n'y est inscrite si elle n'a pas été observée (Q6). *(FR-18-19 sixième critère, FR-18-16 ; P29, Q5, Q6, Q22)*

**AC7 — Scénarios de recette de la préservation.**
**Given** la procédure de l'AC6 **When** la story est livrée **Then** `recette-iphone.md` contient les scénarios R-1.4-01 à R-1.4-03 ci-dessous, et rappelle les scénarios R-1.1-xx, R-1.2-xx et R-1.3-xx qui utilisent ces données. *(FR-18-19 ; Q5)*

**Preuves attendues :**
- Test d'intégration de migration sur base fichier `node:sqlite` réelle (AC1 à AC5), relu après fermeture et réouverture ; aucune simulation de la persistance.
- `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22 ; compatibilité vérifiée en ouverture de 3.1) :
  - **R-1.4-01** — Préconditions : données préparées selon l'AC6, relevé fait. Gestes : charger PRE-4 dans le dev client (procédure de l'AC6) ; lancer ; parcourir Catalogue, Séances, chaque Exercice relevé, ses Médias, ses Catégorie et Zones. Attendu fonctionnel : toutes les Séances, Catégories, Zones et fichiers de Médias présents ; toutes les Définitions et Copies lisibles présentes, avec leurs paramètres ; anciens Exercices « À l’échec » en Répétitions, Cibles `à l’échec` (FR-18-16, FR-18-10). Attendu visuel : rendu existant ; aucune frame propre (NON VÉRIFIABLE).
  - **R-1.4-02** — Préconditions : données avec Exercices illisibles. Attendu fonctionnel : message de 1.2 avec le bon nombre ; Exercices illisibles absents ; leurs Séances présentes ; Médias partagés toujours visibles depuis l'Exercice lisible (FR-18-20). Attendu visuel : `Alert` native (NON VÉRIFIABLE).
  - **R-1.4-03** — Attendu fonctionnel : aucune réinitialisation ; un Exercice ancien modifié puis `Terminer` est relu modifié et le reste est intact (FR-18-16, FR-18-08).
  - Rappel NFR-04 : une suite verte ne vaut pas recette ; la validation appartient à Hermann.

**Hors story :** la durée de la migration sur une base réelle (aucune mesure disponible ; à observer en recette, sans chiffre fabriqué) ; la publication EAS (exclue de la préparation actuelle, Q5, Q22).

---

#### Couverture E1

| FR | Story / AC |
|---|---|
| FR-05-05 | 1.1 AC1, AC10, AC18, AC21, AC22 ; 1.3 AC1, AC10 |
| FR-06-02 (domaine, données) | 1.1 AC1, AC5, AC18, AC22, AC23 ; 1.3 AC4 |
| FR-06-06 | 1.3 AC1, AC10 |
| FR-09-01 | 1.1 AC6 |
| FR-09-02 | 1.1 AC6 |
| FR-09-03 | 1.1 AC6 |
| FR-09-05 (domaine) | 1.1 AC7, AC11, AC23, AC24 |
| FR-15-01 | 1.1 AC18, AC20 ; 1.3 AC1, AC17 |
| FR-15-07 | 1.1 AC20 ; 1.3 AC9 |
| FR-18-01 | 1.1 AC1, AC3, AC4, AC5, AC10, AC19 |
| FR-18-02 | 1.1 AC1, AC2, AC5, AC16, AC18 |
| FR-18-03 | 1.1 AC5, AC8, AC19 |
| FR-18-04 | 1.1 AC2, AC16, AC18 |
| FR-18-05 | 1.1 AC2 |
| FR-18-06 | 1.1 AC3, AC6, AC7, AC24 |
| FR-18-07 | 1.1 AC3, AC7, AC11, AC24 |
| FR-18-08 | 1.1 AC18 ; 1.4 AC5 |
| FR-18-09 | 1.1 AC18 ; 1.4 AC5 |
| FR-18-10 | 1.1 AC10, AC21 ; 1.4 AC2 |
| FR-18-11 | 1.1 AC10, AC15 ; 1.4 AC2 |
| FR-18-12 | 1.1 AC10, AC12 ; 1.4 AC2 |
| FR-18-13 | 1.1 AC10, AC11 ; 1.4 AC2 |
| FR-18-14 | 1.1 AC7, AC11, AC14, AC23, AC24 ; 1.4 AC2 |
| FR-18-15 | 1.1 AC12, AC17 ; 1.4 AC4 |
| FR-18-16 | 1.1 AC12, AC15 ; 1.2 AC6 ; 1.4 AC2, AC6 |
| FR-18-17 | 1.3 AC11 |
| FR-18-18 | 1.3 AC12 |
| FR-18-19 | 1.4 AC1 à AC7 |
| FR-18-20 | 1.1 AC9, AC12, AC13, AC14 ; 1.2 AC1 à AC7 ; 1.4 AC3 |
| FR-19-01 | 1.3 AC1, AC2 |
| FR-19-02 | 1.3 AC1, AC2 |
| FR-19-03 | 1.3 AC2 |
| FR-19-04 | 1.3 AC1 |
| FR-19-05 | 1.3 AC3 |
| FR-19-06 | 1.3 AC8 (avec 1.1 AC12) |
| FR-19-07 | 1.3 AC5 |
| FR-19-08 | 1.3 AC5, AC6 |
| FR-19-09 | 1.3 AC7 (et 1.1 AC22, transition mécanique) |
| FR-19-10 | 1.3 AC9 |
| FR-19-11 | 1.3 AC10 |
| FR-19-12 | 1.3 AC9 |
| FR-19-13 | 1.3 AC11, AC14 |
| FR-21-50 | 1.3 AC13 |
| FR-21-51 | 1.3 AC13 |
| FR-21-52 | 1.3 AC13 |
| FR-21-53 | 1.3 AC13 |
| FR-21-54 | 1.3 AC2, AC14 |
| FR-21-55 | 1.3 AC14 |
| FR-21-56 | 1.3 AC15 |
| FR-21-57 | 1.1 AC12, AC15 ; 1.4 AC2 |
| FR-21-58 | 1.3 AC16 |
