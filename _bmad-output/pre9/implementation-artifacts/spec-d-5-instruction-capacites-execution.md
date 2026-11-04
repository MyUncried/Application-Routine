# D.5 — Instruction des capacités d'exécution (document, sans code)

Story PRE-9, epic D. Autorisation : mission de Hermann « KODJO — PRE-9 : lancement du développement BMAD » (29/10/2026). Plan : `../planning-artifacts/epics.md` § D.5. Dépend de : D.3 (`done`). Cadrage : `docs/KODJO-Strategie-PRE9-PRE10-PRE11-Cadrage-Moteur-2026-10-28.md` (`10b4d6ee`, lu sans fusion, non décisionnel) §3, dimensions 3 à 10 ; les dimensions 1 et 2 (structure et ordre) sont livrées par A.1 et D.1.

Méthode : pour chaque dimension, la règle source, la capacité minimale attendue du moteur, les Formats concernés, l'état (**DÉFINI** / **PARTIELLEMENT DÉFINI** / **NON DÉFINI**) et la conséquence pour PRE-10 (socle commun) ou PRE-11 (Formats spécialisés). Aucune règle n'est inventée : un cas sans source est NON DÉFINI. Les données par Format sont celles des descripteurs (D.3, `src/domain/sessions/formats/capabilities.ts`, table dans `spec-d-3-descripteurs-capacites.md`). Ce document ne vaut ni décision ni engagement de conception.

## Dimensions 3 à 10

| # | Dimension | Règles sources | Capacité minimale | Formats | État | Conséquence |
|---|---|---|---|---|---|---|
| 3 | Gestion du temps | Étape Durée (ch08 l.504-560) ; fenêtre à échéance indépendante de la fin du travail (FMT-23) ; échéance globale AMRAP (FMT-26) ; rang par horloge Death by (FMT-33) ; chronomètre For time (FMT-32) ; horloge indépendante de l'audio (ch09 l.603) ; horodatages de référence (RM-067) | Plusieurs références temporelles par élément : étape, fenêtre de l'élément, échéance de l'élément, chronomètre de l'élément, calculées depuis des horodatages | Tous ; fenêtre : EMOM, Death by ; échéance : AMRAP ; chronomètre : For time | **PARTIELLEMENT DÉFINI** : coexistence d'une fenêtre ou d'une échéance avec une série Durée, des phases ou des côtés non écrite (A2, R-02) | PRE-10 : modèle temporel qui n'exclut pas plusieurs références par élément ; PRE-11 : règles de coexistence après arbitrage |
| 4 | Déclencheurs de transition | Fin de cible, Suivant, échéance d'étape (ch08) ; échéance de fenêtre, appui = fin du travail qui révèle le repos sans avancer (FMT-24) ; borne de l'élément (FMT-26) ; arrêt déclaré (FMT-34) | Transitions commandées par la règle de l'élément courant : échéance, cible, Suivant, appui, borne, arrêt | Libre et départs : génériques ; Tabata, 30/30 : échéance ; EMOM : échéance, appui ; AMRAP : borne ; For time : cible, Suivant ; Death by : échéance, appui, arrêt | **DÉFINI** pour chaque Format ; **NON DÉFINI** à l'expiration : étape en cours à l'échéance AMRAP, suite après une fenêtre Death by non acquise (A4) | PRE-10 : déclencheurs génériques ; PRE-11 : déclencheurs par Format, A4 tranché avant |
| 5 | Progression dynamique | Plans finis développés (ch12 l.1828, D.1) ; AMRAP et Death by générés jusqu'à leur borne, sans liste infinie (ch12 l.1829, CE-FMT-05 §15) ; objectif Death by q0 + (rang − 1)·d (FMT-33) | Plan fini développé d'avance ; segment progressif pour AMRAP et Death by, développé à l'exécution | AMRAP (contenu répété), Death by (objectif dynamique) ; autres : fixe | **DÉFINI** | PRE-10 : consommer le plan fini et réserver le segment progressif (D.1, `PROGRESSIVE_SEGMENT`) ; PRE-11 : générateurs |
| 6 | Terminaison | Fin normale, Suivant confirmé → Partielle, arrêt → Interrompue (ch08 l.543, l.575, l.635) ; borne AMRAP (FMT-26) ; « Limite atteinte » / « Abandonner », état incomplet (FMT-34, FMT-38) ; travail accompli For time (FMT-32) | États de fin distincts : plan parcouru, borne, travail accompli, arrêt déclaré, interruption, abandon | Tous | **PARTIELLEMENT DÉFINI** : suite de la Séance après la fin d'un élément AMRAP ou Death by suivi d'autres éléments (A4, commun sous ARB-03) | PRE-10 : terminaison par élément distincte de la terminaison de Séance ; PRE-11 : enchaînement après un élément progressif, après arbitrage |
| 7 | Paramètres imposés | Constantes, réglables, calculés (FMT-03 à FMT-05, FMT-17) ; refus métier d'une constante modifiée (CE-FMT-04 §14) ; contraintes réappliquées après chaque édition (CE-FMT-03 §14) ; compatibilité avant toute mutation (ARB-24) | Registre et validité de configuration avant l'exécution | Tabata, 30/30 (constantes) ; EMOM, AMRAP, For time, Death by (réglables) | **DÉFINI** (registre C.1, validité D.4) ; défauts **NON DÉFINIS** (ARB-04) | PRE-9 : C.3, C.4 ; PRE-10 : lire l'instantané (D.2), sans réinterpréter |
| 8 | Résultats | Trois axes motif / résultat / achèvement (ch09 l.606, ch12 l.1833) ; tours réalisés AMRAP (FMT-26) ; temps For time (FMT-32) ; tours acquis + répétitions partielles, incomplet (FMT-37, FMT-38) ; historique inchangé par modification (FMT-06, FMT-39) | Résultat par élément formaté et par Séance, sur les trois axes ; résultats propres par Format | Tous ; propres : AMRAP, For time, Death by | **PARTIELLEMENT DÉFINI** : tour partiel AMRAP, issue d'une fenêtre EMOM non terminée, résultat spécifique d'un Tabata ou 30/30 partiel (A6) ; schéma physique = dépendance technique (ch09 l.606) | PRE-10 : trois axes génériques ; PRE-11 : résultats propres, A6 tranché avant |
| 9 | Interruptions et reprise | RM-066 (pas de gel en arrière-plan), RM-067 (horodatages, recalcul au retour), RM-068 / RM-069 (pauses de sécurité), RM-070 (validation sur appareils réels) ; R-01 (Pause / Reprendre, réinitialisation, Points d'arrêt et reprise face à la fenêtre continue, ch05 l.482) | Reprise fondée sur horodatages ; pause de sécurité ; comportement des commandes générales face aux fenêtres | Tous ; R-01 : EMOM, Death by (fenêtres), AMRAP (échéance) | **PARTIELLEMENT DÉFINI** : génériques DÉFINIS (RM-066…070) ; face aux fenêtres et échéances **NON DÉFINI** (R-01) | PRE-10 : mécanisme générique ; PRE-11 : R-01 tranché avant les Formats à fenêtre |
| 10 | Signaux d'exécution | Bip de cadence périodique, sans transition (D-308, D-310, D-313) ; fenêtre distincte du bip (ch10 l.1444) ; annonce vocale du nom de l'Exercice (ch10 l.1865) ; vibrations fonctionnelles réglables (ch10 l.2198) ; services audio et haptiques isolés (ch12 l.527) | Familles d'événements : interface, audio (bips, annonces), haptique ; synchronisation sur les événements du plan, jamais source du temps | Tous ; fenêtres : EMOM, Death by | **PARTIELLEMENT DÉFINI** : signaux génériques DÉFINIS ; signaux propres aux fenêtres et échéances (début, fin, repos révélé) non écrits | PRE-10 : bus d'événements par famille ; PRE-11 : signaux de fenêtre après décision |

## Cas réellement non définis, à présenter à Hermann

Seuls ces cas ne se résolvent pas par les règles existantes (`arbitrages-pre9.md` §3). Aucun ne bloque PRE-9 ; chacun ne bloque que le comportement d'exécution concerné.

| Question | Formats | Dimension | Avant |
|---|---|---|---|
| Suite de la Séance après la fin d'un élément AMRAP ou Death by suivi d'autres éléments | AMRAP, Death by | 4, 6 | PRE-11 |
| Étape en cours à l'échéance de l'élément | AMRAP | 4 | PRE-11 |
| Suite après une fenêtre Death by non acquise | Death by | 4 | PRE-11 |
| Tour partiel à l'échéance ; issue d'une fenêtre EMOM non terminée ; résultat spécifique d'un Tabata ou 30/30 partiel | AMRAP, EMOM, Tabata, 30/30 | 8 | PRE-11 |
| Coexistence d'une fenêtre ou d'une échéance avec une série Durée, des phases, des côtés (R-02) | EMOM, AMRAP, Death by | 3 | PRE-10 (n'exclut pas) / PRE-11 (règle) |
| Pause / Reprendre, réinitialisation, Points d'arrêt et reprise face à une fenêtre continue (R-01) | EMOM, Death by, AMRAP | 9 | PRE-11 |
| Death by à plusieurs Exercices (R-03) | Death by | 5 | PRE-11 |

## Synchronisation code / documentation

Document sans code ; aucune règle modifiée (classe A : synthèse des sources citées). Aucun document normatif touché.

## Annexe du 4 novembre 2026 — base Formats finale et dépendances du moteur

Source : mise à jour consolidée des écrans Formats du 04/11/2026 (§6 bis 2, §6 quater bis, §6 sexies) ; réalisation : `spec-reprise-formats-2026-11-04.md` § 5. Les correspondances ci-dessous complètent le tableau ; aucune capacité d'exécution n'est déclarée développée (`executionAvailable: false`).

| Capacité nouvelle | Formats | Configuration livrée (PRE-9) | Exécution |
|---|---|---|---|
| Buy-in / buy-out multiples, zones ordonnées, une seule exécution | AMRAP (buy-in), For time (buy-in, buy-out) | Rôle explicite `circuitRole`, zones, gardes ; D.1 For time (buy-in avant le tour 1, buy-out après le dernier) | PRE-10/11 |
| Buy-in AMRAP à l'échec, résultat saisi à la clôture du premier bloc | AMRAP | Max admis sur le buy-in ; descripteur `buyInResult: AT_FIRST_BLOCK_CLOSE` | PRE-11 |
| Incrément par tour dans l'unité de l'objectif (durée) | AMRAP | `incrementPerRound` en secondes pour un objectif en Durée | PRE-11 |
| Membres For time en Durée (durée fixe ajoutée au chrono), au moins un en Répétitions | For time | Mode conservé, `NO_REPETITIONS` en D.4 | PRE-10 |
| Charges par série (progression EMOM, par tour For time, fixe AMRAP) | EMOM, For time, AMRAP | Charges matérialisées par série dans les paramètres ; instantané figé | Lecture seule (aucun recalcul) |

[29/10 : ligne « Death by à plusieurs Exercices (R-03) » — à relire avec le tableau Départ / Incrément par mouvement du 04/11 (§4.3) ; non tranché ici.]
