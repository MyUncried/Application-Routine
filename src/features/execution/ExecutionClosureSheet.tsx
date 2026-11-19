import type { FormatView } from "@/domain/execution/projection";

import { ExecutionPartialRepetitionsSheet } from "./ExecutionPartialRepetitionsSheet";
import { executionStrings as t, formatClock } from "./executionStrings";

/**
 * PRE-11 (T1) — Clôture d'un élément formaté (D3, §12.5) : la Durée maximum du For time a interrompu une série ; son résultat est
 * demandé.
 *
 * Troisième recette du 17/11/2026 (ftr3-modale-duree, Hermann : « Arrêt à l'issue du temps limite : Titre : Arrêt du For Time ; Un
 * bouton Valider ; Nom de l'exercice en cours ; Objectif : selon le type d'exercice ; Durée retenue ou roulette horizontale en fonction
 * du type d'exercice ; Pas de bouton d'action en bas » ; « Respecter pour les trois modales un format et une disposition homogène ») :
 * même feuille que l'Arrêt (`ExecutionPartialRepetitionsSheet`), sans croix (la Clôture est bloquante, D3). [En-tête « Vos résultats »,
 * rappel « Limite atteinte · durée », bouton Valider en bas — remplacés.]
 */
export function ExecutionClosureSheet({
  format,
  heldDurationMs,
  bottomInset,
  onSubmit,
}: {
  readonly format: FormatView;
  /** Exercice en durée interrompu : durée tenue jusqu'à la Durée maximum (relevée par l'écran) ; `null` sinon. */
  readonly heldDurationMs: number | null;
  readonly bottomInset: number;
  readonly onSubmit: (payload: { readonly partialRepetitions?: number; readonly partialDurationMs?: number }) => void;
}) {
  const interrupted = format.interrupted;
  const duration = interrupted !== null && interrupted.mode === "DURATION";
  const objective = interrupted?.target;
  const targetText =
    objective?.kind !== "NUMBER" ? null : duration ? formatClock(objective.value * 1000) : t.stopRepetitions(objective.value);
  return (
    <ExecutionPartialRepetitionsSheet
      exerciseName={interrupted?.name ?? format.name}
      targetText={targetText}
      inSeries={interrupted !== null && !duration}
      heldDurationMs={duration ? (heldDurationMs ?? 0) : null}
      cancellable={false}
      bottomInset={bottomInset}
      onConfirm={(partialRepetitions, partialDurationMs) =>
        onSubmit({
          ...(partialRepetitions !== null ? { partialRepetitions } : {}),
          ...(typeof partialDurationMs === "number" ? { partialDurationMs } : {}),
        })
      }
      testID="execution-closure"
    />
  );
}
