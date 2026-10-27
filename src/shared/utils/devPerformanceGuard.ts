/**
 * PRE-8, recette A/B (27/10/2026) — garde de DÉVELOPPEMENT uniquement.
 *
 * Constat sur iPhone (Routine BMAD, React Native 0.86, React 19.2) : au chargement, la mesure de
 * diagnostic que React pose pour chaque composant re-rendu (`logComponentRender` →
 * `performance.measure`, détail = propriétés modifiées) lève `std::bad_alloc` dans le code natif ;
 * l'exception interrompt le rendu (« Should not already be working ») et l'application reste sur
 * l'écran de démarrage. Cause non démontrée.
 *
 * Cette garde intercepte l'échec de CETTE mesure (outil de diagnostic, sans effet sur
 * l'application) pour que le rendu se poursuive, et journalise une fois par nom la mesure en échec,
 * afin d'identifier le composant en cause. Aucun effet hors `__DEV__` : la version distribuée n'en
 * contient pas l'activation.
 */
export function installDevPerformanceGuard(): void {
  if (!__DEV__ || typeof performance === "undefined" || typeof performance.measure !== "function") return;
  const original = performance.measure.bind(performance);
  const reported = new Set<string>();
  const guarded = ((name: string, ...rest: unknown[]) => {
    try {
      return (original as (...args: unknown[]) => unknown)(name, ...rest);
    } catch (error) {
      if (!reported.has(name)) {
        reported.add(name);
        const options = rest[0] as { detail?: { devtools?: { properties?: unknown[] } } } | undefined;
        const properties = options?.detail?.devtools?.properties;
        console.warn(
          `[diagnostic PRE-8] performance.measure en échec pour « ${name.replace("​", "")} »`,
          String(error),
          Array.isArray(properties) ? `propriétés modifiées : ${properties.length}` : "",
        );
      }
      return undefined;
    }
  }) as typeof performance.measure;
  try {
    performance.measure = guarded;
  } catch {
    // API non remplaçable : rien à faire.
  }
}
