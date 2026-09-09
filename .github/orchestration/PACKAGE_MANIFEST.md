# Manifeste du paquet KODJO V2 0.6.9 — writer de preuves borné

## Objet

Ce paquet est la version `0.6.9` du protocole KODJO V2. Il ajoute à la baseline validée `0.6.8` le writer de preuves borné, son workflow de transition et ses tests de qualification locale.

## Sources primaires normatives

| Fichier | Rôle |
|---|---|
| `primary/KODJO_PROTOCOL_V2_SPEC_0.6.9.md` | Spécification normative courante |
| `primary/KODJO_PROTOCOL_V2_IMPLEMENTATION_WORKFLOW_REFERENCE_0.6.9.yml` | Workflow d'implémentation de référence ; contenu fonctionnel inchangé |

## Éléments de preuve et d’implémentation

| Chemin | Rôle |
|---|---|
| `evidence/incidents/KODJO_PROTOCOL_INCIDENT_REGISTER_v3.4.0_CORRECTED.md` | Registre d’incidents `3.4.0`, incluant `INC-079` (incident T02) et son test `T-052` |
| `evidence/t02/KODJO_PROTOCOL_V2_T02_CHANGE_REPORT_0.6.3.md` | Rapport de la correction de conservation/reprise |
| `evidence/t02/KODJO_PROTOCOL_V2_T02_TEST_MATRIX_0.6.8.md` | Matrice T02 à 18 scénarios, exécutée |
| `CHANGE_REPORT_0.6.8.md` | Rapport de changement `0.6.4` → `0.6.5` → `0.6.8` |
| `evidence/pilot/2026-09-08_kodjo-v2-preservation-pilot-0.6.3-rev4.md` | Rapport du pilote local et du smoke test GitHub réel |
| `evidence/workflows/kodjo-v2-implementation-artifact.yml` | Workflow exécutable d'implémentation, inchangé fonctionnellement depuis la baseline `0.6.8` |
| `evidence/workflows/kodjo-v2-preservation-smoke.yml` | Smoke test réel : upload depuis `${RUNNER_TEMP}` avant échec, téléchargement sous `${RUNNER_TEMP}` et restauration dans un second job |
| `evidence/workflows/kodjo-v2-transition.yml` | Workflow hébergeant le job writer séparé et son smoke test explicite |
| `evidence/scripts/kodjo/write-evidence-deposit.js` | Validation et ajout append-only des objets de preuve |
| `evidence/scripts/kodjo/prepare-evidence-writer-smoke.js` | Fixture protocolaire sans fichier applicatif pour le smoke test |
| `evidence/scripts/kodjo/` | Scripts de préservation, vérification, statuts, publication et reprise |
| `evidence/tests/kodjo/` | Tests exécutables du pilote |

## Preuve GitHub connue

| Élément | Valeur |
|---|---|
| Run | `34286251097` |
| Commit smoke | `234bd0a` |
| Résultat global | Rouge volontaire après upload |
| Job de restauration | Réussi |
| Artefact | Présent et restauré dans un second job |

## Contrôle du paquet avant transmission

Les scripts, tests et workflows inclus ont été reconstruits dans un dossier vierge puis exécutés le 9 septembre 2026, après ajout du writer `0.6.9` :

- `63` tests du pilote réussis sur `63` ;
- validation structurelle des trois workflows réussie ;
- scanner de capacités distantes : `NO_REMOTE_FUNCTIONAL_WRITE_CAPABILITY` ;
- aucune ancienne revue OpenAI ou Claude incluse dans le paquet.

## Hiérarchie documentaire

En cas d’écart :

1. la spécification `0.6.9` définit la règle ;
2. le workflow de référence `0.6.9` montre l’ordre attendu ;
3. les workflows, scripts et tests constituent la preuve d’implémentation du pilote ;
4. les rapports et matrices décrivent les résultats constatés, mais ne remplacent pas le code ni la spécification.

## Interdiction d'activation en vigueur

Le writer est implémenté et qualifié localement, mais son dépôt GitHub réel et les autorisations effectives des branches ne sont pas encore qualifiés. Le diagnostic normatif `EVIDENCE_WRITER_ABSENT` reste donc actif au sens « aucun writer qualifié disponible » et **l'activation de V2 reste interdite** jusqu'au smoke test distant et au contrôle des règles du dépôt.

## Limite de périmètre

Ce paquet implémente une **barrière de conservation et de reprise**, pas le protocole complet. Le moteur, la machine à états, la branche de preuves, les contrats, l'idempotence, le coupe-circuit, le mode manuel, les adaptateurs IA et l'indépendance des revues restent spécifiés sans implémentation, donc `NON VÉRIFIABLE`. Le registre d'adaptateurs de production est vide : qu'un adaptateur d'implémentation réel ne crée aucune référence Git reste à démontrer.
