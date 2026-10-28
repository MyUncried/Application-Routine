# PRE-8 — Modèle D-449, Mouvements et Catalogue des Mouvements (BMAD)

Statut : **epics A et B clos** (recette iPhone validée par Hermann le 27/10/2026, code recetté `88c2adde`). Epic E : plan approuvé par Hermann le 28/10/2026, développé le 28/10 (E.1 à E.7, E.8-a ; recette iPhone à réaliser : `recette-iphone-epic-e.md`). [État au 28/10 au soir : epic E `in-progress`, recette iPhone et passes ciblées OK, 7 points non testés (`e2-08`, `e2-11`, `e3-07`, `e4-03`, `e5-13`, `e6-10`, `e8-08`) ; lot Familles `done` (clôturé le 28/10) ; PRE-8 non clôturée.] Epics A et B autorisés par Hermann le 27/10/2026. Développement sur `pre8-bmad/dev` depuis `main` @ `082390c0` (PR #401), dans le clone `C:\Dev\KODJO-BMAD-PRE8`. Aucune fusion sur `main` sans autorisation explicite.

| Rubrique | Contenu |
|---|---|
| Stories et dépendances | `planning-artifacts/epics.md` |
| Suivi | `implementation-artifacts/sprint-status.yaml` |
| Specs | `implementation-artifacts/spec-*.md` |
| Epic E (plan approuvé) | `planning-artifacts/epic-e-catalogue-seances.md` |
| Hors autorisation | Epics C (Composition), D (reprise), formats spécialisés ; E : développement à lancer dans une nouvelle session |

## Synchronisation code / documentation — 28/10/2026

Mission de Hermann « Synchronisation permanente Code / Documentation et réconciliation PRE-8 avant clôture ». Ne clôture pas PRE-8.

**Causes (démontrées).**
1. Le `CLAUDE.md` chargé dans ce clone est celui du chantier OpenSpec, hérité de `main` (`f7ff4200`) : il ne prévoit aucun contrôle documentaire du code et pose que les spécifications ne sont corrigées « qu'après validation d'Hermann d'un lot proposé » ; pendant les recettes, les décisions explicites ont donc été consignées dans les artefacts BMAD et proposées pour `main`, sans mise à jour normative dans la même livraison.
2. Les corrections directes de recette ne passent par aucune étape BMAD, et les étapes de fin de `bmad-build` et `bmad-code-review` n'ont pas de contrôle de documentation produit (la spec du lot y est le compte rendu du changement, pas la source normative).
3. La documentation des familles (28/10) n'existe que sur `main`, non fusionnée : la source normative ne peut pas être modifiée dans la branche.
4. Les sous-agents ne reçoivent pas `CLAUDE.md` (vérifié le 28/10) : leurs changements n'emportent aucune règle de projet.
5. Configuration BMAD locale pointant encore vers les artefacts PRE-7 (`_bmad/custom/config.toml`).
Exemples démontrés : commits `f7540637`, `4ad58fb8`, `ab808040` (défilement pendant le geste, dépliage à l'arrêt) sans document produit ; Q-E4 révisé (`bf2f7ff0`) et consultation en lecture seule (`e02fc9be`, `4f66f26c`) consignés en artefacts mais contredits ou absents dans le ch07 de la branche et le plan d'intégration.

**Mécanisme installé.**
- Règle versionnée `.claude/rules/synchronisation-code-documentation.md` (classes A à D, contrôle sur le diff, même livraison pour la classe B, cas de la source sur une autre branche, déclaration de livraison).
- Importée par `CLAUDE.md` (bloc délimité ajouté après les imports, reste du fichier inchangé ; seule dérogation : une décision explicite de Hermann vaut validation du lot documentaire) ; chargement vérifié par une session Claude Code neuve (`claude -p`) qui cite la règle et ses classes.
- Changements de sous-agents : contrôle dans la session principale à l'intégration (écrit dans la règle).
- BMAD, clone local seulement (`_bmad/` exclu par `.git/info/exclude`, installation non livrée) : surcharges `_bmad/custom/bmad-build.toml` et `bmad-code-review.toml` (règle en `persistent_facts`, contrôle en `on_complete`) ; chemins BMAD alignés sur `_bmad-output/pre8`.
- Aucun hook, CI, workflow ni validation supplémentaire.

**Réconciliation (lecture ciblée des artefacts, commits et documents ; agent en lecture seule, puis corrections).**

| Périmètre | Constat | Traitement |
|---|---|---|
| Epics A/B | Corrections de recette tracées (ch07 branche, ch12, ch13 CE-MVT-01, DSF Mouvements) | F05 (Phases réordonnables par VoiceOver seulement) ajouté aux choix à valider du ch07 |
| b8-3 | Branche cohérente (ch07, ch10, DSF du 27/10) | `main` : patch Familles, non appliqué |
| Familles | Défilement pendant le geste absent du patch | Ajouté au patch (CE-MVT-03 §10, DSF) ; patch vérifié `git apply --check` |
| Epic E | Q-E4 contredit par le ch07, le plan d'intégration, `sprint-status`, le plan E ; consultation en lecture seule absente ; R-E4/R-E5 encore « question » ; D-050 et ch13 (format compact, message des Archivées) non annotés | ch07 annoté (Q-E4 remplacé, D-050, nouvelle puce « Recette iPhone du 28/10 ») ; ch13 de la branche annoté (R-E4, R-E5) ; plan d'intégration, `sprint-status`, plan E, spec E annotés |

**Restes, non bloquants pour cette mission.**
- À CLARIFIER (faible) : B2 (cartes qui se referment au-dessus ou en dessous à la sortie) ; statut du menu Niveau iOS (ch07 « garder natif » contre `sprint-status` `menu-niveau-largeur: arbitrage`) ; famille masquée par un filtre ; F05.
- Préparé, non appliqué : intégration documentaire de `main` (plan et patch Familles), opération Git soumise à décision.
- Non vérifié : suite Jest complète et ESLint global (dette depuis l'arrêt pour mémoire).
