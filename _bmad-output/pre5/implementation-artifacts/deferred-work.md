# Travail différé — PRE-5

- source_spec: `_bmad-output/pre5/implementation-artifacts/spec-2-3-variante-inline-du-segmentedcontrol.md`
  summary: Cible tactile des options `inline` (26 de haut dans un cadre de 32, chevron environ 18 × 32 avec `hitSlop`), inférieure aux 44 exigés hors tableaux.
  evidence: Géométrie imposée par le relevé Figma `8328:38193` (lignes de 41) ; l'extension de la zone de toucher dépend de la ligne hôte (2.4, 2.5, 2.7, 2.8) et ne se vérifie que sur iPhone (NFR-5, recette du lot Feuille).
- source_spec: `_bmad-output/pre5/implementation-artifacts/spec-2-3-variante-inline-du-segmentedcontrol.md`
  summary: Comportement des segmentés `inline` avec texte agrandi (Dynamic Type) et sur écran étroit (largeur fixe 220 à 246, sans rétrécissement).
  evidence: Hauteurs et largeurs fixes du relevé Figma ; FR-17 prévoit une police réglée sur appareil ; à vérifier en recette du lot Feuille et à arbitrer si un débordement apparaît (mise en page des lignes en 2.4).
- source_spec: `_bmad-output/pre5/implementation-artifacts/spec-2-6-tableau-des-series-sans-steppers-de-cellule-lignes-de-36.md`
  summary: Avec la colonne Charge (2.7), les cellules rétrécissables (`flexShrink`) décalent le ± de la Pause d'une ligne, placé par un décalage fixe (`PAUSE_CELL_X`), et le tableau ne tient pas à 375 de large (321 nécessaires, environ 301 disponibles).
  evidence: Revue de 2.6 (E2) ; aucun rétrécissement en 2.6 (243 nécessaires) ; à régler avec la géométrie de la Charge en 2.7 (placer le ± depuis la cellule mesurée, ou réduire l'écart de 20 et les cellules) et à juger sur iPhone.
