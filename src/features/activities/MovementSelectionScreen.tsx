import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { MovementCatalogueList } from "@/features/activities/MovementCatalogueList";
import { MovementCounterToggles } from "@/features/activities/MovementCounterToggles";
import { MovementFilterSheet } from "@/features/activities/MovementFilterSheet";
import {
  sameMovementSummary,
  toggledMovementCounter,
  type MovementCatalogueSummary,
  type MovementCounter,
} from "@/features/activities/movementCatalogueCounters";
import {
  countActiveFilters,
  EMPTY_MOVEMENT_FILTERS,
  visibleMovementItems,
  type MovementCatalogueFilters,
} from "@/features/activities/movementCatalogueView";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { handMovementsToComposition, movementsInSession } from "@/features/sessions/movementExercises";
import { strings } from "@/shared/i18n";
import { CONTEXT_ZONE_GEOMETRY, countLabel } from "@/shared/ui/catalogueContext";
import { FilterCommand } from "@/shared/ui/CatalogueCommands";
import { CatalogueContextZone } from "@/shared/ui/CatalogueContextZone";
import { FINAL_ACTION_BUTTON_HEIGHT } from "@/shared/ui/finalAction";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { ContextBand, FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-9 A.2 (ARB-22a : « La sélection des Mouvements réutilise le parcours existant du Catalogue ;
 * les Mouvements choisis deviennent des Exercices configurés dans la Séance » ; Q6 ; D-449) —
 * « Utiliser un mouvement existant » depuis la Composition. Remplace, pour la Composition, la
 * sélection des anciennes définitions (`activity_definitions`), qui n'y est plus atteignable.
 * [01/11/2026 — ordre de Hermann, ch13 CE-T03-08 « Menu Créer — état cible » : l'entrée « Utiliser un
 * mouvement existant » est retirée du menu Créer ; cet écran n'est plus atteint depuis la
 * Composition. Conservé sans suppression (aucune demande de retrait de l'écran).]
 * [Recette iPhone du 01/11/2026 (m11-menu, Hermann : « il faut intégrer de nouveau l'option du menu
 * « utiliser un mouvement existant » ») : entrée rétablie, 2e du menu Créer ; cet écran est de nouveau
 * atteint depuis la Composition.]
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
 *
 * Recette iPhone CAT.1 du 30/10/2026, constat a) (Hermann : « Réutiliser le contenu et format de la
 * zone de contexte du catalogue des mouvements, sans le bouton "Créer" ») : la bande reprend la zone
 * de contexte du Catalogue des Mouvements (`CatalogueContextZone`, mêmes marges) — « N familles ·
 * N mouvements » (mêmes compteurs activables), Rechercher, Filtre, Tri (indisponible, comme au
 * Catalogue), « N résultats » en état filtré — sans Créer. Les piles dont un Mouvement déjà utilisé
 * est masqué s'ouvrent dépliées (`MovementCatalogueList`, `pilesHidingIds`).
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
  const [counter, setCounter] = useState<MovementCounter | null>(null);
  const [summary, setSummary] = useState<MovementCatalogueSummary | null>(null);
  const handleSummary = useCallback((next: MovementCatalogueSummary | null) => {
    setSummary((current) => (sameMovementSummary(current, next) ? current : next));
  }, []);
  const tContext = strings.screens.catalogueContext;
  const results =
    countActiveFilters(filters) === 0
      ? null
      : summary !== null
        ? countLabel(summary.displayed, { one: tContext.resultsOne, many: tContext.resultsMany })
        : "";
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
      <ContextBand padding={{ top: CONTEXT_ZONE_GEOMETRY.paddingTop, bottom: CONTEXT_ZONE_GEOMETRY.paddingBottom }}>
        <CatalogueContextZone
          summary={
            summary !== null ? (
              <MovementCounterToggles
                summary={summary}
                active={counter}
                onToggle={(touched) => setCounter((current) => toggledMovementCounter(current, touched))}
            />
            ) : null
          }
          results={results}
          search={{
            value: query,
            onChangeText: setQuery,
            placeholder: tCatalogue.searchPlaceholder,
            accessibilityLabel: tCatalogue.searchAccessibilityLabel,
            clearLabel: tCatalogue.searchClear,
            testID: "movement-selection-search",
          }}
          sortLabel={strings.screens.sessions.sortAction}
          filter={
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
          }
        />
      </ContextBand>

      <View style={styles.body} testID="movement-selection-body">
        <MovementCatalogueList
          reloadToken={0}
          query={query}
          filters={filters}
          counter={counter}
          onSummaryChange={handleSummary}
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
