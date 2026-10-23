import type { Ref } from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatCompactDuration } from "@/features/sessions/compositionPresentation";
import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import { STOP_POINT_CHIP_HEIGHT, StopPointChip } from "@/features/sessions/StopPointChip";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { spacing } from "@/shared/ui/tokens";

/**
 * Hauteur de la rangée qui porte un point d'arrêt hors placement : celle de la puce, 22 (PRE-6
 * story 5.2, D-435, Figma `9819:20018` « Espace — Point d'arrêt » ; ch13 CE-T03-08 L1478). Les
 * écarts de la séquence l'encadrent (8 hors Circuit, 9 dans le Circuit).
 */
export const STOP_POINT_LINE_HEIGHT = STOP_POINT_CHIP_HEIGHT;

/**
 * Valeur de la récupération en ligne 3 de la carte v2 (Figma `9798:19934`) : Inter Regular 12,
 * `#7A7A80`, interligne « normal » d'Inter (15).
 */
export const RECOVERY_VALUE_TEXT = { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 12, lineHeight: 15 } as const;
/** Écart sablier → valeur, identique à celui du symbole de durée de la ligne 2 (Figma : 6). */
const RECOVERY_ICON_GAP = spacing[6];

/**
 * Récupération affichable sur la carte : un nombre fini strictement positif (choix D2 de l'epic 5).
 * Absente, nulle, négative ou non finie (NaN, ∞, donnée corrompue) : rien n'est affiché ni proposé ;
 * la donnée n'est pas modifiée.
 */
export function isDisplayableRecovery(recoverySeconds: number | null | undefined): recoverySeconds is number {
  return typeof recoverySeconds === "number" && Number.isFinite(recoverySeconds) && recoverySeconds > 0;
}

export type OccurrenceRecoveryProps = {
  /** Récupération à afficher ; non affichable (`isDisplayableRecovery`) : rien n'est rendu. */
  readonly recoverySeconds: number | null | undefined;
  /**
   * Retirée de l'arbre d'accessibilité (revue 5.3) : en placement, la carte n'est plus un élément
   * accessible et ne couvre plus cet affichage (occurrence sans zone de récupération).
   */
  readonly hiddenFromAccessibility?: boolean;
  readonly testID?: string;
};

/**
 * Récupération contextuelle en troisième ligne de la carte v2 (PRE-6 story 5.1, D-435, Figma
 * `9798:19931`, `9798:19932`, `9798:19934`) : sablier 13 dans la colonne des symboles puis valeur
 * SANS préfixe, calée à droite (« 20 s »).
 *
 * PRE-6 story 7.2 (D-442, qui remplace sur ce point D-435) : hors placement, la récupération n'est
 * plus une cible — ni toucher (roulette), ni appui long (bulle « Retirer la récupération »), ni
 * action accessible propre. C'est un simple affichage, sans élément accessible propre : le toucher
 * et l'appui long reviennent à la carte (ouvrir l'Exercice, glisser), qui porte la valeur dans son
 * nom (« …, récupération 20 s »). En placement, la zone de récupération est le cadre sélectionnable
 * `PlacementRecoveryFrame` (story 7.2).
 */
export function OccurrenceRecovery({ recoverySeconds, hiddenFromAccessibility = false, testID }: OccurrenceRecoveryProps) {
  if (!isDisplayableRecovery(recoverySeconds)) {
    return null;
  }
  return (
    // Ni bouton ni élément propre : la carte (élément accessible) porte la valeur dans son nom, comme
    // l'ancien contrôle hors placement (revue 5.1 : `accessible={false}`, `importantForAccessibility="no"`).
    <View
      accessible={false}
      accessibilityElementsHidden={hiddenFromAccessibility}
      importantForAccessibility={hiddenFromAccessibility ? "no-hide-descendants" : "no"}
      style={[styles.recovery, styles.passThrough]}
      testID={testID}
    >
      <KodjoIcon name="card-recovery-hourglass" testID="composition-recovery-line-icon" />
      <Text style={styles.value} numberOfLines={1} testID="composition-recovery-line-label">
        {formatCompactDuration(recoverySeconds)}
      </Text>
    </View>
  );
}

/** PRE-6 story 6.2 : actions accessibles de la puce (« Monter » / « Descendre »). */
export type StopPointLineAction = { readonly name: string; readonly label: string };

export type StopPointLineProps = {
  /** « Point d'arrêt après {exercice} » / « … après le circuit » / tête de portée. */
  readonly accessibilityLabel: string;
  readonly accessibilityHint?: string;
  readonly accessibilityActions: readonly StopPointLineAction[];
  readonly onAccessibilityAction: (name: string) => void;
  /** Appui long : saisie du point (glisser, story 6.2). */
  readonly onLongPress: () => void;
  /** Translation de la puce soulevée qui suit le doigt (la rangée, elle, reste en place). */
  readonly translateY: number;
  /** Revue 6.2 : la puce, cible du focus d'accessibilité. */
  readonly chipRef?: Ref<View>;
  /** PRE-6 story 7.2 (D-442) : point saisi (glisser en cours), marqué soulevé (`StopPointChip.lifted`). */
  readonly lifted?: boolean;
  readonly testID?: string;
};

/**
 * Ligne d'un Point d'arrêt hors placement (PRE-6 story 4.2, Figma `8328:29428`). PRE-6 story 5.2
 * (D-435, Figma `9819:20018`, `9819:20063`) : rangée de 22, puce existante centrée sur la page ; le
 * point de raccord sur le rail est dessiné par la rangée porteuse (`RailDot`).
 *
 * PRE-6 story 6.2 (D-441) : la ligne appartient à la rangée AUTONOME du point (`StopPointRow` de
 * l'écran), sœur des cartes — plus au bloc d'une occurrence. L'appui long saisit le point
 * (glisser) ; la bulle « Retirer » et l'action de retrait sont retirées (le retrait revient en
 * placement, story 6.3) ; les actions accessibles sont « Monter » / « Descendre ».
 */
export function StopPointLine({
  accessibilityLabel,
  accessibilityHint,
  accessibilityActions,
  onAccessibilityAction,
  onLongPress,
  translateY,
  chipRef,
  lifted = false,
  testID,
}: StopPointLineProps) {
  return (
    <View style={[styles.line, { transform: [{ translateY }] }]} testID={testID}>
      <StopPointChip
        ref={chipRef}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityActions={accessibilityActions}
        onAccessibilityAction={onAccessibilityAction}
        onLongPress={onLongPress}
        lifted={lifted}
        testID={testID === undefined ? undefined : `${testID}-chip`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // PRE-6 story 5.2 (D-435) : puce centrée sur la page (la rangée a la largeur des cartes, ou de la
  // colonne de la séquence sous le Circuit — même axe, x 201 à 402).
  line: {
    height: STOP_POINT_LINE_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  // Story 7.2 (D-442) : simple affichage, le toucher traverse jusqu'à la carte.
  passThrough: {
    pointerEvents: "none",
  },
  // Sablier dans la colonne des symboles (sous le symbole de durée), valeur calée à droite.
  recovery: {
    flexDirection: "row",
    alignItems: "center",
    gap: RECOVERY_ICON_GAP,
  },
  value: {
    ...RECOVERY_VALUE_TEXT,
    color: TEXT_TERTIARY,
    flexGrow: 1,
    flexShrink: 1,
    textAlign: "right",
  },
});
