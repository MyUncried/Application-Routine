import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Alert, type AlertButton } from "react-native";

import type { MigrationNotice, MigrationNoticeRepository } from "@/domain/migration/MigrationNotice";
import { MigrationNoticeGate, formatMigrationNoticeMessage } from "@/features/migration/MigrationNoticeGate";
import { MigrationNoticeRepositoryContext } from "@/features/sessions/MigrationNoticeRepositoryContext";
import { strings } from "@/shared/i18n";

/**
 * PRE-4 (story 1.2) — `MigrationNoticeGate` avec un repository de test en
 * mémoire, qui reproduit le contrat du repository SQLite (lecture de l'avis
 * non acquitté, acquittement idempotent). Le repository réel est vérifié sur
 * `node:sqlite` dans `migration010.test.ts` (PRE4-1.2/AC2). Une suite verte
 * ne vaut pas recette : le rendu de l'`Alert` native est NON VÉRIFIABLE ici
 * (R-1.2-01, NFR-04).
 */

class InMemoryMigrationNoticeRepository implements MigrationNoticeRepository {
  readonly acknowledgeCalls: number[] = [];
  findCalls = 0;

  constructor(private notice: MigrationNotice | null) {}

  async findUnacknowledged(): Promise<MigrationNotice | null> {
    this.findCalls += 1;
    return this.notice && this.notice.acknowledgedAt === null ? this.notice : null;
  }

  async acknowledge(id: number): Promise<void> {
    this.acknowledgeCalls.push(id);
    if (this.notice && this.notice.id === id && this.notice.acknowledgedAt === null) {
      this.notice = { ...this.notice, acknowledgedAt: "2026-10-17T08:00:00.000Z" };
    }
  }
}

function notice(count: number): MigrationNotice {
  return { id: 7, kind: "UNREADABLE_EXERCISES_DROPPED", count, createdAt: "2026-10-16T12:00:00.000Z", acknowledgedAt: null };
}

function launch(repository: MigrationNoticeRepository | null) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MigrationNoticeRepositoryContext.Provider value={repository}>{children}</MigrationNoticeRepositoryContext.Provider>
  );
  return render(<MigrationNoticeGate />, { wrapper });
}

type AlertCall = {
  readonly title: string;
  readonly message: string | undefined;
  readonly buttons: readonly AlertButton[];
  readonly options: unknown;
};

let alertCalls: AlertCall[];

beforeEach(() => {
  alertCalls = [];
  jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons, options) => {
    alertCalls.push({ title, message, buttons: buttons ?? [], options });
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

/** Laisse la promesse de lecture se régler. */
async function settle(repository: InMemoryMigrationNoticeRepository): Promise<void> {
  await waitFor(() => expect(repository.findCalls).toBeGreaterThan(0));
  await Promise.resolve();
}

describe("PRE4-1.2/AC1 — message unique au premier lancement après la migration", () => {
  it("count = 2 : une Alert native, une seule fois, texte du lexique, un seul bouton, sans contenu d'Exercice", async () => {
    const repository = new InMemoryMigrationNoticeRepository(notice(2));
    const view = launch(repository);

    await waitFor(() => expect(alertCalls).toHaveLength(1));
    const call = alertCalls[0]!;
    expect(call.title).toBe("2 exercices illisibles n’ont pas pu être repris.");
    expect(call.message).toBeUndefined();
    expect(call.buttons).toHaveLength(1);
    expect(call.buttons[0]?.text).toBe(strings.migrationNotice.dismissAction);
    expect(call.options).toEqual({ cancelable: false });

    // Aucun second affichage au rendu suivant du même lancement.
    view.rerender(<MigrationNoticeGate />);
    await Promise.resolve();
    expect(alertCalls).toHaveLength(1);
    expect(repository.findCalls).toBe(1);
    // Le composant ne rend rien à l'écran.
    expect(view.toJSON()).toBeNull();
  });

  it("l'Alert ne porte que le nombre : aucun identifiant, genre ni date de l'avis", async () => {
    const distinctive: MigrationNotice = {
      id: 98765,
      kind: "UNREADABLE_EXERCISES_DROPPED",
      count: 2,
      createdAt: "2031-04-23T13:57:41.000Z",
      acknowledgedAt: null,
    };
    launch(new InMemoryMigrationNoticeRepository(distinctive));
    await waitFor(() => expect(alertCalls).toHaveLength(1));

    const call = alertCalls[0]!;
    const shown = JSON.stringify([call.title, call.message, call.buttons.map((button) => button.text)]);
    for (const forbidden of ["98765", "2031", "13:57", "UNREADABLE", "DROPPED"]) {
      expect(shown).not.toContain(forbidden);
    }
    expect(call.title).toBe("2 exercices illisibles n’ont pas pu être repris.");
    expect(call.message).toBeUndefined();
    expect(call.buttons.map((button) => button.text)).toEqual([strings.migrationNotice.dismissAction]);
  });
});

describe("PRE4-1.2/AC2 — acquittement à l'appui, aucune réapparition", () => {
  it("l'appui sur le bouton acquitte ; au lancement suivant, aucun avis", async () => {
    const repository = new InMemoryMigrationNoticeRepository(notice(2));
    const first = launch(repository);
    await waitFor(() => expect(alertCalls).toHaveLength(1));
    expect(repository.acknowledgeCalls).toEqual([]);

    alertCalls[0]!.buttons[0]!.onPress?.();
    await waitFor(() => expect(repository.acknowledgeCalls).toEqual([7]));
    first.unmount();

    const second = launch(repository);
    await settle(repository);
    await waitFor(() => expect(repository.findCalls).toBe(2));
    expect(alertCalls).toHaveLength(1);
    second.unmount();
  });

  it("application quittée avant l'appui : rien n'est acquitté et l'avis s'affiche de nouveau au lancement suivant", async () => {
    const repository = new InMemoryMigrationNoticeRepository(notice(2));
    const first = launch(repository);
    await waitFor(() => expect(alertCalls).toHaveLength(1));
    first.unmount();
    expect(repository.acknowledgeCalls).toEqual([]);

    launch(repository);
    await waitFor(() => expect(alertCalls).toHaveLength(2));
    expect(alertCalls[1]!.title).toBe("2 exercices illisibles n’ont pas pu être repris.");
    expect(repository.acknowledgeCalls).toEqual([]);
  });

  it("un échec d'acquittement est journalisé sans lever ; l'avis reste non acquitté", async () => {
    const repository = new InMemoryMigrationNoticeRepository(notice(2));
    jest.spyOn(repository, "acknowledge").mockRejectedValue(new Error("disk"));
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    launch(repository);
    await waitFor(() => expect(alertCalls).toHaveLength(1));

    alertCalls[0]!.buttons[0]!.onPress?.();

    await waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
    expect(await repository.findUnacknowledged()).not.toBeNull();
  });
});

describe("PRE4-1.2/AC3 — aucun avis sans Exercice écarté", () => {
  it("table vide : aucune Alert", async () => {
    const repository = new InMemoryMigrationNoticeRepository(null);
    launch(repository);
    await settle(repository);
    expect(alertCalls).toEqual([]);
  });

  it("repository pas encore disponible : aucune lecture ni Alert, puis lecture dès qu'il l'est", async () => {
    const repository = new InMemoryMigrationNoticeRepository(notice(3));
    const view = launch(null);
    await Promise.resolve();
    expect(alertCalls).toEqual([]);

    view.rerender(
      <MigrationNoticeRepositoryContext.Provider value={repository}>
        <MigrationNoticeGate />
      </MigrationNoticeRepositoryContext.Provider>,
    );
    await waitFor(() => expect(alertCalls).toHaveLength(1));
    expect(alertCalls[0]!.title).toBe("3 exercices illisibles n’ont pas pu être repris.");
  });

  it("un échec de lecture est journalisé sans Alert ni exception", async () => {
    const repository = new InMemoryMigrationNoticeRepository(notice(2));
    jest.spyOn(repository, "findUnacknowledged").mockRejectedValue(new Error("disk"));
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    launch(repository);
    await waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
    expect(alertCalls).toEqual([]);
  });
});

describe("PRE4-1.2/AC4 — nombre singulier", () => {
  it("count = 1 : texte singulier du lexique", async () => {
    const repository = new InMemoryMigrationNoticeRepository(notice(1));
    launch(repository);
    await waitFor(() => expect(alertCalls).toHaveLength(1));
    expect(alertCalls[0]!.title).toBe("1 exercice illisible n’a pas pu être repris.");
    expect(alertCalls[0]!.title).toBe(strings.migrationNotice.unreadableExercisesDroppedSingular);
  });

  it("pluriel par la clé du lexique pour tout nombre ≥ 2", () => {
    expect(formatMigrationNoticeMessage({ count: 12 })).toBe(
      strings.migrationNotice.unreadableExercisesDroppedPlural.replace("{n}", "12"),
    );
    expect(formatMigrationNoticeMessage({ count: 12 })).toBe("12 exercices illisibles n’ont pas pu être repris.");
  });
});

describe("PRE4-1.2/AC1 — au plus un Alert par montage", () => {
  function withRepository(repository: MigrationNoticeRepository | null) {
    return (
      <MigrationNoticeRepositoryContext.Provider value={repository}>
        <MigrationNoticeGate />
      </MigrationNoticeRepositoryContext.Provider>
    );
  }

  it("un changement de référence du repository après la lecture ne relance ni lecture ni Alert", async () => {
    const first = new InMemoryMigrationNoticeRepository(notice(2));
    const second = new InMemoryMigrationNoticeRepository(notice(2));
    const view = render(withRepository(first));
    await waitFor(() => expect(alertCalls).toHaveLength(1));

    view.rerender(withRepository(second));
    await Promise.resolve();
    await Promise.resolve();

    expect(first.findCalls).toBe(1);
    expect(second.findCalls).toBe(0);
    expect(alertCalls).toHaveLength(1);
  });

  it("démontage avant la résolution de la lecture : aucun Alert", async () => {
    let resolveRead!: (value: MigrationNotice | null) => void;
    const repository = new InMemoryMigrationNoticeRepository(notice(2));
    jest.spyOn(repository, "findUnacknowledged").mockImplementation(
      () =>
        new Promise<MigrationNotice | null>((resolve) => {
          resolveRead = resolve;
        }),
    );
    const view = render(withRepository(repository));
    await waitFor(() => expect(repository.findUnacknowledged).toHaveBeenCalledTimes(1));

    view.unmount();
    resolveRead(notice(2));
    await Promise.resolve();
    await Promise.resolve();

    expect(alertCalls).toEqual([]);
    expect(repository.acknowledgeCalls).toEqual([]);
  });

  it("repository remplacé AVANT la résolution de la première lecture : une seconde lecture a lieu, un seul Alert", async () => {
    let resolveFirst!: (value: MigrationNotice | null) => void;
    const first = new InMemoryMigrationNoticeRepository(notice(2));
    jest.spyOn(first, "findUnacknowledged").mockImplementation(
      () =>
        new Promise<MigrationNotice | null>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const second = new InMemoryMigrationNoticeRepository(notice(2));
    const view = render(withRepository(first));
    await waitFor(() => expect(first.findUnacknowledged).toHaveBeenCalledTimes(1));

    view.rerender(withRepository(second));
    await waitFor(() => expect(second.findCalls).toBe(1));
    await waitFor(() => expect(alertCalls).toHaveLength(1));

    // La première lecture se règle après coup : son effet est nettoyé, aucun second Alert.
    resolveFirst(notice(2));
    await Promise.resolve();
    await Promise.resolve();
    expect(alertCalls).toHaveLength(1);
    expect(first.findUnacknowledged).toHaveBeenCalledTimes(1);
  });

  it("un genre d'avis inconnu est ignoré : aucun Alert, aucun acquittement", async () => {
    const unknown = { ...notice(2), kind: "SOMETHING_ELSE" } as unknown as MigrationNotice;
    const repository = new InMemoryMigrationNoticeRepository(unknown);
    launch(repository);
    await settle(repository);
    await Promise.resolve();

    expect(alertCalls).toEqual([]);
    expect(repository.acknowledgeCalls).toEqual([]);
  });
});

const ROOT = join(__dirname, "..", "..", "..", "..");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return entry === "__tests__" || entry === "testing" ? [] : sourceFiles(path);
    }
    return /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [path] : [];
  });
}

function relativePath(path: string): string {
  return relative(ROOT, path).split(sep).join("/");
}

describe("PRE4-1.2/AC5 — lecteur unique, montage sûr", () => {
  const files = [...sourceFiles(join(ROOT, "src")), ...sourceFiles(join(ROOT, "app"))];

  it("seul MigrationNoticeGate lit l'avis dans l'interface ; seul son repository interroge la table (FROM migration_notices)", () => {
    const readers = files
      .filter((path) => /findUnacknowledged|MigrationNoticeRepositoryContext\)/.test(readFileSync(path, "utf8")))
      .map(relativePath)
      .sort();
    expect(readers).toEqual([
      "src/domain/migration/MigrationNotice.ts",
      "src/features/migration/MigrationNoticeGate.tsx",
      "src/infrastructure/database/repositories/SqliteMigrationNoticeRepository.ts",
    ]);
    const tableUsers = files
      .filter((path) => readFileSync(path, "utf8").includes("FROM migration_notices"))
      .map(relativePath);
    expect(tableUsers).toEqual(["src/infrastructure/database/repositories/SqliteMigrationNoticeRepository.ts"]);
  });

  it("monté une seule fois, dans app/_layout.tsx, à l'intérieur de SessionServiceProvider et hors de SQLiteProvider", () => {
    const mounts = files.filter((path) => readFileSync(path, "utf8").includes("<MigrationNoticeGate")).map(relativePath);
    expect(mounts).toEqual(["app/_layout.tsx"]);

    const layout = readFileSync(join(ROOT, "app", "_layout.tsx"), "utf8");
    expect(layout.match(/<MigrationNoticeGate \/>/g)).toHaveLength(1);
    const gateIndex = layout.indexOf("<MigrationNoticeGate");
    expect(gateIndex).toBeGreaterThan(layout.indexOf("<SessionServiceProvider"));
    expect(gateIndex).toBeLessThan(layout.indexOf("</SessionServiceProvider>"));
    expect(layout).not.toContain("<SQLiteProvider");

    // `SQLiteProvider` n'enveloppe toujours que l'initialiseur interne.
    const provider = readFileSync(join(ROOT, "src", "features", "sessions", "SessionServiceProvider.tsx"), "utf8");
    const sqliteBlock = provider.slice(provider.indexOf("<SQLiteProvider"), provider.indexOf("</SQLiteProvider>"));
    expect(sqliteBlock).toContain("<SessionServiceInitializer");
    expect(sqliteBlock).not.toContain("children");
    expect(sqliteBlock).not.toContain("MigrationNoticeGate");
  });

  it("les textes passent par des clés du lexique (RM-092)", () => {
    const gate = readFileSync(join(ROOT, "src", "features", "migration", "MigrationNoticeGate.tsx"), "utf8");
    expect(gate).not.toMatch(/"[^"]*illisible[^"]*"/);
    expect(gate).toContain("strings.migrationNotice");
  });
});
