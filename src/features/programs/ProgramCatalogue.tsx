import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { ProgramStatus } from "@/domain/programs/Program";
import { SwipeActionsRow, type SwipeAction } from "@/features/activities/SwipeActionsRow";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { strings } from "@/shared/i18n";
import { CONTEXT_LINE_SELECTED, CONTEXT_SEPARATOR, CONTEXT_SEPARATOR_GAP, CONTEXT_TEXT_COLOR } from "@/shared/ui/catalogueContext";
import { CommandCircle } from "@/shared/ui/CatalogueCommands";
import { CatalogueContextZone } from "@/shared/ui/CatalogueContextZone";
import { SwipeScrollLockContext } from "@/shared/ui/swipeScrollLock";
import { colors, layout, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

import { cardCountsLine, cardStatusLine, deletionMessage, type ProgramCounts } from "./programPresentation";
import type { ProgramDeletionMode, ProgramDeletionPlan, ProgramService, ProgramSummary } from "./ProgramService";

/**
 * Catalogue des programmes (CE-PROG-01, CE-PROG-03 ; D-544 à D-547 ; Figma « PROG — 7 » `12848:47040`, « PROG — 7b »
 * `12863:490`, « PROG — 7c » `12872:610`, « PROG — 8 » `12848:47330`). Même présentation que les catalogues des mouvements et
 * des séances : zone de contexte commune (`CatalogueContextZone`), actions glissées du catalogue des séances
 * (`SwipeActionsRow`), confirmation `DecisionDialog` (variante « Titre, message et action secondaire »).
 */

const t = strings.programs.catalogue;
/** Figma « PROG — 7 » : textes secondaires de la carte. */
const CARD_MUTED = "#9499A8";
/** Figma « PROG — 7 » : carte 370 × 90, rayon 8. */
const CARD_HEIGHT = 90;
/** D-545 : bouton radio « DSF / Controls / Radio » (`5544:4736`, `5544:4739`), 20 × 20, comme les cartes du catalogue des mouvements. */
export const PROGRAM_RADIO_SIZE = 20;
/** Figma « PROG — 7b » : trois actions de 90 de large sur la hauteur de la carte. */
const PROGRAM_ACTION_WIDTH = 90;
const LABEL_LINE = 17;
const VERTICAL_SLOP = Math.max(0, (minTouchTarget - LABEL_LINE) / 2);

/** Ligne 1 de la zone de contexte : « Actifs N · Terminés N », filtre à sélection unique (D-545). */
export function ProgramStatusToggle({
  value,
  onChange,
  counts,
}: {
  readonly value: ProgramStatus;
  readonly onChange: (value: ProgramStatus) => void;
  /** `null` : liste pas encore chargée (aucun nombre). */
  readonly counts: ProgramCounts | null;
}) {
  const options: readonly { readonly value: ProgramStatus; readonly label: string }[] = [
    { value: "ACTIVE", label: t.active },
    { value: "TERMINATED", label: t.finished },
  ];
  return (
    <View style={styles.toggleRow} accessibilityRole="radiogroup" testID="program-status">
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <View key={option.value} style={styles.toggleGroup}>
            {index > 0 ? (
              <Text style={styles.toggleSeparator} accessible={false} importantForAccessibility="no">
                {CONTEXT_SEPARATOR}
              </Text>
            ) : null}
            <Pressable
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityLabel={counts === null ? option.label : `${option.label} ${counts[option.value]}`}
              accessibilityState={{ selected }}
              accessibilityHint={t.filterSelectHint}
              hitSlop={{ top: VERTICAL_SLOP, bottom: VERTICAL_SLOP }}
              style={styles.toggleOption}
              testID={`program-status-${option.value}`}
            >
              <Text style={[styles.toggleLabel, selected ? styles.toggleLabelSelected : null]}>{option.label}</Text>
              {counts !== null ? (
                <Text style={styles.toggleCount} testID={`program-status-${option.value}-count`}>
                  {String(counts[option.value])}
                </Text>
              ) : null}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Zone de contexte du segment Programmes : ligne 1 statut, ligne 2 Rechercher, Filtre, Tri. [Créer — retiré le 24/11/2026
 * (UI-FAB-01, D-558) : bouton flottant « Créer » du catalogue.]
 * [À CLARIFIER : aucun critère de filtre ni de tri n'est défini pour les programmes — Filtre et Tri sont affichés inactifs.]
 */
export function ProgramContext({
  status,
  onChangeStatus,
  counts,
  query,
  onChangeQuery,
  widenSearch = false,
}: {
  readonly status: ProgramStatus;
  readonly onChangeStatus: (status: ProgramStatus) => void;
  readonly counts: ProgramCounts | null;
  readonly query: string;
  readonly onChangeQuery: (query: string) => void;
  /** UI-FAB-01 : champ Rechercher élargi (catalogue des programmes) ; absent : inchangé (D-545, « Rattacher un programme »). */
  readonly widenSearch?: boolean;
}) {
  return (
    <CatalogueContextZone
      summary={<ProgramStatusToggle value={status} onChange={onChangeStatus} counts={counts} />}
      results={null}
      search={{
        value: query,
        onChangeText: onChangeQuery,
        placeholder: t.searchPlaceholder,
        accessibilityLabel: t.searchAccessibility,
        clearLabel: t.searchClear,
        testID: "program-catalogue-search",
      }}
      filter={<CommandCircle label={t.filter} icon="filter" disabled testID="program-filter-action" />}
      sortLabel={t.sort}
      widenSearch={widenSearch}
    />
  );
}

/** Carte d'un programme (Figma « PROG — 7 ») : nom ; « période · statut » ; « N planifications · N séances ». */
export function ProgramCard({
  summary,
  today,
  accessory,
}: {
  readonly summary: ProgramSummary;
  readonly today: string;
  /**
   * D-545 (« Rattacher un programme », Figma `13092:50055`) : bouton radio posé à droite de la carte, centré verticalement ; le
   * texte s'arrête avant lui. Absent : carte du catalogue inchangée.
   */
  readonly accessory?: ReactNode;
}) {
  return (
    <View style={[styles.card, accessory !== undefined ? styles.cardWithAccessory : null]} testID={`program-card-${summary.program.id}`}>
      {accessory !== undefined ? <View style={styles.cardAccessory} pointerEvents="none">{accessory}</View> : null}
      <Text style={styles.cardName} numberOfLines={1} testID={`program-card-${summary.program.id}-name`}>
        {summary.program.name}
      </Text>
      <Text style={styles.cardLine} numberOfLines={1} testID={`program-card-${summary.program.id}-status`}>
        {cardStatusLine(summary.program, today)}
      </Text>
      <Text style={styles.cardLine} numberOfLines={1} testID={`program-card-${summary.program.id}-counts`}>
        {cardCountsLine(summary)}
      </Text>
    </View>
  );
}

/**
 * D-546 et décisions de Hermann du 21/11/2026 — actions glissées, de gauche à droite : « Enregistrer comme modèle » (violet,
 * grisé et inactif : le modèle de programme n'existe pas encore), « Dupliquer » (gris), « Supprimer » (rouge #D92D20).
 */
export function programSwipeActions(handlers: { readonly onDuplicate: () => void; readonly onDelete: () => void }): readonly SwipeAction[] {
  return [
    { key: "template", label: t.saveAsTemplate, backgroundColor: colors.selection, disabled: true, onPress: () => undefined },
    { key: "duplicate", label: t.duplicate, backgroundColor: colors.movementLevelAction, onPress: handlers.onDuplicate },
    { key: "delete", label: t.delete, backgroundColor: colors.danger, onPress: handlers.onDelete },
  ];
}

type DeleteCandidate = { readonly summary: ProgramSummary; readonly plan: ProgramDeletionPlan };

/** Corps du segment Programmes : liste (ou état vide) et suppression. */
export function ProgramCatalogueBody({
  service,
  summaries,
  visible,
  failed,
  today,
  topInset,
  bottomInset,
  onOpen,
  onDuplicate,
  onChanged,
  onRetry,
}: {
  readonly service: ProgramService;
  /** `null` : chargement en cours. */
  readonly summaries: readonly ProgramSummary[] | null;
  readonly visible: readonly ProgramSummary[];
  readonly failed: boolean;
  readonly today: string;
  readonly topInset: number;
  readonly bottomInset: number;
  readonly onOpen: (programId: string) => void;
  readonly onDuplicate: (programId: string) => void;
  readonly onChanged: () => void;
  readonly onRetry: () => void;
}) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<DeleteCandidate | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const [swipeLocked, setSwipeLocked] = useState(false);
  const listRef = useRef<ScrollView>(null);
  // Recette du 23/11/2026 (p2-glisser, « La liste n'est pas figée pendant le geste ») : le verrou est posé tout de suite sur la
  // vue native, comme dans l'Agenda ; l'état de l'écran seul arrivait après la prise du geste par la liste.
  const lockList = useCallback((locked: boolean) => {
    try {
      listRef.current?.setNativeProps({ scrollEnabled: !locked });
    } catch {
      // Vue native indisponible (tests, démontage) : l'état de l'écran suffit.
    }
    setSwipeLocked(locked);
  }, []);
  const deleting = useRef(false);

  const askDelete = (summary: ProgramSummary) => {
    setRevealed(null);
    setActionFailed(false);
    service.deletionPlan(summary.program.id).then(
      (plan) => {
        if (plan !== null) setDeleteCandidate({ summary, plan });
      },
      () => setActionFailed(true),
    );
  };

  const remove = (mode: ProgramDeletionMode) => {
    const candidate = deleteCandidate;
    if (candidate === null || deleting.current) return;
    deleting.current = true;
    setDeleteCandidate(null);
    service.deleteProgram(candidate.summary.program.id, mode).then(
      () => {
        deleting.current = false;
        onChanged();
      },
      (error: unknown) => {
        console.error("Le programme n'a pas pu être supprimé.", error);
        deleting.current = false;
        setActionFailed(true);
        onChanged();
      },
    );
  };

  if (failed) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message} testID="program-catalogue-error">
          {t.loadError}
        </Text>
        <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel={t.retry} style={styles.retry}>
          <Text style={styles.retryLabel}>{t.retry}</Text>
        </Pressable>
      </View>
    );
  }
  if (summaries === null) return null;
  if (summaries.length === 0) {
    return (
      <View style={[styles.centered, { paddingBottom: bottomInset }]}>
        <Text style={styles.emptyMessage} testID="program-catalogue-empty">
          {t.empty}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SwipeScrollLockContext.Provider value={lockList}>
        <ScrollView
          ref={listRef}
          scrollEnabled={!swipeLocked}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: topInset, paddingBottom: bottomInset + spacing[24] }}
          testID="program-catalogue-list"
        >
          {actionFailed ? (
            <Text style={styles.error} accessibilityLiveRegion="polite" testID="program-catalogue-action-error">
              {t.actionError}
            </Text>
          ) : null}
          {visible.length === 0 ? (
            <Text style={styles.message} testID="program-catalogue-no-match">
              {t.noMatch}
            </Text>
          ) : null}
          {visible.map((summary) => {
            const id = summary.program.id;
            const actions = programSwipeActions({
              onDuplicate: () => {
                setRevealed(null);
                onDuplicate(id);
              },
              onDelete: () => askDelete(summary),
            });
            return (
              <View key={id} style={styles.item} testID={`program-item-${id}`}>
                <SwipeActionsRow
                  actions={actions}
                  revealed={revealed === id}
                  onReveal={() => setRevealed(id)}
                  onHide={() => setRevealed((current) => (current === id ? null : current))}
                  onPress={() => {
                    if (revealed !== id) onOpen(id);
                  }}
                  accessibilityLabel={`${summary.program.name}, ${cardStatusLine(summary.program, today)}, ${cardCountsLine(summary)}`}
                  accessibilityHint={t.openAccessibility}
                  actionsHeight={CARD_HEIGHT}
                  actionWidth={PROGRAM_ACTION_WIDTH}
                  testID={`program-item-${id}-swipe`}
                >
                  <ProgramCard summary={summary} today={today} />
                </SwipeActionsRow>
              </View>
            );
          })}
        </ScrollView>
      </SwipeScrollLockContext.Provider>
      {deleteCandidate !== null ? (
        <DecisionDialog
          stacked
          title={strings.programs.deletion.title}
          titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
          message={deletionMessage(deleteCandidate.plan)}
          messageStyle={{ ...type.dialogMessage, color: colors.dialogMessageText, textAlign: "center" }}
          cancelLabel={strings.programs.deletion.cancel}
          cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
          confirmLabel={strings.programs.deletion.withRoutines}
          confirmLabelStyle={type.dialogDestructiveActionLabel}
          confirmBordered={false}
          secondaryAction={deleteCandidate.plan.canKeepRoutines ? { label: strings.programs.deletion.keepRoutines, onPress: () => remove("KEEP_ROUTINES") } : null}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => remove("WITH_ROUTINES")}
          testIDPrefix="program-delete"
        />
      ) : null}
    </View>
  );
}

/** Lecture des cartes du catalogue ; `reload` à chaque retour au premier plan et après une action. */
export function useProgramSummaries(service: ProgramService | null): {
  readonly summaries: readonly ProgramSummary[] | null;
  readonly failed: boolean;
  readonly reload: () => void;
} {
  const [summaries, setSummaries] = useState<readonly ProgramSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const request = useRef(0);
  const reload = useCallback(() => {
    if (service === null) return;
    const id = ++request.current;
    service.listSummaries().then(
      (list) => {
        if (id !== request.current) return;
        setFailed(false);
        setSummaries(list);
      },
      (error: unknown) => {
        if (id !== request.current) return;
        console.error("Les programmes n'ont pas pu être chargés.", error);
        setFailed(true);
      },
    );
  }, [service]);
  useEffect(() => () => {
    request.current += 1;
  }, []);
  return { summaries, failed, reload };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toggleRow: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  toggleGroup: { flexDirection: "row", alignItems: "center" },
  toggleOption: { flexDirection: "row", alignItems: "center", minHeight: LABEL_LINE },
  toggleSeparator: { ...type.contextLine, color: CONTEXT_TEXT_COLOR, marginHorizontal: CONTEXT_SEPARATOR_GAP },
  toggleLabel: { ...type.contextLine, color: colors.textSecondary },
  toggleLabelSelected: { ...CONTEXT_LINE_SELECTED, color: colors.primary },
  toggleCount: { ...type.contextLine, color: CONTEXT_TEXT_COLOR, marginLeft: spacing[6] },
  // D-565 (recette du 23/11/2026, constat g) : la rangée porte les marges de 16, comme le catalogue des séances ; la carte ouverte
  // s'arrête à 8 de ses actions (`SWIPE_ACTIONS_GAP`). [Avant : carte à marges propres et actions décalées de 16 — écart de 24.]
  item: { paddingBottom: spacing[12], paddingHorizontal: layout.screenGutter },
  // Figma « PROG — 7 » : 370 × 90, fond #F9FAFC, liseré 0,5 #CCD1E0, rayon 8, ombre 0 2 10 rgba(26,26,38,0.08) ;
  // nom à 14 du haut et 16 du bord, lignes à 40 et 60.
  card: {
    height: CARD_HEIGHT,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 0.5,
    borderColor: colors.cardsBorder,
    borderRadius: 8,
    paddingHorizontal: spacing[16],
    paddingTop: 14,
    shadowColor: "#1A1A26",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  // D-545 : radio de 20 à 16 du bord droit, texte arrêté à 12 de lui.
  cardWithAccessory: { paddingRight: spacing[16] + PROGRAM_RADIO_SIZE + spacing[12] },
  cardAccessory: { position: "absolute", right: spacing[16], top: 0, bottom: 0, justifyContent: "center" },
  cardName: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 16, color: colors.textPrimary },
  cardLine: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 12, color: CARD_MUTED, marginTop: 5 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[16] },
  // Figma « PROG — 8 » : texte centré, 290 de large, Inter Medium 14 #9499A8.
  emptyMessage: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 14, color: CARD_MUTED, textAlign: "center", width: 290 },
  message: { ...type.body, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing[24] },
  error: { ...type.supporting, color: colors.danger, marginBottom: spacing[8], paddingHorizontal: layout.screenGutter },
  retry: { paddingHorizontal: spacing[16], paddingVertical: spacing[8], borderRadius: 20, backgroundColor: colors.primary },
  retryLabel: { ...type.button, color: colors.background },
});
