# T02-S02 — LOT_2_OF_2 — seconde continuation après recette visuelle

## Identifiant et objectif de la mission

- **Tranche** : `T02-S02`, seconde continuation du lot `LOT_2_OF_2` du plan
  approuvé `T02-S02-PLAN-02`.
- **Session Claude** : `45e57018-9826-40b3-8ca7-75298dde17e3` (reprise
  différentielle).
- **Commentaires d'orchestration** : plan approuvé `5591675138` ; revue
  approuvée `5592294526` ; commentaire causal `5608924459`.
- **Objectif** : corriger les 9 écarts relevés par la seconde recette visuelle
  sur Routine Dev, en préservant strictement les comportements déjà validés.

## Branche et commit de départ

- Branche : `feat/creation-seance-catalogue`
- Commit de départ : `8d85f16ee7fcdb7da9a1d15970763a8f790727d0`
  (`fix(sessions): complete T02-S02 visual corrections`)
- `git status` au démarrage : propre.

## Périmètre demandé

Les 9 corrections du commentaire causal, plus la préservation explicite de
dix comportements déjà validés.

## Périmètre réellement traité

Les 9 corrections, sans exception. Aucun développement T03/T04, aucune
modification de workflow, de protocole, de `CLAUDE.md` ni de migration ;
les Médias restent fonctionnellement inactifs.

| # | Écart | Traitement |
| --- | --- | --- |
| 1 | Insertion en fin de zone | `insertActivityInZone` cherche désormais la DERNIÈRE Activité de sa zone |
| 2 | Cadre « À l'échec » à remonter | réservation de place par un `Text` RÉEL du même style, au lieu d'une hauteur devinée |
| 3 | Balayage droit inopérant | mémorisation du balayage par `onTouchMove`, indépendante du responder |
| 4 | Geste natif non désactivé | `gestureEnabled: false` ajouté sur `(creation)` dans le navigateur PARENT |
| 5 | Notification centrée sur `Terminer` | conteneur `finishActionSlot` ; la notification recouvre exactement son parent |
| 6 | Espace synthèse ↔ `Terminer` | `marginTop: spacing/16` sur ce même conteneur |
| 7 | Marges verticales des cartes | `ACTIVITY_CARD_PADDING_VERTICAL` = `8 × 2/3 → 5` |
| 8 | Taille du libellé `Récupération` | `type.compactCardTitle` (`14/18`) au lieu de `11/14` |
| 9 | `Durée totale ≥` informative | `StaticParameterField` en modes non chronométrés |

## Constats

### C-01 — Point 1 : la collection n'est pas contiguë par zone

`insertActivityInZone` cherchait la PREMIÈRE Activité d'une zone postérieure
et insérait juste avant elle. Cette règle n'est vraie que si la collection est
CONTIGUË par zone — ce que rien ne garantit : `moveActivity` la réordonne, et
`[in-1, before-1]` est une Composition parfaitement légitime. Dans ce cas, une
nouvelle Activité `BEFORE_TOUR` était insérée avant `in-1`, donc **avant**
`before-1` : elle apparaissait en tête de sa zone, immédiatement sous le
`Compte à rebours initial` — exactement le symptôme relevé. Chercher la
DERNIÈRE Activité de sa propre zone est vrai quelle que soit la disposition de
la collection ; la recherche par zone postérieure ne subsiste que pour le cas
où la zone est encore vide.

### C-02 — Point 3 : la mémorisation du balayage dépendait du responder

Le sens du balayage n'était enregistré que par `onMoveShouldSetResponderCapture`
et `onResponderMove` — deux gestionnaires qui n'existent que si le conteneur
de la carte OBTIENT le responder. Or, une fois les actions révélées, le
balayage droit commence **sur le groupe d'actions superposé**, dont les
`Pressable` (`Dupliquer`/`Supprimer`) revendiquent le responder dès le
contact : le conteneur ne l'obtenait jamais, rien n'était mémorisé, et
`onTouchEnd` n'avait rien à appliquer. Cela explique aussi pourquoi le
balayage gauche, lui, fonctionnait : il part du corps de la carte, où la
capture aboutit.

`onTouchMove` est dispatché à la vue touchée ET à tous ses ancêtres,
indépendamment du responder — c'est la seule voie qui reste vraie dans ce cas.
Complément : `onResponderTerminate` n'efface plus le balayage mémorisé (le
toucher, lui, n'est pas terminé et son `onTouchEnd` doit encore pouvoir
l'appliquer) ; seul `onTouchCancel`, qui signale la disparition du toucher,
remet tout à zéro.

### C-03 — Point 4 : c'est le navigateur PARENT qui traitait le geste

`gestureEnabled: false` était posé sur le `Stack` IMBRIQUÉ du groupe
`(creation)`. Sans effet observable : sur le PREMIER écran de ce navigateur
(`composition`), la pile interne n'a rien à dépiler, et c'est le navigateur
parent — celui de `app/_layout.tsx` — qui traite le geste, pour revenir de
`(creation)` vers `(tabs)`. Les deux niveaux doivent porter l'option ; celui
de l'enfant reste nécessaire pour `exercise` et `categories`. `(tabs)`
conserve son comportement par défaut, et **aucune navigation explicite n'est
touchée**.

### C-04 — Point 2 : une hauteur devinée ne peut pas garantir un alignement

La cale posée à la continuation précédente présumait qu'un `Text` de style
`parameterColumnLabel` occupe exactement sa `lineHeight` déclarée. La mesure
réelle du moteur de texte ne le garantit pas, et toute différence — même d'un
point — décale visiblement la colonne « À l'échec » de ses voisines. La
réservation de place est donc désormais un `Text` RÉEL, du même style et sur
une seule ligne : la colonne devient structurellement identique à une
`ParameterField` (même nœud, mêmes métriques, même hauteur MESURÉE), et
l'alignement est vrai par construction. Ce texte ne porte aucun contenu
lisible et est retiré de l'arbre d'accessibilité.

### C-05 — Point 7 : la marge réduite corrige un débordement réel

Le bloc a une hauteur FIXE (`69`/`93`) : la marge intérieure ne change donc
pas sa taille, elle règle la place laissée au contenu. Nom (`16/20`) + Zones
corporelles (`11/14`) + synthèse (`11/14`) et leurs deux écarts de `2`
totalisent `52` points, pour `67` de hauteur utile (`69` moins les deux
liserés du bloc). Avec `8` de marge haute et basse, l'ensemble atteignait `68`
et débordait d'un point ; avec `5`, il occupe `62` et respire. La réduction
demandée corrige donc un défaut mesurable, pas seulement une impression.

### C-06 — Point 9 : la règle remplace explicitement une demande antérieure

La recette précédente demandait de MASQUER `Durée totale` en modes
`Répétitions` et « À l'échec ». La nouvelle règle la conserve, informative :
masquer privait l'utilisateur d'une information qu'il peut lire même s'il ne
peut pas la fixer. Un prédicat unique (`isTotalDurationDriveable`) gouverne à
la fois le composant rendu ET l'existence de la roulette associée : les deux
ne peuvent donc pas diverger, et aucun état d'ouverture résiduel ne peut faire
réapparaître une roulette qu'aucun contrôle ne sait plus ouvrir.

### C-07 — Écarts DSF disclosés

- **`ACTIVITY_CARD_PADDING_VERTICAL = 5`** n'est pas un échelon de l'échelle
  `spacing` : celle-ci n'offre que `4` (réduction de moitié) et `6` (réduction
  d'un quart), ni l'un ni l'autre égal au tiers demandé. La valeur est
  DÉRIVÉE dans le code (`Math.round((spacing[8] * 2) / 3)`), la règle restant
  lisible ; l'écart est signalé plutôt que masqué derrière un littéral.
- **`type.captionStrong`**, introduit à la continuation précédente pour le
  seul libellé `Récupération`, est SUPPRIMÉ : ce libellé consomme désormais
  `compactCardTitle` (`14/18` Semi Bold, token déjà canonique, même graisse).
  Un token sans consommateur n'est pas laissé mort.
- Le libellé de borne minimale emploie le glyphe **`≥`**, celui déjà utilisé
  par toutes les bornes minimales de l'application, plutôt que la graphie
  `>=` du commentaire causal — cohérence typographique, écart signalé.

## Preuves et tests

### Tests exécutés

**Aucun.** L'exécution locale reste refusée par l'environnement de cette
session : `npx jest`, `node node_modules/jest/bin/jest.js` et
`npx tsc --noEmit` retournent « requires approval ». Ce refus a été interprété
une fois et non rejoué (protocole, § « Permissions et outils ») ; il est
classé `ORCHESTRATION_FAILURE` d'outillage, non un défaut applicatif. Les
étapes déterministes du workflow exécutent Jest complet et TypeScript.

### Tests écrits ou adaptés — un par écart corrigé

| Fichier | Couverture ajoutée |
| --- | --- |
| `src/domain/sessions/__tests__/composition.test.ts` | insertion correcte sur une collection NON contiguë par zone, dans les deux sens de désordre |
| `src/features/sessions/__tests__/CompositionScreen.test.tsx` | balayage appliqué à partir des SEULS événements de toucher (les deux sens) ; balayage survivant à un vol de responder ; toucher annulé ne laissant aucun geste fantôme ; marge verticale réduite d'un tiers, marges horizontales et hauteur de bloc inchangées ; contenu tenant désormais dans la hauteur utile ; taille du libellé `Récupération` augmentée à graisse et alignement conservés |
| `src/features/sessions/__tests__/ExerciseScreen.test.tsx` | réservation de place « À l'échec » comparée au style RÉEL du libellé voisin ; `Durée totale ≥` visible, non modifiable, transparente, violette, sans chevron ni roulette, dans les DEUX modes non chronométrés ; valeur informative à jour ; retour intégral au comportement interactif en mode `Durée` ; notification recouvrant exactement le conteneur du bouton `Terminer` ; espace vertical visible au-dessus de ce bouton, géométrie du bouton conservée |
| `src/shared/ui/__tests__/TransientNotification.test.tsx` | recouvrement exact du parent sur les quatre côtés, contenu centré |
| `app/__tests__/rootLayoutGesture.test.tsx` (**nouveau**) | `gestureEnabled: false` sur `(creation)` au niveau du navigateur PARENT ; `(tabs)` inchangé |
| `app/__tests__/creationLayout.test.tsx` | renvoi explicite vers le test du parent — les deux contrats sont indissociables |
| `src/shared/i18n/index.test.ts` | `compactLabelLowerBound` / `accessibilityLabelLowerBound`, et unicité du glyphe `≥` |

Aucun test n'a été affaibli : les deux assertions dont la RÈGLE change
(hauteur de la cale « À l'échec », graisse/taille du libellé `Récupération`)
ont été réécrites en énonçant la nouvelle règle, et le test de balayage joue
désormais le scénario réellement défaillant plutôt qu'un scénario favorable.

## Hypothèses non démontrées

- **H-01** : la suite complète et `tsc --noEmit` passent. NON DÉMONTRÉE
  localement (voir ci-dessus).
- **H-02** : le rendu visuel des 9 corrections sur appareil réel. Une suite
  Jest verte ne remplace jamais une preuve visuelle (protocole,
  « Conservation des acquis », point 7).
- **H-03** : la neutralisation effective du geste natif. Le reconnaisseur
  appartient à `react-native-screens` et n'est pas observable depuis l'arbre
  React Native : les tests vérifient la CONFIGURATION transmise aux DEUX
  navigateurs, la preuve d'effet reste une vérification appareil.
- **H-04** : le centrage vertical exact de la notification sur le bouton. Il
  est obtenu par recouvrement du conteneur commun — vérifiable en style, non
  en pixels rendus.

## Modifications réalisées

- `src/domain/sessions/composition.ts` : `insertActivityInZone` cherche la
  dernière Activité de la zone ; repli sur la zone postérieure uniquement si
  la zone est vide.
- `app/_layout.tsx` : `gestureEnabled: false` sur `(creation)`.
- `src/features/sessions/CompositionScreen.tsx` : `handleTouchMove` ;
  `handleTouchCancel` distinct de `handleResponderTerminate` ;
  `ACTIVITY_CARD_PADDING_VERTICAL` ; libellé `Récupération` en
  `compactCardTitle`.
- `src/features/sessions/ExerciseScreen.tsx` : `StaticParameterField`
  (généralise l'ancien `ToFailureField`) ; réservation de place par `Text`
  réel ; `isTotalDurationDriveable` gouvernant champ ET roulette ;
  `finishActionSlot` ; `parameterValueStatic`.
- `src/shared/ui/TransientNotification.tsx` : recouvrement exact du parent.
- `src/shared/ui/tokens.ts` : `captionStrong` supprimé.
- `src/shared/i18n/resources/fr.ts` : `compactLabelLowerBound`,
  `accessibilityLabelLowerBound`.

### PRESERVE / CHANGE / FORBIDDEN

- **PRESERVE** (vérifié inchangé) : espacement entre cartes
  (`COMPOSITION_ROW_GAP`), repli complet de `Mode d'exécution`, écart contrôle
  segmenté / paramètres, alignement de la seconde rangée, calcul
  Pause/Récupération, synthèse fixe, libellé `Zones corporelles`, marges
  structurelles de Composition, fond transparent « À l'échec », alignement à
  gauche et graisse de `Récupération`, primitives natives de roulette,
  géométries `354 × 69` / `354 × 93` / `362 × 97`, duplication à titre
  identique, appui long comme seul déclencheur du déplacement.
- **CHANGE** : les fichiers listés ci-dessus.
- **FORBIDDEN** (non touché) : T03/T04, `.github/workflows/**`, fichiers de
  protocole, `CLAUDE.md`, migrations, activation fonctionnelle des Médias.

## Éléments non corrigés ou hors périmètre

- Mise à jour de `06 – Ecrans et navigation de la V1.md` et de `D-136` sur la
  formule conditionnelle (constat reporté de la continuation précédente) —
  documentation de spécification, hors périmètre d'une mission de
  développement.

## Vérifications restant à effectuer sur appareil réel

1. Ajout d'une Activité dans une Composition dont l'ordre a été remanié : la
   nouvelle carte ferme sa zone.
2. Alignement du cadre « À l'échec » avec `Séries` et `Pause`.
3. Balayage droit refermant `Dupliquer`/`Supprimer`, y compris en partant du
   groupe d'actions lui-même.
4. Absence du geste natif de retour sur les trois écrans du parcours, la
   navigation explicite restant possible.
5. Notification centrée sur `Terminer`, le masquant puis s'effaçant.
6. Espace visible entre la synthèse et `Terminer`.
7. Respiration des cartes d'Activité, sans troncature de la troisième ligne.
8. Lisibilité du libellé `Récupération` agrandi dans la sous-carte de `24`.
9. `Durée totale ≥` en `Répétitions` et « À l'échec » : lisible, inerte,
   sans chevron ; comportement interactif intact en mode `Durée`.

## Fichiers modifiés

Créés :

- `app/__tests__/rootLayoutGesture.test.tsx`
- `.github/orchestration/reports/2026-09-09_T02-S02-LOT2-continuation-2.md`

Modifiés :

- `app/_layout.tsx`
- `app/__tests__/creationLayout.test.tsx`
- `src/domain/sessions/composition.ts`
- `src/domain/sessions/__tests__/composition.test.ts`
- `src/features/sessions/CompositionScreen.tsx`
- `src/features/sessions/ExerciseScreen.tsx`
- `src/features/sessions/__tests__/CompositionScreen.test.tsx`
- `src/features/sessions/__tests__/ExerciseScreen.test.tsx`
- `src/shared/ui/TransientNotification.tsx`
- `src/shared/ui/__tests__/TransientNotification.test.tsx`
- `src/shared/ui/tokens.ts`
- `src/shared/i18n/resources/fr.ts`
- `src/shared/i18n/index.test.ts`

## Commit final

Aucun. L'instruction interdit explicitement `git add`, `commit` et `push` :
le workflow d'orchestration réalise la publication, rapport inclus.

## État Git

Modifications présentes dans l'arbre de travail, non indexées et non
committées, sur la branche `feat/creation-seance-catalogue`, au-dessus de
`8d85f16ee7fcdb7da9a1d15970763a8f790727d0`.
