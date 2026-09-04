# Rapport — Anatomie canonique de la section Nombre de tours

Date : 2026-09-04  
Périmètre : documentation uniquement  
Figma consulté en lecture seule : `Composition / Tour Section` (`3067:270`)

## Référence DSF vérifiée

| Élément | Node Figma | Mesure / propriété |
| --- | --- | --- |
| Conteneur extérieur déployé | `2537:1454` | `374 × 175 pt`, fond `#CDCEFA`, rayon `10 pt`, padding `10 pt` |
| Conteneur extérieur replié | `3067:244` | `374 × 54 pt`, même fond et même rayon |
| En-tête interne transparent déployé | `2537:1425` | `354 × 34 pt`, position `x=10`, aucun fond, aucune bordure |
| En-tête interne transparent replié | `3067:245` | `354 × 34 pt`, position `x=10`, aucun fond, aucune bordure |
| Cartes d’activité | `2537:1442`, `2537:1448` | `354 × 52 pt`, position `x=10`, sous l’en-tête |

## Corrections documentaires

| Fichier | Passage corrigé |
| --- | --- |
| `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md` | section `Écran 3 – Composition d’une séance > Paramètres du Tour` : ajout de l’anatomie conteneur extérieur / en-tête interne transparent / cartes d’activité |
| `docs/Specifications-fonctionnelles/12 – Architecture technique.md` | registre canonique, ligne `Composition / Tour Section`, et nouvelle règle `Anatomie canonique — Nombre de tours` |
| `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md` | contrats `CE-T01-04` et `CE-T01-09`, y compris leurs tests bloquants |

## Recherche des formulations contradictoires

Documents actifs contrôlés : chapitres 06, 07, 08, 12 et 13.

Expressions recherchées : `carte Tour`, `carte du Tour`, `carte intérieure`, `fond bleu`, `conteneur Tour`, `Composition / Tour Section`, `354` et `374`.

Résultat avant correction :

- chapitre 12 : formulation ambiguë `carte 354` dans la ligne du composant ;
- chapitre 13 : formulation indéterminée `le Tour est contenu dans le cadre prévu par le Design System` ;
- chapitre 06 : aucune règle anatomique explicite distinguant les deux largeurs.

Résultat après correction :

- aucune formulation n’attribue le fond bleu à l’en-tête interne transparent ;
- aucune formulation ne donne la même largeur au conteneur extérieur et à l’en-tête interne transparent ;
- aucune formulation ne qualifie l’en-tête technique de carte ;
- les seules occurrences de `carte intérieure` sont des interdictions explicites dans les états sans activité ;
- les chapitres 07 et 08 ne contenaient aucune règle contradictoire et n’ont pas été modifiés.

## Hors périmètre

Figma et le code applicatif n’ont pas été modifiés. Aucune autre règle ni dimension du composant n’a été changée.

Statut : **TOUR_SECTION_DOCUMENTATION_ALIGNED**
