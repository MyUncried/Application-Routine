# 2026-11-27 — AVANT-SEANCE-D577 — écran « Avant la séance » et transition entre séances

## Identifiant et objectif

- Mission : `AVANT-SEANCE-D577` (texte de Hermann du 27/11/2026). Développer l'écran « Avant la séance » en deux versions (première séance, séances suivantes d'un parcours), corriger la douleur facultative contraire à D-427, ajouter le réglage « Afficher l'écran de démarrage de séance » (Profil › Préférences) et la case « Ne plus afficher cet écran ».
- Sources lues sans fusion sur `origin/docs/planification-grille-creneaux` (`eaf523d7d`) : `docs/PROMPT-CLAUDE-CODE-AVANT-SEANCE-2026-11-27.md` (cahier des charges), `docs/DSF-AVANT-SEANCE-2026-11-27.md`, chapitre 07 (D-577, D-427), chapitre 13 (CE-EXEC-SESSION-01, tableau Figma), captures `figma-8921-35275.png`, `figma-12716-25405.png`, `figma-13419-1329.png`. Docs Expo v57 (`sdk/filesystem`) consultées pour l'API `File` (`textSync`, `write`, `exists`, `Paths.document`).

## Branche et commit de départ

- Worktree `C:\Dev\KODJO-AVANT-SEANCE`, branche `feat/avant-seance-d577`, créée depuis `1924e2014` (branche de recette `recette/agenda-axe-20261124`, lot 24). Le cahier des charges n'impose aucune autre base.
- `node_modules` : jonction vers `C:\Dev\Application-routine\node_modules` (aucune installation).

## Périmètre demandé / réellement traité

| Exigence | État | Fichier principal |
|---|---|---|
| Fond = premier écran d'exécution, voile blanc 50 % + voile vert `#1F9E7A` 35 %, Retour au-dessus, pas de nom de séance dans l'en-tête | Fait (fond = écran d'exécution réel rendu avec la projection de l'état initial du moteur, sans démarrage) | `ExecutionScreen.tsx` (fin du rendu « en cours ») ; `BeforeSessionScreen.tsx` |
| Version première séance : cadre de la liste (titre centré, pointillés, liste ordonnée, retraits, « 8 tours · TABATA », « Circuit libre », « 2 cycles ») + cadre de départ | Fait | `beforeSession.ts` (`sessionOutline`), `BeforeSessionScreen.tsx` |
| Douleur D-427 : obligatoire, sans présélection, sans légende, bouton inactif tant qu'aucun chiffre ; seulement avec l'option du Programme | Fait | `BeforeSessionScreen.tsx`, `ProgramService.painOptionFor` |
| Libellés « …la séance » / « …le parcours » / « …la 2ème séance » | Fait | `frExecution.ts` (`beforeSession`) |
| Version séances suivantes (rang ≥ 2) : un seul cadre centré, sans douleur | Fait | `BeforeSessionScreen.tsx` (mode `NEXT`) |
| Hauteur : cadre qui s'étend vers le haut, seule la liste défile, titre fixe | Fait (Jest : structure seulement ; rendu à vérifier sur iPhone) | `BeforeSessionScreen.tsx` |
| Relief du bouton (dégradé, bord inférieur épais, sans ombre portée) ; case choisie 40 × 58 avec ombre, sans liseré | Fait (styles ; rendu à vérifier sur iPhone) | `BeforeSessionScreen.tsx` |
| Polices Roboto | **Partiel** — police du système : Roboto (non condensé) n'est pas embarquée → `SCOPE_EXPANSION_REQUIRED` | — |
| Accessibilité (chiffre, sélectionné, rôle ; chiffre toujours écrit ; état inactif annoncé) | Fait | `BeforeSessionScreen.tsx` |
| Réglage global « Afficher l'écran de démarrage de séance » (Préférences, groupe Séance, première ligne, activé par défaut) | Fait | `ProfileScreen.tsx` |
| Case « Ne plus afficher cet écran » (hors option douleur, cette séance, jusqu'à changement d'ordre/contenu) | Fait | `startScreenStore.ts`, `beforeSession.ts` (`compositionFingerprint`) |
| Douleur seule si affichage désactivé avec l'option douleur | Fait (mode `PAIN_ONLY`) | `beforeSession.ts` (`startScreenMode`) |
| Douleur transmise à toute la chaîne (route, sans persistance) | Fait (paramètre de route `pain`) | `executionChain.ts`, `app/execution.tsx` |
| Ancien écran de transition (D-534 point 3) remplacé | Fait (`ChainVeil` supprimé, mention conservée) | `ExecutionScreen.tsx` |

## Constats

1. **L'« écran Avant la séance existant avec douleur facultative » n'existe pas dans le code** de la base `1924e2014` (ni sur `main`, ni sur les autres branches : `git log --all -S "douleur est notée 0"` vide). Il n'existait que dans l'ancien Figma (contradiction relevée au ch13 l. 2946). Le code avait seulement un écran de départ minimal (Retour, nom, « Démarrer », estimation, liste « Parcours ») et le voile `ChainVeil` (D-534). La règle « sans réponse = 0 » n'était donc implémentée nulle part ; aucune ligne de code ne déduit 0 d'une absence de réponse après la livraison (`parsePain` renvoie `null`, jamais 0 par défaut).
2. **Aucun stockage de la douleur d'une séance n'existe** (`ProgramService.painReadingCount()` renvoie 0, « la saisie pendant l'exécution n'existe pas encore »). D-577 interdit toute persistance nouvelle autre que la préférence et l'empreinte : la douleur est donc saisie, obligatoire, transmise à la chaîne, mais **non enregistrée**. → À CLARIFIER (ci-dessous).

## Modifications réalisées

- `src/features/execution/beforeSession.ts` (nouveau) : liste, empreinte de composition, choix de la version (`FULL`, `PAIN_ONLY`, `NEXT`, `NONE`), couleurs de l'échelle, lecture de la douleur de route.
- `src/features/execution/BeforeSessionScreen.tsx` (nouveau) : écran (voiles, cadres, `ScrollView` native pour la liste, `Pressable` natifs, rond Retour partagé `CloseCircleAction icon="back"`).
- `src/features/execution/startScreenStore.ts` (nouveau) : réglage + empreintes par séance, fichier JSON du dossier privé (`expo-file-system`, déjà présent, aucun nouveau module natif).
- `src/features/execution/ExecutionScreen.tsx` : option douleur, version de l'écran, départ automatique quand aucun écran n'est dû, rendu de l'écran d'exécution en fond (projection préparée), douleur passée à la séance suivante, suppression du bouton Démarrer de l'ancien écran de départ et de `ChainVeil`.
- `src/features/execution/executionChain.ts`, `app/execution.tsx` : paramètre de route `pain`.
- `src/features/programs/ProgramService.ts` : `painOptionFor(routineId, occurrenceKey)` (lecture seule).
- `src/features/preferences/ProfileScreen.tsx` : ligne interrupteur en tête du groupe Séance.
- i18n : `frExecution.ts`, `enExecution.ts`, `fr.ts`, `enScreensMovement.ts`.
- Tests : nouveaux `beforeSession.d577.test.tsx`, `ProgramService.painOption.d577.test.ts` ; ajustés (règle remplacée seulement) `ExecutionScreen.chain.test.tsx` (voile D-534 et liste « Parcours » remplacés), `ProfileScreen.test.tsx` (3 lignes dans le groupe Séance, test du réglage).

### Persistance (à signaler, autorisée par D-577 point 7)

Fichier `Documents/kodjo-start-screen.json` : `{ showStartScreen, dismissed: { <sessionId>: <empreinte> } }`. Choix technique (classe D) : fichier plutôt qu'une migration SQLite 043, pour éviter une nouvelle collision de version de base avec les branches parallèles (versions 40/41 déjà prises deux fois). Aucune autre donnée (ni la douleur).

## PRESERVE / CHANGE / FORBIDDEN — démonstration

**PRESERVE**
- Moteur et noyau, `ExecutionService` (API, persistance), résultats, historique, planification, bips/voix, dialogues : `git diff --stat 1924e2014 -- src/domain src/features/execution/ExecutionService.ts src/infrastructure src/features/planning src/features/execution/ExecutionDialog.tsx src/shared/ui/tokens.ts` → **vide**.
- Écran d'exécution lui-même : son rendu « en cours » n'est pas modifié ; seules modifications techniques nécessaires au rendu en fond : `return (` → `const body = (`, `active.saveError` → `active?.saveError`, garde `if (projection === null) return null`, condition de la fin minimale `active !== null && …`. Les 19 suites existantes de `src/features/execution/__tests__` passent (146 tests au total avec la nouvelle).
- Orchestration D-534 hors point 3 : `release()` avant navigation, ouverture automatique après `CHAIN_AUTO_NEXT_MS`, reprise sans chaîne — tests « séance intermédiaire », « arrêt volontaire », « reprise après interruption » inchangés et verts.
- Tests existants : seules les attentes de l'ancienne transition (voile D-534, liste « Parcours ») et du nombre de séparateurs du groupe Séance ont changé (texte d'origine conservé en commentaire « remplacé »).

**CHANGE** : écran « Avant la séance » (nouveau), réglage Préférences, douleur obligatoire avec option (D-427), écran de transition remplacé.

**FORBIDDEN**
- Moteur/modèle : non modifiés (diff vide ci-dessus).
- Déduire 0 d'une absence de réponse : aucune valeur par défaut ; bouton inactif sans choix (test « aucune présélection, bouton inactif »).
- Persistance autre que préférence + empreinte : aucune (pas de migration, `src/infrastructure` inchangé ; douleur non stockée).
- Primitives natives : `ScrollView`, `Pressable`, `Switch` natif (via `GuidanceSwitchRow`) ; aucune imitation de défilement ni de bouton. La case « Ne plus afficher » est une case dessinée (iOS n'a pas de case à cocher native) avec rôle `checkbox`.
- Réécriture massive des tests : non (2 fichiers ajustés ponctuellement).
- Aucune modification native (Swift/ObjC), aucun nouveau module natif, aucune dépendance installée.

## Preuves et tests

- `npx tsc --noEmit` : OK (aucune erreur).
- `npx eslint` sur les fichiers modifiés et créés : 0 erreur, 0 avertissement.
- `npx jest -w 1 --workerIdleMemoryLimit=800MB src/features/execution` : **20 suites, 146 tests, tous verts**.
- `npx jest … ProfileScreen.test.tsx ProgramService.test.ts src/shared/i18n` : **11 suites, 112 tests, verts**.
- `npx jest … ProgramService.painOption.d577.test.ts` : 1 test vert.
- Couverture des tests exigés : liste (ordre, retraits, majuscules, titre hors zone défilante, `ScrollView`) ; affichage (réglage global, case par séance, réapparition à changement de contenu, pas à changement de paramètres, douleur seule) ; douleur (inactif sans choix, actif après, aucune valeur par défaut ; pas d'échelle sans option ; jamais hors Agenda) ; rang ≥ 2 (pas d'échelle, « 2ème séance », un seul cadre) ; douleur transmise à la chaîne (`pain: "6"` dans la route de la séance 2) ; accessibilité de l'échelle.
- Échecs préexistants connus non relancés (hors périmètre) : `CompositionScreen.test.tsx` « … Démarrer (brouillon inchangé) … », `pre4Story11Controls` (`tokens.ts` non modifié).
- Jest ne prouve aucun rendu iPhone.

## Hypothèses non démontrées / À CLARIFIER

1. [Résolu le 27/11/2026, voir « Réponses de Hermann » : douleur stockée.] **À CLARIFIER — douleur non enregistrée** : aucune persistance de la douleur n'existe et D-577 n'en autorise pas de nouvelle. La valeur est obligatoire, transmise à la chaîne (route), puis perdue. Lecture la plus prudente retenue : ne rien stocker.
2. [Validé par Hermann le 27/11/2026, « 2. Ok ».] **Hypothèse à signaler (cahier des charges)** : un toucher ailleurs que sur le bouton ne fait rien (la zone retient les touchers).
3. **Fond** : l'écran d'exécution est rendu avec la projection de l'état initial du moteur (`READY`, non démarré) : titre vide et commandes inactives, alors que le Figma montre le nom du premier exercice. Le montrer exigerait de modifier l'écran d'exécution (PRESERVE) → non fait ; à confirmer sur iPhone.
4. [Remplacé le 27/11/2026, « 3. de la séance » : toujours le nom de la séance.] **Titre** : première séance d'un parcours = nom de la routine (`routineDisplayName`), sinon nom de la séance ; séances suivantes = nom de la séance (le Figma `12716:25405` montre le même titre, ambigu). À confirmer.
5. [Remplacé le 27/11/2026 pour les comptes, « 4. Oui, changer le nombre de cycle ou de tour ne fait pas revenir l'écran… ».] **Empreinte** : les comptes de tours et de cycles (affichés dans la liste) comptent comme contenu ; un exercice formaté seul (format sur l'exercice, hors circuit) est listé sans ligne de format ; la nature (Tours/Séries) n'est jamais affichée (« 3 tours » même pour un circuit en séries).
6. **Option douleur** : seulement pour un lancement depuis une occurrence d'Agenda (origine explicite) ; un lancement hors Agenda rattaché automatiquement (D-553) reste standard (D-427 « lancement indépendant »).
7. [Validé par Hermann le 27/11/2026, « 5. Oui ».] **Rang ≥ 2** : pas de case « Ne plus afficher » (non dessinée) ; si l'affichage est désactivé, la séance suivante démarre seule après la transition automatique. Le bouton Retour de la version rang ≥ 2 revient à l'écran précédent (fin du parcours).
8. **Affichage désactivé sans douleur** : la séance démarre aussitôt (compte à rebours), l'ancien bouton « Démarrer » étant remplacé.
9. **Libellé** : « Appuyer pour démarrer la 2ème séance » (cahier des charges, DSF § 5, D-577 point 4), alors que D-577 point 6 écrit « …la Xème séance du parcours » — lecture retenue : sans « du parcours » (point 4 explicite).
10. **Positions** : rond Retour à `insets.top − 11` (y = 51 sur un iPhone à 62 pt de marge), cadre de départ à 16 pt du bas de l'écran comme le Figma (zone de l'indicateur d'accueil).

## SCOPE_EXPANSION_REQUIRED

- **Police Roboto** : `@expo-google-fonts/roboto` n'est pas installé (seul `roboto-condensed` l'est). Installation interdite par la mission → police du système (poids gras/normal du DSF). Ajouter la dépendance (police chargée par `expo-font`, sans build natif) relève d'une décision distincte.

## Éléments non corrigés ou hors périmètre

- Chaînes `execution.chain.lines/routeTitle/routeItem` laissées en place (inutilisées après le remplacement), pour limiter le diff.
- Aucune documentation modifiée : classe A (le code rejoint D-577 et D-427, déjà écrites sur la branche de documentation, non fusionnée) ; aucune correction documentaire à préparer.

## Vérifications à effectuer sur iPhone

1. Séance lancée seule depuis le Catalogue : l'écran s'affiche sur l'écran d'exécution estompé (voile blanc puis vert), le rond Retour reste au-dessus, texte blanc lisible ; bouton « Appuyer pour démarrer la séance » à relief (bord inférieur bleuté, sans ombre portée).
2. Séance longue (beaucoup d'exercices) : le cadre de la liste monte jusque sous le rond Retour, seule la liste défile, le titre reste visible.
3. Titre long : passe sur deux lignes.
4. Séance d'une occurrence d'Agenda rattachée à un Programme avec suivi de la douleur actif : échelle 0–10 sans case choisie, bouton gris inactif (texte gris clair) ; toucher une case : elle grandit avec ombre, le bouton devient actif ; VoiceOver annonce « Douleur 3 sur 10, sélectionné, bouton radio » et l'état inactif du bouton.
5. Même lancement sans option douleur : pas d'échelle, case « Ne plus afficher cet écran » entre les deux cadres ; cocher puis démarrer ; relancer la même séance : pas d'écran, la séance démarre aussitôt ; modifier une durée : toujours pas d'écran ; ajouter ou déplacer un exercice : l'écran revient.
6. Profil › Préférences › Séance : « Afficher l'écran de démarrage de séance » en première ligne, activé ; le désactiver : plus aucun écran ; avec l'option douleur, seul le cadre douleur + départ s'affiche, centré.
7. Parcours de deux séances (puis trois) depuis l'Agenda : première séance « Appuyer pour démarrer le parcours » (douleur si option) ; après « Séance terminée », la séance suivante affiche un seul cadre centré « Appuyer pour démarrer la 2ème séance » (puis « 3ème »), sans échelle ; enchaînement de bout en bout.
8. Police : constater la police du système (Roboto non embarquée).

## Fichiers modifiés

`app/execution.tsx`, `src/features/execution/ExecutionScreen.tsx`, `src/features/execution/executionChain.ts`, `src/features/execution/beforeSession.ts` (nouveau), `src/features/execution/BeforeSessionScreen.tsx` (nouveau), `src/features/execution/startScreenStore.ts` (nouveau), `src/features/execution/__tests__/beforeSession.d577.test.tsx` (nouveau), `src/features/execution/__tests__/ExecutionScreen.chain.test.tsx`, `src/features/preferences/ProfileScreen.tsx`, `src/features/preferences/__tests__/ProfileScreen.test.tsx`, `src/features/programs/ProgramService.ts`, `src/features/programs/__tests__/ProgramService.painOption.d577.test.ts` (nouveau), `src/shared/i18n/resources/frExecution.ts`, `src/shared/i18n/resources/enExecution.ts`, `src/shared/i18n/resources/fr.ts`, `src/shared/i18n/resources/enScreensMovement.ts`, ce rapport.

## Synchronisation code / documentation

Classe **A** (conformité à D-577 et D-427 déjà écrites). Documents mis à jour : aucun. Correction préparée non appliquée : aucune.

## Commit final et état Git

Voir le message de livraison (commit unique contenant code, tests et ce rapport ; poussé sur `origin/feat/avant-seance-d577`, sans fusion).

---

## Réponses de Hermann du 27/11/2026 et second commit

Premier commit de livraison : `19fe31e4c`. Réponses transmises par le coordinateur, citations exactes : « 1. Oui il faut la stocker / 2. Ok / 3. de la séance / 4. Oui, changer le nombre de cycle ou de tour ne fait pas revenir l'écran. Quand l'écran revient alors qu'il avait été exclu, la coche "ne plus afficher cet écran" doit être cochée par défaut. / 5. Oui ».

**Correspondance des numéros** : Hermann a répondu aux points 1 à 5 de la liste « À CLARIFIER » du message de livraison : 1 douleur non enregistrée, 2 toucher ailleurs que sur le bouton, 3 titre, 4 contenu de la liste et de l'empreinte, 5 rang ≥ 2 (pas de case, Retour arrête le parcours). Le coordinateur a présenté le point 2 comme la validation du libellé « …la 2ème séance ». Or ce libellé était le point 6 de ce message, et Hermann n'y a pas répondu explicitement. Il reste inchangé dans le code et n'est pas consigné comme décision dans le patch documentaire. **À CLARIFIER** : faire confirmer explicitement ce libellé.

| Point | Traitement | Fichier |
|---|---|---|
| 1. Douleur stockée (classe B) | Fait. Nouvelle table `execution_pain_readings` (migration **043**, `DATABASE_VERSION = 43`). Chaque relevé contient l'Exécution, le moment `BEFORE`, la valeur (0..10, contrôlée en base) et la date. Il est supprimé avec l'Exécution. L'enregistrement a lieu après `service.start`, via `ProgramService.recordPainBefore`, sans toucher `ExecutionService` ni le moteur. **Parcours** : la douleur saisie une fois sur la séance 1 est enregistrée sur l'Exécution de **chaque** séance du parcours (valeur reçue par la route). Aucune localisation. Conséquence directe : Profil › Confidentialité compte désormais les relevés réels (`painReadingCount`), et « Effacer mes relevés » les supprime (`erasePainReadings`). Auparavant, ces deux fonctions renvoyaient respectivement 0 et rien. | `migration043.ts`, `SqliteProgramRepository.ts`, `ProgramService.ts`, `ExecutionScreen.tsx` (`start`) |
| 2. Toucher ailleurs sans effet | Validé, inchangé | `BeforeSessionScreen.tsx` |
| 3. Titre = nom de la séance | Fait. La lecture du nom de la routine est supprimée. | `ExecutionScreen.tsx` |
| 4. Tours et cycles hors de l'empreinte ; case cochée par défaut au retour de l'écran | Fait. L'empreinte retient la structure, le format des circuits, les exercices (mouvement, nom) et leur ordre, sans aucun compte. Si l'écran réapparaît pour une séance exclue, la case est cochée par défaut. Interprétation technique : si on la décoche puis démarre, l'exclusion est retirée. | `beforeSession.ts` (`compositionFingerprint`), `BeforeSessionScreen.tsx` (`initialDismiss`), `startScreenStore.ts` (`undismiss`) |
| 5. Rang ≥ 2 | Validé, inchangé | — |

**Risque de collision de version** : le numéro de base 43 n'est pris sur aucune autre branche distante au 27/11/2026, mais une branche parallèle pourrait le prendre (précédents : versions 40 et 41). Parade ajoutée : `repairMissingTables` recrée `execution_pain_readings` (création idempotente) sur une base en version 43 ou plus qui ne l'a pas. Les assertions `DATABASE_VERSION === 42` et `user_version: 42` de 30 fichiers de tests de migration sont passées à 43, comme lors des montées de version précédentes. C'est une modification mécanique, pas une réécriture de tests.

**PRESERVE après ce commit** : `src/domain/execution`, `ExecutionService.ts`, la planification et le moteur restent inchangés. `src/infrastructure` est modifié uniquement par l'ajout de la migration 043, de son raccordement et des trois méthodes du dépôt des programmes. C'est la persistance que Hermann a autorisée.

**Synchronisation documentaire : classe B.** La D-577 « Écran Avant la séance » n'existe que sur `docs/planification-grille-creneaux`. Sur cette branche, l'identifiant D-577 désigne une autre décision (« Période d'un programme »). J'ai donc appliqué la règle « source normative absente de la branche » : patch **préparé, non appliqué**, `_bmad-output/avant-seance-d577/integration-documentaire-D-577-D-427.patch` (chapitre 07 de la branche de documentation). Il ajoute un complément daté « [Réponses de Hermann du 27/11/2026 : …] » à D-577 et D-427, avec les citations exactes, sans nouveau numéro et sans supprimer l'ancien texte. Vérification : `git apply --cached --check` sur un index temporaire lu depuis `origin/docs/planification-grille-creneaux` → OK.

### Vérifications iPhone modifiées ou ajoutées

- **Point 7 (modifié)** : la première séance d'un parcours a pour titre le **nom de la séance**, et non plus celui de la routine.
- **Point 5 (modifié)** : changer le nombre de tours ou de cycles ne fait **pas** revenir l'écran. Ajouter, retirer ou déplacer un exercice le fait revenir, et la case « Ne plus afficher cet écran » est alors **déjà cochée**.
- **Point 9 (ajouté)** :
  1. Avant tout relevé, ouvrir Profil › Confidentialité : « Effacer mes relevés » est grisé (aucun relevé enregistré).
  2. Lancer depuis l’Agenda une séance d’un Programme dont le suivi de la douleur est actif, choisir 3 puis démarrer.
  3. Revenir dans Profil › Confidentialité : « Effacer mes relevés » est devenu actif, ce qui prouve que la douleur a été enregistrée. L’écran n’affiche pas de nombre de relevés.
  4. Effacer et confirmer : la ligne redevient grisée.
- **Point 10 (ajouté)** : migration de la base existante de l'iPhone vers la version 43 au lancement, sans perte de séances, de routines ni d'historique.

### Preuves et tests du second commit

- J'ai régénéré le patch documentaire et contrôlé qu'il s'applique sur `origin/docs/planification-grille-creneaux` à `e0ae161f7`, la tête relue après `git fetch` : `git apply --cached --check` → OK.
- `npx tsc --noEmit` : OK. `npx eslint` sur les fichiers modifiés : 0 problème.
- Jest, en ciblant `-w 1 --workerIdleMemoryLimit=800MB` :
  - `src/infrastructure/database`, `src/features/execution` et `ProfileScreen.test.tsx` : 87 suites, 724 tests. Premier passage : 3 échecs, dus à des attentes de migration non mises à jour pour la version 43 (table `execution_pain_readings` absente des listes attendues des tests 031 et 033, version relue dans le test 041). Après correction, ces trois suites passent : 9 tests, 0 échec.
  - `src/features/programs` avec les nouveaux tests : 9 suites, 100 tests, verts.
- Nouveaux tests :
  - `migration043.painReadings.test.ts` : base neuve, mise à niveau depuis la version 42, bornes, remplacement, suppression en cascade, effacement.
  - Ajouts dans `beforeSession.d577.test.tsx` :
    - le 0 choisi est enregistré ;
    - un parcours enregistre la douleur sur `exec-1` puis sur `exec-2` ;
    - le titre est le nom de la séance ;
    - la case est cochée par défaut au retour de l'écran ;
    - décocher la case retire l'exclusion ;
    - rien n'est enregistré sans l'option douleur ;
    - l'empreinte ignore le nombre de tours et de cycles.

### Correction ultérieure (même jour)

La mission « Fin de séance » (rapport `2026-11-27_FIN-SEANCE-D578.md`) corrige la présentation de cet écran selon le cahier des charges révisé : un seul cadre vert, le Bouton primaire hors du cadre, et la case « Ne plus afficher » dans un cadre accroché sous le cadre principal.
