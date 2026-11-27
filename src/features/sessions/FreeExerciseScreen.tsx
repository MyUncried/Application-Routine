import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

import { validateForSave, type ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import type { Movement } from "@/domain/activities/Movement";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { ExecutionParametersSheet, FREE_FADE_LAYERS, SHEET_HEADER_NEUTRAL } from "@/features/activities/ExecutionParametersSheet";
import type { MovementCatalogueEntry } from "@/features/activities/MovementCatalogueService";
import { MOVEMENT_FREE_EXERCISE_CONTEXT } from "@/features/activities/MovementScreen";
import { requestFilterSheet } from "@/features/activities/filterSheetRelay";
import { EMPTY_MOVEMENT_FILTERS, visibleMovementItems, type MovementCatalogueFilters } from "@/features/activities/movementCatalogueView";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { SelectedMovementCard } from "@/features/activities/SelectedMovementCard";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { withoutPinned } from "@/features/sessions/formatCatalogueSelection";
import { PINNED_ZONE_MAX_RATIO } from "@/features/sessions/FormatModelScreen";
import {
  exerciseOfMovement,
  FREE_EXERCISE_RECOVERY_SECONDS,
  handFreeExerciseToComposition,
  takeMovementHandedToFreeExercise,
} from "@/features/sessions/movementExercises";
import { DOMAIN_DEFAULTS, profileDefaultsOf } from "@/features/sessions/useMovementExerciseIntake";
import { strings } from "@/shared/i18n";
import { CommandCircle, FilterCommand } from "@/shared/ui/CatalogueCommands";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { ModalHeader } from "@/shared/ui/ModalHeaderActions";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";

/**
 * D-608 (D-573 point 5, Hermann, 26/11/2026 ; Formats § 9.10 ; registre ch07 D-571 (2) et D-573 (5) de la branche de documentation) —
 * création d'un exercice libre : Créer un exercice → carte « Libre » → écran « Exercice libre — Choix du mouvement » (Figma
 * `13259:25991`) → page « Exercice libre » (Figma « Exercice libre — Modale de type format » `13269:26160`), dans la même feuille native
 * que la modale « Créer un exercice » (D-605, comme un format).
 *
 * - Choix du mouvement : coque du format (zone colorée grise, titre centré « Exercice libre », accroche), recherche, Filtrer, Trier
 *   (inactif, comme au catalogue des formats), Replier / déplier les piles, catalogue des mouvements ; un seul mouvement ; ✓ inactif
 *   tant qu'aucun mouvement n'est choisi. Pas de « + Créer un mouvement » : un nom inexistant validé (touche Entrée du clavier) ouvre la
 *   fiche de création avec ce nom, comportement actuel de la création ; le mouvement enregistré revient ici et ouvre la page.
 * - Page : la feuille « Paramètres d'exécution » de l'exercice libre (`freeFormat`), rendue dans l'écran (`presentation="page"`) :
 *   mêmes champs et règles, aucun second stockage. « Changer » et Retour ramènent au choix du mouvement ; ✓ remet l'exercice à la
 *   Composition (`handFreeExerciseToComposition`) et retire les modales de création.
 *
 * Une fois créé, l'exercice se modifie depuis la Composition par la modale « Paramètres d'exécution » allégée commune.
 */
export function FreeExerciseScreen({ onClose, onDone }: { readonly onClose: () => void; readonly onDone: () => void }) {
  const router = useRouter();
  const service = useActivityDefinitionService();
  const profileService = useContext(ProfileServiceContext);
  const t = strings.executionParameters.sheet;
  const tFormat = strings.screens.formatModel;
  const tCatalogue = strings.screens.movement.catalogue;

  const [defaults, setDefaults] = useState(DOMAIN_DEFAULTS);
  useEffect(() => {
    let cancelled = false;
    if (profileService === null || profileService === undefined) return undefined;
    profileService.getProfile().then(
      (profile) => {
        if (cancelled) return;
        setDefaults(profileDefaultsOf(profile));
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [profileService]);

  const [entries, setEntries] = useState<readonly MovementCatalogueEntry[]>([]);
  // Recette iPhone du 26/11/2026 (après-midi) : relecture du catalogue après la création d'un mouvement (il y figure au retour).
  const [catalogueVersion, setCatalogueVersion] = useState(0);
  useEffect(() => {
    const catalogue = service.movementCatalogue ?? null;
    if (catalogue === null) return undefined;
    let cancelled = false;
    catalogue.listEntries().then(
      (found) => {
        if (!cancelled) setEntries(found);
      },
      (error: unknown) => console.error("Les mouvements n'ont pas pu être lus.", error),
    );
    return () => {
      cancelled = true;
    };
  }, [service, catalogueVersion]);

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<MovementCatalogueFilters>(EMPTY_MOVEMENT_FILTERS);
  const [filterLabels, setFilterLabels] = useState<readonly string[]>([]);
  const [collapsedPiles, setCollapsedPiles] = useState<ReadonlySet<string>>(new Set());
  const [pilesCollapsed, setPilesCollapsed] = useState(false);
  const [chosen, setChosen] = useState<MovementCatalogueEntry | null>(null);
  const [page, setPage] = useState<{ readonly movement: Movement; readonly levelRank: number | null; readonly id: number } | null>(null);
  const pageCount = useRef(0);
  const recoveryRef = useRef(FREE_EXERCISE_RECOVERY_SECONDS);

  const items = useMemo(() => visibleMovementItems(entries, query, filters), [entries, query, filters]);
  // Recette iPhone du 26/11/2026 (après-midi), Hermann : « Le mouvement doit être en première ligne et figé par rapport au
  // défilement du catalogue, comme pour les autres formats. » — patron de la zone figée du catalogue des formats en modification
  // (D-572, `FormatModelScreen`) : le mouvement choisi est figé sous la recherche, en état sélectionné, sans recherche ni filtre ;
  // la liste dessous ne le montre plus ; le toucher le désélectionne (il revient dans la liste).
  const pinnedEntries = useMemo(
    () => (chosen === null ? [] : [entries.find((entry) => entry.movement.id === chosen.movement.id) ?? chosen]),
    [chosen, entries],
  );
  const listedItems = useMemo(() => (chosen === null ? items : withoutPinned(items, new Set([chosen.movement.id]))), [chosen, items]);
  const windowHeight = useWindowDimensions().height;
  // Recette iPhone du 27/11/2026 (matin) : réserve de la zone d'action « Ajouter ce mouvement » en fin de liste.
  const actionZone = usePrimaryActionZone();
  // Recette iPhone du 26/11/2026 (après-midi), Hermann : fiche « Tester » trouvée pour « T » et « Te », pas pour « Tes ». La
  // recherche la trouve (`rankMovements`, début de mot) ; la liste, défilée plus bas pendant « T » / « Te », gardait sa position
  // sur une liste devenue courte et les résultats restaient hors de vue. Comme au catalogue des formats (recette du 05/11/2026,
  // s-fond), à chaque recherche ou filtre la liste repart de son début, juste sous la zone de recherche.
  const listRef = useRef<ScrollView>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ y: 0, animated: false });
  }, [query, filters]);
  const filterSummary =
    filterLabels.length === 0 ? null : filterLabels.length === 1 ? filterLabels[0]! : fillTemplate(tCatalogue.filters.activeSummary, { count: String(filterLabels.length) });

  const openPage = useCallback((movement: Movement, levelRank: number | null) => {
    Keyboard.dismiss();
    recoveryRef.current = FREE_EXERCISE_RECOVERY_SECONDS;
    pageCount.current += 1;
    setPage({ movement, levelRank, id: pageCount.current });
  }, []);

  // Mouvement créé par la fiche de création (nom inexistant validé) : la page s'ouvre avec lui.
  useFocusEffect(
    useCallback(() => {
      const created = takeMovementHandedToFreeExercise();
      if (created === null) return;
      // Recette du 26/11/2026 (après-midi) : le mouvement créé est aussi le mouvement choisi — « Changer » le retrouve figé.
      setChosen({ movement: created, level: null, exerciseCount: 0, archived: false });
      setCatalogueVersion((version) => version + 1);
      openPage(created, null);
    }, [openPage]),
  );

  // « Un nom inexistant validé crée le mouvement » : la touche Entrée sur un nom absent du catalogue ouvre la fiche de création avec
  // ce nom ; un nom existant choisit ce mouvement.
  const submitName = () => {
    const name = query.trim();
    if (name === "") return;
    const same = entries.find((entry) => !entry.archived && entry.movement.name.trim().toLocaleLowerCase("fr") === name.toLocaleLowerCase("fr"));
    if (same !== undefined) {
      setChosen(same);
      return;
    }
    router.push({ pathname: "/movement", params: { context: MOVEMENT_FREE_EXERCISE_CONTEXT, name } });
  };

  if (page !== null) {
    const parameters = exerciseOfMovement(page.movement, "free-page", defaults, true).executionParameters;
    return (
      <View style={styles.root} testID="free-exercise-page">
        <ExecutionParametersSheet
          key={page.id}
          presentation="page"
          parent={parameters}
          baseline={null}
          profileSideRecoverySecondsDefault={defaults.sideRecoverySeconds}
          exerciseSignals="absent"
          // Nombre de phases fixé par la fiche du mouvement (D-573 point 6) ; durées modifiables.
          phaseStructureLocked
          nextPhaseId={page.movement.nextPhaseId}
          recovery={{
            seconds: FREE_EXERCISE_RECOVERY_SECONDS,
            onApply: (seconds) => {
              recoveryRef.current = seconds;
            },
          }}
          freeFormat
          freeMovement={{ movement: page.movement, levelRank: page.levelRank }}
          onChangeMovement={() => setPage(null)}
          movementName={page.movement.name}
          onApply={(applied: ExecutionParameters) => {
            const validated = validateForSave(applied, null);
            handFreeExerciseToComposition({
              movement: page.movement,
              parameters: validated.ok ? validated.value : applied,
              recoverySeconds: recoveryRef.current,
            });
            onDone();
          }}
          onCancel={() => setPage(null)}
        />
      </View>
    );
  }

  const card = (entry: MovementCatalogueEntry, onPress?: () => void) => (
    <SelectedMovementCard
      key={entry.movement.id}
      movement={entry.movement}
      levelRank={entry.level?.rank ?? null}
      selected={chosen?.movement.id === entry.movement.id}
      // Un seul mouvement : toucher une carte la choisit (et retire le choix précédent) ; la toucher de nouveau la retire.
      onPress={onPress ?? (() => setChosen((current) => (current?.movement.id === entry.movement.id ? null : entry)))}
      onPhotoPress={() => router.push({ pathname: "/movement-sheet", params: { movementId: entry.movement.id } })}
      testID={`free-exercise-card-${entry.movement.id}`}
    />
  );

  return (
    <View style={styles.root} testID="free-exercise-choice">
      {/* Recette iPhone du 26/11/2026 (soir), Hermann : « la liste la chevauche » (zone figée) ; recherche « ko » dès qu'il reste au
          plus deux résultats (« Tes », « bo », « rol », « etirement du m »…). Cause : dans une feuille native (`formSheet`),
          react-native-screens cherche une ScrollView par le chemin des PREMIERS sous-vues natives de l'écran et lui impose le cadre
          entier de la feuille (`RNSScreen.mm`, `applyFrameCorrectionForDescendantScrollView`). Fabric monte les enfants par zIndex
          croissant : depuis les zIndex de la zone de contexte, du fondu et de la recherche (8098288b), le premier enfant natif est la
          liste — tirée en haut de la feuille, ses premiers résultats passent sous la zone de contexte et la recherche — ou, avec un
          mouvement choisi, la ScrollView de la zone figée, étirée sur toute la hauteur et recouverte par la liste. Cette vue vide,
          non aplatie, est le premier enfant natif : aucune ScrollView n'est trouvée, chaque zone garde son cadre. */}
      <View collapsable={false} pointerEvents="none" style={styles.sheetScrollGuard} testID="free-exercise-sheet-scroll-guard" />
      <View style={[styles.context, { backgroundColor: SHEET_HEADER_NEUTRAL }]} testID="free-exercise-choice-context">
        <View style={styles.headerTop} />
        {/* Recette iPhone du 27/11/2026 (matin), Hermann : « Le bouton "valider" doit rester griser quand le catalogue est ouvert. » —
            ✓ toujours inactif sur le catalogue ; le mouvement passe à la page par « Ajouter ce mouvement » (zone d'action du bas).
            [✓ actif dès qu'un mouvement est choisi, ouvrant la page — remplacé le 27/11/2026.] */}
        <ModalHeader
          title={t.freeTitle}
          onCancel={onClose}
          cancelLabel={t.freeChooseCloseAccessibilityLabel}
          onValidate={() => undefined}
          validateEnabled={false}
          validateLabel={t.freeChooseValidateAccessibilityLabel}
          titleStyle={styles.title}
          testIDPrefix="free-exercise-choice"
        />
        <Text style={styles.tagline} testID="free-exercise-choice-tagline">
          {t.freeTagline}
        </Text>
      </View>
      <View pointerEvents="none" style={styles.fade}>
        {FREE_FADE_LAYERS.map((layer) => (
          <View key={layer.height} style={[styles.fadeLayer, { height: layer.height, opacity: layer.opacity, backgroundColor: SHEET_HEADER_NEUTRAL }]} />
        ))}
      </View>
      {/* Recette iPhone du 26/11/2026 : le catalogue défilait par-dessus la zone de contexte. Comme au catalogue des formats, la liste
          passe sous la zone de contexte et sous la recherche figée (fond blanc), et disparaît à leur bord. */}
      <View style={styles.searchBand} testID="free-exercise-search-zone">
      <View style={styles.searchZone}>
        <Text style={styles.sectionLabel}>{t.freeMovement}</Text>
        <View style={styles.commands}>
          <View style={styles.field}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={tFormat.searchPlaceholder}
              placeholderTextColor={SEARCH_PLACEHOLDER}
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              onSubmitEditing={submitName}
              style={[styles.searchInput, query.length > 0 ? styles.searchInputWithClear : styles.searchInputEmpty]}
              accessibilityLabel={tCatalogue.searchAccessibilityLabel}
              testID="free-exercise-search"
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => setQuery("")}
                accessibilityRole="button"
                accessibilityLabel={tCatalogue.searchClear}
                hitSlop={8}
                style={styles.searchClear}
                testID="free-exercise-search-clear"
              >
                <KodjoIcon name="control-close" size={12} />
              </Pressable>
            ) : null}
          </View>
          <FilterCommand
            label={strings.screens.sessions.filterAction}
            title={tCatalogue.filters.command}
            summary={filterSummary}
            clearLabel={tCatalogue.filters.clearAccessibility}
            editLabel={tCatalogue.filters.editAccessibility}
            onOpen={() => {
              requestFilterSheet({
                kind: "movements",
                filters,
                onApply: (next, labels) => {
                  setFilters(next);
                  setFilterLabels(labels);
                },
              });
              router.push("/catalogue-filters");
            }}
            onClear={() => {
              setFilters(EMPTY_MOVEMENT_FILTERS);
              setFilterLabels([]);
            }}
            testID="free-exercise-filter"
          />
          <CommandCircle label={strings.screens.sessions.sortAction} icon="sort" disabled testID="free-exercise-sort" />
          <Pressable
            onPress={() => {
              setCollapsedPiles(pilesCollapsed ? new Set() : new Set(items.flatMap((item) => (item.kind === "PILE" ? [item.key] : []))));
              setPilesCollapsed((value) => !value);
            }}
            accessibilityRole="button"
            accessibilityLabel={pilesCollapsed ? tFormat.expandPiles : tFormat.collapsePiles}
            accessibilityState={{ selected: pilesCollapsed }}
            hitSlop={5}
            style={[styles.pilesToggle, pilesCollapsed ? styles.pilesToggleOn : null]}
            testID="free-exercise-piles"
          >
            <View style={[styles.pilesGlyph, pilesCollapsed ? styles.pilesGlyphOn : null]} />
            <View style={[styles.pilesGlyph, pilesCollapsed ? styles.pilesGlyphOn : null]} />
            <View style={[styles.pilesGlyph, pilesCollapsed ? styles.pilesGlyphOn : null]} />
          </Pressable>
        </View>
      </View>
      </View>
      {/* Recette iPhone du 26/11/2026 (après-midi) : zone figée du mouvement choisi, sous la recherche — même patron et mêmes valeurs
          que la zone figée du catalogue des formats en modification (D-572) : fond blanc opaque, plafonnée à environ 40 % de la
          hauteur, mêmes retrait et écart que les cartes de la liste, marge sous la carte ; la liste défile dessous. */}
      {pinnedEntries.length > 0 ? (
        <View style={[styles.pinnedZone, { maxHeight: windowHeight * PINNED_ZONE_MAX_RATIO }]} testID="free-exercise-pinned">
          <ScrollView style={styles.pinnedScroll} contentContainerStyle={styles.pinnedContent} keyboardShouldPersistTaps="handled" testID="free-exercise-pinned-scroll">
            {pinnedEntries.map((entry) => (
              <View key={entry.movement.id} style={styles.single}>
                <SelectedMovementCard
                  movement={entry.movement}
                  levelRank={entry.level?.rank ?? null}
                  selected
                  onPress={() => setChosen(null)}
                  onPhotoPress={() => router.push({ pathname: "/movement-sheet", params: { movementId: entry.movement.id } })}
                  testID={`free-exercise-pinned-${entry.movement.id}`}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
      <ScrollView
        ref={listRef}
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: actionZone.scrollReserve }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        testID="free-exercise-list"
      >
        {query.trim().length > 0 && listedItems.length === 0 ? (
          <Text style={styles.noResult} testID="free-exercise-empty">
            {tFormat.noSearchResult}
          </Text>
        ) : null}
        {listedItems.map((item) => {
          if (item.kind === "SINGLE") {
            return (
              <View key={item.key} style={styles.single}>
                {card(item.entry)}
              </View>
            );
          }
          const collapsed = collapsedPiles.has(item.key);
          const top = item.members[0]!;
          return (
            <View key={item.key} style={styles.family} testID={`free-exercise-family-${item.key}`}>
              {item.members.length > 1 ? (
                <Pressable
                  onPress={() =>
                    setCollapsedPiles((current) => {
                      const next = new Set(current);
                      if (next.has(item.key)) next.delete(item.key);
                      else next.add(item.key);
                      return next;
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={collapsed ? tFormat.expandPiles : tFormat.collapsePiles}
                  hitSlop={8}
                  style={styles.familyRail}
                  testID={`free-exercise-family-${item.key}-rail`}
                >
                  <View style={styles.familyRailLine} />
                </Pressable>
              ) : null}
              {collapsed
                ? // Pile repliée : la carte du dessus déplie la pile, sans changer le choix.
                  card(top, () => setCollapsedPiles((current) => new Set([...current].filter((key) => key !== item.key))))
                : item.members.map((entry) => card(entry))}
            </View>
          );
        })}
      </ScrollView>
      {/* Recette iPhone du 27/11/2026 (matin), Hermann : « Ajouter le bouton d'action en bas du catalogue "Ajouter ce mouvement". » —
          zone d'action partagée du catalogue des formats (`format-catalogue-add`) ; inactive tant qu'aucun mouvement n'est choisi ;
          valide le mouvement choisi et ouvre la page (le catalogue se referme).
          Réponse de Hermann du 27/11/2026 (lot 24, « sans mouvement choisi, remplacer le bouton grisé par "Fermer sans sélectionner" ? » :
          « Oui ») : sans choix, le bouton est actif, s'intitule « Fermer sans sélectionner » et ferme comme la croix (règle du catalogue
          des formats du 06/11/2026). [Bouton inactif sans choix — remplacé.] */}
      <PrimaryActionZone onContentHeightChange={actionZone.onContentHeightChange} testID="free-exercise-bottom-action">
        <PrimaryActionButton
          label={chosen === null ? tFormat.closeWithoutSelecting : t.freeChooseAdd}
          onPress={() => {
            if (chosen === null) onClose();
            else openPage(chosen.movement, chosen.level?.rank ?? null);
          }}
          testID="free-exercise-add"
        />
      </PrimaryActionZone>
    </View>
  );
}

/** Valeurs du catalogue des formats (`FormatModelScreen`), mêmes écrans dans Figma. */
const PANEL = "#F9FAFC";
const LABEL = "#141414";
const SECTION = "#595E66";
const VALUE_COLOR = "#0508E5";
const SEARCH_PLACEHOLDER = "#B4B8C2";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF", overflow: "hidden" },
  // Recette du 26/11/2026 (soir) : premier enfant natif sans ScrollView (voir le rendu) ; aucune place dans la mise en page.
  sheetScrollGuard: { height: 0 },
  // Zone de contexte, puis son fondu, puis la recherche figée, au-dessus de la liste qui défile dessous.
  context: { zIndex: 3 },
  // Place de la poignée de la feuille des paramètres : en-tête à la même hauteur que la page.
  headerTop: { height: 12 },
  title: { fontSize: 18 },
  // Accroche des modales de type format (Mali Medium Italic 14/20, #5C636E), comme la page.
  tagline: { fontFamily: "Mali_500Medium_Italic", fontSize: 14, lineHeight: 20, color: "#5C636E", textAlign: "center", paddingHorizontal: 8, paddingBottom: 8 },
  fade: { height: 12, marginBottom: -12, zIndex: 2 },
  fadeLayer: { position: "absolute", top: 0, left: 0, right: 0 },
  searchBand: { zIndex: 1, backgroundColor: "#FFFFFF" },
  searchZone: { marginHorizontal: 16, marginTop: 12, gap: 8, marginBottom: 8 },
  sectionLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: SECTION },
  commands: { flexDirection: "row", alignItems: "center", gap: 8 },
  field: { flex: 1, justifyContent: "center" },
  searchInput: { height: 44, borderRadius: 12, backgroundColor: PANEL, paddingHorizontal: 16, fontFamily: "Inter_400Regular", fontSize: 16, color: LABEL },
  searchInputEmpty: { fontSize: 14 },
  searchInputWithClear: { paddingRight: 36 },
  searchClear: { position: "absolute", right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: "#DDE0E6", alignItems: "center", justifyContent: "center" },
  pilesToggle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: "#C9CDD6", alignItems: "center", justifyContent: "center", gap: 2 },
  pilesToggleOn: { borderColor: VALUE_COLOR },
  pilesGlyph: { width: 14, height: 3, borderRadius: 1.5, borderWidth: 1, borderColor: "#7A7F8C" },
  pilesGlyphOn: { borderColor: VALUE_COLOR },
  // Recette du 26/11/2026 (après-midi) : zone figée du mouvement choisi, valeurs de `FormatModelScreen` (D-572 : `pinnedZone`,
  // `pinnedScroll`, `pinnedContent`, marge de 8 sous la dernière carte).
  pinnedZone: { backgroundColor: "#FFFFFF" },
  pinnedScroll: { flexGrow: 0 },
  pinnedContent: { marginHorizontal: 16, gap: 8, paddingTop: 4, paddingBottom: 8 },
  list: { flex: 1, overflow: "hidden" },
  listContent: { gap: 8, paddingTop: 4, paddingHorizontal: 16, paddingBottom: 24 },
  noResult: { paddingHorizontal: 4, paddingVertical: 4, fontFamily: "Inter_400Regular", fontSize: 13, color: LABEL },
  single: { paddingLeft: 8 },
  family: { gap: 8, paddingLeft: 8 },
  familyRail: { position: "absolute", left: -6, top: 26, bottom: 26, width: 16, alignItems: "center", zIndex: 1 },
  familyRailLine: { width: 2, flex: 1, borderRadius: 1, backgroundColor: "#B9BDF5" },
});
