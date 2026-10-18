// Tunnel Expo sur Windows ARM64 (poste de développement de Hermann) :
// `@expo/ngrok-bin` ne publie aucun binaire `win32-arm64`, d'où l'échec de
// `npx expo start --tunnel` (« The "file" argument must be of type string.
// Received null »). Windows ARM exécute les programmes x64 en émulation :
// ce script installe localement, sans toucher `package.json` ni le lockfile,
// le binaire officiel `@expo/ngrok-bin-win32-x64`, puis l'expose sous le nom
// `@expo/ngrok-bin-win32-arm64` attendu par `@expo/ngrok-bin`.
// Tout reste dans `node_modules` de ce clone ; à relancer après `npm ci`.
// Usage : node scripts/variants/setup-ngrok-win-arm64.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

if (process.platform !== "win32" || process.arch !== "arm64") {
  console.log("Rien à faire : ce poste n'est pas Windows ARM64.");
  process.exit(0);
}

const root = path.resolve(__dirname, "../..");
const binVersion = require(path.join(root, "node_modules/@expo/ngrok-bin/package.json")).optionalDependencies[
  "@expo/ngrok-bin-win32-x64"
];
const x64Dir = path.join(root, "node_modules/@expo/ngrok-bin-win32-x64");
if (!fs.existsSync(path.join(x64Dir, "ngrok.exe"))) {
  execSync(`npm install --no-save --force --no-audit --no-fund @expo/ngrok-bin-win32-x64@${binVersion}`, {
    cwd: root,
    stdio: "inherit",
  });
}
const arm64Dir = path.join(root, "node_modules/@expo/ngrok-bin-win32-arm64");
fs.mkdirSync(arm64Dir, { recursive: true });
fs.copyFileSync(path.join(x64Dir, "ngrok.exe"), path.join(arm64Dir, "ngrok.exe"));
fs.writeFileSync(
  path.join(arm64Dir, "package.json"),
  JSON.stringify({ name: "@expo/ngrok-bin-win32-arm64", version: binVersion, private: true }, null, 2),
);
console.log(`ngrok ${binVersion} (x64, émulé) disponible pour @expo/ngrok-bin sur win32-arm64.`);
