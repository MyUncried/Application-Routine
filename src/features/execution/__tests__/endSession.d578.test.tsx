import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import type { OccurrenceResult } from "@/domain/execution/results";
import type { SessionSnapshot } from "@/domain/sessions/sessionSnapshot";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

import { capturedValues, endStateOf, END_STATE_STYLE, exerciseTally, formatRealDuration, plannedExerciseCount, SESSION_FEELINGS, type EndState } from "../endSession";
import { EndSessionScreen } from "../EndSessionScreen";

/**
 * D-578 à D-581 / D-427 (27/11/2026) — écran de fin de séance : trois états (symbole, titre, chiffres, couleurs), durée « m’ss’’ »,
 * répétitions modifiables et durées non modifiables, ressenti à cinq niveaux (ordre, choix unique), bouton désactivé sans ressenti,
 * douleur seulement avec l'option (sans valeur par défaut), absence d'effort perçu 1–10, appareil photo natif appelé depuis le
 * champ, accessibilité. Aucun rendu iPhone n'est prouvé ici.
 */

describe("logique (D-578 à D-581)", () => {
  it("durée réelle au format minutes’secondes’’", () => {
    expect(formatRealDuration(16 * 60_000 + 30_000)).toBe("16’30’’");
    expect(formatRealDuration(8 * 60_000 + 12_400)).toBe("08’12’’");
    expect(formatRealDuration(75 * 60_000)).toBe("75’00’’");
  });

  it("états et couleurs : terminée vert, partielle orange, arrêtée rouge (voile 35 %)", () => {
    expect([endStateOf("COMPLETED"), endStateOf("PARTIAL"), endStateOf("INTERRUPTED"), endStateOf(null)]).toEqual(["COMPLETED", "PARTIAL", "STOPPED", "STOPPED"]);
    expect(END_STATE_STYLE.COMPLETED).toEqual({ veil: "rgba(31, 158, 122, 0.35)", card: "#148061", icon: "COMPLETED" });
    expect(END_STATE_STYLE.PARTIAL).toEqual({ veil: "rgba(245, 140, 26, 0.35)", card: "#BD620B", icon: "PARTIAL" });
    expect(END_STATE_STYLE.STOPPED).toEqual({ veil: "rgba(204, 56, 56, 0.35)", card: "#8E1F1F", icon: "STOPPED" });
  });

  it("ressenti : cinq valeurs, du plus négatif au plus positif ; aucune échelle 1–10", () => {
    expect(SESSION_FEELINGS).toEqual(["VERY_BAD", "BAD", "NEUTRAL", "GOOD", "VERY_GOOD"]);
  });

  it("exercices terminés : partiels exclus ; total d'après la composition, jamais inférieur aux exécutés", () => {
    const snapshot = {
      structure: {
        elements: [
          { kind: "EXERCISE", exercise: {} },
          { kind: "CIRCUIT", circuit: { exercises: [{}, {}], repeatCount: 3 } },
          { kind: "CYCLE", cycle: { repeatCount: 2, members: [{ kind: "EXERCISE" }, { kind: "CIRCUIT", circuit: { exercises: [{}], repeatCount: 2 } }] } },
        ],
      },
    } as unknown as SessionSnapshot;
    expect(plannedExerciseCount(snapshot)).toBe(1 + 6 + 2 * 3);
    const occurrence = (status: "COMPLETED" | "PARTIAL") => ({ status }) as OccurrenceResult;
    expect(exerciseTally([occurrence("COMPLETED"), occurrence("PARTIAL"), occurrence("COMPLETED")], 12)).toEqual({ done: 2, total: 12 });
    expect(exerciseTally([occurrence("COMPLETED"), occurrence("COMPLETED")], null)).toEqual({ done: 2, total: 2 });
  });

  it("valeurs saisies : une ligne par exercice, répétitions et durées réalisées (somme des séries)", () => {
    const step = (key: string, series: number, completion: "COMPLETED" | "INTERRUPTED", activeMs = 0) => ({ key, series, completion, cumulativeActiveMs: activeMs });
    const occurrences = [
      { exerciseId: "squat", occurrenceKey: "o1", status: "COMPLETED", series: [step("s1", 1, "COMPLETED"), step("s2", 2, "COMPLETED")] },
      { exerciseId: "gainage", occurrenceKey: "o2", status: "PARTIAL", series: [step("g1", 1, "INTERRUPTED", 45_000)] },
      { exerciseId: "pont", occurrenceKey: "o3", status: "PARTIAL", series: [step("p1", 1, "INTERRUPTED")] },
    ] as unknown as OccurrenceResult[];
    const leaves: Record<string, { mode: "REPETITIONS" | "DURATION"; target: { kind: string; value: number } }> = {
      s1: { mode: "REPETITIONS", target: { kind: "NUMBER", value: 12 } },
      s2: { mode: "REPETITIONS", target: { kind: "NUMBER", value: 12 } },
      g1: { mode: "DURATION", target: { kind: "NUMBER", value: 60 } },
      p1: { mode: "REPETITIONS", target: { kind: "NUMBER", value: 20 } },
    };
    const plan = { exercises: { squat: { name: "Squats assistés" }, gainage: { name: "Gainage" }, pont: { name: "Pont fessier" } } } as never;
    expect(capturedValues(plan, occurrences, new Map([["p1", 18]]), (key) => leaves[key] as never)).toEqual([
      { exerciseId: "squat", name: "Squats assistés", repetitions: 24, durationMs: null },
      { exerciseId: "gainage", name: "Gainage", repetitions: null, durationMs: 45_000 },
      { exerciseId: "pont", name: "Pont fessier", repetitions: 18, durationMs: null },
    ]);
  });
});

const VALUES = [
  { exerciseId: "squat", name: "Squats assistés", repetitions: 24, durationMs: null },
  { exerciseId: "gainage", name: "Gainage", repetitions: null, durationMs: 45_000 },
];

function renderEnd(props: Partial<Parameters<typeof EndSessionScreen>[0]> = {}) {
  const onSave = jest.fn(async (_input: unknown) => undefined);
  const onTakePhoto = jest.fn(async () => "file:///photo.jpg");
  render(
    <TestSafeAreaProvider>
      <EndSessionScreen
        state="COMPLETED"
        startedAt={new Date(2026, 10, 27, 18, 42)}
        now={new Date(2026, 10, 27, 19, 10)}
        durationMs={990_000}
        done={12}
        total={12}
        values={VALUES}
        painOption={false}
        cameraAvailable={false}
        onTakePhoto={onTakePhoto}
        onSave={onSave}
        {...props}
      />
    </TestSafeAreaProvider>,
  );
  return { onSave, onTakePhoto };
}

describe("EndSessionScreen (D-578 à D-581)", () => {
  const STATES: readonly (readonly [EndState, string, string, string, string])[] = [
    ["COMPLETED", "Séance terminée", "#148061", "rgba(31, 158, 122, 0.35)", "12 / 12"],
    ["PARTIAL", "Séance partielle", "#BD620B", "rgba(245, 140, 26, 0.35)", "9 / 12"],
    ["STOPPED", "Séance arrêtée", "#8E1F1F", "rgba(204, 56, 56, 0.35)", "5 / 12"],
  ];
  for (const [state, title, card, veil, tally] of STATES)
  it(`état ${state} : symbole, titre, chiffres, couleurs`, () => {
    const [done] = tally.split(" / ").map(Number) as [number];
    renderEnd({ state, done });
    expect(screen.getByTestId(`end-session-${state}`)).toBeTruthy();
    expect(screen.getByTestId(`end-session-icon-${END_STATE_STYLE[state].icon}`)).toBeTruthy();
    expect(screen.getByTestId("end-session-title").props.children).toBe(title);
    expect(screen.getByTestId("end-session-exercises").props.children).toBe(tally);
    expect(screen.getByTestId("end-session-duration").props.children).toBe("16’30’’");
    expect(screen.getByTestId("end-session-when").props.children).toBe("Aujourd’hui · 18 h 42");
    expect(StyleSheet.flatten(screen.getByTestId("end-session-card").props.style).backgroundColor).toBe(card);
    expect(StyleSheet.flatten(screen.getByTestId("end-session-veil").props.style).backgroundColor).toBe(veil);
    expect(StyleSheet.flatten(screen.getByTestId("end-session-white-veil").props.style).backgroundColor).toBe("rgba(255, 255, 255, 0.5)");
    // Ni bouton Retour, ni nom de séance, ni effort perçu 1–10, ni localisation de la douleur (D-578, D-581).
    expect(screen.queryByTestId("execution-back")).toBeNull();
    expect(screen.queryByText(/effort/i)).toBeNull();
    expect(screen.queryByText(/genou/i)).toBeNull();
  });

  it("répétitions modifiables (champ natif) ; durées non modifiables (cadre en pointillés, sans champ)", () => {
    renderEnd();
    const reps = screen.getByTestId("end-session-reps-squat");
    expect(reps.type).toBe("TextInput");
    expect(reps.props.value).toBe("24");
    fireEvent.changeText(reps, "26");
    expect(screen.getByTestId("end-session-reps-squat").props.value).toBe("26");
    const duration = screen.getByTestId("end-session-duration-gainage");
    expect(StyleSheet.flatten(duration.props.style)).toEqual(expect.objectContaining({ borderStyle: "dashed" }));
    expect(screen.getByText("00’45’’")).toBeTruthy();
    expect(screen.queryByTestId("end-session-reps-gainage")).toBeNull();
  });

  it("ressenti : cinq visages dans l'ordre, un seul sélectionné ; Enregistrer désactivé sans ressenti, actif après", async () => {
    const { onSave } = renderEnd();
    const group = screen.getByTestId("end-session-feelings");
    expect(group.props.accessibilityRole).toBe("radiogroup");
    const ids = ["VERY_BAD", "BAD", "NEUTRAL", "GOOD", "VERY_GOOD"];
    expect(ids.map((id) => screen.getByTestId(`end-session-feeling-${id}`).props.accessibilityLabel)).toEqual(["Très mal", "Mal", "Neutre", "Bien", "Très bien"]);
    const save = screen.getByTestId("end-session-save");
    expect(save.props.accessibilityState).toEqual({ disabled: true });
    expect(save.props.accessibilityLabel).toBe("Enregistrer. Choisissez d’abord comment s’est passée la séance");
    expect(StyleSheet.flatten(save.props.style).backgroundColor).toBe(colors.disabled);
    fireEvent.press(screen.getByTestId("end-session-feeling-BAD"));
    fireEvent.press(screen.getByTestId("end-session-feeling-VERY_GOOD"));
    expect(ids.filter((id) => screen.getByTestId(`end-session-feeling-${id}`).props.accessibilityState.selected)).toEqual(["VERY_GOOD"]);
    expect(screen.getByTestId("end-session-save").props.accessibilityState).toEqual({ disabled: false });
    fireEvent.changeText(screen.getByTestId("end-session-comment"), "Genou un peu raide");
    await act(async () => {
      fireEvent.press(screen.getByTestId("end-session-save"));
    });
    expect(onSave).toHaveBeenCalledWith({ feeling: "VERY_GOOD", comment: "Genou un peu raide", painAfter: null });
  });

  it("douleur : absente sans l'option ; avec l'option, obligatoire et sans valeur par défaut ; contour blanc sur l'écran arrêté", async () => {
    renderEnd();
    expect(screen.queryByTestId("end-session-pain-scale")).toBeNull();
    screen.unmount();
    const { onSave } = renderEnd({ painOption: true, state: "STOPPED" });
    for (let value = 0; value <= 10; value += 1) expect(screen.getByTestId(`end-session-pain-${value}`).props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
    expect(StyleSheet.flatten(screen.getByTestId("end-session-pain-4").props.style)).toEqual(expect.objectContaining({ borderWidth: 0.75, borderColor: "#FFFFFF" }));
    fireEvent.press(screen.getByTestId("end-session-feeling-NEUTRAL"));
    expect(screen.getByTestId("end-session-save").props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(screen.getByTestId("end-session-pain-0"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("end-session-save"));
    });
    expect(onSave).toHaveBeenCalledWith({ feeling: "NEUTRAL", comment: null, painAfter: 0 });
  });

  it("commentaire de plus de 200 caractères : signalé, Enregistrer désactivé (pas de troncature)", () => {
    renderEnd();
    fireEvent.press(screen.getByTestId("end-session-feeling-GOOD"));
    fireEvent.changeText(screen.getByTestId("end-session-comment"), "x".repeat(201));
    expect(screen.getByTestId("end-session-comment").props.value).toHaveLength(201);
    expect(screen.getByTestId("end-session-comment-too-long")).toBeTruthy();
    expect(screen.getByTestId("end-session-save").props.accessibilityState).toEqual({ disabled: true });
  });

  it("appareil photo natif appelé depuis le champ quand le build le permet ; sinon bouton indisponible et annoncé", async () => {
    const first = renderEnd({ cameraAvailable: true });
    await act(async () => {
      fireEvent.press(screen.getByTestId("end-session-camera"));
    });
    expect(first.onTakePhoto).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("end-session-photo-taken")).toBeTruthy();
    screen.unmount();
    const second = renderEnd({ cameraAvailable: false });
    const camera = screen.getByTestId("end-session-camera");
    expect(camera.props.accessibilityState).toEqual({ disabled: true });
    expect(camera.props.accessibilityHint).toBe("Appareil photo indisponible dans cette version");
    fireEvent.press(camera);
    expect(second.onTakePhoto).not.toHaveBeenCalled();
  });

  it("échec de l'enregistrement : l'écran, le choix et le commentaire restent", async () => {
    const onSave = jest.fn(async () => {
      throw new Error("disque plein");
    });
    renderEnd({ onSave });
    fireEvent.press(screen.getByTestId("end-session-feeling-GOOD"));
    fireEvent.changeText(screen.getByTestId("end-session-comment"), "ok");
    await act(async () => {
      fireEvent.press(screen.getByTestId("end-session-save"));
    });
    expect(screen.getByTestId("end-session-save-error")).toBeTruthy();
    expect(screen.getByTestId("end-session-feeling-GOOD").props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId("end-session-comment").props.value).toBe("ok");
  });
});
