import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { useEffect, useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { State } from "react-native-gesture-handler";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";

import type { Movement } from "@/domain/activities/Movement";
import { UNIT_CHOICE_AT_ADD, type FormatModelKey } from "@/domain/sessions/formatModels";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { FormatModelDraftProvider } from "@/features/sessions/FormatModelDraftContext";
import { FormatModelScreen } from "@/features/sessions/FormatModelScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { enterExecutionSheetValue } from "@/features/activities/testing/executionSheetActions";
import { colors } from "@/shared/ui/tokens";
import { valueFieldColors } from "@/shared/ui/valueField";

/**
 * Mission FORMATS-TABLEAU-UNIQUE-20261115 — décision de Hermann du 15/11/2026 (registre ch07, « Formats à tableau — écran unique,
 * sans redondance (15/11/2026) » ; CE-FMT-02 §4 et §8) : Tabata, 30/30, Renforcement, À l'échec, Progression, EMOM, Superset, Death by et
 * AMRAP s'ouvrent sur un écran unique — cadre des paramètres pleine largeur, puis tableau pleine largeur des mouvements ; ni
 * questionnaire, ni cartes. Aucun contrôle visuel : la vérification visuelle et tactile est faite par Hermann sur iPhone.
 */

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockModel = "TABATA";
let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: () => `uuid-${++mockUuid}` }));
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ push: mockPush, back: mockBack, dismissTo: jest.fn(), dismiss: jest.fn() }),
    useNavigation: () => ({
      getState: () => ({
        index: 2,
        routes: [{ name: "(tabs)" }, { name: "(creation)", params: { screen: "composition", params: { sessionId: "ses-1" } } }, { name: "format-summary", params: { model: mockModel } }],
      }),
    }),
    useLocalSearchParams: () => ({ model: mockModel }),
    useFocusEffect: () => undefined,
  };
});

const movement = (id: string, name: string): Movement => ({
  id,
  name,
  description: null,
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["jambes"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: null,
});
const SQUATS = movement("mv-squats", "Squats sautés");
const FENTES = movement("mv-fentes", "Fentes avant");
const service = {
  supportsMovementSearch: true,
  listMovementChoices: async () => [
    { movement: SQUATS, level: { rank: 3, total: 3 } },
    { movement: FENTES, level: null },
  ],
} as never;
const t = strings.screens.formatModel;

/**
 * D-603 / D-604 (Hermann, 25/11/2026 ; Formats §§ 9.6 et 9.7) : à la première ouverture, le choix des mouvements s'affiche en premier.
 * Les scénarios qui commencent par les paramètres le quittent d'abord, comme l'utilisateur (« Fermer sans sélectionner »).
 */
async function openedFormat() {
  const title = await screen.findByTestId("format-title");
  const leave = screen.queryByTestId("format-catalogue-add");
  if (leave !== null) {
    await act(async () => {
      fireEvent.press(leave);
    });
  }
  return title;
}

function Harness({ draftRef }: { draftRef: { current: SessionDraft } }) {
  const [draft, setDraft] = useState<SessionDraft>(createEmptyDraft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft, draftRef]);
  const update = (patch: Partial<SessionDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const value = { draft, updateDraft: update, suggestDraftName: (name: string) => update({ name }), resetDraft: jest.fn(), hydrateFromSession: jest.fn() } as unknown as SessionDraftContextValue;
  return (
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
        <SessionDraftContext.Provider value={value}>
          <FormatModelDraftProvider>
            {/* Même route pour tous les Formats : l'étape passée est ignorée, l'écran est unique. */}
            <FormatModelScreen stage="questionnaire" />
          </FormatModelDraftProvider>
        </SessionDraftContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>
  );
}

async function open(model: FormatModelKey, draftRef = { current: createEmptyDraft() }) {
  mockModel = model;
  render(<Harness draftRef={draftRef} />);
  await openedFormat();
  return draftRef;
}

async function pick(query: string, id: string, section = "format-movements") {
  fireEvent.press(screen.getByTestId(`${section}-link`));
  fireEvent.changeText(screen.getByTestId("format-catalogue-search"), query);
  fireEvent.press(await screen.findByTestId(`format-catalogue-card-${id}`));
  await act(async () => {
    fireEvent.press(screen.getByTestId("format-catalogue-add"));
  });
}

function typeValue(id: string, digits: string) {
  fireEvent(screen.getByTestId(`format-${id}`), "focus");
  fireEvent.changeText(screen.getByTestId(`format-${id}`), digits);
  fireEvent(screen.getByTestId(`format-${id}`), "blur");
}

function shown(id: string): string {
  return screen.getByTestId(`format-${id}`).props.value as string;
}

const heads = (block: string) => screen.getAllByTestId(new RegExp(`^${block}-head-\\d+$`)).map((head) => String(head.props.children));
/** Ligne sous le nom (décision de Hermann du 16/11/2026) : « Paramètres à compléter », ou l'unité et « · bilatéral ». */
const parametersLine = (index: number) => screen.getByTestId(`format-line-${index}-parameters`);
const color = (node: ReturnType<typeof screen.getByTestId>) => StyleSheet.flatten(node.props.style as object) as { color?: string };

/**
 * Mission FORMATS-MODALE-PARAMS-20261116 : la zone du nom ouvre la modale des paramètres d'exécution du mouvement ; `steps` y agit,
 * puis ✓ la ferme (descente animée achevée).
 */
async function inSheet(index: number, steps: () => void) {
  fireEvent.press(screen.getByTestId(`format-line-${index}-name-open`));
  await screen.findByTestId("execution-sheet");
  steps();
  await validateSheet();
}

/** ✓ de la modale : un premier appui range d'abord un champ resté ouvert (comportement de la modale), le suivant valide. */
async function validateSheet() {
  for (let press = 0; press < 2 && screen.queryByTestId("execution-sheet") !== null; press += 1)
    await act(async () => {
      fireEvent.press(screen.getByTestId("execution-sheet-validate"));
    });
  await waitFor(() => expect(screen.queryByTestId("execution-sheet")).toBeNull(), { timeout: 4000 });
}

/**
 * Objectifs de la modale renseignés (`value` pour chaque série) : la modale ne se valide qu'avec des objectifs complets, comme dans la
 * Composition.
 */
function fillTargets(value: number) {
  const hidden = { includeHiddenElements: true };
  if (screen.queryByTestId("execution-sheet-target", hidden) !== null) enterExecutionSheetValue("execution-sheet-target", value, "integer");
  for (let n = 1; screen.queryByTestId(`execution-sheet-table-row-${n}-target`, hidden) !== null; n += 1)
    enterExecutionSheetValue(`execution-sheet-table-row-${n}-target`, value, "integer");
  // Recette du 16/11/2026 (mp-charge) : Incrément sans valeur par défaut (« — ») — renseigné aussi.
  const increment = screen.queryByTestId("execution-sheet-format-increment", hidden);
  if (increment !== null && within(increment).queryByText("—") !== null) enterExecutionSheetValue("execution-sheet-format-increment", 1, "integer");
}

/** Unité choisie dans la modale (Répétitions ou Durée), objectifs renseignés. */
const chooseUnit = (index: number, mode: "REPETITIONS" | "DURATION", value = 10) =>
  inSheet(index, () => {
    fireEvent.press(screen.getByTestId(`execution-sheet-mode-control-${mode}`));
    fillTargets(value);
  });

const ALL: readonly FormatModelKey[] = ["TABATA", "INTERVALS_30_30", "STRENGTH", "UNTIL_FAILURE", "PROGRESSION", "EMOM", "SUPERSET", "DEATH_BY", "AMRAP"];

describe("Formats à tableau — écran unique, sans questionnaire (décision de Hermann du 15/11/2026)", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockBack.mockReset();
  });

  it.each(ALL)("%s : écran unique — ni questionnaire, ni « Valider les paramètres », ni interrupteur ; cadre des paramètres pleine largeur ; Retour quitte le Format", async (model) => {
    const draftRef = await open(model);
    expect(screen.getByTestId("format-summary")).toBeTruthy();
    expect(screen.queryByTestId("format-questionnaire")).toBeNull();
    expect(screen.queryByTestId("format-validate")).toBeNull();
    for (const id of ["format-withLoad", "format-buyIn", "format-increasingVolume"]) expect(screen.queryByTestId(id)).toBeNull();
    // Décision de Hermann du 16/11/2026 (« AMRAP — réglages conservés ») : Nombre d'AMRAP dans le cadre de l'AMRAP seulement.
    if (model !== "AMRAP") expect(screen.queryByTestId("format-row-blockCount")).toBeNull();
    // Cadre « Paramètres d'exécution » : pleine largeur, lignes de 31 (CE-FMT-02 §8).
    expect(StyleSheet.flatten(screen.getByTestId("format-parameters").props.style)).toMatchObject({ marginHorizontal: 0, borderRadius: 0, paddingHorizontal: 12 });
    const firstRow = screen.getAllByTestId(/^format-row-/)[0]!;
    expect(StyleSheet.flatten(firstRow.props.style)).toMatchObject({ height: 31 });
    // Tableau des mouvements pleine largeur, « + Ajouter » dans son en-tête ; AMRAP : blocs Buy-in et En boucle.
    if (model === "AMRAP") {
      expect(screen.getByTestId("format-buy-in-title")).toHaveTextContent(t.forTimeTable.buyIn);
      expect(screen.getByTestId("format-loop-title")).toHaveTextContent(t.forTimeTable.loop);
      expect(screen.getByTestId("format-buy-in-link")).toHaveTextContent(t.forTimeTable.add);
      expect(screen.getByTestId("format-loop-link")).toHaveTextContent(t.forTimeTable.add);
    } else {
      expect(screen.getByTestId("format-movements-title")).toHaveTextContent(t.movements);
      expect(screen.getByTestId("format-movements-link")).toHaveTextContent(t.forTimeTable.add);
    }
    // Bloc vide : aucune colonne.
    expect(screen.queryByTestId(model === "AMRAP" ? "format-loop-head" : "format-movements-head")).toBeNull();
    // Recette du 16/11/2026 (constat b) : croix « Fermer » pour tous les Formats. [Flèche « Retour » — remplacée.]
    expect(screen.getByTestId("screen-header-back").props.accessibilityLabel).toBe(t.closeAccessibilityLabel);
    fireEvent.press(screen.getByTestId("screen-header-back"));
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(draftRef.current.exercises).toHaveLength(0);
  });

  it.each([
    ["TABATA", "format-movements", [t.table.objective, t.table.pause, t.table.load]],
    ["INTERVALS_30_30", "format-movements", [t.table.objective, t.table.pause, t.table.load]],
    ["STRENGTH", "format-movements", [t.table.objective, t.table.pause, t.table.load]],
    ["UNTIL_FAILURE", "format-movements", [t.table.objective, t.table.pause, t.table.load]],
    ["DEATH_BY", "format-movements", [t.table.start, t.table.increment, t.table.load]],
    ["AMRAP", "format-loop", [t.table.objective, t.table.perRoundHead, t.table.max]],
    ["EMOM", "format-movements", ["S1", "S2", "S3", "S4", "S5", "S6"]],
    ["PROGRESSION", "format-movements", ["S1", "S2", "S3"]],
    ["SUPERSET", "format-movements", ["Tour 1", "Tour 2", "Tour 3"]],
  ] as [FormatModelKey, string, readonly string[]][])("%s : colonnes du tableau (dimensions inchangées, ou séries / tours), plus de colonne Unité ; ligne sans carte ni Niveau", async (model, block, expected) => {
    await open(model);
    await pick("Squ", "mv-squats", block === "format-loop" ? "format-loop" : "format-movements");
    expect(heads(block)).toEqual([...expected]);
    expect(heads(block)).not.toContain(t.forTimeTable.unitMissing);
    // Ligne de 48 : photo, nom tronqué sur une ligne ; ni carte, ni Niveau, ni zones corporelles.
    expect(screen.getByTestId("format-line-0-name-title").props.numberOfLines).toBe(1);
    expect(screen.getByTestId("format-line-0-photo")).toBeTruthy();
    expect(screen.queryByTestId("format-movement-card-0")).toBeNull();
    expect(screen.queryByTestId("format-movement-card-0-level")).toBeNull();
  });

  it.each(["TABATA", "DEATH_BY"] as const)("%s : colonne Charge — tiret grisé sans charge, valeur active avec charge ; activation et retrait dans la modale seulement (16/11/2026)", async (model) => {
    await open(model);
    await pick("Squ", "mv-squats");
    const off = screen.getByTestId("format-line-0-load-off");
    expect(off).toHaveTextContent(t.dash);
    expect(StyleSheet.flatten(off.props.style).color).toBe(valueFieldColors.disabled);
    // Mission du 16/11/2026, règle 5 : plus de « (+ kg) » / « (− kg) » sous le nom ; rien sur la charge dans la ligne des paramètres.
    expect(screen.queryByTestId("format-line-0-charge")).toBeNull();
    expect(parametersLine(0)).not.toHaveTextContent(/kg/);
    // Death by : la modale ne se valide qu'avec un Départ (même règle que dans la Composition) ; il est saisi dans le tableau.
    if (model === "DEATH_BY") {
      typeValue("death-by-start-0", "3");
      typeValue("death-by-increment-0", "1");
    }
    // Décision de Hermann du 16/11/2026 : « Avec » dans la modale — champ « — » sur fond rouge, ✓ indisponible jusqu'à la saisie
    // (plus de 0,25 kg posé).
    await inSheet(0, () => {
      fireEvent.press(screen.getByTestId("execution-sheet-load-control-WITH"));
      expect(screen.getByTestId("execution-sheet-load-input-value", { includeHiddenElements: true })).toHaveTextContent("—");
      expect(screen.getByTestId("execution-sheet-load-control-WITH-invalid-surface", { includeHiddenElements: true })).toBeTruthy();
      expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
      enterExecutionSheetValue("execution-sheet-load-input", 8, "integer");
    });
    expect(screen.queryByTestId("format-line-0-load-off")).toBeNull();
    expect(parametersLine(0)).not.toHaveTextContent(/kg/);
    expect(shown("line-0-load")).toBe("8 kg");
    // Charge active : case touchable (plus seulement par Précédent / Suivant).
    expect(screen.getByTestId("format-line-0-load").props.pointerEvents).toBeUndefined();
    // Recette du 16/11/2026 (fmt-entree, r16-charge-orange) : vidée, la case est orange (à vérifier), y compris en saisie.
    typeValue("line-0-load", "");
    expect(StyleSheet.flatten(screen.getByTestId("format-line-0-load").props.style).backgroundColor).toBe(valueFieldColors.toVerify);
    fireEvent(screen.getByTestId("format-line-0-load"), "focus");
    expect(StyleSheet.flatten(screen.getByTestId("format-line-0-load").props.style).backgroundColor).toBe(valueFieldColors.toVerify);
    typeValue("line-0-load", "12");
    expect(shown("line-0-load")).toBe("12 kg");
    expect(StyleSheet.flatten(screen.getByTestId("format-line-0-load").props.style).backgroundColor).not.toBe(valueFieldColors.toVerify);
    expect(StyleSheet.flatten(screen.getByTestId("format-line-0-load").props.style)).toMatchObject({ fontSize: 13 });
    await inSheet(0, () => fireEvent.press(screen.getByTestId("execution-sheet-load-control-WITHOUT")));
    expect(screen.getByTestId("format-line-0-load-off")).toHaveTextContent(t.dash);
  });

  it.each([
    ["EMOM", "seriesCount", "S"],
    ["PROGRESSION", "seriesCount", "S"],
    ["SUPERSET", "roundCount", "Tour "],
  ] as [FormatModelKey, "seriesCount" | "roundCount", string][])("%s : plus de « − » ni de « + » ; nombre (%s) par sa ligne ou dans la modale ; triangle 8 × 13 à la place du « + » (16/11/2026)", async (model, row, prefix) => {
    await open(model);
    await pick("Squ", "mv-squats");
    expect(screen.queryByTestId("format-movements-add-column")).toBeNull();
    expect(screen.queryByTestId("format-movements-remove-column")).toBeNull();
    typeValue(row, "4");
    expect(screen.getByTestId("format-movements-head-3")).toHaveTextContent(`${prefix}4`);
    const triangle = screen.getByTestId("format-movements-more", { includeHiddenElements: true });
    // Recette du 16/11/2026 (mp-triangle) : centré sur le texte des titres (top 9) ; à la dernière colonne, inversé, avant la première.
    expect(StyleSheet.flatten(triangle.props.style)).toMatchObject({ top: 9, left: 2, borderLeftWidth: 8, borderTopWidth: 6.5, borderBottomWidth: 6.5 });
    expect(screen.queryByTestId("format-movements-more-before", { includeHiddenElements: true })).toBeNull();
    fireEvent.scroll(screen.getByTestId("format-movements-columns"), { nativeEvent: { contentOffset: { x: 1000, y: 0 } } });
    expect(screen.queryByTestId("format-movements-more", { includeHiddenElements: true })).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("format-movements-more-before", { includeHiddenElements: true }).props.style)).toMatchObject({
      top: 9,
      borderRightWidth: 8,
      borderTopWidth: 6.5,
      borderBottomWidth: 6.5,
    });
    fireEvent.scroll(screen.getByTestId("format-movements-columns"), { nativeEvent: { contentOffset: { x: 0, y: 0 } } });
    expect(screen.getByTestId("format-movements-more", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByTestId("format-movements-more-before", { includeHiddenElements: true })).toBeNull();
    // Modale : l'unité. D-604 (Hermann, 25/11/2026 ; Formats § 9.7) : plus de ligne Séries dans la modale d'un exercice de format — le
    // nombre de séries (ou de tours) se règle par sa ligne. [Nombre de séries saisi dans la modale ; Superset : « tours identiques »
    // (16/11/2026) — remplacé.]
    await inSheet(0, () => {
      fireEvent.press(screen.getByTestId("execution-sheet-mode-control-REPETITIONS"));
      expect(screen.queryByTestId("execution-sheet-row-series-type", { includeHiddenElements: true })).toBeNull();
      fillTargets(8);
    });
    typeValue(row, "2");
    expect(shown(row)).toMatch(/^2( tours)?$/);
    expect(screen.queryByTestId("format-movements-head-2")).toBeNull();
    expect(screen.queryByTestId("format-movements-more", { includeHiddenElements: true })).toBeNull();
  });

  it("unité à choisir (validée à la recette du 16/11/2026) : la constante couvre exactement Progression, EMOM, Superset et AMRAP", () => {
    expect([...UNIT_CHOICE_AT_ADD].sort()).toEqual(["AMRAP", "EMOM", "PROGRESSION", "SUPERSET"]);
  });

  it.each(["PROGRESSION", "EMOM", "SUPERSET"] as const)("%s : « Paramètres à compléter » en rouge à l'ajout, cases désactivées, coche grise ; la zone du nom ouvre la modale, l'unité y est choisie (« rép. » en bleu) ; « · bilatéral » si activé (16/11/2026)", async (model) => {
    const prefix = model === "EMOM" ? "format-emom" : model === "SUPERSET" ? "format-superset" : "format-progression";
    await open(model);
    await pick("Squ", "mv-squats");
    expect(parametersLine(0)).toHaveTextContent(t.table.parametersToComplete);
    expect(color(parametersLine(0)).color).toBe(colors.danger);
    expect(screen.getByTestId(`${prefix}-0-0-reps`)).toHaveTextContent(t.forTimeTable.disabledValue);
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
    // Plus de popover d'unité sous le nom.
    expect(screen.queryByTestId("format-line-0-unit-menu-REPETITIONS")).toBeNull();
    // La modale s'ouvre sur l'unité à renseigner.
    fireEvent.press(screen.getByTestId("format-line-0-name-open"));
    await screen.findByTestId("execution-sheet");
    expect(screen.getByTestId("execution-sheet-mode-control-REPETITIONS").props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.getByTestId("execution-sheet-mode-control-DURATION").props.accessibilityState).toMatchObject({ selected: false });
    fireEvent.press(screen.getByTestId("execution-sheet-mode-control-REPETITIONS"));
    fillTargets(10);
    await validateSheet();
    expect(parametersLine(0)).toHaveTextContent(new RegExp(`^${t.table.repetitionsUnitShort.replace(".", "\\.")}$`));
    expect(color(parametersLine(0)).color).toBe(valueFieldColors.editable);
    expect(screen.getByTestId(`${prefix}-0-0-reps`).props.editable).not.toBe(false);
    await inSheet(0, () => fireEvent.press(screen.getByTestId("execution-sheet-side-control-WITH")));
    expect(parametersLine(0)).toHaveTextContent(`${t.table.repetitionsUnitShort} · bilatéral`);
  });

  it("Tabata : pas de « Paramètres à compléter » (Durée imposée) ; « durée » en bleu, sans popover (recettes du 16/11/2026)", async () => {
    await open("TABATA");
    await pick("Squ", "mv-squats");
    // Mission du 16/11/2026, règle 2 : paramètres renseignés — l'unité, en bleu ; ni popover ni charge sous le nom.
    expect(parametersLine(0)).toHaveTextContent(new RegExp(`^${t.table.durationUnitShort}$`));
    expect(color(parametersLine(0)).color).toBe(valueFieldColors.editable);
    expect(screen.queryByTestId("format-line-0-unit-menu")).toBeNull();
    expect(screen.queryByTestId("format-line-0-charge")).toBeNull();
    // Tableau dès un mouvement : objectif et pause du mouvement ; plus de lignes communes Travail / Pause / Charge.
    expect(shown("objective-0")).toBe("20″");
    expect(shown("pause-0")).toBe("10″");
    expect(screen.queryByTestId("format-row-workSeconds")).toBeNull();
    expect(screen.queryByTestId("format-row-pauseSeconds")).toBeNull();
    expect(screen.queryByTestId("format-row-charge")).toBeNull();
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: false });
  });

  it("Death by à un mouvement : Départ et Incrément dans le tableau (réponses communes), plus de lignes ; enregistrement", async () => {
    const draftRef = await open("DEATH_BY");
    await pick("Squ", "mv-squats");
    expect(screen.queryByTestId("format-row-startRepetitions")).toBeNull();
    expect(screen.queryByTestId("format-row-increment")).toBeNull();
    // Recette du 16/11/2026 (r16-deathby-depart) : aucune valeur par défaut — trait et fond rouge, coche grise.
    expect(shown("death-by-start-0")).toBe("");
    expect(shown("death-by-increment-0")).toBe("");
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: true });
    // Recette du 16/11/2026 (Autres constats c) : « Paramètres à compléter » en rouge tant que Départ ou Incrément manque.
    expect(parametersLine(0)).toHaveTextContent(t.table.parametersToComplete);
    expect(color(parametersLine(0)).color).toBe(colors.danger);
    typeValue("death-by-start-0", "3");
    expect(parametersLine(0)).toHaveTextContent(t.table.parametersToComplete);
    // Recette du 16/11/2026 (mp-charge) : dans la modale, Incrément « — » en rouge, ✓ indisponible, puis saisi.
    await inSheet(0, () => {
      const increment = screen.getByTestId("execution-sheet-format-increment", { includeHiddenElements: true });
      expect(within(increment).getByText("—")).toBeTruthy();
      expect(StyleSheet.flatten(increment.props.style).backgroundColor).toBe(colors.dangerSurface);
      expect(screen.getByTestId("execution-sheet-validate").props.accessibilityState).toMatchObject({ disabled: true });
      enterExecutionSheetValue("execution-sheet-format-increment", 1, "integer");
    });
    expect(shown("death-by-increment-0")).toBe("+ 1");
    expect(parametersLine(0)).toHaveTextContent("rép.");
    expect(color(parametersLine(0)).color).toBe(valueFieldColors.editable);
    expect(shown("death-by-start-0")).toBe("3");
    expect(shown("death-by-increment-0")).toBe("+ 1");
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    expect(draftRef.current.exercises).toHaveLength(1);
  });

  it("AMRAP : blocs Buy-in (Objectif) et En boucle (Objectif, Par tour, Max) ; Déroulé sans texte « buy-in » (volume seul) ; Circuit enregistré", async () => {
    const draftRef = await open("AMRAP");
    await pick("Squ", "mv-squats", "format-buy-in");
    await pick("Fen", "mv-fentes", "format-loop");
    expect(heads("format-buy-in")).toEqual([t.table.objective]);
    expect(heads("format-loop")).toEqual([t.table.objective, t.table.perRoundHead, t.table.max]);
    expect(t.table.perRoundHead).toBe("± / tour");
    expect(parametersLine(0)).toHaveTextContent(t.table.parametersToComplete);
    // Objectifs saisis dans la modale avec l'unité (buy-in 50, boucle 10).
    await chooseUnit(0, "REPETITIONS", 50);
    await chooseUnit(1, "REPETITIONS", 10);
    typeValue("amrap-increment-1", "2");
    // Décision de Hermann du 15/11/2026 : « Retirer le texte « buy in » et « buy out » du cadre d'illustration ».
    expect(screen.getByTestId("format-timeline")).toHaveTextContent(/50/);
    expect(screen.getByTestId("format-timeline")).not.toHaveTextContent(/buy-in|buy-out/i);
    expect(screen.getByTestId("format-save").props.accessibilityState).toMatchObject({ disabled: false });
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    expect(draftRef.current.exercises).toHaveLength(2);
  });

  // [Recette du 16/11/2026 (fmt-superset) : « Modifier » dès deux mouvements ; constat g : message au-delà de deux — remplacés le
  // 25/11/2026 par D-572 (« + Modifier » dès un mouvement, cinq mouvements au plus, catalogue en modification avec zone figée ;
  // FormatModelScreen.d572catalogue.test.tsx).]
  it("Superset (D-572) : « + Modifier » dès un mouvement ; le catalogue s'ouvre en modification, mouvements choisis figés ; la sélection les remplace", async () => {
    await open("SUPERSET");
    expect(screen.getByTestId("format-movements-link")).toHaveTextContent(t.forTimeTable.add);
    await pick("Squ", "mv-squats");
    expect(screen.getByTestId("format-movements-link")).toHaveTextContent(t.editMovements);
    await pick("Fen", "mv-fentes");
    const link = screen.getByTestId("format-movements-link");
    expect(link).toHaveTextContent(t.editMovements);
    expect(link.props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(link);
    expect(screen.getByTestId("format-catalogue-add")).toHaveTextContent(t.applyPicked);
    // Fentes retirées de la sélection (carte figée libérée) : seul Squats reste.
    fireEvent.press(await screen.findByTestId("format-catalogue-pinned-mv-fentes"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-catalogue-add"));
    });
    await waitFor(() => expect(screen.queryByTestId("format-line-1-name-title")).toBeNull());
    expect(screen.getByTestId("format-line-0-name-title")).toHaveTextContent(SQUATS.name);
    expect(screen.getByTestId("format-movements-link")).toHaveTextContent(t.editMovements);
  });

  it("Superset (D-572) : au-delà de deux mouvements, aucun message (cinq au plus)", async () => {
    await open("SUPERSET");
    await pick("Squ", "mv-squats");
    const alert = jest.spyOn(Alert, "alert");
    fireEvent.press(screen.getByTestId("format-movements-link"));
    fireEvent.changeText(screen.getByTestId("format-catalogue-search"), "Fen");
    fireEvent.press(await screen.findByTestId("format-catalogue-card-mv-fentes"));
    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
    expect(screen.getByTestId("format-catalogue-pinned-mv-fentes")).toBeTruthy();
  });

  it("AMRAP : Nombre d'AMRAP (1), Repos entre deux AMRAP au-delà d'un AMRAP, Repos après chaque tour de boucle (0″) dans le cadre des paramètres (décision du 16/11/2026)", async () => {
    const draftRef = await open("AMRAP");
    expect(screen.getByTestId("format-row-durationSeconds")).toBeTruthy();
    expect(screen.getByTestId("format-row-blockCount")).toHaveTextContent(new RegExp(`^${t.rows.blockCount}`));
    expect(shown("blockCount")).toBe("1");
    expect(screen.queryByTestId("format-row-restBetweenBlocksSeconds")).toBeNull();
    expect(screen.getByTestId("format-row-loopRestSeconds")).toHaveTextContent(new RegExp(`^${t.rows.loopRestSeconds}`));
    expect(shown("loopRestSeconds")).toBe("0″");
    expect(screen.getByTestId("format-timeline-title")).toHaveTextContent(new RegExp(`^${t.timeline}$`));
    typeValue("blockCount", "3");
    expect(screen.getByTestId("format-row-restBetweenBlocksSeconds")).toHaveTextContent(new RegExp(`^${t.rows.restBetweenBlocksSeconds}`));
    // Constat h du 16/11/2026 : « Déroulé (3 fois) ».
    expect(screen.getByTestId("format-timeline-title")).toHaveTextContent(`${t.timeline} (3 fois)`);
    // Un seul mouvement, trois AMRAP : un Circuit de trois tours (Formats d'entraînement §3).
    await pick("Fen", "mv-fentes", "format-loop");
    await chooseUnit(0, "REPETITIONS");
    typeValue("amrap-reps-0", "10");
    typeValue("amrap-increment-0", "0");
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    const structure = draftRef.current.structure;
    expect(structure?.elements.some((element) => element.kind === "CIRCUIT" && element.circuit.repeatCount === 3)).toBe(true);
  });

  it("À l'échec : unité Répétitions ou Durée ; « à l'échec » sur deux lignes (recette du 16/11/2026)", async () => {
    await open("UNTIL_FAILURE");
    await pick("Squ", "mv-squats");
    expect(parametersLine(0)).toHaveTextContent(t.table.repetitionsUnitShort);
    expect(screen.getByTestId("format-objective-0").props.numberOfLines).toBe(2);
    await chooseUnit(0, "DURATION");
    expect(parametersLine(0)).toHaveTextContent(t.table.durationUnitShort);
    // Constat d du 16/11/2026 : « À » / « l’échec », sur deux lignes.
    expect(screen.getByTestId("format-objective-0").props.children).toBe(t.atFailureTwoLines);
    expect(t.atFailureTwoLines).toBe("À\nl’échec");
  });

  it("Séparateurs : le trait de chaque ligne est posé au-dessus de la ligne du nom, sur toute sa largeur (recette du 16/11/2026)", async () => {
    await open("TABATA");
    await pick("Squ", "mv-squats");
    const separator = screen.getByTestId("format-line-0-separator");
    // Posé hors de la ligne glissable (dont le fond opaque le masquait), au-dessus d'elle dans la ligne du nom.
    expect(screen.getByTestId("format-movement-0").findAll((node) => node === separator)).toHaveLength(0);
    expect(StyleSheet.flatten(separator.props.style)).toMatchObject({ left: 0, right: 0, height: 1 });
  });

  it.each(["TABATA", "EMOM"] as const)("%s : appui long puis glisser — la ligne prend la place atteinte (recette du 16/11/2026)", async (model) => {
    const block = "format-movements";
    await open(model);
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    expect(screen.getByTestId("format-line-0-name-title")).toHaveTextContent(SQUATS.name);
    act(() => {
      fireGestureHandler(getByGestureTestId(`${block}-drag-0`), [
        { state: State.BEGAN },
        { state: State.ACTIVE, translationY: 0 },
        { translationY: 30 },
        { state: State.END, translationY: 50 },
      ]);
    });
    expect(screen.getByTestId("format-line-0-name-title")).toHaveTextContent(FENTES.name);
    expect(screen.getByTestId("format-line-1-name-title")).toHaveTextContent(SQUATS.name);
    // Geste annulé : ordre inchangé.
    act(() => {
      fireGestureHandler(getByGestureTestId(`${block}-drag-0`), [
        { state: State.BEGAN },
        { state: State.ACTIVE, translationY: 0 },
        { translationY: 60 },
        { state: State.CANCELLED, translationY: 60 },
      ]);
    });
    expect(screen.getByTestId("format-line-0-name-title")).toHaveTextContent(FENTES.name);
  });

  it("Death by : un mouvement retiré sur deux — le mouvement restant garde son Départ et son Incrément", async () => {
    await open("DEATH_BY");
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    typeValue("death-by-start-1", "4");
    typeValue("death-by-increment-1", "2");
    act(() => {
      fireEvent(screen.getByTestId("format-movement-0-card"), "accessibilityAction", { nativeEvent: { actionName: "delete" } });
    });
    expect(screen.getByTestId("format-line-0-name-title")).toHaveTextContent(FENTES.name);
    expect(shown("death-by-start-0")).toBe("4");
    expect(shown("death-by-increment-0")).toBe("+ 2");
  });

  it("Exécution : En alternance / À la suite changent la ligne Exécution et la récupération, le tableau reste le même", async () => {
    await open("TABATA");
    await pick("Squ", "mv-squats");
    await pick("Fen", "mv-fentes");
    const before = heads("format-movements");
    expect(screen.getByTestId("format-row-execution")).toBeTruthy();
    expect(screen.getByTestId("format-row-recoveryBetweenSeconds")).toBeTruthy();
    fireEvent.press(screen.getByTestId("format-execution-ALTERNATED"));
    expect(screen.queryByTestId("format-row-recoveryBetweenSeconds")).toBeNull();
    expect(heads("format-movements")).toEqual(before);
  });
});
