import { useEffect, useRef, useState } from "react";
import { Keyboard, Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions, type TextInput } from "react-native";

import { KeyboardAccessoryBar } from "@/features/activities/KeyboardAccessoryBar";
import type { KeyboardFrame } from "@/features/activities/useSheetKeyboard";
import { formatSeconds, TableCell } from "@/features/sessions/FormatTables";
import { strings } from "@/shared/i18n";
import { colors, spacing } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

/**
 * PRE-9 C.4 (référence Formats du 02/11/2026 §7.5, §11) — durée portée par un Circuit porteur : durée de
 * chaque bloc (AMRAP), durée de chaque tour (EMOM, Death by groupé), temps limite (For time, avec « Sans
 * limite »). Borne basse 1 s ; rien n'est écrit avant la validation.
 *
 * [Roulette native (`DurationWheelPicker`) dans la superposition des roulettes de la Composition
 * (`WheelPickerOverlay`), « Sans limite » au-dessus de la roue, ✓ / ✕ (contre-recette n° 3 ter du
 * 03/11/2026) — remplacée le 06/11/2026, décision de Hermann (constat c : « Paramètre d'exécution :
 * n'utiliser que le clavier pour entrer les valeurs des champs, plus aucune roulette ou popover. Idem
 * pour la durée d'un circuit formaté dans la composition de séances. ») :] la durée se saisit au
 * clavier numérique, avec la case et la barre du clavier des tableaux de Formats (`TableCell` en
 * pastille, `KeyboardAccessoryBar` en fondu lent) : « MM:SS » rempli par la droite, « 00:00 » de
 * guidage, curseur à droite. La case s'ouvre focalisée ; « Fermer » (barre du clavier) ou un toucher du
 * voile applique la saisie. Règle des lignes de paramètres des Formats (Hermann, 05/11/2026) : une case
 * vidée garde la valeur précédente, sauf le Temps limite qui repasse à « Sans limite ». Valeur
 * inchangée : rien n'est écrit (`onCancel`). Un refus de l'appelant (contrôle EMOM) laisse la case
 * ouverte. La saisie « MM:SS » plafonne à 99:59 (case des Formats).
 */
export function CarrierDurationSheet({
  seconds,
  allowsNone,
  label,
  onValidate,
  onCancel,
  durationMin = 1,
  durationMax,
}: {
  readonly seconds: number | null;
  /** For time : « Sans limite » (aucun temps limite). */
  readonly allowsNone: boolean;
  /** Libellé de la durée (« Durée de chaque bloc »…) ; par défaut, celui du Temps limite si `allowsNone`. */
  readonly label?: string;
  readonly onValidate: (seconds: number | null) => void;
  readonly onCancel: () => void;
  /** Bornes de la saisie (Compte à rebours initial et Fin de séance de la Composition : 0..60 s). Par défaut 1 s..99:59. */
  readonly durationMin?: number;
  readonly durationMax?: number;
}) {
  const t = strings.screens.composition.carrier;
  const shownLabel = label ?? (allowsNone ? t.durationLabels.timeCapSeconds : "");
  const [value, setValue] = useState<number | null>(seconds);
  const inputRef = useRef<TextInput | null>(null);
  const keyboardFrame = useCarrierKeyboardFrame();
  const reduceMotion = useReduceMotion();
  const { height: windowHeight } = useWindowDimensions();
  // La case s'ouvre focalisée : clavier numérique ouvert.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const close = () => {
    Keyboard.dismiss();
    // Case vidée : la valeur précédente est gardée, sauf « Sans limite » (For time).
    const entered = value === null && !allowsNone ? seconds : value;
    const next = entered !== null && durationMax !== undefined ? Math.min(entered, durationMax) : entered;
    if (next === seconds) onCancel();
    else onValidate(next);
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={close} testID="carrier-duration-sheet">
      <Pressable style={styles.backdrop} onPress={close} accessible={false} testID="carrier-duration-backdrop">
        <View style={styles.card} onStartShouldSetResponder={() => true} testID="carrier-duration-card">
          <Text style={styles.label} numberOfLines={2}>
            {shownLabel}
          </Text>
          <TableCell
            kind="duration"
            value={value}
            format={formatSeconds}
            placeholder={allowsNone ? t.noLimit : undefined}
            badge
            durationMin={durationMin}
            onChange={setValue}
            inputRef={(input) => {
              inputRef.current = input;
            }}
            label={shownLabel === "" ? t.durationLabels.blockSeconds : shownLabel}
            testID="carrier-duration-input"
          />
        </View>
      </Pressable>
      {Platform.OS === "ios" && keyboardFrame !== null ? (
        <KeyboardAccessoryBar
          keyboardFrame={keyboardFrame}
          containerBottom={windowHeight}
          reduceMotion={reduceMotion}
          onHeight={() => undefined}
          canPrevious={false}
          canNext={false}
          onPrevious={() => undefined}
          onNext={() => undefined}
          onClose={close}
          animated
        />
      ) : null}
    </Modal>
  );
}

/** Cadre du clavier (haut, coordonnées de la fenêtre), `null` clavier fermé — événements `Keyboard` standards. */
function useCarrierKeyboardFrame(): KeyboardFrame | null {
  const [frame, setFrame] = useState<KeyboardFrame | null>(null);
  useEffect(() => {
    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", (event) =>
      setFrame({ screenY: event.endCoordinates.screenY, duration: event.duration ?? 0 }),
    );
    const hide = Keyboard.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", () => setFrame(null));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return frame;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: "flex-start",
    paddingTop: spacing[24] * 4,
    paddingHorizontal: spacing[16],
  },
  // Carte de la case : ligne de paramètre des Formats (libellé à gauche, pastille à droite), au-dessus du clavier.
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[12],
    minHeight: 52,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  label: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.textPrimary,
  },
});
