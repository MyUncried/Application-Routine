/**
 * Identité « Utilisateur local » de l'installation PC de l'administration.
 *
 * Décision de Hermann du 12/11/2026 (identité des acteurs, recopiée dans la spec du lot) :
 * « Utilisateur local » est renseigné automatiquement et en lecture seule : identifiant généré une
 * fois pour l'installation PC et conservé de façon persistante, jamais saisi. Son nom affiché est
 * « PC Administrateur » (valeur fixe, décidée). Cette identité est propre à l'installation PC, non
 * rattachée au profil d'un téléphone.
 *
 * Le fichier `catalogue/admin/installation.json` (non versionné) conserve l'identifiant. Un fichier
 * présent mais illisible n'est jamais remplacé : régénérer l'identifiant changerait l'identité de
 * toutes les fiches déjà attribuées à ce PC.
 */
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import { atomicWrite } from "./phone.mjs";

export const LOCAL_ADMIN_DISPLAY_NAME = "PC Administrateur";
export const INSTALLATION_ID_PATTERN = /^pc-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * @param {{ file: string | null, now?: () => number, newId?: () => string }} options
 *   `file` null : identité en mémoire seulement (tests).
 * @returns {Promise<{ kind: "LOCAL_USER", id: string, displayName: string }>}
 */
export async function loadInstallationIdentity({ file, now = () => Date.now(), newId = () => "pc-" + randomUUID() }) {
  const identity = (id) => ({ kind: "LOCAL_USER", id, displayName: LOCAL_ADMIN_DISPLAY_NAME });
  if (!file) return identity(newId());
  let raw;
  try {
    raw = await readFile(file, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    const id = newId();
    await atomicWrite(file, JSON.stringify({ id, createdAt: new Date(now()).toISOString() }, null, 2) + "\n");
    return identity(id);
  }
  let stored = null;
  try { stored = JSON.parse(raw); } catch { stored = null; }
  if (typeof stored?.id !== "string" || !INSTALLATION_ID_PATTERN.test(stored.id)) {
    throw new Error("catalogue-admin : " + file + " est illisible. Il n'est pas remplacé (l'identité du PC changerait) : corrige-le ou supprime-le volontairement.");
  }
  return identity(stored.id);
}
