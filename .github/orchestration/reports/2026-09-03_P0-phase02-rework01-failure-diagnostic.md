# Diagnostic — Échec de livraison Phase 2 rework 01 (perte de périmètre + défauts device)

**Mode** : diagnostic strict. Aucun fichier applicatif n'a été modifié pour produire ce rapport — uniquement lecture de code, lecture de l'historique GitHub, recherches (`grep`).

## Identifiant et objectif

- **Identifiant** : `P0-phase02-rework01-failure-diagnostic`
- **Issue** : #35, `[ChatGPT] DIAGNOSTIC REQUIRED — PHASE02 REWORK01 PARTIAL DELIVERY / NO CODE AUTHORIZED` (2026-09-03T13:37:26Z)
- **Objectif** : répondre à D-01 à D-07, inventorier CMP-01 à CMP-06, produire un plan de correction — **sans l'exécuter**.

## Branche et commit analysés

- **Branche** : `feat/creation-seance-catalogue`
- **HEAD au moment du diagnostic** : `bd0d75883235a943a92d62deb9140029675dc68d` (identique local/distant, worktree propre)
- **Baseline de comparaison** : `a41d5a62b588b315f454871654dddc50e3650a93`

---

## D-01 — Périmètre perdu

### Reconstitution exacte de la chronologie des checkpoints (horodatages GitHub réels)

| Heure | Auteur | Commentaire | Traité par moi ? |
|---|---|---|---|
| 12:13:11 | ChatGPT | `PHASE01_DEVICE_ACCEPTED_WITH_RESIDUAL — OPEN PHASE02 COMPOSITION` (autorisation initiale Phase 2, LAY-02..05) | Oui — mission de base |
| 12:14:30 | ChatGPT | `PHASE02 ADDENDUM — NAV LABEL CORRECTION` (`RES-NAV-LABEL-01`) | Oui |
| **12:19:01** | ChatGPT | `PHASE02 FOUNDATION CORRECTION — SHARED SCREEN SHELL REQUIRED` | **Non — jamais lu** |
| **12:25:25** | ChatGPT | `PHASE02 ADDENDUM — STANDARD INTERACTION PRIMITIVES GATE` | **Non — jamais lu** |
| 12:27:25 | Claude Code (moi) | `PHASE02_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION` — livraison LAY-02..05, CTRL-01, RES-NAV-LABEL-01 | — (ma propre livraison, antérieure aux deux commentaires ci-dessus déjà publiés à ce moment) |
| **12:36:22** | ChatGPT | `PHASE02 DEVICE REVIEW — NO-GO / REWORK01 AUTHORIZED` — verdict NO-GO complet, `CMP-01` à `CMP-06`, 5 non-conformités de protocole | **Non — jamais lu** |
| 12:47:34 | ChatGPT | `PHASE02 REWORK01 ADDENDUM — NATIVE APPLE WHEEL TARGET` | **Oui — seul commentaire lu, traité comme mission autonome** |
| 13:05:10 | ChatGPT | `NEXT RUN ADDENDUM — WHEEL DRAFT VS COMMITTED VALUE` (explicitement mis en file d'attente) | Non lu, mais explicitement différé par son propre texte |
| 13:19:27 | Claude Code (moi) | `PHASE02_REWORK01_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION` — livraison roulette native uniquement | — |
| 13:22:52 | ChatGPT | `NEXT RUN ADDENDUM — FOUNDATION BOTTOM NAVIGATION VERTICAL POSITION` (explicitement mis en file d'attente) | Non lu, mais explicitement différé |
| 13:37:26 | ChatGPT | `DIAGNOSTIC REQUIRED` (ce diagnostic) | Oui |

### Cause exacte, mécanique, prouvée

Lors de la reprise déclenchée par « Continue le protocole KODJO » à 12:47:34 (puis à nouveau — implicitement — pour la livraison de 13:19:27), j'ai récupéré **uniquement le dernier commentaire de l'Issue** (`gh issue view 35 --json comments -q '.comments[-1]'`), pas l'ensemble des commentaires publiés depuis mon propre dernier checkpoint (12:27:25). Trois commentaires ChatGPT intermédiaires (12:19, 12:25, 12:36) ont donc été **silencieusement sautés**, y compris celui qui portait le verdict NO-GO complet et le périmètre réel de la reprise (`CMP-01` à `CMP-06`, correction Foundation, primitives d'interaction).

- **Lequel a été considéré comme mission active** : uniquement `PHASE02 REWORK01 ADDENDUM — NATIVE APPLE WHEEL TARGET` (12:47:34), traité à tort comme une mission autonome et complète.
- **Lequel a été considéré comme clos/reporté/hors périmètre** : aucun des trois commentaires manqués (12:19, 12:25, 12:36) n'a été « considéré » de quelque façon que ce soit — ils n'ont **jamais été lus**, donc jamais classés. Ce n'est pas un tri erroné, c'est une absence totale de lecture.
- **Sur quelle phrase exacte cette décision s'est fondée** : aucune décision consciente n'a été prise — la cause est mécanique, pas interprétative : ma requête `gh issue view 35 --json comments -q '.comments[-1] | ...'` ne retourne que le **dernier élément du tableau**, jamais l'ensemble des commentaires postés depuis mon dernier checkpoint connu.
- **Pourquoi aucun registre cumulatif des écarts encore `OPEN` n'a empêché cette perte** : il n'existe, côté Claude Code, aucun registre persistant des écarts `OPEN` entre deux tours — chaque reprise reconstruit son contexte uniquement depuis le(s) commentaire(s) qu'elle choisit de lire. En ne lisant que le dernier commentaire, j'ai perdu toute trace des `CMP-01..06` alors même qu'ils étaient déjà publiés et non résolus.

**Aggravation directe** : le rapport de 13:19:27 a publié le statut `PHASE02_REWORK01_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION` — **exactement le même identifiant de statut attendu par le commentaire NO-GO de 12:36:22 pour clore `CMP-01..06`** — créant une apparence de conformité à la revue NO-GO alors qu'aucun des six écarts qu'elle documentait n'avait été traité. Ce n'est pas une déclaration mensongère consciente : c'est la conséquence directe de n'avoir jamais lu le commentaire qui définissait ces six écarts.

---

## Inventaire des écarts CMP-01 à CMP-06 et de la migration Foundation

Statut déterminé par lecture directe du diff réel entre la baseline `a41d5a62b` et le HEAD `bd0d758`, pas par supposition.

| ID | Statut | Preuve (fichier/diff) |
|---|---|---|
| **CMP-01 — Header / shared shell** | **NOT_TOUCHED** | `CompositionScreen.tsx` absent du diff des deux commits du rework (`1bac88f`, `bd0d758`) — seuls `DurationWheelPicker.tsx`, `wheelPickerMath.ts` et 4 fichiers de test ont été modifiés. Le Header de Composition reste exactement celui livré à 12:27:25 (Retour nu + titre statique, sans conteneur circulaire bleu pâle). |
| **CMP-02 — Blue context zone** | **NOT_TOUCHED** | Même preuve — `contextBand`/`nameRow` de `CompositionScreen.tsx` inchangés depuis 12:27:25 : nom et couleur toujours à même niveau sur le fond teinté, aucun champ blanc arrondi les enveloppant, bouton Ajouter toujours aligné à gauche (`alignSelf:"flex-start"`, jamais recentré). |
| **CMP-03 — Initial countdown card** | **NOT_TOUCHED** (structure de la carte) / **PARTIALLY_TOUCHED** (son popover) | `BoundaryActivityRow` (icône gauche / titre centre / valeur+chevron droite) inchangé — l'ordre de slots réclamé par CMP-03 (poignée gauche / titre + ligne secondaire centre / icône de rôle droite) n'a jamais été implémenté, dans aucun cycle. Seul le popover qui s'ouvre depuis cette ligne a changé (roulette native) — voir D-02 à D-06. |
| **CMP-04 — Tour card** | **NOT_TOUCHED** | `TourCard` (`CompositionScreen.tsx`) inchangée depuis le cycle précédent : slot d'icône toujours vide (`tourCardIconSlot`, aucun asset), `×1` toujours en texte simple, pas de contrôle blanc dédié. |
| **CMP-05 — End-of-session card** | **NOT_TOUCHED** (structure) / **PARTIALLY_TOUCHED** (son popover) | Même constat que CMP-03, `BoundaryActivityRow` partagée. |
| **CMP-06 — Summary + Bottom Action** | **NOT_TOUCHED** | `summary`/`continueAction` (`CompositionScreen.tsx`) inchangés — le résumé reste un `Text` isolé au-dessus du bouton, jamais regroupé dans une zone Bottom Action commune. |
| **Migration Foundation partagée (préservant Catalogue)** | **NOT_TOUCHED** | Aucun composant `ScreenShell`/`FixedHeader` partagé n'existe dans `src/shared/ui/` (recherche : aucun fichier de ce nom). `header`/`headerSeparator`/`contextBand` restent des `StyleSheet` locaux à `CatalogueScreen.tsx`, jamais extraits ni réutilisés par `CompositionScreen.tsx`, qui redéfinit ses propres styles du même nom séparément. |

**Conclusion** : les six écarts visuels et la migration Foundation demandée sont **entièrement non traités** — le rework livré à 13:19:27 n'a modifié que la roulette (`DurationWheelPicker.tsx`) et les mathématiques de pas associées, jamais la structure d'écran elle-même.

---

## D-02 — Superposition défectueuse (absence de surface de popover conforme)

**Cause démontrée par lecture directe du code** (pas une hypothèse) :

Le conteneur qui ancre le popover dans `CompositionScreen.tsx` (`styles.popoverAnchor`) ne porte **aucune propriété visuelle opaque** :

```ts
popoverAnchor: {
  position: "absolute", top: "100%", left: 0, right: 0, marginTop: spacing[4],
  zIndex: 20, elevation: 8,
  shadowColor: "#000000", shadowOffset: {width:0,height:4}, shadowOpacity: 0.16, shadowRadius: 12,
},
```

Ni `backgroundColor`, ni `borderRadius`, ni `borderWidth`. Une ombre RN ne se dessine que si l'élément qui la porte a lui-même un contenu peint — sans fond opaque, la propriété d'ombre ne produit visuellement quasiment rien d'utile, et surtout **aucune surface blanche bornée/arrondie ne masque le contenu sous-jacent**, contrairement à la référence Figma.

Le composant natif lui-même (`NativeAppleDurationWheelPicker`, `DurationWheelPicker.tsx`) ne compense pas ce manque : son propre style racine —

```ts
nativeHost: { width: 260, height: ITEM_HEIGHT * 3 },
```

— ne porte lui non plus **aucun `backgroundColor` ni `borderRadius`**. À comparer avec le chemin maison (`LegacyDurationWheelPicker`), dont le `container` porte `backgroundColor: colors.surface, borderRadius: 12` — cette compensation existait pour le chemin Android/web, **mais n'a jamais été reportée sur le chemin natif iOS lors de sa création**. C'est une régression directe introduite par le rework « Native Apple Wheel » lui-même, pas un défaut préexistant.

- **Conteneur exact rendu autour du `Host`** : `PopoverAnchor` (`CompositionScreen.tsx`) → `Host` (`DurationWheelPicker.tsx`) — aucun des deux niveaux ne porte de fond opaque.
- **Pourquoi surface/clipping/dimensions/z-order Figma ne sont pas obtenus** : parce qu'aucune règle de style ne les définit à aucun des deux niveaux — ce n'est pas un défaut de rendu du `Host`, c'est une absence de style dans le code React Native environnant.
- **Le `Host` traverse-t-il ou neutralise-t-il le style du parent RN** : non démontré ni infirmé par le code seul — `Host` accepte une prop `style` standard (`StyleProp<ViewStyle>`, confirmé par lecture de `node_modules/@expo/ui/src/swift-ui/Host/index.tsx`) et devrait donc respecter `backgroundColor`/`borderRadius` s'ils étaient déclarés ; ceci n'a simplement jamais été testé puisque ces propriétés ne sont déclarées nulle part.
- **Différences exactes entre le test actuel et le comportement attendu** : le test `"anchors the open picker as a superposed popover (position: absolute), never pushing the layout below"` (`CompositionScreen.test.tsx`) vérifie uniquement `flattened.position === "absolute"` — il ne vérifie ni `backgroundColor`, ni `borderRadius`, ni aucune propriété de surface. Un popover totalement transparent sans aucun fond passerait ce test avec exactly le même succès qu'un popover visuellement conforme — le test ne peut donc pas détecter ce défaut par construction.

---

## D-03 — Fermeture au premier cran

**Cause la plus probable, avec preuve de code appuyant chaque maillon — non confirmée sur device, mais cohérente de bout en bout** :

Chaîne complète rejouée depuis le code :

1. `CompositionScreen.tsx` racine : `<Pressable style={styles.container} onPress={closeOverlay} accessible={false}>` — enveloppe l'intégralité de l'écran, y compris `AnchoredRow` → `PopoverAnchor` → `DurationWheelPicker` → `Host`.
2. L'utilisateur touche une valeur de la roulette native. SwiftUI (`UIHostingController` sous-jacent au `Host`) gère ce geste **entièrement en dehors du système de responder JavaScript de React Native** — c'est un rendu natif bridgé, pas un `View`/`ScrollView` RN.
3. `onSelectionChange` se déclenche côté natif → `handleMinutesChange`/`handleSecondsChange` → `onChange(toTotalSeconds(...))` → remonte jusqu'à `CompositionScreen.updateDraft({...})`.
4. `updateDraft` change `draft.initialCountdownSeconds` (état React) → **re-rendu de `CompositionScreen`** → le prop `totalSeconds` transmis à `DurationWheelPicker` change → `NativeAppleDurationWheelPicker` recalcule `initial = fromTotalSeconds(totalSeconds, ...)` → **le prop `selection` du `SwiftUIPicker` change à son tour**, en cours d'interaction.

Deux causes possibles, non départageables sans preuve device, mais toutes deux directement lisibles dans le code :

- **(a) Écrasement de la sélection en cours d'interaction** (D-06) : `selection` est un binding externe recalculé à chaque frappe — si SwiftUI traite ce changement de prop comme une resynchronisation de sa source de vérité, il peut interpréter cela comme une fermeture/validation du geste en cours.
- **(b) Fuite du geste vers le `Pressable` racine** : rien dans le code ne prouve que le `Host` neutralise la négociation de responder RN sur toute sa zone — si le bridge natif ne « consomme » pas complètement le point de contact aux yeux du système de responder JS, un relâchement de doigt en fin de geste, même à l'intérieur du `Host`, pourrait être interprété par le `Pressable` racine comme un tap complet, déclenchant `closeOverlay()`.

**Pourquoi `CTRL-02` a été laissé hors périmètre alors que le `Pressable` racine était déjà signalé** : `CTRL-02` (arbitrage des gestes/empilement, incluant explicitement le `Pressable` racine plein écran comme cause secondaire) a été identifié comme point à traiter dans le plan initial du 2026-09-03 (`2026-09-03_P0-plan-correction-layout-controls.md`) puis explicitement exclu du périmètre autorisé de chaque phase successive (Phase 1 : Catalogue seul ; Phase 2 : LAY-02..05 + CTRL-01 uniquement, jamais CTRL-02). Le rework « Native Apple Wheel » n'a lui-même jamais mentionné `CTRL-02` — et pour cause, ce commentaire n'a jamais mentionné le `Pressable` racine du tout. C'est le commentaire manqué de 12:25:25 (« Interaction Primitives Gate ») qui exigeait explicitement son remplacement — commentaire jamais lu (voir D-01). Le rework n'a donc **jamais reçu l'instruction de le traiter au moment où il a été exécuté**, bien qu'elle existait déjà.

---

## D-04 — Seulement trois lignes visibles (hauteur artisanale)

**Cause démontrée par le code, pas une hypothèse** : `nativeHost.height = ITEM_HEIGHT * 3` (`ITEM_HEIGHT = 40`, soit `120`) est une constante **héritée telle quelle de l'implémentation maison** (`LegacyDurationWheelPicker`, dont `wheelArea`/`column` portent la même formule) — jamais recalculée ni justifiée pour la roulette native. Rien dans le code ni dans la documentation consultée (`docs.expo.dev`) ne confirme que la roulette SwiftUI (`pickerStyle('wheel')`) native affiche exactement 3 lignes à cette hauteur — au contraire, le style de roulette natif d'Apple (`UIPickerView`/`.wheel` SwiftUI) affiche classiquement **5 lignes visibles** (2 au-dessus, la sélection, 2 en dessous) à une hauteur de ligne qui lui est propre, non nécessairement `40`pt.

- **Produit actuel** : conteneur de `120`pt de haut, dimensionné pour 3 lignes de `40`pt — jamais mesuré contre le rendu natif réel.
- **Figma actuel / demande PO** : « 3 valeurs au-dessus + sélection + 3 en dessous » (7 lignes), **sous réserve du rendu Apple** — c'est-à-dire que la fenêtre visible réelle dépend du comportement natif d'Apple, que ce code n'a jamais consulté ni mesuré.
- **Conclusion** : la valeur `120`pt n'a aucune relation démontrée avec le nombre de lignes réellement rendu par SwiftUI — elle est directement responsable, ou au minimum fortement contributive, du rognage observé (« seulement trois lignes visibles »), puisqu'un conteneur plus court que le contenu naturel d'une roulette à 5 ou 7 lignes le tronque nécessairement.

---

## D-05 — Unités non alignées (mélange de renderers)

**Cause démontrée par lecture directe du code — confirmée, pas une hypothèse** :

```tsx
<Host style={styles.nativeHost} testID="duration-wheel-picker">
  <HStack spacing={spacing[4]} alignment="center">
    <SwiftUIPicker ...>...</SwiftUIPicker>
    <Text style={styles.separator}>min</Text>   {/* ← react-native Text */}
    <SwiftUIPicker ...>...</SwiftUIPicker>
    <Text style={styles.separator}>s</Text>     {/* ← react-native Text */}
  </HStack>
</Host>
```

`Text` est importé de `"react-native"` (import en tête de fichier : `import {..., Text, ...} from "react-native"`), **pas** de `"@expo/ui/swift-ui"`. `HStack` (`@expo/ui/swift-ui`) est un composant natif (`requireNativeView('ExpoUI', 'HStackView')`) qui compose du contenu SwiftUI — ses enfants documentés et supportés sont d'autres primitives `@expo/ui/swift-ui` (`Text`, `Picker`, etc.), pas des composants React Native standard rendus par un tout autre moteur de rendu (Fabric/Yoga côté RN vs. SwiftUI côté natif).

**Ce mélange de renderers dans un même conteneur natif n'est pas un patron documenté ni testé par ce code** — rien ne garantit que RN insère correctement ses propres vues comme enfants d'une vue-conteneur SwiftUI native, ni que leur alignement (`alignItems`/`spacing` gérés par `HStack` côté SwiftUI) s'applique de façon cohérente à un enfant qui n'est pas lui-même une vue SwiftUI. C'est la cause la plus probable du décalage des unités par rapport à la ligne sélectionnée.

**Primitive correcte à utiliser (proposée ici uniquement, non codée)** : remplacer les deux `<Text>` RN par des `<SwiftUIText>` (import déjà présent dans le fichier sous cet alias, déjà utilisé pour les options des `Picker`) — un composant homogène SwiftUI de bout en bout à l'intérieur du `Host`.

---

## D-06 — Sélection et valeur métier (pas de distinction brouillon/validé)

**Cause démontrée par le code** :

```tsx
const initial = fromTotalSeconds(totalSeconds, maxTotalSeconds); // recalculé à CHAQUE rendu
...
<SwiftUIPicker selection={initial.minutes} onSelectionChange={handleMinutesChange} ...>
```

`selection` est directement dérivé de la prop `totalSeconds`, elle-même mise à jour par le parent (`CompositionScreen.updateDraft`) **à chaque changement effectif**, pas seulement à la fermeture du sélecteur. Il n'existe **aucune valeur de défilement distincte de la valeur confirmée** — le brouillon de défilement et la valeur métier sont la même variable, contrairement au patron « draft wheel puis commit à la fermeture » publié séparément à 13:05:10 (`NEXT RUN ADDENDUM — WHEEL DRAFT VS COMMITTED VALUE`, explicitement mis en file d'attente et jamais traité, cohérent avec le constat D-01).

- **Pourquoi aucune sélection stable/confirmée n'est obtenue sur device** : parce que `selection` est réécrite en tant que prop externe à chaque tick, ce qui — combiné à D-03 — peut perturber la reconnaissance de geste native en cours.
- **Comment est distinguée la valeur transitoire de la valeur confirmée** : **elle ne l'est pas** — il n'existe qu'un seul état.
- **Pourquoi les tests se limitent à injecter `selectionChange` artificiellement** : `DurationWheelPicker.test.tsx` (bloc « chemin iOS natif ») utilise `fireEvent(element, "selectionChange", {nativeEvent:{selection}})` — un événement synthétique qui invoque directement le gestionnaire JS, sans jamais passer par un geste réel, un arrêt de défilement, une correspondance visuelle ligne centrale ↔ carte, ni la moindre interaction avec le rendu SwiftUI natif lui-même (que Jest ne peut de toute façon pas exercer, comme déjà documenté dans le rapport de mission précédent).
- **Pourquoi le patron « draft puis commit » n'existait pas dans cette livraison** : parce qu'il n'a jamais été demandé avant sa publication à 13:05:10, **postérieure** à la livraison du rework natif (13:19:27 restitue en réalité un travail commencé avant 13:05) — mais explicitement mis en file d'attente par son propre texte (« à traiter au prochain run »), donc son absence dans cette livraison n'est pas en soi un manquement à une instruction déjà reçue, à la différence de `CMP-01..06`.

---

## D-07 — Couverture de tests trompeuse

| Défaut device | Test existant | Ce qu'il prouve réellement | Ce qu'il ne peut pas prouver |
|---|---|---|---|
| D-02 (pas de surface de popover) | `"anchors the open picker as a superposed popover (position: absolute)…"` (`CompositionScreen.test.tsx`) | `position === "absolute"` sur le conteneur | Fond opaque, rayon, bordure, ombre visible — **rien de tout cela n'est vérifié** ; un popover invisible passerait ce test |
| D-03 (fermeture au premier cran) | Aucun test n'exerce un geste réel sur la roulette native suivi d'une vérification que l'overlay reste ouvert | Rien sur ce point précis | Le comportement réel de fermeture ne peut être exercé par aucun test Jest (geste natif hors de portée de RNTL) |
| D-04 (hauteur/nombre de lignes) | Aucun test ne vérifie `nativeHost.height` ni le nombre de lignes réellement visibles | Rien | Rendu réel SwiftUI, hors de portée de Jest |
| D-05 (unités non alignées) | Aucun test ne vérifie que les séparateurs sont des `SwiftUIText` plutôt que des `Text` RN, ni leur alignement | Rien | Rendu/alignement réel, hors de portée de Jest |
| D-06 (pas de valeur draft/committed) | `"propagates a native minutes selection change to onChange…"` (`DurationWheelPicker.test.tsx`) | Que `onSelectionChange` appelle bien `onChange` avec le bon total, en isolation | Que ce comportement soit correct **en présence d'un re-rendu de `selection` en cours de geste** — le test ne simule jamais un second appel `fireNativeSelectionChange` suivi d'une vérification que `selection` a effectivement été réécrit entre-temps |

**Test ayant au contraire figé un comportement incorrect** : `"anchors the open picker as a superposed popover (position: absolute), never pushing the layout below"` — ce test, à chaque cycle depuis sa création, a été **revérifié vert** alors que le popover n'a jamais eu de surface opaque conforme ; son critère (`position: absolute`) est nécessaire mais très insuffisant, et sa réussite répétée a probablement contribué à la fausse confiance que ce point était traité. De même, `"propagates a native minutes selection change to onChange, with exactly one haptic call"` — en appelant l'événement synthétique une seule fois par test, il ne peut jamais révéler le problème de mise à jour immédiate (D-06), qui ne se manifeste qu'en présence d'un second changement de prop `selection` pendant l'interaction.

---

## Plan de correction proposé (non exécuté)

1. **Rétablir la lecture complète des commentaires depuis le dernier checkpoint connu**, pas seulement le dernier commentaire, à chaque reprise « Continue le protocole KODJO » — mesure de méthode, pas de code applicatif.
2. **Foundation Shell partagé** (commentaire du 12:19, jamais traité) : créer `src/shared/ui/ScreenShell.tsx` (ou nom canonique équivalent), migrer `CatalogueScreen.tsx` vers ce composant sans changer son rendu déjà accepté, puis instancier `CompositionScreen.tsx` depuis le même composant.
3. **CMP-01/02/06** : recomposer Header (conteneur circulaire pâle autour du Retour), bande Context (champ blanc unique nom+couleur, bouton Ajouter centré), Bottom Action (résumé regroupé avec `Continuer`) — depuis le Shell partagé du point 2.
4. **CMP-03/05** : réordonner `BoundaryActivityRow` selon les slots exacts (poignée gauche / titre + ligne secondaire centre / icône de rôle droite), supprimer le chevron non prévu à l'état initial.
5. **CMP-04** : obtenir/mapper l'icône Tour canonique (le statut « asset manquant » n'est plus accepté comme état final par la revue du 12:36) ; implémenter le contrôle blanc `×1`.
6. **D-02** : ajouter `backgroundColor`, `borderRadius`, `borderWidth` à `popoverAnchor` et/ou `nativeHost` pour matérialiser une surface de popover opaque bornée.
7. **D-03/CTRL-02** : remplacer le `Pressable` racine plein écran par un root non interactif + un backdrop dédié, actif uniquement quand un overlay est ouvert (déjà proposé par le diagnostic P0 initial du 2026-09-03, jamais implémenté).
8. **D-05** : remplacer les deux `<Text>` RN par `<SwiftUIText>` à l'intérieur du `Host`/`HStack`.
9. **D-06** : introduire un état de défilement local (« draft ») distinct de la valeur validée, ne committer au brouillon métier qu'à la fermeture du sélecteur (patron déjà spécifié par le commentaire du 13:05, en file d'attente).
10. **D-04** : mesurer/déterminer la hauteur réelle nécessaire à la roulette native (documentation Apple/SwiftUI, ou mesure device) avant de fixer `nativeHost.height`, plutôt que de reconduire la constante héritée du chemin maison.
11. **Interaction Primitives Gate** (commentaire du 12:25, jamais traité) : accessibilité `increment`/`decrement` sur les rôles `adjustable`, matrice interaction → primitive standard → justification → test réel.
12. **Tests** : ajouter, pour chacun des points ci-dessus, un test qui échoue sous le comportement actuel et réussit après correction — en particulier une assertion de surface opaque pour D-02, et une vérification de non-régression de `selection` après un second `fireNativeSelectionChange` pour D-06.

## Fichiers modifiés par cette mission

Aucun fichier applicatif. Un seul fichier créé :
`.github/orchestration/reports/2026-09-03_P0-phase02-rework01-failure-diagnostic.md`

## Commit final

Voir la réponse de clôture pour le hash exact.

## État Git

Voir la réponse de clôture pour `git status --short`, HEAD local et HEAD distant vérifié après push.

## Statut

`PHASE02_REWORK01_FAILURE_DIAGNOSED_AWAITING_REVIEW`

Aucune correction n'a été exécutée. En attente d'un `[ChatGPT] DIAGNOSTIC_APPROVED_AND_FIX_AUTHORIZED` explicite avant toute reprise de code.
