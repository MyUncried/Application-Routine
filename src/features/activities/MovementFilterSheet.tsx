import { Image } from "expo-image";
import { useEffect, useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { listAssignableBodyZones, type BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import { useReferentialService } from "@/features/reference-data/ReferentialServiceContext";
import { strings } from "@/shared/i18n";
import { colors, dimensions, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

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
  const insets = useSafeAreaInsets();
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
    <Modal transparent visible animationType="slide" onRequestClose={onClose} testID="movement-filter-sheet">
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[16] }]}>
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.close}
              style={styles.headerButton}
              testID="movement-filter-close"
            >
              <Text style={styles.closeGlyph}>✕</Text>
            </Pressable>
            <Text style={styles.title} accessibilityRole="header">
              {t.title}
            </Text>
            <Pressable
              onPress={() => onApply(draft, selectedLabels(draft, categories, bodyZones))}
              accessibilityRole="button"
              accessibilityLabel={t.apply}
              style={[styles.headerButton, styles.applyButton]}
              testID="movement-filter-apply"
            >
              <Text style={styles.applyGlyph}>✓</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body}>
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
            <Pressable
              onPress={() => setDraft(draftOf(EMPTY_MOVEMENT_FILTERS))}
              accessibilityRole="button"
              accessibilityLabel={t.reset}
              hitSlop={{ top: (minTouchTarget - RESET.height) / 2, bottom: (minTouchTarget - RESET.height) / 2 }}
              style={styles.reset}
              testID="movement-filter-reset"
            >
              <Image source={RESET_ICON} style={styles.resetIcon} accessible={false} testID="movement-filter-reset-icon" />
              <Text style={styles.resetLabel}>{t.reset}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
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

const RESET = dimensions.resetAction;
const RESET_ICON = require("../../../assets/icons/filtre-reinitialiser.svg");

function FilterGroup({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function Chip({
  label,
  selected,
  dotColor,
  onPress,
  testID,
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly dotColor?: string;
  readonly onPress: () => void;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      hitSlop={{ top: 6, bottom: 6 }}
      style={[styles.chip, selected ? styles.chipSelected : null]}
      testID={testID}
    >
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(20, 20, 20, 0.32)",
  },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: fixedRadii[24],
    borderTopRightRadius: fixedRadii[24],
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: minTouchTarget / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  applyButton: {
    backgroundColor: colors.primary,
  },
  closeGlyph: {
    ...type.sectionTitle,
    color: colors.textPrimary,
  },
  applyGlyph: {
    ...type.sectionTitle,
    color: colors.background,
  },
  title: {
    ...type.sectionTitle,
    color: colors.textPrimary,
  },
  body: {
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
    gap: spacing[16],
  },
  group: {
    gap: spacing[12],
  },
  groupTitle: {
    ...type.sectionTitle,
    color: colors.textPrimary,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[8],
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
    minHeight: 32,
    paddingHorizontal: spacing[12],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  chipSelected: {
    borderColor: colors.selection,
    backgroundColor: colors.selectionSurface,
  },
  chipLabel: {
    ...type.supporting,
    color: colors.textPrimary,
  },
  chipLabelSelected: {
    color: colors.selection,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  reset: {
    alignSelf: "center",
    width: RESET.width,
    height: RESET.height,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[8],
    borderRadius: RESET.radius,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  resetIcon: {
    position: "absolute",
    left: RESET.iconLeft,
    width: RESET.icon,
    height: RESET.icon,
  },
  resetLabel: {
    ...type.resetActionLabel,
    color: colors.primary,
    marginLeft: RESET.icon,
  },
});
