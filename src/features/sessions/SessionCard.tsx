import type { ReactNode } from "react";
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
import { CardTitleLine } from "@/shared/ui/CardTitleLine";
import { DisclosureControl } from "@/shared/ui/DisclosureControl";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

export type SessionCardProps = {
  session: SessionSummary;
  /**
   * T01-S10 (CE-T01-S10-01) : appelé lorsque la zone principale de la carte
   * est activée — ouvre `Composition d'une séance` en MODIFICATION. Non
   * fourni : la zone principale reste non pressable (aucune route de
   * modification câblée — état T01-S06/S09).
   */
  onOpen?: () => void;
};

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
 * Correction VISUAL, 3e contre-recette (T01-S09, point A, commentaire de
 * revue faisant suite à `1f28a09`) — le chevron `Déployer` délègue désormais
 * entièrement à `DisclosureControl` (`@/shared/ui/DisclosureControl`),
 * l'instance partagée de `Controls / Disclosure — Source exact`
 * (`12 – Architecture technique.md`, `2537:1033`/`2537:1038`). La 2e
 * contre-recette avait réintégré un cadre visible, mais en réutilisant par
 * analogie le token `exerciseParameterRow.chevronBox`/`colors.tourSurface`
 * (« Forms / Select Field », fonction graphique distincte) et une opacité
 * `0.45` — la revue signale que ni ce fond ni cette opacité ne sont
 * documentés pour CE contrôle. `DisclosureControl` retire donc ces deux
 * emprunts non sourcés au profit des quatre valeurs canoniques vérifiées
 * (`colors.disclosureBackground`/`disclosureBorderCollapsed`/
 * `disclosureBorderExpanded`/`disclosureChevronCollapsed`,
 * `dimensions.catalogueDisclosure`). L'état initial condensé
 * (`expanded={false}`), la cible tactile `48 × 48` et l'état désactivé
 * restent inchangés — seuls conteneur et couleurs changent.
 *
 * Le corps de la carte n'est pas pressable : aucune route de modification
 * (`Composition d'une séance`) n'existe avant T01-S07.
 *
 * Alignement DSF 07/10/2026 (`DSF / Cards / Séance`, variante
 * `Contexte=Catalogue, État=Replié` `6214:3572`, D11) :
 * - la durée quitte la ligne de synthèse pour la ligne de titre, sans cadre,
 *   calée à droite à 16 du bord de la carte (`CardTitleLine`) ; son calcul
 *   et son format (`formatEstimatedDuration`, préfixe « ≥ ») sont inchangés ;
 * - la ligne de titre occupe toute la largeur de la colonne de texte (322 à
 *   la largeur de référence) ; Déployer et Démarrer restent en bas à droite ;
 * - conteneur : fond `color/surface-subtle`, contour 0,5 `color/cards/border`,
 *   rayon 8 (`component/cards/radius`).
 * Le chevron de déploiement est conservé (annexe I.3).
 */
export function SessionCard({ session, onOpen }: SessionCardProps) {
  const duration = formatEstimatedDuration(
    session.estimatedDurationSeconds,
    session.isEstimatedDurationApproximate,
  );
  const summaryLine = [
    formatActivityCount(session.activityCount),
    formatTourCount(session.tourRepeatCount),
  ].join(" · ");
  const categoriesSegment = formatCategoryNamesSegment(session.categoryNames);
  const zonesSegment = formatBodyZoneNamesSegment(session.bodyZoneNames);
  const hasTagLine = categoriesSegment !== null || zonesSegment !== null;

  return (
    <View style={styles.container}>
      <View
        style={[styles.colorBar, { backgroundColor: session.color }]}
        testID="session-card-color-bar"
      />
      <View style={styles.body}>
        <SessionCardMainArea onOpen={onOpen}>
          <CardTitleLine title={session.name} duration={duration} testID="session-card" />
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
        </SessionCardMainArea>
        <View style={styles.actions} pointerEvents="box-none">
          <DisclosureControl
            expanded={false}
            disabled
            accessibilityLabel={strings.screens.sessions.card.expandAccessibilityLabel}
            testID="session-card-disclosure"
          />
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
    </View>
  );
}

/**
 * Zone principale de la carte (nom + ligne de tags + synthèse). T01-S10
 * (CE-T01-S10-01) : `Pressable` avec un rôle `button` explicite lorsque
 * `onOpen` est fourni — elle ouvre `Composition d'une séance` en
 * modification. Sans `onOpen`, elle reste un simple `View` non interactif
 * (comportement T01-S06/S09 : « le corps de la carte n'est pas pressable »).
 * Le chevron et `Démarrer` restent des contrôles distincts, hors de cette
 * zone.
 */
function SessionCardMainArea({
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
      accessibilityLabel={strings.screens.sessions.card.openAccessibilityLabel}
      style={styles.content}
      testID="session-card-open"
    >
      {children}
    </Pressable>
  );
}

/** Largeur réservée aux actions Déployer/Démarrer, depuis le bord droit de la colonne de texte. */
const LOWER_LINES_ACTION_RESERVE = 2 * minTouchTarget + spacing[2] - spacing[16];

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 0.5,
    borderColor: colors.cardsBorder,
    borderRadius: fixedRadii[8],
    overflow: "hidden",
  },
  colorBar: {
    alignSelf: "stretch",
    width: 4,
  },
  // Colonne de la carte : zone principale (titre/durée pleine largeur, puis
  // classement et synthèse) ; les actions se superposent en bas à droite
  // sans réduire la ligne de titre.
  // `minHeight` : hauteur de la variante Figma (90), qui garantit que les
  // actions (48, ancrées en bas) ne recouvrent jamais la ligne de titre ;
  // la carte grandit avec le texte (police agrandie).
  body: {
    flex: 1,
    minHeight: 90,
  },
  content: {
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    gap: spacing[4],
  },
  // Correction VISUAL tentative 2 (point B) : ligne Catégories/Zones
  // corporelles restaurée sous le nom — même typographie que la ligne
  // secondaire de `Boundary Activity` (`boundaryRowSecondaryLine`,
  // `CompositionScreen.tsx`, `type.caption`/`colors.textSecondary`), pas de
  // nouveau style inventé localement.
  //
  // Alignement DSF 07/10 : métadonnées des cartes en Inter Regular 12
  // (`type.supporting`), comme dans `DSF / Cards / Séance` ; les lignes
  // basses s'arrêtent avant les deux actions (2 × 48, à 2 du bord).
  tagLine: {
    ...type.supporting,
    marginRight: LOWER_LINES_ACTION_RESERVE,
    color: colors.textSecondary,
  },
  // Correction VISUAL tentative 2 (point B) : `type.body` → `type.caption`,
  // même style que la ligne secondaire de `Boundary Activity`
  // (`boundaryRowSecondaryLine`, `CompositionScreen.tsx`) — hiérarchie
  // typographique désormais identique entre les deux cartes, réutilisée
  // plutôt que redéfinie.
  summary: {
    ...type.supporting,
    marginRight: LOWER_LINES_ACTION_RESERVE,
    color: colors.textSecondary,
  },
  actions: {
    position: "absolute",
    right: spacing[2],
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  startButton: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: minTouchTarget / 2,
  },
});
