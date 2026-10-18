import { createContext, useContext, type ReactNode, type Ref } from "react";
import { StyleSheet, type ScrollView, type ScrollViewProps, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import Reanimated, {
  Easing,
  LayoutAnimationConfig,
  LinearTransition,
  ReduceMotion,
  withTiming,
  type EntryAnimationsValues,
  type ExitAnimationsValues,
  type LayoutAnimation,
} from "react-native-reanimated";

/**
 * PRE-4 Q39 (Hermann, 2026-10-17, recette iPhone, E-13 ; NFR-10) — apparitions
 * et disparitions de la Feuille Paramètres d'exécution rendues fluides par les
 * animations de mise en page de Reanimated, exécutées sur le fil UI (plus aucune
 * animation de `height` sur le fil JS). Q40 (E-14) : durée unique de 350 ms et
 * courbe commune (`SHEET_MOTION_EASING`).
 *
 * PRE-4 Q41 (Hermann, 2026-10-17, recette iPhone, E-15 ; remplace le fondu de
 * Q39/Q40) — « Le fondu perdure, il faut le supprimer. Les contrôles segmentés
 * doivent simplement apparaître de bas en haut, suivant la délimitation de la
 * barre horizontale du dessous, et disparaître de la même manière. »
 *
 * - AUCUNE opacité animée, nulle part (ni entrée, ni sortie, ni transition).
 * - Révélation par le bas : chaque élément qui apparaît est rendu dans un cadre
 *   de découpe (`overflow: "hidden"`). Le bas de ce cadre est la barre
 *   horizontale (séparateur) placée sous lui : à l'entrée, le cadre s'ouvre de 0
 *   à sa hauteur (`revealClipEntering`) pendant que la barre glisse vers le bas
 *   (transition de place des voisines, même durée, même courbe), et le contenu
 *   monte de sa hauteur jusqu'à sa place (`revealContentEntering`) : il sort de
 *   sous la barre, vers le haut. À la sortie, symétrique : le contenu redescend
 *   sous la barre pendant que le cadre se referme et que la barre remonte.
 * - `layout` : transition de place linéaire amortie, sans fondu ; les lignes
 *   voisines, le groupe, le corps défilant et la feuille glissent vers leur
 *   nouvelle place au lieu de sauter.
 *
 * Toutes ces animations portent sur `height` (cadre natif) et `transform`, sur
 * le fil UI (fonctions worklet de mise en page). « Réduire les animations »
 * (NFR-10, D-4, D-7) : le fournisseur ne transmet AUCUNE animation, le
 * changement est immédiat ; chaque `withTiming` porte en plus
 * `ReduceMotion.System`, filet natif si le réglage change entre deux rendus.
 * Aucun jeton de `tokens.ts` n'est concerné.
 *
 * Les entrées des éléments déjà présents à l'ouverture de la Feuille sont
 * neutralisées (`LayoutAnimationConfig skipEntering`) : seule la montée de la
 * Feuille (`sheetEntry`, inchangée) anime l'ouverture ; à la fermeture, aucune
 * sortie n'est jouée (`skipExiting`).
 *
 * Limite : Jest ne joue aucune animation. La synchronisation réelle du bord du
 * cadre et de la barre qui glisse, et l'absence de fondu, se jugent sur iPhone.
 */
export const SHEET_MOTION_MS = 350;
/** Q40 : courbe commune à l'entrée, à la sortie et à la transition de place. */
const SHEET_MOTION_EASING = Easing.out(Easing.cubic);
const SHEET_TIMING = { duration: SHEET_MOTION_MS, easing: SHEET_MOTION_EASING, reduceMotion: ReduceMotion.System };

/** Q41 : le cadre de découpe s'ouvre de 0 à sa hauteur ; son bord bas suit la barre qui descend. */
export function revealClipEntering(values: EntryAnimationsValues): LayoutAnimation {
  "worklet";
  return {
    initialValues: { height: 0 },
    animations: { height: withTiming(values.targetHeight, SHEET_TIMING) },
  };
}

/** Q41 : le cadre de découpe se referme jusqu'à 0 ; son bord bas suit la barre qui remonte. */
export function revealClipExiting(values: ExitAnimationsValues): LayoutAnimation {
  "worklet";
  return {
    initialValues: { height: values.currentHeight },
    animations: { height: withTiming(0, SHEET_TIMING) },
  };
}

/** Q41 : le contenu part de sa hauteur sous sa place (caché sous la barre) et monte jusqu'à elle. */
export function revealContentEntering(values: EntryAnimationsValues): LayoutAnimation {
  "worklet";
  return {
    initialValues: { transform: [{ translateY: values.targetHeight }] },
    animations: { transform: [{ translateY: withTiming(0, SHEET_TIMING) }] },
  };
}

/** Q41 : le contenu redescend de sa hauteur, sous la barre. */
export function revealContentExiting(values: ExitAnimationsValues): LayoutAnimation {
  "worklet";
  return {
    initialValues: { transform: [{ translateY: 0 }] },
    animations: { transform: [{ translateY: withTiming(values.currentHeight, SHEET_TIMING) }] },
  };
}

const sheetLayout = LinearTransition.duration(SHEET_MOTION_MS)
  .easing(SHEET_MOTION_EASING)
  .reduceMotion(ReduceMotion.System);

type SheetMotion = {
  readonly clipEntering?: typeof revealClipEntering;
  readonly clipExiting?: typeof revealClipExiting;
  readonly contentEntering?: typeof revealContentEntering;
  readonly contentExiting?: typeof revealContentExiting;
  readonly layout?: typeof sheetLayout;
};

const NO_MOTION: SheetMotion = {};
const SHEET_MOTION: SheetMotion = {
  clipEntering: revealClipEntering,
  clipExiting: revealClipExiting,
  contentEntering: revealContentEntering,
  contentExiting: revealContentExiting,
  layout: sheetLayout,
};

const SheetMotionContext = createContext<SheetMotion>(NO_MOTION);

/** Q39 : fournit les animations de mise en page à la Feuille ; aucune si « Réduire les animations ». */
export function SheetMotionProvider({ reduceMotion, children }: { reduceMotion: boolean; children: ReactNode }) {
  return (
    <SheetMotionContext.Provider value={reduceMotion ? NO_MOTION : SHEET_MOTION}>
      <LayoutAnimationConfig skipEntering skipExiting>
        {children}
      </LayoutAnimationConfig>
    </SheetMotionContext.Provider>
  );
}

/**
 * Q39, Q41 : conteneur animé de la Feuille.
 *
 * - `appear` (défaut) : l'élément est révélé par le bas (Q41). Rendu en deux
 *   vues : le cadre de découpe (`testID`, `overflow: "hidden"`, entrée et sortie
 *   de hauteur, transition de place) et le contenu (`${testID}-content`, porte
 *   `style`, entrée et sortie par translation verticale).
 * - `appear={false}` : une seule vue (`testID`, `style`), transition de place seule.
 * - `transition={false}` sert aux lignes du tableau des séries variables : leur
 *   déplacement par glisser reste celui de `DraggableRow`, sans seconde animation
 *   après la dépose.
 * - `clip={false}` lève la découpe (par ex. pendant un glisser du tableau, pour que
 *   la ligne portée suive le doigt hors de sa place).
 * - `enter={false}` : pas de révélation propre à l'apparition (le parent la porte, par
 *   ex. le groupe « Séries variables » qui découpe le tableau en s'agrandissant, E-20) ;
 *   la disparition reste celle de `appear`.
 * - `bleed` élargit le cadre de découpe de part et d'autre (marge négative
 *   compensée par un padding égal : aucun texte ne bouge), pour qu'un fond de
 *   sélection débordant ne soit pas rogné.
 */
export function SheetMotionView({
  appear = true,
  enter = true,
  transition = true,
  clip = true,
  bleed = 0,
  onLayout,
  style,
  testID,
  children,
}: {
  appear?: boolean;
  enter?: boolean;
  transition?: boolean;
  clip?: boolean;
  bleed?: number;
  onLayout?: ViewProps["onLayout"];
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: ReactNode;
}) {
  const motion = useContext(SheetMotionContext);
  const layout = transition ? motion.layout : undefined;
  if (!appear) {
    return (
      <Reanimated.View layout={layout} onLayout={onLayout} style={style} testID={testID}>
        {children}
      </Reanimated.View>
    );
  }
  return (
    <Reanimated.View
      entering={enter ? motion.clipEntering : undefined}
      exiting={motion.clipExiting}
      layout={layout}
      onLayout={onLayout}
      style={[clip ? styles.clip : null, bleed > 0 ? { marginHorizontal: -bleed, paddingHorizontal: bleed } : null]}
      testID={testID}
    >
      <Reanimated.View
        entering={enter ? motion.contentEntering : undefined}
        exiting={motion.contentExiting}
        style={style}
        testID={testID === undefined ? undefined : `${testID}-content`}
      >
        {children}
      </Reanimated.View>
    </Reanimated.View>
  );
}

/**
 * Recette iPhone du 2026-10-18 (E-20) : les éléments montés EN MÊME TEMPS qu'un parent
 * révélé (par ex. les lignes du tableau des séries variables à son apparition) ne jouent
 * pas leur propre révélation : seul le parent se révèle, et son contenu monte d'un seul
 * bloc, synchrone avec le cadre du groupe. Une ligne ajoutée ensuite (N augmente) garde
 * sa révélation (`LayoutAnimationConfig skipEntering` ne vaut qu'au montage).
 */
export function SheetMotionGroupMount({ children }: { children?: ReactNode }) {
  return <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>;
}

/** Q39 : corps défilant dont la hauteur suit le contenu en glissant (transition de mise en page seule). */
export function SheetMotionScrollView({ ref, ...props }: ScrollViewProps & { ref?: Ref<ScrollView> }) {
  const motion = useContext(SheetMotionContext);
  return <Reanimated.ScrollView {...props} ref={ref} layout={motion.layout} />;
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
});
