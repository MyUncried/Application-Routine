import { readFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import { RNHostView, Section } from "@expo/ui/swift-ui";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, userEvent, within } from "@testing-library/react-native";
import { AccessibilityInfo, ActionSheetIOS, Alert, Platform, StatusBar, StyleSheet } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import type { DraftMediaItem } from "@/domain/media/ActivityMedia";
import type { ImportItem, PickedMedia } from "@/domain/media/ActivityMediaImportService";
import { ActivityMediaList } from "@/features/activities/ActivityMediaList";
import { openMediaMenu } from "@/features/activities/testing/mediaMenu";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-3 (P3-23, D-335) — rendu et actions de la liste ordonnée des médias.
 * L'import réel (copie, erreurs, réessai) est prouvé par
 * `ActivityMediaImportService.test.ts` et `LocalMediaStore.test.ts` ; la
 * persistance de l'ordre par les suites SQLite. Correction revue 1 : D-335
 * prévoit un MENU par média (Retirer / Monter / Descendre) — feuille
 * d'actions native iOS, alerte ailleurs, mêmes actions pour VoiceOver.
 */
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

/**
 * Story 4.5 : `Modal` RÉEL de React Native au lieu du simulacre du preset
 * (qui rend `null` dès `visible={false}` et n'émet jamais `onDismiss`). Sur
 * iOS, le `Modal` réel reste rendu après `visible={false}` jusqu'à l'événement
 * natif `dismiss` de `RCTModalHostView`, qu'il traduit en `onDismiss` : le
 * test émet cet événement sur la vue hôte, comme le ferait iOS.
 */
jest.mock("react-native/Libraries/Modal/Modal", () => jest.requireActual("react-native/Libraries/Modal/Modal"));

/**
 * Story 4.5 — lecteur `expo-video` simulé : `useVideoPlayer` crée un
 * lecteur dont l'état est piloté par le test (`emit`) ; `VideoView` est une
 * vue dont `enterFullscreen` / `exitFullscreen` sont espionnés. Aucun rendu
 * natif ni plein écran réel n'est prouvé ici (NFR-04).
 */
type FakePlayer = {
  uri: string;
  loop: boolean;
  status: "idle" | "loading" | "readyToPlay" | "error";
  play: jest.Mock;
  pause: jest.Mock;
  release: jest.Mock;
  addListener: (event: string, listener: (payload: { status: FakePlayer["status"] }) => void) => { remove(): void };
  emit(status: FakePlayer["status"]): void;
};
const mockVideo = {
  players: [] as FakePlayer[],
  enterFullscreen: jest.fn(async () => undefined),
  exitFullscreen: jest.fn(async () => undefined),
};
jest.mock("expo-video", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  class VideoView extends React.Component<Record<string, unknown>> {
    enterFullscreen() {
      return mockVideo.enterFullscreen();
    }
    exitFullscreen() {
      return mockVideo.exitFullscreen();
    }
    render() {
      return React.createElement(View, { ...this.props, testID: this.props.testID as string });
    }
  }
  return {
    VideoView,
    // Même contrat que le crochet SDK 57 : lecteur créé au premier rendu, `setup` appliqué, libéré au démontage.
    useVideoPlayer: (uri: string, setup?: (player: FakePlayer) => void) => {
      const [player] = React.useState(() => {
        const created = mockCreatePlayer(uri);
        setup?.(created);
        return created;
      });
      React.useEffect(
        () => () => {
          player.release();
        },
        [player],
      );
      return player;
    },
  };
});
type StatusListener = (event: { status: FakePlayer["status"] }) => void;
function mockCreatePlayer(uri: string): FakePlayer {
  const listeners = new Set<StatusListener>();
  const player: FakePlayer = {
    uri,
    loop: true,
    status: "loading",
    play: jest.fn(),
    pause: jest.fn(),
    release: jest.fn(),
    addListener: (_event, listener) => {
      listeners.add(listener);
      return { remove: () => listeners.delete(listener) };
    },
    emit(status) {
      player.status = status;
      listeners.forEach((listener) => listener({ status }));
    },
  };
  mockVideo.players.push(player);
  return player;
}

const photo = (id: string): DraftMediaItem => ({
  assetId: id,
  asset: { id, uri: `kodjo-media/${id}.jpg`, createdAt: "now", kind: "PHOTO" },
});
const video = (id: string): DraftMediaItem => ({
  assetId: id,
  asset: { id, uri: `kodjo-media/${id}.mov`, createdAt: "now", kind: "VIDEO", durationMs: 1000 },
});
const picked: PickedMedia = {
  uri: "file:///cache/c.jpg",
  kind: "PHOTO",
  mimeType: "image/jpeg",
  fileName: null,
  sizeBytes: 1,
  durationMs: null,
  width: 1,
  height: 1,
  nativeAssetId: null,
};

function renderList(overrides: Partial<React.ComponentProps<typeof ActivityMediaList>> = {}) {
  const props = {
    media: [photo("a"), video("b")],
    pending: [] as readonly ImportItem[],
    notice: null,
    canImport: true,
    resolveUri: (uri: string) => `file:///documents/${uri}`,
    onAdd: jest.fn(),
    onRemove: jest.fn(),
    onMove: jest.fn(),
    onRetry: jest.fn(),
    ...overrides,
  };
  render(<ActivityMediaList {...props} />);
  return props;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("ActivityMediaList — PRE-3", () => {
  it("INTERACTION/media-list — ajout depuis la photothèque, import visible, Réessayer local sans doublon ; menu par média Retirer/Monter/Descendre ; ordre rendu = ordre du brouillon", () => {
    const failed: ImportItem = { key: "k2", state: "FAILED", picked, error: "COPY_FAILED" };
    const importing: ImportItem = { key: "k1", state: "IMPORTING", picked };
    const props = renderList({ pending: [importing, failed] });

    expect(screen.getByTestId("media-item-1-image").props.source).toEqual([
      expect.objectContaining({ uri: "file:///documents/kodjo-media/a.jpg" }),
    ]);
    expect(screen.getByText("Vidéo")).toBeTruthy();
    expect(screen.getByText("Importation…")).toBeTruthy();
    expect(screen.getByTestId("media-pending-2-error").props.children).toBe("Import impossible.");
    expect(screen.queryByTestId("media-pending-1-retry")).toBeNull();
    fireEvent.press(screen.getByTestId("media-pending-2-retry"));
    expect(props.onRetry).toHaveBeenCalledWith(failed);

    fireEvent.press(screen.getByTestId("media-add"));
    expect(props.onAdd).toHaveBeenCalledTimes(1);

    // Aucune commande dessinée sur la galerie : le menu natif porte les actions.
    // Story 4.5 (Q31, D-335 amendée) : menu à l'appui long — menu contextuel natif sur iOS.
    expect(screen.queryByTestId("media-item-1-remove")).toBeNull();
    jest.replaceProperty(Platform, "OS", "ios");
    const menu = openMediaMenu(1);
    expect(menu).toMatchObject({ title: "Photo 1 sur 2", options: ["Retirer", "Descendre"] });
    menu.choose("Descendre");
    expect(props.onMove).toHaveBeenCalledWith(0, 1);

    // Ailleurs qu'iOS (voie décidée au rendu de la tuile) : `Alert` à l'appui long.
    jest.replaceProperty(Platform, "OS", "android");
    const androidProps = renderList();
    const alert = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      expect(buttons!.map((button) => button.text)).toEqual(["Retirer", "Monter", "Annuler"]);
      buttons![0]!.onPress!();
    });
    fireEvent(screen.getByTestId("media-item-2"), "longPress");
    expect(alert).toHaveBeenCalledTimes(1);
    expect(androidProps.onRemove).toHaveBeenCalledWith(1);

    // Refus d'accès définitif : message et accès aux réglages ; aucun ajout implicite.
    renderList({ notice: "PERMISSION_DENIED_FINAL" });
    expect(screen.getByText("Accès à la photothèque refusé.")).toBeTruthy();
    expect(screen.getByTestId("media-open-settings")).toBeTruthy();
  });

  it("ACCESSIBILITY/media-list — chaque média identifié par type et rang ; actions nommées pour CE média, bornes exclues ; erreur annoncée ; Réessayer sur le seul élément échoué", () => {
    const props = renderList({ pending: [{ key: "k", state: "FAILED", picked, error: "STORAGE_FULL" }] });
    const first = screen.getByTestId("media-item-1");
    expect(first.props.accessibilityLabel).toBe("Photo 1 sur 2");
    // Story 4.5 (AC7, Q31, H23) : l'indication annonce la consultation, puis l'appui long.
    expect(first.props.accessibilityHint).toBe("Agrandir le média. Menu du média par appui long ou par les actions");
    expect(screen.getByTestId("media-item-2").props.accessibilityHint).toBe("Lire la vidéo. Menu du média par appui long ou par les actions");
    expect(first.props.accessibilityActions).toEqual([
      { name: "remove", label: "Retirer Photo 1 sur 2" },
      { name: "moveDown", label: "Descendre Photo 1 sur 2" },
    ]);
    expect(screen.getByTestId("media-item-2").props.accessibilityActions).toEqual([
      { name: "remove", label: "Retirer Vidéo 2 sur 2" },
      { name: "moveUp", label: "Monter Vidéo 2 sur 2" },
    ]);
    fireEvent(screen.getByTestId("media-item-2"), "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    expect(props.onMove).toHaveBeenCalledWith(1, 0);
    fireEvent(first, "accessibilityAction", { nativeEvent: { actionName: "remove" } });
    expect(props.onRemove).toHaveBeenCalledWith(0);
    expect(screen.getByTestId("media-pending-1-error").props.accessibilityLiveRegion).toBe("polite");
    expect(screen.getByTestId("media-pending-1-retry").props.accessibilityLabel).toBe("Réessayer l’import de Photo 3 sur 3");
    expect(screen.getByTestId("media-add").props.accessibilityLabel).toBe("Ajouter des photos ou vidéos");
  });
});

/** Arbre d'une frame Figma relevée (`docs/preparation/PRE-4/figma/<frame>.json.gz`). */
type FigmaNode = { id: string; name: string; parent_id: string; properties: Record<string, unknown> };
function figmaNodes(frame: string): FigmaNode[] {
  const file = path.resolve(__dirname, "../../../../docs/preparation/PRE-4/figma", `${frame}.json.gz`);
  return (JSON.parse(gunzipSync(readFileSync(file)).toString("utf8")) as { nodes: FigmaNode[] }).nodes;
}

/**
 * PRE-4 story 4.4 — Médias dans l'Éditeur, sans perte. Non-régression du
 * comportement PRE-3 (P18, NFR-03) : les actions Retirer / Monter / Descendre
 * passent par `openMediaMenu` (testing/mediaMenu.ts), indépendant du geste,
 * repris tel quel par 4.5 (Q31). Rappel NFR-04 : aucun rendu n'est prouvé ici.
 */
describe("ActivityMediaList — PRE-4 story 4.4", () => {
  const three = [photo("a"), video("b"), photo("c")];

  it("PRE4-4.4/AC1 — relevé : galerie, tuiles sans contour, icône d'ajout `icon/photo-ajouter` dans les frames contre `icon/ajouter` (`action-add`) dans le code, jamais un « + » typographique ; pictogrammes de 4.5 présents dans les frames, absents du code", () => {
    for (const frame of ["8328-35698", "8328-35740"]) {
      const nodes = figmaNodes(frame);
      const gallery = nodes.find((node) => node.name === "Media / Gallery — Source exact")!;
      expect(gallery.properties).toMatchObject({ layoutMode: "HORIZONTAL", itemSpacing: 8, paddingLeft: 8, cornerRadius: 16 });
      const tiles = nodes.filter((node) => node.parent_id === gallery.id);
      expect(tiles.map((tile) => tile.name).at(-1)).toBe("Media / Preview — Ajouter");
      for (const tile of tiles) {
        expect(tile.properties.strokes).toEqual([]); // E-V17 : aucun contour dans les frames
      }
      // Tuile d'ajout et son icône sélectionnées par nom et par type de nœud, non par leur rang.
      const addTile = tiles.find((node) => node.name === "Media / Preview — Ajouter")!;
      const addIcon = nodes.find((node) => node.parent_id === addTile.id && (node as { type?: string }).type === "INSTANCE")!;
      expect(addIcon.name).toBe("Icône photo — ajouter");
      expect(addIcon.properties.main_component_id).toBe("7021:13149"); // icon/photo-ajouter (E-V18)
      expect(nodes.some((node) => node.properties.main_component_id === "5613:5346")).toBe(true); // plein écran (4.5)
    }
    const lecture = figmaNodes("8328-35740").find((node) => node.properties.main_component_id === "7872:14696");
    expect(lecture?.name).toBe("Média — Lecture"); // pictogramme de lecture relevé pour 4.5 (E-V20)

    const manifest = JSON.parse(readFileSync(path.resolve(__dirname, "../../../../assets/icons/manifest.json"), "utf8")) as {
      assets: { file: string; figmaNodeId: string; figmaName: string }[];
    };
    expect(manifest.assets.find((icon) => icon.file === "action-add")).toMatchObject({ figmaNodeId: "6959:15706", figmaName: "icon/ajouter" });
    expect(manifest.assets.find((icon) => icon.file === "icon-photo-ajouter")).toMatchObject({ figmaNodeId: "7021:13149" });

    renderList({ media: three });
    const add = screen.getByTestId("media-add");
    expect(within(add).UNSAFE_getByType(KodjoIcon).props.name).toBe("action-add");
    expect(within(add).queryByText(/\+/u)).toBeNull();
    // État actuel du code (E-V17, non corrigé) : contour 1 `colors.mediaBorder` sur la tuile d'ajout et les tuiles Média.
    for (const id of ["media-add", "media-item-1"]) {
      expect(StyleSheet.flatten(screen.getByTestId(id).props.style)).toMatchObject({ borderWidth: 1, borderColor: colors.mediaBorder });
    }
    // Pictogrammes de lecture et de plein écran : livrés par 4.5, aucun ici.
    expect(screen.queryByText("▶")).toBeNull();
  });

  it("PRE4-4.4/AC3 — galerie horizontale, ordre du Brouillon, tuile d'ajout en dernier ; tuile plus étroite que la galerie (aperçu du suivant tronqué)", () => {
    renderList({ media: three });
    const gallery = screen.getByTestId("media-gallery");
    expect(gallery.props.horizontal).toBe(true);
    expect(["media-item-1", "media-item-2", "media-item-3"].map((id) => screen.getByTestId(id).props.accessibilityLabel)).toEqual([
      "Photo 1 sur 3",
      "Vidéo 2 sur 3",
      "Photo 3 sur 3",
    ]);
    const tile = StyleSheet.flatten(screen.getByTestId("media-item-1").props.style);
    const content = StyleSheet.flatten(gallery.props.contentContainerStyle);
    // Galerie de 354 (largeur 402, marges 24) et de 343 (largeur 375, marges 16 sous 390, FR-02-04) :
    // marge + tuile + écart laisse visible le début du Média suivant.
    for (const galleryWidth of [402 - 2 * 24, 375 - 2 * 16]) {
      expect(content.padding + (tile.width as number) + content.gap).toBeLessThan(galleryWidth);
    }
  });

  it("PRE4-4.4/AC3 — non-régression du menu (indépendant du geste) : options selon la position, bornes exclues, Annuler sans effet", () => {
    const props = renderList({ media: three });
    expect(openMediaMenu(1)).toMatchObject({ title: "Photo 1 sur 3", options: ["Retirer", "Descendre"] });
    expect(openMediaMenu(2)).toMatchObject({ title: "Vidéo 2 sur 3", options: ["Retirer", "Monter", "Descendre"] });
    expect(openMediaMenu(3)).toMatchObject({ title: "Photo 3 sur 3", options: ["Retirer", "Monter"] });
    openMediaMenu(2).cancel();
    expect(props.onRemove).not.toHaveBeenCalled();
    expect(props.onMove).not.toHaveBeenCalled();

    // Option absente : erreur qui liste les options présentes ; espions restaurés après chaque ouverture.
    expect(() => openMediaMenu(1).choose("Monter")).toThrow("options : Retirer, Descendre");
    expect(jest.isMockFunction(ActionSheetIOS.showActionSheetWithOptions)).toBe(false);

    jest.replaceProperty(Platform, "OS", "android");
    expect(openMediaMenu(1).options).toEqual(["Retirer", "Descendre"]);
    expect(openMediaMenu(3).options).toEqual(["Retirer", "Monter"]);
    expect(() => openMediaMenu(3).choose("Descendre")).toThrow("options : Retirer, Monter");
    expect(jest.isMockFunction(Alert.alert)).toBe(false);
  });

  it("PRE4-4.4/AC3 — non-régression des effets : Retirer, Monter, Descendre par le menu et par les actions VoiceOver, sur le même Média, mêmes appels", () => {
    const props = renderList({ media: three });
    openMediaMenu(2).choose("Monter");
    expect(props.onMove).toHaveBeenLastCalledWith(1, 0);
    openMediaMenu(2).choose("Descendre");
    expect(props.onMove).toHaveBeenLastCalledWith(1, 2);
    openMediaMenu(2).choose("Retirer");
    expect(props.onRemove).toHaveBeenLastCalledWith(1);

    const middle = screen.getByTestId("media-item-2");
    expect(middle.props.accessibilityActions).toEqual([
      { name: "remove", label: "Retirer Vidéo 2 sur 3" },
      { name: "moveUp", label: "Monter Vidéo 2 sur 3" },
      { name: "moveDown", label: "Descendre Vidéo 2 sur 3" },
    ]);
    fireEvent(middle, "accessibilityAction", { nativeEvent: { actionName: "moveUp" } });
    expect(props.onMove).toHaveBeenLastCalledWith(1, 0);
    fireEvent(middle, "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    expect(props.onMove).toHaveBeenLastCalledWith(1, 2);
    fireEvent(middle, "accessibilityAction", { nativeEvent: { actionName: "remove" } });
    expect(props.onRemove).toHaveBeenLastCalledWith(1);
    expect(props.onMove).toHaveBeenCalledTimes(4);
    expect(props.onRemove).toHaveBeenCalledTimes(2);
  });

  it("PRE4-4.4/AC4 — la tuile reste la seule cible : aucun bouton ajouté sur la tuile, aucun lecteur ni plein écran ajouté (4.5)", () => {
    renderList({ media: three });
    for (const id of ["media-item-1", "media-item-2", "media-item-3"]) {
      const tile = screen.getByTestId(id);
      expect(tile.props.accessibilityRole).toBe("button");
      // `within` inclut la tuile elle-même : elle est le seul bouton de son sous-arbre.
      expect(within(tile).queryAllByRole("button")).toEqual([tile]);
    }
    expect(screen.queryByTestId(/fullscreen|player|play/u)).toBeNull();
  });
});

/**
 * PRE-4 story 4.5 (AC8, AC9, AD-17) — câblage du menu contextuel natif
 * (`ContextMenu` d'`@expo/ui`) autour de la tuile, iOS seulement. Sous Jest,
 * les vues SwiftUI sont les simulacres de jest-expo : seule la configuration
 * est prouvée (options selon la position, rappels). L'ouverture du menu, son
 * aperçu, la réception du toucher et le défilement de la galerie restent à
 * constater sur iPhone (R-4.5-00, NFR-04).
 */
describe("ActivityMediaList — PRE-4 story 4.5, câblage du menu contextuel natif (AC9)", () => {
  const three = [photo("a"), video("b"), photo("c")];

  function menuItems(rank: number) {
    const host = screen.getByTestId(`media-item-${rank}-context-menu`);
    return {
      host,
      title: within(host).UNSAFE_getByType(Section).props.title as string,
      buttons: within(host).queryAllByTestId(new RegExp(`^media-item-${rank}-context-menu-`, "u")),
    };
  }

  it("PRE4-4.5/AC9 — iOS : chaque tuile est le déclencheur d'un menu contextuel natif ; options selon la position, bornes exclues, Retirer destructif", () => {
    jest.replaceProperty(Platform, "OS", "ios");
    renderList({ media: three });
    const expected = [
      { title: "Photo 1 sur 3", labels: ["Retirer", "Descendre"] },
      { title: "Vidéo 2 sur 3", labels: ["Retirer", "Monter", "Descendre"] },
      { title: "Photo 3 sur 3", labels: ["Retirer", "Monter"] },
    ];
    expected.forEach(({ title, labels }, index) => {
      const rank = index + 1;
      const { host, title: menuTitle, buttons } = menuItems(rank);
      expect(menuTitle).toBe(title);
      expect(buttons.map((button) => button.props.label)).toEqual(labels);
      expect(buttons.map((button) => button.props.role)).toEqual(labels.map((label) => (label === "Retirer" ? "destructive" : "default")));
      // La tuile React Native existante est hébergée telle quelle dans le déclencheur.
      const trigger = within(host).UNSAFE_getByType(RNHostView);
      expect(within(trigger).getByTestId(`media-item-${rank}`).props.accessibilityLabel).toBe(title);
      expect(trigger.props.matchContents).toBe(true);
    });
    expect(screen.queryByTestId(/fullscreen|player|play/u)).toBeNull();
  });

  it("PRE4-4.5/AC9 — iOS : effets de départ des options du menu contextuel (déplacement d'un rang, retrait) ; le toucher simple n'ouvre plus la feuille d'actions", () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const props = renderList({ media: three });
    const press = (rank: number, key: string) => fireEvent(screen.getByTestId(`media-item-${rank}-context-menu-${key}`), "buttonPress");
    press(2, "moveUp");
    expect(props.onMove).toHaveBeenLastCalledWith(1, 0);
    press(2, "moveDown");
    expect(props.onMove).toHaveBeenLastCalledWith(1, 2);
    press(1, "moveDown");
    expect(props.onMove).toHaveBeenLastCalledWith(0, 1);
    press(3, "moveUp");
    expect(props.onMove).toHaveBeenLastCalledWith(2, 1);
    press(3, "remove");
    expect(props.onRemove).toHaveBeenLastCalledWith(2);
    expect(props.onMove).toHaveBeenCalledTimes(4);
    expect(props.onRemove).toHaveBeenCalledTimes(1);

    // Q31 : le toucher simple consulte le Média ; aucune feuille d'actions.
    const sheet = jest.spyOn(ActionSheetIOS, "showActionSheetWithOptions").mockImplementation(() => undefined);
    fireEvent.press(screen.getByTestId("media-item-1"));
    expect(sheet).not.toHaveBeenCalled();
    expect(screen.getByTestId("media-item-1-consultation")).toBeTruthy();
  });

  it("PRE4-4.5/AC9 — Android et web : aucun menu contextuel, tuile inchangée", () => {
    for (const os of ["android", "web"] as const) {
      jest.replaceProperty(Platform, "OS", os);
      renderList({ media: three });
      expect(screen.queryByTestId(/context-menu/u)).toBeNull();
      expect(screen.getByTestId("media-item-2").props.accessibilityLabel).toBe("Vidéo 2 sur 3");
    }
  });
});

/**
 * PRE-4 story 4.5, phase B (AC1 à AC8) — consultation au toucher, menu à
 * l'appui long (Q27, Q31, AD-17). Lecteur `expo-video` simulé ci-dessus ;
 * le plein écran natif, la lecture et le menu contextuel réels sont jugés
 * sur iPhone (R-4.5-00 à R-4.5-05, NFR-04).
 */
describe("ActivityMediaList — PRE-4 story 4.5, phase B", () => {
  const three = [photo("a"), video("b"), photo("c")];
  /** Sources des lecteurs créés depuis le début du test (aucun au montage, AC1). */
  const created = () => mockVideo.players.map((player) => player.uri);

  afterEach(() => {
    mockVideo.players.length = 0;
    mockVideo.enterFullscreen.mockClear();
    mockVideo.exitFullscreen.mockClear();
  });

  /** Laisse s'exécuter les promesses de `enterFullscreen` / `exitFullscreen`. */
  async function flush() {
    for (let turn = 0; turn < 3; turn += 1) {
      await act(async () => {
        await Promise.resolve();
      });
    }
  }

  /**
   * Retrait natif de la présentation : événement `dismiss` de la vue hôte
   * `RCTModalHostView`, que le `Modal` réel de React Native traduit en
   * `onDismiss` (iOS) — même chemin que sur l'appareil.
   */
  function nativeDismiss(testID: string) {
    fireEvent(screen.getByTestId(testID), "dismiss");
  }

  /** Simulacre jest-expo partagé entre les tests : espionné et remis à zéro. */
  function spyAccessibility() {
    const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => undefined);
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions").mockImplementation(() => undefined);
    focus.mockClear();
    announce.mockClear();
    return { focus, announce };
  }

  /** Vue `VideoView` simulée de la consultation de la tuile `rank`. */
  const videoSurface = (rank: number) => screen.getByTestId(`media-item-${rank}-consultation`, { includeHiddenElements: true });

  it("PRE4-4.5/AC1 — aucune lecture automatique : aucun lecteur créé au montage de la galerie, ni au défilement, ni à l'appui long", () => {
    jest.replaceProperty(Platform, "OS", "ios");
    renderList({ media: three });
    fireEvent.scroll(screen.getByTestId("media-gallery"), { nativeEvent: { contentOffset: { x: 200, y: 0 } } });
    fireEvent(screen.getByTestId("media-item-2"), "longPress");
    expect(created()).toEqual([]);
    expect(screen.queryByTestId("media-item-2-consultation")).toBeNull();
  });

  it("PRE4-4.5/AC2 — toucher la tuile d'une vidéo : lecteur natif créé à la demande, sans boucle ; plein écran natif à contrôles natifs puis lecture ; sortie : pause, fermeture et libération", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const props = renderList({ media: three });
    fireEvent.press(screen.getByTestId("media-item-2"));
    expect(created()).toEqual(["file:///documents/kodjo-media/b.mov"]);
    const [player] = mockVideo.players;
    expect(player!.loop).toBe(false);
    const view = screen.getByTestId("media-item-2-consultation", { includeHiddenElements: true });
    expect(view.props).toMatchObject({ nativeControls: true, fullscreenOptions: { enable: true }, pointerEvents: "none" });
    // Rien n'est lu avant que la source soit prête et le plein écran ouvert.
    expect(mockVideo.enterFullscreen).not.toHaveBeenCalled();
    expect(player!.play).not.toHaveBeenCalled();

    act(() => player!.emit("readyToPlay"));
    expect(mockVideo.enterFullscreen).toHaveBeenCalledTimes(1);
    await flush();
    expect(player!.play).toHaveBeenCalledTimes(1);

    act(() => (view.props.onFullscreenExit as () => void)());
    expect(player!.pause).toHaveBeenCalled();
    expect(player!.release).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("media-item-2-consultation", { includeHiddenElements: true })).toBeNull();
    expect(props.onRemove).not.toHaveBeenCalled();
    expect(props.onMove).not.toHaveBeenCalled();
  });

  it("PRE4-4.5/AC2 — démontage pendant la consultation : lecteur libéré, aucune lecture relancée", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    renderList({ media: three });
    fireEvent.press(screen.getByTestId("media-item-2"));
    const [player] = mockVideo.players;
    screen.unmount();
    expect(player!.release).toHaveBeenCalledTimes(1);
    // Une source prête après le démontage n'ouvre rien et ne lit rien.
    player!.emit("readyToPlay");
    await flush();
    expect(mockVideo.enterFullscreen).not.toHaveBeenCalled();
    expect(player!.play).not.toHaveBeenCalled();
  });

  it("PRE4-4.5/AC3 — toucher la tuile d'une photo : présentation modale native plein écran, image entière, fermeture libellée « Fermer » ; aucun lecteur", () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const props = renderList({ media: three });
    fireEvent.press(screen.getByTestId("media-item-3"));
    const modal = screen.getByTestId("media-item-3-consultation");
    expect(modal.props).toMatchObject({ visible: true, presentationStyle: "fullScreen" });
    const image = screen.getByTestId("media-item-3-consultation-image");
    expect(image.props.source).toEqual([expect.objectContaining({ uri: "file:///documents/kodjo-media/c.jpg" })]);
    expect(image.props.contentFit).toBe("contain");
    expect(image.props.accessibilityLabel).toBe("Photo 3 sur 3");
    const close = screen.getByTestId("media-item-3-consultation-close");
    expect(close.props.accessibilityLabel).toBe("Fermer");
    // Aucun geste, zoom ni navigation ajouté : la fermeture est la seule commande.
    expect(within(modal).queryAllByRole("button")).toEqual([close]);
    expect(created()).toEqual([]);

    // Fermeture : la présentation reste montée, masquée, jusqu'à son retrait natif (iOS).
    fireEvent.press(close);
    expect(screen.getByTestId("media-item-3-consultation").props.visible).toBe(false);
    nativeDismiss("media-item-3-consultation");
    expect(screen.queryByTestId("media-item-3-consultation")).toBeNull();
    expect(props.onRemove).not.toHaveBeenCalled();
    expect(props.onMove).not.toHaveBeenCalled();
  });

  it("PRE4-4.5/AC3 — recette du 2026-10-18 : le ✕ de la photo est posé sous la zone de sécurité (îlot, barre d'état), sur une pastille claire, et ferme", () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const insets = { top: 59, bottom: 34, left: 0, right: 0 };
    const props = {
      media: three,
      pending: [] as readonly ImportItem[],
      notice: null,
      canImport: true,
      resolveUri: (uri: string) => `file:///documents/${uri}`,
      onAdd: jest.fn(),
      onRemove: jest.fn(),
      onMove: jest.fn(),
      onRetry: jest.fn(),
    };
    render(
      <SafeAreaInsetsContext.Provider value={insets}>
        <ActivityMediaList {...props} />
      </SafeAreaInsetsContext.Provider>,
    );
    fireEvent.press(screen.getByTestId("media-item-3"));
    const frame = StyleSheet.flatten(screen.getByTestId("media-item-3-consultation-screen").props.style);
    expect(frame.paddingTop).toBeGreaterThan(insets.top);
    expect(frame.paddingBottom).toBe(insets.bottom);
    // Glyphe d'origine (#141414) non teinté, sur une pastille claire : visible sur le fond sombre.
    const close = screen.getByTestId("media-item-3-consultation-close");
    const icon = within(close).UNSAFE_getByType(KodjoIcon);
    expect(icon.props.tintColor).toBeUndefined();
    fireEvent.press(close);
    expect(screen.getByTestId("media-item-3-consultation").props.visible).toBe(false);
  });

  it("PRE4-4.5/AC3 — barre d'état claire pendant la présentation photo, rendue à la fermeture", () => {
    jest.replaceProperty(Platform, "OS", "ios");
    renderList({ media: three });
    fireEvent.press(screen.getByTestId("media-item-1"));
    expect(screen.UNSAFE_getByType(StatusBar).props.barStyle).toBe("light-content");
    fireEvent.press(screen.getByTestId("media-item-1-consultation-close"));
    expect(screen.UNSAFE_queryByType(StatusBar)).toBeNull();
  });

  it("PRE4-4.5/AC4 — fermeture du plein écran : galerie identique, aucun rappel du Brouillon, focus VoiceOver rendu à la tuile", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const props = renderList({ media: three });
    const { focus } = spyAccessibility();
    const labels = () => ["media-item-1", "media-item-2", "media-item-3"].map((id) => screen.getByTestId(id).props.accessibilityLabel);
    const before = labels();
    fireEvent.press(screen.getByTestId("media-item-2"));
    const [player] = mockVideo.players;
    act(() => player!.emit("readyToPlay"));
    await flush();
    act(() => (screen.getByTestId("media-item-2-consultation", { includeHiddenElements: true }).props.onFullscreenExit as () => void)());
    expect(labels()).toEqual(before);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenLastCalledWith(expect.objectContaining({ props: expect.objectContaining({ testID: "media-item-2" }) }), "focus");
    for (const callback of [props.onRemove, props.onMove, props.onAdd, props.onRetry]) {
      expect(callback).not.toHaveBeenCalled();
    }

    // Photo, iOS : le focus est rendu seulement une fois la présentation retirée (`onDismiss` natif).
    fireEvent.press(screen.getByTestId("media-item-1"));
    fireEvent.press(screen.getByTestId("media-item-1-consultation-close"));
    expect(focus).toHaveBeenCalledTimes(1);
    nativeDismiss("media-item-1-consultation");
    expect(focus).toHaveBeenCalledTimes(2);
    expect(focus).toHaveBeenLastCalledWith(expect.objectContaining({ props: expect.objectContaining({ testID: "media-item-1" }) }), "focus");
  });

  it("PRE4-4.5/AC4 — Android : focus rendu à la tuile dès la fermeture de la photo (aucun `onDismiss`)", () => {
    jest.replaceProperty(Platform, "OS", "android");
    renderList({ media: three });
    const { focus } = spyAccessibility();
    fireEvent.press(screen.getByTestId("media-item-3"));
    fireEvent.press(screen.getByTestId("media-item-3-consultation-close"));
    expect(screen.queryByTestId("media-item-3-consultation")).toBeNull();
    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenLastCalledWith(expect.objectContaining({ props: expect.objectContaining({ testID: "media-item-3" }) }), "focus");
  });

  // LIMITE : imports DIRECTS des deux fichiers seulement (texte source), pas leurs dépendances transitives.
  it("PRE4-4.5/AC5 — aucun module du moteur d'Exécution importé directement par la galerie ni par la consultation", () => {
    for (const file of ["ActivityMediaList.tsx", "MediaConsultation.tsx"]) {
      const source = readFileSync(path.resolve(__dirname, "..", file), "utf8");
      const imports = [...source.matchAll(/from\s+"([^"]+)"|require\("([^"]+)"\)/gu)].map((match) => match[1] ?? match[2]);
      expect(imports.length).toBeGreaterThan(0);
      for (const specifier of imports) {
        expect(specifier).not.toMatch(/execution\/|features\/execution|ExecutionEngine|runner/iu);
      }
    }
  });

  it("PRE4-4.5/AC6 — vidéo illisible ou fichier absent : erreur locale du lexique dans la tuile, sans plantage ; lecteur libéré ; lien conservé ; un nouveau toucher réessaie", () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const { announce } = spyAccessibility();
    const props = renderList({ media: three });
    fireEvent.press(screen.getByTestId("media-item-2"));
    const [player] = mockVideo.players;
    act(() => player!.emit("error"));
    expect(mockVideo.enterFullscreen).not.toHaveBeenCalled();
    expect(player!.play).not.toHaveBeenCalled();
    expect(player!.release).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("media-item-2-consultation", { includeHiddenElements: true })).toBeNull();
    expect(screen.getByTestId("media-item-2-unavailable")).toBeTruthy();
    expect(screen.getByText("Média indisponible.")).toBeTruthy();
    expect(screen.getByTestId("media-item-2").props.accessibilityValue).toEqual({ text: "Média indisponible." });
    expect(announce).toHaveBeenCalledWith("Média indisponible.", { queue: true });
    // Le badge « Vidéo » reste visible au-dessus du voile d'erreur.
    const tileChildren = screen.getByTestId("media-item-2").children as { props?: { testID?: string; children?: unknown } }[];
    const veil = tileChildren.findIndex((child) => child.props?.testID === "media-item-2-unavailable");
    const badge = tileChildren.findIndex((child) => child.props?.children === "Vidéo");
    expect(veil).toBeGreaterThanOrEqual(0);
    expect(badge).toBeGreaterThan(veil);
    expect(props.onRemove).not.toHaveBeenCalled();
    // Les autres Médias restent utilisables ; la tuile en erreur garde son menu et réessaie au toucher.
    expect(openMediaMenu(2).options).toEqual(["Retirer", "Monter", "Descendre"]);
    fireEvent.press(screen.getByTestId("media-item-2"));
    expect(created()).toHaveLength(2);
    expect(screen.queryByTestId("media-item-2-unavailable")).toBeNull();
  });

  it("PRE4-4.5/AC6 — plein écran refusé ou délai de préparation dépassé : erreur locale, sans exception", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    renderList({ media: three });
    mockVideo.enterFullscreen.mockImplementationOnce(async () => {
      throw new Error("refusé");
    });
    fireEvent.press(screen.getByTestId("media-item-2"));
    act(() => mockVideo.players[0]!.emit("readyToPlay"));
    await flush();
    expect(screen.getByTestId("media-item-2-unavailable")).toBeTruthy();
    expect(mockVideo.players[0]!.play).not.toHaveBeenCalled();

    jest.useFakeTimers();
    try {
      fireEvent.press(screen.getByTestId("media-item-2"));
      expect(screen.queryByTestId("media-item-2-unavailable")).toBeNull();
      act(() => {
        jest.advanceTimersByTime(10_000);
      });
      expect(screen.getByTestId("media-item-2-unavailable")).toBeTruthy();
      expect(mockVideo.players[1]!.release).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it("PRE4-4.5/AC6 — photo illisible ou introuvable : erreur locale dans la tuile, présentation fermée ; annonce après son retrait", () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const props = renderList({ media: three });
    const { announce } = spyAccessibility();
    fireEvent.press(screen.getByTestId("media-item-1"));
    fireEvent(screen.getByTestId("media-item-1-consultation-image"), "error", { nativeEvent: { error: "introuvable" } });
    expect(screen.getByTestId("media-item-1-consultation").props.visible).toBe(false);
    expect(screen.getByTestId("media-item-1-unavailable")).toBeTruthy();
    expect(announce).not.toHaveBeenCalled();
    nativeDismiss("media-item-1-consultation");
    expect(screen.queryByTestId("media-item-1-consultation")).toBeNull();
    expect(announce).toHaveBeenCalledWith("Média indisponible.", { queue: true });
    expect(props.onRemove).not.toHaveBeenCalled();
  });

  it("PRE4-4.5/AC6 — erreur APRÈS l'entrée en plein écran : sortie du plein écran (une fois) puis seulement l'erreur locale et son annonce", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    renderList({ media: three });
    const { announce } = spyAccessibility();
    let exitDone: () => void = () => undefined;
    mockVideo.exitFullscreen.mockImplementationOnce(() => new Promise<undefined>((resolve) => (exitDone = () => resolve(undefined))));
    fireEvent.press(screen.getByTestId("media-item-2"));
    const [player] = mockVideo.players;
    act(() => player!.emit("readyToPlay"));
    await flush();
    expect(player!.play).toHaveBeenCalledTimes(1);
    act(() => player!.emit("error"));
    expect(mockVideo.exitFullscreen).toHaveBeenCalledTimes(1);
    // Tant que la sortie n'est pas terminée : ni erreur affichée, ni annonce.
    expect(screen.queryByTestId("media-item-2-unavailable")).toBeNull();
    // La sortie native émet `onFullscreenExit` : ignoré pendant une sortie pour erreur.
    act(() => (videoSurface(2).props.onFullscreenExit as () => void)());
    exitDone();
    await flush();
    expect(mockVideo.exitFullscreen).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("media-item-2-unavailable")).toBeTruthy();
    expect(announce).toHaveBeenCalledWith("Média indisponible.", { queue: true });
    expect(player!.release).toHaveBeenCalledTimes(1);
  });

  it("PRE4-4.5/AC6 — `enterFullscreen` qui ne se résout jamais : garde de 10 s, sortie tentée, erreur locale, aucune lecture", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    renderList({ media: three });
    mockVideo.enterFullscreen.mockImplementationOnce(() => new Promise<undefined>(() => undefined));
    jest.useFakeTimers();
    try {
      fireEvent.press(screen.getByTestId("media-item-2"));
      const [player] = mockVideo.players;
      act(() => player!.emit("readyToPlay"));
      expect(mockVideo.enterFullscreen).toHaveBeenCalledTimes(1);
      act(() => {
        jest.advanceTimersByTime(10_000);
      });
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(mockVideo.exitFullscreen).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("media-item-2-unavailable")).toBeTruthy();
      expect(player!.play).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it("PRE4-4.5/AC2 — démontage pendant l'entrée en plein écran : à sa résolution, sortie au lieu de lecture ; `onFullscreenExit` tardif ignoré", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    renderList({ media: three });
    let entered: () => void = () => undefined;
    mockVideo.enterFullscreen.mockImplementationOnce(() => new Promise<undefined>((resolve) => (entered = () => resolve(undefined))));
    fireEvent.press(screen.getByTestId("media-item-2"));
    const [player] = mockVideo.players;
    act(() => player!.emit("readyToPlay"));
    const onFullscreenExit = videoSurface(2).props.onFullscreenExit as () => void;
    screen.unmount();
    entered();
    await flush();
    expect(player!.play).not.toHaveBeenCalled();
    expect(mockVideo.exitFullscreen).toHaveBeenCalledTimes(1);
    onFullscreenExit();
    expect(player!.pause).not.toHaveBeenCalled();
    expect(player!.release).toHaveBeenCalledTimes(1);
  });

  it("PRE4-4.5/AC7 — VoiceOver : activation = consultation ; indications « Lire la vidéo » / « Agrandir le média » puis l'appui long ; actions Retirer / Monter / Descendre conservées", () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const props = renderList({ media: three });
    const middle = screen.getByTestId("media-item-2");
    expect(middle.props.accessibilityRole).toBe("button");
    expect(middle.props.accessibilityHint).toBe("Lire la vidéo. Menu du média par appui long ou par les actions");
    expect(screen.getByTestId("media-item-1").props.accessibilityHint).toBe("Agrandir le média. Menu du média par appui long ou par les actions");
    expect(middle.props.accessibilityActions).toEqual([
      { name: "remove", label: "Retirer Vidéo 2 sur 3" },
      { name: "moveUp", label: "Monter Vidéo 2 sur 3" },
      { name: "moveDown", label: "Descendre Vidéo 2 sur 3" },
    ]);
    fireEvent(middle, "accessibilityAction", { nativeEvent: { actionName: "moveDown" } });
    expect(props.onMove).toHaveBeenLastCalledWith(1, 2);
    // Cible : la tuile entière (260 × 213), au-delà de 44 × 44.
    const tile = StyleSheet.flatten(middle.props.style);
    expect(tile.width).toBeGreaterThanOrEqual(44);
    expect(tile.height).toBeGreaterThanOrEqual(44);
    // La surface du plein écran vidéo est masquée à l'accessibilité.
    fireEvent.press(middle);
    const surface = screen.getByTestId("media-item-2-consultation", { includeHiddenElements: true });
    expect(surface.props).toMatchObject({ accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" });
  });

  it("PRE4-4.5/AC8 — iOS : appui long → menu contextuel natif, options selon la position, aucune consultation ; toucher simple → aucun menu", () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const sheet = jest.spyOn(ActionSheetIOS, "showActionSheetWithOptions").mockImplementation(() => undefined);
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    renderList({ media: three });
    for (const rank of [1, 2, 3]) {
      fireEvent(screen.getByTestId(`media-item-${rank}`), "longPress");
      expect(screen.queryByTestId(`media-item-${rank}-consultation`, { includeHiddenElements: true })).toBeNull();
    }
    expect(created()).toEqual([]);
    expect(screen.getByTestId("media-item-2-context-menu")).toBeTruthy();
    fireEvent.press(screen.getByTestId("media-item-3"));
    fireEvent.press(screen.getByTestId("media-item-3-consultation-close"));
    expect(sheet).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
  });

  it("PRE4-4.5/AC8 — iOS, vraie séquence Pressability (`userEvent.longPress`) : voie `contextMenu` → aucune consultation, aucun lecteur, aucune feuille ; voie `actionSheet` → la feuille s'ouvre", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const sheet = jest.spyOn(ActionSheetIOS, "showActionSheetWithOptions").mockImplementation(() => undefined);
    const user = userEvent.setup();
    renderList({ media: three });
    await user.longPress(screen.getByTestId("media-item-2"));
    expect(screen.queryByTestId("media-item-2-consultation", { includeHiddenElements: true })).toBeNull();
    expect(created()).toEqual([]);
    expect(sheet).not.toHaveBeenCalled();

    screen.unmount();
    renderList({ media: three, iosLongPressMenu: "actionSheet" });
    await user.longPress(screen.getByTestId("media-item-2"));
    expect(sheet).toHaveBeenCalledTimes(1);
    expect(sheet.mock.calls[0]![0]).toMatchObject({ title: "Vidéo 2 sur 3", options: ["Retirer", "Monter", "Descendre", "Annuler"] });
    expect(screen.queryByTestId("media-item-2-consultation", { includeHiddenElements: true })).toBeNull();
    expect(created()).toEqual([]);
  });

  it("PRE4-4.5/AC8 — repli d'AD-17 (`actionSheet`) : appui long → feuille d'actions native existante, mêmes titres, options et effets ; toucher → consultation", () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const props = renderList({ media: three, iosLongPressMenu: "actionSheet" });
    expect(screen.queryByTestId(/context-menu/u)).toBeNull();
    expect(openMediaMenu(1)).toMatchObject({ title: "Photo 1 sur 3", options: ["Retirer", "Descendre"] });
    expect(openMediaMenu(2)).toMatchObject({ title: "Vidéo 2 sur 3", options: ["Retirer", "Monter", "Descendre"] });
    openMediaMenu(3).choose("Monter");
    expect(props.onMove).toHaveBeenLastCalledWith(2, 1);
    const sheet = jest.spyOn(ActionSheetIOS, "showActionSheetWithOptions").mockImplementation(() => undefined);
    fireEvent.press(screen.getByTestId("media-item-2"));
    expect(sheet).not.toHaveBeenCalled();
    expect(created()).toHaveLength(1);
  });

  it("PRE4-4.5/AC8 — Android : toucher → consultation ; appui long → `Alert` existante", () => {
    jest.replaceProperty(Platform, "OS", "android");
    const props = renderList({ media: three });
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    fireEvent.press(screen.getByTestId("media-item-1"));
    expect(alert).not.toHaveBeenCalled();
    expect(screen.getByTestId("media-item-1-consultation")).toBeTruthy();
    fireEvent.press(screen.getByTestId("media-item-1-consultation-close"));
    alert.mockRestore();
    openMediaMenu(2).choose("Retirer");
    expect(props.onRemove).toHaveBeenLastCalledWith(1);
  });
});

describe("Recette A/B B.10 (remarque 4) — gabarit photo de la fiche Mouvement", () => {
  it("compteur « rang / total » à la place du badge « Vidéo »", () => {
    renderList({ template: { width: 402, height: 329 } });
    expect(screen.getByTestId("media-item-1-counter").props.children).toBe("1 / 2");
    expect(screen.getByTestId("media-item-2-counter").props.children).toBe("2 / 2");
    expect(screen.queryByText("Vidéo")).toBeNull();
  });

  it("bouton de lecture (Figma 7872:14696) : vidéo seulement, Ø 72 centré, voile 22 %, contour 35 %, triangle décalé de 2, sans zone étendue", () => {
    renderList({ template: { width: 402, height: 329 } });
    // Média 1 : photo, sans bouton. Média 2 : vidéo.
    expect(screen.queryByTestId("media-item-1-play")).toBeNull();
    const play = screen.getByTestId("media-item-2-play");
    expect(StyleSheet.flatten(play.props.style)).toMatchObject({
      position: "absolute",
      width: 72,
      height: 72,
      borderRadius: 36,
      left: (402 - 72) / 2,
      top: (329 - 72) / 2,
    });
    expect(play.props.hitSlop).toBeUndefined();
    expect(play.props.accessibilityLabel).toBe("Lire la vidéo");
    expect(StyleSheet.flatten(screen.getByTestId("media-item-2-play-veil").props.style)).toMatchObject({
      backgroundColor: "rgba(255, 255, 255, 0.22)",
      borderColor: "rgba(255, 255, 255, 0.35)",
      borderWidth: 1,
    });
    expect(StyleSheet.flatten(screen.getByTestId("media-item-2-play-glyph").props.style)).toMatchObject({ width: 26, height: 30, marginLeft: 2 });
    // Verre natif (simulacre jest-expo de `expo-glass-effect`) : style clair, sous le voile.
    expect(screen.getByTestId("media-item-2-play-glass").props).toMatchObject({ glassEffectStyle: "clear", colorScheme: "light" });
    // L'appui ouvre le lecteur système plein écran existant.
    fireEvent.press(play);
    expect(screen.getByTestId("media-item-2-consultation", { includeHiddenElements: true })).toBeTruthy();
  });

  it("galerie de l'éditeur d'Exercice : badge « Vidéo » inchangé, ni compteur ni icône", () => {
    renderList();
    expect(screen.getByText("Vidéo")).toBeTruthy();
    expect(screen.queryByTestId("media-item-1-counter")).toBeNull();
  });
});
