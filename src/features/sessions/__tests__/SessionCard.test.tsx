import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it } from "@jest/globals";

import type { SessionSummary } from "@/domain/sessions/Session";
import { SessionCard } from "@/features/sessions/SessionCard";
import { strings } from "@/shared/i18n";

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
    tourRepeatCount: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("SessionCard", () => {
  it("displays the session name and the formatted summary line", () => {
    render(<SessionCard session={aSummary()} />);

    expect(screen.getByText("Renforcement du genou")).toBeTruthy();
    expect(screen.getByText("1 activité · 18 min · 1 tour")).toBeTruthy();
  });

  it("never displays fictional data for categories, planning, last execution, or activity detail", () => {
    render(<SessionCard session={aSummary()} />);

    // Only the exact summary line is present — nothing else is rendered
    // beyond the name and it.
    expect(screen.queryByText(/·.*·.*·/)).toBeNull();
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

  it("exposes exactly two interactive controls (chevron, Démarrer) — the card body itself is not pressable", () => {
    render(<SessionCard session={aSummary()} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
  });
});
