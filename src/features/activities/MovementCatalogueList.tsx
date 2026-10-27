import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { decodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import type { VariantPlacement } from "@/features/activities/MovementResultCard";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { MediaPreview, firstMediaPreviewSource, useMediaUriResolver } from "@/features/activities/MediaPreview";
import { levelPastilleLabel } from "@/features/activities/MovementLevelMenu";
import type { MovementCatalogueEntry, MovementCatalogueService, MovementLifecycleResult } from "@/features/activities/MovementCatalogueService";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { strings } from "@/shared/i18n";
import { TransientNotification } from "@/shared/ui/TransientNotification";
import { colors, dimensions, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

import { visibleMovementItems, type MovementCatalogueFilters, type MovementCatalogueItem } from "./movementCatalogueView";
import { SwipeActionsRow, type SwipeAction } from "./SwipeActionsRow";

/**
 * PRE-8 — segment « Mouvements » du Catalogue : catalogue d'ENTRETIEN des Mouvements persistants,
 * distinct du Catalogue des Séances et sans contenu lançable (B.3), complété par les arbitrages de
 * Hermann du 27/10/2026 :
 *
 * - **B.5 Piles** (Figma `10266:20575`, `10471:23291`) : une famille d'au moins deux membres
 *   affichés est une pile, rang le plus haut en tête (Q-B2) ; toucher une pile fermée la déplie ;
 *   dépliée, chaque carte ouvre sa fiche et le trait de famille, à gauche, la replie. La recherche
 *   présente les mêmes piles dépliables. Rangs de la famille complète, archivés compris.
 * - **B.6 Actions glissées** (`10475:47634`) : « Partager » grisé (non opérationnel), « Créer une
 *   variante » déploie le choix existant Plus facile / Plus difficile puis ouvre la fiche de la
 *   variante, « Archiver ».
 * - **B.7 Recherche et filtres** (Q1 à Q4, Q3 définitif) : `visibleMovementItems`.
 * - **B.8 Archives** (Q5 à Q8, `10495:24054` à `10500:23772`) : archivage refusé tant qu'un
 *   Exercice persisté utilise le Mouvement (« Archivage impossible »), annulation immédiate de
 *   l'archivage et de la restauration, suppression définitive confirmée, sans annulation ni cascade.
 *
 * Tri (Trier grisé) et réordonnancement des familles ne sont pas développés.
 */

const t = strings.screens.movement.catalogue;
const tVariant = strings.screens.activities.editor.movementSuggestion;

type LoadState =
  | { readonly status: "loading" }
  | { readonly status: "error" }
  | { readonly status: "ready"; readonly entries: readonly MovementCatalogueEntry[] };

/** Entrées du Catalogue des Mouvements, relues à chaque `reloadToken`. */
export function useMovementCatalogue(reloadToken: number): {
  readonly state: LoadState;
  readonly reload: () => void;
  readonly catalogue: MovementCatalogueService | null;
} {
  const service = useActivityDefinitionService();
  const catalogue = useMemo(() => service.movementCatalogue, [service]);
  // Sans service de Mouvement : erreur dès l'état initial (aucune écriture d'état synchrone en effet).
  const [state, setState] = useState<LoadState>(() => (catalogue ? { status: "loading" } : { status: "error" }));
  const generation = useRef(0);
  const reload = useCallback(() => {
    const current = ++generation.current;
    if (!catalogue) return;
    catalogue.listEntries().then(
      (entries) => {
        if (generation.current === current) setState({ status: "ready", entries });
      },
      (error: unknown) => {
        console.error("Le catalogue des mouvements n'a pas pu être chargé.", error);
        if (generation.current === current) setState({ status: "error" });
      },
    );
  }, [catalogue]);
  useEffect(() => {
    reload();
  }, [reload, reloadToken]);
  return { state, reload, catalogue };
}

type Notice = { readonly message: string; readonly undo: () => void };
type Refusal = { readonly kind: "ARCHIVE" | "DELETE"; readonly exerciseCount: number };

export function MovementCatalogueList({
  reloadToken,
  filters,
  onOpenMovement,
  onCreateVariant,
}: {
  readonly reloadToken: number;
  readonly filters: MovementCatalogueFilters;
  readonly onOpenMovement: (movementId: string) => void;
  readonly onCreateVariant: (originId: string, placement: VariantPlacement) => void;
}) {
  const { state, reload, catalogue } = useMovementCatalogue(reloadToken);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [variantFor, setVariantFor] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const items = useMemo(
    () => (state.status === "ready" ? visibleMovementItems(state.entries, query, filters) : []),
    [state, query, filters],
  );

  const run = useCallback(
    (action: () => Promise<MovementLifecycleResult>, onDone: () => void, refusalKind: Refusal["kind"]) => {
      setRevealedId(null);
      setVariantFor(null);
      setActionFailed(false);
      action().then(
        (result) => {
          if (result.status === "DONE") onDone();
          else if (result.status === "REFERENCED") setRefusal({ kind: refusalKind, exerciseCount: result.exerciseCount });
          reload();
        },
        (error: unknown) => {
          console.error("L'action sur le mouvement a échoué.", error);
          setActionFailed(true);
          reload();
        },
      );
    },
    [reload],
  );

  const archive = useCallback(
    (movementId: string) => {
      if (!catalogue) return;
      run(
        () => catalogue.archive(movementId),
        () => setNotice({ message: t.archived, undo: () => run(() => catalogue.restore(movementId), () => undefined, "ARCHIVE") }),
        "ARCHIVE",
      );
    },
    [catalogue, run],
  );

  const restore = useCallback(
    (movementId: string) => {
      if (!catalogue) return;
      run(
        () => catalogue.restore(movementId),
        () => setNotice({ message: t.restored, undo: () => run(() => catalogue.archive(movementId), () => undefined, "ARCHIVE") }),
        "ARCHIVE",
      );
    },
    [catalogue, run],
  );

  const confirmDelete = useCallback(() => {
    const movementId = deleteCandidate;
    setDeleteCandidate(null);
    if (!catalogue || movementId === null) return;
    // Suppression définitive : confirmation préalable, aucune annulation ensuite (Q8).
    run(() => catalogue.deleteArchived(movementId), () => setNotice(null), "DELETE");
  }, [catalogue, deleteCandidate, run]);

  const actionsFor = (entry: MovementCatalogueEntry): readonly SwipeAction[] =>
    entry.archived
      ? [
          { key: "restore", label: t.actions.restore, backgroundColor: colors.selection, onPress: () => restore(entry.movement.id) },
          {
            key: "delete",
            label: t.actions.delete,
            backgroundColor: colors.danger,
            onPress: () => {
              setRevealedId(null);
              setDeleteCandidate(entry.movement.id);
            },
          },
        ]
      : [
          // « Partager » : nouveau, non opérationnel — visible et grisé (arbitrage du 27/10).
          { key: "share", label: t.actions.share, backgroundColor: colors.selection, disabled: true, onPress: () => undefined },
          {
            key: "variant",
            label: t.actions.createVariant,
            backgroundColor: colors.textSecondary,
            onPress: () => {
              setRevealedId(null);
              setVariantFor(entry.movement.id);
            },
          },
          { key: "archive", label: t.actions.archive, backgroundColor: colors.warning, onPress: () => archive(entry.movement.id) },
        ];

  const renderRow = (entry: MovementCatalogueEntry, onPress: () => void, pile: { readonly count: number } | null) => {
    const id = entry.movement.id;
    const levelLabel = entry.level !== null ? levelPastilleLabel(entry.level) : null;
    const label =
      pile !== null
        ? fillTemplate(t.pileAccessibilityLabel, { name: entry.movement.name, count: String(pile.count) })
        : [entry.movement.name, levelLabel, entry.archived ? t.archivedAccessibility : null].filter(Boolean).join(", ");
    return (
      <View key={id}>
        <SwipeActionsRow
          actions={actionsFor(entry)}
          revealed={revealedId === id}
          onReveal={() => {
            setVariantFor(null);
            setRevealedId(id);
          }}
          onHide={() => setRevealedId((current) => (current === id ? null : current))}
          onPress={onPress}
          accessibilityLabel={label}
          accessibilityHint={pile !== null ? t.pileExpandHint : t.openAccessibilityHint}
          testID={`movement-card-${id}`}
        >
          <MovementCatalogueCard entry={entry} />
        </SwipeActionsRow>
        {variantFor === id ? (
          <View style={styles.variantChoices} testID={`movement-card-${id}-variant-choices`}>
            <VariantChoice label={tVariant.easier} onPress={() => choose(id, "BEFORE_ORIGIN")} testID={`movement-card-${id}-easier`} />
            <VariantChoice label={tVariant.harder} onPress={() => choose(id, "AFTER_ORIGIN")} testID={`movement-card-${id}-harder`} />
          </View>
        ) : null}
      </View>
    );
  };

  const choose = (originId: string, placement: VariantPlacement) => {
    setVariantFor(null);
    onCreateVariant(originId, placement);
  };

  const renderItem = (item: MovementCatalogueItem) => {
    if (item.kind === "SINGLE") return renderRow(item.entry, () => onOpenMovement(item.entry.movement.id), null);
    const top = item.members[0]!;
    if (!expanded.has(item.key)) {
      return (
        <View testID={`movement-pile-${item.key}`}>
          {renderRow(top, () => setExpanded((current) => new Set(current).add(item.key)), { count: item.members.length })}
          {/* Épaisseur de la pile (Figma `10266:20575`), décorative. */}
          <View style={styles.stackEdge} accessible={false} importantForAccessibility="no" />
          <View style={[styles.stackEdge, styles.stackEdgeLower]} accessible={false} importantForAccessibility="no" />
        </View>
      );
    }
    return (
      <View style={styles.expandedPile} testID={`movement-pile-${item.key}-expanded`}>
        <Pressable
          onPress={() =>
            setExpanded((current) => {
              const next = new Set(current);
              next.delete(item.key);
              return next;
            })
          }
          accessibilityRole="button"
          accessibilityLabel={t.pileCollapse}
          hitSlop={{ left: spacing[12], right: spacing[4] }}
          style={styles.pileRail}
          testID={`movement-pile-${item.key}-collapse`}
        >
          <View style={styles.pileRailLine} />
        </Pressable>
        <View style={styles.pileMembers}>
          {item.members.map((member) => renderRow(member, () => onOpenMovement(member.movement.id), null))}
        </View>
      </View>
    );
  };

  const filtering = query.trim().length > 0 || items.length > 0 || state.status !== "ready" || state.entries.length === 0;

  return (
    <View style={styles.container} testID="movement-catalogue">
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.searchPlaceholder}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={t.searchAccessibilityLabel}
        autoCorrect={false}
        style={styles.search}
        testID="movement-catalogue-search"
      />
      {actionFailed ? (
        <Text style={styles.actionError} accessibilityLiveRegion="polite" testID="movement-catalogue-action-error">
          {t.actionError}
        </Text>
      ) : null}
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
          data={items}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => renderItem(item)}
          extraData={[expanded, revealedId, variantFor]}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.message} testID="movement-catalogue-empty">
              {state.entries.length === 0 ? t.empty : filtering && query.trim().length > 0 ? t.noResult : t.noMatch}
            </Text>
          }
          testID="movement-catalogue-list"
        />
      ) : null}
      <View pointerEvents="box-none" style={styles.noticeAnchor}>
        <TransientNotification
          message={notice?.message ?? null}
          actionLabel={t.undo}
          onAction={() => {
            const undo = notice?.undo;
            setNotice(null);
            undo?.();
          }}
          onDismiss={() => setNotice(null)}
          testID="movement-catalogue-notice"
        />
      </View>
      {refusal !== null ? <RefusalDialog refusal={refusal} onClose={() => setRefusal(null)} /> : null}
      {deleteCandidate !== null ? (
        <DecisionDialog
          title={t.deleteConfirm.title}
          titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
          message={t.deleteConfirm.message}
          messageStyle={{ ...type.dialogMessage, color: colors.dialogMessageText, textAlign: "center" }}
          cancelLabel={t.deleteConfirm.cancel}
          cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
          confirmLabel={t.deleteConfirm.confirm}
          confirmLabelStyle={type.dialogDestructiveActionLabel}
          confirmBordered={false}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={confirmDelete}
          testIDPrefix="movement-delete-confirm"
        />
      ) : null}
    </View>
  );
}

/** « Archivage impossible » (Figma `10495:24054`) ; même patron pour un refus de suppression. */
function RefusalDialog({ refusal, onClose }: { readonly refusal: Refusal; readonly onClose: () => void }) {
  const texts = refusal.kind === "ARCHIVE" ? t.archiveRefused : t.deleteRefused;
  const message =
    refusal.exerciseCount === 1 ? texts.messageOne : fillTemplate(texts.messageMany, { count: String(refusal.exerciseCount) });
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.dialogBackdrop} testID="movement-refusal-dialog">
        <View style={styles.dialogCard} accessibilityRole="alert">
          <Text style={styles.dialogTitle}>{texts.title}</Text>
          <Text style={styles.dialogMessage} testID="movement-refusal-message">
            {message}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.archiveRefused.acknowledge}
            style={styles.dialogAction}
            testID="movement-refusal-acknowledge"
          >
            <Text style={styles.dialogActionLabel}>{t.archiveRefused.acknowledge}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function VariantChoice({ label, onPress, testID }: { readonly label: string; readonly onPress: () => void; readonly testID: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.variantChoice} testID={testID}>
      <View style={styles.variantMark} accessible={false} importantForAccessibility="no" />
      <Text style={styles.variantLabel}>{label}</Text>
    </Pressable>
  );
}

/** Carte d'un Mouvement (Figma « Carte — Mouvement », 80 de haut : photo 64, nom, description, Niveau). */
function MovementCatalogueCard({ entry }: { readonly entry: MovementCatalogueEntry }) {
  const resolveUri = useMediaUriResolver();
  const { movement, level } = entry;
  const preview = firstMediaPreviewSource(movement.media);
  const description = decodeInstructionSteps(movement.description).join(" ");
  const levelLabel = level !== null ? levelPastilleLabel(level) : null;
  return (
    <View style={[styles.card, entry.archived ? styles.cardArchived : null]}>
      <View style={[styles.thumbnail, entry.archived ? styles.faded : null]}>
        {preview ? (
          <MediaPreview
            uri={resolveUri(preview.uri)}
            isVideo={preview.isVideo}
            imageStyle={styles.thumbnailImage}
            fallbackStyle={[styles.thumbnailImage, styles.thumbnailFallback]}
            imageTestID={`movement-card-image-${movement.id}`}
            fallbackTestID={`movement-card-fallback-${movement.id}`}
          />
        ) : (
          <View style={[styles.thumbnailImage, styles.thumbnailFallback]} testID={`movement-card-empty-${movement.id}`} />
        )}
      </View>
      <View style={[styles.texts, entry.archived ? styles.faded : null]}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1} testID={`movement-card-name-${movement.id}`}>
            {movement.name}
          </Text>
          {levelLabel ? (
            <Text style={styles.level} testID={`movement-card-level-${movement.id}`}>
              {levelLabel}
            </Text>
          ) : null}
        </View>
        {description.length > 0 ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const CARD_HEIGHT = 80;
const THUMBNAIL_SIZE = 64;
/** Épaisseur visible de la pile sous la carte du dessus (Figma `10266:20575`). */
const STACK_EDGE_HEIGHT = 4;
const STACK_EDGE_INSET = 8;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  search: {
    ...type.body,
    marginHorizontal: spacing[24],
    marginTop: spacing[8],
    marginBottom: spacing[12],
    minHeight: 44,
    paddingHorizontal: spacing[16],
    borderRadius: fixedRadii[12],
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  actionError: {
    ...type.supporting,
    color: colors.danger,
    marginHorizontal: spacing[24],
    marginBottom: spacing[8],
  },
  list: {
    paddingHorizontal: spacing[24],
    paddingBottom: spacing[24],
    gap: spacing[10],
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
  stackEdge: {
    height: STACK_EDGE_HEIGHT,
    marginHorizontal: STACK_EDGE_INSET,
    borderBottomLeftRadius: fixedRadii[8],
    borderBottomRightRadius: fixedRadii[8],
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.mediaBorder,
    backgroundColor: colors.background,
  },
  stackEdgeLower: {
    marginHorizontal: STACK_EDGE_INSET * 2,
  },
  expandedPile: {
    flexDirection: "row",
  },
  pileRail: {
    width: spacing[12],
    alignItems: "flex-start",
    marginLeft: -spacing[12],
  },
  pileRailLine: {
    flex: 1,
    width: 2,
    borderRadius: 1,
    backgroundColor: colors.primarySoft,
  },
  pileMembers: {
    flex: 1,
    gap: spacing[10],
  },
  variantChoices: {
    marginTop: spacing[4],
    marginLeft: spacing[24],
  },
  variantChoice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
    minHeight: minTouchTarget,
  },
  variantMark: {
    width: 10,
    height: 10,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.textSecondary,
  },
  variantLabel: {
    ...type.button,
    color: colors.primary,
  },
  noticeAnchor: {
    position: "absolute",
    left: spacing[16],
    right: spacing[16],
    bottom: spacing[16],
    height: minTouchTarget,
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[24],
  },
  dialogCard: {
    width: dimensions.decisionDialog.width,
    maxWidth: "100%",
    backgroundColor: colors.background,
    borderRadius: dimensions.decisionDialog.radius,
    padding: dimensions.decisionDialog.padding,
    gap: dimensions.decisionDialog.gap,
  },
  dialogTitle: {
    ...type.modalTitle,
    color: colors.dialogTitleText,
    textAlign: "center",
  },
  dialogMessage: {
    ...type.dialogMessage,
    color: colors.dialogMessageText,
  },
  dialogAction: {
    height: dimensions.decisionDialog.actionHeight,
    borderRadius: dimensions.decisionDialog.actionRadius,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogActionLabel: {
    ...type.button,
    color: colors.background,
  },
  card: {
    minHeight: CARD_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[12],
    padding: spacing[8],
    borderRadius: fixedRadii[12],
    borderWidth: 1,
    borderColor: colors.mediaBorder,
    backgroundColor: colors.background,
  },
  cardArchived: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  faded: {
    opacity: 0.6,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: fixedRadii[12],
    overflow: "hidden",
  },
  thumbnailImage: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
  },
  thumbnailFallback: {
    backgroundColor: colors.surface,
  },
  texts: {
    flex: 1,
    gap: spacing[4],
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
  },
  name: {
    ...type.sectionTitle,
    flex: 1,
    color: colors.textPrimary,
  },
  level: {
    ...type.label,
    color: colors.primary,
  },
  description: {
    ...type.supporting,
    color: colors.textSecondary,
  },
});
