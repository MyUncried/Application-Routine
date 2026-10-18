import { Section } from "@expo/ui/swift-ui";
import { jest } from "@jest/globals";
import { act, fireEvent, screen, within } from "@testing-library/react-native";
import { ActionSheetIOS, Alert, Platform } from "react-native";

/**
 * PRE-4 story 4.4 (AC3, P18, NFR-03) : ouverture du menu Retirer / Monter /
 * Descendre d'une tuile de la galerie de l'Éditeur, ÉCRITE INDÉPENDAMMENT DU
 * GESTE. Les tests de non-régression des trois actions passent tous par ce
 * seul point, sans connaître ni le geste ni le menu natif.
 *
 * Story 4.5 (Q31, D-335 amendée, AD-17) : le geste est devenu l'appui long
 * (`performMenuGesture`) et l'interception lit le menu contextuel natif
 * d'`@expo/ui` sur iOS, ou la feuille d'actions du repli, ou l'`Alert`
 * ailleurs (`interceptMenu`) ; les attendus des tests (titre, options,
 * effets) n'ont pas changé.
 */
export type OpenedMediaMenu = {
  /** Titre du menu (libellé du Média, ex. « Photo 1 sur 3 »). */
  readonly title: string;
  /** Options proposées, dans l'ordre, sans `Annuler`. */
  readonly options: readonly string[];
  /** Choisit une option par son libellé ; un libellé absent lève une erreur qui liste les options. */
  choose(label: string): void;
  /** Ferme le menu par `Annuler`, sans effet. */
  cancel(): void;
};

/** Menu natif intercepté, sous une forme commune aux deux plateformes. */
type InterceptedMenu = {
  readonly title: string;
  /** Options hors `Annuler`, dans l'ordre, avec leur action. */
  readonly actions: readonly { readonly label: string; readonly run: () => void }[];
  readonly cancel: () => void;
};

/**
 * Geste d'ouverture du menu depuis la story 4.5 (Q31, D-335 amendée) : appui
 * long sur la tuile. Le toucher simple consulte le Média et n'ouvre plus le
 * menu (avant 4.5 : toucher, D-335).
 */
function performMenuGesture(rank: number): void {
  fireEvent(screen.getByTestId(`media-item-${rank}`), "longPress");
}

/**
 * Story 4.5 : tuile rendue avec le menu contextuel natif (iOS, voie
 * `"contextMenu"`, AD-17 ; décidé au rendu de la tuile, d'où le choix par
 * la présence du `Host` et non par `Platform.OS` relu ici).
 *
 * LIMITE ASSUMÉE : sous Jest, le geste natif n'est PAS simulable. L'appui
 * long y est reçu par le menu contextuel SwiftUI, que les simulacres
 * jest-expo ne présentent pas ; ce helper ne peut donc ni prouver que le
 * menu s'ouvre, ni détecter qu'il ne s'ouvrirait pas. Il vérifie seulement :
 * (1) que l'appui long côté React Native n'ouvre aucune autre surface
 * (ni consultation, ni feuille d'actions, ni `Alert`) ; (2) la
 * CONFIGURATION du menu, lue dans `ContextMenu.Items` (`Section` titrée du
 * libellé, un `Button` SwiftUI par option, choisi par son événement natif
 * `buttonPress`). Le menu natif n'a pas d'`Annuler` (Q51 c) : l'appui
 * extérieur le ferme sans effet, ce que `cancel` reproduit. L'ouverture
 * réelle est constatée sur iPhone (R-4.5-00, R-4.5-05).
 */
function readContextMenu(rank: number, open: () => void): InterceptedMenu | null {
  const host = screen.queryByTestId(`media-item-${rank}-context-menu`);
  if (!host) {
    return null;
  }
  const sheet = jest.spyOn(ActionSheetIOS, "showActionSheetWithOptions").mockImplementation(() => undefined);
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  try {
    open();
    const other =
      sheet.mock.calls.length > 0
        ? "la feuille d'actions"
        : alert.mock.calls.length > 0
          ? "une alerte"
          : screen.queryByTestId(`media-item-${rank}-consultation`, { includeHiddenElements: true })
            ? "une consultation"
            : null;
    if (other) {
      throw new Error(`openMediaMenu : l'appui long du Média ${rank} a ouvert ${other}`);
    }
  } finally {
    sheet.mockRestore();
    alert.mockRestore();
  }
  const section = within(host).UNSAFE_getByType(Section);
  const buttons = within(host).queryAllByTestId(new RegExp(`^media-item-${rank}-context-menu-`, "u"));
  return {
    title: String(section.props.title ?? ""),
    actions: buttons.map((button) => ({ label: String(button.props.label ?? ""), run: () => fireEvent(button, "buttonPress") })),
    cancel: () => undefined,
  };
}

/**
 * Intercepte le menu natif ouvert par `open` : menu contextuel natif sur iOS
 * (story 4.5, `readContextMenu`), sinon feuille d'actions sur iOS (repli
 * d'AD-17) et `Alert` ailleurs. Les espions sont toujours restaurés
 * (`finally`), même si le geste lève. Lève si aucun menu ne s'ouvre ou si la
 * feuille ou l'alerte n'a pas d'option `Annuler`.
 */
function interceptMenu(rank: number, open: () => void): InterceptedMenu {
  const contextMenu = readContextMenu(rank, open);
  if (contextMenu) {
    return contextMenu;
  }
  let menu: InterceptedMenu | null = null;
  if (Platform.OS === "ios") {
    const sheet = jest.spyOn(ActionSheetIOS, "showActionSheetWithOptions").mockImplementation((options, callback) => {
      const cancelIndex = options.cancelButtonIndex;
      if (cancelIndex === undefined || cancelIndex === null || options.options[cancelIndex] === undefined) {
        throw new Error(`openMediaMenu : menu du Média ${rank} sans option Annuler`);
      }
      menu = {
        title: options.title ?? "",
        actions: options.options.flatMap((label, index) => (index === cancelIndex ? [] : [{ label, run: () => callback(index) }])),
        cancel: () => callback(cancelIndex),
      };
    });
    try {
      open();
    } finally {
      sheet.mockRestore();
    }
  } else {
    const alert = jest.spyOn(Alert, "alert").mockImplementation((title, _message, buttons) => {
      const all = buttons ?? [];
      const cancel = all.find((button) => button.style === "cancel");
      if (!cancel) {
        throw new Error(`openMediaMenu : menu du Média ${rank} sans option Annuler`);
      }
      menu = {
        title,
        actions: all
          .filter((button) => button !== cancel)
          .map((button) => ({ label: button.text ?? "", run: () => button.onPress?.() })),
        cancel: () => cancel.onPress?.(),
      };
    });
    try {
      open();
    } finally {
      alert.mockRestore();
    }
  }
  if (!menu) {
    throw new Error(`openMediaMenu : aucun menu ouvert pour le Média ${rank}`);
  }
  return menu;
}

/** Ouvre le menu du Média de rang `rank` (1 = premier) et le rend inspectable. */
export function openMediaMenu(rank: number): OpenedMediaMenu {
  const menu = interceptMenu(rank, () => performMenuGesture(rank));
  const options = menu.actions.map((action) => action.label);
  return {
    title: menu.title,
    options,
    choose(label) {
      const action = menu.actions.find((candidate) => candidate.label === label);
      if (!action) {
        throw new Error(`openMediaMenu : option « ${label} » absente (options : ${options.join(", ")})`);
      }
      act(() => action.run());
    },
    cancel() {
      act(() => menu.cancel());
    },
  };
}
