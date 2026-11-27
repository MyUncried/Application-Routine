import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { MediaAsset, MediaView } from "@/domain/media/MediaAsset";
import type { Activity } from "@/domain/sessions/Session";
import type { CatalogueSessionRecord } from "@/domain/sessions/SessionRepository";
import type { StructureElement } from "@/domain/sessions/structure";
import { cropFrame } from "@/features/activities/mediaCrop";
import { fitCategoryCount, formatSessionStructureLine, SESSION_CARD_HEADER_HEIGHT, SessionCard, sessionFormatsLabel } from "@/features/sessions/SessionCard";
import { projectSessionForCatalogue } from "@/features/sessions/sessionCatalogueProjection";
import { mosaicLayout } from "@/features/sessions/sessionMosaic";
import { colors } from "@/shared/ui/tokens";

/**
 * D-600, D-601, D-602 (Hermann, 24-25/11/2026 ; DSF Carte de séance — visuel en mosaïque et informations ; Figma
 * `13168:28159` Repliée, `13186:50543` Sélection, `13169:28171` mosaïque). Remplace les tests de la carte du 06/11/2026
 * (D-504 à D-506 : photo unique, chevron, catégories, « N circuits · N exercices », pilule Démarrer), dispositions retirées.
 */

let sequence = 0;
const photo = (id: string, view: MediaView | null = null): NonNullable<Activity["media"]>[number] => {
  const asset: MediaAsset = { id, uri: `kodjo-media/${id}.webp`, createdAt: "t", kind: "PHOTO", ...(view ? { view } : {}) };
  return { id: `link-${id}`, activityId: "a", assetId: id, position: 0, asset };
};
const exercise = (name: string, overrides: Partial<Activity> = {}): Activity => ({
  id: `ex-${++sequence}`,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  position: 0,
  name,
  sourceMovementId: `mov-${name}`,
  executionParameters: durationParameters(60),
  postActivityRecoverySeconds: null,
  instruction: null,
  bodyZoneIds: [],
  categoryId: null,
  media: [],
  ...overrides,
});
const withPhoto = (name: string, view: MediaView | null = null) => exercise(name, { media: [photo(`p-${name}`, view)] });

const projection = (elements: readonly StructureElement<Activity>[], overrides: Partial<CatalogueSessionRecord> = {}) =>
  projectSessionForCatalogue(
    {
      id: "s1",
      name: "EMOM du matin",
      color: "#F7D154",
      labelId: null,
      status: "ACTIVE",
      archivedAt: null,
      updatedAt: "2026-11-25T08:00:00.000Z",
      structure: { elements, stopPoints: [] },
      ...overrides,
    },
    new Map(),
  );
const flat = (exercises: readonly Activity[]) => projection(exercises.map((value) => ({ kind: "EXERCISE" as const, exercise: value })));
const names = (count: number) => Array.from({ length: count }, (_, index) => `M${index + 1}`);

describe("D-600 — disposition de la mosaïque (pure)", () => {
  it.each([
    [1, [[0, 0, 64, 64]], null],
    [2, [[0, 0, 31, 64], [33, 0, 31, 64]], null],
    [3, [[0, 0, 31, 64], [33, 0, 31, 31], [33, 33, 31, 31]], null],
    [4, [[0, 0, 31, 31], [33, 0, 31, 31], [0, 33, 31, 31], [33, 33, 31, 31]], null],
    [5, [[0, 0, 31, 31], [33, 0, 31, 31], [0, 33, 31, 31]], 2],
    [6, [[0, 0, 31, 31], [33, 0, 31, 31], [0, 33, 31, 31]], 3],
  ] as [number, number[][], number | null][])("%i image(s)", (count, cells, hidden) => {
    const layout = mosaicLayout(count);
    expect(layout.cells.map((cell) => [cell.left, cell.top, cell.width, cell.height])).toEqual(cells);
    expect(layout.counter === null ? null : layout.counter.hidden).toBe(hidden);
    if (layout.counter) expect(layout.counter.cell).toEqual({ left: 33, top: 33, width: 31, height: 31 });
  });

  it("aucune image : aucune case", () => {
    expect(mosaicLayout(0)).toEqual({ cells: [], counter: null });
  });
});

describe("D-600 — recadrage de la vue retenue (pur)", () => {
  // Image 1206 × 987 (gabarit des illustrations), deux vues : la droite retenue (x 50 %, largeur 50 %).
  const image = { width: 1206, height: 987 };
  const right = { x: 50, y: 0, width: 50, height: 100 };

  it("sans rectangle : l'image entière couvre la case, centrée", () => {
    const frame = cropFrame({ width: 64, height: 64 }, image, null);
    expect(frame.height).toBeCloseTo(64);
    expect(frame.width).toBeCloseTo(1206 * (64 / 987));
    expect(frame.left).toBeCloseTo(-(frame.width - 64) / 2);
    expect(frame.top).toBeCloseTo(0);
  });

  it("case plus verticale que la vue (31 × 64) : vue entière en hauteur, gauche et droite réduits autour du centre", () => {
    const frame = cropFrame({ width: 31, height: 64 }, image, right);
    const scale = 64 / 987;
    expect(frame.height).toBeCloseTo(64);
    expect(frame.top).toBeCloseTo(0);
    // Centre de la vue (75 % de l'image) au centre de la case.
    expect(frame.left + 0.75 * 1206 * scale).toBeCloseTo(15.5);
  });

  it("case plus horizontale que la vue (64 × 31) : vue entière en largeur, haut et bas réduits autour du centre", () => {
    const frame = cropFrame({ width: 64, height: 31 }, image, right);
    const scale = 64 / 603;
    expect(frame.width).toBeCloseTo(1206 * scale);
    // Bord gauche de la vue au bord gauche de la case.
    expect(frame.left + 603 * scale).toBeCloseTo(0);
    expect(frame.top + 0.5 * 987 * scale).toBeCloseTo(15.5);
  });

  it("vue du bas (« deux en haut, une en bas ») dans une case carrée : centrée sur la vue", () => {
    const frame = cropFrame({ width: 64, height: 64 }, image, { x: 0, y: 50, width: 100, height: 50 });
    const scale = 64 / 493.5;
    expect(frame.height).toBeCloseTo(987 * scale);
    expect(frame.top + 0.75 * 987 * scale).toBeCloseTo(32);
    expect(frame.left + 0.5 * 1206 * scale).toBeCloseTo(32);
  });
});

describe("D-600 — images retenues (projection)", () => {
  it("mouvements distincts, dans l'ordre de la composition ; un mouvement répété compte une fois ; sans image ignoré", () => {
    const value = flat([withPhoto("Pompes"), exercise("Gainage"), withPhoto("Burpees"), withPhoto("Pompes"), withPhoto("Squat")]);
    expect(value.mosaic.map((image) => image.key)).toEqual(["mov-Pompes", "mov-Burpees", "mov-Squat"]);
    expect(value.movementNames).toEqual(["Pompes", "Gainage", "Burpees", "Squat"]);
  });

  it("la vue retenue de l'asset suit l'image ; absente : nulle (image entière)", () => {
    const view = { x: 50.25, y: 0, width: 49.75, height: 100 };
    const value = flat([withPhoto("Pompes", view), withPhoto("Squat")]);
    expect(value.mosaic.map((image) => image.view)).toEqual([view, null]);
  });
});

describe("D-600 — mosaïque rendue", () => {
  it.each([1, 2, 3, 4])("%i image(s) : autant de cases, sans compteur", (count) => {
    render(<SessionCard projection={flat(names(count).map((name) => withPhoto(name)))} />);
    expect(screen.getByTestId(`session-card-s1-mosaic-${count}`)).toBeTruthy();
    expect(screen.queryByTestId(`session-card-s1-mosaic-cell-${count}`)).toBeNull();
    expect(screen.getByTestId(`session-card-s1-mosaic-cell-${count - 1}`)).toBeTruthy();
    expect(screen.queryByTestId("session-card-s1-mosaic-counter")).toBeNull();
  });

  it.each([
    [5, "+2"],
    [6, "+3"],
  ])("%i images : trois images et la case « %s »", (count, label) => {
    render(<SessionCard projection={flat(names(count).map((name) => withPhoto(name)))} />);
    expect(screen.getByTestId("session-card-s1-mosaic-cell-2")).toBeTruthy();
    expect(screen.queryByTestId("session-card-s1-mosaic-cell-3")).toBeNull();
    const counter = screen.getByTestId("session-card-s1-mosaic-counter");
    expect(counter).toHaveTextContent(label);
    expect(StyleSheet.flatten(counter.props.style)).toMatchObject({ left: 33, top: 33, width: 31, height: 31, backgroundColor: "#E3E6F2" });
  });

  it("mouvements sans image : ignorés de la mosaïque (deux images sur trois mouvements → deux colonnes)", () => {
    render(<SessionCard projection={flat([withPhoto("Pompes"), exercise("Gainage"), withPhoto("Squat")])} />);
    expect(screen.getByTestId("session-card-s1-mosaic-2")).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId("session-card-s1-mosaic-cell-1").props.style)).toMatchObject({ left: 33, width: 31, height: 64 });
  });

  it("aucune image : repli sur la vignette du format Libre", () => {
    render(<SessionCard projection={flat([exercise("Gainage")])} />);
    expect(screen.queryByTestId("session-card-s1-mosaic-1")).toBeNull();
    expect(screen.getByTestId("session-card-s1-format-FREE")).toBeTruthy();
  });

  it("photo cadrée sur sa vue retenue une fois ses dimensions connues", async () => {
    render(<SessionCard projection={flat([withPhoto("Pompes", { x: 50, y: 0, width: 50, height: 100 }), withPhoto("Squat")])} />);
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent(screen.getByTestId("session-card-s1-photo-0"), "load", { nativeEvent: { cacheType: "none", source: { url: "", width: 1206, height: 987, mediaType: null } } });
    });
    const expected = cropFrame({ width: 31, height: 64 }, { width: 1206, height: 987 }, { x: 50, y: 0, width: 50, height: 100 });
    const style = StyleSheet.flatten(screen.getByTestId("session-card-s1-photo-0").props.style);
    expect(style).toMatchObject({ position: "absolute" });
    expect(style.width).toBeCloseTo(expected.width);
    expect(style.left).toBeCloseTo(expected.left);
  });

  // Recette iPhone du 26/11/2026 (Hermann, « Séance sans photo » : « L'image est un cadre gris sans symbole. »).
  it("image illisible : ignorée comme un mouvement sans photo ; aucune image lisible : vignette Libre, pas de cadre gris", async () => {
    render(<SessionCard projection={flat([withPhoto("Pompes"), withPhoto("Squat")])} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId("session-card-s1-mosaic-2")).toBeTruthy();
    await act(async () => {
      fireEvent(screen.getByTestId("session-card-s1-photo-0"), "error", { nativeEvent: { error: "introuvable" } });
    });
    expect(screen.getByTestId("session-card-s1-mosaic-1")).toBeTruthy();
    expect(screen.queryByTestId("session-card-s1-photo-0-fallback")).toBeNull();
    await act(async () => {
      fireEvent(screen.getByTestId("session-card-s1-photo-0"), "error", { nativeEvent: { error: "introuvable" } });
    });
    expect(screen.queryByTestId("session-card-s1-mosaic-1")).toBeNull();
    expect(screen.getByTestId("session-card-s1-format-FREE")).toBeTruthy();
  });

  // Recette iPhone du 26/11/2026 (Hermann : « 5 exercices dont deux dans un circuit Tabata, il en compte 4 »).
  it("les mouvements d'un circuit Tabata comptent : trois libres et deux en Tabata → trois images et « +2 »", () => {
    const value = projection([
      { kind: "EXERCISE", exercise: withPhoto("M1") },
      { kind: "EXERCISE", exercise: withPhoto("M2") },
      { kind: "EXERCISE", exercise: withPhoto("M3") },
      { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 8, nature: "SERIES", originModel: "TABATA", exercises: [withPhoto("M4"), withPhoto("M5")] } },
    ]);
    expect(value.mosaic).toHaveLength(5);
    render(<SessionCard projection={value} />);
    expect(screen.getByTestId("session-card-s1-mosaic-5")).toBeTruthy();
    expect(screen.getByTestId("session-card-s1-mosaic-counter")).toHaveTextContent("+2");
  });
});

describe("D-601 — trois lignes", () => {
  it("ligne 1 nom ; ligne 2 durée · « Libre » sans format ; ligne 3 mouvements séparés par des virgules", () => {
    render(<SessionCard projection={flat([exercise("Pompes"), exercise("Burpees")])} />);
    expect(screen.getByTestId("session-card-s1-name")).toHaveTextContent("EMOM du matin");
    expect(screen.getByTestId("session-card-s1-formats")).toHaveTextContent("Libre");
    expect(screen.getByTestId("session-card-s1-movements-label")).toHaveTextContent("Pompes, Burpees");
  });

  it("ligne 2 : noms des formats distincts, dans l'ordre, en semi-gras", () => {
    const value = projection([
      { kind: "CIRCUIT", circuit: { id: "c1", repeatCount: 10, nature: "TOURS", format: { key: "EMOM", settings: {} } as never, exercises: [exercise("Pompes")] } },
      { kind: "CIRCUIT", circuit: { id: "c2", repeatCount: 8, nature: "TOURS", originModel: "TABATA", exercises: [exercise("Burpees")] } },
      { kind: "CIRCUIT", circuit: { id: "c3", repeatCount: 5, nature: "TOURS", format: { key: "EMOM", settings: {} } as never, exercises: [exercise("Squat")] } },
    ]);
    expect(value.formatNames).toEqual(["EMOM", "Tabata"]);
    expect(sessionFormatsLabel(value)).toBe("EMOM, Tabata");
    render(<SessionCard projection={value} />);
    const formats = screen.getByTestId("session-card-s1-formats");
    expect(formats).toHaveTextContent("EMOM, Tabata");
    expect(StyleSheet.flatten(formats.props.style)).toMatchObject({ fontFamily: "Inter_600SemiBold" });
  });

  it("ligne 3 : ce qui ne tient pas devient « +N » (mesures)", () => {
    render(<SessionCard projection={flat(["Pompes", "Burpees", "Squat saut", "Fentes", "Gainage"].map((name) => exercise(name)))} />);
    const layout = (id: string, width: number) => fireEvent(screen.getByTestId(id, { includeHiddenElements: true }), "layout", { nativeEvent: { layout: { width, height: 15, x: 0, y: 0 } } });
    [0, 1, 2, 3, 4].forEach((index) => layout(`session-card-s1-movements-measure-name-${index}`, 50));
    layout("session-card-s1-movements-measure-separator", 6);
    [1, 2, 3, 4].forEach((hidden) => layout(`session-card-s1-movements-measure-overflow-${hidden}`, 18));
    layout("session-card-s1-movements-texts", 180);
    // Trois noms (150 + 2 × 6 = 162) et « +2 » (18) = 180 ≤ 180.
    expect(screen.getByTestId("session-card-s1-movements-label")).toHaveTextContent("Pompes, Burpees, Squat saut +2");
  });

  it("une séance à un seul exercice : son mouvement, sans « 1 exercice » ni volume", () => {
    render(<SessionCard projection={flat([withPhoto("Pompes")])} />);
    expect(screen.getByTestId("session-card-s1-movements-label")).toHaveTextContent("Pompes");
    expect(screen.queryByText(/exercice/)).toBeNull();
    expect(screen.getByTestId("session-card-s1-mosaic-1")).toBeTruthy();
  });

  it("retirés : chevron, catégories, ligne « N circuits · N exercices » ; hauteur 72", () => {
    render(<SessionCard projection={flat([exercise("Pompes")])} />);
    expect(screen.queryByTestId("session-card-s1-disclosure")).toBeNull();
    expect(screen.queryByTestId("session-card-s1-categories")).toBeNull();
    expect(screen.queryByTestId("session-card-s1-summary")).toBeNull();
    expect(SESSION_CARD_HEADER_HEIGHT).toBe(72);
  });
});

describe("D-602 — Démarrer en icône ronde ; variante Sélection", () => {
  it("icône de 28 en relief, ombre de la couleur de la zone de contexte, centrée en hauteur, bord droit à 12", () => {
    const onStart = jest.fn();
    render(<SessionCard projection={flat([exercise("Pompes")])} onStart={onStart} />);
    const start = screen.getByTestId("session-card-s1-start");
    expect(start.props.accessibilityLabel).toBe("Démarrer");
    // Emplacement de toucher de 44 : (72 − 44) / 2 = 14 du haut ; 12 − 8 = 4 du bord droit (moins le liseré de 0,5).
    expect(StyleSheet.flatten(start.props.style)).toMatchObject({ position: "absolute", top: 13.5, right: 3.5 });
    const disc = screen.getByTestId("session-card-s1-start-icon-disc");
    expect(StyleSheet.flatten(disc.props.style).boxShadow).toBe(`0px 2.5px 3.5px ${colors.catalogueSessionsContext}, 0px 0.8px 1px ${colors.catalogueSessionsContext}`);
    fireEvent.press(start);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("sans action : présent, désactivé, annoncé indisponible", () => {
    render(<SessionCard projection={flat([exercise("Pompes")])} />);
    const start = screen.getByTestId("session-card-s1-start");
    expect(start.props.accessibilityState).toMatchObject({ disabled: true });
    expect(start.props.accessibilityLabel).toBe("Démarrer la séance — indisponible");
  });

  it("Sélection (modales de planification) : mêmes trois lignes et mosaïque, sans Démarrer", () => {
    render(<SessionCard projection={flat([withPhoto("Pompes"), withPhoto("Squat")])} context="planning" />);
    expect(screen.queryByTestId("session-card-s1-start")).toBeNull();
    expect(screen.getByTestId("session-card-s1-mosaic-2")).toBeTruthy();
    expect(screen.getByTestId("session-card-s1-movements-label")).toHaveTextContent("Pompes, Squat");
  });

  it("carte archivée : pas de Démarrer", () => {
    render(<SessionCard projection={projection([{ kind: "EXERCISE", exercise: exercise("Pompes") }], { status: "ARCHIVED" })} />);
    expect(screen.queryByTestId("session-card-s1-start")).toBeNull();
  });

  it("toucher le visuel ouvre la Séance", () => {
    const onOpen = jest.fn();
    render(<SessionCard projection={flat([exercise("Pompes")])} onOpen={onOpen} />);
    fireEvent.press(screen.getByTestId("session-card-s1-visual-open"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe("aides conservées", () => {
  it("formatSessionStructureLine : règle D-505 inchangée (hors carte repliée)", () => {
    expect(formatSessionStructureLine({ shownCircuitCount: 2, exerciseCount: 5 })).toBe("2 circuits · 5 exercices");
    expect(formatSessionStructureLine({ shownCircuitCount: null, exerciseCount: 1 })).toBe("1 exercice");
  });

  it("fitCategoryCount : noms entiers puis « +N »", () => {
    const overflow = () => 20;
    expect(fitCategoryCount([60, 50], 10, overflow, 200)).toBe(2);
    expect(fitCategoryCount([60, 50, 70], 10, overflow, 150)).toBe(2);
    expect(fitCategoryCount([60, 50, 70], 10, overflow, 100)).toBe(1);
    expect(fitCategoryCount([], 10, overflow, 100)).toBe(0);
  });
});
