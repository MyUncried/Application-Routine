import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { MediaPreview, firstMediaPreviewSource, useMediaUriResolver } from "@/features/activities/MediaPreview";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { strings } from "@/shared/i18n";
import { colors, fixedRadii, layout, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

import type { MovementCatalogueEntry } from "./MovementCatalogueService";
import { NEW_BADGES, useMovementCatalogue, type NewState } from "./MovementCatalogueList";
import {
  applyMovementCounter,
  movementCatalogueSummary,
  pileKeysOf,
  type MovementCatalogueSummary,
  type MovementCounter,
} from "./movementCatalogueCounters";
import { visibleMovementItems, type MovementCatalogueFilters, type MovementCatalogueItem } from "./movementCatalogueView";

const t = strings.screens.movement.catalogue;

/**
 * Grille de photos du catalogue des Mouvements à quatre colonnes — décisions de Hermann du 16/11/2026 (chapitre 07,
 * « Catalogue des Mouvements — présentation en grille » puis « grille à quatre colonnes » ; chapitre 13, CE-MVT-03,
 * « Présentation en grille du catalogue des Mouvements » ; Figma « Mouvement — Catalogue — Grille — 4 colonnes » `12530:27177`).
 *
 * - **Même collection que la liste** : `useMovementCatalogue` → `visibleMovementItems` → `applyMovementCounter`, compteurs
 *   remontés par `movementCatalogueSummary` (CE-CAT-CTX-01) ; recherche, filtres et compteurs inchangés.
 * - **Carte** : 86,5 × 112, fond blanc, rayon 12, ombre de la carte liste ; photo de 70 en tête (même source que la carte liste,
 *   `firstMediaPreviewSource`) ; nom sous la photo (6 du bord, 8 sous la photo), Inter Regular 10,5, deux lignes au plus ; ni
 *   pastille de niveau ni description.
 * - **Rangées** : quatre colonnes séparées de 8, rangées séparées de 10 (liste native `FlatList`, `numColumns`).
 * - **Pile repliée** : une seule feuille sous la carte de tête, décalée de 4 vers le bas et de 5 de chaque côté. Un appui la
 *   déploie : ses niveaux prennent leur place dans le flux de la grille, les cartes suivantes se décalent ; un liseré bleu
 *   sous la rangée relie les niveaux de la famille. Un appui sur le liseré la referme. [Pile déployée non dessinée en quatre
 *   colonnes : liseré repris de l'écran à trois colonnes `12478:26998` (3 de haut, bleu KODJO à 60 %, rayon 2), centré dans
 *   l'écart de 10 entre les rangées — choix de mise en page signalé au rapport de mission, sans règle nouvelle.]
 * - **Badge « New »** (D-510) : en bas à droite de la carte, collé au coin, forme de la liste réduite à 62 % ; « New ↓ » sur la
 *   tête d'une pile repliée dont un niveau caché est nouveau.
 * - Les actions de la liste (glissé, ajout d'un niveau, déplacement, création de famille) ne sont pas proposées en grille
 *   (CE-MVT-03 : « ne sont pas redessinées pour la grille »).
 */
export function MovementCatalogueGrid({
  reloadToken,
  query,
  filters,
  counter,
  onSummaryChange,
  onOpenMovement,
  newMovementIds,
  scrollTarget = null,
  onScrollTargetHandled,
  topInset,
}: {
  readonly reloadToken: number;
  readonly query: string;
  readonly filters: MovementCatalogueFilters;
  readonly counter?: MovementCounter | null;
  readonly onSummaryChange?: (summary: MovementCatalogueSummary | null) => void;
  readonly onOpenMovement: (movementId: string) => void;
  readonly newMovementIds?: ReadonlySet<string>;
  readonly scrollTarget?: string | null;
  readonly onScrollTargetHandled?: (id: string) => void;
  readonly topInset?: number;
}) {
  const { state, reload } = useMovementCatalogue(reloadToken);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const listRef = useRef<FlatList<GridCell>>(null);

  const items = useMemo(
    () => (state.status === "ready" ? applyMovementCounter(visibleMovementItems(state.entries, query, filters), counter ?? null) : []),
    [state, query, filters, counter],
  );

  // Recette iPhone CAT.1 du 30/10/2026 (cat-bascule), comme en liste : le compteur « mouvements » déplie toutes les piles
  // affichées ; à sa désactivation, l'état de dépliage d'avant revient.
  const activeCounter = counter ?? null;
  const [seenCounter, setSeenCounter] = useState<MovementCounter | null>(activeCounter);
  const [expandedBeforeMovements, setExpandedBeforeMovements] = useState<ReadonlySet<string> | null>(null);
  if (seenCounter !== activeCounter) {
    setSeenCounter(activeCounter);
    if (activeCounter === "MOVEMENTS") {
      setExpandedBeforeMovements(expanded);
      setExpanded(new Set([...expanded, ...pileKeysOf(items)]));
    } else if (seenCounter === "MOVEMENTS" && expandedBeforeMovements !== null) {
      setExpanded(expandedBeforeMovements);
      setExpandedBeforeMovements(null);
    }
  }

  const summary = useMemo(() => movementCatalogueSummary(items, expanded), [items, expanded]);
  const ready = state.status === "ready";
  useEffect(() => {
    onSummaryChange?.(ready ? summary : null);
  }, [onSummaryChange, ready, summary]);

  const cells = useMemo(() => gridCells(items, expanded, newMovementIds), [items, expanded, newMovementIds]);

  // D-510, règle 8 : au retour après une création, la grille se positionne sur la rangée de la fiche nouvelle (ou de sa pile
  // repliée), sans la déployer. Une fiche absente de la grille (filtres, recherche) abandonne la cible.
  useEffect(() => {
    if (scrollTarget === null || !ready) return;
    const index = cells.findIndex((cell) => cell.ids.includes(scrollTarget));
    if (index >= 0) listRef.current?.scrollToOffset({ offset: Math.floor(index / GRID_COLUMNS) * GRID_ROW_STEP, animated: false });
    onScrollTargetHandled?.(scrollTarget);
  }, [scrollTarget, ready, cells, onScrollTargetHandled]);

  const toggle = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const searching = query.trim().length > 0;

  return (
    <View style={styles.container} testID="movement-catalogue-grid">
      {state.status === "loading" ? (
        <View style={styles.centered} testID="movement-catalogue-loading">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
      {state.status === "error" ? (
        <View style={styles.centered} testID="movement-catalogue-error">
          <Text style={styles.message}>{t.loadError}</Text>
          <Pressable onPress={reload} accessibilityRole="button" accessibilityLabel={t.retry} style={styles.retry} testID="movement-catalogue-retry">
            <Text style={styles.retryLabel}>{t.retry}</Text>
          </Pressable>
        </View>
      ) : null}
      {state.status === "ready" ? (
        <FlatList
          ref={listRef}
          data={cells}
          keyExtractor={(cell) => cell.key}
          numColumns={GRID_COLUMNS}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.content, topInset !== undefined ? { paddingTop: spacing[4] + topInset } : null]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.message} testID="movement-catalogue-empty">
              {state.entries.length === 0 ? t.empty : searching ? t.noResult : t.noMatch}
            </Text>
          }
          renderItem={({ item: cell, index }) => (
            <GridCellView
              cell={cell}
              railRight={cell.kind === "MEMBER" && index % GRID_COLUMNS < GRID_COLUMNS - 1 && cells[index + 1]?.pileKey === cell.pileKey}
              onPress={() => (cell.kind === "PILE" ? toggle(cell.pileKey!) : onOpenMovement(cell.entry.movement.id))}
              onCollapse={cell.pileKey !== null ? () => toggle(cell.pileKey!) : undefined}
            />
          )}
          testID="movement-catalogue-grid-list"
        />
      ) : null}
    </View>
  );
}

/** Une case de la grille : carte seule, pile repliée (tête) ou niveau d'une pile déployée. */
type GridCell = {
  readonly key: string;
  readonly kind: "SINGLE" | "PILE" | "MEMBER";
  readonly entry: MovementCatalogueEntry;
  readonly pileKey: string | null;
  /** Nombre de niveaux de la pile repliée (accessibilité). */
  readonly count: number;
  readonly newState: NewState;
  /** Fiches portées par la case (cible de défilement D-510). */
  readonly ids: readonly string[];
};

function gridCells(items: readonly MovementCatalogueItem[], expanded: ReadonlySet<string>, newIds: ReadonlySet<string> | undefined): GridCell[] {
  const isNew = (id: string) => newIds?.has(id) ?? false;
  return items.flatMap((item): GridCell[] => {
    if (item.kind === "SINGLE") {
      const id = item.entry.movement.id;
      return [{ key: id, kind: "SINGLE", entry: item.entry, pileKey: null, count: 1, newState: isNew(id) ? "YES" : "NO", ids: [id] }];
    }
    if (expanded.has(item.key)) {
      return item.members.map((member) => {
        const id = member.movement.id;
        return { key: `${item.key}:${id}`, kind: "MEMBER", entry: member, pileKey: item.key, count: item.members.length, newState: isNew(id) ? "YES" : "NO", ids: [id] };
      });
    }
    const head = item.members[0]!;
    const ids = item.members.map((member) => member.movement.id);
    // D-510 : « New ↓ » quand un niveau caché est nouveau ; sinon « New » si la tête l'est.
    const hidden = ids.slice(1).some(isNew);
    return [{ key: item.key, kind: "PILE", entry: head, pileKey: item.key, count: item.members.length, newState: hidden ? "IN_PILE" : isNew(head.movement.id) ? "YES" : "NO", ids }];
  });
}

function GridCellView({
  cell,
  railRight,
  onPress,
  onCollapse,
}: {
  readonly cell: GridCell;
  /** Le niveau suivant de la même famille est sur la même rangée : le liseré franchit l'écart entre les deux cartes. */
  readonly railRight: boolean;
  readonly onPress: () => void;
  readonly onCollapse?: () => void;
}) {
  const { entry } = cell;
  const id = entry.movement.id;
  const newAccessibility = cell.newState === "YES" ? t.newAccessibility : cell.newState === "IN_PILE" ? t.newInPileAccessibility : null;
  const label =
    cell.kind === "PILE"
      ? [fillTemplate(t.pileAccessibilityLabel, { name: entry.movement.name, count: String(cell.count) }), newAccessibility].filter(Boolean).join(", ")
      : [entry.movement.name, entry.archived ? t.archivedAccessibility : null, newAccessibility].filter(Boolean).join(", ");
  return (
    <View style={styles.cell} testID={`movement-grid-cell-${cell.key}`}>
      {cell.kind === "PILE" ? <View style={styles.leaf} pointerEvents="none" testID={`movement-grid-leaf-${id}`} /> : null}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={cell.kind === "PILE" ? t.pileExpandHint : t.openAccessibilityHint}
        testID={`movement-grid-card-${id}`}
      >
        <MovementGridCard entry={entry} newState={cell.newState} />
      </Pressable>
      {cell.kind === "MEMBER" && onCollapse !== undefined ? (
        <Pressable
          onPress={onCollapse}
          accessibilityRole="button"
          accessibilityLabel={t.pileCollapse}
          hitSlop={RAIL_HIT_SLOP}
          style={[styles.rail, railRight ? styles.railJoined : null]}
          testID={`movement-grid-rail-${id}`}
        />
      ) : null}
    </View>
  );
}

/** Carte de grille : photo de 70 en tête, nom sur deux lignes au plus, badge « New » réduit. */
function MovementGridCard({ entry, newState }: { readonly entry: MovementCatalogueEntry; readonly newState: NewState }) {
  const resolveUri = useMediaUriResolver();
  const { movement } = entry;
  const preview = firstMediaPreviewSource(movement.media);
  const badge = newState === "NO" ? null : NEW_BADGES[newState];
  return (
    <View style={[styles.card, entry.archived ? styles.cardArchived : null]} testID={`movement-grid-surface-${movement.id}`}>
      <View style={styles.clip}>
        <View style={[styles.photo, entry.archived ? styles.faded : null]} testID={`movement-grid-photo-${movement.id}`}>
          {preview ? (
            <MediaPreview
              uri={resolveUri(preview.uri)}
              isVideo={preview.isVideo}
              imageStyle={styles.photoImage}
              fallbackStyle={[styles.photoImage, styles.photoFallback]}
              imageTestID={`movement-grid-image-${movement.id}`}
              fallbackTestID={`movement-grid-fallback-${movement.id}`}
            />
          ) : (
            <View style={[styles.photoImage, styles.photoFallback]} testID={`movement-grid-empty-${movement.id}`} />
          )}
        </View>
        <Text style={[styles.name, entry.archived ? styles.faded : null]} numberOfLines={2} testID={`movement-grid-name-${movement.id}`}>
          {movement.name}
        </Text>
        {badge !== null ? (
          // D-510 : onglet de la liste réduit à 62 %, collé au coin bas droit, découpé par l'arrondi ; pas une cible tactile.
          <View style={[styles.badge, { width: badge.width * BADGE_SCALE }]} pointerEvents="none" testID={`movement-grid-new-${movement.id}`}>
            <Image source={badge.shape} style={[styles.badgeShape, { width: badge.width * BADGE_SCALE }]} accessible={false} />
            <Text style={styles.badgeLabel} testID={`movement-grid-badge-label-${movement.id}`}>
              {badge.label}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Dimensions de la grille (CE-MVT-03, Carte ; Figma `12530:27177`). */
export const MOVEMENT_GRID = {
  columns: 4,
  cardWidth: 86.5,
  cardHeight: 112,
  columnGap: 8,
  rowGap: 10,
  photoHeight: 70,
  leafDrop: 4,
  leafInset: 5,
  badgeScale: 0.62,
} as const;
const GRID_COLUMNS = MOVEMENT_GRID.columns;
const GRID_ROW_STEP = MOVEMENT_GRID.cardHeight + MOVEMENT_GRID.rowGap;
const BADGE_SCALE = MOVEMENT_GRID.badgeScale;
/** Badge de la liste : onglet de 32 de haut, libellé à 18,5 du bord gauche et 12 du haut, Inter Medium 12 sur 16. */
const BADGE_HEIGHT = 32 * BADGE_SCALE;
/** Liseré de pile déployée (écran à trois colonnes `12478:26998`) : 3 de haut, centré dans l'écart entre les rangées. */
const RAIL_HEIGHT = 3;
/** Zone de toucher du liseré : tout l’écart entre les rangées (la case porte cet écart, voir `cell`). */
const RAIL_HIT_SLOP = { top: (MOVEMENT_GRID.rowGap - RAIL_HEIGHT) / 2, bottom: (MOVEMENT_GRID.rowGap - RAIL_HEIGHT) / 2, left: 0, right: 0 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing[4],
    paddingBottom: spacing[24] - MOVEMENT_GRID.rowGap,
  },
  row: {
    gap: MOVEMENT_GRID.columnGap,
  },
  // La case porte l’écart de 10 sous sa carte : la feuille de pile et le liseré restent dans ses limites (toucher iOS).
  cell: {
    width: MOVEMENT_GRID.cardWidth,
    height: MOVEMENT_GRID.cardHeight + MOVEMENT_GRID.rowGap,
  },
  // Feuille unique de la pile repliée : même carte, 5 de retrait de chaque côté, 4 plus bas.
  leaf: {
    position: "absolute",
    top: MOVEMENT_GRID.leafDrop,
    left: MOVEMENT_GRID.leafInset,
    width: MOVEMENT_GRID.cardWidth - 2 * MOVEMENT_GRID.leafInset,
    height: MOVEMENT_GRID.cardHeight,
    borderRadius: fixedRadii[12],
    backgroundColor: colors.background,
    shadowColor: colors.movementCardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  card: {
    width: MOVEMENT_GRID.cardWidth,
    height: MOVEMENT_GRID.cardHeight,
    borderRadius: fixedRadii[12],
    backgroundColor: colors.background,
    shadowColor: colors.movementCardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  // Carte archivée : fond et estompage de la carte liste (états archivés non dessinés en grille).
  cardArchived: {
    backgroundColor: colors.surface,
  },
  faded: {
    opacity: 0.6,
  },
  clip: {
    flex: 1,
    borderRadius: fixedRadii[12],
    overflow: "hidden",
  },
  photo: {
    width: MOVEMENT_GRID.cardWidth,
    height: MOVEMENT_GRID.photoHeight,
  },
  photoImage: {
    width: MOVEMENT_GRID.cardWidth,
    height: MOVEMENT_GRID.photoHeight,
  },
  photoFallback: {
    backgroundColor: colors.surface,
  },
  name: {
    ...type.movementGridCardName,
    color: colors.movementGridCardName,
    marginTop: 8,
    marginHorizontal: 6,
  },
  badge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    height: BADGE_HEIGHT,
  },
  badgeShape: {
    position: "absolute",
    top: 0,
    left: 0,
    height: BADGE_HEIGHT,
  },
  badgeLabel: {
    ...type.movementCardLevel,
    position: "absolute",
    left: 18.5 * BADGE_SCALE,
    top: 12 * BADGE_SCALE,
    fontSize: 12 * BADGE_SCALE,
    lineHeight: 16 * BADGE_SCALE,
    color: colors.background,
  },
  rail: {
    position: "absolute",
    top: MOVEMENT_GRID.cardHeight + (MOVEMENT_GRID.rowGap - RAIL_HEIGHT) / 2,
    left: 0,
    width: MOVEMENT_GRID.cardWidth,
    height: RAIL_HEIGHT,
    borderRadius: 2,
    backgroundColor: colors.movementGridRail,
  },
  railJoined: {
    width: MOVEMENT_GRID.cardWidth + MOVEMENT_GRID.columnGap,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[12],
  },
  message: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: spacing[24],
  },
  retry: {
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing[16],
  },
  retryLabel: {
    ...type.button,
    color: colors.primary,
  },
});
