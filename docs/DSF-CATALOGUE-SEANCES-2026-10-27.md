# Catalogue des séances — relevé Figma et intégration documentaire — 27/10/2026

Référence fonctionnelle : [spécification fournie par Hermann](KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md), versée sans modification. Fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page `510:101`. Douze écrans de la ligne Catalogue des séances et trois variantes Catalogue du set `DSF / Cards / Séance` lus et réexportés. Aucun changement Figma ou code effectué.

Ce relevé remplace les anciennes captures de ces douze écrans, notamment celles du contrôle navigation effectué plus tôt le même jour. Il ne constitue pas une nouvelle revue de toute la page ni une validation des 593 éléments élargis et 186 recalés signalés dans la source.

## Écrans et contrat

Tous les écrans ci-dessous relèvent de CE-T03-01 révisé au chapitre 13 ; la navigation à cinq destinations conserve CE-UI-05.

| Écran | Nœud | Copie courante |
|---|---|---|
| P-Catalogue des séances — Liste par défaut | [1992:9910](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-9910) | [PNG](Specifications-fonctionnelles/images/catalogue-seances-2026-10-27/1992-9910.png) |
| Catalogue des séances — Liste condensée — actions glissées — Dos et mobilité | [4592:6217](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4592-6217) | [PNG](Specifications-fonctionnelles/images/catalogue-seances-2026-10-27/4592-6217.png) |
| P-Modal — Confirmer l’archivage d’une séance planifiée | [4593:6285](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4593-6285) | [PNG](Specifications-fonctionnelles/images/catalogue-seances-2026-10-27/4593-6285.png) |
| Catalogue des séances — Liste condensée — actions glissées | [1992:10518](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10518) | [PNG](Specifications-fonctionnelles/images/catalogue-seances-2026-10-27/1992-10518.png) |
| Catalogue des séances — Liste sans Renforcement du genou | [1992:10937](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10937) | [PNG](Specifications-fonctionnelles/images/catalogue-seances-2026-10-27/1992-10937.png) |
| P-Catalogue des séances — Séance déployée | [1992:10014](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10014) | [PNG](Specifications-fonctionnelles/images/catalogue-seances-2026-10-27/1992-10014.png) |
| Catalogue des séances — Séance déployée — actions glissées | [1992:10628](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10628) | [PNG](Specifications-fonctionnelles/images/catalogue-seances-2026-10-27/1992-10628.png) |
| P-Catalogue des séances — Filtrer — Panneau ouvert | [4168:11149](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4168-11149) | [PNG](Specifications-fonctionnelles/images/catalogue-seances-2026-10-27/4168-11149.png) |
| Catalogue des séances — Filtre actif Archivé | [4549:6742](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4549-6742) | [PNG](Specifications-fonctionnelles/images/catalogue-seances-2026-10-27/4549-6742.png) |
| Catalogue des séances — Archivées — actions glissées | [2234:88](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2234-88) | [PNG](Specifications-fonctionnelles/images/catalogue-seances-2026-10-27/2234-88.png) |
| Modal — Confirmer la suppression d’une séance archivée | [2234:189](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2234-189) | [PNG](Specifications-fonctionnelles/images/catalogue-seances-2026-10-27/2234-189.png) |
| Catalogue des séances — Archivées — Séance restaurée | [1992:10848](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10848) | [PNG](Specifications-fonctionnelles/images/catalogue-seances-2026-10-27/1992-10848.png) |

## Composants et géométrie

| Composant | Nœud | Mesure observée | Capture |
|---|---|---|---|
| DSF / Cards / Séance — Contexte=Catalogue, État=Replié | `6214:3572` | 370 × 80 | [PNG](Specifications-fonctionnelles/images/catalogue-seances-2026-10-27/6214-3572.png) |
| DSF / Cards / Séance — Contexte=Catalogue, État=Archivé | `6214:3625` | 370 × 80 | [PNG](Specifications-fonctionnelles/images/catalogue-seances-2026-10-27/6214-3625.png) |
| DSF / Cards / Séance — Contexte=Catalogue, État=Déployé | `6214:3696` | 370 × 273 | [PNG](Specifications-fonctionnelles/images/catalogue-seances-2026-10-27/6214-3696.png) |

Set `6214:7276`. Le segmenté est une instance de `7954:14628`, « État=Trois options — 2 sélectionné », set `5548:9818`, largeur 370 et hauteur 42. La navigation est `6513:20152`, set `6513:20151`.

Au gabarit 402 : marges 16, carte 370, intervalle 12 ; photo 64, à 8 du bord ; texte à x=84 dans la carte repliée ; action de lecture avec cible 48 et retrait de 8 du bord. La hauteur déployée 273 est celle de l'exemple, jamais une constante métier ; elle dépend de la composition. Actions glissées : hauteur 80 indépendamment de la carte. Au rendu responsive, largeur utile = largeur disponible moins les marges, sans imposer 370 sur tous les appareils.

Les nouveaux rendus sont limités à `Contexte=Catalogue`. Les variantes Calendrier, Suivi et Choix doivent conserver leur présentation. Le set Exercice ne sert plus à construire un catalogue autonome ; ne pas le supprimer du code avant vérification de ses autres consommateurs historiques.

## Tokens relevés

Les bindings bruts et leurs alias sont conservés dans `figma-catalogue-seances-2026-10-27/composants.json`, `tokens.json` et `tokens-et-suppressions.json`. Les identifiants ci-dessous sont ceux réellement lus ; aucune nouvelle variable Figma n'est créée.

| Token | Identifiant | Valeur résolue |
|---|---|---|
| `component/cards/border-width` | `VariableID:6364:10591` | 0.5 |
| `color/surface-subtle` | `VariableID:2290:56` | #F9FAFC |
| `color/cards/border` | `VariableID:6364:10579` | #CCD1E0 |
| `color/blue/primary-0508E5` | `VariableID:2290:2` | #0508E5 |
| `spacing/4` | `VariableID:2290:69` | 4 |
| `spacing/observed-0` | `VariableID:5541:4580` | 0 |
| `dimension/48` | `VariableID:2290:37` | 48 |
| `radius/observed-0` | `VariableID:5541:4581` | 0 |
| `color/observed/14171c` | `VariableID:5541:4362` | #14171C |
| `color/observed/7a7a80` | `VariableID:5541:4364` | #7A7A80 |
| `color/text-primary` | `VariableID:2290:57` | #141414 |
| `color/observed/v2/3500000-3700000-4000000-10000000` | `VariableID:5833:4062` | #595E66 |
| `color/observed/80858c` | `VariableID:5541:4496` | #80858C |
| `color/surface` | `VariableID:2290:55` | #F5F7FA |
| `color/cards/archive-border` | `VariableID:6364:10582` | #D9D9D9 |
| `spacing/10` | `VariableID:6935:11533` | 10 |

Les dimensions 16/370/12/64/80 viennent de la spécification et des nœuds relevés, pas de nouveaux noms de tokens inventés. Réutiliser ou adapter les tokens du code avec une portée Catalogue ; la modification globale d'un token de marge ne doit pas modifier les autres contextes dans cette tranche.

## Écarts et compléments circonscrits

| Sujet | Constat | Consigne pour le développement |
|---|---|---|
| Confirmation de suppression `2234:189` | L'arrière-plan conserve deux segments Exercices/Séances et l'ancien bloc Supprimer seul ; les autres états d'archives portent trois segments et Restaurer/Supprimer | Appliquer les sections 4 et 5 de la spécification ; corriger cet arrière-plan Figma dans le travail de design, sans copier son état ancien. Le dialogue métier reste conservé |
| Vue archives avec filtre étendu | Les captures montrent un chevauchement visuel entre « Plusieurs » et le contrôle de filtre étendu | Conserver les options et les marges prescrites ; vérifier les boîtes/cibles réelles sur appareil, sans ajouter une troisième option Toutes ni une refonte non validée |
| Ouverture du panneau | L'exemple expose Étiquettes et Format déployés ; les données sont démonstratives | Appliquer la règle dynamique : sections à filtre actif ouvertes, autres fermées ; sans filtre, statut seul ouvert. Ne pas figer l'état de l'exemple |
| Vignettes de formats | Le motif de repli Libre est encore utilisé sur EMOM ; raccordement du jeu distinct annoncé restant dans la source | Ne pas certifier ce visuel comme vignette EMOM finale. Prévoir la résolution format → asset et une story de raccordement ; pas de dessin improvisé |
| État vide | `2117:86` subsiste hors de la ligne des douze états ; `4521:6220` est encore nommé Catalogue des exercices — État vide | Conserver la gestion du vide ; ces anciens écrans ne justifient pas de recréer le catalogue autonome des exercices. Leur mise à jour visuelle n'est pas déclarée faite |

Les six nœuds d'ancien catalogue d'exercices `3786:5093`, `4168:11262`, `4544:6344`, `4544:6651`, `4738:6209`, `4738:6355` et l'état de filtre inactif `4549:6382` sont absents lors de la lecture. Les suppressions « Modifier un exercice » et « Modification d'une séance » sont données par la source et les noms ne sont pas retrouvés dans l'inventaire ciblé ; aucun identifiant n'est inventé. Supprimer une maquette redondante ne supprime pas la capacité métier de modifier une séance.

## Vérification et limites

Les douze écrans ont été inspectés sur trois planches de quatre captures, avec contrôle de la carte, du détail structuré, des actions et du panneau. Les trois variantes ont été exportées avec leurs nœuds et tokens. Les PNG et leurs empreintes sont listés dans `captures.json`. Les copies précédentes restent des preuves datées ; les liens courants du chapitre 06 pointent vers cette série.

Les règles de sélection multiple des nouvelles catégories/zones (OU ou ET à l'intérieur d'une section, correspondance sur un même exercice ou sur l'ensemble de la séance) ne sont pas précisées par la pièce fournie. BMAD doit rechercher une règle existante réutilisable ; à défaut, isoler cette décision dans la story filtres, sans inventer un comportement validé ni bloquer les stories de carte et de liste.
