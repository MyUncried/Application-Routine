import { describe, expect, it } from "@jest/globals";

import { REST_RING_COLOR, RING, ringColorOf } from "../timerRing";

describe("ringColorOf (recette du 13/11/2026)", () => {
  it("orange pendant les pauses, récupérations et repos", () => {
    for (const phase of ["SERIES_PAUSE", "SIDE_RECOVERY", "POST_ACTIVITY_RECOVERY", "BLOCK_REST", "WINDOW_REST"]) {
      expect(ringColorOf(phase)).toBe(REST_RING_COLOR);
    }
  });

  it("violet ailleurs (exercice, compte à rebours, Point d'arrêt)", () => {
    for (const phase of ["ACTIVITY", "INITIAL_COUNTDOWN", "STOP_POINT", null]) {
      expect(ringColorOf(phase)).toBe(RING.progressColor);
    }
  });
});
