import { isBilateral, type ExecutionMode, type SeriesTarget } from "@/domain/activities/ExecutionParameters";
import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import type { CircuitVolumeRow, CircuitVolumes } from "@/domain/sessions/circuit";
import { formatTwoDigits } from "@/features/sessions/wheelPickerMath";
import { strings } from "@/shared/i18n";

/**
 * PRE-6 story 3.4 (CE-CIR-03, AD-39) — présentation pure de la feuille « Volumes du circuit »,
 * à partir de la seule grille du Domaine (`circuitVolumes`, story 1.4) : aucune règle de
 * calcul ici, seulement le formatage des cibles.
 *
 * - Valeur : Répétitions → nombre ; Durée → `m:ss` (45 s → « 0:45 ») ; cible à l'échec → « ✓ » ;
 *   cible à renseigner → « — » ; série inexistante → « — » (jamais 0).
 * - Unité : « rép. » / « durée » selon le Mode ; « À l'échec » quand toutes les cibles de la ligne
 *   sont à l'échec ; « — » sans Mode.
 * - Bilatéral : valeur par côté, jamais doublée (la cible est déjà par côté) ; indicateur neutre
 *   de changement de côté, sans direction (RM-243).
 * - Annonce VoiceOver d'une ligne : « {exercice}[, changement de côté], série 1 : 10 répétitions,
 *   série 2 : pas de série… » ; « ✓ » annoncé « à l'échec », « — » annoncé « pas de série » ou
 *   « à renseigner ».
 */

export type CircuitVolumeCellPresentation = {
  /** Texte affiché dans la cellule. */
  readonly text: string;
  /** Valeur annoncée (sans le rang de série). */
  readonly spoken: string;
};

export type CircuitVolumeRowPresentation = {
  readonly occurrenceId: string;
  readonly name: string;
  /** Indicateur neutre de changement de côté près du nom (RM-243, sans direction). */
  readonly isBilateral: boolean;
  /** Une cellule par colonne S1..Smax. */
  readonly cells: readonly CircuitVolumeCellPresentation[];
  readonly unit: string;
  /** Ligne lue comme un seul élément accessible. */
  readonly accessibilityLabel: string;
};

export type CircuitVolumesPresentation = {
  /** En-têtes « S1 » … « Smax ». */
  readonly seriesColumns: readonly string[];
  readonly rows: readonly CircuitVolumeRowPresentation[];
};

const t = strings.screens.composition.circuit.volumes;

/** Durée d'une cible au format `m:ss` (CE-CIR-03 §19) : 45 → « 0:45 », 90 → « 1:30 ». */
export function formatVolumeDuration(totalSeconds: number): string {
  return `${Math.floor(totalSeconds / 60)}:${formatTwoDigits(totalSeconds % 60)}`;
}

function spokenNumber(mode: ExecutionMode | null, value: number): string {
  switch (mode) {
    case "REPETITIONS":
      return (value === 1 ? t.spoken.repetitionsSingular : t.spoken.repetitionsPlural).replace("{n}", String(value));
    case "DURATION":
      return formatPhraseDuration(value);
    default:
      return String(value);
  }
}

export function formatVolumeCell(
  mode: ExecutionMode | null,
  cell: SeriesTarget | null,
): CircuitVolumeCellPresentation {
  // Cellule sans série (colonne au-delà des séries de l’exercice) — jamais une Cible nulle.
  if (cell === null) {
    return { text: t.missingValue, spoken: t.spoken.noSeries };
  }
  const target = cell;
  switch (target.kind) {
    case "FAILURE":
      return { text: t.failureValue, spoken: t.spoken.failure };
    case "UNSET":
      return { text: t.missingValue, spoken: t.spoken.unset };
    case "NUMBER":
      return {
        text: mode === "DURATION" ? formatVolumeDuration(target.value) : String(target.value),
        spoken: spokenNumber(mode, target.value),
      };
  }
}

/** Unité d'une ligne : « À l'échec » si toutes ses cibles le sont, sinon celle du Mode. */
export function formatVolumeUnit(row: Pick<CircuitVolumeRow, "mode" | "cells">): string {
  const targets = row.cells.filter((cell): cell is SeriesTarget => cell !== null);
  if (targets.length > 0 && targets.every((target) => target.kind === "FAILURE")) {
    return t.units.FAILURE;
  }
  return row.mode === null ? t.missingValue : t.units[row.mode];
}

export function formatCircuitVolumes(volumes: CircuitVolumes): CircuitVolumesPresentation {
  const seriesColumns = Array.from({ length: volumes.seriesColumnCount }, (_, index) =>
    t.columns.series.replace("{n}", String(index + 1)),
  );
  const sideChange = strings.screens.composition.occurrenceCard.accessibilitySideChange;
  const rows = volumes.rows.map((row): CircuitVolumeRowPresentation => {
    // Exactement Smax cellules : une cellule absente vaut une série inexistante (« — »).
    const cells = seriesColumns.map((_, index) => formatVolumeCell(row.mode, row.cells[index] ?? null));
    const bilateral = isBilateral(row.sideMode);
    const accessibilityLabel = [
      row.name,
      ...(bilateral ? [sideChange] : []),
      ...cells.map((cell, index) =>
        t.spoken.series.replace("{n}", String(index + 1)).replace("{value}", () => cell.spoken),
      ),
    ].join(", ");
    return {
      occurrenceId: row.occurrenceId,
      name: row.name,
      isBilateral: bilateral,
      cells,
      unit: formatVolumeUnit(row),
      accessibilityLabel,
    };
  });
  return { seriesColumns, rows };
}
