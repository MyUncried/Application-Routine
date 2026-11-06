import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import type { ExecutionMode } from "@/domain/activities/ExecutionParameters";
import {
  movementRole,
  withSeriesValue,
  type FormatModelKey,
  type ModelAnswers,
  type ModelMovement,
  type MovementValues,
} from "@/domain/sessions/formatModels";
import { cellDurationSeconds, composeCellEntry, formatMmss, mmssDigitsOf, type CellEntryKind, type CellEntryState } from "@/features/activities/cellEntry";
import { strings } from "@/shared/i18n";
import { toVerifyColors } from "@/shared/ui/toVerifyColors";
import { colors as tokenColors } from "@/shared/ui/tokens";

/**
 * PRE-9 — tableaux des récapitulatifs des modèles de la fenêtre Formats (mise à jour consolidée des écrans Formats
 * du 04/11/2026 §4.2 à §4.5, §6 quater, §6 quater bis ; référence Formats §7.4, §7.6, §9.3, §10, §11, §12).
 *
 * Chaque ligne est un Exercice ; ses cases écrivent ses champs standards (§4.4). Saisie au **clavier numérique**,
 * sans roulette : l'objectif se règle par son unité (Répétitions | Durée, dans la barre du clavier) puis sa valeur ;
 * une durée se remplit par la droite (3, 0 → 30 s) ; la charge prend la virgule. Valeur à renseigner : fond rouge
 * léger ; une charge vide (« — ») est une série sans charge et ne bloque pas.
 *
 * - AMRAP : Mouvement | Objectif | Par tour | (Charge) | Max — Max grise l'Objectif et Par tour, pas la Charge ;
 *   buy-in : Par tour « — ».
 * - EMOM : Mouvement | Objectif | (Charge | + / série). [Colonne Mode et son popover — supprimés.]
 * - Death by à plusieurs mouvements : Mouvement | Départ | Incrément (≥ + 1).
 * - For time et Progression : Mouvement | Unité | Tour 1…n (ou S1…Sn), quatre colonnes visibles au plus, nom et
 *   unité fixes, colonnes suivantes défilantes ; ligne de charge sous l'objectif si « Avec charge ».
 */

const VALUE_COLOR = "#0508E5";
const SEPARATOR = "#E0E3E8";
const LABEL = "#141414";
const SECTION = "#595E66";
const DISABLED_VALUE = "#B4B8C2";
const PANEL = "#F9FAFC";
/** Complément du 5 novembre 2026 (Hermann) (Figma) : case de charge vide « (—) ». */
const LOAD_EMPTY = "#999EA8";
const COLUMN_WIDTH = 64;
const SERIES_NAME_WIDTH = 104;
const SERIES_UNIT_WIDTH = 52;
const SERIES_COLUMN_WIDTH = 56;
const ROW_HEIGHT = 36;
/**
 * Recette du 04/11/2026 (f4-modale) — EMOM : « "12 min 30" ne tient pas dans son cadre sur une ligne » ; AMRAP : « aligner
 * les pastilles Max à droite sur les textes, centrer le titre de la colonne en conséquence ; décaler les autres colonnes
 * d'autant, réduire l'espace entre les colonnes » ; For time : « décaler la colonne de l'unité plus à droite », charges
 * « police plus petite, pas en gras, espace vertical réduit avec la ligne d'objectifs au-dessus ».
 */
const COMPACT_LOAD_HEIGHT = 24;
// [Hauteurs For time serrées (e-fortime-charge), colonnes élargies en durée (e-fortime-unite) et ligne « (+ kg) » sous l'unité
// (Complément du 5 novembre 2026, §9) — remplacées par la mise en page ci-dessous (recette du 05/11/2026, n-charge-switch).]
/**
 * Recette du 05/11/2026 (n-charge-switch, Hermann) — tableau des séries : « Supprimer la colonne Unité. Sous le nom du mouvement,
 * en petit (taille actuelle de "+kg") mettre le texte suivant : "(durée, " ou "(rép, " puis "+kg)" ou "-kg)" » ; « Afficher par
 * défaut trois séries » (décision du 05/11/2026 : trois colonnes visibles) ; « Le nom du mouvement doit toujours être aligné
 * verticalement avec sa ligne de valeur des objectifs » ; charges « plus petites, et plus proches de la ligne du dessus ».
 */
const SERIES_LINE_HEIGHT = 26;
const SERIES_LOAD_LINE_HEIGHT = 16;
const SERIES_ROW_PADDING = 4;
const SERIES_SUBTITLE_HEIGHT = 16;
/**
 * Recette du 06/11/2026 (r-series, Hermann : « Rapprocher encore la ligne (rép., +kg) de la ligne du nom du mouvement. Aligner verticalement
 * la ligne des valeurs de charge avec la ligne (rép., +kg) ») : la deuxième ligne (sous-titre du nom, charges) remonte de 4 sous la
 * première, à la même hauteur des deux côtés. [Sous-titre de 14 et charges sous l'objectif sans recouvrement — remplacés.]
 */
const SERIES_SECOND_LINE_RISE = 4;
const SERIES_NAMES_WIDTH = 128;
const SERIES_VISIBLE_COLUMNS = 3;
/**
 * Recette du 06/11/2026 (n-cadres, r-colonnes, constat d, Hermann : « Aligner la colonne Mouvement et les noms de mouvement à droite avec les
 * autres textes. Idem à gauche » ; « la colonne Max n'est pas alignée à droite », « La colonne mouvement n'est pas alignée à gauche » ;
 * « un cadre gris, pas de deuxième cadre blanc, première colonne alignée avec les autres textes, idem pour la dernière colonne de série
 * alignée à droite avec les autres textes ») : les tableaux occupent tout leur cadre gris, avec le retrait des lignes de paramètres (16) ;
 * la dernière colonne est calée à droite, au retrait du texte des pastilles (16 + 10). [Retraits de 8 + 12, tableau AMRAP dans un second
 * cadre, tableau Progression sur fond blanc — remplacés.]
 */
const TABLE_SIDE_INSET = 16;
const SERIES_SIDE_INSET = TABLE_SIDE_INSET;
/**
 * Recette du 05/11/2026 (n-charge-colonne, Hermann : « décaler la première colonne d'un tableau la plus à droite possible, en
 * respectant la marge […]. Réduire au minimum l'espace entre les colonnes pour laisser un maximum de place au nom du mouvement,
 * considérer l'espace max pris par une valeur en durée si c'est une option ») : colonnes à la largeur de leur plus longue valeur.
 */
const FIT_DURATION_WIDTH = 66;
const FIT_REPETITIONS_WIDTH = 52;
const FIT_INCREMENT_WIDTH = 58;
const FIT_PAUSE_WIDTH = 60;
const FIT_LOAD_WIDTH = 60;
const FIT_MAX_WIDTH = 40;

/** Largeur d'une colonne d'objectif : une durée possible (« 12 min 30 ») ou seulement des répétitions (« 10 rép. »). */
function objectiveWidth(movements: readonly ModelMovement[], durationPossible: boolean): number {
  return durationPossible || movements.some((item) => item.values.mode === "DURATION") ? FIT_DURATION_WIDTH : FIT_REPETITIONS_WIDTH;
}

const t = () => strings.screens.formatModel;

/** Branchement d'une cellule sur la navigation au clavier (Précédent / Suivant, barre d'unité). */
export type CellBinding = (key: string) => {
  readonly inputRef: (input: TextInput | null) => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
  /** Cellule active (surlignée). */
  readonly active: boolean;
  /** Signe imposé par la barre (± de l'incrément de charge EMOM) ; absent : signe de la valeur. */
  readonly sign?: 1 | -1;
};

/** Clé de cellule : `genre-ligne-colonne` (obj : objectif, inc : par tour, load : charge, start, sinc, pause). */
export type CellKind = "obj" | "inc" | "load" | "linc" | "start" | "sinc" | "pause";

export function cellKey(kind: CellKind, row: number, column = 0): string {
  return `${kind}-${row}-${column}`;
}

export function parseCellKey(key: string): { readonly kind: CellKind; readonly row: number; readonly column: number } | null {
  const match = /^(obj|inc|load|linc|start|sinc|pause)-(\d+)-(\d+)$/u.exec(key);
  return match === null ? null : { kind: match[1] as CellKind, row: Number(match[2]), column: Number(match[3]) };
}

/** Le modèle présente une colonne d'objectif à unité (barre Répétitions | Durée). */
export function objectiveHasUnit(model: FormatModelKey): boolean {
  return model !== "UNTIL_FAILURE";
}

/**
 * Tableaux présents au récapitulatif — Complément du 5 novembre 2026 (Hermann), §11, §15–§16 : Superset (par tour) ; Tabata, 30/30, Renforcement et À l'échec
 * dès deux mouvements (Objectif | Pause | Charge) ; Death by dès deux mouvements.
 */
export function hasSummaryTable(model: FormatModelKey, movements: readonly ModelMovement[]): boolean {
  switch (model) {
    case "DEATH_BY":
    case "TABATA":
    case "INTERVALS_30_30":
    case "STRENGTH":
    case "UNTIL_FAILURE":
      return movements.length > 1;
    default:
      return true;
  }
}

/**
 * Recette du 06/11/2026 (n-emom, Hermann : « Il ne faut pas recopier la saisie d'une colonne vers une autre. Je ne sais pas d'où vient
 * ce besoin. » ; t-coche-q : « une valeur doit être entrée manuellement pour chaque colonne sans recopie automatique » ; réponse A :
 * « Oui retirée partout (c'est une erreur d'interprétation) ») : aucune colonne ne recopie S1.
 * [Complément du 5 novembre 2026, §14, §11 : EMOM et Superset préremplis avec la valeur de S1 — remplacé.]
 */

/**
 * Ordre de Suivant (MAJ 04/11 §6 quater bis) : Progression et For time, objectif S1 → Sn (ou Tour 1 → n), puis
 * charges, puis ligne suivante ; AMRAP, Objectif → Par tour → Charge ; EMOM, Objectif → Charge → + / série ; Death
 * by, Départ → Incrément. Les cases grisées sont sautées.
 */
export function tableCellOrder(model: FormatModelKey, movements: readonly ModelMovement[], answers: ModelAnswers): string[] {
  const order: string[] = [];
  // Complément du 5 novembre 2026 (Hermann), §16 : seules les charges appliquées au mouvement (« (+ kg) ») sont des cases à parcourir —
  // tableau des séries (For time, Progression, EMOM, Superset).
  const charged = (values: MovementValues) => answers.withLoad === true && values.loadOn === true;
  // Recette du 06/11/2026 (r-suivant, Hermann : « Le tableau des écrans de type Tabata, 30/30, Renforcement, Death by... » ; réponse C :
  // « ces 4 formats utilisent un tableau similaire. les "..." veut dire que s'il y a un autre format que j'ai oublié, il faut le corriger
  // aussi » ; t-coche-direct : « il faut que le bouton Suivant mette aussi le focus sur charge (Objectif > Pause > Charge > Ligne
  // suivante) ») : tableaux à une ligne par mouvement (Tabata, 30/30, Renforcement, À l'échec, Death by, AMRAP), la case de charge est
  // toujours parcourue avec « Avec charge ».
  const chargeColumn = answers.withLoad === true;
  movements.forEach((item, row) => {
    const values = item.values;
    switch (model) {
      case "AMRAP": {
        const tour = movementRole(item) === "TOUR";
        if (values.max !== true) {
          order.push(cellKey("obj", row));
          if (answers.increasingVolume === true && tour) order.push(cellKey("inc", row));
        }
        if (chargeColumn) order.push(cellKey("load", row));
        return;
      }
      case "DEATH_BY":
        if (movements.length > 1) order.push(cellKey("start", row), cellKey("sinc", row));
        if (movements.length > 1 && chargeColumn) order.push(cellKey("load", row));
        return;
      case "TABATA":
      case "INTERVALS_30_30":
      case "STRENGTH":
      case "UNTIL_FAILURE":
        if (movements.length < 2) return;
        if (model !== "UNTIL_FAILURE") order.push(cellKey("obj", row));
        order.push(cellKey("pause", row));
        if (chargeColumn) order.push(cellKey("load", row));
        return;
      case "EMOM":
      case "SUPERSET":
      case "FOR_TIME":
      case "PROGRESSION": {
        // Objectifs S1 → Sn (ou Tour 1 → n), puis charges, puis ligne suivante (ch13, ordre de Suivant).
        const count =
          model === "FOR_TIME" ? (movementRole(item) === "TOUR" ? (answers.roundCount ?? 1) : 1) : model === "SUPERSET" ? (answers.roundCount ?? 1) : (answers.seriesCount ?? 1);
        for (let column = 0; column < count; column += 1) order.push(cellKey("obj", row, column));
        if (charged(values)) for (let column = 0; column < count; column += 1) order.push(cellKey("load", row, column));
        return;
      }
      default:
        return;
    }
  });
  return order;
}

/**
 * Durée d'une case de tableau. Recette du 05/11/2026 au soir (r-tabata, Hermann : « Les durées sont arrondies (entrée 01:30 affiche
 * 1 min ») : « 1 min 30 s » dépassait la case et n'en montrait que « 1 min » — format court « 1 min 30 », comme « 12 min 30 »
 * (recette n-charge-colonne : « considérer l'espace max pris par une valeur en durée »). Minutes ou secondes seules : inchangé.
 */
export function formatSeconds(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes > 0 && rest > 0) return `${minutes} min ${String(rest).padStart(2, "0")}`;
  return formatPhraseDuration(total);
}

export function formatLoad(kg: number): string {
  return `${String(kg).replace(".", ",")} kg`;
}

/** Objectif avec son unité (« 10 rép. », « 45 s », « 1 min 30 »). */
export function formatObjective(mode: ExecutionMode | undefined, value: number): string {
  return (mode ?? "REPETITIONS") === "DURATION" ? formatSeconds(value) : `${value} ${t().repetitionsUnit}`;
}

/** Bornes des saisies (bornes existantes de même sens). */
const DURATION_BOUNDS = { min: 1, max: 99 * 60 + 59 };

function entryOf(kind: CellEntryKind, value: number | null): string {
  if (value === null) return "";
  if (kind === "duration") return mmssDigitsOf(value);
  return String(value).replace(".", ",");
}

function valueOf(kind: CellEntryKind, text: string, durationMin = DURATION_BOUNDS.min): number | null {
  if (text === "") return null;
  if (kind === "duration") return cellDurationSeconds(text, { min: durationMin, max: DURATION_BOUNDS.max });
  if (kind === "integer") return Number(text);
  const parsed = Number.parseFloat(text.replace(",", "."));
  // Charge au quart de kilogramme (AD-19).
  return Number.isFinite(parsed) ? Math.round(parsed * 4) / 4 : null;
}

/**
 * Cellule de tableau : au repos, la valeur formatée (ou « — ») ; en saisie, la composition au clavier (première
 * frappe qui remplace, durée « MM:SS » remplie par la droite) — mêmes règles que les cellules de la feuille des
 * paramètres d'exécution (D-434, `cellEntry`).
 */
export function TableCell({
  kind,
  value,
  onChange,
  format,
  placeholder,
  missing = false,
  disabled = false,
  active = false,
  inputRef,
  onFocus,
  onBlur,
  label,
  width = COLUMN_WIDTH,
  boxed = false,
  compact = false,
  sign,
  signed = false,
  barOnly = false,
  tight = false,
  badge = false,
  durationMin,
  entrySuffix = "",
  load = false,
  small = false,
  pending = false,
  alignEnd = false,
  testID,
}: {
  /**
   * Recette du 06/11/2026 (t-coche-direct, Hermann : « après activation des charges, le cadre de valeur de la charge doit être orange » ;
   * « mettre les cadres oranges avec un trait sur les champs charge qui ne sont pas renseignés ») : charge facultative à renseigner.
   */
  readonly pending?: boolean;
  /**
   * Dernière colonne d'un tableau — recette du 06/11/2026 (r-colonnes, n-cadres, constat d, Hermann : « la dernière colonne […]
   * alignée à droite avec les autres textes ») : valeur calée à droite, au retrait du texte des pastilles des lignes de paramètres.
   */
  readonly alignEnd?: boolean;
  /** Charge sous l'objectif du tableau des séries (recette du 05/11/2026, n-charge-switch) : Regular 11, ligne de 16. */
  readonly small?: boolean;
  /** Complément du 5 novembre 2026 (Hermann) : case de charge — valeur entre parenthèses, Regular 12, case vide « (—) » grise. */
  readonly load?: boolean;
  /**
   * Unité toujours affichée pendant la saisie — recette du 05/11/2026 (k-fortime-pastille, Hermann : « j'entre "12,5", le tableau
   * présente "12,5" au lieu de "12,5 kg". Toujours afficher "kg" ») ; le curseur reste devant l'unité.
   */
  readonly entrySuffix?: string;
  /**
   * Valeur d'une ligne de paramètres (questionnaire, récapitulatif) — Hermann, 05/11/2026 : « on utilise systématiquement le
   * clavier pour renseigner les valeurs, plus aucun stepper ». Pastille blanche à largeur libre ; le texte de la case vide
   * (« Sans limite », « variable ») s'affiche comme une valeur.
   */
  readonly badge?: boolean;
  /** Durée minimale admise (0 pour une pause) ; 1 s par défaut. */
  readonly durationMin?: number;
  /**
   * Case atteinte seulement par Précédent / Suivant de la barre du clavier — recette du 05/11/2026 (e-fortime-charge, Hermann :
   * « Une seule zone tactile utile qui est la première, la charge s'atteint avec les boutons suivant / précédent du clavier »).
   */
  readonly barOnly?: boolean;
  /** Objectif au-dessus d'une charge (For time) : case plus basse (recette du 05/11/2026, e-fortime-charge). */
  readonly tight?: boolean;
  /** Case signée : « + » ou « − » toujours affiché devant la valeur en saisie. */
  readonly signed?: boolean;
  /** Case signée (incrément de charge EMOM, recette du 04/11/2026) : signe imposé, « − » affiché devant la valeur. */
  readonly sign?: 1 | -1;
  /** Tableau sans cadre (For time) : la zone de saisie porte un fond blanc. */
  readonly boxed?: boolean;
  /** Charge sous l'objectif (For time) : police réduite, non grasse, ligne plus basse. */
  readonly compact?: boolean;
  readonly kind: CellEntryKind;
  readonly value: number | null;
  readonly onChange: (value: number | null) => void;
  readonly format: (value: number) => string;
  /** Texte de la cellule vide ; « — » par défaut. */
  readonly placeholder?: string;
  /** Valeur à renseigner, ou en cause (contrôle EMOM) : fond rouge léger. */
  readonly missing?: boolean;
  readonly disabled?: boolean;
  readonly active?: boolean;
  readonly inputRef?: (input: TextInput | null) => void;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
  readonly label: string;
  readonly width?: number;
  readonly testID: string;
}) {
  const [focused, setFocused] = useState(false);
  const [entry, setEntry] = useState<CellEntryState>({ text: "", fresh: true });
  // Hermann, 04/11/2026 : « Appuyer sur durée doit mettre le champ dans le format cible 00:00 pour guider la première
  // saisie » — en saisie, une durée s'affiche toujours « MM:SS », « 00:00 » quand elle est vide.
  const effectiveSign = sign ?? (value !== null && value < 0 ? -1 : 1);
  // Case signée (incrément de charge EMOM) — Hermann, 04/11/2026 : « le + doit apparaître dans la cellule lors de la saisie ».
  const signPrefix = effectiveSign < 0 ? "−" : signed ? "+" : "";
  const suffix = focused && kind !== "duration" && entry.text !== "" ? entrySuffix : "";
  // Recette du 05/11/2026 (k-clavier-vide, Hermann : « quand la cellule affiche "sans limite", la largeur de son cadre doit
  // s'adapter ») : pastille vide, le texte de remplacement est affiché comme une valeur, la pastille prend sa largeur.
  const shown = focused
    ? kind === "duration"
      ? formatMmss(entry.text)
      : signPrefix + entry.text + suffix
    : value === null
      ? badge
        ? (placeholder ?? "")
        : ""
      : format(value);
  // « Appuyer manuellement sur un champ doit positionner le curseur à droite de la valeur » : la saisie se compose par la
  // droite, le curseur y reste.
  const caret = focused ? { start: shown.length - suffix.length, end: shown.length - suffix.length } : undefined;
  const cellStyle = [
    styles.cell,
    badge ? styles.cellBadge : boxed ? null : { width },
    boxed ? styles.cellBoxed : null,
    compact ? styles.cellCompact : null,
    tight ? styles.cellTight : null,
    load ? styles.cellLoad : null,
    small ? styles.cellSmall : null,
    alignEnd ? styles.cellEnd : null,
    disabled ? styles.cellDisabled : null,
    !disabled && pending ? styles.cellPending : null,
    !disabled && missing ? styles.cellMissing : null,
    active || focused ? styles.cellActive : null,
    focused && kind === "duration" && entry.text === "" ? styles.cellGuide : null,
  ];
  // Recette du 06/11/2026 (t-emom-duree, Hermann : « Je saisi 1230, en durée, Le tableau affiche 12 » ; « Champ Intervalle : le cadre est
  // trop petit lorsqu'il a le focus, on ne voit pas tout le texte » ; t-coche-direct : « le cadre de la valeur récupération n'est pas assez
  // large pour la durée lorsqu'il a le focus ») : sur iPhone, un champ de saisie sans largeur fixe garde la largeur de son premier texte.
  // Les pastilles (lignes de paramètres) et les zones blanches (For time, EMOM, Superset) prennent donc la largeur d'un texte invisible
  // identique à celui affiché ; le champ les recouvre exactement.
  const autoWidth = badge || boxed;
  const input = (
    <TextInput
      ref={inputRef}
      value={shown}
      onFocus={() => {
        setFocused(true);
        setEntry({ text: entryOf(kind, value === null ? null : Math.abs(value)), fresh: true });
        onFocus?.();
      }}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      onChangeText={(next) => {
        const state = composeCellEntry(kind, entry, shown, next);
        setEntry(state);
        const magnitude = valueOf(kind, state.text, durationMin);
        onChange(magnitude === null ? null : effectiveSign * magnitude);
      }}
      editable={!disabled}
      pointerEvents={barOnly ? "none" : undefined}
      selection={caret}
      // Recette n° 3 bis du 03/11/2026 (f3s-clavier, « Supprimer le bouton "Next" du clavier ») : pavé numérique sans
      // touche de retour ; Précédent / Suivant / Fermer dans la barre au-dessus du clavier.
      keyboardType={kind === "decimal" ? "decimal-pad" : "number-pad"}
      contextMenuHidden
      placeholder={placeholder ?? t().dash}
      placeholderTextColor={load ? LOAD_EMPTY : missing || badge ? VALUE_COLOR : DISABLED_VALUE}
      accessibilityLabel={label}
      style={autoWidth ? [...cellStyle, styles.cellOverlay] : cellStyle}
      testID={testID}
    />
  );
  if (!autoWidth) return input;
  return (
    <View style={boxed ? (alignEnd ? styles.cellSlotEnd : styles.cellSlotCentered) : null} pointerEvents="box-none">
      <Text style={[...cellStyle, styles.cellSizer]} numberOfLines={1} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {shown === "" ? (placeholder ?? t().dash) : shown}
      </Text>
      {input}
    </View>
  );
}

type RowChange = (index: number, values: MovementValues) => void;

function rowName(item: ModelMovement): string {
  const role = movementRole(item);
  return `${item.exercise.name}${role === "BUY_IN" ? t().table.buyInSuffix : role === "BUY_OUT" ? t().table.buyOutSuffix : ""}`;
}

/** AMRAP (MAJ 04/11 §4.3 bis) : Mouvement | Objectif | Par tour | (Charge) | Max. */
export function AmrapTable({
  movements,
  increasing,
  withLoad,
  onChange,
  onAddLoad = () => undefined,
  cell,
}: {
  readonly movements: readonly ModelMovement[];
  readonly increasing: boolean;
  readonly withLoad: boolean;
  readonly onChange: RowChange;
  readonly onAddLoad?: (index: number) => void;
  readonly cell: CellBinding;
}) {
  const tt = t().table;
  const objectiveColumn = objectiveWidth(movements, movements.length > 1);
  return (
    <View style={[styles.table, styles.tableInFrame]} testID="format-amrap-table">
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHead, styles.tableName]}>{tt.movement}</Text>
        <Text style={[styles.tableHead, { width: objectiveColumn }]}>{tt.objective}</Text>
        {increasing ? <Text style={[styles.tableHead, { width: FIT_INCREMENT_WIDTH }]}>{tt.perRound}</Text> : null}
        {withLoad ? <Text style={[styles.tableHead, { width: FIT_LOAD_WIDTH }]}>{tt.load}</Text> : null}
        <Text style={[styles.tableHead, styles.maxHead]}>{tt.max}</Text>
      </View>
      {movements.map((item, index) => {
        const values = item.values;
        const tour = movementRole(item) === "TOUR";
        const max = values.max === true;
        const name = rowName(item);
        const mode = values.mode;
        return (
          <View key={item.exercise.id} style={[styles.tableRow, index === movements.length - 1 ? styles.tableRowLast : null]} testID={`format-amrap-row-${index}`}>
            <Text style={[styles.tableCellText, styles.tableName]} numberOfLines={1}>
              {name}
            </Text>
            <TableCell
              kind={mode === "DURATION" ? "duration" : "integer"}
              value={values.repetitions ?? null}
              format={(value) => formatObjective(mode, value)}
              width={objectiveColumn}
              missing={!max && values.repetitions == null}
              disabled={max}
              onChange={(value) => onChange(index, { ...values, repetitions: value })}
              {...cell(cellKey("obj", index))}
              label={`${name}, ${tt.objective}`}
              testID={`format-amrap-reps-${index}`}
            />
            {increasing ? (
              tour ? (
                <TableCell
                  kind={mode === "DURATION" ? "duration" : "integer"}
                  value={values.increment ?? null}
                  // Complément du 5 novembre 2026 (Hermann), §8 : incrément signé (« − 1 rép. », « − 5 s »), signe saisi par « ± » de la barre du clavier.
                  format={(value) => `${value < 0 ? "−" : "+"} ${mode === "DURATION" ? formatSeconds(Math.abs(value)) : Math.abs(value)}`}
                  placeholder="+"
                  width={FIT_INCREMENT_WIDTH}
                  missing={!max && values.increment == null}
                  disabled={max}
                  onChange={(value) => onChange(index, { ...values, increment: value })}
                  {...cell(cellKey("inc", index))}
                  label={`${name}, ${tt.perRound}`}
                  testID={`format-amrap-increment-${index}`}
                />
              ) : (
                <Text style={[styles.tableDash, { width: FIT_INCREMENT_WIDTH }]}>{t().dash}</Text>
              )
            ) : null}
            {withLoad ? (
              <ChargeCell values={values} index={index} name={name} width={FIT_LOAD_WIDTH} onChange={onChange} cell={cell} last={false} testID={`format-amrap-load-${index}`} />
            ) : null}
            {/* Recette du 05/11/2026 (n-charge-colonne, Hermann : « Max en Répétitions seulement ») : Max indisponible en Durée. */}
            <Pressable
              onPress={() => onChange(index, { ...values, max: !max })}
              disabled={mode === "DURATION"}
              accessibilityRole="radio"
              accessibilityState={{ checked: max, disabled: mode === "DURATION" }}
              accessibilityLabel={`${name}, ${tt.max}`}
              style={[styles.radioSlot, styles.maxSlot]}
              testID={`format-amrap-max-${index}`}
            >
              <View style={[styles.radio, max ? styles.radioOn : null, mode === "DURATION" ? styles.radioDisabled : null]}>{max ? <View style={styles.radioDot} /> : null}</View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

// [EMOM : tableau Mouvement | Objectif | (Charge | ± / série), incrément de charge et mention « sans charge à partir de la
// série X » — remplacés le 05/11/2026 (Complément du 5 novembre 2026 (Hermann), §14) par le tableau des séries S1…Sn (`SeriesTable`, modèle EMOM).]

/**
 * Case de charge commune d'un mouvement (colonne Charge : AMRAP, Death by, Tabata, 30/30, Renforcement, À l'échec) — Complément du 5 novembre 2026 (Hermann),
 * §9, §16 ; recette du 06/11/2026 (t-coche-direct) : case toujours présente, cadre orange tant qu'elle est vide.
 * [« (+ kg) » ajoutait la charge et ouvrait le clavier ; chargé, « (12 kg) » au-dessus de « (− kg) » — remplacé.]
 */
function ChargeCell({
  values,
  index,
  name,
  width,
  onChange,
  cell,
  last = true,
  testID,
}: {
  readonly values: MovementValues;
  readonly index: number;
  readonly name: string;
  readonly width: number;
  readonly onChange: RowChange;
  readonly cell: CellBinding;
  /** Dernière colonne du tableau (toujours, sauf l'AMRAP où Max suit). */
  readonly last?: boolean;
  readonly testID: string;
}) {
  const tt = t().table;
  // Recette du 06/11/2026 (t-coche-direct, Hermann : « retirer (+kg), mettre les cadres oranges avec un trait sur les champs charge qui ne
  // sont pas renseignés ») : la case de charge est toujours là (colonne Charge, « Avec charge ») ; vide, un trait dans un cadre orange.
  // Une valeur saisie applique la charge au mouvement ; vidée, la charge est retirée. [« (+ kg) » / « (− kg) » — remplacés.]
  const value = values.loadOn === true ? (values.loadKg ?? null) : null;
  return (
    <TableCell
      kind="decimal"
      value={value}
      format={(entered) => `(${formatLoad(entered)})`}
      placeholder={t().dash}
      entrySuffix=" kg"
      width={width}
      load
      pending={value === null}
      alignEnd={last}
      onChange={(entered) => onChange(index, { ...values, loadKg: entered, loadOn: entered !== null })}
      {...cell(cellKey("load", index))}
      label={`${name}, ${tt.load}`}
      testID={testID}
    />
  );
}

/** « (+ kg) » / « (− kg) » — Complément du 5 novembre 2026 (Hermann), Figma : Inter SemiBold 11, bleu KODJO, texte seul. */
export function ChargeToggle({
  on,
  onPress,
  name,
  testID,
  short = false,
}: {
  readonly on: boolean;
  readonly onPress: () => void;
  readonly name: string;
  readonly testID: string;
  /** Sous le nom du mouvement (tableau des séries) : « +kg) » / « −kg) », à la suite de « (rép, ». */
  readonly short?: boolean;
}) {
  const tt = t().table;
  const label = short ? (on ? tt.removeLoadShort : tt.addLoadShort) : on ? tt.removeLoad : tt.addLoad;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${on ? tt.removeLoadAccessibility : tt.addLoadAccessibility}`}
      testID={testID}
    >
      <Text style={styles.chargeToggle}>{label}</Text>
    </Pressable>
  );
}

/**
 * Death by à plusieurs mouvements (MAJ 04/11 §4.3) : Mouvement | Départ | Incrément — Complément du 5 novembre 2026 (Hermann), §13, §16 : valeurs dans l'unité du
 * mouvement (« 1 rép. », « + 1 rép. », « 10 s », « + 10 s »), choisie au clavier ; colonne Charge si « Avec charge » ; le tableau
 * prend la couleur de son cadre (pas de fond blanc propre).
 */
export function DeathByTable({
  movements,
  withLoad = false,
  onChange,
  onAddLoad = () => undefined,
  cell,
}: {
  readonly movements: readonly ModelMovement[];
  readonly withLoad?: boolean;
  readonly onChange: RowChange;
  readonly onAddLoad?: (index: number) => void;
  readonly cell: CellBinding;
}) {
  const tt = t().table;
  const startColumn = objectiveWidth(movements, false);
  const incrementColumn = startColumn + 10;
  return (
    <View style={[styles.table, styles.tableInFrame]} testID="format-death-by-table">
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHead, styles.tableName]}>{tt.movement}</Text>
        <Text style={[styles.tableHead, { width: startColumn }]}>{tt.start}</Text>
        <Text style={[styles.tableHead, { width: incrementColumn }, withLoad ? null : styles.headEnd]}>{tt.increment}</Text>
        {withLoad ? <Text style={[styles.tableHead, { width: FIT_LOAD_WIDTH }, styles.headEnd]}>{tt.load}</Text> : null}
      </View>
      {movements.map((item, index) => {
        const values = item.values;
        const name = rowName(item);
        const mode = values.mode;
        const kind = mode === "DURATION" ? "duration" : "integer";
        return (
          <View key={item.exercise.id} style={[styles.tableRow, index === movements.length - 1 ? styles.tableRowLast : null]} testID={`format-death-by-row-${index}`}>
            <Text style={[styles.tableCellText, styles.tableName]} numberOfLines={1}>
              {name}
            </Text>
            <TableCell
              kind={kind}
              value={values.start ?? null}
              // Hermann, 04/11/2026 : « death by, il manque les unités au tableau des objectifs ».
              format={(value) => formatObjective(mode, value)}
              width={startColumn}
              missing={values.start == null || values.start < 1}
              onChange={(value) => onChange(index, { ...values, start: value })}
              {...cell(cellKey("start", index))}
              label={`${name}, ${tt.start}`}
              testID={`format-death-by-start-${index}`}
            />
            <TableCell
              kind={kind}
              value={values.startIncrement ?? null}
              format={(value) => `+ ${formatObjective(mode, value)}`}
              width={incrementColumn}
              placeholder="+"
              alignEnd={!withLoad}
              missing={values.startIncrement == null || values.startIncrement < 1}
              onChange={(value) => onChange(index, { ...values, startIncrement: value })}
              {...cell(cellKey("sinc", index))}
              label={`${name}, ${tt.increment}`}
              testID={`format-death-by-increment-${index}`}
            />
            {withLoad ? (
              <ChargeCell values={values} index={index} name={name} width={FIT_LOAD_WIDTH} onChange={onChange} cell={cell} testID={`format-death-by-load-${index}`} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/**
 * Tabata, 30/30, Renforcement, À l'échec à plusieurs mouvements — Complément du 5 novembre 2026 (Hermann), §15–§17 : Mouvement | Objectif | Pause | Charge, dans
 * son propre cadre ; Objectif (Durée ou Répétitions, au clavier ; « à l'échec » pour À l'échec) et Pause propres au mouvement,
 * réglages du questionnaire par défaut ; colonne Charge seulement avec « Avec charge ».
 */
export function ObjectivePauseTable({
  model,
  movements,
  objectiveFallback,
  pauseFallback,
  withLoad,
  onChange,
  onAddLoad,
  cell,
}: {
  readonly model: "TABATA" | "INTERVALS_30_30" | "STRENGTH" | "UNTIL_FAILURE";
  readonly movements: readonly ModelMovement[];
  /** Objectif commun du questionnaire (travail par série, répétitions par série). */
  readonly objectiveFallback: number | undefined;
  /** Pause commune du questionnaire (ou de l'Exercice de base). */
  readonly pauseFallback: (index: number) => number;
  readonly withLoad: boolean;
  readonly onChange: RowChange;
  readonly onAddLoad: (index: number) => void;
  readonly cell: CellBinding;
}) {
  const tt = t().table;
  const defaultMode = model === "TABATA" || model === "INTERVALS_30_30" ? "DURATION" : "REPETITIONS";
  const objectiveColumn = model === "UNTIL_FAILURE" ? FIT_DURATION_WIDTH : defaultMode === "DURATION" ? FIT_DURATION_WIDTH : objectiveWidth(movements, true);
  return (
    <View style={[styles.table, styles.tableInFrame]} testID="format-objective-pause-table">
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHead, styles.tableName]}>{tt.movement}</Text>
        <Text style={[styles.tableHead, { width: objectiveColumn }]}>{tt.objective}</Text>
        <Text style={[styles.tableHead, { width: FIT_PAUSE_WIDTH }, withLoad ? null : styles.headEnd]}>{tt.pause}</Text>
        {withLoad ? <Text style={[styles.tableHead, { width: FIT_LOAD_WIDTH }, styles.headEnd]}>{tt.load}</Text> : null}
      </View>
      {movements.map((item, index) => {
        const values = item.values;
        const name = rowName(item);
        const mode = values.mode ?? defaultMode;
        const objective = values.repetitions !== undefined ? values.repetitions : mode === defaultMode ? (objectiveFallback ?? null) : null;
        const pause = values.pause ?? pauseFallback(index);
        return (
          <View key={item.exercise.id} style={[styles.tableRow, index === movements.length - 1 ? styles.tableRowLast : null]} testID={`format-objective-row-${index}`}>
            <Text style={[styles.tableCellText, styles.tableName]} numberOfLines={1}>
              {name}
            </Text>
            {model === "UNTIL_FAILURE" ? (
              <Text style={[styles.tableCellText, styles.failureText, { width: objectiveColumn }]} testID={`format-objective-${index}`}>
                {t().atFailure}
              </Text>
            ) : (
              <TableCell
                kind={mode === "DURATION" ? "duration" : "integer"}
                value={objective}
                format={(value) => formatObjective(mode, value)}
                width={objectiveColumn}
                missing={objective === null}
                onChange={(value) => onChange(index, { ...values, mode, repetitions: value })}
                {...cell(cellKey("obj", index))}
                label={`${name}, ${tt.objective}`}
                testID={`format-objective-${index}`}
              />
            )}
            <TableCell
              kind="duration"
              durationMin={0}
              value={pause}
              format={formatSeconds}
              width={FIT_PAUSE_WIDTH}
              alignEnd={!withLoad}
              onChange={(value) => (value === null ? undefined : onChange(index, { ...values, pause: value }))}
              {...cell(cellKey("pause", index))}
              label={`${name}, ${tt.pause}`}
              testID={`format-pause-${index}`}
            />
            {withLoad ? (
              <ChargeCell values={values} index={index} name={name} width={FIT_LOAD_WIDTH} onChange={onChange} cell={cell} testID={`format-objective-load-${index}`} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/**
 * Tableau des séries (Progression, MAJ 04/11 §6 quater) ou des tours (For time, §6 quater bis) : colonne Unité,
 * une colonne par série ou tour, nom et unité fixes, colonnes défilantes au-delà de trois ; charge sous l'objectif
 * quand « Avec charge » est activé. Recette n° 3 du 03/11/2026 (f3-depart) : colonnes calées à droite, la série
 * ajoutée et la cellule saisie restent visibles. Les valeurs au-delà de N restent en réserve (f3-fortime).
 */
export function SeriesTable({
  model,
  movements,
  count,
  withLoad,
  onChange,
  onAddLoad = () => undefined,
  overflow = [],
  cell,
  bare = false,
}: {
  /** For time (recette du 04/11/2026) : tableau sans fond, zones de saisie blanches, charges compactes. */
  readonly bare?: boolean;
  /**
   * Complément du 5 novembre 2026 (Hermann), §11, §14 : EMOM (S1…Sn) et Superset (Tour 1…n) reprennent ce tableau. [Chaque série préremplie avec la
   * valeur de S1 — remplacé le 06/11/2026 : chaque colonne se saisit à la main.]
   */
  readonly model: "FOR_TIME" | "PROGRESSION" | "EMOM" | "SUPERSET";
  readonly movements: readonly ModelMovement[];
  readonly count: number;
  /** « Avec charge » du questionnaire : rend disponibles les boutons « (+ kg) » / « (− kg) » de chaque ligne (§9, §16). */
  readonly withLoad: boolean;
  readonly onChange: RowChange;
  /** « (+ kg) » : la ligne de charge apparaît, le clavier s'ouvre sur sa première case. */
  readonly onAddLoad?: (index: number) => void;
  /** EMOM : cases en cause dans le contrôle des fenêtres (cadres rouges). */
  readonly overflow?: readonly { readonly index: number; readonly column: number }[];
  readonly cell: CellBinding;
}) {
  const tt = t().table;
  const columns = Array.from({ length: count }, (_, index) => index);
  // Trois colonnes visibles (n-charge-switch, décision du 05/11/2026), au moins la largeur d'une valeur.
  const [viewportWidth, setViewportWidth] = useState(0);
  const minimumWidth = movements.some((item) => item.values.mode === "DURATION") ? FIT_DURATION_WIDTH : SERIES_COLUMN_WIDTH;
  const columnWidth = viewportWidth > 0 ? Math.max(minimumWidth, Math.floor(viewportWidth / SERIES_VISIBLE_COLUMNS)) : minimumWidth;
  const charged = (values: MovementValues) => withLoad && values.loadOn === true;
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  const viewport = useRef(0);
  const shownCount = useRef(count);
  useEffect(() => {
    if (count > shownCount.current) scrollRef.current?.scrollToEnd({ animated: false });
    shownCount.current = count;
  }, [count]);
  // Recette du 06/11/2026 (t-coche-q, Hermann : « mettre le focus sur une valeur de la dernière colonne du tableau décale les colonnes du
  // tableau vers la gauche d'une colonne automatiquement, sauf si c'est la dernière. Cela permet de voir qu'il reste des colonnes à
  // renseigner ») : la colonne suivante est rendue visible avec celle qui prend le focus.
  const revealColumn = (column: number) => {
    const left = column * columnWidth;
    const right = left + columnWidth * (column < count - 1 ? 2 : 1);
    if (left < scrollX.current) scrollRef.current?.scrollTo({ x: left, animated: false });
    else if (right > scrollX.current + viewport.current) scrollRef.current?.scrollTo({ x: right - viewport.current, animated: false });
  };
  const bind = (key: string, column: number) => {
    const binding = cell(key);
    return {
      ...binding,
      onFocus: () => {
        revealColumn(column);
        binding.onFocus();
      },
    };
  };
  const heading = (column: number) => (model === "FOR_TIME" || model === "SUPERSET" ? tt.round : tt.series).replace("{n}", String(column + 1));
  // Ligne : objectif (aligné sur le nom), puis charge ou sous-titre « (rép, +kg) » du nom.
  const rowHeightOf = (values: MovementValues) =>
    SERIES_ROW_PADDING * 2 + SERIES_LINE_HEIGHT - SERIES_SECOND_LINE_RISE + (charged(values) ? SERIES_LOAD_LINE_HEIGHT : SERIES_SUBTITLE_HEIGHT);
  const prefix = model === "FOR_TIME" ? "format-for-time" : model === "EMOM" ? "format-emom" : model === "SUPERSET" ? "format-superset" : "format-progression";
  const unitOf = (values: MovementValues) =>
    values.mode === undefined && model === "EMOM" ? t().dash : (values.mode ?? "REPETITIONS") === "DURATION" ? tt.durationUnitShort : tt.repetitionsUnitShort;
  // Valeurs d'une ligne : For time (volumes, loads) ; Progression (cells).
  const objectiveAt = (values: MovementValues, column: number) => (model === "FOR_TIME" ? (values.volumes?.[column] ?? null) : (values.cells?.[column]?.repetitions ?? null));
  const loadAt = (values: MovementValues, column: number) => (model === "FOR_TIME" ? (values.loads?.[column] ?? null) : (values.cells?.[column]?.loadKg ?? null));
  const set = (values: MovementValues, column: number, patch: { readonly objective?: number | null; readonly load?: number | null }): MovementValues => {
    if (model === "FOR_TIME") {
      const volumes = [...(values.volumes ?? [])];
      const loads = [...(values.loads ?? [])];
      while (volumes.length <= column) volumes.push(null);
      while (loads.length <= column) loads.push(null);
      if (patch.objective !== undefined) volumes[column] = patch.objective;
      if (patch.load !== undefined) loads[column] = patch.load;
      return { ...values, volumes, loads };
    }
    let cells = values.cells ?? [];
    if (patch.objective !== undefined) cells = withSeriesValue(cells, column, "repetitions", patch.objective, false);
    if (patch.load !== undefined) cells = withSeriesValue(cells, column, "loadKg", patch.load, false);
    return { ...values, cells };
  };
  return (
    <View style={[styles.seriesTable, bare ? styles.seriesTableBare : null, styles.seriesColumns]} testID={`${prefix}-table`}>
      <View style={[styles.seriesNames, { width: SERIES_NAMES_WIDTH }, bare ? styles.seriesNamesBare : null]} testID={`${prefix}-names`}>
        <View style={styles.seriesHeader}>
          <Text style={[styles.tableHead, styles.tableName]}>{tt.movement}</Text>
        </View>
        {movements.map((item, index) => (
          <View key={item.exercise.id} style={[styles.seriesNameRow, index === movements.length - 1 ? styles.tableRowLast : null, { height: rowHeightOf(item.values) }]}>
            <Text style={[styles.tableCellText, styles.seriesNameLine]} numberOfLines={1}>
              {rowName(item)}
            </Text>
            {/* Unité et charge sous le nom : « (rép, +kg) », « (durée, −kg) » ; sans « Avec charge », « (rép) ». */}
            <View style={styles.seriesSubtitle} testID={`${prefix}-${index}-unit`}>
              <Text style={styles.seriesSubtitleText}>{`(${unitOf(item.values)}${withLoad ? ", " : ")"}`}</Text>
              {withLoad ? (
                <ChargeToggle
                  short
                  on={item.values.loadOn === true}
                  onPress={() => (item.values.loadOn === true ? onChange(index, { ...item.values, loadOn: false }) : onAddLoad(index))}
                  name={rowName(item)}
                  testID={`${prefix}-${index}-charge`}
                />
              ) : null}
            </View>
          </View>
        ))}
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.seriesScroll}
        contentContainerStyle={styles.seriesScrollContent}
        onLayout={(event) => {
          viewport.current = event.nativeEvent.layout.width;
          const width = event.nativeEvent.layout.width - SERIES_SIDE_INSET;
          setViewportWidth((current) => (current === width ? current : width));
        }}
        onScroll={(event) => {
          scrollX.current = event.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        testID={`${prefix}-series`}
      >
        <View style={styles.seriesBody}>
          <View style={[styles.seriesHeader, styles.seriesCells]}>
            {columns.map((column) => (
              <Text key={column} style={[styles.tableHead, { width: columnWidth }, column === count - 1 ? styles.headEnd : null]}>
                {heading(column)}
              </Text>
            ))}
          </View>
          {movements.map((item, index) => {
            const values = item.values;
            const mode = values.mode;
            // Buy-in / buy-out du For time : une seule exécution (première colonne).
            const shown = model === "FOR_TIME" && movementRole(item) !== "TOUR" ? 1 : count;
            return (
              <View key={item.exercise.id} style={[styles.seriesRow, styles.seriesValueRow, styles.seriesCells, index === movements.length - 1 ? styles.tableRowLast : null, { height: rowHeightOf(values) }]}>
                {columns.map((column) => {
                  if (column >= shown) return <View key={column} style={{ width: columnWidth }} />;
                  const objective = objectiveAt(values, column);
                  const label = tt.cellLabel.replace("{movement}", item.exercise.name).replace("{column}", heading(column));
                  return (
                    <View key={column} style={[styles.seriesCell, { width: columnWidth }, bare ? styles.seriesCellBare : null]}>
                      <TableCell
                        kind={mode === "DURATION" ? "duration" : "integer"}
                        value={objective}
                        format={(value) => (mode === "DURATION" ? formatSeconds(value) : String(value))}
                        missing={objective === null || overflow.some((cellAt) => cellAt.index === index && cellAt.column === column)}
                        width={columnWidth}
                        boxed={bare}
                        alignEnd={column === count - 1}
                        tight
                        onChange={(value) => onChange(index, set(values, column, { objective: value }))}
                        {...bind(cellKey("obj", index, column), column)}
                        label={label.replace("{kind}", tt.objectiveKind)}
                        testID={model === "FOR_TIME" ? `${prefix}-${index}-${column}` : `${prefix}-${index}-${column}-reps`}
                      />
                      {charged(values) ? (
                        <TableCell
                          kind="decimal"
                          value={loadAt(values, column)}
                          // Complément du 5 novembre 2026 (Hermann), §9 : « (12 kg) », case vide « (—) » ; affichage seulement, la valeur reste décimale.
                          format={(value) => `(${formatLoad(value)})`}
                          placeholder={tt.loadEmpty}
                          entrySuffix=" kg"
                          width={columnWidth}
                          load
                          // Recette du 05/11/2026 (k-fortime-pastille, Hermann : « Ne pas mettre de cadre blanc pour les valeurs de charge ») ;
                          // n-charge-switch : charges plus petites, serrées sous l'objectif, dans tous les tableaux des séries.
                          compact
                          small
                          alignEnd={column === count - 1}
                          barOnly={bare}
                          onChange={(value) => onChange(index, set(values, column, { load: value }))}
                          {...bind(cellKey("load", index, column), column)}
                          label={label.replace("{kind}", tt.loadKind)}
                          testID={`${prefix}-${index}-${column}-load`}
                        />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  table: { marginHorizontal: 16, marginTop: 12, borderRadius: 16, backgroundColor: PANEL, overflow: "hidden" },
  tableHeader: { flexDirection: "row", alignItems: "center", height: 28, paddingHorizontal: TABLE_SIDE_INSET, borderBottomWidth: 1, borderBottomColor: SEPARATOR },
  // Dernière colonne : titre calé à droite comme ses valeurs.
  headEnd: { textAlign: "right", paddingRight: 10 },
  tableHead: { width: COLUMN_WIDTH, textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 12, color: SECTION },
  tableName: { flex: 1, textAlign: "left", width: undefined },
  tableRow: { flexDirection: "row", alignItems: "center", minHeight: ROW_HEIGHT, paddingHorizontal: TABLE_SIDE_INSET, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  // Recette du 06/11/2026 (t-coche-q, Hermann : « supprimer la dernière barre verticale d'un cadre si elle existe ») : pas de trait sous la
  // dernière ligne d'un tableau.
  tableRowLast: { borderBottomWidth: 0 },
  tableCellText: { fontFamily: "Inter_400Regular", fontSize: 13, color: LABEL },
  tableDash: { width: COLUMN_WIDTH, textAlign: "center", color: DISABLED_VALUE },
  unitText: { textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 12, color: SECTION },
  // Recette n° 3 du 03/11/2026 (« le champ Rép. n'est pas modifiable ») : zone tactile de la hauteur de la ligne.
  cell: { minHeight: ROW_HEIGHT, textAlign: "center", fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 13, color: VALUE_COLOR, paddingVertical: 2, borderRadius: 6 },
  cellDisabled: { color: DISABLED_VALUE },
  rowNote: { paddingHorizontal: 12, paddingBottom: 6, marginTop: -4, textAlign: "right", fontFamily: "Inter_400Regular", fontSize: 11, color: SECTION },
  // « 00:00 » de guidage, atténué tant que rien n'est tapé.
  cellGuide: { color: DISABLED_VALUE },
  // Recette du 05/11/2026 (g-fortime-cadre, Hermann : « La largeur du cadre des zones de saisie n'est pas conforme. Elle doit
  // être identique aux autres zones de texte modifiable ») : pastille blanche à la largeur de sa valeur, comme les valeurs des
  // lignes de paramètres. [Zone de la largeur de la colonne — remplacée.]
  cellBoxed: { backgroundColor: "#FFFFFF", minWidth: 48, paddingHorizontal: 10, borderRadius: 10, alignSelf: "center" },
  cellCompact: { minHeight: COMPACT_LOAD_HEIGHT, fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 11 },
  cellTight: { minHeight: SERIES_LINE_HEIGHT, height: SERIES_LINE_HEIGHT, paddingVertical: 0 },
  // Complément du 5 novembre 2026 (Hermann) (Figma) : charge sur la ligne de charge, entre parenthèses, Regular 12 bleu ; case vide « (—) » grise.
  cellLoad: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 12, backgroundColor: "transparent" },
  chargeToggle: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 11, color: VALUE_COLOR },
  chargeSlot: { alignItems: "center", justifyContent: "center", gap: 2 },
  tableInFrame: { backgroundColor: "transparent", marginHorizontal: 0, marginTop: 0 },
  failureText: { textAlign: "center", fontFamily: "Inter_600SemiBold", fontWeight: "600", color: LABEL },
  cellBadge: { minHeight: 26, minWidth: 48, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: "#FFFFFF" },
  // r-colonnes (06/11/2026) : pastille Max calée à droite, titre centré au-dessus.
  maxHead: { width: FIT_MAX_WIDTH, textAlign: "right", paddingRight: 8 },
  maxSlot: { width: FIT_MAX_WIDTH, alignItems: "flex-end", paddingRight: 10 },
  seriesTableBare: { marginVertical: 0, backgroundColor: "transparent" },
  seriesNamesBare: { paddingLeft: SERIES_SIDE_INSET },
  seriesCellBare: { gap: 0 },
  // Recette du 05/11/2026 (e-fortime-unite, Hermann : « Décaler encore au maximum à droite ») : unité calée contre les tours.
  unitTextBare: { textAlign: "right", paddingRight: 4 },
  unitColumn: { alignItems: "center", justifyContent: "center", gap: 2 },
  unitColumnCharged: { justifyContent: "space-around" },
  // Contre-recette n° 3 ter du 03/11/2026 (« Les champs de valeur du tableau encore à renseigner doivent être avec un
  // fond rouge ») : fond rouge léger des valeurs à renseigner ou en cause.
  cellMissing: { backgroundColor: tokenColors.dangerSurface },
  // Recette du 06/11/2026 (t-coche-direct) : charge à renseigner, cadre orange (couleurs « à vérifier » existantes).
  cellPending: { backgroundColor: toVerifyColors.surface, borderWidth: 1, borderColor: toVerifyColors.border },
  // Dernière colonne : texte calé à droite, au retrait du texte des pastilles (10).
  cellEnd: { textAlign: "right", paddingRight: 10 },
  // Largeur suivant le texte (voir `TableCell`) : texte invisible qui dimensionne, champ posé par-dessus.
  cellSizer: { opacity: 0 },
  cellOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, minWidth: 0 },
  cellSlotCentered: { alignSelf: "center" },
  cellSlotEnd: { alignSelf: "flex-end" },
  // MAJ 04/11 §4.5 : la case en cours de saisie est surlignée.
  cellActive: { backgroundColor: "#E8E9FF" },
  radioSlot: { width: COLUMN_WIDTH, alignItems: "center", justifyContent: "center", minHeight: ROW_HEIGHT },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#9499A8", alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: VALUE_COLOR, backgroundColor: VALUE_COLOR },
  radioDisabled: { borderColor: DISABLED_VALUE, opacity: 0.5 },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  seriesTable: { overflow: "hidden" },
  seriesColumns: { flexDirection: "row" },
  seriesNames: { width: SERIES_NAME_WIDTH + SERIES_UNIT_WIDTH, paddingLeft: SERIES_SIDE_INSET },
  seriesHeader: { flexDirection: "row", alignItems: "center", height: 28, borderBottomWidth: 1, borderBottomColor: SEPARATOR },
  seriesRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  seriesCells: { justifyContent: "flex-end" },
  seriesCell: { width: SERIES_COLUMN_WIDTH, alignItems: "center", gap: 0 },
  seriesBody: { flexGrow: 1 },
  seriesNameRow: { justifyContent: "flex-start", paddingTop: SERIES_ROW_PADDING, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  seriesNameLine: { height: SERIES_LINE_HEIGHT, lineHeight: SERIES_LINE_HEIGHT },
  seriesSubtitle: { flexDirection: "row", alignItems: "center", height: SERIES_SUBTITLE_HEIGHT, marginTop: -SERIES_SECOND_LINE_RISE },
  seriesSubtitleText: { fontFamily: "Inter_400Regular", fontSize: 11, color: SECTION },
  seriesValueRow: { alignItems: "flex-start", paddingTop: SERIES_ROW_PADDING },
  cellSmall: { minHeight: SERIES_LOAD_LINE_HEIGHT, paddingVertical: 0, fontSize: 11, lineHeight: SERIES_LOAD_LINE_HEIGHT, marginTop: -SERIES_SECOND_LINE_RISE },
  seriesScroll: { flex: 1 },
  seriesScrollContent: { flexGrow: 1, paddingRight: SERIES_SIDE_INSET },
});
