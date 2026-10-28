import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ActivityCatalogueList } from "@/features/activities/ActivityCatalogueList";
import { CatalogueCreateOptions } from "@/features/activities/CatalogueCreateOptions";
import { MovementCatalogueList } from "@/features/activities/MovementCatalogueList";
import { MovementFilterSheet } from "@/features/activities/MovementFilterSheet";
import { MOVEMENT_EDIT_MODE_PARAM } from "@/features/activities/MovementScreen";
import { EMPTY_MOVEMENT_FILTERS, type MovementCatalogueFilters } from "@/features/activities/movementCatalogueView";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { useActivityCatalogue } from "@/features/activities/useActivityCatalogue";
import { SessionCatalogueList } from "@/features/sessions/SessionCatalogueList";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { strings } from "@/shared/i18n";
import { CatalogueSearchField, CommandCircle, FilterCommand } from "@/shared/ui/CatalogueCommands";
import { ContextBand, FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { colors, dimensions, layout, spacing, type } from "@/shared/ui/tokens";

/**
 * Segment de TYPE de contenu du Catalogue (V2-CAT-01, D-108). Seuls `activities` et `sessions` sont fonctionnels ; `circuits` reste visible mais désactivé.
 * PRE-8 (B.3, relevé Niveaux du 25/10 §7) : `movements`, Catalogue d'entretien des Mouvements, ajouté en premier ; les autres segments sont inchangés.
 */
export type CatalogueContentType = "movements" | "activities" | "sessions" | "circuits";

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
  // envoyé exclusivement par `CompositionScreen.handleSave` (ex-`CategoriesScreen`, supprimé par Q54) (`dismissTo`)
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
  // PRE-4 story 4.1 (AC1) : verrou synchrone contre le double appui sur
  // l'ouverture de l'Éditeur, en création (`Créer`, option `Un nouvel
  // exercice`) comme en modification (carte Exercice). Armé au premier appui,
  // avant tout rendu ; réarmé au focus suivant de l'écran (retour de
  // l'Éditeur), jamais au blur : deux appuis rapprochés, même sur deux
  // points d'entrée différents, n'empilent qu'un seul Éditeur.
  const isOpeningEditorRef = useRef(false);
  // PRE-8 (B.3) : relecture du Catalogue des Mouvements à chaque retour au premier plan.
  const [movementsReloadToken, setMovementsReloadToken] = useState(0);
  // PRE-8 (B.7, arbitrage Q2 du 27/10) : filtres des Mouvements conservés pendant la session (état de
  // l'écran, jamais persisté), réinitialisés au relancement ; aucun filtre : Actifs seul.
  const [movementFilters, setMovementFilters] = useState<MovementCatalogueFilters>(EMPTY_MOVEMENT_FILTERS);
  const [isMovementFilterOpen, setIsMovementFilterOpen] = useState(false);
  // Recette A/B (D05) : libellés des critères choisis, pour le résumé de la commande étendue.
  const [movementFilterLabels, setMovementFilterLabels] = useState<readonly string[]>([]);
  // Recette A/B (D02) : recherche des Mouvements dans la zone de contexte, conservée pendant la
  // session comme les filtres.
  const [movementQuery, setMovementQuery] = useState("");
  const movementFilterSummary =
    movementFilterLabels.length === 0
      ? null
      : movementFilterLabels.length === 1
        ? movementFilterLabels[0]!
        : fillTemplate(strings.screens.movement.catalogue.filters.activeSummary, { count: String(movementFilterLabels.length) });

  const { reload: reloadSessions, cancelPending: cancelPendingSessions } = sessionCatalogue;
  const { reload: reloadActivities, cancelPending: cancelPendingActivities } = activityCatalogue;
  const catalogueSegmentParam = params.catalogueSegment;
  useFocusEffect(
    useCallback(() => {
      isOpeningEditorRef.current = false;
      setMovementsReloadToken((current) => current + 1);
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
    activeSegment === "movements"
      ? strings.screens.movement.catalogue.title
      : activeSegment === "activities"
      ? strings.screens.activities.title
      : activeSegment === "circuits"
        ? t.circuitsTitle
        : t.title;

  // Navigation unique vers l'Éditeur au Catalogue (CC, MC) : `"new"` pour la
  // branche directe de `Créer` (segment Exercices, Q33) et l'option `Un nouvel
  // exercice`, l'identifiant de la Définition pour une carte ; même verrou.
  const openExerciseEditor = (catalogueDefinitionId: string) => {
    if (isOpeningEditorRef.current) {
      return;
    }
    isOpeningEditorRef.current = true;
    router.push({ pathname: "/exercise", params: { catalogueDefinitionId } });
  };

  const openMovement = (movementId: string | null) => {
    if (isOpeningEditorRef.current) {
      return;
    }
    isOpeningEditorRef.current = true;
    // Recette A/B (F07) : depuis le Catalogue des Mouvements, la fiche s’ouvre directement en
    // édition (un Mouvement archivé reste consultable seulement, B.8).
    router.push(
      movementId === null ? "/movement" : { pathname: "/movement", params: { movementId, mode: MOVEMENT_EDIT_MODE_PARAM } },
    );
  };

  // PRE-4 story 4.1 (AC1, décision Q33 de Hermann du 2026-10-17) : sur le
  // segment Exercices, `Créer` ouvre directement l'Éditeur, sans liste
  // d'options, sans voile ni `Annuler` intermédiaire. Sur les autres segments,
  // la liste d'options `CatalogueCreateOptions` reste le comportement de
  // départ, inchangé. Le Catalogue reste monté sous l'Éditeur (pile) : au
  // retour, le segment et la position de défilement sont ceux de l'aller.
  const handleCreatePress = () => {
    // PRE-8 (B.3, CE-MVT-01 §3) : sur le segment Mouvements, `Créer` ouvre la fiche d'un
    // Mouvement nouveau (aucun Exercice ni Séance créé), même verrou de double appui.
    if (activeSegment === "movements") {
      openMovement(null);
      return;
    }
    if (activeSegment === "activities") {
      openExerciseEditor("new");
      return;
    }
    setIsCreateTreeOpen(true);
  };

  return (
    <ScreenShell>
      <FixedHeader title={title} />
      {/* Recette 3 (T-49, EXT-R3-1, D-356) : plus de trait gris entre l’en-tête et la zone
          de contexte. */}

      <ContextBand>
        {/* Recette 3 (T-49, D-356) : le bord bas de la zone n’est dessiné par aucun élément —
            c’est l’arête nette entre la bande et le fond blanc. Fondu vers le blanc sur les
            20 % inférieurs (ch. 12 : « Zone de contexte → transparent sur les 20 % inférieurs
            pour Catalogues »), en couches superposées (aucun interstice), sur la couleur
            propre du Catalogue ; sous le contenu, sans interaction ni VoiceOver. */}
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.contextBandFade}
          testID="catalogue-context-band-fade"
        >
          {CONTEXT_BAND_FADE_LAYERS.map((layer) => (
            <View key={layer.top} style={[styles.contextBandFadeLayer, { top: layer.top, opacity: layer.opacity }]} />
          ))}
        </View>
        <SegmentedControl
          options={[
            { value: "movements", label: strings.screens.movement.catalogue.segment },
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
        {/* Recette A/B (D01, D02, D04, D05 ; ch13 §4.5) : commandes rondes 34, Rechercher sur la même
            rangée (segment Mouvements), Filtrer étendu avec résumé quand un critère est actif. */}
        <View style={styles.commandRow} testID="catalogue-command-row">
          {activeSegment === "movements" ? (
            <CatalogueSearchField
              value={movementQuery}
              onChangeText={setMovementQuery}
              placeholder={strings.screens.movement.catalogue.searchPlaceholder}
              accessibilityLabel={strings.screens.movement.catalogue.searchAccessibilityLabel}
              clearLabel={strings.screens.movement.catalogue.searchClear}
              testID="movement-catalogue-search"
            />
          ) : null}
          <CommandCircle label={t.createAction} icon="create" onPress={handleCreatePress} testID="catalogue-create-action" />
          {/* PRE-8 (B.7) : Filtrer est actif sur le seul segment Mouvements ; inchangé ailleurs. */}
          <FilterCommand
            label={t.filterAction}
            title={strings.screens.movement.catalogue.filters.command}
            summary={activeSegment === "movements" ? movementFilterSummary : null}
            clearLabel={strings.screens.movement.catalogue.filters.clearAccessibility}
            editLabel={strings.screens.movement.catalogue.filters.editAccessibility}
            disabled={activeSegment !== "movements"}
            onOpen={() => setIsMovementFilterOpen(true)}
            onClear={() => {
              setMovementFilters(EMPTY_MOVEMENT_FILTERS);
              setMovementFilterLabels([]);
            }}
            testID="catalogue-filter-action"
          />
          <CommandCircle label={t.sortAction} icon="sort" disabled testID="catalogue-sort-action" />
        </View>
      </ContextBand>

      <CatalogueCreateOptions
        visible={isCreateTreeOpen}
        onSelectNewActivity={() => {
          setIsCreateTreeOpen(false);
          openExerciseEditor("new");
        }}
        onSelectNewSession={() => {
          setIsCreateTreeOpen(false);
          router.push("/composition");
        }}
        onCancel={() => setIsCreateTreeOpen(false)}
      />

      {isMovementFilterOpen ? (
        <MovementFilterSheet
          filters={movementFilters}
          onApply={(filters, labels) => {
            setMovementFilters(filters);
            setMovementFilterLabels(labels);
            setIsMovementFilterOpen(false);
          }}
          onClose={() => setIsMovementFilterOpen(false)}
        />
      ) : null}

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
        style={[
          styles.body,
          activeSegment === "movements" || (activeSegment === "sessions" && sessionCatalogue.state.status === "ready")
            ? styles.bodyFlush
            : null, { paddingBottom: navigationBarTotalHeight() }]}
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
        {activeSegment === "movements" ? (
          <MovementCatalogueList
            reloadToken={movementsReloadToken}
            query={movementQuery}
            filters={movementFilters}
            onOpenMovement={openMovement}
            onCreateVariant={(variantOf, placement) => {
              if (isOpeningEditorRef.current) return;
              isOpeningEditorRef.current = true;
              router.push({ pathname: "/movement", params: { variantOf, placement } });
            }}
          />
        ) : null}
        {activeSegment === "activities" ? (
          <ActivityCatalogueList
            state={activityCatalogue.state}
            onRetry={activityCatalogue.reload}
            onOpenDefinition={openExerciseEditor}
          />
        ) : null}
      </View>
    </ScreenShell>
  );
}

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
  sessions: readonly SessionCatalogueProjection[];
  onOpenSession: (sessionId: string) => void;
}) {
  // PRE-8 (E.2) : carte unique ; Statut Actives par défaut (CE-T03-01 révisé), filtres en E.6.
  const visible = sessions.filter((session) => session.status === "ACTIVE");
  return (
    <SessionCatalogueList
      sessions={visible}
      emptyMessage={strings.screens.sessions.noMatch}
      onOpenSession={onOpenSession}
    />
  );
}

/**
 * Recette 3 (T-49, D-356) : fondu figé de la zone de contexte (20 % inférieurs), mêmes
 * valeurs que l’éditeur et la Composition — couches superposées dont l’opacité cumulée
 * suit la rampe 0 → 1.
 */
const CONTEXT_BAND_FADE_SHARE = "20%";
const CONTEXT_BAND_FADE_LAYER_COUNT = 12;
const CONTEXT_BAND_FADE_LAYERS = Array.from({ length: CONTEXT_BAND_FADE_LAYER_COUNT }, (_, index) => {
  const before = index / CONTEXT_BAND_FADE_LAYER_COUNT;
  const after = (index + 1) / CONTEXT_BAND_FADE_LAYER_COUNT;
  return {
    top: `${((index / CONTEXT_BAND_FADE_LAYER_COUNT) * 100).toFixed(4)}%` as `${number}%`,
    opacity: Number((1 - (1 - after) / (1 - before)).toFixed(4)),
  };
});

const styles = StyleSheet.create({
  contextBandFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: CONTEXT_BAND_FADE_SHARE,
  },
  contextBandFadeLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
  // `container`/`header`/`title`/`headerSeparator`/`contextBand` sont
  // désormais portés par le Shell Foundation partagé (`CMP-01`,
  // `@/shared/ui/ScreenShell`) — aucune redéclaration locale équivalente
  // n'est plus autorisée ici (correction Foundation, `[ChatGPT] PHASE02
  // FOUNDATION CORRECTION`).
  //
  // V2-CAT-01 : le sélecteur de segment lui-même est désormais porté par
  // `@/shared/ui/SegmentedControl` (composant canonique partagé) — cette
  // rangée ne porte plus que `Créer / Filtrer / Trier` (plan §4.1).
  // Recette A/B (D01, ch13 §4.5) : commandes rondes de `CatalogueCommands`, écart visuel 12,
  // alignées à droite ; le champ Rechercher (segment Mouvements) occupe la largeur restante.
  commandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: dimensions.catalogueCommand.gap,
    // Recette A/B du 27/10 (remarque 9) : écart de 8 sous les segments, rétabli (retiré par erreur
    // en B.9 ; valeur de `main`).
    marginTop: spacing[8],
  },
  // A01 : marge standard `layout.screenGutter`. Segment Mouvements : la liste porte sa marge
  // elle-même (cartes glissées et filet de famille dans la marge, B06/B10).
  body: {
    flex: 1,
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing[16],
  },
  bodyFlush: {
    paddingHorizontal: 0,
    paddingTop: spacing[8],
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
});
