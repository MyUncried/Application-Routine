# Intégration et activation VNext — compte rendu de mission

Date d’observation : 2026-10-08  
Dépôt : `MyUncried/Application-Routine`

## Résultat

L’intégration et le basculement VNext sont terminés sur `main`.

- PR intégrée : [#332](https://github.com/MyUncried/Application-Routine/pull/332)
- candidat qualifié : `9ecd3ec729dd9443462a53e03d9ed6b37f02746c`
- commit de fusion : `68539d0fb1e040f98bea5fccb6e3b54c9df8da31`
- commit d’activation : `fff9c38d61f05b677c693208e1e4141240da47ee`
- PR documentaire PRE-3 : #333, laissée ouverte et non fusionnée
- aucun cycle produit PRE-3 lancé

## Qualification et revue indépendante

Les preuves portent sur le candidat exact `9ecd3ec729dd9443462a53e03d9ed6b37f02746c`.

- stabilité et architecture VNext : [run 37701620897](https://github.com/MyUncried/Application-Routine/actions/runs/37701620897), succès ;
- suite pilote Linux et Windows : [run 37701620830](https://github.com/MyUncried/Application-Routine/actions/runs/37701620830), succès ;
- audit indépendant : [run 37701620805](https://github.com/MyUncried/Application-Routine/actions/runs/37701620805), succès ;
- verdict publié : `APPROVE`, zéro constat bloquant, une réserve majeure et trois mineures non bloquantes ;
- rapport versionné : `.github/orchestration/reports/2026-10-07_INDEPENDENT_AUDIT_37701620805_1.md`, commit `39c40a4d3a563cb857dc306931eabcfb61047eaa`, SHA-256 `a3c49636e2050cb64d6231a7b6ca9739a2bd2e64e6e015cf4d211665802d2bf8`.

## Contrats d’activation

Les fichiers canoniques suivants sont présents dans le commit d’activation :

- `.github/orchestration/vnext-cutover/cutover-plan.json`
- `.github/orchestration/vnext-cutover/legacy-registry-at-activation.json`
- `.github/orchestration/vnext-cutover/activation.json`

Preuves associées conservées :

- `qualification-evidence.json`
- `remote-write-attestation.json`
- `user-authorization.json`

Validation indépendante des contrats au commit `fff9c38d61f05b677c693208e1e4141240da47ee` :

- plan scellé valide : `0cc6c54a23e1f0c7750b746fa31ce687ac4b4ad3bd279d156f5e2baca5323c03` ;
- activation scellée valide : `c3cbf8be5c89f215aa25cfb13208c76ec0143359f4f256430f82cc05560ae15c` ;
- liaison activation → plan valide ;
- liaison candidat → plan/activation valide ;
- registre legacy figé lié par son empreinte ;
- attestation d’écritures distantes valide : `PASS_WITH_FROZEN_LEGACY` ;
- activation liée au commit de fusion `68539d0fb1e040f98bea5fccb6e3b54c9df8da31`, ancêtre du commit courant.

## Routage vérifié

Le routeur réel `scripts/kodjo/lib/vnext-cutover-contract.js` a validé les contrats et produit :

| Identité | Protocole |
|---|---|
| `V2-PRE-1` | `LEGACY` |
| `V2-PRE-2` | `LEGACY` |
| `PRE-3` | `VNEXT` |

Le registre figé conserve également en legacy les tranches actives historiques déclarées dans le plan.

## Réserves conservées

La revue indépendante approuve l’intégration mais conserve les limites suivantes :

- réserve majeure : l’exécution d’une revue à l’échelle complète de l’application au-delà de 187 candidats n’est pas encore prouvée ;
- inventaire normatif VNext partiel avec classification fail-safe `UNKNOWN`, et doublon de titre dans le manifeste ;
- quatre consommateurs hérités sélectionnent le premier bloc machine, sans voie d’injection démontrée ;
- le wrapper de clôture GitHub certifié reste propre à la campagne `VNEXT-12-QUALIF` ;
- les scénarios externes historiques n’ont pas été rejoués sur la tête d’intégration ; les contrôles de régression et d’équivalence qualifiés sont ceux déclarés dans les preuves.

Ces réserves sont non bloquantes pour l’activation et ne sont pas présentées comme résolues.

## Point de reprise PRE-3

Le prochain travail autorisable est la poursuite de la préparation PRE-3 à partir de la PR documentaire #333, puis son entrée dans le parcours VNext. L’activation ne vaut ni approbation du plan PRE-3, ni lancement de son développement.
