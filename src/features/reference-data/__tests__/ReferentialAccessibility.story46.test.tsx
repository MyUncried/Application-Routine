import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { AccessibilityInfo, StyleSheet } from "react-native";
import type { ReactTestInstance } from "react-test-renderer";

import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import { SESSION_COLORS } from "@/domain/sessions/Session";
import { BodyZoneSelector } from "@/features/sessions/BodyZoneSelector";
import { BodyZonePickerModal } from "@/features/reference-data/BodyZonePickerModal";
import { CategoryPickerModal } from "@/features/reference-data/CategoryPickerModal";
import { LabelPickerModal } from "@/features/reference-data/LabelPickerModal";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { strings } from "@/shared/i18n";
import { ENTRY_MENU_ACTION } from "@/shared/ui/entryMenuAction";
import { type } from "@/shared/ui/tokens";

/**
 * PRE-4 story 4.6 — accessibilité des feuilles de référentiel (Catégorie, Zones) depuis
 * l'Éditeur : alternative à l'appui long (AC8, FR-22-09), focus et états (AC9, FR-22-10),
 * cibles tactiles (AC4, FR-22-04) et texte agrandi (AC5, FR-22-05). Jest n'a ni VoiceOver
 * ni moteur de mise en page : les annonces, le focus effectif et la géométrie se jugent sur
 * iPhone (R-46, R-47, R-48). Rappel NFR-04 : une suite verte ne vaut pas recette.
 */

const CATEGORIES: readonly Category[] = [
  { id: "cardio", name: "Cardio", canonicalKey: "cardio", color: "#3B82F6", isPredefined: true, displayOrder: 1, isActive: true, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "boxe", name: "Boxe", canonicalKey: "boxe", color: "#E5484D", isPredefined: false, displayOrder: 2, isActive: true, createdAt: "2026-01-02T00:00:00.000Z" },
];

const ZONES: readonly BodyZone[] = [
  { id: "cou", name: "Cou", canonicalKey: "cou", isActive: true, createdAt: "2026-01-01T00:00:00.000Z" } as BodyZone,
  { id: "epaules", name: "Épaules", canonicalKey: "epaules", isActive: true, createdAt: "2026-01-01T00:00:01.000Z" } as BodyZone,
];

function fakeReferentialService(overrides: Partial<ReferentialService> = {}): ReferentialService {
  return {
    listCategories: jest.fn(async () => CATEGORIES),
    createCategory: jest.fn(async () => ({ status: "DUPLICATE" as const })),
    renameCategory: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    recolorCategory: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    retireCategory: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    isCategoryUsed: jest.fn(async () => false),
    listBodyZones: jest.fn(async () => ZONES),
    createBodyZone: jest.fn(async () => ({ status: "DUPLICATE" as const })),
    renameBodyZone: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    retireBodyZone: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    isBodyZoneUsed: jest.fn(async () => false),
    listLabels: jest.fn(async () => [
      { id: "focus", name: "Focus", canonicalKey: "focus", color: "#3B82F6", isActive: true, createdAt: "2026-01-01T00:00:00.000Z" },
    ]),
    isLabelUsed: jest.fn(async () => false),
    ...overrides,
  } as unknown as ReferentialService;
}

async function renderCategories(selectedId: string | null = "cardio", service: ReferentialService = fakeReferentialService()) {
  const onSelect = jest.fn();
  render(
    <ReferentialServiceContext.Provider value={service}>
      <CategoryPickerModal selectedId={selectedId} onSelect={onSelect} onClose={jest.fn()} />
    </ReferentialServiceContext.Provider>,
  );
  await screen.findByTestId("category-picker-tag-cardio");
  return { onSelect };
}

async function renderZones(selectedIds: readonly string[] = ["cou"]) {
  const onConfirm = jest.fn();
  render(
    <ReferentialServiceContext.Provider value={fakeReferentialService()}>
      <BodyZonePickerModal selectedIds={selectedIds} onConfirm={onConfirm} onClose={jest.fn()} />
    </ReferentialServiceContext.Provider>,
  );
  await screen.findByTestId("body-zone-selector-tag-cou");
  return { onConfirm };
}

/** Déclenche l'action accessible nommée, comme VoiceOver (rotor « Actions ») ou TalkBack. */
async function runAccessibilityAction(testID: string, actionName: string) {
  await act(async () => {
    fireEvent(screen.getByTestId(testID), "accessibilityAction", { nativeEvent: { actionName } });
  });
}

/** Appui long PRE-3 sur une entrée (menu D-354). */
async function longPress(testID: string) {
  await act(async () => {
    fireEvent(screen.getByTestId(testID, { includeHiddenElements: true }), "longPress");
  });
}

/** Requête des éléments masqués à l'accessibilité (sous un dialogue modal pour VoiceOver). */
const HIDDEN = { includeHiddenElements: true } as const;

const MENU_LABEL = strings.referenceData.longPressDialog.accessibilityAction;

/** Composant hôte de ce nom (`Text`, `TextInput`…) : le type d'un nœud de test est large. */
const isHost = (node: { readonly type: unknown }, name: string) => node.type === name;

/** Cible tactile effective d'un contrôle : dimension de son style, augmentée de son `hitSlop`. */
function effectiveTarget(node: ReactTestInstance): { width: number | undefined; height: number | undefined } {
  const style = StyleSheet.flatten(node.props.style) ?? {};
  const slop = node.props.hitSlop as number | { top?: number; bottom?: number; left?: number; right?: number } | undefined;
  const edges =
    typeof slop === "number"
      ? { top: slop, bottom: slop, left: slop, right: slop }
      : { top: slop?.top ?? 0, bottom: slop?.bottom ?? 0, left: slop?.left ?? 0, right: slop?.right ?? 0 };
  const height = (style.height ?? style.minHeight) as number | undefined;
  const width = (style.width ?? style.minWidth) as number | undefined;
  return {
    height: height === undefined ? undefined : height + edges.top + edges.bottom,
    width: width === undefined ? undefined : width + edges.left + edges.right,
  };
}

describe("Référentiels — PRE-4 story 4.6", () => {
  it("PRE4-4.6/AC8 — Catégorie : une action accessible « Modifier ou supprimer » ouvre le menu ✕ / Modifier / Supprimer de l'appui long, sans marquer ni affecter l'entrée", async () => {
    const { onSelect } = await renderCategories("cardio");
    const tag = screen.getByTestId("category-picker-tag-boxe");
    expect(tag.props.accessibilityActions).toEqual([{ name: ENTRY_MENU_ACTION, label: MENU_LABEL }]);
    expect(MENU_LABEL).toBe("Modifier ou supprimer");
    await runAccessibilityAction("category-picker-tag-boxe", ENTRY_MENU_ACTION);
    expect(screen.getByTestId("category-picker-long-press-card").props.accessibilityLabel).toBe("Boxe");
    expect(screen.getByTestId("category-picker-long-press-modify")).toBeTruthy();
    expect(screen.getByTestId("category-picker-long-press-delete")).toBeTruthy();
    // L'entrée visée n'est ni marquée ni affectée (D4) : la sélection reste « Cardio ».
    // Le menu ouvert est modal pour VoiceOver : la liste dessous est masquée à l'accessibilité.
    expect(screen.queryByTestId("category-picker-tag-boxe")).toBeNull();
    expect(screen.getByTestId("category-picker-tag-boxe", HIDDEN).props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.getByTestId("category-picker-tag-cardio", HIDDEN).props.accessibilityState).toMatchObject({ selected: true });
    expect(onSelect).not.toHaveBeenCalled();
    // Une action inconnue n'ouvre rien ; le toucher garde son effet PRE-3 (marquer).
    fireEvent.press(screen.getByTestId("category-picker-long-press-cancel"));
    await runAccessibilityAction("category-picker-tag-boxe", "activate");
    expect(screen.queryByTestId("category-picker-long-press-card")).toBeNull();
    fireEvent.press(screen.getByTestId("category-picker-tag-boxe"));
    expect(screen.getByTestId("category-picker-tag-boxe").props.accessibilityState).toMatchObject({ selected: true });
  });

  it("PRE4-4.6/AC8 — Zones : même action accessible sur chaque Zone de la feuille, même menu, sélection inchangée ; hors feuille de référentiel (sans appui long), aucune action", async () => {
    await renderZones(["cou"]);
    const tag = screen.getByTestId("body-zone-selector-tag-epaules");
    expect(tag.props.accessibilityActions).toEqual([{ name: ENTRY_MENU_ACTION, label: MENU_LABEL }]);
    await runAccessibilityAction("body-zone-selector-tag-epaules", ENTRY_MENU_ACTION);
    expect(screen.getByTestId("body-zone-picker-long-press-card").props.accessibilityLabel).toBe("Épaules");
    expect(screen.getByTestId("body-zone-selector-tag-epaules", HIDDEN).props.accessibilityState).toMatchObject({ checked: false });
    expect(screen.getByTestId("body-zone-selector-tag-cou", HIDDEN).props.accessibilityState).toMatchObject({ checked: true });
    screen.unmount();

    // Sans `onEntryMenuAction` (appui long seul, ou aucun), aucune action : rendu PRE-3.
    render(<BodyZoneSelector zones={ZONES} selectedIds={[]} onToggle={jest.fn()} onLongPressZone={jest.fn()} accessibilityLabel="Zones" />);
    expect(screen.getByTestId("body-zone-selector-tag-cou").props.accessibilityActions).toBeUndefined();
    expect(screen.getByTestId("body-zone-selector-tag-cou").props.onAccessibilityAction).toBeUndefined();
  });

  it("PRE4-4.6/AC8 — action personnalisée, jamais l'action standard « longpress » (aucun double menu sur Android) ; ignorée formulaire ouvert ou menu déjà ouvert ; liste retirée de l'accessibilité Android pendant le menu (Catégorie et Zones)", async () => {
    expect(ENTRY_MENU_ACTION).toBe("entryMenu");
    expect(["activate", "longpress", "increment", "decrement", "magicTap", "escape"]).not.toContain(ENTRY_MENU_ACTION);
    await renderCategories("cardio");
    expect(screen.getByTestId("category-picker-tag-row").props.importantForAccessibility).toBe("auto");
    await runAccessibilityAction("category-picker-tag-boxe", ENTRY_MENU_ACTION);
    expect(screen.getByTestId("category-picker-tag-row", HIDDEN).props.importantForAccessibility).toBe("no-hide-descendants");
    // Menu déjà ouvert : l'action sur une autre entrée n'ouvre rien d'autre.
    await act(async () => {
      fireEvent(screen.getByTestId("category-picker-tag-cardio", HIDDEN), "accessibilityAction", { nativeEvent: { actionName: ENTRY_MENU_ACTION } });
    });
    expect(screen.getByTestId("category-picker-long-press-card").props.accessibilityLabel).toBe("Boxe");
    fireEvent.press(screen.getByTestId("category-picker-long-press-cancel"));
    expect(screen.getByTestId("category-picker-tag-row").props.importantForAccessibility).toBe("auto");
    // Formulaire de création ouvert : action ignorée ; l'appui long PRE-3 reste disponible.
    fireEvent.press(screen.getByTestId("category-picker-create-action"));
    await runAccessibilityAction("category-picker-tag-boxe", ENTRY_MENU_ACTION);
    expect(screen.queryByTestId("category-picker-long-press-card")).toBeNull();
    await longPress("category-picker-tag-boxe");
    expect(screen.getByTestId("category-picker-long-press-card").props.accessibilityLabel).toBe("Boxe");
    screen.unmount();

    await renderZones(["cou"]);
    await runAccessibilityAction("body-zone-selector-tag-epaules", ENTRY_MENU_ACTION);
    await act(async () => {
      fireEvent(screen.getByTestId("body-zone-selector-tag-cou", HIDDEN), "accessibilityAction", { nativeEvent: { actionName: ENTRY_MENU_ACTION } });
    });
    expect(screen.getByTestId("body-zone-picker-long-press-card").props.accessibilityLabel).toBe("Épaules");
    fireEvent.press(screen.getByTestId("body-zone-picker-long-press-cancel"));
    fireEvent.press(screen.getByTestId("body-zone-picker-create-action"));
    await runAccessibilityAction("body-zone-selector-tag-epaules", ENTRY_MENU_ACTION);
    expect(screen.queryByTestId("body-zone-picker-long-press-card")).toBeNull();
  });

  it("PRE4-4.6/AC8 — revue : une autre entrée repart toujours de l'étape « actions » (jamais la confirmation d'une autre) ; usage remis à faux à chaque ouverture et résultat périmé ignoré", async () => {
    const resolvers: Record<string, (used: boolean) => void> = {};
    const service = fakeReferentialService({
      isCategoryUsed: jest.fn((id: string) => new Promise<boolean>((resolve) => (resolvers[id] = resolve))),
    } as Partial<ReferentialService>);
    await renderCategories("cardio", service);
    await longPress("category-picker-tag-boxe");
    fireEvent.press(screen.getByTestId("category-picker-long-press-delete"));
    expect(screen.getByTestId("category-picker-long-press-delete-confirm-card")).toBeTruthy();
    // Changement de cible pendant la confirmation (appui long sur une autre entrée).
    await longPress("category-picker-tag-cardio");
    expect(screen.queryByTestId("category-picker-long-press-delete-confirm-card")).toBeNull();
    expect(screen.getByTestId("category-picker-long-press-card").props.accessibilityLabel).toBe("Cardio");
    // « Boxe » répond « utilisée » après le changement de cible : résultat périmé, ignoré.
    await act(async () => {
      resolvers.boxe!(true);
    });
    fireEvent.press(screen.getByTestId("category-picker-long-press-delete"));
    expect(screen.getByText(strings.referenceData.deleteConfirm.unusedMessage)).toBeTruthy();
    // Réponse de « Cardio » (utilisée) : appliquée à la cible courante.
    await act(async () => {
      resolvers.cardio!(true);
    });
    expect(screen.getByText(strings.referenceData.deleteConfirm.categoryUsedMessage)).toBeTruthy();
  });

  it("PRE4-4.6/AC9 — le focus va au dialogue à son ouverture (nom de l'entrée), puis au titre de la confirmation ; Annuler le rend à la liste (R10) ; feuilles et dialogue modaux pour VoiceOver", async () => {
    const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
    const setFocus = jest.spyOn(AccessibilityInfo, "setAccessibilityFocus").mockImplementation(() => undefined);
    try {
      await renderCategories("cardio");
      expect(screen.getByTestId("category-picker-sheet").props.accessibilityViewIsModal).toBe(true);
      focus.mockClear();
      await runAccessibilityAction("category-picker-tag-boxe", ENTRY_MENU_ACTION);
      expect(screen.getByTestId("category-picker-long-press-backdrop").props.accessibilityViewIsModal).toBe(true);
      const menuFocus = focus.mock.calls.filter(([, type]) => type === "focus");
      expect(menuFocus).toHaveLength(1);
      expect((menuFocus[0]![0] as unknown as { props: { children: unknown } }).props.children).toBe("Boxe");
      fireEvent.press(screen.getByTestId("category-picker-long-press-delete"));
      const confirmFocus = focus.mock.calls.filter(([, type]) => type === "focus");
      expect(confirmFocus).toHaveLength(2);
      expect((confirmFocus[1]![0] as unknown as { props: { children: unknown } }).props.children).toBe(
        `${strings.referenceData.deleteConfirm.titlePrefix}Boxe${strings.referenceData.deleteConfirm.titleSuffix}`,
      );
      setFocus.mockClear();
      fireEvent.press(screen.getByTestId("category-picker-long-press-delete-confirm-cancel"));
      expect(setFocus).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("category-picker-long-press-delete-confirm-card")).toBeNull();
      screen.unmount();

      await renderZones(["cou"]);
      expect(screen.getByTestId("body-zone-picker-sheet").props.accessibilityViewIsModal).toBe(true);
      focus.mockClear();
      await runAccessibilityAction("body-zone-selector-tag-epaules", ENTRY_MENU_ACTION);
      expect(focus.mock.calls.filter(([, type]) => type === "focus")).toHaveLength(1);
    } finally {
      focus.mockRestore();
      setFocus.mockRestore();
    }
  });

  it("PRE4-4.6/AC9 — focus opt-in : la feuille des Étiquettes (Composition, hors périmètre) n'envoie aucun focus à l'ouverture de son menu ni de sa confirmation", async () => {
    const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
    try {
      render(
        <ReferentialServiceContext.Provider value={fakeReferentialService()}>
          <LabelPickerModal selectedId={null} onSelect={jest.fn()} onClose={jest.fn()} />
        </ReferentialServiceContext.Provider>,
      );
      await screen.findByTestId("label-picker-tag-focus");
      focus.mockClear();
      await longPress("label-picker-tag-focus");
      expect(screen.getByTestId("label-picker-long-press-card")).toBeTruthy();
      fireEvent.press(screen.getByTestId("label-picker-long-press-delete"));
      expect(screen.getByTestId("label-picker-long-press-delete-confirm-card")).toBeTruthy();
      expect(focus).not.toHaveBeenCalled();
    } finally {
      focus.mockRestore();
    }
  });

  it("PRE4-4.6/AC9 — après `Modifier`, le focus va au champ de nom du formulaire d'édition (Catégorie et Zones)", async () => {
    const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
    try {
      await renderCategories("cardio");
      await runAccessibilityAction("category-picker-tag-boxe", ENTRY_MENU_ACTION);
      focus.mockClear();
      fireEvent.press(screen.getByTestId("category-picker-long-press-modify"));
      const toField = focus.mock.calls.filter(([, type]) => type === "focus");
      expect(toField).toHaveLength(1);
      expect((toField[0]![0] as unknown as { props: { testID: string } }).props.testID).toBe("category-picker-edit-name-input");
      screen.unmount();

      await renderZones(["cou"]);
      await runAccessibilityAction("body-zone-selector-tag-epaules", ENTRY_MENU_ACTION);
      focus.mockClear();
      fireEvent.press(screen.getByTestId("body-zone-picker-long-press-modify"));
      const toZoneField = focus.mock.calls.filter(([, type]) => type === "focus");
      expect(toZoneField).toHaveLength(1);
      expect((toZoneField[0]![0] as unknown as { props: { testID: string } }).props.testID).toBe("body-zone-picker-edit-name-input");
    } finally {
      focus.mockRestore();
    }
  });

  it("PRE4-4.6/AC9 — chaque option annonce son nom et son état ; couleur accompagnée du nom ; ↑ inactif à nom vide perçu par l'état désactivé (pas seulement la couleur), dans les deux feuilles", async () => {
    await renderCategories("cardio");
    for (const category of CATEGORIES) {
      const tag = screen.getByTestId(`category-picker-tag-${category.id}`);
      expect(tag.props.accessibilityLabel.startsWith(category.name)).toBe(true);
      expect(tag.props.accessibilityState).toEqual({ selected: category.id === "cardio" });
    }
    fireEvent.press(screen.getByTestId("category-picker-create-action"));
    expect(screen.getByTestId("category-picker-new-add").props.accessibilityState).toEqual({ disabled: true });
    screen.unmount();

    await renderZones(["cou", "epaules"]);
    for (const zone of ZONES) {
      const tag = screen.getByTestId(`body-zone-selector-tag-${zone.id}`);
      expect(tag.props.accessibilityLabel).toBe(zone.name);
      expect(tag.props.accessibilityRole).toBe("checkbox");
      expect(tag.props.accessibilityState).toEqual({ checked: true });
    }
    fireEvent.press(screen.getByTestId("body-zone-picker-create-action"));
    expect(screen.getByTestId("body-zone-picker-new-add").props.accessibilityState).toEqual({ disabled: true });
  });

  it("PRE4-4.6/AC4 — cibles des feuilles de référentiel : ✕ et ✓ 48, ↑ 48, `Créer…` 44 sans agrandir la pilule de 32, Zones ≥ 48 de haut, menu et confirmation 48 ; exceptions consignées (options de Catégorie 30, nuancier, Annuler / Enregistrer de la modification 30)", async () => {
    await renderCategories("cardio");
    const atLeast44 = (testID: string) => {
      const { height, width } = effectiveTarget(screen.getByTestId(testID));
      expect({ testID, height: (height ?? 0) >= 44 }).toEqual({ testID, height: true });
      if (width !== undefined) expect({ testID, width: width >= 44 }).toEqual({ testID, width: true });
    };
    atLeast44("category-picker-close");
    atLeast44("category-picker-confirm");
    atLeast44("category-picker-create-action");
    // La pilule garde son dessin PRE-3 (32) ; seule la cible grandit, sous la pilule.
    expect(StyleSheet.flatten(screen.getByTestId("category-picker-create-action").props.style).height).toBe(32);
    // Place laissée par le parent (revue 4.6) : le débord bas reste dans la marge du contenu
    // défilant (un `hitSlop` hors du parent ne reçoit rien sur iOS) ; au-dessus, l'écart avec
    // la liste (options sans `hitSlop`) garde au moins 8 entre cibles.
    const categoryContent = StyleSheet.flatten(screen.getByTestId("category-picker-card").props.contentContainerStyle);
    const categorySlop = screen.getByTestId("category-picker-create-action").props.hitSlop as { top: number; bottom: number };
    expect(categorySlop.bottom).toBeLessThanOrEqual(categoryContent.padding as number);
    expect((categoryContent.gap as number) - categorySlop.top - (screen.getByTestId("category-picker-tag-cardio").props.hitSlop ?? 0)).toBeGreaterThanOrEqual(8);
    // Exception consignée (question à Hermann, Implementation Notes) : 30 de haut, sans `hitSlop`,
    // dans une rangée à écart de 8 — l'agrandir sans recouvrement exige de changer l'espacement PRE-3.
    expect(effectiveTarget(screen.getByTestId("category-picker-tag-cardio")).height).toBe(30);
    fireEvent.press(screen.getByTestId("category-picker-create-action"));
    atLeast44("category-picker-new-add");
    // Exception consignée : segments contigus de la barre de 12 couleurs (32 de haut, ≈ 29 de large à 402).
    expect(effectiveTarget(screen.getByTestId(`category-picker-new-color-band-${SESSION_COLORS[1]}`)).height).toBe(32);
    // Formulaire ouvert : l'action accessible est ignorée (revue 4.6) ; l'appui long PRE-3 ouvre le menu.
    await longPress("category-picker-tag-boxe");
    atLeast44("category-picker-long-press-cancel");
    atLeast44("category-picker-long-press-modify");
    atLeast44("category-picker-long-press-delete");
    fireEvent.press(screen.getByTestId("category-picker-long-press-modify"));
    // Exception consignée : Annuler / Enregistrer de la modification, 30 de haut sans `hitSlop`.
    expect(effectiveTarget(screen.getByTestId("category-picker-edit-cancel")).height).toBe(30);
    expect(effectiveTarget(screen.getByTestId("category-picker-edit-save")).height).toBe(30);
    screen.unmount();

    await renderZones(["cou"]);
    atLeast44("body-zone-picker-close");
    atLeast44("body-zone-picker-confirm");
    atLeast44("body-zone-picker-create-action");
    const zoneContent = StyleSheet.flatten(screen.getByTestId("body-zone-picker-card").props.contentContainerStyle);
    const zoneSlop = screen.getByTestId("body-zone-picker-create-action").props.hitSlop as { top: number; bottom: number };
    const zoneTagSlop = screen.getByTestId("body-zone-selector-tag-cou").props.hitSlop as number;
    expect(zoneSlop.bottom).toBeLessThanOrEqual(zoneContent.padding as number);
    // La cible des Zones déborde déjà de `zoneTagSlop` sous la liste : 8 restent entre les deux cibles.
    expect((zoneContent.gap as number) - zoneTagSlop - zoneSlop.top).toBeGreaterThanOrEqual(8);
    // Zones (PRE-3, AUD-04) : pastille (8 + interligne de `type.body` + 8) portée à 48 par son `hitSlop`.
    const zoneTag = StyleSheet.flatten(screen.getByTestId("body-zone-selector-tag-cou").props.style);
    expect((zoneTag.paddingVertical as number) * 2 + type.body.lineHeight + zoneTagSlop * 2).toBeGreaterThanOrEqual(44);
    fireEvent.press(screen.getByTestId("body-zone-picker-create-action"));
    atLeast44("body-zone-picker-new-add");
  });

  it("PRE4-4.6/AC5 — texte agrandi : aucun texte des feuilles ni du menu ne plafonne ni ne réduit sa taille ; hauteurs fixes sur un texte limitées aux exceptions consignées", async () => {
    await renderCategories("cardio");
    // Contrôles à hauteur fixe qui contiennent un texte (ou le symbole ↑) : exceptions PRE-3
    // consignées (R-44, question à Hermann). Au repos : options de Catégorie (30) et
    // `Créer une catégorie` (32) ; formulaire ouvert : champ de création (46) et ↑ (32).
    const fixedWithText = () =>
      [
        ...new Set(
          screen.UNSAFE_root.findAll(
            (node) =>
              typeof node.type === "string" &&
              typeof node.props.testID === "string" &&
              typeof StyleSheet.flatten(node.props.style)?.height === "number" &&
              (isHost(node, "TextInput") || node.findAll((child) => isHost(child, "Text")).length > 0),
          ).map((node) => node.props.testID as string),
        ),
      ].sort();
    expect(fixedWithText()).toEqual(["category-picker-create-action", "category-picker-tag-boxe", "category-picker-tag-cardio"]);
    fireEvent.press(screen.getByTestId("category-picker-create-action"));
    expect(fixedWithText()).toEqual([
      "category-picker-new-add",
      "category-picker-new-name-input",
      "category-picker-tag-boxe",
      "category-picker-tag-cardio",
    ]);
    await longPress("category-picker-tag-boxe");
    const capped = screen.UNSAFE_root.findAll(
      (node) =>
        typeof node.type === "string" &&
        (node.props.maxFontSizeMultiplier !== undefined ||
          node.props.allowFontScaling === false ||
          node.props.adjustsFontSizeToFit === true ||
          node.props.minimumFontScale !== undefined),
    );
    expect(capped).toEqual([]);
    // Seul texte borné en lignes : le nom de l'entrée dans l'en-tête du menu (2 lignes, PRE-3),
    // lu en entier par le libellé du menu.
    const bounded = screen.UNSAFE_root.findAll((node) => isHost(node, "Text") && node.props.numberOfLines !== undefined);
    expect(bounded.map((node) => node.props.children)).toEqual(["Boxe"]);
    expect(screen.getByTestId("category-picker-long-press-card").props.accessibilityLabel).toBe("Boxe");
    // Menu ouvert : ses actions ont une hauteur minimale (48), jamais fixe.
    for (const testID of ["category-picker-long-press-modify", "category-picker-long-press-delete"]) {
      const actionStyle = StyleSheet.flatten(screen.getByTestId(testID).props.style);
      expect({ testID, height: actionStyle.height, minHeight: actionStyle.minHeight }).toEqual({ testID, height: undefined, minHeight: 48 });
    }
  });
});
