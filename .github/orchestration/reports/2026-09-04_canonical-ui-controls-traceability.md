# Rapport — Spécification canonique des contrôles UI KODJO

Date : 2026-09-04  
Branche : `feat/creation-seance-catalogue`  
Base auditée : `25e55f71cb02140fec9d6b1735f0b0ca75008d83`  
Figma : `G6RY5Ebhgwb4AHIOYDwwvg`  
Pages contrôlées : `Design system — Fondations` (`2291:2`) et `Prototype MVP` (`510:101`)

## Périmètre

Mission limitée au DSF/Figma, aux actifs de design versionnés et à la documentation. Aucun fichier React Native/Expo n’a été modifié.

## Corrections Figma

- `Icon / Structure / Movable` (`3066:4676`) : 20×20, slot contractuel 28×28, opacité 50 %, liaison `color/icon-neutral`, export `composition-reorder.svg`.
- `Icon / Structure / Fixed` (`3066:4680`) : 20×20, slot contractuel 28×28, opacité 50 %, liaison `color/icon-neutral`, nouvel export `composition-fixed.svg`.
- `Icon / Tour` (`3066:4685`) : 20×20, liaison `color/icon-neutral`, chemin et correspondance code documentés.
- `Action / Back` (`2624:3105`) : source canonique confirmée à 48/28/24 ; descriptions de `Header / Fixed` (`2581:2740`) et `Modal / Header` (`2591:3699`) corrigées.
- `Picker / Popover` (`2537:1174`), `Type=Duration` (`2537:1110`) : primitive native OS explicitée, secondes 00–59 pas 1, unités Semi Bold, barre haute 40, contenu natif min.150, hauteur de référence 190.
- actions roulette : frames `3089:73`/`3089:76`, icônes exportables `3089:81`/`3089:83`.
- `Controls / Repetition Pull-down` (`2745:2`) : rationalisé à 66×34, affordance 28×28 avec marges 3.

## Actifs ajoutés

- `assets/icons/composition-fixed.svg`
- `assets/icons/wheel-action-cancel.svg`
- `assets/icons/wheel-action-validate.svg`
- entrées correspondantes dans `assets/icons/manifest.json`

## Contradictions supprimées

- cercle Retour 32×32 supprimé de la spécification : valeur canonique 28×28 ;
- règle `icon.compact=16×16` supprimée pour la poignée Structure ;
- roulette 330×150 remplacée par surface de référence 330×190, dont contenu natif d’au moins 150 ;
- secondes par pas de 5 remplacées par 00–59, pas 1 ;
- fermeture par toucher extérieur/déclencheur supprimée : seules Annuler et Valider ferment ;
- mise à jour immédiate de la carte/récapitulatif supprimée : brouillon local jusqu’à validation.

## Tableau complet de traçabilité et statut

| Contrôle canonique | Node DSF | Variante | Frame source | Actif ou primitive native | Chemin dépôt | Composant code | Dimensions/tokens | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Navigation / Bottom | `2537:214` | `Active=Sessions/Calendar/History/Profile/Search` | `1992:9910`, `1992:5101`, `1992:8843`, `1992:375` | SVG KODJO | `assets/icons/navigation-*.svg` | `app/(tabs)/_layout.tsx`, `KodjoIcon` | région 402×77 ; barre 66 ; `icon.navigation` | CONFORME |
| Shell / Screen | `2718:69` | `Context=On/Off,Bottom=Navigation/Action` | — | Primitive RN | — | `ScreenShell` dans `src/shared/ui/ScreenShell.tsx` | 402×874 de référence ; responsive | CONFORME |
| Shell / Modal Fullscreen | `2700:75` | unique | frames Planification `1992:6838` et suivantes | Primitive RN / Modal OS | — | À créer lors de la tranche Planification | 378×822 ; header 60 ; action 70 | PARTIELLEMENT CONFORME |
| Shell / Execution | `2700:94` | `Mode=Run/Summary` | `1992:8150` et Synthèse | Primitive RN | — | À créer lors de la tranche Exécution | 402×874 | PARTIELLEMENT CONFORME |
| Header / Fixed | `2581:2740` | `Mode=Standard/Execution,Back=On/Off` | Composition et Exécution du Prototype | Primitive RN + Action / Back | `assets/icons/control-back.svg` | `FixedHeader` dans `src/shared/ui/ScreenShell.tsx` | hauteur 92 ; Retour 48/28/24 | NON CONFORME — le code affiche encore le chevron à 14×14 |
| Action / Back | `2624:3105` | unique | instances `2624:3109`, `2624:3113`, `2624:3117` | SVG KODJO | `assets/icons/control-back.svg` | `FixedHeader` + `KodjoIcon name="control-back"` | cible 48×48 ; cercle 28×28 ; icône 24×24 ; `color.selectionSurface`, `color.textPrimary` | NON CONFORME — source canonique corrigée, consommation code 14×14 |
| Modal / Header | `2591:3699` | unique | modales Planification | Primitive RN + Action / Back | `assets/icons/control-back.svg` | À créer lors de la tranche Planification | 378×60 ; Retour 48/28/24 | PARTIELLEMENT CONFORME |
| Modal / Bottom Action | `2665:115` | libellé d’instance | `2090:86`, instance `2668:3293` | Primitive RN | — | À créer lors de la tranche Planification | 378×70 ; bouton 354×48 | PARTIELLEMENT CONFORME |
| Button / Primary | `2537:1046` | `State=Active/Disabled` | `1992:811`, `2028:11201` | Primitive RN | — | usages locaux Composition/Exercice ; composant partagé à consolider | 354×48 ; rayon 24 ; `type.button` | PARTIELLEMENT CONFORME |
| Controls / Switch | `2537:833` | `State=On/Off` | `1992:400`, `1992:410` | Switch natif OS quand compatible, sinon primitive RN accessible | — | À créer lors de la tranche Profil | 46×28 ; cible 48×48 | PARTIELLEMENT CONFORME |
| Controls / Disclosure | `2537:1039` | `State=Collapsed/Expanded` | `1992:5165`, `1992:6453` | SVG KODJO chevrons | `assets/icons/control-chevron-down.svg`, `control-chevron-up.svg` | `KodjoIcon` ; usages dans `SessionCard.tsx` | cible 48×48 ; icône 24×24 | CONFORME |
| Chevron | `2928:4320` | Haut/Bas/Droite/Gauche | — | SVG KODJO pour Haut/Bas ; Droite/Gauche à exporter avant usage | `assets/icons/control-chevron-up.svg`, `control-chevron-down.svg` | `KodjoIcon` | boîte 24×24 | PARTIELLEMENT CONFORME |
| Controls / Segmented | `2586:2759` | Items 2/3 ; Selected 1/2/3 | `1992:8869` et écrans Activité | Primitive RN | — | implémentation locale dans `ExerciseScreen.tsx` | 354×42 ; segments `flex:1` ; rayon 10 | PARTIELLEMENT CONFORME |
| Forms / Text Field | `2537:1075` | Single line/Multiline | `1992:9157`, `1992:9310` | `TextInput` natif React Native | — | `ExerciseScreen.tsx` | 354×46 / 354×92 ; rayon 8 | CONFORME |
| Forms / Select Field | `2537:1095` | Full/Compact/Compact narrow | `1992:9172`, `1992:9186` | Primitive RN + chevron SVG | `assets/icons/control-chevron-down.svg` | `ExerciseScreen.tsx` | hauteur 42 ; rayon 10 | CONFORME |
| Picker / Duration | `2537:1110` dans `2537:1174` | `Type=Duration` | `2028:11375`, `2028:11457`, `1992:9430` | Picker wheel natif OS obligatoire lorsqu’il existe | — | `DurationWheelPicker.tsx` | largeur hôte 330 ; hauteur de référence 190 = barre 40 + contenu natif min.150 ; secondes 00–59, pas 1 | PARTIELLEMENT CONFORME — fallback non natif conservé |
| Picker / Time | `2884:4415` dans `2537:1174` | `Type=Time` | `1992:7006` | Picker heure natif OS | — | À créer lors de la tranche Planification | largeur env.310 ; même barre d’actions | PARTIELLEMENT CONFORME |
| Picker / Numeric menu | `2537:1122` dans `2537:1174` | `Type=Numeric menu` | `1992:9698` | Primitive RN accessible | — | `NumberWheelPicker.tsx` pour la roulette 1–99 ; menu contextuel à confirmer par contrat | 96×160 dans le DSF | PARTIELLEMENT CONFORME |
| Picker / Date | `2537:1173` dans `2537:1174` | `Type=Date` | `1992:6770` | Date picker natif OS lorsque pertinent | — | À créer lors de la tranche Planification | env.310×310 ; rayon 16 | PARTIELLEMENT CONFORME |
| Wheel / Cancel | `3089:73`, icône `3089:81` | action gauche | Picker Duration/Time | SVG KODJO | `assets/icons/wheel-action-cancel.svg` | `PickerToolbar` dans `DurationWheelPicker.tsx` | cible 48 ; cercle 28 ; icône 24 ; tokens `component.wheel.*`, `color.wheelActionCancel*` | NON CONFORME — code actuel utilise le caractère ✕ |
| Wheel / Validate | `3089:76`, icône `3089:83` | action droite | Picker Duration/Time | SVG KODJO | `assets/icons/wheel-action-validate.svg` | `PickerToolbar` dans `DurationWheelPicker.tsx` | cible 48 ; cercle 28 ; icône 24 ; tokens `component.wheel.*`, `color.wheelActionValidate*` | NON CONFORME — code actuel utilise le caractère ✓ |
| Overlay / Confirmation Sheet | `2590:2961` | tons Primary/Danger ; 2/3 actions | écrans de confirmation du Prototype | `Modal` natif + primitives RN | — | `AbandonCreationModal.tsx`, `ExerciseExitConfirmModal.tsx` | largeur 402 ; hauteur selon variante | PARTIELLEMENT CONFORME |
| Catalogue / Session Card | `2537:1400` | `State=Collapsed/Expanded` | `1992:9910` et états Catalogue | Primitive RN + SVG KODJO | `assets/icons/action-start.svg`, `control-chevron-*.svg` | `SessionCard.tsx` | largeur utile 354 ; hauteur 108/244 | CONFORME |
| Calendar / Scheduled Session Card | `2537:1297` | `State=Collapsed/Expanded` | `1992:5159`, `1992:6447` | Primitive RN + SVG KODJO | manifeste `assets/icons/manifest.json` | À créer lors de la tranche Calendrier | 354×92 / 354×226 | PARTIELLEMENT CONFORME |
| Tracking / Execution Card | `2537:1350` | `State=Collapsed/Expanded` | `1992:8885`, `1992:9031` | Primitive RN + SVG KODJO | manifeste `assets/icons/manifest.json` | À créer lors de la tranche Suivi | 354×82 / 354×294 | PARTIELLEMENT CONFORME |
| Composition / Activity Row | `2588:2679` | contenu d’instance | `2028:11700` | Primitive RN + Icon / Structure | `assets/icons/composition-reorder.svg` ou `composition-fixed.svg` | rangée locale dans `CompositionScreen.tsx` | 354×52 ; slot 28 ; icône 20 | PARTIELLEMENT CONFORME |
| Composition / Tour Section | `3067:270` | `State=Collapsed/Expanded` | `2028:11700`, `2028:11580` | Primitive RN + Icon / Tour | `assets/icons/icon-tour.svg` | `TourCard` dans `CompositionScreen.tsx` | 374×54/175 ; carte 354 ; contrôle 66×34 | PARTIELLEMENT CONFORME — le code ne porte pas encore toute la variante déployée |
| Composition / Boundary Activity | `2537:1475` | Initial countdown/End session | `2028:11724`, `2028:11780` | SVG KODJO | `assets/icons/composition-initial-countdown.svg`, `composition-end-session.svg`, structure | `BoundaryActivityRow` dans `CompositionScreen.tsx` | 354×52 ; slot 28 ; icône structure 20 | CONFORME |
| Activity / Parameter Row | `2537:1567` | Duration/Repetitions/Recovery | `1992:9169`, `1992:9249`, `1992:9394` | Primitives RN + pickers | — | `ExerciseScreen.tsx` | 338×66 | PARTIELLEMENT CONFORME |
| Controls / Repetition Pull-down | `2745:2` | valeur contextuelle | `3067:270` | Primitive RN + chevron SVG | `assets/icons/control-chevron-down.svg` | contrôle Tour dans `CompositionScreen.tsx` | 66×34 ; carré 28 ; marges 3 | CONFORME |
| Search / Global Active | `2537:1494` | actif | `1992:10215` | `TextInput` natif + SVG recherche | `assets/icons/navigation-search.svg` | route Recherche à créer | 300×50 | PARTIELLEMENT CONFORME |
| Overlay / Color Popover | `2537:1511` | couleur sélectionnée | `2028:11988` | Primitive RN + SVG sélection | `assets/icons/state-selected.svg` | `ColorPalette.tsx` | 174×132 ; 12 couleurs | CONFORME |
| Session / Name Field | `2537:1480` | unique | `2028:11715` | `TextInput` natif | — | `CompositionScreen.tsx` | 354×42 | CONFORME |
| Action / Add Activity | `2537:1484` | unique | `2028:11720` | SVG KODJO | `assets/icons/action-add.svg` | `CompositionScreen.tsx` | 174×32 dans cible ≥48 | CONFORME |
| Planning / Reminder Group | `2665:114` | 15 min/Personnalisé/Valeur personnalisée | écrans Planification `1992:6838` et suivants | Primitive RN | — | À créer lors de la tranche Planification | 354×42 | PARTIELLEMENT CONFORME |
| Planning / Reminder Option | `2627:23` | Default/Selected | écrans Planification | Primitive RN | — | À créer lors de la tranche Planification | hauteur 34 ; padding 6 | PARTIELLEMENT CONFORME |
| Icon / Structure / Movable | `3066:4676` | movable | cartes Composition | SVG KODJO | `assets/icons/composition-reorder.svg` | `KodjoIcon name="composition-reorder"` | dessin 20×20 ; slot 28×28 ; opacité 50 % ; `color.iconNeutral` | CONFORME |
| Icon / Structure / Fixed | `3066:4680` | fixed | cartes structurelles non déplaçables | SVG KODJO | `assets/icons/composition-fixed.svg` | `KodjoIcon name="composition-fixed"` attendu | dessin 20×20 ; slot 28×28 ; opacité 50 % ; `color.iconNeutral` | PARTIELLEMENT CONFORME — actif ajouté, mapping code futur |
| Icon / Tour | `3066:4685` | unique | `3067:270` | SVG KODJO | `assets/icons/icon-tour.svg` | `KodjoIcon name="icon-tour"` | 20×20 ; trait 1,8 ; `color.iconNeutral` | CONFORME |

## Écarts applicatifs constatés, non corrigés

- `KodjoIcon.tsx` fixe actuellement `control-back` à 14×14 alors que la source canonique est 24×24.
- `DurationWheelPicker.tsx` emploie encore les caractères typographiques `✕` et `✓` au lieu des actifs vectoriels désormais canoniques.
- `Icon / Structure / Fixed` possède désormais son actif, mais son mapping `KodjoIcon name="composition-fixed"` n’existe pas encore.
- le fallback non natif de la roulette demeure dans le code ; la primitive native OS reste la source prioritaire.

## Seconde passe indépendante

Chaque ligne a été recontrôlée selon quatre maillons : node DSF, variante/frame de production, actif ou primitive, chemin/composant code. Aucun contrôle n’est déclaré vérifiable par son seul nom. Aucun statut `NON VÉRIFIABLE` ou `À CLARIFIER` ne subsiste dans le registre ; les lacunes réelles sont conservées comme `PARTIELLEMENT CONFORME` ou `NON CONFORME`.

## Fichiers prévus dans le commit

- `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md`
- `docs/Specifications-fonctionnelles/12 – Architecture technique.md`
- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`
- `assets/icons/manifest.json`
- les trois actifs SVG listés ci-dessus
- le présent rapport

## État attendu après cette mission

Spécification canonique prête pour revue d’implémentation. Aucune autorisation de modification du code applicatif n’est incluse dans ce rapport.
