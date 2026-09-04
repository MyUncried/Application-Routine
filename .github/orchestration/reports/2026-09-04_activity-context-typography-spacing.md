# Typographie et espacement du contexte Activité

Date : 2026-09-04  
Périmètre : documentation et contrôle Figma. Aucun code applicatif modifié.

## Règle canonique

- contexte `Séance · {nom de séance}` : Inter Regular `14/17` ;
- champ `Nom de l’activité` : inchangé, valeur `18/22` Semi Bold ;
- espacement sous le champ : `spacing/16`, explicitement porté par le padding inférieur du bandeau/shell ;
- la synthèse d’Activité reste en `14/20` : elle constitue un usage distinct et n’est pas concernée par la correction.

## Contrôle Figma

Référence contrôlée : `Création activité — Durée / Pause / Séries — avec mode` (`1992:9132`).

| Élément | Nœud | Valeur constatée | Verdict |
| --- | --- | --- | --- |
| Contexte de séance | `3261:4152` | Inter Regular, `14/17`, hauteur `17` | Conforme |
| Bandeau bleu | `3261:4151` | `402 × 115`, padding bas `16` | Conforme |
| Champ Nom | `3261:4153` | `y=53`, hauteur `46`, bas à `99` | Inchangé |
| Marge champ/bas du bandeau | — | `115 − 99 = 16` | Conforme à `spacing/16` |
| Token | `spacing/16` (`VariableID:2290:73`) | alias de `dimension/16` (`VariableID:2290:26`) | Conforme |

## Écart transversal constaté

Dans les anciennes frames de Catalogue et de Composition, les boutons `+ Créer` et `+ Ajouter une activité` laissent actuellement `13` points sous leur boîte visuelle de `32` points dans une zone de `53` points. Cette géométrie manuelle n’est pas retenue comme valeur canonique. La documentation prescrit désormais `spacing/16` pour les futures mises en conformité de ces actions.

## Documents corrigés

- `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md` ;
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` ;
- `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md` ;
- `docs/Specifications-fonctionnelles/12 – Architecture technique.md` ;
- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`.

Statut : `ACTIVITY_CONTEXT_14_17_AND_SPACING_16_DOCUMENTED`
