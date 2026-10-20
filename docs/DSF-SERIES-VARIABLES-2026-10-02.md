# DSF — Séries variables et Ordre des côtés — 02/10/2026

**Actualisation du 12/10 :** [DSF Circuits et contrôles du 12/10](DSF-CIRCUITS-CONTROLES-2026-10-12.md) fait autorité sur les nouveaux contrôles de séries, la nature du circuit, les volumes et la lecture seule héritée. Les mesures datées ci-dessous ne décrivent pas les états remplacés. Les règles communes sans rapport avec ces éléments restent applicables.


**État courant06/10 :** [DSF Cadence et corrections](DSF-CADENCE-2026-10-06.md), [matrice courante](MATRICE-CADENCE-FIGMA-2026-10-06.md). Les mesures/captures datées ci-dessous restent historiques lorsqu’elles sont remplacées ; règles cartes média conservées. Cadence commune REPS et phrase unique selon paramètres v13, Phrase v1.

**Mise à jour du 18/10/2026 — spécification v3.0 :**
- Remplacé pour la présentation : les lignes Carte empilée (carte unique, contour blanc, libellés 14 px : quatre cadres de D-413), Valeur lecture seule (libellé visible Durée de l’exercice, D-409) et Segmenté en feuille (D-413), ainsi que la section « Tableau variable et Ordre des côtés — références remplacées le 12/10 » (régime par popover, chevron indépendant, pied commun de réglage, popovers de côtés : D-413, D-410, D-406). Feuille, voile, en-tête, roulette et message temporaire sont inchangés.
- Comportements : règles RM-235 à RM-250 du chapitre 10, [Charge, côtés, cadence et condition d’arrêt — règles du 18/10/2026](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#charge-côtés-cadence-et-condition-darrêt--règles-du-18102026) (décisions D-403 à D-413 du [registre](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md#parametres-execution-20261018)) ; ce DSF n’en reprend pas l’énoncé. Les valeurs des captures restent illustratives.
- Présentation nouvelle de la feuille des paramètres (D-413 ; spécification v3.0, GR-01 et PR-01 à PR-04 ; référence 402 × 874) : quatre cadres successifs espacés de 8 px, dans l’ordre de D-413 ; contrôles segmentés alignés à droite, titres à gauche, sans enveloppe blanche ; tableaux à fond blanc sans contour, lignes de 36 px, sans boutons +/− de tableau ; Cadence en 12 px ; labels Regular, plus petits que les valeurs ; options inactives en texte gris Regular sur le fond des champs variables ; option sélectionnée selon le traitement violet existant ; saisie de la charge au clavier décimal, tableau visible au-dessus du clavier avec une marge de 12 px (D-405) ; chevrons à l’intérieur des options Variables (Type de série) et Avec (Changement de côté) (D-410) ; Durée de l’exercice avec son chevron à 12 px du libellé (D-409).
- Tokens : les valeurs correspondantes sont à relever dans Figma avant publication ; aucun nouveau token n’est défini ici.

Complément des shells et composants existants ; aucun nouveau design. Actualisé le03/10. Sources : métadonnées et captures courantes de Prototype MVP, fichierG6RY5Ebhgwb4AHIOYDwwvg. Figma fixe le layout ; [v13](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#parametres-exercice) et CE-UI-10 fixent les comportements et calculs. Les composants maîtres ne sont pas modifiés par cette livraison documentaire. Inventaire actuel : ETAT-DES-LIEUX-CREATION-EXERCICE-2026-10-03.md.

## Fondations conservées et implantation

| Élément | Prescription |
|---|---|
| Feuille | Blanche, ancrée au bas, coins supérieurs24 px, rognage aux coins, ombre légère vers le haut ; hauteur selon contenu |
| Voile | `overlayScrim` (`color/overlay/scrim`) #1F2129 à 34 %, plein écran ; arrière-plan inerte et inaccessible au focus |
| En-tête | Composant DSF En-tête de modale ; ✕ à gauche, titre Paramètres d’exécution, ✓ à droite ; labels accessibles Annuler/Valider les paramètres |
| [remplacé par D-413 le 18/10/2026] Carte empilée | Fond `surfaceSubtle` `#F9FAFC` (ancien `#FCFCFE`, historique avant la fusion du journal §5.3), contour blanc, lignes42 px à texte standard, séparateurs#DEDEE5 ; libellé14 px à gauche, valeur/contrôle à droite |
| Ligne sélectionnée | Roulette ou segmenté uniquement : bord2 px#0508E5, fond#F4F4FF, rayon12 px ; contour limité à la ligne ; contrôle déployé dessous hors contour |
| Stepper commun | Largeur137 px à402, fond blanc, boutons#F2F2FF, glyphes/valeur bleus, valeur centrée ; aucun cadre sélectionné ; bord droit du + àx370 dans les copies du02/10 (x366 dans la référence du01/10) sur402, donc marge32 px pour le contrôle, avec marge36 px de la ligne de valeur ; boutons alignés entre lignes |
| Valeur modifiable | Composant Valeur modifiable du DSF, sans chevron ; la sélection est portée par la ligne |
| [libellé visible de la ligne : Durée de l’exercice, D-409 le 18/10/2026] Valeur lecture seule | Texte#141414,14 px, sans pastille/chevron/rôle bouton ; Durée totale ≈ en Répétitions avec bip ; absente sans bip et À l’échec [remplacé par D-433 le 19/10/2026 : ligne toujours affichée ; « Non calculable » sans bip et À l’échec ; « ≈ » ou « ≥ » placé immédiatement avant la valeur, jamais dans le libellé] |
| [remplacé par D-413 le 18/10/2026 : contrôles segmentés sans enveloppe blanche ni contour] Segmenté en feuille | Historique : remplacé par les popovers du DSF du 12/10 (D-377). Trois largeurs égales ; non sélectionné#FCFCFE, contour blanc ; Changement de côté13 px, centré sur deux lignes |
| Libellé long | Pause entre les côtés sur deux lignes ; largeur180 px à402 pour éviter le stepper |
| Roulette | DSF Forms/Roulette, minutes/secondes, sous sa ligne ; pas de seconde modale ni validation indépendante |
| Message temporaire | Sous la ligne concernée à4 px ; état6423:9953 : croissance vers le haut de62 px à402, lignes du bas inchangées |


## Tableau variable et Ordre des côtés — références remplacées le 12/10

[remplacé par D-413, D-410 et D-406 le 18/10/2026] Le régime se sélectionne par popover identiques/variables, avec chevron indépendant en variable. Le tableau utilise deux cellules et un pied de réglage commun, non deux steppers permanents par ligne. Les choix de côtés utilisent les popovers des captures actuelles. Les prescriptions, composants et mesures sont centralisés dans le [DSF du 12/10](DSF-CIRCUITS-CONTROLES-2026-10-12.md). Les mesures des anciennes frames 6665 restent consultables dans l’historique Git ; elles ne constituent plus la cible courante.

## Portée et écarts observés

Les anciennes copies et le frame d’essai6607:10896 ne sont plus présents sur Prototype MVP. Les fichiers documentaires historiques restent conservés.6665:25277 montre le haut du contenu12séries ; le total situé plus bas ne peut pas être déclaré visuellement vérifié depuis cette capture. Les anciens écarts de5min20 appartiennent au relevé historique. La recette normative reste8min30 pour les données indiquées. Les références directes affichant Tour et la récupération visible en Composition conservent les écarts déjà tracés, sans changement métier.

La confirmation Supprimer cette séance ? (2234:189) conserve le dialogue destructif du DSF du01/10 : Annuler gris à gauche, Confirmer terre cuite à droite. Sa présence ne prouve aucun câblage interactif.

Inventaire et recettes : [matrice du02/10](MATRICE-SERIES-VARIABLES-2026-10-02.md). Captures exclusivement dans le chapitre06.

