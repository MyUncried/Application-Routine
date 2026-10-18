/**
 * PRE-3 — générateur pur de la phrase des paramètres d'exécution
 * (`SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1.md`, corpus v15 de 276 cas).
 *
 * Retourne des segments ordonnés `{texte, gras}` émis DIRECTEMENT par le
 * gabarit — jamais une chaîne redécoupée a posteriori, jamais de Markdown.
 * La concaténation des `texte` restitue la phrase exacte. Le total est
 * fourni par l'autorité de calcul (`executionCalculations.ts`) ; aucun
 * montant d'exemple n'est lu. Aucune phrase ni aucun segment n'est
 * persisté : la phrase est régénérée à chaque affichage.
 *
 * Générateur francophone uniquement (décision MVP, §6 de la spécification) :
 * ordre des groupes, accords et ponctuation dépendent de la langue, ces
 * segments ne sont pas des fragments à traduire isolément.
 */

import {
  allTargetsFailure,
  isBilateral,
  isNumberTarget,
  normalizeEffective,
  seriesCountOf,
  seriesRowsOf,
  type ExecutionParametersInput,
} from "./ExecutionParameters";
import { formatPhraseDuration } from "./durationFormat";
import { computeIntrinsicDuration, isCalculable, type ExerciseDurationResult } from "./executionCalculations";

export type PhraseSegment = {
  readonly texte: string;
  readonly gras: boolean;
};

class SegmentBuilder {
  private readonly segments: PhraseSegment[] = [];

  text(value: string): this {
    return this.push(value, false);
  }

  bold(value: string): this {
    return this.push(value, true);
  }

  private push(value: string, gras: boolean): this {
    if (value.length === 0) {
      return this;
    }
    const last = this.segments[this.segments.length - 1];
    if (last && last.gras === gras) {
      this.segments[this.segments.length - 1] = { texte: last.texte + value, gras };
    } else {
      this.segments.push({ texte: value, gras });
    }
    return this;
  }

  build(): readonly PhraseSegment[] {
    return this.segments;
  }
}

function seriesLabel(count: number): string {
  return count === 1 ? `${count} série` : `${count} séries`;
}

function repetitionsLabel(count: number): string {
  return count === 1 ? `${count} répétition` : `${count} répétitions`;
}

/** Énumération « a, b puis c » (gras par élément selon `boldItem`). */
function enumerate(builder: SegmentBuilder, items: readonly string[], boldItem: (index: number) => boolean): void {
  items.forEach((item, index) => {
    if (index > 0) {
      builder.text(index === items.length - 1 ? " puis " : ", ");
    }
    if (boldItem(index)) {
      builder.bold(item);
    } else {
      builder.text(item);
    }
  });
}

/**
 * Segments de la phrase descriptive d'un Exercice. `null` lorsque le mode
 * n'est pas renseigné ou qu'une Cible est à renseigner (`UNSET` : aucune
 * Cible inventée — la carte affiche alors son état « à compléter »).
 *
 * PRE-4 (story 1.1) : un Exercice dont TOUTES les Cibles sont `FAILURE`
 * (ancien mode « à l'échec » migré) garde le gabarit existant « N séries
 * menées jusqu'à l'échec », sans clause de Bip (P26), dans les deux Modes.
 *
 * PRE-4 (story 2.3, FR-16-08, FR-16-09, Q16, H16, H17) : un mélange de
 * Cibles `NUMBER` et `FAILURE` (qui n'existe qu'en Régime variables : un
 * Régime identiques porte une seule Cible) décrit chaque
 * Cible dans l'ordre pour 3 Cibles ou moins — « de durée variable (30 s,
 * 45 s puis jusqu’à l’échec) », « de répétitions variables (10, 12 puis
 * jusqu’à l’échec) » — et se compacte au-delà en « variables, de {minimum
 * des Cibles `NUMBER`} … à l’échec ». En Répétitions avec Bip, la cadence
 * suit, précédée d'une virgule. « jusqu’à l’échec » et « à l’échec » sont
 * du texte grammatical (normal) ; les valeurs sont en gras (FR-16-02, H9).
 * Une Cible `UNSET` donne toujours une phrase `null`.
 */
export function generateExecutionPhrase(input: ExecutionParametersInput): readonly PhraseSegment[] | null {
  if (!isCalculable(input)) {
    return null;
  }
  const parameters = normalizeEffective(input);
  const rows = seriesRowsOf(parameters);
  const count = seriesCountOf(parameters);
  const mode = parameters.mode;
  if (rows.some((row) => row.target.kind === "UNSET")) {
    return null;
  }
  const failure = allTargetsFailure(parameters);
  // Mélange `NUMBER`/`FAILURE` : au moins une Cible de chaque nature (aucune `UNSET`, contrôlé ci-dessus).
  const mixed = !failure && rows.some((row) => row.target.kind === "FAILURE");
  const variable = parameters.series.kind === "VARIABLE";
  // Valeurs des seules Cibles `NUMBER` (toutes, hors mélange et tout échec).
  const targets = rows.flatMap((row) => (isNumberTarget(row.target) ? [row.target.value] : []));
  const cadenced = mode === "REPETITIONS" && parameters.cadenceBeepIntervalSeconds > 0;
  const builder = new SegmentBuilder();

  builder.bold(seriesLabel(count));

  // --- Contenu ---------------------------------------------------------------
  if (failure) {
    builder.text(count === 1 ? " menée jusqu’à l’échec" : " menées jusqu’à l’échec");
  } else if (mixed) {
    const formatValue = mode === "DURATION" ? formatPhraseDuration : String;
    if (count <= 3) {
      builder.text(mode === "DURATION" ? " de durée variable (" : " de répétitions variables (");
      const items = rows.map((row) => (isNumberTarget(row.target) ? formatValue(row.target.value) : "jusqu’à l’échec"));
      enumerate(builder, items, (index) => rows[index]!.target.kind === "NUMBER");
      builder.text(")");
    } else {
      const minimum = Math.min(...targets);
      builder
        .text(" variables, de ")
        .bold(mode === "DURATION" ? formatPhraseDuration(minimum) : `${minimum} rép.`)
        .text(" à l’échec");
    }
    if (cadenced) {
      builder.text(", cadencées toutes les ").bold(formatPhraseDuration(parameters.cadenceBeepIntervalSeconds));
    }
  } else if (mode === "DURATION") {
    if (!variable) {
      builder.text(" de ").bold(formatPhraseDuration(targets[0]!));
    } else if (count <= 3) {
      builder.text(" de durée variable (");
      enumerate(builder, targets.map(formatPhraseDuration), () => true);
      builder.text(")");
    } else {
      builder
        .text(" variables, de ")
        .bold(formatPhraseDuration(Math.min(...targets)))
        .text(" à ")
        .bold(formatPhraseDuration(Math.max(...targets)));
    }
  } else if (mode === "REPETITIONS") {
    if (!variable) {
      builder.text(" de ").bold(repetitionsLabel(targets[0]!));
    } else if (count <= 3) {
      builder.text(" de ");
      const items = targets.map((target, index) =>
        index === targets.length - 1 ? repetitionsLabel(target) : String(target),
      );
      enumerate(builder, items, (index) => index === items.length - 1);
    } else {
      builder
        .text(` variables, de ${Math.min(...targets)} à `)
        .bold(repetitionsLabel(Math.max(...targets)));
    }
    if (cadenced) {
      builder.text(" cadencées toutes les ").bold(formatPhraseDuration(parameters.cadenceBeepIntervalSeconds));
    }
  }

  // --- Pause (uniforme seulement ; omise en variable, conformément aux 276 cas)
  if (!variable) {
    const pause = rows[0]!.pauseSeconds;
    if (pause > 0) {
      builder.text(", avec ").bold(formatPhraseDuration(pause)).text(" de pause après chaque série");
    } else if (count > 1) {
      builder.text(", enchaînées sans pause");
    }
  }

  // --- Côtés --------------------------------------------------------------
  if (isBilateral(parameters.sideMode)) {
    const rightFirst = parameters.sideMode === "RIGHT_LEFT";
    const first = rightFirst ? "droit" : "gauche";
    const second = rightFirst ? "gauche" : "droit";
    if (count === 1) {
      builder.text(`, en faisant le côté ${first} puis le `).bold(second);
    } else if (parameters.sideOrder === "BY_SERIES") {
      builder.text(`, en alternant le côté ${first} puis le `).bold(second).text(" à chaque série");
    } else {
      builder
        .text(", en faisant d’abord toutes les séries à ")
        .bold(rightFirst ? "droite" : "gauche")
        .text(", puis à ")
        .bold(rightFirst ? "gauche" : "droite");
    }
    if (parameters.sideRecoverySeconds > 0) {
      builder
        .text(", avec ")
        .bold(formatPhraseDuration(parameters.sideRecoverySeconds))
        .text(" de pause au changement de côté");
    }
  }

  builder.text(".");

  // --- Durée totale ---------------------------------------------------------
  const result = computeIntrinsicDuration(parameters);
  const redundant =
    mode === "DURATION" && count === 1 && !isBilateral(parameters.sideMode) && rows[0]!.pauseSeconds === 0;
  const total = totalClauseAmount(result);
  if (total !== null && !redundant) {
    builder.text(" Durée totale : ").bold(total).text(".");
  }

  return builder.build();
}

/**
 * Montant de la clause Durée totale selon la nature (story 2.1, AC9) :
 * exact sans symbole, « ≈ » estimé, « ≥ » partiel ; aucune clause pour
 * `omitted` ni `incomplete` (jamais `0 s` ni tiret). Un mélange en Durée,
 * ou en Répétitions avec Bip, y porte « ≥ » dans le segment gras du montant
 * (story 2.3, FR-16-10, H18).
 */
export function totalClauseAmount(result: ExerciseDurationResult): string | null {
  switch (result.kind) {
    case "exact":
      return formatPhraseDuration(result.seconds!);
    case "estimated":
      return `≈ ${formatPhraseDuration(result.seconds!)}`;
    case "lowerBound":
      return `≥ ${formatPhraseDuration(result.seconds!)}`;
    case "omitted":
    case "incomplete":
      return null;
    default: {
      const exhaustive: never = result.kind;
      return exhaustive;
    }
  }
}

/** Texte complet (concaténation exacte des segments) — libellé accessible unique de la carte. */
export function phraseText(segments: readonly PhraseSegment[]): string {
  return segments.map((segment) => segment.texte).join("");
}
