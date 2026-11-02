import type { ElementFormat } from "@/domain/sessions/formats";
import type { CircuitNature } from "@/domain/sessions/circuit";
import type { CarrierHeader } from "@/features/sessions/CircuitHeader";
import { strings } from "@/shared/i18n";

/**
 * PRE-9 C.4 (référence Formats du 02/11/2026 §1, §5, §10 à §12 ; CE-FMT-03) — en-tête d'un Circuit
 * porteur : nom du Format, unité du compte, durée portée par le Circuit et réglage qu'elle édite.
 */

function formatMinutes(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} s`;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest}`;
}

/** Réglage de durée édité par le toucher de l'en-tête ; `null` : aucun (Death by alterné). */
export function carrierDurationSetting(format: ElementFormat, nature: CircuitNature): "blockSeconds" | "windowSeconds" | "timeCapSeconds" | null {
  switch (format.key) {
    case "AMRAP":
      return "blockSeconds";
    case "EMOM":
      return "windowSeconds";
    case "DEATH_BY":
      return nature === "TOURS" ? "windowSeconds" : null;
    case "FOR_TIME":
      return "timeCapSeconds";
    default: {
      const unreachable: never = format.key;
      return unreachable;
    }
  }
}

export function carrierHeaderOf(
  circuit: { readonly nature: CircuitNature; readonly format?: ElementFormat | null },
  onPressDuration: (() => void) | undefined,
): CarrierHeader | undefined {
  const format = circuit.format ?? null;
  if (format === null) return undefined;
  const t = strings.screens.composition.carrier;
  const title = strings.screens.sessionModels.cards[format.key].title;
  const setting = carrierDurationSetting(format, circuit.nature);
  const value = setting === null ? undefined : format.settings[setting];
  const seconds = typeof value === "number" ? value : null;
  const duration =
    setting === null
      ? null
      : setting === "timeCapSeconds"
        ? seconds === null
          ? { text: t.noLimit, tone: "MUTED" as const }
          : { text: `≤ ${formatMinutes(seconds)}`, tone: "EDITABLE" as const }
        : { text: seconds === null ? "—" : formatMinutes(seconds), tone: "EDITABLE" as const };
  const durationLabel = setting === null ? undefined : `${t.durationLabels[setting]}, ${duration?.text ?? ""}`;
  return {
    title,
    unit: format.key === "DEATH_BY" ? null : format.key === "AMRAP" ? t.blockUnit : t.roundUnit,
    openLabel: t.untilFailure,
    duration,
    ...(setting !== null && onPressDuration !== undefined ? { onPressDuration } : {}),
    ...(durationLabel !== undefined ? { durationAccessibilityLabel: durationLabel } : {}),
  };
}
