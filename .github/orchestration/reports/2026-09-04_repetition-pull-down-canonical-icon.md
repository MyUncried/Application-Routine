# Canonicalisation de l’icône du pull-down de répétitions

Date : 2026-09-04  
Périmètre : Figma, DSF, documentation et actif SVG uniquement. Aucun code applicatif modifié.

## Décision canonique

- Contrôle : `Controls / Repetition Pull-down` (`2745:2`).
- Source graphique : `Icon / Control / Repetition Pull-down — Canonical` (`2745:4`).
- Actif : `assets/icons/control-repetition-pull-down.svg`.
- Registre : `control.repetitionPullDown`.
- Géométrie : boîte `28 × 28`, dessin utile `22,75 × 22,75`.
- Couleur : `color.selection` (`#5F60EE`).
- Contrôle complet : `66 × 34`, marges visuelles haute, droite et basse de `3 pt`.
- Consommateur attendu : contrôle Tour dans `src/features/sessions/CompositionScreen.tsx`, via `KodjoIcon name="control-repetition-pull-down"`.

## Modifications Figma

- `2745:4` renommé et défini comme source exportable SVG canonique.
- `2745:5` aligné sur `color.selection`.
- Les deux usages du composant Tour, `2537:1437` et `3067:253`, sont alignés sur la boîte `component/control/visual-box = 28 × 28`, le dessin `22,75 × 22,75` et `color.selection`.
- Les descriptions de `2745:2` et `3067:270` documentent la source, l’actif, les dimensions et l’interdiction de substitution.

## Contrôle des icônes similaires

Les familles suivantes ont été inspectées et ne doivent pas être modifiées :

- `Controls / Disclosure` (`2537:1039`) : chevrons de disclosure dans une cible `48 × 48` et un cadre `28 × 28` ; dessin plus petit intentionnel.
- `Chevron — Source exact` (`2928:4320`) : actifs génériques `control-chevron-down.svg` et `control-chevron-up.svg`, boîte `24 × 24`.
- `Forms / Select Field` (`2537:1095`) : indicateur compact `14 × 14`.

Ces contrôles n’ont pas la même fonction graphique que le pull-down de répétitions. Aucun agrandissement générique n’est autorisé.

## Vérifications

- Source et deux usages DSF : `28 × 28`.
- Dessins internes : `22,75 × 22,75`.
- Couleur des trois dessins : `color.selection` / `#5F60EE`.
- SVG exporté avec `viewBox="0 0 28 28"`.
- Manifest JSON valide et entrée unique.
- Recherche documentaire : aucune association restante entre le pull-down de répétitions et `control-chevron-down.svg` ou `icon.control = 14 × 14`.

## État

Figma, DSF, actif et documentation : **CONFORME**.  
Code applicatif : **NON CONFORME connu**, volontairement non modifié dans cette mission.
