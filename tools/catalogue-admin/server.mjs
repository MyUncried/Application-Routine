import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { readFile, writeFile, rename, unlink, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { validateAdminDrafts } from "./drafts.mjs";

const ROOT = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const LOCAL_HOSTS = /^(?:127\.0\.0\.1|localhost):[0-9]{1,5}$/;
const MAX_BODY = 1024 * 1024;

export const pathsFor = (root) => ({
  pilot: path.join(root, "catalogue/pilote/mouvements-60-candidats.json"),
  taxonomy: path.join(root, "catalogue/referentiels/taxonomie-v0-proposition.json"),
  drafts: path.join(root, "catalogue/admin/brouillons.json"),
  categories: path.join(root, "src/domain/categories/defaults.ts"),
  zones: path.join(root, "src/features/reference-data/bodyZones.ts"),
  html: path.join(root, "tools/catalogue-admin/index.html"),
  js: path.join(root, "tools/catalogue-admin/app.js"),
  css: path.join(root, "tools/catalogue-admin/styles.css"),
});

const digest = (text) => createHash("sha256").update(text).digest("hex");
const json = (response, status, value, extra = {}) => {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    ...extra,
  });
  response.end(body);
};
function parseSeedDefinitions(source, label) {
  const rows = [...source.matchAll(/\{\s*id:\s*"([^"]+)"\s*,\s*name:\s*"([^"]+)"/g)]
    .map((match) => ({ id: match[1], label: match[2] }));
  if (!rows.length || new Set(rows.map((row) => row.id)).size !== rows.length) {
    throw new Error("Invalid local KODJO seed: " + label);
  }
  return rows;
}
async function readSnapshot(paths) {
  const [pilotSource, taxonomySource, draftSource, catSource, zoneSource] = await Promise.all([
    readFile(paths.pilot, "utf8"), readFile(paths.taxonomy, "utf8"),
    readFile(paths.drafts, "utf8"), readFile(paths.categories, "utf8"),
    readFile(paths.zones, "utf8"),
  ]);
  return {
    pilot: JSON.parse(pilotSource),
    taxonomy: JSON.parse(taxonomySource),
    drafts: JSON.parse(draftSource),
    revision: digest(draftSource),
    categories: parseSeedDefinitions(catSource, "categories"),
    zones: parseSeedDefinitions(zoneSource, "zones"),
  };
}
async function readBody(request) {
  let total = 0;
  const chunks = [];
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY) {
      const error = new Error("Request too large"); error.status = 413; throw error;
    }
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

/**
 * Serveur exclusivement local ; rien n'est envoyé à un hébergement externe.
 * Le catalogue source pilote et la taxonomie V0 sont lus mais jamais écrits.
 * Toute modification de contenu est un override dans catalogue/admin/brouillons.json.
 */
export function createAdminServer({ rootDir = ROOT } = {}) {
  const paths = pathsFor(rootDir);
  let writeQueue = Promise.resolve();
  const serialize = (work) => {
    const next = writeQueue.then(work);
    writeQueue = next.catch(() => {});
    return next;
  };
  return createServer(async (request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    if (!LOCAL_HOSTS.test(request.headers.host ?? "")) {
      return json(response, 403, { error: "Local host required" });
    }
    const route = new URL(request.url ?? "/", "http://" + request.headers.host).pathname;
    try {
      if (request.method === "GET" && ["/", "/app.js", "/styles.css"].includes(route)) {
        const target = route === "/" ? paths.html : route === "/app.js" ? paths.js : paths.css;
        const file = await readFile(target);
        response.writeHead(200, {
          "Content-Type": route === "/" ? "text/html; charset=utf-8" : route === "/app.js" ?
            "text/javascript; charset=utf-8" : "text/css; charset=utf-8",
          "Content-Length": file.length,
          "Cache-Control": "no-store",
        });
        return response.end(file);
      }
      if (request.method === "GET" && (route === "/api/state" || route === "/api/export")) {
        const state = await readSnapshot(paths);
        if (route === "/api/export") {
          return json(response, 200, state.drafts, {
            "Content-Disposition": 'attachment; filename="kodjo-admin-brouillons.json"',
          });
        }
        return json(response, 200, state);
      }
      if (route === "/api/drafts" && request.method === "PUT") {
        // Une page distante ne doit pas pouvoir modifier les données locales
        // en contournant les protections CORS via une requête simple.
        if (request.headers.origin !== "http://" + request.headers.host ||
            !/^application\/json\b/.test(request.headers["content-type"] ?? "")) {
          return json(response, 403, { error: "Same-origin JSON request required" });
        }
        const submission = await readBody(request);
        return await serialize(async () => {
          const current = await readSnapshot(paths);
          if (submission.revision !== current.revision) {
            return json(response, 409, { error: "Le référentiel a changé. Actualisez avant de réenregistrer." });
          }
          const errors = validateAdminDrafts(submission.drafts, current);
          if (errors.length) return json(response, 422, { error: "Brouillon invalide", details: errors });
          const output = JSON.stringify(submission.drafts, null, 2) + "\n";
          const temporary = paths.drafts + ".tmp-" + process.pid + "-" + createHash("sha256").update(output).digest("hex").slice(0,12);
          await mkdir(path.dirname(paths.drafts), { recursive: true });
          try {
            await writeFile(temporary, output, { flag: "wx", mode: 0o600 });
            await rename(temporary, paths.drafts);
          } catch (error) {
            await unlink(temporary).catch(() => {});
            throw error;
          }
          return json(response, 200, { revision: digest(output), saved: true, publicationAllowed: false });
        });
      }
      return json(response, 404, { error: "Not found" });
    } catch (error) {
      if (error instanceof SyntaxError) return json(response, 400, { error: "JSON invalide" });
      if (error?.status === 413) return json(response, 413, { error: "Requête trop volumineuse" });
      console.error("catalogue-admin:", error);
      return json(response, 500, { error: "Impossible de traiter la demande" });
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const port = Number(process.env.KODJO_ADMIN_PORT ?? 4738);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    console.error("Port invalide (KODJO_ADMIN_PORT)"); process.exitCode = 1;
  } else {
    createAdminServer().listen(port, "127.0.0.1", () =>
      console.log("Administration KODJO locale : http://127.0.0.1:" + port)
    );
  }
}
