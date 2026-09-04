# Rapport — Alignement des poignées de déplacement des cartes d’activité

Date : 2026-09-04  
Branche : `feat/creation-seance-catalogue`  
Base Git auditée : `447ad3d20636f312fff32459d0f6723ad2b1bbae`  
Figma : `G6RY5Ebhgwb4AHIOYDwwvg`

## Constat

Le composant canonique `Icon / Structure / Movable` était correctement défini, mais `Composition / Activity Row` contenait encore un dessin local `icon/réorganiser` de `16 × 16`. Les instances de production héritaient donc de l’ancienne représentation.

## Correction Figma

| Élément | Avant | Après | Statut |
| --- | --- | --- | --- |
| `Composition / Activity Row` | frame locale `2588:2674`, 16×16 | slot `3125:3979` 28×28 + instance `3125:3980` du composant `3066:4676`, 20×20 | CONFORME |
| Opacité/couleur | dessin local non relié au canon | opacité héritée 50 %, `color.iconNeutral` | CONFORME |
| Occurrences Prototype MVP | 16 occurrences héritant du dessin local | 16 instances canoniques ; 0 occurrence locale restante | CONFORME |

Écrans vérifiés et captures documentaires actualisées :

- `2028:11457` — Modal — Paramétrer la fin de séance ;
- `2028:11580` — Modal — Nombre de Tours ;
- `2028:11700` — Composition d’une séance — sans Cycle ;
- `2028:11808` — Composition d’une séance — actions glissées.

## Documentation

- chapitre 06 : règle fonctionnelle de représentation de la poignée ;
- chapitre 12 : traçabilité du composant, du slot, de l’instance, de l’actif et des tokens ;
- chapitre 13 / CE-T01-09 : contrat d’écran déterministe et test bloquant ;
- quatre captures PNG régénérées depuis les frames Figma actuelles.

## Limite

Aucun fichier de code applicatif n’a été modifié. La conformité de l’implémentation reste à contrôler lors d’une intervention de développement séparée.

Statut : **DESIGN_DOCUMENTATION_ALIGNED**
