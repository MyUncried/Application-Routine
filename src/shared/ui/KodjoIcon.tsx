import { Image } from "expo-image";

import { dimensions } from "./tokens";

const sources = {
  "action-add": require("../../../assets/icons/action-add.svg"),
  "action-start": require("../../../assets/icons/action-start.svg"),
  // Alignement DSF 07/10 : export exact de `icon/retour` (`6959:15940`) —
  // même tracé que l'ancien `control-back.svg` (`2884:4426`, supprimé de
  // Figma), trait `#141414` au lieu de `#1F2023`.
  "control-back": require("../../../assets/icons/icon-retour.svg"),
  // PRE-4 story 4.2 (FR-02-03, AC4) : export exact de `icon/fermer` (`6959:15825`,
  // déposé le 2026-10-06), ✕ de l'en-tête de l'Éditeur d'Exercice (`Action / Fermer`).
  "control-close": require("../../../assets/icons/icon-fermer.svg"),
  "control-chevron-down": require("../../../assets/icons/control-chevron-down.svg"),
  "control-chevron-up": require("../../../assets/icons/control-chevron-up.svg"),
  "navigation-sessions-active": require("../../../assets/icons/navigation-sessions.svg"),
  "navigation-sessions-inactive": require("../../../assets/icons/navigation-sessions-inactive.svg"),
  "navigation-calendar-active": require("../../../assets/icons/navigation-calendar-active.svg"),
  "navigation-calendar-inactive": require("../../../assets/icons/navigation-calendar.svg"),
  "navigation-history-active": require("../../../assets/icons/navigation-history-active.svg"),
  "navigation-history-inactive": require("../../../assets/icons/navigation-history.svg"),
  "navigation-community-active": require("../../../assets/icons/navigation-community-active.svg"),
  "navigation-community-inactive": require("../../../assets/icons/navigation-community.svg"),
  "navigation-profile-active": require("../../../assets/icons/navigation-profile-active.svg"),
  "navigation-profile-inactive": require("../../../assets/icons/navigation-profile.svg"),
  "navigation-search": require("../../../assets/icons/navigation-search.svg"),
  // PRE-8 (E01) : exports de `Navigation / Bottom — 5 onglets` (`6513:20151`), actif et inactif.
  "nav5-catalogue-active": require("../../../assets/icons/nav5-catalogue-active.svg"),
  "nav5-catalogue-inactive": require("../../../assets/icons/nav5-catalogue.svg"),
  "nav5-calendar-active": require("../../../assets/icons/nav5-calendar-active.svg"),
  "nav5-calendar-inactive": require("../../../assets/icons/nav5-calendar.svg"),
  "nav5-history-active": require("../../../assets/icons/nav5-history-active.svg"),
  "nav5-history-inactive": require("../../../assets/icons/nav5-history.svg"),
  "nav5-community-inactive": require("../../../assets/icons/nav5-community.svg"),
  "nav5-profile-active": require("../../../assets/icons/nav5-profile-active.svg"),
  "nav5-profile-inactive": require("../../../assets/icons/nav5-profile.svg"),
  "composition-initial-countdown": require("../../../assets/icons/composition-initial-countdown.svg"),
  "composition-end-session": require("../../../assets/icons/composition-end-session.svg"),
  "composition-reorder": require("../../../assets/icons/composition-reorder.svg"),
  "state-selected": require("../../../assets/icons/state-selected.svg"),
  "icon-tour": require("../../../assets/icons/icon-tour.svg"),
  // Recette PRE-3 (X-2, 12/10) : master `icon/categorie` (`6296:10530`), identité
  // vérifiée contre l’extraction figée du 08/10 ; preuve
  // `docs/preparation/PRE-3/planification/execution/preuves/x2-icone-categorie/`.
  "icon-categorie": require("../../../assets/icons/icon-categorie.svg"),
  // PRE-4 story 4.3 (FR-02-05 ; ch. 13 l. 588) : états « plein » de la planche
  // `7245:13718` (lecture seule MCP, 2026-10-18) — même tracé que les maîtres
  // contour (`6296:10530`, `6322:10874`, `6322:10877`), affiché pendant
  // l'ouverture de la feuille ; le contour reste le maître déjà accepté.
  "icon-categorie-plein": require("../../../assets/icons/icon-categorie-plein.svg"),
  "body-zone-homme-plein": require("../../../assets/icons/body-zone-homme-plein.svg"),
  "body-zone-femme-plein": require("../../../assets/icons/body-zone-femme-plein.svg"),
  "wheel-action-cancel": require("../../../assets/icons/wheel-action-cancel.svg"),
  "wheel-action-validate": require("../../../assets/icons/wheel-action-validate.svg"),
  "select-field-chevron": require("../../../assets/icons/select-field-chevron.svg"),
  // V2-PRE-1 (#287, masters Figma `6322:10874`/`6322:10877`) ; V2-PRE-2
  // (plan §6.5, T13) : silhouette de Zone corporelle — variante homme/femme,
  // affichée dans Modifier le profil (choix) et la modale Zones (icône
  // résolue selon la silhouette du Profil, `BodyZoneIcon.tsx`).
  "body-zone-homme": require("../../../assets/icons/body-zone-homme.svg"),
  "body-zone-femme": require("../../../assets/icons/body-zone-femme.svg"),
  // Révision r4 (demande de changement, run 37214282333) : export canonique
  // du composant Figma `4916:6386` « Icône — Étiquette — cil:tag »
  // (20×20, trait #0508E5, dans le cadre `2028:11204`), octets exacts
  // (2087, sha256 `6b3a4b0c73…`). Utilisé par la pilule d'Étiquette de la
  // Composition lorsqu'aucune Étiquette n'est choisie (R7a).
  "label-outline": require("../../../assets/icons/label-outline.svg"),
  // Alignement DSF 07/10 (annexe E.7) : signes « − » et « + » du stepper,
  // jusqu'ici rendus en caractères typographiques. Figma les dessine en
  // texte Inter Medium 16 (`DSF / Controls / Stepper / Profil`, `5826:4101`
  // et `5826:4105`) : ces assets sont l'export vectorisé exact de ces deux
  // glyphes (`SVG_STRING`, `svgOutlineText`), jamais redessinés.
  "stepper-minus": require("../../../assets/icons/stepper-minus.svg"),
  "stepper-plus": require("../../../assets/icons/stepper-plus.svg"),
  // PRE-6 story 2.1 (D-303, Figma `8328:41087` « Sablier — Récupération ») : couche
  // vectorielle servie par l’outil MCP Figma en lecture seule (`download_assets`, svgAssets),
  // attributs racine preserveAspectRatio/overflow/style retirés, identifiant de groupe réparé.
  "recovery-hourglass": require("../../../assets/icons/icon-sablier-recuperation.svg"),
  // PRE-6 story 2.2 (RM-243, D-407, ARB-2) : indicateur NEUTRE de changement de côté, sans
  // direction — Figma `9522:20651` (carte d'occurrence), tracé identique à `6238:8587`
  // (carte de sélection) : un seul fichier. Même procédé d'export que `recovery-hourglass`.
  "side-change": require("../../../assets/icons/icon-changement-de-cote.svg"),
  // PRE-6 story 2.2 : sablier de la durée totale, carte de sélection « Choix composition »
  // (`DSF / Cards / Exercice`, `6214:4410`). Distinct du sablier de récupération (autre tracé).
  "duration-hourglass": require("../../../assets/icons/icon-duree-sablier.svg"),
  // PRE-6 story 3.4 (CE-CIR-03) : `icon/oeil` (`8165:13756`), œil de l’en-tête du Circuit qui
  // ouvre « Volumes du circuit ». Export SVG de l’outil MCP Figma en lecture seule ; le fond de
  // canevas ajouté par l’export est retiré, l’identifiant doublement encodé réparé.
  "view-volumes": require("../../../assets/icons/icon-oeil.svg"),
  // PRE-6 story 4.1 : action d’en-tête « Ajouter un arrêt » (`8328:28622`) — icône standard
  // `8328:28624` et icône pleine de l’état actif pendant le placement (`8328:29289`). Exports SVG
  // de l’outil MCP Figma en lecture seule (boîte 25 × 25 de l’export : le halo blanc déborde d’un
  // point le cadre 24 × 24).
  "add-stop": require("../../../assets/icons/icon-ajouter-un-arret.svg"),
  "add-stop-active": require("../../../assets/icons/icon-ajouter-un-arret-actif.svg"),
  // PRE-6 story 4.1 : sablier des puces « Récupération » du placement (`8328:40909` sur la puce à
  // ajouter, `8328:40907` en blanc sur la puce ajoutée). Tracé distinct du sablier 13 de la ligne
  // structurelle (`recovery-hourglass`).
  "placement-recovery": require("../../../assets/icons/icon-recuperation-placement.svg"),
  "placement-recovery-added": require("../../../assets/icons/icon-recuperation-placement-ajoutee.svg"),
  // PRE-6 story 4.2 : sablier blanc 12 de la bulle « Retirer la récupération » (`8328:41025`,
  // dans `8328:29267`). Ressource servie par `get_design_context` (outil MCP Figma, lecture seule) :
  // attributs racine preserveAspectRatio/overflow/style retirés, identifiant de groupe décodé
  // (export doublement encodé) ; tracé inchangé — même dessin que `8328:40907` à l’échelle 12/14,
  // dont le second sous-chemin reste ouvert comme dans Figma (sans effet sur le remplissage).
  "remove-recovery": require("../../../assets/icons/icon-retirer-recuperation.svg"),
  // PRE-6 story 5.1 (D-435, carte v2 `9798:44464`) : icônes de la carte d’occurrence de la
  // Composition, exports SVG de l’outil MCP Figma en lecture seule (attributs racine
  // preserveAspectRatio/overflow/style retirés, identifiant de groupe décodé) :
  // - gabarit média 24 (`9798:19907`, même tracé que la variante Circuit `9819:19963`) ;
  // - pastilles 13 de Catégorie (`9798:19913`) et de Zone corporelle (`9798:19919`) ;
  // - symbole 13 de la synthèse de travail (`9798:19927`) ;
  // - sablier 13 de la récupération (`9798:19932`) : tracé plus grand que `recovery-hourglass`
  //   (`8328:41087`), qui n’est donc pas réutilisé ;
  // - changement de côté 16 (`9798:19925`) : même tracé que `side-change`, mais rempli
  //   `#7A7A80` au lieu de `#9499A8` ; la carte de sélection garde `side-change`.
  "card-media-exercise": require("../../../assets/icons/icon-nature-exercice.svg"),
  "card-category-badge": require("../../../assets/icons/icon-pastille-categorie.svg"),
  "card-body-zone-badge": require("../../../assets/icons/icon-pastille-zone-corporelle.svg"),
  "card-work-duration": require("../../../assets/icons/icon-symbole-duree.svg"),
  "card-recovery-hourglass": require("../../../assets/icons/icon-sablier-recuperation-v2.svg"),
  "card-side-change": require("../../../assets/icons/icon-changement-de-cote-v2.svg"),
  // PRE-7 story A2.2 (D-438, relevé Figma MFN du 23/10) : `icon/modifier` (`9925:41240`), crayon au
  // trait bleu KODJO de l’action « Modifier le geste » (`9952:44374`). Export SVG de l’outil MCP
  // Figma en lecture seule, attributs racine preserveAspectRatio/overflow/style retirés.
  "edit-movement": require("../../../assets/icons/icon-modifier.svg"),
} as const;

const sizes = {
  "action-add": [24, 24],
  "action-start": [28, 28],
  // R4-02 (cycle REWORK04) : affichage réduit de `24×24` à `14×14` — la
  // cible tactile (`minTouchTarget`, inchangée) était portée par le
  // `hitSlop`/conteneur de l'appelant, jamais par cette taille d'affichage.
  // REWORK07B (`[ChatGPT] PLAN_APPROVED — REWORK07B — contrôles canoniques
  // + structure Tour`, 2026-09-04) : **revenu à `24×24`** — le registre de
  // traçabilité canonique (`12 – Architecture technique.md`, `Action /
  // Back`, `2624:3105`) documente explicitement le cadre SVG à `24×24`
  // (cible tactile `48×48` et cercle visible `28×28` inchangés, toujours
  // portés par `dimensions.backAction`/`hitSlop` dans `ScreenShell.tsx`,
  // jamais par cette taille d'affichage). `14×14` était non conforme.
  // Effet de bord accepté, déjà documenté au cycle R4-02 : `ExerciseScreen
  // .tsx` (hors périmètre de cette revue, non modifié) consomme la même
  // icône partagée et hérite donc de la même taille d'affichage — aucun
  // fichier de cet écran n'est modifié, seul le rendu de l'icône change,
  // effet inhérent à la correction d'un token DSF réellement partagé.
  "control-back": [24, 24],
  // Cadre 24 × 24 du `viewBox` exact ; cercle 38 et cible 48 portés par `dimensions.backAction`.
  "control-close": [24, 24],
  "control-chevron-down": [24, 24],
  "control-chevron-up": [24, 24],
  "navigation-sessions-active": [24, 24],
  "navigation-sessions-inactive": [24, 24],
  "navigation-calendar-active": [24, 24],
  "navigation-calendar-inactive": [24, 24],
  "navigation-history-active": [24, 24],
  "navigation-history-inactive": [24, 24],
  "navigation-community-active": [26, 26],
  "navigation-community-inactive": [26, 26],
  "navigation-profile-active": [24, 24],
  "navigation-profile-inactive": [24, 24],
  "navigation-search": [26, 26],
  // Cadres des `viewBox` exacts ; boîte 32 et cible tactile portées par la barre (`app/(tabs)/_layout.tsx`).
  "nav5-catalogue-active": [24, 24],
  "nav5-catalogue-inactive": [24, 24],
  "nav5-calendar-active": [24, 24],
  "nav5-calendar-inactive": [24, 24],
  "nav5-history-active": [24, 24],
  "nav5-history-inactive": [24, 24],
  "nav5-community-inactive": [23.9932, 20.0716],
  "nav5-profile-active": [24, 24],
  "nav5-profile-inactive": [24, 24],
  "composition-initial-countdown": [24, 24],
  "composition-end-session": [24, 24],
  // R4-04 (cycle REWORK04) : affichage porté de `16×16` à `20×20`. REWORK06
  // (addendum « écarts visuels encore ouverts », 2026-09-04) : porté à
  // `24×24` sur la base de l'asset provisoire alors en place
  // (`composition-reorder.svg`, `2537:1456`, `16×16`). REWORK07-A
  // (`[ChatGPT] CHANGES_REQUESTED — REWORK07-A — ICON / STRUCTURE /
  // MOVABLE UNIQUEMENT`, 2026-09-04) : diagnostic indépendant établi —
  // l'ancien master ne dessinait son encre que dans `x=5…11` de son
  // `viewBox` `16×16`, donc agrandir sa boîte d'affichage n'agrandissait
  // pas proportionnellement le tracé visible, expliquant l'aspect « encore
  // trop petit » malgré les deux hausses précédentes. **Asset remplacé**
  // par l'export canonique du composant Figma/DSF `Icon / Structure /
  // Movable` (`3066:4676`, octets exacts, jamais redessiné) et la taille
  // ramenée à son glyphe intrinsèque réel (`dimensions.structureMovableIcon
  // .glyph`, `20×20`) — cette baisse numérique n'est pas un retour en
  // arrière : le tracé du nouvel asset couvre l'essentiel de son canevas,
  // contrairement à l'ancien.
  "composition-reorder": [dimensions.structureMovableIcon.glyph, dimensions.structureMovableIcon.glyph],
  "state-selected": [24, 24],
  // R4-11 (`[ChatGPT] REWORK04 IMPLEMENTATION AUTHORIZED — DESIGN
  // COMPLEMENTS REVIEWED`, 2026-09-03) : export canonique `icon-tour.svg`
  // (composant Figma `3066:4685`, octets exacts téléchargés depuis
  // l'asset MCP fourni par l'autorisation, jamais redessiné).
  //
  // REWORK12-bis (`.github/orchestration/reports/2026-09-04_icon-tour-
  // canonical-source-alignment.md`, `DESIGN_ICON_TOUR_CANONICAL_SOURCE_
  // ALIGNED`) : `Icon / Tour` (`3066:4685`) a été reconstruit sur le dessin
  // validé de `Nouvelle séance — Nom renseigné` (`2028:12003`) — géométrie
  // canonique désormais `18×18` (`20×20` R4-11 abandonné, pas une
  // régression : c'est le même composant DSF, reconstruit sur une
  // géométrie différente et republiée). `assets/icons/icon-tour.svg`
  // lui-même a été remplacé par le nouvel export (octets exacts, commit
  // `890b1e7`) — seule cette taille d'affichage est corrigée ici pour
  // suivre l'actif. `composition-main-content` (ancienne source
  // concurrente, `icon/contenu-principal`) est retiré de ce registre : le
  // manifeste Figma (`assets/icons/manifest.json`) ne porte plus aucune
  // entrée pour cette icône.
  "icon-tour": [18, 18],
  "icon-categorie": [24, 24],
  // Boîtes intrinsèques des exports de la planche (22 et 26) : le tracé y est
  // celui du maître à l'échelle 22/24 et 26/24 — à taille d'affichage égale à
  // celle du contour, le glyphe plein se superpose exactement (story 4.3).
  "icon-categorie-plein": [22, 22],
  "body-zone-homme-plein": [26, 26],
  "body-zone-femme-plein": [26, 26],
  // REWORK07B (`[ChatGPT] PLAN_APPROVED — REWORK07B — contrôles canoniques
  // + structure Tour`, 2026-09-04) : actifs SVG canoniques `wheel-action-
  // cancel.svg`/`wheel-action-validate.svg` (`3089:81`/`3089:83`),
  // remplaçant les glyphes Unicode `✕`/`✓` de `PickerToolbar` dans
  // `DurationWheelPicker.tsx`. Cadre `24×24`, matching le `viewBox` exact
  // de chaque export — le cercle visible `28×28` et la cible tactile
  // `48×48` restent portés par `dimensions.wheelPicker`, jamais par cette
  // taille d'affichage (même patron que `control-back`).
  "wheel-action-cancel": [24, 24],
  "wheel-action-validate": [24, 24],
  // REWORK09 (mission directe utilisateur, 2026-09-04) : chevron interne
  // de `Forms / Select Field — Source exact` (`2537:1095`), consommé par
  // les contrôles `Durée`/`Pause`/`Séries`/`Répétitions` de `Activity /
  // Parameter Row` dans `ExerciseScreen.tsx`. `14×14`, matching le
  // `viewBox` exact de l'export — distinct de `control-chevron-down`
  // (fonction graphique différente, `24×24`, réutilisée ailleurs pour
  // `Controls/Disclosure`) : pas de substitution/redimensionnement
  // générique entre familles d'icônes (voir `2026-09-04_repetition-pull-
  // down-canonical-icon.md`, § « Contrôle des icônes similaires »).
  "select-field-chevron": [14, 14],
  // V2-PRE-1/#287, V2-PRE-2 (T13) : glyphe intrinsèque `24×24` (export SVG
  // exact) — taille d'affichage par défaut (`BodyZoneIcon.tsx`, modale
  // Zones) ; `ProfileEditScreen.tsx` passe `size={44}` explicitement pour
  // le sélecteur de silhouette (deux cercles `64`, icône `44` — CE-UI-01
  // L2001).
  "body-zone-homme": [24, 24],
  "body-zone-femme": [24, 24],
  // Révision r4 : glyphe intrinsèque 20×20 (viewBox exact de l'export, R7a).
  "label-outline": [20, 20],
  // Boîtes intrinsèques des glyphes exportés (centrés par l'appelant dans
  // le cercle `28 × 28` du stepper).
  "stepper-minus": [8, 2],
  "stepper-plus": [8, 8],
  // Cadre 13 × 13 du `viewBox` exact (ligne structurelle de récupération).
  "recovery-hourglass": [13, 13],
  // Cadres 16 × 16 des `viewBox` exacts.
  "side-change": [16, 16],
  "duration-hourglass": [16, 16],
  // Cadre 24 × 24 du `viewBox` exact ; cercle 32 et cible 44 portés par `CircuitHeader`.
  "view-volumes": [24, 24],
  // Boîtes 25 × 25 des exports ; cercle 34 et cible 44 portés par `CompositionContextHeader`.
  "add-stop": [25, 25],
  "add-stop-active": [25, 25],
  // Cadres 14 × 14 des `viewBox` exacts (puces du placement).
  "placement-recovery": [14, 14],
  "placement-recovery-added": [14, 14],
  // Cadre 12 × 12 du `viewBox` exact (bulle « Retirer la récupération »).
  "remove-recovery": [12, 12],
  "card-media-exercise": [24, 24],
  "card-category-badge": [13, 13],
  "card-body-zone-badge": [13, 13],
  "card-work-duration": [13, 13],
  "card-recovery-hourglass": [13, 13],
  "card-side-change": [16, 16],
  // Cadre 20 × 20 de l’instance (`9952:44375`), tracé débordant de 3,75 % de chaque côté : 21,5.
  "edit-movement": [21.5, 21.5],
} as const;

/**
 * Opacité par défaut intrinsèque à un nom d'icône — REWORK07-A (`[ChatGPT]
 * CHANGES_REQUESTED — REWORK07-A — ICON / STRUCTURE / MOVABLE UNIQUEMENT`,
 * 2026-09-04) : jusqu'ici, l'opacité `0.5` du pictogramme
 * `Icon / Structure / Movable` était un littéral local (`opacity={0.5}`)
 * répété à chaque appelant (`CompositionScreen.tsx`, rangées limites et
 * ligne Exercice) — aucune garantie qu'un futur appelant l'applique aussi.
 * Portée ici comme valeur par défaut du composant partagé : tout appel
 * `<KodjoIcon name="composition-reorder" />` sans prop `opacity` obtient
 * automatiquement `0.5`, sans paramètre d'écran. Absente de ce registre
 * pour un nom = opacité par défaut `1`, comportement inchangé pour toutes
 * les autres familles d'icônes. La prop `opacity` explicite reste
 * disponible et prioritaire si un appelant a un besoin réellement différent
 * (aucun cas actuel).
 */
const defaultOpacities: Partial<Record<keyof typeof sources, number>> = {
  "composition-reorder": 0.5,
};

export type KodjoIconName = keyof typeof sources;

export type KodjoIconProps = {
  name: KodjoIconName;
  /**
   * Opacité explicite — remplace la valeur par défaut intrinsèque de `name`
   * (`defaultOpacities`, `1` si absente) pour CETTE instance uniquement.
   * Optionnel ; la plupart des appelants n'ont pas besoin de la fournir,
   * REWORK07-A ayant justement supprimé les littéraux locaux redondants
   * pour `composition-reorder`.
   */
  opacity?: number;
  /**
   * Recolore l'icône (`Image.tintColor`, `expo-image`) — correction T-04
   * (contre-recette iPhone, `[ChatGPT] DEVICE NO-GO — PHASE02 REWORK03
   * CUMULATIVE CORRECTION`, 2026-09-03) : premier appelant, le chevron
   * blanc du contrôle Tour sur fond violet. Optionnel, `undefined` par
   * défaut — n'affecte aucun des appels existants (rendu SVG source
   * inchangé). Rendu réel non vérifiable sans device
   * (`NON_VERIFIABLE_DEVICE`, voir le rapport de mission) : `tintColor`
   * recolore fiablement une image à canal alpha uniforme, mais son effet
   * exact sur un SVG multicolore n'est pas garanti — n'utiliser que sur des
   * glyphes monochromes connus (chevrons, flèches).
   */
  tintColor?: string;
  /**
   * Taille d'affichage explicite, en points (carrée) — remplace la taille
   * par défaut de `name` pour CETTE instance uniquement, sans jamais
   * modifier la taille par défaut des autres appelants du même nom.
   * Correction T-04/R4-10 (contrôle Tour, `[ChatGPT] REWORK04
   * IMPLEMENTATION AUTHORIZED — DESIGN COMPLEMENTS REVIEWED`, 2026-09-03) :
   * premier appelant, le chevron du contrôle Tour (`28×28`), trop petit
   * pour la taille par défaut de `control-chevron-down` (`24×24`,
   * partagée avec `SessionCard`/`ExerciseScreen`, non modifiable
   * globalement sans les affecter). Optionnel, `undefined` par défaut —
   * n'affecte aucun appel existant qui ne le fournit pas. Un
   * redimensionnement d'affichage d'un SVG vectoriel n'altère pas son
   * tracé (contrairement à un remplacement d'asset).
   */
  size?: number;
  testID?: string;
};

/**
 * Point d'entrée unique des icônes KODJO.
 *
 * Les sources sont les exports SVG exacts du Design System Figma. Les
 * dimensions logiques restent celles des nœuds de référence ; le SVG assure
 * un rendu indépendant de la densité de pixels, sans glyphe de substitution.
 */
export function KodjoIcon({ name, opacity, tintColor, size, testID }: KodjoIconProps) {
  const [defaultWidth, defaultHeight] = sizes[name];
  const width = size ?? defaultWidth;
  const height = size ?? defaultHeight;
  const resolvedOpacity = opacity ?? defaultOpacities[name] ?? 1;

  return (
    <Image
      source={sources[name]}
      style={{ width, height, opacity: resolvedOpacity, tintColor }}
      contentFit="contain"
      accessible={false}
      testID={testID}
    />
  );
}
