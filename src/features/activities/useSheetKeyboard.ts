import { useEffect, useRef, type Dispatch, type RefObject } from "react";
import { Keyboard, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView, type TextInput } from "react-native";

import { seriesRowsOf } from "@/domain/activities/ExecutionParameters";
import {
  effectiveParameters,
  isSingleSeries,
  normalizeDraftLoad,
  setLoadValue,
  type ExecutionSheetDraft,
} from "@/domain/activities/ExecutionParametersDraft";
import { parseLoadText } from "@/domain/activities/exerciseLoad";
import {
  sameKeyboardField,
  type KeyboardFieldId,
  type SheetSurfaceEvent,
  type SheetSurfaceState,
} from "@/features/activities/sheetSurface";

/**
 * PRE-5 story 2.2 (AD-26, AD-27, FR-23 à FR-25, NFR-6) — hook UNIQUE de synchronisation
 * entre le focus natif des champs clavier de la Feuille (`KeyboardField`), la surface
 * ouverte (`sheetSurface.ts`, surface `keyboard`) et l'application de la saisie au
 * Brouillon (transitions de la story 2.1 seulement : `setLoadValue`, `normalizeDraftLoad`,
 * par `parseLoadText`).
 *
 * - Le champ garde son texte local pendant la frappe ; la saisie n'est appliquée qu'à la
 *   sortie du champ (`onBlur`), à Précédent / Suivant, ou par `flush` avant toute autre
 *   transition du même geste. Une sortie sans changement de valeur ne déclenche aucune
 *   transition (`pendingRemoval` intact).
 * - Fermeture du clavier (sortie sans passage à un autre champ) : règles du zéro
 *   (`normalizeDraftLoad`) ; jamais pendant Précédent / Suivant.
 * - Toute autre surface (✓ / ✕ absorbés, autre champ, appui extérieur, `closeAll`) retire
 *   le focus natif du champ.
 * - Révélation (FR-24) : à l'apparition du clavier et à chaque changement de champ, la
 *   ligne du champ actif est ramenée au-dessus du clavier (marge de 12, Figma `9292:18077`)
 *   par le défilement du corps existant de la Feuille.
 */

/** Champ de charge : charge commune, ou ligne d'identité (`rowIds`). */
export type LoadFieldRow = number | "uniform";

/** Mise à jour fonctionnelle du Brouillon par la Feuille (qui retire aussi le message d'ajustement s'il change). */
export type KeyboardCommit = (apply: (draft: ExecutionSheetDraft) => ExecutionSheetDraft) => void;

/** Marge entre le bas de la ligne active et le haut du clavier (Figma `9292:18077`). */
export const KEYBOARD_REVEAL_MARGIN = 12;

/**
 * Ordre de navigation entre les champs de charge (FR-25) : aucun sous Sans ; la charge
 * commune en séries identiques effectives (N = 1 compris) ; en variables, les lignes dans
 * l'ordre du tableau, seulement si le tableau est déplié.
 */
export function loadFieldOrder(draft: ExecutionSheetDraft, tableVisible: boolean): readonly LoadFieldRow[] {
  if (!draft.loadEnabled) return [];
  if (!draft.variable || isSingleSeries(draft)) return ["uniform"];
  return tableVisible ? draft.rowIds.slice(0, draft.rows.length) : [];
}

/** Charge affichée d'un champ (paramètres effectifs pour la charge commune), ou `null` si la ligne n'existe plus. */
export function loadOfField(draft: ExecutionSheetDraft, row: LoadFieldRow): number | null {
  if (row === "uniform") return seriesRowsOf(effectiveParameters(draft))[0]?.loadKg ?? null;
  const index = draft.rowIds.indexOf(row);
  return index < 0 ? null : (draft.rows[index]?.loadKg ?? null);
}

/** Texte d'édition d'une charge : le nombre seul au séparateur « , » (« 20 », « 1,25 ») ; vide pour 0 ; kg jamais saisi. */
export function loadEditText(kg: number | null): string {
  if (kg === null || kg === 0) return "";
  return String(kg).replace(".", ",");
}

/**
 * Révélation (FR-24, AC4) : défilement à ajouter pour que la ligne [`rowTop`, `rowBottom`]
 * (coordonnées de la fenêtre) soit entièrement visible entre le haut du corps défilant
 * (`bodyTop`) et le haut du clavier moins la marge de 12 ; 0 si elle l'est déjà.
 */
export function revealDelta(rowTop: number, rowBottom: number, bodyTop: number, keyboardTop: number): number {
  const limit = keyboardTop - KEYBOARD_REVEAL_MARGIN;
  if (rowBottom > limit) return rowBottom - limit;
  if (rowTop < bodyTop) return rowTop - bodyTop;
  return 0;
}

/**
 * Sortie d'un champ de charge (AD-19, §9-10) : texte illisible ou négatif → Brouillon
 * inchangé (valeur précédente) ; vide → 0 ; sinon la valeur, arrondie par la transition.
 * Si la charge du champ ne change pas, le Brouillon est rendu tel quel (aucune transition,
 * `pendingRemoval` intact).
 */
export function applyLoadEdit(draft: ExecutionSheetDraft, row: LoadFieldRow, text: string): ExecutionSheetDraft {
  const parsed = parseLoadText(text);
  if (parsed.kind === "invalid") return draft;
  const next = setLoadValue(draft, row === "uniform" ? "uniform" : { rowId: row }, parsed.kind === "empty" ? null : parsed.kg);
  if (next === draft) return draft;
  return loadOfField(next, row) === loadOfField(draft, row) ? draft : next;
}

type Edit = { readonly field: KeyboardFieldId; text: string; initial: string };
type Registered = { readonly input: TextInput; readonly rowHeight: number };

const fieldKey = (field: KeyboardFieldId) => (field.kind === "load" ? `load:${field.row}` : `phase:${field.phase}`);

/** Application d'une édition prise (fonction pure du Brouillon). */
function applyEdit(draft: ExecutionSheetDraft, edit: Pick<Edit, "field" | "text" | "initial">): ExecutionSheetDraft {
  if (edit.text === edit.initial || edit.field.kind !== "load") return draft;
  return applyLoadEdit(draft, edit.field.row, edit.text);
}

export type SheetKeyboard = {
  /** Champ clavier ouvert (surface `keyboard`), ou `null`. */
  readonly activeField: KeyboardFieldId | null;
  readonly canPrevious: boolean;
  readonly canNext: boolean;
  /** Référence de l'entrée d'un champ ; `rowHeight` : hauteur de sa ligne (36 en tableau, 44 sinon). */
  register: (field: KeyboardFieldId, rowHeight: number) => (input: TextInput | null) => void;
  /** Texte d'édition d'un champ au moment du focus. */
  editText: (field: KeyboardFieldId) => string;
  onFocus: (field: KeyboardFieldId) => void;
  onBlur: (field: KeyboardFieldId) => void;
  onChangeText: (field: KeyboardFieldId, text: string) => void;
  /** Applique la saisie en cours à `draft` (synchrone) ; le `onBlur` qui suit n'applique plus rien. */
  flush: (draft: ExecutionSheetDraft) => ExecutionSheetDraft;
  previous: () => void;
  next: () => void;
  /** « Fermer » : applique et ferme le clavier. */
  close: () => void;
  /** Focus du premier champ de l'ordre, au rendu suivant (le champ n'existe qu'après l'activation). */
  focusFirst: () => void;
  /** Défilement du corps (offset courant, pour la révélation). */
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export function useSheetKeyboard({
  draft,
  surface,
  dispatchSurface,
  commit,
  order,
  scrollRef,
  reduceMotion,
}: {
  draft: ExecutionSheetDraft;
  surface: SheetSurfaceState;
  dispatchSurface: Dispatch<SheetSurfaceEvent>;
  commit: KeyboardCommit;
  /** Champs clavier navigables par Précédent / Suivant, dans l'ordre des lignes. */
  order: readonly KeyboardFieldId[];
  scrollRef: RefObject<ScrollView | null>;
  reduceMotion: boolean;
}): SheetKeyboard {
  const inputsRef = useRef(new Map<string, Registered>());
  // Champ qui a le focus natif (événements `focus` / `blur`).
  const focusedRef = useRef<KeyboardFieldId | null>(null);
  // Champ voulu : le focalisé, ou le voisin choisi par Précédent / Suivant ; `null` à la fermeture.
  const wantedRef = useRef<KeyboardFieldId | null>(null);
  const editRef = useRef<Edit | null>(null);
  const pendingFocusRef = useRef(false);
  const keyboardTopRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const reduceMotionRef = useRef(reduceMotion);
  const orderRef = useRef(order);
  useEffect(() => {
    reduceMotionRef.current = reduceMotion;
    orderRef.current = order;
  });

  const activeField = surface.open.kind === "keyboard" ? surface.open.field : null;
  const activeIndex = activeField === null ? -1 : order.findIndex((field) => sameKeyboardField(field, activeField));
  const canPrevious = activeIndex > 0;
  const canNext = activeIndex >= 0 && activeIndex < order.length - 1;

  /** Révélation (FR-24, AC4) : ligne du champ voulu entièrement au-dessus du clavier. */
  function reveal() {
    const wanted = wantedRef.current;
    const keyboardTop = keyboardTopRef.current;
    const scroll = scrollRef.current;
    const entry = wanted === null ? undefined : inputsRef.current.get(fieldKey(wanted));
    if (entry === undefined || keyboardTop === null || scroll === null) return;
    const body = typeof scroll.getNativeScrollRef === "function" ? scroll.getNativeScrollRef() : null;
    if (body === null || typeof entry.input.measureInWindow !== "function") return;
    entry.input.measureInWindow((_x, y, _width, height) => {
      const center = y + height / 2;
      const rowTop = center - entry.rowHeight / 2;
      const rowBottom = center + entry.rowHeight / 2;
      body.measureInWindow((_bx, bodyTop) => {
        const delta = revealDelta(rowTop, rowBottom, bodyTop, keyboardTop);
        if (delta === 0) return;
        scroll.scrollTo({ y: Math.max(0, offsetRef.current + delta), animated: !reduceMotionRef.current });
      });
    });
  }

  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", (event) => {
      keyboardTopRef.current = event.endCoordinates.screenY;
      reveal();
    });
    const hidden = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTopRef.current = null;
    });
    return () => {
      shown.remove();
      hidden.remove();
    };
    // `reveal` ne lit que des références.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function editTextOf(field: KeyboardFieldId): string {
    return field.kind === "load" ? loadEditText(loadOfField(draft, field.row)) : "";
  }

  function onFocus(field: KeyboardFieldId) {
    focusedRef.current = field;
    wantedRef.current = field;
    const text = editTextOf(field);
    editRef.current = { field, text, initial: text };
    dispatchSurface({ type: "touch", surface: { kind: "keyboard", field } });
    // Toucher direct d'un autre champ, clavier déjà affiché : aucun nouveau `keyboardDidShow`.
    if (keyboardTopRef.current !== null) reveal();
  }

  function onBlur(field: KeyboardFieldId) {
    if (focusedRef.current !== null && sameKeyboardField(focusedRef.current, field)) focusedRef.current = null;
    const edit = editRef.current !== null && sameKeyboardField(editRef.current.field, field) ? editRef.current : null;
    if (edit !== null) editRef.current = null;
    // Aucun passage à un autre champ (Précédent / Suivant) : c'est une fermeture.
    const closing = wantedRef.current !== null && sameKeyboardField(wantedRef.current, field);
    if (closing) wantedRef.current = null;
    if (edit !== null || closing) {
      const taken = edit === null ? null : { field: edit.field, text: edit.text, initial: edit.initial };
      commit((current) => {
        const applied = taken === null ? current : applyEdit(current, taken);
        return closing && field.kind === "load" ? normalizeDraftLoad(applied) : applied;
      });
    }
    if (closing) dispatchSurface({ type: "blur", field });
  }

  function onChangeText(field: KeyboardFieldId, text: string) {
    const edit = editRef.current;
    if (edit !== null && sameKeyboardField(edit.field, field)) edit.text = text;
  }

  function flush(base: ExecutionSheetDraft): ExecutionSheetDraft {
    const edit = editRef.current;
    if (edit === null) return base;
    const next = applyEdit(base, edit);
    edit.initial = edit.text;
    return next;
  }

  // Toute autre surface que le clavier du champ voulu (✓ / ✕ absorbés, autre surface,
  // appui extérieur, `closeAll`, ligne disparue) retire le focus natif du champ.
  useEffect(() => {
    const focused = focusedRef.current;
    if (focused === null) return;
    const wanted = wantedRef.current;
    const open = surface.open;
    if (open.kind === "keyboard" && wanted !== null && sameKeyboardField(open.field, wanted)) return;
    const entry = inputsRef.current.get(fieldKey(focused));
    if (entry !== undefined) entry.input.blur();
    // Champ démonté (ligne disparue, tableau replié) : aucune perte de focus ne viendra.
    else onBlur(focused);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface.open]);

  // `focusFirst` : demande consommée après le rendu qui a monté le premier champ.
  useEffect(() => {
    if (!pendingFocusRef.current) return;
    const first = orderRef.current[0];
    const entry = first === undefined ? undefined : inputsRef.current.get(fieldKey(first));
    if (entry === undefined) return;
    pendingFocusRef.current = false;
    entry.input.focus();
  });

  function step(delta: -1 | 1) {
    const current = wantedRef.current;
    if (current === null) return;
    const index = order.findIndex((field) => sameKeyboardField(field, current));
    const neighbour = index < 0 ? undefined : order[index + delta];
    if (neighbour === undefined) return;
    // Saisie appliquée sans règles du zéro (jamais pendant Précédent / Suivant).
    const edit = editRef.current;
    if (edit !== null) {
      const taken = { field: edit.field, text: edit.text, initial: edit.initial };
      edit.initial = edit.text;
      commit((base) => applyEdit(base, taken));
    }
    wantedRef.current = neighbour;
    dispatchSurface({ type: "touch", surface: { kind: "keyboard", field: neighbour } });
    inputsRef.current.get(fieldKey(neighbour))?.input.focus();
    reveal();
  }

  function close() {
    const focused = focusedRef.current;
    if (focused === null) return;
    inputsRef.current.get(fieldKey(focused))?.input.blur();
  }

  function register(field: KeyboardFieldId, rowHeight: number) {
    const key = fieldKey(field);
    return (input: TextInput | null) => {
      if (input === null) {
        if (inputsRef.current.get(key)?.input !== undefined) inputsRef.current.delete(key);
        return;
      }
      inputsRef.current.set(key, { input, rowHeight });
    };
  }

  return {
    activeField,
    canPrevious,
    canNext,
    register,
    editText: editTextOf,
    onFocus,
    onBlur,
    onChangeText,
    flush,
    previous: () => step(-1),
    next: () => step(1),
    close,
    focusFirst: () => {
      pendingFocusRef.current = true;
    },
    onScroll: (event) => {
      offsetRef.current = event.nativeEvent.contentOffset.y;
    },
  };
}
