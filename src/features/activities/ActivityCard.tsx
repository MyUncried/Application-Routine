import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ActivityDefinition } from "@/domain/activities";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import {
  formatExerciseBodyZones,
  formatExerciseRowSummary,
} from "@/features/sessions/compositionPresentation";
import { ExpoDatabase } from "@/infrastructure/database/ExpoDatabase";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { strings } from "@/shared/i18n";
import { DisclosureControl } from "@/shared/ui/DisclosureControl";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * Référentiel persistant des Zones corporelles (V2-PRE-1, plan §3.1,
 * UI-07F470FC189F) — `ActivityCard` est rendue par `ActivityCatalogueList.tsx`
 * (hors périmètre d'adaptation de PRE-1, cf. plan, classification
 * `TEST_UNAFFECTED` de son test), qui ne peut donc pas lui transmettre les
 * Zones en prop : la carte s'auto-alimente via `useSQLiteContext` (même
 * connexion native que `SessionServiceProvider`), à l'identique du mécanisme
 * déjà établi pour les Catégories (`ExerciseScreen.listCategories`). Jamais
 * `BODY_ZONES` : ce module statique n'est plus l'autorité runtime, y compris
 * en repli (revue indépendante 5928437619) — hors de tout `<SQLiteProvider>`
 * ancêtre (uniquement des suites de test qui n'exercent pas les Zones, jamais
 * l'application réelle, qui monte toujours `SessionServiceProvider`/
 * `SQLiteProvider` à la racine), la carte dégrade vers un référentiel VIDE,
 * jamais une valeur statique de substitution.
 *
 * `useSQLiteContext` lève hors de tout `<SQLiteProvider>` ancêtre — capturée
 * ici plutôt que de laisser la carte entière s'effondrer. Le Hook sous-jacent
 * (`useContext`) est TOUJOURS invoqué, dans le même ordre, à chaque rendu —
 * seul le THROW explicite de `useSQLiteContext` (une vérification
 * postérieure à la lecture du contexte, pas un appel de Hook conditionnel)
 * est intercepté ; la règle statique `rules-of-hooks` ne peut pas le
 * démontrer et doit donc être désactivée ponctuellement ici.
 */
function useBodyZonesReferential(): readonly BodyZone[] {
  let nativeDatabase: ReturnType<typeof useSQLiteContext> | null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- voir le docstring ci-dessus.
    nativeDatabase = useSQLiteContext();
  } catch {
    nativeDatabase = null;
  }
  const repository = useMemo(
    () => (nativeDatabase ? new SqliteBodyZoneRepository(new ExpoDatabase(nativeDatabase)) : null),
    [nativeDatabase],
  );
  const [zones, setZones] = useState<readonly BodyZone[]>([]);
  useEffect(() => {
    if (!repository) {
      return;
    }
    let cancelled = false;
    repository.listAll().then(
      (result) => {
        if (!cancelled) {
          setZones(result);
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error("Impossible de charger les Zones corporelles.", error);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [repository]);
  return zones;
}

export type ActivityCardProps = {
  definition: ActivityDefinition;
  /** Ouvre l'édition de la définition — surface principale de la carte (plan §4.1). */
  onOpen?: () => void;
};

/**
 * Carte condensée d'une `ActivityDefinition` (V2-CAT-01, UI-CAT-R-002) —
 * même anatomie que `SessionCard` (bordure/rayon `standardCard`,
 * `DisclosureControl` partagé) avec une marque de couleur FIXE
 * (`colors.primary`, une `ActivityDefinition` ne porte pas de couleur
 * propre — à la différence d'une Séance). Affiche le nom dynamique, les
 * Zones corporelles, le mode et la cible, et les Séries/Pause — mêmes
 * fonctions de présentation déjà éprouvées par la carte Activité de
 * Composition (`compositionPresentation.ts`), jamais reformulées
 * localement. V2-PRE-1 (plan §3.1) : une `ActivityDefinition` ne porte plus
 * aucune récupération propre (désormais exclusive de l'occurrence,
 * `Activity.postActivityRecoverySeconds`) — aucune sous-carte Récupération
 * n'est donc plus rendue ici. `Déployer` et `Lecture` sont visibles mais
 * désactivés, sans handler fonctionnel — la même zone est réservée sur
 * toutes les cartes (plan §4.1). Aucun swipe ni action de gestion.
 */
export function ActivityCard({ definition, onOpen }: ActivityCardProps) {
  const t = strings.screens.activities.card;
  const bodyZonesReferential = useBodyZonesReferential();
  const bodyZones = formatExerciseBodyZones(definition.bodyZoneIds, bodyZonesReferential);
  const summary = formatExerciseRowSummary(definition);

  return (
    <View style={styles.container} testID={`activity-card-${definition.id}`}>
      <View style={styles.colorBar} testID={`activity-card-color-bar-${definition.id}`} />
      <View style={styles.body}>
        <View style={styles.mainRow}>
          <ActivityCardMainArea onOpen={onOpen}>
            <Text style={styles.name} numberOfLines={2}>
              {definition.name}
            </Text>
            {bodyZones !== null ? (
              <Text
                style={styles.secondaryLine}
                testID={`activity-card-body-zones-${definition.id}`}
              >
                {bodyZones}
              </Text>
            ) : null}
            {/*
             * VISUAL_CORRECTION (revue indépendante 5753653735, point 1) :
             * synthèse NON tronquée — retour à la ligne, jamais
             * `numberOfLines`, qui coupait la clause Pause/mode/cible sur
             * une carte compacte.
             */}
            <Text style={styles.secondaryLine}>{summary}</Text>
          </ActivityCardMainArea>
          <View style={styles.actions}>
            <DisclosureControl
              expanded={false}
              disabled
              accessibilityLabel={t.deployAccessibilityLabel}
              testID="activity-card-disclosure"
            />
            <Pressable
              disabled
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              accessibilityLabel={t.playAccessibilityLabel}
              style={styles.playButton}
              testID="activity-card-play"
            >
              <KodjoIcon name="action-start" opacity={0.55} testID="activity-card-play-icon" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function ActivityCardMainArea({
  onOpen,
  children,
}: {
  onOpen?: () => void;
  children: ReactNode;
}) {
  if (!onOpen) {
    return <View style={styles.content}>{children}</View>;
  }
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={strings.screens.activities.card.openAccessibilityLabel}
      style={styles.content}
      testID="activity-card-open"
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.standardCard.radius,
    overflow: "hidden",
  },
  // UI-CAT-R-002 : marque de couleur FIXE (`colors.primary`) — une
  // `ActivityDefinition` ne porte pas de couleur propre, à la différence
  // d'une Séance (`SessionCard.colorBar`, `session.color`). `alignSelf:
  // "stretch"` couvre toute la hauteur RÉELLE de la carte, Récupération
  // comprise (VISUAL_CORRECTION, revue indépendante 5753653735, point 1).
  colorBar: {
    alignSelf: "stretch",
    width: 4,
    backgroundColor: colors.primary,
  },
  // VISUAL_CORRECTION (revue indépendante 5753653735, point 1) : colonne
  // portant la rangée principale (nom/Zones/synthèse + actions) PUIS,
  // conditionnellement, la sous-carte Récupération — jamais un simple
  // empilement de lignes dans la seule zone pressable.
  body: {
    flex: 1,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    gap: spacing[4],
  },
  name: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  // Même hiérarchie typographique que `Boundary Activity`
  // (`boundaryRowSecondaryLine`, `CompositionScreen.tsx`) — réutilisée,
  // jamais redéfinie localement.
  secondaryLine: {
    ...type.caption,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
    paddingHorizontal: spacing[12],
  },
  playButton: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: minTouchTarget / 2,
  },
});
