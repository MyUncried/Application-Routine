# Change report — KODJO Protocol V2 0.6.26

## Objet

Empêcher qu'une attestation de migration produite avant le plan final soit réutilisée après l'intégration du plan et de sa revue.

## Incident

Le paquet du run `34872653037` restait récupérable, mais son attestation était ancrée sur `7945b027da837837edae4135862b0c3eb0bb01be`. Le plan et la revue approuvés ont ensuite été intégrés sur `c6746e53bd800fbe497fcd867d349a1e24c50934`. Les 21 commits intermédiaires provoquaient donc le refus prévisible `RECOVERY_MIGRATION_UNCERTIFIED_DIFFERENCE`.

## Cause

Le protocole contrôlait correctement les différences après l'ancre, mais ne vérifiait pas que cette ancre portait déjà les blobs du plan et de la revue autorisés. L'attestation pouvait être préparée trop tôt dans le cycle et devenir périmée après les étapes obligatoires suivantes.

## Correction

- exiger que le commit d'approbation du plan soit ancêtre de `certified_target_head` ;
- vérifier les blobs exacts du plan et de la revue à ce HEAD certifié ;
- conserver le commit d'attestation comme dernière différence auto-référencée ;
- maintenir tous les contrôles existants de provenance, classification, chevauchement et différences postérieures.

## Effets de bord examinés

- aucune modification applicative ;
- aucune modification du format de la demande Lean Queue ;
- aucune liste blanche supplémentaire ;
- les attestations historiques restent compatibles lorsqu'elles ont réellement été produites après leurs plan et revue ;
- une attestation historique antérieure à l'approbation est désormais refusée explicitement au lieu d'échouer plus tard par différence non certifiée.

## Qualification exigée

- tests ciblés des autorisations et de la migration ;
- suite protocolaire Linux complète ;
- prévol Windows complet, car l'admission réelle s'exécute sur le runner Windows ;
- scénario de mise en service sans Claude avec l'attestation finale du paquet `34872653037`.
