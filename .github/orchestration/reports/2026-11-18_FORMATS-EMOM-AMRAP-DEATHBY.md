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
| Death by (T4) | Réalisé, à vérifier sur iPhone (section 5) |

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

### 5.1 Sources appliquées

- Classe A : FMT-33 à FMT-38 (ch10) ; conception consolidée D2, D3, Q2, Q4, §12.4, §12.5, « Prescriptions et fins — complément du 5 novembre » (limite de l'intervalle) ; cas T16, T17, T18 ; contrat préparé `deathByLimit.ts` (même seuil) ; ch10 (arrière-plan).
- Classe B : arbitrages du 18/11/2026 (barre et Arrêt « Comme le For time » ; feuille « Fin du Death by » à coche seule, sans choix « Limite atteinte / Abandonner » ; sons existants). Remplace la confirmation à deux choix de CE-FMT-06 (annotée) et D4 « La Pause manuelle… » (déjà annotée).
- Aucune maquette d'exécution Death by (CE-FMT-06 : « Aucun nœud de confirmation Death by identifié ») : écran de l'EMOM réemployé.

### 5.2 Comportements livrés

- **Compilation.** Chaque segment progressif Death by de D.1 devient une portée `DEATH_BY` : Exercice autonome (y compris À la suite, et membre d'un Circuit standard groupé : une portée par passage, qui repart du départ — T16) ou Circuit porteur. Contenu : étapes-modèles du rang 1 de chaque membre (Série 1, ses côtés et la pause entre eux), fenêtres par rang (une seule pour l'Exercice ou le Circuit « dans chaque intervalle » ; une par membre, d'intervalle propre, en alternance — T17), étape de poids sans durée (régime ouvert : la durée estimée de la Séance devient un minimum). La Récupération d'un Exercice autonome (À la suite) suit la portée.
- **Rangs.** Le pilote rejoue les étapes-modèles à chaque rang (clés `…/k<rang>/…`, rattachées à leur modèle par `loopOf`), objectif = départ + incrément × (rang − 1), sans plafond (T18). Comme l'EMOM : « Suivant » termine une Série en Répétitions et acquiert le rang (FMT-35), une Série en Durée démarre à l'ouverture et finit à son terme (« Suivant » refusé), le repos se révèle, la fenêtre suivante commence à l'heure ; un second appui est refusé (FMT-36) ; une confirmation à l'échéance est acquise (Q4). Rangs acquis par membre et rangs entièrement acquis distincts.
- **Fenêtre manquée (D2).** Le défi s'arrête à l'échéance ; si un travail était entamé, Clôture (D3) : feuille « Fin du Death by » à coche seule (répétitions faites, ou durée tenue), écran figé ; validation → élément suivant. Le premier échec termine l'élément, Circuit porteur compris (FMT-34). Sans travail entamé (étape ouverte à l'instant même, pause entre les côtés), aucune feuille.
- **Limite de l'intervalle.** Avant chaque rang, travail connu (Durées, deux côtés et pause entre eux ; somme des membres d'une fenêtre commune ; zéro en Répétitions) comparé à chaque fenêtre ; atteinte ou dépassement → arrêt après le rang précédent, motif `INTERVAL_LIMIT_REACHED`, sans feuille ni partiel ; premier rang incompatible : aucun rang lancé.
- **Arrêt.** Feuille « Arrêt du Death by » (répétitions faites ou durée tenue), puis synthèse : motif `ABANDONED`. Ni Réinitialiser (Q2), ni Pause.
- **Résultat (FMT-38).** `acquiredRanks`, `acquired` (par membre), `rankReached`, motif (`WINDOW_MISSED`, `INTERVAL_LIMIT_REACHED`, `ABANDONED`), partiel, achèvement `INCOMPLETE` dans tous les cas.
- **Écran.** Celui de l'EMOM : grand chrono = temps restant de la fenêtre du rang, « Repos » orange, anneau (portion travaillée en violet), barre Arrêt / Pause désactivée / « Suivant » ; compteur Tour = rang en cours, sans total ; pas de bandeau ; écran figé à la fenêtre manquée (comme la borne du For time et l'échéance de l'AMRAP).
- **Sons.** Bip long au début de chaque fenêtre (première étape, réglage « Démarrage d'un exercice ») ; 3 bips courts avant chaque échéance (références WINDOW, comme l'EMOM).
- **Arrière-plan.** Aucune Pause pendant les fenêtres.
- **Descripteur.** Death by exécutable ; A4 (« suite après une fenêtre non acquise ») tranché par D2, D3 et l'arbitrage du 18/11 ; plus aucun Format spécialisé indisponible (`notLaunchableFormats` conservé, texte générique).

### 5.3 Constats

- Le Death by réutilise sans modification le noyau (références WINDOW, fermeture des descendants), les feuilles de Clôture et d'Arrêt, le chrono de fenêtre et les bips de l'EMOM, et le rattachement `loopOf` de l'AMRAP pour un compte ouvert.
- Aucun défaut trouvé par les tests dans le code existant.

### 5.4 Interprétations à confirmer (À CLARIFIER, n'empêchent aucune opération)

1. Membre en Durée (spec §7) : démarrage à l'ouverture de la fenêtre, rang acquis à la fin de la durée (comme l'EMOM).
2. Limite de l'intervalle : aucune feuille, la Séance enchaîne.
3. Compteur : libellé « Tour » existant, valeur = rang en cours.
4. Death by en fin de Séance : Fin de séance sautée après la feuille « Fin du Death by » (comme l'AMRAP et le For time).
5. Récupération d'un Death by autonome À la suite : jouée après l'élément.
6. Étape ouverte à l'instant même de l'échéance : pas de feuille.
7. Fenêtre commune terminée pendant la pause entre les côtés : défi terminé sans partiel.

### 5.5 Tests

- `npx tsc --noEmit -p .` : aucune erreur. `npx eslint src/domain/execution src/features/execution src/domain/sessions/formats` et tests touchés : aucun signalement.
- Nouveaux : `src/domain/execution/__tests__/deathBy.pre11.test.ts` (14 : compilation et durée minimum, rangs et objectifs, FMT-36, Q4, D2 en Répétitions puis suite de Séance, D2 en Durée dans une fenêtre commune, limite 10 s + 10 s / 60 s, limite dès le rang 1, limite avec deux côtés et pause, T18, T16, T17, Arrêt et Réinitialiser refusé, bips) ; `src/features/execution/__tests__/ExecutionScreen.deathBy.pre11.test.tsx` (2 : rangs, repos, fenêtre manquée et « Fin du Death by », Arrêt).
- Attentes anciennes annotées (le Death by n'est plus l'exemple de Format indisponible ; plus aucun ne l'est ; A4 tranché) : `plan.pre10.test.ts`, `configurationValidity.d4.test.ts`, `formatCapabilities.d3.test.ts`.
- `npx jest` (suite complète, après la dernière modification de code) : 406 suites, 6 235 tests réussis, 32 ignorés, aucun échec.

### 5.6 Vérifications à effectuer sur l'iPhone (Routine BMAD, Metro de `KODJO-FORMATS`)

| Ligne | Vérification |
|---|---|
| deathby-1 | Death by d'un mouvement (départ 3 rép., + 2, 1 min) : grand chrono 01:00 qui décompte ; barre Arrêt, Pause grisée, Suivant ; Tour 1 |
| deathby-2 | Suivant : « Repos » orange, anneau violet puis orange, Suivant grisé ; à 00:00, Tour 2, objectif 5 |
| deathby-3 | Fenêtre laissée sans Suivant : écran figé, feuille « Fin du Death by » (nom, objectif du rang, roulette), coche → exercice suivant |
| deathby-4 | Arrêt pendant un rang : feuille « Arrêt du Death by », valeur, coche → synthèse |
| deathby-5 | Death by en Durée (10 s, + 10 s, 1 min) : départ seul à chaque minute, compte à rebours ; arrêt après le rang 5, sans feuille |
| deathby-6 | Circuit « dans chaque intervalle » (A puis B dans la même minute) : Suivant sur A, puis B ; rang suivant à la minute |
| deathby-7 | Circuit en alternance (A 1 min, B 1 min 30) : A, B, A, B… ; premier échec : feuille, puis fin du Circuit |
| deathby-8 | Death by dans un Circuit standard à 2 tours : après l'échec, l'exercice suivant du Circuit ; au tour 2, le Death by repart au départ |
| deathby-9 | Sons : bip long au début de chaque fenêtre, 3 bips avant la fin |
| deathby-10 | Arrière-plan pendant une fenêtre : au retour, le temps a continué (ou le défi s'est arrêté si la fenêtre a été manquée) |

## 6. Documentation (synchronisation code / documentation)

- Classe B : registre ch07 « EMOM — exécution (18/11/2026) » (décisions recopiées) ; conception consolidée, D4 annotée (texte d'origine conservé) ; ch13 CE-FMT-05 §7 complété ; référence Formats §10.1 ; spec PRE-11 §5 point 30 et §8 « T2 — EMOM ».
- Classe A : déroulement des fenêtres, arrière-plan, invariant À l'échec (règles déjà écrites).
- AMRAP (classe A et B) : registre ch07 « AMRAP — exécution (18/11/2026) » ; ch13 CE-FMT-05 §7 complété ; référence Formats §7.5 bis ; spec PRE-11 §6.3 et §7 annotés, §8 « T3 — AMRAP » ; D4 déjà annotée pour l'AMRAP.
- Death by (classe A et B) : registre ch07 « Death by — exécution (18/11/2026) » ; ch13 CE-FMT-05 §7 complété et CE-FMT-06 §7 annoté (confirmation à deux choix remplacée, texte d'origine conservé) ; référence Formats §12.1 ; spec PRE-11 §6.1, §6.4, §7 annotés, §8 « T4 — Death by ».
- Chapitres 09 et 12 **non modifiés** (règle de la mission) ; compléments à reporter : résultats par fenêtre, par bloc AMRAP et d'élément Death by (ch09), commande `DECLARE`, pilotes `EMOM`, `AMRAP` et `DEATH_BY` (ch12) — notés dans les entrées ch07.

## 7. Fichiers modifiés, commit et état Git

- Domaine : `src/domain/execution/plan.ts`, `kernel.ts`, `projection.ts`, `signals.ts`, `policies/emom.ts` (nouveau), `policies/index.ts` ; `src/domain/sessions/formats/capabilities.ts`, `configurationValidity.ts`.
- Écran et service : `src/features/execution/ExecutionScreen.tsx`, `ExecutionEmomBanner.tsx` (nouveau), `ExecutionPartialRepetitionsSheet.tsx`, `ExecutionClosureSheet.tsx`, `ExecutionService.ts`, `executionStrings.ts` ; `src/infrastructure/haptics/ExecutionSignalAdapter.ts`.
- Tests : voir 3.5.
- Documents : voir 6 ; ce rapport.
- AMRAP : `src/domain/execution/plan.ts`, `projection.ts`, `signals.ts`, `policies/amrap.ts` (nouveau), `policies/index.ts` ; `src/domain/sessions/formats/capabilities.ts` ; `src/features/execution/ExecutionScreen.tsx`, `ExecutionService.ts`, `executionStrings.ts` ; tests (4.5) ; documents (6).
- Death by : `src/domain/execution/plan.ts`, `projection.ts`, `policies/deathBy.ts` (nouveau), `policies/index.ts` ; `src/domain/sessions/formats/capabilities.ts` ; `src/features/execution/ExecutionScreen.tsx`, `ExecutionService.ts`, `executionStrings.ts` ; tests (5.5) ; documents (6).
- Commits : EMOM `4d711768` (`feat(pre11): exécution de l'EMOM (T2)`) ; AMRAP `7d2ceb08` (`feat(pre11): exécution de l'AMRAP (T3)`) ; Death by : commit `feat(pre11): exécution du Death by (T4)` qui contient cette section (hash dans le compte rendu de livraison).
- État Git : branche `formats/emom-amrap-deathby-20261118` poussée, sans PR ; elle part de `a3845e0f` (PR #444, non fusionnée) : une PR vers `main` n'aura un diff propre qu'après la fusion de la PR #444 (ou avec la PR #444 comme base).

## 8. Vérifications sur appareil réel (synthèse)

Rien n'a été vérifié sur iPhone ni à l'écran (aucun navigateur, aucun contrôle visuel automatique). Lignes de recette : emom-1 à emom-10 (3.6), amrap-1 à amrap-10 (4.6), deathby-1 à deathby-10 (5.6). Préalable : Metro de Routine BMAD lancé depuis `C:\Dev\KODJO-FORMATS` (`APP_VARIANT=bmad npx expo start --dev-client --lan --port 8085`), après la recette de la fiche Mouvement en cours sur le Metro de `KODJO-MOUV`.

## 9. Recette du 18/11 — corrections EMOM

Recette iPhone de Hermann (cahier en ligne ; Routine BMAD servie par `KODJO-FORMATS`, tunnel 8085) : emom-1 KO, emom-3 KO, emom-2, emom-4, emom-5 OK, plus des « Autres constats ». Textes recopiés dans la spec PRE-11 §5 point 31 et au registre ch07 « EMOM — recette iPhone (18/11/2026) » (classe B).

### 9.1 Constats et corrections

| Écart | Cause constatée | Correction |
|---|---|---|
| emom-1 : Suivant et Pause non conformes | Pendant le Compte à rebours initial, l'élément EMOM n'est pas encore ouvert : barre standard (Pause 72 active, Suivant 48 à contour). Pendant les fenêtres, la barre était déjà celle du For time. | La projection donne le Format de l'élément à venir (`UpcomingActivity.format`) ; une séance qui commence par un EMOM ou un Death by a dès le Compte à rebours la barre du Format (Réinitialiser inactif, Pause désactivée 48, « Suivant » 72 bleu plein qui passe le Compte à rebours). |
| emom-3 et « Retirer l'écran de saisie pendant l'effort » | Bandeau Q1 pendant la fenêtre suivante. | Bandeau supprimé (`ExecutionEmomBanner.tsx` et ses libellés retirés) ; saisie à la fin de l'EMOM seulement. La commande `DECLARE` du noyau reste, sans écran. |
| a. Double bip à l'appui sur Suivant | L'étape `WINDOW_REST` n'avait pas de son. | Son et vibration de la Pause entre les Séries (`BIP_DOUBLE`, vibration forte, événement « Point d'arrêt »), sans annonce. EMOM et Death by. |
| b. Objectif conservé, fond vert | Le coin n'affichait l'objectif que pendant une étape `ACTIVITY`. | Le repos de la fenêtre porte l'objectif et le mode du travail (plan EMOM, rangs Death by) ; coin sur fond vert (#BDEBC9), texte vert foncé. |
| c. « Repos » en titre | « Repos » dans le cercle, le nom en titre. | Titre « Repos » ; plus rien dans le cercle. |
| d. et h. Synthèse | La ligne de l'Exercice montrait le temps de travail cumulé, sans Séries ni répétitions. | EMOM : une ligne par Série, « Série k · Terminée · 10 / 10 rép. » ou « Non terminée · 4 / 10 rép. » (`seriesLines`, `results.ts`) ; temps cumulé retiré de la ligne de l'Exercice. |
| e. « Fenêtre » → « Série » | Feuille « Mouvement · fenêtre k ». | « Mouvement · série k ». |
| f. Fenêtre « Résultat » | Pendant la Clôture, l'écran derrière la feuille passait à l'étape `CLOSURE` (titre « Résultat ») ; l'EMOM n'était pas dans `freezesAtEnd`. | L'EMOM rejoint `freezesAtEnd` : écran figé au dernier état du travail pendant « Fin de l'EMOM » ; Fin de séance sautée si l'EMOM termine la Séance (comme l'AMRAP). |
| g. Clignotement du coin d'objectif | — | Aux 3 dernières secondes de chaque fenêtre, clignotement à chaque seconde (`ExecutionCornerBadge.pulse`, celui du décompte du For time) : vert → #7FD39A au repos, gris → #D3D6DE au travail. EMOM et Death by. |

Death by (même écran) : barre au Compte à rebours, a, b, c et g appliqués ; d/h non (rangs, pas de Séries) ; f déjà en place.

### 9.2 Interprétations à confirmer (À CLARIFIER, n'empêchent aucune opération)

1. « nombre de séries / objectif » compris comme « réalisé / objectif » de chaque Série.
2. Teintes : vert du décompte du For time ; gris foncé #D3D6DE.
3. « Suivant » pendant le Compte à rebours le passe (comme le bouton standard).
4. Écran figé : dernier état du travail, donc titre « Repos » si la dernière fenêtre était terminée.
5. Barre du Format au Compte à rebours non appliquée au For time ni à l'AMRAP (non demandé).

### 9.3 Tests

- `npx tsc --noEmit -p .` : aucune erreur. `npx eslint` sur les fichiers touchés : aucun signalement.
- Mis à jour ou ajoutés : `ExecutionScreen.emom.pre11.test.tsx` (barre au Compte à rebours ; repos : titre « Repos » et objectif ; aucune saisie pendant les fenêtres ; feuille « · série 2 » sur écran figé, jamais « Résultat » ; synthèse par Série), `ExecutionScreen.deathBy.pre11.test.tsx` (titre « Repos », objectif du rang), `ExecutionSignalAdapter.test.ts` (double bip au repos de la fenêtre).
- Garde PRE4-1.1/AC1 : premier passage en échec sur `target === null` (libellé de synthèse) ; réécrit, garde verte.
- `npx jest` dans `KODJO-FORMATS` : 398 suites réussies, 8 en échec (35 tests), toutes du catalogue ; cause : `catalogue/catalogues/kodjo-pilote-60.catalogue.json` modifié dans l'arbre de travail par l'administration lancée depuis ce dossier (révision 2, non commité, hors mission). Même suite dans un worktree temporaire (commit de départ `f0e6a93e` + fichiers source de cette correction, fichier pilote versionné) : 406 suites, 6 237 tests réussis, 32 ignorés, aucun échec. Commit de livraison : `0dc5f8a1`.

### 9.4 Fichiers modifiés

`src/domain/execution/projection.ts`, `results.ts`, `plan.ts`, `policies/deathBy.ts` ; `src/features/execution/ExecutionScreen.tsx`, `executionStrings.ts`, `ExecutionEmomBanner.tsx` (supprimé) ; `src/infrastructure/haptics/ExecutionSignalAdapter.ts` ; tests ci-dessus ; registre ch07, ch13 (CE-FMT-05, CE-FMT-06), Formats §10.1, conception consolidée (Q1), spec PRE-11 §5 point 31, ce rapport. Chapitres 09 et 12 non modifiés. Non commité : `catalogue/catalogues/kodjo-pilote-60.catalogue.json`.

### 9.5 Vérifications sur iPhone (Routine BMAD, Metro de `KODJO-FORMATS`)

emom-r1 à emom-r8 (barre au Compte à rebours ; aucune saisie pendant les fenêtres ; double bip ; repos ; clignotement ; écran figé et « série k » ; synthèse par Série ; Death by) : lignes du cahier en ligne. Rien n'a été vérifié sur iPhone.
