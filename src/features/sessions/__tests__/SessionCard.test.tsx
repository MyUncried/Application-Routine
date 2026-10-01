import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import type { SessionSummary } from "@/domain/sessions/Session";
import { SessionCard } from "@/features/sessions/SessionCard";
import { strings } from "@/shared/i18n";
import { colors } from "@/shared/ui/tokens";

// `SessionSummary.activityCount` et `.tourRepeatCount` sont typés comme le
// littéral `1` pour T01 (une seule Activité, un seul Tour) : aucune valeur
// de test réelle ne peut donc dépasser 1 ici. La forme plurielle de
// `formatActivityCount`/`formatTourCount` est testée directement dans
// `formatSessionSummary.test.ts`, où ces fonctions acceptent un `number`
// quelconque.
function aSummary(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: "session-1",
    name: "Renforcement du genou",
    color: "#E5484D",
    activityCount: 1,
    estimatedDurationSeconds: 1080,
    isEstimatedDurationApproximate: false,
    tourRepeatCount: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
    categoryNames: [],
    bodyZoneNames: [],
    ...overrides,
  };
}

describe("SessionCard", () => {
  it("displays the session name and the formatted summary line", () => {
    render(<SessionCard session={aSummary()} />);

    expect(screen.getByText("Renforcement du genou")).toBeTruthy();
    expect(screen.getByText("1 exercice · 18 min · 1 tour")).toBeTruthy();
  });

  it("never displays fictional data for planning, last execution, or activity detail — only the exact summary line, name, and (T01-S09) a tag line strictly reflecting the real categoryNames/bodyZoneNames provided", () => {
    render(<SessionCard session={aSummary()} />);

    // Only the exact summary line is present — nothing else is rendered
    // beyond the name and it.
    expect(screen.queryByText(/·.*·.*·/)).toBeNull();
  });

  it("T01-S09 correction VISUAL (point B) — restores the missing Category/body-zone line under the Session name when at least one is present, without inventing any value beyond the props", () => {
    render(
      <SessionCard
        session={aSummary({ categoryNames: ["Cardio"], bodyZoneNames: ["Genoux", "Dos"] })}
      />,
    );

    // T01-S09 correction VISUAL, 2e contre-recette (point A, commentaire de
    // revue 5551083690) : le séparateur entre les deux groupes est
    // désormais " : " (auparavant " · ").
    expect(screen.getByText("Cardio : Genoux, Dos")).toBeTruthy();
  });

  it("T01-S09 correction VISUAL, 2e contre-recette (point A) — the Category segment is rendered in the Session's own colour, never the body-zone segment nor the separator", () => {
    render(
      <SessionCard
        session={aSummary({
          color: "#2E9B62",
          categoryNames: ["Cardio"],
          bodyZoneNames: ["Genoux"],
        })}
      />,
    );

    const categoriesSegment = screen.getByTestId("session-card-tag-line-categories");
    expect(StyleSheet.flatten(categoriesSegment.props.style).color).toBe("#2E9B62");

    const tagLine = screen.getByTestId("session-card-tag-line");
    expect(StyleSheet.flatten(tagLine.props.style).color).not.toBe("#2E9B62");
  });

  it("T01-S09 correction VISUAL (point B) — never renders the tag line at all when there is no Category and no body zone (empty state — never a visible empty line)", () => {
    render(<SessionCard session={aSummary()} />);

    expect(screen.queryByTestId("session-card-tag-line")).toBeNull();
  });

  it("T01-S09 correction VISUAL (point B) — renders only the Category group when there is no body zone, with no separator", () => {
    render(<SessionCard session={aSummary({ categoryNames: ["Cardio"], bodyZoneNames: [] })} />);
    expect(screen.getByText("Cardio")).toBeTruthy();
    expect(screen.queryByText(/:/)).toBeNull();
  });

  it("T01-S09 correction VISUAL (point B) — renders only the body-zone group when there is no Category, with no separator and no colouring", () => {
    render(<SessionCard session={aSummary({ categoryNames: [], bodyZoneNames: ["Genoux"] })} />);
    expect(screen.getByText("Genoux")).toBeTruthy();
    expect(screen.queryByTestId("session-card-tag-line-categories")).toBeNull();
  });

  it("T01-S09 correction VISUAL (point B) — truncates the tag line to a single line, never wrapping onto a second line", () => {
    render(
      <SessionCard
        session={aSummary({
          categoryNames: ["Cardio", "Renforcement", "Mobilité"],
          bodyZoneNames: ["Genoux", "Dos", "Épaules", "Chevilles et pieds"],
        })}
      />,
    );

    expect(screen.getByTestId("session-card-tag-line").props.numberOfLines).toBe(1);
  });

  it("T01-S09 correction VISUAL, 3e contre-recette — the chevron control is an instance of Controls / Disclosure — Source exact, State=Collapsed (2537:1033): canonical 28×28 frame, radius 6, colors.disclosureBackground, 1pt colors.disclosureBorderCollapsed border — never the earlier ad hoc colors.tourSurface/opacity borrowed from Forms / Select Field", () => {
    render(<SessionCard session={aSummary()} />);

    const frame = screen.getByTestId("session-card-disclosure-frame");
    const flattened = StyleSheet.flatten(frame.props.style);
    expect(flattened.width).toBe(28);
    expect(flattened.height).toBe(28);
    expect(flattened.borderRadius).toBe(6);
    expect(flattened.backgroundColor).toBe(colors.disclosureBackground);
    expect(flattened.borderWidth).toBe(1);
    expect(flattened.borderColor).toBe(colors.disclosureBorderCollapsed);

    const chevron = screen.getByTestId("session-card-disclosure-chevron");
    expect(chevron.props.style.tintColor).toBe(colors.disclosureChevronCollapsed);
  });

  it("T01-S09 correction VISUAL, point B (commentaire de revue faisant suite à 1f28a09) — the colour bar and the Category segment both render the exact persisted Session colour, including the yellow of the palette (#F7D154), never a default fallback", () => {
    render(
      <SessionCard
        session={aSummary({ color: "#F7D154", categoryNames: ["Cardio"], bodyZoneNames: [] })}
      />,
    );

    const colorBar = screen.getByTestId("session-card-color-bar");
    expect(StyleSheet.flatten(colorBar.props.style).backgroundColor).toBe("#F7D154");

    const categoriesSegment = screen.getByTestId("session-card-tag-line-categories");
    expect(StyleSheet.flatten(categoriesSegment.props.style).color).toBe("#F7D154");
  });

  it("renders the chevron and the Démarrer button as visible but disabled, with no wired behaviour", () => {
    render(<SessionCard session={aSummary()} />);

    const chevron = screen.getByLabelText(strings.screens.sessions.card.expandAccessibilityLabel);
    const start = screen.getByLabelText(strings.screens.sessions.card.startAccessibilityLabel);

    expect(chevron.props.accessibilityState).toMatchObject({ disabled: true });
    expect(start.props.accessibilityState).toMatchObject({ disabled: true });

    // Pressing a disabled control must not throw. There is no callback
    // wired at all (neither prop accepts one), which `fireEvent.press`
    // being a no-op on a `disabled` Pressable also confirms structurally.
    expect(() => fireEvent.press(chevron)).not.toThrow();
    expect(() => fireEvent.press(start)).not.toThrow();
  });

  it("without onOpen (T01-S06/S09 default): the card body is not pressable — exactly two controls (chevron, Démarrer)", () => {
    render(<SessionCard session={aSummary()} />);

    expect(screen.queryByTestId("session-card-open")).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("with onOpen (T01-S10, CE-T01-S10-01): the main area is a button that calls onOpen once; chevron and Démarrer stay visible-but-disabled", () => {
    const onOpen = jest.fn();
    render(<SessionCard session={aSummary()} onOpen={onOpen} />);

    const mainArea = screen.getByLabelText(strings.screens.sessions.card.openAccessibilityLabel);
    expect(mainArea.props.accessibilityRole).toBe("button");
    fireEvent.press(mainArea);
    expect(onOpen).toHaveBeenCalledTimes(1);

    const chevron = screen.getByLabelText(strings.screens.sessions.card.expandAccessibilityLabel);
    const start = screen.getByLabelText(strings.screens.sessions.card.startAccessibilityLabel);
    expect(chevron.props.accessibilityState).toMatchObject({ disabled: true });
    expect(start.props.accessibilityState).toMatchObject({ disabled: true });
    // Ouvrir la carte n'active jamais le chevron ni Démarrer.
    fireEvent.press(chevron);
    fireEvent.press(start);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("prefixes the estimated duration with ≥ when it is approximate (T01-S09, RM-072)", () => {
    render(<SessionCard session={aSummary({ isEstimatedDurationApproximate: true })} />);

    expect(screen.getByText("1 exercice · ≥ 18 min · 1 tour")).toBeTruthy();
  });
});
