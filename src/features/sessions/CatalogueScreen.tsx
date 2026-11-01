import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { MovementCatalogueList } from "@/features/activities/MovementCatalogueList";
import { MovementCounterToggles } from "@/features/activities/MovementCounterToggles";
import { MovementFilterSheet } from "@/features/activities/MovementFilterSheet";
import { MOVEMENT_EDIT_MODE_PARAM } from "@/features/activities/MovementScreen";
import {
  sameMovementSummary,
  toggledMovementCounter,
  type MovementCatalogueSummary,
  type MovementCounter,
} from "@/features/activities/movementCatalogueCounters";
import {
  countActiveFilters,
  EMPTY_MOVEMENT_FILTERS,
  type MovementCatalogueFilters,
} from "@/features/activities/movementCatalogueView";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { CatalogueNavigation } from "@/features/sessions/CatalogueNavigation";
import { SessionCatalogueList } from "@/features/sessions/SessionCatalogueList";
import { isSessionCatalogueFiltered, sessionCatalogueContext } from "@/features/sessions/sessionCatalogueContext";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { toggledView, type SessionCatalogueView } from "@/features/sessions/sessionCatalogueView";
import { EMPTY_SESSION_FILTERS, type SessionCatalogueFilters } from "@/features/sessions/sessionCatalogueFilters";
import { SessionFilterSheet } from "@/features/sessions/SessionFilterSheet";
import { SessionCommandRow } from "@/features/sessions/SessionCommandRow";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { strings } from "@/shared/i18n";
import { CONTEXT_ZONE_GEOMETRY, countLabel } from "@/shared/ui/catalogueContext";
import { FilterCommand } from "@/shared/ui/CatalogueCommands";
import { CatalogueContextZone } from "@/shared/ui/CatalogueContextZone";
import { CONTEXT_BAND_FADE_HEIGHT, ContextBand, FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { colors, dimensions, layout, spacing, type } from "@/shared/ui/tokens";

/**
 * Segment de TYPE de contenu du Catalogue (V2-CAT-01, D-108). Seuls `activities` et `sessions` sont fonctionnels ; `circuits` reste visible mais désactivé.
 * PRE-8 (B.3, relevé Niveaux du 25/10 §7) : `movements`, Catalogue d'entretien des Mouvements, ajouté en premier ; les autres segments sont inchangés.
 */
export type CatalogueContentType = "movements" | "sessions" | "programs";
// PRE-8 (epic E, E.4 et E.8-a, plan approuvé du 28/10) : trois segments, Mouvements / Séances /
// Programmes (visible, indisponible). Le segment Exercices est retiré ; les anciennes définitions
// restent consultables et modifiables depuis la sélection d'Exercices de la Composition (commande
// Modifier, option 1), sans migration. Créer ouvre la Composition existante sur le segment Séances.

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
  // T01-S10/V2-CAT-01 (D-108) : `Séances` sélectionné par défaut à
  // l'ouverture et après relance complète — aucun segment n'est persisté.
  const [activeSegment, setActiveSegment] = useState<CatalogueContentType>("sessions");
  // E.4 : vue « Un exercice | Plusieurs » (aucune = collection complète), état de l'écran conservé au
  // retour d'un parcours, jamais persisté (relance : collection complète).
  const [sessionView, setSessionView] = useState<SessionCatalogueView | null>(null);
  // E.6 : filtres des Séances, état de l'écran (conservé au retour, perdu au relancement) ; aucun
  // filtre : Actives. Réinitialiser ne touche pas la vue (Q-E3, Q-E4).
  const [sessionFilters, setSessionFilters] = useState<SessionCatalogueFilters>(EMPTY_SESSION_FILTERS);
  const [sessionFilterLabels, setSessionFilterLabels] = useState<readonly string[]>([]);
  const [isSessionFilterOpen, setIsSessionFilterOpen] = useState(false);
  const sessionFilterSummary =
    sessionFilterLabels.length === 0
      ? null
      : sessionFilterLabels.length === 1
        ? sessionFilterLabels[0]!
        : fillTemplate(strings.screens.sessions.catalogueFilters.activeSummary, { count: String(sessionFilterLabels.length) });
  // Recette du 28/10/2026 (q4-02) : nombre de filtres affiché quand le résumé ne tient pas.
  const sessionFilterCount =
    sessionFilterLabels.length === 0
      ? null
      : fillTemplate(
          sessionFilterLabels.length === 1
            ? strings.screens.sessions.catalogueFilters.activeSummarySingular
            : strings.screens.sessions.catalogueFilters.activeSummary,
          { count: String(sessionFilterLabels.length) },
        );
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
  // PRE-9 CAT.1 (CE-CAT-CTX-01) : compteur « familles » / « mouvements » actif (état de l'écran,
  // jamais persisté, cumulé à la recherche et aux filtres) et compteurs de la liste affichée.
  const [movementCounter, setMovementCounter] = useState<MovementCounter | null>(null);
  const [movementSummary, setMovementSummary] = useState<MovementCatalogueSummary | null>(null);
  const handleMovementSummary = useCallback((next: MovementCatalogueSummary | null) => {
    setMovementSummary((current) => (sameMovementSummary(current, next) ? current : next));
  }, []);
  // PRE-9 CAT.1 : recherche des Séances dans la zone de contexte, conservée comme les filtres.
  const [sessionQuery, setSessionQuery] = useState("");
  const movementFilterSummary =
    movementFilterLabels.length === 0
      ? null
      : movementFilterLabels.length === 1
        ? movementFilterLabels[0]!
        : fillTemplate(strings.screens.movement.catalogue.filters.activeSummary, { count: String(movementFilterLabels.length) });

  const { reload: reloadSessions, cancelPending: cancelPendingSessions } = sessionCatalogue;
  const catalogueSegmentParam = params.catalogueSegment;
  useFocusEffect(
    useCallback(() => {
      isOpeningEditorRef.current = false;
      setMovementsReloadToken((current) => current + 1);
      reloadSessions();
      // Consommé une seule fois : `setParams` l'efface immédiatement, pour
      // qu'un focus ultérieur SANS nouveau signal (retour d'édition d'une
      // Activité, par exemple) ne réapplique jamais ce forçage.
      if (catalogueSegmentParam === "sessions") {
        setActiveSegment("sessions");
        router.setParams({ catalogueSegment: undefined });
      }
      return () => {
        cancelPendingSessions();
      };
    }, [
      reloadSessions,
      cancelPendingSessions,
      catalogueSegmentParam,
      router,
    ]),
  );

  const t = strings.screens.sessions;
  const tContext = strings.screens.catalogueContext;
  const resultsLabel = (count: number) => countLabel(count, { one: tContext.resultsOne, many: tContext.resultsMany });
  // PRE-9 CAT.1 (§4, §5) : liste des Séances, nombres de vue et « N résultats » d'une même dérivation.
  const sessionContext =
    sessionCatalogueContext(sessionCatalogue.state.status === "ready" ? sessionCatalogue.state.sessions : [], {
      query: sessionQuery,
      filters: sessionFilters,
      view: sessionView,
    });
  const sessionCountsKnown = sessionCatalogue.state.status === "ready" || sessionCatalogue.state.status === "empty";
  // État filtré ou archivé : critère du panneau Filtre (Statut Archivés compris). Liste pas encore
  // chargée : place réservée (champ réduit), aucun nombre.
  const sessionResults = !isSessionCatalogueFiltered(sessionFilters)
    ? null
    : sessionCountsKnown
      ? resultsLabel(sessionContext.visible.length)
      : "";
  const movementResults =
    countActiveFilters(movementFilters) === 0 ? null : movementSummary !== null ? resultsLabel(movementSummary.displayed) : "";
  // T01-S10/V2-CAT-01 (D-108, plan §4.1) : le titre suit le segment actif —
  // `Catalogue des séances` / `Catalogue des activités` / `Catalogue des
  // circuits`, un mapping RÉEL des trois segments même si `Circuits` reste
  // désactivé et donc inatteignable via l'interface (revue 5732014381,
  // obligation 2).
  const title =
    activeSegment === "movements"
      ? strings.screens.movement.catalogue.title
      : activeSegment === "programs"
        ? t.programsTitle
        : t.title;

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

  // PRE-8 (B.3, CE-MVT-01 §3) : sur le segment Mouvements, `Créer` ouvre la fiche d'un Mouvement
  // nouveau. PRE-8 (E.4) : sur le segment Séances, `Créer` ouvre directement la Composition existante
  // (plus d'arbre d'options : le Catalogue autonome des Exercices est retiré). Même verrou de double
  // appui, réarmé au focus suivant.
  const handleCreatePress = () => {
    if (activeSegment === "movements") {
      openMovement(null);
      return;
    }
    if (isOpeningEditorRef.current) {
      return;
    }
    isOpeningEditorRef.current = true;
    // PRE-9 C.2 (CE-FMT-01 §3) : la création d'une Séance passe par « Créer », choix du modèle et du format.
    router.push("/session-model");
  };

  return (
    <ScreenShell>
      {/* PRE-9 CAT.1 (CE-CAT-CTX-01 : « Masquer le titre de page individuel dans les deux Catalogues ») :
          l'en-tête porte la navigation des Catalogues Mouvements / Séances / Programmes à la place du
          titre. Recette iPhone CAT.1 du 30/10/2026 (Hermann, cat-titre : « Adopter le style texte de
          Figma ») : libellés texte séparés par « | » (`CatalogueNavigation`), comportement inchangé. */}
      <FixedHeader
        title={title}
        content={
          <View style={styles.headerNavigation}>
            <CatalogueNavigation
              options={[
                { value: "movements", label: strings.screens.movement.catalogue.segment },
                { value: "sessions", label: t.contentTypes.sessions },
                {
                  value: "programs",
                  label: t.programsSegment,
                  disabled: true,
                  accessibilityLabel: t.programsUnavailableAccessibilityLabel,
                },
              ]}
              value={activeSegment}
              onChange={setActiveSegment}
              testID="catalogue-content-type-row"
            />
          </View>
        }
      />
      {/* Recette 3 (T-49, EXT-R3-1, D-356) : plus de trait gris entre l’en-tête et la zone
          de contexte. */}

      {/* Recette 3 (T-49, D-356) : le bord bas de la zone n’est dessiné par aucun élément.
          Recette iPhone du 29/10/2026 : le fondu des 20 % inférieurs va vers la TRANSPARENCE
          (ch. 12 : « Zone de contexte → transparent sur les 20 % inférieurs pour Catalogues »),
          porté par `ContextBand` — plus de voile blanc posé sur la couleur du Catalogue.
          PRE-9 CAT.1 (spécification du 30/10/2026, CE-CAT-CTX-01) : bande « Recherche et création »
          à deux lignes — compteurs (ligne 1, 26 sous le haut de la bande), Rechercher et
          Filtre / Tri / Créer (ligne 2, 63 sous le haut). Ordre des Mouvements [30/10/2026, Hermann :
          « rechercher, filtrer, trier puis créer »] conservé, identique pour les Séances. */}
      <ContextBand
        fadeToTransparent
        padding={{ top: CONTEXT_ZONE_GEOMETRY.paddingTop, bottom: CONTEXT_ZONE_GEOMETRY.paddingBottom }}
      >
        {activeSegment === "movements" ? (
          <CatalogueContextZone
            summary={
              movementSummary !== null ? (
                <MovementCounterToggles
                  summary={movementSummary}
                  active={movementCounter}
                  onToggle={(touched) => setMovementCounter((current) => toggledMovementCounter(current, touched))}
                />
              ) : null
            }
            results={movementResults}
            search={{
              value: movementQuery,
              onChangeText: setMovementQuery,
              placeholder: strings.screens.movement.catalogue.searchPlaceholder,
              accessibilityLabel: strings.screens.movement.catalogue.searchAccessibilityLabel,
              clearLabel: strings.screens.movement.catalogue.searchClear,
              testID: "movement-catalogue-search",
            }}
            filter={
              <FilterCommand
                label={t.filterAction}
                title={strings.screens.movement.catalogue.filters.command}
                summary={movementFilterSummary}
                clearLabel={strings.screens.movement.catalogue.filters.clearAccessibility}
                editLabel={strings.screens.movement.catalogue.filters.editAccessibility}
                onOpen={() => setIsMovementFilterOpen(true)}
                onClear={() => {
                  setMovementFilters(EMPTY_MOVEMENT_FILTERS);
                  setMovementFilterLabels([]);
                }}
                testID="catalogue-filter-action"
              />
            }
            sortLabel={t.sortAction}
            createLabel={t.createAction}
            onCreate={handleCreatePress}
          />
        ) : null}
        {activeSegment === "sessions" ? (
          <SessionCommandRow
            view={sessionView}
            onToggleView={(touched) => setSessionView((current) => toggledView(current, touched))}
            counts={
              sessionCountsKnown ? { SINGLE: sessionContext.singleCount, MULTIPLE: sessionContext.multipleCount } : null
            }
            results={sessionResults}
            query={sessionQuery}
            onChangeQuery={setSessionQuery}
            filterSummary={sessionFilterSummary}
            filterCount={sessionFilterCount}
            onOpenFilters={() => setIsSessionFilterOpen(true)}
            onResetFilters={() => {
              setSessionFilters(EMPTY_SESSION_FILTERS);
              setSessionFilterLabels([]);
            }}
            onCreate={handleCreatePress}
          />
        ) : null}
      </ContextBand>

      {isSessionFilterOpen ? (
        <SessionFilterSheet
          filters={sessionFilters}
          onApply={(filters, labels) => {
            setSessionFilters(filters);
            setSessionFilterLabels(labels);
            setIsSessionFilterOpen(false);
          }}
          onClose={() => setIsSessionFilterOpen(false)}
        />
      ) : null}

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
                sessions={sessionContext.visible}
                searching={sessionQuery.trim().length > 0}
                resetToken={movementsReloadToken}
                topInset={LIST_TOP_INSET}
                onOpenSession={(sessionId) =>
                  router.push({ pathname: "/composition", params: { sessionId } })
                }
                onChanged={reloadSessions}
              />
            ) : null}
          </>
        ) : null}
        {activeSegment === "movements" ? (
          <MovementCatalogueList
            reloadToken={movementsReloadToken}
            topInset={LIST_TOP_INSET}
            query={movementQuery}
            filters={movementFilters}
            counter={movementCounter}
            onSummaryChange={handleMovementSummary}
            onOpenMovement={openMovement}
            onCreateVariant={(variantOf, placement) => {
              if (isOpeningEditorRef.current) return;
              isOpeningEditorRef.current = true;
              router.push({ pathname: "/movement", params: { variantOf, placement } });
            }}
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
  searching,
  resetToken,
  topInset,
  onOpenSession,
  onChanged,
}: {
  /** PRE-9 CAT.1 : liste déjà dérivée (`sessionCatalogueContext` : filtres, recherche et vue). */
  sessions: readonly SessionCatalogueProjection[];
  searching: boolean;
  resetToken: number;
  topInset: number;
  onOpenSession: (sessionId: string) => void;
  onChanged: () => void;
}) {
  // PRE-8 (E.2) : carte unique ; Statut Actives par défaut (CE-T03-01 révisé), filtres en E.6.
  // E.4, E.6 : Statut d'abord (Actives par défaut), puis filtres (Q-E3), combinés à la vue.
  // PRE-9 CAT.1 : la même liste fournit les nombres de la zone de contexte (aucune autre collection).
  return (
    <SessionCatalogueList
      sessions={sessions}
      emptyMessage={searching ? strings.screens.sessions.noResult : strings.screens.sessions.noMatch}
      resetToken={resetToken}
      topInset={topInset}
      onOpenSession={onOpenSession}
      onChanged={onChanged}
    />
  );
}

/**
 * Contre-recette n° 2 du 30/10/2026 (Hermann : « Liste qui défile derrière ») : le corps remonte
 * sous la part fondue de la zone de contexte ; au repos, la première carte garde sa place (8 sous
 * la bande, comme avant), puis la liste défile derrière le dégradé.
 */
const LIST_TOP_INSET = spacing[8] + CONTEXT_BAND_FADE_HEIGHT;

const styles = StyleSheet.create({
  // `container`/`header`/`title`/`headerSeparator`/`contextBand` sont
  // désormais portés par le Shell Foundation partagé (`CMP-01`,
  // `@/shared/ui/ScreenShell`) — aucune redéclaration locale équivalente
  // n'est plus autorisée ici (correction Foundation, `[ChatGPT] PHASE02
  // FOUNDATION CORRECTION`).
  //
  // PRE-9 CAT.1 (CE-CAT-CTX-01) : la navigation des Catalogues (`CatalogueNavigation`, style texte de
  // Figma depuis la recette du 30/10) occupe la place du titre masqué, sur toute la largeur de l'en-tête.
  headerNavigation: {
    flex: 1,
  },
  // A01 : marge standard `layout.screenGutter`. Segment Mouvements : la liste porte sa marge
  // elle-même (cartes glissées et filet de famille dans la marge, B06/B10).
  body: {
    flex: 1,
    paddingHorizontal: layout.screenGutter,
    // Contre-recette n° 2 : corps remonté sous la part fondue de la bande (voir `LIST_TOP_INSET`).
    marginTop: -CONTEXT_BAND_FADE_HEIGHT,
    paddingTop: spacing[16] + CONTEXT_BAND_FADE_HEIGHT,
  },
  bodyFlush: {
    paddingHorizontal: 0,
    paddingTop: 0,
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
