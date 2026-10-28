import * as Crypto from "expo-crypto";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { SheetMotionProvider, SheetMotionScrollView, SheetMotionView } from "@/features/activities/SheetMotion";
import { SwipeActionsRow, type SwipeAction } from "@/features/activities/SwipeActionsRow";
import { formatSessionDurationEstimate } from "@/features/sessions/compositionPresentation";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { formatActivityCount } from "@/features/sessions/formatSessionSummary";
import { SESSION_CARD_HEADER_HEIGHT, SessionCard } from "@/features/sessions/SessionCard";
import { compositionAccessibilityText, SessionCompositionTree } from "@/features/sessions/SessionCompositionTree";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { useSessionService } from "@/features/sessions/SessionServiceContext";
import type { SessionLifecycleOutcome } from "@/domain/sessions/SessionRepository";
import { strings } from "@/shared/i18n";
import { TransientNotification } from "@/shared/ui/TransientNotification";
import { colors, layout, minTouchTarget, spacing, type } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

/**
 * PRE-8 (epic E) — liste du segment Séances du Catalogue unifié : cartes uniques (E.2), 12 entre deux
 * cartes quelle que soit leur hauteur, marge 16 (spécification §4). Toucher une carte ouvre la
 * Composition existante (E.7) ; le chevron et Lecture interceptent leur propre toucher.
 *
 * E.3 : le chevron du nom déploie la composition (état de l'écran, jamais persisté, conservé pendant
 * la session). Pour VoiceOver, la carte est un seul élément : le déploiement y est une action
 * d'accessibilité nommée et la composition déployée s'ajoute à son nom accessible.
 *
 * E.5 (spécification §5, CE-T03-01 révisé) : glissé sur toute la carte, repliée ou déployée, par le
 * mécanisme des Mouvements (`SwipeActionsRow`) ; bloc d'actions de 80, aligné en haut, jointif sur la
 * marge droite, carte arrêtée à 8 du bloc ; une seule carte ouverte à la fois.
 * - Active : Planifier (présent, grisé : aucune planification), Dupliquer, Archiver.
 * - Archivée : Restaurer puis Supprimer.
 * - Archiver : immédiat (aucune Routine), snackbar « Séance archivée » avec Annuler ; Restaurer :
 *   « Séance restaurée » avec Annuler ; Supprimer : confirmation « Supprimer cette séance ? »
 *   (`2234:189`), sans annulation ensuite. Une action porte sur la Séance, jamais sur une ligne.
 * - Une double action ne crée rien : transitions contrôlées par le repository, duplication
 *   verrouillée tant qu'elle est en cours.
 */

const t = strings.screens.sessions;
const tCard = t.catalogueCard;

export function sessionCardAccessibilityLabel(projection: SessionCatalogueProjection, expanded = false): string {
  const summary =
    projection.summary.kind === "FORMAT"
      ? projection.summary.label
      : projection.summary.kind === "VOLUME"
        ? projection.summary.volume
        : formatActivityCount(projection.summary.count);
  return [
    projection.name,
    projection.categories.map((category) => category.name).join(", "),
    summary,
    formatSessionDurationEstimate(projection.duration),
    projection.status === "ARCHIVED" ? tCard.archivedAccessibility : null,
    expanded && projection.tree.length > 0 ? compositionAccessibilityText(projection.tree) : null,
  ]
    .filter((part) => part !== null && part.length > 0)
    .join(", ");
}

type Notice = { readonly message: string; readonly undo: () => void };

export function SessionCatalogueList({
  sessions,
  emptyMessage,
  resetToken = 0,
  onOpenSession,
  onChanged,
}: {
  readonly sessions: readonly SessionCatalogueProjection[];
  /** Q-E6 : message de la liste sans résultat après filtrage ; `null` si la liste n'est pas vide. */
  readonly emptyMessage: string | null;
  /** Retour au premier plan : aucune carte ne reste ouverte (comme le Catalogue des Mouvements). */
  readonly resetToken?: number;
  readonly onOpenSession: (sessionId: string) => void;
  /** Relecture du Catalogue après une action. */
  readonly onChanged?: () => void;
}) {
  const sessionService = useSessionService();
  const reduceMotion = useReduceMotion();
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const duplicating = useRef(false);

  const [seenResetToken, setSeenResetToken] = useState(resetToken);
  if (seenResetToken !== resetToken) {
    setSeenResetToken(resetToken);
    setRevealedId(null);
  }

  const toggle = (sessionId: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });

  const run = useCallback(
    (action: () => Promise<SessionLifecycleOutcome | { readonly status: string }>, onDone: () => void) => {
      setRevealedId(null);
      setActionFailed(false);
      action().then(
        (outcome) => {
          if (outcome.status === "DONE" || outcome.status === "DUPLICATED") onDone();
          onChanged?.();
        },
        (error: unknown) => {
          console.error("L'action sur la séance a échoué.", error);
          setActionFailed(true);
          onChanged?.();
        },
      );
    },
    [onChanged],
  );

  const archive = useCallback(
    (sessionId: string) =>
      run(
        () => sessionService.archiveSession(sessionId),
        () => setNotice({ message: tCard.archived, undo: () => run(() => sessionService.restoreSession(sessionId), () => undefined) }),
      ),
    [run, sessionService],
  );

  const restore = useCallback(
    (sessionId: string) =>
      run(
        () => sessionService.restoreSession(sessionId),
        () => setNotice({ message: tCard.restored, undo: () => run(() => sessionService.archiveSession(sessionId), () => undefined) }),
      ),
    [run, sessionService],
  );

  const duplicate = useCallback(
    (sessionId: string) => {
      if (duplicating.current) return;
      duplicating.current = true;
      run(
        () =>
          sessionService.duplicateSession(sessionId, () => Crypto.randomUUID()).finally(() => {
            duplicating.current = false;
          }),
        () => setNotice(null),
      );
    },
    [run, sessionService],
  );

  const confirmDelete = () => {
    const sessionId = deleteCandidate;
    setDeleteCandidate(null);
    if (sessionId === null) return;
    // Suppression définitive : confirmée, aucune annulation ensuite.
    run(() => sessionService.deleteArchivedSession(sessionId), () => setNotice(null));
  };

  const actionsFor = (projection: SessionCatalogueProjection): readonly SwipeAction[] =>
    projection.status === "ARCHIVED"
      ? [
          { key: "restore", label: tCard.actions.restore, backgroundColor: colors.selection, onPress: () => restore(projection.id) },
          {
            key: "delete",
            label: tCard.actions.delete,
            backgroundColor: colors.danger,
            onPress: () => {
              setRevealedId(null);
              setDeleteCandidate(projection.id);
            },
          },
        ]
      : [
          // Aucun parcours de planification : présent et grisé (CE-T03-01, destination non livrée).
          { key: "plan", label: tCard.actions.plan, backgroundColor: colors.selection, disabled: true, onPress: () => undefined },
          { key: "duplicate", label: tCard.actions.duplicate, backgroundColor: colors.movementLevelAction, onPress: () => duplicate(projection.id) },
          { key: "archive", label: tCard.actions.archive, backgroundColor: colors.movementArchiveAction, onPress: () => archive(projection.id) },
        ];

  return (
    <View style={styles.container} testID="catalogue-session-list-frame">
      {actionFailed ? (
        <Text style={styles.actionError} accessibilityLiveRegion="polite" testID="catalogue-session-action-error">
          {tCard.actionError}
        </Text>
      ) : null}
      <SheetMotionProvider reduceMotion={reduceMotion}>
        <SheetMotionScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          testID="catalogue-session-list"
        >
          {sessions.length === 0 && emptyMessage !== null ? (
            <Text style={styles.message} testID="catalogue-session-no-match">
              {emptyMessage}
            </Text>
          ) : null}
          {sessions.map((projection) => {
            const isExpanded = projection.expandable && expanded.has(projection.id);
            const toggleLabel = fillTemplate(isExpanded ? tCard.collapseAccessibilityLabel : tCard.expandAccessibilityLabel, {
              name: projection.name,
            });
            return (
              <SheetMotionView key={projection.id} bleed={layout.screenGutter} style={styles.item} testID={`catalogue-session-item-${projection.id}`}>
                <SwipeActionsRow
                  actions={actionsFor(projection)}
                  revealed={revealedId === projection.id}
                  onReveal={() => setRevealedId(projection.id)}
                  onHide={() => setRevealedId((current) => (current === projection.id ? null : current))}
                  onPress={() => onOpenSession(projection.id)}
                  accessibilityLabel={sessionCardAccessibilityLabel(projection, isExpanded)}
                  accessibilityHint={t.card.openAccessibilityLabel}
                  accessibilityState={projection.expandable ? { expanded: isExpanded } : undefined}
                  extraAccessibilityActions={
                    projection.expandable ? [{ name: "toggleComposition", label: toggleLabel, onAction: () => toggle(projection.id) }] : []
                  }
                  actionsHeight={SESSION_CARD_HEADER_HEIGHT}
                  testID={`session-card-${projection.id}-swipe`}
                >
                  <SessionCard projection={projection} expanded={isExpanded} onToggleExpanded={() => toggle(projection.id)}>
                    <SessionCompositionTree tree={projection.tree} testID={`session-card-${projection.id}-composition`} />
                  </SessionCard>
                </SwipeActionsRow>
              </SheetMotionView>
            );
          })}
        </SheetMotionScrollView>
      </SheetMotionProvider>
      <View pointerEvents="box-none" style={styles.noticeAnchor}>
        <TransientNotification
          message={notice?.message ?? null}
          actionLabel={tCard.undo}
          onAction={() => {
            const undo = notice?.undo;
            setNotice(null);
            undo?.();
          }}
          onDismiss={() => setNotice(null)}
          testID="catalogue-session-notice"
        />
      </View>
      {deleteCandidate !== null ? (
        <DecisionDialog
          title={tCard.deleteConfirm.title}
          titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
          message={tCard.deleteConfirm.message}
          messageStyle={{ ...type.dialogMessage, color: colors.dialogMessageText, textAlign: "center" }}
          cancelLabel={tCard.deleteConfirm.cancel}
          cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
          confirmLabel={tCard.deleteConfirm.confirm}
          confirmLabelStyle={type.dialogDestructiveActionLabel}
          confirmBordered={false}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={confirmDelete}
          testIDPrefix="session-delete-confirm"
        />
      ) : null}
    </View>
  );
}

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
  // Spécification §4 : 12 entre deux cartes, quelle que soit leur hauteur.
  item: {
    paddingBottom: spacing[12],
  },
  message: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: spacing[24],
  },
  noticeAnchor: {
    position: "absolute",
    left: layout.screenGutter,
    right: layout.screenGutter,
    bottom: spacing[16],
    height: minTouchTarget,
  },
});
