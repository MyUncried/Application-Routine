import { Fragment, useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { strings } from "@/shared/i18n";
import { FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, spacing, type } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

import type { ActivityDefinitionService, MovementLevels } from "./ActivityDefinitionService";
import { EDITOR_HEADER, editorSideMargin } from "./ActivityEditorForm";
import { fillTemplate } from "./movementChoicePresentation";
import { SheetMotionGroupMount, SheetMotionProvider, SheetMotionView } from "./SheetMotion";
import { DraggableRow, InsertionGuide, TABLE_ROW_INSET, tableStyles, type DraggableRowLabels } from "./sheetTable";

/**
 * PRE-7 story A3.2 (D-439, MFN-05, MFN-07, MFN/AC07, MFN/AC33 ; ch03 l.154) — consultation et
 * réordonnancement des niveaux du groupe d'un geste : liste ordonnée (rang, nom du geste, nombre
 * d'Exercices du Catalogue) ; « l'ordre se modifie par glissement ».
 *
 * Écran sans frame Figma, `NON VÉRIFIABLE` (ch13 §2) : composé uniquement de composants existants.
 * - Présentation : `Modal` native plein écran au-dessus de la fiche (procédé de
 *   `MovementSearchScreen`, A2.3) — état du parcours CE-T03-04, sans nouvelle destination de
 *   navigation (ch13, « sans créer de nouvelles destinations ») ; le brouillon de la fiche reste
 *   monté et intact.
 * - Lignes : `DraggableRow` de `sheetTable.tsx` (plan PRE-7 §3, §8), sans modification — poignée
 *   de glisser, numéro = rang, actions accessibles Monter / Descendre (même déplacement métier),
 *   repère `InsertionGuide`, ligne soulevée et transitions de place `SheetMotionView` ; patron
 *   d'appelant de `WorkPhasesTable`. La mécanique de glisser de la Composition
 *   (`useAnimatedShift`) n'est pas reprise.
 * - Écriture : à chaque dépose (ou action Monter / Descendre), par
 *   `ActivityDefinitionService.reorderMovementLevels` — un déplacement dans le groupe n'est pas
 *   une modification du geste : aucune question d'identité, aucun contenu touché. L'ordre est
 *   appliqué dans le même rendu que la dépose (l'insertion de la ligne en dépend), puis remplacé
 *   par les niveaux relus ; en échec, l'ordre précédent est restauré et un message s'affiche. Une
 *   seule écriture à la fois : un déplacement demandé pendant une écriture est ignoré ; la fermeture
 *   attend la fin de l'écriture en vol (la fiche relit alors l'ordre réellement écrit).
 * - Lignes non touchables : consultation et ordre seulement (changer de niveau reste au popover).
 */
export type MovementLevelsScreenProps = {
  readonly service: ActivityDefinitionService;
  /** Geste de la fiche : son groupe est affiché. */
  readonly movementId: string;
  /** ✕ (et retour système) : retour à la fiche, qui relit ses niveaux. */
  readonly onClose: () => void;
};

type LoadState =
  | { readonly kind: "loading" }
  | { readonly kind: "error" }
  | { readonly kind: "ready"; readonly levels: MovementLevels };

/** Préfixe des identifiants de ligne (`DraggableRow` : `${prefix}-${n}`, `${prefix}-${n}-handle`). */
export const LEVEL_ROW_TEST_ID = "movement-levels-row";

/** Niveaux réordonnés localement (rang = position), dans le rendu de la dépose. */
function movedLevels(levels: MovementLevels, from: number, to: number): MovementLevels {
  const entries = [...levels.levels];
  const [moved] = entries.splice(from, 1);
  if (moved === undefined) return levels;
  entries.splice(to, 0, moved);
  return { ...levels, levels: entries.map((entry, index) => ({ ...entry, rank: index + 1 })) };
}

export function MovementLevelsScreen({ service, movementId, onClose }: MovementLevelsScreenProps) {
  const t = strings.screens.activities.editor.levelOrder;
  const sideMargin = editorSideMargin(useWindowDimensions().width);
  const reduceMotion = useReduceMotion();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [loadToken, setLoadToken] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const savingRef = useRef(false);
  // Revue A3.2 : écriture en vol — la fermeture l'attend, pour que la fiche relise l'ordre écrit.
  const pendingWriteRef = useRef<Promise<void> | null>(null);
  const closingRef = useRef(false);
  function close() {
    if (closingRef.current) return;
    closingRef.current = true;
    const pending = pendingWriteRef.current;
    if (pending === null) onClose();
    else void pending.then(onClose);
  }
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => service.getMovementLevels(movementId))
      .then(
        (levels) => {
          if (cancelled) return;
          setState(levels === null ? { kind: "error" } : { kind: "ready", levels });
        },
        (error: unknown) => {
          if (cancelled) return;
          console.error("Les niveaux du geste n'ont pas pu être chargés.", error);
          setState({ kind: "error" });
        },
      );
    return () => {
      cancelled = true;
    };
  }, [service, movementId, loadToken]);

  function move(from: number, to: number) {
    if (state.kind !== "ready" || savingRef.current || closingRef.current) return;
    const previous = state.levels;
    if (from === to || to < 0 || to >= previous.levels.length) return;
    const next = movedLevels(previous, from, to);
    setState({ kind: "ready", levels: next });
    setSaveError(false);
    savingRef.current = true;
    const restore = () => {
      if (!mountedRef.current) return;
      setState({ kind: "ready", levels: previous });
      setSaveError(true);
    };
    pendingWriteRef.current = service
      .reorderMovementLevels(
        movementId,
        next.levels.map((entry) => entry.movement.id),
      )
      .then(
        (result) => {
          if (result.status === "OK") {
            if (mountedRef.current) setState({ kind: "ready", levels: result.levels });
            return;
          }
          console.error("Les niveaux du geste n'ont pas pu être réordonnés.", result.status);
          restore();
        },
        (error: unknown) => {
          console.error("Les niveaux du geste n'ont pas pu être réordonnés.", error);
          restore();
        },
      )
      .finally(() => {
        savingRef.current = false;
        pendingWriteRef.current = null;
      });
  }

  return (
    <Modal
      visible
      // « Réduire les animations » : présentation sans glissement.
      animationType={reduceMotion ? "none" : "slide"}
      presentationStyle="fullScreen"
      onRequestClose={close}
    >
      <ScreenShell>
        <FixedHeader
          title={t.title}
          onBack={close}
          backAccessibilityLabel={t.closeAccessibilityLabel}
          closeIcon
          horizontalPadding={sideMargin}
          layoutStyle={{ paddingLeft: EDITOR_HEADER.paddingLeft, gap: EDITOR_HEADER.gap }}
          backCircleStyle={EDITOR_HEADER.backCircle}
          titleStyle={EDITOR_HEADER.title}
          backIconTintColor={EDITOR_HEADER.closeIconTint}
        />
        <SheetMotionProvider reduceMotion={reduceMotion}>
          {state.kind === "error" ? (
            <View style={[styles.loadErrorBody, { paddingHorizontal: sideMargin }]} testID="movement-levels-load-error">
              <Text style={styles.loadErrorMessage}>{t.loadError}</Text>
              <Pressable
                onPress={() => {
                  setState({ kind: "loading" });
                  setLoadToken((current) => current + 1);
                }}
                accessibilityRole="button"
                accessibilityLabel={t.retry}
                style={styles.loadErrorRetry}
                testID="movement-levels-load-retry"
              >
                <Text style={styles.loadErrorRetryLabel}>{t.retry}</Text>
              </Pressable>
            </View>
          ) : state.kind === "ready" ? (
            <LevelsTable levels={state.levels} onMove={move} saveError={saveError} sideMargin={sideMargin} />
          ) : null}
        </SheetMotionProvider>
      </ScreenShell>
    </Modal>
  );
}

const LEVEL_ROW_LABELS: DraggableRowLabels = {
  handle: strings.screens.activities.editor.levelOrder.handle,
  row: strings.screens.activities.editor.levelOrder.row,
  moveUp: strings.screens.activities.editor.levelOrder.moveUp,
  moveDown: strings.screens.activities.editor.levelOrder.moveDown,
};

function exerciseCountLabel(count: number): string | null {
  const t = strings.screens.activities.editor.movementSearch;
  if (count === 0) return null;
  return fillTemplate(count === 1 ? t.exerciseCountSingular : t.exerciseCountPlural, { n: String(count) });
}

function LevelsTable({
  levels,
  onMove,
  saveError,
  sideMargin,
}: {
  readonly levels: MovementLevels;
  readonly onMove: (from: number, to: number) => void;
  readonly saveError: boolean;
  readonly sideMargin: number;
}) {
  // Repère d'insertion et ligne soulevée pendant le glisser (patron de `WorkPhasesTable`).
  const [drag, setDrag] = useState<{ readonly from: number; readonly to: number } | null>(null);
  const [liftedId, setLiftedId] = useState<string | null>(null);
  const guideBefore = drag === null || drag.to === drag.from ? null : drag.to < drag.from ? drag.to : drag.to + 1;
  const count = levels.levels.length;
  const insertionGuide = (before: number) => <InsertionGuide testID={`movement-levels-insertion-guide-before-${before}`} />;
  return (
    <ScrollView
      // Pendant un glisser, la liste ne défile pas (le geste appartient à la poignée).
      scrollEnabled={drag === null}
      contentContainerStyle={[styles.content, { paddingHorizontal: sideMargin }]}
      testID="movement-levels-list"
    >
      {/* Cadres sans découpe (`appear={false}`) : la ligne portée suit le doigt hors de sa place. */}
      <SheetMotionView appear={false} style={tableStyles.block} testID="movement-levels-table">
        <SheetMotionGroupMount>
          {levels.levels.map((entry, index) => {
            const number = index + 1;
            const lifted = liftedId === entry.movement.id;
            const countLabel = exerciseCountLabel(entry.definitions.length);
            return (
              <Fragment key={entry.movement.id}>
                {guideBefore === index ? insertionGuide(number) : null}
                <SheetMotionView
                  appear={false}
                  // Les autres lignes se décalent ; la ligne saisie est portée par `DraggableRow`.
                  transition={lifted ? false : "row"}
                  raised={lifted}
                  testID={`${LEVEL_ROW_TEST_ID}-${number}-motion`}
                >
                  <DraggableRow
                    index={index}
                    count={count}
                    onMove={(to) => onMove(index, to)}
                    onDrag={setDrag}
                    onLiftedChange={(next) =>
                      setLiftedId((current) => (next ? entry.movement.id : current === entry.movement.id ? null : current))
                    }
                    labels={LEVEL_ROW_LABELS}
                    testIDPrefix={LEVEL_ROW_TEST_ID}
                  >
                    <Text style={styles.name} numberOfLines={1} testID={`${LEVEL_ROW_TEST_ID}-${number}-name`}>
                      {entry.movement.name}
                    </Text>
                    {countLabel === null ? null : (
                      <Text style={styles.count} numberOfLines={1} testID={`${LEVEL_ROW_TEST_ID}-${number}-count`}>
                        {countLabel}
                      </Text>
                    )}
                  </DraggableRow>
                </SheetMotionView>
              </Fragment>
            );
          })}
          {guideBefore === count ? insertionGuide(count + 1) : null}
        </SheetMotionGroupMount>
      </SheetMotionView>
      {saveError ? (
        <Text style={styles.saveError} accessibilityLiveRegion="polite" accessibilityRole="alert" testID="movement-levels-save-error">
          {strings.screens.activities.editor.levelOrder.saveError}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing[16],
    paddingBottom: spacing[24],
  },
  name: {
    ...type.exerciseFieldValue,
    flex: 1,
    color: colors.textPrimary,
    paddingRight: spacing[8],
  },
  count: {
    ...type.supporting,
    color: colors.textSecondary,
    paddingRight: TABLE_ROW_INSET,
  },
  saveError: {
    ...type.supporting,
    color: colors.danger,
    marginTop: spacing[8],
  },
  loadErrorBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[16],
  },
  loadErrorMessage: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  loadErrorRetry: {
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[12],
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  loadErrorRetryLabel: {
    ...type.button,
    color: colors.background,
  },
});
