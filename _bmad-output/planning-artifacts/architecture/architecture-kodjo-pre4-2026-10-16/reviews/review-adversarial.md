# Revue adverse — Architecture Spine PRE-4

> Historique — revue interne du 2026-10-16, antérieure à la revue ChatGPT ; non mise à jour.

- **Objet :** `ARCHITECTURE-SPINE.md` (draft du 2026-10-16), AD-1 à AD-12.
- **Méthode :** pour chaque trou, deux unités de niveau inférieur (stories A et B) respectent chaque AD **à la lettre** et produisent pourtant un résultat incompatible. Le trou est ensuite fermé par un AD nouveau ou resserré, dont le texte est proposé.
- **Intrants lus :** spine ; PRD (§4.3 à §4.19) ; `extracts/code-depart.md` ; code de départ (`ExecutionParameters.ts`, `executionPhrase.ts`, `SessionDraft.ts`, `ExerciseScreen.tsx`, `CompositionScreen.tsx`, `validation.ts`, migrations 004, 006, 007, `SqliteSessionRepository.ts`). Rien n'a été lu sous `docs/preparation/PRE-4/planification/` ni sous `.github/orchestration/`.
- **Revue :** aucune revue ChatGPT n'est déclarée ici. Ce document est une revue interne.

## Synthèse

**20 trous.** Gravité : 6 critiques ou hautes de premier rang, 6 hautes ou moyennes, 8 moyennes ou basses.

| # | Trou | Gravité | AD visés |
|---|---|---|---|
| T1 | Prédicat « illisible » contradictoire avec FR-18-14 | Critique | AD-4 |
| T2 | Lecture d'une donnée lisible mais invalide : type impossible | Critique | AD-1, AD-3 |
| T3 | Valeurs historiques hors grille inchangées : bloquées ou acceptées à l'écriture ? | Critique | AD-1, AD-2 |
| T4 | Forme exacte du JSON v2 non fixée (migration contre domaine) | Haute | AD-3, AD-4 |
| T5 | Projection scalaire calculée en quatre endroits ; scalaires encore portés par les types de Séance | Haute | AD-3 |
| T6 | Migration 010 : scalaires non réécrits, ordre des étapes, bornes du nouveau CHECK, miroir TypeScript | Haute | AD-4 |
| T7 | Séquencement des stories : aucun état intermédiaire vert possible | Haute | AD-1, AD-3, AD-4 |
| T8 | Contrat des roulettes étendues : sentinelle d'échec, signature, recalage | Haute | AD-7, AD-1 |
| T9 | Propriétaire de la surface ouverte (popover, Sélecteur, outil ±, Cellule active) | Haute | AD-2, AD-7, AD-8 |
| T10 | Avis de migration : granularité, acquittement, point de montage | Moyenne | AD-12 |
| T11 | Séance ou Circuit vidés par l'écart d'une Copie illisible | Moyenne | AD-4 |
| T12 | `lowerBound` à deux niveaux : table de précédence absente | Moyenne | AD-5 |
| T13 | Formateur unique : emplacement et propriétaire des textes | Moyenne | AD-5, AD-11 |
| T14 | Oracle de parité : l'adaptateur scalaire du domaine survit-il ? | Moyenne | AD-1, AD-3, AD-4 |
| T15 | Instantané : version de l'enveloppe ou version des paramètres | Moyenne | AD-3 |
| T16 | N hérité (FR-12-07) : où vit le verrou | Moyenne | AD-2, AD-5 |
| T17 | Mémoire par Mode : précédence entre échec et numérique mémorisé | Basse | AD-2 |
| T18 | DTO de liste de Séances et donnée corrompue à l'exécution | Basse | AD-3 |
| T19 | Corpus : adaptation des 92 cas `TO_FAILURE` | Basse | AD-10 |
| T20 | Constante 0,45 et accélération des ± : emplacement | Basse | AD-11, AD-8 |

---

## T1 — Prédicat « illisible » contradictoire avec FR-18-14 (critique)

- **Story A (migration, AD-4 à la lettre) :** une Définition `REPETITIONS` sans JSON et avec `repetition_count` NULL relève de « scalaires incohérents sans JSON ». Elle est supprimée et comptée dans `migration_notices`. Une telle ligne est possible dans `activity_definitions`, dont le CHECK de 006 ne contrôle pas le couple mode/cible.
- **Story B (recette FR-18-14) :** « Répétitions sans nombre » est cité comme donnée **lisible mais invalide**. Elle doit être conservée telle quelle, affichée telle quelle, jamais convertie en échec, et ne jamais être écartée (FR-18-20, avant-dernière conséquence).
- **Conflit :** le même enregistrement est supprimé par A et exigé par B. Le cas d'un JSON v1 analysable mais portant une cible 0 n'est pas classé non plus : `parseRow` v1 accepte 0 (`isNonNegativeInteger`).
- **AD proposé (AD-4, puce « Ligne illisible », remplacée) :**
  > **Prédicat fermé d'illisibilité.** Une ligne est illisible si et seulement si l'un des cas suivants est vrai : (a) `execution_parameters` non NULL et non analysable en JSON ; (b) JSON analysable dont la version n'est ni 1 ni 2, ou dont la structure ne permet pas de reconstruire Mode, Régime et N (clé absente, type JSON faux, `rows` vide, `count` < 1) ; (c) JSON NULL et `execution_mode` hors de `DURATION | REPETITIONS | TO_FAILURE` ou `series_count` NULL ou < 1. **Toute autre ligne est lisible**, même si elle viole les règles actuelles : cible numérique absente en Durée ou en Répétitions, cible 0, cible hors grille ou hors plage, Bip hors 0..10. Elle est migrée selon T2, jamais supprimée, jamais convertie en échec. La liste des cas (a) à (c) est testée un par un dans `migrateDatabase.test.ts`. Tout cas non listé est lisible.

## T2 — Lecture d'une donnée lisible mais invalide : type impossible (critique)

- **Story A (domaine, AD-1) :** la Cible lue est `NUMBER | FAILURE`. `UNSET` est interdite hors du brouillon. Une Définition « Répétitions sans nombre », conservée en vertu de T1 et FR-18-14, ne peut donc pas être lue : le lecteur lève `ExecutionParametersDataError`. Le Catalogue ne s'affiche plus.
- **Story B (migration) :** pour ne pas supprimer la ligne, elle écrit `{ kind: "NUMBER", value: 0 }`, ou un `null`. AD-1 et FR-06-01 l'interdisent, mais aucun AD ne dit quoi écrire à la place.
- **AD proposé (AD-1, ajout) :**
  > **Trois types et trois validations.**
  > - `SeriesTarget` (enregistrable) = `NUMBER(entier ≥ 1)` | `FAILURE`.
  > - `StoredSeriesTarget` (lu) = `SeriesTarget` | `{ kind: "MISSING" }`. `MISSING` n'est produit **que** par la migration 010, à partir d'une donnée historique lisible sans cible. Aucune écriture du domaine ne le produit.
  > - `DraftSeriesTarget` = `SeriesTarget` | `UNSET`.
  >
  > À l'ouverture de la Feuille, `MISSING` devient `UNSET` : contour orange, ✓ indisponible. La validation enregistrable refuse `MISSING` et `UNSET`. Une cible numérique historique 0 est lue `MISSING`, jamais `NUMBER(0)`. Le lecteur v2 accepte `MISSING`. Les calculs le traitent comme une erreur de saisie et non comme un total omis (FR-13-05). La phrase n'est pas générée (« Paramètres à compléter. »).

## T3 — Valeurs historiques hors grille inchangées : bloquées ou acceptées à l'écriture ? (critique)

- **Story A (domaine, AD-1 « bornes, validation ») :** `validateExecutionParameters` applique la grille : Durée 5..3535 au pas de 5, Répétitions 1..100, Bip 0..10. Un Exercice historique à 7 s ou à Bip 12, simplement renommé, ne peut plus être terminé : le ✓ de la Feuille et `Terminer` sont indisponibles.
- **Story B (Feuille, FR-09-05 et FR-18-14) :** la valeur inchangée est affichée et calculée telle quelle. Seule sa **modification** impose la grille. B laisse donc passer 7 s, et la validation de A le refuse.
- **Conflit aggravant :** FR-18-06 refuse un Bip 11 « à l'écriture ». Le même chemin d'écriture doit pourtant accepter un Bip 12 historique non modifié.
- **AD proposé (nouvel AD-13, « Tolérance historique par ligne de base ») :**
  > La validation enregistrable du domaine a deux niveaux.
  > 1. **Structurel**, toujours appliqué au repository : types, entiers, `NUMBER ≥ 1`, Durée ≤ 5999 (CHECK SQL), N 1..99.
  > 2. **Grille** : Durée 5..3535 au pas de 5, Répétitions 1..100, Bip 0..10, Pauses 0..300. Appliquée champ par champ, **sauf** si la valeur est identique, en type et en valeur, à celle de la **ligne de base**.
  >
  > La ligne de base est l'`ExecutionParameters` lu à l'ouverture de l'Éditeur. Elle est passée explicitement : `validateForSave(params, baseline)`. Pour une Cible, la comparaison se fait par identité de ligne d'origine (indice dans la ligne de base, suivi à travers `moveRow`). Pour le Bip et les Pauses communes, elle se fait par champ. Le ✓ de la Feuille (`commitSheetDraft`), `Terminer` (Catalogue et Séance) et `Continuer` (validation de Séance) appellent la même fonction avec la même ligne de base. Une création n'a pas de ligne de base : la grille s'applique partout.

## T4 — Forme exacte du JSON v2 non fixée (haute)

- **Story A (domaine) :** sérialise la Cible en `{"kind":"FAILURE"}` ou `{"kind":"NUMBER","value":30}`. Elle garde `series.kind` à `UNIFORM | VARIABLE`.
- **Story B (migration 010, convertisseur figé embarqué) :** écrit `"target":"FAILURE"` ou `"target":30`, introduit `"regime":"VARIABLE"`, copie les identifiants de ligne volatils et ajoute un `beep` par ligne (FR-18-04 cite « Cible, Pause, Bip » par Série).
- **Pourquoi A et B passent leurs tests :** le test de parité d'AD-4 compare le convertisseur au **lecteur v1** du domaine (objets), pas aux octets v2 relus par le **lecteur v2**. Les deux stories sont vertes. Sur l'iPhone, en revanche, chaque ligne migrée est rejetée par le lecteur v2.
- **Risque de recette :** si une base de recette a déjà reçu la migration 010 avec une forme v2 provisoire, toute correction ultérieure de la forme exige une migration 011.
- **AD proposé (AD-3, ajout « Forme v2 figée ») :**
  > La forme v2 est fixée ici, octet pour octet, ordre des clés compris :
  > `{"version":2,"mode":"DURATION"|"REPETITIONS","series":{"kind":"UNIFORM","count":n,"target":T,"pauseSeconds":p} | {"kind":"VARIABLE","rows":[{"target":T,"pauseSeconds":p},…]},"sideMode":…,"sideOrder":…,"sideRecoverySeconds":…,"cadenceBeepIntervalSeconds":b,"countdownSeconds":…,"endSeconds":…}`
  > avec `T` = `{"kind":"NUMBER","value":v}` | `{"kind":"FAILURE"}` | `{"kind":"MISSING"}` (T2, migration seulement).
  >
  > - Le Bip est unique, au niveau de l'Exercice, sans champ par ligne (P22).
  > - Aucune identité de ligne, Réserve, phrase ou total n'est sérialisé.
  > - Le Régime reste `series.kind`.
  > - Le test de parité d'AD-4 exige, pour chaque fixture, que (i) `parseV2(sortieMigration)` soit égal à `readV1(entrée)` et que (ii) `serializeV2(parseV2(sortieMigration))` soit égal **octet pour octet** à `sortieMigration`.
  > - Toute modification de cette forme après la première installation de la migration 010 sur un appareil exige une nouvelle migration.

## T5 — Projection scalaire calculée en quatre endroits ; scalaires encore portés par les types de Séance (haute)

**Constat dans le code.** `projectLegacyScalars` est appelée par :
- `ExerciseScreen.tsx:324` et `:533` (écriture dans le brouillon de Composition) ;
- `validation.ts:566` ;
- `ActivityDefinition.ts:256` (qui **revalide** ensuite les scalaires) ;
- `SqliteActivityDefinitionRepository.ts:71`.

Par ailleurs, `SessionDraftExercise` porte `executionMode`, `durationSeconds`, `repetitionCount`, `seriesCount` et `pauseSeconds` comme champs obligatoires, et `executionParameters?` comme champ **optionnel**. Le chemin historique de `validation.ts:579-617` valide les scalaires.

- **Story A (Éditeur, AD-3 « projection dérivée à l'écriture ») :** projette dans le brouillon de Séance, avec `durationSeconds: null` si la première Cible est `FAILURE`.
- **Story B (validation de Séance) :** conserve le chemin historique, puisque `executionParameters` reste optionnel dans le type. Elle refuse `DURATION` avec `durationSeconds` NULL. `Continuer` échoue sur la copie produite par A.
- **AD proposé (AD-3, resserré) :**
  > **Un seul lieu de projection : le mapping de ligne des repositories, juste avant l'`INSERT` ou l'`UPDATE`.** Les types du domaine (`SessionDraftExercise`, `Activity`, `CreateSessionActivityInput`, `ActivityDefinitionInput`) ne portent plus `executionMode`, `durationSeconds`, `repetitionCount`, `seriesCount` ni `pauseSeconds`. `executionParameters` y devient **obligatoire**.
  >
  > Le chemin historique de `validation.ts` et la revalidation scalaire d'`ActivityDefinition.ts` sont supprimés. `occurrenceParameters` et `resolveExecutionParameters` n'ont plus de consommateur hors lecture v1 (T14).
  >
  > Règle de projection, unique : `execution_mode` = Mode ; `duration_seconds` = `value` de la **première ligne effective** si elle est `NUMBER` et que le Mode est Durée, sinon NULL ; `repetition_count` idem en Répétitions ; `series_count` = N effectif ; `pause_seconds` = Pause de la première ligne effective. Une première Cible `FAILURE` ou `MISSING` projette NULL, même si une ligne suivante est numérique. On ne cherche jamais « la première cible numérique ».

## T6 — Migration 010 : scalaires non réécrits, ordre des étapes, bornes du nouveau CHECK, miroir TypeScript (haute)

- **Story A (migration, AD-4 à la lettre) :**
  - elle matérialise le JSON v2 et ne reconstruit pas `activity_definitions` ;
  - `execution_mode = 'TO_FAILURE'` reste dans les Définitions, puisque le CHECK de 006 l'autorise. Une requête SQL de recette sur FR-18-01 (« aucune Définition ne porte l'Ancien mode ») échoue ;
  - dans `activities`, l'étape de recopie `INSERT … SELECT` tombe sous le nouveau CHECK, qui exclut `TO_FAILURE`. Si la conversion des scalaires n'a pas été faite avant, c'est une erreur structurelle et la migration est annulée à chaque lancement.
- **Story B (CHECK reconstruit) :** le nouveau CHECK « accepte une première Cible FAILURE ». Il est aligné sur les nouvelles bornes (Durée 5..3535) pour « refléter le domaine ». Une Copie historique à 7 s ou à 5999 s viole le CHECK : c'est une erreur structurelle, la migration est annulée, et FR-18-14 est violé.
- **Story C (repository) :** `assertSessionAggregateRow` (`SqliteSessionRepository.ts:1205-1250`) reste à l'ancienne règle et rejette les Répétitions avec `repetition_count` NULL.
- **AD proposé (AD-4, ajout « Étapes ordonnées et CHECK ») :**
  > Ordre imposé dans la transaction unique :
  > 1. Lire toutes les lignes des deux tables.
  > 2. Classer chaque ligne (T1) et calculer en JavaScript le v2 et la projection (T5), avec le convertisseur figé.
  > 3. Supprimer les lignes illisibles et leurs liens.
  > 4. Faire un `UPDATE` de `execution_parameters` **et de tous les scalaires projetés** pour chaque ligne lisible des **deux** tables. Aucune ligne ne garde `TO_FAILURE`.
  > 5. Reconstruire `activities`.
  > 6. Créer `migration_notices`.
  >
  > Le nouveau CHECK reprend **à l'identique** les bornes de 004 (Durée 1..5999, Répétitions ≥ 1, Pauses et Récupération 0..5999). Il change seulement deux choses : `TO_FAILURE` est retiré de l'énumération, et une cible scalaire NULL est admise en Durée comme en Répétitions. Les bornes de grille ne descendent jamais dans le SQL.
  >
  > `assertSessionAggregateRow` est modifié dans **la même story** que le CHECK. Un test de parité soumet les mêmes lignes au CHECK réel (`node:sqlite`) et à l'assertion TypeScript.

## T7 — Séquencement des stories : aucun état intermédiaire vert possible (haute)

- **Story A (domaine, AD-1) :** retire `TO_FAILURE` de `ExerciseExecutionMode` (`Session.ts:64`). D'après `code-depart.md` §5, le changement touche environ 17 fichiers de test, la validation, `compositionPresentation` et `assertSessionAggregateRow`. La convention « trois contrôles verts avant de clore une story » oblige A à toucher tous ces fichiers.
- **Story B (migration 010) :** a besoin du lecteur v1 et du type `TO_FAILURE`. Si elle passe avant A, elle importe un type que A va supprimer.
- **Variante dangereuse :** A livre l'écriture v2 avec une première Cible `FAILURE` (`repetition_count` NULL) avant que B n'existe. Sur une base v9, le CHECK de 004 rejette l'écriture, ce qui produit une erreur d'enregistrement en recette. Aucun AD n'interdit cet ordre.
- **AD proposé (nouvel AD-14, « Socle de données atomique ») :**
  > Une première story « socle de données » livre **ensemble** :
  > - les types d'AD-1 (`SeriesTarget`, `StoredSeriesTarget`, Mode à deux valeurs) ;
  > - le lecteur v1 isolé (`readV1`, seul porteur du littéral `TO_FAILURE`) et le lecteur et sérialiseur v2 ;
  > - la projection unique (T5) ;
  > - `migration010` et `DATABASE_VERSION = 10` ;
  > - `assertSessionAggregateRow` ;
  > - l'adaptation mécanique des consommateurs, qui doivent compiler, sans nouvelle fonctionnalité d'interface.
  >
  > Aucune story n'écrit de v2 sans que `migration010` soit dans le même commit ou dans un commit antérieur. Les stories d'interface (Feuille, Sélecteur, tableau), de calcul (AD-5) et de phrase (AD-6) suivent. Les stories de calcul et de phrase précèdent celles des cartes consommatrices.

## T8 — Contrat des roulettes étendues : sentinelle d'échec, signature, recalage (haute)

- **Story A (`NumberWheelPicker` étendu, AD-7 « étendues par des props ») :** ajoute la ligne de tête avec la valeur sentinelle `0` dans le `Picker`, et garde `onValidate(value: number)`. Le résultat est `onValidate(0)` pour « à l'échec ».
- **Story B (Sélecteur de cible) :** interprète `0` comme `NUMBER(0)` ou comme une valeur invalide. Pire, elle le convertit en `FAILURE` par commodité, ce que FR-06-02 interdit (« 0 n'est jamais une Cible »).
- **Story C (Composition, roulette Tours) :** dépend de `onValidate(number)` et de 1..99. Elle casse si A change la signature.
- **Recalage :** A recale la valeur 7 s vers 5 dans `wheelPickerMath`, et B recale par le domaine vers 10, ou l'inverse. FR-07-04 et FR-09-05 exigent la même règle pour le Sélecteur et pour les ±.
- **Durée totale :** T(99) peut dépasser 5999 s (par exemple d = 3535, p = 300), alors que la roulette est bornée à 5999 et commence à 0.
- **AD proposé (AD-7, ajout « Contrat des roulettes ») :**
  > Les props ajoutées sont optionnelles, et leur absence reproduit exactement le comportement actuel : Composition et ses tests restent inchangés.
  >
  > L'option échec de `NumberWheelPicker` passe par une prop distincte, `failureOption: { label, onValidateTarget(t: SeriesTarget) }`. Quand elle est présente, `onValidate(number)` n'est jamais appelé. La sentinelle reste interne au composant et ne traverse jamais son interface. Aucune valeur numérique ne représente l'échec.
  >
  > Le recalage d'une valeur hors grille (`nearestSelectableTarget(mode, value)`) et le pas des ± (`stepTarget(mode, value, direction)`) sont des fonctions de `ExecutionParameters.ts`. Les roulettes reçoivent une valeur déjà sur la grille et ne recalent jamais.
  >
  > La roulette de Durée totale reçoit `minTotalSeconds = T(1)` et `maxTotalSeconds = T(99)`, sans plafond à 5999.

## T9 — Propriétaire de la surface ouverte : popover, Sélecteur, outil ±, Cellule active (haute)

- **Story A (domaine, AD-2 « toute transition y est une fonction pure ») :** ajoute `activeCell`, `openSurface` et la valeur en cours du Sélecteur à `ExecutionSheetDraft`. Chaque cran de la roue est envoyé au domaine (`setTarget`), et le ✕ du Sélecteur envoie une restauration.
- **Story B (Feuille, AD-7 et AD-8) :** tient l'état ouvert dans le composant, ne transmet au domaine qu'au ✓ du Sélecteur, et lit la Durée totale depuis le brouillon.
- **Conflit observable :**
  - avec A, la ligne Durée totale et la phrase bougent à chaque cran, avant le ✓ du Sélecteur ;
  - le ✓ de la Feuille, touché pendant que le Sélecteur est ouvert, enregistre une valeur non validée ;
  - l'égalité de brouillon (`formValueEquals`) devient fausse sans action de l'utilisateur.
  
  Avec B, rien de cela. Deux composants qui lisent l'un A, l'autre B ne s'accordent pas sur « une seule surface ».
- **Annulation du retrait (FR-12-05) :** la règle « jusqu'à la modification suivante du tableau » n'a pas de définition commune. Changer de Mode, faire ± sur la Pause commune ou valider le Sélecteur d'une autre ligne invalident-ils l'annulation ?
- **AD proposé (AD-2, ajout « État d'interface hors domaine ») :**
  > L'état d'ouverture appartient à la Feuille seule, sous la forme d'une union `activeSurface` :
  > `none | popover(mode|side|order|regime) | targetSelector(rowRef|uniform) | totalWheel | stepper(field) | cell(rowRef, column)`.
  >
  > Il ne figure jamais dans `ExecutionSheetDraft`. Ouvrir une surface ferme la précédente. La valeur en cours du Sélecteur est locale et n'est transmise qu'**une fois**, à son ✓. Les ✓ et ✕ de la Feuille, quand une surface est ouverte, ferment d'abord cette surface **sans appliquer** sa valeur en cours, puis agissent. Les ± du Pied et des lignes transmettent à chaque appui (FR-10-04).
  >
  > L'annulation du retrait est un instantané tenu par le domaine (`pendingRemoval`). Toute transition du domaine autre que `undoRemoval` le vide. La visibilité du message relève de l'interface et suit la présence de `pendingRemoval`.

## T10 — Avis de migration : granularité, acquittement, point de montage (moyenne)

- **Story A (migration) :** insère deux lignes, `DEFINITION:1` et `OCCURRENCE:1`, puisque la table a un « type ».
- **Story B (interface) :** affiche le premier avis non acquitté (« 1 exercice… ») et l'acquitte à l'affichage. Le second apparaît au lancement suivant. FR-18-20 veut un seul message avec le total 2.
- **Autres écarts possibles :** si l'acquittement se fait à l'affichage et que l'application est tuée, le message est perdu, ce que l'AD-12 voulait justement éviter. Deux écrans (Catalogue et Accueil) lisent chacun la table : le message s'affiche deux fois. Un repository de notices importé directement viole la règle « `SessionServiceProvider` est le seul import `expo-sqlite` ». Enfin, une story qui stocke les identifiants supprimés « pour diagnostic » viole FR-18-20 (aucune quarantaine).
- **AD proposé (AD-12, resserré) :**
  > La migration 010 crée la table dans tous les cas. Elle insère **au plus une** ligne : `kind = 'UNREADABLE_EXERCISES_DROPPED'` et `count` = total des Définitions et des Copies. Aucun identifiant, nom ni contenu d'Exercice écarté n'est stocké.
  >
  > Le repository est exposé par le contexte de services de `SessionServiceProvider`. Un composant unique, `MigrationNoticeGate`, est monté une seule fois à la racine, sous le provider. Il affiche une `Alert` native à un seul bouton, avec un texte du lexique. Il marque l'avis acquitté **à l'appui sur ce bouton**, pas à l'affichage. Aucun autre écran ne lit la table.

## T11 — Séance ou Circuit vidés par l'écart d'une Copie illisible (moyenne)

- **Story A (migration, AD-4) :** supprime la seule occurrence d'une Séance, ou la seule occurrence `IN_TOUR` d'un Circuit. Elle laisse des trous dans `position`.
- **Story B (Composition et validation) :** `validateCreateSessionInput` refuse une Séance sans Exercice (« zéro Activité reste invalide », `validation.ts:719`). Un Circuit vide peut aussi être rejeté ou mal calculé. Une Séance conservée, comme FR-18-20 l'exige, ne peut alors plus être rouverte puis enregistrée sans ajout. Si la lecture revalide, elle ne peut même plus être ouverte.
- **AD proposé (AD-4, ajout) :**
  > Après l'écart, les positions des occurrences restantes sont renumérotées de façon contiguë dans chaque zone structurelle, en conservant leur ordre relatif. Les Circuits devenus vides et les points d'arrêt sont conservés tels quels.
  >
  > La **lecture** d'une Séance ne revalide jamais les règles de création : une Séance ou un Circuit vides se lisent et s'ouvrent en Composition. La règle « zéro Exercice » ne s'applique qu'au `Continuer`, comme aujourd'hui.
  >
  > Un test `node:sqlite` couvre trois cas : une Séance entièrement vidée, un Circuit vidé, et une occurrence au milieu d'une zone.

## T12 — `lowerBound` à deux niveaux : table de précédence absente (moyenne)

- **Story A (AD-5, Exercice) :** produit `lowerBound` pour un mélange calculable et `omitted` (avec `knownSeconds`) pour un Exercice tout à l'échec.
- **Story B (agrégation de Séance, code existant) :** ne passe en `lowerBound` que si une contribution est `omitted` (`aggregateSessionDuration`, `executionCalculations.ts:253-267`). Une contribution `lowerBound` n'y est pas reconnue : si une autre contribution est estimée, la Séance s'affiche `≈`, alors que FR-15-04 exige `≥`.
- **Occurrence :** rien ne dit que la substitution To = T − PN + R s'applique au montant d'un `lowerBound` (FR-15-02 : 105 → 135).
- **AD proposé (AD-5, ajout) :**
  > Le pli d'agrégation est fixé :
  > - nature de Séance ou de Circuit = `lowerBound` si une contribution est `lowerBound` ou `omitted` ; sinon `estimated` si une contribution est `estimated` ; sinon `exact` ;
  > - montant = Σ des montants des contributions `exact`, `estimated` et `lowerBound`, plus Σ des `knownSeconds` des contributions `omitted`.
  >
  > `computeOccurrenceDuration` applique la substitution de PN par R avant de qualifier la nature, pour les quatre natures. Une table de tests couvre chaque paire de natures.

## T13 — Formateur unique : emplacement et propriétaire des textes (moyenne)

- **Story A :** promeut `formatPhraseDuration` du domaine (`executionPhrase.ts:31`), qui contient « min » et « s » en dur, au rang de « formateur unique ».
- **Story B :** crée un formateur dans `src/shared/` ou `src/features/` à partir des clés i18n, en application d'AD-11, et l'utilise pour les cartes.
- **Conflit :** A et B respectent chacune un AD, mais il existe maintenant deux formateurs. AD-5 exige « un seul », et AD-11 interdit le texte en dur, que le domaine ne peut pourtant pas importer depuis `src/shared/`.
- **AD proposé (AD-5 et AD-11, conciliés) :**
  > Le formateur de durée (ch. 08, l. 609-618) et le formateur de carte (RM-159, Q20) vivent dans `src/domain/activities/durationFormat.ts`. Ce sont des fonctions pures, en français. Ils bénéficient de **la même exception documentée** que le générateur de phrase : texte grammatical francophone du MVP, hors lexique (RM-091). Les symboles `≈` et `≥` et les annonces d'accessibilité restent dans le lexique. `compositionPresentation`, `formatSessionSummary` et `ActivityCard` suppriment leurs formateurs locaux.

## T14 — Oracle de parité : l'adaptateur scalaire du domaine survit-il ? (moyenne)

- **Story A (application stricte d'AD-3, « aucun module ne lit les scalaires ») :** supprime `legacyExecutionParameters` et `resolveExecutionParameters`.
- **Story B (migration, AD-4, « un test de parité la compare au lecteur v1 du domaine ») :** a besoin de cet adaptateur comme oracle pour le cas « scalaires sans JSON ».
- **Conflit :** selon l'ordre de fusion, la suppression d'A casse le test de B, ou le test de B ne compare plus que le chemin JSON.
- **AD proposé (AD-3, ajout) :**
  > Le domaine conserve `readV1(json | scalaires)`, seul porteur du littéral `TO_FAILURE`. Il n'est importé que par les tests de parité et par le lecteur de l'Instantané v1. Une règle de lint ou un test de garde (recherche de `readV1` et de `TO_FAILURE` hors de ces fichiers et de `migration010.ts`) l'empêche d'être appelé ailleurs.

## T15 — Instantané : version de l'enveloppe ou version des paramètres (moyenne)

- **Story A :** passe `EXERCISE_SNAPSHOT_VERSION` à 2 et embarque des paramètres v2.
- **Story B :** garde l'enveloppe en version 1 et choisit le lecteur d'après `parameters.version`.
- **Conflit :** un Instantané v1 contenant `TO_FAILURE` est relu converti en Répétitions et `FAILURE` par l'une, brut par l'autre. FR-19-10 (« lu selon sa version ») et FR-19-12 (aucune performance inventée) sont interprétés différemment.
- **AD proposé (AD-3, ajout) :**
  > L'enveloppe passe en version 2 si et seulement si les paramètres sont en v2. La lecture d'une enveloppe v1 convertit ses paramètres par `readV1` vers le type v2 du domaine, sans toucher à `actualDurationSeconds` ni à aucun relevé. L'objet relu n'est jamais réécrit.

## T16 — N hérité (FR-12-07) : où vit le verrou (moyenne)

- **Story A (brouillon) :** ne connaît pas l'héritage. Elle laisse `setSeriesCount`, le retrait de ligne et l'Inversion disponibles.
- **Story B (Feuille) :** masque les commandes quand une prop `inheritedSeriesCount` est présente.
- **Story C (calculs, AD-5 « fixe la disponibilité de l'Inversion ») :** répond « disponible », puisqu'elle ignore l'héritage.
- **Conflit :** les tests de FR-12-07 et FR-14-02 tombent selon la couche testée.
- **AD proposé (AD-2 et AD-5, ajout) :**
  > Le brouillon se crée avec un contexte `{ seriesCountLocked: boolean }`. Les transitions `setSeriesCount` et `removeRow` sont refusées (no-op typé) quand il est vrai, et la Réserve n'est pas purgée au commit. `isTotalDurationInvertible(params, { seriesCountLocked })` le prend en entrée. Aucun parcours ne passe `true` dans PRE-4. Seuls les tests le font.

## T17 — Mémoire par Mode : précédence entre échec et numérique mémorisé (basse)

- **Scénario :** Répétitions (10, 12, 15) → Durée, où la ligne 3 est mise à l'échec → retour en Répétitions. La ligne 3 doit-elle valoir 15 (la mémoire du Mode, selon FR-11-04) ou l'échec (« conservé dans tous les Modes », selon H4) ?
- **Conflit :** le test d'acceptation et l'implémentation de la même story peuvent choisir différemment. AD-2 garantit un seul module, mais pas une seule règle.
- **AD proposé (AD-2, ajout) :**
  > La valeur courante d'une ligne prime sur la mémoire. Une ligne actuellement `FAILURE` reste `FAILURE` au changement de Mode. Une ligne actuellement `NUMBER` ou `UNSET` prend la mémoire du Mode cible pour cette identité, sinon `UNSET`. La valeur courante est mémorisée pour le Mode quitté.
  >
  > **À faire confirmer par Hermann avant la story.**

## T18 — DTO de liste de Séances et donnée corrompue à l'exécution (basse)

- **Story A (repository) :** renvoie le JSON brut dans les « faits de durée par lot » (`SqliteSessionRepository.ts:1104-1160`).
- **Story B (présentation) :** attend un `ExecutionParameters` déjà analysé.
- **Conflit :** une ligne corrompue après la migration fait lever une exception à toute la liste.
- **AD proposé (AD-3, ajout) :**
  > Les repositories renvoient des paramètres **analysés** (type du domaine), jamais une chaîne JSON. Une erreur d'analyse à l'exécution est retournée comme une union discriminée par ligne (`{ kind: "unreadable" }`), affichée sans durée, et ne fait jamais échouer la liste.

## T19 — Corpus : adaptation des 92 cas `TO_FAILURE` (basse)

- **Story A :** adapte les cas en Répétitions seulement.
- **Story B :** les adapte dans les deux Modes, en s'appuyant sur FR-16-07 (« même phrase en Durée et en Répétitions »).
- **Conflit :** le nombre de cas et l'oracle diffèrent.
- **AD proposé (AD-10, ajout) :**
  > Chaque cas `TO_FAILURE` est rejoué deux fois, en Répétitions et en Durée, toutes les Cibles à l'échec, avec le même attendu. Le Bip du cas d'origine est conservé et n'est pas écrit. Les nouvelles variantes vivent dans `src/domain/activities/__tests__/fixtures/`.

## T20 — Constante 0,45 et accélération des ± : emplacement (basse)

- **Constante :** une story ajoute 0,45 à `tokens.ts`, ce qui casse `tokensSpecification.test.ts`. Une autre crée une constante locale dans la Feuille.
- **Accélération :** les paliers de maintien (5 puis 10, arrondis dans le sens du geste) sont modifiés dans `ProfileStepper`, partagé avec le Profil, ce qui change le Profil. Ou bien ils sont réécrits dans le Pied commun, ce qui crée deux logiques.
- **AD proposé (AD-11 et AD-8, ajouts) :**
  > La constante est `UNSELECTED_OPACITY = 0.45`, dans `src/shared/ui/opacity.ts`, hors `tokens.ts`. Le calcul des paliers est une fonction pure unique (`acceleratedStep(base, heldMs, value, direction, bounds)`), appelée par les ± de la Feuille et du Pied. Le pas de base de la Cible vient de `stepTarget` (T8). Le comportement des steppers du Profil reste inchangé.

---

## Recommandation

Trois trous sont à fermer avant toute découpe en stories : **T1, T2 et T3**. Ils touchent la frontière entre lisible, invalide et illisible, et décident si une donnée historique est supprimée, bloquée ou conservée.

**T4, T5, T6 et T7** forment le socle de données. Ils conditionnent l'ordre des stories et doivent être écrits dans la spine avant `bmad-create-epics-and-stories`.

Les propositions marquées « à faire confirmer » (T17), ainsi que tout arbitrage de T1 qui déplacerait un cas de FR-18-14 vers l'illisible, relèvent de Hermann.
