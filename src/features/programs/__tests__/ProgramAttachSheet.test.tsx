import { act, render } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { Routine } from "@/domain/planning/Routine";
import type { RoutineFilterChoice } from "@/features/planning/RoutineFilterSheet";
import { attachChoiceDimmed, ProgramAttachSheet } from "@/features/programs/ProgramAttachSheet";
import type { AttachChoice, ProgramService } from "@/features/programs/ProgramService";

/**
 * Contre-recette du 23/11/2026 (c) — modale de rattachement d'un programme : la date d'une carte ouvre la planification en
 * modification ; le cadre est grisé si aucun créneau n'est disponible sur la période. La carte elle-même (`JournalRoutineCard`)
 * n'est pas exercée ici : recette sur iPhone nécessaire.
 */

type SheetProps = {
  readonly choices: readonly RoutineFilterChoice[];
  readonly onPressDate?: (choice: RoutineFilterChoice) => void;
  readonly dimmed?: (choice: RoutineFilterChoice) => boolean;
};
const mockSheetProps: SheetProps[] = [];
jest.mock("@/features/planning/RoutineFilterSheet", () => ({
  RoutineFilterSheet: (props: SheetProps) => {
    mockSheetProps.push(props);
    return null;
  },
}));
jest.mock("@/features/sessions/useSessionCatalogue", () => ({
  useSessionCatalogue: () => ({ state: { status: "loading" }, reload: () => undefined }),
}));
jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => (() => void) | void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require("react") as typeof import("react")).useEffect(effect, []);
  },
}));

const routine = (id: string): Routine => ({ id, name: id }) as unknown as Routine;
const choice = (id: string, inside: number, outside: number): AttachChoice =>
  ({ routine: routine(id), upcoming: inside + outside, period: { inside, outside } }) as AttachChoice;

describe("ProgramAttachSheet — contre-recette du 23/11/2026 (c)", () => {
  it("cadre grisé sans créneau sur la période", () => {
    expect(attachChoiceDimmed(choice("a", 0, 3))).toBe(true);
    expect(attachChoiceDimmed(choice("b", 0, 0))).toBe(true);
    expect(attachChoiceDimmed(choice("c", 2, 0))).toBe(false);
  });

  it("la date d'une carte ouvre la routine en modification ; grisé transmis à la modale partagée", async () => {
    const choices = [choice("a", 0, 2), choice("b", 4, 0)];
    const service = { attachChoices: jest.fn(async () => choices) } as unknown as ProgramService;
    const onEditRoutine = jest.fn();
    render(
      <ProgramAttachSheet
        service={service}
        request={{ kind: "attach", period: { start: "2030-08-01", end: "2030-09-30" }, excluded: new Set(), released: new Set(), onAttach: () => undefined }}
        onClose={() => undefined}
        onEditRoutine={onEditRoutine}
      />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    const props = mockSheetProps[mockSheetProps.length - 1]!;
    expect(props.choices).toEqual(choices);
    props.onPressDate?.(choices[1]!);
    expect(onEditRoutine).toHaveBeenCalledWith("b");
    expect(props.dimmed?.(choices[0]!)).toBe(true);
    expect(props.dimmed?.(choices[1]!)).toBe(false);
  });
});
