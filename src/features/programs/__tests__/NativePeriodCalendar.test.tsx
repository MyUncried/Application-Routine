import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { View } from "react-native";

import { PlanningService } from "@/features/planning/PlanningService";
import { ProgramService } from "@/features/programs/ProgramService";
import { ProgramServiceContext } from "@/features/programs/ProgramServiceContext";
import { ProgramSheetScreen } from "@/features/programs/ProgramSheetScreen";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteOccurrenceExecutionRepository } from "@/infrastructure/database/repositories/SqliteOccurrenceExecutionRepository";
import { SqliteProgramRepository } from "@/infrastructure/database/repositories/SqliteProgramRepository";
import { SqliteRoutineRepository } from "@/infrastructure/database/repositories/SqliteRoutineRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * D-563 — contre-recette du 23/11/2026 (c1 à c7) : la modale du programme passe par la vue native `UICalendarView` du module
 * `modules/kodjo-calendar` quand il est présent, et traite son événement `onPressDate` (`nativeEvent.date`) en deux appuis.
 * Jest n'exécute pas le Swift : la langue, la désélection native au second appui et les décorations restent à vérifier sur
 * iPhone.
 */

type CalendarProps = {
  selectedDate: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  visibleDate: string | null;
  onPressDate: (event: { nativeEvent: { date: string } }) => void;
  testID?: string;
};

// Vue native simulée : une vue hôte qui garde ses propriétés, comme `requireNativeView("KodjoCalendar")`.
const mockCalendarProps: { current: CalendarProps | null } = { current: null };
jest.mock("@/features/programs/NativePeriodCalendar", () => {
  const { View: MockView } = jest.requireActual("react-native") as typeof import("react-native");
  function KodjoCalendarStub(props: CalendarProps) {
    mockCalendarProps.current = props;
    return <MockView testID={props.testID} />;
  }
  return { NativePeriodCalendar: KodjoCalendarStub };
});

jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useFocusEffect: () => undefined,
    useRouter: () => ({ push: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: () => true }),
  };
});

let database: NodeSqliteDatabase;
let programs: ProgramService;
let ids = 0;
const NOW = new Date(2030, 7, 10, 12, 0);

beforeEach(async () => {
  mockCalendarProps.current = null;
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const occurrenceExecutions = new SqliteOccurrenceExecutionRepository(database);
  const planning = new PlanningService({
    repository: new SqliteRoutineRepository(database),
    newId: () => `r-${++ids}`,
    now: () => NOW,
    occurrenceExecutions: () => occurrenceExecutions.list(),
  });
  programs = new ProgramService({ repository: new SqliteProgramRepository(database), planning, newId: () => `p-${++ids}`, now: () => NOW });
  // Popover : position du champ dans la fenêtre.
  jest.spyOn(View.prototype as unknown as { measureInWindow: () => void }, "measureInWindow").mockImplementation((...args: unknown[]) => {
    (args[0] as (x: number, y: number, width: number, height: number) => void)(100, 300, 80, 24);
  });
});

afterEach(() => {
  database.close();
  jest.restoreAllMocks();
});

const renderSheet = () =>
  render(
    <TestSafeAreaProvider>
      <ProgramServiceContext.Provider value={programs}>
        <ProgramSheetScreen params={{}} />
      </ProgramServiceContext.Provider>
    </TestSafeAreaProvider>,
  );

function press(date: string) {
  const props = mockCalendarProps.current;
  if (props === null) throw new Error("calendrier natif non rendu");
  act(() => props.onPressDate({ nativeEvent: { date } }));
}

describe("D-563 — calendrier natif de la période dans la modale du programme", () => {
  it("« Du » ouvre la vue native ; début puis fin en deux appuis, transmis par l'événement natif", async () => {
    renderSheet();
    await act(async () => undefined);
    fireEvent.press(screen.getByTestId("program-start-date"));
    // La vue native est rendue, pas le DatePicker de repli.
    expect(screen.getByTestId("program-period-calendar")).toBeTruthy();
    expect(mockCalendarProps.current).toMatchObject({ selectedDate: null, periodStart: null, periodEnd: null });

    // 1. Début : un appui sélectionne (rien d'écrit), un second appui sur la même date confirme.
    press("2030-08-05");
    expect(mockCalendarProps.current?.selectedDate).toBe("2030-08-05");
    expect(mockCalendarProps.current?.periodStart).toBeNull();
    press("2030-08-05");
    expect(mockCalendarProps.current).toMatchObject({ selectedDate: null, periodStart: "2030-08-05", periodEnd: null });
    expect(screen.getByText("5 août 2030")).toBeTruthy();

    // 2. Fin : sélectionnée et écrite aussitôt (règle 3), puis confirmée par un second appui : le calendrier se ferme.
    press("2030-09-30");
    expect(mockCalendarProps.current).toMatchObject({ selectedDate: "2030-09-30", periodStart: "2030-08-05", periodEnd: "2030-09-30" });
    expect(screen.getByText("30 sept. 2030")).toBeTruthy();
    press("2030-09-30");
    expect(screen.queryByTestId("program-period-calendar")).toBeNull();
  });

  it("4. un appui avant le début confirmé recommence la sélection du début", async () => {
    renderSheet();
    await act(async () => undefined);
    fireEvent.press(screen.getByTestId("program-start-date"));
    press("2030-08-05");
    press("2030-08-05");
    press("2030-08-01");
    expect(mockCalendarProps.current).toMatchObject({ selectedDate: "2030-08-01", periodStart: "2030-08-05" });
    press("2030-08-01");
    expect(mockCalendarProps.current).toMatchObject({ selectedDate: null, periodStart: "2030-08-01" });
  });
});

describe("D-563 — résolution de la vue native", () => {
  const load = (os: "ios" | "android") => {
    let exported: unknown;
    jest.isolateModules(() => {
      const { Platform: IsolatedPlatform } = jest.requireActual("react-native") as typeof import("react-native");
      Object.defineProperty(IsolatedPlatform, "OS", { value: os, configurable: true });
      exported = (jest.requireActual("@/features/programs/NativePeriodCalendar") as { NativePeriodCalendar: unknown }).NativePeriodCalendar;
      Object.defineProperty(IsolatedPlatform, "OS", { value: "ios", configurable: true });
    });
    return exported;
  };

  it("iOS, module présent : vue native « KodjoCalendar » ; module absent ou autre plateforme : aucune", () => {
    const expo = jest.requireActual("expo") as Record<string, unknown>;
    const nativeView = () => null;
    const requireNativeView = jest.fn(() => nativeView);
    let moduleObject: object | null = {};
    jest.doMock("expo", () => ({ ...expo, requireOptionalNativeModule: () => moduleObject, requireNativeView }));
    try {
      expect(load("ios")).toBe(nativeView);
      expect(requireNativeView).toHaveBeenCalledWith("KodjoCalendar");
      expect(load("android")).toBeNull();
      moduleObject = null;
      expect(load("ios")).toBeNull();
    } finally {
      jest.dontMock("expo");
    }
  });
});
