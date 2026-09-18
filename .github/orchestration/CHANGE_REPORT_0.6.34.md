# Change report — KODJO Protocol V2 0.6.34

Date : 2026-09-18

## Objet

Fermer l’écart restant après 0.6.33 : une nouvelle tranche était encore activée sans `planning_application_head`, puis ce champ pouvait être ajouté seulement au handoff.

## Risque

Ce comportement aurait transformé une correction historique V2-CAT-01 en pratique implicite :
- identité incomplète à l’activation ;
- mutation tardive du bootstrap ;
- risque de réattacher la migration historique au hash complet du bootstrap à chaque replanification.

## Corrections génériques

- `activate-kodjo-v2-slice.js` initialise `planning_application_head=baseline_head` dans bootstrap et registre ;
- `START_INITIAL_PLAN` refuse une identité absente ou différente de la baseline ;
- `materialize-approved-plan-handoff.js` refuse l’absence et la divergence bootstrap/registre avant toute matérialisation ;
- `slice-identity.js` valide le SHA et l’identité bootstrap/registre ;
- le JSON Schema du bootstrap déclare la propriété ;
- les E2E positifs n’ajoutent plus artificiellement le champ.

## Confinement legacy

La migration `V2-CAT-01-LEGACY-PRODUCT-SOURCE-HASHES` reste spécifique à V2-CAT-01.

Sa liaison est déplacée du hash complet du bootstrap vers `product_identity_sha256`, calculé uniquement sur :
- `slice_id` ;
- `baseline_head` ;
- `product_sources`.

Un changement ultérieur de `planning_application_head` ne nécessite donc plus de modifier cette migration.

Aucune création automatique de migration n’est ajoutée.

## Hors périmètre

Aucun changement applicatif, aucune décision produit, aucune modification du contrat `lean-request.0.6.13`, du superviseur Claude, de recovery, RESUME_DELTA ou VISUAL_CORRECTION.
