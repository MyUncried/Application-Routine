import { Image } from "expo-image";

const sources = {
  "action-add": require("../../../assets/icons/action-add.svg"),
  "action-start": require("../../../assets/icons/action-start.svg"),
  "control-back": require("../../../assets/icons/control-back.svg"),
  "control-chevron-down": require("../../../assets/icons/control-chevron-down.svg"),
  "control-chevron-up": require("../../../assets/icons/control-chevron-up.svg"),
  "navigation-sessions-active": require("../../../assets/icons/navigation-sessions.svg"),
  "navigation-sessions-inactive": require("../../../assets/icons/navigation-sessions-inactive.svg"),
  "navigation-calendar-active": require("../../../assets/icons/navigation-calendar-active.svg"),
  "navigation-calendar-inactive": require("../../../assets/icons/navigation-calendar.svg"),
  "navigation-history-active": require("../../../assets/icons/navigation-history-active.svg"),
  "navigation-history-inactive": require("../../../assets/icons/navigation-history.svg"),
  "navigation-profile-active": require("../../../assets/icons/navigation-profile-active.svg"),
  "navigation-profile-inactive": require("../../../assets/icons/navigation-profile.svg"),
  "navigation-search": require("../../../assets/icons/navigation-search.svg"),
  "composition-initial-countdown": require("../../../assets/icons/composition-initial-countdown.svg"),
  "composition-main-content": require("../../../assets/icons/composition-main-content.svg"),
  "composition-end-session": require("../../../assets/icons/composition-end-session.svg"),
  "composition-reorder": require("../../../assets/icons/composition-reorder.svg"),
  "state-selected": require("../../../assets/icons/state-selected.svg"),
  "icon-tour": require("../../../assets/icons/icon-tour.svg"),
} as const;

const sizes = {
  "action-add": [24, 24],
  "action-start": [28, 28],
  // R4-02 (`Action / Back`, `2624:3105`) : affichage réduit de `24×24` à
  // `14×14` — la cible tactile (`minTouchTarget`, inchangée) est portée
  // par le `hitSlop`/conteneur de l'appelant, jamais par cette taille
  // d'affichage. Effet de bord accepté : `ExerciseScreen.tsx` (hors
  // périmètre de cette revue, non modifié) consomme la même icône
  // partagée et hérite donc de la même taille d'affichage — aucun fichier
  // de cet écran n'est modifié, seul le rendu de l'icône change, effet
  // inhérent à la correction d'un token DSF réellement partagé.
  "control-back": [14, 14],
  "control-chevron-down": [24, 24],
  "control-chevron-up": [24, 24],
  "navigation-sessions-active": [30, 20],
  "navigation-sessions-inactive": [30, 20],
  "navigation-calendar-active": [26, 26],
  "navigation-calendar-inactive": [26, 26],
  "navigation-history-active": [26, 21],
  "navigation-history-inactive": [26, 21],
  "navigation-profile-active": [26, 29],
  "navigation-profile-inactive": [26, 29],
  "navigation-search": [26, 26],
  "composition-initial-countdown": [24, 24],
  "composition-main-content": [18, 18],
  "composition-end-session": [24, 24],
  // R4-04 (cycle REWORK04) : affichage porté de `16×16` à `20×20`.
  // REWORK06 (addendum « écarts visuels encore ouverts », `[ChatGPT]
  // PLAN_APPROVED — REWORK06`, 2026-09-04) : « poignées de déplacement des
  // cartes encore trop petites » — porté à `24×24`. Même master vectoriel
  // (`composition-reorder.svg`, `2537:1456`) dans les deux cas, un
  // agrandissement d'affichage d'un SVG existant n'altère pas son tracé.
  // Aucun export dédié à `Icon / Structure / Movable` (`3066:4676`,
  // mentionné par la mission de design) n'a été fourni avec une URL
  // téléchargeable dans aucune autorisation reçue à ce jour — lacune
  // déclarée, pas un remplacement d'asset silencieux (voir le rapport de
  // mission).
  "composition-reorder": [24, 24],
  "state-selected": [24, 24],
  // R4-11 (`[ChatGPT] REWORK04 IMPLEMENTATION AUTHORIZED — DESIGN
  // COMPLEMENTS REVIEWED`, 2026-09-03) : export canonique `icon-tour.svg`
  // (composant Figma `3066:4685`, octets exacts téléchargés depuis
  // l'asset MCP fourni par l'autorisation, jamais redessiné).
  "icon-tour": [20, 20],
} as const;

export type KodjoIconName = keyof typeof sources;

export type KodjoIconProps = {
  name: KodjoIconName;
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
export function KodjoIcon({ name, opacity = 1, tintColor, size, testID }: KodjoIconProps) {
  const [defaultWidth, defaultHeight] = sizes[name];
  const width = size ?? defaultWidth;
  const height = size ?? defaultHeight;

  return (
    <Image
      source={sources[name]}
      style={{ width, height, opacity, tintColor }}
      contentFit="contain"
      accessible={false}
      testID={testID}
    />
  );
}
