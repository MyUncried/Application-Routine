import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

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
import { colors } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";
import { valueFieldColors, valueFieldStyles } from "@/shared/ui/valueField";

/**
 * PRE-9 — tableaux des récapitulatifs des modèles de la fenêtre Formats (mise à jour consolidée des écrans Formats
 * du 04/11/2026 §4.2 à §4.5, §6 quater, §6 quater bis ; référence Formats §7.4, §7.6, §9.3, §10, §11, §12).
 *
 * Chaque ligne est un Exercice ; ses cases écrivent ses champs standards (§4.4). Saisie au **clavier numérique**,
 * sans roulette : l'objectif se règle par son unité (Répétitions | Durée, dans la barre du clavier) puis sa valeur ;
 * une durée se remplit par la droite (3, 0 → 30 s) ; la charge prend la virgule. Valeur à renseigner : fond rouge
 * léger ; une charge vide (« — ») est une série sans charge et ne bloque pas.
 *
 * - AMRAP : Mouvement | Objectif | Par tour | Max — Max grise l'Objectif et Par tour, pas la charge ; buy-in : Par tour « — ».
 *   [Colonne (Charge) — remplacée le 08/11/2026 par la spécification de Hermann : charge sous l'Objectif.]
 * - Géométrie commune des deux formes (« séries en colonnes », « paramètres en colonnes ») : spécification de Hermann du 08/11/2026,
 *   voir `TABLE_LAYOUT`.
 * - EMOM : Mouvement | Objectif | (Charge | + / série). [Colonne Mode et son popover — supprimés.]
 * - Death by à plusieurs mouvements : Mouvement | Départ | Incrément (≥ + 1).
 * - For time et Progression : Mouvement | Unité | Tour 1…n (ou S1…Sn), quatre colonnes visibles au plus, nom et
 *   unité fixes, colonnes suivantes défilantes ; ligne de charge sous l'objectif si « Avec charge ».
 */

const LABEL = "#141414";
const SECTION = "#595E66";
/** Complément du 5 novembre 2026 (Hermann) (Figma) : case de charge vide « (—) ». */
const LOAD_EMPTY = "#999EA8";
/**
 * Spécification de Hermann du 08/11/2026 (recette du 08/11/2026 — spécifications des tableaux, texte complet au registre ch07) :
 * « Récapitulatif de format — tableau « séries en colonnes » » (A, référence EMOM, Figma `8624:30392`) et « tableau « paramètres en
 * colonnes » » (B, référence AMRAP, Figma `8624:30521`). « Appliquer ces valeurs exactement. N'ajouter aucune règle de format ou
 * d'espacement qui n'est pas écrite ici. » ; « Tout ce qui est commun doit rester identique. »
 *
 * - Colonnes de valeurs : largeur fixe 44 (celle de « 99′99″ » en Inter Semi Bold 13), 12 entre deux colonnes (pas de 56), placées
 *   depuis la droite, la dernière à 16 du bord droit du cadre ; colonne Mouvement de x = 16 jusqu'à 12 avant la première colonne.
 * - Verticale : pas de marge haute ; en-tête de 28 (texte de 15 à y = 6,5) ; lignes de 44 avec un séparateur de 1 #DEE3E5 en haut
 *   de chaque ligne ; marge basse 3,5. Hauteur = 28 + 44 × mouvements + 3,5.
 * - Ligne (y relatif au haut de la ligne) : nom 6,5 ; étiquette 24,5 ; cadre des cellules 10 sans charge, 2,5 avec charge (texte
 *   14 / 6,5) ; charge 24,5 ; radio Max 12. La hauteur de ligne reste 44 dans les deux états ; nom et étiquette ne bougent pas.
 *
 * [Remplacé le 08/11/2026 par la spécification de Hermann — valeurs antérieures conservées pour mémoire : retrait latéral 16 et
 * écart de 8 entre colonnes (`TABLE_SIDE_INSET`, `COLUMN_GAP`, remarque e du 06/11/2026) ; écart de 4 entre colonnes des tableaux à
 * une ligne par mouvement (`UNIT_COLUMN_GAP = 4`, a-amrap-table du 07/11/2026) ; largeur de colonne mesurée sur le plus large champ
 * ou titre, au moins 56 (`MIN_COLUMN_WIDTH`, tableau des séries) ou 32 (`MIN_UNIT_COLUMN_WIDTH`) ; colonne Max de 26
 * (`MAX_COLUMN_WIDTH`) ; lignes de 36 (`ROW_HEIGHT`) ; tableau des séries à deux lignes par mouvement de hauteur variable
 * (`SERIES_ROW_PADDING = 6`, `SERIES_LINE_GAP = 4`, `SERIES_SUBTITLE_HEIGHT = 16`, charge dans un cadre de 24) ; colonne Unité
 * (tableau des séries) et colonne Charge (tableaux à une ligne par mouvement).]
 */
export const TABLE_LAYOUT = {
  columnWidth: 44,
  columnGap: 12,
  sideInset: 16,
  nameGap: 12,
  headerHeight: 28,
  headerTextTop: 6.5,
  rowHeight: 44,
  bottomInset: 3.5,
  nameTop: 6.5,
  tagTop: 24.5,
  cellTop: 10,
  cellTopCharged: 2.5,
  cellHeight: 24,
  chargeTop: 24.5,
  radioTop: 12,
} as const;
/** Séparateur en haut de chaque ligne de mouvement (A §4.2, B §4.2). */
const ROW_SEPARATOR = "#DEE3E5";
/** Ligne cochée en Max : Objectif et Par tour en #BFC2CC (B §4.4). */
const TABLE_DISABLED = "#BFC2CC";
/** Charge « (12 kg) » centrée sous sa cellule, sans cadre : zone de texte plus large que la colonne pour « (12,5 kg) ». */
const CHARGE_BOX_WIDTH = 80;
/**
 * Tableau des séries : trois séries visibles (décision du 05/11/2026, n-charge-switch : « Afficher par défaut trois séries »),
 * dans la limite de quatre colonnes de la remarque e.
 */
const SERIES_VISIBLE_COLUMNS = 3;
/**
 * Remarque B du 06/11/2026 (Hermann : « déplacement dynamique du tableau : déplacer le tableau lentement ») : décalage
 * automatique des colonnes animé, 450 ms (instantané si « Réduire les animations »).
 */
const COLUMN_SHIFT_MS = 450;

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
  // toujours parcourue avec « Avec charge » (inchangé pour Tabata, 30/30, Renforcement, À l'échec, Death by). AMRAP : spécification de
  // Hermann du 08/11/2026 (B §4.1, §4.4) — charge sous l'Objectif après « +kg », seule une charge affichée est parcourue.
  // [AMRAP : case de charge toujours parcourue avec « Avec charge » — remplacé le 08/11/2026.]
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
        if (charged(values)) order.push(cellKey("load", row));
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

/**
 * Durées des récapitulatifs de Format (spécification de Hermann du 08/11/2026, A §1 et B §1) : à partir d'une minute « M′SS″ »
 * (minutes sans zéro initial, secondes sur 2 chiffres, aucun espace : 1′00″, 6′00″, 22′39″) ; moins d'une minute, secondes seules
 * (30″, 5″). Prime U+2032 et double prime U+2033.
 */
export function formatPrimeDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return minutes === 0 ? `${rest}″` : `${minutes}′${String(rest).padStart(2, "0")}″`;
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
 * - Dans un tableau (`width` fourni) : cadre de 44 × 24, rayon 10, marge horizontale 0, texte centré, sans fond une fois rempli ;
 *   vide : « — » rouge (`colors.danger`) sur fond rouge clair (`colors.dangerSurface`) ; charge (`load`) : texte Regular 11 sans
 *   cadre (spécification de Hermann du 08/11/2026, A §4.5, B §4.5). [Cadre blanc à la largeur mesurée de sa colonne — remplacé le
 *   08/11/2026.] `onMeasure`, facultatif, déclare encore la largeur naturelle du texte.
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
  const fixed = width !== undefined;
  const fieldStyle = [
    valueFieldStyles.field,
    fixed ? (load ? styles.tableCharge : styles.tableField) : load ? styles.fieldLoad : null,
    disabled ? (fixed ? styles.tableDisabled : valueFieldStyles.disabled) : null,
    !disabled && pending ? valueFieldStyles.toVerify : null,
    fixed && load && pending ? styles.tableChargePending : null,
    !disabled && missing ? valueFieldStyles.toComplete : null,
    active || focused ? valueFieldStyles.active : null,
    focused && kind === "duration" && entry.text === "" ? styles.cellGuide : null,
  ];
  const sizerText = shown === "" ? (placeholder ?? t().dash) : shown;
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
      // Tableau : cellule vide « — » en rouge (A §4.5, B §4.5).
      placeholderTextColor={load ? LOAD_EMPTY : missing && fixed ? colors.danger : missing || badge ? valueFieldColors.editable : valueFieldColors.disabled}
      accessibilityLabel={label}
      style={fixed ? [...fieldStyle, { width }] : [...fieldStyle, styles.cellOverlay]}
      testID={testID}
    />
  );
  if (fixed) {
    return (
      <View style={[styles.fieldSlot, { width }]} pointerEvents="box-none">
        {onMeasure ? (
          <View style={styles.measureBox} pointerEvents="none">
            <Text
              style={[...fieldStyle, styles.measureText]}
              numberOfLines={1}
              onLayout={(event) => onMeasure(event.nativeEvent.layout.width)}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              testID={`${testID}-measure`}
            >
              {sizerText}
            </Text>
          </View>
        ) : null}
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

/** Mot de l'étiquette sous le nom : « rép. » ou « durée » ; « — » pour un mouvement EMOM dont l'unité n'est pas encore choisie. */
function unitWordOf(mode: ExecutionMode | undefined, undecided = false): string {
  const tt = t().table;
  if (mode === undefined && undecided) return t().dash;
  return (mode ?? "REPETITIONS") === "DURATION" ? tt.durationUnitShort : tt.repetitionsUnitShort;
}

/**
 * Titre d'une colonne de valeurs, centré sur sa colonne de 44 (A §4.3, B §4.3) ; un titre plus large que la colonne (« Incrément »,
 * « Par tour ») déborde également des deux côtés.
 */
function HeadCell({ label }: { readonly label: string }) {
  return (
    <View style={styles.column}>
      <Text style={[styles.headText, styles.headCentered]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Nom (une ligne, points de suspension) et étiquette sous le nom, à leurs positions fixes (A §4.4, B §4.4). */
function NameBlock({ name, tag, style, testID }: { readonly name: string; readonly tag: React.ReactNode; readonly style?: StyleProp<ViewStyle>; readonly testID: string }) {
  return (
    <View style={[styles.nameArea, style]}>
      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail" testID={`${testID}-title`}>
        {name}
      </Text>
      <View style={styles.tag} testID={`${testID}-tag`}>
        {tag}
      </View>
    </View>
  );
}

/**
 * Étiquette « (rép., +kg) », « (durée, −kg) » (A §4.4, B §4.4) : parenthèses, virgule et « +kg » / « −kg » en bleu, le mot en gris ;
 * « +kg » / « −kg » ajoute ou retire la charge du mouvement. Sans « Avec charge » : « (rép.) ».
 */
function UnitTag({
  unit,
  withLoad,
  on,
  onToggle,
  name,
  testID,
  toggleTestID,
}: {
  readonly unit: string;
  readonly withLoad: boolean;
  readonly on: boolean;
  readonly onToggle: () => void;
  readonly name: string;
  readonly testID: string;
  readonly toggleTestID: string;
}) {
  return (
    <View style={styles.tagRow} testID={testID}>
      <Text style={styles.tagText}>
        (<Text style={styles.tagUnit}>{unit}</Text>
        {withLoad ? ", " : ")"}
      </Text>
      {withLoad ? (
        <>
          <ChargeToggle short on={on} onPress={onToggle} name={name} testID={toggleTestID} />
          <Text style={styles.tagText}>)</Text>
        </>
      ) : null}
    </View>
  );
}

/**
 * Colonne de valeur d'une ligne : cadre de 44 × 24 à y = 10 (sans charge) ou 2,5 (avec charge) ; charge centrée dessous à y = 24,5,
 * sans cadre (A §4.4, B §4.4).
 */
function ValueSlot({ charged, cell, charge = null, testID }: { readonly charged: boolean; readonly cell: React.ReactNode; readonly charge?: React.ReactNode; readonly testID?: string }) {
  return (
    <View style={styles.column} pointerEvents="box-none" testID={testID}>
      <View style={[styles.cellAt, { top: charged ? TABLE_LAYOUT.cellTopCharged : TABLE_LAYOUT.cellTop }]} pointerEvents="box-none" testID={testID === undefined ? undefined : `${testID}-cell`}>
        {cell}
      </View>
      {charge !== null ? (
        <View style={styles.chargeAt} pointerEvents="box-none" testID={testID === undefined ? undefined : `${testID}-charge`}>
          {charge}
        </View>
      ) : null}
    </View>
  );
}

/** Texte non modifiable ou absent dans une colonne (« — » du buy-in AMRAP, « à l'échec »), à la place du texte d'une cellule. */
function SlotText({ text, style, testID }: { readonly text: string; readonly style?: StyleProp<TextStyle>; readonly testID?: string }) {
  return (
    <Text style={[styles.slotText, style]} numberOfLines={1} testID={testID}>
      {text}
    </Text>
  );
}

/** Charge d'une cellule : « (12 kg) », Inter Regular 11, bleu, sans cadre ; atteinte par Précédent / Suivant de la barre du clavier. */
function ChargeValue({
  value,
  onChange,
  binding,
  label,
  testID,
  always = false,
}: {
  readonly value: number | null;
  readonly onChange: (value: number | null) => void;
  readonly binding: ReturnType<CellBinding>;
  readonly label: string;
  readonly testID: string;
  /**
   * Charge toujours présente avec « Avec charge » (Tabata, 30/30, Renforcement, À l'échec, Death by — recette du 06/11/2026,
   * t-coche-direct, Hermann : « retirer (+kg), mettre les cadres oranges avec un trait sur les champs charge qui ne sont pas
   * renseignés ») : vide, un trait dans un cadre orange à la largeur de la colonne ; case touchable, comme avant. Sinon (tableaux à
   * « +kg ») : case vide « (—) » grise, atteinte par Précédent / Suivant (recette du 05/11/2026, e-fortime-charge).
   */
  readonly always?: boolean;
}) {
  const pending = always && value === null;
  return (
    <TableCell
      kind="decimal"
      value={value}
      // Complément du 5 novembre 2026 (Hermann), §9 : « (12 kg) » ; affichage seulement, la valeur reste décimale.
      format={(entered) => `(${formatLoad(entered)})`}
      placeholder={always ? t().dash : t().table.loadEmpty}
      entrySuffix=" kg"
      width={pending ? TABLE_LAYOUT.columnWidth : CHARGE_BOX_WIDTH}
      load
      pending={pending}
      barOnly={!always}
      onChange={onChange}
      {...binding}
      label={label}
      testID={testID}
    />
  );
}

/** En-tête d'un tableau à une ligne par mouvement : « Mouvement » à x = 16, titres centrés sur leurs colonnes. */
function MovementTableHeader({ heads }: { readonly heads: readonly string[] }) {
  return (
    <View style={styles.header}>
      <View style={styles.nameArea}>
        <Text style={[styles.headText, styles.headName]} numberOfLines={1}>
          {t().table.movement}
        </Text>
      </View>
      <View style={styles.columns}>
        {heads.map((head, index) => (
          <HeadCell key={index} label={head} />
        ))}
      </View>
    </View>
  );
}

/** Ligne de 44 d'un tableau à une ligne par mouvement : séparateur en haut, nom et étiquette, colonnes calées à droite. */
function MovementLine({ name, tag, children, testID }: { readonly name: string; readonly tag: React.ReactNode; readonly children: React.ReactNode; readonly testID: string }) {
  return (
    <View style={styles.line} testID={testID}>
      <NameBlock name={name} tag={tag} testID={testID} />
      <View style={styles.columns}>{children}</View>
      <View style={styles.lineSeparator} pointerEvents="none" />
    </View>
  );
}

/** Incrément signé (« + 2 », « − 1′00″ ») : écriture inchangée, sans unité (B §4.4). */
function signedText(value: number, mode: ExecutionMode | undefined): string {
  return `${value < 0 ? "−" : "+"} ${mode === "DURATION" ? formatPrimeDuration(Math.abs(value)) : Math.abs(value)}`;
}

/** Valeur sans unité (« 10 ») ou durée au format M′SS″ (B §4.4). */
function valueText(value: number, mode: ExecutionMode | undefined): string {
  return mode === "DURATION" ? formatPrimeDuration(value) : String(value);
}

/**
 * AMRAP — tableau « paramètres en colonnes » (spécification de Hermann du 08/11/2026, B) : Mouvement | Objectif | (Par tour) | Max ;
 * plus de colonne Charge, la charge est affichée sous l'Objectif ; Max grise l'Objectif et Par tour, pas la charge ; buy-in : Par tour
 * « — ». [Mouvement | Objectif | Par tour | (Charge) | Max (MAJ 04/11 §4.3 bis) — remplacé le 08/11/2026.]
 */
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
  const heads = [tt.objective, ...(increasing ? [tt.perRound] : []), tt.max];
  return (
    <View style={styles.table} testID="format-amrap-table">
      <MovementTableHeader heads={heads} />
      {movements.map((item, index) => {
        const values = item.values;
        const tour = movementRole(item) === "TOUR";
        const max = values.max === true;
        const name = rowName(item);
        const mode = values.mode;
        const charged = withLoad && values.loadOn === true;
        return (
          <MovementLine
            key={item.exercise.id}
            name={name}
            tag={
              <UnitTag
                unit={unitWordOf(mode)}
                withLoad={withLoad}
                on={values.loadOn === true}
                onToggle={() => (values.loadOn === true ? onChange(index, { ...values, loadOn: false }) : onAddLoad(index))}
                name={name}
                testID={`format-amrap-${index}-unit`}
                toggleTestID={`format-amrap-${index}-charge`}
              />
            }
            testID={`format-amrap-row-${index}`}
          >
            <ValueSlot
              charged={charged}
              testID={`format-amrap-${index}-obj`}
              cell={
                <TableCell
                  kind={mode === "DURATION" ? "duration" : "integer"}
                  value={values.repetitions ?? null}
                  format={(value) => valueText(value, mode)}
                  width={TABLE_LAYOUT.columnWidth}
                  missing={!max && values.repetitions == null}
                  disabled={max}
                  onChange={(value) => onChange(index, { ...values, repetitions: value })}
                  {...cell(cellKey("obj", index))}
                  label={`${name}, ${tt.objective}`}
                  testID={`format-amrap-reps-${index}`}
                />
              }
              charge={
                charged ? (
                  <ChargeValue
                    value={values.loadKg ?? null}
                    onChange={(entered) => onChange(index, { ...values, loadKg: entered })}
                    binding={cell(cellKey("load", index))}
                    label={`${name}, ${tt.load}`}
                    testID={`format-amrap-load-${index}`}
                  />
                ) : null
              }
            />
            {increasing ? (
              <ValueSlot
                charged={charged}
                testID={`format-amrap-${index}-inc`}
                cell={
                  tour ? (
                    <TableCell
                      kind={mode === "DURATION" ? "duration" : "integer"}
                      value={values.increment ?? null}
                      // Complément du 5 novembre 2026 (Hermann), §8 : incrément signé, signe saisi par « ± » de la barre du clavier.
                      format={(value) => signedText(value, mode)}
                      width={TABLE_LAYOUT.columnWidth}
                      missing={!max && values.increment == null}
                      disabled={max}
                      onChange={(value) => onChange(index, { ...values, increment: value })}
                      {...cell(cellKey("inc", index))}
                      label={`${name}, ${tt.perRound}`}
                      testID={`format-amrap-increment-${index}`}
                    />
                  ) : (
                    <SlotText text={t().dash} />
                  )
                }
              />
            ) : null}
            {/* Recette du 05/11/2026 (n-charge-colonne, Hermann : « Max en Répétitions seulement ») : Max indisponible en Durée. Radio de
                20 centré dans sa colonne, toujours à y = 12 (B §4.4). */}
            <Pressable
              onPress={() => onChange(index, { ...values, max: !max })}
              disabled={mode === "DURATION"}
              accessibilityRole="radio"
              accessibilityState={{ checked: max, disabled: mode === "DURATION" }}
              accessibilityLabel={`${name}, ${tt.max}`}
              style={styles.column}
              testID={`format-amrap-max-${index}`}
            >
              <View style={[styles.radio, max ? styles.radioOn : null, mode === "DURATION" ? styles.radioDisabled : null]} testID={`format-amrap-radio-${index}`}>
                {max ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          </MovementLine>
        );
      })}
    </View>
  );
}

// [EMOM : tableau Mouvement | Objectif | (Charge | ± / série), incrément de charge et mention « sans charge à partir de la
// série X » — remplacés le 05/11/2026 (Complément du 5 novembre 2026 (Hermann), §14) par le tableau des séries S1…Sn (`SeriesTable`, modèle EMOM).]

// [Case de charge commune d'un mouvement dans une colonne Charge (`ChargeCell` : AMRAP, Death by, Tabata, 30/30, Renforcement, À
// l'échec — Complément du 5 novembre 2026, §9, §16 ; recette du 06/11/2026, t-coche-direct : case toujours présente, cadre orange tant
// qu'elle est vide) — remplacée le 08/11/2026 par la spécification de Hermann (B §4.1 : « Il n'y a plus de colonne « Charge » : la
// charge est affichée sous l'Objectif » ; §4.4 : étiquette « (rép., +kg) » sous le nom).]

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
  /** Dans l'étiquette sous le nom du mouvement : « +kg » / « −kg », entre « (rép., » et « ) ». */
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
 * Death by à plusieurs mouvements (MAJ 04/11 §4.3) : Mouvement | Départ | Incrément — grammaire commune du tableau « paramètres en
 * colonnes » (spécification de Hermann du 08/11/2026, B : « Tout ce qui est commun doit rester identique ») : valeurs sans unité
 * (« 1 », « + 1 », « 10″ »), unité dans l'étiquette sous le nom, charge sous la première colonne. [Unité dans les cases (« 1 rép. »,
 * « + 1 rép. », Complément du 5 novembre 2026, §13) et colonne Charge — remplacées le 08/11/2026.] Comportement de la charge inchangé
 * (t-coche-direct, 06/11/2026) : pas de « +kg » ; avec « Avec charge », charge toujours présente, cadre orange avec un trait si vide.
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
  return (
    <View style={styles.table} testID="format-death-by-table">
      <MovementTableHeader heads={[tt.start, tt.increment]} />
      {movements.map((item, index) => {
        const values = item.values;
        const name = rowName(item);
        const mode = values.mode;
        const kind = mode === "DURATION" ? "duration" : "integer";
        // t-coche-direct (06/11/2026) : avec « Avec charge », la charge est toujours présente — ligne dans l'état « charge affichée ».
        const charged = withLoad;
        return (
          <MovementLine
            key={item.exercise.id}
            name={name}
            tag={
              // Recette du 06/11/2026 (t-coche-direct, Hermann : « retirer (+kg) ») : pas de « +kg » dans ces tableaux, l'étiquette ne
              // porte que l'unité (« (rép.) », « (durée) »).
              <UnitTag
                unit={unitWordOf(mode)}
                withLoad={false}
                on={false}
                onToggle={() => undefined}
                name={name}
                testID={`format-death-by-${index}-unit`}
                toggleTestID={`format-death-by-${index}-charge`}
              />
            }
            testID={`format-death-by-row-${index}`}
          >
            <ValueSlot
              charged={charged}
              testID={`format-death-by-${index}-start`}
              cell={
                <TableCell
                  kind={kind}
                  value={values.start ?? null}
                  format={(value) => valueText(value, mode)}
                  width={TABLE_LAYOUT.columnWidth}
                  missing={values.start == null || values.start < 1}
                  onChange={(value) => onChange(index, { ...values, start: value })}
                  {...cell(cellKey("start", index))}
                  label={`${name}, ${tt.start}`}
                  testID={`format-death-by-start-${index}`}
                />
              }
              charge={
                charged ? (
                  <ChargeValue
                    always
                    value={values.loadOn === true ? (values.loadKg ?? null) : null}
                    // Une valeur saisie applique la charge au mouvement ; vidée, la charge est retirée (t-coche-direct, inchangé).
                    onChange={(entered) => onChange(index, { ...values, loadKg: entered, loadOn: entered !== null })}
                    binding={cell(cellKey("load", index))}
                    label={`${name}, ${tt.load}`}
                    testID={`format-death-by-load-${index}`}
                  />
                ) : null
              }
            />
            <ValueSlot
              charged={charged}
              testID={`format-death-by-${index}-sinc`}
              cell={
                <TableCell
                  kind={kind}
                  value={values.startIncrement ?? null}
                  format={(value) => signedText(value, mode)}
                  width={TABLE_LAYOUT.columnWidth}
                  missing={values.startIncrement == null || values.startIncrement < 1}
                  onChange={(value) => onChange(index, { ...values, startIncrement: value })}
                  {...cell(cellKey("sinc", index))}
                  label={`${name}, ${tt.increment}`}
                  testID={`format-death-by-increment-${index}`}
                />
              }
            />
          </MovementLine>
        );
      })}
    </View>
  );
}

/**
 * Tabata, 30/30, Renforcement, À l'échec à plusieurs mouvements — Complément du 5 novembre 2026 (Hermann), §15–§17 : Mouvement |
 * Objectif | Pause, dans son propre cadre ; Objectif (Durée ou Répétitions, au clavier ; « à l'échec » pour À l'échec) et Pause propres
 * au mouvement, réglages du questionnaire par défaut. Grammaire commune du tableau « paramètres en colonnes » (spécification de
 * Hermann du 08/11/2026, B) : valeurs sans unité, durées M′SS″, charge sous l'Objectif. [Colonne Charge avec « Avec charge » —
 * remplacée le 08/11/2026.] Comportement de la charge inchangé (t-coche-direct, 06/11/2026) : pas de « +kg » ; avec « Avec charge »,
 * charge toujours présente, cadre orange avec un trait si vide.
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
  return (
    <View style={styles.table} testID="format-objective-pause-table">
      <MovementTableHeader heads={[tt.objective, tt.pause]} />
      {movements.map((item, index) => {
        const values = item.values;
        const name = rowName(item);
        const mode = values.mode ?? defaultMode;
        const objective = values.repetitions !== undefined ? values.repetitions : mode === defaultMode ? (objectiveFallback ?? null) : null;
        const pause = values.pause ?? pauseFallback(index);
        // t-coche-direct (06/11/2026) : avec « Avec charge », la charge est toujours présente — ligne dans l'état « charge affichée ».
        const charged = withLoad;
        return (
          <MovementLine
            key={item.exercise.id}
            name={name}
            tag={
              // Recette du 06/11/2026 (t-coche-direct, Hermann : « retirer (+kg) ») : pas de « +kg » dans ces tableaux, l'étiquette ne
              // porte que l'unité (« (rép.) », « (durée) »).
              <UnitTag
                unit={unitWordOf(mode)}
                withLoad={false}
                on={false}
                onToggle={() => undefined}
                name={name}
                testID={`format-objective-${index}-unit`}
                toggleTestID={`format-objective-${index}-charge`}
              />
            }
            testID={`format-objective-row-${index}`}
          >
            <ValueSlot
              charged={charged}
              testID={`format-objective-${index}-obj`}
              cell={
                model === "UNTIL_FAILURE" ? (
                  // Valeur non modifiable : texte noir, sans cadre (remarque e : « noir (non modifiable) »).
                  <SlotText text={t().atFailure} style={styles.failureText} testID={`format-objective-${index}`} />
                ) : (
                  <TableCell
                    kind={mode === "DURATION" ? "duration" : "integer"}
                    value={objective}
                    format={(value) => valueText(value, mode)}
                    width={TABLE_LAYOUT.columnWidth}
                    missing={objective === null}
                    onChange={(value) => onChange(index, { ...values, mode, repetitions: value })}
                    {...cell(cellKey("obj", index))}
                    label={`${name}, ${tt.objective}`}
                    testID={`format-objective-${index}`}
                  />
                )
              }
              charge={
                charged ? (
                  <ChargeValue
                    always
                    value={values.loadOn === true ? (values.loadKg ?? null) : null}
                    // Une valeur saisie applique la charge au mouvement ; vidée, la charge est retirée (t-coche-direct, inchangé).
                    onChange={(entered) => onChange(index, { ...values, loadKg: entered, loadOn: entered !== null })}
                    binding={cell(cellKey("load", index))}
                    label={`${name}, ${tt.load}`}
                    testID={`format-objective-load-${index}`}
                  />
                ) : null
              }
            />
            <ValueSlot
              charged={charged}
              testID={`format-objective-${index}-pause`}
              cell={
                <TableCell
                  kind="duration"
                  durationMin={0}
                  value={pause}
                  format={formatPrimeDuration}
                  width={TABLE_LAYOUT.columnWidth}
                  onChange={(value) => (value === null ? undefined : onChange(index, { ...values, pause: value }))}
                  {...cell(cellKey("pause", index))}
                  label={`${name}, ${tt.pause}`}
                  testID={`format-pause-${index}`}
                />
              }
            />
          </MovementLine>
        );
      })}
    </View>
  );
}

/**
 * Tableau « séries en colonnes » (spécification de Hermann du 08/11/2026, A) : Progression (S1…Sn), For time (Tour 1…n), EMOM (S1…Sn)
 * et Superset (Tour 1…n) — une colonne par série ou tour, nom fixe, trois colonnes visibles, colonnes suivantes défilantes ; plus de
 * colonne Unité (« rép. » ou « durée » dans l'étiquette sous le nom) ; charge « (12 kg) » sous chaque cellule, sans cadre, quand
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
  /** « Avec charge » du questionnaire : rend disponibles « +kg » / « −kg » de chaque ligne (§9, §16). */
  readonly withLoad: boolean;
  readonly onChange: RowChange;
  /** « +kg » : la ligne de charge apparaît, le clavier s'ouvre sur sa première case. */
  readonly onAddLoad?: (index: number) => void;
  /** EMOM : cases en cause dans le contrôle des fenêtres (cadres rouges). */
  readonly overflow?: readonly { readonly index: number; readonly column: number }[];
  readonly cell: CellBinding;
}) {
  const tt = t().table;
  const reduceMotion = useReduceMotion();
  const columns = Array.from({ length: count }, (_, index) => index);
  const width = TABLE_LAYOUT.columnWidth;
  const step = width + TABLE_LAYOUT.columnGap;
  const visible = Math.max(1, Math.min(count, SERIES_VISIBLE_COLUMNS));
  const visibleWidth = visible * width + (visible - 1) * TABLE_LAYOUT.columnGap;
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
  const prefix = model === "FOR_TIME" ? "format-for-time" : model === "EMOM" ? "format-emom" : model === "SUPERSET" ? "format-superset" : "format-progression";
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
    <View style={[styles.table, styles.seriesTable]} testID={`${prefix}-table`}>
      <View style={styles.seriesNames} testID={`${prefix}-names`}>
        <View style={styles.seriesNamesHeader}>
          <Text style={[styles.headText, styles.headName]} numberOfLines={1}>
            {tt.movement}
          </Text>
        </View>
        {movements.map((item, index) => (
          <View key={item.exercise.id} style={styles.seriesNameLine} testID={`${prefix}-${index}-name`}>
            <NameBlock
              name={rowName(item)}
              style={styles.seriesNameBlock}
              testID={`${prefix}-${index}-name`}
              tag={
                <UnitTag
                  unit={unitWordOf(item.values.mode, model === "EMOM")}
                  withLoad={withLoad}
                  on={item.values.loadOn === true}
                  onToggle={() => (item.values.loadOn === true ? onChange(index, { ...item.values, loadOn: false }) : onAddLoad(index))}
                  name={rowName(item)}
                  testID={`${prefix}-${index}-unit`}
                  toggleTestID={`${prefix}-${index}-charge`}
                />
              }
            />
            <View style={styles.lineSeparator} pointerEvents="none" />
          </View>
        ))}
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={[styles.seriesScroll, { width: TABLE_LAYOUT.nameGap + visibleWidth + TABLE_LAYOUT.sideInset }]}
        onScroll={(event) => {
          scrollX.current = event.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        testID={`${prefix}-series`}
      >
        <View>
          <View style={styles.seriesHeadLine} testID={`${prefix}-head`}>
            {columns.map((at) => (
              <HeadCell key={at} label={heading(at)} />
            ))}
          </View>
          {movements.map((item, index) => {
            const values = item.values;
            const mode = values.mode;
            const loaded = charged(values);
            // Buy-in / buy-out du For time : une seule exécution — buy-in au premier tour, buy-out au dernier (recette iPhone du
            // 07/11/2026, y-format-cadres, Hermann : « Récapitulatif : tableau des objectifs, la valeur du buy out doit être placée au
            // dernier tour, pas au premier. ») ; sa valeur reste la première du mouvement. [Buy-out au premier tour — remplacé.]
            const role = movementRole(item);
            const once = model === "FOR_TIME" && role !== "TOUR";
            const onceAt = role === "BUY_OUT" ? count - 1 : 0;
            return (
              <View key={item.exercise.id} style={styles.seriesValueLine} testID={`${prefix}-${index}-values`}>
                {columns.map((at) => {
                  if (once && at !== onceAt) return <View key={at} style={styles.column} />;
                  // Rang de la valeur dans les données (buy-in / buy-out : la seule valeur du mouvement).
                  const slot = once ? 0 : at;
                  const objective = objectiveAt(values, slot);
                  const label = tt.cellLabel.replace("{movement}", item.exercise.name).replace("{column}", heading(at));
                  return (
                    <ValueSlot
                      key={at}
                      charged={loaded}
                      testID={`${prefix}-${index}-${at}-slot`}
                      cell={
                        <TableCell
                          kind={mode === "DURATION" ? "duration" : "integer"}
                          value={objective}
                          format={(value) => valueText(value, mode)}
                          missing={objective === null || overflow.some((cellAt) => cellAt.index === index && cellAt.column === at)}
                          width={width}
                          onChange={(value) => onChange(index, set(values, slot, { objective: value }))}
                          {...bind(cellKey("obj", index, slot), at)}
                          label={label.replace("{kind}", tt.objectiveKind)}
                          testID={model === "FOR_TIME" ? `${prefix}-${index}-${at}` : `${prefix}-${index}-${at}-reps`}
                        />
                      }
                      charge={
                        loaded ? (
                          <ChargeValue
                            value={loadAt(values, slot)}
                            onChange={(value) => onChange(index, set(values, slot, { load: value }))}
                            binding={bind(cellKey("load", index, slot), at)}
                            label={label.replace("{kind}", tt.loadKind)}
                            testID={`${prefix}-${index}-${at}-load`}
                          />
                        ) : null
                      }
                    />
                  );
                })}
                <View style={styles.lineSeparator} pointerEvents="none" />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Cadre du tableau (370, fond et rayon portés par le cadre de l'écran) : pas de marge haute, marge basse 3,5 (A §4.2, B §4.2).
  table: { paddingBottom: TABLE_LAYOUT.bottomInset },
  header: { flexDirection: "row", height: TABLE_LAYOUT.headerHeight, paddingHorizontal: TABLE_LAYOUT.sideInset },
  // En-tête : Inter Medium 12, #595E66, texte de 15 à y = 6,5 (A §4.3, B §4.3).
  headText: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 12, lineHeight: 15, color: SECTION },
  headName: { position: "absolute", top: TABLE_LAYOUT.headerTextTop, left: 0, right: 0, textAlign: "left" },
  headCentered: { position: "absolute", top: TABLE_LAYOUT.headerTextTop, left: (TABLE_LAYOUT.columnWidth - 100) / 2, width: 100, textAlign: "center" },
  // Colonne Mouvement : de x = 16 jusqu'à 12 avant la première colonne de valeurs.
  nameArea: { flex: 1, minWidth: 0, marginRight: TABLE_LAYOUT.nameGap },
  name: { position: "absolute", top: TABLE_LAYOUT.nameTop, left: 0, right: 0, height: 16, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 16, color: LABEL },
  tag: { position: "absolute", top: TABLE_LAYOUT.tagTop, left: 0, right: 0, height: 13 },
  tagRow: { flexDirection: "row", alignItems: "center", height: 13 },
  // Étiquette : Inter Semi Bold 11 ; parenthèses, virgule et ±kg en bleu, « rép. » / « durée » en gris.
  tagText: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 11, lineHeight: 13, color: valueFieldColors.editable },
  tagUnit: { color: SECTION },
  line: { flexDirection: "row", height: TABLE_LAYOUT.rowHeight, paddingHorizontal: TABLE_LAYOUT.sideInset },
  // Séparateur de 1 en haut de chaque ligne de mouvement.
  lineSeparator: { position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundColor: ROW_SEPARATOR },
  // Colonnes de 44, 12 entre deux colonnes, calées à droite.
  columns: { flexDirection: "row", gap: TABLE_LAYOUT.columnGap },
  column: { width: TABLE_LAYOUT.columnWidth, alignSelf: "stretch" },
  cellAt: { position: "absolute", left: 0, width: TABLE_LAYOUT.columnWidth, height: TABLE_LAYOUT.cellHeight },
  chargeAt: { position: "absolute", top: TABLE_LAYOUT.chargeTop, left: (TABLE_LAYOUT.columnWidth - CHARGE_BOX_WIDTH) / 2, width: CHARGE_BOX_WIDTH, height: 13, alignItems: "center" },
  // Texte non modifiable ou absent dans une colonne (« — » du buy-in AMRAP, « à l'échec ») : à la place du texte d'une cellule.
  slotText: {
    position: "absolute",
    top: 4,
    left: (TABLE_LAYOUT.columnWidth - 100) / 2,
    width: 100,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 16,
    color: valueFieldColors.disabled,
  },
  failureText: { fontFamily: "Inter_600SemiBold", fontWeight: "600", color: valueFieldColors.readOnly },
  fieldSlot: { alignItems: "center" },
  // Cellule de tableau : cadre de 44 × 24, rayon 10, marge horizontale 0, sans fond une fois remplie (A §4.5, B §4.5).
  tableField: { height: TABLE_LAYOUT.cellHeight, minHeight: TABLE_LAYOUT.cellHeight, paddingHorizontal: 0, backgroundColor: "transparent" },
  // Charge : « (12 kg) », Inter Regular 11, bleu, hauteur 13, sans cadre (A §4.4, B §4.4).
  tableCharge: {
    height: 13,
    minHeight: 13,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    backgroundColor: "transparent",
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    fontSize: 11,
    lineHeight: 13,
  },
  tableDisabled: { color: TABLE_DISABLED },
  // Charge vide toujours présente (t-coche-direct) : trait dans un cadre orange à la largeur de la colonne.
  tableChargePending: { borderRadius: 6 },
  // Complément du 5 novembre 2026 (Hermann) (Figma) : charge entre parenthèses, Regular 12 (hors tableau).
  fieldLoad: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 12 },
  // Mesure de la largeur naturelle du texte : hors flux, invisible, sans contrainte de largeur.
  measureBox: { position: "absolute", top: 0, left: 0, width: 1000, flexDirection: "row", alignItems: "flex-start", opacity: 0 },
  measureText: { alignSelf: "flex-start" },
  // « 00:00 » de guidage, atténué tant que rien n'est tapé.
  cellGuide: { color: valueFieldColors.disabled },
  // Ligne de paramètres : texte invisible qui dimensionne, champ posé par-dessus.
  cellSizer: { opacity: 0 },
  cellOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, minWidth: 0 },
  chargeToggle: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 11, lineHeight: 13, color: valueFieldColors.editable },
  // Radio Max de 20, centré dans sa colonne de 44, à y = 12 (B §4.4).
  radio: {
    position: "absolute",
    top: TABLE_LAYOUT.radioTop,
    left: (TABLE_LAYOUT.columnWidth - 20) / 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#9499A8",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: valueFieldColors.editable, backgroundColor: valueFieldColors.editable },
  radioDisabled: { borderColor: valueFieldColors.disabled, opacity: 0.5 },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  seriesTable: { flexDirection: "row", overflow: "hidden" },
  // Le nom prend toute la place laissée par les colonnes, calées à droite ; l'écart de 12 appartient à la zone défilante.
  seriesNames: { flex: 1, minWidth: 0 },
  seriesNamesHeader: { height: TABLE_LAYOUT.headerHeight, paddingLeft: TABLE_LAYOUT.sideInset },
  seriesNameLine: { height: TABLE_LAYOUT.rowHeight, paddingLeft: TABLE_LAYOUT.sideInset, flexDirection: "row" },
  seriesNameBlock: { marginRight: 0 },
  seriesHeadLine: { flexDirection: "row", height: TABLE_LAYOUT.headerHeight, gap: TABLE_LAYOUT.columnGap, paddingLeft: TABLE_LAYOUT.nameGap, paddingRight: TABLE_LAYOUT.sideInset },
  seriesValueLine: { flexDirection: "row", height: TABLE_LAYOUT.rowHeight, gap: TABLE_LAYOUT.columnGap, paddingLeft: TABLE_LAYOUT.nameGap, paddingRight: TABLE_LAYOUT.sideInset },
  seriesScroll: { flexGrow: 0, flexShrink: 0 },
});
