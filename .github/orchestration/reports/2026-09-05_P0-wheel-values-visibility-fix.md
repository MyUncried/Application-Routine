# P0 — Correction bloquante — Visibilité des valeurs des roulettes

## Identification

- **Mission** : « CORRECTION BLOQUANTE AVANT T01-S09 — VISIBILITÉ DES ROULETTES » — corriger la régression rendant invisibles les valeurs numériques et les unités des sélecteurs à roulette natifs, sans toucher au comportement fonctionnel déjà validé.
- **Issue** : [#35](https://github.com/MyUncried/Application-Routine/issues/35)
- **Autorisation** : message utilisateur direct, 2026-09-05, « CORRECTION BLOQUANTE AVANT T01-S09 — VISIBILITÉ DES ROULETTES » (mission ponctuelle, hors machine à états KODJO habituelle — traitée avec la même rigueur de diagnostic/preuve/livraison).

## Branche et commit de départ

- Branche : `feat/creation-seance-catalogue`
- Préconditions vérifiées avant tout code :
  - `git fetch` → HEAD local et distant identiques : `f7b3c3158b6de94c5593a5a09daeb11120b0d12e`.
  - `git status --porcelain` : vide.
  - Le commit le plus récent (`f7b3c31`, « docs(S09): finaliser les contrats catégories et enregistrement atomique ») a été identifié comme relevant de T01-S09 (hors périmètre explicite de cette mission, « Ne pas commencer T01-S09 ») — lu pour information de contexte uniquement, aucune ligne de code ni de documentation S09 modifiée.

## Périmètre demandé

Corriger uniquement le(s) composant(s) réutilisable(s) de roulette (`DurationWheelPicker.tsx`, deux colonnes ; `NumberWheelPicker.tsx`, une colonne) et, si nécessaire, leurs styles/intégration — sans modifier Figma, le DSF, la documentation canonique, ni le comportement fonctionnel déjà validé. Ne pas commencer T01-S09.

## Diagnostic — cause racine

### Méthode

Revue directe du code source des deux composants natifs iOS (`NativeAppleDurationWheelPicker`, `NativeAppleNumberWheelPicker`), en confrontant chaque hypothèse de la liste fournie par la mission aux éléments effectivement présents dans le code :

| Hypothèse fournie | Vérifiée dans le code | Conclusion |
|---|---|---|
| Couleur de texte transparente ou identique au fond | Aucune couleur de texte n'était fixée du tout sur les `SwiftUIText` (jamais de propriété transparente ou dupliquant le fond — l'absence totale de couleur explicite) | Non exactement cette hypothèse littérale, mais directement adjacente — voir conclusion |
| Opacité héritée d'un conteneur | `nativeSurface`/`nativeHost` : aucune propriété `opacity` | Écartée |
| Style `disabled` appliqué par erreur | Aucun modificateur `disabled()` sur les `SwiftUIPicker`/`SwiftUIText` | Écartée |
| Masque, overlay ou cadre de sélection au-dessus du contenu | Aucun `overlay`/`mask`/second cadre ajouté par ce fichier (confirmé également par les tests existants « never renders a second, overlaid selection frame », toujours verts) | Écartée |
| `zIndex`/`position`/`overflow: hidden`/ordre de rendu incorrect | Aucune de ces propriétés sur le chemin natif (elles s'appliquent au chemin `ScrollView` Android/web, non concerné) | Écartée |
| Dimensions/transformation supprimant la zone visible | `frame`/`padding` inchangés depuis leur validation (REWORK04/R4-07), aucune régression de largeur/hauteur | Écartée |
| **Couleur dynamique iOS non résolue** | **Confirmée** : chaque `SwiftUIText` (chiffres des deux colonnes de `DurationWheelPicker`, unités `min`/`s`, chiffres de la colonne unique de `NumberWheelPicker`) ne portait **aucun modificateur `foregroundStyle`/`foregroundColor` explicite** — le texte retombait donc systématiquement sur la couleur de premier plan par défaut de SwiftUI (`Color.primary`, dynamique clair/sombre), dont la résolution dépend de la propagation de l'environnement de trait (`colorScheme`) jusqu'à la vue native via le pont `Host` (`@expo/ui/swift-ui`) | **Retenue** |
| Propriété de texte/thème transmise incorrectement au composant natif | Conséquence directe de l'absence de couleur explicite ci-dessus — même cause, formulation différente | **Retenue (même cause)** |

### Cause racine retenue

Aucun des deux composants ne fixait explicitement la couleur de premier plan de ses nœuds de texte natifs (`SwiftUIText`). En l'absence de ce réglage, SwiftUI utilise sa couleur par défaut (`Color.primary`), une couleur **dynamique** dont la résolution correcte dépend de l'environnement de trait effectivement propagé jusqu'à la vue hébergée par `Host` — propagation qui s'est révélée non fiable dans ce contexte de pont natif, produisant un texte invisible bien que la roulette reste pleinement manipulable (geste, haptique, Annuler/Confirmer intacts, puisqu'aucun de ces éléments ne dépend du rendu du texte).

**`DurationWheelPicker.tsx` n'a fait l'objet d'aucune modification de code depuis le commit `0678b43` (REWORK07B, antérieur à la validation device `WHEEL_DEVICE_VALIDATED_FROZEN` de REWORK08)** — cette absence de couleur explicite était donc déjà présente au moment de cette validation. L'hypothèse la plus probable, disclosée ici sans pouvoir être formellement confirmée a posteriori, est que cette validation device a porté sur le comportement d'interaction (manipulation, haptique, engagement Annuler/Confirmer, absence de second cadre bleu) sans qu'un contrôle pixel dédié à la lisibilité statique des chiffres n'ait été explicitement effectué à ce moment — la présente mission est la première à formuler ce défaut précisément. `NumberWheelPicker.tsx`, réécrit lors de la mission REWORK12 (commit `c540717`) en reproduisant fidèlement ce même patron (y compris cette même omission), n'avait quant à lui encore jamais reçu de contre-recette device.

## Correction appliquée

Ajout du modificateur `foregroundStyle(colors.textPrimary)` (`@expo/ui/swift-ui/modifiers`, remplace la couleur par défaut dynamique par une couleur explicite fixe) sur chaque nœud de texte natif :

- `DurationWheelPicker.tsx` — `NativeAppleDurationWheelPicker` : les deux colonnes de chiffres (minutes, secondes) et les deux unités (`min`, `s`).
- `NumberWheelPicker.tsx` — `NativeAppleNumberWheelPicker` : la colonne unique de chiffres.

`colors.textPrimary` (`#141414`) est le même token déjà utilisé par le chemin `ScrollView` (Android/web, `itemLabel`) pour ces mêmes valeurs — la correction aligne donc la plateforme iOS sur une couleur déjà canonique et déjà éprouvée, sans introduire de nouvelle valeur. Aucune autre propriété (géométrie, cadre de sélection, comportement, dimensions) n'a été modifiée : uniquement l'ajout de ce modificateur sur des nœuds de texte déjà existants.

## Rendu canonique — correspondance point par point

| Exigence | État avant | État après | Verdict |
|---|---|---|---|
| Afficher clairement toutes les valeurs numériques | Absentes (couleur non résolue) | `foregroundStyle(colors.textPrimary)` explicite sur chaque chiffre | **CORRIGÉ (code) — NON VÉRIFIABLE DEVICE** |
| Afficher les unités `min`/`s` | Absentes (même cause) | `foregroundStyle(colors.textPrimary)` explicite sur chaque unité | **CORRIGÉ (code) — NON VÉRIFIABLE DEVICE** |
| Alignement vertical unité/valeur | Déjà géré par la géométrie existante (`HStack alignment="center"`, `frame`/`padding` R4-07), non touché par cette mission | Inchangé | **PRÉSERVÉ** |
| Valeurs voisines visibles avec atténuation native | Portée nativement par `pickerStyle("wheel")`, non touchée | Inchangé | **PRÉSERVÉ** |
| Cadres gris de sélection séparés, limités aux colonnes numériques | Portés nativement par le composant SwiftUI `Picker`, non touchés | Inchangé | **PRÉSERVÉ** |
| Aucun cadre bleu ajouté | Aucun cadre ajouté par ce fichier (confirmé par test existant) | Inchangé | **PRÉSERVÉ** |
| Actions Annuler/Confirmer canoniques | Inchangées (toolbar non touchée) | Inchangé | **PRÉSERVÉ** |
| Centrage et dimensions DSF | `frame`/`padding` R4-07 non touchés | Inchangé | **PRÉSERVÉ** |

## Comportement préservé — vérification

| Exigence | Test |
|---|---|
| Le défilement ne modifie qu'une valeur provisoire | Hérité, vert (« draft vs committed value... never applying it ») |
| Toucher/arrêter le défilement ne ferme jamais le sélecteur | Hérité, vert (« never calls onValidate or onCancel while the picker stays mounted ») |
| Annuler ferme sans enregistrer | Hérité, vert |
| Confirmer enregistre la valeur centrée puis ferme | Hérité, vert |
| La valeur affichée dans le contrôle parent ne change qu'après confirmation | Hérité, vert (D-06) |
| La réouverture restitue exactement la dernière valeur confirmée | Hérité, vert (« restores exactly the last committed value on re-mount ») |

Tous ces tests appartiennent aux fichiers de test existants, **inchangés dans leur logique** (seuls deux tests dédiés à la visibilité ont été ajoutés, voir ci-dessous) — preuve directe qu'aucun comportement fonctionnel déjà validé n'a été altéré par cette correction.

## Contrôles transversaux

| Contrôle | Composant consommé | État |
|---|---|---|
| Roulette Durée (deux colonnes) | `DurationWheelPicker` | **CORRIGÉ** |
| Roulette compacte (une colonne) | `NumberWheelPicker` | **CORRIGÉ** |
| Durée (Exercice) | `DurationWheelPicker` (`ExerciseScreen.tsx`) | **CORRIGÉ** |
| Pause après Série (Exercice) | `DurationWheelPicker` (`ExerciseScreen.tsx`) | **CORRIGÉ** |
| Récupération — Durée | — | **N/A — le type Récupération est verrouillé/désactivé dans tout T01 (segment non interactif, `ExerciseScreen.tsx`), aucun sélecteur de durée ne lui est encore rattaché dans le code** |
| Nombre de séries | `NumberWheelPicker` (`ExerciseScreen.tsx`) | **CORRIGÉ** |
| Nombre de répétitions | `NumberWheelPicker` (`ExerciseScreen.tsx`) | **CORRIGÉ** |
| Nombre de tours | — | **N/A — le contrôle Tour reste non interactif en T01 (`accessibilityState.disabled: true`, valeur fixée à `1`), aucun sélecteur ne s'ouvre actuellement** |
| Heure | — | **N/A — écran non encore implémenté dans ce dépôt (hors périmètre T01, référencé uniquement par un rapport de design)** |
| Rappel personnalisé | — | **N/A — écran non encore implémenté dans ce dépôt (hors périmètre T01)** |
| Compte à rebours initial | `DurationWheelPicker` (`CompositionScreen.tsx`) | **CORRIGÉ** |
| Fin de séance | `DurationWheelPicker` (`CompositionScreen.tsx`) | **CORRIGÉ** |

Recherche exhaustive des consommateurs (`grep` sur `DurationWheelPicker`/`NumberWheelPicker` dans `src/`/`app/`, hors tests) : seuls `CompositionScreen.tsx` et `ExerciseScreen.tsx` instancient ces composants dans l'application actuelle — la correction, appliquée à la source commune, couvre donc l'intégralité des roulettes réellement rendues par le code aujourd'hui.

### Absence de duplication/décentrage

| Contrôle demandé | Preuve |
|---|---|
| Aucune roulette dupliquée | Un seul `<PopoverAnchor>`/sélecteur ouvert à la fois par écran (`openOverlay`, état unique) — tests hérités « single overlay at a time », inchangés, verts |
| Aucune double action Annuler/Confirmer | Une seule `PickerToolbar` par roulette montée, non dupliquée par cette correction |
| Aucun double cadre de sélection | Test hérité « never renders a second, overlaid selection frame (blue band) », inchangé, vert |
| Aucune roulette décentrée | `nativeHost` (`alignSelf: "center"`) non touché |

## Tests et preuves

### Tests ajoutés

Deux tests dédiés, un par composant, prouvant directement la présence du modificateur de couleur explicite sur les nœuds de texte natifs :

- `DurationWheelPicker.test.tsx` — « REWORK14 (visibilité) — every digit and unit text carries an explicit foregroundStyle(colors.textPrimary)… » : vérifie le premier chiffre affiché (`"00"`) et les deux unités (`"min"`, `"s"`).
- `NumberWheelPicker.test.tsx` — même test, sur la colonne unique.

Ces deux tests répondent explicitement à l'exigence de validation n°2 (« rendu des valeurs ; rendu des unités ») ; les exigences « brouillon local ; annulation ; confirmation ; restitution de la valeur confirmée » étaient déjà couvertes par les suites existantes de ces deux fichiers (non modifiées, toujours vertes).

### Commandes exécutées et résultats

```
npx tsc --noEmit
→ sortie vide, code de sortie 0

npx eslint .
→ sortie vide, code de sortie 0

npx jest src/features/sessions/__tests__/DurationWheelPicker.test.tsx src/features/sessions/__tests__/NumberWheelPicker.test.tsx --maxWorkers=2
→ Test Suites: 2 passed, 2 total
→ Tests:       68 passed, 68 total   (66 hérités + 2 nouveaux)

npx jest --maxWorkers=2   (suite complète du projet)
→ Test Suites: 37 passed, 37 total
→ Tests:       577 passed, 577 total
```

### Preuves sur appareil réel

**NON VÉRIFIABLE dans cet environnement** : cette session ne dispose d'aucun accès à un simulateur iOS, un appareil physique ou Expo Go — aucune capture ni vidéo ne peut être produite. Les six états demandés par la mission (état initial, après défilement, après Annuler, après Confirmer, après réouverture, roulette à une colonne, roulette minutes/secondes) restent donc à contrôler par contre-recette humaine avant toute clôture. Ceci n'est pas une omission mais une limite technique explicitement disclosée, conforme à la règle constante de ce projet (« un test technique vert ne prouve pas le rendu visuel ou tactile sur iPhone »).

## Fichiers modifiés

| Fichier | +/- |
|---|---|
| `src/features/sessions/DurationWheelPicker.tsx` | +34/-3 (import `foregroundStyle`, doc, 4 modificateurs ajoutés) |
| `src/features/sessions/NumberWheelPicker.tsx` | +10/-1 (import `foregroundStyle`, doc, 1 modificateur ajouté) |
| `src/features/sessions/__tests__/DurationWheelPicker.test.tsx` | +32/-0 (1 test dédié) |
| `src/features/sessions/__tests__/NumberWheelPicker.test.tsx` | +18/-0 (1 test dédié) |

Total (`git diff --numstat`) : 4 fichiers modifiés, 94 insertions / 4 suppressions. Aucun fichier hors du périmètre strict des deux composants de roulette et de leurs tests ; aucune modification de Figma, du DSF ni de la documentation canonique.

## Écarts restant ouverts

- **Confirmation visuelle réelle** : la correction repose sur un diagnostic de code déterministe (absence de couleur explicite, cause connue et documentée des vues SwiftUI hébergées via un pont natif) et sur l'application de la même couleur canonique déjà utilisée côté Android/web — mais reste **non confirmée par une capture ou un contrôle humain sur device**, seule preuve réellement décisive pour ce type de défaut.
- Les quatre contrôles listés comme non applicables (Récupération — Durée, Nombre de tours, Heure, Rappel personnalisé) n'existent pas encore dans le code de ce dépôt — non corrigés faute d'exister, et non concernés par une régression puisqu'ils ne sont jamais rendus.

## État Git

- Branche : `feat/creation-seance-catalogue`
- HEAD avant ce cycle : `f7b3c3158b6de94c5593a5a09daeb11120b0d12e`
- Ce rapport est committé séparément du commit de code applicatif.

### SHA finaux

- **SHA applicatif** : `90a3d89` (« fix(wheels): corrige l'invisibilite des valeurs/unites des roulettes natives », 4 fichiers, 94 insertions / 4 suppressions).
- **SHA rapport** : renseigné dans le commentaire de transition GitHub (commit `docs(orchestration): ...` immédiatement suivant).
- **État Git final** : `working tree clean`, branche `feat/creation-seance-catalogue`, HEAD local = HEAD distant après push.

## Statut de clôture

**`WHEEL_VALUES_VISIBILITY_FIXED_READY_FOR_DEVICE_REVIEW`**

La cause racine a été identifiée par diagnostic direct du code (absence de couleur de premier plan explicite sur les nœuds de texte natifs SwiftUI, retombant sur une couleur dynamique dont la résolution s'est révélée non fiable via le pont `Host`) et corrigée à la source commune des deux composants de roulette réutilisables, sans modification du comportement fonctionnel ni de la géométrie déjà validés. `tsc`/`eslint`/Jest complet (37 suites, 577 tests) sont verts. **Arrêt obligatoire après cette livraison** : la correction n'a pas encore été relue et validée sur appareil réel — T01-S09 ne doit pas commencer avant cette contre-recette.

## Self-check Claude

- Chaque hypothèse de la liste de diagnostic fournie par la mission a été confrontée individuellement au code source réel avant toute conclusion — aucune cause retenue par supposition seule.
- La correction n'ajoute aucune seconde représentation des valeurs par-dessus la roulette (interdiction explicite de la mission) — uniquement un modificateur de couleur sur les nœuds de texte déjà existants.
- `DurationWheelPicker.tsx`, baseline gelée depuis REWORK07B, n'a été modifié que dans le cadre de cette autorisation explicite et ponctuelle (« corriger uniquement le composant réutilisable de roulette... et son intégration ») — aucune autre ligne (géométrie, comportement, toolbar) touchée.
- Le périmètre reste strictement celui des deux composants de roulette et de leurs tests — `git diff --stat` : 4 fichiers, aucun fichier Figma/DSF/documentation canonique modifié, aucun début de T01-S09.
- `tsc --noEmit`, `eslint .` et la suite Jest complète (37 suites, 577 tests) sont verts au moment de la rédaction de ce rapport.
- La preuve sur appareil réel, seule preuve réellement décisive pour ce type de défaut, reste explicitement non disponible dans cet environnement — disclosée sans détour, jamais présentée comme obtenue.
