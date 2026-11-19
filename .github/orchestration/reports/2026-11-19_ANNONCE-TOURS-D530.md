# 2026-11-19 — ANNONCE-TOURS-D530 : annonce des tours en AMRAP et en For time

## Identifiant et objectif

- Mission : section c) « annonce des tours en AMRAP et en For time (18/11/2026) » de la note « Autres remarques » du cahier de recette en ligne (Hermann).
- Objectif : appliquer D-530 et RM-269 (chapitres 07 et 10 de `docs/Specifications-fonctionnelles/`, branche `docs/planification-grille-creneaux`, commits `323cce10` et `141dd219`, lus sans fusion ni checkout).

## Branche et commit de départ

- Worktree `C:\Dev\KODJO-EMOM-DUREE`, branche dédiée `recette/annonce-tours-20261119`, créée depuis `40a9f53e` (`recette/emom-intervalle-repere-20261119`, mission e). Branches empilées (même écran d'exécution) ; pas de fusion, pas de PR.

## Périmètre demandé

1. Annonce à chaque début de tour, y compris le premier : « Premier tour, 21 répétitions », « Deuxième tour, 15 répétitions »… ; « 1 répétition » au singulier. Au départ du chrono pour le premier, à l'appui sur « + Tour » pour les suivants.
2. Un seul signal par appui : interrupteur « Annonce des tours » activé (défaut) → annonce seule, sans bip ; coupé → bip seul selon Son et Vibration ; jamais les deux.
3. Appui répété : un tour (D-19), un signal.
4. Dernier appui du For time : pas d'annonce de tour, annonce de fin habituelle ; AMRAP : fin au temps limite.
5. Profil : interrupteur « Annonce des tours » ajouté aux six annonces, activé par défaut, indépendant (RM-087).
6. Objectif de tour non unique : ne pas trancher, signaler.

## Périmètre réellement traité

Les six points. Mécanisme d'annonce existant réutilisé (`ExecutionSignalAdapter`, signal `TRANSITION` du début d'étape, voix `ExecutionVoice`) : aucun second mécanisme.

## PRESERVE / CHANGE / FORBIDDEN

| | Élément | Démonstration |
|---|---|---|
| PRESERVE | Six annonces existantes | Leur logique (`transition`) est inchangée ; seule la transition qui ouvre un tour d'objectif unique est détournée. Suites `src/infrastructure/haptics` (8 suites existantes) vertes sans modification. |
| PRESERVE | Comptage des tours, bouton « + Tour » (et « Tour · n » de la mission b) | `ExecutionScreen.tsx` non modifié ; politiques `forTime.ts` / `amrap.ts` non modifiées ; suites For time et AMRAP vertes. |
| PRESERVE | Autres formats | `roundStart` n'est calculé que pour FOR_TIME et AMRAP ; test « hors For time et AMRAP : aucun début de tour ». EMOM / Death by : champ absent. |
| PRESERVE | Moteur | `kernel` et `policies/` non modifiés. `projection.ts` : ajout d'un champ de lecture seule (`roundStart`). |
| CHANGE | Annonce ou son au début de tour | `ExecutionSignalAdapter.guidance` ; test `ExecutionSignalAdapter.rounds.test.ts`. |
| CHANGE | Interrupteur du Profil | `VOICE_ANNOUNCEMENTS` + `rounds`, `Profile.announceRoundsEnabled`, `migration031`, libellé « Annonce des tours ». |
| FORBIDDEN | Réécriture de tests en masse | Aucune. Modifications de tests existants : (a) montée mécanique de la version de base `30 → 31` dans 21 fichiers de tests de migration (`expect(DATABASE_VERSION).toBe(…)`, `{ user_version: … }`), même patron que le commit de `migration030` (`32e1ff8d`, 22 fichiers) ; (b) ajout de la clé `rounds` dans 4 littéraux de réglages de guidage (types). Aucune assertion de comportement changée. |

## Constats

- Aujourd'hui (avant), à l'appui sur « + Tour » : transition `ACTIVITY` ordinaire — sifflet (son du départ d'exercice) **et** annonce. AMRAP d'un exercice : la Série reste 1 d'un tour à l'autre, l'annonce est complète, nom compris (« Squat, 10 répétitions ») ; For time d'un exercice : « Deuxième série, 21 répétitions » ; plusieurs exercices : nom du premier exercice et objectif. Avec D-530 et l'interrupteur activé, cette annonce est **remplacée** par l'annonce du tour (pas de cumul de deux annonces vocales au même appui).
- Articulation avec la mission amrap-1 suivante (« ne pas répéter le nom du mouvement s'il ne change pas ») : à l'interrupteur activé, le nom n'est dit que s'il change (règle existante du 13/11/2026 : différent de l'exercice précédent et pas déjà annoncé en « À suivre ») ; AMRAP d'un exercice → « Deuxième tour, 8 répétitions ». Le point amrap-1 reste à traiter pour les autres cas (interrupteur coupé, Séries hors début de tour).

## Modifications réalisées

- `src/domain/execution/projection.ts` : `FormatView.roundStart` (rang du tour et objectif de répétitions commun, `null` s'il n'est pas unique), calculé pour l'étape qui ouvre un tour du For time (premier exercice d'un même `roundKeyOf`, hors buy-in/buy-out) et de la boucle AMRAP.
- `src/features/execution/ExecutionService.ts` : `ExecutionSignal.round`, renseigné sur la transition qui ouvre un tour.
- `src/infrastructure/haptics/ExecutionSignalAdapter.ts` : catégorie `rounds` ; au début d'un tour d'objectif unique — interrupteur activé et voix de séance active : annonce « <Ordinal> tour[, nom s'il change][, premier côté], N répétition(s) », aucun son (même un son choisi pour l'événement), vibration conservée ; sinon : son du départ d'exercice selon Son et Vibration, aucune annonce. Ordinaux masculins, singulier « 1 répétition ».
- Profil : `guidanceSettings.ts` (septième annonce), `Profile.ts` (`announceRoundsEnabled`, défaut activé, `profileGuidance`), `ProfileRepository.ts`, `SqliteProfileRepository.ts`, `DatabaseRows.ts`, `migration031.ts` (colonne additive `guidance_preferences.announce_rounds_enabled`, défaut 1), `migrateDatabase.ts`, `constants.ts` (`DATABASE_VERSION = 31`), `ProfileScreen.tsx`, `fr.ts` (« Annonce des tours »).
- Spec `_bmad-output/pre11/spec-pre11-formats.md`, point 38.

## Preuves et tests

- `npx tsc --noEmit` : aucune erreur.
- eslint sur les fichiers touchés : aucune erreur.
- Nouveaux tests :
  - `src/infrastructure/haptics/__tests__/ExecutionSignalAdapter.rounds.test.ts` (10) : annonce sans son (interrupteur activé), son seul sans annonce (coupé), son choisi non joué (activé) / seul joué (coupé), singulier, appui répété = un signal, nom dit seulement s'il change, objectif non unique = annonce d'avant, fin de séance sans annonce de tour, voix de séance coupée = son seul.
  - `src/features/execution/__tests__/ExecutionService.roundAnnouncement.test.ts` (3) : For time 3 × 21 (premier tour au départ, suivants à « + Tour », appui sur cible périmée refusé sans signal, dernier appui sans tour) ; AMRAP incrément −2 (10, 8, 6) ; exercice hors format sans tour.
  - `src/infrastructure/database/__tests__/migration031.test.ts` (2) : activé par défaut (base existante et neuve), réglages existants conservés, bascule indépendante.
- Jest ciblé `--maxWorkers=2` : voir « Tests » en fin de rapport.

## Hypothèses non démontrées

- Place du nom dans l'annonce quand il change (« Deuxième tour, Thrusters, 15 répétitions ») : choix technique d'ordre, D-530 ne cite que l'ordinal et l'objectif.
- Interrupteur coupé : « bip seul » appliqué strictement — l'annonce habituelle de l'objectif / du nom au début du tour n'est plus dite (sinon il y aurait « les deux »).
- « Premier côté » conservé dans l'annonce du tour pour un exercice de chaque côté.
- Le septième interrupteur apparaît aussi dans la modale de guidage de la Composition (formulaire commun au Profil, RM-087) ; une séance réglée avant cette version lit « activé » (valeur absente).

## Éléments non corrigés ou hors périmètre (signalés)

- **Objectif de tour non unique** (AMRAP / For time à plusieurs mouvements d'objectifs différents, tour avec un exercice en durée) : non tranché ; l'annonce d'avant est conservée (nom + objectif du premier exercice, avec son sifflet).
- Tour précédé d'une Récupération entre les tours : l'annonce du tour tombe à la fin de la Récupération (ouverture du tour), pas à l'appui « + Tour » (qui ouvre la Récupération, annoncée « Récupération »).
- For time avec buy-in : le premier tour est annoncé à la fin du buy-in (« Suivant »), pas au départ du chrono.
- Documentation sur cette branche encore à « six annonces » (sources D-530 sur `docs/planification-grille-creneaux`, non fusionnée ; classe A, non modifiée ici) : ch05 l. 389, ch06 l. 352, ch07 l. 2679, ch09 l. 1187 (ch09 non touché), ch10 RM-087 l. 2274 et l. 2287, ch12 l. 2080 (ch12 non touché). Le complément RM-087 existe déjà sur la branche docs.
- Mission amrap-1 (nom non répété hors début de tour, synthèse, etc.) : non traitée ici.

## Vérifications restant à effectuer sur iPhone

- Voix française des ordinaux (« Premier tour », « Deuxième tour »…).
- Enchaînement avec les autres annonces (« Préparez-vous », « À suivre », « Bravo, séance terminée »).
- Chevauchement avec la musique.
- Interrupteur « Annonce des tours » du Profil : présent, activé par défaut, coupé → sifflet seul au début de tour.

## Fichiers modifiés

Voir `git show --stat` du commit final (code listé ci-dessus ; tests : 3 nouveaux, 4 littéraux complétés, 21 fichiers de migration à la version 31).

## Commit final et état Git

Renseignés en fin de rapport après commit.
