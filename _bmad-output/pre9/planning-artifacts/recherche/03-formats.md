# PRE-9 — 03 — Matrice des Formats et compatibilité D-449 / D-451

Recherche en lecture seule, `pre9-bmad/plan` = `main @ 547bb7ef`, 28/10/2026. Aucune règle n'est inventée : toute case sans source porte « NON DÉFINI ». La stratégie (`scratchpad/pre9/strategie.md` §4–5) sert uniquement de cadrage.

## 0. Carte des sources (et un constat préalable)

| Abrév. | Source | Rôle |
|---|---|---|
| ch10 | `docs/Specifications-fonctionnelles/10 – …règles métier transverses.md` : FMT-01…42 (ancres `fmt-NN` l.1193–1402, ancre de FMT-n = l.1193+5(n−1)), recettes REC l.1404+, texte consolidé §3–§7 l.1448–1556, RM-066…070 l.1594–1600, SU-01…08 l.43–52 | **Texte normatif actif** |
| ch08 | `08 – Conception…` l.471–474 (`#formats-conception`), l.305 (phases/format), l.504 (portée Formats), l.510–512 (cycle D-451) | Pointeur + exécution générique |
| ch09 | `09 – Modèle de données…` l.589–606 (`#formats-donnees`) | Données |
| ch11 | `11 – API…` l.307–323 (`#formats-api`) | Opérations |
| ch12 | `12 – Architecture…` l.1824–1834 (`#formats-architecture`) | Moteur futur |
| ch13 | `13 – Contrats d'écran.md` CE-FMT-01…06, l.2301 / 2386 / 2471 / 2556 / 2646 / 2735 | Écrans |
| ch03/04 | `03` l.642–651 (`#formats-parcours`) ; `04` l.472–487 (`#formats-modele`) | Parcours, modèle |
| ch05 | `05 – Versions…` l.478–486 « Combinaisons dont la règle reste à préciser » (R-01…R-04) | Réserves |
| ch07 | Registre : D-357…D-369 l.933–953 ; D-378 l.850 ; D-449 l.1083–1093 ; D-451 l.1130–1133 ; complément 28/10 l.1135–1146 | Décisions |
| DSF / MAT / REV | `docs/DSF-FORMATS-…`, `MATRICE-FORMATS-…`, `REVUE-COHERENCE-FORMATS-…` (14/10) | Rendu, traçabilité, écarts F-01…04 / R-01…05 |
| V2 / INV | `docs/sources/formats-2026-10-14/concept-V2.md`, `inventaire-ecrans.md` | **Historiques**, amendés (MAT l.98) |
| SU | `docs/KODJO-Seance-Objet-Unique-Decisions-2026-10-26.md` (D-449) | Séance objet unique |
| COMP | `docs/KODJO-Composition-conteneurs-2026-10-28.md` (D-451) | Conteneurs |
| CARTE | `docs/KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md` | Carte, nom de séance (§8) |

**Constat C0 — référence rompue (qualification : référence rompue, sans perte de fond).** ch08 l.474 déclare « Source normative : la présente section, issue de la spécification Formats du 14/10 » et renvoie à une URL GitHub figée (`3623466a…/SPECIFICATION-FORMATS-SEANCES-2026-10-14.md`). Ce fichier a été supprimé de `main` par `7a89220f` (« consolider les spécifications dans les chapitres 01 à 13 », 14/10) ; la section ch08 n'a plus de corps (l.474 est suivie de « ## Exécution »). Le texte normatif se trouve désormais dans ch10 (FMT-01…42 + §3–§7 l.1448–1556) ; les raccordements §14.2 sont dans ch05 l.478–486. Le §8.2 historique (« Ne pas imposer un total prévisionnel chiffré au Death by… », « aucune phase ne peut être ajoutée silencieusement au-delà d'une formule normative de fenêtre ») n'a été retrouvé dans aucun chapitre actif, seulement dans l'objet git `3623466a` (l.197–203). Proposition : corriger le renvoi de ch08 vers ch10 et vérifier où vit le §8.2 (lot documentaire à valider par Hermann).

## 1. Matrice par modèle

### 1.1 Paramètres (imposé / réglable / calculé / libre / défaut)

États de verrouillage définis par les sources : **verrouillé** = constante effective, visible, grisée, non modifiable, raison lisible, jamais de tiret (DSF §3 l.19–23 ; FMT-17 l.1273 ; CE-FMT-04 §14 « refuser une modification des constantes au niveau métier ») ; **réglable** = réglage de séance éditable après composition (FMT-04 l.1208, D-357) ; **calculé** = dérivé, jamais saisi, pas une seconde prescription (FMT-05 l.1213 ; ch09 l.604) ; **libre** = paramètre d'exercice ordinaire ; **non applicable** = contrôle absent (ex. pas de segment For time, FMT-31) ou tiret pour une donnée réellement sans effet (DSF l.23). V2 ne connaissait que deux états, verrouillé/libre (V2 l.46), et réglages « choisis une fois » : **remplacé** par FMT-04 (spéc. hist. §12 ; ch07 l.952).

| Modèle | Verrouillé (constante) | Réglable (séance) | Calculé | Libre (exercice) | Défauts | Sources |
|---|---|---|---|---|---|---|
| Tabata | Mode Durée, 8 séries/exercice, 20 s/série, pause 10 s après chaque série | Répétition de l'ensemble (« distincte des huit séries ») ; Exécution Par exercice / En alternance si ≥ 2 exercices | Durée totale (ex. 2 × 8 × 30 s = 480 s) | Exercices ; récupération après exercice (V2 l.50) ; étiquette | Constantes = valeurs ; répétition de l'ensemble : 1 dans la copie illustrée (FMT-12), **défaut NON DÉFINI** | FMT-10…18 (l.1238–1278), ch10 l.1487, D-358…360 |
| Intervalles 30/30 | 30 s travail, 30 s pause | Compte (jamais une durée globale) ; récupération éventuelle « selon SRC-01 » | Durée déduite des occurrences | Exercices, récupération (V2 l.51) | **NON DÉFINI** ; nombre de séries par exercice **NON DÉFINI** ; organisation **NON DÉFINIE** (sélecteur décidé seulement pour Tabata/EMOM/Progression, ch10 l.1495) | FMT-19 (l.1283), FMT-27, D-362 ; F-03 (capture à 20 s) |
| EMOM | Fenêtre identique pour tous les exercices ; repos résiduel non réglable | Durée de fenêtre (W), nombre de tours (N), organisation | Durée bloc = N × E × W, en direct | Exercices ; objectif de répétitions (déclaratif, V2 l.52, l.61) | **NON DÉFINI** (60 s / 6 tours = exemples REC-10) | FMT-20…25 (l.1288–1313), D-361 |
| AMRAP | Fin par durée ; circuit de séries et séries variables exclus | Durée imposée réglable | — (tours réalisés = résultat) | Exercices, répétitions par exercice (V2 l.53) | **NON DÉFINI** | FMT-26 (l.1318), ch10 l.1517, D-362 |
| For time | Volume fixé ; pas de segment d'organisation | « Volume par tour » (échelle) ; nombre de tours lié à l'échelle | Temps = résultat (aucune durée prévue) | Exercices | 21 · 15 · 9 = exemple normatif de phrase ; **défaut NON DÉFINI** | FMT-30…32 (l.1338–1348), ch10 l.1532–1534, D-366 |
| Death by | Fenêtres cadencées ; fin par arrêt déclaré | Fenêtre (W), départ (q0), incrément (d) | Rang = floor(t/W)+1 ; objectif = q0 + (rang−1)·d | Exercices | Cas de référence 1 puis +1 par minute (FMT-33) ; **défaut formel NON DÉFINI** | FMT-33…38 (l.1353–1378), ch10 l.1545, D-364/367/368 |
| Renforcement, Gainage · Mobilité, Superset, Progression, À l'échec | Rien | Tout (préremplissage modifiable) | Calculs Libre habituels | Tout | Exemples : 3 × 15, postures, deux exercices enchaînés, 10 · 12 · 14, trois séries à l'échec = préremplissages, pas des constantes | FMT-28 (l.1328), ch10 l.1524, V2 l.33–37, l.59 |
| Libre | Rien | Tout | Calculs Libre | Tout | — | FMT-28 ; CE-FMT-01 §8 « Libre → composition existante » |

### 1.2 Structure admissible, organisation et flux

| Modèle | Structure / organisation admise | Flux sélection → paramètres → récap → composition | Sources |
|---|---|---|---|
| Tabata | Par exercice : A1…A8 puis B1…B8 (copie à 1 tour, cartes `8 × 20 s`) ; En alternance : A1 B1…A8 B8 via le circuit de séries (alternées) ; 1 exercice : pas de question | Inclut une sélection d'exercices ; CE-FMT-01 → CE-FMT-02 (paramètres/récap, « Exécution » en dernière ligne après Durée totale) → CE-FMT-03 → CE-FMT-04 (modale grisée) | FMT-11…15, ch03 l.645–647, INV l.26–33 |
| 30/30 | Circuit de tours (V2 l.28) ; multi-circuit/cycle : **NON DÉFINI** | Même famille d'écrans (CE-FMT-02/03/04) | V2 l.28, MAT FMT-19 |
| EMOM | Par exercice (6 fenêtres A puis 6 B) ou alternance ; sans multiplication supplémentaire série × tour | CE-FMT-02 sans champ durée éditable | ch10 l.1506, FMT-20, CE-FMT-02 §12 |
| AMRAP | « Le circuit est répété » ; circuit de séries et séries variables exclus | Idem | FMT-26, ch10 l.1517 |
| For time | Échelle par tour : A21 B21 A15 B15 A9 B9 ; pas de segment | CE-FMT-02 sans segment | FMT-30/31, ch10 l.1532 |
| Death by | Fenêtres successives ; plusieurs exercices : **R-03 non raccordé** | Idem + CE-FMT-05/06 à l'exécution | FMT-33, ch05 l.484 |
| Départs rapides | Progression : Par exercice (A10 A12 A14 puis B…) ou En alternance (A10 B10 A12 B12…), valeurs par série ; autres : structure libre | 3 écrans (pas de modale spécifique, INV l.33) ; parcours non identique à celui des formats (ch03 l.646) | FMT-29 (l.1333), D-363 |
| Libre | Toute structure Composition (D-451) | Composition existante directement | CE-FMT-01 |

Choix des exercices préremplis hors Tabata : **NON DÉFINI** (seule la sélection Tabata est explicitement mentionnée, ch03 l.646). Raccordement de l'entrée Formats au menu de Composition : **explicitement reporté** (COMP l.64 : « Les formats comme autre porte d'entrée restent reportés à la définition des formats »).

### 1.3 Validation, édition/duplication, persistance

| Sujet | Règle | Source |
|---|---|---|
| Identité du format | Fixée à la création ; pas de conversion par édition ordinaire ; aucun format déduit d'un titre | FMT-03, FMT-40, CE-FMT-01 §14, ch11 l.312 |
| Validation des réglages | Bornes normatives existantes ; aucune borne déduite de Figma ; échelle/unité cohérentes ; refus d'une constante modifiée, d'un format incompatible, d'une fenêtre obsolète | CE-FMT-02 §14, CE-FMT-04 §14 |
| Validation de la composition | ≥ 1 exercice valide ; pas de double multiplication ; « contraintes réappliquées après édition » | CE-FMT-03 §14 |
| Changer l'organisation | Tabata/EMOM/Progression ; interdit For time ; volume conservé ; le segment change l'ordre, pas le volume | ch11 l.313, CE-FMT-02 §12 |
| Édition après composition | Réglages autorisés éditables, recalculs en direct ; EMOM : ajouter/retirer un exercice conserve N, recalcule la durée | FMT-04/05/22, D-357 |
| Phases sous format | Toutes les durées de phase éditables, aucune dernière phase calculée, aucune adaptation proportionnelle (format n'impose que mode, cible, séries) | ch08 l.305 ; ch07 l.956, l.1038 (PHC-20261026, D-446) |
| Duplication d'une séance à format | **NON DÉFINI** spécifiquement (règles générales de duplication ch09 l.617) | — |
| Reprise d'une séance à format dans une autre (D-449 §3) | **NON DÉFINI** (voir I-7) | SU §3 l.23–30 |
| Persistance | Séance : format facultatif, origine, réglages, organisation ; instantané : format, origine, réglages effectifs, prescription, version de règle ; phrase jamais persistée | ch09 l.593–598, FMT-42, CE-FMT-03 §15 |
| Historique | Modifier la séance ne touche ni paramètres ni résultats passés | FMT-06, SU-07 |
| Nom de séance | « À l'ouverture, nom de son format, gris, non modifiable » ; 1er exercice → nom de l'exercice ; 2e → invite | CARTE §8 l.99–105 (décision du 27/10) ; V2 l.143 (point ouvert historique) |

### 1.4 Exécution : expansion, horloges, transitions, progression, résultats

| Modèle | Expansion du plan | Horloges / événements | Transition et fin | Progression | Résultat prévu / partiel |
|---|---|---|---|---|---|
| Tabata | Finie, déroulée (ch12 l.1828) | Séries Durée 20 s + pause 10 s ; « rythme imposé, bip indicatif » (V2 l.131) | Fin de série à échéance (règle Durée) ; fin au compte | Fixe | Générique Terminée/Partielle/Interrompue (ch08) ; spécifique **NON DÉFINI** |
| 30/30 | Finie | 30 s + 30 s | Idem | Fixe | Idem |
| EMOM | Finie (N × E fenêtres) | Fenêtre à échéance indépendante de la fin du travail ; fenêtre ≠ bip de cadence ; horloge ≠ audio | Transition à l'échéance seulement ; appui = fin du travail, révèle le repos, n'avance pas | Fixe | Fenêtre non terminée : la suivante démarre, aucun repos positif inventé (FMT-23/25) ; résultat d'une fenêtre non terminée **NON DÉFINI** |
| AMRAP | Progressive jusqu'à la borne (ch12 l.1829) | Échéance globale | Arrêt à la durée (REC-15) ; étape en cours à l'échéance **NON DÉFINI** | Répétition du contenu | Tours réalisés = résultat (FMT-26) ; tour partiel **NON DÉFINI** |
| For time | Finie (prescription bornée par le travail) | Chronomètre ; « le plus vite possible » n'interdit pas la pause ; commandes générales applicables | Fin à l'accomplissement du travail ; limite de temps : **aucune règle** | Fixe (échelle par tour) | Temps nécessaire = résultat (FMT-32) |
| Death by | Progressive, pas de liste infinie précréée (CE-FMT-05 §15) | Rang par horloge ; échéances ; identités de fenêtre idempotentes | Appui acquiert au plus 1 tour ; fenêtre sans appui non acquise ; un seul bouton → « Limite atteinte » / « Abandonner » | **Dynamique** : objectif = q0 + (rang−1)·d | Tours acquis + répétitions partielles (formulaire à 0) ; motif ; achèvement toujours incomplet (FMT-37/38, D-368) ; suite après une fenêtre non acquise : **NON DÉFINI** |
| Départs rapides / Libre | Finie (moteur Libre) | Règles Libre (bip, phases, pauses) | Règles génériques (ch08 l.504–560) | Fixe (Progression = séries variables prescrites) | Générique |

Commun : phases Compte à rebours/Fin d'exercice exclues des séances (FMT-41) ; instantané au démarrage (ch08) ; réserves R-01 (Pause/Reprendre/reset/points d'arrêt face aux fenêtres), R-02 (côtés dans la fenêtre), R-03 (Death by multi-exercices), R-04 (éditeur Volume par tour) — ch05 l.482–485, REV l.42–52 : « pas des blocages globaux », à clore avant le comportement concerné.

## 2. Incompatibilités entre les spécifications Formats du 14/10 et D-449 / D-451

D-451 (ch07 l.1132) : « plusieurs cycles successifs, chacun composé de circuits et d'exercices et muni de son compte […] Cycles visibles et multi-circuit entrent dans le MVP. Remplace RM-025/RM-028, DM-003/DM-004 […] Le modèle ne crée plus de cycle technique implicite. » D-449 (ch07 l.1085) : « Pauses, récupérations, côtés, charges, formats […] conservent leurs règles existantes » (SU l.62). Aucune décision ultérieure ne modifie les règles Formats elles-mêmes.

| # | Passage du 14/10 | Hypothèse implicite | Qualification | Résolu par une décision ultérieure ? |
|---|---|---|---|---|
| I-1 | FMT-12 : « La configuration illustrée comporte un circuit d'un tour […] Le réglage de répétition de l'ensemble reste distinct des huit séries » ; FMT-13 : « Le circuit de séries existant exprime cette organisation » | Un circuit unique porte tout le Tabata ; « l'ensemble » = ce circuit | Ambiguïté : avec D-451, « répétition de l'ensemble » peut être le compte du circuit ou celui du cycle visible (1..99) | **Non** |
| I-2 | FMT-21 / ch09 l.604 : « durée = nombre de tours × nombre d'exercices × durée de fenêtre » | Un bloc unique où tous les E exercices partagent N | Contradiction potentielle : avec plusieurs circuits, exercices directs et cycles, N et E ne sont plus uniques | **Non** |
| I-3 | FMT-26 : « Le circuit est répété jusqu'à l'échéance globale » | Circuit unique ; répétition ouverte du conteneur | Ambiguïté : quel conteneur boucle (circuit, cycle, séance) ? Le compte de cycle 1..99 (D-451) est-il remplacé par la borne ? | **Non** |
| I-4 | FMT-30/31 : « Volume par tour », « Les trois valeurs décrivent trois tours » | Un seul compte de tours pour la séance | Ambiguïté : plusieurs circuits aux comptes différents, exercices directs hors circuit | **Non** (R-04 ne couvre que l'éditeur) |
| I-5 | ch10 l.1545 : « temps actif t depuis le départ du bloc » ; FMT-33 rang global | Un bloc Death by unique | Ambiguïté aggravée par le multi-conteneur ; déjà R-03 pour le multi-exercice | **Non** |
| I-6 | ch09 l.597 / CE-FMT-03 §15 : « Ne pas réécrire ActivityDefinition du catalogue » ; INV l.32 « Modification activité » | Exercice autonome de catalogue | Terminologie périmée (D-449 remplace l'exercice autonome ActivityDefinition et la voie ACTIVITY, ch07 l.1089) ; l'intention (ne pas muter la source partagée → Mouvement) reste valable | **Oui sur le fond** (D-449) ; vocabulaire à aligner |
| I-7 | — (silence) | — | Lacune : D-449 §3 (« Reprendre une séance ») n'exclut que les « réglages propres de début et de fin » ; le sort du format/des réglages de format lors de l'insertion d'une séance Tabata dans une Libre ou dans un EMOM n'est pas défini | **Non** |
| I-8 | CE-FMT-03 §14 « Contraintes réappliquées après édition » ; §16 « pas de mouvement de conversion du format ajouté » | Composition plate | Lacune : ajout de cycle/circuit, exercice direct, déplacement (COMP l.60–72) dans une séance à format — contraintes applicables **NON DÉFINIES** ; COMP l.64 reporte explicitement l'entrée Formats | **Non** (report explicite) |
| I-9 | ch10 l.1517 : AMRAP exclut circuit de séries et séries variables | Restriction de structure par format | Compatible avec SU-08 (natures conservées) ; renommage 28/10 « séries groupées/alternées » (ch07 l.1141) à refléter | Compatible ; vocabulaire |
| I-10 | CARTE §8 : nom du format à l'ouverture puis nom du 1er exercice | Séance qui démarre vide | Ambiguïté : une séance de format créée préremplie (Tabata) garde-t-elle le nom du format ? V2 l.143 laissait ce point ouvert | **Non** |
| I-11 | DSF l.33–37 (phases : dernière phase calculée, adaptation proportionnelle, D-372/D-374) | — | Contradiction réelle, hors D-449/451 : remplacée par PHC-20261026/D-446 (ch08 l.305, ch07 l.956/1038) ; DSF non annoté | **Oui** (D-446) ; DSF à annoter |
| I-12 | Complément 28/10 (ch07 l.1142) : cible 0 autorisée à toute position, étape sautée | — | À vérifier : application aux constantes Tabata (non, verrouillées) et à l'échelle For time (0 dans « Volume par tour ») **NON DÉFINI** | Non |
| I-13 | ch08 l.512 (générique) : « Exercices placés après le Circuit […] après le dernier Tour du Circuit » | Circuit unique | Formulation résiduelle ; l.510 (D-451, RM-252) couvre déjà le cas | Oui (D-451) ; rédaction à harmoniser |

Point compatible : FMT-11 (« avec un exercice unique la question est inutile ») et D-449 (séance à un exercice) ; Death by « séries nées au fil de l'exécution » (V2 l.42) et SU-08 (« nombre de passages dérivé, jamais paramètre de saisie »).

## 3. Questions A1–A7 de la stratégie

PRE-10 = moteur limité à Libre et aux compatibilités structurelles (stratégie §3, l.73) ; règles précises par Format = PRE-11.

| ID | Règle existante (source) | Classement | Avant PRE-10 ? |
|---|---|---|---|
| A1 Expansion progressive | Oui : « Les plans à compte fini peuvent être déroulés ; AMRAP/Death by doivent générer leurs passages progressivement jusqu'à leur borne » (ch12 l.1829) ; « occurrences finies ou générateur progressif » (ch11 l.315) ; « pas de liste infinie de fenêtres précréée » (CE-FMT-05 §15) ; REV l.17 | **DÉJÀ DÉCIDÉ** (capacité) ; politique AMRAP × cycles (I-3) À CLARIFIER | Capacité : oui, déjà acquise. Politique par format : PRE-11 |
| A2 Horloges multiples | Partiel : fenêtre à échéance ≠ bip d'exercice, horloge ≠ audio (ch12 l.1829 ; ch10 l.1444 ; FMT-23) ; échéance globale AMRAP (FMT-26) ; Death by rang par horloge. Coexistence échéance globale/fenêtre + série Durée, phases, côtés : non écrite (R-02) | **À CLARIFIER** + DÉPENDANCE TECHNIQUE | Oui : confirmer que le modèle temporel PRE-10 n'exclut pas la superposition (les sources la supposent sans l'énoncer) |
| A3 Déclencheurs | Familles présentes : échéance (FMT-23), appui non transitif (FMT-24/35), Suivant / fin de cible (ch08 confirmations), borne globale (REC-15), arrêt déclaré (FMT-34), Pause/Arrêter (ch08). Portée de Pause/reset/Suivant sur fenêtre : R-01 ouvert (ch05 l.482 ; CE-FMT-05 §16) | **DÉJÀ DÉCIDÉ** (familles) ; R-01 À CLARIFIER | Familles : oui, acquises. R-01 : avant le développement EMOM/Death by (PRE-11) |
| A4 Fenêtre expirée pendant une étape | EMOM : fenêtre suivante, pas de prolongation ni de repos inventé (FMT-23/25, REC-13) ; Death by : fenêtre sans appui non acquise (FMT-36). Suite après échec Death by, étape en cours à l'échéance AMRAP, limite For time : aucune règle | **À CLARIFIER** (par format) | Représentabilité (étape partielle interrompue par borne) : oui ; règles précises : PRE-11 |
| A5 Adaptation en cours d'exécution | Instantané figé (FMT-06, SU-07, ch08 « Démarrage ») ; plan « jamais manipulé directement par l'utilisateur » (ch08 « Déroulement d'une séance ») ; progression prescrite Death by par formule (FMT-33) ; reset générique (ch08) | **DÉJÀ DÉCIDÉ** | Déjà acquis |
| A6 Exécution partielle et motif | Trois axes motif/résultat/achèvement (ch09 l.606, ch12 l.1833 ; V2 l.86–92 historique, amendé pour Max) ; Death by complet (FMT-37/38) ; statuts génériques Terminée/Partielle/Interrompue (ch08). Tour partiel AMRAP, issue d'EMOM : aucune règle | Concept **DÉJÀ DÉCIDÉ** ; schéma physique = **DÉPENDANCE TECHNIQUE** (ch09 l.606 « son raccordement au schéma physique doit conserver les trois axes ») ; AMRAP/EMOM À CLARIFIER | Schéma minimal à 3 axes : oui |
| A7 Interruptions / arrière-plan / reprise | RM-066/067 (horodatages, recalcul), RM-068/069 (pauses de sécurité), RM-070 (appareils réels) l.1594–1600 ; pause en cadence → dernier intervalle complet (ch08) ; idempotence fenêtre (REC-27, ch11 l.321) ; politique pause/fenêtre = R-01 | Invariants **DÉJÀ DÉCIDÉS** ; fenêtres À CLARIFIER (R-01) ; natif = DÉPENDANCE TECHNIQUE | Invariants : oui (existants). R-01 : PRE-11 |

Aucune question A1–A7 n'est HORS PÉRIMÈTRE en totalité ; leurs volets « règle précise par format » relèvent de PRE-11.

## 4. Départs rapides : simples préremplissages Libre ?

Oui, selon les sources : « Renforcement, Gainage · Mobilité, Superset, Progression, À l'échec et Libre ne font que préremplir une séance libre. Aucun verrouillage métier ne provient de cette origine » (FMT-28, ch10 l.1328) ; l'origine « classe la provenance, sans imposer à lui seul de comportement » (FMT-02) ; « ne verrouillent rien : toutes les colonnes sont libres » (V2 l.59) ; REC-01. Correspondance avec les capacités Libre existantes (V2 l.33–37, ch10 l.1524) :

| Départ | Contenu prérempli (source) | Capacité Libre utilisée | Capacité moteur nouvelle |
|---|---|---|---|
| Renforcement | 3 séries, pause entre séries (ex. 3 × 15) | Séries identiques, pause | Aucune |
| Gainage · Mobilité | Postures tenues, pas de répétitions | Mode Durée | Aucune |
| Superset | Deux exercices enchaînés sans pause | Circuit, récupération 0 | Aucune |
| Progression | 10 · 12 · 14, Par exercice / En alternance, répétitions par série | Séries variables ; séries groupées/alternées | Aucune (la charge additionnelle est hors périmètre, ch10 l.1524) |
| À l'échec | 3 séries à cible À l'échec | Cible À l'échec par série (SRC-06), « pas un troisième mode ni un format » (ch10 l.1471) | Aucune |

Restes à préciser (hors moteur) : valeurs exactes et exercices préremplis (les exemples ne sont « pas des constantes », ch10 l.1524) ; écran « paramètres » d'un départ rapide (INV l.33 : 3 écrans) sans contrat propre distinct de CE-FMT-02. État du code : `src/features/sessions/sessionFormats.ts` (PRE-8, Q-E5) expose les vignettes, seul Libre est disponible, aucun format persisté.

## 5. Hypothèses non démontrées et limites

- Les PR documentaires ouvertes n'ont pas été consultées (`gh` non utilisé) ; un écart signalé ici peut être traité dans une PR non fusionnée.
- « Par exercice » Tabata = circuit groupé à 1 tour est une lecture de FMT-12/13 et du renommage du 28/10, pas une règle écrite sous ce vocabulaire.
- Les numéros de ligne de ch10 FMT sont ceux des ancres `fmt-NN` ; le texte de la règle suit de 2–3 lignes.
- Le défaut de l'origine « Libre » (structure, nombre de tours) n'est défini que par V2 (« Au choix / Nombre de tours », l.38), source historique.

> Correctif de citations (revue indépendante du 28/10) : ch11 l.311 → l.312, l.314 → l.315 ; la citation « ch11 l.319 » pour la validation a été retirée (l.319 porte « Générer les modalités »).
