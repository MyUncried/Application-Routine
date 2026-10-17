# Bilan — lot 6A, révision 2 après la revue indépendante (17/10/2026)

## Objectif

La revue du lot 6A a conclu PARTIELLEMENT CONFORME. Cette révision traite ses quatre réserves :
1. un traitement concret pour chaque défaut, y compris dans les sections conservées ;
2. aucune suppression de copie sur un simple seuil de similarité ;
3. des vérifications qui portent aussi sur le sens, les références et l'autorité ;
4. un traitement systématique des défauts de qualité, en séparant le rédactionnel des décisions produit.

Elle réexamine aussi quatre points : le rôle du ch. 08, la justification du ch. 14, les dépendances aux PR et les points d'arrêt.

Les analyses, inventaires et matrices existants sont conservés. **Aucun document produit n'est modifié.**

## Branche et commits

| Élément | Valeur |
|---|---|
| Branche | `docs/openspec-revision` |
| Départ | `1122bb9d` (= `origin/docs/openspec-revision`, vérifié) |
| `main` | `6656fefc`, inchangé |
| PR | #363 `d2386c8d`, #370 `6cf3634a`, #371 `2c050d0e` : inchangées |

## Corrections

| Point | Correction | Résultat mesuré |
|---|---|---|
| Réserve 1 | Colonne `traitements` de `correspondance.tsv` : chaque défaut de chaque section reçoit un traitement et une étape, quelle que soit l'action de la section | 1 180 traitements pour 652 sections, dont 302 conservées en place ; 0 défaut non couvert |
| Réserve 2 | R2 : la similarité désigne un candidat ; le renvoi exige l'équivalence complète des lignes, la même portée et une autorité compatible. `copies-lignes.mjs` exige le même contexte (portée, domaine, caractère normatif, en-tête de tableau) | 21 renvois au lieu de 32 ; 11 copies partielles conservées ; 89 occurrences de lignes remplaçables, 158 à vérifier |
| Réserve 3 | `verifier-conservation.mjs` : trois contrôles ajoutés, plus la validation des motifs de justification :<br>- C5 portée ;<br>- C6 marqueurs d'autorité ;<br>- C7 références.<br>Nouvel outil `verifier-redaction.mjs` (invariants de sens d'une correction rédactionnelle) | Autotests : 6 scénarios de conservation et 5 corrections conformes à l'attendu ; les 12 corrections B1 à B5 sont reconnues comme non rédactionnelles |
| Réserve 4 | Plan §10 : inventaire QF, QC et QS ; corrections rédactionnelles en 6K (contrôle C10) ; décisions produit en 6J, en une liste groupée | — |
| Ch. 08 | Option « conception par fonctionnalité » recommandée au lieu de la table de renvoi | 23 % du chapitre restent ; il reçoit 182 lignes de comportements |
| Ch. 14 | Abandonné : les conventions d'interface vont au ch. 06 ; le design system technique reste au ch. 12 | Aucun nouveau chapitre |
| PR | `dependances-pr.mjs` : sections réellement modifiées, rattachées par titre exact (37 sur 37) | 35 sections ; seules celles-ci attendent |
| Points d'arrêt | Une autorisation globale, puis aucun arrêt entre les étapes ; arrêt seulement sur un échec bloquant ou pour les décisions produit (6J) | — |

## Contrôles

| Contrôle | Résultat |
|---|---|
| `docs/` modifié | non |
| `verifier-conservation.mjs` sur l'arbre courant | vérifié (C1 à C7) |
| `verifier-correspondance.mjs`, sections CONSERVER | 589 sur 589 conformes |
| OpenSpec `--strict` (change et `--all`) | réussi, après découpage de l'exigence de conservation en deux exigences |
| Liens | aucune anomalie dans les fichiers du change modifiés ; `links.mjs` sur `docs/` : 2 anomalies historiques, inchangées |

## Hypothèses non démontrées

- La portée est lue dans les titres par motifs. Une portée écrite seulement dans le corps d'un paragraphe reste dans la ligne, conservée à l'identique.
- La classification par sous-agents n'a pas été relue par un second lecteur.

## Fichiers modifiés

**Lot 6 :**
- `lot6/plan-restructuration.md` (révision 2) ;
- `lot6/correspondance.tsv` et `lot6/copies-lignes.tsv`, régénérés ;
- `lot6/dependances-pr.tsv`, nouveau.

**Outils :**
- `outils/correspondance-cible.mjs`, `copies-lignes.mjs` et `verifier-conservation.mjs` ;
- `outils/dependances-pr.mjs` et `verifier-redaction.mjs`, nouveaux.

**Documents du change :**
- `tasks.md` (0.15, 0.15b, 0.16, lot 6) ;
- `design.md` (révision 3 proposée) ;
- `specs/gouvernance-documentaire/spec.md` : exigences « Conservation vérifiée lors d'une restructuration » et « Sens, portée et autorité conservés » ;
- ce bilan.

## En attente

- Revue indépendante de la révision 2 (0.15b).
- Décisions QR-1 à QR-9 (0.16).
- C1 (D-401), vérifications Figma, signalement à la PR #371.

## État Git

Commit et push sur `docs/openspec-revision` uniquement ; SHA communiqué en fin de session. Les 4 ZIP non suivis restent hors commit.
