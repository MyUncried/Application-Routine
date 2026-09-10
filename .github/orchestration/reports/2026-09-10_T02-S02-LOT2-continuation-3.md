# T02-S02 — LOT_2_OF_2, troisième continuation après recette visuelle

## Identifiant et objectif de la mission

- **Mission** : `T02-S02` — `TARGETED_RECOVERY_AFTER_SANDBOX_TEST_LIMITATION`
- **Commentaire causal** : `5615089850` (reprise de `5614748122`, solution
  rapportée en `5614912904`)
- **Plan approuvé** : `5591675138` — **Revue approuvée** : `5592294526`
- **Objectif** : reconstituer, depuis le HEAD source propre, les trois
  corrections de la troisième recette visuelle. Le run précédent les avait
  produites mais la livraison n'a atteint ni les contrôles déterministes, ni le
  commit, ni le push ; l'arbre de travail était revenu propre au démarrage de
  cette exécution.

## Branche et commit de départ

- **Branche** : `feat/creation-seance-catalogue`
- **HEAD de départ** : `f0fff0d510f925447a062dbcb25a63a3bb879500`
  (`fix(sessions): complete T02-S02 visual recipe`)
- **Arbre de travail au départ** : propre (`git status --porcelain` vide) — les
  modifications du run précédent n'étaient pas présentes.

## Périmètre demandé

1. **Insertion dynamique** — au moment exact où l'utilisateur termine la
   création, relire l'ordre ACTUEL des Activités du brouillon ; insérer la
   nouvelle Activité immédiatement après la dernière carte actuellement
   affichée et lui attribuer la même zone structurelle (`IN_TOUR` → dernière du
   Tour ; `AFTER_TOUR` → juste après, avant `Fin de séance` ; `BEFORE_TOUR` →
   juste après, avant le Tour). N'utiliser aucune position ni zone mémorisée à
   l'ouverture de l'écran.
2. **Notification** — réserver une largeur distincte au texte et à l'action
   `Annuler`, autoriser deux lignes complètes sans chevauchement ni troncature,
   avec une hauteur suffisante ; conserver la notification noire temporaire
   exactement centrée verticalement sur le bouton `Terminer` qu'elle masque
   pendant son affichage.
3. **Cartes d'Activité** — réduire effectivement d'un tiers le `paddingVertical`
   de la carte principale ; ajouter un test sur la **valeur numérique** du style
   afin de garantir un changement visible.

**Contraintes** : aucun T03/T04 ; aucune modification des workflows/protocoles,
de `CLAUDE.md` ou des migrations ; aucune activation des médias ; ni `git add`,
ni `commit`, ni `push` — le workflow s'en charge.

## Périmètre réellement traité

Les **trois points** sont implémentés et couverts par des tests ciblés. Aucun
autre comportement n'a été modifié.

## Constats

### Point 1 — la règle précédente ne pouvait pas satisfaire la recette

`insertActivityInZone` plaçait la nouvelle Activité dans la zone **figée au
montage** par `createExerciseDraft` (`BEFORE_TOUR` par défaut), puis cherchait
la position d'insertion dans cette zone. Deux conséquences observables :

- la zone retenue était celle de l'**ouverture de l'écran**, jamais celle de la
  Composition affichée au moment de `Terminer` ;
- la recherche de position supposait une collection **contiguë par zone**, ce
  que `moveActivity` ne garantit pas : sur `[in-1, before-1]`, une nouvelle
  Activité `BEFORE_TOUR` se retrouvait placée en tête, sous le Compte à rebours.

La règle demandée est structurellement différente : elle ne part plus d'une zone
connue à l'avance mais de la **dernière carte affichée**, dont elle dérive à la
fois la position ET la zone.

### Point 2 — un seul nœud portait à la fois la position et la surface

`TransientNotification` rendait une **unique** vue absolue portant simultanément
le positionnement (quatre côtés à zéro, centrage sur le bouton `Terminer`) et la
surface noire (`color.snackbar`, rayon `16`). Cette vue était donc contrainte à
la hauteur de son parent — le bouton — et son plancher `minHeight` valait
`minTouchTarget` (`48`), suffisant pour **une** ligne seulement. Le message et
l'action `Annuler` partageaient par ailleurs la même rangée sans largeur
réservée : un message long comprimait l'action.

### Point 3 — la valeur d'origine avait déjà été réduite

La seconde recette avait déjà porté `paddingVertical` de `spacing[8]` (`8`) à
`Math.round((8 × 2) / 3) = 5`. Ré-appliquer le tiers à la valeur d'origine
aurait redonné `5`, c'est-à-dire **aucun changement** — contraire à l'exigence
« réduire **effectivement** ». Le tiers est donc retranché de la valeur
**réellement livrée** : `Math.round((5 × 2) / 3) = 3`.

## Modifications réalisées

### Point 1 — insertion dynamique

`src/domain/sessions/composition.ts` : `insertActivityInZone` est **remplacée**
par `appendActivityAfterLastDisplayed(activities, activity)` — fonction PURE,
sans dépendance React, qui :

1. calcule l'**ordre de lecture** courant via `orderActivitiesByZone` ;
2. prend la **dernière carte affichée** de cet ordre ;
3. insère la nouvelle Activité juste après elle **dans la collection**, en lui
   attribuant sa `structuralPosition` ;
4. sur une Composition vide, retourne `[activity]` avec sa zone d'origine.

La nouvelle Activité devient ainsi la dernière de sa zone, donc la dernière
affichée — ce que la recette décrit pour les trois cas.

`src/features/sessions/ExerciseScreen.tsx` : `handleTerminer` relit
`draft.exercises` **à cet instant précis** et appelle
`appendActivityAfterLastDisplayed`. La zone portée par le brouillon local n'est
plus consultée pour le placement. Le parcours MODIFICATION (remplacement par
`id`) est inchangé.

### Point 2 — notification

`src/shared/ui/TransientNotification.tsx` est scindé en **deux** vues :

- un **calque de position** (`layer`) : `position: "absolute"`, quatre côtés à
  zéro, `zIndex: 2`, `justifyContent: "center"`, `overflow: "visible"` ;
- une **surface noire** (`card`, `testID` `<testID>-card`) : `color.snackbar`,
  rayon `16`, `flexDirection: "row"`, `gap: spacing[12]`, marges internes.

Le centrage vertical passe donc de `alignItems` à `justifyContent` sur le
calque : la surface, désormais **libre de dépasser** la hauteur du bouton,
déborde symétriquement de part et d'autre de lui et reste **exactement centrée**
sur le bouton qu'elle masque. `overflow: "visible"` empêche que ce dépassement
soit rogné.

Deux constantes exportées, **dérivées des tokens** plutôt que codées en dur :

- `TRANSIENT_NOTIFICATION_MESSAGE_LINES = 2` ;
- `TRANSIENT_NOTIFICATION_MIN_HEIGHT = type.body.lineHeight × 2 + spacing[12] × 2`
  = `20 × 2 + 12 × 2` = **`64`**, contre `48` (`minTouchTarget`) auparavant.

Largeurs **disjointes** : le message porte `flex: 1` et `numberOfLines={2}` ;
l'action porte `flexShrink: 0` et `minWidth: minTouchTarget`. L'action réserve
sa largeur avant que le message ne prenne le reste — ni chevauchement, ni
compression, ni troncature de l'action.

Le caractère temporaire (`TRANSIENT_NOTIFICATION_DURATION_MS`, relance du délai
sur nouveau message) et l'action `Annuler` sont strictement conservés.

### Point 3 — cartes d'Activité

`src/features/sessions/CompositionScreen.tsx` :

```ts
const PREVIOUS_ACTIVITY_CARD_PADDING_VERTICAL = Math.round((spacing[8] * 2) / 3); // 5
const ACTIVITY_CARD_PADDING_VERTICAL = Math.round(
  (PREVIOUS_ACTIVITY_CARD_PADDING_VERTICAL * 2) / 3,
); // 3
```

Marges horizontales (`spacing[16]`), écart interne (`gap: spacing[8]`) et
géométries de bloc validées (`354 × 69` / `354 × 93`) strictement inchangés.

## Preuves et tests

### Tests ajoutés ou adaptés

`src/domain/sessions/__tests__/composition.test.ts` — le `describe`
`insertActivityInZone` est remplacé par `appendActivityAfterLastDisplayed`
(8 tests) : placement après la dernière carte affichée avec héritage de sa zone
pour les trois zones ; lecture de l'**ordre de lecture** et non de la fin du
tableau (`[after-1, in-1]` → `["after-1", "new-1", "in-1"]`, zone `AFTER_TOUR`,
`new-1` dernière à l'affichage) ; nouvelle Activité toujours dernière à
l'affichage sur quatre collections ; Composition vide ; absence de mutation de
la source ; conservation de tous les autres paramètres de l'Activité ajoutée.

`src/features/sessions/__tests__/ExerciseScreen.test.tsx` — 5 tests d'insertion
(helpers `renderAddScreenWith` / `anExisting`) couvrant les trois zones, le
refus explicite de la zone mémorisée à l'ouverture et la lecture de l'ordre
courant sur collection non contiguë. Les deux tests de notification sont
adaptés au découpage calque/surface : le fond `color.snackbar` est désormais
vérifié sur `-card`, le centrage via `justifyContent` et `overflow: "visible"`
sur le calque. **Aucune assertion fonctionnelle n'a été supprimée ni
affaiblie** — les quatre côtés à zéro, `position: "absolute"` et `zIndex > 0`
restent vérifiés, ainsi que le rendu de la notification DANS
`exercise-finish-action-slot`.

`src/shared/ui/__tests__/TransientNotification.test.tsx` — assertions de surface
déplacées vers `-card` ; deux tests ajoutés : largeurs distinctes (`flex: 1`,
`flexShrink: 0`, `minWidth`, rangée unique avec gouttière) et deux lignes
pleines avec hauteur suffisante (`numberOfLines === 2`,
`minHeight === TRANSIENT_NOTIFICATION_MIN_HEIGHT === 64 > minTouchTarget`). Les
tests de délai, de relance et d'action restent inchangés.

`src/features/sessions/__tests__/CompositionScreen.test.tsx` — le test de marge
assertionne la **valeur numérique** exigée par la recette :
`paddingVertical === 3`, `=== Math.round((previousPadding × 2) / 3)`,
`< previousPadding (5)` et `< spacing[8] (8)` ; marges horizontales, `gap` et
hauteur `69` du bloc vérifiés inchangés.

### Exécution des tests

| Commande | Résultat |
| --- | --- |
| `node node_modules/jest/bin/jest.js --testPathPattern "(CompositionScreen\|ExerciseScreen\|composition\|TransientNotification)"` | **NON EXÉCUTÉE** — refusée par le bac à sable Claude (« This command requires approval ») |
| Jest complet | **NON EXÉCUTÉE** — même limitation |
| `tsc --noEmit` | **NON EXÉCUTÉE** — même limitation |

Conformément à la règle de sortie de cette mission, cette limitation du bac à
sable **n'est pas qualifiée d'échec d'orchestration** : l'exécution de Jest et
de TypeScript relève des **étapes déterministes du workflow Windows**, après la
sortie `IMPLEMENTED`. Aucun résultat de test n'est revendiqué dans ce rapport.

## Hypothèses non démontrées

- **Deux lignes suffisent** pour tous les messages réels : vérifié par lecture du
  seul message existant (`adjustedTotalDurationMessage`), non mesuré sur
  appareil.
- **`TRANSIENT_NOTIFICATION_MIN_HEIGHT = 64` suffit** aux deux lignes : la
  hauteur est dérivée arithmétiquement de `type.body.lineHeight` et des marges,
  pas mesurée par le moteur de rendu natif.
- **Perceptibilité de la réduction du point 3** : voir « Éléments non corrigés ».
- **Cohérence Jest/TypeScript** des fichiers modifiés : relue à la main, jamais
  compilée ni exécutée dans ce run.

## Éléments non corrigés ou hors périmètre

- **Limite honnête du point 3** : le bloc d'Activité a une **hauteur FIXE**
  (`69` / `93`, géométrie validée) et `activityMainCard` utilise
  `alignItems: "center"`. Le `paddingVertical` **borne** donc la boîte de
  contenu au lieu de définir le blanc visible : réduire davantage le blanc
  perçu exigerait de toucher à la hauteur de bloc **gelée**, hors périmètre et
  interdit sans autorisation distincte (« Conservation des acquis »). Le
  contrat vérifiable est la valeur numérique du style — exactement ce que la
  recette demande de tester. Limite également inscrite en commentaire dans
  `CompositionScreen.tsx`.
- Aucun fichier T03/T04, workflow, protocole, `CLAUDE.md` ou migration n'a été
  touché ; les médias n'ont pas été activés.

## Vérifications restant à effectuer sur appareil réel

1. Créer une Activité alors que la dernière carte affichée est successivement
   `BEFORE_TOUR`, `IN_TOUR` puis `AFTER_TOUR`, y compris après un
   glisser-déposer rendant la collection non contiguë, et confirmer visuellement
   le placement et la zone.
2. Déclencher l'ajustement de `Durée totale` et vérifier que la notification
   affiche **deux lignes entières** sans troncature, que `Annuler` reste
   pleinement lisible et pressable, et que la surface reste **centrée** sur
   `Terminer` malgré son dépassement.
3. Comparer visuellement la hauteur de blanc des cartes d'Activité avant/après.

## Fichiers modifiés

- `src/domain/sessions/composition.ts`
- `src/domain/sessions/__tests__/composition.test.ts`
- `src/features/sessions/ExerciseScreen.tsx`
- `src/features/sessions/__tests__/ExerciseScreen.test.tsx`
- `src/features/sessions/CompositionScreen.tsx`
- `src/features/sessions/__tests__/CompositionScreen.test.tsx`
- `src/shared/ui/TransientNotification.tsx`
- `src/shared/ui/__tests__/TransientNotification.test.tsx`
- `.github/orchestration/reports/2026-09-10_T02-S02-LOT2-continuation-3.md` (ce
  rapport)

## Commit final

**Aucun.** La mission interdit explicitement `git add`, `git commit` et
`git push` : le workflow d'orchestration réalise le commit de livraison. Le
présent rapport doit être inclus dans ce commit pour satisfaire
`DELIVERY_REPORT_GATE`.

## État Git

- Branche : `feat/creation-seance-catalogue`
- HEAD : `f0fff0d510f925447a062dbcb25a63a3bb879500` (inchangé)
- `git status --porcelain` : 8 fichiers applicatifs/tests modifiés (liste
  ci-dessus), non indexés, plus ce rapport non suivi.

## PRESERVE / CHANGE / FORBIDDEN

**CHANGE** : règle d'insertion d'une nouvelle Activité ; structure interne de
`TransientNotification` ; `paddingVertical` de la carte principale.

**PRESERVE** (vérifiés inchangés) : géométries de bloc `354 × 69` / `354 × 93`
et versions soulevées ; marges horizontales et `gap` des cartes ; alignement,
graisse et taille du libellé `Récupération` ; espacements structurels de
Composition ; repli complet de `Mode d'exécution` ; alignement de la seconde
rangée ; fond transparent du mode `À l'échec` ; formule conditionnelle
Pause/Récupération ; synthèse fixe non défilante ; libellé `Zones corporelles` ;
balayages gauche/droit ; désactivation du geste natif ; primitives natives
`@expo/ui/swift-ui` ; caractère temporaire et action `Annuler` de la
notification ; quatre côtés à zéro et superposition du calque ; parcours de
MODIFICATION d'une Activité existante.

**FORBIDDEN** (non touchés) : T03/T04, workflows, fichiers de protocole,
`CLAUDE.md`, migrations, activation des médias.
