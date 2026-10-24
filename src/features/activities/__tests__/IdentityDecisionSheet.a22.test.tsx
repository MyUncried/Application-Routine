import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Modal, StyleSheet } from "react-native";

import { IdentityDecisionSheet } from "@/features/activities/IdentityDecisionSheet";
import { durationEntryValue, SiblingCompletionStep } from "@/features/activities/SiblingCompletionStep";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-7 story A2.2 (D-438, MFN-08 ; Figma `9952:44349`) — feuille de la question d'identité et
 * étape de complétion, hors écran : libellés, accords, portée calculée, retour système = Annuler,
 * géométrie relevée sur la frame. Le parcours complet est couvert sur SQLite réelle
 * (`ExerciseScreen.mfn.a22.integration.test.tsx`).
 */
const identity = strings.screens.activities.editor.identityDecision;
const completion = strings.screens.activities.editor.siblingCompletion;

function renderSheet(context: "CATALOGUE" | "REPRISE", count: number) {
  const handlers = { onCorrect: jest.fn(), onNewIdentity: jest.fn(), onCancel: jest.fn() };
  render(
    <TestSafeAreaProvider>
      <IdentityDecisionSheet context={context} movementName="Squats" affectedDefinitionCount={count} {...handlers} />
    </TestSafeAreaProvider>,
  );
  return handlers;
}

describe("IdentityDecisionSheet — PRE-7 A2.2", () => {
  it("Catalogue, trois Exercices : « 2 autres exercices… », total 3 dans l'explication du premier choix, second choix sans explication", () => {
    renderSheet("CATALOGUE", 3);
    expect(screen.getByText("Vous avez modifié Squats")).toBeTruthy();
    expect(screen.getByText("2 autres exercices utilisent ce geste.")).toBeTruthy();
    expect(screen.getByText("La correction s’applique aux 3 exercices qui l’utilisent")).toBeTruthy();
    expect(screen.getByTestId("identity-decision-correct").props.accessibilityLabel).toBe(
      `${identity.catalogue.correct}. La correction s’applique aux 3 exercices qui l’utilisent`,
    );
    expect(screen.getByTestId("identity-decision-new-identity").props.accessibilityLabel).toBe(identity.catalogue.newIdentity);
  });

  it("reprise, geste repris d'un seul Exercice : accord au singulier, total 2, explication du geste distinct", () => {
    renderSheet("REPRISE", 1);
    expect(screen.getByText("1 autre exercice utilise ce geste.")).toBeTruthy();
    expect(screen.getByText("La correction s’applique aux 2 exercices qui l’utilisent")).toBeTruthy();
    expect(screen.getByText(identity.reprise.correct)).toBeTruthy();
    expect(screen.getByText("Seul cet exercice change, Squats reste intact")).toBeTruthy();
  });

  it("choix et Annuler ; le retour système vaut Annuler ; géométrie de `9952:44349`", () => {
    const handlers = renderSheet("CATALOGUE", 2);
    fireEvent.press(screen.getByTestId("identity-decision-correct"));
    fireEvent.press(screen.getByTestId("identity-decision-new-identity"));
    fireEvent.press(screen.getByTestId("identity-decision-cancel"));
    screen.UNSAFE_getByType(Modal).props.onRequestClose();
    expect(handlers.onCorrect).toHaveBeenCalledTimes(1);
    expect(handlers.onNewIdentity).toHaveBeenCalledTimes(1);
    expect(handlers.onCancel).toHaveBeenCalledTimes(2);
    const sheet = StyleSheet.flatten(screen.getByTestId("identity-decision-sheet").props.style);
    expect(sheet).toMatchObject({ borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 28, paddingHorizontal: 24 });
    const choice = StyleSheet.flatten(screen.getByTestId("identity-decision-correct").props.style);
    expect(choice).toMatchObject({ minHeight: 68, borderWidth: 1, borderColor: "#E4E7EF", borderRadius: 12 });
  });
});

describe("SiblingCompletionStep — PRE-7 A2.2", () => {
  it("structure retirée : durée de série à compléter ; saisie au clavier « MM:SS » ; Terminer transmet la durée", () => {
    const onFinish = jest.fn();
    render(
      <TestSafeAreaProvider>
        <SiblingCompletionStep
          gaps={[{ definitionId: "def-b", missingPhaseIds: [], missingSeriesDuration: true }]}
          phases={[]}
          siblingLabels={{ "def-b": "3 séries" }}
          onFinish={onFinish}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
    expect(screen.getByText("3 séries")).toBeTruthy();
    expect(screen.getByText(strings.executionParameters.sheet.durationTarget)).toBeTruthy();
    const field = screen.getByTestId("sibling-completion-def-b-series");
    expect(field.props.accessibilityLabel).toBe(completion.durationAccessibilityLabel.replace("{label}", strings.executionParameters.sheet.durationTarget));
    fireEvent.changeText(field, "1");
    fireEvent.changeText(screen.getByTestId("sibling-completion-def-b-series"), "00:011");
    expect(screen.getByTestId("sibling-completion-def-b-series").props.value).toBe("00:11");
    fireEvent.press(screen.getByTestId("sibling-completion-finish"));
    expect(onFinish).toHaveBeenCalledWith([{ definitionId: "def-b", seriesDurationSeconds: 11 }]);
  });
});

describe("Revue A2.2 — saisies et noms particuliers", () => {
  it("nom de geste contenant « $& » : rendu tel quel (aucun motif de remplacement interprété)", () => {
    renderSheet("REPRISE", 1);
    screen.unmount();
    render(
      <TestSafeAreaProvider>
        <IdentityDecisionSheet
          context="REPRISE"
          movementName="Squat $& $'"
          affectedDefinitionCount={1}
          onCorrect={jest.fn()}
          onNewIdentity={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
    expect(screen.getByText("Vous avez modifié Squat $& $'")).toBeTruthy();
    expect(screen.getByText("Seul cet exercice change, Squat $& $' reste intact")).toBeTruthy();
  });

  it("durationEntryValue : secondes reportées, jamais ramenées dans les bornes (00:00 et > 58:55 restent à renseigner)", () => {
    expect(durationEntryValue("")).toBeNull();
    expect(durationEntryValue("0")).toBeNull();
    expect(durationEntryValue("5")).toBe(5);
    expect(durationEntryValue("175")).toBe(135);
    expect(durationEntryValue("5855")).toBe(3535);
    expect(durationEntryValue("5856")).toBeNull();
    expect(durationEntryValue("9999")).toBeNull();
  });
});
