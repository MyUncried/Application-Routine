# P0 — Phase 2 — REWORK06 — Restauration ciblée de la roulette + verrou de capitalisation

## Identification

- **Mission** : REWORK06 — restauration de la roulette native iOS (`DurationWheelPicker`) après régression REWORK05, application de l'addendum « écarts visuels encore ouverts », et inscription des règles permanentes « Conservation des acquis / Change Control » et « Priorité aux primitives natives de l'OS » dans `.github/AI_ORCHESTRATION.md`.
- **Objectif** : annuler la substitution de primitive introduite par REWORK05 (roulette `ScrollView` maison) en restaurant l'implémentation native SwiftUI (`@expo/ui/swift-ui`, `pickerStyle("wheel")`) telle qu'elle existait au commit `e3848f08fc1de47febe125aa448b8ed7ec9a1bde`, sans revenir globalement à cet ancien commit ; corriger cinq écarts visuels encore ouverts (poignées de déplacement, titres de cartes, centrage/graisse de la valeur Tour, hauteur/marges du cadre Tour, fixité des zones Header/Context/Bottom Action) ; verrouiller ces acquis par une nouvelle règle de Change Control.
- **Issue** : [#35](https://github.com/MyUncried/Application-Routine/issues/35)
- **Autorisation** : `[ChatGPT] PLAN_APPROVED — REWORK06 — RESTAURATION CIBLÉE DE LA ROULETTE + VERROU DE CAPITALISATION`, 2026-09-04T00:23:14Z (33ᵉ et dernier commentaire de l'Issue #35 au moment de cette clôture — confirmé par relecture intégrale de la liste des commentaires avant rédaction de ce rapport ; aucun commentaire postérieur n'existe).

## Branche et commit de départ

- Branche : `feat/creation-seance-catalogue`
- HEAD initial (point de reprise attendu par l'autorisation, confirmé identique local/distant avant toute modification) : `0bf34ef257465f5acbbe92f9c3a21b8392c79045`
- Baseline de restauration ciblée (roulette native uniquement, jamais un `git checkout`/`reset` global) : `e3848f08fc1de47febe125aa448b8ed7ec9a1bde`

## Périmètre demandé

Défini intégralement par le commentaire d'autorisation (texte complet relu et archivé) :

1. Restaurer l'implémentation iOS native de `DurationWheelPicker` (`@expo/ui/swift-ui`, `pickerStyle("wheel")`), en écartant la substitution `ScrollView` REWORK05, tout en conservant : look & feel Apple (inertie, courbure, fade, centrage natif), deux roues minutes/secondes, pas de 1 pour les secondes, unités `min`/`s` grasses et alignées, une seule zone de sélection grise native, valeurs temporaires pendant le défilement (draft), commit uniquement sur Validation, Annuler = fermeture sans changement, aucun tap-to-close sur un chiffre, ouverture sans déplacement des zones fixes, suppression du chevron noir à l'ouverture, position invariante de l'icône fonctionnelle de la carte (ouvert/fermé).
2. Conserver sans modification : Header, zone Context, zone Bottom Action (baseline gelée, validation iPhone utilisateur = CONFORME) ; le contrôle Nombre de tours déjà corrigé (hors les 2 ajustements ci-dessous explicitement rouverts) ; les cartes hors ajustement strictement nécessaire au retrait du chevron et à l'ancrage invariant de l'icône ; Catalogue, Calendrier, Suivi, Profil, navigation et persistance métier.
3. Addendum obligatoire — 4 écarts visuels + 1 acquis à préserver, chacun avec verdict séparé attendu :
   - poignées de déplacement des cartes encore trop petites ;
   - titres des cartes et du bloc Tour encore trop petits ;
   - valeur du nombre de tours non centrée, à mettre en gras et plus grande ;
   - cadre blanc parent du contrôle Tour trop bas, marges haut/bas/droite à égaliser autour du carré violet ;
   - fixité des zones Header/Context/Bottom Action à préserver (aucune régression).
4. Inscrire dans le document canonique du protocole (`.github/AI_ORCHESTRATION.md`) une règle **CONSERVATION DES ACQUIS / CHANGE CONTROL** et une règle **PRIORITÉ AUX PRIMITIVES NATIVES DE L'OS**.
5. Produire, avant tout code, un tableau `PRESERVE / CHANGE / FORBIDDEN` ; tests positifs listés explicitement (primitive native présente, `ScrollView` REWORK05 absente sur iOS, secondes de 1 en 1, Annuler/Valider, pas de fermeture au tap, pas de mise à jour de carte avant validation, absence totale de chevron, invariance de l'icône, non-régression Tour/cartes, `tsc`/`eslint`/Jest complets) ; rapport Markdown à ce chemin exact ; statut de clôture parmi exactement `REWORK06_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`, `CHANGE_REQUEST_REQUIRED`, `SCOPE_EXPANSION_REQUIRED`.

## Périmètre réellement traité

Intégralement conforme au périmètre demandé, sans extension :

- `DurationWheelPicker.tsx` restauré à l'identique du contenu de `e3848f0` (609 lignes de la version restaurée, fichier final 617 lignes après ajout du seul commentaire de tête documentant la restauration) — aucune modification de logique par rapport à `e3848f0` au-delà de ce commentaire.
- `CompositionScreen.tsx` : suppression du chevron conditionnel (`control-chevron-up`) dans `BoundaryActivityRow` ; `boundaryRowHandleSlot` `28×28→32×32` ; `rowLabel`/`tourCardLabel` `type.compactCardTitle` (14/18) → `type.cardTitle` (16/20) ; `tourCardControl` `66×30→78×44`, `paddingRight:8`, suppression de `justifyContent:"space-between"` ; `tourCardControlValue` `type.label`→`type.cardTitle`, `flex:1`, `textAlign:"center"`. `tourCardIconSlot` (icône fonctionnelle Tour, distincte du handle) délibérément **non modifiée** — l'addendum ne cite que les « poignées de déplacement des cartes ».
- `KodjoIcon.tsx` : taille d'affichage de `composition-reorder` `20×20→24×24` (même asset vectoriel, second agrandissement après le `16→20` de REWORK04).
- `.github/AI_ORCHESTRATION.md` : deux sections ajoutées entre « Implémentation après `PLAN_APPROVED` » et « Rapport après implémentation » — `## Conservation des acquis / Change Control` et `## Priorité aux primitives natives de l'OS`, transcription complète des règles de l'autorisation, avec les barrières `CHANGE_REQUEST_REQUIRED` / `SCOPE_EXPANSION_REQUIRED` / `NATIVE_PRIMITIVE_EXCEPTION_REQUIRED`.
- Tests : `DurationWheelPicker.test.tsx` restauré à l'état `e3848f0` (35 tests) + 2 tests REWORK06 positifs (primitive native utilisée sur iOS sans `ScrollView`, chemin Android inchangé). `CompositionScreen.test.tsx` : réintroduction de `fireNativeSelectionChange`/`Platform.OS` forcé `ios` (remplace `scrollWheelColumn`), conversion des 7 sites d'interaction avec la roulette, remplacement du test de chevron par un test de non-présence dans les deux états + un test d'invariance de style/nombre d'enfants de la ligne, mise à jour des assertions de taille (poignée 32, titres 16/20, cadre Tour 78×44 centré/gras + marges dérivées), ajout d'un test de taille pour `composition-reorder` (24×24).

Aucun fichier hors de cette liste n'a été modifié. Aucun écran suivant n'a été démarré. Catalogue/Calendrier/Suivi/Profil/navigation/persistance non touchés.

## Tableau PRESERVE / CHANGE / FORBIDDEN

| Élément | Statut | Preuve |
|---|---|---|
| Contrat draft/committed (`onValidate`/`onCancel`, un seul commit) | **PRESERVE** | Identique à `e3848f0` ; `CompositionScreen.tsx`/`ExerciseScreen.tsx` non modifiés sur ce point ; tests D-06/R4-09 inchangés, verts. |
| Header / zone Context / zone Bottom Action | **PRESERVE** | Aucune ligne touchée dans `CompositionScreen.tsx` pour ces zones ; test S-06 (styles identiques avant/après ouverture d'un sélecteur) vert sans modification. |
| Contrat Fixed Shell / Scroll (R4-13, `ScrollView` unique `composition-body`) | **PRESERVE** | Non concerné par REWORK06 ; test S-03/S-09 toujours vert, aucune ligne du bloc `body`/`bodyContent` modifiée. |
| Contrôle Nombre de tours — anatomie de base (carré violet 28×28, `1` hors du carré) | **PRESERVE** | `tourCardControlChevronBox` (28×28, `colors.selection`) inchangé ; seul le cadre parent et le texte de la valeur sont repris (voir CHANGE). |
| `tourCardIconSlot` (icône fonctionnelle Tour) | **PRESERVE** | Style non modifié (28×28) — l'addendum ne visait que les poignées de déplacement, pas cette icône. |
| Roulette — primitive de rendu iOS | **CHANGE** | `ScrollView` REWORK05 retirée ; `@expo/ui/swift-ui` `Picker`/`pickerStyle("wheel")` restauré à l'identique de `e3848f0`. Test positif : `DurationWheelPicker.test.tsx` « actually uses the native SwiftUI Picker primitive on iOS, never a ScrollView fallback ». |
| Chevron conditionnel sur les lignes Compte à rebours/Fin de séance | **CHANGE** | Supprimé définitivement (ouvert et fermé). Test : « never renders a chevron on rows, closed or open ». |
| Poignée de déplacement (slot + icône `composition-reorder`) | **CHANGE** | `28×28→32×32` (slot), `20×20→24×24` (icône). Tests dédiés verts. |
| Titres de cartes (`rowLabel`/`tourCardLabel`) | **CHANGE** | `14/18` (`compactCardTitle`) → `16/20` (`cardTitle`). Test R4-03/REWORK06 vert. |
| Cadre + valeur du contrôle Tour | **CHANGE** | `66×30→78×44`, valeur centrée/grasse (`16/20`), marges 8pt haut/bas/droite dérivées et testées explicitement. |
| Substitution de primitive pour confort de test/style | **FORBIDDEN** | Aucune occurrence introduite ; la règle « Priorité aux primitives natives de l'OS » est désormais inscrite dans `.github/AI_ORCHESTRATION.md`. |
| `reset`/`rebase`/checkout global vers `e3848f0` | **FORBIDDEN** | Non réalisé — seul le contenu du fichier `DurationWheelPicker.tsx` (et son test) a été copié depuis cette référence, aucune opération Git destructive. |
| Modification de Catalogue/Calendrier/Suivi/Profil/navigation/persistance | **FORBIDDEN** | Aucun fichier de ces domaines dans le diff (`git diff --stat`, 6 fichiers, tous dans le périmètre listé ci-dessus). |
| Confirmation retrait roulette `ScrollView` REWORK05 | **VÉRIFIÉ** | `git show e3848f0:...DurationWheelPicker.tsx` restauré tel quel ; `UNSAFE_root.findAllByType(ScrollView)` vaut `0` dans le test natif dédié. |

## Verdicts séparés — ADDENDUM « écarts visuels encore ouverts »

Un simple test de présence de propriété n'a pas été jugé suffisant : chaque ligne ci-dessous est prouvée par une valeur dimensionnelle/style exacte, pas par une simple absence de `undefined`.

1. **Poignées de déplacement des cartes** — **TRAITÉ (non vérifiable device)**. `boundaryRowHandleSlot` `32×32` (était `28×28`), icône `composition-reorder` affichée `24×24` (était `20×20`, même master vectoriel). Preuve : `CompositionScreen.tsx:646-651`, `KodjoIcon.tsx:63`, tests dédiés verts (`REWORK06 — the structure/move slot is 32×32...`, `REWORK06 — the composition-reorder (grip handle) icon now displays 24×24...`). Aucun export DSF dédié `Icon / Structure / Movable` n'a jamais été fourni — lacune déjà déclarée, reconduite, pas un remplacement d'asset silencieux.
2. **Titres des cartes et du bloc Tour** — **TRAITÉ (non vérifiable device)**. `rowLabel`/`tourCardLabel` portés de `type.compactCardTitle` (`14/18` Semi Bold) à `type.cardTitle` (`16/20` Semi Bold, token DSF déjà canonique, partagé avec `SessionCard.tsx`), appliqué uniformément aux cartes Compte à rebours, Fin de séance et Tour. Effet de bord accepté et documenté : la ligne Exercice partage `rowLabel` et grandit identiquement (non explicitement citée par l'addendum, mais dépendance structurelle du même style partagé). Preuve : `CompositionScreen.tsx:689-694,746-749`, test `R4-03/REWORK06 — ... now 16/20 Semi Bold`.
3. **Valeur du nombre de tours (centrage + graisse)** — **TRAITÉ (non vérifiable device)**. `tourCardControlValue` : `flex:1`, `textAlign:"center"` (horizontal), centrage vertical hérité de `tourCardControl.alignItems:"center"` ; style `type.cardTitle` (`16/20` Semi Bold, était `type.label` `14/18` Medium). Preuve : `CompositionScreen.tsx:723-728`, assertions explicites `textAlign`, `fontSize`, `lineHeight`, `fontWeight` dans le test CMP-04/T-04a/b/c/T-05.
4. **Hauteur du cadre blanc parent + marges haut/bas/droite** — **TRAITÉ (non vérifiable device)**. `tourCardControl` `height:30→44`, `width:66→78`, `paddingRight:8`. Dérivation explicite et testée : `(44-28)/2 = 8` (marge haut/bas mécanique via `alignItems:"center"` autour du carré violet `28×28` inchangé), égalée à `paddingRight:8` (marge droite). Le carré violet lui-même n'a pas changé de taille — seul son cadre parent a été agrandi et recentré. Preuve : `CompositionScreen.tsx:706-715`, assertions `controlStyle.alignItems`, `controlStyle.paddingRight`, `(controlStyle.height-28)/2 === controlStyle.paddingRight`.
5. **Fixité des zones Header/Context/Bottom Action** — **PRÉSERVÉ, AUCUNE RÉGRESSION**. Aucune ligne de ces trois zones n'a été modifiée dans ce cycle. Preuve structurelle inchangée : test S-06 (« opening a duration picker never moves the fixed Header/Context/Bottom Action zones ») toujours vert sans aucune modification de son propre code. Cette preuve reste au niveau JS (`StyleSheet.flatten` avant/après) — la validation perceptive réelle sur iPhone reste celle déjà obtenue par l'utilisateur avant ce cycle (rapportée `CONFORME` dans l'autorisation elle-même) ; ce cycle ne l'a pas remise en cause faute de modification.

## Constats

- REWORK05 avait remplacé la primitive native SwiftUI par une réimplémentation `ScrollView` après trois cycles de corrections de géométrie jugées insuffisantes sans preuve de rendu device — décision reclassée `NON CONFORME / RÉGRESSION MAJEURE` par l'audit indépendant : une suite Jest verte sur l'implémentation de substitution ne constituait pas une preuve de conformité visuelle, et le look & feel Apple natif (inertie, courbure, fade) n'est pas reproductible par une réimplémentation maison.
- La restauration ciblée du seul fichier `DurationWheelPicker.tsx` (et son test) depuis `e3848f0`, sans `git checkout`/`reset` global, a permis de conserver intégralement les corrections REWORK05 étrangères à la roulette (texte du nom, cartes blanches bordées, contrôle Nombre de tours de base) — confirmé par le tableau PRESERVE ci-dessus.
- Le chevron conditionnel de `BoundaryActivityRow` (rendu uniquement à l'état ouvert) était la cause racine unique des deux symptômes distincts signalés (« chevron noir à l'ouverture » et « icône fonctionnelle qui change de position ouvert/fermé ») : il modifiait le nombre d'enfants directs de la rangée selon l'état, ce qui décalait la position de l'icône de rôle. Une seule suppression corrige les deux points.
- Le contrat de props (`onValidate`/`onCancel`, draft vs committed) n'a jamais été touché par REWORK06 : identique entre l'implémentation native et l'implémentation Legacy Android/web, et identique à `e3848f0`.

## Preuves et tests

### Commandes exécutées et résultats

```
npx tsc --noEmit
→ sortie vide, code de sortie 0 (aucune erreur)

npx eslint .
→ sortie vide, code de sortie 0 (aucune erreur, aucun avertissement)

npx jest src/features/sessions/__tests__/DurationWheelPicker.test.tsx --maxWorkers=2
→ Test Suites: 1 passed, 1 total
→ Tests:       37 passed, 37 total

npx jest src/features/sessions/__tests__/CompositionScreen.test.tsx --maxWorkers=2
→ Test Suites: 1 passed, 1 total
→ Tests:       60 passed, 60 total

npx jest --maxWorkers=2   (suite complète du projet)
→ Test Suites: 37 passed, 37 total
→ Tests:       485 passed, 485 total
```

### Correspondance avec les tests obligatoires listés par l'autorisation

| Preuve exigée | Test(s) |
|---|---|
| Présence de la primitive native iOS attendue | `DurationWheelPicker.test.tsx` — « actually uses the native SwiftUI Picker primitive on iOS » (`selection`/`onSelectionChange` présents, `onScroll` absent) |
| Absence de la roulette `ScrollView` REWORK05 sur iOS | Même test — `UNSAFE_root.findAllByType(ScrollView)` a une longueur de `0` |
| Secondes de 1 en 1 | Suite héritée de `e3848f0`, inchangée (`wheelPickerMath.test.ts`, `WHEEL_SECONDS_STEP = 1`) |
| Annuler, Valider, absence de fermeture au tap sur une valeur | Tests hérités R4-08/R4-09 dans `DurationWheelPicker.test.tsx` et `CompositionScreen.test.tsx` |
| Aucune mise à jour de carte avant validation | `CompositionScreen.test.tsx` — « draft vs committed value (D-06) » |
| Absence totale de chevron ouvert/fermé | `CompositionScreen.test.tsx` — « REWORK06 — never renders a chevron on rows, closed or open » |
| Position et conteneur de l'icône fonctionnelle invariants | `CompositionScreen.test.tsx` — « REWORK06 — the role icon's slot keeps exactly the same style... » |
| Non-régression Nombre de tours et cartes | `CompositionScreen.test.tsx` — CMP-04/T-04a/b/c/T-05, T-01 (géométrie partagée), R4-03/REWORK06 |
| `tsc`, `eslint`, suite Jest complète | Ci-dessus, tous verts |

## Hypothèses non démontrées

- **Rendu device réel** (`NON_VERIFIABLE_DEVICE`) : ni l'inertie, ni la courbure, ni le fade natif, ni le centrage exact à l'écran, ni les marges de `8pt` dérivées mathématiquement pour le cadre Tour, ne peuvent être vérifiés dans cet environnement sans appareil iOS physique. Ce rapport ne prétend prouver que la structure/les valeurs de style transmises à la primitive native, jamais son rendu pixel final.
- La marge de `8pt` (haut/bas/droite) du cadre Tour est une dérivation mathématique documentée (`(44-28)/2`), pas une valeur Figma/DSF littérale communiquée — aucun token dédié n'a été fourni pour ce cadre précis dans les autorisations reçues à ce jour.
- L'effet de bord de `rowLabel` sur la ligne Exercice (grandissement identique à `16/20`, non explicitement citée par l'addendum mais héritant du même style partagé) reste non vérifié visuellement sur device.

## Fichiers modifiés

| Fichier | +/- |
|---|---|
| `.github/AI_ORCHESTRATION.md` | +32 / -0 |
| `src/features/sessions/CompositionScreen.tsx` | +79 / -39 |
| `src/features/sessions/DurationWheelPicker.tsx` | +313 / -200 |
| `src/features/sessions/__tests__/CompositionScreen.test.tsx` | +112 / -48 |
| `src/features/sessions/__tests__/DurationWheelPicker.test.tsx` | +252 / -126 |
| `src/shared/ui/KodjoIcon.tsx` | +12 / -8 |

## Éléments non corrigés ou hors périmètre

- Glyphes Annuler/Valider (`✕`/`✓`) restent des caractères Unicode — aucune URL d'export DSF/Figma dédiée n'a jamais été fournie pour ces deux glyphes, dans aucun cycle REWORK.
- `Icon / Structure / Movable` (asset DSF dédié distinct de `composition-reorder.svg`, mentionné par la mission de design d'origine) n'a toujours pas d'URL d'export fournie — la taille d'affichage de `composition-reorder.svg` a de nouveau été augmentée à titre de mesure intérimaire (`24×24`), sans nouvel asset.
- Catalogue, Calendrier, Suivi, Profil, navigation et persistance métier : non touchés, hors périmètre explicite.

## Vérifications restant à effectuer sur appareil réel

- Confirmation visuelle/tactile sur iPhone que la roulette restaurée retrouve effectivement le look & feel Apple natif (inertie, courbure, fade) — c'est la preuve que ce cycle ne peut par construction pas produire dans cet environnement.
- Confirmation visuelle que les poignées de déplacement `32×32`/icône `24×24`, les titres de carte `16/20`, la valeur Tour centrée/grasse, et le cadre Tour `78×44` avec ses marges `8pt`, correspondent au rendu Figma/DSF attendu une fois compilés et affichés sur device — ce rapport ne prouve que les valeurs de style transmises, jamais le rendu pixel final.
- Reconfirmation que Header/zone Context/zone Bottom Action restent visuellement fixes après ce cycle (aucune régression attendue, aucune ligne touchée, mais seule une nouvelle vérification device referme formellement ce point pour ce cycle précis).

## Modifications réalisées

Voir « Périmètre réellement traité » et le tableau PRESERVE/CHANGE/FORBIDDEN ci-dessus pour le détail exhaustif fichier par fichier.

## État Git

- Branche : `feat/creation-seance-catalogue`
- HEAD avant ce rapport : `0bf34ef257465f5acbbe92f9c3a21b8392c79045` (identique local/distant, vérifié par `git fetch` avant toute modification)
- Fichiers applicatifs committés dans `c3afe14` : `.github/AI_ORCHESTRATION.md`, `src/features/sessions/CompositionScreen.tsx`, `src/features/sessions/DurationWheelPicker.tsx`, `src/features/sessions/__tests__/CompositionScreen.test.tsx`, `src/features/sessions/__tests__/DurationWheelPicker.test.tsx`, `src/shared/ui/KodjoIcon.tsx`
- Ce rapport est committé séparément du commit de code applicatif, conformément à l'exigence de livraison documentaire (`CLAUDE.md`).
- Les SHA finaux (commit applicatif puis commit du rapport) et l'état Git de clôture sont consignés dans le commentaire GitHub de transition publié à l'issue de ce cycle, ainsi que ci-dessous après commit.

### SHA finaux

- **SHA applicatif** : `c3afe149b8ed7dd42eb3e23b2111cdcec0dcb09f` (`fix(T01-S07/S08): REWORK06 — restaure la roulette native + verrou Change Control`).
- **SHA rapport** : voir commit `docs(orchestration): ...` immédiatement suivant, contenant ce fichier — renseigné dans le commentaire de transition GitHub.
- **État Git final** : `working tree clean`, branche `feat/creation-seance-catalogue`, HEAD local = HEAD distant après push (vérifié post-commit).

## Statut de clôture

`REWORK06_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION` — implémentation, tests (`tsc`/`eslint`/Jest complet) et documentation conformes au périmètre autorisé ; seule la vérification perceptive/tactile sur iPhone réel reste hors de portée de cet environnement.

## Self-check Claude

- Tous les commentaires de l'Issue #35 depuis le dernier checkpoint (REWORK05, commit `0bf34ef`) ont été relus : un seul nouveau commentaire, `[ChatGPT] PLAN_APPROVED — REWORK06`, texte intégral archivé et confronté point par point à l'implémentation ci-dessus.
- Aucune opération Git destructive (`reset`, `rebase`, `checkout` de branche, force-push) n'a été effectuée ; seule la restauration ciblée du contenu d'un fichier depuis une référence de commit a été utilisée, conformément à l'interdiction explicite de retour global.
- Les cinq lignes de l'addendum portent chacune un verdict séparé avec preuve dimensionnelle exacte, pas une simple présence de propriété.
- `tsc --noEmit`, `eslint .` et la suite Jest complète (37 suites, 485 tests) sont verts au moment de la rédaction de ce rapport.
