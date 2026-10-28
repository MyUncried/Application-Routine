import { useEffect, useState, type ReactNode } from "react";
import { Text, View } from "react-native";

import { listAssignableBodyZones, type BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import { useReferentialService } from "@/features/reference-data/ReferentialServiceContext";
import { strings } from "@/shared/i18n";

import { FilterChip, FilterSheetFrame, ResetFiltersButton, filterSheetStyles } from "./FilterSheetPrimitives";

import {
  EMPTY_MOVEMENT_FILTERS,
  type MovementCatalogueFilters,
  type MovementPresenceFilter,
  type MovementStatusFilter,
} from "./movementCatalogueView";

/**
 * PRE-8 (story B.7, Figma `10462:23370`) — feuille des filtres du Catalogue des Mouvements :
 * Statut, Niveaux, Utilisation, Catégories, Zones corporelles. Choix multiples dans chaque
 * groupe ; validation explicite par ✓ (ch06, « filtres = validation explicite »), ✕ ferme sans
 * rien appliquer, « Réinitialiser » vide le brouillon (comportement par défaut : Actifs).
 * Catégories et Zones : référentiels actifs, dans leur ordre. Aucune écriture : état d'interface,
 * conservé pendant la session par l'écran du Catalogue.
 *
 * Recette A/B du 27/10 :
 * - D07 : Zones corporelles = valeurs PROPOSÉES par le référentiel (`listAssignableBodyZones`, même
 *   règle que le sélecteur de la fiche), jamais une liste statique ; une Zone retirée n'est plus
 *   proposée (les Mouvements qui la portent la gardent) ;
 * - D06 : « Réinitialiser » selon `Action — Réinitialiser les filtres` (`10460:23176`) : 150 × 32,
 *   rayon 16, bordure bleue 1, icône 28 à gauche ;
 * - D05 : `onApply` transmet aussi les libellés des critères choisis (résumé de la commande).
 *
 * PRE-8 (epic E, E.6) : cadre, pastilles et « Réinitialiser » mutualisés avec le panneau des Séances
 * (`FilterSheetPrimitives`), à l'identique ; les critères et leurs règles restent propres aux Mouvements.
 */

const t = strings.screens.movement.catalogue.filters;

type Draft = {
  statuses: Set<MovementStatusFilter>;
  levels: Set<MovementPresenceFilter>;
  usage: Set<MovementPresenceFilter>;
  categoryIds: Set<string>;
  bodyZoneIds: Set<string>;
};

function draftOf(filters: MovementCatalogueFilters): Draft {
  return {
    statuses: new Set(filters.statuses),
    levels: new Set(filters.levels),
    usage: new Set(filters.usage),
    categoryIds: new Set(filters.categoryIds),
    bodyZoneIds: new Set(filters.bodyZoneIds),
  };
}

function toggled<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function MovementFilterSheet({
  filters,
  onApply,
  onClose,
}: {
  readonly filters: MovementCatalogueFilters;
  readonly onApply: (filters: MovementCatalogueFilters, labels: readonly string[]) => void;
  readonly onClose: () => void;
}) {
  const referentials = useReferentialService();
  const [draft, setDraft] = useState<Draft>(() => draftOf(filters));
  const [categories, setCategories] = useState<readonly Category[]>([]);
  const [bodyZones, setBodyZones] = useState<readonly BodyZone[]>([]);

  useEffect(() => {
    let cancelled = false;
    referentials.listCategories().then(
      (list) => {
        if (!cancelled) setCategories(list.filter((category) => category.isActive));
      },
      (error: unknown) => console.error("Les catégories n'ont pas pu être chargées.", error),
    );
    referentials.listBodyZones().then(
      (list) => {
        if (!cancelled) setBodyZones(listAssignableBodyZones(list));
      },
      (error: unknown) => console.error("Les zones corporelles n'ont pas pu être chargées.", error),
    );
    return () => {
      cancelled = true;
    };
  }, [referentials]);

  const toggle = <K extends keyof Draft>(key: K, value: Draft[K] extends Set<infer V> ? V : never) =>
    setDraft((current) => ({ ...current, [key]: toggled(current[key] as Set<unknown>, value) }));

  return (
    <FilterSheetFrame
      title={t.title}
      closeLabel={t.close}
      applyLabel={t.apply}
      onClose={onClose}
      onApply={() => onApply(draft, selectedLabels(draft, categories, bodyZones))}
      testIDPrefix="movement-filter"
    >
      <FilterGroup title={t.status}>
        <Chip label={t.active} selected={draft.statuses.has("ACTIVE")} onPress={() => toggle("statuses", "ACTIVE")} testID="movement-filter-status-active" />
        <Chip label={t.archivedValue} selected={draft.statuses.has("ARCHIVED")} onPress={() => toggle("statuses", "ARCHIVED")} testID="movement-filter-status-archived" />
      </FilterGroup>
      <FilterGroup title={t.levels}>
        <Chip label={t.withLevels} selected={draft.levels.has("WITH")} onPress={() => toggle("levels", "WITH")} testID="movement-filter-levels-with" />
        <Chip label={t.withoutLevel} selected={draft.levels.has("WITHOUT")} onPress={() => toggle("levels", "WITHOUT")} testID="movement-filter-levels-without" />
      </FilterGroup>
      <FilterGroup title={t.usage}>
        <Chip label={t.withExercise} selected={draft.usage.has("WITH")} onPress={() => toggle("usage", "WITH")} testID="movement-filter-usage-with" />
        <Chip label={t.withoutExercise} selected={draft.usage.has("WITHOUT")} onPress={() => toggle("usage", "WITHOUT")} testID="movement-filter-usage-without" />
      </FilterGroup>
      <FilterGroup title={t.categories}>
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            dotColor={category.color}
            selected={draft.categoryIds.has(category.id)}
            onPress={() => toggle("categoryIds", category.id)}
            testID={`movement-filter-category-${category.id}`}
          />
        ))}
      </FilterGroup>
      <FilterGroup title={t.bodyZones}>
        {bodyZones.map((zone) => (
          <Chip
            key={zone.id}
            label={zone.name}
            selected={draft.bodyZoneIds.has(zone.id)}
            onPress={() => toggle("bodyZoneIds", zone.id)}
            testID={`movement-filter-zone-${zone.id}`}
          />
        ))}
      </FilterGroup>
      <ResetFiltersButton label={t.reset} onPress={() => setDraft(draftOf(EMPTY_MOVEMENT_FILTERS))} testID="movement-filter-reset" />
    </FilterSheetFrame>
  );
}

/** D05 : libellés des valeurs choisies, dans l'ordre des groupes de la feuille. */
export function selectedLabels(
  draft: MovementCatalogueFilters,
  categories: readonly Category[],
  bodyZones: readonly BodyZone[],
): readonly string[] {
  const labels: string[] = [];
  if (draft.statuses.has("ACTIVE")) labels.push(t.active);
  if (draft.statuses.has("ARCHIVED")) labels.push(t.archivedValue);
  if (draft.levels.has("WITH")) labels.push(t.withLevels);
  if (draft.levels.has("WITHOUT")) labels.push(t.withoutLevel);
  if (draft.usage.has("WITH")) labels.push(t.withExercise);
  if (draft.usage.has("WITHOUT")) labels.push(t.withoutExercise);
  for (const category of categories) if (draft.categoryIds.has(category.id)) labels.push(category.name);
  for (const zone of bodyZones) if (draft.bodyZoneIds.has(zone.id)) labels.push(zone.name);
  return labels;
}

function FilterGroup({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <View style={filterSheetStyles.group}>
      <Text style={filterSheetStyles.groupTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={filterSheetStyles.chips}>{children}</View>
    </View>
  );
}

/** Pastille de la feuille : primitive partagée (`FilterChip`, E.6). */
const Chip = FilterChip;
