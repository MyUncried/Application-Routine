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
  // T01-S09 correction VISUAL (point D) — voile d'arrière-plan de la
  // superposition plein écran, transversale à tout sélecteur numérique à
  // roulette (`WheelPickerOverlay.tsx`) : approximation raisonnée à partir
  // de `colors.textPrimary` (`#141414`) à `50%` d'opacité, en l'absence
  // d'un accès Figma direct pour cette correction (disclosed, non vérifié
  // visuellement — voir le rapport de mission).
  overlayScrim: "rgba(20, 20, 20, 0.5)",
  // T01-S09, correction VISUAL (2e contre-recette suivante, commentaire de
  // revue post-`1f28a09`) — `Controls / Disclosure — Source exact`
  // (`12 – Architecture technique.md`, `2537:1033` `State=Collapsed` /
  // `2537:1038` `State=Expanded`), quatre valeurs canoniques vérifiées
  // directement sur ces nœuds, aucune ne coïncidant avec un token existant
  // (notamment `#FBFCFF`, distinct d'un demi-point de `colors.background`,
  // `#FFFFFF`) — remplace l'ancien cadre non sourcé de `SessionCard.tsx`
  // (`colors.tourSurface`/opacité `0.45`, jamais documentés pour ce
  // contrôle).
  disclosureBackground: "#FBFCFF",
  disclosureBorderCollapsed: "#D6D9E3",
  disclosureBorderExpanded: "#8283F2",
  disclosureChevronCollapsed: "#8282F2",
  // T02-S01 — état transitoire `Composition d'une séance — Appui long —
  // carte soulevée` (`3518:4576`/`3518:4621`), valeurs littéralement
  // documentées par D-129 et `13 – Contrats d'écran.md` (CE-T02-02) : la
  // carte soulevée reçoit le fond `#F7F7FF` (déjà porté par
  // `exerciseContextBandBackground`, RÉUTILISÉ tel quel plutôt que dupliqué
  // — même valeur, D-129 la décrit d'ailleurs comme « repris du bandeau
  // supérieur »), un contour `1` point `#D1D1D6` et une ombre périphérique
  // `#14171F` à `22 %`. Ces deux dernières valeurs n'ont aucun équivalent
  // parmi les tokens existants (`border` = `#E0E3E8`, `textPrimary` =
  // `#141414`), d'où deux tokens propres.
  compositionDraggedCardBorder: "#D1D1D6",
  compositionDraggedCardShadow: "#14171F",
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
  // `captionStrong` (`11/14` Semi Bold) a existé le temps d'une continuation,
  // pour le libellé `Récupération` d'une carte de Composition. La seconde
  // recette visuelle (T02-S02, point 8) en demande une taille SUPÉRIEURE :
  // ce libellé consomme désormais `compactCardTitle` (`14/18` Semi Bold,
  // token déjà canonique, même graisse), et `captionStrong` est supprimé
  // plutôt que laissé sans consommateur.
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
  // T01-S09, correction VISUAL — `Controls / Disclosure — Source exact`
  // (`12 – Architecture technique.md`, `2537:1033`/`2537:1038`) : cible
  // tactile `48 × 48` (`minTouchTarget`, réutilisé — jamais dupliqué ici),
  // cadre visible centré `28 × 28`, rayon `6`. `chevronDisplaySize` (`16`)
  // dérive la taille d'affichage de `control-chevron-down`/`-up.svg`
  // (`viewBox` `24 × 24`, tracé occupant `12 × 6` en son centre) nécessaire
  // pour obtenir le chevron `8 × 4` exact documenté par le DSF : `16 = 24 ×
  // (8 / 12)` — même asset SVG existant, jamais redessiné, recoloré via
  // `tintColor` (`colors.disclosureChevronCollapsed`/`disclosureBorderExpanded`).
  catalogueDisclosure: { frame: 28, radius: 6, chevronDisplaySize: 16 },
  // R4-02 (`Action / Back`, `2624:3105`) : cible tactile inchangée
  // (`minTouchTarget`), cercle visuel et chevron réduits — auparavant un
  // cercle unique confondu avec la cible tactile elle-même.
  // T02-S02 (D-142, `12 – Architecture technique.md` § « Action / Back ») :
  // les actions CIRCULAIRES (Retour, Annuler, Confirmer) partagent une
  // géométrie unique — cercle visible `38 × 38`
  // (`component/action/circular-visual-box`), icône `24 × 24`
  // (`component/action/circular-icon`) et cible tactile `48 × 48`
  // (`size/touch-target-min`). Révise R4-02, qui donnait un cercle `28 × 28`
  // et un chevron `14 × 14` : ces deux valeurs sont antérieures à D-142 et
  // ne sont plus canoniques. La cible tactile, elle, est INCHANGÉE — c'est
  // toujours le `hitSlop` autour du cercle qui la porte, jamais le cercle.
  backAction: { visualCircle: 38, icon: 24, touchTarget: 48 },
  // R4-07/R4-09 (`Picker / Popover — Source exact`, variante
  // `Type=Duration`) : géométrie canonique de la roulette compacte —
  // D-098 (`07 – Registre des décisions`, « Validée post-Figma ») pour la
  // hauteur ; `12 – Architecture technique.md` pour les cibles d'action.
  // La zone roue (`wheelContentMinHeight`) est un plancher (`minHeight`),
  // pas une hauteur figée — voir `DurationWheelPicker.tsx` pour la
  // justification (ne pas reproduire le défaut D-04 corrigé au cycle
  // précédent).
  //
  // **T02-S02 — alignement DSF (D-098 révisée par D-142, `13 – Contrats
  // d'écran.md` CE-T01-07/CE-T01-14)** : la tension documentaire résolue en
  // REWORK04 (`toolbar 48`/`zone roue 196` contre `40 + 150`) est tranchée
  // par la documentation mise à jour — la barre d'actions mesure `53` et la
  // zone roue `150`, soit une hauteur canonique de `203`. `53` est une
  // hauteur de MISE EN PAGE (conteneur Figma `48 × 53`, `7,5` points de
  // respiration verticale autour du cercle) : elle n'agrandit jamais la
  // cible tactile, qui reste `48 × 48`. Largeurs canoniques publiées :
  // `330` pour `Type=Duration`, `144` pour `Type=Numeric wheel`.
  wheelPicker: {
    toolbarHeight: 53,
    wheelContentMinHeight: 150,
    totalHeight: 203,
    durationWidth: 330,
    numericWidth: 144,
    actionVisualCircle: 38,
    actionIcon: 24,
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
  // Bandeau contextuel canonique des écrans Catalogue, Composition et
  // Activité (`3261:4151`) : `402 × 115`, accolé au séparateur d'en-tête.
  // Le contenu interne s'y distribue sans espacement local par écran.
  // `paddingHorizontal` réutilise `spacing/24`, déjà la valeur canonique
  // partagée par tous les corps d'écran de ce projet.
  contextBand: {
    height: 115,
    paddingTop: 12,
    paddingBottom: 16,
  },
  // T01-S09 — `Selection / Category Tag` (`3302:4166`, CE-T01-11) : pilule
  // visuelle `30` de haut, centrée dans une cible tactile de hauteur
  // minimale `48` (même patron déjà documenté par `BodyZoneSelector.tsx`
  // pour les Zones corporelles, ici la valeur canonique exacte de la
  // Catégorie plutôt qu'une approximation).
  categoryTag: { visualHeight: 30, radius: 15 },
  // T02-S01 — `Composition / Activity Row` (`2588:2679`, D-128) et ses deux
  // états T02, littéralement documentés :
  //
  // - repos : carte `354 × 69` ;
  // - soulevée (`3518:4621`, D-129/CE-T02-02) : `362 × 71`, centrée à
  //   `x = 6`, rayon `8`, contour `1`, ombre `0/0` flou `10` étalement `2`.
  //
  // La LARGEUR n'est jamais codée en dur (la carte au repos occupe la
  // largeur utile réelle — plan §9.2) : seul l'ÉCART entre les deux états
  // l'est, appliqué symétriquement (`widthDelta / 2` de chaque côté, soit
  // exactement le `x = 6` documenté sur une section de `354`), de même que
  // l'écart de hauteur (`heightDelta / 2` de padding vertical
  // supplémentaire).
  //
  // Limite disclosée : React Native n'expose AUCUNE propriété d'étalement
  // d'ombre (`spread`). L'étalement `2` documenté par D-129 n'est donc pas
  // exprimable tel quel — `draggedElevation` porte l'équivalent Android
  // (`elevation`), iOS s'appuyant sur `shadowOffset`/`Opacity`/`Radius`
  // exacts. Écart à vérifier sur appareil réel.
  //
  // **T02-S02 — géométries CONDITIONNELLES du bloc Activité + Récupération**
  // (D-095/D-128/D-129, révisées par D-138 ; CE-T01-09 « carte au repos
  // `354 × 69` sans Récupération ou bloc `354 × 93` avec Récupération » ;
  // CE-T02-02 « Le bloc avec Récupération passe de `354 × 93` à
  // `362 × 97` … un rayon `12` ») :
  //
  // - `restHeight` (`65`) : carte principale seule, réduite de `4` points
  //   pour rendre visible le retrait de padding (`2` en haut et en bas) ;
  // - `recoveryCardHeight` (`24`) : sous-carte `Récupération X min Y s`,
  //   strictement inchangée ; le bloc complet vaut donc `65 + 24 = 89` ;
  // - `heightDelta` (`4`) : état soulevé `89 → 93` avec Récupération et
  //   `65 → 69` sans elle ;
  // - `draggedRadius` (`12`) : rayon de l'état soulevé publié par D-129 —
  //   révise le `8` de T02-S01, antérieur à la publication de la décision.
  compositionActivityRow: {
    restHeight: 65,
    recoveryCardHeight: 24,
    widthDelta: 8,
    heightDelta: 4,
    draggedRadius: 12,
    draggedShadowOpacity: 0.22,
    draggedShadowRadius: 10,
    draggedElevation: 8,
  },
  // T02-S01 — `Composition d'une séance — actions glissées` (`2028:11808`,
  // D-128) : groupe superposé `144 × 65` sur la partie DROITE de la carte
  // (qui ne se déplace pas), composé de `Dupliquer` et `Supprimer`, chacun
  // `72 × 65`, libellés centrés horizontalement et verticalement. La
  // sous-carte Récupération conserve sa hauteur propre de `24` points.
  compositionSwipeActions: { groupWidth: 144, actionWidth: 72 },
  // T02-S01 — sélecteur `Nombre de tours` (D-130/CE-T02-01) : `66 × 34`,
  // bord droit aligné sur celui des cartes, valeur numérique seule (jamais
  // `x` ni `×`), AUCUN chevron de repli. Remplace la géométrie `78 × 44`
  // avec carré violet de chevron issue de REWORK06 (T-04a/b/c), antérieure
  // à la publication de D-130.
  //
  // T02-S02 : `12 – Architecture technique.md` (« Sélecteur du nombre de
  // tours ») publie l'anatomie complète — « carré violet `28 × 28` avec `3`
  // points de marge en haut, à droite et en bas ; icône `#CDCEFA` issue de
  // la référence `2028:12051` ; aucun chevron de repli ». Les deux règles
  // coexistent sans se contredire : le carré porte le CHEVRON D'OUVERTURE
  // de la roulette (`Forms / Select Field`), jamais un chevron de REPLI
  // (haut/bas) — c'est ce dernier, et lui seul, qui reste proscrit.
  // `28 + 3 + 3 = 34` : la hauteur du cadre est dérivée, jamais recodée.
  compositionTourControl: {
    width: 66,
    height: 34,
    radius: 10,
    chevronBox: 28,
    chevronBoxRadius: 6,
    chevronBoxMargin: 3,
  },
} as const;

export const minTouchTarget = 48;
