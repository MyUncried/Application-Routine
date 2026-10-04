import { render, screen } from "@testing-library/react-native";
import { describe, expect, it } from "@jest/globals";

import { BodyZoneIcon } from "@/shared/ui/BodyZoneIcon";

/**
 * V2-PRE-1 (#287) ; V2-PRE-2 (plan §6.5, T13, CE-UI-01 L1985/L2029/L2805) :
 * une seule famille d'icônes de Zone, variante homme/femme selon la
 * silhouette du Profil — absence de silhouette affiche homme.
 */
describe("BodyZoneIcon", () => {
  it("shows the homme variant when silhouette is null (T13)", () => {
    render(<BodyZoneIcon silhouette={null} testID="zone-icon" />);
    expect(screen.getByTestId("zone-icon").props.source).toBeTruthy();
  });

  it("shows the homme variant when silhouette is explicitly homme", () => {
    render(<BodyZoneIcon silhouette="homme" testID="zone-icon-homme" />);
    const homme = screen.getByTestId("zone-icon-homme").props.source;

    render(<BodyZoneIcon silhouette={null} testID="zone-icon-default" />);
    const defaultIcon = screen.getByTestId("zone-icon-default").props.source;

    expect(homme).toEqual(defaultIcon);
  });

  it("shows a different variant for femme than for homme — the icon changes, nothing else", () => {
    render(<BodyZoneIcon silhouette="homme" testID="zone-icon-homme" />);
    const homme = screen.getByTestId("zone-icon-homme").props.source;

    render(<BodyZoneIcon silhouette="femme" testID="zone-icon-femme" />);
    const femme = screen.getByTestId("zone-icon-femme").props.source;

    expect(femme).not.toEqual(homme);
  });

  it("forwards an explicit size override (ProfileEditScreen's 64-diameter circle, 44pt glyph)", () => {
    render(<BodyZoneIcon silhouette="femme" size={44} testID="zone-icon-sized" />);
    const flattened = screen.getByTestId("zone-icon-sized").props.style;
    expect(flattened.width).toBe(44);
    expect(flattened.height).toBe(44);
  });
});
