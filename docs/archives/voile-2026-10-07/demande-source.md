# Mise à jour de la documentation — voile modal unique

Objet : voile modal — valeur unique `overlayScrim` (#1F2129 à 34 %)

## Décision
Tous les voiles modaux (dialogues de décision, feuilles de sélection, roues, filtres, classification, catégorie, zones corporelles, calendrier ouvert, abandon/confirmation, CE-UI-10) utilisent le seul token `color/overlay/scrim` = #1F2129 à 34 %. Figma est aligné : 62 voiles de la page Prototype MVP, vérifiés.

`color/overlay-scrim` (#14171F, plein) reste la teinte d'ombre de la carte déplacée (D-299). Il ne sert jamais de voile.

## Corrections demandées
1. `12 – Architecture technique.md`, l. ~1340 : remplacer « voile noir 28 % de la feuille » par « voile `overlayScrim` (#1F2129 à 34 %) ».
2. `13 – Contrats d'écran.md`, CE-UI-10 § 9 (l. ~3098) : le texte « Voile modal #1F2129 à 34 % » est déjà correct. Ajouter la référence au token `overlayScrim`.
3. `DSF-CADENCE-2026-10-06.md`, lignes `overlayScrim` et `compositionDraggedCardShadow` (l. ~36-37) :
   - `overlayScrim` est le voile de tous les dialogues, feuilles, roues et modales ;
   - `compositionDraggedCardShadow` (#14171F) n'est jamais utilisé comme voile.
4. POINTS-A-REINTEGRER, point 18 : clore (valeur arrêtée : #1F2129 à 34 %).
5. D-299 : ajouter la précision « distinct de `overlayScrim` ».
6. Audit : clore H-15 (voile).

Aucune autre valeur de voile ne doit subsister : 28 %, 22 %, 35 %, 45 %, #000, #141414, #0D0D1A.

## Hors périmètre de cette mise à jour
Restent ouverts, indépendamment du voile : H-08, H-09, H-10, H-13 (en-tête 92 vs 95), H-14 (modèle de couleur Séance, décision propriétaire), H-16.
