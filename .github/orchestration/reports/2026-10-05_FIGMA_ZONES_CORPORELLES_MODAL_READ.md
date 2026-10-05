# 2026-10-05 — FIGMA_ZONES_CORPORELLES_MODAL_READ

## Identifiant et objectif

- Mission : `FIGMA_ZONES_CORPORELLES_MODAL_READ` — lecture seule Figma.
- Objectif : récupérer le contexte de conception et la capture de la frame « Ajouter un exercice — Zones corporelles » et décrire les propriétés exactes de la modale, de son en-tête, de ses boutons et des options de zones.

## Départ

- Branche : `main`
- Commit de départ : `a5d7f355c7bb42a6157b12724c1ef1cfca4abb26`
- Arbre de travail au départ : 13 fichiers `docs/Specifications-fonctionnelles/*.md` déjà modifiés (non liés à la mission, non touchés, non committés).

## Périmètre

- Demandé : frame Figma (lien non fourni dans la demande — placeholder `[coller le lien …]`), lecture seule, aucune modification Figma ni code.
- Traité : lien résolu depuis le dépôt (`docs/ETAT-DES-LIEUX-CREATION-EXERCICE-2026-10-03.md:36`) : fichier `G6RY5Ebhgwb4AHIOYDwwvg`, nœud `4478:7209` « Ajouter un exercice — Zones corporelles ». Outils : `get_design_context` (avec capture), `get_variable_defs`, téléchargement en lecture des SVG d’actions d’en-tête.

## Constats

Frame : 402 × 874, fond blanc.

### Voile
- `4953:6605` « Voile modal — Zones corporelles » : 402 × 874 en (0,0), couleur `color/overlay-scrim` = `#14171F`. **Opacité du calque non exportée** (voir hypothèses).

### Modale `4953:6606` « Modale — Zones corporelles de l’exercice »
- 402 × 254, x=0, y=620 (ancrée en bas, 620+254=874), fond `#FFFFFF`, rayons haut-gauche/haut-droit 24, bas 0, `overflow: clip`, aucune bordure ni ombre exportée.
- Poignée `4953:6607` : 50 × 4, x=176, y=8, `#C7C9D1`, rayon 2 (centrée : 176+25=201).

### En-tête `4953:6608` « En-tête modal — Classification de la séance »
- 378 × 60, x=12, y=0 (marges latérales 12), fond blanc, clip.
- Titre `4953:6611` « Zones corporelles » : Inter Semi Bold 600, 18 px, interligne normal, `--color-text-primary` `#141414`, centré ; boîte 232 × 22, centre x=189 (centre de l’en-tête), y=19.
- Séparateur `4953:6612` : 378 × 1, y=59, `--color-border` `#E0E3E8`.
- Composant source : « Modal / Header Action — Source exact » (`4151:6197`) — hit target 48, barre 53, boîte visuelle 38 (`component/wheel/action-*`).

### Boutons d’en-tête
- Annuler `5331:4821` : boîte 48 × 53, x=0, y=3. SVG 58 × 58 : disque r=19 (Ø38) `#FCFCFE`, contour intérieur 1 px blanc (r=18.5), croix 12 × 12 (`M23 21L35 33M35 21L23 33`) trait `#141414` 2.2 px, extrémités/joints arrondis ; ombre portée y=+2, flou σ=5 (≈ blur 10), couleur rgba(26,26,38,0.08).
- Valider `4953:6610` : boîte 48 × 53, x=330, y=3 (bord droit à 378). SVG 58 × 58 : disque Ø38 `#0508E5` (`--color-wheel-action-confirm-background`), contour intérieur 1 px blanc, coche `M22 27.5L26.2 31.7L36 21.9` trait blanc 2.4 px arrondi ; ombre y=+2, σ=5, rgba(26,26,38,0.18).
- Icône 24 (`--component-wheel-action-icon`).

### Contenu `4953:6613` « Contenu modal — Classification — Zone défilable »
- 378 × 194, x=12, y=60, clip. Positionnement absolu (pas d’auto-layout exporté sur le conteneur).
- Option (« Selection / Category Tag », `3302:4166`) : cible tactile hauteur 48, pilule 30 de haut, rayon 15, bordure 1 px, libellé Inter Regular 12 / interligne 15, centré, largeur adaptée au libellé.
  - Non sélectionnée : fond `--color-surface-subtle` `#F9FAFC`, bordure `--color-border` `#E0E3E8`, texte `#141414`.
  - Sélectionnée : fond `--color-selection-surface` `#E5F0FF`, bordure `#8283F2`, texte `--color-selection` `#5F60EE`.
- Positions (x, y de la cible 48, largeur) :
  - Ligne 1 (y=7) : Cou (12, 47) · Épaules (67, 69) · Bras (144, 50) · Poignets et mains (202, 125).
  - Ligne 2 (y=45) : Dos (12, 47) · Hanches et bassin (67, 129) · **Cuisses** sélectionnée (204, 69) · **Fessier** sélectionnée (281, 65).
  - Ligne 3 (y=83) : Genoux (12, 68) · Jambes (88, 69) · Chevilles et pieds (165, 125 ; pilule fixe 120).
  - Écart horizontal entre cibles ≈ 8 (irrégulier : 8 ou 10) ; pas vertical des cibles 38 → écart visuel entre pilules 8.
- Bouton « Créer une zone corporelle » `4953:6624` : 200 × 32, x=89, y=138 (centré : 89+100=189), fond blanc, bordure 1 px `#8283F2`, rayon 15, padding 3/8, gap 4 ; icône plus 16 × 16 (vecteur `#0508E5`, trait 2, arrondi) ; libellé Inter Regular 12, `--color-primary` `#0508E5`.

## Preuves et tests

- Capture Figma récupérée via `get_design_context` (rendu 402 × 874).
- Variables : `get_variable_defs` sur `4478:7209`.
- SVG lus : `2e0a0.svg` (Annuler), `9a4ac.svg` (Valider), `4830e.svg` (plus).
- Aucun test applicable (mission de lecture seule).

## Hypothèses non démontrées / propriétés non récupérées

- **Opacité du voile** : la capture le montre translucide mais l’export donne un fond plein ; l’opacité du calque n’est pas exposée. Estimation par pixel impossible (Python absent).
- Incohérences de nommage Figma : couches nommées d’après les catégories (« Renforcement », « Cardio », « Fessier ») alors que les libellés sont des zones ; nœud `4953:6625` nommé « Jambes » mais affiche « Fessier » ; `4953:6621` nommé « Genoux — sélectionnée » mais rendu non sélectionné. Le rendu fait foi.
- Pas d’auto-layout exporté pour la grille des options : règle de retour à la ligne et espacement canonique non déterminables.
- Ombre de la modale, état pressé/désactivé des boutons, poids visuel de l’ombre en pt RN : non exportés.
- Polices : nom Figma `Inter:Semi_Bold` / `Inter:Regular` ; correspondance avec les polices embarquées de l’app non vérifiée.

## Modifications réalisées

- Aucune modification Figma ni applicative. Seul ce rapport est ajouté.

## Hors périmètre / non corrigé

- Comparaison avec l’implémentation existante non demandée.
- Les 13 fichiers `docs/Specifications-fonctionnelles` modifiés avant la mission sont laissés tels quels.

## Vérifications restant à faire sur appareil réel

- Aucune pour cette lecture ; l’opacité du voile est à confirmer directement dans Figma.

## Fichiers modifiés

- `.github/orchestration/reports/2026-10-05_FIGMA_ZONES_CORPORELLES_MODAL_READ.md` (création)

## Commit final et état Git

- Voir la réponse de clôture (hash du commit contenant ce rapport ; arbre avec les 13 modifications préexistantes non committées).
