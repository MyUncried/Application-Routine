# domain

Types et règles métier transverses (entités du chapitre 09, validations, calculs déterministes du chapitre 10) indépendants de l'interface, du stockage et des plateformes (docs/Specifications-fonctionnelles/12 – Architecture technique, §12.5).

## sessions

Domaine de la Séance simple (T01) :

- `Session.ts` — types d'agrégat (`Session`, `CreateSessionInput`, `SessionSummary`, `DurationExercise`), palette canonique (`SESSION_COLORS`, `DEFAULT_SESSION_COLOR`).
- `SessionRepository.ts` — contrat d'accès aux données (`create`/`findById`/`listActive`/`update`), implémenté par la couche infrastructure. `update` renvoie un résultat métier discriminé `UpdateSessionOutcome` (`UPDATED`/`NOT_FOUND`/`ARCHIVED`) — une Séance archivée ou introuvable est un résultat attendu, pas une exception ; seule une entrée invalide reste signalée par `SessionValidationError`, en défense en profondeur.
- `errors.ts` — contrat de résultat de validation structuré (`ValidationResult`, succès/échec), catalogue de codes et de champs stables, `SessionValidationError`. Aucune chaîne destinée à l'utilisateur n'apparaît ici ; les fonctions du Domaine ne lèvent jamais cette exception, elles retournent un résultat — seule l'infrastructure (ou un futur `SessionService`) la lève.
- `defaults.ts` — valeurs canoniques : fixées pour cette tranche (Série, Pause, Cycle, Tour, position de l'unique Activité) ou proposées par défaut à la création (compte à rebours initial, fin de séance, durée initiale d'un nouvel Exercice). La couleur par défaut reste dans `Session.ts`.
- `validation.ts` — normalisations et validations pures : nom de Séance/Exercice (trim + réduction des espaces internes), consigne (trim externe seul, espaces/retours à la ligne internes préservés, `null` si vide/absente), bornes comptées par points de code Unicode, appartenance à la palette. Aucune dépendance SQL/Expo.
- `calculations.ts` — Nombre d'Activités de la Composition, Nombre total d'Activités à exécuter, Durée estimée ; fonctions opérant sur une entrée métier minimale (« Facts »), jamais sur une ligne SQL.
- `SessionDraft.ts` — brouillon local potentiellement incomplet et sa conversion (`toCreateSessionInput`) vers une entrée de création validée, avec le même contrat de résultat structuré ; et sa fonction inverse `toSessionDraft(session)` (T01-S04), qui reconstruit un brouillon modifiable à partir d'une Séance persistée, sans perte des champs éditables.
- `index.ts` — point d'entrée réexportant l'ensemble ci-dessus.

La gestion de plusieurs Activités et des positions `BEFORE_TOUR`/`AFTER_TOUR` reste hors périmètre de cette tranche. L'orchestration applicative (`SessionService`) est décrite dans `src/features/sessions/README.md`, désormais câblée à une connexion SQLite réelle au démarrage de l'application (T01-S05, voir `src/infrastructure/database/README.md`) — aucun type ni règle du Domaine n'est concerné par ce câblage.
