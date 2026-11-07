import { type ComponentProps, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import Reanimated, {
  Easing as ReanimatedEasing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { EXECUTION_BOUNDS } from "@/domain/activities/ExecutionParameters";
import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import type { CircuitNature } from "@/domain/sessions/circuit";
import { CircuitNatureMenu } from "@/features/sessions/CircuitNatureMenu";
import { LONG_PRESS_DELAY_MS } from "@/features/sessions/compositionGesture";
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
 * [Remplacé par la contre-recette iPhone du 30/10 (constat b, Hermann : « Circuit : l'apparition et la
 * disparition du circuit doivent se faire progressivement et plus lentement ») : déploiement 700 ms
 * (450 auparavant), repli 900 ms (700 auparavant) — valeurs de conception, Figma muet. Le Circuit
 * qui vient d'être posé apparaît en fondu à la durée du déploiement.]
 */
export const CIRCUIT_REVEAL_DURATION_MS = 700;
export const CIRCUIT_HIDE_DURATION_MS = 900;
/**
 * Courbe du repli et du déploiement (points de contrôle de la courbe de Bézier). Contre-recette n° 5
 * du 01/11/2026 : partagée avec les translations du registre qui accompagnent un déploiement pendant
 * un glisser (place ouverte à la fin du Circuit, compensation de la carte saisie) — même courbe, même
 * durée, départ dans la même tâche.
 */
export const CIRCUIT_REVEAL_BEZIER = [0.4, 0, 0.2, 1] as const;
const CIRCUIT_REVEAL_EASING = ReanimatedEasing.bezier(...CIRCUIT_REVEAL_BEZIER);
/**
 * Contre-recette n° 5 du 01/11/2026 : délai maximal d'attente de la mesure du contenu avant un
 * déploiement (`useCircuitCardsReveal`, `onRevealStart`) ; [« au-delà, le déploiement part sans elle »
 * — remplacé par la recette du 06/11/2026 (t-depli) :] au-delà, la progression part « à l'aveugle »
 * (cartes et ligne des noms immobiles) ; la mesure tardive relance le déploiement depuis 0, avec elle.
 */
export const CIRCUIT_REVEAL_START_FALLBACK_MS = 120;
/** Hauteur maximale « libre » hors animation (aucune contrainte sur le contenu). */
const UNCONSTRAINED_HEIGHT = 100000;

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

/**
 * Mise à jour consolidée du 04/11/2026 (§6 quinquies) : saisie en ligne du nom du Circuit (Renommer, Dupliquer) —
 * clavier ouvert, texte sélectionné, validation par la touche Retour (ou en quittant le champ) ; un nom vide
 * reprend le nom par défaut (appelant).
 */
function RenameField({ initial, onSubmit, style, testID }: { readonly initial: string; readonly onSubmit: (name: string) => void; readonly style: StyleProp<ViewStyle>; readonly testID: string }) {
  const [text, setText] = useState(initial);
  const submitted = useRef(false);
  const submit = () => {
    if (submitted.current) return;
    submitted.current = true;
    onSubmit(text);
  };
  return (
    <View style={[styles.titleTarget, style]}>
      <TextInput
        value={text}
        onChangeText={setText}
        autoFocus
        selectTextOnFocus
        returnKeyType="done"
        onSubmitEditing={submit}
        onBlur={submit}
        accessibilityLabel={strings.screens.composition.circuitActions.renameLabel}
        style={[styles.title, styles.renameInput]}
        testID={testID}
      />
    </View>
  );
}
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

/**
 * Recette iPhone n° 2 du 31/10/2026 (Hermann : « Appui long sur la zone de la durée d'un circuit ou
 * d'un cycle doit permettre de le déplacer ») — la durée d'un en-tête de conteneur porte le même appui
 * long que le titre (`onLongPress`, saisie du conteneur, délai système de 500 ms par défaut du `Text`
 * natif = `LONG_PRESS_DELAY_MS`) ; aucun appui court (la durée n'en avait pas) ; sans surbrillance ;
 * toujours retirée de l'accessibilité (lue avec le nom, qui porte « Monter » / « Descendre »). Sa zone
 * de toucher est étendue à la hauteur de la cible du titre (44), sans changer la mise en page.
 * Absent (`undefined`) : texte simple, inchangé.
 */
export function durationGrabProps(onLongPress: (() => void) | undefined) {
  return onLongPress === undefined
    ? { style: null }
    : { onLongPress, suppressHighlighting: true, style: durationGrabStyle.target };
}

/**
 * Recette n° 3 bis du 03/11/2026 (f3s-nom, Hermann : « Un titre long ne doit pas décaler le compteur, par contre
 * on peut décider maintenant de décaler le compteur au maximum vers la droite, en considérant la place minimum
 * nécessaire pour l'affichage de la durée. Le compteur doit rester aligné pour le circuit et pour le cycle, sa
 * position identique pour toutes les séances. Et s'il n'y a pas suffisamment de place on tronque le nom du
 * circuit. ») — colonnes de la ligne d'en-tête d'un Circuit ou d'un Cycle, depuis le bord droit commun :
 * - durée : largeur de la plus longue durée affichée d'un conteneur (« ≈ 88 min 45 s »), calée à droite ;
 * - compteur : largeur du plus long compteur fermé (« 99 tours · alternées », « 99 blocs · groupées »,
 *   « 99 passages »…), commencé à la même abscisse partout ;
 * - nom : la place restante, tronqué (ellipse) au besoin.
 * Largeurs MESURÉES dans les styles réels (taille du texte comprise), une fois par taille de texte. Un compteur
 * plus large que la réserve (« jusqu'à l'échec · alternées » du Death by, stepper ouvert) prend sa place sur le
 * nom. [Remplace l'abscisse fixe de 103 depuis le début du nom (recette du 29/10), devenue un minimum du nom.]
 */
type ContainerColumnWidths = { readonly fontScale: number; readonly counter: number; readonly duration: number };
let measuredColumns: ContainerColumnWidths | null = null;

/** Compteurs fermés de référence : nombre à deux chiffres, unité au pluriel, adjectif éventuel. */
function counterReferences(): readonly { readonly unit: string; readonly adjective: string | null }[] {
  const s = strings.screens.composition;
  const adjectives = [s.circuit.natureAdjective.TOURS, s.circuit.natureAdjective.SERIES];
  const circuitUnits = [s.circuit.countUnit.plural, s.carrier.blockUnit.plural, s.carrier.roundUnit.plural];
  return [
    ...circuitUnits.flatMap((unit) => adjectives.map((adjective) => ({ unit, adjective }))),
    { unit: s.cycle.countUnit.plural, adjective: null },
  ];
}

const DURATION_REFERENCE = `${strings.shared.durationNature.estimatedPrefix}${formatPhraseDuration(88 * 60 + 45)}`;

/**
 * Colonnes de la ligne d'en-tête (`title`, `counter`, `duration` : styles à ajouter) et sonde de mesure à
 * rendre dans la ligne tant que les largeurs de la taille de texte courante ne sont pas connues.
 */
export function useContainerColumns() {
  const { fontScale } = useWindowDimensions();
  const [widths, setWidths] = useState<ContainerColumnWidths | null>(() => (measuredColumns?.fontScale === fontScale ? measuredColumns : null));
  const current = widths?.fontScale === fontScale ? widths : measuredColumns?.fontScale === fontScale ? measuredColumns : null;
  if (current === null) {
    return {
      probe: (
        <ContainerColumnsProbe
          fontScale={fontScale}
          onMeasured={(measured) => {
            measuredColumns = measured;
            setWidths(measured);
          }}
        />
      ),
      title: null,
      counter: null,
      duration: null,
    };
  }
  return {
    probe: null,
    title: columnStyles.title,
    counter: { minWidth: current.counter },
    duration: [columnStyles.duration, { minWidth: current.duration }],
  };
}

function ContainerColumnsProbe({ fontScale, onMeasured }: { fontScale: number; onMeasured: (widths: ContainerColumnWidths) => void }) {
  const references = counterReferences();
  const counters = useRef<(number | null)[]>(references.map(() => null));
  const duration = useRef<number | null>(null);
  const done = useRef(false);
  const report = () => {
    if (done.current || duration.current === null || counters.current.some((width) => width === null)) return;
    done.current = true;
    onMeasured({ fontScale, counter: Math.ceil(Math.max(...counters.current.map((width) => width ?? 0))), duration: Math.ceil(duration.current) });
  };
  return (
    <View style={columnStyles.probe} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="container-columns-probe">
      {references.map((reference, index) => (
        <View
          // Clé par rang : « tours » est à la fois l’unité du Circuit et celle des tours d’un porteur (clés en double).
          key={index}
          style={columnStyles.probeRow}
          testID={`container-columns-probe-counter-${index}`}
          onLayout={(event) => {
            counters.current[index] = event.nativeEvent.layout.width;
            report();
          }}
        >
          <View style={styles.numberTarget}>
            <Text style={styles.number}>99</Text>
            <Text style={styles.unit}>{reference.unit}</Text>
          </View>
          {reference.adjective === null ? null : (
            <>
              <Text style={styles.separator}>{` ${MIDDLE_DOT} `}</Text>
              <Text style={styles.adjective}>{reference.adjective}</Text>
            </>
          )}
        </View>
      ))}
      <Text
        style={[styles.duration, columnStyles.probeText]}
        testID="container-columns-probe-duration"
        onLayout={(event) => {
          duration.current = event.nativeEvent.layout.width;
          report();
        }}
      >
        {DURATION_REFERENCE}
      </Text>
    </View>
  );
}

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
  // [PRE-9 B.1b (ARB-13) : lettre de désignation (« A »…) après le nom — retirée par la recette n° 3 bis du
  // 03/11/2026 (f3s-nom, Hermann : « Retirer le suffixe en lettre des circuits, il n'est plus nécessaire car on a
  // déjà la deuxième ligne qui liste son contenu »).]
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
  /**
   * Recette du 05/11/2026 au soir (r-tabata, Hermann : « la première fois que je déploie chaque circuit déjà replié, il se replie
   * d’abord jusqu’à cacher la ligne sous le nom, puis de déplie complètement ») : la ligne des noms reste ouverte tant que le
   * déploiement des cartes attend leur première mesure (`useCircuitCardsReveal().waiting`). Absent : `isCollapsed`.
   */
  readonly namesCollapsed?: boolean;
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
   * Contre-recette du 30/10 (constat b) : apparition du contenu de l'en-tête au montage (Circuit qui
   * vient d'être posé) ; sans effet ensuite. Porté par une vue intérieure : la mesure (`onLayout`) et
   * la translation de l'en-tête sont inchangées.
   */
  readonly entering?: ComponentProps<typeof Reanimated.View>["entering"];
  /**
   * PRE-6 story 5.2 : retrait du titre, depuis le bord gauche de l'en-tête, qui laisse la colonne
   * de l'anneau du rail (dessiné par l'écran) ; 0 par défaut.
   */
  readonly titleInset?: number;
  /**
   * PRE-9 B.4 (COMP §6) : appui long sur le nom et le chevron — saisie du Circuit pour le glisser
   * (un Circuit déployé est d'abord replié par l'écran). Absent : appui court seul. Recette n° 2 du 31/10 :
   * aussi sur la durée (`durationGrabProps`).
   */
  readonly onLongPress?: () => void;
  /** PRE-9 B.4 : alternatives accessibles au glisser (« Monter » / « Descendre »). */
  readonly moveActions?: ContainerMoveActions;
  /** PRE-9 C.4 : Circuit porteur d'un Format (voir `CarrierHeader`) ; absent : Circuit standard. */
  readonly carrier?: CarrierHeader;
  /**
   * Recette iPhone n° 3 du 03/11/2026 (autres constats, Hermann : « remplacer le nom mot "Circuit" par
   * le nom du format ») : nom du modèle d'origine d'un Circuit standard créé par la fenêtre Formats
   * (« Tabata », « Renforcement »…), affiché à la place de « Circuit » [lettre conservée — retirée le 03/11/2026,
   * f3s-nom] ; absent :
   * « Circuit ». Un Circuit porteur affiche le nom de son Format (`carrier`).
   */
  readonly originTitle?: string;
  /**
   * Mise à jour consolidée du 04/11/2026 (§6 quinquies) : nom choisi par Renommer ; il remplace le titre (y compris
   * le nom du Format d'un Circuit porteur), la deuxième ligne garde l'organisation.
   */
  readonly customTitle?: string;
  /** Renommer : le titre passe en saisie en ligne (clavier), validée par Retour ; texte sélectionné à l'ouverture. */
  readonly rename?: { readonly initial: string; readonly onSubmit: (name: string) => void };
  readonly testID: string;
};

/**
 * PRE-9 C.4 (référence Formats du 02/11/2026 §1, §5, §7.5, §10 à §12 ; CE-FMT-03) — en-tête d'un Circuit
 * porteur : le nom du Format d'origine remplace « Circuit » ; le compte se lit en « bloc(s) » (AMRAP) ou
 * en tours, ou « jusqu'à l'échec » (Death by, régime ouvert, sans stepper) ; la nature est fixée (texte,
 * sans menu) ; à droite, la durée portée par le Circuit — durée de chaque bloc ou de chaque tour en bleu,
 * modifiable ; « Sans limite » (gris, tactile) ou « ≤ X min » (For time) ; rien pour le Death by alterné.
 */
export type CarrierHeader = {
  readonly title: string;
  readonly unit: { readonly singular: string; readonly plural: string } | null;
  readonly openLabel: string;
  /** `OVERFLOW` : durée de tour dépassée par le travail prévu (EMOM, réponse 2 de Hermann du 07/11/2026), en rouge. */
  readonly duration: { readonly text: string; readonly tone: "EDITABLE" | "MUTED" | "OVERFLOW" } | null;
  readonly onPressDuration?: () => void;
  readonly durationAccessibilityLabel?: string;
};

/** PRE-9 B.4 : actions accessibles de déplacement pas à pas d'un conteneur, `null` si indisponible. */
export type ContainerMoveActions = { readonly moveUp: (() => void) | null; readonly moveDown: (() => void) | null };

/** Actions accessibles « Monter » / « Descendre » disponibles (libellés des cartes d'occurrence). */
export function containerMoveAccessibility(actions: ContainerMoveActions | undefined) {
  const labels = strings.screens.composition.activityActions;
  return {
    accessibilityActions: [
      ...(actions?.moveUp ? [{ name: "moveUp", label: labels.moveUp }] : []),
      ...(actions?.moveDown ? [{ name: "moveDown", label: labels.moveDown }] : []),
    ],
    onAccessibilityAction: (event: { readonly nativeEvent: { readonly actionName: string } }) => {
      if (event.nativeEvent.actionName === "moveUp") actions?.moveUp?.();
      if (event.nativeEvent.actionName === "moveDown") actions?.moveDown?.();
    },
  };
}

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
  namesCollapsed,
  onToggleCollapsed,
  memberNames,
  counterRef,
  onLayout,
  onRowLayout,
  isAttenuated = false,
  isChoicePending = false,
  translateY,
  entering,
  titleInset = 0,
  onLongPress,
  moveActions,
  carrier,
  originTitle,
  customTitle,
  rename,
  testID,
}: CircuitHeaderProps) {
  const t = strings.screens.composition.circuit;
  const title = customTitle ?? (carrier !== undefined ? carrier.title : (originTitle ?? t.title));
  const columns = useContainerColumns();
  // Recette n° 2 du 31/10 : la durée porte aussi l'appui long de saisie.
  const durationGrab = durationGrabProps(onLongPress);
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
      <Reanimated.View entering={entering} testID={`${testID}-reveal`}>
      {columns.probe}
      <View style={styles.row} onLayout={onRowLayout} testID={`${testID}-row`}>
        {/* ARB-12 : le nom et le chevron forment une seule cible réelle de 44 de haut. */}
        {rename !== undefined ? (
          <RenameField initial={rename.initial} onSubmit={rename.onSubmit} style={columns.title} testID={`${testID}-rename`} />
        ) : (
        <Pressable
          onPress={onToggleCollapsed}
          onLongPress={onLongPress}
          delayLongPress={LONG_PRESS_DELAY_MS}
          {...containerMoveAccessibility(moveActions)}
          accessibilityRole="button"
          // Revue 5.2 : VoiceOver lit la durée juste après le nom (elle est affichée à droite).
          accessibilityLabel={`${title}, ${duration}`}
          accessibilityState={{ expanded: !isCollapsed }}
          style={[styles.titleTarget, columns.title]}
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
        )}
        <View style={[styles.counterSlot, columns.counter]} testID={`${testID}-counter-slot`}>
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
            carrier={carrier}
            testID={`${testID}-counter`}
          />
        </View>
        {carrier !== undefined ? (
          carrier.duration === null ? (
            <View style={[styles.duration, columns.duration]} testID={`${testID}-duration`} />
          ) : (
            <Pressable
              onPress={carrier.onPressDuration}
              disabled={carrier.onPressDuration === undefined}
              accessibilityRole="button"
              accessibilityLabel={carrier.durationAccessibilityLabel ?? carrier.duration.text}
              hitSlop={8}
              style={[styles.carrierDurationTarget, columns.duration]}
              testID={`${testID}-duration`}
            >
              <Text style={[styles.duration, carrier.duration.tone === "EDITABLE" ? styles.carrierDurationEditable : carrier.duration.tone === "OVERFLOW" ? styles.carrierDurationOverflow : styles.carrierDurationMuted]} numberOfLines={1}>
                {carrier.duration.text}
              </Text>
            </Pressable>
          )
        ) : (
          /* Lue avec le nom (VoiceOver), elle est retirée de l'accessibilité ici. */
          <Text
            {...durationGrab}
            style={[styles.duration, columns.duration, durationGrab.style]}
            numberOfLines={1}
            accessible={false}
            importantForAccessibility="no"
            testID={`${testID}-duration`}
          >
            {duration}
          </Text>
        )}
      </View>
      {/*
       * [Recette du 29/10 (obs-3 b) : « la ligne des noms apparaît en fondu, avec le repli des cartes »
       * (`entering`, montée et démontée d'un coup) — remplacé par la recette iPhone n° 2 du 31/10/2026 :]
       * la ligne des noms s'ouvre et se referme avec les cartes (`CollapsedNamesLine`).
       */}
      <CollapsedNamesLine isCollapsed={namesCollapsed ?? isCollapsed} text={memberNames.join(` ${MIDDLE_DOT} `)} testID={testID} />
      </Reanimated.View>
    </Animated.View>
  );
}

/** Hauteur de la ligne des noms tant qu'elle n'est pas mesurée : écart de 7 et texte de 15. */
const COLLAPSED_NAMES_FALLBACK_HEIGHT = COLLAPSED_NAMES_GAP + NAMES_TEXT.lineHeight;

/**
 * Recette iPhone n° 2 du 31/10/2026 (b4-cycle, b4b-cycle ; Hermann : « Circuit qui se déplie : le sous
 * titre disparait et la carte du circuit se rétrécit d'abord brusquement, avant qu'elle ne se déploie
 * lentement. Circuit qui se replie : le sous-titre apparaitre et la carte du circuit s'agrandit d'abord
 * brusquement, avant de se rétrécir lentement. Dans les deux cas cela provoque un saut dans le
 * mouvement. ») — ligne des noms du Circuit replié, animée avec les cartes (`useCircuitCardsReveal`) :
 * même durée (repli 900 ms, déploiement 700 ms), même courbe, sur le fil UI. Au repli, elle s'ouvre de
 * 0 à sa hauteur et apparaît en fondu pendant que les cartes se referment ; au déploiement, elle se
 * referme et s'efface pendant que les cartes s'ouvrent, puis est démontée. La hauteur du Circuit passe
 * ainsi continûment d'un état à l'autre (la somme des deux mouvements), sans saut. « Réduire les
 * animations » : immédiat.
 *
 * Contre-recette du 01/11/2026 (m12-levee, Hermann : « Lorsqu'on replie un circuit il se replie d'abord
 * jusqu'à une hauteur qui est plus petite que sa hauteur repliée, puis il se déplie jusqu'à sa hauteur
 * repliée ») — cause : le texte, dans la découpe (`maxHeight`), était mesuré avec la hauteur disponible
 * de la découpe ; sa hauteur « naturelle », base de l'animation, se réduisait avec elle à chaque image
 * (la ligne restait presque fermée) jusqu'à la fin, où la découpe libérée la rouvrait d'un coup. Le
 * texte est désormais posé hors du flux de la découpe (position absolue) : mesuré sans contrainte, à sa
 * vraie hauteur ; la découpe a une hauteur explicite (part de la hauteur naturelle, entière à la fin).
 */
function CollapsedNamesLine({ isCollapsed, text, testID }: { isCollapsed: boolean; text: string; testID: string }) {
  const reduceMotion = useReduceMotion();
  const [mounted, setMounted] = useState(isCollapsed);
  // Dernier état reçu : un repli monte la ligne aussitôt (état ajusté au rendu).
  const [seenCollapsed, setSeenCollapsed] = useState(isCollapsed);
  if (seenCollapsed !== isCollapsed) {
    setSeenCollapsed(isCollapsed);
    if (isCollapsed) setMounted(true);
  }
  const progress = useSharedValue(isCollapsed ? 1 : 0);
  const naturalHeight = useSharedValue(0);
  const previous = useRef(isCollapsed);
  useEffect(() => {
    if (previous.current === isCollapsed) return;
    previous.current = isCollapsed;
    const unmount = () => setMounted(false);
    const duration = reduceMotion ? 0 : isCollapsed ? CIRCUIT_HIDE_DURATION_MS : CIRCUIT_REVEAL_DURATION_MS;
    progress.set(
      withTiming(isCollapsed ? 1 : 0, { duration, easing: CIRCUIT_REVEAL_EASING }, (finished) => {
        if (finished === true && !isCollapsed) scheduleOnRN(unmount);
      }),
    );
  }, [isCollapsed, progress, reduceMotion]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    height: Math.min(1, progress.value) * (naturalHeight.value > 0 ? naturalHeight.value : COLLAPSED_NAMES_FALLBACK_HEIGHT),
  }));
  /** Hauteur naturelle (texte hors du flux de la découpe, non contraint ; écart compris), base de l'animation. */
  const onTextLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      if (height > 0) naturalHeight.set(height + COLLAPSED_NAMES_GAP);
    },
    [naturalHeight],
  );
  if (!mounted && !isCollapsed) return null;
  return (
    <Reanimated.View style={[styles.namesClip, style]} testID={`${testID}-names-reveal`}>
      <Text style={[styles.names, styles.namesText]} numberOfLines={1} onLayout={onTextLayout} testID={`${testID}-names`}>
        {text}
      </Text>
    </Reanimated.View>
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
 *
 * Contre-recette du 30/10 (obs-3) : `bottomOverlap` — réduction de la marge basse du Circuit quand
 * ses cartes sont déployées (marge basse négative de la liste, de 0 à −`bottomOverlap`) ; repliées
 * (liste démontée), la marge basse reste entière.
 *
 * Contre-recette n° 4 du 01/11/2026 (Hermann, cr5-replie : « le cadre du circuit se déplie jusqu'à la
 * hauteur qu'il aurait avec les cartes qui le constitue, mais sans qu'elles n'apparaissent » ; constat
 * c : « pour l'autre les cartes s'effacent d'abord, le circuit est vide, puis il se replie ») — la
 * hauteur naturelle, base de l'animation, n'était relevée que sur la liste AU REPOS (`onLayout` ignoré
 * pendant l'animation). Une liste montée pendant un déploiement (Circuit monté replié — déplacé dans
 * ou hors d'un Cycle, contenu changé — puis déployé) n'était plus mesurée au repos ensuite : hauteur
 * inconnue (0), donc `maxHeight` libre — déploiement d'un coup à pleine hauteur avec un simple fondu,
 * et repli suivant en fondu puis saut à la fin. `measuresContent` : la hauteur naturelle est relevée
 * sur le CONTENU de la liste (`onContentLayout`, vue intérieure non contrainte par `maxHeight`), à
 * chaque mesure, pendant l'animation comme au repos ; tant qu'elle est inconnue, la liste animée reste
 * fermée (0) au lieu d'être libre. Sans `measuresContent` (ancien modèle) : comportement d'origine.
 *
 * Contre-recette n° 5 du 01/11/2026 (Hermann : « Oui, ouvrir la place pendant le déploiement. le
 * circuit s'ouvre proprement mais la carte elle fait encore plusieurs soubresauts qu'il faut
 * éliminer. ») — avec `measuresContent`, un déploiement part quand la hauteur naturelle du contenu est
 * connue (déjà relevée, sinon à la première mesure du contenu monté ; au plus tard après
 * `CIRCUIT_REVEAL_START_FALLBACK_MS`) : le mouvement part de 0 avec sa hauteur finale, sans saut quand la
 * mesure arrive en cours de route. `onRevealStart(hauteur naturelle)` est appelé dans la tâche même du
 * départ (fil JS) : l'écran y lance, sur le pilote natif, les translations qui accompagnent ce
 * déploiement avec la même courbe et la même durée.
 *
 * Recette du 06/11/2026 (t-depli, KO, Hermann : « Le comportement n’a pas changé, le premier déploiement
 * se fait en se repliant d'abord. ») — cause : un Circuit monté replié (entrée et sortie du mode
 * enveloppe, regroupement dans un Cycle) n'a jamais mesuré ses cartes. Sur iPhone, écran chargé, la
 * mesure du contenu (`onLayout`, fil JS) arrive après le délai de secours
 * (`CIRCUIT_REVEAL_START_FALLBACK_MS`, même constat que `CardMotionBlock`) : le déploiement partait sans
 * hauteur — cartes bornées à 0 pendant que la ligne des noms se refermait (le cadre rétrécissait
 * « jusqu'à cacher la ligne sous le nom »), puis la mesure tardive les ouvrait d'un coup. [Correctif du
 * 05/11 au soir (r-tabata, `waiting`) : n'agissait que jusqu'au délai de secours — remplacé :]
 * désormais un départ sans mesure est « à l'aveugle » (`blind`) : la liste reste affichée fermée
 * (progression vue 0) et la ligne des noms ouverte (`waiting`) ; la mesure tardive relance le
 * déploiement depuis 0 avec sa hauteur (ligne des noms refermée à ce départ réel, `onRevealStart`
 * prévenu). Sans aucune mesure jusqu'à la fin de la progression (tests sans mise en page), l'état
 * déployé est posé à la fin, comme avant.
 */
export function useCircuitCardsReveal(
  collapsed: boolean,
  gap: number,
  bottomOverlap = 0,
  measuresContent = false,
  onRevealStart?: (naturalHeight: number) => void,
) {
  const reduceMotion = useReduceMotion();
  const [mounted, setMounted] = useState(!collapsed);
  const [animating, setAnimating] = useState(false);
  // r-tabata (recette du 05/11/2026 au soir) : contenu déjà mesuré, et déploiement en attente de sa première mesure — la ligne des
  // noms (`CollapsedNamesLine`) ne se referme qu'au départ réel du déploiement, avec la même progression.
  const [hasMeasure, setHasMeasure] = useState(false);
  const [waiting, setWaiting] = useState(false);
  // Dernier état reçu : un changement démarre l'animation (état ajusté au rendu, sans effet en cascade).
  const [seenCollapsed, setSeenCollapsed] = useState(collapsed);
  if (seenCollapsed !== collapsed) {
    setSeenCollapsed(collapsed);
    setAnimating(true);
    setMounted(true);
    setWaiting(!collapsed && measuresContent && !hasMeasure && !reduceMotion);
  }
  const progress = useSharedValue(collapsed ? 0 : 1);
  const naturalHeight = useSharedValue(0);
  /** t-depli (06/11/2026) : 1 pendant un déploiement parti sans mesure — la liste est vue fermée (progression 0). */
  const blind = useSharedValue(0);
  const previous = useRef(collapsed);
  /** Contre-recette n° 5 : hauteur naturelle du contenu connue du fil JS (dernière mesure). */
  const naturalRef = useRef(0);
  /** Contre-recette n° 5 : déploiement en attente de la mesure du contenu (`null` : aucun). */
  const pendingStartRef = useRef<(() => void) | null>(null);
  /** t-depli : déploiement parti à l'aveugle, relancé par la mesure tardive (`null` : aucun). */
  const lateStartRef = useRef<(() => void) | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRevealStartRef = useRef(onRevealStart);
  useLayoutEffect(() => {
    onRevealStartRef.current = onRevealStart;
  });
  useEffect(
    () => () => {
      if (fallbackRef.current !== null) clearTimeout(fallbackRef.current);
    },
    [],
  );
  useEffect(() => {
    if (previous.current === collapsed) return;
    previous.current = collapsed;
    const finish = (isCollapsed: boolean) => {
      setAnimating(false);
      // t-depli : fin d'un déploiement resté sans mesure — l'état déployé est posé, la ligne des noms se referme.
      lateStartRef.current = null;
      blind.set(0);
      setWaiting(false);
      if (isCollapsed) setMounted(false);
    };
    const duration = reduceMotion ? 0 : collapsed ? CIRCUIT_HIDE_DURATION_MS : CIRCUIT_REVEAL_DURATION_MS;
    const start = () => {
      pendingStartRef.current = null;
      if (fallbackRef.current !== null) clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
      // t-depli : déploiement sans hauteur connue (délai de secours écoulé) — à l'aveugle, relancé par la mesure.
      const isBlind = !collapsed && measuresContent && naturalRef.current <= 0 && duration > 0;
      blind.set(isBlind ? 1 : 0);
      lateStartRef.current = isBlind
        ? () => {
            lateStartRef.current = null;
            progress.set(0);
            start();
          }
        : null;
      if (!isBlind) setWaiting(false);
      progress.set(
        withTiming(collapsed ? 0 : 1, { duration, easing: CIRCUIT_REVEAL_EASING }, (finished) => {
          if (finished === true) scheduleOnRN(finish, collapsed);
        }),
      );
      if (!collapsed && measuresContent && naturalRef.current > 0) onRevealStartRef.current?.(naturalRef.current);
    };
    // Contre-recette n° 5 : un déploiement attend la hauteur naturelle du contenu (voir l'en-tête).
    if (!collapsed && measuresContent && naturalRef.current <= 0 && duration > 0) {
      pendingStartRef.current = start;
      if (fallbackRef.current !== null) clearTimeout(fallbackRef.current);
      fallbackRef.current = setTimeout(() => pendingStartRef.current?.(), CIRCUIT_REVEAL_START_FALLBACK_MS);
      return;
    }
    pendingStartRef.current = null;
    start();
  }, [blind, collapsed, measuresContent, progress, reduceMotion]);
  const animatedStyle = useAnimatedStyle(() => {
    // t-depli : à l'aveugle, la liste reste vue fermée (aucune marge ni hauteur ne bouge avant la mesure).
    const shown = blind.value === 1 ? 0 : progress.value;
    return {
      opacity: shown,
      marginTop: (shown - 1) * gap,
      marginBottom: -shown * bottomOverlap,
      maxHeight: circuitRevealMaxHeight(shown, naturalHeight.value, measuresContent),
    };
  });
  /** Mesure de la liste au repos (hauteur naturelle), base de l'animation suivante. */
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (!animating) naturalHeight.set(event.nativeEvent.layout.height);
    },
    [animating, naturalHeight],
  );
  /** Contre-recette n° 4 : hauteur naturelle du contenu, relevée à chaque mesure (animation comprise). */
  const onContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      if (height <= 0) return;
      naturalHeight.set(height);
      naturalRef.current = height;
      setHasMeasure(true);
      // Contre-recette n° 5 : le déploiement en attente part avec cette mesure ; t-depli : un déploiement
      // parti à l'aveugle (mesure arrivée après le délai de secours) repart depuis 0 avec elle.
      if (pendingStartRef.current !== null) pendingStartRef.current();
      else lateStartRef.current?.();
    },
    [naturalHeight],
  );
  return {
    /** Faux une fois le repli terminé : la liste n'est pas rendue. */
    mounted: mounted || !collapsed,
    style: [animating ? styles.reveal : null, animatedStyle],
    onLayout,
    onContentLayout,
    /** Déploiement demandé, en attente de la première mesure du contenu (la ligne des noms reste ouverte). */
    waiting,
    /**
     * Recette iPhone du 06/11/2026 au soir (t-depli, preuve par traces Metro) : dans la liste fermée (hauteur maximale 0), le
     * contenu était mesuré à 0 à +7 ms, sa vraie hauteur (169) n'arrivant qu'à +864 ms, après la fin du déploiement (+825 ms)
     * — d'où « déploie brutalement … puis se replie ». En attente de sa première mesure, le contenu est posé hors du flux
     * (position absolue, même largeur) : sa hauteur naturelle est mesurée aussitôt, et le déploiement part avec elle.
     */
    contentStyle: waiting ? styles.revealMeasure : null,
  };
}

/**
 * Hauteur maximale de la liste des cartes à la progression `progress` (0 replié, 1 déployé) :
 * déployée, libre ; en animation, la part de la hauteur naturelle. Hauteur naturelle inconnue : libre
 * sans `measuresContent` (ancien modèle) ; fermée (0) avec, jusqu'à la première mesure du contenu
 * (contre-recette n° 4 du 01/11/2026).
 */
export function circuitRevealMaxHeight(progress: number, naturalHeight: number, measuresContent: boolean): number {
  "worklet";
  if (progress >= 1) return UNCONSTRAINED_HEIGHT;
  if (naturalHeight > 0) return progress * naturalHeight;
  return measuresContent ? 0 : UNCONSTRAINED_HEIGHT;
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
  carrier,
  testID,
}: {
  carrier?: CarrierHeader;
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
      {carrier !== undefined && carrier.unit === null ? (
        <Text style={styles.adjective} numberOfLines={1} testID={`${testID}-open`}>
          {carrier.openLabel}
        </Text>
      ) : (
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
        unitLabel={carrier?.unit != null ? (count === 1 ? carrier.unit.singular : carrier.unit.plural) : circuitUnitLabel(count)}
        counterTestID={testID}
      />
      )}
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
        {carrier !== undefined ? (
          // Nature fixée par le Format d'origine (§1) : texte, sans menu. Recette iPhone n° 3 du 03/11/2026
          // (autres constats, Hermann : « le texte "groupé" n'est plus aligné verticalement avec les autres
          // champs de la ligne ») : posé dans la même boîte de 44 que l'adjectif du menu (`adjectiveTarget` :
          // contenu décalé de `TARGET_CONTENT_OFFSET`), il retrouve la ligne du compteur et de la durée —
          // seul dans l'emplacement aux marges négatives, il remontait de 17.
          <View style={styles.adjectiveTarget} testID={`${testID}-adjective-target`}>
            <Text style={[styles.adjective, styles.carrierNature]} numberOfLines={1} testID={`${testID}-adjective`}>
              {circuitNatureAdjective(nature)}
            </Text>
          </View>
        ) : (
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
        )}
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
  renameInput: { flex: 1, padding: 0, borderBottomWidth: 1, borderBottomColor: colors.primary },
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
  // PRE-9 C.4 : Circuit porteur — nature fixée (texte, sans menu) ; durée portée par le Circuit.
  carrierNature: {
    color: colors.textPrimary,
  },
  carrierDurationTarget: {
    flex: 1,
    minWidth: 0,
  },
  carrierDurationEditable: {
    color: colors.primary,
    flex: 0,
    marginLeft: 0,
  },
  carrierDurationOverflow: {
    color: colors.danger,
    flex: 0,
    marginLeft: 0,
  },
  carrierDurationMuted: {
    color: "#7A7A80",
    flex: 0,
    marginLeft: 0,
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
  // t-depli : contenu en attente de sa première mesure, hors du flux de la liste fermée.
  revealMeasure: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  // Ligne des noms du Circuit replié : une ligne tronquée, à 7 de la ligne d'en-tête.
  names: {
    marginTop: COLLAPSED_NAMES_GAP,
    ...NAMES_TEXT,
    color: colors.textPrimary,
  },
  // Recette n° 2 du 31/10 : découpe de la ligne des noms pendant son ouverture / sa fermeture.
  namesClip: {
    overflow: "hidden",
  },
  // Contre-recette du 01/11 (m12-levee) : texte hors du flux de la découpe, mesuré sans contrainte.
  namesText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});

/**
 * Recette n° 2 du 31/10 : zone d'appui long de la durée — étendue au-dessus et au-dessous de la ligne
 * comme la cible du titre (44 de haut), marges négatives : la mise en page de la ligne est inchangée.
 */
const columnStyles = StyleSheet.create({
  // f3s-nom : le nom prend la place restante et cède (ellipse) avant le compteur et la durée.
  title: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  duration: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    marginLeft: COUNTER_TO_DURATION_GAP,
  },
  // Sonde hors écran, sans contrainte de largeur.
  probe: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 1000,
    opacity: 0,
  },
  probeRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  probeText: {
    flex: 0,
    alignSelf: "flex-start",
    marginLeft: 0,
  },
});

const durationGrabStyle = StyleSheet.create({
  target: {
    marginTop: -TARGET_OVERFLOW_ABOVE_ROW,
    marginBottom: -TARGET_OVERFLOW_BELOW_ROW,
    paddingTop: TARGET_OVERFLOW_ABOVE_ROW,
    paddingBottom: TARGET_OVERFLOW_BELOW_ROW,
  },
});
