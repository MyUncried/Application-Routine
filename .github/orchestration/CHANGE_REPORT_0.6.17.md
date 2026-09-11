# KODJO V2 — rapport de changement 0.6.16 → 0.6.17

Origine : runs #12 `34584903053` et #13 `34587778681`, diagnostics `10193178795` et `10194331914`, paquet du run #11 `10193087055`.

## Corrections

- verrou propriétaire, vérifiable et conservateur ;
- identité du run créée avant exécution et résolution sans glob ni récence ;
- diagnostic pré-Claude explicite ;
- `request_id` non nullable dans les artefacts du run courant ;
- lectures Git via wrapper positif sans shell ni commandes mutantes ;
- plafond 40 tours, 41 refusé, `max_ai_calls=1` ;
- conservation du correctif de reprise vide de la PR #71.

## Qualification

La suite couvre T-053 à T-057, la reprise vide sur HEAD corrigé et le refus d'un paquet non vide sur un autre `source_head`. Le run PR `34599962140` est PASS : job Ubuntu `103264569038`, job Windows/PowerShell 5.1 `103264569377`, incluant la suite complète et le parcours isolé de file. Aucun appel Claude n'a été effectué.

## Hors périmètre

Aucun fichier applicatif, plan, revue, décision métier ou demande de file n'est modifié. Aucun run Claude n'est déclenché.
