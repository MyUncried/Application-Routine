# D.4 — Validité de configuration

Story PRE-9, epic D. Autorisation : mission de Hermann « KODJO — PRE-9 : lancement du développement BMAD » (29/10/2026). Plan : `../planning-artifacts/epics.md` § D.4 ; architecture §6 (« Validité et disponibilité »). Dépend de : D.1, D.3 (`done`).

## Critères d'acceptation et preuves

| Critère | Livré | Preuve (`src/domain/sessions/__tests__/configurationValidity.d4.test.ts`) |
|---|---|---|
| Validité par élément et pour la Séance, `valid` / `invalid` + motifs lisibles | `configurationValidity` (`src/domain/sessions/configurationValidity.ts`) : `MISSING_TARGET`, `ZERO_VOLUME`, `LOCKED_CONSTANT_CHANGED`, `MISSING_SETTING`, `INVALID_STRUCTURE`, rattachés à l'élément (ou à la Séance) | 6 tests |
| Cible manquante, volume nul (COMP §3, ARB-10, ARB-18b) | Tiret ; toutes cibles numériques nulles ; échelle For time entièrement nulle (zéro admis dans une position) | « cible à renseigner… », « réglage non renseigné… » |
| Constante modifiée (FMT-03, FMT-17, CE-FMT-04 §14) | Écart d'un Exercice d'un élément formaté aux constantes `LOCKED` du registre (nombre de séries, durée de travail, pause, mode Durée) | « Tabata… » |
| Structure invalide | Forme (D-451), Format porté (registre), organisation et compte du Circuit gouvernés par le Format (FMT-12/13, FMT-31), Séance sans Exercice | « organisation et compte… », « Séance sans Exercice » |
| Sans réparation silencieuse | La fonction ne modifie rien | « Tabata… » (structure inchangée) |
| Disponibilité du moteur distincte, lue dans le descripteur (D.3) ; aucun affichage nouveau (ARB-21) | `engineAvailability` → `executionAvailable` du descripteur (faux en PRE-9) | « disponibilité du moteur… » |

## Raccordement

« Continuer » valide aujourd'hui par `toStructuredSessionInput` (règles existantes de l'occurrence et de la structure). Aucun motif nouveau n'y est encore atteignable : la cible 0 n'est ouverte qu'en B.3, et aucun élément formaté n'est créé avant C.4. Le raccordement de `configurationValidity` à « Continuer » et aux contraintes réappliquées se fait donc dans C.4 (premier élément formaté éditable) et B.3 (cible nulle), sans changer ce contrat. Les règles propres aux réglages de chaque Format (bornes, compte commun) seront ajoutées en C.3.

## Synchronisation code / documentation

- **Classe A** : COMP §3, FMT-03, FMT-17, FMT-12/13, FMT-31, ARB-10, ARB-18b, ARB-21 — règles écrites.
- **Classe D** : module, codes de motif. Aucun document modifié.

## Tests

- 6 tests verts ; `tsc` et ESLint sans erreur.

## Correction du 30/10 — Format porté par l'Exercice

Plus de transmission du Format d'un Circuit à ses membres ni de contrôle du « Circuit porteur » (compte Tabata groupé 1 retiré). Chaque Exercice formaté est contrôlé avec ses propres constantes et contre l'organisation et le compte de **son** Circuit (`circuitCompatibility`, matrice §2.2) : refus → motif `INCOMPATIBLE_CIRCUIT` (30/30 et AMRAP alternés, Tabata alterné si N ≠ 8) ; combinaison non décidée (For time alterné) → `openQuestions`, jamais bloquante. EMOM alterné : adaptation de N par le geste de dépose (C.4), non contrôlée ici. voir `spec-c-1-persistance-registre-formats.md`, section « Correction du 30/10 — Format porté exclusivement par l'Exercice » (décision de Hermann, classe B). Tests : `configurationValidity.d4` 8/8.
