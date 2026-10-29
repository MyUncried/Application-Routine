# PRE-9 — Composition simplifiée, configuration des Formats et contrat de séance (BMAD)

Statut : **plan révisé (révision 1 du 29/10/2026), en seconde revue** (ChatGPT, puis validation de Hermann). **Aucun développement, aucune migration, aucune modification Figma.** Mission de Hermann du 28/10/2026 « PRE-9 : revue de préparation et planification technique BMAD ».

- Baseline : `main @ 547bb7ef26d3d713c8d027e6a26a69f62602d6cd` (PR #409, PRE-8 intégrée).
- Branche de planification : `pre9-bmad/plan` (clone `C:\Dev\KODJO-BMAD-PRE8`), non fusionnée.
- Cadrage : `docs/KODJO-Strategie-PRE9-PRE10-PRE11-Cadrage-Moteur-2026-10-28.md`, branche `docs/pre9-strategie-moteur-20261028` @ `10b4d6ee`, lu sans fusion ; document de cadrage, non décisionnel.
- Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page `510:101`, consulté en lecture seule (nodes : `planning-artifacts/recherche/04-figma.md`).

| Rubrique | Contenu |
|---|---|
| État initial, matrice des écarts, dépendances | `planning-artifacts/etat-initial-et-ecarts.md` |
| Arbitrages à soumettre | `planning-artifacts/arbitrages-pre9.md` |
| PRD | `planning-artifacts/prd-pre9.md` |
| Architecture et contrat Composition → Exécution | `planning-artifacts/architecture-pre9.md` |
| Epics, stories, qualification | `planning-artifacts/epics.md` |
| Suivi | `implementation-artifacts/sprint-status.yaml` |
| Recherches sourcées (code, décisions, Formats, Figma) | `planning-artifacts/recherche/01` à `04` |

Point d'arrêt : revue et validation du plan. Aucune story ne démarre avant.

Révision 1 (29/10/2026), après la revue ChatGPT (REVISE) et la mission de Hermann « PRE-9 : révision ciblée du plan BMAD après arbitrages » : décisions intégrées (`arbitrages-pre9.md` §0, dont ARB-03 — plusieurs Formats par Séance, Format porté par un Circuit ou un Exercice) ; questions encore ouvertes et opérations qu'elles bloquent (`arbitrages-pre9.md` §2 bis) ; lacune corrigée (Exercices directs de Cycle non représentables, traités dans A.1) ; 29 unités de travail, aucune ajoutée ni supprimée, A.5 conditionnelle, Q.0 hors chemin critique. Seconde passe indépendante (29/10) : 6 constats à corriger et 5 mineurs, tous traités (dont ARB-25 — répétition de l'ensemble Tabata, FMT-13 — et la demande de choix D-442 étendue au Cycle dans ARB-02b).

Revue indépendante interne (28/10) : 22 citations contrôlées (3 corrigées) ; ajouts ARB-21 (information « exécution non disponible »), ARB-22 (choix des Exercices dans le flux d'un Format, contenu des départs rapides), story D.5 (instruction des capacités d'exécution, document sans code) ; D.2 et D.3 allégés (type et table, sans sérialisation ni logique).
