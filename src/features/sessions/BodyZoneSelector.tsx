import { Pressable, StyleSheet, Text, View } from "react-native";

import type { BodyZone } from "@/features/reference-data/bodyZones";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * Marge tactile invisible portant chaque pastille (hauteur visuelle ≈ 36,
 * `type.body` + paddings) à la cible minimale `48 × 48` sans en agrandir la
 * taille visuelle (doc12 §Dimensions structurantes, doc13 §3.3 ; CE-T01-11
 * prévoit explicitement ce patron : « hauteur visuelle 30, cible tactile
 * minimale 48 »). Correction — audit `T01_S01_S08_CONFORMITY_AUDIT_20260902.md`.
 */
const TAG_VISUAL_HEIGHT = spacing[8] * 2 + type.body.lineHeight;
const TAG_HIT_SLOP = Math.max(0, Math.ceil((minTouchTarget - TAG_VISUAL_HEIGHT) / 2));

export type BodyZoneSelectorProps = {
  /** Référentiel à afficher — jamais codé en dur ici (D-093) : fourni par l'appelant (`bodyZones.ts`). */
  zones: readonly BodyZone[];
  selectedIds: readonly string[];
  onToggle: (zoneId: string) => void;
  accessibilityLabel: string;
};

/**
 * Sélection multiple des Zones corporelles d'un Exercice (T01-S08, D-093).
 * Composant de présentation pur, sans connaissance du contenu du
 * référentiel — reçoit `zones` en prop, ne l'importe jamais lui-même
 * (arbitrage A, plan §COMPRÉHENSION : « jamais codée en dur dans
 * `ExerciseScreen.tsx` », étendu ici au composant de sélection lui-même).
 *
 * Le conteneur ne porte aucun `accessibilityRole` (revue PR #9,
 * https://github.com/MyUncried/Application-Routine/pull/9#pullrequestreview-5044116021,
 * KODJO-CMD-0002) : `radiogroup` signifie un choix exclusif et contredit la
 * multisélection réelle (chaque zone reste un `checkbox` indépendant, avec
 * son propre `accessibilityState.checked`) ; un `View` par défaut
 * (`accessible` non positionné) laisse chaque enfant exposé
 * individuellement, sans intercaler de nœud d'accessibilité intermédiaire
 * susceptible d'en perturber l'exposition.
 */
export function BodyZoneSelector({
  zones,
  selectedIds,
  onToggle,
  accessibilityLabel,
}: BodyZoneSelectorProps) {
  return (
    <View style={styles.container} accessibilityLabel={accessibilityLabel} testID="body-zone-selector">
      {zones.map((zone) => {
        const isSelected = selectedIds.includes(zone.id);
        return (
          <Pressable
            key={zone.id}
            onPress={() => onToggle(zone.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={zone.name}
            hitSlop={TAG_HIT_SLOP}
            style={[styles.tag, isSelected ? styles.tagSelected : null]}
          >
            <Text style={[styles.tagLabel, isSelected ? styles.tagLabelSelected : null]}>
              {zone.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[8],
  },
  tag: {
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tagSelected: {
    borderColor: colors.selection,
    backgroundColor: colors.selectionSurface,
  },
  tagLabel: {
    ...type.body,
    color: colors.textPrimary,
  },
  tagLabelSelected: {
    color: colors.selection,
  },
});
