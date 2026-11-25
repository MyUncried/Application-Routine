import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render } from "@testing-library/react-native";
import type { ComponentType } from "react";

import { requestFormatsWindowClose, takeFormatsWindowCloseRequest, takeMovementsHandedToComposition } from "@/features/sessions/movementExercises";

/**
 * Modale « Créer un exercice » — feuille de la pile racine, au-dessus de l'écran qui l'ouvre. Règle de Hermann du 06/11/2026
 * (registre ch07) : « Je veux qu’on suive l’ordre des écrans et des modèles lorsqu’on les ouvre et qu’on les ferme en fonction des
 * décisions qu’ils ont prises. Je ne veux pas qu’on ouvre un écran pour rien en prévision d’un scénario où l’on souhaite qu’il
 * apparaisse après une annulation ou une validation. »
 * - Exercice libre ouvre la fiche de création par-dessus la modale ; annulée, elle y revient (arbitrage du 06/11, A) ;
 * - fiche validée : la modale se retire ; ouverte depuis le Catalogue, la Composition s'ouvre alors avec l'exercice ;
 * - croix : retour à l'écran qui a ouvert la modale (Catalogue des séances ou Composition).
 */
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockDismiss = jest.fn();
let mockRoutes: { name: string; params?: object }[] = [];
const focusEffects: (() => void)[] = [];
let windowProps: { onClose: () => void; onFreeExercise: () => void; onSelect: (model: string) => void } | null = null;
let modelProps: { model?: string; stage: string; onClose?: () => void } | null = null;
const mockSheetOptions: object[] = [];

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, dismiss: mockDismiss }),
  useNavigation: () => ({ getState: () => ({ routes: mockRoutes, index: mockRoutes.length - 1 }) }),
  useFocusEffect: (effect: () => void) => {
    focusEffects.push(effect);
  },
  Stack: {
    Screen: ({ options }: { options: object }) => {
      mockSheetOptions.push(options);
      return null;
    },
  },
}));
jest.mock("@/features/sessions/FormatsWindow", () => ({
  FormatsWindow: (props: typeof windowProps) => {
    windowProps = props;
    return null;
  },
}));
jest.mock("@/features/sessions/FormatModelScreen", () => ({
  FormatModelScreen: (props: typeof modelProps) => {
    modelProps = props;
    return null;
  },
  useFormatSheetDetent: () => 0.9,
}));
jest.mock("@/features/activities/MovementScreen", () => ({ MOVEMENT_SESSION_CONTEXT: "session" }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const FormatsWindowRoute = (require("../formats-window") as { default: ComponentType }).default;

const FROM_CATALOGUE = [{ name: "(tabs)" }, { name: "formats-window" }];
const FROM_COMPOSITION = [{ name: "(tabs)" }, { name: "(creation)" }, { name: "formats-window" }];

describe("modale « Créer un exercice » (règle du 06/11/2026)", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockBack.mockReset();
    mockDismiss.mockReset();
    focusEffects.length = 0;
    windowProps = null;
    modelProps = null;
    mockSheetOptions.length = 0;
    takeMovementsHandedToComposition();
    takeFormatsWindowCloseRequest();
  });

  // [« un Format ouvre son questionnaire » — remplacé le 15/11/2026 : écran unique de chaque Format (décision de Hermann, registre ch07).]
  // [Le Format ouvrait son écran par-dessus (`/format-summary`, feuilles empilées) — remplacé le 25/11/2026 (D-605).]
  it("Exercice libre : la fiche s'ouvre par-dessus la modale, sans la refermer", () => {
    mockRoutes = FROM_CATALOGUE;
    render(<FormatsWindowRoute />);
    windowProps!.onFreeExercise();
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/movement", params: { context: "session" } });
  });

  /*
   * D-605 (Hermann, 25/11/2026 ; Formats § 9.7) : à l'ouverture d'un format depuis la modale « Formats d'entraînement », la modale du
   * format la recouvre entièrement — l'écran du format remplace le contenu de la même feuille native (aucune seconde feuille empilée,
   * aucune navigation), haut de la feuille porté à celui des modales de format ; la croix du format rend le contenu de la fenêtre,
   * de nouveau ajustée à son contenu. Les dix formats, sans exception.
   */
  it.each(["TABATA", "INTERVALS_30_30", "STRENGTH", "PROGRESSION", "UNTIL_FAILURE", "SUPERSET", "EMOM", "AMRAP", "DEATH_BY", "FOR_TIME"] as const)(
    "D-605 — %s : l'écran du format remplace le contenu de la feuille (aucune feuille empilée) ; croix : retour à la fenêtre des formats",
    (model) => {
      mockRoutes = FROM_COMPOSITION;
      render(<FormatsWindowRoute />);
      expect(mockSheetOptions[mockSheetOptions.length - 1]).toEqual({ sheetAllowedDetents: "fitToContents" });
      const opener = windowProps!;
      windowProps = null;
      act(() => opener.onSelect(model));
      expect(mockPush).not.toHaveBeenCalled();
      expect(windowProps).toBeNull();
      expect(modelProps).toMatchObject({ model, stage: "summary" });
      expect(mockSheetOptions[mockSheetOptions.length - 1]).toEqual({ sheetAllowedDetents: [0.9] });
      act(() => modelProps!.onClose!());
      expect(mockBack).not.toHaveBeenCalled();
      expect(windowProps).not.toBeNull();
      expect(mockSheetOptions[mockSheetOptions.length - 1]).toEqual({ sheetAllowedDetents: "fitToContents" });
      expect(mockPush).not.toHaveBeenCalled();
    },
  );

  it("croix : retour à l'écran qui a ouvert la modale (Catalogue ou Composition), sans autre écran", () => {
    for (const routes of [FROM_CATALOGUE, FROM_COMPOSITION]) {
      mockBack.mockReset();
      mockRoutes = routes;
      render(<FormatsWindowRoute />);
      windowProps!.onClose();
      expect(mockBack).toHaveBeenCalledTimes(1);
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockDismiss).not.toHaveBeenCalled();
    }
  });

  it("fiche validée, modale ouverte depuis une Composition : la modale se retire (une seule fois), retour à la Composition", () => {
    mockRoutes = FROM_COMPOSITION;
    render(<FormatsWindowRoute />);
    focusEffects[focusEffects.length - 1]!();
    expect(mockDismiss).not.toHaveBeenCalled();
    requestFormatsWindowClose();
    focusEffects[focusEffects.length - 1]!();
    focusEffects[focusEffects.length - 1]!();
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockDismiss).toHaveBeenCalledWith(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("fiche validée, modale ouverte depuis le Catalogue : la modale se retire, puis la Composition s'ouvre avec le brouillon rempli", () => {
    mockRoutes = FROM_CATALOGUE;
    render(<FormatsWindowRoute />);
    requestFormatsWindowClose();
    focusEffects[focusEffects.length - 1]!();
    expect(mockDismiss).toHaveBeenCalledWith(1);
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/composition", params: { keepDraft: "1" } });
  });
});
