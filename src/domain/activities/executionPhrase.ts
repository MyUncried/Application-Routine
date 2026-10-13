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
  isBilateral,
  normalizeEffective,
  seriesCountOf,
  seriesRowsOf,
  type ExecutionParametersInput,
} from "./ExecutionParameters";
import { computeIntrinsicDuration, isCalculable } from "./executionCalculations";

export type PhraseSegment = {
  readonly texte: string;
  readonly gras: boolean;
};

/** « X min Y s » / « X min » / « Y s » — aucune heure, aucun zéro inutile. */
export function formatPhraseDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0 && seconds > 0) {
    return `${minutes} min ${seconds} s`;
  }
  return minutes > 0 ? `${minutes} min` : `${seconds} s`;
}

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
 * n'est pas renseigné ou qu'une cible active manque (aucune cible inventée
 * pendant un brouillon incomplet — la carte affiche alors son état vide).
 */
export function generateExecutionPhrase(input: ExecutionParametersInput): readonly PhraseSegment[] | null {
  if (!isCalculable(input)) {
    return null;
  }
  const parameters = normalizeEffective(input);
  const rows = seriesRowsOf(parameters);
  const count = seriesCountOf(parameters);
  const mode = parameters.mode;
  if (mode !== "TO_FAILURE" && rows.some((row) => row.target === null)) {
    return null;
  }
  const variable = parameters.series.kind === "VARIABLE";
  const targets = rows.map((row) => row.target as number);
  const builder = new SegmentBuilder();

  builder.bold(seriesLabel(count));

  // --- Contenu ---------------------------------------------------------------
  if (mode === "DURATION") {
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
    if (parameters.cadenceBeepIntervalSeconds > 0) {
      builder.text(" cadencées toutes les ").bold(formatPhraseDuration(parameters.cadenceBeepIntervalSeconds));
    }
  } else {
    builder.text(count === 1 ? " menée jusqu’à l’échec" : " menées jusqu’à l’échec");
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
  if (result.kind !== "omitted" && result.seconds !== undefined && !redundant) {
    const amount = formatPhraseDuration(result.seconds);
    builder.text(" Durée totale : ").bold(result.kind === "estimated" ? `≈ ${amount}` : amount).text(".");
  }

  return builder.build();
}

/** Texte complet (concaténation exacte des segments) — libellé accessible unique de la carte. */
export function phraseText(segments: readonly PhraseSegment[]): string {
  return segments.map((segment) => segment.texte).join("");
}
