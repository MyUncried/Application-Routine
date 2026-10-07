# Sources de la consolidation Cadence du06/10/2026

Baseline distante : `6d03f5be579f2d0e2e7602b6abf1c2b46f4c740b`. Les pièces reçues sont conservées telles quelles ; leurs incohérences et statuts datés sont traités dans les références actives, pas corrigés silencieusement dans les sources. Excel exclusivement rédactionnel : aucune vérification ni reprise de sa logique de durée.

Le document v12 déplacé est le texte historique du dépôt ; ses liens relatifs étaient écrits depuis Specifications-fonctionnelles. La source originale au commit de baseline reste la preuve de ce contexte.

| Source | SHA-256 |
|---|---|
| [conception-cadence-source.md](conception-cadence-source.md) | `e13b07c9ad00617fd26a2c7b4a4dd0f91ec6903195b866d617f9e78cfb366f64` |
| [dossier-cadence-phrase-source.md](dossier-cadence-phrase-source.md) | `d6f2a83146aab481d03a150bf349ee98b7c4b244c1e61ac3a77e570b398389e7` |
| [generateur-phrase-activite_v13.xlsx](generateur-phrase-activite_v13.xlsx) | `1f4bca33dc9902337ace53293a41150954e5a4ef65cfca9788820b17b1d60c7b` |
| [journal-dsf-source.md](journal-dsf-source.md) | `ea9022a79c54f5995aea50a9d03915c5cd71e728f48905f7e1699e7a869e1d59` |
| [parametres-v12-historique.md](parametres-v12-historique.md) | `64a185e16b64627dca6caf2f1ee3b972677654712f2bd15094f328b60ce1fa7c` |
| [points-documentaires-source.md](points-documentaires-source.md) | `b7e6e8e7dd2cacf246d338be0d8788bfdb098dd20bd2761f63e343e2d1a198d1` |
| [rapport-corrections-source.md](rapport-corrections-source.md) | `8599295168f563f3990c11d0ea5c406b8c9df78d3496cbd272c46b0eb7db1c17` |
| [plan-documentaire-valide-source.md](plan-documentaire-valide-source.md) | `2d62e3d396c32aa91decda89215e5602614de73993dbbb1320ee413f1f6bbee5` |
| [brief-alignement-code-v2.1-source.md](brief-alignement-code-v2.1-source.md) | `38e4487c1724560cc918da16215fee60bf09e7a2686c802bf6d81f4faa26d08f` |
| [audit-dsf-seconde-passe-source.md](audit-dsf-seconde-passe-source.md) | `dac735e0060975c9e5e7023f7861250551721d0aa8d352718367ffcb92560036` |

Le plan est la révision 2 conservée dans le chantier initial, identique à la pièce retransmise. Le brief archivé est la v2.1 retransmise par le propriétaire (38e4487…). La réserve F-14 est levée par la clarification de provenance et la désignation de la référence ci-dessous. Le brief guide le futur lot code et ne remplace aucune règle métier. L’audit de seconde passe est identique à la pièce citée par Claude (dac735e…). Le nouvel audit du 06/10 est conservé sans modification dans les rapports d’orchestration.

## F-14 — provenance clarifiée et référence pour l’alignement du code

**Archivé ; réserve de version levée le 06/10/2026.** Selon l’explication de Claude transmise par le propriétaire, les empreintes `38e4487…` (brief reçu) et `5e90753…` (copie auditée) correspondent à deux états successifs du même brief, tous deux libellés v2.1. La copie utilisée par Claude est postérieure : son annexe G inline (7 585 caractères) est remplacée par un renvoi au journal (2 562 caractères), avec cinq renvois adaptés. Claude déclare avoir reproduit cette transformation et obtenu une identité caractère pour caractère ; il indique que D1–D10, §5.7 et annexes A–F/H sont inchangés. Cette comparaison est attribuée à Claude, et n’a pas été rejouée ici puisque sa copie postérieure n’est pas disponible.

**Référence pour le futur alignement du code : [brief reçu archivé](brief-alignement-code-v2.1-source.md), SHA-256 `38e4487c1724560cc918da16215fee60bf09e7a2686c802bf6d81f4faa26d08f`. En cas d’écart avec l’annexe G, [le journal archivé](journal-dsf-source.md) prévaut.** Les spécifications fonctionnelles restent l’autorité sur les comportements et règles métier ; ce brief ne les remplace pas.

L’annexe G du brief reçu reste intacte comme pièce source. Son total « 4 172 + 183 liaisons de styles de texte » est erroné : le journal §4 établit 4 172 textes, et son §9 attribue les 183 aux remplissages et traits semi-transparents. Les valeurs « ≈ 2 100 » et « ≈ 3 000 » sont des approximations historiques, pas des décomptes courants ; consulter les opérations détaillées du journal. Aucune réécriture du brief ou du journal d’origine.

Preuve de la clarification et contrôles : [rapport F-14](../../../.github/orchestration/reports/2026-10-06_CLARIFICATION_F14_BRIEF.md).

## Suivi du point 18 — 07/10/2026

Le point 18 de `points-documentaires-source.md` est **clos** par la [mise à jour du voile](../../MATRICE-VOILE-MODAL-2026-10-07.md) : voile unique `overlayScrim` #1F2129 à 34 %, ombre de déplacement distincte. Les originaux archivés conservent leur état daté ; leurs statuts ne constituent pas le suivi courant.
