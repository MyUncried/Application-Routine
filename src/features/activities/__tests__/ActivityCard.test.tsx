import { readFileSync } from "node:fs";
import path from "node:path";

import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { ActivityDefinition } from "@/domain/activities";
import { numberTarget, type ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import {
  allFailureParameters,
  durationParameters,
  repetitionParameters,
  uniformParameters,
  variableParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { ActivityMediaImportService } from "@/domain/media/ActivityMediaImportService";
import { ActivityCard, catalogueDuration } from "@/features/activities/ActivityCard";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { clearCatalogueVideoCovers } from "@/features/activities/catalogueVideoCover";
import { colors } from "@/shared/ui/tokens";
import { formatEstimatedDuration } from "@/features/sessions/formatSessionSummary";
import { strings } from "@/shared/i18n";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";

const BODY_ZONE_FIXTURES: readonly BodyZone[] = [
  { id: "cuisses", name: "Cuisses", isActive: true, createdAt: "2026-01-01T00:00:06.000Z" },
  { id: "dos", name: "Dos", isActive: true, createdAt: "2026-01-01T00:00:04.000Z" },
];

/**
 * `ActivityCard` s'auto-alimente en Zones corporelles persistées via
 * `ActivityDefinitionService.listBodyZones()` (V2-PRE-1, plan §3.1,
 * UI-07F470FC189F ; correction device check Hermann, commentaire 5948936550
 * — un accès direct à `useSQLiteContext` levait TOUJOURS en production,
 * cette carte étant rendue hors de `<SQLiteProvider>`) — doublé ici via
 * `ActivityDefinitionServiceContext`, jamais `expo-sqlite`/
 * `SqliteBodyZoneRepository`.
 */
function fakeActivityDefinitionService(): ActivityDefinitionService {
  return {
    listBodyZones: jest
      .fn<ActivityDefinitionService["listBodyZones"]>()
      .mockResolvedValue(BODY_ZONE_FIXTURES),
    // Story 4.4 : URI d'affichage d'un Média (URI interne relative résolue).
    resolveMediaUri: (uri: string) => `file:///documents/${uri}`,
  } as unknown as ActivityDefinitionService;
}

// Story 4.4 : générateur d'affiche existant, doublé (aucun lecteur natif en test).
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

function renderCard(ui: Parameters<typeof render>[0]) {
  return render(
    <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
      {ui}
    </ActivityDefinitionServiceContext.Provider>,
  );
}

const DEFINITION: ActivityDefinition = {
  id: "def-1",
  name: "Squat",
  description: null,
  executionParameters: durationParameters(30, 3, 10),
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  sideMode: "UNILATERAL",
  sideRecoverySeconds: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("ActivityCard", () => {
  it("renders the activity name", () => {
    renderCard(<ActivityCard definition={DEFINITION} />);
    expect(screen.getByText("Squat")).toBeTruthy();
  });

  it("opens editing when the main surface is pressed", () => {
    const onOpen = jest.fn();
    renderCard(<ActivityCard definition={DEFINITION} onOpen={onOpen} />);

    fireEvent.press(screen.getByTestId("activity-card-open"));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("is not pressable without onOpen", () => {
    renderCard(<ActivityCard definition={DEFINITION} />);
    expect(screen.queryByTestId("activity-card-open")).toBeNull();
  });

  // Alignement DSF 07/10 (annexe I.2, `DSF / Cards / Exercice` `6214:4111`) :
  // le chevron Déployer — un contrôle désactivé, sans action — n'existe plus
  // sur les cartes d'Exercice ; Lecture reste visible et désactivée.
  it("renders Lecture as disabled, without handler, and no Déployer chevron", () => {
    renderCard(<ActivityCard definition={DEFINITION} onOpen={jest.fn()} />);

    const play = screen.getByTestId("activity-card-play");
    expect(play.props.accessibilityState.disabled).toBe(true);

    expect(screen.queryByLabelText("Déployer l’exercice")).toBeNull();
  });

  /**
   * V2-CAT-01 (UI-CAT-R-002) : chaque carte affiche une marque de couleur,
   * les Zones corporelles, le mode/la cible, les Séries et la Pause — jamais
   * seulement le nom. V2-PRE-1 (plan §3.1) : plus aucune Récupération propre
   * à la Définition — aucune sous-carte Récupération n'existe donc plus ici.
   */
  it("shows a fixed color mark, the body zones and the mode/target/series/pause summary", async () => {
    renderCard(
      <ActivityCard
        definition={{
          ...DEFINITION,
          bodyZoneIds: ["dos"],
        }}
      />,
    );

    expect(screen.getByTestId(`activity-card-color-bar-${DEFINITION.id}`)).toBeTruthy();
    expect(await screen.findByTestId(`activity-card-body-zones-${DEFINITION.id}`)).toBeTruthy();
    expect(screen.getByText(/série/u)).toBeTruthy();
  });

  it("omits the body zones line when absent, without an empty line", async () => {
    renderCard(<ActivityCard definition={{ ...DEFINITION, bodyZoneIds: [] }} />);

    await screen.findByText("Squat");
    expect(screen.queryByTestId(`activity-card-body-zones-${DEFINITION.id}`)).toBeNull();
  });
});

/**
 * PRE-3 (DSF cartes-durée 07/10, phrase v1 §4, v13 §7) — durée intrinsèque
 * de la définition sur la carte Catalogue ; indicateur compact des Séries
 * variables ; aucune refonte de la carte.
 */
describe("ActivityCard — PRE-3", () => {
  const canonical = (overrides: Partial<ExecutionParameters>): ExecutionParameters => ({
    version: 2 as const,
    mode: "DURATION" as const,
    series: { kind: "UNIFORM" as const, count: 3, target: numberTarget(90), pauseSeconds: 15 },
    sideMode: "UNILATERAL" as const,
    sideOrder: "BY_SIDE" as const,
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    ...overrides,
  });

  it("durée exacte, ≈ en Répétitions avec bip, absente en tout échec ; « N séries variables » sans valeurs", () => {
    const { unmount } = renderCard(<ActivityCard definition={{ ...DEFINITION, executionParameters: canonical({}) }} onOpen={jest.fn()} />);
    expect(screen.getByTestId(`activity-card-${DEFINITION.id}-duration`).props.children).toBe("5 min 15 s");
    unmount();

    const reps = renderCard(
      <ActivityCard
        definition={{
          ...DEFINITION,
          executionParameters: canonical({
            mode: "REPETITIONS",
            series: { kind: "UNIFORM", count: 4, target: numberTarget(15), pauseSeconds: 15 },
            cadenceBeepIntervalSeconds: 4,
          }),
        }}
        onOpen={jest.fn()}
      />,
    );
    expect(screen.getByTestId(`activity-card-${DEFINITION.id}-duration`).props.children).toBe("≈ 5 min");
    reps.unmount();

    const variable = renderCard(
      <ActivityCard
        definition={{
          ...DEFINITION,
          executionParameters: variableParameters({ rows: [[30, 10], [45, 20]] }),
        }}
        onOpen={jest.fn()}
      />,
    );
    expect(screen.getByText("2 séries variables")).toBeTruthy();
    variable.unmount();

    // PRE-4 (Q24) : tout échec en Régime variables → « N séries à l’échec », sans durée.
    const failure = renderCard(
      <ActivityCard
        definition={{
          ...DEFINITION,
          executionParameters: variableParameters({ mode: "REPETITIONS", rows: [["FAILURE", 10], ["FAILURE", 20]] }),
        }}
        onOpen={jest.fn()}
      />,
    );
    expect(screen.queryByTestId(`activity-card-${DEFINITION.id}-duration`)).toBeNull();
    expect(screen.getByText("2 séries à l’échec")).toBeTruthy();
    failure.unmount();
  });
});

describe("ActivityCard — PRE-4 story 1.1", () => {
  it("PRE4-1.1/AC21 — carte Catalogue d’un ancien Exercice « à l’échec » migré : « 3 séries à l’échec », aucune durée, jamais « 0 s » ni « 0 rép. »", () => {
    renderCard(
      <ActivityCard
        definition={{ ...DEFINITION, executionParameters: allFailureParameters(3, 10, { cadenceBeepIntervalSeconds: 2 }) }}
        onOpen={jest.fn()}
      />,
    );
    expect(screen.getByText("3 séries à l’échec, avec 10 s de pause entre les séries")).toBeTruthy();
    expect(screen.queryByTestId(`activity-card-${DEFINITION.id}-duration`)).toBeNull();
    expect(screen.queryByText(/(^|[^0-9])0 (s|rép)/u)).toBeNull();
  });

  it("PRE4-1.1/AC23 — Cible à renseigner héritée : « Paramètres à compléter. », aucune durée", () => {
    renderCard(
      <ActivityCard definition={{ ...DEFINITION, executionParameters: durationParameters("UNSET", 3, 10) }} onOpen={jest.fn()} />,
    );
    expect(screen.getByText("Paramètres à compléter.")).toBeTruthy();
    expect(screen.queryByTestId(`activity-card-${DEFINITION.id}-duration`)).toBeNull();
  });
});

describe("ActivityCard — PRE-4 story 2.1", () => {
  it("PRE4-2.1/AC9 — mélange de Cibles : durée « ≥ » du montant connu ; Cible à renseigner ou tout échec : aucune durée, ni « 0 s » ni tiret", () => {
    const partial = renderCard(
      <ActivityCard
        definition={{ ...DEFINITION, executionParameters: variableParameters({ rows: [[30, 10], [45, 10], ["FAILURE", 10]] }) }}
        onOpen={jest.fn()}
      />,
    );
    // (30 + 45) + 3 × 10 = 105 s.
    expect(screen.getByTestId(`activity-card-${DEFINITION.id}-duration`).props.children).toBe("≥ 1 min 45 s");
    partial.unmount();

    for (const executionParameters of [
      variableParameters({ rows: [[30, 10], ["UNSET", 10], [45, 10]] }),
      variableParameters({ rows: [["FAILURE", 10], ["FAILURE", 10]] }),
    ]) {
      const view = renderCard(<ActivityCard definition={{ ...DEFINITION, executionParameters }} onOpen={jest.fn()} />);
      expect(screen.queryByTestId(`activity-card-${DEFINITION.id}-duration`)).toBeNull();
      expect(screen.queryAllByText(/(^|[^0-9])0 s|—/u)).toHaveLength(0);
      view.unmount();
    }
  });
});

/**
 * PRE-4 story 2.4 — durée et résumé de la carte Catalogue (AC1 à AC3, AC6).
 * Attendus écrits en constantes ou en formules (AD-10) ; ceux de l'AC2 sont
 * les sorties de `catalogueDuration` du code de départ
 * (`git show c32e360d:src/features/activities/ActivityCard.tsx`, l. 114-121 :
 * `formatPhraseDuration`, précédé de « ≈ » si estimé, sans arrondi).
 */
describe("ActivityCard — PRE-4 story 2.4", () => {
  /** Ligne de durée rendue : texte exact attendu, ou absente (`null`). */
  const expectDuration = (executionParameters: ExecutionParameters, expected: string | null): void => {
    const view = renderCard(<ActivityCard definition={{ ...DEFINITION, executionParameters }} onOpen={jest.fn()} />);
    if (expected === null) {
      expect(screen.queryByTestId(`activity-card-${DEFINITION.id}-duration`)).toBeNull();
    } else {
      expect(screen.getByTestId(`activity-card-${DEFINITION.id}-duration`)).toHaveTextContent(expected, { exact: true });
    }
    view.unmount();
  };

  it("PRE4-2.4/AC1 — durée partielle : « ≥ » en min s sans arrondi ; Répétitions Bip 0 : aucune ligne de durée", () => {
    // R01 : (30 + 45) + 3 × 10 = 105 s.
    const r01 = variableParameters({ rows: [[30, 10], [45, 10], ["FAILURE", 10]] });
    expectDuration(r01, "≥ 1 min 45 s");
    // En Durée, le Bip ne change ni le montant ni la nature.
    expectDuration({ ...r01, cadenceBeepIntervalSeconds: 2 }, "≥ 1 min 45 s");
    // Mixte Figma : (30 + 45) + (10 + 20 + 30) = 135 s.
    expectDuration(variableParameters({ rows: [[30, 10], [45, 20], ["FAILURE", 30]] }), "≥ 2 min 15 s");
    // Même Exercice en Répétitions, Bip 0 : `omitted`, aucune ligne.
    expectDuration(variableParameters({ mode: "REPETITIONS", rows: [[30, 10], [45, 10], ["FAILURE", 10]] }), null);
  });

  it("PRE4-2.4/AC2 — exact et estimé : rendu Catalogue du code de départ conservé (165 → 2 min 45 s, 104 → ≈ 1 min 44 s, 120 → 2 min)", () => {
    // Constantes relevées sur le code de départ, jamais recalculées par le code testé.
    const BASELINE_165_EXACT = "2 min 45 s";
    const BASELINE_104_ESTIMATED = "≈ 1 min 44 s";
    const BASELINE_120_EXACT = "2 min";
    // 3 × 55 s, sans Pause = 165 s.
    expectDuration(durationParameters(55, 3, 0), BASELINE_165_EXACT);
    // 2 Séries × 13 rép. × Bip 4 s = 104 s.
    expectDuration(repetitionParameters(13, 2, 0, { cadenceBeepIntervalSeconds: 4 }), BASELINE_104_ESTIMATED);
    // 2 × 60 s = 120 s.
    expectDuration(durationParameters(60, 2, 0), BASELINE_120_EXACT);
  });

  it("PRE4-2.4/AC3 — total omis ou Cible à renseigner : aucune ligne de durée ; `UNSET` → « Paramètres à compléter. »", () => {
    for (const executionParameters of [
      repetitionParameters(12, 3, 10),
      allFailureParameters(3, 10),
      allFailureParameters(3, 10, { cadenceBeepIntervalSeconds: 2 }),
      uniformParameters({ mode: "DURATION", count: 3, target: "FAILURE", pauseSeconds: 10 }),
    ]) {
      const view = renderCard(<ActivityCard definition={{ ...DEFINITION, executionParameters }} onOpen={jest.fn()} />);
      expect(screen.queryByTestId(`activity-card-${DEFINITION.id}-duration`)).toBeNull();
      expect(screen.queryAllByText(/(^|[^0-9])0 s|(^|[^0-9])0 rép|—/u)).toHaveLength(0);
      view.unmount();
    }
    for (const executionParameters of [
      durationParameters("UNSET", 3, 10),
      variableParameters({ rows: [[30, 10], ["UNSET", 10], [45, 10]] }),
    ]) {
      const view = renderCard(<ActivityCard definition={{ ...DEFINITION, executionParameters }} onOpen={jest.fn()} />);
      expect(screen.queryByTestId(`activity-card-${DEFINITION.id}-duration`)).toBeNull();
      expect(screen.getByText("Paramètres à compléter.")).toBeTruthy();
      expect(screen.queryAllByText(/(^|[^0-9])0 s|—/u)).toHaveLength(0);
      view.unmount();
    }
  });

  it("PRE4-2.4/AC6 — source unique : la carte affiche le montant du domaine, sans recalcul, sans Phrase ; symboles du lexique", () => {
    // Attendus écrits à la main : 3 × 55 = 165 s ; 3 × 30 + 3 × 10 = 120 s ;
    // 2 × 13 × 4 = 104 s ; (30 + 45) + (10 + 20 + 30) = 135 s.
    const samples: readonly (readonly [ExecutionParameters, string | null])[] = [
      [durationParameters(55, 3, 0), "2 min 45 s"],
      [durationParameters(30, 3, 10), "2 min"],
      [repetitionParameters(13, 2, 0, { cadenceBeepIntervalSeconds: 4 }), "≈ 1 min 44 s"],
      [repetitionParameters(12, 3, 10), null],
      [variableParameters({ rows: [[30, 10], [45, 20], ["FAILURE", 30]] }), "≥ 2 min 15 s"],
      [variableParameters({ rows: [[30, 10], ["UNSET", 10], [45, 10]] }), null],
      [allFailureParameters(3, 10), null],
    ];
    for (const [executionParameters, expected] of samples) {
      expect(catalogueDuration({ ...DEFINITION, executionParameters })).toBe(expected);
      expectDuration(executionParameters, expected);
      const view = renderCard(<ActivityCard definition={{ ...DEFINITION, executionParameters }} onOpen={jest.fn()} />);
      // Aucune Phrase des paramètres sur la carte (FR-16-11).
      expect(screen.queryAllByText(/Durée totale|menées jusqu’à l’échec|cadencées/u)).toHaveLength(0);
      view.unmount();
    }
    // Les symboles restent des clés du lexique (NFR-08).
    expect(strings.shared.durationNature).toEqual({ estimatedPrefix: "≈ ", lowerBoundPrefix: "≥ " });
    // Aucun module de carte ne code un symbole en dur ni n'arrondit une durée
    // d'Exercice : le code (commentaires retirés) ne contient ni « ≥ », ni « ≈ »,
    // ni `Math.ceil`.
    const repositoryRoot = path.resolve(__dirname, "../../../..");
    for (const file of ["src/features/activities/ActivityCard.tsx", "src/features/sessions/compositionPresentation.ts"]) {
      const code = readFileSync(path.join(repositoryRoot, file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//gu, "")
        .replace(/\/\/.*$/gmu, "");
      expect(code).not.toMatch(/[≥≈]|Math\.ceil/u);
    }
    // Les cartes de Séance gardent `formatEstimatedDuration`, arrondi compris.
    expect(formatEstimatedDuration(105, "lowerBound")).toBe("≥ 2 min");
    expect(formatEstimatedDuration(104, "estimated")).toBe("≈ 2 min");
    expect(formatEstimatedDuration(165, "exact")).toBe("3 min");
  });
});

/**
 * PRE-4 story 4.4 (AC3, FR-21-02, D-264 ; ch. 13 §4.11 et l. 396) : vignette
 * du PREMIER Média de la galerie sur la carte du Catalogue ; couverture d'une
 * vidéo par le générateur d'affiche existant, en cache par URI ; vignette
 * touchable (surface « Modifier l'exercice ») et décorative pour VoiceOver
 * (Q50 e) ; repli neutre si le fichier est illisible. Sans Média, carte du
 * départ. Rappel NFR-04 : aucun rendu n'est prouvé ici.
 */
describe("ActivityCard — PRE-4 story 4.4", () => {
  // La vignette est masquée de l'accessibilité : les requêtes par identifiant l'incluent explicitement.
  const hidden = { includeHiddenElements: true } as const;
  const poster = jest.requireMock("@/infrastructure/media/VideoPoster") as { generateVideoPoster: jest.Mock<(uri: string) => Promise<unknown>> };
  const asset = (id: string, kind: "PHOTO" | "VIDEO") => ({
    id: `link-${id}`,
    activityDefinitionId: "def-1",
    assetId: id,
    position: 0,
    asset: { id, uri: `kodjo-media/${id}`, createdAt: "now", kind, durationMs: kind === "VIDEO" ? 1000 : null },
  });
  const withMedia = (...media: ReturnType<typeof asset>[]): ActivityDefinition => ({
    ...DEFINITION,
    media: media.map((item, position) => ({ ...item, position })),
  });
  const coverImage = { width: 256, height: 144, release: jest.fn() };

  beforeEach(async () => {
    await clearCatalogueVideoCovers();
    poster.generateVideoPoster.mockReset();
    poster.generateVideoPoster.mockImplementation(async () => null);
  });

  it("PRE4-4.4/AC3 — photo en tête : vignette carrée du premier Média (URI résolue, `cover`) ; texte à 88 du bord ; emplacement de hauteur repliée fixe, ancré en haut (carte plus haute que 91 : vignette toujours centrée sur les 91 premiers points)", () => {
    const long: ActivityDefinition = {
      ...withMedia(asset("p2", "PHOTO"), asset("p1", "PHOTO")),
      name: "Squat sauté avec un nom assez long pour passer sur deux lignes dans la carte du Catalogue",
    };
    renderCard(<ActivityCard definition={long} onOpen={jest.fn()} />);
    const square = StyleSheet.flatten(screen.getByTestId("activity-card-thumbnail-def-1", hidden).props.style);
    expect(square).toMatchObject({ width: 64, height: 64, overflow: "hidden" });
    const image = screen.getByTestId("activity-card-thumbnail-image-def-1", hidden);
    expect(image.props.source).toEqual([expect.objectContaining({ uri: "file:///documents/kodjo-media/p2" })]);
    expect(image.props.contentFit).toBe("cover");
    const bar = StyleSheet.flatten(screen.getByTestId("activity-card-color-bar-def-1").props.style);
    const slot = StyleSheet.flatten(screen.getByTestId("activity-card-thumbnail-slot-def-1", hidden).props.style);
    const content = StyleSheet.flatten(screen.getByTestId("activity-card-open").props.style);
    expect((bar.width as number) + (slot.marginLeft as number) + 64 + (content.paddingLeft as number)).toBe(88);
    // Hauteur fixe de la carte repliée, sans étirement : centre de la vignette à 91 / 2 du haut quelle que soit la hauteur de la carte.
    expect(slot).toMatchObject({ alignSelf: "flex-start", height: 91, justifyContent: "center" });
    expect(slot.minHeight).toBeUndefined();
    expect(slot.alignSelf).not.toBe("stretch");
  });

  it("PRE4-4.4/AC3 — vignette touchable et décorative (Q50 e) : son toucher ouvre l'Éditeur comme la carte ; masquée de l'accessibilité, aucun arrêt VoiceOver en double ; sans `onOpen`, non touchable", () => {
    const onOpen = jest.fn();
    const { unmount } = renderCard(<ActivityCard definition={withMedia(asset("p1", "PHOTO"))} onOpen={onOpen} />);
    const slot = screen.getByTestId("activity-card-thumbnail-slot-def-1", hidden);
    fireEvent.press(slot);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(slot.props).toMatchObject({
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
    });
    expect(screen.queryAllByRole("image")).toHaveLength(0);
    expect(screen.queryByLabelText("Squat")).toBeNull();
    expect(screen.getAllByRole("button", { name: strings.screens.activities.card.openAccessibilityLabel })).toHaveLength(1);
    unmount();

    renderCard(<ActivityCard definition={withMedia(asset("p1", "PHOTO"))} />);
    expect(screen.getByTestId("activity-card-thumbnail-slot-def-1", hidden).props.onPress).toBeUndefined();
    expect(screen.queryAllByRole("button", { name: strings.screens.activities.card.openAccessibilityLabel })).toHaveLength(0);
  });

  it("PRE4-4.4/AC3 — photo introuvable ou illisible : repli neutre, aucune image", () => {
    renderCard(<ActivityCard definition={withMedia(asset("p1", "PHOTO"))} onOpen={jest.fn()} />);
    expect(screen.queryByTestId("activity-card-thumbnail-fallback-def-1", hidden)).toBeNull();
    fireEvent(screen.getByTestId("activity-card-thumbnail-image-def-1", hidden), "error", { nativeEvent: { error: "introuvable" } });
    expect(screen.queryByTestId("activity-card-thumbnail-image-def-1", hidden)).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("activity-card-thumbnail-fallback-def-1", hidden).props.style)).toMatchObject({
      width: "100%",
      height: "100%",
      backgroundColor: colors.surface,
    });
  });

  it("PRE4-4.4/AC3 — vidéo en tête : couverture du seul premier Média par le générateur existant, dans le carré 64, `cover`, sans badge ; repli pendant la génération", async () => {
    poster.generateVideoPoster.mockImplementation(async () => ({ image: coverImage, release: jest.fn() }));
    renderCard(<ActivityCard definition={withMedia(asset("v1", "VIDEO"), asset("v2", "VIDEO"))} />);
    expect(screen.getByTestId("activity-card-thumbnail-fallback-def-1", hidden)).toBeTruthy();
    const image = await screen.findByTestId("activity-card-thumbnail-image-def-1", hidden);
    expect(poster.generateVideoPoster).toHaveBeenCalledTimes(1);
    expect(poster.generateVideoPoster).toHaveBeenCalledWith("file:///documents/kodjo-media/v1");
    expect(image.props.source[0]).toBe(coverImage);
    expect(image.props.contentFit).toBe("cover");
    const square = screen.getByTestId("activity-card-thumbnail-def-1", hidden);
    expect(StyleSheet.flatten(square.props.style)).toMatchObject({ width: 64, height: 64 });
    expect(screen.queryByText(strings.executionParameters.media.video)).toBeNull();
    expect(screen.queryByTestId("activity-card-thumbnail-fallback-def-1", hidden)).toBeNull();
  });

  it("PRE4-4.4/AC3 — couverture vidéo en échec (affiche absente ou rejet) : repli neutre, aucun rejet non géré", async () => {
    poster.generateVideoPoster.mockImplementationOnce(async () => {
      throw new Error("lecteur indisponible");
    });
    const { unmount } = renderCard(<ActivityCard definition={withMedia(asset("v1", "VIDEO"))} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId("activity-card-thumbnail-fallback-def-1", hidden)).toBeTruthy();
    expect(screen.queryByTestId("activity-card-thumbnail-image-def-1", hidden)).toBeNull();
    unmount();

    renderCard(<ActivityCard definition={withMedia(asset("v2", "VIDEO"))} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId("activity-card-thumbnail-fallback-def-1", hidden)).toBeTruthy();
    expect(screen.queryByTestId("activity-card-thumbnail-image-def-1", hidden)).toBeNull();
  });

  it("PRE4-4.4/AC3 — cache des couvertures par URI : deux montages successifs et deux cartes de même vidéo, une seule génération", async () => {
    poster.generateVideoPoster.mockImplementation(async () => ({ image: coverImage, release: jest.fn() }));
    const first = renderCard(<ActivityCard definition={withMedia(asset("v1", "VIDEO"))} />);
    await screen.findByTestId("activity-card-thumbnail-image-def-1", hidden);
    first.unmount();
    renderCard(
      <>
        <ActivityCard definition={withMedia(asset("v1", "VIDEO"))} />
        <ActivityCard definition={{ ...withMedia(asset("v1", "VIDEO")), id: "def-2" }} />
      </>,
    );
    await screen.findByTestId("activity-card-thumbnail-image-def-2", hidden);
    expect(screen.getByTestId("activity-card-thumbnail-image-def-1", hidden).props.source[0]).toBe(coverImage);
    expect(poster.generateVideoPoster).toHaveBeenCalledTimes(1);
  });

  it("PRE4-4.4/AC3 — chemin réel de résolution : `ActivityDefinitionService.resolveMediaUri` → service d'import → `resolveUri` du stockage", () => {
    const store = {
      copyToInternal: async () => ({ uri: "", sizeBytes: null }),
      availableBytes: () => null,
      deletePrepared: async () => undefined,
      resolveUri: (uri: string) => `file:///app/Documents/${uri}`,
    };
    const importService = new ActivityMediaImportService({ pickFromLibrary: async () => ({ status: "CANCELED" }) }, store, () => "id");
    const service = new ActivityDefinitionService(
      {} as never,
      undefined,
      { listAll: async () => BODY_ZONE_FIXTURES } as never,
      undefined,
      { importService, repository: {} as never },
    );
    render(
      <ActivityDefinitionServiceContext.Provider value={service}>
        <ActivityCard definition={withMedia(asset("p1", "PHOTO"))} />
      </ActivityDefinitionServiceContext.Provider>,
    );
    expect(screen.getByTestId("activity-card-thumbnail-image-def-1", hidden).props.source).toEqual([
      expect.objectContaining({ uri: "file:///app/Documents/kodjo-media/p1" }),
    ]);
  });

  it("PRE4-4.4/AC3 — sans Média (absent ou liste vide) : aucune vignette, texte à la marge du départ (16)", () => {
    for (const definition of [DEFINITION, withMedia()]) {
      const { unmount } = renderCard(<ActivityCard definition={definition} onOpen={jest.fn()} />);
      expect(screen.queryByTestId("activity-card-thumbnail-slot-def-1", hidden)).toBeNull();
      const content = StyleSheet.flatten(screen.getByTestId("activity-card-open").props.style);
      expect(content.paddingLeft).toBeUndefined();
      expect(content.paddingHorizontal).toBe(16);
      unmount();
    }
  });
});
