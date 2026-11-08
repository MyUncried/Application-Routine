import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { Image } from "expo-image";
import { useState } from "react";
import { AccessibilityInfo, StyleSheet } from "react-native";
import * as Reanimated from "react-native-reanimated";

import type { Movement } from "@/domain/activities/Movement";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { FormatModelDraftProvider } from "@/features/sessions/FormatModelDraftContext";
import { FormatModelScreen } from "@/features/sessions/FormatModelScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { KodjoIcon, preloadedKodjoIcon, resetPreloadedKodjoIconsForTests } from "@/shared/ui/KodjoIcon";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Recette iPhone du 07/11/2026 (Hermann) — mode catalogue d'un Format (« + Ajouter ») :
 * A) carte du dessus d'une pile repliée : déplie sans sélectionner ; carte d'une pile dépliée : sélection ;
 * B) Niveau en noir, sur la ligne de base du nom ; H) carte sans famille au retrait des cartes d'une pile ;
 * D) pastille des zones préchargée, liste en fondu, glissement des cartes au repli / dépli ;
 * E) fermeture en fondu lent (« Fermer sans sélectionner », « Ajouter X mouvement », « Revenir aux paramètres »).
 * Aucun de ces tests ne valide le rendu visuel (couleurs, mouvements) : ils vérifient les règles et les mécanismes demandés.
 */

jest.mock("expo-crypto", () => ({ randomUUID: () => "uuid" }));
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ push: jest.fn(), back: jest.fn(), dismissTo: jest.fn(), dismiss: jest.fn() }),
    useNavigation: () => ({ getState: () => ({ index: 0, routes: [{ name: "format-questionnaire" }] }) }),
    useLocalSearchParams: () => ({ model: "TABATA" }),
    useFocusEffect: () => undefined,
  };
});

const movement = (id: string, name: string, groupId: string | null): Movement => ({
  id,
  name,
  description: null,
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["jambes"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: groupId === null ? null : { groupId, sortKey: 0 },
});

const SQUATS_1 = movement("sq-1", "Squats assistés", "grp-squats");
const SQUATS_2 = movement("sq-2", "Squats", "grp-squats");
const SQUATS_3 = movement("sq-3", "Squats sautés", "grp-squats");
const FENTES = movement("fentes", "Fentes avant", null);

const service = {
  supportsMovementSearch: true,
  listMovementChoices: async () => [
    { movement: SQUATS_1, level: { rank: 1, total: 3 } },
    { movement: SQUATS_2, level: { rank: 2, total: 3 } },
    { movement: SQUATS_3, level: { rank: 3, total: 3 } },
    { movement: FENTES, level: null },
  ],
} as never;

function Harness() {
  const [draft, setDraft] = useState<SessionDraft>(createEmptyDraft());
  const value = {
    draft,
    updateDraft: (patch: Partial<SessionDraft>) => setDraft((current) => ({ ...current, ...patch })),
    suggestDraftName: jest.fn(),
    resetDraft: jest.fn(),
    hydrateFromSession: jest.fn(),
  } as unknown as SessionDraftContextValue;
  return (
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
        <SessionDraftContext.Provider value={value}>
          <FormatModelDraftProvider>
            <FormatModelScreen stage="questionnaire" />
          </FormatModelDraftProvider>
        </SessionDraftContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>
  );
}

async function openCatalogue() {
  render(<Harness />);
  await screen.findByTestId("format-title");
  await act(async () => {
    fireEvent.press(screen.getByTestId("format-movements-link"));
  });
  await screen.findByTestId("format-catalogue-card-fentes");
}

const flat = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);
const bottomLabel = () => within(screen.getByTestId("format-bottom-action"));

describe("Recette iPhone du 07/11/2026 — mode catalogue d'un Format", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    resetPreloadedKodjoIconsForTests();
  });

  it("A : la carte du dessus d'une pile repliée la déplie sans la sélectionner ; une carte de la pile dépliée se sélectionne", async () => {
    await openCatalogue();
    // Pile dépliée à l'ouverture : toucher le filet la replie.
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-family-grp-squats-rail"));
    });
    expect(screen.getByTestId("format-family-grp-squats-collapsed")).toBeTruthy();
    expect(screen.queryByTestId("format-catalogue-card-sq-2")).toBeNull();
    // Carte du dessus de la pile repliée : la pile se déplie, aucune sélection.
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-card-sq-3"));
    });
    expect(screen.queryByTestId("format-family-grp-squats-collapsed")).toBeNull();
    expect(screen.getByTestId("format-family-grp-squats")).toBeTruthy();
    expect(screen.getByTestId("format-catalogue-card-sq-3").props.accessibilityState).toMatchObject({ selected: false });
    expect(bottomLabel().getByText("Fermer sans sélectionner")).toBeTruthy();
    // Carte de la pile dépliée (la carte du dessus comprise) : sélection.
    fireEvent.press(screen.getByTestId("format-catalogue-card-sq-3"));
    expect(screen.getByTestId("format-catalogue-card-sq-3").props.accessibilityState).toMatchObject({ selected: true });
    expect(bottomLabel().getByText("Ajouter 1 mouvement")).toBeTruthy();
    fireEvent.press(screen.getByTestId("format-catalogue-card-sq-1"));
    expect(bottomLabel().getByText("Ajouter 2 mouvements")).toBeTruthy();
  });

  // [07/11 : « dans le mode catalogue seulement », Niveau couleur du nom (#14171C) — remplacé le 08/11/2026 (b-cat-niveau) :
  // Niveau noir (`colors.textPrimary`, #141414) et sur la ligne de base du nom partout (catalogue, questionnaire, récapitulatif).]
  it("B et b-cat-niveau (08/11) : Niveau en noir, aligné sur la ligne de base du nom — catalogue, puis carte du questionnaire", async () => {
    await openCatalogue();
    expect(flat("format-catalogue-card-sq-3-level").color).toBe("#141414");
    expect(flat("format-catalogue-card-sq-3-first-line").alignItems).toBe("baseline");
    fireEvent.press(screen.getByTestId("format-catalogue-card-sq-3"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
    });
    // Carte du questionnaire (même composant au récapitulatif) : même Niveau.
    expect(flat("format-movement-card-0-level").color).toBe("#141414");
    expect(flat("format-movement-card-0-first-line").alignItems).toBe("baseline");
  });

  it("H : une carte sans famille prend le retrait de 8 des cartes d'une pile", async () => {
    await openCatalogue();
    const family = flat("format-family-grp-squats");
    expect(flat("format-catalogue-item-fentes").paddingLeft).toBe(family.paddingLeft);
    expect(family.paddingLeft).toBe(8);
  });

  it("D : pastille des zones préchargée ; repli / dépli au filet — les cartes glissent depuis la carte du dessus, les suivantes changent de place", async () => {
    // [07/11 : `Image.prefetch(…, "memory-disk")` — remplacé le 08/11/2026 (b-cat-fondu) : image native préchargée
    // (`Image.loadAsync`), donnée pour source à la pastille, qui s'affiche dès son montage.]
    const nativeImage = { width: 13, height: 13 } as never;
    const loadAsync = jest.spyOn(Image, "loadAsync").mockResolvedValue(nativeImage);
    await openCatalogue();
    expect(loadAsync).toHaveBeenCalledWith(expect.objectContaining({ testUri: expect.stringContaining("icon-pastille-zone-corporelle") }));
    expect(preloadedKodjoIcon("card-body-zone-badge")).toBe(nativeImage);
    // Au repos : ni glissement ni transition de place.
    expect(screen.getByTestId("format-family-grp-squats-member-sq-2").props.entering).toBeUndefined();
    expect(screen.getByTestId("format-catalogue-item-fentes").props.layout).toBeUndefined();
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-family-grp-squats-rail"));
    });
    expect(screen.getByTestId("format-catalogue-item-fentes").props.layout).toBeDefined();
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-family-grp-squats-expand"));
    });
    expect(screen.getByTestId("format-family-grp-squats-member-sq-3").props.entering).toBeUndefined();
    expect(screen.getByTestId("format-family-grp-squats-member-sq-2").props.entering).toBeDefined();
    expect(screen.getByTestId("format-family-grp-squats-member-sq-2").props.exiting).toBeDefined();
    // Une pastille montée après le préchargement reçoit l'image native pour source (aucun chargement à l'affichage).
    const badge = render(<KodjoIcon name="card-body-zone-badge" testID="preloaded-badge" />);
    expect(badge.UNSAFE_getByType(Image).props.source).toBe(nativeImage);
  });

  it("E : « Fermer sans sélectionner », « Ajouter X mouvement » et « Revenir aux paramètres » ferment en fondu de 450 ms, puis les paramètres reviennent", async () => {
    const timing = jest.spyOn(Reanimated, "withTiming");
    await openCatalogue();
    const fadesOut = () => timing.mock.calls.filter(([toValue, config]) => toValue === 0 && (config as { duration?: number })?.duration === 450);

    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
    });
    expect(fadesOut()).toHaveLength(1);
    expect(screen.queryByTestId("format-catalogue")).toBeNull();
    expect(screen.getByTestId("format-parameters")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId("format-movements-link"));
    });
    fireEvent.press(await screen.findByTestId("format-catalogue-card-fentes"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
    });
    expect(fadesOut()).toHaveLength(2);
    expect(screen.getByTestId("format-movement-card-0")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId("format-movements-link"));
    });
    await screen.findByTestId("format-catalogue-card-fentes");
    await act(async () => {
      // En mode catalogue, le lien de la section est « Revenir aux paramètres ».
      fireEvent.press(screen.getByTestId("format-movements-link"));
    });
    expect(fadesOut()).toHaveLength(3);
    expect(screen.queryByTestId("format-catalogue")).toBeNull();
  });

  it("E : sous « Réduire les animations », la fermeture est immédiate, sans fondu", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    const timing = jest.spyOn(Reanimated, "withTiming");
    await openCatalogue();
    fireEvent.press(screen.getByTestId("format-catalogue-add"));
    expect(screen.queryByTestId("format-catalogue")).toBeNull();
    expect(timing.mock.calls.some(([toValue]) => toValue === 0)).toBe(false);
  });
});

/**
 * Recette iPhone du 08/11/2026 (Hermann) — b-cat-fondu, b-cat-fermer : fondu enchaîné entre les paramètres et le catalogue, sans page
 * blanche ; zone de contexte en place avec sa part fondue ; boutons, cartes et pastilles ensemble. Mécanismes vérifiés (aucun rendu).
 */
describe("Recette iPhone du 08/11/2026 — fondu enchaîné du mode catalogue d'un Format", () => {
  type Done = (finished?: boolean) => void;
  let fades: { to: number; done: Done | undefined }[];
  beforeEach(() => {
    jest.restoreAllMocks();
    resetPreloadedKodjoIconsForTests();
    // Le simulacre de `isReduceMotionEnabled` garde la valeur d'un test précédent : animations actives ici.
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
    fades = [];
    // Fondus retenus : leur fin est déclenchée par le test (états intermédiaires observables).
    jest.spyOn(Reanimated, "withTiming").mockImplementation(((to: number, _config: unknown, done?: Done) => {
      fades.push({ to, done });
      return to;
    }) as never);
  });
  const finishFade = async (to: number) => {
    const fade = [...fades].reverse().find((item) => item.to === to);
    await act(async () => {
      fade?.done?.(true);
    });
  };

  it("ouverture : la couche du catalogue apparaît par-dessus les paramètres, restés montés et immobiles ; un seul fondu (0 → 1)", async () => {
    await openCatalogue();
    await act(async () => {});
    expect(fades.map((fade) => fade.to)).toEqual([1]);
    // Les paramètres restent montés dessous (masqués à VoiceOver), sans fondu propre : aucun blanc entre les deux contenus.
    expect(screen.getByTestId("format-parameters", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId("format-questionnaire", { includeHiddenElements: true }).props.accessibilityElementsHidden).toBe(true);
    expect(StyleSheet.flatten(screen.getByTestId("format-content-fade", { includeHiddenElements: true }).props.style).opacity).toBeUndefined();
    // Résultats, recherche et bouton du bas dans la même couche (même opacité), commandes rendues avec la liste.
    const layer = within(screen.getByTestId("format-catalogue-layer"));
    expect(layer.getByTestId("format-catalogue-scroll")).toBeTruthy();
    expect(layer.getByTestId("format-search-zone")).toBeTruthy();
    expect(layer.getByTestId("format-catalogue-filter")).toBeTruthy();
    expect(layer.getByTestId("format-catalogue-add")).toBeTruthy();
    expect(screen.getByTestId("format-catalogue-filter").props.entering).toBeUndefined();
  });

  it("zone de contexte : au-dessus de la couche du catalogue (zIndex), part fondue toujours rendue ; la recherche n'y est pas", async () => {
    await openCatalogue();
    const band = screen.getByTestId("format-context-band");
    expect(StyleSheet.flatten(band.props.style).zIndex).toBe(1);
    expect(StyleSheet.flatten(screen.getByTestId("format-catalogue-layer").props.style).zIndex).toBeUndefined();
    expect(within(band).getByTestId("format-context-fade", { includeHiddenElements: true })).toBeTruthy();
    expect(within(band).queryByTestId("format-search-zone")).toBeNull();
    // Recherche figée à l'emplacement de la ligne « Mouvements » (101 + 16), sans mesure préalable (pas de saut de la liste).
    expect(StyleSheet.flatten(screen.getByTestId("format-search-zone").props.style)).toMatchObject({ marginTop: 101 + 16 });
  });

  it("« Ajouter 1 mouvement » : l'ajout est visible dans les paramètres pendant le fondu de sortie ; fermeture à la fin du fondu", async () => {
    await openCatalogue();
    fireEvent.press(screen.getByTestId("format-catalogue-card-fentes"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
    });
    expect(fades.filter((fade) => fade.to === 0)).toHaveLength(1);
    // Pendant le fondu : couche encore là, sans toucher ; paramètres de nouveau lisibles, avec la carte ajoutée.
    expect(screen.getByTestId("format-catalogue-layer").props.pointerEvents).toBe("none");
    expect(screen.getByTestId("format-movement-card-0")).toBeTruthy();
    expect(screen.getByTestId("format-questionnaire").props.accessibilityElementsHidden).toBe(false);
    await finishFade(0);
    expect(screen.queryByTestId("format-catalogue-layer")).toBeNull();
    expect(screen.getByTestId("format-movement-card-0")).toBeTruthy();
  });

  it("« Revenir aux paramètres » et « Fermer sans sélectionner » : même fondu enchaîné ; un second appui pendant le fondu est ignoré", async () => {
    await openCatalogue();
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-movements-link"));
    });
    await act(async () => {
      fireEvent.press(within(screen.getByTestId("format-search-zone")).getByTestId("format-movements-link"));
    });
    expect(fades.filter((fade) => fade.to === 0)).toHaveLength(1);
    expect(screen.getByTestId("format-catalogue-layer")).toBeTruthy();
    await finishFade(0);
    expect(screen.queryByTestId("format-catalogue-layer")).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByTestId("format-movements-link"));
    });
    await screen.findByTestId("format-catalogue-card-fentes");
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
    });
    expect(fades.filter((fade) => fade.to === 0)).toHaveLength(2);
    await finishFade(0);
    expect(screen.queryByTestId("format-catalogue-layer")).toBeNull();
    expect(screen.getByTestId("format-parameters")).toBeTruthy();
  });

  it("pastille des zones : le fondu d'apparition attend l'image native préchargée (cartes, boutons et pastilles ensemble)", async () => {
    let resolveIcon: (value: never) => void = () => undefined;
    const nativeImage = { width: 13, height: 13 } as never;
    jest.spyOn(Image, "loadAsync").mockImplementation(() => new Promise<never>((resolve) => (resolveIcon = resolve)));
    await openCatalogue();
    await act(async () => {});
    // Préchargement en cours : couche montée à l'opacité 0, aucun fondu lancé.
    expect(fades).toHaveLength(0);
    await act(async () => {
      resolveIcon(nativeImage);
    });
    expect(fades.map((fade) => fade.to)).toEqual([1]);
  });

  it("sous « Réduire les animations » : ouverture et fermeture immédiates, sans fondu", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    await openCatalogue();
    expect(screen.getByTestId("format-catalogue-layer")).toBeTruthy();
    fireEvent.press(screen.getByTestId("format-catalogue-add"));
    expect(screen.queryByTestId("format-catalogue-layer")).toBeNull();
    expect(fades).toHaveLength(0);
  });
});
