import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

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
import { colors, dimensions, fixedRadii, layout, minTouchTarget, spacing, type } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

import {
  movedTo,
  reorderedFamilyIds,
  visibleMovementItems,
  type MovementCatalogueFilters,
  type MovementCatalogueItem,
} from "./movementCatalogueView";
import { SheetMotionProvider, SheetMotionScrollView, SheetMotionView } from "./SheetMotion";
import { SWIPE_ACTION_WIDTH, SwipeActionsRow, type SwipeAccessibilityAction, type SwipeAction } from "./SwipeActionsRow";

/**
 * PRE-8 — segment « Mouvements » du Catalogue : catalogue d'ENTRETIEN des Mouvements persistants,
 * distinct du Catalogue des Séances et sans contenu lançable (B.3), complété par les arbitrages de
 * Hermann du 27/10/2026 :
 *
 * - **B.5 Piles** (Figma `10266:20575`, `10471:23291`) : une famille d'au moins deux membres
 *   affichés est une pile, rang le plus haut en tête (Q-B2) ; toucher une pile fermée la déplie ;
 *   dépliée, chaque carte ouvre sa fiche et la marge gauche (filet de famille) la replie. La
 *   recherche présente les mêmes piles dépliables. Rangs de la famille complète, archivés compris.
 * - **B.6 Actions glissées** (`10475:47634`) : « Partager » grisé (non opérationnel), « Ajouter un
 *   niveau » déploie le choix Plus facile / Plus difficile sous les actions puis ouvre la fiche du
 *   nouveau Niveau, « Archiver ».
 * - **B.7 Recherche et filtres** (Q1 à Q4, Q3 définitif) : `visibleMovementItems` ; la saisie est
 *   portée par la zone de contexte du Catalogue (`query`).
 * - **B.8 Archives** (Q5 à Q8, `10495:24054` à `10500:23772`) : archivage refusé tant qu'un
 *   Exercice persisté utilise le Mouvement (« Archivage impossible »), annulation immédiate de
 *   l'archivage et de la restauration, suppression définitive confirmée, sans annulation ni cascade.
 *
 * Recette A/B du 27/10 (Figma `10579:21580`, `10465:23141`) :
 * - B01–B04, B07 : carte `Carte — Mouvement` pleine largeur utile, fond `#F9FAFC`, bordure 0,5
 *   `#CCD1E0`, rayon 12, ombre 8 % 0/2/10 ; titre 15/18 ; deux premières étapes de la
 *   description, une ligne chacune, tronquées indépendamment ; 8 entre média et texte.
 * - B05 : déploiement, repli, insertion et retrait par les animations de mise en page communes
 *   (`SheetMotion`), neutralisées par « Réduire les animations ».
 * - B06 : toute la marge gauche de la pile déployée (filet compris), sur sa hauteur, la replie.
 * - B08 : appui long sur une carte d'une pile déployée, puis glisser : réordonnancement de la
 *   famille (`MovementCatalogueService.reorderFamily`), actions accessibles équivalentes.
 * - B09 : la carte du dessus d'une pile condensée ne glisse pas.
 * - B11, B12 : « Ajouter un niveau » ; choix Figma `10579:21707` / `10579:21709` déployé dans le
 *   Catalogue, qui repousse les cartes suivantes et allonge le filet.
 *
 * Tri (Trier grisé) et réordonnancement des familles entre elles ne sont pas développés.
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
/** B08 : carte soulevée d'une pile déployée. */
type Drag = { readonly pileKey: string; readonly ids: readonly string[]; readonly from: number; readonly originY: number; readonly dy: number };
/** B08 : ordre affiché juste après une dépose, valable pour les entrées lues avant elle. */
type OrderOverride = { readonly entries: readonly MovementCatalogueEntry[]; readonly pileKey: string; readonly ids: readonly string[] };

const CARD_HEIGHT = 80;
/** Écart entre les cartes d'une pile déployée (Figma `10579:21580` : 4). */
const MEMBER_GAP = spacing[4];
/** Écart entre deux entrées du Catalogue, sous l'épaisseur d'une pile (Figma : 12). */
const ITEM_GAP = spacing[12];
/** Débord de l'épaisseur d'une pile condensée, par feuille (Figma : 6 puis 12) ; retrait 8 puis 16. */
const LEAF_STEP = 6;
const LEAF_INSET = spacing[8];

export function MovementCatalogueList({
  reloadToken,
  query,
  filters,
  onOpenMovement,
  onCreateVariant,
}: {
  readonly reloadToken: number;
  /** Recherche saisie dans la zone de contexte du Catalogue (D02). */
  readonly query: string;
  readonly filters: MovementCatalogueFilters;
  readonly onOpenMovement: (movementId: string) => void;
  readonly onCreateVariant: (originId: string, placement: VariantPlacement) => void;
}) {
  const { state, reload, catalogue } = useMovementCatalogue(reloadToken);
  const reduceMotion = useReduceMotion();
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [variantFor, setVariantFor] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const [reorderFailed, setReorderFailed] = useState(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [override, setOverride] = useState<OrderOverride | null>(null);
  const [memberStep, setMemberStep] = useState(CARD_HEIGHT + MEMBER_GAP);
  const lastTouchY = useRef(0);

  const items = useMemo(() => {
    if (state.status !== "ready") return [];
    const visible = visibleMovementItems(state.entries, query, filters);
    if (override === null || override.entries !== state.entries) return visible;
    return visible.map((item): MovementCatalogueItem => {
      if (item.kind !== "PILE" || item.key !== override.pileKey) return item;
      const byId = new Map(item.members.map((member) => [member.movement.id, member]));
      const members = override.ids.map((id) => byId.get(id)).filter((member) => member !== undefined);
      return members.length === item.members.length ? { ...item, members } : item;
    });
  }, [state, query, filters, override]);

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

  /** B08 : écrit le nouvel ordre affiché d'une pile ; les membres masqués gardent leur place. */
  const commitOrder = (pileKey: string, shownDescending: readonly string[]) => {
    if (!catalogue || state.status !== "ready") return;
    const familyAscending = state.entries
      .filter((entry) => entry.movement.levelGroup?.groupId === pileKey && entry.level !== null)
      .sort((left, right) => (left.level?.rank ?? 0) - (right.level?.rank ?? 0))
      .map((entry) => entry.movement.id);
    setReorderFailed(false);
    setOverride({ entries: state.entries, pileKey, ids: shownDescending });
    catalogue.reorderFamily(pileKey, reorderedFamilyIds(familyAscending, shownDescending)).then(
      (done) => {
        if (!done) {
          setOverride(null);
          setReorderFailed(true);
        }
        reload();
      },
      (error: unknown) => {
        console.error("L'ordre des niveaux n'a pas pu être enregistré.", error);
        setOverride(null);
        setReorderFailed(true);
        reload();
      },
    );
  };

  const dragTarget = (current: Drag) =>
    Math.max(0, Math.min(current.ids.length - 1, current.from + Math.round(current.dy / memberStep)));

  const endDrag = () => {
    const current = drag;
    setDrag(null);
    if (current === null) return;
    const to = dragTarget(current);
    if (to !== current.from) commitOrder(current.pileKey, movedTo(current.ids, current.from, to));
  };

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
            label: t.actions.addLevel,
            backgroundColor: colors.movementLevelAction,
            // B11 : la carte reste ouverte ; le choix se déploie sous les actions.
            onPress: () => setVariantFor((current) => (current === entry.movement.id ? null : entry.movement.id)),
          },
          { key: "archive", label: t.actions.archive, backgroundColor: colors.movementArchiveAction, onPress: () => archive(entry.movement.id) },
        ];

  const choose = (originId: string, placement: VariantPlacement) => {
    setVariantFor(null);
    setRevealedId(null);
    onCreateVariant(originId, placement);
  };

  const renderRow = (
    entry: MovementCatalogueEntry,
    onPress: () => void,
    options: {
      readonly pileCount?: number;
      readonly swipe: boolean;
      readonly onLongPress?: () => void;
      readonly reorderActions?: readonly SwipeAccessibilityAction[];
    },
  ) => {
    const id = entry.movement.id;
    const levelLabel = entry.level !== null ? levelPastilleLabel(entry.level) : null;
    const label =
      options.pileCount !== undefined
        ? fillTemplate(t.pileAccessibilityLabel, { name: entry.movement.name, count: String(options.pileCount) })
        : [entry.movement.name, levelLabel, entry.archived ? t.archivedAccessibility : null].filter(Boolean).join(", ");
    const actions = actionsFor(entry);
    const choicesOpen = options.swipe && variantFor === id && revealedId === id;
    return (
      <View>
        <SwipeActionsRow
          actions={actions}
          enabled={options.swipe}
          joined={choicesOpen}
          revealed={options.swipe && revealedId === id}
          onReveal={() => {
            setVariantFor(null);
            setRevealedId(id);
          }}
          onHide={() => {
            setVariantFor((current) => (current === id ? null : current));
            setRevealedId((current) => (current === id ? null : current));
          }}
          onPress={onPress}
          onLongPress={options.onLongPress}
          extraAccessibilityActions={options.reorderActions}
          accessibilityLabel={label}
          accessibilityHint={options.pileCount !== undefined ? t.pileExpandHint : options.onLongPress ? t.reorderHint : t.openAccessibilityHint}
          testID={`movement-card-${id}`}
        >
          <MovementCatalogueCard entry={entry} />
        </SwipeActionsRow>
        {choicesOpen ? (
          <SheetMotionView style={[styles.variantChoices, { width: actions.length * SWIPE_ACTION_WIDTH }]} testID={`movement-card-${id}-variant-choices`}>
            <VariantChoice
              label={tVariant.easier}
              arrow={ARROW_EASIER}
              corner="left"
              onPress={() => choose(id, "BEFORE_ORIGIN")}
              testID={`movement-card-${id}-easier`}
            />
            <VariantChoice
              label={tVariant.harder}
              arrow={ARROW_HARDER}
              corner="right"
              onPress={() => choose(id, "AFTER_ORIGIN")}
              testID={`movement-card-${id}-harder`}
            />
          </SheetMotionView>
        ) : null}
      </View>
    );
  };

  const collapse = (key: string) => {
    setRevealedId(null);
    setVariantFor(null);
    setExpanded((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  };

  const renderPile = (item: Extract<MovementCatalogueItem, { kind: "PILE" }>) => {
    const isExpanded = expanded.has(item.key);
    const ids = item.members.map((member) => member.movement.id);
    const pileDrag = drag !== null && drag.pileKey === item.key ? drag : null;
    const dropIndex = pileDrag !== null ? dragTarget(pileDrag) : null;
    const leaves = Math.min(item.members.length - 1, 2);
    return (
      <View
        style={isExpanded ? null : { paddingBottom: leaves * LEAF_STEP }}
        onTouchStart={(event) => {
          lastTouchY.current = event.nativeEvent.pageY;
        }}
        onTouchMove={(event) => {
          if (pileDrag === null) return;
          setDrag({ ...pileDrag, dy: event.nativeEvent.pageY - pileDrag.originY });
        }}
        onTouchEnd={pileDrag !== null ? endDrag : undefined}
        onTouchCancel={pileDrag !== null ? endDrag : undefined}
        testID={isExpanded ? `movement-pile-${item.key}-expanded` : `movement-pile-${item.key}`}
      >
        {!isExpanded
          ? Array.from({ length: leaves }, (_, index) => leaves - index).map((depth) => (
              <View
                key={`leaf-${depth}`}
                style={[styles.leaf, { top: depth * LEAF_STEP, left: depth * LEAF_INSET, right: depth * LEAF_INSET }]}
                accessible={false}
                importantForAccessibility="no"
                testID={`movement-pile-${item.key}-leaf-${depth}`}
              />
            ))
          : null}
        {isExpanded ? (
          // B06 : toute la marge gauche, filet compris, sur la hauteur de la pile, la replie.
          <Pressable
            onPress={() => collapse(item.key)}
            accessibilityRole="button"
            accessibilityLabel={t.pileCollapse}
            style={styles.collapseZone}
            testID={`movement-pile-${item.key}-collapse`}
          >
            <View style={styles.rail} testID={`movement-pile-${item.key}-rail`} />
          </Pressable>
        ) : null}
        {item.members.map((member, index) => {
          if (!isExpanded && index > 0) return null;
          const isLifted = pileDrag !== null && pileDrag.from === index;
          let shift = 0;
          if (pileDrag !== null && dropIndex !== null && !isLifted) {
            if (index > pileDrag.from && index <= dropIndex) shift = -memberStep;
            else if (index < pileDrag.from && index >= dropIndex) shift = memberStep;
          }
          const row = !isExpanded
            ? renderRow(
                member,
                () => {
                  setRevealedId(null);
                  setVariantFor(null);
                  setExpanded((current) => new Set(current).add(item.key));
                },
                { pileCount: item.members.length, swipe: false },
              )
            : renderRow(member, () => onOpenMovement(member.movement.id), {
                swipe: pileDrag === null,
                onLongPress: () => {
                  setRevealedId(null);
                  setVariantFor(null);
                  setDrag({ pileKey: item.key, ids, from: index, originY: lastTouchY.current, dy: 0 });
                },
                reorderActions: [
                  ...(index > 0
                    ? [
                        {
                          name: "moveHarder",
                          label: fillTemplate(t.moveHarder, { name: member.movement.name }),
                          onAction: () => commitOrder(item.key, movedTo(ids, index, index - 1)),
                        },
                      ]
                    : []),
                  ...(index < ids.length - 1
                    ? [
                        {
                          name: "moveEasier",
                          label: fillTemplate(t.moveEasier, { name: member.movement.name }),
                          onAction: () => commitOrder(item.key, movedTo(ids, index, index + 1)),
                        },
                      ]
                    : []),
                ],
              });
          return (
            <SheetMotionView
              key={member.movement.id}
              appear={index > 0}
              bleed={layout.screenGutter}
              raised={isLifted}
              style={[
                index > 0 ? styles.memberSpacing : null,
                isLifted ? [styles.lifted, { transform: [{ translateY: pileDrag.dy }] }] : shift !== 0 ? { transform: [{ translateY: shift }] } : null,
              ]}
              onLayout={index === 0 && isExpanded ? (event: LayoutChangeEvent) => setMemberStep(event.nativeEvent.layout.height + MEMBER_GAP) : undefined}
              testID={`movement-pile-${item.key}-member-${member.movement.id}`}
            >
              {row}
            </SheetMotionView>
          );
        })}
      </View>
    );
  };

  const renderItem = (item: MovementCatalogueItem) =>
    item.kind === "SINGLE" ? renderRow(item.entry, () => onOpenMovement(item.entry.movement.id), { swipe: true }) : renderPile(item);

  const searching = query.trim().length > 0;

  return (
    <View style={styles.container} testID="movement-catalogue">
      {actionFailed || reorderFailed ? (
        <Text style={styles.actionError} accessibilityLiveRegion="polite" testID="movement-catalogue-action-error">
          {reorderFailed ? t.reorderError : t.actionError}
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
        // B05 : monté avec la liste prête — les entrées présentes à l'ouverture ne s'animent pas ;
        // celles qui apparaissent ou disparaissent ensuite (pile dépliée, filtre, archivage) oui.
        <SheetMotionProvider reduceMotion={reduceMotion}>
          <SheetMotionScrollView
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEnabled={drag === null}
            testID="movement-catalogue-list"
          >
            {items.length === 0 ? (
              <Text style={styles.message} testID="movement-catalogue-empty">
                {state.entries.length === 0 ? t.empty : searching ? t.noResult : t.noMatch}
              </Text>
            ) : null}
            {items.map((item) => (
              <SheetMotionView key={item.key} bleed={layout.screenGutter} style={styles.item} testID={`movement-item-${item.key}`}>
                {renderItem(item)}
              </SheetMotionView>
            ))}
          </SheetMotionScrollView>
        </SheetMotionProvider>
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

const ARROW_EASIER = require("../../../assets/icons/catalogue-niveau-plus-facile.svg");
const ARROW_HARDER = require("../../../assets/icons/catalogue-niveau-plus-difficile.svg");

/** B11 : `Action glissée — Niveau plus facile / plus difficile` (Figma `10579:21707`, `10579:21709`). */
function VariantChoice({
  label,
  arrow,
  corner,
  onPress,
  testID,
}: {
  readonly label: string;
  readonly arrow: number;
  readonly corner: "left" | "right";
  readonly onPress: () => void;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.variantChoice, corner === "left" ? styles.variantChoiceLeft : styles.variantChoiceRight]}
      testID={testID}
    >
      <Text style={styles.variantLabel}>{label}</Text>
      <Image source={arrow} style={styles.variantArrow} accessible={false} />
    </Pressable>
  );
}

/**
 * Carte d'un Mouvement (Figma « Carte — Mouvement », 80 de haut) : photo 64 à 8 du bord, texte à 8
 * de la photo (B07), titre 15/18 (B02) et Niveau à droite, deux premières étapes de la
 * description, une par ligne, tronquées indépendamment (B03).
 */
function MovementCatalogueCard({ entry }: { readonly entry: MovementCatalogueEntry }) {
  const resolveUri = useMediaUriResolver();
  const { movement, level } = entry;
  const preview = firstMediaPreviewSource(movement.media);
  const steps = decodeInstructionSteps(movement.description).slice(0, 2);
  const levelLabel = level !== null ? levelPastilleLabel(level) : null;
  return (
    <View style={[styles.card, entry.archived ? styles.cardArchived : null]} testID={`movement-card-surface-${movement.id}`}>
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
        {steps.map((step, index) => (
          <Text key={index} style={styles.description} numberOfLines={1} testID={`movement-card-step-${movement.id}-${index + 1}`}>
            {step}
          </Text>
        ))}
      </View>
    </View>
  );
}

const THUMBNAIL_SIZE = 64;
/** Figma : photo à 7,5 dans une bordure de 0,5 — 8 du bord extérieur. */
const CARD_BORDER = 0.5;
const CARD_PADDING = spacing[8] - CARD_BORDER;
/** Figma : filet de 2, à 8 des cartes, du milieu de la première au milieu de la dernière carte. */
const RAIL_WIDTH = 2;
const RAIL_TO_CARD = spacing[8];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionError: {
    ...type.supporting,
    color: colors.danger,
    marginHorizontal: layout.screenGutter,
    marginBottom: spacing[8],
  },
  list: {
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing[4],
    paddingBottom: spacing[24],
  },
  item: {
    paddingBottom: ITEM_GAP,
  },
  memberSpacing: {
    paddingTop: MEMBER_GAP,
  },
  lifted: {
    shadowColor: colors.movementCardShadow,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
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
  // Figma `Pile — feuille 1/2` : blanc, bordure 1 `#E0E3ED`, rayon 12, en retrait de 8 puis 16.
  leaf: {
    position: "absolute",
    height: CARD_HEIGHT,
    borderRadius: fixedRadii[12],
    borderWidth: 1,
    borderColor: colors.movementPileLeafBorder,
    backgroundColor: colors.background,
  },
  // B06 : marge gauche entière de la pile déployée (du bord de l'écran au bord des cartes).
  collapseZone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -layout.screenGutter,
    width: layout.screenGutter,
    zIndex: 1,
  },
  rail: {
    position: "absolute",
    top: CARD_HEIGHT / 2,
    bottom: CARD_HEIGHT / 2,
    right: RAIL_TO_CARD,
    width: RAIL_WIDTH,
    borderRadius: 1,
    backgroundColor: colors.movementFamilyRail,
  },
  variantChoices: {
    alignSelf: "flex-end",
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[2],
  },
  variantChoice: {
    flex: 1,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: colors.movementLevelAction,
  },
  variantChoiceLeft: {
    borderBottomLeftRadius: fixedRadii[12],
  },
  variantChoiceRight: {
    borderBottomRightRadius: fixedRadii[12],
  },
  variantLabel: {
    ...type.swipeActionLabel,
    color: colors.background,
  },
  variantArrow: {
    width: 9,
    height: 12.6,
  },
  noticeAnchor: {
    position: "absolute",
    left: layout.screenGutter,
    right: layout.screenGutter,
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
  // B04 : `Carte — Mouvement` — fond `#F9FAFC`, bordure 0,5 `#CCD1E0`, rayon 12, ombre 8 % 0/2/10.
  card: {
    height: CARD_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[8],
    padding: CARD_PADDING,
    borderRadius: fixedRadii[12],
    borderWidth: CARD_BORDER,
    borderColor: colors.cardsBorder,
    backgroundColor: colors.surfaceSubtle,
    shadowColor: colors.movementCardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
  // Figma : titre à 3 du haut du bloc texte (10,5 − 7,5), description à 4 sous le titre.
  texts: {
    flex: 1,
    paddingTop: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
    marginBottom: spacing[4],
  },
  name: {
    ...type.compactCardTitle,
    flex: 1,
    color: colors.textPrimary,
  },
  level: {
    ...type.movementCardLevel,
    color: colors.primary,
  },
  description: {
    ...type.movementCardDescription,
    color: colors.movementCardDescription,
  },
});
