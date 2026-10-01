# DSF — Paramètres d’exécution en feuille basse

Référence active D-246, transmission du01/10/2026. Documente les nouveaux écrans existants ; aucune planche Figma ni composant maître n’est modifié par cette livraison. Complète le DSF et remplace les usages inline du lot3 T1–T4 pour ce parcours.

| Élément | Prescription |
|---|---|
| Feuille | Blanche, ancrée au bas, coins supérieurs24 px, rognage aux coins, ombre légère vers le haut ; hauteur selon contenu |
| Voile | Noir28 %, plein écran ; arrière-plan inerte et inaccessible au focus |
| En-tête | Composant DSF En-tête de modale ; ✕ à gauche, titre Paramètres d’exécution, ✓ à droite ; labels accessibles Annuler/Valider les paramètres |
| Carte empilée | Fond#FCFCFE, contour blanc, lignes42 px à texte standard, séparateurs#DEDEE5 ; libellé14 px à gauche, valeur/contrôle à droite |
| Ligne sélectionnée | Roulette ou segmenté uniquement : bord2 px#0508E5, fond#F4F4FF, rayon12 px ; contour limité à la ligne ; contrôle déployé dessous hors contour |
| Stepper commun | Largeur137 px à402, fond blanc, boutons#F2F2FF, glyphes/valeur bleus, valeur centrée ; aucun cadre sélectionné ; bord droit du + àx366 sur402, donc marge36 px ; boutons alignés entre lignes |
| Valeur modifiable | Composant Valeur modifiable du DSF, sans chevron ; la sélection est portée par la ligne |
| Valeur lecture seule | Texte#141414,14 px, sans pastille/chevron/rôle bouton ; Durée totale ≥ en Répétitions |
| Segmenté en feuille | Trois largeurs égales ; non sélectionné#FCFCFE, contour blanc ; Changement de côté13 px, centré sur deux lignes |
| Libellé long | Pause au changement de côté sur deux lignes ; largeur180 px à402 pour éviter le stepper |
| Roulette | DSF Forms/Roulette, minutes/secondes, sous sa ligne ; pas de seconde modale ni validation indépendante |
| Message temporaire | Sous la ligne concernée à4 px ; état6423:9953 : croissance vers le haut de62 px à402, lignes du bas inchangées |

## Composants et portée

Réutiliser DSF/Controls/Stepper/Profil et /Tour sous une présentation commune Paramètres (137 px, fond blanc/boutons lavande), DSF/Forms/Valeur modifiable, DSF/Forms/Roulette, Controls/Segmented et DSF/Overlays/En-tête de modale. Formaliser Ligne de paramètre avec type Stepper/Valeur/Résultat/Segmenté et états repos/sélectionné/inactif/erreur. La variante lecture seule est sémantiquement distincte, sans action cachée. La présentation de cette feuille ne réécrit pas arbitrairement les autres écrans Profil/Tour. Le composant de démonstration6426:10149 reste hors DSF.

## Adaptation et appuis

Référence402 px, contrôle360/402/440 et texte agrandi. Les42 px sont une hauteur visuelle de référence, pas un plafond : les lignes grandissent si nécessaire, sans chevaucher les contrôles ; cibles tactiles selon le DSF, sans recouvrement entre lignes. Sur petit écran ou si la hauteur disponible est atteinte, le contenu défile dans la feuille et l’en-tête Annuler/Valider reste accessible dans les Safe Areas. La feuille grandit vers le haut avant de défiler ; aucun contenu masqué sous le bord bas.

Appuis : D-237 reste applicable (action au relâchement, maintien stepper450/150 ms, réduction d’animations). Le120 ms de la démo Séries décrit son animation, pas un délai supplémentaire avant action. Un stepper ne prend jamais le contour réservé aux champs activés. Une valeur vide est annoncée Non renseignée ; un résultat ≥ est annoncé Supérieur ou égal, en lecture seule.

## Confirmation de suppression restaurée

Frame2234:189 : titre Supprimer cette séance ? ; message Cette séance archivée sera définitivement supprimée. Cette action est irréversible. Annuler gris#F3F4F6 à gauche ; Confirmer#B1503C à droite. Réutiliser le dialogue destructif existant ; aucune nouvelle famille. Les boutons du prototype ne sont pas recâblés : preuve visuelle seulement.
