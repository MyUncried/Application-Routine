import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { isBilateral } from "@/domain/activities/ExecutionParameters";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import type { Activity } from "@/domain/sessions/Session";
import type { CatalogueSessionRecord } from "@/domain/sessions/SessionRepository";
import { structureExercises } from "@/domain/sessions/structure";
import { firstMediaPreviewSource } from "@/features/activities/MediaPreview";
import { OccurrenceRecovery } from "@/features/sessions/ActivityRecoveryLine";
import {
  formatExerciseBodyZones,
  formatOccurrenceSummary,
  resolveOccurrenceCategory,
} from "@/features/sessions/compositionPresentation";
import { OCCURRENCE_CARD_HEIGHT, OccurrenceCard, occurrenceCardSurface } from "@/features/sessions/OccurrenceCard";
import { projectSessionTree } from "@/features/sessions/sessionCatalogueProjection";
import { treeLineLabel } from "@/features/sessions/SessionCompositionTree";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { strings } from "@/shared/i18n";
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * Recette E du 28/10/2026 (Hermann, e5-12 : « Composition en lecture seule ») — une Séance archivée,
 * touchée dans le Catalogue, s'ouvre en CONSULTATION : son nom, puis sa composition dans l'ordre
 * (conteneurs Cycle / Circuit affichés selon la règle de la carte déployée, E.3), chaque Exercice
 * par la carte d'occurrence de la Composition (`OccurrenceCard`), récupérations comprises. Aucun
 * contrôle de modification, aucun geste, aucune écriture ; retour au Catalogue par l'en-tête.
 * Lecture de la structure générale (`findCatalogue`) : aucune limite de l'ancien modèle (R-E6).
 */

const t = strings.screens.composition.consultation;

type ConsultationState =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly record: CatalogueSessionRecord }
  | { readonly kind: "unavailable" };

export function ArchivedSessionConsultation({
  sessionId,
  categories,
  bodyZones,
  onBack,
}: {
  readonly sessionId: string;
  readonly categories: readonly Category[];
  readonly bodyZones: readonly BodyZone[];
  readonly onBack: () => void;
}) {
  const sessionService = useContext(SessionServiceContext);
  const [loaded, setLoaded] = useState<ConsultationState>({ kind: "loading" });
  // Sans service (hors fournisseur), la Séance ne peut pas être lue.
  const state: ConsultationState = sessionService ? loaded : { kind: "unavailable" };

  useEffect(() => {
    if (!sessionService) return;
    let cancelled = false;
    sessionService.getSessionForConsultation(sessionId).then(
      (record) => {
        if (!cancelled) setLoaded(record ? { kind: "ready", record } : { kind: "unavailable" });
      },
      () => {
        if (!cancelled) setLoaded({ kind: "unavailable" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [sessionService, sessionId]);

  return (
    <ScreenShell>
      <FixedHeader
        title={strings.screens.composition.title}
        onBack={onBack}
        backAccessibilityLabel={strings.screens.composition.backAccessibilityLabel}
      />
      <HeaderSeparator />
      {state.kind === "loading" ? (
        <View style={styles.centered} testID="archived-consultation-loading">
          <ActivityIndicator
            size="large"
            color={colors.primary}
            accessibilityLabel={strings.screens.composition.editStates.loadingAccessibilityLabel}
          />
        </View>
      ) : state.kind === "unavailable" ? (
        <View style={styles.centered} testID="archived-consultation-unavailable">
          <Text style={styles.message}>{strings.screens.composition.editStates.errorMessage}</Text>
        </View>
      ) : (
        <ConsultationBody record={state.record} categories={categories} bodyZones={bodyZones} />
      )}
    </ScreenShell>
  );
}

function ConsultationBody({
  record,
  categories,
  bodyZones,
}: {
  readonly record: CatalogueSessionRecord;
  readonly categories: readonly Category[];
  readonly bodyZones: readonly BodyZone[];
}) {
  const activities = new Map<string, Activity>(structureExercises(record.structure).map((activity) => [activity.id, activity]));
  const lines = projectSessionTree(record);
  return (
    <ScrollView contentContainerStyle={styles.body} testID="archived-consultation">
      <View style={styles.notice} testID="archived-consultation-notice">
        <Text style={styles.noticeText}>{t.notice}</Text>
      </View>
      <Text style={styles.name} accessibilityRole="header" testID="archived-consultation-name">
        {record.name}
      </Text>
      {lines.length === 0 ? <Text style={styles.message}>{t.empty}</Text> : null}
      {lines.map((line) => {
        const indent = { marginLeft: spacing[16] * line.depth };
        if (line.kind === "CYCLE" || line.kind === "CIRCUIT") {
          return (
            <Text key={line.key} style={[styles.container, indent]} testID={`archived-consultation-container-${line.key}`}>
              {treeLineLabel(line).name}
            </Text>
          );
        }
        if (line.kind === "RECOVERY") {
          // Récupération après un Exercice : portée par sa carte (ligne 3) ; seule une ancienne
          // Récupération autonome a sa propre ligne.
          if (line.key.endsWith(":recovery")) return null;
          const { name, value } = treeLineLabel(line);
          return (
            <Text key={line.key} style={[styles.recovery, indent]} testID={`archived-consultation-recovery-${line.key}`}>
              {value === null ? name : `${name} ${value}`}
            </Text>
          );
        }
        const activity = activities.get(line.key);
        if (!activity) return null;
        const summary = formatOccurrenceSummary({ executionParameters: activity.executionParameters });
        return (
          <View
            key={line.key}
            style={[styles.card, indent]}
            accessible
            accessibilityLabel={`${activity.name}, ${summary}`}
            testID={`archived-consultation-exercise-${activity.id}`}
          >
            <OccurrenceCard
              name={activity.name}
              category={resolveOccurrenceCategory(activity.categoryId, categories)}
              bodyZones={formatExerciseBodyZones(activity.bodyZoneIds, bodyZones)}
              summary={summary}
              estimatedDuration={null}
              hasSideChange={isBilateral(activity.sideMode ?? null)}
              bordered
              recovery={<OccurrenceRecovery recoverySeconds={activity.postActivityRecoverySeconds} />}
              media={firstMediaPreviewSource(activity.media)}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[24],
  },
  message: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  body: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
    paddingBottom: spacing[32],
    gap: spacing[8],
  },
  notice: {
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[10],
  },
  noticeText: {
    ...type.supporting,
    color: colors.textSecondary,
  },
  name: {
    ...type.listCardTitle,
    lineHeight: undefined,
    fontSize: 20,
    color: colors.textPrimary,
    marginTop: spacing[8],
    marginBottom: spacing[4],
  },
  container: {
    ...type.supporting,
    color: colors.catalogueSessionMuted,
    marginTop: spacing[4],
  },
  recovery: {
    ...type.supporting,
    color: colors.catalogueSessionMuted,
  },
  card: {
    ...occurrenceCardSurface,
    minHeight: OCCURRENCE_CARD_HEIGHT,
    overflow: "hidden",
  },
});
