import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { useState } from "react";
import { AccessibilityInfo, Dimensions, Modal, Platform, StyleSheet } from "react-native";
import type { ReactTestInstance } from "react-test-renderer";

import { numberTarget, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { DraftMediaItem } from "@/domain/media/ActivityMedia";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import {
  ActivityEditorForm,
  editorSideMargin,
  type ActivityEditorFormValue,
  type EditorCategory,
} from "@/features/activities/ActivityEditorForm";
import { ActivityMediaList, OPEN_SETTINGS_HIT_SLOP } from "@/features/activities/ActivityMediaList";
import { CategoryPickerModal } from "@/features/reference-data/CategoryPickerModal";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { type } from "@/shared/ui/tokens";

/**
 * PRE-4 story 4.6 — fidélité et accessibilité de l'écran principal de l'Éditeur : cibles
 * (AC4, FR-22-04), texte agrandi (AC5, FR-22-05), largeurs (AC6, FR-22-06), VoiceOver (AC7,
 * FR-22-07), retour du focus aux accès des référentiels (AC9, FR-22-10) et lexique (AC10,
 * FR-22-12). Jest n'a ni VoiceOver ni moteur de mise en page : styles, `hitSlop`, ordre de
 * l'arbre et appels de focus sont vérifiés ; l'effet réel se juge sur iPhone (R-42 à R-49).
 * Rappel NFR-04 : une suite verte ne vaut jamais validation visuelle ou tactile.
 */
jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

const ZONES: readonly BodyZone[] = [
  { id: "cou", name: "Cou", isActive: true, createdAt: "2026-01-01T00:00:00.000Z" } as BodyZone,
  { id: "cuisses", name: "Cuisses", isActive: true, createdAt: "2026-01-01T00:00:01.000Z" } as BodyZone,
];

const PHOTO: DraftMediaItem = {
  assetId: "p1",
  asset: { id: "p1", uri: "kodjo-media/p1.jpg", createdAt: "2026-10-18T10:00:00.000Z", kind: "PHOTO" },
};

function parameters(overrides: Partial<ExecutionParametersInput> = {}): ExecutionParametersInput {
  return {
    version: 5,
    mode: "DURATION",
    series: { kind: "UNIFORM", count: 3, target: numberTarget(90), pauseSeconds: 15, loadKg: 0, workPhases: [] },
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

function referentialService(): ReferentialService {
  return {
    listCategories: jest.fn(async () => [
      { id: "cardio", name: "Cardio", canonicalKey: "cardio", color: "#3B82F6", isPredefined: true, displayOrder: 1, isActive: true, createdAt: "2026-01-01T00:00:00.000Z" },
    ]),
    isCategoryUsed: jest.fn(async () => false),
    listBodyZones: jest.fn(async () => ZONES),
    createBodyZone: jest.fn(async () => ({ status: "DUPLICATE" as const })),
    renameBodyZone: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    retireBodyZone: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    isBodyZoneUsed: jest.fn(async () => false),
  } as unknown as ReferentialService;
}

const MEDIA_SERVICE = {
  supportsMediaImport: true,
  resolveMediaUri: (uri: string) => uri,
  leaseDraftMedia: jest.fn(),
  importPendingMedia: jest.fn(async () => null),
  importMedia: jest.fn(async () => ({ status: "CANCELLED" })),
  retryMediaImport: jest.fn(),
} as unknown as ActivityDefinitionService;

function Harness({
  category = null,
  isCategoryPickerOpen = false,
  initial = {},
}: {
  category?: EditorCategory;
  isCategoryPickerOpen?: boolean;
  initial?: Partial<ActivityEditorFormValue>;
}) {
  const [value, setValue] = useState<ActivityEditorFormValue>({
    name: "Fentes",
    instructionSteps: [],
    executionParameters: parameters(),
    bodyZoneIds: ["cou"],
    media: [PHOTO],
    ...initial,
  });
  return (
    <TestSafeAreaProvider>
      <ReferentialServiceContext.Provider value={referentialService()}>
        <ActivityEditorForm
          value={value}
          onChange={(patch) => setValue((current) => ({ ...current, ...patch }))}
          bodyZones={ZONES}
          category={category}
          onOpenCategory={jest.fn()}
          isCategoryPickerOpen={isCategoryPickerOpen}
          profileSideRecoverySecondsDefault={10}
          mediaService={MEDIA_SERVICE}
          mediaDraftId="draft-46"
          finishLabel="Terminer"
          onFinish={jest.fn()}
          finishSlotTestID="test-finish-slot"
          finishActionTestID="test-finish-action"
          errorTestID="test-save-error"
        />
      </ReferentialServiceContext.Provider>
    </TestSafeAreaProvider>
  );
}

/** Rend à une largeur de fenêtre simulée ; `restore` démonte et rétablit la largeur. */
function renderAtWidth(width: number) {
  const window = Dimensions.get("window");
  const screenSize = Dimensions.get("screen");
  const reset = () =>
    act(() => {
      Dimensions.set({ window, screen: screenSize });
    });
  act(() => {
    Dimensions.set({ window: { ...window, width }, screen: { ...screenSize, width } });
  });
  try {
    const view = render(<Harness />);
    return {
      restore: () => {
        try {
          view.unmount();
        } finally {
          reset();
        }
      },
    };
  } catch (error) {
    reset();
    throw error;
  }
}

/** Attributs JSX porteurs de texte : en littéral direct, puis en expression `{…}` (sans accolade imbriquée). */
const TEXT_ATTRIBUTE_LITERAL = /\b(accessibility(?:Label|Hint)|placeholder|title|label|message|hint)=["'][^"']*\p{L}[^"']*["']/gu;
const TEXT_ATTRIBUTE_EXPRESSION = /\b(accessibility(?:Label|Hint)|placeholder|title|label|message|hint)=\{([^{}\n]*)\}/gu;

/** Composant hôte de ce nom (`Text`, `TextInput`, `View`…) : le type d'un nœud de test est large. */
const isHost = (node: { readonly type: unknown }, name: string) => node.type === name;

/** Cible tactile effective (hauteur) : hauteur du style, ou hauteur minimale, plus le `hitSlop`. */
function effectiveHeight(node: ReactTestInstance): number | undefined {
  const style = StyleSheet.flatten(node.props.style) ?? {};
  const slop = node.props.hitSlop as number | { top?: number; bottom?: number } | undefined;
  const vertical = typeof slop === "number" ? slop * 2 : (slop?.top ?? 0) + (slop?.bottom ?? 0);
  const height = (style.height ?? style.minHeight) as number | undefined;
  return height === undefined ? undefined : height + vertical;
}

/**
 * Éléments que VoiceOver parcourt, dans l'ordre du document : contrôles accessibles
 * (`accessible`), champs de texte et titres de section. Un élément accessible masque ses
 * descendants (ils ne sont pas parcourus séparément).
 */
function voiceOverOrder(): string[] {
  const found: string[] = [];
  const visit = (node: ReactTestInstance) => {
    if (typeof node.type === "string") {
      const props = node.props as Record<string, unknown>;
      if (props.accessible === true || isHost(node, "TextInput")) {
        found.push((props.testID as string | undefined) ?? (props.accessibilityLabel as string));
        return;
      }
      if (isHost(node, "Text") && props.accessibilityRole === "header") {
        found.push(`titre:${String(props.children)}`);
        return;
      }
    }
    node.children.forEach((child) => {
      if (typeof child !== "string") visit(child);
    });
  };
  visit(screen.UNSAFE_root);
  return found;
}

describe("Éditeur — PRE-4 story 4.6", () => {
  it("PRE4-4.6/AC7 — ordre VoiceOver : Nom → accès Catégorie et Zones → Description → Carte → Médias → Terminer ; la Carte est un seul focus, sans élément interne", () => {
    render(<Harness category={{ name: "Cardio", color: "#3B82F6" }} />);
    const order = voiceOverOrder();
    expect(order).toEqual([
      "exercise-name-input",
      "activity-editor-category-button",
      "exercise-body-zones-open",
      `titre:${strings.screens.exercise.instruction.label}`,
      "exercise-instruction-input",
      "titre:Paramètres d’exécution",
      "exercise-parameters-card",
      "titre:Médias",
      "media-item-1",
      "media-add",
      "test-finish-action",
    ]);
    // L'en-tête (✕ « Retour », titre) précède ce formulaire dans l'écran : `ExerciseScreen.test.tsx`
    // `PRE4-4.2/AC4` ; le Nom est le premier élément du formulaire.
  });

  it("PRE4-4.6/AC7 — libellés : Nom, Description, accès (Catégorie et Zones choisies), Carte « Modifier les paramètres d’exécution » puis la Phrase entière, Terminer ; tous issus du lexique", () => {
    render(<Harness category={{ name: "Cardio", color: "#3B82F6" }} initial={{ bodyZoneIds: ["cou", "cuisses"] }} />);
    const label = (testID: string) => screen.getByTestId(testID).props.accessibilityLabel as string;
    expect(label("exercise-name-input")).toBe(strings.screens.activities.editor.name);
    // PRE-5 story 3.1 (AC6) : chaque étape est un champ nommé « Étape n » sous le titre de section.
    expect(label("exercise-instruction-input")).toBe(strings.screens.exercise.instruction.stepAccessibilityLabel.replace("{n}", "1"));
    expect(label("activity-editor-category-button")).toBe(`${strings.screens.activities.editor.category.label} Cardio`);
    expect(label("exercise-body-zones-open")).toBe(`${strings.screens.exercise.bodyZones.accessibilityLabel} Cou, Cuisses`);
    const card = label("exercise-parameters-card");
    expect(card.startsWith(`${strings.executionParameters.card.openAccessibilityLabel}. `)).toBe(true);
    expect(card).toContain("3 séries");
    expect(label("test-finish-action")).toBe("Terminer");
  });

  it("PRE4-4.6/AC9 — Zones : à la fermeture de la feuille (✕ ou ✓), le focus revient à l'accès APRÈS la fin de la fermeture (iOS : `onDismiss` du `Modal`, feuille gardée montée invisible jusque-là ; Android : dès la fermeture) ; une réouverture monte une feuille neuve", async () => {
    const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
    const focusTargets = () =>
      focus.mock.calls.filter(([, type]) => type === "focus").map(([node]) => (node as unknown as { props: { testID: string } }).props.testID);
    const zonesModal = () => screen.UNSAFE_queryAllByType(Modal).filter((modal) => modal.props.onDismiss !== undefined);
    const original = Platform.OS;
    try {
      render(<Harness />);
      for (const close of ["body-zone-picker-close", "body-zone-picker-confirm"]) {
        await act(async () => {
          fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
        });
        await screen.findByTestId("body-zone-selector-tag-cou");
        expect(zonesModal()[0]!.props.visible).toBe(true);
        focus.mockClear();
        fireEvent.press(screen.getByTestId(close));
        // iOS : fermeture en cours (fondu) — feuille invisible, encore montée, focus non envoyé.
        expect(focusTargets()).toEqual([]);
        expect(zonesModal()).toHaveLength(1);
        expect(zonesModal()[0]!.props.visible).toBe(false);
        // L'icône revient au contour dès la fermeture demandée (4.3, inchangé).
        expect(screen.getByTestId("exercise-body-zones-icon")).toBeTruthy();
        await act(async () => {
          zonesModal()[0]!.props.onDismiss();
        });
        expect(focusTargets()).toEqual(["exercise-body-zones-open"]);
        expect(zonesModal()).toHaveLength(0);
      }

      // Android : pas d'attente, comme le démontage PRE-3.
      Platform.OS = "android";
      await act(async () => {
        fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
      });
      await screen.findByTestId("body-zone-selector-tag-cou");
      focus.mockClear();
      fireEvent.press(screen.getByTestId("body-zone-picker-close"));
      expect(focusTargets()).toEqual(["exercise-body-zones-open"]);
      expect(zonesModal()).toHaveLength(0);
    } finally {
      Platform.OS = original;
      focus.mockRestore();
    }
  });

  it("PRE4-4.6/AC4 — cibles de l'Éditeur : accès ≥ 44 (4.3), ↑ de la Description 48, Terminer 48, tuiles 213, `Ouvrir les réglages` portée à 31 par un débord haut seul (place du parent), `Réessayer` 48 ; exceptions consignées (Q52) : champ Nom à 42 (frame `8328:35698`), `Ouvrir les réglages` sous 44", () => {
    render(<Harness />);
    for (const testID of ["activity-editor-category-button", "exercise-body-zones-open"]) {
      expect({ testID, ok: (effectiveHeight(screen.getByTestId(testID)) ?? 0) >= 44 }).toEqual({ testID, ok: true });
    }
    fireEvent(screen.getByTestId("exercise-instruction-input"), "focus");
    expect(effectiveHeight(screen.getByTestId("exercise-instruction-submit"))).toBe(48);
    expect(effectiveHeight(screen.getByTestId("test-finish-action"))).toBe(48);
    expect(effectiveHeight(screen.getByTestId("media-add"))).toBe(213);
    expect(effectiveHeight(screen.getByTestId("media-item-1"))).toBe(213);
    // Exception consignée (question à Hermann) : champ Nom de hauteur minimale 42, relevée sur la frame.
    expect(StyleSheet.flatten(screen.getByTestId("exercise-name-input").props.style).minHeight).toBe(42);
    screen.unmount();

    render(
      <ActivityMediaList
        media={[]}
        pending={[{ key: "x", state: "FAILED", picked: { uri: "file://x.jpg", kind: "PHOTO" }, error: "COPY_FAILED" } as never]}
        notice="PERMISSION_DENIED_FINAL"
        canImport
        resolveUri={(uri) => uri}
        onAdd={jest.fn()}
        onRemove={jest.fn()}
        onMove={jest.fn()}
        onRetry={jest.fn()}
      />,
    );
    const settings = screen.getByTestId("media-open-settings");
    expect(StyleSheet.flatten(settings.props.style)).toBeUndefined();
    expect(settings.props.hitSlop).toBe(OPEN_SETTINGS_HIT_SLOP);
    // Revue 4.6 : le lien est le dernier enfant de l'avis — aucun débord hors du parent, en bas ;
    // en haut, le débord reste sur le texte de l'avis (une ligne au moins, plus l'écart), qui
    // n'est pas une cible, et laisse au moins 8 avant la galerie.
    const notice = screen.getByTestId("media-notice");
    const noticeChildren = notice.children.filter((child): child is ReactTestInstance => typeof child !== "string");
    expect(noticeChildren[noticeChildren.length - 1]!.findAll((node) => node.props.testID === "media-open-settings").length).toBeGreaterThan(0);
    expect(OPEN_SETTINGS_HIT_SLOP.bottom).toBe(0);
    const noticeGap = StyleSheet.flatten(notice.props.style).gap as number;
    const listGap = StyleSheet.flatten(screen.getByTestId("media-list").props.style).gap as number;
    expect(OPEN_SETTINGS_HIT_SLOP.top).toBeLessThanOrEqual(type.body.lineHeight + noticeGap);
    expect(listGap + type.body.lineHeight + noticeGap - OPEN_SETTINGS_HIT_SLOP.top).toBeGreaterThanOrEqual(8);
    // Exception consignée (Q52) : cible effective = interligne du libellé + débord haut, sous 44.
    const settingsTarget = type.button.lineHeight + OPEN_SETTINGS_HIT_SLOP.top;
    expect(settingsTarget).toBe(31);
    expect(settingsTarget).toBeLessThan(44);
    expect(effectiveHeight(screen.getByTestId("media-pending-1-retry"))).toBeGreaterThanOrEqual(48);
  });

  it("PRE4-4.6/AC5 — texte agrandi : aucun plafond ni réduction de taille dans l'Éditeur (feuille des Zones ouverte comprise) ; seul texte borné, les noms des Zones du bandeau, lus en entier par le libellé de l'accès ; textes sous hauteur fixe limités aux exceptions consignées (dont le titre « Médias » non visible, PRE-5 3.2, arbitrage G-7)", async () => {
    render(<Harness initial={{ bodyZoneIds: ["cou", "cuisses"] }} />);
    fireEvent(screen.getByTestId("exercise-instruction-input"), "focus");
    const capped = () =>
      screen.UNSAFE_root.findAll(
        (node) =>
          typeof node.type === "string" &&
          (node.props.maxFontSizeMultiplier !== undefined ||
            node.props.allowFontScaling === false ||
            node.props.adjustsFontSizeToFit === true ||
            node.props.minimumFontScale !== undefined),
      );
    expect(capped()).toEqual([]);
    const bounded = screen.UNSAFE_root.findAll((node) => isHost(node, "Text") && node.props.numberOfLines !== undefined);
    expect(bounded.map((node) => node.props.testID)).toEqual(["exercise-body-zones-label"]);
    expect(screen.getByTestId("exercise-body-zones-open").props.accessibilityLabel).toBe(
      `${strings.screens.exercise.bodyZones.accessibilityLabel} Cou, Cuisses`,
    );
    // Carte et Phrase : aucune hauteur, hauteur intrinsèque (PRE-5 3.2 : plus de lignes
    // Compte à rebours / Fin sur la Carte).
    for (const testID of ["exercise-parameters-card", "exercise-parameters-phrase"]) {
      expect({ testID, height: StyleSheet.flatten(screen.getByTestId(testID).props.style).height }).toEqual({ testID, height: undefined });
    }
    // Hauteurs fixes sur un texte : ↑ de la Description (cercle de 32, symbole) et tuiles Médias
    // (260 × 213, PRE-3 ; badge « Vidéo » et textes d'état dans la tuile) — consignées (R-44).
    // PRE-5 3.2, arbitrage G-7 : exception consignée, le titre « Médias » 1 × 1 réservé à VoiceOver
    // (hors flux, transparent) — aucun texte visible n'y est borné ; son style est vérifié ici.
    const mediaTitle = StyleSheet.flatten(screen.getByTestId("activity-editor-media-title").props.style);
    expect(mediaTitle).toMatchObject({ position: "absolute", width: 1, height: 1, overflow: "hidden", color: "transparent" });
    const fixedWithText = [
      ...new Set(
        screen.UNSAFE_root.findAll(
          (node) =>
            typeof node.type === "string" &&
            typeof node.props.testID === "string" &&
            typeof StyleSheet.flatten(node.props.style)?.height === "number" &&
            node.findAll((child) => isHost(child, "Text")).length > 0,
        ).map((node) => node.props.testID as string),
      ),
    ].sort();
    expect(fixedWithText).toEqual(["activity-editor-media-title", "exercise-instruction-submit"]);

    await act(async () => {
      fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
    });
    await screen.findByTestId("body-zone-selector-tag-cou");
    expect(capped()).toEqual([]);
  });

  it("PRE4-4.6/AC6 — largeurs 360, 390, 402, 430 et 440 : marge 16 sous 390, 24 au-delà, appliquée au bandeau, au corps et à Terminer ; aucun bloc en position absolue ; Terminer hors de la zone qui évite le clavier (seule exception admise, FR-02-08)", () => {
    // PRE-8, recette A/B (A01) : marge standard 16 à toutes les largeurs.
    expect([360, 390, 402, 430, 440].map(editorSideMargin)).toEqual([16, 16, 16, 16, 16]);
    for (const width of [360, 390, 402, 430, 440]) {
      const view = renderAtWidth(width);
      try {
        const margin = editorSideMargin(width);
        const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);
        expect({ width, band: style("exercise-context-band").paddingHorizontal }).toEqual({ width, band: margin });
        expect({ width, body: StyleSheet.flatten(screen.getByTestId("exercise-body").props.contentContainerStyle).paddingHorizontal }).toEqual({ width, body: margin });
        expect({ width, finish: style("test-finish-slot").paddingHorizontal }).toEqual({ width, finish: margin });
        // PRE-6 story 7.10 (D-444) : la zone d'action de `Terminer` est fixe (absolue) au bas de l'écran.
        expect(style("test-finish-slot").position).toBe("absolute");
        for (const testID of ["exercise-context-band", "exercise-reference-row", "exercise-section-description", "exercise-section-parameters", "activity-editor-section-media"]) {
          expect({ width, testID, absolute: style(testID).position === "absolute" }).toEqual({ width, testID, absolute: false });
        }
        // Les accès passent à la ligne plutôt que de déborder ; la pilule ne dépasse jamais la rangée.
        expect(style("exercise-reference-row").flexWrap).toBe("wrap");
        expect(style("activity-editor-category-button").maxWidth).toBe("100%");
        const avoidsKeyboard = screen.UNSAFE_root.findAll(
          (node) => typeof node.type !== "string" && (node.type as { name?: string }).name === "KeyboardAvoidingView",
        );
        expect(avoidsKeyboard).toHaveLength(1);
        for (const container of avoidsKeyboard) {
          expect(container.findAll((node) => node.props.testID === "test-finish-slot")).toEqual([]);
          expect(container.findAll((node) => node.props.testID === "exercise-body").length).toBeGreaterThan(0);
        }
      } finally {
        view.restore();
      }
    }
  });

  it("PRE4-4.6/AC10 — lexique, par lecture des sources de l'Éditeur et des référentiels : aucun texte en dur dans les attributs porteurs de texte (littéraux, ternaires, gabarits), les valeurs et actions d'accessibilité, ni en texte JSX (`>Texte<`, `{\"…\"}`) ; limite : une chaîne rangée dans une variable locale ou une prop calculée hors de ces attributs n'est pas captée ; aucune exception (PRE-5 3.2 : l'unité « s » du libellé de la Carte a disparu)", () => {
    const sources = [
      "src/features/activities/ActivityEditorForm.tsx",
      "src/features/activities/ActivityMediaList.tsx",
      "src/features/activities/MediaConsultation.tsx",
      "src/features/activities/ActivityCard.tsx",
      "src/features/sessions/ExerciseScreen.tsx",
      "src/features/sessions/ExerciseExitConfirmModal.tsx",
      "src/features/sessions/BodyZoneSelector.tsx",
      "src/features/sessions/DecisionDialog.tsx",
      "src/features/reference-data/CategoryPickerModal.tsx",
      "src/features/reference-data/BodyZonePickerModal.tsx",
      "src/features/reference-data/ReferenceValueDialog.tsx",
      "src/shared/ui/ScreenShell.tsx",
    ];
    /** Partie littérale d'un gabarit `…` : les interpolations `${…}` sont retirées. */
    const literalPart = (template: string) => {
      let out = "";
      for (let index = 0; index < template.length; index += 1) {
        if (template[index] === "$" && template[index + 1] === "{") {
          let depth = 0;
          for (index += 1; index < template.length; index += 1) {
            if (template[index] === "{") depth += 1;
            if (template[index] === "}") depth -= 1;
            if (depth === 0) break;
          }
        } else out += template[index];
      }
      return out;
    };
    const LETTER = /\p{L}/u;
    const fs = jest.requireActual<typeof import("node:fs")>("node:fs");
    const found: { source: string; text: string }[] = [];
    for (const source of sources) {
      // Lecture du source tel quel, CR retirés (checkout Windows).
      const code = fs.readFileSync(source, "utf8").replace(/\r/g, "");
      const hits = [
        ...(code.match(/accessibility(Label|Hint)(=\{?|:\s*)["'][^"']*["']/g) ?? []).filter((match) => LETTER.test(match.replace(/^accessibility(Label|Hint)/, ""))),
        ...(code.match(/accessibilityValue=\{\{[^}]*text:\s*["'][^"']*\p{L}[^"']*["']/gu) ?? []),
        ...(code.match(/name:\s*"[^"]*",\s*label:\s*["'][^"']*\p{L}[^"']*["']/gu) ?? []),
        // Attributs porteurs de texte, en littéral direct (`placeholder="…"`).
        ...(code.match(TEXT_ATTRIBUTE_LITERAL) ?? []),
        // Toute chaîne à lettres dans l'expression d'un attribut porteur de texte (ternaires
        // compris : `accessibilityLabel={x ? "Oui" : "Non"}`, `title={"…"}`).
        ...[...code.matchAll(TEXT_ATTRIBUTE_EXPRESSION)].flatMap((match) =>
          (match[2]!.match(/["'][^"'\n]*\p{L}[^"'\n]*["']/gu) ?? []).map((literal) => `${match[1]}: ${literal}`),
        ),
        // Texte d'un élément JSX écrit en dur (`>Texte<`), ou chaîne en enfant (`>{"Texte"}<`).
        ...[...code.matchAll(/>([^<>{}\n;=()]*\p{L}[^<>{}\n;=()]*)</gu)].map((match) => match[1]!.trim()).filter((text) => text.length > 0),
        ...[...code.matchAll(/>\s*\{\s*(["'][^"'\n]*\p{L}[^"'\n]*["'])\s*\}\s*</gu)].map((match) => match[1]!),
        ...[...code.matchAll(/accessibility(?:Label|Hint)(?:=\{|:\s*)`([^`]*)`/g)]
          .map((match) => literalPart(match[1]!))
          .filter((template) => LETTER.test(template)),
      ];
      found.push(...hits.map((text) => ({ source, text })));
    }
    // PRE-5 story 3.2 (R-14, FR-36) : l'exception « {n} s » du libellé de la Carte disparaît avec
    // Compte à rebours et Fin ; plus aucun texte en dur n'est relevé.
    expect(found.map(({ source, text }) => ({ source, text: text.replace(/\s+/g, " ") }))).toEqual([]);
    // Le contrôle détecte bien chaque forme interdite.
    expect(LETTER.test(literalPart("Série ${n}"))).toBe(true);
    expect(literalPart("${a} ${b}")).toBe(" ");
    expect('<Pressable accessibilityLabel={ok ? "Oui" : x} />'.match(TEXT_ATTRIBUTE_EXPRESSION)).not.toBeNull();
    expect('<TextInput placeholder="Nom" />'.match(TEXT_ATTRIBUTE_LITERAL)).not.toBeNull();
    expect([...'<Text>{"Texte"}</Text>'.matchAll(/>\s*\{\s*(["'][^"'\n]*\p{L}[^"'\n]*["'])\s*\}\s*</gu)]).toHaveLength(1);
  });

  it("PRE4-4.6/AC10 — termes interdits (« Activité », « Set », « Modalités d’exécution ») absents de tout le texte rendu : Éditeur, feuille des Zones, feuille de Catégorie, formulaire de création, menu d'appui long et confirmation de suppression", async () => {
    const FORBIDDEN = /(^|[^\p{L}])(Activité|Set|Modalités d’exécution|Modalités d'exécution)([^\p{L}]|$)/iu;
    const collect = (into: string[]) => {
      for (const node of screen.UNSAFE_root.findAll((candidate) => typeof candidate.type === "string")) {
        const props = node.props as Record<string, unknown>;
        for (const key of ["accessibilityLabel", "accessibilityHint", "placeholder"]) {
          if (typeof props[key] === "string") into.push(props[key] as string);
        }
        const actions = props.accessibilityActions as { label?: string }[] | undefined;
        actions?.forEach((action) => action.label && into.push(action.label));
        if (isHost(node, "Text")) {
          node.children.forEach((child) => {
            if (typeof child === "string") into.push(child);
          });
        }
      }
    };
    const rendered: string[] = [];
    render(<Harness category={{ name: "Cardio", color: "#3B82F6" }} />);
    collect(rendered);
    await act(async () => {
      fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
    });
    await screen.findByTestId("body-zone-selector-tag-cou");
    collect(rendered);
    screen.unmount();

    render(
      <ReferentialServiceContext.Provider value={referentialService()}>
        <CategoryPickerModal selectedId="cardio" onSelect={jest.fn()} onClose={jest.fn()} />
      </ReferentialServiceContext.Provider>,
    );
    await screen.findByTestId("category-picker-tag-cardio");
    collect(rendered);
    fireEvent.press(screen.getByTestId("category-picker-create-action"));
    collect(rendered);
    await act(async () => {
      fireEvent(screen.getByTestId("category-picker-tag-cardio"), "longPress");
    });
    collect(rendered);
    fireEvent.press(screen.getByTestId("category-picker-long-press-delete"));
    collect(rendered);
    expect(rendered).toContain(strings.referenceData.longPressDialog.accessibilityAction);
    expect(rendered.length).toBeGreaterThan(30);
    expect(rendered.filter((text) => FORBIDDEN.test(text))).toEqual([]);
  });
});
