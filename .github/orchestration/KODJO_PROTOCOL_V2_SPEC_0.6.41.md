# KODJO Protocol V2 — spécification 0.6.41

Date : 2026-09-19  
Base : 0.6.40  
Objet : qualifier et fermer la chaîne UI V2 de bout en bout, jusqu’au gate humain/device et `READY_TO_CLOSE`, sans créer de nouveau canal.

## Principe

Cette version correspond à l’étape 4/4 de restauration E2E des garde-fous UI.

Elle ne crée aucun nouvel état protocolaire. Elle réutilise :

- `IMPLEMENTATION_REVIEW_APPROVED` pour l’approbation technique ;
- le marqueur existant `[KODJO_SLICE] VISUAL_APPROVED` comme gate humain/device lié à un HEAD exact ;
- `READY_TO_CLOSE` comme état final V2 avant fermeture/intégration.

Le chemin legacy non V2 conserve son `STATUT : DONE` historique et son manifeste `.github/orchestration/slices/<slice>.yml`.

## Défaut découvert pendant la qualification

Le finalizer générique existant ne pouvait pas clôturer une tranche V2 Lean Queue :

- il exigeait `manifest_path=.github/orchestration/slices/<slice>.yml` ;
- les tranches V2 sont liées à `.github/orchestration/queue/v2/*.json` et à leurs artefacts matérialisés ;
- aucun manifeste legacy V2-CAT-01/V2-BILAT-01 n’existe.

La chaîne était donc conforme jusqu’à `IMPLEMENTATION_REVIEW_APPROVED`, mais la transition réelle vers le gate humain/device puis la clôture n’était pas qualifiable par le finalizer existant.

0.6.41 corrige ce raccord dans le workflow de finalisation existant, sans nouveau workflow ni nouveau marqueur.

## Compatibilité VISUAL_CORRECTION

La qualification E2E a identifié une régression introduite par 0.6.40 : la revue structurée critère-complet était activée pour toute Lean Queue V2, y compris `VISUAL_CORRECTION`. Or une correction visuelle doit rester une revue différentielle bornée au delta courant ; exiger tous les `change_targets` du plan initial contre le seul diff correctif rendait ce chemin impossible.

0.6.41 corrige ce point sans changer le contrat historique :

- `IMPLEMENT` utilise la revue critère-complète 0.6.40 ;
- `VISUAL_CORRECTION` conserve la revue différentielle historique existante ;
- aucun nouveau statut ni canal n’est créé ;
- la finalisation V2 accepte les deux modes et les distingue explicitement par `review_mode=CRITERION_COMPLETE|VISUAL_CORRECTION_DELTA`.

Une `VISUAL_CORRECTION` n’invente donc pas rétroactivement un nouveau contrat complet. Sa fermeture repose sur le checkpoint/cible V2 existants, la revue indépendante du delta, les contrôles déterministes, puis le gate humain/device sur le HEAD exact.

## Gate V2 final

Le même workflow `.github/workflows/kodjo-slice-finalize.yml` accepte désormais deux chemins strictement séparés :

### Legacy

Comportement inchangé :
- `manifest_path` obligatoire ;
- contrôle du manifeste legacy ;
- `STATUT : DONE`.

### V2

Le gate V2 est identifié depuis la sortie d’implémentation référencée par la revue :
`continuity_origin=V2_LEAN_QUEUE`.

Il vérifie :

1. commentaire utilisateur dont la première ligne est exactement `[KODJO_SLICE] VISUAL_APPROVED` ;
2. même Issue ;
3. `slice_id` exact ;
4. `source_review_comment_id` exact ;
5. même `head` entre approbation utilisateur, revue technique et sortie d’implémentation ;
6. revue bot `verdict=APPROVE`, `STATUT : IMPLEMENTATION_REVIEW_APPROVED` ;
7. sortie d’implémentation bot `STATUT : IMPLEMENTATION_READY_FOR_REVIEW` ;
8. Lean Queue `kodjo.protocol.v2.lean-request.0.6.13` ;
9. PR applicative encore ouverte, base `main`, même branche et même HEAD ;
10. branche distante encore exactement au HEAD approuvé ;
11. plan approuvé relu depuis son blob ;
12. diff base→HEAD reconstruit par l’API GitHub ;
13. rejeu de `verify-ui-implementation-review.js validate` contre le contrat de revue publié ;
14. critères techniques tous `CONFORME` ;
15. `PRESERVE/FORBIDDEN` tous `PASS` ;
16. preuves techniques toutes `PASS` ;
17. preuves `VISUAL_COMPARE/DEVICE_CHECK` encore `PENDING_DEVICE` avant le gate humain.

L’approbation utilisateur sur le HEAD exact constitue alors l’évidence humaine/device qui satisfait ces preuves en attente.

## Vérification finale

Après le gate humain/device :

- checkout du HEAD exact ;
- `npm ci` ;
- Jest complet ;
- TypeScript ;
- lint pour V2 ;
- HEAD exact ;
- checkout propre.

Aucun appel Claude n’est réalisé.

La sortie V2 est publiée dans le canal existant :

`[KODJO_SLICE] FINAL_OUTPUT`

avec :

- `implementation_review_comment_id` ;
- `visual_approval_comment_id` ;
- `STATUT : READY_TO_CLOSE` ;
- bloc `KODJO_UI_FINAL_VERIFICATION_JSON`.

Ce bloc contient uniquement des références, empreintes et résultats finaux. Il ne crée aucune nouvelle décision produit.

## Statuts et taxonomies

Aucun nouvel état global n’est ajouté.

- `PENDING_DEVICE` reste une valeur de preuve avant le gate humain.
- `device_evidence_satisfied=true` est un booléen d’évidence finale, pas un état.
- `READY_TO_CLOSE` existe déjà dans la machine à états canonique.
- le legacy conserve `DONE` sans migration silencieuse.

## Non-régression

Inchangés :
- PLAN 0.6.38 ;
- PLAN_HANDOFF/IMPLEMENT 0.6.39 ;
- IMPLEMENTATION_REVIEW 0.6.40 ;
- Lean Queue 0.6.13 ;
- recovery/checkpoint/attestation ;
- VISUAL_CORRECTION ;
- application code ;
- canal de revue ;
- canal de finalisation ;
- mécanisme legacy.

## Qualification

La qualification 0.6.41 doit couvrir :

- chaîne synthétique complète plan → revue technique → gate humain/device → READY_TO_CLOSE ;
- mauvais HEAD utilisateur ;
- mauvaise revue référencée ;
- faux PASS device avant gate humain ;
- PR/branche/HEAD déplacés dans le workflow ;
- rejeu du contrat de revue ;
- UTF-8 sans BOM pour les chemins du diff sous Windows PowerShell ;
- suite complète Linux ;
- Windows preflight et parse PowerShell ;
- seconde passe indépendante.

La qualification synthétique ne prétend pas constituer une revue iPhone réelle d’une fonctionnalité applicative ; elle qualifie la mécanique protocolaire du gate. Une vraie fonctionnalité reste soumise à son test humain/device réel.
