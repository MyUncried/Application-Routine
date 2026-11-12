import { describe, expect, it } from "@jest/globals";

import { MEASURE_BURST_LIMIT, MEASURE_BURST_WINDOW_MS, measureDelivery, type MeasureBurst } from "../compositionLayout";

/**
 * Recette du 10/11/2026 (« Maximum update depth exceeded » à l'ajout d'un Circuit) : une rafale de mesures est
 * reportée à l'image suivante au-delà de la limite ; une mesure isolée est appliquée comme avant.
 */
describe("measureDelivery", () => {
  it("mesures espacées : jamais reportées", () => {
    let burst: MeasureBurst = { since: 0, count: 0 };
    for (let i = 0; i < 20; i += 1) {
      const delivery = measureDelivery(burst, 1000 + i * (MEASURE_BURST_WINDOW_MS + 1));
      expect(delivery.defer).toBe(false);
      burst = delivery.burst;
    }
  });

  it("rafale dans la fenêtre : reportée au-delà de la limite, puis de nouveau appliquée après la fenêtre", () => {
    let burst: MeasureBurst = { since: 0, count: 0 };
    const deferred: boolean[] = [];
    for (let i = 0; i < MEASURE_BURST_LIMIT + 3; i += 1) {
      const delivery = measureDelivery(burst, 1000);
      deferred.push(delivery.defer);
      burst = delivery.burst;
    }
    expect(deferred.filter((value) => !value)).toHaveLength(MEASURE_BURST_LIMIT);
    expect(deferred.slice(MEASURE_BURST_LIMIT)).toEqual([true, true, true]);
    expect(measureDelivery(burst, 1000 + MEASURE_BURST_WINDOW_MS + 1).defer).toBe(false);
  });
});
