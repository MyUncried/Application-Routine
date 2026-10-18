// Génère l'icône iOS de la variante de développement « Routine BMAD »
// (assets/variants/bmad/icon.png) : 1024 × 1024, opaque, fond orange plein,
// « BMAD » en lettres blanches dessinées en blocs (aucune police requise),
// pour la distinguer sans ambiguïté de « Routine Dev » (icône bleue Expo).
// Usage : node scripts/variants/generate-bmad-icon.js
const path = require("path");
const Jimp = require("jimp-compact");

const SIZE = 1024;
const BACKGROUND = 0xe8590cff; // orange
const FOREGROUND = 0xffffffff; // blanc
const BAND = 0x1a1a1aff; // bande sombre

// Glyphes 5 × 7, un caractère par ligne.
const GLYPHS = {
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
};

function fillRect(image, x0, y0, width, height, color) {
  for (let y = y0; y < y0 + height; y += 1) {
    for (let x = x0; x < x0 + width; x += 1) {
      image.setPixelColor(color, x, y);
    }
  }
}

function drawText(image, text, cell, centerY, color) {
  const glyphWidth = 5 * cell;
  const gap = cell;
  const totalWidth = text.length * glyphWidth + (text.length - 1) * gap;
  let x = Math.round((SIZE - totalWidth) / 2);
  const y = Math.round(centerY - (7 * cell) / 2);
  for (const char of text) {
    const rows = GLYPHS[char];
    rows.forEach((row, rowIndex) => {
      [...row].forEach((bit, colIndex) => {
        if (bit === "1") {
          fillRect(image, x + colIndex * cell, y + rowIndex * cell, cell, cell, color);
        }
      });
    });
    x += glyphWidth + gap;
  }
}

async function main() {
  const image = new Jimp(SIZE, SIZE, BACKGROUND);
  drawText(image, "BMAD", 40, 430, FOREGROUND);
  fillRect(image, 0, 680, SIZE, 200, BAND);
  drawText(image, "PRE-4", 18, 780, FOREGROUND);
  const output = path.resolve(__dirname, "../../assets/variants/bmad/icon.png");
  await image.writeAsync(output);
  console.log(`icône écrite : ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
