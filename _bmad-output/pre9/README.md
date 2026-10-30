# PRE-9 — Composition simplifiée, configuration des Formats et contrat de séance (BMAD)

Statut : **plan consolidé (révision 2 du 29/10/2026), soumis à l'approbation finale de Hermann** après la revue ChatGPT. Aucune story ne démarre sans autorisation explicite. **Aucun développement, aucune migration, aucune modification Figma.** Mission de Hermann du 28/10/2026 « PRE-9 : revue de préparation et planification technique BMAD ».

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

**Clarification documentaire du 29/10 :** dans la cible PRE-9, le Format et ses réglages sont portés **uniquement par l'Exercice** ; le Circuit porte nature, compte et membres, pas de Format. La deuxième ligne existante du Circuit replié liste les Exercices et leur Format éventuel (Figma `10717:20056`, `10725:20142`). L'hypothèse antérieure « Format porté par un Circuit ou un Exercice » mentionnée dans l'historique ci-dessous est **supersédée** sur la propriété. Les corrections sont préparées sur une branche documentaire distincte ; elles ne valent pas qualification de code ou approbation automatique des stories.

**Extensions PRE-9 du 30/10/2026 :** **CAT.1** (zone de contexte des Catalogues, [spécification](../../docs/KODJO-Zones-contexte-catalogues-PRE9-2026-10-30.md), Figma `10266:20575`, `10465:23141`, `1992:9910`, `4549:6742`) et **CAT.2** (résultats de recherche des Mouvements, [spécification](../../docs/KODJO-Resultats-recherche-mouvements-PRE9-2026-10-30.md), Figma `10415:21713`, `10415:21939`, `9882:19049`) **autorisées immédiatement et indépendamment des autres Epics**. Aucun moteur d'exécution requis. **Plan étendu : 31 unités (26 développement, 3 documentation, 2 qualification)** ; les 29 unités décrites plus bas correspondent au plan avant les extensions CAT.1 et CAT.2.

Point d'arrêt des autres stories : conserver leurs conditions de lancement ; CAT.1 et CAT.2 sont autorisées dès à présent. **Arbitrages Formats ARB-04, ARB-22c, ARB-26/27/28 clos par la référence consolidée du 30/10** ; les autres conditions non liées à ces arbitrages restent applicables.

**Référence de décision active :** [Arbitrages et Composition avec Formats consolidés](../../docs/KODJO-PRE9-Arbitrages-Composition-Formats-Consolides-2026-10-30.md). Les versions antérieures du plan, des contre-revues et des branches de réponses restent des sources historiques et ne doivent pas réouvrir des choix clos.

Révision 1 (29/10/2026), après la revue ChatGPT (REVISE) et la mission de Hermann « PRE-9 : révision ciblée du plan BMAD après arbitrages » : décisions intégrées (`arbitrages-pre9.md` §0, dont ARB-03 — plusieurs Formats par Séance, Format porté par un Circuit ou un Exercice) ; questions encore ouvertes et opérations qu'elles bloquent (`arbitrages-pre9.md` §2 bis) ; lacune corrigée (Exercices directs de Cycle non représentables, traités dans A.1) ; 29 unités de travail, aucune ajoutée ni supprimée, A.5 conditionnelle, Q.0 hors chemin critique. Seconde passe indépendante (29/10) : 6 constats à corriger et 5 mineurs, tous traités (dont ARB-25 — répétition de l'ensemble Tabata, FMT-13 — et la demande de choix D-442 étendue au Cycle dans ARB-02b).

Revue indépendante interne (28/10) : 22 citations contrôlées (3 corrigées) ; ajouts ARB-21 (information « exécution non disponible »), ARB-22 (choix des Exercices dans le flux d'un Format, contenu des départs rapides), story D.5 (instruction des capacités d'exécution, document sans code) ; D.2 et D.3 allégés (type et table, sans sérialisation ni logique).

Révision 2 (29/10/2026), mission de Hermann « intégration des derniers arbitrages et finalisation du plan BMAD » : ARB-01 (conversion), ARB-02a/b, ARB-10b, ARB-23, ARB-24, ARB-25 validés et clos (`arbitrages-pre9.md` §0 bis) ; restent ouverts ARB-04, ARB-22c et trois questions d'application limitées à C.4 (ARB-26 à ARB-28) ; découpage inchangé (29 unités) ; propagation normative ciblée préparée (`arbitrages-pre9.md` §5).
