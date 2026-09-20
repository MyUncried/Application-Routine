import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import type { SessionSummary } from "@/domain/sessions/Session";
import { ActivityCatalogueList } from "@/features/activities/ActivityCatalogueList";
import { CatalogueCreateOptions } from "@/features/activities/CatalogueCreateOptions";
import { useActivityCatalogue } from "@/features/activities/useActivityCatalogue";
import { SessionCard } from "@/features/sessions/SessionCard";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { strings } from "@/shared/i18n";
import { ContextBand, FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/** Segment de TYPE de contenu du Catalogue (V2-CAT-01, D-108). Seuls `activities` et `sessions` sont fonctionnels ; `circuits` reste visible mais désactivé. */
export type CatalogueContentType = "activities" | "sessions" | "circuits";

/**
 * Écran du Catalogue des séances (T01-S06). Seul point d'appel à
 * `useFocusEffect` de la feature — `useSessionCatalogue` reste pur et ne
 * connaît pas la navigation.
 *
 * Le cadre commun (en-tête, sélecteur de filtres, bouton `+ Créer`) reste
 * affiché dans les quatre états ; seul le corps central varie. Confirmé par
 * `catalogue-vide.png`, qui montre ce cadre conservé même à vide (voir le
 * plan d'implémentation).
 *
 * Correction LAY-01 (Phase 1, `2026-09-03_P0-plan-correction-layout-controls.md`,
 * `[ChatGPT] PLAN_APPROVED — PHASE 1 ONLY — CATALOGUE VIDE`) : l'écran est
 * désormais recomposé selon `Shell / Screen — Context=On, Bottom=Navigation`
 * (doc12 §12.26) — Header fixe (titre) → séparateur → bande Context (bleu
 * très pâle, `colors.selectionSurface`, seul token pâle déjà existant dans
 * ce code) contenant le sélecteur de filtres et `+ Créer` → corps. La
 * hauteur du Header utilise `dimensions.header.contentHeight` (déjà défini,
 * jamais utilisé jusqu'ici) plutôt qu'une valeur locale improvisée ; les
 * insets système réels remplacent la réserve `0–92` du gabarit Figma, comme
 * l'exige doc12 §12.26 (« les insets système réels remplacent les réserves
 * de Safe Area lors de l'implémentation »). Aucune logique de données
 * modifiée — uniquement la structure visuelle et le regroupement des
 * éléments déjà existants.
 */
export function CatalogueScreen() {
  const router = useRouter();
  // V2-CAT-01 (UI-CAT-R-005/006) : signal PONCTUEL, jamais persistant,
  // envoyé exclusivement par `CategoriesScreen.handleSave` (`dismissTo`)
  // après un enregistrement réussi — force le retour déterministe sur
  // `Séances`, indépendamment du segment actif avant l'ouverture du
  // parcours de création. Absent de tout autre appelant : la restauration
  // normale du segment pendant l'aller-retour courant (édition d'une
  // Activité, sélection multiple…) n'est jamais affectée.
  const params = useLocalSearchParams<{ catalogueSegment?: string }>();
  const sessionCatalogue = useSessionCatalogue();
  const activityCatalogue = useActivityCatalogue();
  // T01-S10/V2-CAT-01 (D-108) : `Séances` sélectionné par défaut à
  // l'ouverture et après relance complète — aucun segment n'est persisté.
  const [activeSegment, setActiveSegment] = useState<CatalogueContentType>("sessions");
  const [isCreateTreeOpen, setIsCreateTreeOpen] = useState(false);

  const { reload: reloadSessions, cancelPending: cancelPendingSessions } = sessionCatalogue;
  const { reload: reloadActivities, cancelPending: cancelPendingActivities } = activityCatalogue;
  const catalogueSegmentParam = params.catalogueSegment;
  useFocusEffect(
    useCallback(() => {
      reloadSessions();
      reloadActivities();
      // Consommé une seule fois : `setParams` l'efface immédiatement, pour
      // qu'un focus ultérieur SANS nouveau signal (retour d'édition d'une
      // Activité, par exemple) ne réapplique jamais ce forçage.
      if (catalogueSegmentParam === "sessions") {
        setActiveSegment("sessions");
        router.setParams({ catalogueSegment: undefined });
      }
      return () => {
        cancelPendingSessions();
        cancelPendingActivities();
      };
    }, [
      reloadSessions,
      reloadActivities,
      cancelPendingSessions,
      cancelPendingActivities,
      catalogueSegmentParam,
      router,
    ]),
  );

  const t = strings.screens.sessions;
  // T01-S10/V2-CAT-01 (D-108, plan §4.1) : le titre suit le segment actif —
  // `Catalogue des séances` / `Catalogue des activités` / `Catalogue des
  // circuits`, un mapping RÉEL des trois segments même si `Circuits` reste
  // désactivé et donc inatteignable via l'interface (revue 5732014381,
  // obligation 2).
  const title =
    activeSegment === "activities"
      ? strings.screens.activities.title
      : activeSegment === "circuits"
        ? t.circuitsTitle
        : t.title;

  return (
    <ScreenShell>
      <FixedHeader title={title} />
      <HeaderSeparator />

      <ContextBand>
        <SegmentedControl
          options={[
            { value: "activities", label: t.contentTypes.activities },
            { value: "sessions", label: t.contentTypes.sessions },
            {
              value: "circuits",
              label: t.contentTypes.circuits,
              disabled: true,
              accessibilityLabel: t.contentTypes.circuitsUnavailableAccessibilityLabel,
            },
          ]}
          value={activeSegment}
          onChange={setActiveSegment}
          testID="catalogue-content-type-row"
        />
        <View style={styles.commandRow} testID="catalogue-command-row">
          <CommandAction
            label={t.createAction}
            icon="action-add"
            onPress={() => setIsCreateTreeOpen(true)}
            testID="catalogue-create-action"
          />
          <CommandAction
            label={t.filterAction}
            iconElement={<FilterIcon disabled testID="catalogue-filter-icon" />}
            disabled
            testID="catalogue-filter-action"
          />
          <CommandAction
            label={t.sortAction}
            iconElement={<SortIcon disabled testID="catalogue-sort-icon" />}
            disabled
            testID="catalogue-sort-action"
          />
        </View>
      </ContextBand>

      <CatalogueCreateOptions
        visible={isCreateTreeOpen}
        onSelectNewActivity={() => {
          setIsCreateTreeOpen(false);
          router.push({ pathname: "/exercise", params: { catalogueDefinitionId: "new" } });
        }}
        onSelectNewSession={() => {
          setIsCreateTreeOpen(false);
          router.push("/composition");
        }}
        onCancel={() => setIsCreateTreeOpen(false)}
      />

      {/*
       * Correction CAT-R04 (contre-recette iPhone, `[ChatGPT]
       * DEVICE_REVIEW_FAIL — REWORK 02`, 2026-09-03) : la navigation basse
       * est positionnée en absolu (`app/(tabs)/_layout.tsx`), donc jamais
       * comptée dans la hauteur `flex` normale de ce corps — sans réserve
       * explicite, `centeredBody` (plus bas) centrait son contenu sur
       * TOUTE la hauteur restante de l'écran, y compris la zone
       * visuellement recouverte par la barre flottante, décalant le cadre
       * de l'état vide trop bas. `paddingBottom` réserve exactement
       * l'espace réel de la navigation (`navigationBarTotalHeight()`, même
       * source — et désormais même formule de résiduel bas — que
       * `app/(tabs)/_layout.tsx`, correction `D`/`N-03`, 2026-09-03) — le
       * centrage de `centeredBody` s'effectue désormais uniquement entre le
       * bas de la bande Context et le haut réel de la barre.
       */}
      <View
        style={[styles.body, { paddingBottom: navigationBarTotalHeight() }]}
        testID="catalogue-body"
      >
        {activeSegment === "sessions" ? (
          <>
            {sessionCatalogue.state.status === "loading" ? <LoadingBody /> : null}
            {sessionCatalogue.state.status === "empty" ? <EmptyBody /> : null}
            {sessionCatalogue.state.status === "error" ? (
              <ErrorBody onRetry={sessionCatalogue.reload} />
            ) : null}
            {sessionCatalogue.state.status === "ready" ? (
              <ReadyBody
                sessions={sessionCatalogue.state.sessions}
                onOpenSession={(sessionId) =>
                  router.push({ pathname: "/composition", params: { sessionId } })
                }
              />
            ) : null}
          </>
        ) : null}
        {activeSegment === "activities" ? (
          <ActivityCatalogueList
            state={activityCatalogue.state}
            onRetry={activityCatalogue.reload}
            onOpenDefinition={(definitionId) =>
              router.push({ pathname: "/exercise", params: { catalogueDefinitionId: definitionId } })
            }
          />
        ) : null}
      </View>
    </ScreenShell>
  );
}

/**
 * Une commande de la rangée `Créer / Filtrer / Trier` (V2-CAT-01, plan
 * §4.1 ; VISUAL_CORRECTION, revue iPhone du HEAD `cc1c618`) — `Créer` seul
 * actif dans cette tranche ; `Filtrer`/`Trier` restent visibles mais inertes
 * (recherche, filtre et tri fonctionnels hors périmètre).
 *
 * D-184 : trois commandes `108 × 32` pt (`COMMAND_ACTION_WIDTH`), espace
 * `8` pt entre elles (`commandRow.gap`), rayon du token
 * `dimensions.compactSecondaryButton` (16) — la cible tactile réelle
 * (`minTouchTarget`, `48×48`) est obtenue via `hitSlop`, jamais en
 * agrandissant la boîte visuelle elle-même (doc12 §Dimensions structurantes,
 * doc13 §3.3).
 *
 * **Correction du bouton non fonctionnel sur appareil réel (obligation 1)** :
 * la géométrie visuelle (`108 × 32`) dépasse déjà `minTouchTarget` (`48`)
 * dans les deux axes — la formule `(minTouchTarget − dimension) / 2`
 * produisait donc un `hitSlop` NÉGATIF (`(48 − 90) / 2 = −21` avec l'ancienne
 * largeur `90`), qui RÉDUIT la zone tactile native au lieu de l'agrandir.
 * `fireEvent.press` (Testing Library) déclenche directement le gestionnaire
 * sans jamais passer par le calcul RÉEL de zone tactile côté plateforme —
 * un tel défaut ne peut donc jamais être détecté par ce seul mécanisme
 * (d'où la consigne de ne pas conclure à partir des seuls `fireEvent.press`
 * existants). `Math.max(0, ...)` élimine toute valeur négative : `hitSlop`
 * n'agrandit plus jamais en dessous de `0`, quelle que soit la géométrie
 * visuelle fournie.
 */
function CommandAction({
  label,
  icon,
  iconElement,
  onPress,
  disabled = false,
  testID,
}: {
  label: string;
  icon?: "action-add";
  /** Pictogramme composé localement (Filtrer/Trier) — voir `FilterIcon`/`SortIcon`. */
  iconElement?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  testID: string;
}) {
  const horizontalHitSlop = Math.max(0, (minTouchTarget - COMMAND_ACTION_WIDTH) / 2);
  const verticalHitSlop = Math.max(
    0,
    (minTouchTarget - dimensions.compactSecondaryButton.visualHeight) / 2,
  );

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={label}
      hitSlop={{
        top: verticalHitSlop,
        bottom: verticalHitSlop,
        left: horizontalHitSlop,
        right: horizontalHitSlop,
      }}
      style={[styles.createAction, disabled ? styles.createActionDisabled : null]}
      testID={testID}
    >
      {icon ? <KodjoIcon name={icon} opacity={disabled ? 0.4 : 1} testID={`${testID}-icon`} /> : null}
      {iconElement}
      <Text style={[styles.createActionLabel, disabled ? styles.createActionLabelDisabled : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Pictogramme `Filtrer` (Figma `G6RY5Ebhgwb4AHIOYDwwvg`, frame `3786:5093`,
 * nœud `3947:5933`) : trois lignes horizontales décroissantes. Composé
 * localement à partir de primitives `View` — `src/shared/ui/KodjoIcon.tsx`
 * et `assets/icons/` (registre d'icônes SVG canoniques du DSF) sont hors du
 * périmètre d'écriture autorisé de cette correction visuelle bornée
 * (`scope_allow`) : aucun nouvel actif SVG ni nouvelle entrée de registre
 * ne peut y être ajouté ici. Écart disclosed plutôt qu'un élargissement de
 * périmètre non autorisé — même géométrie de trait (largeurs décroissantes,
 * couleur `colors.primary`/`colors.disabled`) que le pictogramme Figma
 * référencé.
 */
function FilterIcon({ disabled = false, testID }: { disabled?: boolean; testID?: string }) {
  const color = disabled ? colors.disabled : colors.primary;
  return (
    <View style={styles.filterIcon} testID={testID}>
      <View style={[styles.filterIconBar, { width: 14, backgroundColor: color }]} />
      <View style={[styles.filterIconBar, { width: 10, backgroundColor: color }]} />
      <View style={[styles.filterIconBar, { width: 6, backgroundColor: color }]} />
    </View>
  );
}

/**
 * Pictogramme `Trier` (Figma `G6RY5Ebhgwb4AHIOYDwwvg`, frame `3786:5093`,
 * `Action/Utility` type `Sort`) : flèches haut/bas. Même disclosure de
 * périmètre que `FilterIcon` ci-dessus — `src/shared/ui/KodjoIcon.tsx` et
 * `assets/icons/` restent hors du périmètre d'écriture autorisé, et
 * `react-native-svg` n'est pas une dépendance du projet.
 *
 * Correction VISUAL_CORRECTION (revue indépendante du HEAD `8dbe586`,
 * commentaire 5735387835) : le glyphe Unicode `↕` précédent dépend d'une
 * police système — sa forme et sa disponibilité varient d'une plateforme à
 * l'autre, ce qui n'est pas un contrat visuel stable. Remplacé par des
 * primitives `View` (même technique que `FilterIcon`) : une tige verticale
 * entre deux triangles pleins (astuce des bordures transparentes), dont la
 * géométrie et la couleur sont fixées par ce composant et ne dépendent plus
 * d'aucune police.
 */
function SortIcon({ disabled = false, testID }: { disabled?: boolean; testID?: string }) {
  const color = disabled ? colors.disabled : colors.primary;
  return (
    <View style={styles.sortIcon} testID={testID}>
      <View style={[styles.sortIconArrowUp, { borderBottomColor: color }]} testID={`${testID}-arrow-up`} />
      <View style={[styles.sortIconStem, { backgroundColor: color }]} testID={`${testID}-stem`} />
      <View
        style={[styles.sortIconArrowDown, { borderTopColor: color }]}
        testID={`${testID}-arrow-down`}
      />
    </View>
  );
}

// D-184 : trois commandes `108 × 32` pt.
const COMMAND_ACTION_WIDTH = 108;

function LoadingBody() {
  return (
    <View style={styles.centeredBody}>
      <ActivityIndicator
        size="large"
        color={colors.primary}
        accessibilityLabel={strings.screens.sessions.loading.accessibilityLabel}
      />
    </View>
  );
}

/**
 * Correction CAT-R03 (contre-recette iPhone, `[ChatGPT]
 * DEVICE_REVIEW_FAIL`, 2026-09-03) : le texte de l'état vide était posé
 * seul dans le corps, sans cadre — désormais présenté dans un cadre
 * dédié (surface, bordure, rayon issus des tokens DS), centré
 * horizontalement et verticalement à l'intérieur de ce cadre, lui-même
 * centré dans le corps.
 */
function EmptyBody() {
  return (
    <View style={styles.centeredBody}>
      <View style={styles.emptyStateFrame} testID="catalogue-empty-frame">
        <Text style={styles.emptyMessage}>{strings.screens.sessions.empty.message}</Text>
      </View>
    </View>
  );
}

function ErrorBody({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centeredBody}>
      <Text style={styles.errorMessage}>{strings.screens.sessions.error.message}</Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={strings.screens.sessions.error.retry}
        style={styles.retryAction}
      >
        <Text style={styles.retryLabel}>{strings.screens.sessions.error.retry}</Text>
      </Pressable>
    </View>
  );
}

/**
 * Liste du Catalogue (CE-T01-03).
 *
 * **T02-S02** — deux garanties rendues EXPLICITES plutôt que laissées aux
 * défauts de `FlatList` :
 *
 * - `scrollEnabled` : la liste reste TOUJOURS défilable. Le Catalogue n'a
 *   aucun état où le défilement serait neutralisé (contrairement à la
 *   Composition, qui le désarme pendant qu'une carte est soulevée) — le
 *   déclarer ici l'ancre dans le contrat testable de l'écran ;
 * - `showsVerticalScrollIndicator={false}` : l'indicateur vertical est
 *   masqué, la barre native se superposant aux cartes.
 *
 * La LARGEUR et la POSITION des cartes ne changent pas : `contentContainerStyle`
 * (`styles.list`) est repris strictement tel quel, et `SessionCard` conserve
 * sa propre géométrie — aucune marge, aucun padding horizontal n'est ajouté
 * ici.
 */
function ReadyBody({
  sessions,
  onOpenSession,
}: {
  sessions: readonly SessionSummary[];
  onOpenSession: (sessionId: string) => void;
}) {
  return (
    <FlatList
      data={sessions}
      keyExtractor={(session) => session.id}
      renderItem={({ item }) => (
        <SessionCard session={item} onOpen={() => onOpenSession(item.id)} />
      )}
      scrollEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      testID="catalogue-session-list"
    />
  );
}

const styles = StyleSheet.create({
  // `container`/`header`/`title`/`headerSeparator`/`contextBand` sont
  // désormais portés par le Shell Foundation partagé (`CMP-01`,
  // `@/shared/ui/ScreenShell`) — aucune redéclaration locale équivalente
  // n'est plus autorisée ici (correction Foundation, `[ChatGPT] PHASE02
  // FOUNDATION CORRECTION`).
  //
  // V2-CAT-01 : le sélecteur de segment lui-même est désormais porté par
  // `@/shared/ui/SegmentedControl` (composant canonique partagé) — cette
  // rangée ne porte plus que `Créer / Filtrer / Trier` (plan §4.1).
  // D-184 : espace `8` pt entre les trois commandes (`spacing[8]`, plutôt
  // que l'ancien `spacing[16]`).
  commandRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing[8],
    marginTop: spacing[8],
  },
  // Correction CAT-R02 (contre-recette iPhone, `[ChatGPT]
  // DEVICE_REVIEW_FAIL`, 2026-09-03) : aucun fond propre n'était déclaré
  // — la teinte pâle de la bande Context transparaissait à l'intérieur
  // du bouton. `backgroundColor: colors.background` (blanc) ajouté ;
  // bordure/icône/libellé bleus déjà conformes. D-184 : géométrie
  // `108×32`/rayon `16`/cible tactile `48`.
  createAction: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[6],
    width: COMMAND_ACTION_WIDTH,
    height: dimensions.compactSecondaryButton.visualHeight,
    borderRadius: dimensions.compactSecondaryButton.radius,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  createActionDisabled: {
    borderColor: colors.disabled,
  },
  createActionLabel: {
    ...type.button,
    color: colors.primary,
  },
  createActionLabelDisabled: {
    color: colors.disabled,
  },
  // Pictogramme `Filtrer` (`FilterIcon`) : trois traits horizontaux
  // décroissants empilés, centrés.
  filterIcon: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  filterIconBar: {
    height: 2,
    borderRadius: 1,
  },
  // Pictogramme `Trier` (`SortIcon`) : tige verticale entre deux triangles
  // pleins (astuce des bordures transparentes) — aucune dépendance à une
  // police, contrairement à un glyphe Unicode.
  sortIcon: {
    alignItems: "center",
    justifyContent: "center",
    width: 10,
    height: 14,
  },
  sortIconArrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  sortIconStem: {
    width: 2,
    height: 4,
  },
  sortIconArrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
  },
  centeredBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[16],
  },
  // Cadre de l'état vide (CAT-R03) : surface/bordure/rayon issus des
  // tokens DS déjà utilisés ailleurs (`colors.surface`, `colors.border`,
  // `dimensions.standardCard.radius`) — le texte est centré à
  // l'intérieur de ce cadre, pas seulement dans l'écran.
  emptyStateFrame: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.standardCard.radius,
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[32],
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMessage: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  errorMessage: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryAction: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  retryLabel: {
    ...type.button,
    color: colors.background,
  },
  list: {
    gap: spacing[8],
    paddingBottom: spacing[16],
  },
});
