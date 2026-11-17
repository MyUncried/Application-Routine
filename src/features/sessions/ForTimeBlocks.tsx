import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { isBilateral, type ExecutionMode } from "@/domain/activities/ExecutionParameters";
import type { Movement } from "@/domain/activities/Movement";
import { forTimeBlockSeries, movementRole, type ModelAnswers, type ModelMovement, type MovementValues } from "@/domain/sessions/formatModels";
import { MediaPreview, firstMediaPreviewSource, useMediaUriResolver } from "@/features/activities/MediaPreview";
import { SwipeActionsRow } from "@/features/activities/SwipeActionsRow";
import { ChargeValue, TABLE_LAYOUT, TableCell, cellKey, valueText, type CellBinding } from "@/features/sessions/FormatTables";
import { strings } from "@/shared/i18n";
import { colors } from "@/shared/ui/tokens";
import { valueFieldColors } from "@/shared/ui/valueField";

/**
 * For time — tableau unique, sans questionnaire (décision de Hermann du 15/11/2026, registre ch07, « For time — tableau unique, sans
 * questionnaire (15/11/2026) » ; CE-FMT-02 §8 ; Figma `12377:26300`, `12413:26346`, `12341:27002`, `12428:26360`).
 *
 * Trois blocs Buy-in, En boucle, Buy-out, pleine largeur, séparés de 10 ; chaque en-tête porte « + Ajouter ». Un bloc vide n'affiche
 * ni colonne ni ± ; dès un mouvement : colonnes S1… (Buy-in, Buy-out) ou Tour 1… (boucle ; S1… en « À la suite »), calées à droite,
 * « − » à gauche des titres (retire la dernière colonne, sans confirmation), « + » fixe à droite (ajoute une colonne). Buy-in et
 * Buy-out : aucun plafond ; boucle : borne du Nombre de tours, même valeur que la ligne dédiée. Trois colonnes visibles, défilement
 * au-delà, signalé par un petit triangle. Ligne de mouvement de 48 (photo 40) : nom, puis « (rép., ± kg) » — l'unité ouvre le
 * popover d'unité natif, « ± kg » ajoute ou retire la charge du mouvement ; à l'ajout, « Unité » en rouge et cases désactivées
 * (« – » grisé) tant qu'elle n'est pas choisie. [Questionnaire, interrupteurs Buy-in / Buy-out / Avec charge, lignes « Nombre de
 * séries du Buy-in / Buy-out » et cartes des mouvements — remplacés pour le For time.]
 *
 * Formats à tableau — écran unique (décision de Hermann du 15/11/2026, registre ch07, « Formats à tableau — écran unique, sans
 * redondance (15/11/2026) » ; CE-FMT-02 §8) : les mêmes blocs servent aux autres Formats — `SeriesBlock` (colonnes de séries ou de
 * tours) et `DimensionBlock` (colonnes à dimensions fixes), avec la même ligne de mouvement (`NameRow`).
 *
 * Formats — saisie par la modale des paramètres d'exécution (décision de Hermann du 16/11/2026, registre ch07, « Formats — saisie par
 * la modale des paramètres d'exécution (16/11/2026) » ; CE-FMT-02 §8 ; mission FORMATS-MODALE-PARAMS-20261116) : sous le nom, un seul
 * texte — « Paramètres à compléter » en rouge tant que l'unité n'est pas choisie, sinon l'unité (« rép. » ou « durée »), suivie de
 * « · bilatéral » si l'option est activée, en bleu ; rien sur la charge. Le nom et ce texte ouvrent la modale des paramètres
 * d'exécution du mouvement ; la photo, la Fiche du mouvement ; les cases restent éditables directement. Plus de « − » ni de « + »
 * dans l'en-tête (nombre de séries ou de tours réglé dans la modale) ; le triangle de défilement prend la place du « + », agrandi à
 * 8 × 13. [Popover d'unité et « (+ kg) » / « (− kg) » sous le nom, « − » / « + » de l'en-tête — remplacés le 16/11/2026.]
 */

const tf = () => strings.screens.formatModel.forTimeTable;
const tt = () => strings.screens.formatModel.table;

/** Colonnes visibles d'un bloc (proposition de Hermann du 15/11/2026 : « au maximum 3 colonnes » visibles, défilement au-delà). */
const VISIBLE_COLUMNS = 3;
/** Cotes de la référence 402 × 874 (Figma `12341:27002`). */
const BLOCK = {
  headerHeight: 28,
  rowHeight: 48,
  photo: 40,
  photoLeft: 12,
  nameLeft: 60,
  addLeft: 83,
  /** Zone du triangle, à droite des colonnes. */
  gutter: 28,
  bottomInset: 4,
  gap: 10,
  cellTop: 12,
  cellTopCharged: 2,
  chargeTop: 25,
  /** Colonnes à dimensions : retrait droit de la dernière colonne (Figma `12455:26716`). */
  sideInset: 16,
} as const;
/** Triangle de défilement (ton des anciens glyphes « − » / « + »). */
const TRIANGLE = "#AEB4C6";
const PANEL = "#F9FAFC";
const LABEL = "#141414";
const HEAD = "#595E66";
const ROW_SEPARATOR = "#DEE3E5";
/** Fond de la ligne portée par l'appui long, sur toute sa largeur. */
const LIFTED = "#ECEEF4";

export type ForTimeRole = "BUY_IN" | "TOUR" | "BUY_OUT";

/** Rang d'un mouvement dans la liste complète du Format, avec son mouvement. */
export type BlockRow = { readonly item: ModelMovement; readonly index: number };

/**
 * Comportement commun des lignes de mouvement d'un bloc (photo, nom et ligne des paramètres, glissement « Supprimer », Monter /
 * Descendre). `mode` : unité affichée (`undefined` : « Paramètres à compléter » en rouge, cases désactivées).
 */
export type RowKit = {
  readonly movementOf: (item: ModelMovement) => Movement | null;
  readonly mode: (item: ModelMovement) => ExecutionMode | undefined;
  /** Le nom et la ligne des paramètres ouvrent la modale des paramètres d'exécution (16/11/2026, tous les Formats à tableau). */
  readonly onOpenParameters: (index: number) => void;
  /**
   * Recette du 16/11/2026 (Autres constats c, Hermann : « Death by - Il faut le même principe d'affichage du texte "Paramètres à
   * compléter" de la modale des paramètres d'exécution. ») : paramètres encore à renseigner alors que l'unité est connue (Death by :
   * Départ ou Incrément vide) → « Paramètres à compléter ».
   */
  readonly parametersMissing?: (item: ModelMovement) => boolean;
  readonly onOpenSheet: (movement: Movement) => void;
  readonly onRemove: (index: number) => void;
  readonly onMove: (index: number, direction: -1 | 1) => void;
  /**
   * Recette iPhone du 16/11/2026 (Hermann, fmt-entree : « on devrait pouvoir réordonner les mouvements du tableau avec un appui
   * long ») : déplacement d'une ligne dans son bloc, de `from` à `to` (rangs dans la liste complète du Format).
   */
  readonly onReorder?: (from: number, to: number) => void;
  readonly revealedId: string | null;
  readonly onReveal: (id: string | null) => void;
  /** Préfixe des identifiants de test d'une ligne. */
  readonly rowTestID: (index: number) => string;
};

/** Appui long avant le déplacement d'une ligne (même délai que l'appui long des anciennes cartes, constat du 06/11/2026). */
const ROW_LONG_PRESS_MS = 500;

/**
 * Déplacement d'une ligne d'un bloc par appui long (geste natif de react-native-gesture-handler, `Pan` activé après l'appui long,
 * comme les anciennes cartes de mouvement) : la ligne portée suit le doigt, les lignes franchies se décalent d'une hauteur de ligne ;
 * au relâchement, la ligne prend sa nouvelle place dans son bloc (sans en sortir).
 */
function useRowDrag(rows: readonly BlockRow[], kit: RowKit, testID: string) {
  const [drag, setDrag] = useState<{ readonly from: number; readonly dy: number } | null>(null);
  // Valeur courante du geste, lue par les rappels du geste natif (jamais pendant le rendu).
  const dragRef = useRef<{ readonly from: number; readonly dy: number } | null>(null);
  const update = (next: { readonly from: number; readonly dy: number } | null) => {
    dragRef.current = next;
    setDrag(next);
  };
  const targetOf = (current: { readonly from: number; readonly dy: number }) =>
    Math.max(0, Math.min(rows.length - 1, current.from + Math.round(current.dy / BLOCK.rowHeight)));
  const enabled = kit.onReorder !== undefined && rows.length > 1;
  const gesture = (local: number) =>
    Gesture.Pan()
      .enabled(enabled)
      .activateAfterLongPress(ROW_LONG_PRESS_MS)
      .runOnJS(true)
      .onStart(() => {
        kit.onReveal(null);
        update({ from: local, dy: 0 });
      })
      .onUpdate((event) => {
        const current = dragRef.current;
        if (current !== null) update({ ...current, dy: event.translationY });
      })
      .onEnd((_event, success) => {
        const current = dragRef.current;
        update(null);
        if (!success || current === null) return;
        const to = targetOf(current);
        const from = rows[current.from];
        const target = rows[to];
        if (to !== current.from && from !== undefined && target !== undefined) kit.onReorder?.(from.index, target.index);
      })
      .onFinalize(() => {
        if (dragRef.current !== null) update(null);
      })
      .withTestId(`${testID}-drag-${local}`);
  /** Décalage vertical d'une ligne pendant le geste. */
  const offset = (local: number) => {
    if (drag === null) return 0;
    if (local === drag.from) return drag.dy;
    const to = targetOf(drag);
    if (local > drag.from && local <= to) return -BLOCK.rowHeight;
    if (local < drag.from && local >= to) return BLOCK.rowHeight;
    return 0;
  };
  /**
   * Recette iPhone du 16/11/2026 (r16-appui-long, Hermann : « La ligne se déplace, mais visuellement elle est séparée en deux
   * verticalement (entre le nom et le tableau) ») : la ligne portée a le même fond sur toute sa largeur (nom, valeurs, marge droite),
   * sans ombre propre à chaque partie. [Ombre portée par chaque partie — remplacé le 16/11/2026.]
   */
  const moved = (local: number, extra: object | null = null) => {
    const dy = offset(local);
    const lifted = drag !== null && drag.from === local;
    return dy === 0 && !lifted ? null : [{ transform: [{ translateY: dy }] }, lifted ? styles.lifted : null, lifted ? extra : null];
  };
  const lifted = (local: number) => drag !== null && drag.from === local;
  /** Recette du 16/11/2026 (r16-appui-long, Hermann : « Il faut désactiver le glisser gauche pendant le déplacement »). */
  const dragging = drag !== null;
  return { gesture, moved, lifted, dragging };
}

/** Accès aux valeurs d'une colonne de série (For time : volumes / loads ; EMOM, Superset, Progression : cells). */
export type SeriesAccess = {
  readonly objective: (values: MovementValues, at: number) => number | null;
  readonly load: (values: MovementValues, at: number) => number | null;
  readonly write: (values: MovementValues, at: number, patch: { readonly objective?: number | null; readonly load?: number | null }) => MovementValues;
  /** Préfixes des identifiants de test d'une case et de sa charge. */
  readonly cellTestID: (index: number, at: number) => string;
  readonly loadTestID: (index: number, at: number) => string;
  /** Case en cause (contrôle EMOM des durées). */
  readonly flagged?: (index: number, at: number) => boolean;
};

const FOR_TIME_ACCESS: SeriesAccess = {
  objective: (values, at) => values.volumes?.[at] ?? null,
  load: (values, at) => values.loads?.[at] ?? null,
  write: (values, at, patch) => {
    const volumes = [...(values.volumes ?? [])];
    const loads = [...(values.loads ?? [])];
    while (volumes.length <= at) volumes.push(null);
    while (loads.length <= at) loads.push(null);
    if (patch.objective !== undefined) volumes[at] = patch.objective;
    if (patch.load !== undefined) loads[at] = patch.load;
    return { ...values, volumes, loads };
  },
  cellTestID: (index, at) => `format-for-time-${index}-${at}`,
  loadTestID: (index, at) => `format-for-time-${index}-${at}-load`,
};

export function ForTimeBlocks({
  movements,
  answers,
  sequence,
  movementOf,
  onAdd,
  onChange,
  onOpenParameters,
  onOpenSheet,
  onRemove,
  onMove,
  onReorder,
  revealedId,
  onReveal,
  cell,
}: {
  readonly movements: readonly ModelMovement[];
  readonly answers: ModelAnswers;
  /** Exécution « À la suite » : colonnes de la boucle S1… au lieu de Tour 1… */
  readonly sequence: boolean;
  readonly movementOf: (item: ModelMovement) => Movement | null;
  readonly onAdd: (role: "LOOP" | "BUY_IN" | "BUY_OUT") => void;
  readonly onChange: (index: number, values: MovementValues) => void;
  readonly onOpenParameters: (index: number) => void;
  readonly onOpenSheet: (movement: Movement) => void;
  readonly onRemove: (index: number) => void;
  readonly onMove: (index: number, direction: -1 | 1) => void;
  readonly onReorder?: (from: number, to: number) => void;
  readonly revealedId: string | null;
  readonly onReveal: (id: string | null) => void;
  readonly cell: CellBinding;
}) {
  const kit: RowKit = {
    movementOf,
    mode: (item) => item.values.mode,
    onOpenParameters,
    onOpenSheet,
    onRemove,
    onMove,
    ...(onReorder !== undefined ? { onReorder } : {}),
    revealedId,
    onReveal,
    rowTestID: (index) => `format-for-time-${index}`,
  };
  const indexed = movements.map((item, index) => ({ item, index }));
  const block = (role: ForTimeRole, title: string, addRole: "LOOP" | "BUY_IN" | "BUY_OUT", testID: string) => {
    const rows = indexed.filter(({ item }) => movementRole(item) === role);
    const count = role === "TOUR" ? (answers.roundCount ?? 1) : forTimeBlockSeries(answers, role);
    const heading = (at: number) => (role === "TOUR" && !sequence ? tt().round : tt().series).replace("{n}", String(at + 1));
    return (
      <SeriesBlock
        key={role}
        title={title}
        rows={rows}
        count={count}
        heading={heading}
        onAdd={() => onAdd(addRole)}
        kit={kit}
        access={FOR_TIME_ACCESS}
        onChange={onChange}
        cell={cell}
        testID={testID}
      />
    );
  };
  return (
    <View style={styles.blocks} testID="format-for-time-blocks">
      {block("BUY_IN", tf().buyIn, "BUY_IN", "format-buy-in")}
      {block("TOUR", tf().loop, "LOOP", "format-loop")}
      {block("BUY_OUT", tf().buyOut, "BUY_OUT", "format-buy-out")}
    </View>
  );
}

/** Pile de blocs pleine largeur, séparés de 10 (même cadre que les blocs du For time). */
export function FormatBlocks({ children, testID }: { readonly children: React.ReactNode; readonly testID: string }) {
  return (
    <View style={styles.blocks} testID={testID}>
      {children}
    </View>
  );
}

/** En-tête d'un bloc : titre, « + Ajouter » (désactivé : Superset à deux mouvements), puis éléments propres au bloc. */
function BlockHeader({
  title,
  onAdd,
  addDisabled = false,
  addLeft = BLOCK.addLeft,
  addText = tf().add,
  testID,
  children,
}: {
  readonly title: string;
  readonly onAdd: () => void;
  readonly addDisabled?: boolean;
  readonly addLeft?: number;
  /** Libellé du lien (« + Ajouter » ; Superset complet : « Modifier »). */
  readonly addText?: string;
  readonly testID: string;
  readonly children?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title} accessibilityRole="header" testID={`${testID}-title`}>
        {title}
      </Text>
      <Pressable
        onPress={addDisabled ? undefined : onAdd}
        disabled={addDisabled}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${addText}`}
        accessibilityState={{ disabled: addDisabled }}
        style={[styles.add, { left: addLeft }]}
        testID={`${testID}-link`}
      >
        <Text style={[styles.addText, addDisabled ? styles.addDisabled : null]}>{addText}</Text>
      </Pressable>
      {children}
    </View>
  );
}

/**
 * Bloc à colonnes de séries ou de tours (For time ; EMOM et Progression S1…Sn ; Superset Tour 1…n) : trois colonnes visibles, triangle
 * au-delà, à droite de l'en-tête. [« − » à gauche des titres, « + » fixe à droite — retirés le 16/11/2026 : le nombre de séries ou de
 * tours se règle dans la modale des paramètres d'exécution.]
 */
export function SeriesBlock({
  title,
  rows,
  count,
  heading,
  onAdd,
  addDisabled,
  addLeft,
  addText,
  kit,
  access,
  onChange,
  cell,
  testID,
}: {
  readonly title: string;
  readonly rows: readonly BlockRow[];
  readonly count: number;
  readonly heading: (at: number) => string;
  readonly onAdd: () => void;
  readonly addDisabled?: boolean;
  readonly addLeft?: number;
  readonly addText?: string;
  readonly kit: RowKit;
  readonly access: SeriesAccess;
  readonly onChange: (index: number, values: MovementValues) => void;
  readonly cell: CellBinding;
  readonly testID: string;
}) {
  const empty = rows.length === 0;
  const { gesture, moved, lifted, dragging } = useRowDrag(rows, kit, testID);
  const columns = Array.from({ length: count }, (_, at) => at);
  const width = TABLE_LAYOUT.columnWidth;
  const step = width + TABLE_LAYOUT.columnGap;
  const visible = Math.max(1, Math.min(count, VISIBLE_COLUMNS));
  const visibleWidth = visible * width + (visible - 1) * TABLE_LAYOUT.columnGap;
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  // Recette du 16/11/2026 (mp-triangle, Hermann : « Le triangle doit être centré verticalement par rapport au texte, il doit s’inverser et changer de côté (avant la première colonne) quand on arrive à la dernière colonne. ») : à la dernière colonne,
  // le triangle pointe vers la gauche, avant la première colonne visible.
  const [atEnd, setAtEnd] = useState(false);
  const contentWidth = count * width + (count - 1) * TABLE_LAYOUT.columnGap;
  const updateEnd = (x: number) => {
    const next = count > VISIBLE_COLUMNS && x + visibleWidth >= contentWidth - 1;
    setAtEnd((current) => (current === next ? current : next));
  };
  const shownCount = useRef(count);
  // Colonne ajoutée (modale, ligne « Nombre de séries ») : rendue visible (même procédé que le tableau des séries).
  useEffect(() => {
    if (count > shownCount.current) scrollRef.current?.scrollToEnd({ animated: false });
    shownCount.current = count;
  }, [count]);
  // Case prenant le focus hors de la fenêtre visible : les colonnes se décalent pour la montrer.
  const revealColumn = (at: number) => {
    const left = at * step;
    const right = left + width;
    if (left < scrollX.current) scrollRef.current?.scrollTo({ x: left, animated: true });
    else if (right > scrollX.current + visibleWidth) scrollRef.current?.scrollTo({ x: right - visibleWidth, animated: true });
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
  return (
    <View style={styles.block} testID={testID}>
      <View style={styles.blockRow}>
        {/* Noms : en-tête (titre, « + Ajouter ») puis photo, nom et ligne des paramètres de chaque ligne. */}
        <View style={styles.names}>
          <BlockHeader title={title} onAdd={onAdd} addDisabled={addDisabled} addLeft={addLeft} {...(addText !== undefined ? { addText } : {})} testID={testID} />
          {rows.map(({ item, index }, local) => (
            <GestureDetector key={item.exercise.id} gesture={gesture(local)}>
              <View style={moved(local)}>
                <NameRow item={item} index={index} first={local === 0} last={local === rows.length - 1} kit={kit} lifted={lifted(local)} swipeEnabled={!dragging} />
              </View>
            </GestureDetector>
          ))}
        </View>
        {empty ? null : (
          <>
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={[styles.values, { width: visibleWidth }]}
              onScroll={(event) => {
                scrollX.current = event.nativeEvent.contentOffset.x;
                updateEnd(scrollX.current);
              }}
              onContentSizeChange={() => updateEnd(scrollX.current)}
              scrollEventThrottle={16}
              testID={`${testID}-columns`}
            >
              <View>
                <View style={styles.headLine} testID={`${testID}-head`}>
                  {columns.map((at) => (
                    <View key={at} style={styles.column}>
                      <Text style={styles.headText} numberOfLines={1} testID={`${testID}-head-${at}`}>
                        {heading(at)}
                      </Text>
                    </View>
                  ))}
                </View>
                {rows.map(({ item, index }, local) => (
                  <View key={item.exercise.id} style={[styles.valueLine, moved(local)]} testID={`${kit.rowTestID(index)}-values`}>
                    <View style={styles.separator} pointerEvents="none" />
                    {columns.map((at) => (
                      <ValueColumn key={at} item={item} index={index} at={at} mode={kit.mode(item)} heading={heading(at)} access={access} onChange={onChange} bind={bind} />
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
            {count > VISIBLE_COLUMNS && atEnd ? (
              <View style={styles.triangleBefore} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no" testID={`${testID}-more-before`} />
            ) : null}
            <View style={styles.gutter}>
              <View style={styles.header}>
                {count > VISIBLE_COLUMNS && !atEnd ? (
                  <View style={styles.triangle} accessibilityElementsHidden importantForAccessibility="no" testID={`${testID}-more`} />
                ) : null}
              </View>
              {rows.map(({ item }, local) => (
                <View key={item.exercise.id} style={[styles.gutterLine, moved(local)]}>
                  <View style={styles.separator} pointerEvents="none" />
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

/**
 * Bloc à colonnes à dimensions fixes (inchangées, décision de Hermann du 15/11/2026 : « les colonnes des tableaux de type
 * (dimensions en colonne) ne change pas ») : Tabata, 30/30, Renforcement, À l'échec (Objectif, Pause, Charge) ; Death by (Départ,
 * Incrément, Charge) ; AMRAP (Objectif, Par tour, Max). Titres centrés sur leurs colonnes de 44, calées à droite (retrait de 16).
 */
export function DimensionBlock({
  title,
  rows,
  heads,
  onAdd,
  addDisabled,
  addLeft,
  addText,
  kit,
  columns,
  testID,
}: {
  readonly title: string;
  readonly rows: readonly BlockRow[];
  readonly heads: readonly string[];
  readonly onAdd: () => void;
  readonly addDisabled?: boolean;
  readonly addLeft?: number;
  readonly addText?: string;
  readonly kit: RowKit;
  /** Colonnes d'une ligne, dans l'ordre des titres ; chaque élément occupe une colonne de 44. */
  readonly columns: (row: BlockRow) => readonly React.ReactNode[];
  readonly testID: string;
}) {
  const empty = rows.length === 0;
  const { gesture, moved, lifted, dragging } = useRowDrag(rows, kit, testID);
  return (
    <View style={styles.block} testID={testID}>
      <View style={styles.blockRow}>
        <View style={styles.names}>
          <BlockHeader title={title} onAdd={onAdd} addDisabled={addDisabled} addLeft={addLeft} {...(addText !== undefined ? { addText } : {})} testID={testID} />
          {rows.map(({ item, index }, local) => (
            <GestureDetector key={item.exercise.id} gesture={gesture(local)}>
              <View style={moved(local)}>
                <NameRow item={item} index={index} first={local === 0} last={local === rows.length - 1} kit={kit} lifted={lifted(local)} swipeEnabled={!dragging} />
              </View>
            </GestureDetector>
          ))}
        </View>
        {empty ? null : (
          <View style={styles.dimensions}>
            <View style={styles.headLine} testID={`${testID}-head`}>
              {heads.map((head, at) => (
                <View key={at} style={styles.column}>
                  <Text style={styles.headText} numberOfLines={1} testID={`${testID}-head-${at}`}>
                    {head}
                  </Text>
                </View>
              ))}
            </View>
            {rows.map((row, local) => (
              <View key={row.item.exercise.id} style={[styles.valueLine, moved(local, styles.liftedWide)]} testID={`${kit.rowTestID(row.index)}-values`}>
                <View style={[styles.separator, styles.separatorWide]} pointerEvents="none" />
                {columns(row).map((node, at) => (
                  <View key={at} style={styles.column} pointerEvents="box-none">
                    {node}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

/** Position d'une case dans sa colonne de 48 : centrée sans charge, remontée avec la charge dessous. */
export function DimensionCell({ charged = false, cell, charge = null }: { readonly charged?: boolean; readonly cell: React.ReactNode; readonly charge?: React.ReactNode }) {
  return (
    <>
      <View style={[styles.cellAt, { top: charged ? BLOCK.cellTopCharged : BLOCK.cellTop }]} pointerEvents="box-none">
        {cell}
      </View>
      {charge !== null ? (
        <View style={styles.chargeAt} pointerEvents="box-none">
          {charge}
        </View>
      ) : null}
    </>
  );
}

/** Texte d'une colonne à dimensions : « — » grisé (charge absente, Par tour du buy-in), « à l'échec ». */
export function DimensionText({
  text,
  strong = false,
  lines = 1,
  testID,
}: {
  readonly text: string;
  readonly strong?: boolean;
  /** Recette du 16/11/2026 (fmt-unite-tabata, Hermann : « mettre "à l'échec" sur deux lignes ») : texte sur deux lignes, centré. */
  readonly lines?: 1 | 2;
  readonly testID?: string;
}) {
  return (
    <Text style={[styles.disabledValue, styles.dimensionText, strong ? styles.strongValue : null, lines === 2 ? styles.twoLines : null]} numberOfLines={lines} testID={testID}>
      {text}
    </Text>
  );
}

/**
 * Partie gauche d'une ligne : photo (Fiche du mouvement) ; nom et ligne des paramètres, qui ouvrent ensemble la modale des paramètres
 * d'exécution (décision de Hermann du 16/11/2026) : « Paramètres à compléter » en rouge sans unité, sinon l'unité et « · bilatéral »
 * si l'option est activée, en bleu.
 */
function NameRow({
  item,
  index,
  first,
  last,
  kit,
  lifted = false,
  swipeEnabled = true,
}: {
  readonly item: ModelMovement;
  readonly index: number;
  readonly first: boolean;
  readonly last: boolean;
  readonly kit: RowKit;
  /** Ligne portée par l'appui long : fond de la ligne portée. */
  readonly lifted?: boolean;
  /** Faux pendant un déplacement par appui long : pas de glissement « Supprimer ». */
  readonly swipeEnabled?: boolean;
}) {
  const resolveUri = useMediaUriResolver();
  const movement = kit.movementOf(item);
  const preview = movement === null ? null : firstMediaPreviewSource(movement.media);
  const name = item.exercise.name;
  const mode = kit.mode(item);
  const revealed = kit.revealedId === item.exercise.id;
  const testID = kit.rowTestID(index);
  const parameters = parametersLine(kit.parametersMissing?.(item) === true ? undefined : mode, isBilateral(item.exercise.executionParameters.sideMode));
  return (
    <View style={styles.nameLine}>
      {/* Retrait d'un mouvement : glissement de la ligne, comme les cartes qu'elle remplace ; Monter / Descendre à VoiceOver. */}
      <SwipeActionsRow
        actions={[{ key: "delete", label: strings.screens.formatModel.delete, backgroundColor: "#E5484D", onPress: () => kit.onRemove(index) }]}
        revealed={revealed}
        enabled={swipeEnabled}
        onReveal={() => kit.onReveal(item.exercise.id)}
        onHide={() => kit.onReveal(null)}
        onPress={() => (revealed ? kit.onReveal(null) : kit.onOpenParameters(index))}
        accessibilityLabel={name}
        extraAccessibilityActions={[
          ...(first ? [] : [{ name: "moveUp", label: strings.screens.formatModel.moveUp, onAction: () => kit.onMove(index, -1) }]),
          ...(last ? [] : [{ name: "moveDown", label: strings.screens.formatModel.moveDown, onAction: () => kit.onMove(index, 1) }]),
        ]}
        testID={`format-movement-${index}`}
      >
        <View style={[styles.nameContent, lifted ? styles.nameLifted : null]}>
          <Pressable
            onPress={movement === null ? undefined : () => kit.onOpenSheet(movement)}
            accessibilityRole="button"
            accessibilityLabel={fillName(tf().photo, name)}
            style={styles.photo}
            testID={`${testID}-photo`}
          >
            {preview !== null ? (
              <MediaPreview
                uri={resolveUri(preview.uri)}
                isVideo={preview.isVideo}
                imageStyle={styles.photoFill}
                fallbackStyle={styles.photoFill}
                imageTestID={`${testID}-photo-image`}
                fallbackTestID={`${testID}-photo-fallback`}
              />
            ) : (
              <View style={[styles.photoFill, styles.photoEmpty]} />
            )}
          </Pressable>
          {/* Toute la zone à droite de la photo (nom et ligne dessous) ouvre la modale des paramètres d'exécution. */}
          <Pressable
            onPress={() => (revealed ? kit.onReveal(null) : kit.onOpenParameters(index))}
            accessibilityRole="button"
            accessibilityLabel={`${tt().openParameters.replace("{name}", name)}, ${parameters.text}`}
            style={styles.nameText}
            testID={`${testID}-name-open`}
          >
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail" testID={`${testID}-name-title`}>
              {name}
            </Text>
            <Text style={[styles.parameters, parameters.missing ? styles.parametersMissing : styles.parametersSet]} numberOfLines={1} testID={`${testID}-parameters`}>
              {parameters.text}
            </Text>
          </Pressable>
        </View>
      </SwipeActionsRow>
      {/* Recette iPhone du 16/11/2026 (Hermann, fmt-entree : « les lignes horizontales de séparation doivent faire toute la largeur ») :
          le trait est posé au-dessus du contenu de la ligne (fond opaque, qui le masquait côté nom). */}
      <View style={styles.separator} pointerEvents="none" testID={`${testID}-separator`} />
      {/* [Popover d'unité et « (+ kg) » / « (− kg) » posés au-dessus de la ligne (recettes des 15 et 16/11/2026) — remplacés le 16/11/2026 :
          l'unité, le côté et la charge se règlent dans la modale des paramètres d'exécution.] */}
    </View>
  );
}

/**
 * Ligne sous le nom (décision de Hermann du 16/11/2026 : « je ne vois que 3 informations utiles à afficher qui sont l'unité
 * (obligatoire), la bilatéral (si activé : "bilatéral", sinon rien) » ; « rép. » retenu ; mission du 16/11/2026 : « Rien sur la
 * charge ») : « rép. » ou « durée », puis « · bilatéral » ; sans unité, « Paramètres à compléter ».
 */
export function parametersLine(mode: ExecutionMode | undefined, bilateral: boolean): { readonly text: string; readonly missing: boolean } {
  if (mode === undefined) return { text: tt().parametersToComplete, missing: true };
  const unit = mode === "DURATION" ? tt().durationUnitShort : tt().repetitionsUnitShort;
  return { text: bilateral ? `${unit}${tt().bilateralSuffix}` : unit, missing: false };
}

/** Valeur d'une colonne : case au clavier, charge « (10 kg) » dessous ; « – » grisé tant que l'unité n'est pas choisie. */
function ValueColumn({
  item,
  index,
  at,
  mode,
  heading,
  access,
  onChange,
  bind,
}: {
  readonly item: ModelMovement;
  readonly index: number;
  readonly at: number;
  readonly mode: ExecutionMode | undefined;
  readonly heading: string;
  readonly access: SeriesAccess;
  readonly onChange: (index: number, values: MovementValues) => void;
  readonly bind: (key: string, at: number) => ReturnType<CellBinding>;
}) {
  const values = item.values;
  const testID = access.cellTestID(index, at);
  if (mode === undefined) {
    return (
      <View style={styles.column} testID={`${testID}-slot`}>
        <Text style={styles.disabledValue} accessibilityLabel={fillName(tf().unitFirst, item.exercise.name)} testID={testID}>
          {tf().disabledValue}
        </Text>
      </View>
    );
  }
  const charged = values.loadOn === true;
  const objective = access.objective(values, at);
  const label = tt().cellLabel.replace("{movement}", item.exercise.name).replace("{column}", heading);
  return (
    <View style={styles.column} pointerEvents="box-none" testID={`${testID}-slot`}>
      <View style={[styles.cellAt, { top: charged ? BLOCK.cellTopCharged : BLOCK.cellTop }]} pointerEvents="box-none">
        <TableCell
          kind={mode === "DURATION" ? "duration" : "integer"}
          value={objective}
          format={(value) => valueText(value, mode)}
          missing={objective === null || access.flagged?.(index, at) === true}
          width={TABLE_LAYOUT.columnWidth}
          onChange={(value) => onChange(index, access.write(values, at, { objective: value }))}
          {...bind(cellKey("obj", index, at), at)}
          label={label.replace("{kind}", tt().objectiveKind)}
          testID={testID}
        />
      </View>
      {charged ? (
        <View style={styles.chargeAt} pointerEvents="box-none">
          <ChargeValue
            value={access.load(values, at)}
            onChange={(value) => onChange(index, access.write(values, at, { load: value }))}
            binding={bind(cellKey("load", index, at), at)}
            label={label.replace("{kind}", tt().loadKind)}
            testID={access.loadTestID(index, at)}
          />
        </View>
      ) : null}
    </View>
  );
}

function fillName(template: string, name: string): string {
  return template.replace("{name}", name);
}

const styles = StyleSheet.create({
  blocks: { marginTop: BLOCK.gap, gap: BLOCK.gap },
  // Bloc pleine largeur, sans marge latérale (CE-FMT-02 §8).
  block: { backgroundColor: PANEL, paddingBottom: BLOCK.bottomInset },
  blockRow: { flexDirection: "row" },
  names: { flex: 1, minWidth: 0 },
  header: { height: BLOCK.headerHeight },
  title: { position: "absolute", top: 8, left: 12, fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 12, lineHeight: 15, color: LABEL },
  add: { position: "absolute", top: 8, left: BLOCK.addLeft },
  addText: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 12, lineHeight: 15, color: valueFieldColors.editable },
  // Complément du 5 novembre 2026 (Hermann) (Figma « Superset — Récapitulatif ») : « + Ajouter » grisé.
  addDisabled: { opacity: 0.4 },
  // Mission du 16/11/2026 (Hermann : « met le triangle à la place du + et un peu plus gros ») : triangle de 8 × 13, centré là où était
  // le « + » (carré de 14 à x = −1, y = 7). [6 × 10 à x = 18, y = 11 — remplacé.] Recette du 16/11/2026 (mp-triangle, Hermann : « Le triangle doit être centré verticalement par rapport au texte, il doit s’inverser et changer de côté (avant la première colonne) quand on arrive à la dernière colonne. ») : centré
  // sur le texte des titres (milieu à 8 + 15 / 2 = 15,5). [y = 7,5 — remplacé.]
  triangle: {
    position: "absolute",
    top: 9,
    left: 2,
    width: 0,
    height: 0,
    borderTopWidth: 6.5,
    borderBottomWidth: 6.5,
    borderLeftWidth: 8,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: TRIANGLE,
  },
  // Même triangle, inversé, avant la première colonne visible (bord gauche des colonnes, dans la marge du nom).
  triangleBefore: {
    position: "absolute",
    top: 9,
    right: BLOCK.gutter + 3 * TABLE_LAYOUT.columnWidth + 2 * TABLE_LAYOUT.columnGap + 6,
    width: 0,
    height: 0,
    borderTopWidth: 6.5,
    borderBottomWidth: 6.5,
    borderRightWidth: 8,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: TRIANGLE,
  },
  values: { flexGrow: 0, flexShrink: 0 },
  // Colonnes à dimensions, calées à droite, la dernière à 16 du bord.
  dimensions: { paddingRight: BLOCK.sideInset },
  headLine: { flexDirection: "row", height: BLOCK.headerHeight, gap: TABLE_LAYOUT.columnGap },
  headText: { marginTop: 8, fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 12, lineHeight: 15, color: HEAD, textAlign: "center", width: 100, alignSelf: "center" },
  column: { width: TABLE_LAYOUT.columnWidth, alignSelf: "stretch", alignItems: "center", overflow: "visible" },
  valueLine: { flexDirection: "row", height: BLOCK.rowHeight, gap: TABLE_LAYOUT.columnGap },
  cellAt: { position: "absolute", left: 0, width: TABLE_LAYOUT.columnWidth, height: TABLE_LAYOUT.cellHeight },
  chargeAt: { position: "absolute", top: BLOCK.chargeTop, left: (TABLE_LAYOUT.columnWidth - 120) / 2, width: 120, height: 13, alignItems: "center" },
  disabledValue: { marginTop: 16, fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 13, lineHeight: 16, color: valueFieldColors.disabled, textAlign: "center" },
  dimensionText: { width: 100, alignSelf: "center" },
  strongValue: { color: valueFieldColors.readOnly },
  twoLines: { marginTop: 8 },
  // Ligne portée pendant le déplacement : au-dessus des autres, légèrement soulevée.
  lifted: { zIndex: 2, backgroundColor: LIFTED },
  // Ligne à dimensions portée : le fond va jusqu'au bord droit du bloc (retrait compris).
  liftedWide: { marginRight: -BLOCK.sideInset, paddingRight: BLOCK.sideInset },
  nameLifted: { backgroundColor: LIFTED },
  gutter: { width: BLOCK.gutter },
  gutterLine: { height: BLOCK.rowHeight },
  separator: { position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundColor: ROW_SEPARATOR },
  // Séparateur d'une ligne à dimensions : jusqu'au bord droit du bloc (retrait compris).
  separatorWide: { right: -BLOCK.sideInset },
  nameLine: { height: BLOCK.rowHeight },
  nameContent: { height: BLOCK.rowHeight, flexDirection: "row", backgroundColor: PANEL },
  photo: { position: "absolute", top: 4, left: BLOCK.photoLeft, width: BLOCK.photo, height: BLOCK.photo, borderRadius: 8, overflow: "hidden" },
  photoFill: { width: BLOCK.photo, height: BLOCK.photo, borderRadius: 8 },
  photoEmpty: { backgroundColor: "#E6E8EE" },
  // Zone touchable : toute la hauteur de la ligne, de la photo au bord droit de la colonne des noms.
  nameText: { position: "absolute", top: 0, bottom: 0, left: BLOCK.nameLeft, right: 0, paddingTop: 7, paddingRight: 8 },
  name: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 16, color: LABEL },
  // Ligne des paramètres sous le nom (y = 7 + 16 + 1), même corps que l'ancienne étiquette « (rép., + kg) » : bleu semi-gras,
  // rouge sans unité.
  parameters: { marginTop: 1, fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 11, lineHeight: 13 },
  parametersSet: { color: valueFieldColors.editable },
  parametersMissing: { color: colors.danger },
});
