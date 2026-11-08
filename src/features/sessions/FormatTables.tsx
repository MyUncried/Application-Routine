import { useCallback, useEffect, useRef, useState } from "react";
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
import { useReduceMotion } from "@/shared/ui/useReduceMotion";
import { VALUE_FIELD_HEIGHT, valueFieldColors, valueFieldStyles } from "@/shared/ui/valueField";

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

const SEPARATOR = "#E0E3E8";
const LABEL = "#141414";
const SECTION = "#595E66";
/** Complément du 5 novembre 2026 (Hermann) (Figma) : case de charge vide « (—) ». */
const LOAD_EMPTY = "#999EA8";
const ROW_HEIGHT = 36;
/**
 * Recette iPhone du 06/11/2026, remarque générale e (Hermann, texte complet au registre ch07, « Homogénéité des tableaux des
 * Formats et convention des champs de valeur ») : « IL y a deux formes de tableaux dans les formats. Avec séries en colonne, et
 * avec unité en colonne. Chaque type de tableau doit être homogène entre les différents formats qui l'utilisent (même forme,
 * positionnement des colonnes, espaces verticaux et horizontaux, couleur / forme des champs et des valeurs, dynamique de saisie
 * (déplacement automatique des colonnes) » ; « La première colonne est alignée à droite au maximum en respectant la marge du cadre
 * du champ de valeur avec le bord du tableau » ; « les colonnes sont équitablement réparties entre elle horizontalement » ;
 * « 4 colonnes affichées en même temps au maximum » ; « la première colonne (S1) le plus décalé possible à droite pour donner de
 * l'espace au nom du mouvement ».
 *
 * Mise en œuvre commune aux deux formes : colonnes séparées d'un même écart, calées à droite, le dernier champ au retrait des
 * pastilles des lignes de paramètres (16 du bord du cadre) ; le nom du mouvement prend toute la place restante. Tableau des séries :
 * toutes les colonnes (S1…Sn) ont la largeur du plus large champ du tableau (mesurée). Tableaux à une ligne par mouvement : chaque
 * colonne a la largeur de son plus large champ (mesurée), Max celle de son bouton — recette iPhone du 07/11/2026 (y-format-cadres,
 * Hermann : « AMRAP - le tableau a 4 colonnes prends toute la place, on ne voit pas les noms de mouvement. Décaler la colonne Max à
 * droite. Réduire l'espace entre les Colonnes Charge et Max. »).
 * [Largeurs fixes par nature de colonne (FIT_*), colonnes du tableau des séries au tiers de la fenêtre, dernière colonne calée à
 * droite au retrait du texte — remplacées le 07/11/2026. Même largeur pour toutes les colonnes d'un tableau à une ligne par
 * mouvement (celle du plus large champ du tableau, Max compris) — remplacée le 07/11/2026 (y-format-cadres).]
 */
const TABLE_SIDE_INSET = 16;
const COLUMN_GAP = 8;
/**
 * Tableaux à une ligne par mouvement : écart entre colonnes de valeurs réduit à 4 (recette iPhone du 07/11/2026, a-amrap-table,
 * Hermann : « Réduire encore les espaces entre les colonnes / Réduire la largeur de la colonne charge et de la colonne Max »).
 * [Écart de 8 entre ces colonnes — remplacé le 08/11/2026.]
 */
const UNIT_COLUMN_GAP = 4;
/**
 * Largeur minimale d'une colonne de tableau des séries (titres « S1 »… et valeurs) : 56. Dans un tableau à une ligne par mouvement,
 * la colonne prend la largeur de son titre mesuré ou de son plus large champ (a-amrap-table, 08/11/2026), au moins
 * `MIN_UNIT_COLUMN_WIDTH`. [Minimum de 56 pour toutes les colonnes — remplacé le 08/11/2026 pour ces tableaux.]
 */
const MIN_COLUMN_WIDTH = 56;
const MIN_UNIT_COLUMN_WIDTH = 32;
/**
 * Colonne Max (AMRAP) : largeur de son bouton radio (20) et de son titre ; bouton calé à droite (y-format-cadres, 07/11/2026 ;
 * a-amrap-table, 08/11/2026). [32 — remplacé le 08/11/2026.]
 */
const MAX_COLUMN_WIDTH = 26;
/**
 * Tableau des séries : trois séries visibles (décision du 05/11/2026, n-charge-switch : « Afficher par défaut trois séries »),
 * dans la limite de quatre colonnes de la remarque e.
 */
const SERIES_VISIBLE_COLUMNS = 3;
/**
 * Tableau des séries — deux lignes par mouvement : nom et objectifs ; sous-titre « (rép, +kg) » et charges. Recette du 06/11/2026
 * (w-series, Hermann : « Aligner verticalement la ligne des valeurs des charges avec la ligne qui se trouve sous le nom du
 * mouvement ») : la seconde ligne a la même hauteur des deux côtés, le sous-titre est centré sur les charges.
 */
const SERIES_ROW_PADDING = 6;
const SERIES_LINE_GAP = 4;
const SERIES_SUBTITLE_HEIGHT = 16;
/**
 * Remarque B du 06/11/2026 (Hermann : « déplacement dynamique du tableau : déplacer le tableau lentement ») : décalage
 * automatique des colonnes animé, 450 ms (instantané si « Réduire les animations »).
 */
const COLUMN_SHIFT_MS = 450;

/**
 * Largeur commune des colonnes d'un tableau : chaque champ y déclare la largeur naturelle de son texte (texte invisible mesuré) ;
 * la colonne prend la plus grande, au moins `MIN_COLUMN_WIDTH`.
 */
/**
 * Largeur propre à chaque colonne d'un tableau à une ligne par mouvement (y-format-cadres, 07/11/2026) : chaque champ déclare sa
 * largeur naturelle dans sa colonne ; la colonne prend la plus grande, au moins `MIN_COLUMN_WIDTH`.
 */
function useColumnWidths(): {
  readonly widthOf: (column: string) => number;
  readonly report: (column: string, key: string) => (width: number) => void;
} {
  const widths = useRef(new Map<string, Map<string, number>>());
  const [columns, setColumns] = useState<Readonly<Record<string, number>>>({});
  const report = useCallback(
    (column: string, key: string) => (measured: number) => {
      const map = widths.current.get(column) ?? new Map<string, number>();
      widths.current.set(column, map);
      if (map.get(key) === measured) return;
      if (measured <= 0) map.delete(key);
      else map.set(key, measured);
      const next = Math.max(MIN_UNIT_COLUMN_WIDTH, Math.ceil(Math.max(0, ...map.values())));
      setColumns((current) => (current[column] === next ? current : { ...current, [column]: next }));
    },
    [],
  );
  const widthOf = useCallback((column: string) => columns[column] ?? MIN_COLUMN_WIDTH, [columns]);
  return { widthOf, report };
}

function useUniformColumnWidth(): { readonly width: number; readonly report: (key: string) => (width: number) => void } {
  const widths = useRef(new Map<string, number>());
  const [width, setWidth] = useState(MIN_COLUMN_WIDTH);
  const report = useCallback(
    (key: string) => (measured: number) => {
      const map = widths.current;
      if (map.get(key) === measured) return;
      if (measured <= 0) map.delete(key);
      else map.set(key, measured);
      const next = Math.max(MIN_COLUMN_WIDTH, Math.ceil(Math.max(0, ...map.values())));
      setWidth((current) => (current === next ? current : next));
    },
    [],
  );
  return { width, report };
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
 * Champ de valeur d'un tableau ou d'une ligne de paramètres : au repos, la valeur formatée (ou « — ») ; en saisie, la
 * composition au clavier (première frappe qui remplace, durée « MM:SS » remplie par la droite) — mêmes règles que les
 * cellules de la feuille des paramètres d'exécution (D-434, `cellEntry`). Rendu : convention unique des champs de valeur
 * (`valueField`, remarque générale e du 06/11/2026) — cadre blanc, orange ou rouge, sans liseré, valeur centrée.
 *
 * - Dans un tableau (`width` fourni) : cadre à la largeur commune de sa colonne ; la largeur naturelle du texte est mesurée
 *   (texte invisible) et déclarée au tableau par `onMeasure`.
 * - Sur une ligne de paramètres (`width` absent) : cadre à la largeur de son texte.
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
  width,
  onMeasure,
  sign,
  signed = false,
  barOnly = false,
  badge = false,
  durationMin,
  entrySuffix = "",
  load = false,
  pending = false,
  testID,
}: {
  /**
   * Recette du 06/11/2026 (t-coche-direct, Hermann : « après activation des charges, le cadre de valeur de la charge doit être orange ») :
   * charge facultative à renseigner, cadre orange. [Liseré orange — retiré (remarque e : « Pas de liseré, dans aucune situation » ;
   * w-charge-un : « Supprimer le liseré du cadre orange »).]
   */
  readonly pending?: boolean;
  /** Complément du 5 novembre 2026 (Hermann) : case de charge — valeur entre parenthèses, Regular 12, case vide « (—) » grise. */
  readonly load?: boolean;
  /**
   * Unité toujours affichée pendant la saisie — recette du 05/11/2026 (k-fortime-pastille, Hermann : « j'entre "12,5", le tableau
   * présente "12,5" au lieu de "12,5 kg". Toujours afficher "kg" ») ; le curseur reste devant l'unité.
   */
  readonly entrySuffix?: string;
  /**
   * Ligne de paramètres : le texte de la case vide (« Sans limite », « variable ») s'affiche comme une valeur — Hermann, 05/11/2026 :
   * « on utilise systématiquement le clavier pour renseigner les valeurs, plus aucun stepper ».
   */
  readonly badge?: boolean;
  /** Durée minimale admise (0 pour une pause) ; 1 s par défaut. */
  readonly durationMin?: number;
  /**
   * Case atteinte seulement par Précédent / Suivant de la barre du clavier — recette du 05/11/2026 (e-fortime-charge, Hermann :
   * « Une seule zone tactile utile qui est la première, la charge s'atteint avec les boutons suivant / précédent du clavier »).
   */
  readonly barOnly?: boolean;
  /** Case signée : « + » ou « − » toujours affiché devant la valeur en saisie. */
  readonly signed?: boolean;
  /** Case signée (incrément de charge EMOM, recette du 04/11/2026) : signe imposé, « − » affiché devant la valeur. */
  readonly sign?: 1 | -1;
  readonly kind: CellEntryKind;
  readonly value: number | null;
  readonly onChange: (value: number | null) => void;
  readonly format: (value: number) => string;
  /** Texte de la cellule vide ; « — » par défaut. */
  readonly placeholder?: string;
  /** Valeur à renseigner, ou en cause (contrôle EMOM) : cadre rouge. */
  readonly missing?: boolean;
  readonly disabled?: boolean;
  readonly active?: boolean;
  readonly inputRef?: (input: TextInput | null) => void;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
  readonly label: string;
  /** Largeur commune de la colonne (tableaux) ; absente : cadre à la largeur de son texte (lignes de paramètres). */
  readonly width?: number;
  /** Largeur naturelle du texte, déclarée au tableau (0 au démontage). */
  readonly onMeasure?: (width: number) => void;
  readonly testID: string;
}) {
  const [focused, setFocused] = useState(false);
  const [entry, setEntry] = useState<CellEntryState>({ text: "", fresh: true });
  const measureRef = useRef(onMeasure);
  useEffect(() => {
    measureRef.current = onMeasure;
  }, [onMeasure]);
  useEffect(() => () => measureRef.current?.(0), []);
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
  const fieldStyle = [
    valueFieldStyles.field,
    load ? styles.fieldLoad : null,
    disabled ? valueFieldStyles.disabled : null,
    !disabled && pending ? valueFieldStyles.toVerify : null,
    !disabled && missing ? valueFieldStyles.toComplete : null,
    active || focused ? valueFieldStyles.active : null,
    focused && kind === "duration" && entry.text === "" ? styles.cellGuide : null,
  ];
  const sizerText = shown === "" ? (placeholder ?? t().dash) : shown;
  const fixed = width !== undefined;
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
      placeholderTextColor={load ? LOAD_EMPTY : missing || badge ? valueFieldColors.editable : valueFieldColors.disabled}
      accessibilityLabel={label}
      style={fixed ? [...fieldStyle, { width }] : [...fieldStyle, styles.cellOverlay]}
      testID={testID}
    />
  );
  if (fixed) {
    return (
      <View style={[styles.fieldSlot, { width }]} pointerEvents="box-none">
        <View style={styles.measureBox} pointerEvents="none">
          <Text
            style={[...fieldStyle, styles.measureText]}
            numberOfLines={1}
            onLayout={(event) => onMeasure?.(event.nativeEvent.layout.width)}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            testID={`${testID}-measure`}
          >
            {sizerText}
          </Text>
        </View>
        {input}
      </View>
    );
  }
  // Recette du 06/11/2026 (t-emom-duree, t-coche-direct) : sur iPhone, un champ de saisie sans largeur fixe garde la largeur de son
  // premier texte. La pastille d'une ligne de paramètres prend donc la largeur d'un texte invisible identique à celui affiché ; le
  // champ la recouvre exactement.
  return (
    <View pointerEvents="box-none">
      <Text style={[...fieldStyle, styles.cellSizer]} numberOfLines={1} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {sizerText}
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

/** Titres des colonnes de valeurs : même largeur et même écart que les colonnes, centrés au-dessus. */
function ColumnHeads({
  heads,
  width,
  onMeasure,
  unit = false,
}: {
  readonly heads: readonly string[];
  readonly width: number | readonly number[];
  /** Tableau à une ligne par mouvement : chaque titre déclare sa largeur naturelle à sa colonne (a-amrap-table, 08/11/2026). */
  readonly onMeasure?: (index: number) => ((width: number) => void) | undefined;
  readonly unit?: boolean;
}) {
  return (
    <View style={unit ? styles.unitColumns : styles.columns}>
      {heads.map((head, index) => {
        const measure = onMeasure?.(index);
        return (
          <View key={index} style={{ width: typeof width === "number" ? width : (width[index] ?? MIN_COLUMN_WIDTH) }}>
            {measure ? (
              <View style={styles.measureBox} pointerEvents="none">
                <Text
                  style={styles.tableHead}
                  numberOfLines={1}
                  onLayout={(event) => measure(event.nativeEvent.layout.width)}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  {head}
                </Text>
              </View>
            ) : null}
            <Text style={styles.tableHead} numberOfLines={1}>
              {head}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** En-tête d'un tableau à une ligne par mouvement (unité en colonne). */
function MovementTableHeader({
  heads,
  width,
  onMeasure,
}: {
  readonly heads: readonly string[];
  readonly width: readonly number[];
  readonly onMeasure?: (index: number) => ((width: number) => void) | undefined;
}) {
  return (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHead, styles.tableName]} numberOfLines={1}>
        {t().table.movement}
      </Text>
      <ColumnHeads heads={heads} width={width} onMeasure={onMeasure} unit />
    </View>
  );
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
  readonly onAddLoad?: (index: number) => void;
  readonly cell: CellBinding;
}) {
  const tt = t().table;
  const column = useColumnWidths();
  const objectiveWidth = column.widthOf("obj");
  const incrementWidth = column.widthOf("inc");
  const loadWidth = column.widthOf("load");
  const heads = [tt.objective, ...(increasing ? [tt.perRound] : []), ...(withLoad ? [tt.load] : []), tt.max];
  const widths = [objectiveWidth, ...(increasing ? [incrementWidth] : []), ...(withLoad ? [loadWidth] : []), MAX_COLUMN_WIDTH];
  const headKeys = ["obj", ...(increasing ? ["inc"] : []), ...(withLoad ? ["load"] : [])];
  return (
    <View style={[styles.table, styles.tableInFrame]} testID="format-amrap-table">
      <MovementTableHeader heads={heads} width={widths} onMeasure={(at) => (headKeys[at] ? column.report(headKeys[at], "head") : undefined)} />
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
            <View style={styles.unitColumns}>
              <TableCell
                kind={mode === "DURATION" ? "duration" : "integer"}
                value={values.repetitions ?? null}
                format={(value) => formatObjective(mode, value)}
                width={objectiveWidth}
                onMeasure={column.report("obj", `obj-${index}`)}
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
                    width={incrementWidth}
                    onMeasure={column.report("inc", `inc-${index}`)}
                    missing={!max && values.increment == null}
                    disabled={max}
                    onChange={(value) => onChange(index, { ...values, increment: value })}
                    {...cell(cellKey("inc", index))}
                    label={`${name}, ${tt.perRound}`}
                    testID={`format-amrap-increment-${index}`}
                  />
                ) : (
                  <Text style={[styles.slotText, { width: incrementWidth }]}>{t().dash}</Text>
                )
              ) : null}
              {withLoad ? <ChargeCell values={values} index={index} name={name} width={loadWidth} onMeasure={column.report("load", `load-${index}`)} onChange={onChange} cell={cell} testID={`format-amrap-load-${index}`} /> : null}
              {/* Recette du 05/11/2026 (n-charge-colonne, Hermann : « Max en Répétitions seulement ») : Max indisponible en Durée. */}
              <Pressable
                onPress={() => onChange(index, { ...values, max: !max })}
                disabled={mode === "DURATION"}
                accessibilityRole="radio"
                accessibilityState={{ checked: max, disabled: mode === "DURATION" }}
                accessibilityLabel={`${name}, ${tt.max}`}
                style={[styles.radioSlot, styles.radioSlotEnd, { width: MAX_COLUMN_WIDTH }]}
                testID={`format-amrap-max-${index}`}
              >
                <View style={[styles.radio, max ? styles.radioOn : null, mode === "DURATION" ? styles.radioDisabled : null]}>{max ? <View style={styles.radioDot} /> : null}</View>
              </Pressable>
            </View>
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
  onMeasure,
  onChange,
  cell,
  testID,
}: {
  readonly values: MovementValues;
  readonly index: number;
  readonly name: string;
  readonly width: number;
  readonly onMeasure: (width: number) => void;
  readonly onChange: RowChange;
  readonly cell: CellBinding;
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
      onMeasure={onMeasure}
      load
      pending={value === null}
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
  cell,
}: {
  readonly movements: readonly ModelMovement[];
  readonly withLoad?: boolean;
  readonly onChange: RowChange;
  readonly onAddLoad?: (index: number) => void;
  readonly cell: CellBinding;
}) {
  const tt = t().table;
  const column = useColumnWidths();
  const startWidth = column.widthOf("start");
  const incrementWidth = column.widthOf("sinc");
  const loadWidth = column.widthOf("load");
  const heads = [tt.start, tt.increment, ...(withLoad ? [tt.load] : [])];
  return (
    <View style={[styles.table, styles.tableInFrame]} testID="format-death-by-table">
      <MovementTableHeader heads={heads} width={[startWidth, incrementWidth, loadWidth]} onMeasure={(at) => column.report(["start", "sinc", "load"][at] ?? "load", "head")} />
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
            <View style={styles.unitColumns}>
              <TableCell
                kind={kind}
                value={values.start ?? null}
                // Hermann, 04/11/2026 : « death by, il manque les unités au tableau des objectifs ».
                format={(value) => formatObjective(mode, value)}
                width={startWidth}
                onMeasure={column.report("start", `start-${index}`)}
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
                width={incrementWidth}
                onMeasure={column.report("sinc", `sinc-${index}`)}
                placeholder="+"
                missing={values.startIncrement == null || values.startIncrement < 1}
                onChange={(value) => onChange(index, { ...values, startIncrement: value })}
                {...cell(cellKey("sinc", index))}
                label={`${name}, ${tt.increment}`}
                testID={`format-death-by-increment-${index}`}
              />
              {withLoad ? <ChargeCell values={values} index={index} name={name} width={loadWidth} onMeasure={column.report("load", `load-${index}`)} onChange={onChange} cell={cell} testID={`format-death-by-load-${index}`} /> : null}
            </View>
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
  const column = useColumnWidths();
  const objectiveWidth = column.widthOf("obj");
  const pauseWidth = column.widthOf("pause");
  const loadWidth = column.widthOf("load");
  const defaultMode = model === "TABATA" || model === "INTERVALS_30_30" ? "DURATION" : "REPETITIONS";
  const heads = [tt.objective, tt.pause, ...(withLoad ? [tt.load] : [])];
  return (
    <View style={[styles.table, styles.tableInFrame]} testID="format-objective-pause-table">
      <MovementTableHeader heads={heads} width={[objectiveWidth, pauseWidth, loadWidth]} onMeasure={(at) => column.report(["obj", "pause", "load"][at] ?? "load", "head")} />
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
            <View style={styles.unitColumns}>
              {model === "UNTIL_FAILURE" ? (
                // Valeur non modifiable : texte noir, sans cadre (remarque e : « noir (non modifiable) »).
                <Text style={[styles.slotText, styles.failureText, { width: objectiveWidth }]} numberOfLines={1} testID={`format-objective-${index}`}>
                  {t().atFailure}
                </Text>
              ) : (
                <TableCell
                  kind={mode === "DURATION" ? "duration" : "integer"}
                  value={objective}
                  format={(value) => formatObjective(mode, value)}
                  width={objectiveWidth}
                  onMeasure={column.report("obj", `obj-${index}`)}
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
                width={pauseWidth}
                onMeasure={column.report("pause", `pause-${index}`)}
                onChange={(value) => (value === null ? undefined : onChange(index, { ...values, pause: value }))}
                {...cell(cellKey("pause", index))}
                label={`${name}, ${tt.pause}`}
                testID={`format-pause-${index}`}
              />
              {withLoad ? <ChargeCell values={values} index={index} name={name} width={loadWidth} onMeasure={column.report("load", `load-${index}`)} onChange={onChange} cell={cell} testID={`format-objective-load-${index}`} /> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Tableau des séries (Progression, MAJ 04/11 §6 quater) ou des tours (For time, §6 quater bis) ; EMOM (S1…Sn) et Superset (Tour 1…n) :
 * une colonne par série ou tour, nom fixe, trois colonnes visibles, colonnes suivantes défilantes ; charge sous l'objectif quand
 * « Avec charge » est activé et que le mouvement est chargé. Recette n° 3 du 03/11/2026 (f3-depart) : la série ajoutée et la cellule
 * saisie restent visibles. Les valeurs au-delà de N restent en réserve (f3-fortime). Une seule forme pour les quatre Formats
 * (remarque e du 06/11/2026). [Variante For time / EMOM / Superset « sans fond, zones de saisie blanches » (`bare`) — fondue dans la
 * forme commune.]
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
}: {
  /** [Variante For time « sans fond » — remplacée par la forme commune ; prop conservée sans effet.] */
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
  const reduceMotion = useReduceMotion();
  const columns = Array.from({ length: count }, (_, index) => index);
  const column = useUniformColumnWidth();
  const width = column.width;
  const step = width + COLUMN_GAP;
  const visible = Math.max(1, Math.min(count, SERIES_VISIBLE_COLUMNS));
  const visibleWidth = visible * width + (visible - 1) * COLUMN_GAP;
  const charged = (values: MovementValues) => withLoad && values.loadOn === true;
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  const animation = useRef<number | null>(null);
  const shownCount = useRef(count);
  useEffect(() => {
    if (count > shownCount.current) scrollRef.current?.scrollToEnd({ animated: false });
    shownCount.current = count;
  }, [count]);
  useEffect(
    () => () => {
      if (animation.current !== null) cancelAnimationFrame(animation.current);
    },
    [],
  );
  // Remarque B du 06/11/2026 : « déplacer le tableau lentement ».
  const shiftTo = (target: number) => {
    if (animation.current !== null) cancelAnimationFrame(animation.current);
    animation.current = null;
    const from = scrollX.current;
    if (reduceMotion || from === target) {
      scrollRef.current?.scrollTo({ x: target, animated: false });
      scrollX.current = target;
      return;
    }
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      const progress = Math.min(1, (now - start) / COLUMN_SHIFT_MS);
      const eased = 1 - (1 - progress) ** 3;
      const x = from + (target - from) * eased;
      scrollRef.current?.scrollTo({ x, animated: false });
      scrollX.current = x;
      animation.current = progress < 1 ? requestAnimationFrame(tick) : null;
    };
    animation.current = requestAnimationFrame(tick);
  };
  // Recette du 06/11/2026 (t-coche-q, Hermann : « mettre le focus sur une valeur de la dernière colonne du tableau décale les colonnes du
  // tableau vers la gauche d'une colonne automatiquement, sauf si c'est la dernière. Cela permet de voir qu'il reste des colonnes à
  // renseigner ») : la colonne suivante est rendue visible avec celle qui prend le focus.
  const revealColumn = (at: number) => {
    const left = at * step;
    const right = left + width + (at < count - 1 ? step : 0);
    if (left < scrollX.current) shiftTo(left);
    else if (right > scrollX.current + visibleWidth) shiftTo(right - visibleWidth);
  };
  const bind = (key: string, at: number) => {
    const binding = cell(key);
    return {
      ...binding,
      onFocus: () => {
        revealColumn(at);
        binding.onFocus();
      },
    };
  };
  const heading = (at: number) => (model === "FOR_TIME" || model === "SUPERSET" ? tt.round : tt.series).replace("{n}", String(at + 1));
  // Deux lignes : nom et objectifs ; sous-titre « (rép, +kg) » et charges (même hauteur des deux côtés).
  const secondLineOf = (values: MovementValues) => (charged(values) ? VALUE_FIELD_HEIGHT : SERIES_SUBTITLE_HEIGHT);
  const rowHeightOf = (values: MovementValues) => SERIES_ROW_PADDING * 2 + VALUE_FIELD_HEIGHT + (charged(values) ? SERIES_LINE_GAP : 0) + secondLineOf(values);
  const prefix = model === "FOR_TIME" ? "format-for-time" : model === "EMOM" ? "format-emom" : model === "SUPERSET" ? "format-superset" : "format-progression";
  const unitOf = (values: MovementValues) =>
    values.mode === undefined && model === "EMOM" ? t().dash : (values.mode ?? "REPETITIONS") === "DURATION" ? tt.durationUnitShort : tt.repetitionsUnitShort;
  // Valeurs d'une ligne : For time (volumes, loads) ; Progression (cells).
  const objectiveAt = (values: MovementValues, at: number) => (model === "FOR_TIME" ? (values.volumes?.[at] ?? null) : (values.cells?.[at]?.repetitions ?? null));
  const loadAt = (values: MovementValues, at: number) => (model === "FOR_TIME" ? (values.loads?.[at] ?? null) : (values.cells?.[at]?.loadKg ?? null));
  const set = (values: MovementValues, at: number, patch: { readonly objective?: number | null; readonly load?: number | null }): MovementValues => {
    if (model === "FOR_TIME") {
      const volumes = [...(values.volumes ?? [])];
      const loads = [...(values.loads ?? [])];
      while (volumes.length <= at) volumes.push(null);
      while (loads.length <= at) loads.push(null);
      if (patch.objective !== undefined) volumes[at] = patch.objective;
      if (patch.load !== undefined) loads[at] = patch.load;
      return { ...values, volumes, loads };
    }
    let cells = values.cells ?? [];
    if (patch.objective !== undefined) cells = withSeriesValue(cells, at, "repetitions", patch.objective, false);
    if (patch.load !== undefined) cells = withSeriesValue(cells, at, "loadKg", patch.load, false);
    return { ...values, cells };
  };
  return (
    <View style={[styles.seriesTable, styles.seriesColumns]} testID={`${prefix}-table`}>
      <View style={styles.seriesNames} testID={`${prefix}-names`}>
        <View style={styles.seriesHeader}>
          <Text style={[styles.tableHead, styles.tableName]} numberOfLines={1}>
            {tt.movement}
          </Text>
        </View>
        {movements.map((item, index) => (
          <View key={item.exercise.id} style={[styles.seriesNameRow, index === movements.length - 1 ? styles.tableRowLast : null, { height: rowHeightOf(item.values) }]}>
            <Text style={[styles.tableCellText, styles.seriesNameLine]} numberOfLines={1}>
              {rowName(item)}
            </Text>
            {/* Unité et charge sous le nom : « (rép, +kg) », « (durée, −kg) » ; sans « Avec charge », « (rép) ». */}
            <View
              style={[styles.seriesSubtitle, { height: secondLineOf(item.values), marginTop: charged(item.values) ? SERIES_LINE_GAP : 0 }]}
              testID={`${prefix}-${index}-unit`}
            >
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
        style={[styles.seriesScroll, { width: visibleWidth + TABLE_SIDE_INSET }]}
        contentContainerStyle={styles.seriesScrollContent}
        onScroll={(event) => {
          scrollX.current = event.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        testID={`${prefix}-series`}
      >
        <View>
          <View style={styles.seriesHeader}>
            <ColumnHeads heads={columns.map(heading)} width={width} />
          </View>
          {movements.map((item, index) => {
            const values = item.values;
            const mode = values.mode;
            // Buy-in / buy-out du For time : une seule exécution — buy-in au premier tour, buy-out au dernier (recette iPhone du
            // 07/11/2026, y-format-cadres, Hermann : « Récapitulatif : tableau des objectifs, la valeur du buy out doit être placée au
            // dernier tour, pas au premier. ») ; sa valeur reste la première du mouvement. [Buy-out au premier tour — remplacé.]
            const role = movementRole(item);
            const once = model === "FOR_TIME" && role !== "TOUR";
            const onceAt = role === "BUY_OUT" ? count - 1 : 0;
            return (
              <View key={item.exercise.id} style={[styles.seriesValueRow, styles.columns, index === movements.length - 1 ? styles.tableRowLast : null, { height: rowHeightOf(values) }]}>
                {columns.map((at) => {
                  if (once && at !== onceAt) return <View key={at} style={{ width }} />;
                  // Rang de la valeur dans les données (buy-in / buy-out : la seule valeur du mouvement).
                  const slot = once ? 0 : at;
                  const objective = objectiveAt(values, slot);
                  const label = tt.cellLabel.replace("{movement}", item.exercise.name).replace("{column}", heading(at));
                  return (
                    <View key={at} style={[styles.seriesCell, { width, gap: charged(values) ? SERIES_LINE_GAP : 0 }]}>
                      <TableCell
                        kind={mode === "DURATION" ? "duration" : "integer"}
                        value={objective}
                        format={(value) => (mode === "DURATION" ? formatSeconds(value) : String(value))}
                        missing={objective === null || overflow.some((cellAt) => cellAt.index === index && cellAt.column === at)}
                        width={width}
                        onMeasure={column.report(`obj-${index}-${at}`)}
                        onChange={(value) => onChange(index, set(values, slot, { objective: value }))}
                        {...bind(cellKey("obj", index, slot), at)}
                        label={label.replace("{kind}", tt.objectiveKind)}
                        testID={model === "FOR_TIME" ? `${prefix}-${index}-${at}` : `${prefix}-${index}-${at}-reps`}
                      />
                      {charged(values) ? (
                        <TableCell
                          kind="decimal"
                          value={loadAt(values, slot)}
                          // Complément du 5 novembre 2026 (Hermann), §9 : « (12 kg) », case vide « (—) » ; affichage seulement, la valeur reste décimale.
                          format={(value) => `(${formatLoad(value)})`}
                          placeholder={tt.loadEmpty}
                          entrySuffix=" kg"
                          width={width}
                          onMeasure={column.report(`load-${index}-${at}`)}
                          load
                          // Recette du 05/11/2026 (e-fortime-charge) : la charge s'atteint par Précédent / Suivant.
                          barOnly
                          onChange={(value) => onChange(index, set(values, slot, { load: value }))}
                          {...bind(cellKey("load", index, slot), at)}
                          label={label.replace("{kind}", tt.loadKind)}
                          testID={`${prefix}-${index}-${at}-load`}
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
  table: { marginHorizontal: 16, marginTop: 12, borderRadius: 16, overflow: "hidden" },
  tableInFrame: { backgroundColor: "transparent", marginHorizontal: 0, marginTop: 0 },
  tableHeader: { flexDirection: "row", alignItems: "center", height: 28, paddingHorizontal: TABLE_SIDE_INSET, gap: COLUMN_GAP, borderBottomWidth: 1, borderBottomColor: SEPARATOR },
  tableHead: { textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 12, color: SECTION },
  tableName: { flex: 1, minWidth: 0, textAlign: "left" },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: ROW_HEIGHT,
    paddingHorizontal: TABLE_SIDE_INSET,
    gap: COLUMN_GAP,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SEPARATOR,
  },
  // Recette du 06/11/2026 (t-coche-q, Hermann : « supprimer la dernière barre verticale d'un cadre si elle existe ») : pas de trait sous la
  // dernière ligne d'un tableau.
  tableRowLast: { borderBottomWidth: 0 },
  tableCellText: { fontFamily: "Inter_400Regular", fontSize: 13, color: LABEL },
  // Colonnes de valeurs : même largeur, même écart (remarque e).
  columns: { flexDirection: "row", alignItems: "center", gap: COLUMN_GAP },
  unitColumns: { flexDirection: "row", alignItems: "center", gap: UNIT_COLUMN_GAP },
  // Texte non modifiable ou absent dans une colonne (« — » du buy-in AMRAP, « à l'échec »).
  slotText: { textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 13, color: valueFieldColors.disabled },
  failureText: { fontFamily: "Inter_600SemiBold", fontWeight: "600", color: valueFieldColors.readOnly },
  fieldSlot: { alignItems: "center" },
  // Complément du 5 novembre 2026 (Hermann) (Figma) : charge entre parenthèses, Regular 12 ; même cadre que les autres valeurs.
  fieldLoad: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 12 },
  // Mesure de la largeur naturelle du texte : hors flux, invisible, sans contrainte de largeur.
  measureBox: { position: "absolute", top: 0, left: 0, width: 1000, flexDirection: "row", alignItems: "flex-start", opacity: 0 },
  measureText: { alignSelf: "flex-start" },
  // « 00:00 » de guidage, atténué tant que rien n'est tapé.
  cellGuide: { color: valueFieldColors.disabled },
  // Ligne de paramètres : texte invisible qui dimensionne, champ posé par-dessus.
  cellSizer: { opacity: 0 },
  cellOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, minWidth: 0 },
  chargeToggle: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 11, color: valueFieldColors.editable },
  radioSlot: { alignItems: "center", justifyContent: "center", minHeight: ROW_HEIGHT },
  radioSlotEnd: { alignItems: "flex-end" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#9499A8", alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: valueFieldColors.editable, backgroundColor: valueFieldColors.editable },
  radioDisabled: { borderColor: valueFieldColors.disabled, opacity: 0.5 },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  seriesTable: { overflow: "hidden" },
  seriesColumns: { flexDirection: "row" },
  // Le nom prend toute la place laissée par les colonnes, calées à droite.
  seriesNames: { flex: 1, minWidth: 0, paddingLeft: TABLE_SIDE_INSET },
  seriesHeader: { flexDirection: "row", alignItems: "center", height: 28, borderBottomWidth: 1, borderBottomColor: SEPARATOR },
  seriesCell: { alignItems: "center" },
  seriesNameRow: { justifyContent: "flex-start", paddingTop: SERIES_ROW_PADDING, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  seriesNameLine: { height: VALUE_FIELD_HEIGHT, lineHeight: VALUE_FIELD_HEIGHT },
  seriesSubtitle: { flexDirection: "row", alignItems: "center" },
  seriesSubtitleText: { fontFamily: "Inter_400Regular", fontSize: 11, color: SECTION },
  seriesValueRow: { alignItems: "flex-start", paddingTop: SERIES_ROW_PADDING, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  seriesScroll: { flexGrow: 0, flexShrink: 0 },
  seriesScrollContent: { paddingRight: TABLE_SIDE_INSET },
});
