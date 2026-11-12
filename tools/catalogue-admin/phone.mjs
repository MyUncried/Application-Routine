/**
 * Appairage des téléphones et boîte d'arrivée (W2, 11/11/2026) — état du serveur local.
 *
 * - Code d'appairage : 6 chiffres tirés par `crypto.randomInt`, valable 5 minutes, à usage
 *   unique, un seul code actif (un nouveau code remplace le précédent). Comparaison à temps
 *   constant. 5 essais faux brûlent le code ; au-delà de 20 échecs en 10 minutes, l'appairage
 *   est verrouillé jusqu'à la fin de la fenêtre.
 * - Jeton : 32 octets aléatoires (base64url), remis une seule fois au téléphone, valable 12 h.
 *   Seule son empreinte SHA-256 est conservée (mémoire et `catalogue/admin/appareils.json`,
 *   non versionné) : le fichier ne contient aucun jeton utilisable. Jamais journalisé.
 * - Boîte d'arrivée : un fichier JSON par envoi dans `catalogue/admin/inbox/` (non versionné),
 *   écrit atomiquement ; un Mouvement déjà reçu avec le même contenu n'est pas réenregistré.
 */
import { Buffer } from "node:buffer";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const PAIRING_CODE_TTL_MS = 5 * 60 * 1000;
export const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
export const PAIRING_MAX_ATTEMPTS_PER_CODE = 5;
export const PAIRING_FAILURE_WINDOW_MS = 10 * 60 * 1000;
export const PAIRING_MAX_FAILURES_PER_WINDOW = 20;
const DEVICE_NAME_MAX = 60;
const CONTROL = /[\u0000-\u001f\u007f]/;

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/** Écriture atomique : fichier temporaire exclusif puis renommage. */
export async function atomicWrite(target, content) {
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = target + ".tmp-" + process.pid + "-" + randomBytes(6).toString("hex");
  try {
    await writeFile(temporary, content, { flag: "wx", mode: 0o600 });
    await rename(temporary, target);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

/**
 * @param {{ now: () => number, file: string | null, serialize: (work: () => Promise<any>) => Promise<any> }} options
 */
export async function createPairingStore({ now, file, serialize }) {
  let activeCode = null; // { code, expiresAt, attempts }
  let failures = []; // horodatages des échecs (fenêtre glissante)
  const devices = new Map(); // deviceId → { deviceId, name, tokenHash, pairedAt, expiresAt, lastSeenAt }

  if (file) {
    try {
      const stored = JSON.parse(await readFile(file, "utf8"));
      for (const device of Array.isArray(stored.devices) ? stored.devices : []) {
        if (typeof device?.deviceId === "string" && /^[0-9a-f]{64}$/.test(device.tokenHash ?? "") &&
            typeof device.expiresAt === "number" && device.expiresAt > now()) {
          devices.set(device.deviceId, { ...device, lastSeenAt: device.lastSeenAt ?? null });
        }
      }
    } catch (error) {
      if (error?.code !== "ENOENT") console.error("catalogue-admin : registre des appareils illisible, ignoré.");
    }
  }

  const purge = () => {
    const at = now();
    for (const [id, device] of devices) if (device.expiresAt <= at) devices.delete(id);
    failures = failures.filter((time) => at - time < PAIRING_FAILURE_WINDOW_MS);
    if (activeCode && activeCode.expiresAt <= at) activeCode = null;
  };

  const persist = () => {
    if (!file) return Promise.resolve();
    const snapshot = [...devices.values()].map(({ deviceId, name, tokenHash, pairedAt, expiresAt }) =>
      ({ deviceId, name, tokenHash, pairedAt, expiresAt }));
    return serialize(() => atomicWrite(file, JSON.stringify({
      format: "KODJO_ADMIN_PAIRED_DEVICES", formatVersion: "1.0.0", devices: snapshot,
    }, null, 2) + "\n"));
  };

  const publicDevice = ({ deviceId, name, pairedAt, expiresAt, lastSeenAt }) =>
    ({ deviceId, name, pairedAt: new Date(pairedAt).toISOString(), expiresAt: new Date(expiresAt).toISOString(),
      lastSeenAt: lastSeenAt === null ? null : new Date(lastSeenAt).toISOString() });

  return {
    /** Nouveau code (remplace le précédent). */
    newCode() {
      purge();
      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      activeCode = { code, expiresAt: now() + PAIRING_CODE_TTL_MS, attempts: 0 };
      return { code, expiresAt: new Date(activeCode.expiresAt).toISOString() };
    },

    /** Annule le code actif (fermeture de la fenêtre d'appairage). */
    cancelCode() {
      activeCode = null;
    },

    /** @returns {Promise<{ ok: true, token: string, device: object } | { ok: false, status: number, error: string }>} */
    async pair(code, deviceName) {
      purge();
      if (failures.length >= PAIRING_MAX_FAILURES_PER_WINDOW) return { ok: false, status: 429, error: "PAIRING_LOCKED" };
      if (typeof deviceName !== "string" || deviceName.trim() === "" || CONTROL.test(deviceName) ||
          [...deviceName.trim()].length > DEVICE_NAME_MAX) {
        return { ok: false, status: 400, error: "INVALID_DEVICE_NAME" };
      }
      if (typeof code !== "string" || !/^\d{6}$/.test(code)) return { ok: false, status: 400, error: "INVALID_CODE_FORMAT" };
      if (!activeCode) {
        failures.push(now());
        return { ok: false, status: 403, error: "PAIRING_CLOSED" };
      }
      const matches = timingSafeEqual(Buffer.from(code, "utf8"), Buffer.from(activeCode.code, "utf8"));
      if (!matches) {
        failures.push(now());
        activeCode.attempts += 1;
        if (activeCode.attempts >= PAIRING_MAX_ATTEMPTS_PER_CODE) {
          activeCode = null;
          return { ok: false, status: 403, error: "CODE_REVOKED_AFTER_FAILURES" };
        }
        return { ok: false, status: 403, error: "WRONG_CODE" };
      }
      activeCode = null; // usage unique
      const token = randomBytes(32).toString("base64url");
      const at = now();
      const device = {
        deviceId: randomBytes(8).toString("hex"),
        name: deviceName.trim(),
        tokenHash: sha256(token),
        pairedAt: at,
        expiresAt: at + TOKEN_TTL_MS,
        lastSeenAt: null,
      };
      devices.set(device.deviceId, device);
      await persist();
      return { ok: true, token, device: publicDevice(device) };
    },

    /** Appareil correspondant à un en-tête `Authorization: Bearer <jeton>`, ou `null`. */
    authenticate(header) {
      purge();
      const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(typeof header === "string" ? header : "");
      if (!match) return null;
      const presented = Buffer.from(sha256(match[1]), "hex");
      let found = null;
      for (const device of devices.values()) {
        if (timingSafeEqual(presented, Buffer.from(device.tokenHash, "hex"))) found = device;
      }
      if (found) found.lastSeenAt = now();
      return found ? publicDevice(found) : null;
    },

    list() {
      purge();
      return [...devices.values()].map(publicDevice);
    },

    async revoke(deviceId) {
      if (!devices.delete(deviceId)) return false;
      await persist();
      return true;
    },

    status() {
      purge();
      return {
        codeActive: activeCode !== null,
        codeExpiresAt: activeCode ? new Date(activeCode.expiresAt).toISOString() : null,
        locked: failures.length >= PAIRING_MAX_FAILURES_PER_WINDOW,
      };
    },
  };
}

const SUBMISSION_FILE = /^[0-9]{8}T[0-9]{6}Z-[0-9a-f]{12}\.json$/;
const ITEM_ID = /^([0-9]{8}T[0-9]{6}Z-[0-9a-f]{12})\.([0-9]{1,4})$/;
export const INBOX_STATUSES = ["PENDING", "ADDED", "LINKED", "DISMISSED"];

/**
 * Boîte d'arrivée persistée. `fingerprint` est fourni par le domaine partagé
 * (`inboxMovementFingerprint`) : aucune seconde règle de comparaison.
 */
export function createInboxStore({ dir, now, serialize, fingerprint }) {
  async function loadAll() {
    let names = [];
    try {
      names = (await readdir(dir)).filter((name) => SUBMISSION_FILE.test(name)).sort();
    } catch (error) {
      if (error?.code === "ENOENT") return [];
      throw error;
    }
    const submissions = [];
    for (const name of names) {
      try {
        const submission = JSON.parse(await readFile(path.join(dir, name), "utf8"));
        if (submission?.format === "KODJO_ADMIN_INBOX_SUBMISSION" && Array.isArray(submission.items)) {
          submissions.push({ ...submission, fileName: name });
        }
      } catch {
        console.error("catalogue-admin : envoi illisible ignoré dans la boîte d'arrivée.");
      }
    }
    return submissions;
  }

  const writeSubmission = (submission) => {
    const { fileName, ...content } = submission;
    return atomicWrite(path.join(dir, fileName), JSON.stringify(content, null, 2) + "\n");
  };

  return {
    /** Enregistre les Mouvements non encore reçus (même identifiant ET même contenu = doublon). */
    receive(envelope, device) {
      return serialize(async () => {
        const known = new Set();
        for (const submission of await loadAll()) {
          for (const item of submission.items) known.add(item.movement.movementId + "\u0000" + item.fingerprint);
        }
        const fresh = [];
        for (const movement of envelope.movements) {
          const print = fingerprint(movement);
          const key = movement.movementId + "\u0000" + print;
          if (known.has(key)) continue;
          known.add(key);
          fresh.push({ movement, fingerprint: print });
        }
        if (fresh.length === 0) return { stored: 0, submissionId: null };
        const at = new Date(now());
        const stamp = at.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
        const submissionId = stamp + "-" + randomBytes(6).toString("hex");
        const submission = {
          fileName: submissionId + ".json",
          format: "KODJO_ADMIN_INBOX_SUBMISSION",
          formatVersion: "1.0.0",
          submissionId,
          receivedAt: at.toISOString(),
          sentAt: envelope.sentAt,
          device: { deviceId: device.deviceId, pairedName: device.name, declaredName: envelope.device.name },
          items: fresh.map((entry, index) => ({
            itemId: submissionId + "." + index,
            movement: entry.movement,
            fingerprint: entry.fingerprint,
            status: "PENDING",
            processedAt: null,
            result: null,
          })),
        };
        await writeSubmission(submission);
        return { stored: fresh.length, submissionId };
      });
    },

    async list() {
      const items = [];
      for (const submission of await loadAll()) {
        for (const item of submission.items) {
          items.push({ ...item, receivedAt: submission.receivedAt, sentAt: submission.sentAt, device: submission.device });
        }
      }
      return items;
    },

    async get(itemId) {
      const match = ITEM_ID.exec(typeof itemId === "string" ? itemId : "");
      if (!match) return null;
      const submission = (await loadAll()).find((entry) => entry.submissionId === match[1]);
      const item = submission?.items.find((entry) => entry.itemId === itemId);
      return item ? { ...item, receivedAt: submission.receivedAt, device: submission.device } : null;
    },

    /** Marque un élément traité. À appeler depuis la file d'écriture (`serialize`). */
    async mark(itemId, status, result) {
      const match = ITEM_ID.exec(itemId);
      if (!match || !INBOX_STATUSES.includes(status)) throw new Error("Élément ou statut inconnu");
      const submission = (await loadAll()).find((entry) => entry.submissionId === match[1]);
      const item = submission?.items.find((entry) => entry.itemId === itemId);
      if (!item) throw new Error("Élément inconnu");
      item.status = status;
      item.processedAt = new Date(now()).toISOString();
      item.result = result;
      await writeSubmission(submission);
      return item;
    },
  };
}
