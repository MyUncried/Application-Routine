# KODJO Protocol V2 — spécification normative 0.6.20

Cette version complète et supersède `KODJO_PROTOCOL_V2_SPEC_0.6.19.md` pour la migration d’un paquet de reprise non vide après une évolution protocolaire. Les autres invariants 0.6.19 restent applicables.

## Séparation des deux identités

- `recovery_source_head` désigne la base applicative sur laquelle le delta préservé a été produit ;
- `execution_source_head` désigne le HEAD portant le moteur protocolaire exécuté.

Une différence entre ces valeurs n’est jamais ignorée.

## Migration admissible

Un paquet non vide peut être restauré sur un nouveau HEAD uniquement si toutes les preuves suivantes sont PASS :

1. le paquet est intact et sa provenance tranche/session/baseline/request est conforme ;
2. son `source_head` est un ancêtre Git du HEAD d’exécution ;
3. chaque chemin modifié entre les deux HEAD appartient au périmètre protocolaire positif ;
4. aucun chemin intermédiaire ne recouvre un chemin du delta préservé ;
5. `git apply --check` réussit dans un clone propre du HEAD cible ;
6. l’application est atomique, sans `--3way`, `--reject` ni résolution implicite.

Toute évolution applicative intermédiaire, ascendance non démontrée, objet Git manquant, conflit, lien symbolique ou état ambigu produit un refus conservatoire avant Claude.

## Preuve

`invocation.json` et `result.json` portent `recovery_source_head_migration` avec la source, la cible, le mode, les chemins intermédiaires et le statut. La qualification de version doit télécharger l’artefact historique réel, et non une fixture équivalente, puis publier une preuve PASS ou FAIL liée au run courant.

## Limite de la certification 0.6.20

T-060 certifie la restauration réelle sans Claude. La certification complète du produit protocolaire exige encore deux tranches jetables séparées : INITIAL jusqu’à une PR réelle, puis interruption et RESUME_DELTA jusqu’à une PR réelle. Elles ne peuvent être déclarées PASS avant leur exécution effective.
