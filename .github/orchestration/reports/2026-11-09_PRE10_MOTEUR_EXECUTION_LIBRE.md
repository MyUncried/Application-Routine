# PRE-10 — Analyse du moteur d'exécution et développement de l'Exécution Libre

## Identification

- **Mission** : « Projet KODJO — Analyse de l'architecture du moteur d'exécution et développement de PRE-10 » (Hermann, 09/11/2026), complétée en cours de mission par la demande de comparer une architecture « programme compilé + interpréteur ».
- **Objectif** : établir le point de départ PRE-9, faire l'analyse critique ciblée de la conception consolidée, développer PRE-10 (noyau, runtime, Exécution Libre) et qualifier les contrats du noyau avec des politiques de test AMRAP/EMOM.
- **Référence** : `docs/preparation/moteur-execution/KODJO-Conception-moteur-execution-consolidee-2026-11-02.md` (actualisée au 05/11, lue intégralement avec son complément).
- **Branche** : `pre10-bmad/dev` (worktree `C:\Dev\PRE10`) ; **commit de départ** : `901d7b4c` (= `origin/main`, fusion de la PR #420).
- Spec du lot : `_bmad-output/pre10/implementation-artifacts/spec-pre10-moteur-execution-libre.md`.

## 1. Point de départ

| Élément | Constat | Preuve |
|---|---|---|
| Derniers tests PRE-9 | Recette iPhone close : 273 OK, 1 n/a ; commit final de code `03163de3`, branche `feat/pre9-catalogues-cartes-badge-20261106`, PR #420 | `.github/orchestration/reports/2026-11-06_PRE9_CATALOGUES_CARTES_BADGE_NOUVEAU.md` l.791-793 |
| Base PRE-9 examinée / utilisée | `03163de3` examiné ; base d'intégration `901d7b4c` (main). `git diff 03163de3 901d7b4c -- src app` : **vide** (seul un commit documentaire `8b1cc3f2` et la fusion) | commande rejouée le 09/11 |
| Correctif postérieur modifiant un contrat du moteur | Aucun. La branche `docs/pre9-cloture-fusion-20261109` n'ajoute qu'un rapport ; `docs/death-by-parametres-execution-20261107` (D-514, retrait de la ligne Séries Death by, non fusionnée) concerne PRE-11 | `git log`, `git diff` |
| Branche en recette | Non touchée (aucune écriture hors `pre10-bmad/dev`) | état Git |
| Plan applicable | §18 de la conception (PRE-10.1 à 10.3, proposition technique) ; `architecture-pre9.md` §8 (orientation, non engagée). Aucune story PRE-10 validée n'existait : le découpage §18 a servi de plan | lecture |
| Travaux moteur déjà engagés | **Aucun code** : `src/features/execution/` ne contenait qu'un README ; aucune table d'exécution ; aucune branche moteur de code (seulement des branches documentaires) | `find`, `git log --all -- src/features/execution` |

### Ce que PRE-9 livre au moteur (D.1 à D.5)

| Lot | Module, point d'entrée | Utilité PRE-10 | Preuve |
|---|---|---|---|
| D.1 | `src/domain/sessions/planExpansion.ts` — `expandStructure({ structure, initialCountdownSeconds, finalPhaseSeconds })` | Ordre, identités stables `stepId`, contextes Cycle/Circuit, Séries/côtés joués, Points d'arrêt dédoublonnés, segments progressifs | `__tests__/planExpansion.d1.test.ts` ; réutilisé tel quel par `compileExecutablePlan` |
| D.2 | `src/domain/sessions/sessionSnapshot.ts` — `createSessionSnapshot(session)` | Prescription figée, gelée, versionnée (`SESSION_SNAPSHOT_VERSION = 1`) ; sérialisation reportée à PRE-10 → faite (JSON dans `executions.snapshot_json`) | `sessionSnapshot.d2.test.ts` ; T22 couvert par l'instantané gelé |
| D.3 | `src/domain/sessions/formats/capabilities.ts` — `FORMAT_CAPABILITIES`, `formatCapabilitiesOf` | Disponibilité du moteur par modèle ; PRE-10 passe `executionAvailable` à vrai pour les éléments libres et préconfigurations | `formatCapabilities.d3.test.ts` (mis à jour) |
| D.4 | `src/domain/sessions/configurationValidity.ts` — `configurationValidity`, `engineAvailability` | Contrôle avant lancement (`launchabilityOf`) | `configurationValidity.d4.test.ts` (mis à jour) |
| D.5 | `spec-d-5-instruction-capacites-execution.md` (document) | Dimensions 3–10 ; questions A2/A4/A6/R-01 depuis tranchées par D1–D6/Q1–Q6 | lecture |
| Calculs | `src/domain/activities/executionCalculations.ts` — `buildExecutionLedger(parameters, recovery)` | Pauses, côtés, substitution de la dernière Pause, travail nominal (cadence, motif de phases) | réutilisé par `plan.ts` ; R1 = 530 s vérifié |
| Guidage | `src/domain/activities/phaseGuidance.ts` — `phaseGuidanceAt` | Phase courante du motif | réutilisé par `projection.ts` |

## 2. Analyse critique ciblée

### 2.1 Ce que le code livré, les tests PRE-9 et les décisions postérieures changent pour PRE-10

| Réf. | Constat | Conséquence observable | Traitement retenu |
|---|---|---|---|
| D.1 `PlanStep` | Le plan fini existe déjà (ordre, identités, contextes) mais **sans les Pauses** (« restent dans le registre ») | Sans ajout, aucune Pause entre Séries ni entre côtés à l'exécution | `compileExecutablePlan` relit le registre (`buildExecutionLedger`) par occurrence, filtré aux Séries/côtés joués par D.1 ; dernière Pause substituée par la Récupération (D-248), conservée sinon (ch09) |
| §5.2 / §6.4 | La conception propose une pile de pilotes ; D.1 fournit déjà un programme fini aplati | — | Hybride : la Séance est un pilote `SEQUENCE` sur la liste compilée ; pilotes réservés aux portées temporelles (Formats). Aucune réécriture de D.1 |
| Décisions 06–07/11 (aucune recopie S1 → S2…Sn) | Le moteur lit chaque Série telle que la Composition l'a enregistrée | Cibles et charges différentes par série respectées ; une série non saisie ne devient pas une copie de S1 | Aucune logique de recopie dans le moteur ; test `plan.pre10.test.ts` (séries 8/10/12, charges 40/50/60) |
| D-506 / D-504 | « Démarrer reste désactivé tant que l'écran d'Exécution n'existe pas » | Démarrer devient actif sur une Séance active | Classe A (condition levée) ; annotation dans `SessionCatalogueList` |
| D.3 `executionAvailable: false` (type littéral) | Bloquerait tout lancement | — | Type `boolean`, vrai pour `FREE_ELEMENTS` ; Formats spécialisés restent `false` (PRE-11) |
| Migration 023 (Récupération des EMOM alternés à 0) | Donnée déjà normalisée | Aucun impact PRE-10 | — |
| D-514 (non fusionné) | Retrait de la ligne Séries du Death by | PRE-11 seulement | Signalé |
| ch08 « Dans T04… fin minimale » | Synthèse non livrée | Écran de fin minimale | Livré ; Synthèse hors périmètre |
| Son / voix | Aucune bibliothèque audio ni vocale dans le projet (Expo 57 : `expo-haptics` seul) | Pas de bips sonores ni d'annonces | Signaux planifiés et restitués par vibration ; ajout `expo-audio`/`expo-speech` soumis à Hermann (nouvelle version native) |

### 2.2 Choix structurants revus

**Prescription figée → exécutable → état → résultats.** Instantané D.2 (JSON immuable persisté) → `ExecutablePlan` (étapes typées : condition de fin `TIMED`/`MANUAL`/`WAIT`/`PARENT`/`INTERACTION`, contribution de durée `exact`/`estimated`/`omitted`, identités D.1) → `EngineState` (pile de portées et états locaux, étape et tentative, registre de références temporelles, génération) → résultats par clé logique (`execution_results`). Le moteur ne relit jamais la Séance.

**Parcours Séance → Cycle → Circuit → Exercice.** Les plans finis viennent de D.1 (une seule multiplication, T01) ; les plans progressifs seront des pilotes générant leurs occurrences à partir de leur état local (rang, membre, tours acquis) — démontré par les politiques de test : AMRAP sans nombre de tours prévu, EMOM alterné avec **rang propre à chaque membre** (`ranks: { A, B }` dans l'état local, conservé entre passages et dans le checkpoint).

**Quatre rôles temporels — cas R3 du §17.1** (compte à rebours 10 s ; AMRAP en Circuit, buy-in 50, A 10 (+2) puis B ; 3 blocs de 12 min ; repos 2 min) :

| Instant | Références actives ensemble | Échéance qui commande | Résultat |
|---|---|---|---|
| 0:00–0:10 | Temps de Séance (STOPWATCH) ; étape « compte à rebours » (STEP, 10 s) | STEP du compte à rebours à 0:10 | ouverture du bloc 1 à 0:10 exactement |
| 0:10–12:10 | STOPWATCH ; **DEADLINE** du bloc 1 (12 min, ancre 0:10) ; STEP de l'étape courante (buy-in puis A, B… sans budget : attente de Suivant) ; SAFETY de l'étape | DEADLINE à 12:10 | A du tour 6 fermé `CLOSED_BY_PARENT` à 12:10, Clôture ouverte (D1) |
| 12:10–12:40 | STOPWATCH seul (Clôture bloquante : aucune référence du bloc 2, D3) | validation de la Clôture (commande) à 12:40 | résultat bloc 1 : 5 tours + 7 rép. ; repos ouvert à 12:40 |
| 12:40–14:40 | STOPWATCH ; STEP du repos (120 s) | STEP à 14:40 | bloc 2 ouvert, DEADLINE ancre 14:40, A revient à 10, pas de buy-in |
| R5 : Pause 20:00–23:00 | toutes suspendues (accumulé conservé) | — | DEADLINE du bloc 2 reculée de 3 min (29:40) |

Deux événements au même instant (T23 : maintien de 40 s commencé à 11:20 dans un bloc de 12 min) : la STEP du maintien et la DEADLINE du bloc échoient à 12:00. Règle du noyau : **la portée la plus interne d'abord** (le maintien est acquis, `COMPLETED`), **et aucune portée ni étape n'est ouverte à un instant où une référence englobante est échue** : le membre suivant n'est pas ouvert, la DEADLINE est traitée, la Clôture s'ouvre. Une commande lue au même instant qu'une échéance passe avant elle (Q4). Le résultat est identique quel que soit le découpage des réveils (un seul réveil tardif, plusieurs, ou exactement à l'échéance) — testé.

**Pause, reset, callbacks caducs, arrière-plan, reprise du processus.** Pause : toutes les références suspendues ; la cadence n'acquiert que les intervalles complets (T04). Reset : nouvelle tentative, temps antérieur cumulé (T05), génération incrémentée ; toute commande ou tout réveil visant l'ancienne tentative est ignoré (T06, `target = clé#tentative`). Arrière-plan : aucune Pause ; au retour, réconciliation chronologique aux **échéances logiques**, jamais à l'heure du callback (T08 : 16 étapes franchies, débuts à la seconde exacte). Interruption du processus : état candidat, dialogue Reprendre / Arrêter ; avec continuité l'échéance a couru pendant l'absence (R6) ; heure reculée → Q6 (étape en cours, en pause, rien déduit).

**Cohérence checkpoint / résultats.** Une transition = une transaction exclusive : `UPDATE executions … WHERE checkpoint_revision = ?` + upsert des résultats `(execution_id, result_key)`. En cas d'échec : rien n'est publié, la commande et **sa lecture d'origine** sont conservées ; `retry()` rejoue la même transition, mêmes clés, aucun doublon (T20, testé sur SQLite avec injection d'échec).

**Frontière noyau / interface / son / haptique.** Noyau pur (aucun `Date.now`, React, SQLite, son). Le runtime lit l'horloge, sérialise, persiste, programme **un** réveil marqué de la génération et demande les signaux de l'intervalle récent (aucun rattrapage). L'interface est une projection (`projectExecution`) ; elle ne tient aucun compte à rebours.

### 2.3 Architecture alternative : programme compilé + interpréteur

Alternative examinée : compiler la prescription en un programme (instructions `RUN step`, `WAIT_TAP`, `LOOP`, `WINDOW(w){…}`, `WITH_DEADLINE(d){…} ON_EXPIRE`, `BREAK`, registres de compteurs) interprété par une machine à pile (compteur ordinal, piles de boucles et de gestionnaires d'échéance).

| Cas | Conception retenue (pilotes + registre temporel) | Programme compilé + interpréteur |
|---|---|---|
| **AMRAP qui expire pendant un exercice** | La DEADLINE du pilote AMRAP échoit ; le noyau ferme les descendants (`CLOSED_BY_PARENT`), puis `onReference` ouvre la Clôture. **Sauvegarde** : pile (pilote AMRAP : bloc, rang, membre, tours acquis), DEADLINE (ancre, accumulé), étape et tentative | `WITH_DEADLINE` empile un gestionnaire ; à l'expiration, déroulement de la pile jusqu'au gestionnaire (comme une exception), saut à `ON_EXPIRE`. **Sauvegarde** : compteur ordinal, piles de boucles et de gestionnaires (avec ancres), registres |
| **EMOM alterné repris au bon membre et au bon rang après suspension** | Pilote de Circuit alterné : unité courante + `ranks` par membre ; chaque échéance de WINDOW ferme l'unité et ouvre la suivante à l'heure prévue ; la réconciliation rejoue les échéances dans l'ordre. **Sauvegarde** : unité, `ranks`, ancre de la fenêtre courante, état « travail fait » | Fini : programme déroulé `WINDOW A1 ; WINDOW B1 ; WINDOW A2…` ; reprise = compteur ordinal + ancre. Rang = position dans le programme. **Sauvegarde** : compteur ordinal, ancre |
| **Death by au nombre de séries inconnu** | Pilote : rang r, objectif q0 + (r−1)·d, contrôle d'admissibilité avant d'ouvrir r, WINDOW ; échec ou non-confirmation → Clôture. **Sauvegarde** : r, rangs acquis, ancre de fenêtre | `LOOP r=1.. { IF travail(r) ≥ w BREAK(limite) ; WINDOW(w){ A(q0+(r−1)·d) } ON_MISS BREAK(échec) }`. **Sauvegarde** : compteur ordinal, registre r, ancre |

Les deux approches doivent sauvegarder la même information utile (position, compteurs, ancres, génération). Différences réelles :

- **Réutilisation PRE-9** : D.1 produit déjà le programme aplati des plans finis, avec des identités stables. La conception retenue l'utilise directement ; un interpréteur imposerait de recompiler D.1 vers un jeu d'instructions.
- **Robustesse des checkpoints** : un compteur ordinal dépend de la forme du programme compilé ; toute évolution du compilateur invalide les checkpoints en cours (§15.4). Les identités D.1 et les états locaux typés des pilotes ne dépendent pas de l'ordre des instructions.
- **Sémantique temporelle** : la règle « interne d'abord, aucune ouverture à l'instant d'une échéance englobante » et la fermeture des descendants sont **les mêmes** dans les deux cas ; l'interpréteur les déplace dans des gestionnaires imbriqués (équivalent d'exceptions asynchrones), plus difficiles à tester combinatoirement.
- **Complexité** : interpréteur = jeu d'instructions + compilateur + machine + versionnement du bytecode ; pilotes = une interface de cinq fonctions et un pilote par Format.
- **Tests** : les pilotes se testent un par un avec l'horloge simulée (voir `kernel.policies.pre10.test.ts`) ; l'interpréteur exigerait des tests par combinaison d'instructions.

**Recommandation : conserver la conception consolidée**, en l'appliquant sous forme hybride : programme aplati de D.1 pour les plans finis (c'est déjà, de fait, la part « compilée »), pilotes à état local pour les portées temporelles et progressives. Pas de changement d'architecture centrale, donc pas de coût à soumettre ; PRE-10 a été poursuivi comme prévu.

### 2.4 Écarts au plan

| Écart | Justification |
|---|---|
| PRE-10.1 à 10.3 livrés dans un seul lot | Mission explicite de Hermann ; les trois sous-étapes sont séparables dans le diff (domaine / runtime / interface) |
| Signaux : vibration seulement | Aucune bibliothèque audio/vocale ; ajout = nouvelle version native et spike P6 — décision à Hermann |
| Écran d'Exécution sans conformité Figma vérifiée | Aucun contrôle visuel autorisé dans cette mission ; hiérarchie et commandes du contrat CE-EXEC-SESSION-01 respectées, rendu à valider sur iPhone (Roboto Condensed non chargée, chrono circulaire et progression segmentée par Tours non dessinés) |
| Mises à jour documentaires §21 de la conception | Non appliquées : la conception est « proposée pour intégration » ; ses mises à jour suivent sa validation |

## 3. Développements livrés

| Sous-étape | Fichiers | Contenu |
|---|---|---|
| PRE-10.1 | `src/domain/execution/plan.ts` | `compileExecutablePlan`, `launchabilityOf` |
| | `src/domain/execution/kernel.ts` | État, événements, registre temporel, réconciliation, fermeture des descendants, simultanéités, idempotence, `restoreWithoutContinuity` (Q6), pilote `SEQUENCE` |
| | `src/domain/execution/projection.ts` | Projection UI, progression RM-077, durée estimée, commandes autorisées |
| | `src/domain/execution/signals.ts` | Signaux (compte à rebours 3-2-1, cadence, minute), priorité de la transition |
| | `src/domain/execution/results.ts` | Résultats d'Exercice exécuté, statut Terminée/Partielle/Interrompue |
| | `src/domain/execution/checkpoint.ts`, `ExecutionRepository.ts` | Checkpoint versionné, contrat de persistance |
| | `src/domain/execution/testing/simulation.ts`, `testPolicies.ts` | Horloge simulée ; politiques de test AMRAP et EMOM (non raccordées à l'application) |
| PRE-10.2 | `src/features/execution/ExecutionService.ts` | Runtime (voir §2.2) |
| | `src/infrastructure/database/migrations/migration024.ts`, `migrateDatabase.ts`, `constants.ts` (version 24) | Tables `executions`, `execution_results` |
| | `src/infrastructure/database/repositories/SqliteExecutionRepository.ts` | Sauvegarde atomique conditionnée par la révision |
| | `src/infrastructure/haptics/ExecutionSignalAdapter.ts` | Vibrations fonctionnelles (préférence Vibrations) |
| | `src/features/sessions/SessionServiceProvider.tsx` | Construction du service sur la connexion commune |
| PRE-10.3 | `app/execution.tsx`, `app/_layout.tsx` | Route plein écran sans geste de retour ; porte de reprise |
| | `src/features/execution/ExecutionScreen.tsx`, `ExecutionDialog.tsx`, `ExecutionRecoveryGate.tsx`, `ExecutionServiceContext.tsx`, `executionStrings.ts` | Écran, dialogues du contrat, reprise après interruption |
| | `src/features/sessions/SessionCatalogueList.tsx`, `CatalogueScreen.tsx` | Démarrer → Exécution |
| D.3/D.4 | `src/domain/sessions/formats/capabilities.ts` + 2 tests | `executionAvailable` vrai pour les éléments libres |

## 4. Scénarios du §17 et preuves

| Cas | Test | Résultat |
|---|---|---|
| T01 ordre Cycle/Circuits groupé et alterné | `kernel.libre.pre10.test.ts` | PASS |
| T02 Durée / Répétitions / À l'échec | idem | PASS |
| T03 Pause 20 s pendant une Durée | idem | PASS |
| T04 Pause au milieu du bip | idem | PASS |
| T05 Reset 20 s puis 35 s (55 / 35, autre côté préservé) | idem | PASS |
| T06 Callback / confirmation ancienne après reset | idem + `ExecutionService.pre10.test.ts` (réveil d'une génération dépassée) | PASS |
| T07 Fin et bip au même instant | `ExecutionService.pre10.test.ts` | PASS |
| T08 Arrière-plan sur étapes automatiques | `kernel.libre…` (échéances logiques) + service (aucun signal rattrapé) | PASS (simulation) |
| T09 Interruption du processus | `ExecutionService.pre10.test.ts` (SQLite, nouveau service) | PASS (simulation) |
| T10 Deux confirmations de la même fenêtre | `kernel.policies.pre10.test.ts` | PASS |
| T11 EMOM 35 s / 60 s → 25 s de repos | idem | PASS |
| T12 AMRAP, maintien 40 s à 11:50 | idem | PASS |
| T20 Erreur de sauvegarde | `ExecutionService.pre10.test.ts` | PASS |
| T21 Point d'arrêt, sécurité, récupération | `kernel.libre…`, `kernel.policies…` (R11) | PASS |
| T22 Modification ultérieure (instantané gelé) | D.2 existant ; le moteur ne relit pas la Séance | PASS (par construction + D.2) |
| T23 Délais simultanés de deux portées | `kernel.policies…` | PASS |
| T24 Clôture après Fin de séance | `kernel.libre…` (R1) | PASS |
| T25 Rattrapage sous échéance englobante | `kernel.policies…` | PASS |
| T26 EMOM alterné A1 B1 A2 B2, reprise après relance | `kernel.policies…` | PASS |
| T27 Clôture puis enchaînement / Point d'arrêt | `kernel.policies…` | PASS |
| R1, R2, R3, R4, R5, R6, R11 | `kernel.libre…`, `kernel.policies…`, `plan.pre10.test.ts` | PASS |
| Parcours application : Séance enregistrée par le service de la Composition → Démarrer → pause, reset, Point d'arrêt, Continuer, Suivant confirmé → fin `Partielle` ; arrêt depuis la Pause → `Interrompue` | `ExecutionScreen.pre10.test.tsx` | PASS |
| T13–T19, T28 (politiques métier AMRAP/EMOM/For time/Death by) | — | PRE-11 |

Commandes exécutées : voir « Tests » ci-dessous.

## 5. Contrats démontrés pour PRE-11

1. Un pilote déclare ses références (`DEADLINE`, `WINDOW`, `STOPWATCH`) avec un budget ; le noyau mesure, suspend, reprend et franchit leurs échéances à l'instant logique.
2. À l'échéance d'une portée : fermeture des descendants (`CLOSED_BY_PARENT`, récupération comprise), puis `onReference` du pilote propriétaire.
3. Simultanéités : interne d'abord ; aucune ouverture à l'instant d'une échéance englobante ; commande à l'échéance acquise (Q4).
4. Clôture bloquante (`INTERACTION`) : aucune référence de l'élément suivant ouverte ; la validation ouvre l'élément suivant à son instant, sauf Point d'arrêt.
5. Étape `PARENT` (repos résiduel) terminée par la fenêtre ; fenêtre suivante à l'heure, sans repos inventé (D5).
6. État local de pilote sérialisable (rangs par membre), relu après relance de processus.
7. `allows` : interdire une commande dans une portée (Q2 : Réinitialiser) ; Suivant pendant une récupération (Q3).
8. Idempotence par `commandId` et `target = clé#tentative` ; génération pour les réveils.
9. Persistance : checkpoint + résultats atomiques, clé de résultat stable, révision.

## 6. Hypothèses non démontrées et vérifications restantes sur iPhone

- **Non démontré sur appareil** : exactitude des transitions en arrière-plan et écran verrouillé (JavaScript suspendu : la réconciliation se fait au retour, aucune transition ni vibration pendant la suspension) ; détection d'un redémarrage du téléphone ou d'une avance manuelle de l'heure (seul un recul est détecté — P5/P6) ; vibrations ; tenue de l'écran allumé pendant une séance (aucune bibliothèque `keep-awake` installée).
- **À vérifier sur iPhone** (aucun test exécuté sur appareil dans cette mission) : Démarrer depuis une carte ; compte à rebours puis enchaînement ; Pause / Reprendre / Arrêter ; Réinitialiser (Série, côté, récupération) ; Suivant avec et sans confirmation ; Point d'arrêt puis Continuer ; verrouillage pendant une Durée puis retour ; fermeture forcée puis relance (dialogue Reprendre / Arrêter) ; fin minimale ; rendu de l'écran face aux nœuds Figma `1992:8132/8530/8626` et dialogues `1992:8224/8326/8428`. Cahier de recette détaillé (24 cas, Séances à préparer) : `_bmad-output/pre10/implementation-artifacts/recette-iphone-pre10.md`.

## 7. Éléments non corrigés ou hors périmètre

- Son et annonces vocales (bibliothèques absentes) ; Synthèse de séance et historique (tranches ultérieures) ; politiques métier des Formats (PRE-11) ; mises à jour documentaires §21 de la conception ; les À CLARIFIER 1–6 de la spec du lot.

## 8. Arbitrages demandés à Hermann

1. Ajouter maintenant `expo-audio` et `expo-speech` (nouvelle version native du client de développement), ou après le spike P6 ?
2. Points À CLARIFIER 1 à 5 de la spec du lot (Suivant pendant le compte à rebours, Réinitialiser pendant une Pause entre Séries, bilatéral alterné par série, attente d'un Point d'arrêt dans la durée réelle, libellés de la fin minimale) : comportements livrés à confirmer ou corriger.

## Tests

| Commande | Résultat |
|---|---|
| `npx jest` (suite complète, 1re exécution, avant corrections) | 321 suites / 5 644 tests passés ; **7 suites / 12 tests en échec**, tous liés à PRE-10 : version de base 23 figée (021, 023), injection d'échec sur `PRAGMA user_version = 23` (018–021), deux gardes de code (AC9 « aucun Instantané stocké » de PRE-4 — remplacée : ch09 impose la persistance de l'instantané de Séance ; sentinelle de Cible nulle déclenchée par l'identifiant d'étape `target`, renommé) |
| `npx jest src/infrastructure/database src/domain/activities/__tests__/legacyModeConfinement.test.ts src/domain/execution src/features/execution` (après corrections) | 48 suites / 552 tests PASS |
| `npx jest` SessionServiceProvider, CatalogueScreen, SessionCard, `app/__tests__`, `src/features/execution`, `src/domain/execution` (après les derniers changements) | 13 suites / 132 tests PASS |
| `npx jest src/features/sessions/__tests__ -t "atalogue|Démarrer|SessionCard"` | 22 suites / 107 tests PASS |
| `npx tsc --noEmit -p .` | OK |
| `npx eslint` sur les fichiers créés et modifiés | OK |
| 2e exécution de la suite complète et `expo export --platform ios` (contrôle de bundle) | **non abouties** : arrêtées par le système (mémoire insuffisante), non relancées. La 2e suite complète reste à rejouer ; changements postérieurs à la 1re exécution couverts par les suites ciblées ci-dessus |

Nouveaux tests : 47 (`kernel.libre.pre10`, `kernel.policies.pre10`, `plan.pre10`, `ExecutionService.pre10`, `ExecutionScreen.pre10`, `migration024`). Aucun test sur appareil.

Environnement : `node_modules` du worktree = jonction vers `C:\Dev\KODJO-BMAD-PRE8\node_modules` (même `package-lock.json`, empreinte identique), ignorée par Git.

## Fichiers modifiés, commit final et état Git

- Commits (branche `pre10-bmad/dev`, base `901d7b4c`) : `955e1e00` noyau (PRE-10.1) ; `244b85f0` runtime et persistance (PRE-10.2) ; `445efe7f` Exécution Libre (PRE-10.3) ; `59bae2a8` rapport et spec ; puis le commit documentaire qui contient cette section.
- Fichiers : voir §3 ; tests modifiés : `configurationValidity.d4`, `formatCapabilities.d3`, `copiesAndSnapshots.story13` (AC9 amendée), `executionParametersV3.roundTrip`, `migrateDatabase`, `migration012` à `migration023` (version alignée sur `DATABASE_VERSION`).
- État Git : arbre propre après le dernier commit ; poussé sur `origin/pre10-bmad/dev` le 09/11/2026 à la demande de Hermann (tête distante `9aa90d5f` au moment du push) ; aucune PR ouverte ; `main` et la branche de recette PRE-9 inchangées.

## 9. Recette iPhone n° 1 (09/11/2026) — corrections

Départ : `7f5e3454` (`pre10-bmad/dev`). Résultats relevés dans le cahier en ligne https://claude.ai/artifact/Mp9Tu1rPiRdfebmKfpf8Tq : 20 points saisis, 18 OK, 2 KO (`m-suivant`, `m-reset-serie`), 6 constats libres (a à f) ; les autres points restent à jouer.

- **Historique** (règle de comparaison) : la confirmation et la réinitialisation n'ont aucun succès antérieur sur appareil (première recette du lot) ; le défaut est introduit par `445efe7f` (PRE-10.3, trois `Modal` distincts) et détecté par cette recette. Attribution : **démontrée** pour l'enchaînement des dialogues (code), **plausible** pour le blocage natif iOS qui en résulte et pour « Fermer sans effet » (non reproductible en Jest, à confirmer sur iPhone).
- **Corrections** (détail et classes A–D dans la spec du lot, § « Recette iPhone n° 1 ») : un seul `Modal` toujours monté, dialogue fermé après ses commandes ; Suivant sans confirmation en pause et récupération (B, RM-065a remplacée) ; suspension pendant la confirmation de Suivant (B, ch13 précisé) ; rafraîchissement calé sur la seconde ; « À suivre » avec la Série et libellé du Point d'arrêt.
- **Non corrigé, à arbitrer** : Réinitialiser pendant le Compte à rebours (b) ; alertes de durée des phases dans la Composition (d, hors moteur) ; reprise après fermeture prolongée (i, conforme à la conception §14.2 — choix demandé).
- **Tests** : `npx jest src/domain/execution src/features/execution` 5 suites / 51 tests PASS (5 nouveaux : Réinitialiser → Annuler sans Pause intercalée, suspension pendant Suivant, Suivant direct en Pause, « À suivre », rafraîchissement) ; `npx jest src/features/sessions src/shared/ui/__tests__/tokensSpecification.test.ts` 117 suites / 1 793 tests PASS ; `tsc` et `eslint` propres. Suite complète non relancée (mémoire insuffisante lors des essais précédents).
- **À vérifier sur iPhone** : points C1 à C6 du cahier.
- **Fichiers** : `kernel.ts`, `projection.ts`, `ExecutionScreen.tsx`, `ExecutionDialog.tsx`, `executionStrings.ts`, tests `kernel.libre.pre10`, `ExecutionScreen.pre10` ; ch08, ch10, ch11, ch13 ; spec du lot ; cahier de recette ; ce rapport.

### 9.1 Arbitrages du 09/11/2026 et reprise après fermeture

Réponses de Hermann : « 1. Non, il y a déjà le bouton pause 2. Oui 3. Oui ». Réinitialiser reste indisponible pendant le Compte à rebours ; lot Composition ouvert pour les alertes de durée des phases (hors moteur) ; Reprendre après une fermeture revient à l'étape interrompue, en pause, sans compter l'absence (ch12 §12.33 précisé, conception §14.2 annotée, T09 remplacé). Tests : `npx jest src/domain/execution src/features/execution` 5 suites / 51 tests PASS ; `tsc`, `eslint` propres. À vérifier sur iPhone : point C7 du cahier.

### 9.2 Recette iPhone n° 2 (09/11/2026) — choix provisoires

Verdicts relevés dans le cahier en ligne (section 7) : q-compte, q-pause, q-alterne, q-fin OK (conservés) ; **q-attente KO** (« Non l'attente au point d'arrêt ne compte pas dans le temps écoulé ») : corrigé — chronomètre de Séance suspendu pendant l'attente d'un Point d'arrêt, y compris après une Pause pendant cette attente (`kernel.ts`, `setSessionRunning`) ; classe B : ch09 « Durée réelle », ch11 API-EXE-08, ch13 annotés. **q-son OK** (« ajouter expo-audio / expo-speech maintenant ») : décision enregistrée dans la spec, non implémentée ici — un module natif absent de la version installée sur l'iPhone ferait échouer l'application servie par Metro ; lot distinct à lancer avec un build EAS `development-bmad` soumis à l'accord de Hermann. Corrections C1–C7 du cahier : OK sur iPhone.

- Tests : `npx jest src/domain/execution src/features/execution` 5 suites / 52 tests PASS (nouveau test Point d'arrêt) ; suite complète : voir le rapport `2026-11-09_COMPOSITION_PHASES_DUREE.md` § Recette n° 2.
- À vérifier sur iPhone : point E2 du cahier.
- Commit : voir le commit « fix(pre10): l'attente au Point d'arrêt ne compte pas dans le temps écoulé », sur `composition-phases-duree` et reporté sur `pre10-bmad/dev`.
