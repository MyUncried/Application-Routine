# Mission AUDIT-FAB-PHYSIQUE — comportement physique du bouton flottant « Créer »

## Identification

- **Objectif** : audit indépendant demandé par Hermann le 24/11/2026.
  - Analyser la vidéo de référence, la confronter aux observations de Hermann, au DSF Bouton flottant, à D-558 / D-559, au code et aux bibliothèques installées.
  - Proposer une spécification et un plan, sans modifier le code, la documentation ni Figma.
- **Type** : audit sans modification applicative. Ce rapport est le seul fichier modifié ; Hermann a donné son accord (« Ok ») pour le committer seul sur la branche du bouton flottant.
- **Branche** : `feat/bouton-flottant-20261124` (PR #452, non fusionnée).
- **Commit de départ** : `7466e3c4`.
- **Vidéo** : `ScreenRecording_11-24-2026_15-29-15_1.mov`, fournie par Hermann.
  - 14,86 s, 60,05 i/s, 1206 × 2622 px, soit 402 × 874 pt.

## Périmètre

- **Demandé** :
  - analyse de la vidéo ;
  - modèle physique ;
  - paramètres ;
  - comparaison avec KODJO ;
  - spécification cible ;
  - plan minimal ;
  - critères de recette ;
  - faisabilité et risques.
- **Traité** : tout le périmètre demandé, avec la correction et les réponses de Hermann reçues pendant l'audit.

## Méthode et preuves

- **Extraction** : images décodées par le ffmpeg d'`imageio-ffmpeg` (exécuté avec `uv`, hors du dépôt).
- **Suivi** : objet suivi par sa couleur (≈ #0075F3), centre calculé sur 860 des 892 images, puis vitesses (pt/s) et segmentation des mouvements. Scripts et données conservés hors du dépôt, dans le dossier temporaire de la session : `track.py`, `track.csv`, `analyze.py`, `detail.py`.
- **Source de l'objet de la vidéo** : `node_modules/expo-dev-menu/ios/FAB/DevMenuFABView.swift`, version 57.0.15.
- **Bibliothèques installées** : react-native-gesture-handler 2.32.0, react-native-reanimated 4.5.1, react-native-worklets 0.10.1, react-native 0.86.2.

## 1. Analyse de la vidéo

| Classe | Constat |
|---|---|
| OBSERVÉ | L'objet déplacé est le bouton d'outils d'Expo (engrenage bleu). Le bouton KODJO (carnet « + », catalogue des programmes) reste fixe en bas à gauche. |
| OBSERVÉ | Une trentaine de gestes, dont 13 lancers de 300 à 530 pt. |
| OBSERVÉ | Démarrage : de 0 à environ 1 300 pt/s en 6 images (0,1 s). Pointes de 500 à 2 500 pt/s. |
| OBSERVÉ | Décroissance régulière de la vitesse, de la pointe à presque zéro en 0,3 à 0,45 s. |
| OBSERVÉ | Chaque lancer finit contre un bord : centre x = 41 ou x = 361. Le bouton dépasse ces positions de 11 à 13 pt (x observé de 27,7 à 373,7), puis y revient en environ 0,4 s, sans seconde oscillation visible. |
| OBSERVÉ | Verticalement, le bouton s'arrête librement, puis revient de 4 à 6 pt. En bas, il est retenu à y ≈ 792 (pointe à 814, puis retour) ; y = 91 atteint en haut. |
| OBSERVÉ | Aucun appui long : le bouton part dès le début du geste. |
| NON MESURABLE | Le doigt n'est pas visible : l'écart entre le doigt et le bouton ne se mesure pas sur la vidéo. |
| DÉDUIT (source) | Glissement reconnu après 10 pt (`dragThreshold`) ; en dessous, c'est un toucher, qui ouvre le menu. |
| DÉDUIT (source) | Pendant le glissement, chaque position du doigt est animée par un ressort (`response` 0,25 s, `dampingFraction` 0,85) : c'est le retard ressenti. |
| DÉDUIT (source) | Au lâcher, la cible vaut position + 0,35 × (`predictedEndLocation − location`). En x, c'est le bord le plus proche du centre estimé, élan compris ; en y, la cible est bornée à la zone sûre. Le trajet se fait par un ressort (`response` 0,6 s, `dampingFraction` 0,7). |

## 2. Modèle physique

Le mouvement se fait en deux ressorts successifs, sans frottement.

- **Pendant le geste**, un ressort raide relie le bouton au doigt. Le bouton traîne d'autant plus que le doigt va vite, et le rattrape quand celui-ci ralentit.
- **Au lâcher**, la vitesse est convertie en une cible projetée vers l'avant. Un ressort plus souple y conduit le bouton en partant de la vitesse du lâcher, d'où la poursuite, le ralentissement, le léger dépassement et la pose.

Un ralentissement par frottement (`withDecay`) ne reproduit pas le dépassement observé.

## 3. Paramètres proposés (masse 1)

| Paramètre | Valeur initiale | Origine |
|---|---|---|
| Seuil de glissement | 10 pt | Source |
| Ressort de suivi | raideur ≈ 632 s⁻², amortissement ≈ 42,7 s⁻¹ (réponse 0,25 s, amortissement 0,85) | Source |
| Retard à vitesse constante | ≈ 0,068 s × vitesse : 20 pt à 300 pt/s, 68 pt à 1 000 pt/s, 135 pt à 2 000 pt/s | Calcul |
| Élan au lâcher | décalage de la cible ≈ 0,175 s × vitesse | Source × projection d'iOS (≈ 0,5 s, approximation) |
| Ressort de pose | raideur ≈ 110 s⁻², amortissement ≈ 14,7 s⁻¹ (réponse 0,6 s, amortissement 0,7), en partant de la vitesse du lâcher | Source, dépassement observé |
| Marge latérale au rangement | 16 pt (DSF), contre 5 pt dans la référence | À confirmer |
| Limites verticales | bouton entier visible : sous la barre d'état, au-dessus de la barre d'accueil d'iOS | Source, réponse de Hermann |
| Réduire les animations | pose directe | Proposé |

**Calibration** : filmer l'écran de l'iPhone à 60 i/s (glissement lent et rapide, lancers court et long, rattrapage en vol) et passer la vidéo dans le même script de suivi. Comparer à la référence :
- le retard à trois vitesses ;
- l'amplitude du dépassement ;
- le temps d'arrêt.

Ajuster un seul paramètre à la fois.

## 4. Comparaison avec KODJO

Fichiers : `src/shared/ui/FloatingCreateButton.tsx`, `src/shared/ui/floatingCreatePosition.ts`, `app/(tabs)/_layout.tsx`.

| Point | Aujourd'hui | Cible |
|---|---|---|
| Début du déplacement | appui maintenu de 400 ms (`activateAfterLongPress`) | dès 10 pt de glissement |
| Suivi | collé au doigt (`Animated.ValueXY.setValue`, fil JavaScript) | ressort de suivi (Reanimated, fil d'interface) |
| Lâcher | rangement immédiat au bord le plus proche de la position, sans élan ni ressort | côté choisi selon l'élan, ressort de pose avec dépassement |
| Hauteur | entre la position par défaut et le bas de la zone de contexte | libre avec élan, tout l'écran, bouton entier visible |
| Barre de navigation | dessinée par-dessus les écrans (`navigationRow` absolu dans `app/(tabs)/_layout.tsx`) : le bouton passerait dessous | le bouton passe devant ; il est affiché au niveau des onglets |
| Rattrapage en vol | sans objet | reprise depuis la position affichée, sans saut |
| Mémoire | côté + hauteur, fichier local | côté + hauteur absolue, même fichier, rebornée à chaque écran |
| Toucher, VoiceOver, verre, icônes | conformes | inchangés |

## 5. Spécification fonctionnelle cible

Elle tient compte de la correction et des réponses de Hermann du 24/11/2026, en fin de rapport.

1. Un toucher sans glissement de plus de 10 pt déclenche l'action.
2. Dès 10 pt de glissement, le bouton est saisi, sans appui long, et l'action n'est pas déclenchée.
3. Le bouton suit le doigt avec un retard qui grandit avec la vitesse, et le rattrape quand le doigt ralentit ou s'arrête.
4. Au lâcher, le bouton garde son élan. Il se range contre le bord gauche ou droit : celui vers lequel l'élan le porte, sinon le plus proche. Il dépasse légèrement le bord avant de s'y poser. Il ne reste jamais au centre.
5. Verticalement, il garde son élan puis s'arrête librement. Il peut couvrir l'en-tête, la zone de contexte, le contenu et la barre de navigation (onglet caché accepté). Il reste entièrement visible et, lancé contre le haut ou le bas, il est ramené en douceur.
6. Il peut être rattrapé en mouvement et repart alors sans saut.
7. Sa position est conservée sur l'appareil, commune à tous les écrans, et ramenée dans l'écran si besoin.
8. En composition, le menu Créer s'ouvre vers le haut s'il y a la place, sinon vers le bas.
9. Avec « Réduire les animations », le bouton se pose directement.

## 6. Plan de modification minimal (à valider)

1. **`FloatingCreateButton.tsx`** :
   - glissement reconnu dès 10 pt, toucher conservé au Pressable (VoiceOver) ;
   - positions sur le fil d'interface avec les deux ressorts ;
   - reprise depuis la position affichée.
2. **`floatingCreatePosition.ts`** : côté et hauteur absolue ; calcul pur de la cible (élan, côté, bornes).
3. **Écrans à onglets** : bouton affiché au niveau de `app/(tabs)/_layout.tsx`, devant la barre ; `TabbedScreen` déclare variante, libellé et action. La composition garde son bouton.
4. **`CreateMenu.tsx`** : ouverture vers le haut ou vers le bas selon la place.
5. **Tests** : fonctions pures, geste (seuil, toucher contre glissement, rattrapage), tests du rangement mis à jour.
6. **Documentation** (classe B) : décision D-594 (D-593 est pris par la PR #453), DSF § 5 remplacé (texte d'origine conservé), ch. 13, ch. 12, rapport UI-FAB-01.
7. **Contrôles transverses** : défilement, feuilles modales, placement des points d'arrêt, VoiceOver, « Réduire les animations ».

Livraison : mise à jour OTA ou Metro, sans module natif.

## 7. Critères de recette sur iPhone

1. Glissement lent : suivi presque collé, sans à-coup.
2. Glissement rapide : retard net, rattrapé à l'arrêt du doigt.
3. Lâcher au centre : le bouton rejoint le bord le plus proche.
4. Lancer rapide vers le bord opposé : il l'y emmène, avec un léger dépassement.
5. Lancer vertical : il continue, ralentit et s'arrête à la hauteur atteinte.
6. Lancer contre le haut ou le bas : il ne sort pas de l'écran et revient en douceur.
7. Posé sur l'en-tête, la zone de contexte ou la barre de navigation : il reste visible et touchable, sans déclencher l'élément situé dessous.
8. Rattrapage en vol : il repart sans saut.
9. Toucher bref : l'action se déclenche ; un glissement de plus de 10 pt ne la déclenche pas.
10. Mémoire : même place après un changement d'écran et après redémarrage.
11. Défilement d'une liste sous le bouton : fluide.
12. Composition avec le bouton en haut : le menu s'ouvre vers le bas.
13. « Réduire les animations » activé : pose directe.

## Faisabilité et risques

La faisabilité est bonne : les bibliothèques installées suffisent et aucun module natif n'est ajouté.

Risques :
- la sensation ne se valide que sur iPhone (calibration en un ou deux allers-retours) ;
- l'affichage au niveau des onglets est le changement le plus structurant ;
- la cohabitation du toucher et du glissement, avec VoiceOver, est à vérifier ;
- un bouton posé tout en bas peut gêner la barre d'accueil d'iOS : la limite basse doit en tenir compte.

## Correction et réponses de Hermann du 24/11/2026

- **Correction** : « le bouton se range tout le temps soit à droite, soit à gauche, il ne reste pas en plein centre ».
  - Le rangement horizontal de la référence est repris.
  - [Point de la demande initiale « aucune attraction automatique vers les bords » — remplacé.]
- **Question 1, zone permise** : « Oui, partout ». En-tête, zone de contexte, contenu et barre de navigation ; onglet caché accepté.
- **Question 2, menu vers le bas** : « Oui ».
- **Question 3, rapport** : « Ok » pour committer ce rapport seul.

## Hypothèses non démontrées

- La projection d'iOS (`predictedEndLocation`) est approchée par 0,5 s × vitesse ; Apple ne publie pas la formule exacte.
- Le retard pendant le glissement est déduit de la source, pas mesuré sur la vidéo.

## Non traité

L'implémentation reste en attente de la validation du plan (« go » de Hermann).

## Synchronisation code / documentation

Aucun code modifié. Les mises à jour documentaires (D-594, DSF, ch. 13, ch. 12) sont prévues avec l'implémentation (classe B).

## Tests

Aucun test applicatif applicable : audit sans code.

## Fichiers modifiés

`.github/orchestration/reports/2026-11-24_AUDIT-FAB-PHYSIQUE.md`, seul.

## Commit final et état Git

Commit qui contient ce rapport, sur `feat/bouton-flottant-20261124`, envoyé sur GitHub. Arbre propre et verrou libéré.
