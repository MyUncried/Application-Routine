import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import {
  numberTarget,
  unsetTarget,
  type ExecutionParameters,
  type ExecutionParametersInput,
  type WorkPhase,
} from "@/domain/activities/ExecutionParameters";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { CELL_BACKSPACE, typeInExecutionSheetCell } from "@/features/activities/testing/executionSheetActions";
import { strings } from "@/shared/i18n";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-7 story A2.1 (D-438, D-384, MFN-02, MFN-09, MFN/AC15, AC25, AC26, AC28, AC30 ; CE-UI-10) —
 * Feuille des paramètres MFN : croix active à deux phases (2 → Sans), « Durée d'une série » à
 * renseigner tant qu'une durée manque, structure verrouillée d'une occurrence (durées seules
 * modifiables) et compteur de phase du Mouvement. Matrice de la spec
 * `spec-a2-1-feuille-parametres-mfn.md`. Gestes et rendu simulés : la recette visuelle et tactile
 * reste à faire sur iPhone (jalon JA) ; l'état verrouillé n'a pas de frame Figma (NON VÉRIFIABLE).
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const t = strings.executionParameters.sheet;
const hidden = { includeHiddenElements: true } as const;
const get = (testID: string) => screen.getByTestId(testID, hidden);
const query = (testID: string) => screen.queryByTestId(testID, hidden);
const styleOf = (testID: string) => StyleSheet.flatten(get(testID).props.style) ?? {};
const stateOf = (testID: string) => get(testID).props.accessibilityState as { selected?: boolean; disabled?: boolean };

const CONTROL = "execution-sheet-phases-control";
const WITH = `${CONTROL}-WITH`;
const WITHOUT = `${CONTROL}-WITHOUT`;
const CHEVRON = `${CONTROL}-WITH-chevron`;
const STEPPER = "execution-sheet-phase-count";
const TABLE = "execution-sheet-phases-table";
const row = (n: number) => `execution-sheet-phase-row-${n}`;
const label = (n: number) => `${row(n)}-label`;
const duration = (n: number) => `${row(n)}-duration`;
const remove = (n: number) => `${row(n)}-remove`;
const handle = (n: number) => `${row(n)}-handle`;
const phaseRows = () => screen.queryAllByTestId(/^execution-sheet-phase-row-\d+$/, hidden);
const shownDuration = (n: number) => String(get(`${duration(n)}-value`).props.children);
const shownLabel = (n: number) => String(get(label(n)).props.value);
/** PRE-7 (D-446) : « Durée d'une série » garde sa pastille modifiable avec des phases. */
const seriesDurationText = () => String(get("execution-sheet-target-value").props.children);
const validate = () => fireEvent.press(get("execution-sheet-validate"));
const validateDisabled = () => stateOf("execution-sheet-validate").disabled === true;

function params(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 5,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 3, target: numberTarget(9), pauseSeconds: 15, loadKg: 0, workPhases: [] },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: false,
    ...overrides,
  };
}

/** Paramètres résolus à phases ; une durée 0 représente une durée non renseignée (frère incomplet, Cible `UNSET`). */
/**
 * `targetSeconds` : durée de série imposée. Décision de Hermann du 09/11/2026 (recette PRE-10, constat d) :
 * une durée de série doit être un multiple de la durée des phases ; les tests qui modifient les phases
 * prennent une durée multiple du motif obtenu, pour garder leur objet.
 */
function withPhases(phases: readonly (readonly [number, string, number])[], targetSeconds?: number): ExecutionParametersInput {
  const workPhases: WorkPhase[] = phases.map(([id, phaseLabel, seconds]) => ({ id, label: phaseLabel, durationSeconds: seconds }));
  const incomplete = phases.some(([, , seconds]) => seconds < 1);
  const sum = phases.reduce((total, [, , seconds]) => total + seconds, 0);
  const target = incomplete ? unsetTarget() : numberTarget(targetSeconds ?? sum);
  return params({ series: { kind: "UNIFORM", count: 3, target, pauseSeconds: 15, loadKg: 0, workPhases } });
}

function renderSheet(
  parent: ExecutionParametersInput,
  options: { readonly phaseStructureLocked?: boolean; readonly nextPhaseId?: number } = {},
) {
  const onApply = jest.fn<(value: ExecutionParameters) => void>();
  render(
    <TestSafeAreaProvider>
      <ExecutionParametersSheet
        parent={parent}
        baseline={parent}
        profileSideRecoverySecondsDefault={10}
        {...options}
        onApply={onApply}
        onCancel={jest.fn()}
      />
    </TestSafeAreaProvider>,
  );
  return { onApply };
}

const applied = (onApply: jest.Mock<(value: ExecutionParameters) => void>) => onApply.mock.calls.at(-1)![0];

function enterDuration(n: number, keys: string) {
  fireEvent(get(`${duration(n)}-input`), "focus");
  typeInExecutionSheetCell(duration(n), keys);
  fireEvent(get(`${duration(n)}-input`), "blur");
}

/**
 * Hermann, 01/11/2026 (remplace « déployé à l'ouverture » de PRE-5 story 2.8, FR-28) : « Lorsque la
 * modale des paramètres s'ouvre, le tableau des phases doit être fermé s'il n'y a aucune valeur à
 * vérifier ou à renseigner. » Durées complètes : le tableau est déployé par son chevron d'abord.
 */
function unfoldPhases() {
  expect(query(TABLE)).toBeNull();
  fireEvent.press(get(CHEVRON));
  expect(get(TABLE)).toBeTruthy();
}

// [`enterPhaseCount` (nombre de phases saisi au clavier) — retiré le 26/11/2026 par D-608 (D-573 point 6 : nombre de phases fixé).]

// [Croix à deux phases (2 → Sans), « Phase supprimée — Annuler », phase unique sans croix — remplacés le 26/11/2026 par D-608 (D-573 point 6 : phases définies dans la fiche du mouvement, nombre fixé, plus d'option Avec / Sans).]
describe("ExecutionParametersSheet — D-608 (D-573 point 6) : nombre de phases fixé, sans croix", () => {
  it("[A 6″, B 3″] : aucune croix ; l'interrupteur du son occupe sa place ; deux phases conservées", () => {
    renderSheet(withPhases([[1, "A", 6], [2, "B", 3]]));
    unfoldPhases();
    for (const n of [1, 2]) {
      expect(query(remove(n))).toBeNull();
      expect(get(`${row(n)}-sound`)).toBeTruthy();
    }
    expect(phaseRows()).toHaveLength(2);
  });
});

describe("ExecutionParametersSheet — PRE-7 story A2.1 : durée manquante (D-438, D-384, MFN/AC15, AC25)", () => {
  it("[9″, —], Cible lue « — » (frère incomplet antérieur) : D « — » à renseigner, cellule « — » rouge pâle, Durée de l'exercice « — », ✓ indisponible, phases conservées ; PRE-7 (D-446) : compléter la durée ne renseigne pas D", () => {
    const { onApply } = renderSheet(withPhases([[1, "A", 9], [2, "B", 0]]));
    expect(shownDuration(2)).toBe(t.unset);
    expect(styleOf(duration(2)).backgroundColor).toBe(colors.dangerSurface);
    expect(seriesDurationText()).toBe(t.unset);
    expect(styleOf("execution-sheet-target").backgroundColor).toBe(colors.dangerSurface);
    expect(String(get("execution-sheet-total-text").props.children)).toBe(t.unset);
    expect(validateDisabled()).toBe(true);
    validate();
    expect(onApply).not.toHaveBeenCalled();
    expect(phaseRows()).toHaveLength(2);
    enterDuration(2, "4");
    // D-446 : D n'est plus la somme ; elle reste à renseigner, ✓ toujours indisponible.
    expect(seriesDurationText()).toBe(t.unset);
    expect(validateDisabled()).toBe(true);
  });

  // [« Avec → Sans avec une durée manquante » — retiré le 26/11/2026 par D-608 (D-573 point 6 : phases définies dans la fiche du mouvement, nombre fixé, plus d'option Avec / Sans).]
});

describe("ExecutionParametersSheet — PRE-7 story A2.1 : structure verrouillée d'une occurrence (D-438, MFN-09, MFN/AC28)", () => {
  // [« Sans indisponible, nombre affiché indisponible (`unselected`), croix indisponibles » — remplacé le 26/11/2026 par D-608 (D-573 point 6 : phases définies dans la fiche du mouvement, nombre fixé, plus d'option Avec / Sans) : ni Sans, ni croix ;
  // « n phases » est l'option sélectionnée, sans saisie ; son appui replie ou déploie le tableau.]
  it("avec phases : ni Sans ni croix, nombre sans saisie, poignées et libellés indisponibles ; chevron actif ; durées modifiables, D inchangée (D-446)", () => {
    const { onApply } = renderSheet(withPhases([[1, "Descente", 6], [2, "Maintien", 3]], 22), { phaseStructureLocked: true });
    unfoldPhases();
    expect(query(WITHOUT)).toBeNull();
    expect(stateOf(WITH)).toMatchObject({ selected: true });
    expect(query(`${STEPPER}-increment`)).toBeNull();
    expect(query(`${STEPPER}-input`)).toBeNull();
    // Poignées indisponibles, sans action Monter / Descendre ; aucune croix.
    for (const n of [1, 2]) {
      expect(query(remove(n))).toBeNull();
      expect(stateOf(handle(n)).disabled).toBe(true);
      expect(get(handle(n)).props.accessibilityActions).toEqual([]);
      expect(styleOf(handle(n)).opacity).toBe(UNSELECTED_OPACITY);
    }
    fireEvent(get(handle(1)), "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    // Aucun répondeur : le geste de glisser n'est jamais saisi (ni au départ, ni en mouvement).
    expect(get(handle(1)).props.onStartShouldSetResponder()).toBe(false);
    expect(get(handle(1)).props.onMoveShouldSetResponder()).toBe(false);
    expect([shownLabel(1), shownLabel(2)]).toEqual(["Descente", "Maintien"]);
    // Libellés : champ natif non modifiable.
    expect(get(label(1)).props.editable).toBe(false);
    expect(stateOf(label(1)).disabled).toBe(true);
    // Chevron du tableau : actif (replie et déploie sans changer la structure).
    fireEvent.press(get(CHEVRON));
    expect(query(TABLE)).toBeNull();
    fireEvent.press(get(CHEVRON));
    expect(phaseRows()).toHaveLength(2);
    // Durées modifiables ; PRE-7 (D-446) : D inchangée.
    enterDuration(1, "8");
    expect(seriesDurationText()).toBe("22″");
    validate();
    expect(applied(onApply).series).toMatchObject({
      kind: "UNIFORM",
      target: numberTarget(22),
      workPhases: [
        { id: 1, label: "Descente", durationSeconds: 8 },
        { id: 2, label: "Maintien", durationSeconds: 3 },
      ],
    });
  });

  it("avec phases, durée vidée : ✓ indisponible, phase conservée (une durée vide empêche seulement d'enregistrer)", () => {
    renderSheet(withPhases([[1, "A", 6], [2, "B", 3]]), { phaseStructureLocked: true });
    unfoldPhases();
    fireEvent(get(`${duration(2)}-input`), "focus");
    typeInExecutionSheetCell(duration(2), CELL_BACKSPACE.repeat(String(get(`${duration(2)}-input`).props.value).length));
    fireEvent(get(`${duration(2)}-input`), "blur");
    expect(phaseRows()).toHaveLength(2);
    expect(validateDisabled()).toBe(true);
  });

  // [« re-choisir Avec » — remplacé le 26/11/2026 par D-608 (D-573 point 6 : phases définies dans la fiche du mouvement, nombre fixé, plus d'option Avec / Sans) : l'option « n phases » replie le tableau.]
  it("avec phases, toucher « n phases » pendant une saisie de durée : la saisie est appliquée, le tableau se replie, aucune surface ne reste ouverte", () => {
    const { onApply } = renderSheet(withPhases([[1, "A", 6], [2, "B", 3]], 22), { phaseStructureLocked: true });
    unfoldPhases();
    fireEvent(get(`${duration(2)}-input`), "focus");
    typeInExecutionSheetCell(duration(2), "5");
    fireEvent.press(get(WITH));
    // PRE-7 (D-446) : D inchangée ; la saisie appliquée au Brouillon se lit ci-dessous, dans les
    // paramètres validés (le focus natif simulé n'est pas rendu par Jest).
    expect(seriesDurationText()).toBe("22″");
    expect(phaseRows()).toHaveLength(0);
    fireEvent.press(get(CHEVRON));
    expect(phaseRows()).toHaveLength(2);
    // Aucune surface cachée : le premier toucher d'une autre durée ouvre directement sa saisie.
    fireEvent(get(`${duration(1)}-input`), "focus");
    expect(styleOf(duration(1)).backgroundColor).toBe("#EAEAFF");
    fireEvent(get(`${duration(1)}-input`), "blur");
    validate();
    expect(applied(onApply).series).toMatchObject({
      target: numberTarget(22),
      workPhases: [
        { id: 1, label: "A", durationSeconds: 6 },
        { id: 2, label: "B", durationSeconds: 5 },
      ],
    });
  });

  // [« sans phase : Avec indisponible, Sans sélectionné » — remplacé le 26/11/2026 par D-608 (D-573 point 6 : phases définies dans la fiche du mouvement, nombre fixé, plus d'option Avec / Sans) : aucune ligne.]
  it("sans phase : aucune ligne des phases", () => {
    renderSheet(params(), { phaseStructureLocked: true });
    expect(query("execution-sheet-row-phases")).toBeNull();
    expect(query(WITH)).toBeNull();
    expect(query(TABLE)).toBeNull();
  });

  // [« sans verrou (Catalogue, création locale) : structure modifiable » — remplacé le 26/11/2026 par D-608 (D-573 point 6 : phases définies dans la fiche du mouvement, nombre fixé, plus d'option Avec / Sans) : même sans verrou, la structure est fixée.]
  it("sans verrou (Catalogue, création locale) : structure fixée, durées seules modifiables", () => {
    renderSheet(withPhases([[1, "A", 6], [2, "B", 3]]));
    unfoldPhases();
    expect(query(WITHOUT)).toBeNull();
    expect(query(`${STEPPER}-input`)).toBeNull();
    expect(stateOf(handle(1)).disabled).toBe(true);
    expect(get(handle(1)).props.accessibilityActions).toEqual([]);
    expect(get(label(1)).props.editable).toBe(false);
    expect(get(`${duration(1)}-input`).props.keyboardType).toBe("number-pad");
  });
});

// [Compteur de phase du Mouvement (MFN-02, MFN/AC30) : identités des phases ajoutées dans la feuille — retiré le 26/11/2026 par D-608 (D-573 point 6 : phases définies dans la fiche du mouvement, nombre fixé, plus d'option Avec / Sans) : aucune phase
// n'est plus ajoutée ni retirée dans la feuille (`nextPhaseId` reste lu à l'ouverture, sans geste qui l'emploie).]
