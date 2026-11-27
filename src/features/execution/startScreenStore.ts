/**
 * D-577 (27/11/2026), point 7 — persistance minimale autorisée de l'écran « Avant la séance » :
 * - le réglage « Afficher l'écran de démarrage de séance » (activé par défaut) ;
 * - par séance, l'empreinte de la composition vue quand « Ne plus afficher cet écran » a été cochée.
 *
 * Choix technique (classe D) : un fichier JSON du dossier privé de l'application (même patron que `pairingStore`), plutôt
 * qu'une migration SQLite — une version de base supplémentaire risquerait la collision avec les branches parallèles (versions
 * 40 et 41 déjà prises deux fois). Lecture synchrone, une fois par lancement, puis cache en mémoire ; tout échec de lecture
 * donne les valeurs par défaut (écran affiché, aucune séance masquée). Aucune autre donnée n'y figure (ni la douleur).
 */
const FILE_NAME = "kodjo-start-screen.json";

export type StartScreenState = {
  readonly showStartScreen: boolean;
  /** Séance → empreinte de la composition masquée par « Ne plus afficher cet écran ». */
  readonly dismissed: Readonly<Record<string, string>>;
};

export type StartScreenBackend = {
  read(): string | null;
  write(content: string): void;
};

const DEFAULT_STATE: StartScreenState = { showStartScreen: true, dismissed: {} };

type FileSystem = typeof import("expo-file-system");

function fileBackend(): StartScreenBackend {
  const file = () => {
    // Chargé à l'appel : module natif absent des tests.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { File, Paths } = require("expo-file-system") as FileSystem;
    return new File(Paths.document, FILE_NAME);
  };
  return {
    read: () => {
      const target = file();
      return target.exists ? target.textSync() : null;
    },
    write: (content) => file().write(content),
  };
}

function parse(raw: string | null): StartScreenState {
  if (raw === null) return DEFAULT_STATE;
  try {
    const value = JSON.parse(raw) as Partial<StartScreenState>;
    const dismissed: Record<string, string> = {};
    if (value.dismissed !== null && typeof value.dismissed === "object")
      for (const [sessionId, fingerprint] of Object.entries(value.dismissed)) if (typeof fingerprint === "string") dismissed[sessionId] = fingerprint;
    return { showStartScreen: value.showStartScreen !== false, dismissed };
  } catch {
    return DEFAULT_STATE;
  }
}

let backend: StartScreenBackend = fileBackend();
let cache: StartScreenState | null = null;

function load(): StartScreenState {
  if (cache !== null) return cache;
  try {
    cache = parse(backend.read());
  } catch {
    cache = DEFAULT_STATE;
  }
  return cache;
}

function save(next: StartScreenState): void {
  cache = next;
  try {
    backend.write(JSON.stringify(next));
  } catch {
    // Sans fichier, le choix vaut jusqu'à la fermeture de l'application.
  }
}

export const startScreenStore = {
  state(): StartScreenState {
    return load();
  },
  setShowStartScreen(value: boolean): void {
    save({ ...load(), showStartScreen: value });
  },
  /** « Ne plus afficher cet écran » : masque l'écran de cette séance tant que sa composition garde cette empreinte. */
  dismiss(sessionId: string, fingerprint: string): void {
    save({ ...load(), dismissed: { ...load().dismissed, [sessionId]: fingerprint } });
  },
  /** Case décochée au départ : l'exclusion de cette séance est retirée. */
  undismiss(sessionId: string): void {
    const dismissed = { ...load().dismissed };
    if (!(sessionId in dismissed)) return;
    delete dismissed[sessionId];
    save({ ...load(), dismissed });
  },
  dismissedFingerprint(sessionId: string): string | null {
    return load().dismissed[sessionId] ?? null;
  },
};

/** Tests : stockage injecté (mémoire) et cache vidé. Sans argument : retour au fichier. */
export function setStartScreenBackendForTests(next?: StartScreenBackend): void {
  backend = next ?? fileBackend();
  cache = null;
}
