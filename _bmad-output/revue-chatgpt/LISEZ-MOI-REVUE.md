# PRE-4 BMAD — dossier révisé pour la vérification de ChatGPT (révision 2)

Préparé le 2026-10-16 par Claude (Claude Code), avec BMad Method 6.12.4 tel qu'installé, dans le clone `C:\Dev\KODJO-BMAD-PRE4`.

- **Révision 1** : archive `PRE4-BMAD-2026-10-16.zip` (SHA-256 `e490b1f041ce1cf9b817190ee484242f0a94c6651213bf7cb00c91a3280f9265`), revue par ChatGPT le 2026-10-16. Verdict : « corrections requises avant développement » (R1 à R4). La trace de cette revue est dans `_bmad-output/revue-chatgpt/revue-chatgpt-2026-10-16.md`.
- **Révision 2 (cette archive)** : R1 à R4 corrigés ou arbitrés, nouvelle porte de préparation. **Aucune vérification ChatGPT n'a encore porté sur cette révision.**

## 1. Ce qui est demandé

Vérifier les documents révisés, selon les conditions de clôture de la revue :
- R1 et R2 corrigés de façon cohérente ;
- R3 résolu explicitement ;
- R4 arbitré ;
- hypothèses produit retenues distinguées des propositions ;
- réexamen des zones modifiées.

Hermann arbitre ensuite les questions produit restantes et autorise explicitement, ou non, le démarrage du développement. **Aucun développement n'a commencé.**

## 2. Journal court : constat → modification → preuve

`_bmad-output/revue-chatgpt/journal-corrections-2026-10-16.md`. En résumé :

| Constat | Traitement |
|---|---|
| R1 — 150 → 120 répétitions accepté | Corrigé : tableau unique de tolérance (story 1.1 AC7, FR-09-05, FR-18-07) |
| R2 — Cellule active perdue à la fermeture du Sélecteur | Corrigé : `openSurface` et `activeCell` séparés, table T1-T27, règle anti-rappel (AD-15, AD-16, story 3.6) |
| R3 — Médias dans l'Éditeur | Sources confrontées, puis arbitrages de Hermann **Q27** (lecteur natif dans l'Éditeur) et **Q31** (toucher pour consulter, menu à l'appui long) : FR-21-02, FR-21-04, nouvelle FR-21-05, AD-17, nouvelle story 4.5 ; l'ancienne 4.5 devient 4.6 |
| R4 — valeurs négatives ou fractionnaires | Arbitrage de Hermann **Q28** : Exercice écarté selon Q19. Les valeurs positives hors bornes restent conservées (P40 remplacée, P44 amendée) |
| H5, H30 | **Q29** : H5 confirmée. **Q30** : H30 remplacée (travail connu et Pauses ; 105 s et 270 s) |
| H2, H22 | État Git décrit tel qu'il est ; H22 précisée (invite affichée seulement avant tout Mode) |
| Portabilité des chemins du ZIP | Archive reconstruite avec des noms d'entrées en UTF-8 et des barres obliques normales |

## 3. État et révisions

| Élément | Valeur |
|---|---|
| Branche | `bmad/pre4-comparaison` |
| Commit local | **Aucun commit pour cette préparation.** `HEAD` = `a8ec6c35cfecabce705c5a052e2a1d993279334d`, qui contient l'installation BMad (`_bmad/`, `.claude/skills/`). Les documents de ce dossier sont des fichiers de travail non commités. |
| Code de départ | `c32e360d891614f2b08a1d8f7f3f631eef0b57ea`, identique à la clôture PRE-3 `626632c3`. `src/` et `app/` ne sont pas modifiés. |
| Sources produit communes | `caa2a5cf11dc70f4c158dc5ccde325b49ff9d76d`, copies vérifiées sous `docs/preparation/PRE-4/bmad/sources-caa2a5cf/` |
| Push, workflows, EAS, Figma | Aucun. Figma n'a pas été lu en direct : seulement les données locales. |

Les empreintes SHA-256 de chaque fichier sont dans `MANIFEST-SHA256.txt`.

## 4. Documents (ordre de lecture conseillé)

| # | Fichier | Contenu |
|---|---|---|
| 1 | `_bmad-output/revue-chatgpt/revue-chatgpt-2026-10-16.md`, `journal-corrections-2026-10-16.md` | Revue de la révision 1 et corrections |
| 2 | `docs/preparation/PRE-4/bmad/questions-ouvertes.md` | **Décisions de Hermann Q1 à Q31**, règles P1 à P45 (P40 remplacée, P44 amendée), hypothèses H1 à H33 (H5 et H30 tranchées) |
| 3 | `docs/preparation/PRE-4/bmad/sources-retenues.md` | Sources, révisions, blobs, écarts Δ1 à Δ14 ; §7 : sources effectivement utilisées |
| 4 | `_bmad-output/planning-artifacts/prds/prd-kodjo-pre4-2026-10-16/prd.md` | PRD : 197 FR, 14 NFR, tables de couverture (annexe A) |
| 5 | `…/prd-kodjo-pre4-2026-10-16/extracts/` | Six extractions règle par règle, avec `fichier:ligne` |
| 6 | `_bmad-output/planning-artifacts/architecture/architecture-kodjo-pre4-2026-10-16/ARCHITECTURE-SPINE.md` | Architecture : 17 décisions AD, table de transitions T1-T27 (AD-15) ; `.memlog.md` |
| 7 | `_bmad-output/planning-artifacts/epics.md` | 4 epics, 22 stories, critères d'acceptation, scénarios de recette, couverture consolidée ; `epics-parts/` en contient les sources, identiques |
| 8 | `_bmad-output/planning-artifacts/implementation-readiness-2026-10-16-post-revue.md` | **Porte post-revue** : verdict initial CONCERNS (0 critique, 0 élevé, 3 moyens), puis traitement ; verdict estimé PASS, à vérifier |
| 9 | `_bmad-output/implementation-artifacts/sprint-status.yaml` | 22 stories en `backlog` |
| 10 | Revues internes historiques : `prds/.../review-rubric.md`, `reconcile-intrants.md`, `architecture/.../reviews/`, `implementation-readiness.md` | Antérieures à la revue ChatGPT, non mises à jour, verdicts d'origine conservés |
| 11 | `docs/preparation/PRE-4/bmad/recette-iphone.md`, `journal-comparaison.md` | Recette ; mesures et incidents d'indépendance |

Sources produit jointes, pour la correspondance : `perimetre-et-couverture.md`, `sources-caa2a5cf/` (50 sources), les spécifications de la base retenues en traçabilité, le corpus 276 et son encodage PRE-3, `docs/preparation/PRE-3/perimetre-et-couverture.md`, les données Figma locales, `CLAUDE.md` et `AGENTS.md`.

## 5. Points encore ouverts, non bloquants

- **Q9 :** titre « Créer un exercice » différent selon les PNG ; validation visuelle par Hermann.
- **F9 :** gras de « répétitions variables » ; lecture provisoire en texte normal.
- **Hypothèses produit encore non tranchées :** H4, H6 à H29, H31 à H33. Les stories concernées les signalent. Les avis de la revue sont repris sans valoir décision.
- **Hypothèses techniques à vérifier sur iPhone** : Popover dans la Feuille (S0, story 3.1) ; menu contextuel natif pour les Médias (story 4.5, AC9). Un repli est défini pour chacune.
- **Dev client « Routine Dev » :** compatibilité à vérifier avant la recette ; un nouveau build éventuel sera signalé (Q22).
- **Q19 commune à VNext :** sa transmission appartient à Hermann ; à vérifier avant de comparer les résultats sur données corrompues.

## 6. Indépendance

Orchestrations séparées, mais pas d'expérience complètement aveugle. Voir `journal-comparaison.md` : exposition initiale à des noms de fichiers du plan VNext ; lecture du code `@expo/ui` dans un autre clone ; menus des skills franchis sur consigne d'autonomie ; quelques retouches faites par `sed` ; rapports détaillés des analyses initiales non conservés.
