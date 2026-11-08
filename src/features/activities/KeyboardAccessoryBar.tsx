import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

import type { ExecutionMode } from "@/domain/activities/ExecutionParameters";
import type { KeyboardFrame } from "@/features/activities/useSheetKeyboard";
import { strings } from "@/shared/i18n";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-5 story 2.2 (FR-25, §9-8, AD-26) — barre du clavier de la Feuille : « ← Précédent »
 * et « Suivant → », « Fermer » à droite. Extrémités indisponibles, sans boucle (état
 * d'accessibilité `disabled`).
 *
 * D-434 (décision de Hermann du 19/10) : de gauche à droite « À l'échec » | « ← Précédent »
 * | « Suivant → » | « Fermer », sur une seule ligne. « À l'échec » n'est rendu que pour une
 * cellule Cible d'une série (`failure`), avec son état annoncé (sélectionné quand la cellule
 * est à l'échec) ; jamais pour une Pause ou une Charge. Si la largeur ne suffit pas aux
 * libellés complets (mesurés hors écran, texte agrandi compris), Précédent et Suivant sont
 * réduits à leurs flèches, avec leurs libellés d'accessibilité inchangés ; les zones
 * tactiles (44 de haut) sont préservées.
 *
 * Recette du 19/10 (RC-1) : `InputAccessoryView` ne s'affiche pas dans la `Modal` de la
 * Feuille. La barre est rendue par la Feuille elle-même, en position absolue au bas de la
 * zone de la `Modal`, et remontée juste au-dessus du clavier : son décalage est l'écart
 * entre le bas mesuré de cette zone (`containerBottom`, coordonnées de la fenêtre) et le
 * haut du clavier (`keyboardFrame`, événements `Keyboard` standards). Elle monte avec le
 * clavier (translation sur le fil natif, durée de l'animation du clavier) ; « Réduire les
 * animations » : placée directement. Un toucher de la barre ne retire pas le focus du
 * champ (aucun `ScrollView` ni `TextInput` ne la contient) : Précédent / Suivant passent
 * au champ voisin sans fermer ni rouvrir le clavier.
 *
 * Relevé Figma `9292:18077` (lecture seule), constantes locales nommées (`tokens.ts`
 * inchangé, NFR-3) : hauteur 44, fond `#E6E9ED`, texte `#5C4DFF` 14 regular.
 *
 * PRE-7 story B.3 (B9, D-447, arbitrage A4) : une seule ligne de QUATRE EMPLACEMENTS STABLES, de
 * largeur et de hauteur égales — « À l'échec » (ou un emplacement réservé vide, non accessible,
 * quand il ne s'applique pas : Pause, Charge), Précédent, Suivant, Fermer ; Précédent et Suivant
 * restent donc au même endroit quel que soit le champ. Boutons arrondis (rayon local 8) sur le
 * blanc des touches iOS claires (`colors.background`), texte inchangé ; Fermer bleu KODJO
 * (`colors.primary`), texte blanc. Fond de barre conservé. Flèches seules quand le plus large des
 * libellés complets de Précédent et de Suivant (mesurés hors écran) ne tient pas dans un
 * emplacement. Mécanisme RC-1 (position, montée, focus) inchangé.
 */

/**
 * Recette iPhone du 29/10/2026 (Hermann : « agrandir un peu la marge en haut et en bas de la barre
 * grise optionnelle, et lui donner la couleur de fond du clavier principal ») : marges verticales de
 * 4 → 8 (boutons de 36 inchangés, barre de 44 → 52) ; fond `#E1E4E8`, fond du clavier iOS 26 clair
 * relevé sur la référence Figma `9295:43707` (« Clavier numérique — Référence iOS 26 », dans
 * `9292:18077`), à la place de `#E6E9ED`. À confirmer sur iPhone (le clavier natif est translucide).
 */
const BAR_HEIGHT = 52;
const BAR_BACKGROUND = "#E1E4E8";
const BAR_TEXT_COLOR = "#5C4DFF";
const BAR_FONT_SIZE = 14;
/**
 * PRE-7 B.3 (B9) : marges latérales de la barre et écart entre deux emplacements — valeurs
 * d'intégration (non tirées de Figma), choisies pour que « ← Précédent » (85,4 en Regular 14)
 * s'affiche complet à 402 et 440 (emplacements de 92 et 101,5) et réduit à sa flèche à 360
 * (81,5), et que « À l'échec » (62,9 en Semi Bold 14) tienne sur une ligne à 360.
 */
const BAR_SIDE_INSET = 8;
const BAR_SLOT_GAP = 6;
/** PRE-7 B.3 (B9) : nombre d'emplacements de la barre (D-434 : À l'échec, Précédent, Suivant, Fermer). */
const BAR_SLOT_COUNT = 4;
/** PRE-7 B.3 (B9) : marge verticale de la barre ; recette du 29/10/2026 : 8, boutons de 36 dans la ligne de 52. */
const BAR_VERTICAL_INSET = 8;
const BAR_BUTTON_HEIGHT = BAR_HEIGHT - 2 * BAR_VERTICAL_INSET;
/**
 * PRE-7 B.3 (B9, arbitrage A4) : rayon local des boutons et marge horizontale du libellé dans son
 * bouton (valeur d'intégration, même justification que les marges de la barre).
 */
const BAR_BUTTON_RADIUS = 8;
const BAR_BUTTON_INSET = 2;
/** D-434 : largeur minimale d'un bouton (flèche seule comprise), zone tactile préservée. */
const BAR_BUTTON_MIN_WIDTH = 44;
/** D-434 : largeur offerte à la mesure des libellés complets (hors écran, jamais affichée). */
const BAR_MEASURE_WIDTH = 2000;
/** Bouton indisponible (extrémité) : atténué. */
const BAR_DISABLED_OPACITY = 0.35;
/**
 * Barre d'unité des tableaux de Formats — Hermann, 04/11/2026 : « Toutes les apparitions, disparitions de boutons doivent se
 * faire en fondu progressif lent, idem pour le déplacement des boutons » ; « Le bouton sélectionné en position à gauche
 * pendant la frappe, y reste lorsqu'on appuie dessus pour afficher l'autre option, qui elle apparaît à sa droite. Si
 * celle-ci est sélectionnée, elle se déplace lentement vers la gauche et éclipse l'option non sélectionnée. »
 */
const UNIT_ANIMATION_MS = 450;
/** Durée de la première montée quand l'événement du clavier n'en donne aucune. */
const BAR_FALLBACK_DURATION_MS = 250;
/** Courbe proche de celle du clavier iOS. */
const BAR_EASING = Easing.out(Easing.cubic);
/** D-434 : zone tactile de 44 de haut préservée (bouton de 36 + marges), écart partagé de chaque côté. */
const BAR_BUTTON_HIT_SLOP = {
  top: BAR_VERTICAL_INSET,
  bottom: BAR_VERTICAL_INSET,
  left: BAR_SLOT_GAP / 2,
  right: BAR_SLOT_GAP / 2,
};

const labels = strings.executionParameters.sheet.keyboardBar;

/** Décalage de la barre au-dessus du bas de sa zone : hauteur du clavier qui recouvre cette zone. */
export function keyboardBarLift(frame: KeyboardFrame, containerBottom: number): number {
  return Math.max(0, containerBottom - frame.screenY);
}

/** PRE-7 B.3 (B9) : largeur d'un des quatre emplacements égaux, marges et écarts déduits. */
export function keyboardBarSlotWidth(barWidth: number): number {
  return Math.max(0, (barWidth - 2 * BAR_SIDE_INSET - (BAR_SLOT_COUNT - 1) * BAR_SLOT_GAP) / BAR_SLOT_COUNT);
}

/**
 * D-434 ; PRE-7 B.3 (B9, arbitrage A4) : Précédent / Suivant réduits à leurs flèches quand le plus
 * large de leurs libellés complets (`widestLabel`), avec sa marge dans le bouton, ne tient pas dans
 * un emplacement de la barre de largeur `barWidth` ; rien n'est réduit tant que l'une des deux
 * mesures manque.
 */
export function keyboardBarCompact(barWidth: number, widestLabel: number): boolean {
  return barWidth > 0 && widestLabel > 0 && widestLabel + 2 * BAR_BUTTON_INSET > keyboardBarSlotWidth(barWidth);
}

export function KeyboardAccessoryBar({
  keyboardFrame,
  containerBottom,
  reduceMotion,
  onHeight,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  onClose,
  failure = null,
  units = null,
  sign = null,
  option = null,
  animated = false,
}: {
  /**
   * Barre animée : option placée à gauche de « Précédent » (premier emplacement), par exemple « Sans limite » du temps limite d'un
   * Circuit For time (recette iPhone du 06/11/2026, w-circuit-duree, Hermann : « Il faut ajouter l'option "Sans limite" sur la barre
   * d'option du clavier à gauche de "Précédent" »). Ignorée si des unités ou le signe occupent cet emplacement.
   */
  option?: { readonly label: string; readonly selected: boolean; readonly onPress: () => void; readonly testID: string } | null;
  /** Barre des tableaux de Formats : quatre emplacements fixes, apparitions, disparitions et déplacements en fondu lent. */
  animated?: boolean;
  /** Hermann, 04/11/2026 : « l'incrément de charge peut être négatif » ; bouton ± dans la barre du clavier ; « Arrêter à 0 — Les séries concernées passent sans charge (0), une simple mention en gris sous la ligne, sans alerte ni blocage : "sans charge à partir de la série X" » : « ± » inverse le signe de la case (incrément de charge EMOM). */
  sign?: { readonly negative: boolean; readonly onPress: () => void } | null;
  keyboardFrame: KeyboardFrame;
  /** Bas de la zone de la `Modal` qui contient la barre (coordonnées de la fenêtre). */
  containerBottom: number;
  reduceMotion: boolean;
  /** Hauteur mesurée (texte agrandi : jamais rognée), pour la révélation de la ligne active. */
  onHeight: (height: number) => void;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  /** D-434 : « À l'échec » (cellule Cible d'une série), ou `null` (Pause, Charge). */
  failure?: { readonly selected: boolean; readonly onPress: () => void } | null;
  /**
   * Mise à jour consolidée des écrans Formats du 04/11/2026 (§4.5, §6 quater) — unité de l'objectif d'une ligne de
   * tableau. `picking` : la barre propose Répétitions | Durée | Fermer (unités non admises indisponibles) ; sinon
   * l'unité choisie, sélectionnée, puis Précédent, Suivant et Fermer — la toucher repropose les deux unités.
   */
  units?: {
    readonly current: ExecutionMode;
    readonly picking: boolean;
    readonly allowed: readonly ExecutionMode[];
    readonly onPick: (mode: ExecutionMode) => void;
    readonly onReopen: () => void;
  } | null;
}) {
  const lift = keyboardBarLift(keyboardFrame, containerBottom);
  // Première montée : la barre part de sous le bas de sa zone, comme une barre native.
  const [translateY] = useState(() => new Animated.Value(reduceMotion ? -lift : BAR_HEIGHT));
  const firstRef = useRef(true);
  useEffect(() => {
    const first = firstRef.current;
    firstRef.current = false;
    const duration = reduceMotion ? 0 : keyboardFrame.duration > 0 ? keyboardFrame.duration : first ? BAR_FALLBACK_DURATION_MS : 0;
    if (duration === 0) {
      translateY.stopAnimation();
      translateY.setValue(-lift);
      return;
    }
    const animation = Animated.timing(translateY, { toValue: -lift, duration, easing: BAR_EASING, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [translateY, lift, keyboardFrame.duration, reduceMotion]);
  // D-434 ; B9 : largeur de la barre et largeurs naturelles des libellés complets de Précédent et Suivant.
  const [barWidth, setBarWidth] = useState(0);
  const [labelWidths, setLabelWidths] = useState<{ readonly previous: number; readonly next: number }>({ previous: 0, next: 0 });
  const widestLabel = labelWidths.previous > 0 && labelWidths.next > 0 ? Math.max(labelWidths.previous, labelWidths.next) : 0;
  const compact = keyboardBarCompact(barWidth, widestLabel);

  // Barre des tableaux de Formats (`animated`) — Hermann, 04/11/2026 : « Appuyer sur Suivant / Précédent fait apparaître ou
  // disparaître l'unité choisie, active / désactive le bouton Précédent / Suivant. Toutes ces apparitions / disparitions,
  // tous ces changements de format doivent se faire avec fondu progressif lent (même vitesse). » Tous les boutons restent
  // montés : seules leurs opacités et positions changent.
  const [anim] = useState(() => ({
    REPETITIONS: { x: new Animated.Value(0), opacity: new Animated.Value(1) },
    DURATION: { x: new Animated.Value(1), opacity: new Animated.Value(1) },
    units: new Animated.Value(units === null ? 0 : 1),
    sign: new Animated.Value(sign === null ? 0 : 1),
    previous: new Animated.Value(1),
    next: new Animated.Value(1),
  }));
  const otherShown = useRef<boolean | null>(null);
  const hasUnits = units !== null;
  const hasSign = sign !== null;
  const unitsPicking = units?.picking ?? false;
  // Dernière unité affichée, gardée pendant l'effacement de la barre d'unité (case de charge).
  const [shownCurrent, setShownCurrent] = useState<ExecutionMode>(units?.current ?? "REPETITIONS");
  if (units !== null && units.current !== shownCurrent) setShownCurrent(units.current);
  const [shownNegative, setShownNegative] = useState(sign?.negative ?? false);
  if (sign !== null && sign.negative !== shownNegative) setShownNegative(sign.negative);
  useEffect(() => {
    const current = anim[shownCurrent];
    const other = anim[shownCurrent === "DURATION" ? "REPETITIONS" : "DURATION"];
    const first = otherShown.current === null;
    const picking = hasUnits && unitsPicking;
    // L'autre unité réapparaît toujours à droite de l'unité courante.
    if (picking && otherShown.current !== true) other.x.setValue(1);
    otherShown.current = picking;
    const navOpacity = (enabled: boolean) => (picking ? 0 : enabled ? 1 : BAR_DISABLED_OPACITY);
    const targets: [Animated.Value, number][] = [
      [current.x, 0],
      [current.opacity, 1],
      [other.opacity, picking ? 1 : 0],
      [anim.units, hasUnits ? 1 : 0],
      [anim.sign, hasSign ? 1 : 0],
      [anim.previous, navOpacity(canPrevious)],
      [anim.next, navOpacity(canNext)],
    ];
    if (first || reduceMotion) {
      for (const [value, to] of targets) value.setValue(to);
      return;
    }
    const animation = Animated.parallel(
      targets.map(([value, to]) => Animated.timing(value, { toValue: to, duration: UNIT_ANIMATION_MS, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })),
    );
    animation.start();
    return () => animation.stop();
  }, [anim, canNext, canPrevious, hasSign, hasUnits, reduceMotion, shownCurrent, unitsPicking]);
  const slotWidth = keyboardBarSlotWidth(barWidth);
  const step = slotWidth + BAR_SLOT_GAP;

  const button = (
    label: string,
    spoken: string,
    enabled: boolean,
    onPress: () => void,
    testID: string,
    options: { readonly selected?: boolean; readonly primary?: boolean } = {},
  ) => (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityState={options.selected === undefined ? { disabled: !enabled } : { disabled: !enabled, selected: options.selected }}
      hitSlop={BAR_BUTTON_HIT_SLOP}
      style={[styles.slot, styles.button, options.primary ? styles.buttonPrimary : null, enabled ? null : styles.disabled]}
      testID={testID}
    >
      <Text style={[styles.label, options.selected ? styles.labelSelected : null, options.primary ? styles.labelPrimary : null]}>
        {label}
      </Text>
    </Pressable>
  );
  const measureLabel = (label: string, key: "previous" | "next") => (
    <View
      style={styles.measureItem}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setLabelWidths((current) => (current[key] === width ? current : { ...current, [key]: width }));
      }}
      testID={`execution-sheet-keyboard-bar-measure-${key}`}
    >
      <Text style={styles.label}>{label}</Text>
    </View>
  );
  return (
    <Animated.View
      style={[styles.host, { transform: [{ translateY }] }]}
      onLayout={(event) => onHeight(event.nativeEvent.layout.height)}
      testID="execution-sheet-keyboard-bar-host"
    >
      {/* D-434 ; B9 : mesure hors écran des libellés complets de Précédent et Suivant. */}
      <View
        style={styles.measureHost}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID="execution-sheet-keyboard-bar-measure"
      >
        {measureLabel(labels.previous, "previous")}
        {measureLabel(labels.next, "next")}
      </View>
      <View
        style={styles.bar}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setBarWidth((current) => (current === width ? current : width));
        }}
        testID="execution-sheet-keyboard-bar"
      >
        {animated ? (
          // Quatre emplacements fixes ; unités, ± et flèches apparaissent, disparaissent et se déplacent en fondu lent.
          <View style={styles.unitsRow} testID="keyboard-units">
            <Animated.View pointerEvents={hasUnits ? "box-none" : "none"} style={[styles.layer, { opacity: anim.units }]} accessibilityElementsHidden={!hasUnits} importantForAccessibility={hasUnits ? "auto" : "no-hide-descendants"}>
              {(["REPETITIONS", "DURATION"] as const).map((mode) => {
                const isCurrent = shownCurrent === mode;
                const picking = units?.picking ?? false;
                const allowed = units?.allowed.includes(mode) ?? false;
                const enabled = units !== null && allowed && (isCurrent || picking);
                const label = mode === "DURATION" ? labels.duration : labels.repetitions;
                return (
                  <Animated.View
                    key={mode}
                    pointerEvents={units !== null && (isCurrent || picking) ? "auto" : "none"}
                    style={[
                      styles.unitSlot,
                      { width: slotWidth, zIndex: isCurrent ? 2 : 1, opacity: anim[mode].opacity, transform: [{ translateX: Animated.multiply(anim[mode].x, step) }] },
                    ]}
                  >
                    <Pressable
                      onPress={() => {
                        if (units === null) return;
                        if (isCurrent && !units.picking) units.onReopen();
                        else units.onPick(mode);
                      }}
                      disabled={!enabled}
                      accessibilityRole="button"
                      accessibilityLabel={isCurrent && !picking ? labels.unitSpoken.replace("{unit}", label) : label}
                      accessibilityState={{ disabled: !enabled, selected: isCurrent }}
                      hitSlop={BAR_BUTTON_HIT_SLOP}
                      style={[styles.unitButton, styles.button, allowed || units === null ? null : styles.disabled]}
                      testID={mode === "DURATION" ? "keyboard-unit-duration" : "keyboard-unit-repetitions"}
                    >
                      <Text style={[styles.label, isCurrent ? styles.labelSelected : null]}>{label}</Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </Animated.View>
            <Animated.View pointerEvents={hasSign ? "auto" : "none"} style={[styles.unitSlot, { width: slotWidth, opacity: anim.sign }]} accessibilityElementsHidden={!hasSign} importantForAccessibility={hasSign ? "auto" : "no-hide-descendants"}>
              <Pressable
                onPress={() => sign?.onPress()}
                disabled={!hasSign}
                accessibilityRole="button"
                accessibilityLabel={labels.signSpoken}
                accessibilityState={{ disabled: !hasSign, selected: shownNegative }}
                hitSlop={BAR_BUTTON_HIT_SLOP}
                style={[styles.unitButton, styles.button]}
                testID="keyboard-sign"
              >
                <Text style={[styles.label, styles.signLabel]}>{labels.sign}</Text>
              </Pressable>
            </Animated.View>
            {option !== null && !hasUnits && !hasSign ? (
              <View style={[styles.unitSlot, { width: slotWidth }]}>
                {button(option.label, option.label, true, option.onPress, option.testID, { selected: option.selected })}
              </View>
            ) : null}
            <Animated.View pointerEvents={canPrevious && !(hasUnits && unitsPicking) ? "auto" : "none"} style={[styles.unitSlot, { width: slotWidth, left: step, opacity: anim.previous }]}>
              <Pressable
                onPress={onPrevious}
                disabled={!canPrevious}
                accessibilityRole="button"
                accessibilityLabel={labels.previousSpoken}
                accessibilityState={{ disabled: !canPrevious }}
                hitSlop={BAR_BUTTON_HIT_SLOP}
                style={[styles.unitButton, styles.button]}
                testID="execution-sheet-keyboard-previous"
              >
                <Text style={styles.label}>{compact ? labels.previousArrow : labels.previous}</Text>
              </Pressable>
            </Animated.View>
            <Animated.View pointerEvents={canNext && !(hasUnits && unitsPicking) ? "auto" : "none"} style={[styles.unitSlot, { width: slotWidth, left: 2 * step, opacity: anim.next }]}>
              <Pressable
                onPress={onNext}
                disabled={!canNext}
                accessibilityRole="button"
                accessibilityLabel={labels.nextSpoken}
                accessibilityState={{ disabled: !canNext }}
                hitSlop={BAR_BUTTON_HIT_SLOP}
                style={[styles.unitButton, styles.button]}
                testID="execution-sheet-keyboard-next"
              >
                <Text style={styles.label}>{compact ? labels.nextArrow : labels.next}</Text>
              </Pressable>
            </Animated.View>
            <View style={[styles.unitSlot, { width: slotWidth, left: 3 * step }]}>
              {button(labels.close, labels.close, true, onClose, "execution-sheet-keyboard-close", { primary: true })}
            </View>
          </View>
        ) : failure === null ? (
          // B9 (arbitrage A4) : emplacement réservé, vide et non accessible.
          <View
            style={styles.slot}
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            testID="execution-sheet-keyboard-failure-slot"
          />
        ) : (
          button(labels.failure, labels.failure, true, failure.onPress, "execution-sheet-keyboard-failure", {
            selected: failure.selected,
          })
        )}
        {animated ? null : button(
          compact ? labels.previousArrow : labels.previous,
          labels.previousSpoken,
          canPrevious,
          onPrevious,
          "execution-sheet-keyboard-previous",
        )}
        {animated ? null : button(compact ? labels.nextArrow : labels.next, labels.nextSpoken, canNext, onNext, "execution-sheet-keyboard-next")}
        {animated ? null : button(labels.close, labels.close, true, onClose, "execution-sheet-keyboard-close", { primary: true })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Au bas de la zone de la `Modal`, sur toute la largeur, au-dessus de la Feuille.
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  // Hauteur minimale (texte agrandi jamais rogné, story 3.8 AC7) ; B9 : quatre emplacements égaux.
  bar: {
    minHeight: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "stretch",
    gap: BAR_SLOT_GAP,
    paddingHorizontal: BAR_SIDE_INSET,
    paddingVertical: BAR_VERTICAL_INSET,
    backgroundColor: BAR_BACKGROUND,
  },
  // B9 : emplacement de largeur égale (base nulle, même part de la ligne), bouton ou réserve.
  slot: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: BAR_BUTTON_MIN_WIDTH,
    minHeight: BAR_BUTTON_HEIGHT,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: BAR_BUTTON_INSET,
    borderRadius: BAR_BUTTON_RADIUS,
    backgroundColor: colors.background,
  },
  // B9 : Fermer bleu KODJO, texte blanc.
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  disabled: {
    opacity: BAR_DISABLED_OPACITY,
  },
  // Barre d'unité : rangée de la hauteur d'un bouton, emplacements posés en absolu (marges de la barre conservées).
  unitsRow: {
    flex: 1,
    minHeight: BAR_BUTTON_HEIGHT,
  },
  unitSlot: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
  },
  unitButton: {
    flex: 1,
  },
  layer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  // Hermann, 04/11/2026 : « Faire le signe +/− beaucoup plus gros dans son cadre ».
  signLabel: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    fontSize: 26,
    lineHeight: 30,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    fontSize: BAR_FONT_SIZE,
    color: BAR_TEXT_COLOR,
    textAlign: "center",
  },
  // D-434 : « À l'échec » sélectionné (cellule à l'échec) : même texte, en Semi Bold.
  labelSelected: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  labelPrimary: {
    color: colors.background,
  },
  // Mesure : hors écran, invisible, sans effet sur la mise en page de la barre.
  measureHost: {
    position: "absolute",
    top: 0,
    left: 0,
    width: BAR_MEASURE_WIDTH,
    opacity: 0,
    alignItems: "flex-start",
  },
  measureItem: {
    alignSelf: "flex-start",
  },
});
