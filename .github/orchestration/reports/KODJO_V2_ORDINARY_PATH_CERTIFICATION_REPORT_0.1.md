# KODJO V2 — Rapport de certification du parcours ordinaire 0.1

Date : 2026-09-13  
Tranche : `V2-PROD-00`  
Issue : #79  
Plan : `ad9a0ac8d6c498f235501200b4f28e16c1bb67b1`  
Revue indépendante : `ff2622891d04df5a1a23b6ab304331128c934d0b`  
Bootstrap SHA-256 : `1180141045af7bd311f84dce6dd74ebb7602fb28a9028de14c12f5e3d7e8962b`

## Verdict

Les treize scénarios C1–C4, D1–D3 et R1–R6 possèdent une preuve conforme au niveau défini par le plan. Le parcours réel nominal jusqu’à une PR jetable, la reprise par artefact et les principaux refus de sécurité sont démontrés.

Le verdict de campagne reste `SCENARIOS_CERTIFIED_EXIT_PENDING` tant que les deux réserves de nettoyage GitHub/runner décrites plus bas ne sont pas levées.

## Matrice de preuve

| Scénario | Niveau | Preuve principale | Verdict |
|---|---|---|---|
| C1 | Parcours réel | Lean #29, run `34718932308`, PR #87 fermée sans fusion | PASS |
| C2 | Parcours réel | Lean #30, run `34720271428`, Jest rouge, paquet intact, aucune publication | PASS |
| C3 | Parcours réel | Lean #32, run `34722199075`, même session C2, PR #91 fermée | PASS |
| C4 | Parcours réel | source Lean #42, run `34724854785`; reprise Lean #44; PR #94 fermée | PASS |
| D1 | Parcours réel | Lean #45, run `34742545132`, PR #96 fermée | PASS |
| D2 | Parcours réel | Lean #48, run `34746555331`, octets CRLF/binaire exacts, PR #100 fermée | PASS |
| D3 | Parcours réel | Lean #49, run `34747335822`, douze chemins exacts, PR #101 fermée | PASS |
| R1 | Parcours réel | Lean #50, run `34748465102`, doublon refusé avant Claude | PASS |
| R2 | Parcours réel | Lean #51, run `34748621746`, réaction absente refusée avant Claude | PASS |
| R3 | Parcours réel | run #50 tentative 2, job `103703849980`, rerun refusé avant Claude | PASS |
| R4 | Qualification jetable | CI #116, run `34750361895`, dérive pendant Jest refusée sans publication | PASS |
| R5 | Intégration déterministe | oracle réel Git : reset de l’index puis ajout borné exact | PASS |
| R6 | Test déterministe | index altéré refusé par `KODJO_QUEUE_STAGED_SCOPE_REFUSED` | PASS |

## Décompte certifiant

| Scénarios | Runs/tentatives certifiants | Invocations Claude réelles | Branches/PR fonctionnelles |
|---:|---:|---:|---:|
| 13 | 12 | 8 | 6 |

Les six PR fonctionnelles (#87, #91, #94, #96, #100, #101) ont toutes été fermées sans fusion et leurs branches de livraison ont été supprimées. Les PR #81, #82, #92, #93, #95, #98, #99 et #102 sont des corrections ou qualifications protocolaires, fusionnées seulement après CI.

## Simplification démontrée

Les fusions humaines nécessaires à C1–C3 n’ont plus été requises après l’introduction du lancement explicite `workflow_dispatch`. C4 et les scénarios suivants ont utilisé ce chemin tout en conservant la frontière immuable et l’admission de la demande. PE-24 passe à `DÉMONTRÉ`.

## Réserves de sortie

1. GitHub affiche encore un rerun fantôme de R2 (`34748621746`, « Latest #2 ») sans tentative API et sans job. Le runner reste disponible ; INC-119/PE-25 suivent cette limitation externe.
2. Branches distantes temporaires encore visibles au dernier inventaire : `kodjo/v2-v2-prod-00-34715041225`, `kodjo/v2-v2-prod-00-34715211418`, `kodjo/v2-v2-prod-00-34717973965`, `test/kodjo-v2-r4-r6-certification` et la branche documentaire de clôture. Elles doivent être supprimées après vérification qu’aucune PR ouverte ne les utilise.
3. Les répertoires persistants `_kodjo` du runner doivent être inventoriés par run avant toute suppression. Aucun nettoyage large ou non attribué n’est autorisé.

Aucune réserve ne remet en cause les preuves fonctionnelles des treize scénarios ; elles empêchent uniquement le verdict final de propreté complète.
