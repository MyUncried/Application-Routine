# Bilan — révision 2 du change (16/10/2026)

Ce bilan complète [bilan-session-2026-10-16.md](bilan-session-2026-10-16.md), qui reste valable pour la révision 1. Il couvre la consolidation des propositions demandée après la revue ChatGPT des deux diagnostics.

## 1. Identification

| Élément | Valeur |
|---|---|
| Mission | Consolider les propositions sans corriger les spécifications produit : gouvernance, lots, dépendances, arbitrages |
| Clone et branche | `C:\Dev\KODJO-OPENSPEC-DOCS`, `docs/openspec-revision` |
| Commit de départ | `e8fa0910` (révision 1) |
| Base d'analyse | `main` `6656fefc58330955f5ad74d513ce616ea51809b0`, conservée ; `git ls-remote` au 16/10 : inchangée |
| OpenSpec | 1.14.2, schéma `spec-driven` |
| Contraintes respectées | Aucun changement de `docs/`, du code, de Figma, de BMAD ou de VNext ; aucun push ; pas de `/opsx:apply` ; pas d'archivage |

## 2. Ce que la revue a demandé, et ce qui a été fait

| Demande | Traitement |
|---|---|
| Source normative unique ; 13 chapitres maintenus | design G1 et G2 |
| DSF conservés jusqu'au transfert vérifié | design G4 ; spec « Source normative unique par règle » |
| L'emplacement ne résout pas une contradiction | design G3 ; spec « Résolution explicite des contradictions » ; l'ancienne règle « décision > domicile > autres » est retirée |
| Ancres explicites seulement si nécessaire | design G6 ; un seul cas proposé (CE-FMT, 166 liens) |
| Pas de bandeaux systématiques | design G7 ; un seul cas (README « Références actives ») |
| OpenSpec sans seconde source | design G9 ; spec « Pas de seconde source normative dans OpenSpec » ; `openspec/specs/` reste vide |
| Lots ordonnés selon les 6 priorités ; documentaire séparé du fonctionnel | `tasks.md` lots 1 à 6 ; classes DOC, DOC-AUTORITÉ, FONCT-ARBITRÉ, FONCT-À-ARBITRER (design G10) |
| Pas de renumérotation générale, ni de refonte, ni d'obligation disproportionnée | `tasks.md` « Ce qui n'est pas proposé » ; restauration avant numérotation (G6) |
| Contrôle des PR et des décisions | `diagnostic.md` §7 ; `arbitrages.md` §3 |
| Base initiale conservée, différences consignées | `diagnostic.md` §7 (Q24 à Q26 nouvelles, non intégrées) |
| Réexamen de Q-A à Q-N avec preuves | `arbitrages.md` |

## 3. Constats nouveaux de la révision 2

Ils sont détaillés dans [diagnostic.md §6](diagnostic.md).

- **R-06.** La consolidation `7a89220f` a effacé des identifiants dans les 13 chapitres :
  - 244 lignes ne diffèrent de leur version d'origine que par des identifiants, et portent toutes une trace d'effacement mécanique ;
  - 214 lignes ont aussi été reformulées ;
  - les règles `RM-FMT-01` à `42`, les exclusions « (RM-FMT-20–27 et RM-FMT-33–38) » et les recettes `REC-01` à `28` existent à l'identique dans `7a89220f^` ;
  - les constats R-03, H-13, S-10, QF-03, QF-18 et H-08 sont donc requalifiés en **pertes restaurables**.
- **R-07.** La même consolidation a effacé la colonne Statut, le repère DEC-nn et la trace FMT de D-357 à D-369 (cause du constat H-12), ainsi que des renvois dans 10 autres décisions.
- **R-08.** Sur les 24 décisions vidées le 07/10, 22 relèvent d'un remplacement explicite par Bip v2 (Cadence). D-237 et D-252 n'ont pas cet objet.
- **Q-M.** D-334 et D-335, décisions validées par Hermann, ont été perdues lors de la fusion `ae50aaed` du 09/10. Elles sont présentes dans le parent `341f4d41`.
- **Erratum de la révision 1 :** la proposition de soumettre à Hermann la plage d'exclusion « (RM-et RM-) » est retirée. La plage existe dans Git et doit être restaurée, pas décidée.

## 4. Arbitrages

Le détail figure dans [arbitrages.md](arbitrages.md).

| Classement | Questions |
|---|---|
| Résolues par les sources | Q-E, Q-G, Q-H (a), Q-M, et une partie de Q-A, Q-B et Q-D ; X-06 et X-07 (texte des décisions Q18 et Q8) |
| Recommandations documentaires | Q-C, Q-N, emplacement de la règle d'autorité, ch. 07:559, ordre de fusion des PR, Q-O (nouvelle) |
| Arbitrages produit restants | rang ch. 08 / ch. 13 (Q-A) ; D-339 et D-341 (Q-B) ; version des Formats et de la Cadence à l'exécution (Q-D) ; Q-F ; Q-H (b) ; Q-I (différable) ; Q-J ; Q-K (a) et (b) ; portée générale des décisions PRE-4 (Q-L) |
| Accord de procédure | A-PRE4 (modifier dans `main` une source figée par PRE-4) |

Il y a au total **11 questions fermées** pour Hermann ([arbitrages.md §2](arbitrages.md)).

## 5. Premier lot

Le lot 1 porte sur le seul registre du ch. 07. Il est classé DOC et ne change aucun statut. Inventaire : [constats/LOT-1-registre.tsv](constats/LOT-1-registre.tsv).

| Groupe | Contenu | Source |
|---|---|---|
| G1 | 24 textes d'origine ajoutés à côté de la prescription courante | `37e372cd^` |
| G2 | 13 décisions D-357 à D-369 : repère, horodatage, Statut, trace | `7a89220f^` |
| G3 | 10 décisions : renvois effacés (8 restaurations de ligne, 2 réinsertions ciblées) ; D-337 et D-338 non modifiées | `7a89220f^` |
| G4 | D-334 et D-335 réinsérées | `341f4d41` |

**Préalables :** accord A-PRE4 et ordre de fusion avec les PR (questions 1 et 10).

## 6. Modifications du change (révision 2)

| Fichier | Action |
|---|---|
| `design.md` | Réécrit : principes G1 à G10, historique de révision, tableau des écarts avec la révision 1 |
| `specs/gouvernance-documentaire/spec.md` | Réécrit : 8 exigences de gestion documentaire, sans règle produit |
| `tasks.md` | Réécrit : lots 1 à 6 selon les priorités ; lot 1 délimité ; classes ; préalables |
| `proposal.md` | Réécrit pour la révision 2 |
| `diagnostic.md` | Ajout des §6 (R-06, R-07, R-08) et §7 (évolutions postérieures à la base) ; sections 0 à 5 inchangées |
| `arbitrages.md` | Créé |
| `bilan-revision-2-2026-10-16.md` | Créé (ce fichier) |
| `constats/R-06-restauration-identifiants.tsv` | Créé : inventaire ligne à ligne, 464 lignes |
| `constats/R-07-registre-7a89220f.tsv` | Créé : écarts du registre, colonne par colonne |
| `constats/LOT-1-registre.tsv` | Créé : inventaire exact du lot 1 |
| `constats/arbitrages/G-gouvernance.md`, `F-fonctionnel.md` | Créés : analyses brutes, copies identiques (`cmp`) |
| `outils/plan-restauration-identifiants.mjs`, `inventaire-lot1-registre.mjs`, `comparer-registre.mjs`, `compter-identifiants.mjs` | Créés : contrôles en lecture seule, rejouables |
| `outils/brief-arbitrages.md` | Créé : consigne donnée aux analyses |
| `qualite.md`, `bilan-session-2026-10-16.md`, rapports bruts de la révision 1 | Inchangés |

**Non versionné :** l'archive `openspec/changes/revision-documentation-kodjo.zip`, présente avant cette révision et produite hors de cette session, est laissée en place, non suivie. La nouvelle archive de revue est produite à côté, sous un autre nom (voir la réponse de fin de session).

## 7. Limites

- Les analyses d'arbitrage sont fondées sur des recherches ciblées. Leur certitude est indiquée question par question dans les rapports bruts.
- Le fichier de décisions PRE-4 est une copie de travail non versionnée d'un autre environnement : il est cité par empreinte et par extraits, non copié.
- Les 214 lignes « à examiner » de R-06 n'ont pas été qualifiées une à une.
- La validation de D-341 du 12/10 repose sur un registre de recette PRE-3 (`docs/preparation/PRE-3/planification/execution/preuves/registre-recette1.md:189`), vérifié ; son report en statut reste à faire au lot 5.

## 8. Prochaines étapes

1. Revue indépendante ChatGPT de la révision 2 (archive fournie).
2. Réponses de Hermann aux 11 questions de [arbitrages.md §2](arbitrages.md), en commençant par A-PRE4 et l'ordre des PR.
3. Seulement ensuite : `/opsx:apply` limité au lot 1, puis contrôles 1.7, puis commit local.
