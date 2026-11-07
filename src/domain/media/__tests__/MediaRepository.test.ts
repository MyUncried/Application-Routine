import { describe, expect, it } from "@jest/globals";

import { hasStablePositions, orderActivityMedia, type ActivityMediaWithAsset } from "../ActivityMedia";
import type { MediaAsset } from "../MediaAsset";

function asset(id: string): MediaAsset {
  return { id, uri: `file://${id}`, createdAt: "2026-01-01T00:00:00.000Z" };
}

describe("hasStablePositions", () => {
  it("accepts several distinct assets for the same Exercise at distinct positions", () => {
    expect(
      hasStablePositions([
        { id: "m1", activityDefinitionId: "def-1", assetId: "a1", position: 0 },
        { id: "m2", activityDefinitionId: "def-1", assetId: "a2", position: 1 },
      ]),
    ).toBe(true);
  });

  it("rejects two media sharing the same position for the same Exercise", () => {
    expect(
      hasStablePositions([
        { id: "m1", activityDefinitionId: "def-1", assetId: "a1", position: 0 },
        { id: "m2", activityDefinitionId: "def-1", assetId: "a2", position: 0 },
      ]),
    ).toBe(false);
  });

  it("allows the same position across two distinct Exercises", () => {
    expect(
      hasStablePositions([
        { id: "m1", activityDefinitionId: "def-1", assetId: "a1", position: 0 },
        { id: "m2", activityDefinitionId: "def-2", assetId: "a2", position: 0 },
      ]),
    ).toBe(true);
  });
});

describe("orderActivityMedia", () => {
  it("orders by position ascending and filters by Exercise", () => {
    const items: readonly ActivityMediaWithAsset[] = [
      { id: "m2", activityDefinitionId: "def-1", assetId: "a2", position: 1, asset: asset("a2") },
      { id: "m1", activityDefinitionId: "def-1", assetId: "a1", position: 0, asset: asset("a1") },
      { id: "m3", activityDefinitionId: "def-2", assetId: "a3", position: 0, asset: asset("a3") },
    ];
    expect(orderActivityMedia(items, "def-1").map((item) => item.id)).toEqual(["m1", "m2"]);
  });
});

// [PRE-9 A.3 du 04/11/2026 : le contrat `listForActivityDefinition` (médias d'une ancienne définition du
// Catalogue) est retiré avec elles.]
