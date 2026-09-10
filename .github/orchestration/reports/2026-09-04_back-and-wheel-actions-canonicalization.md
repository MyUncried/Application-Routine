# Rapport — Canonicalisation Retour et actions de roulette

Date : 2026-09-04  
Périmètre : Figma/DSF, actifs SVG et documentation uniquement  
Figma : `G6RY5Ebhgwb4AHIOYDwwvg`

## Résultat

| Contrôle | Source Figma | Actif physique | Registre | Consommateur attendu | Dimensions | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| Action / Back | composant `2624:3105` | `assets/icons/control-back.svg` | `control.back` | `FixedHeader` + `KodjoIcon name="control-back"` | cible 48 × 48 ; cercle 28 × 28 ; cadre d’icône 24 × 24 | CONFORME côté DSF/documentation |
| Action / Wheel / Cancel | action `3089:73` ; icône source `3089:81` | `assets/icons/wheel-action-cancel.svg` | `wheel.action.cancel` | `PickerToolbar` + `KodjoIcon name="wheel-action-cancel"` | cible 48 × 48 ; cercle `3089:74` 28 × 28 ; cadre 24 × 24 | CONFORME côté DSF/actif/documentation |
| Action / Wheel / Validate | action `3089:76` ; icône source `3089:83` | `assets/icons/wheel-action-validate.svg` | `wheel.action.validate` | `PickerToolbar` + `KodjoIcon name="wheel-action-validate"` | cible 48 × 48 ; cercle `3089:77` 28 × 28 ; cadre 24 × 24 | CONFORME côté DSF/actif/documentation |

## Contrôles effectués

- inspection directe du DSF actuel, page `Design system — Fondations` ;
- confirmation du composant Retour : cible 48 × 48, cercle 28 × 28, cadre d’icône 24 × 24 ;
- recherche transversale des mentions documentaires du contrôle Retour ;
- aucune règle Retour 32 × 32 ne subsiste dans la documentation livrée ; les occurrences 32 × 32 restantes du chapitre 12 concernent exclusivement `icon.navigation` et `icon.status` ;
- export direct de `3089:81` et `3089:83` au format SVG 24 × 24 ;
- correspondance vérifiée entre les tracés Figma, les deux fichiers SVG et les entrées du manifeste ;
- descriptions canoniques complétées sur `Picker / Popover — Source exact` (`2537:1174`) et sa variante `Type=Duration` (`2537:1110`) ;
- interdiction explicite des caractères Unicode `✕` et `✓` comme sources graphiques.

## Points restant non vérifiables

Aucun point non vérifiable dans le périmètre Figma/DSF/documentation/actifs. La consommation effective par le code reste non conforme d’après la documentation existante, mais n’a pas été modifiée ni réauditée dans cette mission.

Statut : **CANONICAL_UI_CONTROLS_READY_FOR_LOCAL_SYNC**
