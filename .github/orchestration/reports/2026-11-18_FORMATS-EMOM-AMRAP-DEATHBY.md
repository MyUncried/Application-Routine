# FORMATS-EMOM-AMRAP-DEATHBY — Exécution des autres Formats (18/11/2026)

## 1. Mission

- **Identifiant :** FORMATS-EMOM-AMRAP-DEATHBY (PRE-11, tranches T2 EMOM, T3 AMRAP, T4 Death by).
- **Objectif :** rendre exécutables sur iPhone les Formats EMOM, AMRAP et Death by, sur le modèle du For time déjà livré.
- **Demande de Hermann (18/11/2026), recopiée :** « Oui tu attaques les autres formats. Prends en considération ce qui a été fait pour For Time, je pense que tous les élément existent déjà. »
- **Branche :** `formats/emom-amrap-deathby-20261118` (dossier `C:\Dev\KODJO-FORMATS`), partie de `a3845e0f` (fiche Mouvement 3.0.0, PR #444, elle-même partie de `main` `5fe5e519`, fusion du For time, PR #443).
- **Arbitrages du 18/11/2026 :** spec PRE-11 §5 point 30 (commandes « Comme le For time », feuille du For time pour les fins, partiel AMRAP « exercice en cours seul », sons existants).

## 2. Périmètre

| Format | Statut |
|---|---|
| EMOM (T2) | Réalisé, à vérifier sur iPhone (section 3) |
| AMRAP (T3) | Réalisé, à vérifier sur iPhone (section 4) |
| Death by (T4) | À venir |

Hors périmètre : synthèse des résultats en fin de séance (reportée, §13.4 PRE-10), qualification transverse T5.

## 3. EMOM (T2)

### 3.1 Sources appliquées

- Classe A : FMT-20 à FMT-25, FMT-35, FMT-36 (ch10) ; conception consolidée D5, Q1, Q4, Q5, §12.2, §12.5 ; cas T10, T11, T26, T28 ; ch10 « L'Exécution continue à progresser lorsque l'application passe en arrière-plan » ; EMOM « À l'objectif » seul (ch07, 07/11/2026 ; spec §6.6).
- Classe B : arbitrages du 18/11/2026 (barre et Arrêt du For time ; sons existants). Remplace D4 « La Pause manuelle reste toujours possible » pour l'EMOM.
- Écran : Figma `8982:15709` « Exécution d'une séance — EMOM — repos déclaré » (lecture de la source, aucune validation visuelle).

### 3.2 Comportements livrés

- **Compilation.** Une portée `EMOM` par élément : Exercice EMOM (autonome, À la suite, en alternance — une portée par tour dans un Circuit standard) ou Circuit porteur « dans chaque intervalle ». Une fenêtre par Série (au tour k pour le Circuit porteur), ses deux côtés et la pause entre eux compris (Q5), terminée par son repos (`WINDOW_REST`, fin avec la fenêtre). La Récupération d'un exercice À la suite suit l'échéance de sa dernière fenêtre (FMT-21). Aucun Point d'arrêt dans la portée (D4).
- **Fenêtres.** Durée = Intervalle (ou intervalle commun). « Suivant » termine une Série en Répétitions ; une Série en Durée démarre seule et finit à son terme (« Suivant » refusé). Le travail terminé révèle le repos (T11) ; la fenêtre suivante commence à l'heure (FMT-23, D5) ; une confirmation à l'échéance est acquise (Q4) ; une seconde confirmation ne compte pas (T10).
- **Fenêtre non terminée.** Résultat « non terminée » ; bandeau non bloquant dans la fenêtre suivante (valeur proposée 0, stepper standard, coche, « Passer ») ; commande `DECLARE` du noyau, sans changement d'étape (T28). À la fin, feuille « Fin de l'EMOM » par fenêtre restant à saisir (coche seule) ; aucune feuille sinon. Une Série en Durée interrompue enregistre sa durée tenue.
- **Écran.** Grand chrono = temps restant de la fenêtre ; anneau : portion travaillée en violet, repos en orange ; « Repos » orange dans le cercle ; titre = exercice. Barre : Arrêt, Pause désactivée, « Suivant » 72. Arrêt : feuille « Arrêt de l'EMOM » (répétitions faites ou durée tenue), puis synthèse, temps continu derrière la feuille. Pas de fondu des textes (comme le For time).
- **Sons.** Bip long au début de chaque fenêtre (réglage « Démarrage d'un exercice »), annonces conservées ; 3 bips courts avant l'échéance de chaque fenêtre, pendant le travail et le repos ; pas de signal minute dans une fenêtre.
- **Arrière-plan.** Aucune Pause pendant les fenêtres (comme le For time).
- **Validité.** EMOM avec une cible À l'échec : séance invalide (`LOCKED_CONSTANT_CHANGED`).
- **Progression et durée estimée.** Chaque fenêtre pèse sa durée (N × W, E × N × W en alternance).

### 3.3 Constats

- Le noyau, les références WINDOW et les politiques de test PRE-10 couvraient déjà la mécanique ; il manquait la compilation des fenêtres, la politique réelle, la déclaration non bloquante (aucune commande ne permettait d'enregistrer un résultat sans changer d'étape : ajout de `DECLARE`), et la projection de la fenêtre.
- Dans une fenêtre, le signal « toutes les minutes » d'une Série en Répétitions tombait sur l'échéance (W = 60 s) : retiré dans les fenêtres.

### 3.4 Interprétations à confirmer (À CLARIFIER, n'empêchent aucune opération)

1. Coche du bandeau (absente de la phrase de Q1) pour rendre la saisie explicite ; le bandeau dure toute la fenêtre suivante.
2. Compteur « Minute 3/12 » de la maquette non affiché : la zone garde Série · Tour · Cycle.
3. L'appui « travail terminé » est porté par « Suivant » ; le cercle ne réagit pas (désactivé en For time, recette ftr2-regle-suivant).
4. Circuit porteur : la saisie d'une fenêtre non terminée porte sur l'exercice en cours à l'échéance (règle de l'AMRAP).
5. Fenêtre interrompue pendant la pause entre les côtés : « non terminée », rien à saisir.

### 3.5 Tests

- `npx tsc --noEmit -p .` : aucune erreur.
- `npx eslint` sur les fichiers touchés : aucun signalement.
- Nouveaux : `src/domain/execution/__tests__/emom.pre11.test.ts` (13 : compilation et durée, T11, T10, D5/Q1/T28 avec « Passer » et Clôture, sans Clôture, Q4, Série en Durée, Q5 bilatéral, T26 alternance, Circuit porteur, Arrêt, signaux, invariant À l'échec) ; `src/features/execution/__tests__/ExecutionScreen.emom.pre11.test.tsx` (2 : déroulé complet à l'écran, Arrêt).
- Attentes anciennes annotées (EMOM n'est plus l'exemple de Format indisponible ; l'AMRAP le remplace) : `plan.pre10.test.ts`, `configurationValidity.d4.test.ts`, `formatCapabilities.d3.test.ts`.
- `npx jest src/domain/execution src/features/execution src/domain/sessions src/infrastructure/haptics` : 75 suites, 1 123 tests réussis.
- `npx jest` (suite complète) : 402 suites, 6 204 tests réussis, 32 ignorés, 1 échec — garde PRE4-1.1/AC1 (`legacyModeConfinement`) : faux positif sur `bannerLeaf?.target ?? null` (`projection.ts`), réécrit sans changement de comportement ; garde et suites `domain/execution`, `features/execution` relancées : 161/161.

### 3.6 Vérifications à effectuer sur l'iPhone (Routine BMAD, Metro de `KODJO-FORMATS`)

| Ligne | Vérification |
|---|---|
| emom-1 | EMOM d'un mouvement (3 × 10 rép., 1 min) : grand chrono 01:00 qui décompte ; barre Arrêt, Pause grisée, Suivant |
| emom-2 | Suivant à mi-fenêtre : « Repos » orange, anneau violet puis orange, Suivant grisé ; fenêtre suivante à 00:00 |
| emom-3 | Fenêtre laissée sans Suivant : bandeau « Fenêtre 1 non terminée », valeur, coche ; puis « Passer » sur une autre |
| emom-4 | Fin de l'EMOM : feuille « Fin de l'EMOM » pour la fenêtre passée ; validation → exercice suivant |
| emom-5 | Arrêt pendant une Série : feuille « Arrêt de l'EMOM », valeur, coche → synthèse |
| emom-6 | Série en Durée : démarre seule, compte à rebours en bas à gauche, repos jusqu'à l'échéance |
| emom-7 | Sons : bip long au début de chaque fenêtre, 3 bips avant la fin |
| emom-8 | En alternance (A 1 min, B 1 min 30) : A, B, A, B ; dans chaque intervalle : A puis B dans la même minute |
| emom-9 | Exercice bilatéral : les deux côtés dans la même fenêtre |
| emom-10 | Arrière-plan pendant une fenêtre : au retour, le temps a continué |

## 4. AMRAP (T3)

### 4.1 Sources appliquées

- Classe A : FMT-26, FMT-27 (ch10) ; D-19, D-20 / RM-PRE5-02 ; conception consolidée D1, D3, Q2, Q3, Q4, §12.1, §12.5, « Prescriptions et fins — complément du 5 novembre » (incrément signé, plancher 1) ; cas T12, T13, T14, T19, T25 ; ch10 (arrière-plan).
- Classe B : arbitrages du 18/11/2026 (barre et Arrêt du For time ; feuille « Fin du bloc » ; partiel « exercice en cours seul » ; sons existants) ; exercices en durée en temps cumulé (ch07, 16/11/2026 : « Pour intégrer un exercice en durée sur un For Time, ou un AMRAP, l'exercice doit être en temps cumulé »).
- Aucune maquette d'exécution AMRAP (Formats §7.5 ne décrit que la Composition) : écran du For time réemployé.

### 4.2 Comportements livrés

- **Compilation.** Chaque segment progressif AMRAP de D.1 devient une portée `AMRAP` : Exercice autonome (un bloc, sa Durée) ou bloc k d'un Circuit porteur (Durée de chaque bloc). Contenu : buy-in (bloc 1 seulement, T13), étapes-modèles d'un tour de boucle (Séries, côtés, pauses, Récupération des membres de Rôle Tour), étape de poids du bloc (jamais jouée, porte la durée estimée et la progression). Le repos entre les blocs reste l'étape que D.1 place entre deux segments.
- **Boucle.** Le pilote rejoue les étapes-modèles à chaque tour (clés `…/r<k>/…`), objectif du tour k = départ + incrément × (k − 1), borné à 1 si l'incrément est négatif ; ni buy-in ni À l'échec incrémentés. Un tour est acquis à la validation de son dernier exercice (D-19) ; « + Tour » valide le reste du tour sans jamais sauter un exercice en durée ; une seconde confirmation de la même étape est refusée.
- **Échéance (D1).** Arrêt net, même pendant une Série, un exercice en durée ou une Récupération ; confirmation à l'instant de l'échéance acquise (Q4) ; une étape ouverte à cet instant n'est pas entamée. Clôture du bloc : exercice en cours (répétitions ou durée tenue), puis buy-in À l'échec, un par un ; sans rien à saisir, pas de feuille. Résultat du bloc : tours acquis, partiel, buy-in, arrêté ou non.
- **Écran.** Celui du For time (`forTimeLike`) : Arrêt, Pause désactivée, « Suivant » / « + Tour » (règles du For time transposées ; pastille « Buy-in » pendant le buy-in ; « Suivant » pendant une Récupération, Q3) ; exercices en durée (lancement par « Suivant », retenue et reprise dans le cercle, compte à rebours dans le coin) ; grand chrono = temps restant du bloc ; compteur Tour = numéro du tour, sans total ; écran figé à l'échéance, feuille « Fin du bloc » (coche seule) ; Arrêt → feuille « Arrêt de l'AMRAP » puis synthèse, le bloc continue derrière.
- **Sons.** Bip long au début de chaque bloc (première étape, réglage « Démarrage d'un exercice ») ; 3 bips courts avant l'échéance du bloc. La Durée maximum du For time n'a pas ces bips.
- **Arrière-plan.** Aucune Pause pendant un bloc.
- **Descripteur.** AMRAP exécutable ; A4 (étape à l'échéance) et A6 (tour partiel) tranchés par D1 et l'arbitrage du 18/11 ; « suite de la Séance » tranchée par D3.

### 4.3 Constats

- Le noyau suffisait (références DEADLINE, fermeture des descendants, retenue `HOLD`/`RELEASE`, Arrêt daté). Le compte des tours étant ouvert, les étapes de la boucle sont produites par le pilote à chaque tour ; la projection les rattache à leur étape-modèle (`loopOf`) pour la position, la liste et la progression.
- Cas limite trouvé par les tests : une validation pile à l'échéance ouvrait le tour suivant à l'instant même de l'échéance, qui demandait alors un partiel pour un exercice jamais commencé. Corrigé : une étape ouverte à l'instant de l'échéance n'est pas entamée.

### 4.4 Interprétations à confirmer (À CLARIFIER, n'empêchent aucune opération)

1. Grand chrono = temps restant du bloc (comme l'EMOM ; aucune maquette).
2. Compteur Tour : numéro du tour en cours, sans total ; le numéro de bloc n'est pas affiché (il est dans le résultat).
3. Échéance pendant une Récupération : aucune feuille, le tour est déjà acquis.
4. Exercice ouvert à l'instant même de l'échéance : rien à saisir.
5. AMRAP en fin de Séance : Fin de séance sautée après la feuille « Fin du bloc », comme le For time ; jouée normalement si aucune feuille ne s'ouvre.
6. Exercice à plusieurs séries : toutes ses séries à chaque tour (le modèle AMRAP en impose une).
7. « Unité d'un membre AMRAP autonome dans un Circuit alterné » (spec §7) : sans objet, l'AMRAP est refusé dans un Circuit standard alterné.

### 4.5 Tests

- `npx tsc --noEmit -p .` : aucune erreur. `npx eslint` sur les fichiers touchés : aucun signalement.
- Nouveaux : `src/domain/execution/__tests__/amrap.pre11.test.ts` (12 : compilation et durée estimée, D-19 et « + Tour », incrément signé avec plancher, D1 pendant une Série puis suite de Séance, Q4, T14 / Q3 / D1 pendant une Récupération, T12 exercice en durée retenu puis fermé par la borne, T13 buy-in et deux blocs, buy-in À l'échec, T25, Arrêt et Réinitialiser refusé, bips) ; `src/features/execution/__tests__/ExecutionScreen.amrap.pre11.test.tsx` (2 : bloc complet à l'écran avec « + Tour » et « Fin du bloc », Arrêt).
- Attentes anciennes annotées (l'AMRAP n'est plus l'exemple de Format indisponible ; le Death by le remplace ; A4 et A6 tranchés) : `plan.pre10.test.ts`, `configurationValidity.d4.test.ts`, `formatCapabilities.d3.test.ts`.
- `npx jest` (suite complète, après la dernière modification) : 404 suites, 6 219 tests réussis, 32 ignorés, aucun échec.

### 4.6 Vérifications à effectuer sur l'iPhone (Routine BMAD, Metro de `KODJO-FORMATS`)

| Ligne | Vérification |
|---|---|
| amrap-1 | AMRAP d'un mouvement (2 min, 10 rép.) : grand chrono 02:00 qui décompte ; barre Arrêt, Pause grisée, « + Tour » ; Tour 1 |
| amrap-2 | « + Tour » : Tour 2, objectif inchangé (ou recalculé avec « ± / tour ») |
| amrap-3 | Circuit AMRAP A + B : « Suivant » sur A, « + Tour » sur B |
| amrap-4 | Échéance pendant une série : écran figé, feuille « Fin du bloc » (nom, objectif, roulette), coche → exercice suivant |
| amrap-5 | Buy-in (« Buy-in » sous Tour, « Suivant ») une fois, puis la boucle ; buy-in « Max » : répétitions demandées à la fin du bloc |
| amrap-6 | Deux AMRAP : repos entre les deux, second bloc sans buy-in, Tour 1, objectifs réinitialisés |
| amrap-7 | Exercice en durée dans la boucle : « Suivant » le lance, appui dans le cercle pour le retenir et le reprendre, le bloc continue |
| amrap-8 | Récupération après le tour : « Suivant » la passe ; échéance pendant la Récupération : pas de feuille |
| amrap-9 | Arrêt : feuille « Arrêt de l'AMRAP », valeur, coche → synthèse |
| amrap-10 | Sons : bip long au début du bloc, 3 bips avant la fin ; arrière-plan : au retour, le temps a continué |

## 5. Death by (T4)

À venir.

## 6. Documentation (synchronisation code / documentation)

- Classe B : registre ch07 « EMOM — exécution (18/11/2026) » (décisions recopiées) ; conception consolidée, D4 annotée (texte d'origine conservé) ; ch13 CE-FMT-05 §7 complété ; référence Formats §10.1 ; spec PRE-11 §5 point 30 et §8 « T2 — EMOM ».
- Classe A : déroulement des fenêtres, arrière-plan, invariant À l'échec (règles déjà écrites).
- AMRAP (classe A et B) : registre ch07 « AMRAP — exécution (18/11/2026) » ; ch13 CE-FMT-05 §7 complété ; référence Formats §7.5 bis ; spec PRE-11 §6.3 et §7 annotés, §8 « T3 — AMRAP » ; D4 déjà annotée pour l'AMRAP.
- Chapitres 09 et 12 **non modifiés** (règle de la mission) ; compléments à reporter : résultats par fenêtre et par bloc AMRAP (ch09), commande `DECLARE`, pilotes `EMOM` et `AMRAP` (ch12) — notés dans les entrées ch07.

## 7. Fichiers modifiés, commit et état Git

- Domaine : `src/domain/execution/plan.ts`, `kernel.ts`, `projection.ts`, `signals.ts`, `policies/emom.ts` (nouveau), `policies/index.ts` ; `src/domain/sessions/formats/capabilities.ts`, `configurationValidity.ts`.
- Écran et service : `src/features/execution/ExecutionScreen.tsx`, `ExecutionEmomBanner.tsx` (nouveau), `ExecutionPartialRepetitionsSheet.tsx`, `ExecutionClosureSheet.tsx`, `ExecutionService.ts`, `executionStrings.ts` ; `src/infrastructure/haptics/ExecutionSignalAdapter.ts`.
- Tests : voir 3.5.
- Documents : voir 6 ; ce rapport.
- AMRAP : `src/domain/execution/plan.ts`, `projection.ts`, `signals.ts`, `policies/amrap.ts` (nouveau), `policies/index.ts` ; `src/domain/sessions/formats/capabilities.ts` ; `src/features/execution/ExecutionScreen.tsx`, `ExecutionService.ts`, `executionStrings.ts` ; tests (4.5) ; documents (6).
- Commits : EMOM `4d711768` (`feat(pre11): exécution de l'EMOM (T2)`) ; AMRAP : commit `feat(pre11): exécution de l'AMRAP (T3)` qui contient cette section (hash dans le compte rendu de livraison). Branche poussée, sans PR.
