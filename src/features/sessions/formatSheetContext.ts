import { roleChoices, setMemberRole } from "@/domain/sessions/circuitRoles";
import { plannedWorkOfParameters } from "@/domain/sessions/formatModels";
import { circuitOfExercise } from "@/domain/sessions/layoutOperations";
import type { CircuitRole, FormatSettings } from "@/domain/sessions/formats";
import type { SessionDraft } from "@/domain/sessions/SessionDraft";
import type { FormatSheetContext, FormatSheetRow } from "@/features/activities/FormatSettingsFrame";
import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { strings } from "@/shared/i18n";

/**
 * PRE-9 (CE-FMT-04 ; référence Formats §3, §6, §10 à §12 ; mise à jour consolidée des écrans Formats du
 * 04/11/2026 §4.4, §6 bis 2) — réglages de Format présentés dans la modale d'un Exercice de la Composition,
 * selon son porteur : Exercice autonome (ou d'un Circuit standard) ou membre d'un Circuit porteur.
 * `undefined` : Exercice sans Format.
 */
export function formatSheetContextOf(
  draft: SessionDraft,
  exerciseId: string,
  update: (change: (current: SessionDraft) => SessionDraft) => void,
): Omit<FormatSheetContext, "onApply"> & { readonly onApply: FormatSheetContext["onApply"] } | undefined {
  const exercise = draft.exercises.find((candidate) => candidate.id === exerciseId);
  const format = exercise?.format ?? null;
  if (exercise === undefined || format === null) return undefined;
  const circuit = circuitOfExercise(draft.structure, exerciseId);
  const carrier = circuit !== undefined && (circuit.format ?? null) !== null ? circuit : undefined;
  const rows: FormatSheetRow[] = [];
  let role: FormatSheetContext["role"];
  let inheritedCapText: string | undefined;
  let emom: FormatSheetContext["emom"];
  switch (format.key) {
    case "AMRAP":
      if (carrier === undefined) rows.push("duration", "increment");
      else {
        const choices = roleChoices(draft, draft.structure, exerciseId);
        if (choices !== null) role = choices;
        rows.push("role", "increment");
      }
      break;
    case "FOR_TIME":
      if (carrier === undefined) rows.push("timeCap");
      else {
        const choices = roleChoices(draft, draft.structure, exerciseId);
        if (choices !== null) role = choices;
        rows.push("role", "inheritedCap");
        const cap = carrier.format?.settings.timeCapSeconds;
        inheritedCapText = typeof cap === "number" ? `≤ ${formatPhraseDuration(cap)}` : strings.executionParameters.format.noLimit;
      }
      break;
    case "EMOM": {
      if (carrier === undefined) {
        rows.push("interval");
        emom = { windowSeconds: null, othersWorkSeconds: 0 };
      } else {
        // Dans chaque intervalle : intervalle commun du Circuit, somme du travail prévu des membres.
        const window = carrier.format?.settings.windowSeconds;
        const others = carrier.exercises
          .filter((id) => id !== exerciseId)
          .map((id) => draft.exercises.find((candidate) => candidate.id === id))
          .reduce((sum, member) => sum + (member === undefined ? 0 : plannedWorkOfParameters(member.executionParameters)), 0);
        emom = { windowSeconds: typeof window === "number" ? window : 60, othersWorkSeconds: others };
      }
      break;
    }
    case "DEATH_BY":
      if (carrier === undefined) rows.push("interval", "increment", "stopImposed");
      else if (carrier.nature === "SERIES") rows.push("interval", "increment", "stopImposed");
      else rows.push("increment", "stopImposed");
      break;
    default:
      break;
  }
  const settings = format.settings;
  return {
    key: format.key,
    rows,
    settings,
    ...(role !== undefined ? { role } : {}),
    ...(inheritedCapText !== undefined ? { inheritedCapText } : {}),
    ...(emom !== undefined ? { emom } : {}),
    onApply: (next: FormatSettings, nextRole: CircuitRole | null) =>
      update((current) => {
        const withSettings: SessionDraft = {
          ...current,
          exercises: current.exercises.map((candidate) =>
            candidate.id === exerciseId && candidate.format !== undefined && candidate.format !== null
              ? { ...candidate, format: { key: candidate.format.key, settings: { ...next, ...rolePreserved(candidate.format.settings) } } }
              : candidate,
          ),
        };
        return nextRole === null ? withSettings : setMemberRole(withSettings, exerciseId, nextRole);
      }),
  };
}

/** Le Rôle n'est changé que par `setMemberRole` (replacement dans sa zone). */
function rolePreserved(settings: FormatSettings): FormatSettings {
  const kept: Record<string, FormatSettings[string]> = {};
  if (settings.circuitRole !== undefined) kept.circuitRole = settings.circuitRole;
  if (settings.passageOnce !== undefined) kept.passageOnce = settings.passageOnce;
  return kept;
}
