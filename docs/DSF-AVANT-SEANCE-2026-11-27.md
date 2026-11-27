# DSF — Écran « Avant la séance » et transition entre séances — 27/11/2026

Références Figma (page Prototype MVP, 402 × 874) : « P-Avant la séance — Douleur » (`8921:35275`, première séance, avec option douleur) et « Exécution d'une séance — Initial — Enchaînement (proposition) » (`12716:25405`, séances suivantes d'un parcours, sans douleur). Le Figma définit le rendu ; les règles sont dans D-577 et D-427 (chapitre 07). Rendu uniquement : aucune règle métier n'est créée ici.

## 1. Principe

Un seul écran, deux versions, affiché avant l'écran d'exécution : le premier écran d'exécution de la séance reste visible en fond, estompé, sous deux voiles ; le contenu est porté par un grand cadre vert. Cet écran fusionne l'ancien écran « Avant la séance » et l'ancien écran de transition entre séances (encadré vert plein, DSF Agenda § 7).

| | Première séance (`8921:35275`) | Séances suivantes (`12716:25405`) |
|---|---|---|
| Échelle de douleur | Oui si l'option douleur du Programme est active (D-427), obligatoire, sans présélection | Non (demandée une seule fois, appliquée à tout le parcours) |
| Cadres verts | Deux : la liste ; la douleur et le bouton | Un seul, centré verticalement : titre, liste et bouton |
| Bouton | « Appuyer pour démarrer la séance » / « …le parcours » | « Appuyer pour démarrer la 2ème séance » (rang calculé : 2ème, 3ème…) |

## 2. Fond et voiles

Fond : premier écran d'exécution de la séance, complet. Voile blanc 402 × 874, `#FFFFFF` à 50 %, puis voile vert 402 × 874, `#1F9E7A` à 35 % (même teinte que l'ancien écran de transition), sur toute la hauteur. Le bouton Retour DSF (`DSF / Primitives / Action — retour`, 48 × 48 à x = 12, y = 46) reste au-dessus des voiles. Le nom de la séance n'est pas affiché dans l'en-tête.

## 3. Cadres verts

Fond `#148061`, rayon 20, largeur 378 à x = 12, textes blancs. Toutes les polices de l'écran sont Roboto.

**Cadre de la liste** (première séance : y = 111, h = 462 pour l'exemple ; bas ancré 23 pt au-dessus du cadre de départ). Si la liste est plus longue, le cadre s'étend vers le haut ; s'il dépasse encore la hauteur disponible, seule la liste défile, le titre restant toujours visible.

| Élément | Style |
|---|---|
| Titre (nom de la séance, ou du parcours) | Roboto gras 26, centré, à égale distance (23 pt) du haut du cadre et de la ligne de pointillés ; sur deux lignes si le titre est trop long (le cadre s'étend alors vers le haut) |
| Séparation sous le titre | Ligne de points ronds, largeur de la liste (330 à x = 36), trait 3, blanc à 60 %, écart 8 ; 10 pt d'espace sous la ligne avant le premier élément |
| Cycle (« 2 cycles ») | gras 22, retrait 0 |
| Circuit / format (« 3 tours · Circuit libre », « 8 tours · TABATA ») | gras 22, retrait 18, espace avant 14 (circuit) / 18 (format) ; nom du format en majuscules ; « Circuit libre » si pas de format ; ni durée ni nature groupées/alternées |
| Exercice | normal 22, retrait 36, puce « • » ; écart de 4 entre exercices consécutifs |
| Dernier exercice hors circuit | normal 22, espace avant 14 |

Liste : x = 36, largeur 330. Marge basse du cadre : 20 pt de plus que la marge haute.

## 4. Cadre de départ (première séance)

x = 12, y = 596, 378 × 262, même vert. Libellé « Douleur ressentie avant la séance » (Roboto gras 22, blanc, x = 24, y = 612). Échelle 0 à 10 : 354 × 44 à x = 24, centrée entre le libellé et le bouton ; onze cases de 30 × 44, sans légende. Couleurs du vert au rouge (interpolation vert `#2EA85C`, jaune `#FAD133`, rouge `#DB332E`, jaune au milieu) ; chiffre blanc sur les cases foncées, brun foncé sur les claires, gras. Chiffre choisi : case 40 × 58 (+5 de chaque côté, +7 haut et bas), chiffre 22, ombre portée noire 45 % (décalage y = 4, flou 8), sans liseré. **État sans choix** (écran Figma `13419:1329`, état initial) : les onze cases ont la même taille, sans ombre ; le bouton est inactif : fond gris `#CCD4D1`, sans relief (pas d'ombre intérieure), texte gris plus clair `#99A3A1`.

## 5. Bouton de départ

354 × 96, rayon 24, x = 24. Fond blanc avec léger dégradé vertical ; relief porté par le bouton : ombre intérieure `#9EA8DB` (y = −6, sans flou) formant un bord inférieur épais, et filet blanc (y = 2) ; aucune ombre portée. Texte Roboto gras 26, bleu DSF `#0508E5`, centré, sur deux lignes (trois si le libellé est plus long). Titres : « Appuyer pour démarrer la séance » (séance lancée seule), « …le parcours » (première séance d'un parcours), « …la 2ème séance » (séances suivantes). Première séance : y = 740 ; séances suivantes : 24 pt sous le texte de la liste, dans le même cadre.

## 6. Reste à décider

« Ne plus afficher cet écran » (cette séance seulement) : case à cocher placée hors du cadre vert, entre le cadre de la liste et le cadre de la douleur, en plus petit que la liste, proposée uniquement hors option douleur (D-577) ; dessinée sur `8921:35275` à titre d'illustration (case 18 × 18, rayon 4, contour et libellé vert foncé `#0D5F47` sur le fond voilé ; libellé Roboto normal 16, à 10 de la case ; marge basse du cadre de la liste 16 pt, 43 pt entre les deux cadres) ; dans l'écran avec option douleur, elle n'apparaît pas. Réglage global : « Afficher l’écran de démarrage de séance » dans le groupe Séance de Profil › Préférences (`1992:684`), en première ligne, avant « Compte à rebours de la séance » : ligne de 42 pt au format des autres réglages, interrupteur DSF activé par défaut (écran affiché pour toute séance) ; désactivé, l'écran n'est affiché pour aucune séance ; le groupe Annonces vocales est décalé de 42 pt. La case « Ne plus afficher cet écran » ne désactive l'affichage que pour la séance, jusqu'à un changement de l'ordre ou du contenu de ses exercices (pas des paramètres d'exécution). La capture de la douleur ne dépend que du Programme (option douleur) : elle n'est concernée ni par la case ni par le réglage (D-577) ; avec option douleur et affichage désactivé, seule la douleur est demandée : même écran avec uniquement le cadre de la douleur et du départ, centré verticalement (non dessiné, simple recadrage). État non dessiné : version sans option douleur avec « Ne plus afficher cet écran » (illustrée sur `8921:35275`). Vérification sur iPhone à faire : défilement de la liste sous le titre, lisibilité du texte sur le voile.
