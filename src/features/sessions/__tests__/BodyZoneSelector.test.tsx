import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { BodyZoneSelector } from "@/features/sessions/BodyZoneSelector";

const ZONES: readonly BodyZone[] = [
  { id: "cou", name: "Cou", isActive: true, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "epaules", name: "Épaules", isActive: true, createdAt: "2026-01-01T00:00:01.000Z" },
  { id: "dos", name: "Dos", isActive: true, createdAt: "2026-01-01T00:00:02.000Z" },
];

describe("BodyZoneSelector", () => {
  it("renders one control per supplied zone, using its name as the accessibility label", () => {
    render(
      <BodyZoneSelector
        zones={ZONES}
        selectedIds={[]}
        onToggle={jest.fn()}
        accessibilityLabel="Zones corporelles"
      />,
    );

    expect(screen.getByLabelText("Cou")).toBeTruthy();
    expect(screen.getByLabelText("Épaules")).toBeTruthy();
    expect(screen.getByLabelText("Dos")).toBeTruthy();
  });

  it("exposes accessibilityState.checked=true only for the selected zones", () => {
    render(
      <BodyZoneSelector
        zones={ZONES}
        selectedIds={["epaules"]}
        onToggle={jest.fn()}
        accessibilityLabel="Zones corporelles"
      />,
    );

    expect(screen.getByLabelText("Cou").props.accessibilityState).toEqual({ checked: false });
    expect(screen.getByLabelText("Épaules").props.accessibilityState).toEqual({ checked: true });
    expect(screen.getByLabelText("Dos").props.accessibilityState).toEqual({ checked: false });
  });

  it("calls onToggle with exactly the pressed zone's id", () => {
    const onToggle = jest.fn();
    render(
      <BodyZoneSelector
        zones={ZONES}
        selectedIds={[]}
        onToggle={onToggle}
        accessibilityLabel="Zones corporelles"
      />,
    );

    fireEvent.press(screen.getByLabelText("Dos"));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith("dos");
  });

  it("supports multiple simultaneous selections (never a single-select radio), each remaining individually accessible as its own checkbox — KODJO-CMD-0002", () => {
    render(
      <BodyZoneSelector
        zones={ZONES}
        selectedIds={["cou", "dos"]}
        onToggle={jest.fn()}
        accessibilityLabel="Zones corporelles"
      />,
    );

    // Les trois options restent individuellement retrouvables par leur
    // propre accessibilityLabel/role (pas de nœud radiogroup intermédiaire
    // qui pourrait perturber leur exposition).
    const cou = screen.getByLabelText("Cou");
    const epaules = screen.getByLabelText("Épaules");
    const dos = screen.getByLabelText("Dos");

    expect(cou.props.accessibilityRole).toBe("checkbox");
    expect(epaules.props.accessibilityRole).toBe("checkbox");
    expect(dos.props.accessibilityRole).toBe("checkbox");

    // Deux cases cochées simultanément — jamais mutuellement exclusives.
    expect(cou.props.accessibilityState).toEqual({ checked: true });
    expect(epaules.props.accessibilityState).toEqual({ checked: false });
    expect(dos.props.accessibilityState).toEqual({ checked: true });
  });

  it("renders an empty container without error when zones is empty", () => {
    render(
      <BodyZoneSelector
        zones={[]}
        selectedIds={[]}
        onToggle={jest.fn()}
        accessibilityLabel="Zones corporelles"
      />,
    );

    expect(screen.getByTestId("body-zone-selector")).toBeTruthy();
  });

  it("never exposes a 'radiogroup' role on the container — exclusive-choice semantics would contradict multiselection (KODJO-CMD-0002, PR #9 review 5044116021)", () => {
    render(
      <BodyZoneSelector
        zones={ZONES}
        selectedIds={[]}
        onToggle={jest.fn()}
        accessibilityLabel="Zones corporelles"
      />,
    );

    const container = screen.getByTestId("body-zone-selector");
    expect(container.props.accessibilityRole).not.toBe("radiogroup");
    expect(container.props.accessibilityRole).toBeUndefined();
  });

  it("carries a hitSlop on every tag reaching the 48×48 minimum touch target without enlarging the visual pill (AUD-04, T01_S01_S08_CONFORMITY_AUDIT_20260902.md)", () => {
    render(
      <BodyZoneSelector
        zones={ZONES}
        selectedIds={[]}
        onToggle={jest.fn()}
        accessibilityLabel="Zones corporelles"
      />,
    );

    for (const zone of ZONES) {
      const tag = screen.getByLabelText(zone.name);
      expect(tag.props.hitSlop).toBeGreaterThan(0);
    }
  });
});

/**
 * V2-PRE-2 (plan §6.5, T13, CE-UI-09 L2805 ; D4/D-259) : icône de silhouette
 * optionnelle (modale de référentiel) et appui long optionnel (jamais
 * sélection/désaffectation) — comportement inchangé pour tout appelant qui
 * ne les fournit pas (`ActivityEditorForm.tsx`, préservé par défaut).
 */
describe("BodyZoneSelector — V2-PRE-2 additions", () => {
  it("renders no silhouette icon when the prop is omitted (default, unaffected callers)", () => {
    render(
      <BodyZoneSelector
        zones={ZONES}
        selectedIds={[]}
        onToggle={jest.fn()}
        accessibilityLabel="Zones corporelles"
      />,
    );
    expect(screen.queryByTestId("body-zone-selector-icon-cou")).toBeNull();
  });

  it("renders the silhouette icon per zone when silhouette is provided (CE-UI-09 L2805)", () => {
    render(
      <BodyZoneSelector
        zones={ZONES}
        selectedIds={[]}
        onToggle={jest.fn()}
        accessibilityLabel="Zones corporelles"
        silhouette="femme"
      />,
    );
    expect(screen.getByTestId("body-zone-selector-icon-cou")).toBeTruthy();
  });

  it("invokes onLongPressZone without toggling the selection (D4: l'appui long ne sélectionne ni ne désaffecte)", () => {
    const onToggle = jest.fn();
    const onLongPressZone = jest.fn();
    render(
      <BodyZoneSelector
        zones={ZONES}
        selectedIds={[]}
        onToggle={onToggle}
        accessibilityLabel="Zones corporelles"
        onLongPressZone={onLongPressZone}
      />,
    );

    fireEvent(screen.getByLabelText("Cou"), "longPress");

    expect(onLongPressZone).toHaveBeenCalledWith(ZONES[0]);
    expect(onToggle).not.toHaveBeenCalled();
  });
});
