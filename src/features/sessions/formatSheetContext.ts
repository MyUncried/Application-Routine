import { forTimeDurationRefused, roleChoices, setMemberRole } from "@/domain/sessions/circuitRoles";
import { forTimeRoleChangeLoss, seriesCountOf } from "@/domain/sessions/forTimeSeries";
import { plannedWorkOfParameters } from "@/domain/sessions/formatModels";
import { circuitOfExercise } from "@/domain/sessions/layoutOperations";
import { circuitRoleOf, type CircuitRole, type FormatSettings } from "@/domain/sessions/formats";
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
  let roleChangeLoss: FormatSheetContext["roleChangeLoss"];
  let seriesForRole: FormatSheetContext["seriesForRole"];
  // Recette du 17/11/2026 (Hermann, autres remarques, a : « je suis capable de créer un for time avec deux exercices en durée si j'entre les paramètres dans la composition de séance. Par contre le démarrage de la est bloqué ») ; règle du 05/11/2026 (n-charge-colonne : « Pour le seul exercice restant en Répétitions, l'option Durée est désactivée, avec un message court ») et du 16/11/2026 (mp-duree-refusee : « Il faut au moins un exercice en répétition sur les exercices en boucle »).
  const durationRefused = forTimeDurationRefused(draft, draft.structure, exerciseId);
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
      if (carrier === undefined) rows.push("timeCap", "stopTarget");
      else {
        const choices = roleChoices(draft, draft.structure, exerciseId);
        // Même règle : le seul Exercice de la boucle en Répétitions ne passe ni en Buy-in ni en Buy-out (la boucle n'en aurait plus).
        if (choices !== null) role = durationRefused ? { ...choices, available: choices.available.filter((candidate) => candidate === "TOUR") } : choices;
        // Règles de Hermann du 14/11/2026, FT-6 : « À l'échec » n'est pas proposé en For time (« À l'objectif » seul).
        rows.push("role", "inheritedCap", "stopTarget");
        const cap = carrier.format?.settings.timeCapSeconds;
        inheritedCapText = typeof cap === "number" ? `≤ ${formatPhraseDuration(cap)}` : strings.executionParameters.format.noLimit;
        // Correction 2 de Hermann du 14/11/2026, règle 5 : valeurs retirées par un changement de Rôle, annoncées avant.
        roleChangeLoss = (nextRole, parameters) => {
          const lost = forTimeRoleChangeLoss(draft, exerciseId, nextRole, parameters);
          return { lost, kept: seriesCountOf(parameters) - lost };
        };
        // Précision de Hermann du 14/11/2026 (soir) : « le for Time a un nombre de tours. Dans la composition de séance si je transforme un exercice Buy In ou Buy Out en un exercice Tour, il doit héritier du nombre de Tours du circuit » : même ajustement que l'enregistrement du Rôle (`setMemberRole`), montré dans la modale dès le choix.
        seriesForRole = (nextRole, parameters) => {
          const placed = { ...draft, exercises: draft.exercises.map((candidate) => (candidate.id === exerciseId ? { ...candidate, executionParameters: parameters } : candidate)) };
          return setMemberRole(placed, exerciseId, nextRole).exercises.find((candidate) => candidate.id === exerciseId)?.executionParameters ?? parameters;
        };
        // [Demande du 14/11/2026 (soir) : séries ajoutées ou retirées pour tout le bloc, pertes annoncées — retiré le 14/11/2026,
        // recette m2 et m3 : « Les exercices de buy in (et de buy out) sont indépendants ».]
      }
      break;
    case "EMOM": {
      // Décisions de Hermann du 07/11/2026 (EMOM, points A2, A3, A5, A8, B, B9 ; Figma `8795:14588` et `8598:30515`) : « À l'échec » désactivé partout ; seul ou à la suite — Intervalle, Durée de l'exercice en lecture
      // seule, Récupération ; en alternance (Circuit standard alterné) — Récupération absente ; dans chaque intervalle
      // (Circuit porteur) — ni Intervalle, ni Durée de l'exercice, ni Récupération. Jamais de Pause (feuille).
      rows.push("stopTarget");
      if (carrier === undefined) {
        rows.push("interval", "durationReadOnly");
        if (circuit !== undefined && circuit.nature === "SERIES") rows.push("noRecovery");
        emom = { windowSeconds: null, othersWorkByRank: [] };
      } else {
        rows.push("noRecovery");
        // Dans chaque intervalle : intervalle commun du Circuit, somme du travail prévu des membres.
        const window = carrier.format?.settings.windowSeconds;
        // Complément du 5 novembre 2026 (Hermann), §14 : somme des autres membres rang par rang.
        const members = carrier.exercises
          .filter((id) => id !== exerciseId)
          .map((id) => draft.exercises.find((candidate) => candidate.id === id))
          .filter((member) => member !== undefined);
        const ranks = Math.max(carrier.repeatCount, 1);
        const othersWorkByRank = Array.from({ length: ranks }, (_, rank) => members.reduce((sum, member) => sum + plannedWorkOfParameters(member.executionParameters, rank), 0));
        emom = { windowSeconds: typeof window === "number" ? window : 60, othersWorkByRank };
      }
      break;
    }
    case "DEATH_BY":
      // Recette iPhone du 07/11/2026 (Figma « Death by — Modale exercice, standard » `8598:31210` et « …, dans chaque intervalle » `11373:20396` ; référence Formats §12 et §14) : Séries « Jusqu'à l'échec » pour l'Exercice autonome ; aucune ligne Séries dans un Circuit porteur.
      if (carrier === undefined) rows.push("seriesUntilFailure", "interval", "increment", "stopImposed");
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
    ...(roleChangeLoss !== undefined ? { roleChangeLoss } : {}),
    ...(seriesForRole !== undefined ? { seriesForRole } : {}),
    ...(durationRefused ? { durationRefused } : {}),
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

/**
 * Ligne Séries de la modale comptée en tours (mission du 16/11/2026, écart b : « exercice en boucle : libellé « tours identiques /
 * variables » au lieu de « séries identiques / variables » » ; Décision de Hermann du 16/11/2026 (« la modale des paramètres d’exécution doit être la même qu’on l’ouvre de la composition de séance ou de l’écran d’un format, les effets de changement de rôle sont aussi identiques »)) : exercice en tour d'un For time ou d'un AMRAP joué en
 * alternance, ou membre d'un Superset. Sinon : séries.
 */
export function seriesWordingOf(draft: SessionDraft, exerciseId: string): "rounds" | "series" {
  const circuit = circuitOfExercise(draft.structure, exerciseId);
  if (circuit === undefined || circuit.nature !== "SERIES") return "series";
  if (circuit.originModel === "SUPERSET") return "rounds";
  const key = circuit.format?.key;
  if (key !== "FOR_TIME" && key !== "AMRAP") return "series";
  const exercise = draft.exercises.find((candidate) => candidate.id === exerciseId);
  return exercise !== undefined && circuitRoleOf(exercise.format, circuit.exercises.indexOf(exerciseId)) === "TOUR" ? "rounds" : "series";
}

/** Le Rôle n'est changé que par `setMemberRole` (replacement dans sa zone). */
function rolePreserved(settings: FormatSettings): FormatSettings {
  const kept: Record<string, FormatSettings[string]> = {};
  if (settings.circuitRole !== undefined) kept.circuitRole = settings.circuitRole;
  if (settings.passageOnce !== undefined) kept.passageOnce = settings.passageOnce;
  return kept;
}
