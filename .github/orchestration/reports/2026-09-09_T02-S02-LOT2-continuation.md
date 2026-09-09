# T02-S02 — LOT_2_OF_2 — continuation après récupération manuelle et recette visuelle

## Identifiant et objectif de la mission

- **Tranche** : `T02-S02`, continuation du lot `LOT_2_OF_2` du plan approuvé
  `T02-S02-PLAN-02`.
- **Session Claude** : `45e57018-9826-40b3-8ca7-75298dde17e3` (reprise
  différentielle).
- **Commentaires d'orchestration** : plan approuvé `5591675138` ; revue
  approuvée `5592294526` ; commentaire causal `5607300046`.
- **Objectif** : terminer le développement approuvé en corrigeant les
  15 écarts relevés par la recette visuelle complète sur Routine Dev — il
  s'agit d'achever le lot, pas d'une retouche cosmétique.

## Branche et commit de départ

- Branche : `feat/creation-seance-catalogue`
- Commit de départ : `eda1050342a2997aef64f60c28caaca23cb05fc0`
  (`feat(sessions): implement T02-S02 lot 2`)
- `git status` au démarrage : propre.

## Périmètre demandé

Les 15 points de la recette visuelle, listés par le commentaire causal, plus
la contrainte de préserver tout comportement déjà validé au HEAD source.

## Périmètre réellement traité

Les 15 points, sans exception. Aucun fichier de T03/T04, de workflow, de
protocole ni `CLAUDE.md` n'a été touché ; les Médias restent fonctionnellement
inactifs.

| # | Écart | Traitement |
| --- | --- | --- |
| 1 | Insertion d'une nouvelle Activité dans sa zone | `insertActivityInZone` (Domaine) + câblage `ExerciseScreen.handleTerminer` |
| 2 | Espacement vertical entre cartes | `COMPOSITION_ROW_GAP` = `spacing/6` (`8 → 6`) |
| 3 | Chevron `Mode d'exécution` repliant aussi les paramètres | cadre de paramètres déplacé DANS `CollapsibleSection` |
| 4 | Espace segment ↔ paramètres | `executionModeGroup`, `gap: spacing/8` (au lieu du `24` structurel) |
| 5 | Alignement de la seconde rangée | cale `parameterRowLeadingSpacer` de la largeur de `Séries` |
| 6 | Mode « À l'échec » | cale de hauteur de libellé + fond transparent |
| 7 | Nouvelle règle métier `R = 0 / R > 0` | `computePauseOccurrences` conditionnel, direct + inverse + SQL |
| 8 | Notification noire temporaire avec `Annuler` | nouveau `TransientNotification` partagé |
| 9 | Synthèse fixe et non défilante | sortie du `ScrollView`, frère du corps |
| 10 | « Zones corporelles » | `fr.ts` (`sections.bodyZones`, `bodyZones.*`) |
| 11 | Rythme vertical unique de la Composition | `bodyContent` et `exerciseList` partagent `COMPOSITION_ROW_GAP` |
| 12 | Balayage droit refermant les actions | responder conservé + application à la relâche du responder |
| 13 | Geste horizontal natif désactivé sur tout le parcours | `screenOptions` du `Stack` de création |
| 14 | Libellé `Récupération` aligné et gras | `paddingLeft` dérivé + `type.captionStrong` |
| 15 | DSF : chevrons/cadres de roulettes et actions circulaires | `hitSlop` `48` sur les cadres ouvrant une roulette ; `38/24/48` verrouillés par test |

## Constats

### C-01 — La règle de Pause précédente supprimait le repos final (point 7)

La règle intermédiaire de cette tranche développait la Pause `C − 1` fois SANS
condition. Conséquence : lorsqu'aucune Récupération n'était définie, le temps
de repos qui suit la dernière Série disparaissait purement et simplement du
calcul. La règle confirmée le rétablit et clarifie le rôle des deux
paramètres — **la Récupération REMPLACE la dernière Pause, elle ne s'y ajoute
jamais** :

```text
R = 0 :  D = C × A + C × B
R > 0 :  D = C × A + (C − 1) × B + R
```

Le calcul inverse suit exactement la même bascule. Le terme `+ B` du
numérateur n'existe QUE dans la branche avec Récupération :
`Cth = D / (A + B)` sans Récupération, `Cth = (D − R + B) / (A + B)` avec. Le
conserver inconditionnellement — règle précédente — surestimait `C` d'une
Série entière dès que `B > 0` et `R = 0` (cas discriminant testé : cible
`59 s`, `A + B = 40` → `1` contre `2`).

La bascule est écrite **une seule fois** (`computePauseOccurrences`), et la
projection SQL en est la transcription littérale (`CASE WHEN
recovery_seconds > 0 …`). Un test de parité crée deux Séances identiques à la
Récupération près, avec `R = B` : leurs durées agrégées doivent être
RIGOUREUSEMENT ÉGALES — un cumul les aurait séparées.

### C-02 — Cause réelle du balayage droit inopérant (point 12)

Le sens du balayage était mémorisé pendant le geste et consommé par le seul
`onTouchEnd`. Or `onResponderTerminationRequest` retournait `true` hors
déplacement : le `ScrollView` parent pouvait donc réclamer et obtenir le
responder au milieu d'un balayage horizontal. `onResponderTerminate` effaçait
alors le geste mémorisé avant toute relâche — le balayage droit était perdu.
Deux verrous ferment la cause :

1. le responder n'est plus cédé tant qu'un balayage horizontal est engagé ;
2. la RELÂCHE DU RESPONDER applique le balayage au même titre que la fin de
   toucher, l'opération restant idempotente (le sens mémorisé est consommé par
   le premier des deux événements qui survient).

### C-03 — `gestureEnabled` ne couvrait qu'une route sur trois (point 13)

L'option n'était posée que sur `composition`. `exercise` et `categories`
appartiennent au même parcours, portent des gestes horizontaux et un brouillon
non enregistré : un retour natif déclenché par inadvertance y contourne la
garde de sortie, qui n'est armée que sur une navigation explicite. L'option
est portée par `screenOptions` du `Stack` — toute route ajoutée plus tard en
hérite. **La navigation explicite est intacte** : `Retour`, `Terminer`,
`Continuer`, `Enregistrer la séance` et `router.dismissTo` sont inchangés.

### C-04 — Cible tactile des cadres ouvrant une roulette (point 15)

Les boutons circulaires `Retour`, `Annuler` et `Valider` étaient déjà
conformes (`38 × 38` visibles, `48 × 48` de cible) au HEAD source ; des tests
les verrouillent désormais explicitement. En revanche, les CADRES qui ouvrent
une roulette ne l'étaient pas : contrôle de paramètre `42` de haut
(`ExerciseScreen`) et sélecteur `Nombre de tours` `34` de haut
(`CompositionScreen`), tous deux sous le minimum `48`. Le cadre visible reste
à sa dimension canonique ; c'est le `hitSlop` qui porte la cible, patron déjà
établi partout ailleurs dans ce projet.

### C-05 — Écart documentaire disclosé, non silencieux

`06 – Ecrans et navigation de la V1.md` (l. 782) et `D-136` publient encore la
formule `D = C × A + (C − 1) × B + R` sans condition, ainsi que le calcul
inverse `(D − R + B) / (A + B)` inconditionnel. La règle métier confirmée par
l'autorisation de continuation les révise. Les fichiers de spécification n'ont
pas été modifiés : ils relèvent de l'orchestrateur, et le protocole proscrit
une réécriture documentaire non sollicitée. **La mise à jour de `06` et de
`D-136` reste à effectuer** — écart signalé ici plutôt que corrigé
unilatéralement.

## Preuves et tests

### Tests exécutés

**Aucun.** L'exécution locale reste refusée par l'environnement de cette
session : `npm test`, `npx jest`, `node node_modules/jest/bin/jest.js`,
`npx tsc --noEmit` et `node node_modules/typescript/lib/tsc.js --noEmit`
retournent tous « requires approval ». Ce refus a été interprété une fois et
non rejoué (protocole, § « Permissions et outils ») ; il est classé
`ORCHESTRATION_FAILURE` d'outillage, non un défaut applicatif. Les étapes
déterministes du workflow exécutent Jest complet et TypeScript.

### Tests écrits ou adaptés — un par écart corrigé

| Fichier | Couverture ajoutée |
| --- | --- |
| `src/domain/sessions/__tests__/calculations.test.ts` | règle conditionnelle des Pauses (deux branches), formule directe, inverse branche par branche, cas discriminant du terme `+ B`, aller-retour dans les deux branches, attendus recalculés |
| `src/domain/sessions/__tests__/composition.test.ts` | `insertActivityInZone` : insertion en fin de zone, zone vide, dernière zone, non-mutation, ordre de lecture reconstruit |
| `src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts` | parité SQL/Domaine des DEUX branches ; test de bascule `R = B` prouvant le remplacement et non le cumul |
| `src/features/sessions/__tests__/compositionPresentation.test.ts` | synthèses recalculées ; Récupération égale à la Pause (total inchangé) ; Récupération plus longue (écart exact) ; ligne de durée sans Récupération |
| `src/features/sessions/__tests__/ExerciseScreen.test.tsx` | insertion par zone ; repli conjoint segment + paramètres ; écart réduit ; cale d'alignement de la seconde rangée ; « À l'échec » aligné et transparent ; notification temporaire + `Annuler` restituant les Séries ; synthèse hors du `ScrollView` et immobile ; renommage `Zones corporelles` ; cible tactile `48` des cadres |
| `src/features/sessions/__tests__/CompositionScreen.test.tsx` | rythme vertical unique ; écart `6` ; balayage droit via `onResponderRelease` ; idempotence ; responder non cédé pendant un balayage ; libellé `Récupération` aligné et gras ; cible tactile `48` du contrôle Tour |
| `src/shared/ui/__tests__/TransientNotification.test.tsx` (**nouveau**) | surface noire canonique, superposition, cible tactile, action de correction, effacement automatique, redémarrage du délai, absence de minuterie sans message |
| `app/__tests__/creationLayout.test.tsx` (**nouveau**) | `gestureEnabled: false` porté par `screenOptions`, couvrant les trois routes, aucune route ne le réactive |
| `src/shared/i18n/index.test.ts` | `Zones corporelles`, `adjustedTotalDurationUndoAction`, `composition.activityRecovery` |

Aucun test n'a été affaibli pour « passer » : les assertions dont la valeur
change portent leur recalcul explicite en commentaire, et les deux tests dont
la RÈGLE est révisée (`gap` structurel `16`, Pause `C − 1` inconditionnelle)
ont été réécrits en énonçant la nouvelle règle, jamais supprimés.

## Hypothèses non démontrées

- **H-01** : la suite complète et `tsc --noEmit` passent. NON DÉMONTRÉE
  localement (voir ci-dessus).
- **H-02** : le rendu visuel des 15 corrections sur appareil réel. Une suite
  Jest verte ne remplace jamais une preuve visuelle (protocole,
  « Conservation des acquis », point 7).
- **H-03** : la durée d'affichage de la notification temporaire
  (`5000 ms`). **Valeur NON SOURCÉE** — aucune source du projet ne publie de
  durée pour les messages temporaires ; à confirmer en recette.
- **H-04** : le geste natif de retour est réellement neutralisé sur les trois
  routes. Le reconnaisseur appartient à `react-native-screens` et n'est pas
  observable depuis l'arbre React Native : le test vérifie la CONFIGURATION
  transmise au navigateur, la preuve d'effet reste une vérification appareil.

## Modifications réalisées

### Domaine

- `calculations.ts` : `computePauseOccurrences(seriesCount, recoverySeconds)`
  conditionnel ; `computeTotalDurationSeconds` et
  `computeSeriesCountForTotalDuration` alignés ; docblock de tête réécrit.
- `composition.ts` : `insertActivityInZone` (nouveau).

### Infrastructure

- `repositories/SqliteSessionRepository.ts` : `ACTIVITY_PAUSE_OCCURRENCES_SQL`
  (nouveau `CASE`), `ACTIVITY_DURATION_SQL` transcrivant la bascule.

### Présentation et interface

- `ExerciseScreen.tsx` : insertion par zone ; cadre de paramètres dans la
  section `Mode d'exécution` ; `executionModeGroup` ; cale de seconde rangée ;
  `ToFailureField` réaligné et transparent ; synthèse sortie du `ScrollView` ;
  notification temporaire et action `Annuler` ; `hitSlop` des contrôles.
- `CompositionScreen.tsx` : `COMPOSITION_ROW_GAP` partagé ; libellé
  `Récupération` aligné et gras ; `onResponderRelease` et
  `onResponderTerminationRequest` durcis ; `hitSlop` du contrôle Tour.
- `shared/ui/TransientNotification.tsx` (**nouveau**) : notification noire
  temporaire canonique, purement présentationnelle.
- `shared/ui/tokens.ts` : `type.captionStrong` (graisse distincte, mêmes
  dimensions que `caption`).
- `shared/i18n/resources/fr.ts` : `Zones corporelles`,
  `adjustedTotalDurationUndoAction`.
- `app/(creation)/_layout.tsx` : `gestureEnabled: false` en `screenOptions`.

### PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE** (vérifié inchangé) : `DurationWheelPicker.tsx`,
  `NumberWheelPicker.tsx` (primitives natives), `WheelPickerOverlay.tsx`,
  `ScreenShell`, `BodyZoneSelector.tsx`, `SessionCard.tsx`,
  `CatalogueScreen.tsx`, migrations `001` à `004`, géométries
  `354 × 69`/`354 × 93`/`362 × 97`, duplication à titre identique, appui long
  comme seul déclencheur du déplacement, métriques du Tour bornées à
  `IN_TOUR`.
- **CHANGE** : les fichiers listés ci-dessus.
- **FORBIDDEN** (non touché) : T03/T04, `.github/workflows/**`, fichiers de
  protocole, `CLAUDE.md`, migrations, activation fonctionnelle des Médias.

## Éléments non corrigés ou hors périmètre

- Mise à jour de `06 – Ecrans et navigation de la V1.md` et de `D-136` sur la
  formule conditionnelle (constat C-05) — documentation de spécification, hors
  périmètre d'une mission de développement.
- Tables d'Exécution / Instantané / Résultat : T03.
- Médias : restent visibles et désactivés.

## Vérifications restant à effectuer sur appareil réel

1. Rythme vertical de la Composition (interstices strictement égaux).
2. Repli du bloc `Mode d'exécution` + paramètres d'un seul geste, et écart
   réduit entre les deux.
3. Alignement en colonnes des deux rangées de paramètres, et alignement du
   badge « À l'échec » sur `Séries`/`Pause`.
4. Notification noire temporaire : lisibilité, durée perçue, action `Annuler`.
5. Immobilité de la synthèse pendant le défilement et le repli des sections.
6. Balayage droit refermant `Dupliquer`/`Supprimer`, sans concurrence du
   défilement vertical.
7. Absence du geste natif de retour sur les trois écrans du parcours, la
   navigation explicite restant possible.
8. Cibles tactiles `48 × 48` des cadres ouvrant une roulette.

## Fichiers modifiés

Créés :

- `src/shared/ui/TransientNotification.tsx`
- `src/shared/ui/__tests__/TransientNotification.test.tsx`
- `app/__tests__/creationLayout.test.tsx`
- `.github/orchestration/reports/2026-09-09_T02-S02-LOT2-continuation.md`

Modifiés :

- `app/(creation)/_layout.tsx`
- `src/domain/sessions/calculations.ts`
- `src/domain/sessions/composition.ts`
- `src/infrastructure/database/repositories/SqliteSessionRepository.ts`
- `src/features/sessions/ExerciseScreen.tsx`
- `src/features/sessions/CompositionScreen.tsx`
- `src/shared/ui/tokens.ts`
- `src/shared/i18n/resources/fr.ts`
- `src/domain/sessions/__tests__/calculations.test.ts`
- `src/domain/sessions/__tests__/composition.test.ts`
- `src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts`
- `src/features/sessions/__tests__/compositionPresentation.test.ts`
- `src/features/sessions/__tests__/ExerciseScreen.test.tsx`
- `src/features/sessions/__tests__/CompositionScreen.test.tsx`
- `src/shared/i18n/index.test.ts`

## Commit final

Aucun. L'instruction interdit explicitement `git add`, `commit` et `push` :
le workflow d'orchestration réalise la publication, rapport inclus.

## État Git

Modifications présentes dans l'arbre de travail, non indexées et non
committées, sur la branche `feat/creation-seance-catalogue`, au-dessus de
`eda1050342a2997aef64f60c28caaca23cb05fc0`.
