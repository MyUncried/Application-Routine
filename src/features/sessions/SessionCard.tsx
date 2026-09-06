import { Pressable, StyleSheet, Text, View } from "react-native";

import type { SessionSummary } from "@/domain/sessions/Session";
import {
  formatActivityCount,
  formatBodyZoneNamesSegment,
  formatCategoryNamesSegment,
  formatEstimatedDuration,
  formatTourCount,
} from "@/features/sessions/formatSessionSummary";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

export type SessionCardProps = {
  session: SessionSummary;
};

/**
 * Espace ajouté de chaque côté du cadre visible du chevron (T01-S09,
 * correction VISUAL, 2e contre-recette, point B, commentaire de revue
 * 5551083690) pour reconstituer la cible tactile `48 × 48` exigée par le
 * contrat d'écran (CE-T01-03, « Chevron | cible `48 × 48`, ancrée à droite
 * avant Démarrer ») SANS agrandir le cadre lui-même au-delà de sa géométrie
 * DSF canonique (`dimensions.exerciseParameterRow.chevronBox`).
 */
const CHEVRON_HIT_SLOP = (minTouchTarget - dimensions.exerciseParameterRow.chevronBox) / 2;

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
 * - le nom et la ligne de synthèse reprennent exactement la hiérarchie
 *   typographique déjà établie pour `Boundary Activity`
 *   (`CompositionScreen.tsx` — `rowLabel`/`type.cardTitle` pour le titre,
 *   `boundaryRowSecondaryLine`/`type.caption` pour la ligne secondaire) —
 *   `summary` passe donc de `type.body` à `type.caption`, sans nouveau style ;
 * - une ligne Catégories/Zones corporelles (`tagLine`), absente depuis la
 *   base T01-S09, est restaurée sous le nom — n'est rendue que si au moins
 *   une Catégorie ou une Zone corporelle existe (état vide : aucune ligne,
 *   jamais une ligne visible vide).
 *
 * Correction VISUAL, 2e contre-recette (T01-S09, point A, commentaire de
 * revue 5551083690) :
 * - les noms de Catégories s'affichent désormais dans la couleur propre de
 *   la Séance (`session.color`, même valeur que `colorBar` ci-dessous) —
 *   jamais le segment Zones corporelles ni le séparateur, qui restent dans
 *   la couleur de texte secondaire par défaut ;
 * - le séparateur entre le groupe Catégories et le groupe Zones corporelles
 *   devient `" : "` (auparavant `" · "`, point médian) — rendu attendu par
 *   exemple « Cardio : Genoux, Dos » lorsque les deux groupes existent ;
 *   omis entièrement si l'un des deux groupes est vide (jamais un
 *   séparateur adjacent à un segment vide) ;
 * - `formatCategoryNamesSegment`/`formatBodyZoneNamesSegment`
 *   (`formatSessionSummary.ts`) fournissent chacun leur segment
 *   indépendamment, permettant ce rendu à deux couleurs via un `Text`
 *   imbriqué (RN concatène nativement le texte annoncé à l'accessibilité,
 *   aucun `accessibilityLabel` dédié n'est donc nécessaire).
 *
 * Correction VISUAL, 2e contre-recette (T01-S09, point B, commentaire de
 * revue 5551083690) — réintègre un cadre visible autour du chevron
 * `Déployer`, retiré à tort par la tentative 1 (« carré à bordure non
 * voulu ») : la revue précise que le défaut réel n'était pas la présence
 * d'un cadre, mais l'usage d'une géométrie ad hoc (`borderWidth`/
 * `borderColor`/dimension forcée à `minTouchTarget`) au lieu du composant
 * DSF canonique. Réutilise donc, à l'identique, le carré canonique déjà
 * établi et partagé par `ExerciseScreen.tsx` (`parameterChevronBox`,
 * `dimensions.exerciseParameterRow.chevronBox`/`chevronBoxRadius` —
 * `28×28`, rayon `6`, fond `colors.tourSurface`), jamais une nouvelle
 * géométrie locale. Le glyphe reste `control-chevron-down` (famille
 * « Controls / Disclosure », déjà utilisée ici avant toute correction —
 * jamais substitué par `select-field-chevron`, glyphe `14×14` d'une famille
 * fonctionnelle distincte, « Forms / Select Field », réservée aux
 * sélecteurs de paramètres). La cible tactile `48 × 48` et l'état désactivé
 * restent inchangés (`hitSlop`/`accessibilityState`, non affectés par ce
 * changement de conteneur).
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
  const categoriesSegment = formatCategoryNamesSegment(session.categoryNames);
  const zonesSegment = formatBodyZoneNamesSegment(session.bodyZoneNames);
  const hasTagLine = categoriesSegment !== null || zonesSegment !== null;

  return (
    <View style={styles.container}>
      <View style={[styles.colorBar, { backgroundColor: session.color }]} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {session.name}
        </Text>
        {hasTagLine ? (
          <Text style={styles.tagLine} numberOfLines={1} testID="session-card-tag-line">
            {categoriesSegment !== null ? (
              <Text
                style={{ color: session.color }}
                testID="session-card-tag-line-categories"
              >
                {categoriesSegment}
              </Text>
            ) : null}
            {categoriesSegment !== null && zonesSegment !== null ? " : " : null}
            {zonesSegment}
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
          <View style={styles.chevronBox} testID="session-card-chevron-box">
            <KodjoIcon name="control-chevron-down" opacity={0.45} testID="session-card-chevron" />
          </View>
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
  // Zone pressable — ne porte plus aucune géométrie visuelle propre
  // (déplacée sur `chevronBox` ci-dessous) ; la cible tactile `48×48` du
  // contrat d'écran reste servie séparément par `hitSlop`
  // (`CHEVRON_HIT_SLOP`), jamais par un agrandissement du cadre visible
  // lui-même.
  chevronButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  // Correction VISUAL, 2e contre-recette (point B) : cadre canonique DSF
  // réintégré — géométrie et fond identiques, au token près, à
  // `ExerciseScreen.tsx`'s `parameterChevronBox` (`28×28`, rayon `6`, fond
  // `colors.tourSurface`), jamais une nouvelle géométrie locale.
  chevronBox: {
    width: dimensions.exerciseParameterRow.chevronBox,
    height: dimensions.exerciseParameterRow.chevronBox,
    borderRadius: dimensions.exerciseParameterRow.chevronBoxRadius,
    backgroundColor: colors.tourSurface,
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
