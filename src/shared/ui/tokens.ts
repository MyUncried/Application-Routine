/**
 * Design tokens canoniques du MVP.
 *
 * Source : docs/Specifications-fonctionnelles/12 – Architecture technique,
 * « Design tokens canoniques ».
 */

/**
 * Valeurs canoniques partagées — chacune correspond à une variable
 * sémantique Figma (`KODJO / Sémantiques`, relevé direct du 07/10/2026,
 * mission d'alignement DSF). Les tokens d'usage ci-dessous qui portent le
 * même rôle visuel en sont des alias : deux valeurs voisines ne coexistent
 * plus pour un même rôle.
 */
const canonical = {
  primary: "#0508E5",
  primarySoft: "#8283F2",
  surface: "#F5F7FA",
  surfaceSubtle: "#F9FAFC",
  textPrimary: "#141414",
  textSecondary: "#595E66",
  textLabel: "#46464C",
  border: "#E0E3E8",
  danger: "#D92D20",
  mediaBorder: "#CDCEFA",
} as const;

export const colors = {
  primary: canonical.primary,
  selection: "#5F60EE",
  selectionSurface: "#E5F0FF",
  background: "#FFFFFF",
  surface: canonical.surface,
  surfaceSubtle: canonical.surfaceSubtle,
  textPrimary: canonical.textPrimary,
  textSecondary: canonical.textSecondary,
  // Alignement DSF 07/10 (D7) : `color/icon-neutral` est un alias Figma de
  // `color/text-secondary` — l'ancienne valeur `#5C636E` est historique.
  iconNeutral: canonical.textSecondary,
  // `color/text-label` — libellés et message de dialogue (D3).
  textLabel: canonical.textLabel,
  border: canonical.border,
  // D7/D8 : `color/divider` est un alias Figma de `color/border` ; les deux
  // noms coexistent, l'ancienne valeur `#DBE0E8` est historique.
  divider: canonical.border,
  // `color/cards/border` — bordure renforcée (choix de silhouette du Profil).
  cardsBorder: "#CCD1E0",
  // `color/primary-soft` — décor, jamais un fond portant du texte blanc de
  // taille normale.
  primarySoft: canonical.primarySoft,
  // `color/media/surface` (alias Figma de `color/surface`) et
  // `color/media/border`.
  mediaSurface: canonical.surface,
  mediaBorder: canonical.mediaBorder,
  // Fond lavande du stepper ouvert (`DSF / Controls / Stepper / Profil`,
  // `5544:4732`, variable Figma `color/observed/f2f2ff`) — valeur observée,
  // sans token sémantique Figma à ce jour.
  stepperSurface: "#F2F2FF",
  disabled: "#BEC2CC",
  snackbar: "#292B33",
  positive: "#4F9F83",
  warning: "#FF8D28",
  danger: canonical.danger,
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
  // Alignement DSF 07/10 : alias de `mediaBorder` (même valeur Figma).
  tourSurface: canonical.mediaBorder,
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
  //
  // Alignement DSF 07/10 (D3) : ramenées aux tokens canoniques
  // (`mediaSurface`, `divider`, `textPrimary`) — les anciennes valeurs
  // `#F6F6FF`/`#DBDBE5`/`#14171C`/`#1F1F26` sont historiques.
  exerciseParameterCardBackground: canonical.surface,
  exerciseParameterControlBorder: canonical.border,
  exerciseParameterValueText: canonical.textPrimary,
  exerciseParameterLabelText: canonical.textPrimary,
  // REWORK10 (`[ChatGPT] CHANGES_REQUESTED — REWORK10 — dialogue
  // d'abandon de création`, 2026-09-04) : `Overlay / Decision Dialog`
  // (`2590:2961`, instance `2591:3083` sur la frame CE-T01-08 `2028:11298`)
  // — six valeurs canoniques vérifiées directement sur ce nœud, aucune ne
  // coïncidant avec un token existant (notamment le rouge destructif,
  // `#E62B1E`/`#DB2E2E`, distinct de `color.danger`, `#D92D20`, déjà
  // utilisé ailleurs pour un rouge différent).
  //
  // Alignement DSF 07/10 (D3) : titre → `textPrimary`, message →
  // `textLabel`, fond neutre → `surface`, rouge destructif → `danger`
  // (`DSF / Overlays / Confirmation` `5544:6095` lie désormais le bouton
  // destructif à `color/danger`). `dialogNeutralActionText` reste `#292E38`
  // (exception explicite de D3).
  dialogTitleText: canonical.textPrimary,
  dialogMessageText: canonical.textLabel,
  dialogNeutralActionBackground: canonical.surface,
  dialogNeutralActionText: "#292E38",
  dialogDestructiveActionBackground: canonical.danger,
  dialogDestructiveActionBorder: canonical.danger,
  // REWORK12-bis (`[ChatGPT] Applique impérativement le protocole KODJO
  // actif...`, 2026-09-04, complétion REWORK12 après mise à jour Figma/
  // documentaire) : fond de la « Zone bleue — Contexte séance et nom de
  // l'activité » (`3261:4151`, vérifié directement) — `#F7F7FF`, distinct
  // d'un demi-point de `exerciseParameterCardBackground` (`#F6F6FF`) mais
  // conservé comme token propre : rôle sémantique différent (bandeau de
  // contexte plein écran vs cadre compact de paramètres), jamais réutilisé
  // à tort l'un pour l'autre.
  //
  // Alignement DSF 07/10 (D3) : ramené à `surface` ; l'ancienne valeur
  // `#F7F7FF` est historique.
  exerciseContextBandBackground: canonical.surface,
  // Voile modal UNIQUE (complément d'alignement du 07/10, ajout A) :
  // variable Figma `color/overlay/scrim` = `#1F2129` à 34 %, pour tous les
  // voiles existants (dialogues de décision, feuilles de sélection,
  // roulettes, options de création). Remplace l'ancienne approximation
  // `rgba(20, 20, 20, 0.5)`. Ne pas confondre avec
  // `compositionDraggedCardShadow` (`color/overlay-scrim`, `#14171F` plein),
  // réservé à la teinte d'ombre de la carte déplacée.
  overlayScrim: "rgba(31, 33, 41, 0.34)",
  // Contrôle segmenté standard (`DSF / Controls / Segmenté`, variante
  // `Deux options — 1 sélectionné` `7388:13779`, ajout C) : cadre blanc à
  // 50 % (`color/background` `2290:54`, opacité du remplissage 0,5 — jamais
  // une opacité du conteneur) et fond des options inactives `#EAEAFF`
  // (peinture locale du maître, sans variable Figma).
  segmentedSurface: "rgba(255, 255, 255, 0.5)",
  segmentedInactiveSurface: "#EAEAFF",
  // T01-S09, correction VISUAL (2e contre-recette suivante, commentaire de
  // revue post-`1f28a09`) — `Controls / Disclosure — Source exact`
  // (`12 – Architecture technique.md`, `2537:1033` `State=Collapsed` /
  // `2537:1038` `State=Expanded`), quatre valeurs canoniques vérifiées
  // directement sur ces nœuds, aucune ne coïncidant avec un token existant
  // (notamment `#FBFCFF`, distinct d'un demi-point de `colors.background`,
  // `#FFFFFF`) — remplace l'ancien cadre non sourcé de `SessionCard.tsx`
  // (`colors.tourSurface`/opacité `0.45`, jamais documentés pour ce
  // contrôle).
  //
  // Alignement DSF 07/10 : `DSF / Controls / Disclosure` (`5544:4650`) porte
  // TOUJOURS `#FBFCFF`, `#D6D9E3` et `#8282F2` (variables `color/observed/…`,
  // relevé direct) — Figma faisant foi pour le rendu, ces trois valeurs ne
  // sont pas ramenées à `surfaceSubtle`/`divider`/`primarySoft` comme le
  // proposait l'annexe A.3 du brief. Seule la bordure déployée, liée dans
  // Figma à une variable de même valeur que `color/primary-soft`, en devient
  // l'alias.
  disclosureBackground: "#FBFCFF",
  disclosureBorderCollapsed: "#D6D9E3",
  disclosureBorderExpanded: canonical.primarySoft,
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

/**
 * Alignement DSF 07/10 (D2) : les interlignes reproduisent le rendu « Auto »
 * de Figma pour Inter, `round(1,2102 × corps)` ; un style Figma à interligne
 * EXPLICITE conserve sa valeur (`dialogMessage` 21 et `contextLine` 17,
 * vérifiés sur les nœuds Figma). L'ancien `timerPrimary` (Inter 58/64, sans
 * consommateur) est retiré : le chronomètre d'Exécution utilisera Roboto
 * Condensed lorsque cet écran sera développé (chapitre 12, Typographie).
 */
export const type = {
  activityTitle: { ...semiBold, fontSize: 28, lineHeight: 34 },
  metricPrimary: { ...semiBold, fontSize: 22, lineHeight: 27 },
  screenTitle: { ...semiBold, fontSize: 20, lineHeight: 24 },
  modalTitle: { ...semiBold, fontSize: 18, lineHeight: 22 },
  sectionTitle: { ...semiBold, fontSize: 16, lineHeight: 19 },
  cardTitle: { ...semiBold, fontSize: 16, lineHeight: 19 },
  // Alignement DSF 07/10 (D9) : `15/18` Semi Bold (Figma `KODJO / Texte /
  // Inter Semi Bold 15`, Auto) — remplace le `14/18` de R4-03.
  compactCardTitle: { ...semiBold, fontSize: 15, lineHeight: 18 },
  // Alignement DSF 07/10 (§ 5.1 du brief) : titre des cartes de Séance et
  // d'Exercice (`DSF / Cards / Séance` `6214:7276`, `DSF / Cards / Exercice`
  // `6214:7278`), rôle distinct de `cardTitle` (16, conservé hors famille
  // Cartes).
  listCardTitle: { ...semiBold, fontSize: 15, lineHeight: 18 },
  // Alignement DSF 07/10 (D11) : durée affichée sans cadre sur les cartes,
  // Inter Semi Bold 12, Auto.
  cardDuration: { ...semiBold, fontSize: 12, lineHeight: 15 },
  // `DSF / Forms / Valeur modifiable` (`6944:26423`), variante `Texte=13` :
  // Inter Semi Bold 13, Auto — valeur d'un réglage, fermé ou en stepper.
  editableValue: { ...semiBold, fontSize: 13, lineHeight: 16 },
  body: { ...regular, fontSize: 14, lineHeight: 17 },
  label: { ...medium, fontSize: 14, lineHeight: 17 },
  button: { ...semiBold, fontSize: 14, lineHeight: 17 },
  supporting: { ...regular, fontSize: 12, lineHeight: 15 },
  // Alignement DSF 07/10 (D2/D9) : `11/13` (Inter Regular 11, Auto) —
  // remplace le `11/14` de R4-03.
  caption: { ...regular, fontSize: 11, lineHeight: 13 },
  // `captionStrong` (`11/14` Semi Bold) a existé le temps d'une continuation,
  // pour le libellé `Récupération` d'une carte de Composition. La seconde
  // recette visuelle (T02-S02, point 8) en demande une taille SUPÉRIEURE :
  // ce libellé consomme désormais `compactCardTitle` (`14/18` Semi Bold,
  // token déjà canonique, même graisse), et `captionStrong` est supprimé
  // plutôt que laissé sans consommateur.
  navLabel: { ...regular, fontSize: 11, lineHeight: 13 },
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
  // `13px` Regular, interligne Auto Figma — `16` selon D2 (l'ancienne
  // estimation `18` est remplacée).
  exerciseFieldValue: { ...regular, fontSize: 13, lineHeight: 16 },
  // REWORK10 (`Overlay / Decision Dialog`, `2590:2961`/`2591:3083`,
  // vérifié directement sur `2028:11298`) : message du dialogue, `14px`
  // Regular, hauteur de ligne `21` (documentée explicitement par Figma,
  // `leading-[21px]` — contrairement aux tokens `parameterColumnLabel`/
  // `exerciseFieldValue` ci-dessus, ici une vraie valeur Figma, pas une
  // estimation) — distincte de `type.body` (`14/20`), à `1pt` près, donc
  // un token dédié plutôt qu'une réutilisation approximative.
  dialogMessage: { ...regular, fontSize: 14, lineHeight: 21 },
  // Libellé de l'action neutre (« Annuler »), `16px` Semi Bold.
  dialogNeutralActionLabel: { ...semiBold, fontSize: 16, lineHeight: 19 },
  // Libellé de l'action destructive (« Confirmer »), `16px` MEDIUM —
  // vérifié explicitement distinct en graisse du libellé neutre
  // ci-dessus sur le nœud Figma (`font-['Inter:Medium']` vs `Inter:Semi_
  // Bold`), pas une incohérence à corriger silencieusement.
  dialogDestructiveActionLabel: { ...medium, fontSize: 16, lineHeight: 19 },
  // REWORK12-bis : `Contexte — Nom de la séance` (`3261:4152`, bandeau
  // Activité), vérifié directement `Inter Regular`, `14/17` — hauteur de
  // ligne `17` documentée explicitement par Figma (`leading-[17px]`),
  // distincte de `body` (`14/20`) et de `dialogMessage` (`14/21`), donc un
  // token propre plutôt qu'une réutilisation approximative (même principe
  // que `dialogMessage` en son temps).
  contextLine: { ...regular, fontSize: 14, lineHeight: 17 },
  // Libellés des contrôles segmentés (ajout C) : style Figma `KODJO / Section
  // title`, Inter Semi Bold 16 à interligne EXPLICITE 20 (vérifié sur
  // `7388:13781`), pour l'option sélectionnée comme pour les inactives.
  segmentedLabel: { ...semiBold, fontSize: 16, lineHeight: 20 },
} as const;

export const spacing = {
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
} as const;

export const fixedRadii = {
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  17: 17,
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
  // chaque segment `34` de haut (strictement égaux), rayon interne `10`.
  // Ajout C (07/10, `DSF / Controls / Segmenté` `7388:13779`) : rayon
  // externe `12` → `14`, écart entre segments `14` → `4`, cadre sans
  // contour.
  segmentedControl: {
    height: 42,
    containerRadius: 14,
    padding: 4,
    gap: 4,
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
  // - `restHeight` (`60`) : carte principale à trois lignes, avec Zones corporelles ;
  // - `compactRestHeight` (`44`) : carte principale à deux lignes lorsque les Zones,
  //   facultatives, sont absentes ; elle conserve exactement le même padding vertical ;
  // - `recoveryCardHeight` (`24`) : sous-carte `Récupération X min Y s`,
  //   strictement inchangée ; les blocs complets valent donc `84` ou `68` ;
  // - `heightDelta` (`4`) : agrandissement constant de l'état soulevé ;
  // - `draggedRadius` (`12`) : rayon de l'état soulevé publié par D-129 —
  //   révise le `8` de T02-S01, antérieur à la publication de la décision.
  compositionActivityRow: {
    restHeight: 60,
    compactRestHeight: 44,
    recoveryCardHeight: 24,
    widthDelta: 8,
    heightDelta: 4,
    draggedRadius: 12,
    draggedShadowOpacity: 0.22,
    draggedShadowRadius: 10,
    draggedElevation: 8,
  },
  // T02-S01 — `Composition d'une séance — actions glissées` (`2028:11808`,
  // D-128) : groupe superposé `144 × 60` sur la partie DROITE de la carte
  // (qui ne se déplace pas), composé de `Dupliquer` et `Supprimer`, chacun
  // `72 × 60`, libellés centrés horizontalement et verticalement. La
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
