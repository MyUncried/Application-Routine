import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { MovementCatalogueList } from "@/features/activities/MovementCatalogueList";
import { MovementFilterSheet } from "@/features/activities/MovementFilterSheet";
import { EMPTY_MOVEMENT_FILTERS, visibleMovementItems, type MovementCatalogueFilters } from "@/features/activities/movementCatalogueView";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { handMovementsToComposition, movementsInSession } from "@/features/sessions/movementExercises";
import { strings } from "@/shared/i18n";
import { CatalogueSearchField, FilterCommand } from "@/shared/ui/CatalogueCommands";
import { FINAL_ACTION_BUTTON_HEIGHT } from "@/shared/ui/finalAction";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { ContextBand, FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-9 A.2 (ARB-22a : « La sélection des Mouvements réutilise le parcours existant du Catalogue ;
 * les Mouvements choisis deviennent des Exercices configurés dans la Séance » ; Q6 ; D-449) —
 * « Utiliser un mouvement existant » depuis la Composition. Remplace, pour la Composition, la
 * sélection des anciennes définitions (`activity_definitions`), qui n'y est plus atteignable.
 *
 * Réutilise sans les recopier : la liste du Catalogue des Mouvements (`MovementCatalogueList`, en
 * mode sélection : piles, Niveaux, recherche, filtres, Mouvements actifs seuls), la recherche et la
 * commande Filtrer de la zone de contexte du Catalogue (`CatalogueCommands`, `MovementFilterSheet`),
 * la barre Annuler / Ajouter de l'ancienne sélection (zone d'action principale, D-444). Aucun
 * Mouvement n'est créé ni modifié.
 *
 * « Ajouter » relit le Catalogue : les Mouvements choisis, encore actifs, sont remis à la
 * Composition dans l'ordre de présentation du Catalogue (même règle que l'ancienne sélection :
 * jamais l'ordre des touchers, V2-CAT-01 plan §4.4) ; la Composition en fait des Exercices insérés
 * selon ARB-07, puis ouvre leurs paramètres (`useMovementExerciseIntake`).
 */
export function MovementSelectionScreen() {
  const router = useRouter();
  const actionZone = usePrimaryActionZone();
  const service = useActivityDefinitionService();
  const catalogue = useMemo(() => service.movementCatalogue, [service]);
  const tCatalogue = strings.screens.movement.catalogue;
  const tSelection = strings.screens.activities.selection;
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<MovementCatalogueFilters>(EMPTY_MOVEMENT_FILTERS);
  const [filterLabels, setFilterLabels] = useState<readonly string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selected, setSelected] = useState<ReadonlyMap<string, Movement>>(new Map());
  const [isAdding, setIsAdding] = useState(false);
  const [inSessionIds] = useState(movementsInSession);
  const addingRef = useRef(false);

  const filterSummary =
    filterLabels.length === 0
      ? null
      : filterLabels.length === 1
        ? filterLabels[0]!
        : fillTemplate(tCatalogue.filters.activeSummary, { count: String(filterLabels.length) });
  const selectedIds = useMemo(() => new Set(selected.keys()), [selected]);

  function toggle(movement: Movement) {
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(movement.id)) next.delete(movement.id);
      else next.set(movement.id, movement);
      return next;
    });
  }

  async function add() {
    if (addingRef.current || selected.size === 0 || catalogue === null) return;
    addingRef.current = true;
    setIsAdding(true);
    try {
      const entries = await catalogue.listEntries();
      // Ordre de présentation du Catalogue, sans recherche ni filtre ; Mouvements actifs seuls (Q6).
      const ordered = visibleMovementItems(entries, "", EMPTY_MOVEMENT_FILTERS)
        .flatMap((item) => (item.kind === "PILE" ? item.members : [item.entry]))
        .filter((entry) => !entry.archived && selected.has(entry.movement.id))
        .map((entry) => entry.movement);
      handMovementsToComposition(ordered);
      router.back();
    } catch (error) {
      console.error("Le catalogue des mouvements n'a pas pu être relu.", error);
      addingRef.current = false;
      setIsAdding(false);
    }
  }

  const count = selected.size;
  const addLabel =
    count > 0
      ? `${tSelection.addAction} ${count} ${count === 1 ? strings.screens.sessions.card.activitySingular : strings.screens.sessions.card.activityPlural}`
      : tSelection.addAction;

  return (
    <ScreenShell>
      <FixedHeader
        title={strings.screens.activities.addToSession.existingActivity}
        onBack={() => router.back()}
        backAccessibilityLabel={tSelection.backAccessibilityLabel}
      />
      <ContextBand>
        <View style={styles.commandRow} testID="movement-selection-command-row">
          <CatalogueSearchField
            value={query}
            onChangeText={setQuery}
            placeholder={tCatalogue.searchPlaceholder}
            accessibilityLabel={tCatalogue.searchAccessibilityLabel}
            clearLabel={tCatalogue.searchClear}
            testID="movement-selection-search"
          />
          <FilterCommand
            label={strings.screens.sessions.filterAction}
            title={tCatalogue.filters.command}
            summary={filterSummary}
            clearLabel={tCatalogue.filters.clearAccessibility}
            editLabel={tCatalogue.filters.editAccessibility}
            onOpen={() => setIsFilterOpen(true)}
            onClear={() => {
              setFilters(EMPTY_MOVEMENT_FILTERS);
              setFilterLabels([]);
            }}
            testID="movement-selection-filter"
          />
        </View>
      </ContextBand>

      <View style={styles.body} testID="movement-selection-body">
        <MovementCatalogueList
          reloadToken={0}
          query={query}
          filters={filters}
          onOpenMovement={() => undefined}
          onCreateVariant={() => undefined}
          selection={{ selectedIds, inSessionIds, onToggle: toggle, bottomInset: actionZone.scrollReserve }}
        />
      </View>

      <PrimaryActionZone
        onContentHeightChange={actionZone.onContentHeightChange}
        contentStyle={styles.bottomAction}
        testID="movement-selection-bottom-action"
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={tSelection.cancelAccessibilityLabel}
          style={styles.cancelAction}
          testID="movement-selection-cancel"
        >
          <Text style={styles.cancelLabel}>{tSelection.cancelAccessibilityLabel}</Text>
        </Pressable>
        <PrimaryActionButton
          label={addLabel}
          onPress={() => {
            void add();
          }}
          disabled={count === 0 || isAdding}
          style={styles.addAction}
          testID="movement-selection-add"
          labelTestID="movement-selection-add-label"
        />
      </PrimaryActionZone>

      {isFilterOpen ? (
        <MovementFilterSheet
          filters={filters}
          onApply={(next, labels) => {
            setFilters(next);
            setFilterLabels(labels);
            setIsFilterOpen(false);
          }}
          onClose={() => setIsFilterOpen(false)}
        />
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  commandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: dimensions.catalogueCommand.gap,
    marginTop: spacing[8],
  },
  body: {
    flex: 1,
  },
  bottomAction: {
    flexDirection: "row",
    gap: spacing[12],
  },
  cancelAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: FINAL_ACTION_BUTTON_HEIGHT,
    borderRadius: 24,
    backgroundColor: colors.dialogNeutralActionBackground,
  },
  cancelLabel: {
    ...type.button,
    color: colors.dialogNeutralActionText,
  },
  addAction: {
    flex: 1,
  },
});
