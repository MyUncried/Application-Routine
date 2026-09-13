# KODJO V2 — Rapport de certification du parcours ordinaire 0.1

Date : 2026-09-13  
Tranche : `V2-PROD-00`  
Issue : #79  
Plan : `ad9a0ac8d6c498f235501200b4f28e16c1bb67b1`  
Revue indépendante : `ff2622891d04df5a1a23b6ab304331128c934d0b`  
Bootstrap SHA-256 : `1180141045af7bd311f84dce6dd74ebb7602fb28a9028de14c12f5e3d7e8962b`

## Verdict

Les treize scénarios C1–C4, D1–D3 et R1–R6 possèdent une preuve conforme au niveau défini par le plan. Le parcours réel nominal jusqu’à une PR jetable, la reprise par artefact et les principaux refus de sécurité sont démontrés.

Le verdict final de campagne est `CERTIFIED_WITH_EXTERNAL_GITHUB_LIMITATION`. Les treize scénarios, la propreté du runner, la fermeture sans fusion des PR fonctionnelles et la suppression des branches temporaires satisfont les sept critères de sortie du plan.

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

## Preuves de sortie runner

- inventaire en lecture seule : run `34754349516`, job `103716093344`, artefact `10316574627` ;
- état inventorié : neuf répertoires attribués à neuf runs Lean Queue terminés, aucun verrou Claude, aucun processus lié à `_kodjo` ;
- nettoyage ciblé : run `34755252729`, job `103718423213`, neuf identités revalidées via l’API GitHub avant suppression ;
- résultat : `4 604 266 365` octets supprimés ; contrôle final `lock=False`, `processes=0`, `directories=0`.

## Limitation externe résiduelle et clôture

1. GitHub affiche encore un rerun fantôme de R2 (`34748621746`, « Latest #2 ») sans tentative API et sans job. La tentative d’annulation forcée retourne HTTP 409 (« re-run ... has not yet queued »). Les inventaires prouvent que le runner est libre ; INC-119/PE-25 classent cet affichage comme limitation externe non exécutante.
2. Les anciennes branches fonctionnelles et les cinq branches techniques de sortie ont été supprimées après vérification ; aucune PR de campagne n’est ouverte.

La limitation d’affichage GitHub ne remet en cause ni les treize scénarios ni la propreté réelle du runner. La certification du parcours ordinaire KODJO V2 est acquise ; INC-119/PE-25 restent ouverts uniquement pour le défaut externe d’affichage et d’annulation du rerun fantôme.
