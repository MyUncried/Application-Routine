# Rapport de mission — Phase 2 Composition, correction consolidée REWORK02

TÂCHE
T01-S07/S08 — Composition d'une séance, correction consolidée post contre-recette iPhone
Autorisation : `[ChatGPT] DIAGNOSTIC APPROVED — PHASE02 CONSOLIDATED REWORK02 AUTHORIZED`

STATUT
`PHASE02_CONSOLIDATED_REWORK02_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`

## Registre OPEN initial (constitué avant toute modification, per la règle de reprise cumulative)

Reconstitué depuis `[ChatGPT] DIAGNOSTIC APPROVED — PHASE02 CONSOLIDATED REWORK02 AUTHORIZED` et les deux
addenda antérieurs qui y sont explicitement repris (`NEXT RUN ADDENDUM — WHEEL DRAFT VS COMMITTED VALUE`,
13:05 ; `FOUNDATION BOTTOM NAVIGATION VERTICAL POSITION`, 13:22) :

| # | Point | Statut à l'ouverture |
|---|---|---|
| CMP-01 | `CompositionScreen` doit migrer sur le Shell Foundation partagé | OPEN |
| CMP-02 | Nom + couleur dans un seul champ blanc ; Ajouter centré | OPEN |
| CMP-03/05 | Boundary Activity : poignée gauche / titre+durée centre / icône droite ; pas de chevron fermé | OPEN |
| CMP-04 | Icône Tour (asset manquant, non accepté comme état final) ; contrôle `×1` blanc + disclosure | OPEN |
| CMP-06 | Synthèse + Continuer regroupés en une zone d'action basse | OPEN |
| D-02 | Roulette native : surface opaque manquante | OPEN |
| D-03 | Roulette native : fermeture prématurée / re-render du prop externe pendant le geste | OPEN |
| D-04 | Roulette native : hauteur figée `ITEM_HEIGHT*3` | OPEN |
| D-05 | Roulette native : `Text` React Native mélangé dans le `HStack` SwiftUI | OPEN |
| D-06 | Brouillon local vs valeur validée absente (commit à chaque cran) | OPEN |
| C (racine) | `Pressable` racine plein écran interceptant le geste | OPEN |
| C (scroll) | Le défilement ne doit jamais fermer le sélecteur | OPEN |
| D (nav) | Barre basse translatée de la totalité de `insets.bottom` au lieu d'un résiduel consommé en interne | OPEN |

## Résumé des corrections livrées

### A. Composition — Foundation et layout

- **CMP-01** — Nouveau composant partagé [`ScreenShell.tsx`](src/shared/ui/ScreenShell.tsx) (`ScreenShell`,
  `FixedHeader` avec cercle Retour pâle optionnel, `HeaderSeparator`, `ContextBand` avec `elevated`), extrait
  à l'identique du rendu déjà accepté de `CatalogueScreen`. `CompositionScreen.tsx` migré dessus
  ([CompositionScreen.tsx:78-95](src/features/sessions/CompositionScreen.tsx#L78-L95)) : suppression des
  styles locaux `container`/`header`/`backButton`/`title`/`headerSeparator`/`contextBand` dupliqués.
- **CMP-02** — Nom et sélecteur de couleur regroupés dans `nameColorField` (un seul champ blanc arrondi,
  [CompositionScreen.tsx:120-139](src/features/sessions/CompositionScreen.tsx#L120-L139)) ; `+ Ajouter une
  activité` centré (`alignSelf: "center"`, précédemment `"flex-start"`).
- **CMP-03/CMP-05** — `BoundaryActivityRow` reconstruit : slot gauche = poignée/structure (espace réservé,
  aucune icône dédiée n'existe dans le manifeste pour ce rôle — réutiliser `composition.reorder`,
  réservée à `Activity Row`, violerait la règle « jamais d'icône partagée » déjà appliquée dans ce fichier) ;
  centre = libellé puis, sur une seconde ligne, la valeur de durée déjà formatée ; droite = icône de rôle
  (déplacée depuis la gauche, sur instruction explicite de cette revue — remplace la disposition `LAY-05`
  précédente). Chevron supprimé à l'état fermé (absent de la référence), conservé uniquement à l'état ouvert.
- **CMP-04** — `TourCard` : contrôle `×1` désormais dans un conteneur blanc dédié (`tourCardControl`) avec un
  chevron de disclosure purement visuel (la carte reste non interactive en T01). **Icône Tour toujours
  bloquée** — voir « Points non résolus » ci-dessous, escaladée explicitement, pas reconduite silencieusement.
- **CMP-06** — Synthèse et `Continuer` regroupés dans `bottomAction` (testID `composition-bottom-action`),
  la synthèse restant immédiatement au-dessus du bouton ; c'est désormais le groupe entier qui est poussé en
  bas (`marginTop: "auto"` sur le groupe, plus sur le bouton seul).

### B. Roulette native Apple (`DurationWheelPicker.tsx`, `NativeAppleDurationWheelPicker`)

- **D-02** — Surface opaque blanche/arrondie/bordée/ombrée (`nativeSurface`) enveloppant le `Host` ; une
  bande de sélection bleu pâle unique (`nativeSelectionBand`) traverse désormais les deux colonnes ET les
  unités (positionnée par rapport au parent commun, sous le `Host` dans l'ordre de peinture → visible derrière
  son contenu).
- **D-04** — Suppression de `nativeHost.height = ITEM_HEIGHT * 3` ; `Host` utilise désormais `matchContents` +
  `onLayoutContent` pour mesurer la hauteur réelle rendue (utilisée uniquement pour centrer la bande de
  sélection). Rendu natif réel non mesurable sans device — voir preuves.
- **D-05** — Les séparateurs `min`/`s` sont désormais des `SwiftUIText` (`@expo/ui/swift-ui`), plus des `Text`
  React Native mélangés comme frères dans le `HStack` natif.

### C. Interaction et exactitude de la valeur

- **Racine non interactive + backdrop dédié** — `CompositionScreen`'s root n'est plus un `Pressable` plein
  écran (cause racine démontrée D-03 : interception du geste avant même d'atteindre le contrôle visé). Un
  `Pressable` `composition-backdrop` dédié n'est rendu QUE lorsqu'un sélecteur est ouvert, en dernier frère de
  premier niveau — reste sous la ligne/bande `elevated` (`zIndex: 1`) du seul fait de son absence de `zIndex`
  propre et de son ordre de rendu.
- **Brouillon local / valeur validée (D-03/D-06)** — Les deux chemins (natif ET maison,
  `DurationWheelPicker.tsx`) séparent désormais un état de défilement local (`draftMinutes`/`draftSeconds` ou
  `minutesIndexRef`/`secondsIndexRef`, jamais réécrit par un re-rendu externe une fois monté) de la valeur
  métier. `onChange` n'est appelé qu'**une seule fois, au démontage** du composant (fermeture réelle du
  sélecteur) — jamais à chaque cran de défilement/appui. Countdown et Fin de séance restent indépendants
  (chaque instance porte son propre état local). Rouverture : restaure exactement la dernière valeur validée
  (testé explicitement, exemple `01 min 10 s`).

### D. Bottom Navigation Foundation

- Nouvelle formule partagée [`navigationLayout.ts`](src/shared/ui/navigationLayout.ts) :
  `navigationBarBottomResidual(insetsBottom) = max(insetsBottom - 23, 11)` et
  `navigationBarTotalHeight(insetsBottom) = résiduel + NAVIGATION_CONTENT_HEIGHT`. Dérivée du point de
  référence unique transmis par cette revue (canevas `402×874`, pilule `y=797–863`, résiduel `11pt` pour un
  appareil à `insets.bottom=34`) — **non confirmée indépendamment contre un second appareil/inset**
  (`NON_VERIFIABLE_DEVICE`).
- `app/(tabs)/_layout.tsx` : la rangée est désormais ancrée à `bottom: 0` (bord physique de l'écran), la
  Safe Area étant consommée à l'intérieur via `paddingBottom: navigationBarBottomResidual(insets.bottom)` —
  auparavant `bottom: insets.bottom` translatait la barre entière de la Safe Area complète en plus de sa
  propre hauteur.
- `CatalogueScreen.tsx` : `paddingBottom` du corps recalculé via `navigationBarTotalHeight(insets.bottom)`
  (même source unique de vérité, remplace l'ancien `insets.bottom + NAVIGATION_CONTENT_HEIGHT`, qui
  sur-réservait l'espace une fois la formule de résiduel changée).

## Fichiers modifiés

- [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx)
- [src/features/sessions/CatalogueScreen.tsx](src/features/sessions/CatalogueScreen.tsx)
- [src/features/sessions/CompositionScreen.tsx](src/features/sessions/CompositionScreen.tsx)
- [src/features/sessions/DurationWheelPicker.tsx](src/features/sessions/DurationWheelPicker.tsx)
- [src/shared/ui/navigationLayout.ts](src/shared/ui/navigationLayout.ts)
- [src/shared/ui/ScreenShell.tsx](src/shared/ui/ScreenShell.tsx) (nouveau)
- Tests : `CatalogueScreen.test.tsx`, `CompositionScreen.test.tsx`, `DurationWheelPicker.test.tsx`,
  `TabsLayoutSearch.integration.test.tsx` (mis à jour) ; `ScreenShell.test.tsx`, `navigationLayout.test.ts`
  (nouveaux)

## Critères d'acceptation

| # | Critère | Statut | Preuve |
|---|---|---|---|
| AC-A | Shell partagé réutilisé, Catalogue non régressé | CONFORME | `CatalogueScreen.test.tsx` 17/17 ; `ScreenShell.test.tsx` 7/7 |
| AC-B1 | Ordre exact des 2 lignes de slot des cartes limites | CONFORME (JS) | `CompositionScreen.test.tsx` — test CMP-03/CMP-05 |
| AC-B2 | Icône + contrôle Tour présents | PARTIELLEMENT CONFORME | Contrôle blanc `×1`+chevron conforme ; icône **toujours absente**, voir points ouverts |
| AC-B3 | Synthèse+CTA regroupés | CONFORME | `CompositionScreen.test.tsx` — test CMP-06 |
| AC-C1 | Surface opaque + ordre de superposition du popover natif | CONFORME (structure JS) | `DurationWheelPicker.tsx` styles ; rendu réel `NON_VERIFIABLE_DEVICE` |
| AC-C2 | Absence du `Pressable` racine dismissant + présence d'un backdrop dédié | CONFORME | `CompositionScreen.test.tsx` — describe « fermeture par toucher en dehors » |
| AC-C3 | Plusieurs événements natifs successifs ne ferment pas la roulette | CONFORME | `DurationWheelPicker.test.tsx` — tests D-06 |
| AC-C4 | Le défilement ne modifie jamais les valeurs métier avant fermeture | CONFORME | `DurationWheelPicker.test.tsx`/`CompositionScreen.test.tsx` — tests draft/committed |
| AC-C5 | Validation unique à la fermeture | CONFORME | `DurationWheelPicker.test.tsx` — assertions `toHaveBeenCalledTimes(1)` post-`unmount()` |
| AC-C6 | Correspondance exacte ligne centrée ↔ valeur affichée | CONFORME | `CompositionScreen.test.tsx` — exemple `01 min 10 s` |
| AC-C7 | Indépendance des deux durées + restauration à la réouverture | CONFORME | `DurationWheelPicker.test.tsx`/`CompositionScreen.test.tsx` |
| AC-C8 | Enfants uniquement SwiftUI dans le host natif | CONFORME (structure) | `DurationWheelPicker.tsx` — séparateurs convertis en `SwiftUIText` |
| AC-C9 | Absence de la hauteur `ITEM_HEIGHT*3` | CONFORME | `DurationWheelPicker.tsx` — `matchContents` + `onLayoutContent` |
| AC-D1 | Safe area de la nav basse appliquée exactement une fois | CONFORME | `TabsLayoutSearch.integration.test.tsx` — describe « position verticale » ; `navigationLayout.test.ts` |

## Tests exécutés

```
commande : npx tsc --noEmit
résultat : PASS (aucune sortie)

commande : npx eslint .
résultat : PASS (aucune sortie)

commande : npx jest --maxWorkers=2
résultat : PASS — 37 suites, 462 tests, 0 échec
```

## Tests non exécutés

- Aucun test Jest prévu par cette mission n'a été omis. Les preuves visuelles/perceptives réelles (rendu
  natif SwiftUI, perspective/fondu/inertie de la roulette, position exacte de la barre basse sur un écran
  physique, disposition finale des cartes) restent hors de portée de cet environnement — voir « Limitations ».

## Écarts au plan approuvé

Aucun écart de périmètre. Un choix d'implémentation notable, documenté ici pour traçabilité :

- La disposition « poignée/structure » du slot gauche des cartes `Boundary Activity` (CMP-03/05) est rendue
  comme un espace réservé structurel vide (`View` fixe `24×24`), pas une icône — aucune icône « poignée »
  dédiée n'existe dans le manifeste pour ce composant, distincte de `composition.reorder` (réservée à
  `Activity Row`). Réutiliser cette dernière violerait la règle « jamais d'icône partagée entre composants
  distincts » déjà appliquée dans ce fichier. Documenté dans le code, pas un défaut silencieux.

## Points non résolus

1. **Icône Tour canonique toujours absente** (CMP-04). Recherche exhaustive reconduite ce cycle sur
   `assets/icons/manifest.json` (19 entrées) : aucune entrée `tour.*` ni glyphe sémantiquement proche
   (répétition/cycle/boucle) n'existe. Le MCP `figma` de cet environnement est **non authentifié** — aucun
   flux OAuth n'est exécutable en session non interactive, donc aucun accès à un asset réel n'a été possible
   depuis ce run. Cette revue indique explicitement que « Asset missing » n'est plus un état final accepté :
   ce point est donc escaladé, pas reconduit silencieusement — nécessite soit une autorisation `figma` MCP
   (action utilisateur, `claude mcp` / `/mcp`), soit un dépôt d'asset explicite côté design.
2. **Rendu natif réel de la roulette Apple** (perspective, fondu, inertie, magnétisme, nombre de lignes
   visibles, opacité effective de la surface, alignement de la bande de sélection) : `NON_VERIFIABLE_DEVICE`
   — aucun simulateur/appareil/accès caméra dans cet environnement. Les tests Jest ne prouvent que la couche
   JS (props transmises, propagation d'état, garde de valeur inchangée, calcul du total, validation unique).
3. **Formule de résiduel bas de la navigation** (`NAVIGATION_BAR_SAFE_AREA_OVERLAP = 23`) dérivée d'un
   **unique** point de référence (canevas `402×874`, `insets.bottom=34`) — non confirmée indépendamment
   contre un second appareil/inset réel. `NON_VERIFIABLE_DEVICE`.
4. **Alignement/centrage visuel final** (champ Nom+couleur, cartes Boundary Activity à deux lignes, carte
   Tour, zone d'action basse regroupée) : les tests Jest ne constituent pas une preuve de fluidité, de
   centrage ou d'alignement natifs — une vérification finale sur iPhone réel reste obligatoire avant clôture.

## Limitations

Cet environnement ne dispose d'aucun simulateur iOS, appareil physique, ni accès caméra. Toute preuve de
rendu natif réel (SwiftUI, perspective, position pixel-exacte) reste `NON_VERIFIABLE_DEVICE` ou `BLOQUÉ` par
construction — seule la couche JS (props, état, calculs, structure de l'arbre rendu) est vérifiée ici.

## Décisions techniques

- Le brouillon local (`draft*`/`*IndexRef`) est validé par un `useEffect` de nettoyage (`return () => {...}`,
  tableau de dépendances `[]`) plutôt que par un callback `onClose` explicite transmis en prop — ce composant
  est déjà démonté/remonté à chaque ouverture/fermeture de la superposition (patron déjà établi avant ce
  cycle), le nettoyage à l'unique point de démontage est donc l'unique point de validation nécessaire, sans
  API supplémentaire à faire remonter au parent.
- La bande de sélection native est positionnée par rapport au parent commun (`nativeSurface`), pas à
  l'intérieur du `Host` lui-même (qui ne doit contenir que des vues SwiftUI) — elle est donc peinte AVANT le
  `Host` dans l'ordre des frères, ce qui la place visuellement derrière le contenu rendu par SwiftUI.
- `NAVIGATION_BAR_MIN_BOTTOM_RESIDUAL` (`11`) sert de plancher explicite pour tout `insets.bottom` inférieur
  à `NAVIGATION_BAR_SAFE_AREA_OVERLAP` (`23`), notamment `insets.bottom = 0` (aucun indicateur d'accueil) —
  jamais un résiduel négatif.

## À clarifier

Aucun — les deux points bloqués (icône Tour, preuves de rendu natif) sont des blocages d'environnement
documentés, pas des ambiguïtés de spécification.

## Performance / ressources

Durée IA : NON VÉRIFIABLE (non mesurée par cet environnement)
Tours/appels : NON VÉRIFIABLE
Permissions refusées : aucune rencontrée pendant cette mission
Contexte : OK
Coût/consommation : NON VÉRIFIABLE
Inefficacités observées : Aucune
Action : CONTINUER

## Git

Branche : `feat/creation-seance-catalogue`
HEAD avant cette mission : `ddf86d5922da93c97577c7d0c6f90f426547e1e5` (vérifié propre par `git status
--porcelain` et synchronisé avec `origin` par `git fetch` avant implémentation)
Commit applicatif et commit de ce rapport : deux commits séparés (voir historique Git après publication de ce
rapport — ce document est écrit avant le commit applicatif, conformément à la procédure de clôture standard
de ce protocole).

## Self-check Claude

- `tsc --noEmit` : PASS (aucune sortie).
- `eslint .` : PASS (aucune sortie).
- `jest --maxWorkers=2` : PASS, 37 suites / 462 tests, 0 échec, 0 test ignoré.
- Registre OPEN initial entièrement recensé avant modification (13 points), chacun statué explicitement
  ci-dessus (11 CONFORME/PARTIELLEMENT CONFORME avec preuve JS, 2 escaladés comme blocages d'environnement
  documentés — icône Tour, preuves de rendu natif).
- Aucun fichier hors périmètre approuvé n'a été modifié. Aucune commande Git destructive (`reset`, `rebase`,
  `force-push`) n'a été exécutée pendant cette mission.
- Écran « Ajouter une activité » (Exercice) et tout écran suivant : **non entamés**, conformément à
  l'interdiction explicite de cette autorisation.
