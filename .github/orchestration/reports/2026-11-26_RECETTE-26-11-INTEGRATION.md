# Recette iPhone du 26/11/2026 (après-midi) — intégration des six paquets de correction

## Identifiant et objectif

- Demande de Hermann (26/11/2026) : « J'ai testé le cahier de recette "Programme". Corrige les écarts et les évolutions demandées. »
- Source : résultats du cahier en ligne (https://claude.ai/artifact/DYbwwvFJZPq2HHKm2W8dAy, base `results`) — lignes KO du 25 et du
  26/11 et note « constats » (b à i). Points déjà OK au cahier (nom de séance f, « Enregistrer » g) : non retouchés.

## Branche et commit de départ

- Base commune : `feat/exercice-libre-page-20261126` @ `30214251f` (lots 20 et 21).
- Paquet MOSAIQUE : base `recette/agenda-axe-20261124` @ `acf3703e8` (la mosaïque D-600 à D-602 n'existe que sur la recette).
- Branche d'intégration : `integration/recette-26-11` (worktree `C:\Dev\KODJO-R26-INTEG`).

## Périmètre traité (un rapport détaillé par paquet)

| Paquet | Branche | Dernier commit | Rapport |
|---|---|---|---|
| COMPO — glisser-pour-options (règle unique), cercle du rail, déplacement / hauteur | `fix/recette-26-11-compo` | `a5460d27a` | `2026-11-26_RECETTE-26-11-COMPO.md` |
| NOTIF — touchers bloqués après notification, exécution plein écran | `fix/recette-26-11-notif` | `6c154dee7` | `2026-11-26_RECETTE-26-11-NOTIF.md` |
| MODALE — en-tête, hauteur, clavier, Cadence Autre, valeurs vides, phases | `fix/recette-26-11-modale` | `dca804b29` | `2026-11-26_RECETTE-26-11-MODALE.md` |
| FORMATS — durée totale, Superset, tableaux, Renforcement, Death by, Progression, 4ᵉ angle | `fix/recette-26-11-formats` | `08c2d8a80` | `2026-11-26_RECETTE-26-11-FORMATS.md` |
| LIBRE — mouvement figé, recherche « Tes », barre du clavier des phases | `fix/recette-26-11-libre` | `a0fad5e04` | `2026-11-26_RECETTE-26-11-LIBRE.md` |
| MOSAIQUE — cadre gris, chronomètre, comptage des circuits (vérifié, conforme) | `fix/recette-26-11-mosaique` | `b58276ddb` | `2026-11-26_RECETTE-26-11-MOSAIQUE.md` (branche mosaïque) |

## Intégration

- Fusions dans l'ordre notif, libre, compo, formats, modale : code sans conflit (dont `ExecutionParametersSheet.tsx`, modifié par trois
  paquets) ; conflits uniquement dans le registre ch07 (lignes D-604, D-607, D-608 complétées par plusieurs paquets) : résolus par fusion
  à trois voies des insertions ; contrôle automatique que chaque complément de chaque branche est présent (0 manquant).
- `npx tsc --noEmit` : OK.
- Passe complète Jest : voir « Preuves et tests ».
- La branche MOSAIQUE se fusionne directement dans la recette (elle n'est pas portable sur la base commune).

## Preuves et tests

- `npx tsc --noEmit` : OK sur la branche intégrée.
- Suites ciblées de chaque paquet vertes (voir rapports).
- **Passe complète Jest : interrompue** (le système a arrêté le processus faute de mémoire, en même temps que Metro) ; à relancer.

## Hypothèses non démontrées / À CLARIFIER (consolidé)

1. COMPO : cause du déplacement / hauteur non reproduite (verrou de défilement unique pris à l'appui long : plausible). Autres listes à
   glissé (Catalogue des mouvements, des séances, Agenda, Journal, Programmes, For time) non branchées sur la règle unique : à décider.
2. NOTIF : cause plausible (présentation native ignorée pendant l'animation de retour), non démontrée sur appareil ; transition entre
   séances d'une routine en plein écran à observer.
3. MODALE : « clavier plus lent » impossible sans décaler la feuille du clavier (iOS impose la courbe) ; AMRAP : un exercice créé par la page
   du format sans volume croissant porte un incrément 0 enregistré, affiché « + 0 rép. » ; zone de l'indicateur d'accueil gardée.
4. FORMATS : « durée totale alignée à droite » appliquée à la durée de la séance dans la Composition (les pages de formats l'avaient
   déjà) ; Renforcement en alternance : nombre de séries commun ; accroche Superset ≥ 3 « après le tour ».
5. LIBRE : barre au-dessus du clavier des phases rétablie avec ses trois boutons (retirée le 31/10 à la demande de Hermann) ; « Tes » :
   cause retenue = liste non ramenée en haut (la recherche trouve bien « Tester »).
6. MOSAIQUE : comptage des mouvements des circuits vérifié sur SQLite réelle pour toutes les origines (5/5) ; le « 4 » de Hermann
   s'explique par le mouvement sans photo (réponse de Hermann).

## Vérifications restant à faire sur iPhone

Toutes : lignes du cahier (v suivantes des lignes KO et section « Recette 26/11 après-midi »).

## Fichiers modifiés

Voir les rapports de chaque paquet.

## Commit final et état Git

Renseignés dans le message de livraison.

## Réponses de Hermann (26/11/2026) aux interprétations du paquet FORMATS

1. Durée totale alignée à droite en noir = durée de la séance dans la zone de contexte de la Composition : **oui** (implémenté tel quel).
2. Renforcement en alternance, nombre de séries propre à chaque mouvement : **non** — nombre de séries commun (implémenté tel quel).
3. Accroche du Superset à partir de 3 mouvements « … récupération après le tour » : **oui** (implémenté tel quel).
4. Forme d'angle vide en bas à gauche seulement quand celle du bas à droite est affichée : **ok** (implémenté tel quel).
Aucune modification de code ; les compléments du registre (D-607, D-608) restent valables.
