import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

type AssetEntry = {
  key: string;
  file: string;
  figmaNodeId: string | null;
  figmaStatus?: string;
  historicalFigmaNodeId?: string;
  width: number;
  height: number;
};

const repositoryRoot = path.resolve(__dirname, "../../../..");
const iconDirectory = path.join(repositoryRoot, "assets/icons");
const manifestPath = path.join(iconDirectory, "manifest.json");

describe("canonical T01 visual assets", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    assets: AssetEntry[];
    branding: { splashLogo: { file: string; sourcePixels: number; minimumPixelsAt3x: number } };
  };

  it("keeps every manifest entry backed by a valid vector master", () => {
    expect(manifest.assets.length).toBeGreaterThanOrEqual(19);

    for (const asset of manifest.assets) {
      const svgPath = path.join(iconDirectory, `${asset.file}.svg`);
      expect(existsSync(svgPath)).toBe(true);

      const svg = readFileSync(svgPath, "utf8");
      expect(svg).toContain(`width="${asset.width}"`);
      expect(svg).toContain(`height="${asset.height}"`);
      expect(svg).toContain(
        `viewBox="0 0 ${asset.width} ${asset.height}"`,
      );
      expect(svg).not.toMatch(/<text\b/i);
      expect(svg).not.toMatch(/[�]/);
      // Alignement DSF 07/10 : un identifiant Figma nul n'est admis que pour
      // une source disparue de Figma, dont l'identifiant historique reste
      // tracé.
      if (asset.figmaNodeId === null) {
        expect(asset.figmaStatus).toBe("SOURCE_REMOVED");
        expect(asset.historicalFigmaNodeId).toMatch(/^\d+:\d+$/);
      } else {
        expect(asset.figmaNodeId).toMatch(/^\d+:\d+$/);
      }
    }
  });

  it("lists every SVG of assets/icons in the manifest (no asset without an entry)", () => {
    const listed = new Set(manifest.assets.map((asset) => `${asset.file}.svg`));
    const files = readdirSync(iconDirectory).filter((file) => file.endsWith(".svg"));
    expect(files.filter((file) => !listed.has(file))).toEqual([]);
  });

  it("uses a sufficiently resolved, square PNG for the splash logo", () => {
    const branding = manifest.branding.splashLogo;
    const logoPath = path.join(repositoryRoot, branding.file);
    expect(existsSync(logoPath)).toBe(true);
    expect(statSync(logoPath).size).toBeGreaterThan(30_000);

    const png = readFileSync(logoPath);
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);

    expect(width).toBe(branding.sourcePixels);
    expect(height).toBe(branding.sourcePixels);
    expect(width).toBeGreaterThanOrEqual(branding.minimumPixelsAt3x);
  });

  it("keeps native and application splash branding aligned", () => {
    const appConfig = JSON.parse(
      readFileSync(path.join(repositoryRoot, "app.json"), "utf8"),
    ) as {
      expo: {
        plugins: (string | [string, Record<string, unknown>])[];
      };
    };
    const splashPlugin = appConfig.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
    );
    expect(splashPlugin).toEqual([
      "expo-splash-screen",
      expect.objectContaining({
        backgroundColor: "#0001F1",
        image: "./assets/branding/logo_icon_only_transparent_1024.png",
        imageWidth: 200,
      }),
    ]);

    const splashSource = readFileSync(
      path.join(repositoryRoot, "src/shared/ui/KodjoSplash.tsx"),
      "utf8",
    );
    expect(splashSource).toContain("logo_icon_only_transparent_1024.png");
    expect(splashSource).toContain("KODJO");
    expect(splashSource).toContain("Keep On. Do Just One.");
    expect(splashSource).toContain("Votre assistant du quotidien");
  });

  it("contains no legacy typography glyphs in the corrected T01 components", () => {
    const files = [
      "src/features/sessions/CatalogueScreen.tsx",
      "src/features/sessions/CompositionScreen.tsx",
      "src/features/sessions/ExerciseScreen.tsx",
      "src/features/sessions/SessionCard.tsx",
    ];

    for (const file of files) {
      const source = readFileSync(path.join(repositoryRoot, file), "utf8");
      expect(source).not.toMatch(/[⌄▶‹]/);
    }
  });
});

/**
 * PRE-4 story 4.3 (FR-02-05 ; planche `7245:13718`) : chaque état plein est le même
 * tracé que son maître contour (« un changement de forme au basculement se voit comme
 * un clignotement »). Silhouettes : mêmes commandes et mêmes sommets, à l'échelle 26/24.
 * Catégorie : trois rectangles arrondis et trois traits du maître (24) retrouvés à
 * l'échelle 22/24 — rectangles pleins, traits épaissis à l'épaisseur du trait du maître.
 */
describe("PRE-4 story 4.3 — icônes pleines superposables aux contours", () => {
  const pathData = (file: string) =>
    [...readFileSync(path.join(iconDirectory, file), "utf8").matchAll(/ d="([^"]+)"/g)].map((match) => match[1]!).join(" ");
  const numbers = (data: string) => (data.match(/-?\d*\.?\d+/g) ?? []).map(Number);

  it("PRE4-4.3/AC2 — silhouettes homme et femme : mêmes commandes, chaque sommet à moins de 0,01 du maître × 26/24", () => {
    for (const silhouette of ["homme", "femme"]) {
      const contour = pathData(`body-zone-${silhouette}.svg`);
      const filled = pathData(`body-zone-${silhouette}-plein.svg`);
      expect(filled.replace(/[^A-Za-z]/g, "")).toBe(contour.replace(/[^A-Za-z]/g, ""));
      const a = numbers(contour);
      const b = numbers(filled);
      expect(b).toHaveLength(a.length);
      a.forEach((value, index) => expect(Math.abs((value * 26) / 24 - b[index]!)).toBeLessThan(0.01));
    }
  });

  it("PRE4-4.3/AC2 — Catégorie : rectangles et traits du maître retrouvés à l'échelle 22/24 dans l'état plein", () => {
    const k = 22 / 24;
    const filled = pathData("icon-categorie-plein.svg");
    const subpaths = filled.split(/Z/).filter((part) => part.trim() !== "");
    // Lecture des commandes absolues M, L, H, V, C de l'export (points et points de contrôle).
    const boxes = subpaths.map((part) => {
      const xs: number[] = [];
      const ys: number[] = [];
      let x = 0;
      let y = 0;
      for (const [, command, args] of part.matchAll(/([MLHVC])([^MLHVC]*)/g)) {
        const values = numbers(args!);
        if (command === "H") values.forEach((value) => xs.push((x = value)));
        else if (command === "V") values.forEach((value) => ys.push((y = value)));
        else
          for (let index = 0; index + 1 < values.length; index += 2) {
            xs.push((x = values[index]!));
            ys.push((y = values[index + 1]!));
          }
        xs.push(x);
        ys.push(y);
      }
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map((value) => Number((value / k).toFixed(2)));
    });
    const half = 1.125 / 2;
    // Maître `icon/categorie` (24) : rectangles (5..19 × 2,5..7,5), (11..19 × 10,5..14,5), (11..19 × 18..22) ;
    // traits x = 7,5 de 7,5 à 20, y = 12,5 et y = 20 de 7,5 à 11, trait 1,125.
    expect(boxes).toEqual([
      [5, 2.5, 19, 7.5],
      [11, 10.5, 19, 14.5],
      [11, 18, 19, 22],
      [7.5 - half, 7.5 - half, 7.5 + half, 20 + half],
      [7.5 - half, 12.5 - half, 11 + half, 12.5 + half],
      [7.5 - half, 20 - half, 11 + half, 20 + half],
    ].map((box) => box.map((value) => Number(value.toFixed(2)))));
    const master = readFileSync(path.join(iconDirectory, "icon-categorie.svg"), "utf8");
    expect(master).toContain("M17.2 2.5H6.8");
    expect(master).toContain("M7.5 7.5V20H11M7.5 12.5H11");
    expect(master).toContain('stroke-width="1.125"');
  });

  it("PRE4-4.3/AC2 — exports pleins sans attributs de rendu étrangers aux autres icônes, identifiants lisibles", () => {
    for (const file of ["icon-categorie-plein.svg", "body-zone-homme-plein.svg", "body-zone-femme-plein.svg"]) {
      const svg = readFileSync(path.join(iconDirectory, file), "utf8");
      expect(svg).not.toMatch(/preserveAspectRatio|overflow=|style=/);
      expect(svg).not.toMatch(/&#195;/);
      expect(svg).toContain('fill="#0508E5"');
    }
  });
});
