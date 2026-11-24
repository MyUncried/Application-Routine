# Claude Code — carte de séance du catalogue : mosaïque et informations (24/11/2026)

Mission : appliquer D-564 et D-565 (registre, ch07 ; `docs/DSF-CARTE-SEANCE-VISUEL-INFOS-2026-11-24.md`, branche `docs/planification-grille-creneaux`, à lire sans la fusionner) à la carte **repliée** du catalogue des séances. Figma : planche « Visuel de séance — essais de mosaïque (1 à 6 images) » et écran « P-Catalogue des séances — Visuel en mosaïque et informations (essai) ».

1. Visuel : remplace la cascade actuelle par une mosaïque carrée de 64 pt (coins 8, écart 2 pt). Images = mouvements distincts de la séance, dans l'ordre de la composition, sans image ignorés. Disposition selon le nombre d'images : 1 pleine ; 2 deux colonnes ; 3 une colonne à gauche et deux carrés à droite ; 4 en 2 × 2 ; 5 et plus en 2 × 2 avec la quatrième case « +N » (N = nombre d'images − 3). La disposition ne dépend jamais de la forme des photos.
2. Cadrage : chaque image remplit sa case sans déformation, centrée sur son point focal (x, y de 0 à 100 %) s'il existe, sinon sur le centre. Ajoute le point focal comme donnée optionnelle de l'image du catalogue ; ne calcule rien à l'affichage. Photos utilisateur : centre.
3. Aucune image : fin de l'ancienne cascade (vignette du format de la séance, sinon format Libre). Le toucher du visuel garde son comportement.
4. Informations : ligne 1 nom + durée (règles actuelles) ; ligne 2 noms des mouvements distincts, séparés par des virgules, « +N » pour ce qui ne tient pas ; ligne 3 noms des formats, absente sans format, pictogramme haltère. Retire de la carte repliée : catégories, nombre d'exercices, nombre de circuits, volume d'une séance à un seul exercice. Hauteur 72 pt inchangée.
5. Hors périmètre : carte déployée, filtres, glissé, Démarrer, composition.
6. Tests : disposition pour 1 à 6 images et mouvements sans image, ordre et dédoublonnage, « +N », repli sans image, point focal présent/absent, lignes 2 et 3 (avec/sans format, troncature), séance à un seul exercice.

Règles du projet : baseline gelée ; primitives natives de l'OS prioritaires ; Expo v57 ; aucune réécriture hors périmètre. PRESERVE / CHANGE / FORBIDDEN à établir avant de coder et à démontrer dans le rapport. La validation visuelle se fait sur iPhone : une suite verte ne la remplace pas.
