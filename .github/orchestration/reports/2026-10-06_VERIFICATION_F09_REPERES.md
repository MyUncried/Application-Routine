# Vérification F-09 — repères du chronomètre — 06/10/2026

Mission : vérifier les trois affirmations transmises par le propriétaire (appelées F04 dans son message, correspondant à F-09 de l’audit documentaire). Branche `docs/cadence-dsf-2026-10-06`, départ `d12c9619916c270e81b48be917b926ff8d916686`, PR [#323](https://github.com/MyUncried/Application-Routine/pull/323). Figma `G6RY5Ebhgwb4AHIOYDwwvg` inspecté en lecture seule ; aucun changement applicatif ni Figma, aucune qualification VNext/V2, aucune fusion ou synchronisation du PC.

## Résultat

| Affirmation | Contrôle | Conclusion |
|---|---|---|
| 171 repères principaux à 62 % | Recherche des repères quart, moitié, trois quarts sur les 11 pages : 69 Prototype MVP + 69 Communautaire + 9 Fondations + 15 Validation responsive + 9 Référence responsive ; aucune opacité de remplissage divergente | Confirmé |
| Pas de surcharge sur les 8 instances | `overrides=[]` pour 6452:10039/9958/10120/10201 et 6464:18896/18926/19023/19053 | Confirmé au relevé |
| Remplissage fixe du composant principal | Trois marques de chacun des 8 composants maîtres : couleur #BEC2CC, opacité 0,6200000048, `boundVariables={}` | Confirmé ; la liaison de variable en cause n’est plus présente |
| Rendu des 4 instances visibles | Export PNG direct à échelle 4 des 3 marques de chaque instance visible, soit 12 images : alpha intérieur maximal 158/255 ≈ 62 %, couleur RGB à ±1 de #BEC2CC (arrondi de rasterisation) | Confirmé par rendu des marques elles-mêmes |
| 4 instances masquées | Opacité des marques à 0 au niveau du nœud, remplissage 62 % ; aucun masquage modifié pour le contrôle | Confirmé par propriétés ; pas de contrôle visuel revendiqué pour ces marques masquées |

Les composants maîtres sont 6451:10930/10931/10932/10933 et 6464:20983/21064/21145/21226. Les 4 instances visibles contrôlées sont 6452:10039, 6452:9958, 6464:18896, 6464:19023.

## Preuves, portée et limites

[Données du contrôle et PNG bruts](2026-10-06_VERIFICATION_F09_REPERES.json) : résultats par page, propriétés des instances, surcharges, remplissages des maîtres, bytes des 12 PNG, valeurs RGBA et empreintes. Les recherches portent sur les repères principaux nommés quart/moitié/trois quarts ; le compte inclut maîtres et instances, pas 171 écrans ou 171 objets tous visibles.

La mesure du rendu utilise les exports directs des marques sur fond transparent. Les captures globales fournies par l’outil de capture ont montré des différences de contenu/visibilité avec la lecture courante ; elles ne sont pas utilisées comme preuve quantitative. L’export PNG direct des marques est cohérent avec leurs propriétés. Aucun des 136 PNG documentaires antérieurs n’est présenté comme renouvelé dans cette vérification.

La cause identifiée (surcharge locale et liaison d’une variable susceptible de perdre l’opacité) n’est plus présente dans les éléments contrôlés. Cela ne garantit pas qu’une modification future ne changera jamais ces propriétés. Les masters contiennent volontairement la valeur fixe #BEC2CC ; il ne faut pas réintroduire la liaison en annulant son alpha. La définition de `color/disabled` reste #BEC2CC dans le DSF, sans nouvelle règle métier.

## Enregistrement documentaire

La réserve F-09 est levée dans le DSF courant et dans la PR. Les rapports précédents et l’audit original de Claude restent conservés comme états datés. F-04 (fusions de tokens) reste distinct ; l’ancienne valeur non renseignée de cards/archive-surface n’a aucun rapport avec les repères contrôlés ici.

Fichiers : `docs/DSF-CADENCE-2026-10-06.md`, le présent rapport et son fichier JSON. Contrôles : assertions des 12 PNG, zéro anomalie sur les 171 opacités, 8 tableaux de surcharges vides, 24 remplissages maîtres fixes, liens du rapport et diff sans erreur. Aucun test applicatif ou sur appareil nécessaire pour ce contrôle de présentation Figma.

Publication sur la branche existante avec vérification de la tête attendue, PR maintenue en brouillon. Le commit contenant ce rapport est indiqué dans la PR et le bilan final, identifiable par `git log -1 -- .github/orchestration/reports/2026-10-06_VERIFICATION_F09_REPERES.md`. Avant publication : aucun run accessible sur cette branche. Prochaine action sur F-09 : aucune correction supplémentaire requise à l’état contrôlé ; renouvellement éventuel des captures d’écran distinct du présent contrôle.
