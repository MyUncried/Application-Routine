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
import { formatLoadKg, formatLoadValue, normalizeLoad } from "./exerciseLoad";
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

  /** Ajoute des segments déjà formés (clauses pures), avec la même fusion des voisins de même graisse. */
  append(segments: readonly PhraseSegment[]): this {
    segments.forEach((segment) => this.push(segment.texte, segment.gras));
    return this;
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

/** Au-delà de ce nombre de séries, la liste des charges est tronquée aux deux premières (D-414). */
const LOAD_LIST_MAX_COUNT = 3;

/**
 * PRE-5 (story 1.2, FR-43, AD-29, QP5-09) — mention des phases de l'exercice :
 * « (Descente : **6 s** - Maintien : **3 s**) », exhaustive même pour une seule
 * phase, libellés et durées effectifs dans l'ordre d'exécution ; durées en
 * gras, libellés en texte normal. PRE-7 (D-446) : motif commun aux séries
 * identiques et variables ; sans phases, aucun segment.
 */
export function workPhasesClause(parameters: ExecutionParametersInput): readonly PhraseSegment[] {
  const { series } = normalizeEffective(parameters);
  if (series.workPhases.length === 0) {
    return [];
  }
  const builder = new SegmentBuilder().text(" (");
  series.workPhases.forEach((phase, index) => {
    builder
      // Espaces extérieurs du libellé retirés à l'affichage seulement (aucune donnée modifiée).
      .text(`${index > 0 ? " - " : ""}${phase.label.trim()} : `)
      .bold(formatPhraseDuration(phase.durationSeconds));
  });
  return builder.text(")").build();
}

/**
 * PRE-5 (story 1.2, FR-42, D-414, AD-29) — mention de la charge, en texte
 * normal : identiques « (charge : 20 kg) » ; variables « (charges : 20, 12,
 * 13 kg) » jusqu'à trois séries, « (charges : 20, 12 kg, ...) » au-delà. Les
 * valeurs sont celles des séries effectives, dans leur ordre, zéros compris,
 * jamais compactées en charge commune (RM-240). Sous Sans, ou toutes les
 * valeurs à 0 (règles du zéro de `normalizeLoad`), aucun segment.
 */
export function loadClause(parameters: ExecutionParametersInput): readonly PhraseSegment[] {
  if (!normalizeLoad(parameters).loadEnabled) {
    return [];
  }
  const effective = normalizeEffective(parameters);
  const builder = new SegmentBuilder();
  if (effective.series.kind === "UNIFORM") {
    return builder.text(` (charge : ${formatLoadKg(effective.series.loadKg)})`).build();
  }
  const loads = seriesRowsOf(effective).map((row) => row.loadKg);
  const truncated = loads.length > LOAD_LIST_MAX_COUNT;
  const shown = truncated ? loads.slice(0, 2) : loads;
  // Unité écrite une fois, par le formateur unique, sur la dernière valeur affichée.
  const listed = shown
    .map((kg, index) => (index === shown.length - 1 ? formatLoadKg(kg) : formatLoadValue(kg)))
    .join(", ");
  return builder.text(` (charges : ${listed}${truncated ? ", ..." : ""})`).build();
}

/** Mentions accolées à la valeur par série et leur ordre unique (AD-29, décision §9-3) : phases, puis charge. */
export const VALUE_SUFFIX_ORDER = ["workPhases", "load"] as const;

const VALUE_SUFFIX_CLAUSES: Record<
  (typeof VALUE_SUFFIX_ORDER)[number],
  (parameters: ExecutionParametersInput) => readonly PhraseSegment[]
> = {
  workPhases: workPhasesClause,
  load: loadClause,
};

/** Point d'insertion unique des mentions, à la fin de la valeur par série (AD-29). */
function appendValueSuffix(builder: SegmentBuilder, parameters: ExecutionParametersInput): void {
  VALUE_SUFFIX_ORDER.forEach((key) => builder.append(VALUE_SUFFIX_CLAUSES[key](parameters)));
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
 *
 * PRE-5 (story 1.2, AD-29) : les mentions des phases et de la charge
 * (`workPhasesClause`, `loadClause`, ordre `VALUE_SUFFIX_ORDER`) suivent la
 * valeur par série, avant la cadence et la Pause ; la clause des côtés est
 * neutre (« côté 1 », « côté 2 »). La « Durée totale » est inchangée.
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
  }

  // --- Phases et charge : point d'insertion unique, après la valeur par série
  // et avant la cadence et la Pause (PRE-5 story 1.2, AD-29).
  appendValueSuffix(builder, parameters);

  // --- Cadence (Répétitions avec Bip ; jamais en tout échec, P26) -----------
  if (cadenced && !failure) {
    builder
      .text(mixed ? ", cadencées toutes les " : " cadencées toutes les ")
      .bold(formatPhraseDuration(parameters.cadenceBeepIntervalSeconds));
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

  // --- Côtés (PRE-5 story 1.2, FR-18, AD-21, ch. 10 l. 515) : forme neutre,
  // identique pour `RIGHT_LEFT` et `LEFT_RIGHT` ; la direction n'est pas lue.
  // La désignation qui remplace un ancien mot gras (« gauche », « droite ») est en gras.
  if (isBilateral(parameters.sideMode)) {
    if (count === 1) {
      builder.text(", en faisant le côté 1 puis le ").bold("côté 2");
    } else if (parameters.sideOrder === "BY_SERIES") {
      builder.text(", en alternant le côté 1 puis le ").bold("côté 2").text(" à chaque série");
    } else {
      builder
        .text(", en faisant d’abord toutes les séries du ")
        .bold("côté 1")
        .text(", puis du ")
        .bold("côté 2");
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
