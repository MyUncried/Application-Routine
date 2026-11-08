import { useEffect, useRef, useState } from "react";
import { Keyboard, Platform, StyleSheet, View, useWindowDimensions, type TextInput } from "react-native";

import { KeyboardAccessoryBar } from "@/features/activities/KeyboardAccessoryBar";
import type { KeyboardFrame } from "@/features/activities/useSheetKeyboard";
import { formatSeconds, TableCell } from "@/features/sessions/FormatTables";
import { strings } from "@/shared/i18n";
import { spacing } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

/**
 * Saisie en place d'une durée de la Composition : durée portée par un Circuit porteur (PRE-9 C.4, référence Formats du
 * 02/11/2026 §7.5, §11 — durée de chaque bloc AMRAP, de chaque tour EMOM / Death by groupé, temps limite For time avec « Sans
 * limite ») et bornes de la Séance (Compte à rebours initial, Fin de séance : 0..60 s, D-443).
 *
 * Recette iPhone du 07/11/2026 (a-bornes-clavier, Hermann : « Une fenêtre volante se présente en haut de l'écran. La supprimer.
 * Le focus est directement dans le champ sélectionné, qui doit toujours être au dessus de la barre d'options du clavier donc :
 * si le champ était déjà au dessus, rien ne bouge / si le champ était en dessous, toute la composition s'élève pour que ce champ
 * soit au dessus. C'est le même problème à corriger pour le champ du durée au niveau du circuit. ») et du 06/11/2026
 * (w-circuit-duree : « Il faut ajouter l'option "Sans limite" sur la barre d'option du clavier à gauche de "Précédent" ») : la
 * valeur touchée devient elle-même la case de saisie (`TableCell` des Formats, clavier numérique « MM:SS » rempli par la droite),
 * focalisée ; la Composition remonte si la case passe sous la barre du clavier ; la barre (`KeyboardAccessoryBar` des Formats)
 * porte « Sans limite » pour le temps limite. « Fermer », « Sans limite » ou la perte du focus appliquent la saisie. Case vidée :
 * valeur précédente gardée, sauf le Temps limite qui repasse à « Sans limite » ; valeur inchangée : rien n'est écrit.
 * [Carte flottante dans une `Modal` en haut de l'écran, voile appliquant la saisie (décision du 06/11/2026, constat c) —
 * remplacée le 08/11/2026.]
 */
export type DurationEntry = {
  /** Valeur enregistrée à l'ouverture. */
  readonly seconds: number | null;
  /** Valeur en cours de saisie (`null` : case vide). */
  readonly value: number | null;
  /** For time : « Sans limite » (aucun temps limite). */
  readonly allowsNone: boolean;
  readonly label: string;
  readonly durationMin: number;
  readonly durationMax?: number;
};

/** Valeur appliquée à la fermeture : case vidée → valeur précédente (sauf « Sans limite ») ; plafond éventuel. */
export function durationEntryResult(entry: DurationEntry): { readonly changed: boolean; readonly next: number | null } {
  const entered = entry.value === null && !entry.allowsNone ? entry.seconds : entry.value;
  const next = entered !== null && entry.durationMax !== undefined ? Math.min(entered, entry.durationMax) : entered;
  return { changed: next !== entry.seconds, next };
}

/** Marge entre le bas de la case et le haut de la barre du clavier. */
const ENTRY_KEYBOARD_MARGIN = spacing[16];
/** Hauteur de la barre du clavier avant sa mesure. */
const BAR_HEIGHT_FALLBACK = 52;

/**
 * Case de saisie posée à la place de la valeur. `keyboardTop` (haut du clavier, repère de la fenêtre) et `barHeight` : si la case
 * passe sous la barre du clavier, `scrollBy` fait remonter la Composition de l'écart ; sinon rien ne bouge.
 */
export function InlineDurationField({
  entry,
  onChange,
  onBlur,
  keyboardTop,
  barHeight,
  scrollBy,
}: {
  readonly entry: DurationEntry;
  readonly onChange: (value: number | null) => void;
  readonly onBlur: () => void;
  readonly keyboardTop: number | null;
  readonly barHeight: number;
  readonly scrollBy: (delta: number) => void;
}) {
  const t = strings.screens.composition.carrier;
  const inputRef = useRef<TextInput | null>(null);
  const boxRef = useRef<View | null>(null);
  // Le focus est directement dans la case : clavier numérique ouvert.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    if (keyboardTop === null) return undefined;
    const frame = requestAnimationFrame(() => {
      boxRef.current?.measureInWindow((_x, y, _width, height) => {
        const overlap = y + height + ENTRY_KEYBOARD_MARGIN + (barHeight > 0 ? barHeight : BAR_HEIGHT_FALLBACK) - keyboardTop;
        if (overlap > 0) scrollBy(overlap);
      });
    });
    return () => cancelAnimationFrame(frame);
    // Mesure à l'ouverture du clavier (ou à son changement de hauteur) seulement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardTop]);
  return (
    <View ref={boxRef} collapsable={false} testID="carrier-duration-field">
      <TableCell
        kind="duration"
        value={entry.value}
        format={formatSeconds}
        placeholder={entry.allowsNone ? t.noLimit : undefined}
        badge
        durationMin={entry.durationMin}
        onChange={onChange}
        onBlur={onBlur}
        inputRef={(input) => {
          inputRef.current = input;
        }}
        label={entry.label}
        testID="carrier-duration-input"
      />
    </View>
  );
}

/**
 * Barre du clavier de la saisie en place, posée au niveau de l'écran (calque plein écran sans toucher propre) : Sans limite
 * (temps limite), Précédent / Suivant indisponibles, Fermer.
 */
export function InlineDurationKeyboardBar({
  keyboardFrame,
  allowsNone,
  noneSelected,
  onNone,
  onClose,
  onHeight,
}: {
  readonly keyboardFrame: KeyboardFrame | null;
  readonly allowsNone: boolean;
  readonly noneSelected: boolean;
  readonly onNone: () => void;
  readonly onClose: () => void;
  readonly onHeight: (height: number) => void;
}) {
  const t = strings.screens.composition.carrier;
  const reduceMotion = useReduceMotion();
  const { height: windowHeight } = useWindowDimensions();
  const layerRef = useRef<View | null>(null);
  const [layerBottom, setLayerBottom] = useState(windowHeight);
  if (Platform.OS !== "ios" || keyboardFrame === null) return null;
  return (
    <View
      ref={layerRef}
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      onLayout={() => layerRef.current?.measureInWindow((_x, y, _width, height) => setLayerBottom(y + height))}
      testID="carrier-duration-keyboard-layer"
    >
      <KeyboardAccessoryBar
        keyboardFrame={keyboardFrame}
        containerBottom={layerBottom}
        reduceMotion={reduceMotion}
        onHeight={onHeight}
        canPrevious={false}
        canNext={false}
        onPrevious={() => undefined}
        onNext={() => undefined}
        onClose={onClose}
        option={allowsNone ? { label: t.noLimit, selected: noneSelected, onPress: onNone, testID: "carrier-duration-no-limit" } : null}
        animated
      />
    </View>
  );
}

/** Cadre du clavier (haut, coordonnées de la fenêtre), `null` clavier fermé — événements `Keyboard` standards. */
export function useDurationKeyboardFrame(active: boolean): KeyboardFrame | null {
  const [frame, setFrame] = useState<KeyboardFrame | null>(null);
  useEffect(() => {
    if (!active) return undefined;
    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", (event) =>
      setFrame({ screenY: event.endCoordinates.screenY, duration: event.duration ?? 0 }),
    );
    const hide = Keyboard.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", () => setFrame(null));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [active]);
  // Saisie terminée : aucun cadre (le prochain `keyboardWillShow` le renseigne).
  return active ? frame : null;
}
