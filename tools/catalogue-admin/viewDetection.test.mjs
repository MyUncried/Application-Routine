/**
 * Marquage des photos (D-600) : détection des vues et règle de choix sur images synthétiques.
 * Lancement : `node --test tools/catalogue-admin/`.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { detectViewRects, proposeView, toPercentRect } from "./viewDetection.js";

const GREY = [180, 180, 184];
const WHITE = [252, 250, 251];

/**
 * Image grise légèrement texturée (jamais unie, comme une photo), avec des rectangles peints unis
 * (x, y, largeur, hauteur, couleur).
 */
function image(width, height, paints = [], base = GREY) {
  const data = new Uint8ClampedArray(width * height * 4);
  const paint = (x0, y0, w, h, [r, g, b]) => {
    for (let y = y0; y < y0 + h; y += 1) {
      for (let x = x0; x < x0 + w; x += 1) {
        const p = (y * width + x) * 4;
        data[p] = r; data[p + 1] = g; data[p + 2] = b; data[p + 3] = 255;
      }
    }
  };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const shade = ((x * 7 + y * 13) % 17) - 8;
      paint(x, y, 1, 1, base.map((channel) => channel + shade));
    }
  }
  for (const [x, y, w, h, color] of paints) paint(x, y, w, h, color);
  return { width, height, data };
}

const figure = (x, y) => [x, y, 6, 20, [40, 40, 40]];

describe("detectViewRects / proposeView", () => {
  it("image simple : une vue, image entière (aucune vue stockée)", () => {
    const { width, height, data } = image(200, 160, [figure(90, 70)]);
    const result = proposeView(width, height, data);
    assert.equal(result.views.length, 1);
    assert.deepEqual(result.retained, { x: 0, y: 0, width: 100, height: 100 });
    assert.equal(result.view, null);
    assert.equal(result.rule, "IMAGE_ENTIERE");
  });

  it("deux vues côte à côte : la plus à droite", () => {
    const { width, height, data } = image(200, 160, [[98, 0, 4, 160, WHITE], figure(40, 70), figure(150, 70)]);
    const result = proposeView(width, height, data);
    assert.deepEqual(result.views, [
      { x: 0, y: 0, width: 49, height: 100 },
      { x: 51, y: 0, width: 49, height: 100 },
    ]);
    assert.equal(result.retainedIndex, 1);
    assert.deepEqual(result.view, { x: 51, y: 0, width: 49, height: 100 });
    assert.equal(result.rule, "PLUS_A_DROITE");
  });

  it("trois vues en ligne : la plus large", () => {
    // Vues de 0–59, 63–139 (77 px), 143–199.
    const { width, height, data } = image(200, 100, [[60, 0, 3, 100, WHITE], [140, 0, 3, 100, WHITE], figure(20, 40), figure(100, 40), figure(170, 40)]);
    const result = proposeView(width, height, data);
    assert.equal(result.views.length, 3);
    assert.equal(result.retainedIndex, 1);
    assert.deepEqual(result.view, { x: 31.5, y: 0, width: 38.5, height: 100 });
    assert.equal(result.rule, "PLUS_LARGE");
  });

  it("deux vues en haut, une vue large en bas : celle du bas", () => {
    const { width, height, data } = image(200, 200, [
      [0, 96, 200, 4, WHITE], // bande horizontale sur toute la largeur
      [99, 0, 3, 96, WHITE], // bande verticale dans la moitié haute seulement
      figure(40, 40), figure(150, 40), figure(100, 150),
    ]);
    const result = proposeView(width, height, data);
    assert.deepEqual(result.views, [
      { x: 0, y: 0, width: 49.5, height: 48 },
      { x: 51, y: 0, width: 49, height: 48 },
      { x: 0, y: 50, width: 100, height: 50 },
    ]);
    assert.equal(result.retainedIndex, 2);
    assert.deepEqual(result.view, { x: 0, y: 50, width: 100, height: 50 });
  });

  it("bande non blanche (montant sombre, gris clair) : aucune séparation", () => {
    const dark = image(200, 160, [[98, 0, 4, 160, [20, 20, 20]], figure(40, 70)]);
    assert.equal(detectViewRects(dark.width, dark.height, dark.data).length, 1);
    const light = image(200, 160, [[98, 0, 4, 160, [225, 225, 225]], figure(40, 70)]);
    assert.equal(detectViewRects(light.width, light.height, light.data).length, 1);
  });

  it("bande blanche interrompue (pas sur toute la longueur) : aucune séparation", () => {
    const { width, height, data } = image(200, 160, [[98, 0, 4, 120, WHITE], figure(40, 70)]);
    assert.equal(detectViewRects(width, height, data).length, 1);
  });

  it("marges blanches extérieures : ignorées", () => {
    const { width, height, data } = image(200, 160, [[0, 0, 200, 6, WHITE], [0, 0, 5, 160, WHITE], [195, 0, 5, 160, WHITE], figure(90, 70)]);
    const result = proposeView(width, height, data);
    assert.equal(result.views.length, 1);
    assert.equal(result.view, null);
  });

  it("marge unie au-dessus des vues : la séparation compte, les vues s'arrêtent à la marge", () => {
    const { width, height, data } = image(200, 160, [[0, 0, 200, 16, [210, 210, 210]], [98, 16, 4, 144, WHITE], figure(40, 70), figure(150, 70)]);
    const result = proposeView(width, height, data);
    assert.deepEqual(result.view, { x: 51, y: 10, width: 49, height: 90 });
  });

  it("bande trop fine ou lamelle trop étroite : ignorée", () => {
    const thin = image(200, 160, [[99, 0, 1, 160, WHITE], figure(40, 70)]);
    assert.equal(detectViewRects(thin.width, thin.height, thin.data).length, 1);
    const sliver = image(200, 160, [[8, 0, 3, 160, WHITE], figure(40, 70)]);
    assert.equal(detectViewRects(sliver.width, sliver.height, sliver.data).length, 1);
  });

  it("pourcentages arrondis à 0,01 et contenus dans l'image", () => {
    assert.deepEqual(toPercentRect({ x: 1, y: 2, width: 2, height: 1 }, 3, 3), { x: 33.33, y: 66.67, width: 66.67, height: 33.33 });
    const rect = toPercentRect({ x: 1, y: 0, width: 2, height: 3 }, 3, 3);
    assert.ok(rect.x + rect.width <= 100 + 1e-6);
  });

  it("refuse des pixels incomplets", () => {
    assert.throws(() => detectViewRects(10, 10, new Uint8ClampedArray(10)));
  });
});
