import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type ViewProps,
} from "react-native";
import Reanimated, {
  Easing as ReanimatedEasing,
  FadeIn,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { EXECUTION_BOUNDS } from "@/domain/activities/ExecutionParameters";
import type { CircuitNature } from "@/domain/sessions/circuit";
import { CircuitNatureMenu } from "@/features/sessions/CircuitNatureMenu";
import { MOTION_FADE_DURATION_MS } from "@/features/sessions/compositionMotion";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import {
  EXECUTION_UNIT_HOLD_POLICY,
  createHoldRepeater,
  steppedValue,
  type HoldRepeater,
} from "@/shared/ui/ProfileStepper";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

/**
 * PRE-9, recette iPhone du 29/10 (obs-3 b, Hermann : « l'ouverture et la fermeture d'un circuit doit
 * se faire avec une animation, un mouvement progressif d'apparition » ; « La disparition du circuit
 * doit se faire progressivement et plus lentement ») — valeurs de conception, Figma muet :
 * - déploiement : les cartes se dévoilent du haut vers le bas (hauteur) en fondu, 450 ms (le fondu
 *   d'apparition de la Composition, `MOTION_FADE_DURATION_MS`) ;
 * - repli : même mouvement en sens inverse, plus lent, 700 ms ;
 * - courbe douce aux deux bouts (celle du fondu de la Composition, `MOTION_FADE_EASING`).
 * « Réduire les animations » (iOS) : changement immédiat.
 */
export const CIRCUIT_REVEAL_DURATION_MS = MOTION_FADE_DURATION_MS;
export const CIRCUIT_HIDE_DURATION_MS = 700;
const CIRCUIT_REVEAL_EASING = ReanimatedEasing.bezier(0.4, 0, 0.2, 1);
/** Hauteur maximale « libre » hors animation (aucune contrainte sur le contenu). */
const UNCONSTRAINED_HEIGHT = 100000;
const namesEntering = FadeIn.duration(CIRCUIT_REVEAL_DURATION_MS).reduceMotion(ReduceMotion.System);

/**
 * Compte du Circuit (AD-38, D-058) : 1..99, la borne même de `clampSeriesCount` appliquée par
 * `setCircuitCount` / `circuitCountOutcome` — jamais une constante locale.
 */
const CIRCUIT_COUNT_MIN = EXECUTION_BOUNDS.seriesCount.min;
const CIRCUIT_COUNT_MAX = EXECUTION_BOUNDS.seriesCount.max;

/**
 * PRE-6 story 5.2 (D-435, Figma `9819:19948`) : ligne d'en-tête de 40 — hauteur MINIMALE (revue :
 * Dynamic Type), contenu centré verticalement ; le titre commence après la colonne de l'anneau du
 * rail (`titleInset`, x 69 à 402).
 */
/**
 * PRE-9, recette iPhone du 29/10 (obs-3 b/c, Hermann : « réduire l'espace en haut et en bas de la
 * première ligne ») : la ligne d'en-tête a la hauteur de son texte, 18 (Figma `10744:20185`, « Ligne
 * — Titre et volume » : 18), au lieu de 40 ; hauteur MINIMALE (Dynamic Type). Les cibles de 44
 * débordent de la ligne par des boîtes réelles (marges négatives), jamais par `hitSlop`.
 */
export const CIRCUIT_HEADER_HEIGHT = 18;
/**
 * PRE-9 B.1a (D-451, complément du 28/10 ; référence « Composition : circuits, cycles et création »
 * §4, CS-D1–CS-D8) : Circuit replié — hauteur de RÉFÉRENCE 68. Recette du 29/10 : 68 est la hauteur
 * du Circuit replié ENTIER (Figma `10744:20142`, « Fond — Circuit » : 14 + ligne 18 + 7 + noms 15
 * + 14), plus une hauteur minimale de l'en-tête — l'en-tête replié n'a plus de hauteur imposée.
 */
export const CIRCUIT_HEADER_COLLAPSED_HEIGHT = 68;
/** Circuit replié : écart de 7 entre la ligne d'en-tête et la ligne des noms (référence §4). */
const COLLAPSED_NAMES_GAP = 7;
/** Séparateur des noms de la ligne repliée et du compteur (« 3 tours · groupées »). */
const MIDDLE_DOT = "·";

/**
 * Textes de la ligne (référence §4, Figma de D-451) : nom et nombre 15 ; unité et adjectif 13 ;
 * durée 12. Bleu `color/primary` pour le nombre et la nature ; `color/text-primary` pour les autres
 * textes. Dérivés des jetons existants, sans toucher `tokens.ts`.
 *
 * Recette iPhone du 29/10 (obs-3 b/c, demandes de Hermann, qui priment sur Figma `10744:20108` où
 * ces textes sont en Medium / Regular) : unité (« tours », « répétitions ») et adjectif de nature en
 * gras (Semi Bold 13, `editableValue`) ; durée noire et en gras (Semi Bold 12, `cardDuration`,
 * `color/text-primary`).
 */
const TITLE_TEXT = type.compactCardTitle;
const NUMBER_TEXT = type.compactCardTitle;
const UNIT_TEXT = type.editableValue;
const DURATION_TEXT = type.cardDuration;
/** Ligne des noms du Circuit replié (Figma `10744:20195` : Regular 12, texte primaire). */
const NAMES_TEXT = type.supporting;
/**
 * Recette du 29/10 (obs-3 c : « Le nombre de cycles doit être aligné verticalement à droite avec le
 * nombre de tours d'un circuit ») : le compteur commence à une abscisse FIXE depuis le début du titre
 * — 103 (Figma `10744:20190` et `10744:20276`, x 103 de la ligne) —, la même pour le Circuit et le
 * Cycle ; le titre (nom et chevron) occupe au moins cette largeur moins l'écart. Le nombre est calé à
 * droite dans une largeur de deux chiffres : unités et dizaines restent alignées d'une ligne à
 * l'autre.
 */
const COUNTER_OFFSET = 103;
const NUMBER_MIN_WIDTH = 18;
/** Recette du 29/10 : nombre et unité contigus (Figma : écart 5). */
const NUMBER_TO_UNIT_GAP = 5;

/**
 * Stepper révélé au toucher du nombre (RM-027) — géométrie reprise du stepper de D-442 (Figma
 * `9819:19951` : fond blanc de 36, rayon 18, marge 4, cercles 28 `color/surface`).
 *
 * Cibles RÉELLES (jamais `hitSlop` : sous Fabric iOS, `RCTViewComponentView` écarte un toucher hors
 * des limites d'un parent qui ne mesure aucun débordement ; une boîte réelle qui dépasse crée ce
 * débordement chez ses ancêtres — revue 5.3) : −, + et le nombre sont des boîtes de 44 de haut (− et
 * + : 44 × 44, cercle de 28 centré ; le nombre : 44 de large au moins). Dans la ligne de 40, chaque
 * cible déborde de 2 en haut et en bas ; dans le fond de 36 du stepper révélé, de 4.
 */
const STEP_TOUCH_TARGET = 44;
const STEP_CIRCLE = 28;
const STEPPER_HEIGHT = 36;
const STEPPER_PADDING = spacing[4];
/** Fond blanc du stepper (Figma `9819:19951`) : rayon 18, moitié de sa hauteur. */
const STEPPER_RADIUS = STEPPER_HEIGHT / 2;
/** Débordement vertical du fond de 36 du stepper révélé hors de la ligne d'en-tête : la ligne garde sa hauteur. */
const STEPPER_OVERFLOW_Y_IN_ROW = (STEPPER_HEIGHT - CIRCUIT_HEADER_HEIGHT) / 2;
/**
 * Recette du 29/10 : avec une ligne de 18, une cible de 44 centrée déborderait de 13 sous la ligne,
 * au-delà de l'écart de 9 qui la sépare de la première carte (revue 5.2 : cibles tactiles disjointes).
 * Les cibles de 44 débordent donc de 9 AU PLUS sous la ligne (l'écart du Circuit et du Cycle) et du
 * reste (17) au-dessus, dans la marge haute de 14 du conteneur et l'écart qui le précède ; leur
 * contenu reste centré sur la ligne (marge interne haute de 8 = 17 − 9). Dans le stepper révélé (fond
 * de 36, débordant de 9 de chaque côté de la ligne), même boîte : 8 au-dessus du fond, 0 en dessous.
 */
const TARGET_OVERFLOW_BELOW_ROW = 9;
const TARGET_OVERFLOW_ABOVE_ROW = STEP_TOUCH_TARGET - CIRCUIT_HEADER_HEIGHT - TARGET_OVERFLOW_BELOW_ROW;
const TARGET_CONTENT_OFFSET = TARGET_OVERFLOW_ABOVE_ROW - TARGET_OVERFLOW_BELOW_ROW;
const TARGET_OVERFLOW_ABOVE_STEPPER = TARGET_OVERFLOW_ABOVE_ROW - STEPPER_OVERFLOW_Y_IN_ROW;
const TARGET_OVERFLOW_BELOW_STEPPER = TARGET_OVERFLOW_BELOW_ROW - STEPPER_OVERFLOW_Y_IN_ROW;
/** Marge de la boîte − / + entre le cercle et le bord de la boîte. */
const STEP_CIRCLE_INSET = (STEP_TOUCH_TARGET - STEP_CIRCLE) / 2;
/** Écart entre la cible du titre (nom et chevron) et le compteur, à abscisse fixe. */
const TITLE_TO_COUNTER_GAP = spacing[8];
/** Écart titre → chevron et compteur → durée. */
const TITLE_TO_CHEVRON_GAP = spacing[4];
const COUNTER_TO_DURATION_GAP = spacing[8];

/**
 * Exporté pour les tests de géométrie : cibles réelles et écarts, en points.
 */
export const CIRCUIT_HEADER_TOUCH_GEOMETRY = {
  touchTarget: STEP_TOUCH_TARGET,
  stepCircle: STEP_CIRCLE,
  stepperHeight: STEPPER_HEIGHT,
  stepperPadding: STEPPER_PADDING,
  targetOverflowAboveRow: TARGET_OVERFLOW_ABOVE_ROW,
  targetOverflowBelowRow: TARGET_OVERFLOW_BELOW_ROW,
  targetContentOffset: TARGET_CONTENT_OFFSET,
  stepperOverflowYInRow: STEPPER_OVERFLOW_Y_IN_ROW,
  titleToCounterGap: TITLE_TO_COUNTER_GAP,
  counterOffset: COUNTER_OFFSET,
} as const;

/** Largeur minimale du titre (nom, et chevron du Circuit) : le compteur commence à `COUNTER_OFFSET`. */
export const CONTAINER_TITLE_MIN_WIDTH = COUNTER_OFFSET - TITLE_TO_COUNTER_GAP;

/**
 * Unité accordée du compteur : « tour » / « tours » (N = 1 singulier). PRE-9 B.1a (D-451, complément
 * du 28/10 ; référence §2 « L'unité reste tour(s) ») : la même unité pour les deux natures.
 */
export function circuitUnitLabel(count: number): string {
  const unit = strings.screens.composition.circuit.countUnit;
  return count === 1 ? unit.singular : unit.plural;
}

/** Valeur annoncée du réglage : « 4 tours ». */
export function circuitCountSpokenValue(count: number): string {
  return `${count} ${circuitUnitLabel(count)}`;
}

/** Adjectif de nature (référence §2) : « groupées » (`TOURS`), « alternées » (`SERIES`). */
export function circuitNatureAdjective(nature: CircuitNature): string {
  return strings.screens.composition.circuit.natureAdjective[nature];
}

/**
 * PRE-9 B.1b (référence §4, ARB-13) : nom affiché d'un conteneur — « Circuit », « Circuit A »… ; la
 * lettre (`containerLetters`) est absente quand le conteneur est seul de sa nature.
 */
export function containerTitle(title: string, letter: string | undefined): string {
  return letter === undefined ? title : `${title} ${letter}`;
}

export type CircuitHeaderProps = {
  readonly nature: CircuitNature;
  /** PRE-9 B.1b (ARB-13) : lettre de désignation (« A »…) ; absente pour un Circuit unique. */
  readonly letter?: string;
  /** N du Circuit (1..99). */
  readonly count: number;
  /**
   * PRE-9 B.1a (D-451, complément du 28/10, remplace la clause de D-443 qui la masquait) : durée du
   * Circuit déjà formatée par l'écran (`formatCircuitDuration`), calée à droite.
   */
  readonly duration: string;
  /** RM-027 : stepper révélé au toucher du nombre — un seul contrôle ouvert à la fois, contrôlé par l'écran. */
  readonly isCounterOpen: boolean;
  /** Toucher du nombre (ou « activer » VoiceOver) : révèle ou referme le stepper. */
  readonly onToggleCounter: () => void;
  /** Chaque pas (ou chaque action VoiceOver) : N demandé, appliqué par l'écran via `circuitCountOutcome` (story 7.2). */
  readonly onChangeCount: (count: number) => void;
  /** PRE-6 story 3.2 — Android / web : panneau du choix de nature ouvert. */
  readonly isNatureMenuOpen: boolean;
  /** Toucher de l'adjectif (Android / web) : l'écran ouvre le choix. */
  readonly onOpenNatureMenu: () => void;
  /** Second toucher de l'adjectif (Android / web) : fermeture sans choix, aucune mutation. */
  readonly onCloseNatureMenu: () => void;
  /** iOS : nature choisie dans le menu natif, confiée à l'écran (`prepareNatureChange` / `applyNatureChange`). */
  readonly onSelectNature: (nature: CircuitNature) => void;
  /** Demande de focus sur l'adjectif (voir `CircuitNatureMenu`). */
  readonly natureFocusRequest: number;
  /**
   * PRE-9 B.1a (ARB-12) : Circuit replié — état de l'écran, non persisté ; le repli ne change pas le
   * brouillon. Replié : seconde ligne des noms, cartes masquées par l'écran.
   */
  readonly isCollapsed: boolean;
  /** Toucher du nom ou du chevron : replie ou déplie le Circuit. */
  readonly onToggleCollapsed: () => void;
  /** Noms des exercices du Circuit, dans l'ordre, tels que sur leurs cartes (ligne repliée). */
  readonly memberNames: readonly string[];
  /**
   * PRE-6 story 5.1b (revue) : référence vers l'élément accessible du compteur (le réglage
   * ajustable), renseignée par l'en-tête, pour que l'écran y porte le focus.
   */
  readonly counterRef?: { current: View | null };
  /** Mesure de l'en-tête dans le conteneur Circuit : ancrage du panneau Android / web par l'écran. */
  readonly onLayout?: ViewProps["onLayout"];
  /**
   * PRE-9 B.1a : mesure de la seule ligne d'en-tête (nom, chevron, compteur, durée) — l'anneau du
   * rail y est centré, que le Circuit soit replié (ligne des noms dessous) ou non.
   */
  readonly onRowLayout?: ViewProps["onLayout"];
  /**
   * PRE-6 story 4.1 : mode placement — l'en-tête (stepper, adjectif, chevron) est non interactif
   * et masqué à l'accessibilité. Revue 5.3 (Figma `8328:29270`) : il n'est plus atténué (le nom de
   * la prop est conservé).
   */
  readonly isAttenuated?: boolean;
  /**
   * PRE-6 story 7.3 (revue) : un dialogue de choix (Début / Fin de tour) attend la réponse — un
   * maintien en cours de − ou + s'arrête (aucun pas repris après la réponse). Faux par défaut.
   */
  readonly isChoicePending?: boolean;
  /**
   * PRE-6 story 2.3b : décalage vertical animé (pilote natif) — l'en-tête suit le bord haut du
   * conteneur Circuit pendant le glisser d'une carte. Translation seule : `onLayout` est inchangé.
   */
  readonly translateY?: Animated.Value;
  /**
   * PRE-6 story 5.2 : retrait du titre, depuis le bord gauche de l'en-tête, qui laisse la colonne
   * de l'anneau du rail (dessiné par l'écran) ; 0 par défaut.
   */
  readonly titleInset?: number;
  readonly testID: string;
};

/**
 * En-tête du Circuit (PRE-6 story 3.1, CIR-10, AD-41, AD-42), rendu dans le conteneur Circuit
 * existant.
 *
 * PRE-9 B.1a (D-451, complément du 28/10 qui remplace D-442 sur le stepper permanent et la clause
 * de D-443 masquant la durée ; RM-027 ; ch. 10 « Le contrôle » ; référence §2 et §4) — une ligne :
 * - le nom « Circuit » (Semi Bold 15) et le chevron (bas replié, haut déplié), une seule cible qui
 *   replie ou déplie le Circuit (ARB-12) ; aucune lettre pour un Circuit unique ;
 * - le compteur, à abscisse fixe après le nom : « N tours · groupées » / « N tours · alternées ».
 *   Toucher le nombre (bleu, 15) révèle le stepper − N + (et le referme) ; l'unité « tour(s) » (13)
 *   n'est pas interactive ; toucher l'adjectif (bleu, 13) ouvre le choix de nature
 *   (`CircuitNatureMenu`, menu natif sur iOS, story 3.2) ;
 * - la durée du Circuit (12, tertiaire), calée à droite ; elle cède la place la première, puis le
 *   nom ; le compteur garde sa taille.
 * Replié : seconde ligne des noms des exercices séparés par « · », une ligne tronquée, à 7 de la
 * première ; hauteur de référence 68.
 * [Recette iPhone du 29/10 (obs-3 b/c, demandes de Hermann) : ligne de 18 ; « N tours » contigus et
 * en gras, dans la cible du nombre et dans le stepper révélé ; adjectif en gras ; durée noire et en
 * gras ; noms en 12 (Figma) ; 68 = Circuit replié entier ; compteur à abscisse fixe 103.]
 *
 * Accessibilité, dans l'ordre de lecture : bouton « Circuit » (durée lue avec le nom, état
 * déplié / replié), puis, stepper révélé, bouton −, le réglage ajustable « Nombre de tours » (valeur
 * annoncée avec l'unité, incrémenter / décrémenter bornés, « activer » révèle ou referme le
 * stepper), bouton +, enfin le bouton « Nature du circuit ». L'unité et le point médian ne sont pas
 * des éléments accessibles.
 */
export function CircuitHeader({
  nature,
  letter,
  count,
  duration,
  isCounterOpen,
  onToggleCounter,
  onChangeCount,
  isNatureMenuOpen,
  onOpenNatureMenu,
  onCloseNatureMenu,
  onSelectNature,
  natureFocusRequest,
  isCollapsed,
  onToggleCollapsed,
  memberNames,
  counterRef,
  onLayout,
  onRowLayout,
  isAttenuated = false,
  isChoicePending = false,
  translateY,
  titleInset = 0,
  testID,
}: CircuitHeaderProps) {
  const t = strings.screens.composition.circuit;
  const title = containerTitle(t.title, letter);
  return (
    <Animated.View
      style={[
        styles.header,
        { paddingLeft: titleInset },
        translateY !== undefined ? { transform: [{ translateY }] } : null,
      ]}
      onLayout={onLayout}
      pointerEvents={isAttenuated ? "none" : "auto"}
      accessibilityElementsHidden={isAttenuated}
      importantForAccessibility={isAttenuated ? "no-hide-descendants" : "auto"}
      testID={testID}
    >
      <View style={styles.row} onLayout={onRowLayout} testID={`${testID}-row`}>
        {/* ARB-12 : le nom et le chevron forment une seule cible réelle de 44 de haut. */}
        <Pressable
          onPress={onToggleCollapsed}
          accessibilityRole="button"
          // Revue 5.2 : VoiceOver lit la durée juste après le nom (elle est affichée à droite).
          accessibilityLabel={`${title}, ${duration}`}
          accessibilityState={{ expanded: !isCollapsed }}
          style={styles.titleTarget}
          testID={`${testID}-collapse`}
        >
          <Text style={styles.title} numberOfLines={1} testID={`${testID}-title`}>
            {title}
          </Text>
          <KodjoIcon
            name={isCollapsed ? "control-chevron-down" : "control-chevron-up"}
            size={dimensions.catalogueDisclosure.chevronDisplaySize}
            tintColor={colors.textPrimary}
            testID={`${testID}-chevron`}
          />
        </Pressable>
        <View style={styles.counterSlot} testID={`${testID}-counter-slot`}>
          <CircuitCounter
            nature={nature}
            count={count}
            isOpen={isCounterOpen}
            onToggle={onToggleCounter}
            onChange={onChangeCount}
            isInterrupted={isAttenuated || isChoicePending || !isCounterOpen}
            isNatureMenuOpen={isNatureMenuOpen}
            onOpenNatureMenu={onOpenNatureMenu}
            onCloseNatureMenu={onCloseNatureMenu}
            onSelectNature={onSelectNature}
            natureFocusRequest={natureFocusRequest}
            externalRef={counterRef}
            testID={`${testID}-counter`}
          />
        </View>
        {/* Lue avec le nom (VoiceOver), elle est retirée de l'accessibilité ici. */}
        <Text
          style={styles.duration}
          numberOfLines={1}
          accessible={false}
          importantForAccessibility="no"
          testID={`${testID}-duration`}
        >
          {duration}
        </Text>
      </View>
      {isCollapsed ? (
        // Recette du 29/10 (obs-3 b) : la ligne des noms apparaît en fondu, avec le repli des cartes.
        <Reanimated.View entering={namesEntering} testID={`${testID}-names-reveal`}>
          <Text style={styles.names} numberOfLines={1} testID={`${testID}-names`}>
            {memberNames.join(` ${MIDDLE_DOT} `)}
          </Text>
        </Reanimated.View>
      ) : null}
    </Animated.View>
  );
}

/**
 * PRE-9, recette iPhone du 29/10 (obs-3 b) : cartes d'un Circuit, dévoilées au déploiement et
 * escamotées au repli (voir `CIRCUIT_REVEAL_DURATION_MS`), appliqué À LA LISTE des cartes elle-même
 * (aucun conteneur ajouté : sa position dans le Circuit, mesurée par l'écran pour la géométrie du
 * glisser et du rail, ne change pas au repos). La liste reste montée pendant le repli puis est démontée
 * (`mounted` : Circuit replié, cartes masquées, ARB-12) ; hauteur (`maxHeight`), écart au-dessus
 * (`marginTop`, de −`gap` à 0 : l'écart du Circuit entre l'en-tête et les cartes apparaît avec elles)
 * et opacité suivent la même progression, sur le fil UI. Découpe et contrainte de hauteur seulement
 * pendant l'animation : au repos, une carte soulevée ou glissée déborde librement.
 */
export function useCircuitCardsReveal(collapsed: boolean, gap: number) {
  const reduceMotion = useReduceMotion();
  const [mounted, setMounted] = useState(!collapsed);
  const [animating, setAnimating] = useState(false);
  // Dernier état reçu : un changement démarre l'animation (état ajusté au rendu, sans effet en cascade).
  const [seenCollapsed, setSeenCollapsed] = useState(collapsed);
  if (seenCollapsed !== collapsed) {
    setSeenCollapsed(collapsed);
    setAnimating(true);
    setMounted(true);
  }
  const progress = useSharedValue(collapsed ? 0 : 1);
  const naturalHeight = useSharedValue(0);
  const previous = useRef(collapsed);
  useEffect(() => {
    if (previous.current === collapsed) return;
    previous.current = collapsed;
    const finish = (isCollapsed: boolean) => {
      setAnimating(false);
      if (isCollapsed) setMounted(false);
    };
    const duration = reduceMotion ? 0 : collapsed ? CIRCUIT_HIDE_DURATION_MS : CIRCUIT_REVEAL_DURATION_MS;
    progress.set(
      withTiming(collapsed ? 0 : 1, { duration, easing: CIRCUIT_REVEAL_EASING }, (finished) => {
        if (finished === true) scheduleOnRN(finish, collapsed);
      }),
    );
  }, [collapsed, progress, reduceMotion]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    marginTop: (progress.value - 1) * gap,
    maxHeight:
      progress.value >= 1 || naturalHeight.value <= 0 ? UNCONSTRAINED_HEIGHT : progress.value * naturalHeight.value,
  }));
  /** Mesure de la liste au repos (hauteur naturelle), base de l'animation suivante. */
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (!animating) naturalHeight.set(event.nativeEvent.layout.height);
    },
    [animating, naturalHeight],
  );
  return {
    /** Faux une fois le repli terminé : la liste n'est pas rendue. */
    mounted: mounted || !collapsed,
    style: [animating ? styles.reveal : null, animatedStyle],
    onLayout,
  };
}

/** Dévoilement des cartes d'un Circuit, appliqué à la vue (Reanimated) de leur liste. */
export type CircuitCardsReveal = ReturnType<typeof useCircuitCardsReveal>;

/**
 * Revue 7.3 : délai avant le premier pas (`unstable_pressDelay` de `Pressable`). Le stepper est
 * dans la liste défilante : un défilement qui commence sur − ou + est repris par le `ScrollView`
 * avant ce délai, sans pas accidentel (un − à N = 1 peut retirer des Points d'arrêt). Un toucher
 * bref relâché avant le délai donne quand même son pas (Pressability active puis désactive au
 * relâchement).
 */
const STEP_PRESS_DELAY_MS = 100;

/**
 * Pas du stepper (premier pas, puis maintien `EXECUTION_UNIT_HOLD_POLICY`), même mécanique que
 * `InlineStepper` : le répéteur part de la valeur du dernier pas demandé (`countRef`), resynchronisée
 * sur N à chaque rendu ; un pas sans effet (borne) n'appelle rien ; arrêt au relâchement, au
 * démontage et dès que `isInterrupted` passe à vrai (placement, dialogue de Tour en attente : revue
 * 7.3 — un relâchement non transmis pendant un dialogue natif ne doit pas relancer les pas après la
 * réponse ; PRE-9 B.1a : stepper refermé). Chaque pas passe par `onChange` — l'écran l'applique (ou
 * ouvre le dialogue de Tour).
 *
 * `press` : activation sans toucher (TalkBack, clavier — `Pressability` n'appelle alors que
 * `onPress`) ; ignorée quand un `pressIn` vient de faire le pas (VoiceOver et le doigt passent par
 * `pressIn` / `pressOut` puis `onPress`).
 */
function useCountStepper(
  count: number,
  onChange: (count: number) => void,
  isInterrupted: boolean,
  min: number,
  max: number,
) {
  const countRef = useRef(count);
  const onChangeRef = useRef(onChange);
  const pressedInRef = useRef(false);
  useEffect(() => {
    countRef.current = count;
    onChangeRef.current = onChange;
  });
  const repeaterRef = useRef<HoldRepeater | null>(null);
  useEffect(() => () => repeaterRef.current?.stop(), []);
  useEffect(() => {
    if (isInterrupted) repeaterRef.current?.stop();
  }, [isInterrupted]);
  const applyStep = (direction: 1 | -1, stepSize = 1) => {
    const current = countRef.current;
    const next = steppedValue(current, direction, stepSize, min, max);
    if (next === current) return;
    countRef.current = next;
    onChangeRef.current(next);
  };
  const repeater = () => {
    repeaterRef.current ??= createHoldRepeater(EXECUTION_UNIT_HOLD_POLICY, applyStep);
    return repeaterRef.current;
  };
  return {
    start: (direction: 1 | -1) => {
      pressedInRef.current = true;
      repeater().start(direction);
    },
    stop: () => {
      repeaterRef.current?.stop();
      // Un `onPress` suit le relâchement dans le même événement ; un geste repris par le défilement
      // n'en a pas : le drapeau est effacé ensuite, pour ne pas avaler une activation ultérieure.
      setTimeout(() => {
        pressedInRef.current = false;
      }, 0);
    },
    press: (direction: 1 | -1) => {
      if (pressedInRef.current) {
        pressedInRef.current = false;
        return;
      }
      applyStep(direction);
    },
    /** Pas unique (action VoiceOver du réglage) : depuis la dernière valeur demandée. */
    step: (direction: 1 | -1) => applyStep(direction),
  };
}

/** Adjectif de nature : texte bleu dans une boîte de 44 de haut, la cible du choix de nature. */
function NatureAdjective({ nature, testID }: { nature: CircuitNature; testID: string }) {
  return (
    <View style={styles.adjectiveTarget} testID={`${testID}-target`}>
      <Text style={styles.adjective} numberOfLines={1} testID={testID}>
        {circuitNatureAdjective(nature)}
      </Text>
    </View>
  );
}

function CircuitCounter({
  nature,
  count,
  isOpen,
  onToggle,
  onChange,
  isInterrupted,
  isNatureMenuOpen,
  onOpenNatureMenu,
  onCloseNatureMenu,
  onSelectNature,
  natureFocusRequest,
  externalRef,
  testID,
}: {
  nature: CircuitNature;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (count: number) => void;
  isInterrupted: boolean;
  isNatureMenuOpen: boolean;
  onOpenNatureMenu: () => void;
  onCloseNatureMenu: () => void;
  onSelectNature: (nature: CircuitNature) => void;
  natureFocusRequest: number;
  externalRef?: { current: View | null };
  testID: string;
}) {
  const t = strings.screens.composition.circuit;
  // Story 7.9 (revue) : la taille du texte (Dynamic Type) change aussi la largeur du déclencheur.
  const { fontScale } = useWindowDimensions();

  return (
    <View style={styles.counter} testID={`${testID}-row`}>
      <CountStepper
        count={count}
        min={CIRCUIT_COUNT_MIN}
        max={CIRCUIT_COUNT_MAX}
        isOpen={isOpen}
        onToggle={onToggle}
        onChange={onChange}
        isInterrupted={isInterrupted}
        accessibilityLabel={t.countAccessibilityLabel}
        spokenValue={circuitCountSpokenValue(count)}
        decrementAccessibilityLabel={t.decrementAccessibilityLabel}
        incrementAccessibilityLabel={t.incrementAccessibilityLabel}
        externalRef={externalRef}
        unitLabel={circuitUnitLabel(count)}
        counterTestID={testID}
      />
      {/* Le point médian n'est pas interactif ni annoncé. */}
      <Text
        style={styles.separator}
        numberOfLines={1}
        accessible={false}
        importantForAccessibility="no"
        testID={`${testID}-separator`}
      >
        {` ${MIDDLE_DOT} `}
      </Text>
      <View style={styles.adjectiveSlot} testID={`${testID}-adjective-slot`}>
        <CircuitNatureMenu
          nature={nature}
          trigger={<NatureAdjective nature={nature} testID={`${testID}-adjective`} />}
          // Story 7.9 (j6d-5) : le déclencheur suit son texte — l'hôte natif est remesuré à chaque
          // changement d'adjectif (« groupées » / « alternées ») ou de taille de texte.
          triggerLayoutKey={`${circuitNatureAdjective(nature)}@${fontScale}`}
          isOpen={isNatureMenuOpen}
          onOpen={onOpenNatureMenu}
          onClose={onCloseNatureMenu}
          onSelect={onSelectNature}
          focusRequest={natureFocusRequest}
          testID={`${testID}-nature`}
        />
      </View>
    </View>
  );
}

export type CountStepperProps = {
  readonly count: number;
  /** Bornes du compte (Circuit et Cycle : 1..99, chacune depuis sa source). */
  readonly min: number;
  readonly max: number;
  /** Stepper révélé (RM-027) — contrôlé par l'écran. */
  readonly isOpen: boolean;
  /** Toucher du nombre (ou « activer » VoiceOver) : révèle ou referme le stepper. */
  readonly onToggle: () => void;
  /** Chaque pas : compte demandé, appliqué par l'écran. */
  readonly onChange: (count: number) => void;
  /** Vrai : un maintien en cours s'arrête (stepper refermé, placement, dialogue en attente). */
  readonly isInterrupted: boolean;
  /** Nom du réglage ajustable (« Nombre de tours », « Nombre de répétitions »). */
  readonly accessibilityLabel: string;
  /** Valeur annoncée avec son unité (« 4 tours »). */
  readonly spokenValue: string;
  readonly decrementAccessibilityLabel: string;
  readonly incrementAccessibilityLabel: string;
  readonly externalRef?: { current: View | null };
  /**
   * Recette iPhone du 29/10 (obs-3 b/c) : unité accordée (« tours », « répétitions »), contiguë au
   * nombre et intégrée au stepper (entre − et +), en gras ; non interactive à part — elle fait partie
   * de la cible du nombre et est annoncée avec la valeur du réglage. Identifiant
   * `${counterTestID}-unit`.
   */
  readonly unitLabel: string;
  /**
   * Identifiant du nombre (réglage) ; le stepper est `${counterTestID}-stepper`. Nommé autrement que
   * `testID` : l'élément composite ne porte pas l'identifiant de son nombre.
   */
  readonly counterTestID: string;
};

/**
 * PRE-9 B.1b : nombre et stepper révélé au toucher du nombre (RM-027), extraits du compteur du
 * Circuit pour être partagés avec l'en-tête du Cycle (`CycleHeader`) — même géométrie (fond blanc de
 * 36, cibles réelles de 44), même maintien (`useCountStepper`), même accessibilité ; rendu du Circuit
 * inchangé.
 */
export function CountStepper({
  count,
  min,
  max,
  isOpen,
  onToggle,
  onChange,
  isInterrupted,
  accessibilityLabel,
  spokenValue,
  decrementAccessibilityLabel,
  incrementAccessibilityLabel,
  externalRef,
  unitLabel,
  counterTestID: testID,
}: CountStepperProps) {
  const stepperStrings = strings.screens.profile.stepper;
  const stepper = useCountStepper(count, onChange, isInterrupted, min, max);
  const atMin = count <= min;
  const atMax = count >= max;
  // Revue 7.3 : ref de rappel stable (sinon détachée puis rattachée à chaque rendu).
  const attachCounter = useCallback(
    (node: View | null) => {
      if (externalRef) externalRef.current = node;
    },
    [externalRef],
  );
  const stepTestID = `${testID}-stepper`;
  return (
    // Le nombre reste le même élément, stepper révélé ou non (focus VoiceOver conservé).
    <View style={isOpen ? styles.stepperOpen : styles.stepperClosed} testID={stepTestID}>
      {isOpen ? (
        <StepButton
          direction={-1}
          disabled={atMin}
          accessibilityLabel={
            atMin ? `${decrementAccessibilityLabel} — ${stepperStrings.minimumReachedSuffix}` : decrementAccessibilityLabel
          }
          onPressIn={() => stepper.start(-1)}
          onPressOut={stepper.stop}
          onPress={() => stepper.press(-1)}
          testID={`${stepTestID}-decrement`}
        />
      ) : null}
      <Pressable
        ref={attachCounter}
        onPress={onToggle}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min, max, now: count, text: spokenValue }}
        accessibilityState={{ expanded: isOpen }}
        accessibilityActions={[
          ...(atMax ? [] : [{ name: "increment" }]),
          ...(atMin ? [] : [{ name: "decrement" }]),
          { name: "activate" },
        ]}
        onAccessibilityAction={(event) => {
          const action = event.nativeEvent.actionName;
          if (action === "increment") stepper.step(1);
          if (action === "decrement") stepper.step(-1);
          if (action === "activate") onToggle();
        }}
        style={[styles.numberTarget, isOpen ? styles.numberTargetInStepper : styles.numberTargetInRow]}
        testID={testID}
      >
        <Text style={styles.number} testID={`${testID}-value`}>
          {count}
        </Text>
        {/* RM-027 : l'unité n'est pas un élément propre ; elle est annoncée avec la valeur du réglage. */}
        <Text
          style={styles.unit}
          numberOfLines={1}
          accessible={false}
          importantForAccessibility="no"
          testID={`${testID}-unit`}
        >
          {unitLabel}
        </Text>
      </Pressable>
      {isOpen ? (
        <StepButton
          direction={1}
          disabled={atMax}
          accessibilityLabel={
            atMax ? `${incrementAccessibilityLabel} — ${stepperStrings.maximumReachedSuffix}` : incrementAccessibilityLabel
          }
          onPressIn={() => stepper.start(1)}
          onPressOut={stepper.stop}
          onPress={() => stepper.press(1)}
          testID={`${stepTestID}-increment`}
        />
      ) : null}
    </View>
  );
}

/**
 * Bouton − ou + : boîte réelle de 44 × 44 (la cible), cercle de 28 `color/surface` centré ; à la
 * borne, désactivé, le signe passe en `color/disabled` (même rendu qu'`InlineStepper`).
 */
function StepButton({
  direction,
  disabled,
  accessibilityLabel,
  onPressIn,
  onPressOut,
  onPress,
  testID,
}: {
  direction: 1 | -1;
  disabled: boolean;
  accessibilityLabel: string;
  onPressIn: () => void;
  onPressOut: () => void;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      disabled={disabled}
      unstable_pressDelay={STEP_PRESS_DELAY_MS}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={direction === -1 ? styles.minusTarget : styles.plusTarget}
      testID={testID}
    >
      <View style={styles.stepCircle} testID={`${testID}-circle`}>
        <KodjoIcon
          name={direction === -1 ? "stepper-minus" : "stepper-plus"}
          tintColor={disabled ? colors.disabled : colors.primary}
          testID={`${testID}-icon`}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Revue 5.2 : hauteurs MINIMALES (Dynamic Type) ; espacements portés par chaque enfant.
  // Recette du 29/10 : replié, l'en-tête mesure ligne + 7 + noms (68 avec les marges du Circuit).
  header: {
    minHeight: CIRCUIT_HEADER_HEIGHT,
  },
  row: {
    minHeight: CIRCUIT_HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  // Nom et chevron : la cible du repli. Elle cède (ellipse du nom) après la durée ; jamais le compteur.
  titleTarget: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    // Recette du 29/10 : compteur à abscisse fixe (aligné sur celui du Cycle).
    minWidth: CONTAINER_TITLE_MIN_WIDTH,
    minHeight: STEP_TOUCH_TARGET,
    marginTop: -TARGET_OVERFLOW_ABOVE_ROW,
    marginBottom: -TARGET_OVERFLOW_BELOW_ROW,
    paddingTop: TARGET_CONTENT_OFFSET,
    gap: TITLE_TO_CHEVRON_GAP,
  },
  title: {
    flexShrink: 1,
    minWidth: 0,
    ...TITLE_TEXT,
    color: colors.textPrimary,
  },
  // Compteur à abscisse fixe après le nom (référence §4) ; il ne rétrécit jamais.
  counterSlot: {
    flexShrink: 0,
    marginLeft: TITLE_TO_COUNTER_GAP,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  stepperClosed: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  // Stepper révélé (Figma `9819:19951`) : fond blanc de 36, rayon 18, marge 4.
  stepperOpen: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    minHeight: STEPPER_HEIGHT,
    // Recette du 29/10 : le fond de 36 déborde de la ligne de 18, qui garde sa hauteur.
    marginVertical: -STEPPER_OVERFLOW_Y_IN_ROW,
    paddingHorizontal: STEPPER_PADDING,
    borderRadius: STEPPER_RADIUS,
    backgroundColor: colors.background,
  },
  minusTarget: {
    width: STEP_TOUCH_TARGET,
    height: STEP_TOUCH_TARGET,
    marginTop: -TARGET_OVERFLOW_ABOVE_STEPPER,
    marginBottom: 0 - TARGET_OVERFLOW_BELOW_STEPPER, // 0 - x : jamais −0
    paddingTop: TARGET_CONTENT_OFFSET,
    // Contre la marge 4 du fond : boîte à −4 du bord du fond, cercle à 4 (Figma).
    marginLeft: -STEP_CIRCLE_INSET,
    alignItems: "center",
    justifyContent: "center",
  },
  plusTarget: {
    width: STEP_TOUCH_TARGET,
    height: STEP_TOUCH_TARGET,
    marginTop: -TARGET_OVERFLOW_ABOVE_STEPPER,
    marginBottom: 0 - TARGET_OVERFLOW_BELOW_STEPPER, // 0 - x : jamais −0
    paddingTop: TARGET_CONTENT_OFFSET,
    marginRight: -STEP_CIRCLE_INSET,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircle: {
    width: STEP_CIRCLE,
    height: STEP_CIRCLE,
    borderRadius: STEP_CIRCLE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  // Recette du 29/10 : la cible porte le nombre et l'unité, contigus, depuis son bord gauche.
  numberTarget: {
    minWidth: STEP_TOUCH_TARGET,
    minHeight: STEP_TOUCH_TARGET,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: NUMBER_TO_UNIT_GAP,
  },
  numberTargetInRow: {
    marginTop: -TARGET_OVERFLOW_ABOVE_ROW,
    marginBottom: -TARGET_OVERFLOW_BELOW_ROW,
    paddingTop: TARGET_CONTENT_OFFSET,
  },
  numberTargetInStepper: {
    marginTop: -TARGET_OVERFLOW_ABOVE_STEPPER,
    marginBottom: 0 - TARGET_OVERFLOW_BELOW_STEPPER, // 0 - x : jamais −0
    paddingTop: TARGET_CONTENT_OFFSET,
  },
  number: {
    ...NUMBER_TEXT,
    minWidth: NUMBER_MIN_WIDTH,
    textAlign: "right",
    color: colors.primary,
  },
  unit: {
    flexShrink: 0,
    ...UNIT_TEXT,
    color: colors.textPrimary,
  },
  separator: {
    flexShrink: 0,
    ...UNIT_TEXT,
    color: colors.textPrimary,
  },
  adjectiveSlot: {
    flexShrink: 0,
    marginTop: -TARGET_OVERFLOW_ABOVE_ROW,
    marginBottom: -TARGET_OVERFLOW_BELOW_ROW,
  },
  adjectiveTarget: {
    minHeight: STEP_TOUCH_TARGET,
    justifyContent: "center",
    paddingTop: TARGET_CONTENT_OFFSET,
  },
  adjective: {
    ...UNIT_TEXT,
    color: colors.primary,
  },
  // Durée calée à droite : elle cède la place la première (base 0).
  duration: {
    ...DURATION_TEXT,
    flex: 1,
    minWidth: 0,
    marginLeft: COUNTER_TO_DURATION_GAP,
    textAlign: "right",
    // Recette du 29/10 (obs-3 b) : durée noire et en gras.
    color: colors.textPrimary,
  },
  // Découpe de la liste des cartes pendant le dévoilement / repli seulement.
  reveal: {
    overflow: "hidden",
  },
  // Ligne des noms du Circuit replié : une ligne tronquée, à 7 de la ligne d'en-tête.
  names: {
    marginTop: COLLAPSED_NAMES_GAP,
    ...NAMES_TEXT,
    color: colors.textPrimary,
  },
});
