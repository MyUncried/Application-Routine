# NAV-FIN-SEANCE-CATALOGUE — fin d'une séance du Catalogue sans second jeu d'onglets

## Identifiant et objectif

- **Mission :** NAV-FIN-SEANCE-CATALOGUE (accord de Hermann du 22/11/2026, 21h30 : « Tu peux lancer le premier point »).
- **Objectif :** à la fin d'une séance lancée depuis le Catalogue, rouvrir l'Agenda à la date de l'exécution **sans** empiler un nouveau jeu d'onglets au-dessus de l'écran d'Exécution.
- **Origine :** diagnostic `DIAG-CPU-MEMOIRE-2211` (branche `diag/cpu-memoire-20261121`, rapport `2026-11-22_DIAG-CPU-MEMOIRE-2211.md`, commits `aaea8db6` et `052ecfcc`).

## Branche et commit de départ

`feat/plan-20261121`, worktree `C:\Dev\KODJO-PLAN`, départ `1f6b94c3` (identique à `origin`). Aucun verrou d'écrivain présent.

## Périmètre demandé

Correctif de navigation en fin de séance (premier point du diagnostic). La recherche de la boucle qui sature le processeur reste hors périmètre.

## Périmètre réellement traité

`ExecutionScreen.close` et ses deux tests.

## Constats

- `2f1a7cdf` (recette du 21/11, constat f) appelait `router.navigate({ pathname: "/calendar", … })`.
- Dans `expo-router` 57.0.16, `NAVIGATE` vers la pile racine (`StackRouter.js`, l. 178–238) ne réutilise un écran existant que s'il est l'écran courant. Ici l'écran courant est `execution` : un nouvel écran `(tabs)` était poussé, l'Exécution terminée et le premier jeu d'onglets restant montés en dessous.
- Hermann a joué quatre séances du Catalogue le 22/11 (14h24, 19h03, 19h10, 19h45) : autant de jeux d'onglets supplémentaires en mémoire avant la fermeture de 21h12.
- `router.dismissTo` (`POP_TO`, `StackRouter.js`, l. 336–380) revient à l'écran `(tabs)` déjà présent sous l'Exécution et lui transmet `/calendar` avec `day` et `at`. S'il n'en trouve pas (Exécution ouverte seule, par exemple depuis un rappel), il remplace l'Exécution par les onglets. C'est déjà le patron de l'application (`LibraryScreens.tsx`, `app/(creation)/_layout.tsx`).

## Modifications réalisées

- `src/features/execution/ExecutionScreen.tsx` : `router.navigate` → `router.dismissTo`, mêmes paramètres ; annotation datée, ancien comportement conservé entre crochets.
- `ExecutionScreen.chain.test.tsx`, `ExecutionScreen.pre10.test.tsx` : la fin d'une séance du Catalogue appelle `dismissTo` vers `/calendar` (et plus `navigate`).

`PRESERVE` : destination (Agenda à la date de l'exécution), condition (séance hors Agenda, commencée, sans chaîne ni occurrence), enchaînement d'un parcours (`replace`), retour habituel d'une reprise (`back`/`replace("/")`). Inchangés.

## Synchronisation code / documentation

Classe **D** : la règle visible (constat f, ch07 du 21/11) est inchangée ; seule la pile de navigation diffère. Aucun document modifié.

## Preuves et tests

- `npx jest src/features/execution app/__tests__` : 18 suites, 103 tests réussis.
- `npx tsc --noEmit` : propre.
- `npx eslint` sur les trois fichiers : propre.
- Jest simule le routeur : il ne prouve pas l'état réel de la pile sur l'iPhone.

## Hypothèses non démontrées

- Le passage des paramètres `day`/`at` à l'onglet Calendrier par `dismissTo` est déduit du code d'`expo-router` et de React Navigation ; à vérifier sur l'iPhone.
- Gain de mémoire réel : non mesuré.

## Éléments non corrigés ou hors périmètre

Saturation du processeur antérieure au 22/11 (cause indéterminée) : suite du diagnostic `DIAG-CPU-MEMOIRE`.

## Vérifications restant à effectuer sur appareil réel

Ligne `c34-fin-catalogue` du cahier : séance du Catalogue terminée → Agenda à la date de l'exécution ; geste retour (bord gauche) sans retour à l'Exécution terminée ; deux séances d'affilée puis Catalogue et Agenda normaux.

## Fichiers modifiés

- `src/features/execution/ExecutionScreen.tsx`
- `src/features/execution/__tests__/ExecutionScreen.chain.test.tsx`
- `src/features/execution/__tests__/ExecutionScreen.pre10.test.tsx`
- `.github/orchestration/reports/2026-11-22_NAV-FIN-SEANCE-CATALOGUE.md`

## Commit final et état Git

Commit sur `feat/plan-20261121`, envoyé sur `origin` (hash donné dans le compte rendu).
