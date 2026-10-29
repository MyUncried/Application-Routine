# D.2 — Instantané de Séance

Story PRE-9, epic D. Autorisation : mission de Hermann « KODJO — PRE-9 : lancement du développement BMAD » (29/10/2026). Plan : `../planning-artifacts/epics.md` § D.2 ; architecture : `../planning-artifacts/architecture-pre9.md` §6 (« Instantané de Séance »). Dépend de : D.1, C.1 (`done`).

## Critères d'acceptation et preuves

| Critère | Livré | Preuve (`src/domain/sessions/__tests__/sessionSnapshot.d2.test.ts`) |
|---|---|---|
| Type versionné et constructeur purs, sur le modèle de l'instantané d'Exercice v3 | `createSessionSnapshot` (`src/domain/sessions/sessionSnapshot.ts`), `SESSION_SNAPSHOT_VERSION = 1` ; chaque Exercice porte son `createExerciseSnapshot` (contenu du Mouvement résolu : nom, Catégorie, Zones, médias, phases ; paramètres ; récupération) | « copie l'en-tête… » |
| Indépendant des modifications ultérieures (Séance, Mouvements) | Copie profonde gelée | « gelé et indépendant » (FMT-06) |
| Structure complète, identifiants stables ; réglages de début et de fin ; origine | Exercices, Circuits, Cycles, Points d'arrêt et leurs identifiants ; Compte à rebours, Fin ; origine (FMT-02) | « copie l'en-tête… » |
| Par élément formaté : Format, réglages effectifs, version de règle (ARB-03) | `SnapshotFormat` = clé, réglages, `ruleVersion` (`FORMAT_RULES_VERSION` du registre) | « copie l'en-tête… » |
| Plan développable depuis l'instantané | Les Exercices de l'instantané sont lus directement par `expandStructure` (D.1) | « le plan se développe depuis l'instantané » |
| Sérialisation et persistance reportées à PRE-10 | Aucune | — |

## Choix techniques (classe D)

- `FORMAT_RULES_VERSION = 1` dans le registre des Formats : version de l'ensemble des règles de Format, figée dans l'instantané (ch09 l.593-598) ; à incrémenter à tout changement de règle.
- Exercice incomplet ou sans filiation : l'instantané est refusé (`ExerciseSnapshotDataError`, MFN-08), comme l'instantané d'Exercice. La validité de configuration se contrôle avant (D.4).
- Ancienne Récupération autonome : paramètres copiés, sans instantané d'Exercice.

## Synchronisation code / documentation

- **Classe A** : ch09 l.593-598 (« Instantané : Format, origine, réglages effectifs, prescription et version de règle »), SU-07, FMT-06 ; ARB-03 (par élément) déjà au registre.
- **Classe D** : module et version de règle (ci-dessus). Aucun document modifié.

## Tests

- `sessionSnapshot.d2.test.ts` : 4 tests verts ; `tsc --noEmit` et ESLint sans erreur.
