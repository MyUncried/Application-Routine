import type { Database } from "@/infrastructure/database/Database";

export type FailOnWriteState = {
  /** Vrai tant que l'échec n'a pas été injecté. */
  armed: boolean;
  /** Écritures exécutées avant l'échec injecté (preuve que l'échec survient au milieu d'une transaction). */
  writesBeforeFailure: number;
};

/**
 * Tests seulement (« injection d'échec », motif `FailingDatabase`) — enveloppe
 * une base et CHAQUE poignée de transaction qu'elle remet à son appelant, et
 * fait échouer une seule fois la première écriture dont le SQL correspond à
 * `pattern`. Les écritures précédentes de la même transaction ont réellement
 * eu lieu : leur annulation prouve l'atomicité.
 */
export function failOnWrite(inner: Database, pattern: RegExp): { readonly database: Database; readonly state: FailOnWriteState } {
  const state: FailOnWriteState = { armed: true, writesBeforeFailure: 0 };
  const wrap = (handle: Database): Database => ({
    execAsync: (source) => handle.execAsync(source),
    runAsync: async (source, parameters) => {
      if (state.armed && pattern.test(source)) {
        state.armed = false;
        throw new Error("Injected failure");
      }
      if (state.armed) {
        state.writesBeforeFailure += 1;
      }
      return handle.runAsync(source, parameters);
    },
    getFirstAsync: (source, parameters) => handle.getFirstAsync(source, parameters),
    getAllAsync: (source, parameters) => handle.getAllAsync(source, parameters),
    withExclusiveTransactionAsync: (task) => handle.withExclusiveTransactionAsync(async (transaction) => task(wrap(transaction))),
  });
  return { database: wrap(inner), state };
}
