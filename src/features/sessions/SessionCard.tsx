import { Pressable, StyleSheet, Text, View } from "react-native";

import type { SessionSummary } from "@/domain/sessions/Session";
import {
  formatActivityCount,
  formatEstimatedDuration,
  formatSessionTagLine,
  formatTourCount,
} from "@/features/sessions/formatSessionSummary";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

export type SessionCardProps = {
  session: SessionSummary;
};

/**
 * Espace ajouté de chaque côté du glyphe chevron (`24×24`, taille native
 * `KodjoIcon` de `control-chevron-down`) pour reconstituer la cible tactile
 * `48 × 48` exigée par le contrat d'écran (CE-T01-03, « Chevron | cible
 * `48 × 48`, ancrée à droite avant Démarrer ») SANS dessiner de conteneur
 * visible à cette taille (T01-S09, correction VISUAL tentative 2, point B).
 */
const CHEVRON_HIT_SLOP = (minTouchTarget - dimensions.sessionCardChevron.visualSize) / 2;

/**
 * Carte condensée d'une Séance active (T01-S06).
 *
 * Présentation pure : ne charge rien, n'appelle jamais `SessionService`.
 *
 * Le chevron et le bouton `Démarrer` sont visuellement présents — les
 * captures Catalogue (`catalogue-seances.png` et les autres cartes non
 * glissées de `catalogue-condense-actions.png`) les montrent tous les deux
 * sur chaque carte condensée, sans qu'aucune interaction n'ait eu lieu — ce
 * sont donc des éléments structurants de la carte, pas des révélations
 * d'interaction. Ils restent néanmoins désactivés dans cette sous-étape :
 * aucun écran de détail (déploiement) ni d'Exécution n'existe encore, donc
 * ni navigation, ni chargement de détail, ni callback métier n'y sont
 * câblés.
 *
 * Correction VISUAL tentative 2 (T01-S09, point B, commentaire de revue
 * 5551813745) :
 * - le chevron n'est plus enfermé dans un carré à bordure visible
 *   (`borderWidth`/`borderColor`/dimension forcée à `minTouchTarget`) —
 *   défaut visuel signalé, absent de la référence Figma. Son glyphe garde sa
 *   taille native `24×24` (`KodjoIcon`, non modifiée) ; la cible tactile
 *   `48 × 48` du contrat d'écran reste servie séparément par `hitSlop`
 *   (`CHEVRON_HIT_SLOP`), jamais par un agrandissement visuel du conteneur ;
 * - le nom et la ligne de synthèse reprennent exactement la hiérarchie
 *   typographique déjà établie pour `Boundary Activity`
 *   (`CompositionScreen.tsx` — `rowLabel`/`type.cardTitle` pour le titre,
 *   `boundaryRowSecondaryLine`/`type.caption` pour la ligne secondaire) —
 *   `summary` passe donc de `type.body` à `type.caption`, sans nouveau style ;
 * - une ligne Catégories/Zones corporelles (`tagLine`), absente depuis la
 *   base T01-S09, est restaurée sous le nom — `formatSessionTagLine` réutilise
 *   le séparateur `" · "` déjà utilisé ci-dessous pour `summaryLine` et
 *   n'est rendue que si au moins une Catégorie ou une Zone corporelle existe
 *   (état vide : aucune ligne, jamais une ligne visible vide).
 *
 * Le corps de la carte n'est pas pressable : aucune route de modification
 * (`Composition d'une séance`) n'existe avant T01-S07.
 */
export function SessionCard({ session }: SessionCardProps) {
  const summaryLine = [
    formatActivityCount(session.activityCount),
    formatEstimatedDuration(session.estimatedDurationSeconds, session.isEstimatedDurationApproximate),
    formatTourCount(session.tourRepeatCount),
  ].join(" · ");
  const tagLine = formatSessionTagLine(session.categoryNames, session.bodyZoneNames);

  return (
    <View style={styles.container}>
      <View style={[styles.colorBar, { backgroundColor: session.color }]} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {session.name}
        </Text>
        {tagLine !== null ? (
          <Text style={styles.tagLine} numberOfLines={1} testID="session-card-tag-line">
            {tagLine}
          </Text>
        ) : null}
        <Text style={styles.summary}>{summaryLine}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          disabled
          accessibilityRole="button"
          accessibilityState={{ disabled: true, expanded: false }}
          accessibilityLabel={strings.screens.sessions.card.expandAccessibilityLabel}
          style={styles.chevronButton}
          hitSlop={CHEVRON_HIT_SLOP}
        >
          <KodjoIcon name="control-chevron-down" opacity={0.45} testID="session-card-chevron" />
        </Pressable>
        <Pressable
          disabled
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          accessibilityLabel={strings.screens.sessions.card.startAccessibilityLabel}
          style={styles.startButton}
        >
          <KodjoIcon name="action-start" opacity={0.55} testID="session-card-start" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.standardCard.radius,
    overflow: "hidden",
  },
  colorBar: {
    alignSelf: "stretch",
    width: 4,
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
  // Correction VISUAL tentative 2 (point B) : ligne Catégories/Zones
  // corporelles restaurée sous le nom — même typographie que la ligne
  // secondaire de `Boundary Activity` (`boundaryRowSecondaryLine`,
  // `CompositionScreen.tsx`, `type.caption`/`colors.textSecondary`), pas de
  // nouveau style inventé localement.
  tagLine: {
    ...type.caption,
    color: colors.textSecondary,
  },
  // Correction VISUAL tentative 2 (point B) : `type.body` → `type.caption`,
  // même style que la ligne secondaire de `Boundary Activity`
  // (`boundaryRowSecondaryLine`, `CompositionScreen.tsx`) — hiérarchie
  // typographique désormais identique entre les deux cartes, réutilisée
  // plutôt que redéfinie.
  summary: {
    ...type.caption,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
    paddingHorizontal: spacing[12],
  },
  // Correction VISUAL tentative 2 (point B) : conteneur retiré (ancien
  // `borderWidth`/`borderColor`/`minWidth`/`minHeight: minTouchTarget`, qui
  // dessinait un carré à bordure visible autour du chevron, absent de la
  // référence visuelle). Dimension désormais égale à la taille native du
  // glyphe (`24×24`, `KodjoIcon` non modifiée) ; la cible tactile `48×48` du
  // contrat d'écran est servie séparément par `hitSlop`
  // (`CHEVRON_HIT_SLOP`), jamais par un agrandissement visuel du conteneur.
  chevronButton: {
    width: dimensions.sessionCardChevron.visualSize,
    height: dimensions.sessionCardChevron.visualSize,
    alignItems: "center",
    justifyContent: "center",
  },
  startButton: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: minTouchTarget / 2,
  },
});
