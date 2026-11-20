# 2026-11-20 — Cartes de l'Agenda : symbole des zones et repère « P »

## Identifiant et objectif

- **Mission** : AGENDA-CARTE-REPERES.
- **Demande de Hermann** (en conversation, 20/11/2026) : « Cartes de l'agenda : mettre le symbole de la zone corporelle avant le texte de la deuxième ligne, mettre le symbole du Parcours après le nom, pas avant, et affiner le trait du cercle ».
- **Branche** : `planification/ce-ui-12-20261118`.
- **Commit de départ** : `958ba417`.

## Périmètre

| Point | Traité |
|---|---|
| Symbole des zones corporelles devant la ligne 2 | Oui : pastille `card-body-zone-badge`, la même que la carte du Journal, écart de 4 ; absente quand la ligne est vide |
| Repère « P » après le nom | Oui : le nom prend sa largeur, au plus la place disponible, et le « P » le suit à 4 |
| Trait du cercle affiné | Oui : 1 au lieu de 1,5 |

## PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE** :
  - carte du Journal : `ParcoursBadge` garde, par défaut, sa position devant le nom et son trait de 1,5. Le Journal n'est pas cité, donc il n'est pas modifié ;
  - tailles, couleurs, zones tactiles, états et actions de la carte de l'Agenda inchangés.
- **CHANGE** :
  - `RoutineAgendaCard` : ordre nom puis « P », ligne 2 avec la pastille ;
  - `ParcoursBadge` : options `placement` et `stroke`, valeurs par défaut identiques à l'existant.
- **FORBIDDEN** : aucune primitive ni aucun composant natif modifiés.

## Hypothèses

1. **Trait de 1** : valeur technique, aucune maquette.
2. **Journal** : non modifié. Si Hermann veut le même repère au Journal, c'est une demande distincte.

## Tests

- `CalendarWeekScreen.integration` : test du déployé complété (« P » après le nom, trait de 1).
- `npx jest src/features/planning` : vert.
- Suite complète (`npx jest -w 2`) : 412 groupes de tests réussis sur 412, 6 283 tests réussis, 32 ignorés.
- `tsc` et `eslint` : aucune erreur.
- **À vérifier sur iPhone** : alignement de la pastille avec la ligne 2 ; place du « P » quand le nom est long (le nom est raccourci, le « P » reste visible).

## Synchronisation

- **Classe B** (demande de Hermann) : registre ch07 et DSF Agenda annotés.

## Fichiers modifiés

- `src/features/planning/RoutineAgendaCard.tsx`
- `src/features/planning/ParcoursBadge.tsx`
- `src/features/planning/__tests__/CalendarWeekScreen.integration.test.tsx`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/DSF-AGENDA-PLANNING-2026-11-19.md`
- ce rapport

## Commit final et état Git

- **Commit** : celui qui contient ce rapport.
- **État Git** : propre après commit ; branche ni envoyée sur GitHub ni fusionnée.
