# DSF — Barre de titre à onglets — 19/11/2026

Référence Figma : « P-Catalogue des séances » (`4168:11149`, onglet Séances ; exemple de « Séance déployée » `1992:10014`) et « Agenda — Planning (proposition) » (`12580:27335`), page Prototype MVP. Le Figma définit le rendu ; il ne crée pas de règle métier. Décision D-532 (chapitre 07).

## 1. Portée

La navigation entre les trois vues d’un même domaine se fait par une barre de titre à onglets, et non plus par un contrôle segmenté sous le titre :
- Catalogues : **Mouvements · Séances · Programmes** (onglet actif selon l’écran) ;
- Calendrier : **Journal · Agenda · Vue d’ensemble** (D-532).

Le comportement de navigation (changement de vue, vue conservée) est inchangé ; seul le contrôle change.

## 2. Géométrie et peinture (402 × 874)

| Élément | Prescription |
|---|---|
| Libellés | Trois zones de 123 × 21, centrées, à x = 16 · 139 · 263, y = 60 ; Inter 17 ; interligne automatique. « Vue d’ensemble » a la largeur de son texte (127) et reste centrée sur son axe (x centre ≈ 324,5). |
| Onglet actif | Inter 17 **gras**, noir `#141414`, posé sur une forme arrondie 143 × 43 à y = 50, remplie `#EAEAFF`, centrée sur son libellé. |
| Onglets inactifs | Inter 17 normal, gris `#595E66`, sans fond. |
| En-tête fixe et barre d’état | Teinte `#F7F7FF`, sur 95 px de haut. |
| Ordre des couches | Barre d’état, en-tête, bande de contexte, forme de l’onglet actif, contenu, libellés au-dessus de tout. |

## 3. Bande de contexte

Bande 402 × 115 à y = 92 (la hauteur ne change pas d’un écran à l’autre). Dégradé vertical lilas `#EAEAFF` opaque jusqu’à 80 % de la hauteur, puis transparent en bas. Elle porte les contrôles propres à l’écran (recherche, filtre, tri, création pour un catalogue ; navigation de période pour l’Agenda).

## 4. Accessibilité et état

Chaque libellé est un onglet (rôle `tab`) ; l’onglet actif est annoncé comme sélectionné. La zone tactile de chaque onglet couvre au moins 44 × 44 px.
