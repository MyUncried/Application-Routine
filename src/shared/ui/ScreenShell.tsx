import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * `Screen Shell` Foundation partagé (doc12 §12.26, `Shell / Screen`,
 * `Header / Fixed`) — correction `CMP-01` (contre-recette iPhone, Phase 2
 * Composition consolidée, `[ChatGPT] DIAGNOSTIC APPROVED — PHASE02
 * CONSOLIDATED REWORK02`, 2026-09-03).
 *
 * Extrait à l'identique de `CatalogueScreen.tsx` (rendu déjà accepté sur
 * device réel, `PHASE01_DEVICE_ACCEPTED_WITH_RESIDUAL`) — aucune valeur de
 * style n'a été changée pendant cette extraction, uniquement déplacée ici
 * pour être réutilisée par `CompositionScreen.tsx` sans duplication locale
 * de `header`/`headerSeparator`/`contextBand`, interdite par la correction
 * Foundation. Toute divergence future entre écrans passe par les props de
 * ces composants, jamais par une redéfinition locale équivalente.
 */
export function ScreenShell({ children }: { children: ReactNode }) {
  return <View style={styles.container}>{children}</View>;
}

export type FixedHeaderProps = {
  title: string;
  /** Action Retour — omise (aucun cercle rendu) sur les écrans racines de la navigation basse (Catalogue). */
  onBack?: () => void;
  backAccessibilityLabel?: string;
};

/**
 * `Header / Fixed`. Le bouton Retour (`CMP-01`) est présenté dans un cercle
 * de fond pâle (`colors.selectionSurface`, même token que les bandes
 * Context) — auparavant un chevron nu sans conteneur.
 *
 * Correction **R4-02** (`Action / Back`, `2624:3105`, `[ChatGPT] REWORK04
 * IMPLEMENTATION AUTHORIZED — DESIGN COMPLEMENTS REVIEWED`, 2026-09-03) :
 * la cible tactile (`minTouchTarget`, `48×48`) reste inchangée, mais n'est
 * plus la boîte visuelle elle-même — le cercle visible est désormais
 * `dimensions.backAction.visualCircle` (`28×28`, centré dans la cible via
 * `hitSlop`, même patron que `addActivityAction`/`CreateAction` déjà
 * établi dans ce projet) et le chevron `dimensions.backAction.chevron`
 * (`14×14`, `KodjoIcon`'s taille d'affichage propre).
 */
export function FixedHeader({ title, onBack, backAccessibilityLabel }: FixedHeaderProps) {
  const insets = useSafeAreaInsets();
  const backHitSlop = (minTouchTarget - dimensions.backAction.visualCircle) / 2;

  return (
    <View
      testID="screen-header"
      style={[
        styles.header,
        { paddingTop: insets.top, height: insets.top + dimensions.header.contentHeight },
      ]}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backAccessibilityLabel}
          hitSlop={backHitSlop}
          style={styles.backCircle}
          testID="screen-header-back"
        >
          <KodjoIcon name="control-back" testID="screen-header-back-icon" />
        </Pressable>
      ) : null}
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

/** Séparateur horizontal sous le Header — un seul token (`colors.divider`) pour tous les écrans consommateurs. */
export function HeaderSeparator() {
  return <View testID="screen-header-separator" style={styles.separator} />;
}

/** Bande Context canonique — même fond, hauteur et géométrie pour tous les écrans consommateurs. */
export function ContextBand({
  children,
  elevated = false,
}: {
  children: ReactNode;
  /** Élève la bande au-dessus de ses frères (mêmes besoins de superposition que `CompositionScreen`'s `AnchoredRow`). */
  elevated?: boolean;
}) {
  return (
    <View
      testID="screen-context-band"
      style={[styles.contextBand, elevated ? styles.elevated : null]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[12],
    justifyContent: "flex-start",
    paddingHorizontal: spacing[24],
  },
  // R4-02 : cercle visuel `28×28` — la cible tactile `48×48` est obtenue
  // via `hitSlop` (voir `FixedHeader`), jamais en agrandissant ce cercle.
  backCircle: {
    width: dimensions.backAction.visualCircle,
    height: dimensions.backAction.visualCircle,
    borderRadius: dimensions.backAction.visualCircle / 2,
    backgroundColor: colors.selectionSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...type.screenTitle,
    flex: 1,
    color: colors.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
  },
  contextBand: {
    backgroundColor: colors.selectionSurface,
    paddingHorizontal: spacing[24],
    height: dimensions.contextBand.height,
    paddingTop: dimensions.contextBand.paddingTop,
    paddingBottom: dimensions.contextBand.paddingBottom,
    justifyContent: "space-between",
  },
  elevated: {
    zIndex: 1,
  },
});
