# PRE-8 — Modèle D-449, Mouvements et Catalogue des Mouvements (BMAD)

Statut : **PRE-8 clôturée le 28/10/2026** (« Clôture définitive de PRE-8 et préparation de PRE-9 ») — epics A, B, E et lot Familles clos ; intégration de `main` @ `c73079e9` faite par fusion dans `pre8-bmad/dev` ; PR vers `main` (voir la section « Clôture de PRE-8 »), fusion soumise à l'autorisation de Hermann. Historique (états successifs, dépassés par la clôture) : **epics A et B clos** (recette iPhone validée par Hermann le 27/10/2026, code recetté `88c2adde`). Epic E : plan approuvé par Hermann le 28/10/2026, développé le 28/10 (E.1 à E.7, E.8-a ; recette iPhone à réaliser : `recette-iphone-epic-e.md`). [État au 28/10 au soir : epic E `in-progress`, recette iPhone et passes ciblées OK, 7 points non testés (`e2-08`, `e2-11`, `e3-07`, `e4-03`, `e5-13`, `e6-10`, `e8-08`) [tranchés le 28/10 : `e2-11` accepté sur tests automatiques, six points VoiceOver reportés au lot d'accessibilité de fin de MVP ; clôture de l'epic E à prononcer par Hermann] ; lot Familles `done` (clôturé le 28/10) ; PRE-8 non clôturée.] Epics A et B autorisés par Hermann le 27/10/2026. Développement sur `pre8-bmad/dev` depuis `main` @ `082390c0` (PR #401), dans le clone `C:\Dev\KODJO-BMAD-PRE8`. Aucune fusion sur `main` sans autorisation explicite.

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
- À CLARIFIER (faible) : B2 (cartes qui se referment au-dessus ou en dessous à la sortie) ; ~~statut du menu Niveau iOS~~ [clos le 28/10 : `menu-niveau-largeur` tranché, « Garde le menu natif d'iOS »] ; famille masquée par un filtre ; F05.
- ~~Préparé, non appliqué : intégration documentaire de `main`~~ [faite le 28/10 à la clôture, par fusion de `origin/main` @ `c73079e9`].
- Non vérifié : suite Jest complète et ESLint global (dette depuis l'arrêt pour mémoire).

## Clôture de PRE-8 — 28/10/2026

Demande de Hermann : « KODJO — Clôture définitive de PRE-8 et préparation de PRE-9 ». Aucune décision rouverte, aucune recette rejouée.

| Lot | Statut | Évidence |
|---|---|---|
| Epic A (modèle D-449, migrations 014/015) | done | recette A/B du 27/10 (`recette-iphone-pre8.md`) |
| Epic B (Mouvements, Catalogue) | done | recette A/B du 27/10, passes 2 à 6 ; b8-3 confirmé le 28/10 |
| Lot Familles de niveaux | done | FAM-01 à FAM-11 et passes 2 à 4 OK (`spec-familles-mouvements-2026-10-28.md` § 9 à 13) |
| Epic E (Catalogue des Séances) | done | recette et passes ciblées OK ; `e2-11` accepté sur tests automatiques ; VoiceOver reporté (`recette-iphone-epic-e-resultats-2026-10-28.md`) |

**Écarts acceptés et reports.** VoiceOver : six points E, créer/rejoindre/quitter une famille, et l'observation de Hermann sur la navigation VoiceOver, au lot d'accessibilité de fin de MVP (q6-4, VoiceOver de l'epic B, reste non testé) ; emplacement pointillé (Figma `10480:23374`) accepté provisoirement ; placement alphabétique du Mouvement sorti ; E.8-b et Q-E1 (conversion) avec ou après l'epic C ; Trier et Partager grisés ; Planifier et Lecture indisponibles. Limite connue : le réordonnancement depuis le menu de la fiche réécrit toute la famille (`regle-6-cle-de-tri`). À clarifier, non bloquants : B2, famille masquée par un filtre, F05, filets de la feuille des filtres.

**Tests (niveau de preuve réel).** Dernière suite complète documentée : 218 suites / 4 714 tests (`bilan-epic-e-2026-10-28.md`) ; une suite complète de 221 suites / 4 751 tests a aussi été relevée en session le 28/10 après le lot Familles (`48404672`), sans trace écrite ailleurs. Ensuite, passages ciblés uniquement, relevés en session : 111 suites / 2 269 tests (`spec-familles-mouvements-2026-10-28.md`), 4 suites / 43 tests à la clôture Familles, 17 suites / 235 tests (`src/shared/ui` et `ActivityEditorForm`) et `tsc --noEmit` sans erreur après la fusion de `main`. **Suite Jest complète et ESLint global non revérifiés depuis l'incident mémoire** : dette de vérification, à exécuter de façon fractionnée hors de cette clôture ; les ciblés ne valent pas certification du dépôt.

**Intégration de `main`.** Fusion de `origin/main` @ `c73079e9` (PR #403 à #408) dans `pre8-bmad/dev` : six documents en conflit résolus (sections PRE-8 puis compléments de `main` ; navigation : texte de `main` à cinq destinations, Communauté désactivée dans PRE-8) ; corrections du patch Familles appliquées dans les fichiers fusionnés (b8-3, rééquilibrage, libellé, VoiceOver, pointillé, dépliage à l'arrêt, défilement) ; formulation contraire à b8-3 du ch07 de `main` (clarifications du 27/10) annotée. Code venu de `main` : icônes de navigation, `KodjoIcon.tsx` et `scripts/check_navigation_assets.py` (#404), non recettés sur iPhone dans PRE-8.

## Point de passage vers PRE-9

- **Baseline** : le commit de fusion de la PR PRE-8 dans `main`, une fois autorisée ; à défaut, la tête de `pre8-bmad/dev` publiée.
- **Dépendances documentaires** : registre ch07 (sections PRE-8 : arbitrages Mouvements, recette A/B, b8-3, epic E, Familles) ; DSF Familles et DSF Mouvements ; ch09, ch10, ch13 (CE-MVT-01 à 03, CE-T03-01) ; composition multi-circuit et cycles (`main` #408), non développée dans PRE-8.
- **Reporté hors PRE-8** : lot d'accessibilité VoiceOver de fin de MVP ; E.8-b et Q-E1 ; epics C (Composition) et D (reprise) ; formats spécialisés, Exécution, Planification, Programmes ; Trier ; emplacement pointillé ; `regle-6-cle-de-tri` ; dette de vérification globale (Jest, ESLint).
- **Précautions de réutilisation** : prédicats métier distincts entre Mouvements et Séances (primitives d'interface seules mutualisées) ; `useDragAutoScroll` partagé entre Composition et Catalogue des Mouvements ; `TransientNotification` à durée paramétrable (5 s par défaut) ; deux icônes Communauté coexistent (`nav5-community` utilisée, `navigation-community` apportée par `main`) ; règle permanente de synchronisation code / documentation (`.claude/rules/`).
- **Pour ouvrir la planification** : périmètre fonctionnel de PRE-9 défini et validé par Hermann ; décision sur la fusion de la PR PRE-8 ; exécution fractionnée des vérifications globales. Aucune story ni plan PRE-9 créé.
