/**
 * Design tokens canoniques du MVP.
 *
 * Source : docs/Specifications-fonctionnelles/12 – Architecture technique,
 * « Design tokens canoniques ».
 */

export const colors = {
  primary: "#0508E5",
  selection: "#5F60EE",
  selectionSurface: "#E5F0FF",
  background: "#FFFFFF",
  surface: "#F5F7FA",
  surfaceSubtle: "#F9FAFC",
  textPrimary: "#141414",
  textSecondary: "#595E66",
  iconNeutral: "#5C636E",
  border: "#E0E3E8",
  divider: "#DBE0E8",
  disabled: "#BEC2CC",
  snackbar: "#292B33",
  positive: "#4F9F83",
  warning: "#FF8D28",
  danger: "#D92D20",
  dangerSurface: "#FFF1F0",
  // R4 (`[ChatGPT] REWORK04 IMPLEMENTATION AUTHORIZED — DESIGN COMPLEMENTS
  // REVIEWED`, 2026-09-03 ; `12 – Architecture technique.md`, tokens
  // `color.wheelAction*`) : actions Annuler/Valider de la roulette
  // compacte. Alias sémantiques explicites — `wheelActionCancelBackground`
  // = `surface`, `wheelActionValidateBackground` = `primary`,
  // `wheelActionCancelIcon` = `textPrimary` — jamais réutilisés en dur via
  // le nom du token primitif, pour exprimer l'intention au point d'usage.
  wheelActionCancelBackground: "#F5F7FA",
  wheelActionValidateBackground: "#0508E5",
  // REWORK07B (`[ChatGPT] PLAN_APPROVED — REWORK07B — contrôles canoniques
  // + structure Tour`, 2026-09-04) : `PickerToolbar` (`DurationWheelPicker
  // .tsx`) consomme désormais les actifs SVG canoniques (`wheel-action-
  // cancel.svg`/`wheel-action-validate.svg`, `3089:81`/`3089:83`) au lieu
  // des glyphes Unicode `✕`/`✓` — leur couleur est portée nativement par
  // le tracé du SVG (identique à ces valeurs), sans `tintColor` requis.
  // Ces deux tokens n'ont donc plus de consommateur direct dans le code,
  // mais sont conservés pour la traçabilité DSF (`color.wheelAction*Icon`,
  // registre `12 – Architecture technique.md`) et une éventuelle
  // réutilisation future (ex. `tintColor` sur un contexte non standard).
  wheelActionCancelIcon: "#141414",
  wheelActionValidateIcon: "#FFFFFF",
  // REWORK07B (`[ChatGPT] PLAN_APPROVED — REWORK07B — contrôles canoniques
  // + structure Tour`, 2026-09-04 ; `12 – Architecture technique.md`,
  // « Anatomie canonique — Nombre de tours ») : fond bleu propre à la
  // **structure extérieure** de `Composition / Tour Section` (`3067:270`)
  // — distinct de `selectionSurface` (`#E5F0FF`), jusqu'ici réutilisé par
  // erreur pour ce rôle alors que la source canonique documente `#CDCEFA`.
  tourSurface: "#CDCEFA",
  // REWORK09 (mission directe utilisateur, 2026-09-04, « CORRECTIONS
  // CONNEXES DÉJÀ VALIDÉES — COMPOSITION » ; `12 – Architecture
  // technique.md`, `color.sessionNameBorder`) : liseré du champ `Nom de la
  // séance` (`Session / Name Field — Source exact`, `2537:1480`) sur la
  // surface colorée de Composition — variable Figma canonique
  // `color/session-name-border` (`VariableID:3163:4015`), jamais une
  // couleur locale en dur.
  sessionNameBorder: "#FFFFFF",
  // REWORK09, point 6/7 « Rangée compacte des paramètres » — `Activity /
  // Parameter Row — Source exact` : fond du cadre compact englobant
  // (`#f6f6ff`), liseré des contrôles `Forms / Select Field` (`#dbdbe5`),
  // texte de valeur (`#14171c`) et libellé de colonne (`#1f1f26`) — quatre
  // valeurs canoniques distinctes vérifiées directement sur les nœuds
  // Figma `1992:9166`/`1992:9246`, aucune ne coïncidant avec un token
  // existant.
  exerciseParameterCardBackground: "#F6F6FF",
  exerciseParameterControlBorder: "#DBDBE5",
  exerciseParameterValueText: "#14171C",
  exerciseParameterLabelText: "#1F1F26",
  // REWORK10 (`[ChatGPT] CHANGES_REQUESTED — REWORK10 — dialogue
  // d'abandon de création`, 2026-09-04) : `Overlay / Decision Dialog`
  // (`2590:2961`, instance `2591:3083` sur la frame CE-T01-08 `2028:11298`)
  // — six valeurs canoniques vérifiées directement sur ce nœud, aucune ne
  // coïncidant avec un token existant (notamment le rouge destructif,
  // `#E62B1E`/`#DB2E2E`, distinct de `color.danger`, `#D92D20`, déjà
  // utilisé ailleurs pour un rouge différent).
  dialogTitleText: "#121212",
  dialogMessageText: "#474D57",
  dialogNeutralActionBackground: "#F3F4F6",
  dialogNeutralActionText: "#292E38",
  dialogDestructiveActionBackground: "#E62B1E",
  dialogDestructiveActionBorder: "#DB2E2E",
  // REWORK12-bis (`[ChatGPT] Applique impérativement le protocole KODJO
  // actif...`, 2026-09-04, complétion REWORK12 après mise à jour Figma/
  // documentaire) : fond de la « Zone bleue — Contexte séance et nom de
  // l'activité » (`3261:4151`, vérifié directement) — `#F7F7FF`, distinct
  // d'un demi-point de `exerciseParameterCardBackground` (`#F6F6FF`) mais
  // conservé comme token propre : rôle sémantique différent (bandeau de
  // contexte plein écran vs cadre compact de paramètres), jamais réutilisé
  // à tort l'un pour l'autre.
  exerciseContextBandBackground: "#F7F7FF",
} as const;

const regular = { fontFamily: "Inter_400Regular", fontWeight: "400" } as const;
const medium = { fontFamily: "Inter_500Medium", fontWeight: "500" } as const;
const semiBold = { fontFamily: "Inter_600SemiBold", fontWeight: "600" } as const;

export const type = {
  timerPrimary: { ...semiBold, fontSize: 58, lineHeight: 64 },
  activityTitle: { ...semiBold, fontSize: 28, lineHeight: 34 },
  metricPrimary: { ...semiBold, fontSize: 22, lineHeight: 28 },
  screenTitle: { ...semiBold, fontSize: 20, lineHeight: 24 },
  modalTitle: { ...semiBold, fontSize: 18, lineHeight: 22 },
  sectionTitle: { ...semiBold, fontSize: 16, lineHeight: 20 },
  cardTitle: { ...semiBold, fontSize: 16, lineHeight: 20 },
  // R4-03 (`KODJO / Card / Title`) : `14/18` Semi Bold — jusqu'ici déclaré
  // à `13/18`, jamais réellement consommé (aucun appelant avant cette
  // mission). Complété au lieu de dupliquer un nouveau token, conformément
  // au garde-fou DSF (« interdire un duplicat local aux mêmes
  // dimensions »).
  compactCardTitle: { ...semiBold, fontSize: 14, lineHeight: 18 },
  body: { ...regular, fontSize: 14, lineHeight: 20 },
  label: { ...medium, fontSize: 14, lineHeight: 18 },
  button: { ...semiBold, fontSize: 14, lineHeight: 18 },
  supporting: { ...regular, fontSize: 12, lineHeight: 16 },
  // R4-03 (`KODJO / Card / Supporting`) : `11/14` — jusqu'ici déclaré à
  // `11/16`, jamais consommé ailleurs. Même remarque que `compactCardTitle`
  // ci-dessus.
  caption: { ...regular, fontSize: 11, lineHeight: 14 },
  navLabel: { ...regular, fontSize: 11, lineHeight: 16 },
  // REWORK09 (mission directe utilisateur, 2026-09-04) — vérifiés sur les
  // nœuds Figma actuels de `Activity / Parameter Row — Source exact`
  // (`1992:9166`/`1992:9246`), sans équivalent parmi les tokens existants.
  //
  // Libellé de colonne (« Durée »/« Pause »/« Séries »/« Répétitions »),
  // `15px` Semi Bold — hauteur de ligne `18` reprise de la hauteur réelle
  // du nœud texte Figma (`18`), non documentée explicitement en tant que
  // telle par Figma (« leading: normal »).
  parameterColumnLabel: { ...semiBold, fontSize: 15, lineHeight: 18 },
  // Valeur saisie dans `Forms / Text Field — Source exact` (`2537:1075`),
  // `13px` Regular — hauteur de ligne `18` estimée par interpolation entre
  // `caption` (`11/14`) et `body`/`label` (`14/18`…`14/20`), Figma ne
  // documentant pas explicitement de hauteur de ligne fixe pour ce texte
  // (« leading: normal ») — estimation raisonnée, signalée comme telle.
  exerciseFieldValue: { ...regular, fontSize: 13, lineHeight: 18 },
  // REWORK10 (`Overlay / Decision Dialog`, `2590:2961`/`2591:3083`,
  // vérifié directement sur `2028:11298`) : message du dialogue, `14px`
  // Regular, hauteur de ligne `21` (documentée explicitement par Figma,
  // `leading-[21px]` — contrairement aux tokens `parameterColumnLabel`/
  // `exerciseFieldValue` ci-dessus, ici une vraie valeur Figma, pas une
  // estimation) — distincte de `type.body` (`14/20`), à `1pt` près, donc
  // un token dédié plutôt qu'une réutilisation approximative.
  dialogMessage: { ...regular, fontSize: 14, lineHeight: 21 },
  // Libellé de l'action neutre (« Annuler »), `16px` Semi Bold.
  dialogNeutralActionLabel: { ...semiBold, fontSize: 16, lineHeight: 20 },
  // Libellé de l'action destructive (« Confirmer »), `16px` MEDIUM —
  // vérifié explicitement distinct en graisse du libellé neutre
  // ci-dessus sur le nœud Figma (`font-['Inter:Medium']` vs `Inter:Semi_
  // Bold`), pas une incohérence à corriger silencieusement.
  dialogDestructiveActionLabel: { ...medium, fontSize: 16, lineHeight: 20 },
  // REWORK12-bis : `Contexte — Nom de la séance` (`3261:4152`, bandeau
  // Activité), vérifié directement `Inter Regular`, `14/17` — hauteur de
  // ligne `17` documentée explicitement par Figma (`leading-[17px]`),
  // distincte de `body` (`14/20`) et de `dialogMessage` (`14/21`), donc un
  // token propre plutôt qu'une réutilisation approximative (même principe
  // que `dialogMessage` en son temps).
  contextLine: { ...regular, fontSize: 14, lineHeight: 17 },
} as const;

export const spacing = {
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  12: 12,
  16: 16,
  24: 24,
  32: 32,
} as const;

export const fixedRadii = {
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
} as const;

export const borderWidths = {
  1: 1,
  2: 2,
} as const;

export const icon = {
  control: 14,
  compact: 16,
  section: 18,
  standard: 24,
  action: 28,
  navigation: 32,
  status: 32,
} as const;

export const dimensions = {
  primaryButton: { minHeight: 48, radius: 24, width: "100%" },
  compactSecondaryButton: { visualHeight: 32, radius: 16, minTouchTarget: 48 },
  header: { contentHeight: 48 },
  finalAction: { buttonHeight: 48 },
  mainNavigation: { visualHeight: 66, radius: 33 },
  activeDestination: { visualHeight: 56, radius: 28 },
  globalSearch: { visualDiameter: 58, radius: 29 },
  standardCard: { radius: 12 },
  // R4-02 (`Action / Back`, `2624:3105`) : cible tactile inchangée
  // (`minTouchTarget`), cercle visuel et chevron réduits — auparavant un
  // cercle unique confondu avec la cible tactile elle-même.
  backAction: { visualCircle: 28, chevron: 14 },
  // R4-07/R4-09 (`Picker / Popover — Source exact`, variante
  // `Type=Duration`) : géométrie canonique de la roulette compacte —
  // D-098 (`07 – Registre des décisions`, « Validée post-Figma ») pour la
  // hauteur ; `12 – Architecture technique.md` pour les cibles d'action.
  // La zone roue (`wheelContentMinHeight`) est un plancher (`minHeight`),
  // pas une hauteur figée — voir `DurationWheelPicker.tsx` pour la
  // justification (ne pas reproduire le défaut D-04 corrigé au cycle
  // précédent).
  wheelPicker: {
    toolbarHeight: 40,
    wheelContentMinHeight: 150,
    actionVisualCircle: 28,
    actionTouchTarget: 48,
  },
  // R4-12 (`Composition / Tour Section`, `3067:270`) : le conteneur Tour
  // est plus large que la carte qu'il héberge (rôle de conteneur, pas une
  // carte elle-même) — inversion explicite de `T-01` (cycle précédent, qui
  // avait unifié la largeur de Tour avec celle des cartes limites).
  // `radius` ajouté par REWORK07B (`[ChatGPT] PLAN_APPROVED — REWORK07B —
  // contrôles canoniques + structure Tour`, 2026-09-04 ; « Anatomie
  // canonique — Nombre de tours ») : rayon canonique de la **structure
  // extérieure** elle-même (`10`), distinct du rayon `12` partagé par
  // `limitCardBase`/`standardCard` (cartes limites) — cette structure n'est
  // plus une carte au sens `limitCardBase`, mais la seule surface visuelle
  // englobante du bloc Tour (voir `TourCard` dans `CompositionScreen.tsx`).
  compositionTourSection: { containerWidth: 374, cardWidth: 354, inset: 10, closedHeight: 54, radius: 10 },
  // REWORK07-A (`[ChatGPT] CHANGES_REQUESTED — REWORK07-A — ICON /
  // STRUCTURE / MOVABLE UNIQUEMENT`, 2026-09-04) : géométrie canonique du
  // pictogramme structurel `Icon / Structure / Movable` (`3066:4676`) —
  // `glyph` est la taille intrinsèque du dessin exporté (`sizes` de
  // `KodjoIcon.tsx`), `slot` la taille du conteneur qui l'entoure quand un
  // écran en a besoin (`CompositionScreen.tsx`, `boundaryRowHandleSlot` →
  // `structureIconSlot`). Source unique partagée par les deux fichiers,
  // remplace les littéraux locaux `24×24`/`32×32` introduits par REWORK04/
  // REWORK06 sur la base d'un asset provisoire (`composition-reorder.svg`,
  // `2537:1456`, `16×16`, encre ne couvrant que `x=5…11`) — le diagnostic
  // REWORK07-A a établi que l'agrandissement de l'affichage d'un glyphe
  // sous-dimensionné n'en corrige pas la proportion visuelle ; seul le
  // remplacement par l'export canonique le corrige réellement.
  structureMovableIcon: { glyph: 20, slot: 28 },
  // REWORK09 (mission directe utilisateur, 2026-09-04) — géométrie
  // canonique vérifiée directement sur les nœuds Figma actuels
  // (`1992:9132`/`1992:9430`/`1992:9212`, page `Prototype MVP`), pas sur
  // une ancienne capture ni sur l'implémentation précédente.
  //
  // `Forms / Text Field — Source exact` (`2537:1075`, `Type=Single line`).
  exerciseTextField: { height: 46, radius: 8, paddingHorizontal: 14 },
  // `Controls / Segmented` (`2586:2759`) : conteneur `354×42`, padding `4`,
  // écart entre segments `14`, chaque segment `166×34` (strictement égaux),
  // rayon interne `10`, rayon externe `12`.
  segmentedControl: {
    height: 42,
    containerRadius: 12,
    padding: 4,
    gap: 14,
    segmentHeight: 34,
    segmentRadius: 10,
  },
  // `Activity / Parameter Row — Source exact` : cadre compact englobant
  // `354` large, padding `8`, rayon `16` ; rangée utile `338×66` ; colonnes
  // Durée/Pause `124` large, Séries/Répétitions `74` large, écart
  // horizontal `8`, écart vertical libellé/contrôle `6` ; contrôle
  // (`Forms / Select Field — Source exact`, `2537:1095`) hauteur `42`,
  // rayon `10`, padding gauche `12`/droite `4` ; carré du chevron `28×28`,
  // rayon `6` ; chevron lui-même `14×14`.
  exerciseParameterRow: {
    cardWidth: 354,
    cardPadding: 8,
    cardRadius: 16,
    rowWidth: 338,
    rowHeight: 66,
    wideColumnWidth: 124,
    narrowColumnWidth: 74,
    columnGap: 8,
    labelGap: 6,
    controlHeight: 42,
    controlRadius: 10,
    controlPaddingLeft: 12,
    controlPaddingRight: 4,
    chevronBox: 28,
    chevronBoxRadius: 6,
    chevronGlyph: 14,
  },
  // Cadre récapitulatif sous la rangée de paramètres — largeur utile
  // complète (`354`), rayon `12`, marges internes horizontales `12`/
  // verticales `8` ; hauteur `76` en illustration Figma uniquement (le
  // cadre réel grandit avec le texte, jamais figé — voir `ExerciseScreen
  // .tsx`).
  exerciseSummaryCard: { radius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  // REWORK10 — `Overlay / Decision Dialog` (`2590:2961`), vérifié
  // directement sur l'instance `2591:3083` de `2028:11298` : carte
  // `354` large, rayon `18`, padding `24` (haut/bas/horizontal — dérivé
  // par construction : contenu 306 = 354 − 2×24 ; bas 194 − 122 − 48 =
  // 24) ; deux actions `147×48` chacune, rayon `24` (pleinement arrondi,
  // = hauteur/2), écart horizontal `12` ; écart vertical entre chaque
  // bloc (titre→message, message→actions) `16` (`spacing/16`, seule
  // valeur explicitement documentée par Figma pour cet interstice —
  // appliquée uniformément aux deux, cohérente avec la mesure observée
  // sur l'instance concrète). Hauteur totale (`194` en illustration
  // Figma) volontairement NON figée en dur dans le code — dérivée de ce
  // padding/gap plutôt qu'imposée, pour ne jamais tronquer un message
  // qui recevrait davantage de texte ou une échelle de police plus
  // grande (même principe que `exerciseSummaryCard` ci-dessus).
  decisionDialog: {
    width: 354,
    radius: 18,
    padding: 24,
    gap: 16,
    actionWidth: 147,
    actionHeight: 48,
    actionRadius: 24,
    actionGap: 12,
  },
  // REWORK12-bis — « Zone bleue — Contexte séance et nom de l'activité »
  // (`3261:4151`), vérifié directement : `402 × 115` (hauteur non figée en
  // dur — dérivée par construction de `paddingTop + ligne de contexte +
  // gap + hauteur du champ + paddingBottom`, `12 + 17 + 24 + 46 + 16 = 115`,
  // exactement la valeur illustrée par Figma sans jamais la coder en dur —
  // même principe que `exerciseSummaryCard`/`decisionDialog` ci-dessus).
  // `paddingHorizontal` réutilise `spacing/24`, déjà la valeur canonique
  // partagée par tous les corps d'écran de ce projet.
  exerciseContextBand: {
    paddingTop: 12,
    paddingBottom: 16,
    gap: 24,
  },
  // T01-S09 — `Selection / Category Tag` (`3302:4166`, CE-T01-11) : pilule
  // visuelle `30` de haut, centrée dans une cible tactile de hauteur
  // minimale `48` (même patron déjà documenté par `BodyZoneSelector.tsx`
  // pour les Zones corporelles, ici la valeur canonique exacte de la
  // Catégorie plutôt qu'une approximation).
  categoryTag: { visualHeight: 30, radius: 15 },
} as const;

export const minTouchTarget = 48;
