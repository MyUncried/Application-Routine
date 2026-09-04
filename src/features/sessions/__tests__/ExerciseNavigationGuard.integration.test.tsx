import { act, fireEvent, renderRouter, screen, testRouter } from "expo-router/testing-library";
import { useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { createExerciseDraft, exerciseEquals } from "@/domain/sessions/SessionDraft";
import type { SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { ExerciseExitConfirmModal } from "@/features/sessions/ExerciseExitConfirmModal";
import { SessionDraftProvider } from "@/features/sessions/SessionDraftProvider";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { strings } from "@/shared/i18n";

/**
 * Test d'intégration avec un vrai navigateur (plan T01-S08, cœur de la
 * correction du verrou synchrone) : utilise `renderRouter`/`testRouter`
 * (sous-chemin public `expo-router/testing-library`). `usePreventRemove`
 * n'est mocké nulle part dans ce fichier — le mécanisme de prévention réel
 * est exercé de bout en bout, via un vrai `Stack`/native-stack, exactement
 * comme `CompositionNavigationGuard.integration.test.tsx` (T01-S07).
 *
 * `ExerciseRouteStub` reproduit fidèlement le câblage de garde
 * d'`ExerciseScreen.tsx` (copie de travail locale, `finishingRef` +
 * `isFinishing`, `useCompositionExitGuard` appelée avant l'effet de retour,
 * `ExerciseExitConfirmModal`) — sans les contrôles de saisie
 * (`TextInput`/roulettes/`BodyZoneSelector`) hors sujet ici, même
 * convention que le stub de Composition en T01-S07.
 */

/**
 * Compteur d'appels à `updateDraft`, hors arbre React : le composant est
 * démonté dès que la navigation de retour aboutit (route retirée du
 * `Stack`), un `testID` interne au composant serait donc introuvable au
 * moment de l'assertion — cette variable de module survit, elle, au
 * démontage.
 */
let updateDraftCallCount = 0;

function ExerciseRouteStub() {
  const router = useRouter();
  const { draft, updateDraft } = useSessionDraft();

  const [initialSnapshot] = useState<SessionDraftExercise>(
    () => draft.exercises[0] ?? createExerciseDraft("ex-1"),
  );
  const [local, setLocal] = useState<SessionDraftExercise>(initialSnapshot);
  const [isFinishing, setIsFinishing] = useState(false);
  const finishingRef = useRef(false);

  const shouldBlockExit = !isFinishing && !exerciseEquals(local, initialSnapshot);
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(
    shouldBlockExit,
    () => {},
  );

  useEffect(() => {
    if (isFinishing && !shouldBlockExit) {
      router.back();
    }
  }, [isFinishing, shouldBlockExit, router]);

  function handleTerminer() {
    if (finishingRef.current) {
      return;
    }
    finishingRef.current = true;
    updateDraftCallCount += 1;
    updateDraft({ exercises: [local] });
    setIsFinishing(true);
  }

  return (
    <View>
      <Text>exercise-screen</Text>
      <Text testID="exercise-name">{local.name}</Text>
      {/* Action Retour visible (KODJO-CMD-0002) — appelle `router.back()`
          sans aucun traitement spécial, exactement comme dans
          `ExerciseScreen.tsx` : la navigation arrière normale déclenchée
          reste interceptée par `usePreventRemove` comme n'importe quelle
          autre sortie (geste système, bouton matériel). */}
      <Pressable
        accessibilityLabel={strings.screens.exercise.backAccessibilityLabel}
        onPress={() => router.back()}
      >
        <Text>{strings.screens.exercise.backAccessibilityLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="modifier-exercice-local"
        onPress={() => setLocal((current) => ({ ...current, name: "Pompes" }))}
      >
        <Text>modifier</Text>
      </Pressable>
      <Pressable accessibilityLabel={strings.screens.exercise.finishAction} onPress={handleTerminer}>
        <Text>{strings.screens.exercise.finishAction}</Text>
      </Pressable>
      {isPendingExit ? (
        <ExerciseExitConfirmModal onCancel={cancelExit} onConfirm={confirmExit} />
      ) : null}
    </View>
  );
}

function SiblingRouteStub() {
  return (
    <View>
      <Text>sibling-screen</Text>
    </View>
  );
}

function CreationLayoutStub() {
  return (
    <SessionDraftProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="exercise" />
        <Stack.Screen name="__test_sibling__" />
      </Stack>
    </SessionDraftProvider>
  );
}

/**
 * `console.error` espionné SANS remplacer son implémentation — même
 * convention que `CompositionNavigationGuard.integration.test.tsx` : aucun
 * avertissement React ne doit survenir sur les chemins couverts ici, en
 * particulier « Cannot update a component (...) while rendering a different
 * component » si l'ordonnancement des effets venait à être rompu.
 */
let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, "error");
  updateDraftCallCount = 0;
});

afterEach(() => {
  expect(consoleErrorSpy).not.toHaveBeenCalled();
  consoleErrorSpy.mockRestore();
});

function renderCreationRouter() {
  return renderRouter(
    {
      index: () => <Text>index-screen</Text>,
      "(creation)/_layout": CreationLayoutStub,
      "(creation)/exercise": ExerciseRouteStub,
      "(creation)/__test_sibling__": SiblingRouteStub,
    },
    { initialUrl: "/" },
  );
}

function pressLabel(label: string) {
  fireEvent.press(screen.getByLabelText(label));
}

describe("Désarmement de la garde après Terminer — vrai navigateur", () => {
  it("modifier l'Exercice puis Terminer : un seul updateDraft, retour direct, aucune modale D-094", () => {
    const router = renderCreationRouter();

    testRouter.push("/exercise");
    act(() => {
      pressLabel("modifier-exercice-local");
    });
    expect(screen.getByTestId("exercise-name").props.children).toBe("Pompes");

    act(() => {
      pressLabel(strings.screens.exercise.finishAction);
    });

    expect(updateDraftCallCount).toBe(1);
    expect(router.getPathname()).toBe("/");
    expect(screen.queryByText("exercise-screen")).toBeNull();
    expect(screen.queryByText("Abandonner les modifications ?")).toBeNull();
  });

  it("aucune modification locale : Terminer revient directement sans jamais avoir bloqué la sortie", () => {
    const router = renderCreationRouter();

    testRouter.push("/exercise");
    act(() => {
      pressLabel(strings.screens.exercise.finishAction);
    });

    expect(router.getPathname()).toBe("/");
    expect(screen.queryByText("Abandonner les modifications ?")).toBeNull();
  });
});

describe("Verrou synchrone du double-clic (finishingRef) — vrai navigateur", () => {
  it("deux fireEvent.press sur Terminer dans le même act() : un seul updateDraft, une seule navigation, aucune modale", () => {
    const router = renderCreationRouter();

    testRouter.push("/exercise");
    act(() => {
      pressLabel("modifier-exercice-local");
    });

    const finishButton = screen.getByLabelText(strings.screens.exercise.finishAction);
    act(() => {
      fireEvent.press(finishButton);
      fireEvent.press(finishButton);
    });

    expect(updateDraftCallCount).toBe(1);
    expect(router.getPathname()).toBe("/");
    expect(screen.queryByText("Abandonner les modifications ?")).toBeNull();
  });
});

describe("Isolation du brouillon local — abandon, vrai navigateur", () => {
  it("brouillon local vierge : la sortie aboutit immédiatement, sans aucune modale", () => {
    const router = renderCreationRouter();

    testRouter.push("/exercise");
    testRouter.back("/");

    expect(router.getPathname()).toBe("/");
    expect(screen.queryByText("Abandonner les modifications ?")).toBeNull();
  });

  it("modification locale puis sortie : une seule modale D-094 s'affiche, la route reste active", () => {
    const router = renderCreationRouter();

    testRouter.push("/exercise");
    act(() => {
      pressLabel("modifier-exercice-local");
    });

    testRouter.back();

    expect(router.getPathname()).toBe("/exercise");
    expect(screen.getAllByText("Abandonner les modifications ?")).toHaveLength(1);
  });

  it("« Continuer la modification » ferme la modale et conserve la copie locale, sans navigation", () => {
    renderCreationRouter();

    testRouter.push("/exercise");
    act(() => {
      pressLabel("modifier-exercice-local");
    });
    testRouter.back();
    expect(screen.getByText("Abandonner les modifications ?")).toBeTruthy();

    act(() => {
      pressLabel(strings.screens.exercise.exitConfirmModal.continueEditing);
    });

    expect(screen.queryByText("Abandonner les modifications ?")).toBeNull();
    expect(screen.getByTestId("exercise-name").props.children).toBe("Pompes");
  });

  it("« Abandonner » rejoue la navigation bloquée sans jamais appeler updateDraft (aucune écriture partagée)", () => {
    const router = renderCreationRouter();

    testRouter.push("/exercise");
    act(() => {
      pressLabel("modifier-exercice-local");
    });
    testRouter.back();

    act(() => {
      pressLabel(strings.screens.exercise.exitConfirmModal.abandon);
    });

    expect(updateDraftCallCount).toBe(0);
    expect(router.getPathname()).toBe("/");
    expect(screen.queryByText("exercise-screen")).toBeNull();
    expect(screen.queryByText("Abandonner les modifications ?")).toBeNull();
  });
});

describe("Action Retour visible (KODJO-CMD-0002, revue PR #9 — 5044116021)", () => {
  it("l'action Retour est visible et accessible", () => {
    renderCreationRouter();

    testRouter.push("/exercise");

    expect(screen.getByLabelText(strings.screens.exercise.backAccessibilityLabel)).toBeTruthy();
  });

  it("retour propre sans modification : appui sur Retour revient directement à Composition, sans modale", () => {
    const router = renderCreationRouter();

    testRouter.push("/exercise");
    act(() => {
      pressLabel(strings.screens.exercise.backAccessibilityLabel);
    });

    expect(router.getPathname()).toBe("/");
    expect(screen.queryByText("Abandonner les modifications ?")).toBeNull();
  });

  it("appui sur Retour après modification ouvre la modale D-094 sans perdre les valeurs locales", () => {
    const router = renderCreationRouter();

    testRouter.push("/exercise");
    act(() => {
      pressLabel("modifier-exercice-local");
    });
    expect(screen.getByTestId("exercise-name").props.children).toBe("Pompes");

    act(() => {
      pressLabel(strings.screens.exercise.backAccessibilityLabel);
    });

    // Sortie interceptée : toujours sur Exercice, modale affichée, valeur
    // locale toujours "Pompes" (rien n'a été perdu ni écrit).
    expect(router.getPathname()).toBe("/exercise");
    expect(screen.getAllByText("Abandonner les modifications ?")).toHaveLength(1);
    expect(screen.getByTestId("exercise-name").props.children).toBe("Pompes");
    expect(updateDraftCallCount).toBe(0);
  });

  it("les deux issues de la modale déclenchée par Retour restent conformes : Continuer la modification conserve la copie locale, Abandonner rejoue le retour", () => {
    const router = renderCreationRouter();

    // Issue 1 : « Continuer la modification ».
    testRouter.push("/exercise");
    act(() => {
      pressLabel("modifier-exercice-local");
    });
    act(() => {
      pressLabel(strings.screens.exercise.backAccessibilityLabel);
    });
    act(() => {
      pressLabel(strings.screens.exercise.exitConfirmModal.continueEditing);
    });
    expect(router.getPathname()).toBe("/exercise");
    expect(screen.queryByText("Abandonner les modifications ?")).toBeNull();
    expect(screen.getByTestId("exercise-name").props.children).toBe("Pompes");

    // Issue 2 : « Abandonner », depuis le même écran toujours actif.
    act(() => {
      pressLabel(strings.screens.exercise.backAccessibilityLabel);
    });
    act(() => {
      pressLabel(strings.screens.exercise.exitConfirmModal.abandon);
    });
    expect(router.getPathname()).toBe("/");
    expect(screen.queryByText("exercise-screen")).toBeNull();
    expect(screen.queryByText("Abandonner les modifications ?")).toBeNull();
    expect(updateDraftCallCount).toBe(0);
  });
});

describe("Persistance du Provider entre routes du même groupe", () => {
  it("pousser une route sœur ne démonte pas Exercice : usePreventRemove ne bloque rien ici", () => {
    const router = renderCreationRouter();

    testRouter.push("/exercise");
    act(() => {
      pressLabel("modifier-exercice-local");
    });

    testRouter.push("/__test_sibling__");
    expect(router.getPathname()).toBe("/__test_sibling__");
    expect(screen.getByText("sibling-screen")).toBeTruthy();
  });
});
