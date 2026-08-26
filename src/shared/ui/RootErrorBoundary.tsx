import { Component, type ReactNode } from "react";

export type RootErrorBoundaryProps = {
  children: ReactNode;
  /** Rendu à la place de `children` dès qu'une erreur a été capturée. */
  fallback: ReactNode;
  /** Appelé une fois avec l'erreur réelle, pour diagnostic (jamais affichée à l'utilisateur). */
  onError?: (error: Error) => void;
};

type RootErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Limite d'erreur **fatale racine**, pas seulement « d'initialisation » :
 * montée au-dessus de `SessionServiceProvider` et du `Stack` applicatif,
 * elle capture par construction toute erreur de rendu fatale survenant
 * n'importe où en dessous d'elle — aujourd'hui une panne d'ouverture ou de
 * migration SQLite, plus tard potentiellement une erreur de rendu d'un
 * écran descendant.
 *
 * Limites explicites, propres à tout `ErrorBoundary` React :
 * - ne capture pas les erreurs asynchrones (promesses rejetées hors du
 *   cycle de rendu) ;
 * - ne capture pas les erreurs de gestionnaires d'événement.
 *
 * Ne transforme jamais une erreur capturée en résultat métier de
 * `SessionService` (`ValidationResult`, `UpdateSessionResult`) — les deux
 * mécanismes restent strictement séparés.
 */
export class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RootErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    // L'erreur réelle est journalisée pour le diagnostic technique ; aucun
    // détail technique n'est jamais exposé à l'utilisateur (voir
    // RootErrorFallback, qui n'affiche qu'un message générique).
    console.error("Erreur fatale non rattrapée pendant le rendu.", error);
    this.props.onError?.(error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
