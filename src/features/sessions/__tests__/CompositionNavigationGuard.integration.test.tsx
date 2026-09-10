import { act, fireEvent, renderRouter, screen, testRouter } from "expo-router/testing-library";
import { useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Pressable, Text, View } from "react-native";

import { isSessionDraftDirty } from "@/domain/sessions/SessionDraft";
import { AbandonCreationModal } from "@/features/sessions/AbandonCreationModal";
import { SessionDraftProvider } from "@/features/sessions/SessionDraftProvider";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { strings } from "@/shared/i18n";

/**
 * Test d'intégration avec un vrai navigateur (plan §10.3/§10.4) : utilise
 * `renderRouter`/`testRouter` (sous-chemin public `expo-router/testing-library`).
 * `usePreventRemove` (ni `expo-router/react-navigation`, ni React Navigation)
 * n'est mocké nulle part dans ce fichier — le mécanisme de prévention réel
 * est exercé de bout en bout, via un vrai `Stack`/native-stack.
 *
 * Routes factices définies ici même (pas de vrais fichiers sous `app/`,
 * aucune route Exercice, aucune anticipation de T01-S08) : les écrans
 * `(creation)/composition` et `(creation)/__test_sibling__` sont des stubs
 * minimaux qui cablent les VRAIS `SessionDraftProvider`,
 * `useCompositionExitGuard` et `AbandonCreationModal` — exactement le même
 * mécanisme que `CompositionScreen.tsx`, sans `DurationWheelPicker` ni
 * haptique (hors sujet ici).
 */

function CreationLayoutStub() {
  return (
    <SessionDraftProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="composition" />
        <Stack.Screen name="__test_sibling__" />
      </Stack>
    </SessionDraftProvider>
  );
}

function CompositionRouteStub() {
  const router = useRouter();
  const { draft, updateDraft, resetDraft } = useSessionDraft();
  const shouldBlock = isSessionDraftDirty(draft);
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(shouldBlock, resetDraft);

  return (
    <View>
      <Text>composition-screen</Text>
      <Text testID="draft-name">{draft.name}</Text>
      {/* Action Retour visible (correction CE-T01-04, AUD-03) — appelle
          `router.back()` sans traitement spécial, exactement comme dans
          `CompositionScreen.tsx` : la navigation arrière normale déclenchée
          reste interceptée par `usePreventRemove` comme n'importe quelle
          autre sortie (geste système, bouton matériel). */}
      <Pressable
        accessibilityLabel={strings.screens.composition.backAccessibilityLabel}
        onPress={() => router.back()}
      >
        <Text>{strings.screens.composition.backAccessibilityLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="modifier-le-brouillon"
        onPress={() => updateDraft({ name: "Séance modifiée" })}
      >
        <Text>modifier</Text>
      </Pressable>
      {isPendingExit ? <AbandonCreationModal onCancel={cancelExit} onConfirm={confirmExit} /> : null}
    </View>
  );
}

function SiblingRouteStub() {
  const { draft } = useSessionDraft();
  return (
    <View>
      <Text>sibling-screen</Text>
      <Text testID="draft-name">{draft.name}</Text>
    </View>
  );
}

/**
 * `console.error` est espionné SANS remplacer son implémentation
 * (`jest.spyOn` sans `mockImplementation`) : le message continue d'être
 * affiché normalement (rien n'est masqué), mais chaque appel est également
 * capturé. `afterEach` échoue le test si un seul appel a eu lieu — en
 * particulier l'avertissement React « Cannot update a component (...)
 * while rendering a different component » qui révélait un effet de bord
 * (`resetDraft`/`navigation.dispatch`) exécuté depuis un updater
 * fonctionnel de `setState` dans `useCompositionExitGuard` (corrigé). Aucun
 * scénario de ce fichier ne s'attend à un `console.error` légitime.
 */
let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, "error");
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
      "(creation)/composition": CompositionRouteStub,
      "(creation)/__test_sibling__": SiblingRouteStub,
    },
    { initialUrl: "/" },
  );
}

describe("Garde de sortie de Composition — vrai navigateur, mécanisme de prévention réel", () => {
  it("brouillon vierge : la sortie aboutit immédiatement, sans aucune modale", () => {
    const router = renderCreationRouter();

    testRouter.push("/composition");
    expect(screen.getByText("composition-screen")).toBeTruthy();

    testRouter.back("/");

    expect(router.getPathname()).toBe("/");
    expect(screen.queryByText("Abandonner la création ?")).toBeNull();
  });

  it("brouillon modifié : la sortie est empêchée, une seule modale s'affiche, la route reste active", () => {
    const router = renderCreationRouter();

    testRouter.push("/composition");
    act(() => {
      fireModifyDraft();
    });
    expect(screen.getByTestId("draft-name").props.children).toBe("Séance modifiée");

    testRouter.back();

    // Sortie empêchée : toujours sur Composition, une seule modale affichée.
    expect(router.getPathname()).toBe("/composition");
    expect(screen.getAllByText("Abandonner la création ?")).toHaveLength(1);
  });

  it("« Continuer la création » ferme la modale et conserve intégralement le brouillon, sans navigation", () => {
    const router = renderCreationRouter();

    testRouter.push("/composition");
    act(() => {
      fireModifyDraft();
    });
    testRouter.back();
    expect(screen.getByText("Abandonner la création ?")).toBeTruthy();

    act(() => {
      pressLabel(strings.screens.composition.abandonModal.continueCreating);
    });

    expect(router.getPathname()).toBe("/composition");
    expect(screen.queryByText("Abandonner la création ?")).toBeNull();
    expect(screen.getByTestId("draft-name").props.children).toBe("Séance modifiée");
  });

  it("« Abandonner » réinitialise le brouillon puis rejoue exactement l'action bloquée, sans double navigation ni réamorçage", () => {
    const router = renderCreationRouter();

    testRouter.push("/composition");
    act(() => {
      fireModifyDraft();
    });
    testRouter.back();
    expect(screen.getByText("Abandonner la création ?")).toBeTruthy();

    act(() => {
      pressLabel(strings.screens.composition.abandonModal.abandon);
    });

    // La navigation initialement bloquée aboutit exactement une fois.
    expect(router.getPathname()).toBe("/");
    expect(screen.queryByText("composition-screen")).toBeNull();
    expect(screen.queryByText("Abandonner la création ?")).toBeNull();
  });

  it("absence de boucle : après un abandon, ré-entrer sur un brouillon désormais vierge quitte à nouveau sans modale", () => {
    const router = renderCreationRouter();

    testRouter.push("/composition");
    act(() => {
      fireModifyDraft();
    });
    testRouter.back();
    act(() => {
      pressLabel(strings.screens.composition.abandonModal.abandon);
    });
    expect(router.getPathname()).toBe("/");

    // Nouvelle entrée sur Composition : le Provider a été démonté puis
    // remonté (retour à l'écran d'accueil), le brouillon est donc à
    // nouveau vierge par construction — aucune modale ne doit réapparaître.
    testRouter.push("/composition");
    expect(screen.getByTestId("draft-name").props.children).toBe("");

    testRouter.back("/");

    expect(router.getPathname()).toBe("/");
    expect(screen.queryByText("Abandonner la création ?")).toBeNull();
  });
});

describe("Action Retour visible (correction CE-T01-04, AUD-03 — T01_S01_S08_CONFORMITY_AUDIT_20260902.md)", () => {
  it("l'action Retour est visible et accessible", () => {
    renderCreationRouter();

    testRouter.push("/composition");

    expect(
      screen.getByLabelText(strings.screens.composition.backAccessibilityLabel),
    ).toBeTruthy();
  });

  it("retour propre sans modification : appui sur Retour revient directement à l'accueil, sans modale", () => {
    const router = renderCreationRouter();

    testRouter.push("/composition");
    act(() => {
      pressLabel(strings.screens.composition.backAccessibilityLabel);
    });

    expect(router.getPathname()).toBe("/");
    expect(screen.queryByText("Abandonner la création ?")).toBeNull();
  });

  it("appui sur Retour après modification ouvre la modale d'abandon, sans perdre le brouillon", () => {
    const router = renderCreationRouter();

    testRouter.push("/composition");
    act(() => {
      fireModifyDraft();
    });

    act(() => {
      pressLabel(strings.screens.composition.backAccessibilityLabel);
    });

    expect(router.getPathname()).toBe("/composition");
    expect(screen.getAllByText("Abandonner la création ?")).toHaveLength(1);
    expect(screen.getByTestId("draft-name").props.children).toBe("Séance modifiée");
  });
});

describe("Persistance du Provider entre routes du même groupe (plan §10.4)", () => {
  it("le brouillon modifié sur Composition survit à une navigation vers puis depuis une route sœur du même Stack imbriqué", () => {
    const router = renderCreationRouter();

    testRouter.push("/composition");
    act(() => {
      fireModifyDraft();
    });
    expect(screen.getByTestId("draft-name").props.children).toBe("Séance modifiée");

    // Pousser une route sœur ne retire pas Composition du Stack (elle n'est
    // pas démontée) : `usePreventRemove` ne doit donc rien empêcher ici.
    testRouter.push("/__test_sibling__");
    expect(router.getPathname()).toBe("/__test_sibling__");
    expect(screen.getByText("sibling-screen")).toBeTruthy();
    // Le même Provider est toujours monté : la route sœur voit le même brouillon.
    expect(screen.getByTestId("draft-name").props.children).toBe("Séance modifiée");

    testRouter.back("/composition");

    expect(screen.getByText("composition-screen")).toBeTruthy();
    expect(screen.getByTestId("draft-name").props.children).toBe("Séance modifiée");
  });
});

function fireModifyDraft() {
  pressLabel("modifier-le-brouillon");
}

function pressLabel(label: string) {
  fireEvent.press(screen.getByLabelText(label));
}
