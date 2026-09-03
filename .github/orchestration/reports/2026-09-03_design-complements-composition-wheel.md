# Compléments design — Composition d’une séance et roulette de durée

**Date :** 2026-09-03  
**Dépôt :** `MyUncried/Application-Routine`  
**Branche :** `feat/creation-seance-catalogue`  
**Issue :** #35  
**Périmètre :** Figma et Design System Foundation uniquement. Aucun code React Native/Expo, aucun lancement de Claude Code, aucun autre écran.

## Sources effectivement examinées

- Figma « Application Tabata – Wireframes V1 » : fichier `G6RY5Ebhgwb4AHIOYDwwvg`.
- Page Prototype MVP : `510:101`.
- Frame Composition : `2028:11137`.
- Page Design system — Fondations : `2291:2`.
- Collections : `KODJO / Primitives`, `KODJO / Sémantiques`, `KODJO / Responsive`.
- Issue #35 : corps et 26 commentaires, dont le registre cumulatif W/C/T/A/N et le gate REWORK04.
- Rapports relus : plan P0, phase02 Composition, consolidated rework02, rework03 cumulative.
- Branche vérifiée : `feat/creation-seance-catalogue`.
- Manifeste d’icônes rapporté à 19 entrées dans REWORK03 : aucune icône Tour existante avant cette mission.

## Décision iOS — position des actions

| Option | Avantages | Risques | Décision |
|---|---|---|---|
| Barre en haut | Actions visibles avant défilement ; modèle cohérent avec une toolbar associée à un picker iOS ; éloignée de l’indicateur d’accueil | Ajoute 48 pt avant la roulette | **RETENUE** |
| Barre en bas | Actions proches de la fin du geste | Proximité de la zone système basse ; peut être masquée par la main ; validation moins immédiatement repérable | Écartée |

## Tableau de conformité et corrections

| Élément | Référence Figma | Composant DSF | Token/valeur | État actuel avant mission | Lacune classée | Correction design |
|---|---|---|---|---|---|---|
| Roulette fermée | Composition `2028:11137` | `Composition / Duration Picker` `3067:4809` | 354×52 pt | Déclencheur existant, pas de composant complet | Existant insuffisamment spécifié | Variante `State=Closed` `3067:4744` ; valeur = dernière valeur validée |
| Roulette ouverte sans modification | Anciens pop-ups Prototype, pas de 5 | même set | panneau 354×244 ; toolbar 48 ; wheel 196 | Ancien pop-up non natif et incomplet | Manquait réellement | Variante `3067:4755`, 00 min 10 s, carte 10 s |
| Roulette ouverte avec brouillon | aucune référence complète | même set | secondes 00…59, pas 1 | Non défini | Manquait réellement | Variante `3067:4777`, brouillon 17 s, carte reste 10 s |
| Validation | aucune référence complète | même set | action 48×48, coche droite | Fermeture/commit non distingués | Manquait réellement | Variante post-validation `3067:4799`, carte 17 s ; commit puis fermeture |
| Annulation | aucune référence complète | même set | action 48×48, croix gauche | Non défini | Manquait réellement | Variante post-annulation `3067:4804`, carte reste 10 s |
| Zone sélection roulette | mini-design `3067:4809` | sous-couche native | cadre gris iOS unique 306×36, rayon 8 | Deux cadres signalés | Existant non appliqué correctement | Aucun cadre bleu ; un seul cadre gris natif |
| Colonnes et unités | mini-design `3067:4809` | anatomie du picker | min numériques 76 ; unité min 32 ; intervalle 22 ; secondes 76 ; unité s 20 ; gap chiffre/unité 4 | Largeurs non contractuelles | Insuffisamment spécifié | Colonnes contraintes ; unités Bold 14/18, alignées sur la sélection |
| Conteneur roulette | mini-design `3067:4809` | picker panel | padding horizontal 12 ; rayon 12 ; bordure 1 #E0E3E8 ; ombre y4/blur12/14% | Non défini | Manquait réellement | Spécification complète ajoutée |
| Retour | DSF `2624:3105` ; Composition `2028:11137` | `Action / Back` | cible 48 ; cercle 28 ; chevron 14 | cible 48, cercle 32, chevron 24 | Existant insuffisamment spécifié | Composant maître corrigé ; même boîte visuelle que pull-up |
| Nom de la séance | `2028:11153` | couleur sémantique | `color/text-primary` = #141414 | gris secondaire | Existant non appliqué | Texte passé au principal |
| Titre cartes | DSF `2537:1475` | `KODJO / Card / Title` | Inter Semi Bold 14/18, #141414 | Semi Bold 13 sans style DSF | Insuffisamment spécifié | Style partagé créé et appliqué |
| Sous-libellé cartes | DSF `2537:1475` | `KODJO / Card / Supporting` | Inter Regular 11/14, texte secondaire | 11 sans style DSF | Insuffisamment spécifié | Style partagé créé et appliqué |
| Slot structure | DSF `2537:1475` | propriété `Structure icon` | slot 28×28 ; icône 20×20 | slot 16 ; dessin 6×5 | Existant insuffisamment spécifié | Slot agrandi et instance-swap ajoutée |
| Icône carte mobile | DSF `3066:4676` | `Icon / Structure / Movable` | SVG 20×20 | petit pictogramme embarqué | Existant insuffisant | Asset maître créé |
| Icône carte fixe | DSF `3066:4680` | `Icon / Structure / Fixed` | SVG 20×20 | inexistante | Manquait réellement | Asset maître créé pour remplacement futur sans changer la carte |
| Nombre de tours | DSF `3067:270` | `Composition / Tour Section` | largeur conteneur 374 ; cartes 354 ; inset 10/côté ; h fermé 54 | composant 374, libellé Tour, valeur x3/x1, pas de variantes | Existant insuffisamment spécifié | Libellé exact, valeur sans ×, variantes fermé/déployé |
| Contrôle tours | DSF `3067:270` | contrôle partagé du Tour | 28×28 violet #5F60EE, chevron blanc | contrôle pâle/local | Existant non appliqué correctement | Contrôle corrigé dans le maître |
| Icône Tour | DSF `3066:4685` | `Icon / Tour` | SVG 20×20 ; trait 1,8 ; couleur neutre | absente du manifeste et de Figma | Manquait réellement | Asset maître créé ; export demandé `icon-tour.svg`, 20×20 |
| Règle conteneur/cartes | DSF `3067:270` | tokens composition | `container-width=374`, `card-width=354`, `container-inset=10` | même largeur utilisée côté application | Nouvelle décision de design | Différence explicite de 20 pt, soit 10 pt par côté |

## Tokens et styles ajoutés

- Primitives : `dimension/14`, `52`, `196`, `244`, `354`, `374`.
- Sémantiques : `component/control/visual-box`, `component/control/icon`, `component/control/touch-target`, `component/card/structure-slot`, `component/card/structure-icon`, `component/card/height`, `component/composition/card-width`, `component/composition/container-width`, `component/composition/container-inset`, `component/duration-picker/height`, `component/duration-picker/wheel-height`.
- Text styles : `KODJO / Card / Title`, `KODJO / Card / Supporting`, `KODJO / Picker / Value`, `KODJO / Picker / Unit`, `KODJO / Picker / Action`.

## Comportement contractuel du picker

1. Le tap sur un chiffre ou la zone sélectionnée positionne la valeur mais ne ferme jamais.
2. Le scroll modifie uniquement `draftMinutes` et `draftSeconds`.
3. La carte conserve la dernière valeur validée pendant tout le brouillon.
4. Annuler ferme et détruit le brouillon sans modifier la valeur validée.
5. Valider enregistre exactement les valeurs centrées, met ensuite la carte à jour, puis ferme.
6. Compte à rebours initial et Fin de séance ont deux valeurs validées et deux brouillons indépendants.
7. La réouverture initialise le brouillon avec la dernière valeur validée du sélecteur concerné.
8. Les secondes couvrent 00 à 59 inclus, par pas de 1.

## Avant / après

| Axe | Avant | Après |
|---|---|---|
| Roulette | pop-up par pas de 5, anatomie incomplète, fermeture au tap | roue minutes + secondes 00–59, brouillon local, croix/coche, cinq états |
| Retour | cible 48, cercle 32, chevron 24 | cible 48, cercle 28, chevron 14 |
| Cartes | titre 13, icône structure 16 avec dessin minuscule | titre 14/18 Semi Bold, slot 28, icône 20 remplaçable |
| Tours | « Tour », valeur avec ×, icône absente, états non formalisés | « Nombre de tours », valeur seule, icône Tour, fermé/déployé |
| Largeurs | conteneur Tour assimilé aux cartes | conteneur 374, cartes 354, inset 10 par côté |
| Nom | gris secondaire | texte principal #141414 |

## Liens Figma exacts

- [Composition d’une séance — frame 2028:11137](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Tabata-%E2%80%93-Wireframes-V1?node-id=2028-11137)
- [Design System Foundation — page 2291:2](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Tabata-%E2%80%93-Wireframes-V1?node-id=2291-2)
- [Duration Picker — set 3067:4809](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Tabata-%E2%80%93-Wireframes-V1?node-id=3067-4809)
- [Tour Section — set 3067:270](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Tabata-%E2%80%93-Wireframes-V1?node-id=3067-270)
- [Boundary Activity — set 2537:1475](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Tabata-%E2%80%93-Wireframes-V1?node-id=2537-1475)
- [Action Back — component 2624:3105](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Tabata-%E2%80%93-Wireframes-V1?node-id=2624-3105)
- [Icon Tour — component 3066:4685](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg/Application-Tabata-%E2%80%93-Wireframes-V1?node-id=3066-4685)

## Contrôles après modification

- Métadonnées : 5 variantes Duration Picker présentes avec dimensions attendues.
- Métadonnées : Action Back = 48×48, cercle = 28×28, chevron = 14×14.
- Métadonnées : Boundary Activity = 2 variantes, 354×52.
- Métadonnées : Tour Section = 2 variantes, 374×54 et 374×175.
- Contrôle visuel Figma : roulette complète et lisible ; un seul cadre gris ; unités rapprochées et en gras ; actions visibles.
- Contrôle visuel Composition : Retour réduit ; nom noir ; titres renforcés ; structure agrandie ; icône Tour visible ; libellé entier ; contrôle violet.
- Anciennes formulations recherchées : pas de 5, double cadre, fermeture au tap, cercle 32/chevron 24, titre 13, `Tour`, valeur `×1`.
- Résultat : elles subsistent uniquement dans les rapports historiques et anciennes frames de sauvegarde, qui ne sont pas des sources actives et n’ont pas été réécrites conformément à la règle de modification minimale.

## Éléments ouverts

Aucune décision visuelle nécessaire à cette tranche ne reste ouverte. L’export physique de `icon-tour.svg` vers le dépôt et l’implémentation applicative restent à réaliser par une intervention ultérieure explicitement autorisée ; ils ne sont pas autorisés par cette mission.

## Statut

`DESIGN_COMPLEMENTS_READY_FOR_IMPLEMENTATION_REVIEW`
