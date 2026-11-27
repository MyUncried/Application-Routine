# DSF — Écran « Avant la séance » et transition entre séances — 27/11/2026

Références Figma (page Prototype MVP, 402 × 874) : « P-Avant la séance — Douleur » (`8921:35275`, première séance, avec option douleur), « P-Avant la séance — Douleur — Bouton inactif (aucun choix) » (`13419:1329`, état initial) et « Exécution d'une séance — Initial — Enchaînement (proposition) » (`12716:25405`, séances suivantes d'un parcours, sans douleur). Le Figma définit le rendu ; les règles sont dans D-577 et D-427 (chapitre 07). Rendu uniquement : aucune règle métier n'est créée ici.

## 1. Principe

Un seul écran, deux versions, affiché avant l'écran d'exécution : le premier écran d'exécution de la séance reste visible en fond, estompé, sous deux voiles ; le contenu est porté par un grand cadre vert. Cet écran fusionne l'ancien écran « Avant la séance » et l'ancien écran de transition entre séances (encadré vert plein, DSF Agenda § 7).

| | Première séance (`8921:35275`) | Séances suivantes (`12716:25405`) |
|---|---|---|
| Échelle de douleur | Oui si l'option douleur du Programme est active (D-427), obligatoire, sans présélection | Non (demandée une seule fois, appliquée à tout le parcours) |
| Cadre vert | Un seul : la liste, un trait fin de séparation, puis la douleur ; bouton hors du cadre | Un seul, centré verticalement : titre et liste ; bouton hors du cadre |
| Bouton | « Appuyer pour démarrer la séance » / « …le parcours » | « Appuyer pour démarrer la 2ème séance » (rang calculé : 2ème, 3ème…) |

## 2. Fond et voiles

Fond : premier écran d'exécution de la séance, complet. Voile blanc 402 × 874, `#FFFFFF` à 50 %, puis voile vert 402 × 874, `#1F9E7A` à 35 % (même teinte que l'ancien écran de transition), sur toute la hauteur. Le bouton Retour DSF (`DSF / Primitives / Action — retour`, 48 × 48 à x = 12, y = 46) reste au-dessus des voiles. Le nom de la séance n'est pas affiché dans l'en-tête.

## 3. Cadre vert

Fond `#148061`, rayon 20, largeur 378 à x = 12, textes blancs. Toutes les polices de l'écran sont Roboto.

**Cadre** (première séance, exemple de la capture : y = 101, h = 589, liste puis zone douleur ; haut limité par le bouton Retour ; marge basse 20 pt). Séances suivantes (sans douleur) : y = 211, h = 452, centré verticalement. Si la liste est plus longue, le cadre s'étend vers le haut ; s'il dépasse encore la hauteur disponible, seule la liste défile, le titre restant toujours visible.

| Élément | Style |
|---|---|
| Titre (nom de la séance, ou du parcours) | Roboto gras 26, centré, à égale distance (23 pt) du haut du cadre et de la ligne de pointillés ; sur deux lignes si le titre est trop long (le cadre s'étend alors vers le haut) |
| Séparation sous le titre | Ligne de points ronds, largeur de la liste (330 à x = 36), trait 3, blanc à 60 %, écart 8 ; 10 pt d'espace sous la ligne avant le premier élément |
| Cycle (« 2 cycles ») | gras 22, retrait 0 |
| Circuit / format (« 3 tours · Circuit libre », « 8 tours · TABATA ») | gras 22, retrait 18, espace avant 14 (circuit) / 18 (format) ; nom du format en majuscules ; « Circuit libre » si pas de format ; ni durée ni nature groupées/alternées |
| Exercice | normal 22, retrait 36, puce « • » ; écart de 4 entre exercices consécutifs |
| Dernier exercice hors circuit | normal 22, espace avant 14 |

Liste : x = 36, largeur 330.

## 4. Zone douleur (première séance)

Dans le même cadre vert que la liste, sous elle, séparée par un trait fin : rectangle 330 × 1 à x = 36, blanc à 22 % (même séparation que sur l'écran de fin de séance, DSF Fin de séance), à 16 pt sous la liste (y = 553 sur la capture). Libellé « Douleur ressentie avant la séance » (Roboto gras 22, blanc, x = 24, y = 571). Échelle 0 à 10 : 354 × 44 à x = 24, y = 626 ; onze cases de 30 × 44, sans légende. Couleurs du vert au rouge (interpolation vert `#2EA85C`, jaune `#FAD133`, rouge `#DB332E`, jaune au milieu) ; chiffre blanc sur les cases foncées, brun foncé sur les claires, gras. Chiffre choisi : case 40 × 58 (+5 de chaque côté, +7 haut et bas), chiffre 22, ombre portée noire 45 % (décalage y = 4, flou 8), sans liseré. **État sans choix** (écran Figma `13419:1329`, état initial) : les onze cases ont la même taille, sans ombre ; le bouton est désactivé (état « Désactivé » du Bouton primaire du Design system).

## 5. Bouton de départ

« Bouton primaire » du Design system (`DSF / Actions / Bouton primaire`, 354 × 48), hors du cadre vert, en bas d'écran à sa position standard (x = 24, y = 802), comme « Enregistrer » sur l'écran de fin de séance. États Actif / Désactivé du composant. Titres, sur une ligne : « Appuyer pour démarrer la séance » (séance lancée seule), « …le parcours » (première séance d'un parcours), « …la 2ème séance » (séances suivantes).

## 6. Réglages d'affichage et états

« Ne plus afficher cet écran » (cette séance seulement) : case à cocher placée hors du cadre vert, sous le cadre et juste au-dessus du bouton (y = 756 sur la capture), en plus petit que la liste, proposée uniquement hors option douleur (D-577) ; dessinée sur `8921:35275` à titre d'illustration (case 18 × 18, rayon 4, contour et libellé vert foncé `#0D5F47` sur le fond voilé ; libellé Roboto normal 16, à 10 de la case ) ; dans l'écran avec option douleur, elle n'apparaît pas. Réglage global : « Afficher l’écran de démarrage de séance » dans le groupe Séance de Profil › Préférences (`1992:684`), en première ligne, avant « Compte à rebours de la séance » : ligne de 42 pt au format des autres réglages, interrupteur DSF activé par défaut (écran affiché pour toute séance) ; désactivé, l'écran n'est affiché pour aucune séance ; le groupe Annonces vocales est décalé de 42 pt. La case « Ne plus afficher cet écran » ne désactive l'affichage que pour la séance, jusqu'à un changement de l'ordre ou du contenu de ses exercices (pas des paramètres d'exécution). La capture de la douleur ne dépend que du Programme (option douleur) : elle n'est concernée ni par la case ni par le réglage (D-577) ; avec option douleur et affichage désactivé, seule la douleur est demandée : même écran avec, dans le cadre vert, uniquement la zone douleur, centré verticalement (non dessiné, simple recadrage) ; le bouton reste hors du cadre. État non dessiné : version sans option douleur avec « Ne plus afficher cet écran » (illustrée sur `8921:35275`). Vérification sur iPhone à faire : défilement de la liste sous le titre, lisibilité du texte sur le voile, case choisie bien visible.
