import { Image } from "expo-image";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { listAssignableBodyZones, type BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import type { Label } from "@/domain/labels/Label";
import { FilterChip, FilterSheetFrame, ResetFiltersButton, filterSheetStyles } from "@/features/activities/FilterSheetPrimitives";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { useReferentialService } from "@/features/reference-data/ReferentialServiceContext";
import { strings } from "@/shared/i18n";
import { colors, fixedRadii, spacing } from "@/shared/ui/tokens";

import {
  EMPTY_SESSION_FILTERS,
  initiallyOpenSections,
  type SessionCatalogueFilters,
  type SessionFilterSection,
  type SessionStatusFilter,
} from "./sessionCatalogueFilters";
import { SESSION_FORMATS, type SessionFormatKey } from "./sessionFormats";

/**
 * PRE-8 (epic E, story E.6 ; spécification du 27/10 §6 ; Figma `4168:11149`) — panneau de filtres du
 * segment Séances, au cadre standard des feuilles (B.11, `FilterSheetFrame`).
 *
 * - Sections, dans l'ordre : Statut des séances (ligne compacte, pastilles à droite du titre),
 *   Catégories, Zones corporelles, Étiquettes, Format ; chevron accolé au titre, le titre étant le
 *   bouton qui ouvre ou ferme la section placée dessous.
 * - À l'ouverture : sections portant un filtre ouvertes, les autres repliées ; sans filtre, Statut
 *   seul (règle dynamique, l'état illustratif de Figma n'est pas figé).
 * - Réinitialiser fixé en pied, hors défilement ; ✓ applique, ✕ ferme sans appliquer.
 * - Format (Q-E5, option A) : les vignettes de Figma ; Libre seul sélectionnable, les autres visibles,
 *   désactivées et annoncées indisponibles. Aucun format simulé.
 * - Référentiels : Catégories et Étiquettes actives, Zones proposées (`listAssignableBodyZones`), dans
 *   leur ordre ; aucune écriture.
 */

const t = strings.screens.sessions.catalogueFilters;

type Draft = {
  statuses: Set<SessionStatusFilter>;
  categoryIds: Set<string>;
  bodyZoneIds: Set<string>;
  labelIds: Set<string>;
  formats: Set<SessionFormatKey>;
};

function draftOf(filters: SessionCatalogueFilters): Draft {
  return {
    statuses: new Set(filters.statuses),
    categoryIds: new Set(filters.categoryIds),
    bodyZoneIds: new Set(filters.bodyZoneIds),
    labelIds: new Set(filters.labelIds),
    formats: new Set(filters.formats),
  };
}

function toggled<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

/** Libellés des valeurs choisies, dans l'ordre des sections (résumé de la commande étendue). */
export function selectedSessionFilterLabels(
  draft: SessionCatalogueFilters,
  categories: readonly Pick<Category, "id" | "name">[],
  bodyZones: readonly Pick<BodyZone, "id" | "name">[],
  labels: readonly Pick<Label, "id" | "name">[],
): readonly string[] {
  const result: string[] = [];
  if (draft.statuses.has("ACTIVE")) result.push(t.active);
  if (draft.statuses.has("ARCHIVED")) result.push(t.archived);
  for (const category of categories) if (draft.categoryIds.has(category.id)) result.push(category.name);
  for (const zone of bodyZones) if (draft.bodyZoneIds.has(zone.id)) result.push(zone.name);
  for (const label of labels) if (draft.labelIds.has(label.id)) result.push(label.name);
  for (const format of SESSION_FORMATS) if (draft.formats.has(format.key)) result.push(format.label);
  return result;
}

export function SessionFilterSheet({
  filters,
  onApply,
  onClose,
}: {
  readonly filters: SessionCatalogueFilters;
  readonly onApply: (filters: SessionCatalogueFilters, labels: readonly string[]) => void;
  readonly onClose: () => void;
}) {
  const referentials = useReferentialService();
  const [draft, setDraft] = useState<Draft>(() => draftOf(filters));
  const [open, setOpen] = useState<ReadonlySet<SessionFilterSection>>(() => initiallyOpenSections(filters));
  const [categories, setCategories] = useState<readonly Category[]>([]);
  const [bodyZones, setBodyZones] = useState<readonly BodyZone[]>([]);
  const [labels, setLabels] = useState<readonly Label[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = <T,>(read: () => Promise<readonly T[]>, keep: (list: readonly T[]) => readonly T[], set: (list: readonly T[]) => void, what: string) =>
      read().then(
        (list) => {
          if (!cancelled) set(keep(list));
        },
        (error: unknown) => console.error(`${what} n'ont pas pu être chargées.`, error),
      );
    load(() => referentials.listCategories(), (list) => list.filter((category) => category.isActive), setCategories, "Les catégories");
    load(() => referentials.listBodyZones(), listAssignableBodyZones, setBodyZones, "Les zones corporelles");
    load(() => referentials.listLabels(), (list) => list.filter((label) => label.isActive), setLabels, "Les étiquettes");
    return () => {
      cancelled = true;
    };
  }, [referentials]);

  const toggle = <K extends keyof Draft>(key: K, value: Draft[K] extends Set<infer V> ? V : never) =>
    setDraft((current) => ({ ...current, [key]: toggled(current[key] as Set<unknown>, value) }));
  const toggleSection = (section: SessionFilterSection) => setOpen((current) => toggled(current, section));

  return (
    <FilterSheetFrame
      title={t.title}
      closeLabel={t.close}
      applyLabel={t.apply}
      onClose={onClose}
      onApply={() => onApply(draft, selectedSessionFilterLabels(draft, categories, bodyZones, labels))}
      testIDPrefix="session-filter"
      footer={<ResetFiltersButton label={t.reset} onPress={() => setDraft(draftOf(EMPTY_SESSION_FILTERS))} testID="session-filter-reset" />}
    >
      {/* Statut : format compact, pastilles à droite du titre, sur la même ligne (4549:6533, 4549:6534). */}
      <View style={styles.compactSection} testID="session-filter-section-STATUS">
        <Text style={[filterSheetStyles.groupTitle, styles.compactTitle]} accessibilityRole="header">
          {t.status}
        </Text>
        <View style={styles.compactChips}>
          <FilterChip label={t.active} selected={draft.statuses.has("ACTIVE")} onPress={() => toggle("statuses", "ACTIVE")} testID="session-filter-status-active" />
          <FilterChip label={t.archived} selected={draft.statuses.has("ARCHIVED")} onPress={() => toggle("statuses", "ARCHIVED")} testID="session-filter-status-archived" />
        </View>
      </View>
      <Section section="CATEGORIES" title={t.categories} open={open.has("CATEGORIES")} onToggle={toggleSection}>
        {categories.map((category) => (
          <FilterChip
            key={category.id}
            label={category.name}
            dotColor={category.color}
            selected={draft.categoryIds.has(category.id)}
            onPress={() => toggle("categoryIds", category.id)}
            testID={`session-filter-category-${category.id}`}
          />
        ))}
      </Section>
      <Section section="BODY_ZONES" title={t.bodyZones} open={open.has("BODY_ZONES")} onToggle={toggleSection}>
        {bodyZones.map((zone) => (
          <FilterChip
            key={zone.id}
            label={zone.name}
            selected={draft.bodyZoneIds.has(zone.id)}
            onPress={() => toggle("bodyZoneIds", zone.id)}
            testID={`session-filter-zone-${zone.id}`}
          />
        ))}
      </Section>
      <Section section="LABELS" title={t.labels} open={open.has("LABELS")} onToggle={toggleSection}>
        {labels.map((label) => (
          <FilterChip
            key={label.id}
            label={label.name}
            dotColor={label.color}
            selected={draft.labelIds.has(label.id)}
            onPress={() => toggle("labelIds", label.id)}
            testID={`session-filter-label-${label.id}`}
          />
        ))}
      </Section>
      <Section section="FORMAT" title={t.format} open={open.has("FORMAT")} onToggle={toggleSection} grid>
        {SESSION_FORMATS.map((format) => {
          const selected = draft.formats.has(format.key);
          return (
            <Pressable
              key={format.key}
              onPress={() => toggle("formats", format.key)}
              disabled={!format.available}
              accessibilityRole="checkbox"
              accessibilityLabel={format.available ? format.label : fillTemplate(t.formatUnavailable, { name: format.label })}
              accessibilityState={{ checked: selected, disabled: !format.available }}
              style={[styles.format, selected ? styles.formatSelected : null, !format.available ? styles.formatDisabled : null]}
              testID={`session-filter-format-${format.key}`}
            >
              <Image source={format.thumbnail} style={styles.formatImage} accessible={false} />
            </Pressable>
          );
        })}
      </Section>
    </FilterSheetFrame>
  );
}

const CHEVRON_ICON = require("../../../assets/icons/filtre-chevron-modifier.svg");

/** Section repliable : le titre est le bouton, chevron accolé au titre (spécification §6). */
function Section({
  section,
  title,
  open,
  onToggle,
  grid = false,
  children,
}: {
  readonly section: SessionFilterSection;
  readonly title: string;
  readonly open: boolean;
  readonly onToggle: (section: SessionFilterSection) => void;
  readonly grid?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <View style={filterSheetStyles.group} testID={`session-filter-section-${section}`}>
      <Pressable
        onPress={() => onToggle(section)}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        hitSlop={{ top: 12, bottom: 12 }}
        style={styles.sectionHeader}
        testID={`session-filter-section-${section}-toggle`}
      >
        <Text style={filterSheetStyles.groupTitle}>{title}</Text>
        <Image source={CHEVRON_ICON} style={[styles.chevron, open ? styles.chevronOpen : null]} accessible={false} />
      </Pressable>
      {open ? <View style={grid ? styles.formatGrid : filterSheetStyles.chips}>{children}</View> : null}
    </View>
  );
}

const FORMAT_SIZE = 64;

const styles = StyleSheet.create({
  compactSection: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing[8],
    minHeight: 44,
  },
  compactTitle: {
    flexGrow: 1,
  },
  compactChips: {
    flexDirection: "row",
    gap: spacing[8],
  },
  sectionHeader: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
  },
  // Chevron accolé, pointé vers le bas fermé, vers le haut ouvert (`10671:20036`).
  chevron: {
    width: 10,
    height: 5.75,
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  formatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 32,
    rowGap: spacing[12],
  },
  format: {
    width: FORMAT_SIZE,
    height: FORMAT_SIZE,
    borderRadius: fixedRadii[6],
    overflow: "hidden",
  },
  formatSelected: {
    borderWidth: 3,
    borderColor: colors.selection,
  },
  formatDisabled: {
    opacity: 0.4,
  },
  formatImage: {
    width: "100%",
    height: "100%",
  },
});
