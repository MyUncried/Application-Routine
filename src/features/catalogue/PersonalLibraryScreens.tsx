/**
 * Bibliothèques personnelles (12/11/2026) — décision de Hermann : « Suivre les écrans Figma, tu peux commencer ».
 *
 * - « Créer une bibliothèque » 12206:26111 (vide) et 12206:26333 (nom saisi) : en-tête Fermer et menu « … » inactif ; nom
 *   à saisir dans la zone de contexte (« Nommer la bibliothèque ») ; Rechercher, Filtre, Tri (indisponible, comme au
 *   Catalogue) et « Ajouter des mouvements » (list-plus) ; « Tout sélectionner » ; Mouvements du Catalogue en cartes,
 *   sélectionnées par fond #EAEAFF et contour bleu ; « Créer (N) », inactif sans nom ou sans Mouvement.
 * - « Ma bibliothèque » 12210:26150 : Retour ; nom de la Bibliothèque ; Mouvements membres (fiche ouverte au toucher) ;
 *   list-plus → « Modifier » ; menu « … » 12213:26248 : Partager la bibliothèque, Exporter un fichier, Supprimer la
 *   bibliothèque (rouge).
 * - « Modifier » 12217:26131 : nom modifiable souligné, tous les Mouvements, membres sélectionnés, « Valider ».
 * - « Partager » 12217:26236 : « Vers mon PC » ; utilisateurs, espaces et Publique grisés, « Disponible avec un compte
 *   KODJO. ».
 *
 * Interprétation des maquettes (signalée à Hermann) : list-plus est une bascule. Sélectionné, la liste montre tout le
 * Catalogue à cocher ; normal, seulement les Mouvements choisis (vide au départ : 12206:26111). « Tout sélectionner »
 * coche les Mouvements affichés (recherche et filtres appliqués) ; il est grisé lorsqu'il n'a rien à cocher.
 * L'ordre des membres est celui du Catalogue (aucun réordonnancement dans les maquettes).
 *
 * Réutilise sans les recopier : la liste du Catalogue des Mouvements (`MovementCatalogueList`), sa zone de contexte
 * (`CatalogueContextZone`, recherche, Filtre, Tri), la feuille native des Filtres, l'en-tête fixe et la zone d'action
 * principale. Menu « … » : `Menu` SwiftUI natif d'`@expo/ui` (primitive native, comme le menu des niveaux).
 */
import { Button as SwiftUIButton, Host, Menu, RNHostView, Section } from "@expo/ui/swift-ui";
import { accessibilityLabel as swiftUIAccessibilityLabel, disabled as swiftUIDisabled } from "@expo/ui/swift-ui/modifiers";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  DuplicateLibraryTitleError,
  normalizeLibraryTitle,
  personalLibraryIssue,
  type PersonalLibrary,
} from "@/domain/catalogue/personalLibrary";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { MovementCatalogueList } from "@/features/activities/MovementCatalogueList";
import { requestFilterSheet } from "@/features/activities/filterSheetRelay";
import type { MovementCatalogueSummary } from "@/features/activities/movementCatalogueCounters";
import type { MovementCatalogueEntry } from "@/features/activities/MovementCatalogueService";
import {
  countActiveFilters,
  EMPTY_MOVEMENT_FILTERS,
  visibleMovementItems,
  type MovementCatalogueFilters,
} from "@/features/activities/movementCatalogueView";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { LIBRARY_COLORS, LIBRARY_TEXT, LibraryScreen, Paragraph } from "@/features/catalogue/libraryUi";
import { useLibraryServices } from "@/features/catalogue/useLibraryServices";
import { strings } from "@/shared/i18n";
import { CommandCircle, FilterCommand } from "@/shared/ui/CatalogueCommands";
import { CatalogueContextZone } from "@/shared/ui/CatalogueContextZone";
import { CONTEXT_ZONE_GEOMETRY, countLabel } from "@/shared/ui/catalogueContext";
import { KodjoIcon, type KodjoIconName } from "@/shared/ui/KodjoIcon";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { CONTEXT_BAND_FADE_HEIGHT, ContextBand, FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";

const L = strings.libraries.personal;
const NAME_PLACEHOLDER = L.namePlaceholder;
/** Message « Nom déjà utilisé » : nom normalisé comme le domaine (`duplicateLibraryTitleMessage`). */
const duplicateTitleMessage = (title: string) => fillTemplate(L.duplicateMessage, { title: normalizeLibraryTitle(title) });
/** Hauteur propre du nom (texte 20, jambages compris), centrée sur la ligne 1 de 17 de la zone de contexte. */
const NAME_BOX_HEIGHT = 28;
/** Figma 12206:26333 : zone de contexte #EAEAFF (même lilas que le Profil et le Catalogue des Séances). */
const LIBRARY_CONTEXT = colors.catalogueSessionsContext;
/** Liste de « Ma bibliothèque » remontée sous la part fondue de la zone, comme au Catalogue (`LIST_TOP_INSET`). */
const LIST_TOP_INSET = spacing[8] + CONTEXT_BAND_FADE_HEIGHT;

// ——— Lecture des Bibliothèques ———

function usePersonalLibraries() {
  const { services } = useLibraryServices();
  const [libraries, setLibraries] = useState<readonly PersonalLibrary[] | null>(null);
  const [authorId, setAuthorId] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (!services) return;
      let cancelled = false;
      void (async () => {
        const [author, list] = [await services.personal.authorId(), await services.personal.list()];
        if (!cancelled) {
          setAuthorId(author);
          setLibraries(list);
        }
      })().catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [services]),
  );
  return { services, libraries, authorId };
}

// ——— Recherche et filtres (comme le Catalogue des Mouvements) ———

function useCatalogueQuery() {
  const router = useRouter();
  const tCatalogue = strings.screens.movement.catalogue;
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<MovementCatalogueFilters>(EMPTY_MOVEMENT_FILTERS);
  const [filterLabels, setFilterLabels] = useState<readonly string[]>([]);
  const [summary, setSummary] = useState<MovementCatalogueSummary | null>(null);
  const filterSummary =
    filterLabels.length === 0
      ? null
      : filterLabels.length === 1
        ? filterLabels[0]!
        : fillTemplate(tCatalogue.filters.activeSummary, { count: String(filterLabels.length) });
  const tContext = strings.screens.catalogueContext;
  const results =
    countActiveFilters(filters) === 0
      ? null
      : summary !== null
        ? countLabel(summary.displayed, { one: tContext.resultsOne, many: tContext.resultsMany })
        : "";
  const filter = (testID: string, disabled = false) => (
    <FilterCommand
      disabled={disabled}
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
      testID={testID}
    />
  );
  const search = (testID: string) => ({
    value: query,
    onChangeText: setQuery,
    placeholder: tCatalogue.searchPlaceholder,
    accessibilityLabel: tCatalogue.searchAccessibilityLabel,
    clearLabel: tCatalogue.searchClear,
    testID,
  });
  const onSummaryChange = useCallback((next: MovementCatalogueSummary | null) => setSummary(next), []);
  return { query, filters, results, filter, search, onSummaryChange };
}

// ——— Menu « … » de l'écran (12233:26280 inactif, 12191:2106 actif ; 12213:26248) ———

export type ScreenMenuItem = {
  readonly label: string;
  readonly onPress: () => void;
  readonly destructive?: boolean;
  readonly disabled?: boolean;
  readonly testID: string;
};

/** Bouton « … » 40 × 32 de l'en-tête ; sans entrée : inactif (Créer une bibliothèque). Menu natif SwiftUI sur iOS. */
export function ScreenMenuButton({ items, testID }: { readonly items: readonly ScreenMenuItem[]; readonly testID: string }) {
  const active = items.length > 0;
  const icon = <KodjoIcon name={active ? "screen-menu-active" : "screen-menu-inactive"} testID={`${testID}-icon`} />;
  if (!active || Platform.OS !== "ios") {
    return (
      <View
        accessibilityRole="button"
        accessibilityLabel={L.menu}
        accessibilityState={{ disabled: true }}
        style={styles.menuButton}
        testID={testID}
      >
        {icon}
      </View>
    );
  }
  return (
    <View style={styles.menuButton} testID={testID}>
      <Host matchContents>
        <Menu
          label={
            <RNHostView matchContents>
              <View pointerEvents="none">{icon}</View>
            </RNHostView>
          }
          modifiers={[swiftUIAccessibilityLabel(L.menu)]}
        >
          {/* 12215:26136 : séparateur avant l'action destructive — deux sections du menu natif. */}
          {[items.filter((item) => !item.destructive), items.filter((item) => item.destructive)]
            .filter((group) => group.length > 0)
            .map((group, index) => (
              <Section key={index}>
                {group.map((item) => (
                  <SwiftUIButton
                    key={item.testID}
                    label={item.label}
                    {...(item.destructive ? { role: "destructive" as const } : {})}
                    modifiers={item.disabled ? [swiftUIDisabled(true)] : []}
                    onPress={item.onPress}
                    testID={item.testID}
                  />
                ))}
              </Section>
            ))}
        </Menu>
      </Host>
    </View>
  );
}

// ——— Nom de la Bibliothèque, première ligne de la zone de contexte ———

function LibraryName({
  value,
  editable,
  onChangeText,
  onEndEditing,
  testID,
}: {
  readonly value: string;
  readonly editable: boolean;
  readonly onChangeText?: (value: string) => void;
  /** Fin de la saisie (clavier fermé ou champ quitté) : Ma bibliothèque y enregistre le nom. */
  readonly onEndEditing?: () => void;
  readonly testID: string;
}) {
  if (!editable) {
    return (
      <Text style={styles.name} numberOfLines={1} accessibilityRole="header" testID={testID}>
        {value}
      </Text>
    );
  }
  return (
    <View style={styles.nameField}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        {...(onEndEditing ? { onEndEditing } : {})}
        placeholder={NAME_PLACEHOLDER}
        placeholderTextColor={LIBRARY_COLORS.muted}
        accessibilityLabel={L.nameAccessibilityLabel}
        returnKeyType="done"
        maxLength={80}
        style={styles.nameInput}
        testID={testID}
      />
      {/* Recette du 13/11 (bp-creer-selection : « retirer le trait bleu ») : plus de soulignement pendant la saisie.
          [Avant : 12217:26529, soulignement 1,5 bleu Kodjo — remplacé.] */}
    </View>
  );
}

// ——— Tout sélectionner / Tout désélectionner ———

/** Mouvements actifs affichés par la liste (recherche et filtres compris), relus à chaque retour sur l'écran. */
function useVisibleMovementIds(
  catalogue: { readonly listEntries: () => Promise<readonly MovementCatalogueEntry[]> } | null,
  query: string,
  filters: MovementCatalogueFilters,
): readonly string[] {
  const [visibleIds, setVisibleIds] = useState<readonly string[]>([]);
  useFocusEffect(
    useCallback(() => {
      if (catalogue === null) return;
      let cancelled = false;
      void catalogue
        .listEntries()
        .then((entries) => {
          if (cancelled) return;
          const items = visibleMovementItems(entries, query, filters);
          setVisibleIds(
            items.flatMap((item) => (item.kind === "PILE" ? item.members : [item.entry])).filter((entry) => !entry.archived).map((entry) => entry.movement.id),
          );
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [catalogue, query, filters]),
  );
  return visibleIds;
}

/**
 * Recette du 15/11/2026 (bp-zone-contexte, Hermann : « Tout sélectionner doit passer à Tout désélectionner lorsqu'il est
 * activé, et vice versa », « Ces liens doivent être présents aussi pour les écrans Ma bibliothèque, en mode modification ») :
 * « Tout désélectionner » quand tous les Mouvements affichés sont choisis, sinon « Tout sélectionner ». Inactif hors de
 * « liste + » ou sans Mouvement affiché. [Avant : « Tout sélectionner » seul, grisé une fois tout coché — remplacé.]
 */
function SelectAllRow({
  enabled,
  allSelected,
  onSelectAll,
  onDeselectAll,
}: {
  readonly enabled: boolean;
  readonly allSelected: boolean;
  readonly onSelectAll: () => void;
  readonly onDeselectAll: () => void;
}) {
  return (
    <View style={styles.selectAllRow}>
      <Pressable
        onPress={allSelected ? onDeselectAll : onSelectAll}
        disabled={!enabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: !enabled }}
        hitSlop={spacing[12]}
        testID="personal-library-select-all"
      >
        <Text style={[styles.selectAll, enabled ? null : styles.selectAllInactive]}>
          {allSelected ? L.deselectAll : L.selectAll}
        </Text>
      </Pressable>
    </View>
  );
}

function allChosen(visibleIds: readonly string[], chosen: ReadonlySet<string>): boolean {
  return visibleIds.length > 0 && visibleIds.every((id) => chosen.has(id));
}

// ——— Créer / Modifier ———

/** Route `library-edit` : création (sans `libraryId`) ou modification d'une Bibliothèque personnelle. */
export function PersonalLibraryEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ libraryId?: string }>();
  const editingId = typeof params.libraryId === "string" && params.libraryId.length > 0 ? params.libraryId : null;
  const { services, libraries, authorId } = usePersonalLibraries();
  const editing = editingId !== null && libraries !== null ? (libraries.find((library) => library.libraryId === editingId) ?? null) : null;
  const service = useActivityDefinitionService();
  const catalogue = useMemo(() => service.movementCatalogue, [service]);
  const actionZone = usePrimaryActionZone();
  const catalogueQuery = useCatalogueQuery();

  const [initialized, setInitialized] = useState(editingId === null);
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  // 12206:26111 : création, list-plus normal (liste vide) ; 12217:26131 : modification, list-plus sélectionné.
  const [adding, setAdding] = useState(editingId !== null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  if (!initialized && editing !== null) {
    setInitialized(true);
    setTitle(editing.title);
    setSelected(new Set(editing.movementIds));
  }

  // « Tout sélectionner » : Mouvements actifs affichés par la liste (recherche et filtres compris).
  const handleSummary = catalogueQuery.onSummaryChange;
  const visibleIds = useVisibleMovementIds(catalogue, catalogueQuery.query, catalogueQuery.filters);
  const allSelected = allChosen(visibleIds, selected);

  const toggle = (movementId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(movementId)) next.delete(movementId);
      else next.add(movementId);
      return next;
    });

  const issue =
    authorId === null || libraries === null
      ? "EMPTY_TITLE"
      : personalLibraryIssue({ title, movementCount: selected.size, authorId, existing: libraries, ...(editingId ? { libraryId: editingId } : {}) });
  // Nom déjà pris : signalé au toucher de Créer / Valider (message de la spécification), le bouton reste actif.
  const blocked = issue === "EMPTY_TITLE" || issue === "NO_MOVEMENT" || saving || services === null;

  async function save() {
    if (savingRef.current || blocked || services === null || catalogue === null) return;
    if (issue === "DUPLICATE_TITLE") {
      Alert.alert(L.duplicateTitle, duplicateTitleMessage(title));
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      // Ordre de présentation du Catalogue, sans recherche ni filtre (comme « Utiliser un mouvement existant »).
      const entries = await catalogue.listEntries();
      const ordered = visibleMovementItems(entries, "", EMPTY_MOVEMENT_FILTERS)
        .flatMap((item) => (item.kind === "PILE" ? item.members : [item.entry]))
        .map((entry) => entry.movement.id)
        .filter((id) => selected.has(id));
      // Membres archivés depuis : gardés, après les actifs (une Bibliothèque ne perd pas un membre en silence).
      const kept = [...ordered, ...[...selected].filter((id) => !ordered.includes(id))];
      const saved = await services.personal.save({ ...(editingId ? { libraryId: editingId } : {}), title, movementIds: kept });
      if (editingId) router.back();
      else router.replace({ pathname: "/library-mine", params: { libraryId: saved.libraryId } });
    } catch (error) {
      savingRef.current = false;
      setSaving(false);
      if (error instanceof DuplicateLibraryTitleError) Alert.alert(L.duplicateTitle, duplicateTitleMessage(error.title));
      else Alert.alert(L.saveFailedTitle, L.saveFailedMessage);
    }
  }

  const count = selected.size;
  const primaryLabel = editingId ? L.validate : count > 0 ? fillTemplate(L.createCount, { count: String(count) }) : L.create;
  const menuItems = editingId && editing ? libraryMenuItems(router, editing, services?.personal ?? null) : [];

  return (
    <ScreenShell backgroundColor={LIBRARY_COLORS.screen}>
      <FixedHeader
        title={editingId ? L.editTitle : L.createTitle}
        onBack={() => router.back()}
        backAccessibilityLabel={editingId ? L.back : L.close}
        closeIcon={editingId === null}
        centeredTitle={false}
        trailing={<ScreenMenuButton items={menuItems} testID="personal-library-menu" />}
      />
      {/* Recette du 13/11 (bp-creer-vide, bp-creer-selection, bp-tout-selectionner : « Le format de la zone de contexte
          n'est pas conforme, vérifier avec le catalogue des mouvements ») : zone du Catalogue — couleur lilas opaque sur
          80 % puis fondue vers la transparence (Figma 12206:26333). [Avant : bande pleine, couleur par défaut — remplacé.] */}
      <ContextBand
        fadeToTransparent
        color={LIBRARY_CONTEXT}
        backHalo={LIBRARY_COLORS.screen}
        padding={{ top: CONTEXT_ZONE_GEOMETRY.paddingTop, bottom: CONTEXT_ZONE_GEOMETRY.paddingBottom }}
      >
        <CatalogueContextZone
          summary={<LibraryName value={title} editable onChangeText={setTitle} testID="personal-library-name" />}
          results={catalogueQuery.results}
          search={catalogueQuery.search("personal-library-search")}
          sortLabel={strings.screens.sessions.sortAction}
          // Recette du 14/11/2026 (bp-creer-vide : « Quand aucune carte n'est affichée le bouton filtre ne doit pas être
          // actif ») : Filtre inactif tant que la liste est vide (aucun Mouvement choisi, « liste + » non sélectionné).
          filter={catalogueQuery.filter("personal-library-filter", !(adding || count > 0))}
          trailingCommand={
            <CommandCircle
              label={L.addMovements}
              icon={adding ? "list-plus-selected" : "list-plus"}
              selected={adding}
              onPress={() => setAdding((current) => !current)}
              testID="personal-library-add-movements"
            />
          }
        />
      </ContextBand>
      <SelectAllRow
        enabled={adding && visibleIds.length > 0}
        allSelected={allSelected}
        onSelectAll={() => setSelected((current) => new Set([...current, ...visibleIds]))}
        onDeselectAll={() => setSelected((current) => new Set([...current].filter((id) => !visibleIds.includes(id))))}
      />
      <View style={styles.body} testID="personal-library-editor-body">
        {adding || count > 0 ? (
          <MovementCatalogueList
            reloadToken={0}
            query={catalogueQuery.query}
            filters={catalogueQuery.filters}
            onSummaryChange={handleSummary}
            onOpenMovement={() => undefined}
            onCreateVariant={() => undefined}
            {...(adding ? {} : { onlyIds: selected })}
            selection={{
              selectedIds: selected,
              onToggle: (movement) => toggle(movement.id),
              bottomInset: actionZone.scrollReserve,
              appearance: "HIGHLIGHT",
            }}
          />
        ) : null}
      </View>
      <PrimaryActionZone
        onContentHeightChange={actionZone.onContentHeightChange}
        background={LIBRARY_COLORS.screen}
        testID="personal-library-editor-actions"
      >
        <PrimaryActionButton
          label={primaryLabel}
          onPress={() => void save()}
          disabled={blocked}
          testID="personal-library-save"
        />
      </PrimaryActionZone>
    </ScreenShell>
  );
}

// ——— Ma bibliothèque ———

type Navigator = ReturnType<typeof useRouter>;

function libraryMenuItems(
  router: Navigator,
  library: PersonalLibrary,
  personal: { readonly delete: (libraryId: string) => Promise<void> } | null,
): readonly ScreenMenuItem[] {
  return [
    {
      label: L.menuShare,
      onPress: () => router.push({ pathname: "/library-share", params: { libraryId: library.libraryId } }),
      testID: "personal-library-menu-share",
    },
    {
      // Export d'un fichier de catalogue : livré avec le partage vers le PC (deuxième temps).
      label: L.menuExport,
      onPress: () => undefined,
      disabled: true,
      testID: "personal-library-menu-export",
    },
    {
      // Arbitrage du 15/11/2026 (bp-menu : « "Supprimer la bibliothèque" doit être sur une ligne » ; menu natif d’iOS, largeur
      // fixée par le système) : « Supprimer ». [Avant : « Supprimer la bibliothèque » (12213:26248) — remplacé.]
      label: L.menuDelete,
      destructive: true,
      onPress: () => confirmDelete(router, library, personal),
      testID: "personal-library-menu-delete",
    },
  ];
}

/** Supprimer : confirmation native ; les Mouvements restent au Catalogue (spécification, règle « références »). */
export function confirmDelete(
  router: Navigator,
  library: PersonalLibrary,
  personal: { readonly delete: (libraryId: string) => Promise<void> } | null,
) {
  Alert.alert(
    fillTemplate(L.deleteTitle, { title: library.title }),
    L.deleteMessage,
    [
      { text: L.cancel, style: "cancel" },
      {
        text: L.delete,
        style: "destructive",
        onPress: () => {
          if (personal === null) return;
          void personal.delete(library.libraryId).then(
            () => router.dismissTo("/profile-edit"),
            () => Alert.alert(L.deleteFailedTitle, L.deleteFailedMessage),
          );
        },
      },
    ],
  );
}

/**
 * Route `library-mine` : une Bibliothèque personnelle, consultée ET modifiée sur place.
 *
 * Recette du 14 et du 15/11/2026 (bp-ma-bibliotheque, bp-zone-contexte, Hermann : « appuyer sur ajouter doit faire
 * apparaître la liste des mouvements, mais pas changer d'écran. Conserver le titre tel qu'il est », « le champ nom doit
 * rester modifiable indépendamment de l'appui sur le bouton ajouter », « il doit apparaître comme une modale ») et
 * arbitrage du 15/11 (enregistrement automatique, feuille plein écran fermée par ✕) : le nom se modifie dans la zone de
 * contexte et s'enregistre à la fin de la saisie ; « liste + » montre tout le Catalogue sur place, chaque Mouvement coché
 * ou décoché s'enregistre aussitôt ; titre « Ma bibliothèque » inchangé. [Avant : nom en lecture seule, « liste + »
 * ouvrait l'écran « Modifier » (12217:26131) et « Valider » enregistrait — remplacé.]
 */
export function PersonalLibraryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ libraryId?: string }>();
  const { services, libraries, authorId } = usePersonalLibraries();
  const stored = libraries?.find((candidate) => candidate.libraryId === params.libraryId) ?? null;
  const service = useActivityDefinitionService();
  const catalogue = useMemo(() => service.movementCatalogue, [service]);
  const catalogueQuery = useCatalogueQuery();

  // Dernier état enregistré ici, prioritaire tant que la relecture des Bibliothèques ne l'a pas remplacé.
  const [saved, setSaved] = useState<PersonalLibrary | null>(null);
  const [seenStored, setSeenStored] = useState<PersonalLibrary | null>(stored);
  if (seenStored !== stored) {
    setSeenStored(stored);
    setSaved(null);
  }
  const library = saved ?? stored;
  const [title, setTitle] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const memberIds = useMemo(() => new Set(library?.movementIds ?? []), [library]);
  const visibleIds = useVisibleMovementIds(catalogue, catalogueQuery.query, catalogueQuery.filters);
  const writes = useRef<Promise<void>>(Promise.resolve());

  const persist = (next: PersonalLibrary) => {
    if (services === null) return;
    setSaved(next);
    writes.current = writes.current.then(async () => {
      try {
        // Ordre de présentation du Catalogue (comme à la création) ; membres archivés gardés, après les actifs.
        let ordered: string[] = [...next.movementIds];
        if (catalogue !== null) {
          const entries = await catalogue.listEntries();
          const shown = visibleMovementItems(entries, "", EMPTY_MOVEMENT_FILTERS)
            .flatMap((item) => (item.kind === "PILE" ? item.members : [item.entry]))
            .map((entry) => entry.movement.id)
            .filter((id) => next.movementIds.includes(id));
          ordered = [...shown, ...next.movementIds.filter((id) => !shown.includes(id))];
        }
        setSaved(await services.personal.save({ libraryId: next.libraryId, title: next.title, movementIds: ordered }));
      } catch (error) {
        setSaved(null);
        if (error instanceof DuplicateLibraryTitleError) Alert.alert(L.duplicateTitle, duplicateTitleMessage(error.title));
        else Alert.alert(L.saveFailedTitle, L.saveFailedMessage);
      }
    });
  };

  const commitTitle = () => {
    if (title === null || library === null) return;
    const next = title;
    setTitle(null);
    if (next.trim() === library.title.trim()) return;
    const issue =
      authorId === null || libraries === null
        ? null
        : personalLibraryIssue({ title: next, movementCount: library.movementIds.length, authorId, existing: libraries, libraryId: library.libraryId });
    if (issue === "EMPTY_TITLE") {
      Alert.alert(L.emptyNameTitle, L.emptyNameMessage);
      return;
    }
    if (issue === "DUPLICATE_TITLE") {
      Alert.alert(L.duplicateTitle, duplicateTitleMessage(next));
      return;
    }
    persist({ ...library, title: next.trim() });
  };

  const toggle = (movementId: string) => {
    if (library === null) return;
    const has = memberIds.has(movementId);
    if (has && library.movementIds.length === 1) {
      Alert.alert(L.lastMovementTitle, L.lastMovementMessage);
      return;
    }
    persist({
      ...library,
      movementIds: has ? library.movementIds.filter((id) => id !== movementId) : [...library.movementIds, movementId],
    });
  };

  const setMembers = (movementIds: readonly string[]) => {
    if (library === null) return;
    if (movementIds.length === 0) {
      Alert.alert(L.lastMovementTitle, L.lastMovementMessage);
      return;
    }
    persist({ ...library, movementIds });
  };

  const menuItems = library ? libraryMenuItems(router, library, services?.personal ?? null) : [];

  return (
    <ScreenShell backgroundColor={LIBRARY_COLORS.screen}>
      <FixedHeader
        title={L.mineTitle}
        onBack={() => router.back()}
        backAccessibilityLabel={L.close}
        closeIcon
        centeredTitle={false}
        trailing={<ScreenMenuButton items={menuItems} testID="personal-library-menu" />}
      />
      <ContextBand
        fadeToTransparent
        color={LIBRARY_CONTEXT}
        backHalo={LIBRARY_COLORS.screen}
        padding={{ top: CONTEXT_ZONE_GEOMETRY.paddingTop, bottom: CONTEXT_ZONE_GEOMETRY.paddingBottom }}
      >
        <CatalogueContextZone
          summary={
            <LibraryName
              value={title ?? library?.title ?? ""}
              editable={library !== null}
              onChangeText={setTitle}
              onEndEditing={commitTitle}
              testID="personal-library-title"
            />
          }
          results={catalogueQuery.results}
          search={catalogueQuery.search("personal-library-search")}
          sortLabel={strings.screens.sessions.sortAction}
          filter={catalogueQuery.filter("personal-library-filter")}
          trailingCommand={
            <CommandCircle
              label={L.addMovements}
              icon={adding ? "list-plus-selected" : "list-plus"}
              selected={adding}
              disabled={library === null}
              onPress={() => setAdding((current) => !current)}
              testID="personal-library-edit"
            />
          }
        />
      </ContextBand>
      {adding ? (
        <SelectAllRow
          enabled={library !== null && visibleIds.length > 0}
          allSelected={allChosen(visibleIds, memberIds)}
          onSelectAll={() => setMembers([...new Set([...(library?.movementIds ?? []), ...visibleIds])])}
          onDeselectAll={() => setMembers((library?.movementIds ?? []).filter((id) => !visibleIds.includes(id)))}
        />
      ) : null}
      <View style={adding ? styles.body : [styles.body, styles.bodyUnderFade]} testID="personal-library-body">
        {library !== null ? (
          <MovementCatalogueList
            reloadToken={0}
            {...(adding ? {} : { topInset: LIST_TOP_INSET })}
            query={catalogueQuery.query}
            filters={catalogueQuery.filters}
            onSummaryChange={catalogueQuery.onSummaryChange}
            {...(adding
              ? {
                  selection: {
                    selectedIds: memberIds,
                    onToggle: (movement: { readonly id: string }) => toggle(movement.id),
                    bottomInset: 0,
                    appearance: "HIGHLIGHT" as const,
                  },
                }
              : { onlyIds: memberIds, readOnly: true })}
            onOpenMovement={(movementId) => router.push({ pathname: "/movement", params: { movementId } })}
            onCreateVariant={() => undefined}
          />
        ) : null}
      </View>
    </ScreenShell>
  );
}

// ——— Partager ———

/** Route `library-share` (12217:26236). « Vers mon PC » : envoi livré dans le deuxième temps. */
export function PersonalLibraryShareScreen() {
  return (
    <LibraryScreen title={L.share.title} testID="library-share">
      <View style={styles.shareCards}>
        <ShareCard icon="library-computer" title={L.share.pcTitle} subtitle={L.share.pcSubtitle} disabled testID="library-share-pc" />
        <ShareCard icon="library-share-users" title={L.share.usersTitle} subtitle={L.share.accountRequired} disabled dimmed testID="library-share-users" />
        <ShareCard icon="library-share-spaces" title={L.share.spacesTitle} subtitle={L.share.accountRequired} disabled dimmed testID="library-share-spaces" />
        <ShareCard icon="library-share-public" title={L.share.publicTitle} subtitle={L.share.accountRequired} disabled dimmed testID="library-share-public" />
      </View>
      <Paragraph tone="note">{L.share.note}</Paragraph>
    </LibraryScreen>
  );
}

/** Carte de partage : mêmes mesures que les cartes de provenance d'« Ajouter une bibliothèque » ; grisée à 40 %. */
function ShareCard({
  icon,
  title,
  subtitle,
  onPress,
  disabled = false,
  dimmed = false,
  testID,
}: {
  readonly icon: KodjoIconName;
  readonly title: string;
  readonly subtitle: string;
  readonly onPress?: () => void;
  readonly disabled?: boolean;
  readonly dimmed?: boolean;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={title + ", " + subtitle}
      style={styles.shareCard}
      testID={testID}
    >
      <View style={styles.shareIcon}>
        <KodjoIcon name={icon} />
      </View>
      <View style={[styles.shareText, dimmed ? styles.dimmed : null]}>
        <Text style={LIBRARY_TEXT.medium15}>{title}</Text>
        <Text style={LIBRARY_TEXT.note}>{subtitle}</Text>
      </View>
      <View style={dimmed ? styles.dimmed : null} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <KodjoIcon name="library-chevron-go-small" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    width: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  name: {
    ...type.screenTitle,
    color: colors.textPrimary,
    flexShrink: 1,
    // Recette du 14 et du 15/11/2026 (bp-ma-bibliotheque : « Le nom est tronqué horizontalement (lignes coupées en bas) ») :
    // la ligne 1 de la zone mesure 17 ; le nom garde sa propre hauteur (interligne 24 + jambages) et déborde
    // symétriquement, au lieu d'être mesuré à 17 et rogné. [Avant : hauteur imposée par la ligne — remplacé.]
    height: NAME_BOX_HEIGHT,
    marginVertical: (CONTEXT_ZONE_GEOMETRY.line1Height - NAME_BOX_HEIGHT) / 2,
    lineHeight: NAME_BOX_HEIGHT,
  },
  nameField: {
    flex: 1,
    height: CONTEXT_ZONE_GEOMETRY.line1Height,
    justifyContent: "center",
  },
  nameInput: {
    ...type.screenTitle,
    color: colors.textPrimary,
    // Figma : texte à y = 113 pour une ligne 1 à y = 116 de 17 de haut ; le champ déborde symétriquement.
    height: NAME_BOX_HEIGHT,
    marginVertical: (CONTEXT_ZONE_GEOMETRY.line1Height - NAME_BOX_HEIGHT) / 2,
    padding: 0,
  },
  selectAllRow: {
    // 12225:26301 : « Tout sélectionner » à y = 211 (7 sous la zone de contexte), aligné à droite (x = 386).
    height: 28,
    paddingTop: 7,
    paddingHorizontal: layout.screenGutter,
    alignItems: "flex-end",
  },
  selectAll: {
    ...type.button,
    fontSize: 13,
    lineHeight: 16,
    color: colors.primary,
  },
  selectAllInactive: {
    color: LIBRARY_COLORS.muted,
  },
  body: {
    flex: 1,
  },
  bodyUnderFade: {
    marginTop: -CONTEXT_BAND_FADE_HEIGHT,
  },
  shareCards: {
    gap: spacing[12],
  },
  shareCard: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[16],
    paddingHorizontal: spacing[16],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.background,
    backgroundColor: "#F9FAFC",
    shadowColor: LIBRARY_COLORS.cardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  shareIcon: {
    width: 20,
    alignItems: "center",
  },
  shareText: {
    flex: 1,
    gap: spacing[4],
  },
  dimmed: {
    opacity: 0.4,
  },
});
