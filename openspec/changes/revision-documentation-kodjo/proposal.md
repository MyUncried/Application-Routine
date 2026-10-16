# Proposal

## Why

La documentation KODJO (13 chapitres, 1,44 Mo, plus environ 60 documents DSF, matrices et rapports) a été consolidée le 14/10. Elle ne permet pourtant pas encore de trouver, pour chaque règle, une référence unique et sûre :

- trois ordres de priorité incompatibles ;
- des DSF qui prévalent sur des chapitres ;
- 24 décisions vidées de leur texte ;
- des remplacements implicites par ajout de « Compléments » datés ;
- 194 liens ou ancres rompus ;
- 83 constats d'analyse (voir [diagnostic.md](diagnostic.md)).

Le développement en cours (PRE-4) en subit déjà l'effet : il a fallu écrire des règles de priorité locales (P1 à P44) et 23 arbitrages (Q1 à Q23) pour avancer.

## What Changes

Cette proposition ne modifie **aucune spécification produit** à ce stade. Elle établit :

- **Une organisation documentaire cible** ([design.md](design.md)) :
  - une seule couche normative (les chapitres) ;
  - un « domicile » unique pour chaque type de règle ;
  - des remplacements uniquement explicites et bidirectionnels ;
  - des documents de traçabilité marqués non normatifs ;
  - la frontière documentation / Figma préservée.
- **Une capacité de gouvernance** (`gouvernance-documentaire`) qui rend ces principes vérifiables.
- **Un premier lot de corrections** ([tasks.md](tasks.md)), découpé en :
  - **1A** : corrections sans décision produit et hors sources figées PRE-4 ;
  - **1B** : corrections rédactionnelles sur des sources figées PRE-4, soumises à accord explicite ;
  - **1C** : liste des décisions produit que Hermann doit prendre avant le lot 2.
- **Une deuxième passe**, sur la qualité de la spécification au regard des bonnes pratiques d'ingénierie des exigences ([qualite.md](qualite.md)).

**Hors périmètre :** code applicatif, Figma, push, workflows, EAS, migration des règles produit dans `openspec/specs/`, mise à jour des sources figées PRE-4 sans décision.

## Capabilities

### New Capabilities

- `gouvernance-documentaire` : règles qui rendent la documentation fonctionnelle de KODJO maintenable et non ambiguë. Elles couvrent :
  - le statut des documents ;
  - la référence unique de chaque règle ;
  - le remplacement explicite des décisions ;
  - les identifiants stables ;
  - les liens valides ;
  - la séparation entre comportement et rendu visuel.

### Modified Capabilities

(aucune : `openspec/specs/` est vide)

## Impact

- **Documentation :** `docs/` et `docs/Specifications-fonctionnelles/`. Aucun fichier n'est modifié avant validation du lot par Hermann.
- **PRE-4 :** les chapitres 01, 04 à 13 et 5 DSF ou matrices sont des sources figées de PRE-4 (`caa2a5cf`). Les tâches qui les touchent sont isolées en 1B et exigent une décision explicite.
- **PR ouvertes #363, #370 et #371 :** l'ordre de fusion doit être coordonné avec le lot 1B, car ces PR touchent les mêmes fichiers.
- **Outil :** OpenSpec 1.14.2, utilisé ici comme processus de changement documentaire. Il ne constitue pas une seconde source normative.
