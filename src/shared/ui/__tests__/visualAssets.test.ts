import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

type AssetEntry = {
  key: string;
  file: string;
  figmaNodeId: string;
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
      expect(asset.figmaNodeId).toMatch(/^\d+:\d+$/);
    }
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
        plugins: Array<string | [string, Record<string, unknown>]>;
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
