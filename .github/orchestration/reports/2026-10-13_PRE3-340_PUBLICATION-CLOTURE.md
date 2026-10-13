# PRE-3 (#340) — revue du correctif de nettoyage des animations et publication de clôture

## Identité de la mission

| Élément | Valeur |
|---|---|
| Identifiant | `PRE3-340_PUBLICATION-CLOTURE` |
| Objectif | Revue indépendante du seul correctif de nettoyage des deux animations, puis publication et vérification de l’OTA `review`, avec preuves publiées sur GitHub |
| Source | `docs/preparation/PRE-3/planification/execution/preuves/mission-publication-cloture.md`, au commit `626632c3bf5b888756f24dd7f34fce2c448f9eb8` |
| Autorité | Validation intégrale de PRE-3 par Hermann (`validation-finale-proprietaire.json`, 12/10 à 23:52:48 ; clôture confiée au pilote à 23:53:45) |
| Opération et PR | #340 (ouverte), PR #351 (brouillon, `MERGEABLE`, tête `626632c3`) |
| Branche | `feat/pre3-exercice-20261009`. Départ local `64174128` (propre), avance rapide sans fusion vers la tête distante `626632c3`. |
| Limites | Aucune modification du protocole, aucune nouvelle tranche, pas de recette intégrale refaite, pas de fusion, #340 non fermée, aucune clôture canonique VNext |

## Revue indépendante du correctif

Le correctif `626632c3` modifie deux fichiers applicatifs, avec 4 lignes chacun :
- `src/features/activities/ExecutionParametersSheet.tsx` : montée de la feuille ;
- `src/shared/ui/SegmentedControl.tsx` : glissement de l’indicateur.

Dans les deux effets, `Animated.timing(...).start()` devient `const animation = Animated.timing(...); animation.start(); return () => animation.stop();`.

| Contrôle | Constat |
|---|---|
| Stabilité des dépendances | `sheetEntry` et `indicatorPosition` sont créées par `useState(() => new Animated.Value(…))` : identité stable. Le nettoyage ne s’exécute qu’au démontage ou au changement réel de `reduceMotion` / `selectedIndex`, jamais à chaque rendu. |
| Équivalence de comportement | Démarrer une animation sur une `Animated.Value` arrête déjà celle en cours, et `setValue` aussi. L’arrêt ajouté avant un nouvel effet est donc sans effet visible. **Durée, courbe, valeurs de départ et d’arrivée, `useNativeDriver`, rendu et sélection : inchangés.** |
| Cas « Réduire les animations » activé pendant la montée | Nettoyage (arrêt), puis branche existante `stopAnimation()` et `setValue(0)` : la feuille est en place, comme avant |
| Première mesure du segmenté | Branche `hasMeasuredRef` inchangée : retour sans animation ni nettoyage |
| Démontage | L’animation est arrêtée : plus aucun rappel de minuterie après la disparition du composant (cause du code de sortie 1 de Jest) |
| Rappels de fin | Aucun rappel de fin passé à `start()` : l’arrêt n’appelle aucun code applicatif |
| Consommateurs | `SegmentedControl` : Catalogue (Exercices / Séances) et feuille Paramètres (Mode, Côté, Ordre). `ExecutionParametersSheet` : éditeur d’exercice (Créer / Modifier). Leurs suites passent. |
| Ajouts interdits | Aucun délai, aucune exception ignorée, aucune assertion supprimée, aucun `--forceExit` |

**Causalité, vérifiée par mutation** (suites `ExecutionParametersSheet.test.tsx` et `CatalogueScreen.test.tsx`) :

| Version | Messages « Jest environment … torn down » | Tests |
|---|---|---|
| Sans le correctif (fichiers de `626632c3~1`) | **7** (`Timeout._onTimeout`, `@react-native/jest-preset/jest/setup.js:51`) | 70/70 |
| Avec le correctif | **0** | 70/70 |

**Verdict : conforme.** Aucun défaut causal constaté dans le correctif.

## Preuves et tests (au commit `626632c3`)

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit -p .` | sortie 0 |
| `npx eslint src app` | sortie 0 |
| `npx jest` (suite complète) | **sortie 0**, 98/98 suites, **1970/1970** tests, 0 message de destruction d’environnement |
| Obligations `@43e7b344` | **442/442** |
| CI GitHub de `626632c3` | `qualification` (ubuntu, windows), `historical-equivalence` (ubuntu, windows) et `historical-platform-coverage` : **success** ; `architecture-audit` et signal Work : ignorés (skipped) |

## Publication OTA

| Étape | Résultat |
|---|---|
| Delta de code depuis la dernière OTA (`29d149bd`) | Les 2 fichiers du correctif seulement |
| Compatibilité | `classify-environment-update.js` : **`OTA_COMPATIBLE`** par rapport au build 8 (`38bf5fc2…`, `58bbc3bc`) et à `29d149bd` ; aucun fichier natif ; **aucun nouveau build** |
| Publication | Depuis le worktree propre au commit exact `626632c3`, mécanisme existant (`--channel review --platform ios --environment development`) : **Published** |
| OTA | **`01a1324c-5bed-7dd7-b98a-77ebbd315429`**, groupe `1fbe366d-f95e-49e0-ac3c-2981869a81c3`, iOS, runtime 1.1.0, branche `review`, `gitCommitHash` **`626632c3bf5b888756f24dd7f34fce2c448f9eb8`**, 2026-10-12T22:47:07Z |
| Manifeste servi | Requête du client (iOS, 1.1.0, `review`) : HTTP 200, id `01a1324c…` |
| EAS (`update:view`) | Même id, iOS, 1.1.0, `gitCommitHash` `626632c3…`, aucun déploiement progressif |
| Assets | **57/57** téléchargés comme le client (en-têtes signés), SHA-256 conformes ; bundle de 2 824 296 octets |
| Exécution sur l’iPhone | **Non observée.** Vérifiable dans `routine://diagnostic-updates` (« Mise à jour exécutée » = `01a1324c-5bed-7dd7-b98a-77ebbd315429`). Elle n’est pas affirmée sans observation. |
| Erreurs | Aucune |

Liens Expo :
- mise à jour : https://u.expo.dev/update/01a1324c-5bed-7dd7-b98a-77ebbd315429 ;
- build compatible : https://expo.dev/accounts/ankushas-team/projects/routine/builds/38bf5fc2-b053-4fd1-a475-48f08b7f542f.

## Modifications réalisées

Documentaires seulement :
- `publication-ota-cloture.json` ;
- `verification-ota-cloture.json` ;
- le présent rapport.

Aucun fichier applicatif modifié par cette mission.

## Limites

- L’exécution de `01a1324c` sur l’iPhone n’est pas observée.
- Le mécanisme de réveil, la fusion, la publication du registre final et la fermeture de #340 relèvent du pilote ChatGPT.

## Commit final et état Git

Commit documentaire publié sans force sur `feat/pre3-exercice-20261009` (la tête de la PR #351 avance). Son hash et sa vérification par l’API GitHub figurent dans le retour au pilote. Worktree propre, synchronisé avec l’origine. **Aucune opération en cours.** Prochaine action : le pilote ChatGPT vérifie la CI de #351 et ces preuves, fusionne et publie le registre final.
