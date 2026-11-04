import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import { WheelPickerOverlay } from "@/features/sessions/WheelPickerOverlay";
import { strings } from "@/shared/i18n";

/**
 * PRE-9 C.4 (référence Formats du 02/11/2026 §7.5, §11) — roulette de la durée portée par un Circuit
 * porteur : durée de chaque bloc (AMRAP), durée de chaque tour (EMOM, Death by groupé), temps limite
 * (For time, avec « Sans limite »). Roulette native existante (\`DurationWheelPicker\`) ; borne basse 1 s ;
 * rien n'est écrit avant ✓.
 *
 * Contre-recette n° 3 ter du 03/11/2026 (f3-duree, Hermann : « la fenêtre de la roulette s'ouvre dans une
 * modale blanche en fond, on ne voit pas s'il y a quelque chose dedans » ; « sans limite est dans une modale
 * en dehors de la modale de la roulette. Elle doit être dans la modale de la roulette et au dessus de la
 * roulette ») : la roulette s'ouvre dans la superposition des autres roulettes de la Composition
 * (\`WheelPickerOverlay\`), sans feuille blanche autour ; « Sans limite » est l'option placée au-dessus de la
 * roue, dans son cadre (même procédé que l'option « à l'échec » de la cible en Durée), validée par ✓.
 * [Feuille blanche sur voile avec « Sans limite » sous la roulette — remplacée.]
 */
export function CarrierDurationSheet({
  seconds,
  allowsNone,
  onValidate,
  onCancel,
}: {
  readonly seconds: number | null;
  /** For time : « Sans limite » (aucun temps limite). */
  readonly allowsNone: boolean;
  readonly onValidate: (seconds: number | null) => void;
  readonly onCancel: () => void;
}) {
  const wheel = strings.screens.exercise.wheelPicker;
  const t = strings.screens.composition.carrier;
  return (
    <WheelPickerOverlay visible>
      <DurationWheelPicker
        totalSeconds={seconds ?? 0}
        targetBounds={{ min: 1, max: 180 * 60 }}
        maxTotalSeconds={180 * 60}
        onValidate={(value) => onValidate(value)}
        onCancel={onCancel}
        minutesAccessibilityLabel={wheel.minutesAccessibilityLabel}
        secondsAccessibilityLabel={wheel.secondsAccessibilityLabel}
        cancelAccessibilityLabel={wheel.cancelAccessibilityLabel}
        validateAccessibilityLabel={wheel.validateAccessibilityLabel}
        {...(allowsNone ? { failureOption: { label: t.noLimit, initiallySelected: seconds === null, onValidateFailure: () => onValidate(null) } } : {})}
      />
    </WheelPickerOverlay>
  );
}
