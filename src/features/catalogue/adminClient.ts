/**
 * W2/A1 — Client de l'administration KODJO du PC, sur le Wi-Fi local (A-6 du 11/11/2026 : simple canal
 * de transport du même format de catalogue et des mêmes validations, sans second modèle).
 *
 * - Découverte : l'administration répond sans authentification à `GET /phone/v1/ping`. Le téléphone
 *   essaie d'abord la dernière adresse connue, puis les adresses de son réseau /24 (Figma 12116:25138
 *   « Recherche de votre PC sur le Wi-Fi »).
 * - Appairage : code à 6 chiffres affiché sur le PC (Figma 12116:25103) → jeton temporaire.
 * - Bibliothèques : liste, puis fichier catalogue complet, validé ensuite par `parseMovementCatalogueFile`
 *   exactement comme un fichier choisi sur le téléphone.
 * - Envoi de Mouvements (A2) : boîte d'arrivée de l'administration.
 *
 * Aucune exposition Internet : adresses privées du réseau local uniquement, en `http` (exception ATS
 * `NSAllowsLocalNetworking`).
 */
/** Port réservé au téléphone (`--lan`) ; l’administration elle-même reste sur 127.0.0.1:4738. */
export const ADMIN_PORT = 4739;
const PING_TIMEOUT_MS = 900;
const REQUEST_TIMEOUT_MS = 20000;
const SCAN_CONCURRENCY = 32;

export type AdminEndpoint = { readonly host: string; readonly port: number; readonly name: string };
export type AdminSession = AdminEndpoint & { readonly token: string; readonly expiresAt: string | null };

export type AvailableLibraryEntry = {
  readonly catalogueId: string;
  readonly libraryId: string;
  readonly title: string;
  readonly description: string | null;
  readonly revision: string;
  readonly memberCount: number;
};

export type AdminError =
  /** Aucune administration trouvée sur le Wi-Fi (Figma 12116:25238). */
  | "NOT_FOUND"
  /** Code refusé ou expiré (Figma 12116:25200). */
  | "CODE_REFUSED"
  /** Trop d'essais : appairage verrouillé un moment sur le PC. */
  | "LOCKED"
  /** Jeton expiré ou révoqué : nouvel appairage nécessaire. */
  | "UNAUTHORIZED"
  /** Réponse invalide ou erreur du PC. */
  | "SERVER"
  /** Connexion perdue ou délai dépassé. */
  | "NETWORK";

export class AdminClientError extends Error {
  readonly code: AdminError;

  constructor(code: AdminError, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export type FetchLike = (url: string, init?: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>;

export type AdminClientDependencies = {
  readonly fetch?: FetchLike;
  /** Adresse IPv4 du téléphone sur le Wi-Fi (`expo-network`), `null` si inconnue. */
  readonly localAddress?: () => Promise<string | null>;
};

const isPrivateIpv4 = (address: string) =>
  /^10\.\d+\.\d+\.\d+$/.test(address) ||
  /^192\.168\.\d+\.\d+$/.test(address) ||
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(address);

async function withTimeout<T>(ms: number, task: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await task(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function defaultLocalAddress(): Promise<string | null> {
  // Chargé à l'appel : module natif absent des anciennes builds.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Network = require("expo-network") as typeof import("expo-network");
  const address = await Network.getIpAddressAsync();
  return address && address !== "0.0.0.0" ? address : null;
}

export class AdminClient {
  private readonly fetchImpl: FetchLike;
  private readonly localAddress: () => Promise<string | null>;

  constructor(deps: AdminClientDependencies = {}) {
    this.fetchImpl = deps.fetch ?? (globalThis.fetch as unknown as FetchLike);
    this.localAddress = deps.localAddress ?? defaultLocalAddress;
  }

  /** Une administration répond-elle à cette adresse ? */
  async ping(host: string, port: number = ADMIN_PORT): Promise<AdminEndpoint | null> {
    try {
      return await withTimeout(PING_TIMEOUT_MS, async (signal) => {
        const response = await this.fetchImpl(`http://${host}:${port}/phone/v1/ping`, { signal });
        if (!response.ok) return null;
        const body = await response.json() as { ok?: unknown; name?: unknown };
        if (body.ok !== true) return null;
        return { host, port, name: typeof body.name === "string" && body.name.trim() ? body.name : host };
      });
    } catch {
      return null;
    }
  }

  /**
   * Recherche de l'administration : dernière adresse connue d'abord, puis le réseau /24 du téléphone.
   * Seules des adresses privées sont essayées.
   */
  async discover(knownHosts: readonly string[] = [], isCancelled: () => boolean = () => false): Promise<AdminEndpoint> {
    for (const host of knownHosts) {
      if (!isPrivateIpv4(host)) continue;
      const found = await this.ping(host);
      if (found) return found;
    }
    const own = await this.localAddress().catch(() => null);
    if (!own || !isPrivateIpv4(own)) throw new AdminClientError("NOT_FOUND");
    const prefix = own.split(".").slice(0, 3).join(".");
    const candidates: string[] = [];
    for (let i = 1; i <= 254; i += 1) {
      const host = `${prefix}.${i}`;
      if (host !== own && !knownHosts.includes(host)) candidates.push(host);
    }
    let found: AdminEndpoint | null = null;
    let next = 0;
    const worker = async () => {
      while (found === null && next < candidates.length && !isCancelled()) {
        const host = candidates[next]!;
        next += 1;
        const result = await this.ping(host);
        if (result && found === null) found = result;
      }
    };
    await Promise.all(Array.from({ length: SCAN_CONCURRENCY }, worker));
    if (found === null) throw new AdminClientError("NOT_FOUND");
    return found;
  }

  /** Appairage par le code à 6 chiffres affiché sur le PC. */
  async pair(endpoint: AdminEndpoint, code: string, deviceName: string): Promise<AdminSession> {
    const response = await this.request(endpoint, null, "POST", "/phone/v1/pair", { code, deviceName });
    if (response.status === 429 || response.status === 423) throw new AdminClientError("LOCKED");
    if (response.status === 401 || response.status === 403 || response.status === 400) throw new AdminClientError("CODE_REFUSED");
    if (!response.ok) throw new AdminClientError("SERVER", "HTTP " + response.status);
    const body = await response.json() as { token?: unknown; expiresAt?: unknown; name?: unknown };
    if (typeof body.token !== "string" || body.token.length < 16) throw new AdminClientError("SERVER", "jeton absent");
    return {
      ...endpoint,
      name: typeof body.name === "string" && body.name.trim() ? body.name : endpoint.name,
      token: body.token,
      expiresAt: typeof body.expiresAt === "string" ? body.expiresAt : null,
    };
  }

  /** Bibliothèques publiées par l'administration pour ce téléphone. */
  async libraries(session: AdminSession): Promise<readonly AvailableLibraryEntry[]> {
    const response = await this.authorized(session, "GET", "/phone/v1/libraries");
    const body = await response.json() as unknown;
    const list = Array.isArray(body) ? body : (body as { libraries?: unknown }).libraries;
    if (!Array.isArray(list)) throw new AdminClientError("SERVER", "liste invalide");
    return list.flatMap((entry): AvailableLibraryEntry[] => {
      const item = entry as Record<string, unknown>;
      if (typeof item.catalogueId !== "string" || typeof item.libraryId !== "string" || typeof item.title !== "string") return [];
      return [{
        catalogueId: item.catalogueId,
        libraryId: item.libraryId,
        title: item.title,
        description: typeof item.description === "string" ? item.description : null,
        revision: typeof item.revision === "string" ? item.revision : "",
        memberCount: typeof item.memberCount === "number" ? item.memberCount : 0,
      }];
    });
  }

  /** Fichier catalogue complet (même format que l'import par fichier), non validé ici. */
  async catalogue(session: AdminSession, catalogueId: string): Promise<unknown> {
    const response = await this.authorized(session, "GET", "/phone/v1/catalogues/" + encodeURIComponent(catalogueId));
    try {
      return JSON.parse(await response.text()) as unknown;
    } catch {
      throw new AdminClientError("SERVER", "fichier illisible");
    }
  }

  /** A2 — envoi de Mouvements vers la boîte d'arrivée de l'administration. */
  async sendMovements(session: AdminSession, payload: unknown): Promise<{ readonly received: number; readonly duplicates: number }> {
    const response = await this.authorized(session, "POST", "/phone/v1/inbox", payload);
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    const count = (value: unknown) => (typeof value === "number" ? value : 0);
    return { received: count(body.received ?? body.accepted), duplicates: count(body.duplicates) };
  }

  private async authorized(session: AdminSession, method: string, path: string, body?: unknown) {
    const response = await this.request(session, session.token, method, path, body);
    if (response.status === 401 || response.status === 403) throw new AdminClientError("UNAUTHORIZED");
    if (!response.ok) throw new AdminClientError("SERVER", "HTTP " + response.status);
    return response;
  }

  private async request(endpoint: AdminEndpoint, token: string | null, method: string, path: string, body?: unknown) {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = "Bearer " + token;
    try {
      return await withTimeout(REQUEST_TIMEOUT_MS, (signal) => this.fetchImpl(
        `http://${endpoint.host}:${endpoint.port}${path}`,
        { method, headers, signal, ...(body === undefined ? {} : { body: JSON.stringify(body) }) },
      ));
    } catch {
      throw new AdminClientError("NETWORK");
    }
  }
}
