import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { requestFilterSheet } from "@/features/activities/filterSheetRelay";
import { planningStrings } from "@/features/planning/planningStrings";
import { SessionCard } from "@/features/sessions/SessionCard";
import { sessionCardAccessibilityLabel } from "@/features/sessions/SessionCatalogueList";
import { isSessionCatalogueFiltered, sessionCatalogueContext } from "@/features/sessions/sessionCatalogueContext";
import { EMPTY_SESSION_FILTERS, type SessionCatalogueFilters } from "@/features/sessions/sessionCatalogueFilters";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { toggledView, type SessionCatalogueView } from "@/features/sessions/sessionCatalogueView";
import { SessionCommandRow } from "@/features/sessions/SessionCommandRow";
import { strings } from "@/shared/i18n";
import { catalogueColors, CONTEXT_ZONE_GEOMETRY, countLabel } from "@/shared/ui/catalogueContext";
import { ContextBand, FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { SheetFixedTop } from "@/shared/ui/SheetFixedTop";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";

/**
 * « Catalogue des séances » ouvert depuis la planification (CE-UI-04 ; Figma `7599:14197` une séance, `7594:34809`
 * plusieurs ; KODJO-Catalogues-cartes-modales du 06/11 : la coche « Valide la sélection » ; D-499).
 * Zone de contexte du Catalogue (compteurs Un exercice / Plusieurs, Rechercher, Filtre, Tri ; sans Créer), cartes de
 * Séance partagées en contexte `planning` (sans Démarrer, D-506). D-449 : Séances seules.
 * CE-UI-04 : cases à cocher même pour une seule séance ; toucher une carte bascule sa case sans fermer ; ✕ conserve
 * la sélection d'entrée ; coche inactive tant qu'aucune séance n'est cochée. Aucune écriture.
 * [Figma ne représente pas l'état coché ; la case suit CE-UI-04 §8.]
 */
export function PlanningSelection({
  sessions,
  loading,
  failed,
  initial,
  onCancel,
  onValidate,
}: {
  readonly sessions: readonly SessionCatalogueProjection[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly initial: readonly string[];
  readonly onCancel: () => void;
  readonly onValidate: (selected: readonly string[]) => void;
}) {
  const t = planningStrings.selection;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = catalogueColors("sessions");
  const [selected, setSelected] = useState<readonly string[]>(() => initial);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<SessionCatalogueView | null>(null);
  const [filters, setFilters] = useState<SessionCatalogueFilters>(EMPTY_SESSION_FILTERS);
  const [filterLabels, setFilterLabels] = useState<readonly string[]>([]);
  const context = useMemo(() => sessionCatalogueContext(sessions, { query, filters, view }), [sessions, query, filters, view]);
  const available = selected.filter((id) => sessions.some((session) => session.id === id));
  const toggle = (id: string) => setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  const tContext = strings.screens.catalogueContext;
  const tSessions = strings.screens.sessions;
  const filterSummary =
    filterLabels.length === 0
      ? null
      : filterLabels.length === 1
        ? filterLabels[0]!
        : fillTemplate(tSessions.catalogueFilters.activeSummary, { count: String(filterLabels.length) });

  return (
    <ScreenShell backgroundColor={palette.background}>
      {/* Feuille native : haut fixe posé sur la liste (`SheetFixedTop`, recette du 18/11/2026). */}
      <SheetFixedTop
        top={
          <>
            <View style={{ backgroundColor: palette.background }}>
              <FixedHeader
                title={t.title}
                closeIcon
                topInset={0}
                onBack={onCancel}
                backAccessibilityLabel={t.cancel}
                validate={{ onPress: () => available.length > 0 && onValidate(available), enabled: available.length > 0, accessibilityLabel: t.validate }}
              />
            </View>
            <ContextBand fadeToTransparent color={palette.context} padding={{ top: CONTEXT_ZONE_GEOMETRY.paddingTop, bottom: CONTEXT_ZONE_GEOMETRY.paddingBottom }}>
              <SessionCommandRow
                view={view}
                onToggleView={(touched) => setView((current) => toggledView(current, touched))}
                counts={loading ? null : { SINGLE: context.singleCount, MULTIPLE: context.multipleCount }}
                results={isSessionCatalogueFiltered(filters) ? countLabel(context.visible.length, { one: tContext.resultsOne, many: tContext.resultsMany }) : null}
                query={query}
                onChangeQuery={setQuery}
                filterSummary={filterSummary}
                filterCount={filterLabels.length === 0 ? null : String(filterLabels.length)}
                onOpenFilters={() => {
                  requestFilterSheet({
                    kind: "sessions",
                    filters,
                    onApply: (next, labels) => {
                      setFilters(next);
                      setFilterLabels(labels);
                    },
                  });
                  router.push("/catalogue-filters");
                }}
                onResetFilters={() => {
                  setFilters(EMPTY_SESSION_FILTERS);
                  setFilterLabels([]);
                }}
              />
            </ContextBand>
          </>
        }
        renderScroll={(topHeight) => (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.list, { paddingTop: topHeight + spacing[16], paddingBottom: insets.bottom + spacing[24] }]}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            testID="planning-selection-list"
          >
            {loading ? <ActivityIndicator color={colors.primary} /> : null}
            {failed ? <Text style={styles.message}>{t.loadError}</Text> : null}
            {!loading && !failed && sessions.length === 0 ? (
              <Text style={styles.message} testID="planning-selection-empty">
                {t.empty}
              </Text>
            ) : null}
            {context.visible.map((projection) => {
              const order = selected.indexOf(projection.id) + 1;
              const checked = order > 0;
              return (
                <Pressable
                  key={projection.id}
                  onPress={() => toggle(projection.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  accessibilityLabel={`${sessionCardAccessibilityLabel(projection)}, ${checked ? t.checked : t.unchecked}`}
                  style={styles.item}
                  testID={`planning-selection-${projection.id}`}
                >
                  <View pointerEvents="none">
                    <SessionCard projection={projection} context="planning" />
                  </View>
                  <View style={[styles.check, checked ? styles.checkOn : null]} pointerEvents="none" testID={`planning-selection-${projection.id}-${checked ? "checked" : "unchecked"}`}>
                    {checked ? <Text style={styles.checkOrder}>{order}</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      />
    </ScreenShell>
  );
}

const CHECK = 24;
/** En-tête replié de la carte de Séance (D-504 : 72). */
const CARD_HEADER_HEIGHT = 72;

const styles = StyleSheet.create({
  // Feuille native : liste sur toute la hauteur, décalée sous le haut fixe (recette du 18/11/2026).
  // [marginTop -CONTEXT_BAND_FADE_HEIGHT et paddingTop fixe — remplacés.]
  scroll: { flex: 1 },
  list: { paddingHorizontal: layout.screenGutter, gap: spacing[12] },
  item: { position: "relative" },
  // Recette du 17/11/2026 (Hermann : « la coche de sélection doit être centrée verticalement sur la carte » ; « doit être
  // ronde, sélectionnée elle a un fond bleu et un chiffre blanc à l'intérieur qui représente l'ordre de sélection des
  // séances et de leur planification ») : case ronde, centrée sur l'en-tête de 72 de la carte. [Case carrée en bas à
  // droite, coche `state-selected` — remplacée.]
  check: {
    position: "absolute",
    right: spacing[12],
    top: (CARD_HEADER_HEIGHT - CHECK) / 2,
    width: CHECK,
    height: CHECK,
    borderRadius: CHECK / 2,
    borderWidth: 1.5,
    borderColor: colors.cardsBorder,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkOrder: { ...type.label, color: colors.background },
  message: { ...type.body, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing[24] },
});
