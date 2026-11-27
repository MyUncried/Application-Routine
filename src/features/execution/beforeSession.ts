/**
 * D-577 / D-427 (décisions de Hermann du 27/11/2026) — écran « Avant la séance » : logique pure, sans React ni stockage.
 * Rendu : `docs/DSF-AVANT-SEANCE-2026-11-27.md` (branche de documentation) ; contrat CE-EXEC-SESSION-01.
 *
 * - `sessionOutline` : liste en lignes de texte des cycles, circuits et exercices, dans l'ordre de la composition, avec retrait par
 *   niveau ; format du circuit en majuscules, chiffre en premier (« 8 tours · TABATA », « 3 tours · Circuit libre », « 2 cycles ») ;
 *   ni durées ni nature des circuits.
 * - `compositionFingerprint` : empreinte de l'ordre et du contenu (exercices, cycles, circuits, formats), sans les paramètres
 *   d'exécution (durées, répétitions…) : la case « Ne plus afficher cet écran » vaut jusqu'à ce qu'elle change.
 * - `startScreenMode` : version de l'écran à afficher (liste et douleur, douleur seule, séance suivante, aucun écran).
 *
 * Le moteur d'exécution n'est pas concerné (D-534 : orchestration au-dessus du moteur).
 */
import type { SessionSnapshot, SessionSnapshotExercise } from "@/domain/sessions/sessionSnapshot";
import type { StructureCircuit } from "@/domain/sessions/structure";
import { formatModelName } from "@/features/sessions/carrierPresentation";
import { strings } from "@/shared/i18n";

export type OutlineLine = {
  readonly key: string;
  readonly kind: "CYCLE" | "CIRCUIT" | "EXERCISE";
  readonly text: string;
  /** Niveau de retrait : 0 (niveau principal), 1 (dans un cycle ou un circuit), 2 (circuit d'un cycle). Retrait = 18 par niveau. */
  readonly depth: number;
  /** Espace avant la ligne (DSF § 3) : 14 avant un circuit ou un exercice qui suit un bloc, 18 avant un circuit à format, 4 entre exercices. */
  readonly spaceBefore: number;
  /** Ligne d'un circuit doté d'un format (TABATA, AMRAP…). */
  readonly formatted?: boolean;
};

const t = () => strings.execution.beforeSession;

function exerciseName(exercise: SessionSnapshotExercise): string {
  return exercise.exercise?.name ?? "";
}

function circuitHeader(circuit: StructureCircuit<SessionSnapshotExercise>): { readonly text: string; readonly formatted: boolean } {
  const key = circuit.format?.key ?? circuit.originModel ?? null;
  const name = key === null ? t().freeCircuit : formatModelName(key, circuit.exercises.length).toLocaleUpperCase("fr-FR");
  return { text: `${t().tours(circuit.repeatCount)} · ${name}`, formatted: key !== null };
}

/** Liste de la séance (voir l'en-tête). Les anciennes Récupérations autonomes (sans exercice) ne sont pas listées. */
export function sessionOutline(snapshot: SessionSnapshot): readonly OutlineLine[] {
  const lines: OutlineLine[] = [];
  let previous: OutlineLine["kind"] | "BLOCK_END" | null = null;
  const pushExercise = (exercise: SessionSnapshotExercise, depth: number) => {
    if (exercise.exercise === null) return;
    const spaceBefore = previous === null ? 0 : previous === "EXERCISE" || previous === "CIRCUIT" || previous === "CYCLE" ? 4 : 14;
    lines.push({ key: `e:${exercise.id}:${lines.length}`, kind: "EXERCISE", text: exerciseName(exercise), depth, spaceBefore });
    previous = "EXERCISE";
  };
  const pushCircuit = (circuit: StructureCircuit<SessionSnapshotExercise>, depth: number) => {
    const header = circuitHeader(circuit);
    const spaceBefore = previous === null ? 0 : previous === "CYCLE" ? 4 : header.formatted ? 18 : 14;
    lines.push({ key: `c:${circuit.id}`, kind: "CIRCUIT", text: header.text, depth, spaceBefore, formatted: header.formatted });
    previous = "CIRCUIT";
    for (const exercise of circuit.exercises) pushExercise(exercise, depth + 1);
    previous = "BLOCK_END";
  };
  for (const element of snapshot.structure.elements) {
    if (element.kind === "EXERCISE") pushExercise(element.exercise, 0);
    else if (element.kind === "CIRCUIT") pushCircuit(element.circuit, 0);
    else {
      lines.push({ key: `y:${element.cycle.id}`, kind: "CYCLE", text: t().cycles(element.cycle.repeatCount), depth: 0, spaceBefore: previous === null ? 0 : 14 });
      previous = "CYCLE";
      for (const member of element.cycle.members) {
        if (member.kind === "EXERCISE") pushExercise(member.exercise, 1);
        else pushCircuit(member.circuit, 1);
      }
      previous = "BLOCK_END";
    }
  }
  return lines;
}

/**
 * Empreinte de l'ordre et du contenu de la séance : genre, niveau et texte de chaque ligne de la liste (nom des exercices, compte et
 * format des circuits, compte des cycles), et mouvement d'origine de chaque exercice. Les paramètres d'exécution (durées,
 * répétitions, charges, récupérations, réglages des formats) n'y entrent pas. [Interprétation technique : le compte des tours et des
 * cycles, affiché dans la liste, est compté comme contenu — À CLARIFIER dans le rapport.]
 */
export function compositionFingerprint(snapshot: SessionSnapshot): string {
  const movements: string[] = [];
  const collect = (exercise: SessionSnapshotExercise) => movements.push(exercise.exercise?.sourceMovementId ?? exercise.id);
  for (const element of snapshot.structure.elements) {
    if (element.kind === "EXERCISE") collect(element.exercise);
    else if (element.kind === "CIRCUIT") element.circuit.exercises.forEach(collect);
    else
      for (const member of element.cycle.members) {
        if (member.kind === "EXERCISE") collect(member.exercise);
        else member.circuit.exercises.forEach(collect);
      }
  }
  return JSON.stringify({ lines: sessionOutline(snapshot).map((line) => [line.kind, line.depth, line.text]), movements });
}

/**
 * Version de l'écran (D-577) :
 * - `FULL` : première séance (ou séance seule) — liste, puis douleur si l'option du Programme est active, sinon case « Ne plus
 *   afficher cet écran » ;
 * - `PAIN_ONLY` : affichage désactivé (réglage ou case) avec l'option douleur : seul le cadre de la douleur et du départ ;
 * - `NEXT` : séance de rang ≥ 2 d'un parcours, sans douleur ;
 * - `NONE` : aucun écran, la séance démarre aussitôt.
 */
export type StartScreenMode = "FULL" | "PAIN_ONLY" | "NEXT" | "NONE";

export function startScreenMode(input: {
  readonly showSetting: boolean;
  readonly dismissedFingerprint: string | null;
  readonly fingerprint: string;
  /** Option douleur du Programme active pour ce lancement (D-427). */
  readonly painOption: boolean;
  /** Rang dans le parcours (1 : première séance ou séance seule). */
  readonly rank: number;
}): StartScreenMode {
  const listShown = input.showSetting && input.dismissedFingerprint !== input.fingerprint;
  if (input.rank >= 2) return listShown ? "NEXT" : "NONE";
  if (input.painOption) return listShown ? "FULL" : "PAIN_ONLY";
  return listShown ? "FULL" : "NONE";
}

/** Douleur 0–10 transmise par la route (D-577 point 4) ; absente ou invalide : `null` (jamais 0 par défaut, D-427). */
export function parsePain(value: unknown): number | null {
  if (typeof value !== "string" || !/^(10|[0-9])$/.test(value)) return null;
  return Number(value);
}

const GREEN = [0x2e, 0xa8, 0x5c] as const;
const YELLOW = [0xfa, 0xd1, 0x33] as const;
const RED = [0xdb, 0x33, 0x2e] as const;

function hex(channels: readonly number[]): string {
  return `#${channels.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** Couleur de la case `value` (DSF § 4) : interpolation vert → jaune (5) → rouge (10). */
export function painColor(value: number): string {
  const [from, to, ratio] = value <= 5 ? [GREEN, YELLOW, value / 5] : [YELLOW, RED, (value - 5) / 5];
  return hex(from.map((channel, index) => channel + (to[index]! - channel) * ratio));
}

/** Chiffre blanc sur les cases foncées, brun foncé sur les claires (DSF § 4). */
export function painDigitColor(value: number): string {
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(painColor(value).slice(start, start + 2), 16) / 255) as [number, number, number];
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.55 ? PAIN_DARK_DIGIT : "#FFFFFF";
}

export const PAIN_DARK_DIGIT = "#4A3300";
