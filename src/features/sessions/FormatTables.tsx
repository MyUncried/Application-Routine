import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import type { ExecutionMode } from "@/domain/activities/ExecutionParameters";
import {
  movementRole,
  type FormatModelKey,
  type ModelAnswers,
  type ModelMovement,
  type MovementValues,
} from "@/domain/sessions/formatModels";
import { cellDurationSeconds, composeCellEntry, formatMmss, mmssDigitsOf, type CellEntryKind, type CellEntryState } from "@/features/activities/cellEntry";
import { strings } from "@/shared/i18n";
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
const COLUMN_WIDTH = 64;
const SERIES_NAME_WIDTH = 104;
const SERIES_UNIT_WIDTH = 52;
const SERIES_COLUMN_WIDTH = 56;
const ROW_HEIGHT = 36;
const LOAD_ROW_HEIGHT = 72;
/**
 * Recette du 04/11/2026 (f4-modale) — EMOM : « "12 min 30" ne tient pas dans son cadre sur une ligne » ; AMRAP : « aligner
 * les pastilles Max à droite sur les textes, centrer le titre de la colonne en conséquence ; décaler les autres colonnes
 * d'autant, réduire l'espace entre les colonnes » ; For time : « décaler la colonne de l'unité plus à droite », charges
 * « police plus petite, pas en gras, espace vertical réduit avec la ligne d'objectifs au-dessus ».
 */
const OBJECTIVE_WIDTH = 84;
const NARROW_WIDTH = 58;
const MAX_WIDTH = 28;
const BARE_NAME_WIDTH = 124;
const COMPACT_LOAD_HEIGHT = 24;
const BARE_LOAD_ROW_HEIGHT = ROW_HEIGHT + COMPACT_LOAD_HEIGHT + 2;

const t = () => strings.screens.formatModel;

/** Branchement d'une cellule sur la navigation au clavier (Précédent / Suivant, barre d'unité). */
export type CellBinding = (key: string) => {
  readonly inputRef: (input: TextInput | null) => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
  /** Cellule active (surlignée). */
  readonly active: boolean;
};

/** Clé de cellule : `genre-ligne-colonne` (obj : objectif, inc : par tour, load : charge, linc : + / série, start, sinc). */
export type CellKind = "obj" | "inc" | "load" | "linc" | "start" | "sinc";

export function cellKey(kind: CellKind, row: number, column = 0): string {
  return `${kind}-${row}-${column}`;
}

export function parseCellKey(key: string): { readonly kind: CellKind; readonly row: number; readonly column: number } | null {
  const match = /^(obj|inc|load|linc|start|sinc)-(\d+)-(\d+)$/u.exec(key);
  return match === null ? null : { kind: match[1] as CellKind, row: Number(match[2]), column: Number(match[3]) };
}

/** Le modèle présente une colonne d'objectif à unité (barre Répétitions | Durée). */
export function objectiveHasUnit(model: FormatModelKey): boolean {
  return model === "AMRAP" || model === "EMOM" || model === "FOR_TIME" || model === "PROGRESSION";
}

/** Tableaux présents au récapitulatif. */
export function hasSummaryTable(model: FormatModelKey, movements: readonly ModelMovement[]): boolean {
  if (model === "DEATH_BY") return movements.length > 1;
  return objectiveHasUnit(model);
}

/**
 * Ordre de Suivant (MAJ 04/11 §6 quater bis) : Progression et For time, objectif S1 → Sn (ou Tour 1 → n), puis
 * charges, puis ligne suivante ; AMRAP, Objectif → Par tour → Charge ; EMOM, Objectif → Charge → + / série ; Death
 * by, Départ → Incrément. Les cases grisées sont sautées.
 */
export function tableCellOrder(model: FormatModelKey, movements: readonly ModelMovement[], answers: ModelAnswers): string[] {
  const order: string[] = [];
  const withLoad = answers.withLoad === true;
  movements.forEach((item, row) => {
    const values = item.values;
    switch (model) {
      case "AMRAP": {
        const tour = movementRole(item) === "TOUR";
        if (values.max !== true) {
          order.push(cellKey("obj", row));
          if (answers.increasingVolume === true && tour) order.push(cellKey("inc", row));
        }
        if (withLoad) order.push(cellKey("load", row));
        return;
      }
      case "EMOM":
        order.push(cellKey("obj", row));
        if (withLoad) {
          order.push(cellKey("load", row));
          if (values.loadKg != null && !emomFixedLoad(movements, answers)) order.push(cellKey("linc", row));
        }
        return;
      case "DEATH_BY":
        if (movements.length > 1) order.push(cellKey("start", row), cellKey("sinc", row));
        return;
      case "FOR_TIME":
      case "PROGRESSION": {
        const count = model === "FOR_TIME" ? (movementRole(item) === "TOUR" ? (answers.roundCount ?? 1) : 1) : (answers.seriesCount ?? 1);
        for (let column = 0; column < count; column += 1) order.push(cellKey("obj", row, column));
        if (withLoad) for (let column = 0; column < count; column += 1) order.push(cellKey("load", row, column));
        return;
      }
      default:
        return;
    }
  });
  return order;
}

/** EMOM « dans chaque intervalle » : une série par tour et par membre, charge fixe (« + / série » inactif). */
export function emomFixedLoad(movements: readonly ModelMovement[], answers: ModelAnswers): boolean {
  return movements.length > 1 && (answers.execution ?? "EACH_INTERVAL") === "EACH_INTERVAL";
}

export function formatSeconds(seconds: number): string {
  return formatPhraseDuration(Math.max(0, Math.round(seconds)));
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

function valueOf(kind: CellEntryKind, text: string): number | null {
  if (text === "") return null;
  if (kind === "duration") return cellDurationSeconds(text, DURATION_BOUNDS);
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
  testID,
}: {
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
  const shown = focused ? (kind === "duration" ? (entry.text === "" ? "" : formatMmss(entry.text)) : entry.text) : value === null ? "" : format(value);
  return (
    <TextInput
      ref={inputRef}
      value={shown}
      onFocus={() => {
        setFocused(true);
        setEntry({ text: entryOf(kind, value), fresh: true });
        onFocus?.();
      }}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      onChangeText={(next) => {
        const state = composeCellEntry(kind, entry, shown, next);
        setEntry(state);
        onChange(valueOf(kind, state.text));
      }}
      editable={!disabled}
      // Recette n° 3 bis du 03/11/2026 (f3s-clavier, « Supprimer le bouton "Next" du clavier ») : pavé numérique sans
      // touche de retour ; Précédent / Suivant / Fermer dans la barre au-dessus du clavier.
      keyboardType={kind === "decimal" ? "decimal-pad" : "number-pad"}
      contextMenuHidden
      placeholder={placeholder ?? t().dash}
      placeholderTextColor={missing ? VALUE_COLOR : DISABLED_VALUE}
      accessibilityLabel={label}
      style={[
        styles.cell,
        { width },
        boxed ? styles.cellBoxed : null,
        compact ? styles.cellCompact : null,
        disabled ? styles.cellDisabled : null,
        !disabled && missing ? styles.cellMissing : null,
        active || focused ? styles.cellActive : null,
      ]}
      testID={testID}
    />
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
  cell,
}: {
  readonly movements: readonly ModelMovement[];
  readonly increasing: boolean;
  readonly withLoad: boolean;
  readonly onChange: RowChange;
  readonly cell: CellBinding;
}) {
  const tt = t().table;
  return (
    <View style={styles.table} testID="format-amrap-table">
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHead, styles.tableName]}>{tt.movement}</Text>
        <Text style={[styles.tableHead, { width: OBJECTIVE_WIDTH }]}>{tt.objective}</Text>
        {increasing ? <Text style={[styles.tableHead, { width: NARROW_WIDTH }]}>{tt.perRound}</Text> : null}
        {withLoad ? <Text style={[styles.tableHead, { width: NARROW_WIDTH }]}>{tt.load}</Text> : null}
        <Text style={[styles.tableHead, styles.maxHead]}>{tt.max}</Text>
      </View>
      {movements.map((item, index) => {
        const values = item.values;
        const tour = movementRole(item) === "TOUR";
        const max = values.max === true;
        const name = rowName(item);
        const mode = values.mode;
        return (
          <View key={item.exercise.id} style={styles.tableRow} testID={`format-amrap-row-${index}`}>
            <Text style={[styles.tableCellText, styles.tableName]} numberOfLines={1}>
              {name}
            </Text>
            <TableCell
              kind={mode === "DURATION" ? "duration" : "integer"}
              value={values.repetitions ?? null}
              format={(value) => formatObjective(mode, value)}
              width={OBJECTIVE_WIDTH}
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
                  format={(value) => `+ ${mode === "DURATION" ? formatSeconds(value) : value}`}
                  placeholder="+"
                  width={NARROW_WIDTH}
                  missing={!max && values.increment == null}
                  disabled={max}
                  onChange={(value) => onChange(index, { ...values, increment: value })}
                  {...cell(cellKey("inc", index))}
                  label={`${name}, ${tt.perRound}`}
                  testID={`format-amrap-increment-${index}`}
                />
              ) : (
                <Text style={[styles.tableDash, { width: NARROW_WIDTH }]}>{t().dash}</Text>
              )
            ) : null}
            {withLoad ? (
              <TableCell
                kind="decimal"
                value={values.loadKg ?? null}
                format={formatLoad}
                width={NARROW_WIDTH}
                onChange={(value) => onChange(index, { ...values, loadKg: value })}
                {...cell(cellKey("load", index))}
                label={`${name}, ${tt.load}`}
                testID={`format-amrap-load-${index}`}
              />
            ) : null}
            <Pressable
              onPress={() => onChange(index, { ...values, max: !max })}
              accessibilityRole="radio"
              accessibilityState={{ checked: max }}
              accessibilityLabel={`${name}, ${tt.max}`}
              style={[styles.radioSlot, styles.maxSlot]}
              testID={`format-amrap-max-${index}`}
            >
              <View style={[styles.radio, max ? styles.radioOn : null]}>{max ? <View style={styles.radioDot} /> : null}</View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

/** EMOM (MAJ 04/11 §4.2, §6 quater bis) : Mouvement | Objectif | (Charge | + / série). */
export function EmomTable({
  movements,
  withLoad,
  fixedLoad,
  overflow,
  onChange,
  cell,
}: {
  readonly movements: readonly ModelMovement[];
  readonly withLoad: boolean;
  /** « Dans chaque intervalle » : charge fixe, « + / série » inactif. */
  readonly fixedLoad: boolean;
  /** Lignes en cause dans le contrôle des durées (cadre rouge). */
  readonly overflow: readonly number[];
  readonly onChange: RowChange;
  readonly cell: CellBinding;
}) {
  const tt = t().table;
  return (
    <View style={styles.table} testID="format-emom-table">
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHead, styles.tableName]}>{tt.movement}</Text>
        <Text style={[styles.tableHead, { width: OBJECTIVE_WIDTH }]}>{tt.objective}</Text>
        {withLoad ? <Text style={styles.tableHead}>{tt.load}</Text> : null}
        {withLoad ? <Text style={styles.tableHead}>{tt.perSeries}</Text> : null}
      </View>
      {movements.map((item, index) => {
        const values = item.values;
        const name = rowName(item);
        const mode = values.mode;
        return (
          <View key={item.exercise.id} style={styles.tableRow} testID={`format-emom-row-${index}`}>
            <Text style={[styles.tableCellText, styles.tableName]} numberOfLines={1}>
              {name}
            </Text>
            <TableCell
              kind={mode === "DURATION" ? "duration" : "integer"}
              value={values.repetitions ?? null}
              format={(value) => formatObjective(mode, value)}
              width={OBJECTIVE_WIDTH}
              missing={values.repetitions == null || overflow.includes(index)}
              // Ligne sans unité — Hermann, 04/11/2026 : « si la valeur est saisie avant le choix, elle est renseignée comme une
              // répétition, mais le choix reste affiché » : la valeur est lue en Répétitions, l'unité reste à choisir (barre
              // Répétitions | Durée).
              onChange={(value) => onChange(index, { ...values, repetitions: value })}
              {...cell(cellKey("obj", index))}
              label={`${name}, ${tt.objective}`}
              testID={`format-emom-objective-${index}`}
            />
            {withLoad ? (
              <TableCell
                kind="decimal"
                value={values.loadKg ?? null}
                format={formatLoad}
                onChange={(value) => onChange(index, { ...values, loadKg: value })}
                {...cell(cellKey("load", index))}
                label={`${name}, ${tt.load}`}
                testID={`format-emom-load-${index}`}
              />
            ) : null}
            {withLoad ? (
              <TableCell
                kind="decimal"
                value={values.loadIncrement ?? null}
                format={(value) => `+ ${formatLoad(value)}`}
                placeholder={values.loadIncrement === null ? tt.variable : t().dash}
                // L'incrément est grisé tant qu'aucune charge de départ n'est renseignée.
                disabled={fixedLoad || values.loadKg == null}
                onChange={(value) => onChange(index, { ...values, loadIncrement: value ?? 0, seriesLoads: undefined })}
                {...cell(cellKey("linc", index))}
                label={`${name}, ${tt.perSeries}`}
                testID={`format-emom-load-increment-${index}`}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** Death by à plusieurs mouvements (MAJ 04/11 §4.3) : Mouvement | Départ | Incrément. */
export function DeathByTable({ movements, onChange, cell }: { readonly movements: readonly ModelMovement[]; readonly onChange: RowChange; readonly cell: CellBinding }) {
  const tt = t().table;
  return (
    <View style={styles.table} testID="format-death-by-table">
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHead, styles.tableName]}>{tt.movement}</Text>
        <Text style={styles.tableHead}>{tt.start}</Text>
        <Text style={styles.tableHead}>{tt.increment}</Text>
      </View>
      {movements.map((item, index) => {
        const values = item.values;
        const name = rowName(item);
        return (
          <View key={item.exercise.id} style={styles.tableRow} testID={`format-death-by-row-${index}`}>
            <Text style={[styles.tableCellText, styles.tableName]} numberOfLines={1}>
              {name}
            </Text>
            <TableCell
              kind="integer"
              value={values.start ?? null}
              format={String}
              missing={values.start == null || values.start < 1}
              onChange={(value) => onChange(index, { ...values, start: value })}
              {...cell(cellKey("start", index))}
              label={`${name}, ${tt.start}`}
              testID={`format-death-by-start-${index}`}
            />
            <TableCell
              kind="integer"
              value={values.startIncrement ?? null}
              format={(value) => `+ ${value}`}
              placeholder="+"
              missing={values.startIncrement == null || values.startIncrement < 1}
              onChange={(value) => onChange(index, { ...values, startIncrement: value })}
              {...cell(cellKey("sinc", index))}
              label={`${name}, ${tt.increment}`}
              testID={`format-death-by-increment-${index}`}
            />
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
  cell,
  bare = false,
}: {
  /** For time (recette du 04/11/2026) : tableau sans fond, zones de saisie blanches, charges compactes. */
  readonly bare?: boolean;
  readonly model: "FOR_TIME" | "PROGRESSION";
  readonly movements: readonly ModelMovement[];
  readonly count: number;
  readonly withLoad: boolean;
  readonly onChange: RowChange;
  readonly cell: CellBinding;
}) {
  const tt = t().table;
  const columns = Array.from({ length: count }, (_, index) => index);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  const viewport = useRef(0);
  const shownCount = useRef(count);
  useEffect(() => {
    if (count > shownCount.current) scrollRef.current?.scrollToEnd({ animated: false });
    shownCount.current = count;
  }, [count]);
  const revealColumn = (column: number) => {
    const left = column * SERIES_COLUMN_WIDTH;
    const right = left + SERIES_COLUMN_WIDTH;
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
  const heading = (column: number) => (model === "FOR_TIME" ? tt.round : tt.series).replace("{n}", String(column + 1));
  const rowHeight = withLoad ? (bare ? BARE_LOAD_ROW_HEIGHT : LOAD_ROW_HEIGHT) : ROW_HEIGHT;
  const nameWidth = bare ? BARE_NAME_WIDTH : SERIES_NAME_WIDTH;
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
    const cells = [...(values.cells ?? [])];
    while (cells.length <= column) cells.push({ repetitions: null, loadKg: null });
    cells[column] = {
      repetitions: patch.objective !== undefined ? patch.objective : cells[column]!.repetitions,
      loadKg: patch.load !== undefined ? patch.load : cells[column]!.loadKg,
    };
    return { ...values, cells };
  };
  return (
    <View style={[styles.seriesTable, bare ? styles.seriesTableBare : null, styles.seriesColumns]} testID={model === "FOR_TIME" ? "format-for-time-table" : "format-progression-table"}>
      <View style={[styles.seriesNames, { width: nameWidth + SERIES_UNIT_WIDTH }, bare ? styles.seriesNamesBare : null]} testID={model === "FOR_TIME" ? "format-for-time-names" : "format-progression-names"}>
        <View style={styles.seriesHeader}>
          <Text style={[styles.tableHead, styles.tableName]}>{tt.movement}</Text>
          <Text style={[styles.tableHead, { width: SERIES_UNIT_WIDTH }]}>{tt.unit}</Text>
        </View>
        {movements.map((item) => (
          <View key={item.exercise.id} style={[styles.seriesRow, { height: rowHeight }]}>
            <Text style={[styles.tableCellText, styles.tableName]} numberOfLines={1}>
              {rowName(item)}
            </Text>
            <Text style={[styles.unitText, { width: SERIES_UNIT_WIDTH }]}>{(item.values.mode ?? "REPETITIONS") === "DURATION" ? tt.durationUnit : t().repetitionsUnit}</Text>
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
        }}
        onScroll={(event) => {
          scrollX.current = event.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        testID={model === "FOR_TIME" ? "format-for-time-series" : "format-progression-series"}
      >
        <View style={styles.seriesBody}>
          <View style={[styles.seriesHeader, styles.seriesCells]}>
            {columns.map((column) => (
              <Text key={column} style={[styles.tableHead, { width: SERIES_COLUMN_WIDTH }]}>
                {heading(column)}
              </Text>
            ))}
          </View>
          {movements.map((item, index) => {
            const values = item.values;
            const mode = values.mode;
            // Buy-in / buy-out du For time : une seule exécution (première colonne).
            const shown = model === "FOR_TIME" && movementRole(item) !== "TOUR" ? 1 : count;
            const prefix = model === "FOR_TIME" ? "format-for-time" : "format-progression";
            return (
              <View key={item.exercise.id} style={[styles.seriesRow, styles.seriesCells, { height: rowHeight }]}>
                {columns.map((column) => {
                  if (column >= shown) return <View key={column} style={{ width: SERIES_COLUMN_WIDTH }} />;
                  const objective = objectiveAt(values, column);
                  const label = tt.cellLabel.replace("{movement}", item.exercise.name).replace("{column}", heading(column));
                  return (
                    <View key={column} style={[styles.seriesCell, bare ? styles.seriesCellBare : null]}>
                      <TableCell
                        kind={mode === "DURATION" ? "duration" : "integer"}
                        value={objective}
                        format={(value) => (mode === "DURATION" ? formatSeconds(value) : String(value))}
                        missing={objective === null}
                        width={SERIES_COLUMN_WIDTH}
                        boxed={bare}
                        onChange={(value) => onChange(index, set(values, column, { objective: value }))}
                        {...bind(cellKey("obj", index, column), column)}
                        label={label.replace("{kind}", tt.objectiveKind)}
                        testID={model === "FOR_TIME" ? `${prefix}-${index}-${column}` : `${prefix}-${index}-${column}-reps`}
                      />
                      {withLoad ? (
                        <TableCell
                          kind="decimal"
                          value={loadAt(values, column)}
                          format={formatLoad}
                          width={SERIES_COLUMN_WIDTH}
                          boxed={bare}
                          compact={bare}
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
  tableHeader: { flexDirection: "row", alignItems: "center", height: 28, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: SEPARATOR },
  tableHead: { width: COLUMN_WIDTH, textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 12, color: SECTION },
  tableName: { flex: 1, textAlign: "left", width: undefined },
  tableRow: { flexDirection: "row", alignItems: "center", minHeight: ROW_HEIGHT, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  tableCellText: { fontFamily: "Inter_400Regular", fontSize: 13, color: LABEL },
  tableDash: { width: COLUMN_WIDTH, textAlign: "center", color: DISABLED_VALUE },
  unitText: { textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 12, color: SECTION },
  // Recette n° 3 du 03/11/2026 (« le champ Rép. n'est pas modifiable ») : zone tactile de la hauteur de la ligne.
  cell: { minHeight: ROW_HEIGHT, textAlign: "center", fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 13, color: VALUE_COLOR, paddingVertical: 2, borderRadius: 6 },
  cellDisabled: { color: DISABLED_VALUE },
  cellBoxed: { backgroundColor: "#FFFFFF" },
  cellCompact: { minHeight: COMPACT_LOAD_HEIGHT, fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 11 },
  maxHead: { width: MAX_WIDTH },
  maxSlot: { width: MAX_WIDTH },
  seriesTableBare: { marginVertical: 0, backgroundColor: "transparent" },
  seriesNamesBare: { paddingLeft: 0 },
  seriesCellBare: { gap: 2 },
  // Contre-recette n° 3 ter du 03/11/2026 (« Les champs de valeur du tableau encore à renseigner doivent être avec un
  // fond rouge ») : fond rouge léger des valeurs à renseigner ou en cause.
  cellMissing: { backgroundColor: tokenColors.dangerSurface },
  // MAJ 04/11 §4.5 : la case en cours de saisie est surlignée.
  cellActive: { backgroundColor: "#E8E9FF" },
  radioSlot: { width: COLUMN_WIDTH, alignItems: "center", justifyContent: "center", minHeight: ROW_HEIGHT },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#9499A8", alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: VALUE_COLOR, backgroundColor: VALUE_COLOR },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  seriesTable: { marginVertical: 8, borderRadius: 8, backgroundColor: "#FFFFFF", overflow: "hidden" },
  seriesColumns: { flexDirection: "row" },
  seriesNames: { width: SERIES_NAME_WIDTH + SERIES_UNIT_WIDTH, paddingLeft: 12 },
  seriesHeader: { flexDirection: "row", alignItems: "center", height: 28, borderBottomWidth: 1, borderBottomColor: SEPARATOR },
  seriesRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  seriesCells: { justifyContent: "flex-end" },
  seriesCell: { width: SERIES_COLUMN_WIDTH, alignItems: "center" },
  seriesBody: { flexGrow: 1 },
  seriesScroll: { flex: 1 },
  seriesScrollContent: { flexGrow: 1, paddingRight: 12 },
});
