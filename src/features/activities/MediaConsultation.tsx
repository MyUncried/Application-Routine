import { Image } from "expo-image";
import type { VideoView as ExpoVideoView } from "expo-video";
import { useContext, useEffect, useRef, useState } from "react";
import { Modal, Platform, Pressable, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, minTouchTarget, spacing } from "@/shared/ui/tokens";

/**
 * PRE-4 story 4.5 (FR-21-05, Q27, Q31, AD-17) — consultation d'un Média de la
 * galerie de l'Éditeur, au toucher de sa tuile. Aucun lien avec le moteur
 * d'Exécution (FR-21-04, AC5) : rien n'est importé de `features/execution`
 * ni d'un autre module d'Exécution.
 *
 * - Vidéo : lecteur natif `expo-video` 57 (API relue dans la documentation
 *   versionnée SDK 57), créé À LA DEMANDE par `useVideoPlayer` quand ce
 *   composant est monté au toucher de la tuile (jamais au montage de la
 *   galerie), sans boucle ; le crochet libère le lecteur au démontage
 *   (documentation SDK 57). `VideoView` à contrôles natifs, superposé à la
 *   tuile, entre en plein écran natif (`enterFullscreen`) dès que la source
 *   est prête, puis `play()`. La sortie du plein écran (`onFullscreenExit`)
 *   met en pause et ferme. `VideoPoster.ts` est inchangé. Aucune commande ni
 *   plein écran réimplémenté.
 * - Photo : présentation modale native (`Modal` en `presentationStyle`
 *   « fullScreen ») avec l'image entière par `expo-image` (`contain`) et une
 *   action de fermeture du lexique ; ni zoom, ni geste, ni navigation entre
 *   Médias (Q27).
 * - Erreur (FR-21-58, AC6) : source en erreur, délai de préparation dépassé,
 *   plein écran refusé, module indisponible ou image illisible → `onError`,
 *   sans exception non capturée ; l'appelant affiche l'erreur locale dans la
 *   tuile et garde le lien du Média.
 */

type ExpoVideoModule = typeof import("expo-video");

/**
 * Module `expo-video` chargé à la première consultation, comme dans
 * `VideoPoster.ts` (même module natif). Ce chargement paresseux ne rend pas
 * l'Éditeur indépendant des modules natifs (`@expo/ui` y est importé
 * statiquement) : il garde seulement la galerie sans aucun objet de lecture
 * avant le toucher, et un module indisponible devient une erreur locale au
 * lieu d'une exception. Le cast est typé par le module réel : `tsc` vérifie
 * les props de `VideoView` et les méthodes du lecteur employées ici.
 */
function loadExpoVideo(): ExpoVideoModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("expo-video") as typeof import("expo-video");
}

/**
 * Délai de garde (même borne que l'affiche) : préparation de la source,
 * entrée et sortie du plein écran. Au-delà, erreur locale.
 */
export const CONSULTATION_READY_TIMEOUT_MS = 10_000;

/** Attend la fin de `promise` (succès ou échec), au plus `ms`. */
function settleWithin(promise: Promise<unknown>, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    promise.then(
      () => {
        clearTimeout(timer);
        resolve();
      },
      () => {
        clearTimeout(timer);
        resolve();
      },
    );
  });
}

/** Sortie du plein écran sans exception, même sur une vue démontée. */
function exitQuietly(view: ExpoVideoView | null): Promise<void> {
  if (!view) return Promise.resolve();
  try {
    return settleWithin(view.exitFullscreen(), CONSULTATION_READY_TIMEOUT_MS);
  } catch {
    return Promise.resolve();
  }
}

/**
 * Étapes de la consultation vidéo : `waiting` (source en préparation),
 * `entering` (`enterFullscreen` en cours), `playing` (plein écran ouvert,
 * lecture lancée), `closed` (plein écran fermé par l'utilisateur), `failed`
 * (erreur, `onError` signalé une seule fois).
 */
type VideoPhase = "waiting" | "entering" | "playing" | "closed" | "failed";

export function VideoConsultation({
  uri,
  onClose,
  onError,
  testID,
}: {
  uri: string;
  onClose: () => void;
  onError: () => void;
  testID: string;
}) {
  const [video] = useState<ExpoVideoModule | null>(() => {
    try {
      return loadExpoVideo();
    } catch {
      return null;
    }
  });
  if (!video) {
    return <UnavailableVideo onError={onError} />;
  }
  return <VideoPlayerConsultation video={video} uri={uri} onClose={onClose} onError={onError} testID={testID} />;
}

/** Module `expo-video` indisponible sur la plateforme : erreur locale, sans exception. */
function UnavailableVideo({ onError }: { onError: () => void }) {
  useEffect(() => {
    onError();
    // Signalé une seule fois, au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function VideoPlayerConsultation({
  video,
  uri,
  onClose,
  onError,
  testID,
}: {
  video: ExpoVideoModule;
  uri: string;
  onClose: () => void;
  onError: () => void;
  testID: string;
}) {
  // Lecteur créé au montage de la CONSULTATION (toucher de la tuile), libéré par le crochet à son démontage.
  const player = video.useVideoPlayer(uri, (created) => {
    created.loop = false;
  });
  const viewRef = useRef<ExpoVideoView | null>(null);
  const callbacks = useRef({ onClose, onError });
  useEffect(() => {
    callbacks.current = { onClose, onError };
  });
  const mounted = useRef(true);
  const phase = useRef<VideoPhase>("waiting");

  // Plein écran natif puis lecture, dès que la source est prête ; erreur locale sinon.
  useEffect(() => {
    mounted.current = true;
    phase.current = "waiting";
    let enterSettled = false;
    let openedView: ExpoVideoView | null = null;
    let readyTimer: ReturnType<typeof setTimeout> | undefined;
    let enterTimer: ReturnType<typeof setTimeout> | undefined;
    const reportError = () => {
      if (mounted.current) callbacks.current.onError();
    };
    // Erreur : on sort d'abord du plein écran s'il est ouvert, PUIS on signale.
    const fail = () => {
      if (!mounted.current || phase.current === "failed" || phase.current === "closed") return;
      const previous = phase.current;
      phase.current = "failed";
      clearTimeout(readyTimer);
      if (previous === "entering") return; // la résolution (ou la garde) de l'entrée termine.
      if (previous === "playing") {
        void exitQuietly(viewRef.current).then(reportError);
        return;
      }
      reportError();
    };
    const start = () => {
      if (phase.current !== "waiting") return;
      clearTimeout(readyTimer);
      const view = viewRef.current;
      if (!view) {
        fail();
        return;
      }
      phase.current = "entering";
      // Garde : un `enterFullscreen` qui ne se résout jamais finit en erreur locale.
      enterTimer = setTimeout(() => {
        if (enterSettled) return;
        enterSettled = true;
        phase.current = "failed";
        void exitQuietly(view).then(reportError);
      }, CONSULTATION_READY_TIMEOUT_MS);
      view.enterFullscreen().then(
        () => {
          if (enterSettled) return;
          enterSettled = true;
          clearTimeout(enterTimer);
          // Démontage ou erreur pendant l'entrée : on ressort au lieu de lire.
          if (!mounted.current) {
            void exitQuietly(view);
            return;
          }
          if (phase.current === "failed") {
            void exitQuietly(view).then(reportError);
            return;
          }
          phase.current = "playing";
          openedView = view;
          player.play();
        },
        () => {
          if (enterSettled) return;
          enterSettled = true;
          clearTimeout(enterTimer);
          phase.current = "failed";
          reportError();
        },
      );
    };
    const subscription = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay") start();
      else if (status === "error") fail();
    });
    readyTimer = setTimeout(() => {
      if (phase.current === "waiting") fail();
    }, CONSULTATION_READY_TIMEOUT_MS);
    if (player.status === "readyToPlay") start();
    else if (player.status === "error") fail();
    return () => {
      mounted.current = false;
      clearTimeout(readyTimer);
      // `enterTimer` est conservé : si l'entrée est en cours, sa résolution (ou sa garde) ressort du plein écran.
      subscription.remove();
      // Démontage plein écran ouvert (Éditeur quitté) : on en ressort ; le crochet libère le lecteur.
      if (phase.current === "playing") void exitQuietly(openedView);
    };
  }, [player]);

  const { VideoView } = video;
  return (
    <VideoView
      ref={viewRef}
      player={player}
      nativeControls
      fullscreenOptions={{ enable: true }}
      allowsPictureInPicture={false}
      contentFit="cover"
      onFullscreenExit={() => {
        // Après démontage (lecteur libéré) ou pendant une sortie pour erreur : rien à faire.
        if (!mounted.current || phase.current === "failed") return;
        phase.current = "closed";
        player.pause();
        callbacks.current.onClose();
      }}
      // Surface d'ancrage du plein écran natif, superposée à la tuile : ni toucher ni focus propres.
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
      testID={testID}
    />
  );
}

/**
 * Présentation photo. L'appelant la garde MONTÉE avec `visible={false}`
 * jusqu'à `onDismissed` sur iOS : démonter le `Modal` pendant son animation
 * de fermeture couperait la présentation sans `onDismiss`. Pendant la
 * présentation, barre d'état claire sur le fond sombre (`StatusBar`).
 */
export function PhotoConsultation({
  uri,
  label,
  visible,
  onClose,
  onDismissed,
  onError,
  testID,
}: {
  uri: string;
  label: string;
  visible: boolean;
  onClose: () => void;
  /** Présentation entièrement retirée (iOS : `onDismiss` du `Modal`). */
  onDismissed: () => void;
  onError: () => void;
  testID: string;
}) {
  // Contexte lu sans exiger de fournisseur (rendu isolé en test) : marges nulles à défaut.
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0, left: 0, right: 0 };
  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={onClose}
      onDismiss={Platform.OS === "ios" ? onDismissed : undefined}
      testID={testID}
    >
      {visible ? <StatusBar barStyle="light-content" animated /> : null}
      {/* Recette iPhone du 2026-10-18 : dans un `Modal`, `SafeAreaView` n'appliquait pas les marges de
          sécurité ; le ✕ tombait sous la barre d'état et l'îlot, hors d'atteinte. Marges explicites
          lues dans le contexte de l'application (`SafeAreaInsetsContext`). */}
      <View
        style={[
          styles.photoScreen,
          { paddingTop: insets.top + spacing[8], paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right },
        ]}
        testID={`${testID}-screen`}
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={strings.executionParameters.media.closeConsultation}
          style={styles.photoClose}
          testID={`${testID}-close`}
        >
          {/* Recette iPhone du 2026-10-18 : le ✕ teinté en blanc restait invisible
              (l'export `icon-fermer.svg` est tracé en #141414 et la recoloration
              d'un SVG par `tintColor` n'est pas garantie, KodjoIcon). Pastille
              claire sous le glyphe d'origine, non teinté : visible quel que soit
              le rendu du SVG. */}
          <View style={styles.photoCloseCircle}>
            <KodjoIcon name="control-close" />
          </View>
        </Pressable>
        <Image
          source={{ uri }}
          style={styles.photoImage}
          contentFit="contain"
          accessible
          accessibilityLabel={label}
          onError={onError}
          testID={`${testID}-image`}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Fond sombre : la présentation plein écran n'a pas de frame (NON VÉRIFIABLE, jugé par Hermann).
  // Jetons réutilisés : `colors.snackbar` (fond), `colors.background` (pastille du ✕), `minTouchTarget` (48, cible de Fermer).
  photoScreen: {
    flex: 1,
    backgroundColor: colors.snackbar,
  },
  photoClose: {
    width: minTouchTarget,
    height: minTouchTarget,
    marginLeft: spacing[8],
    alignItems: "center",
    justifyContent: "center",
  },
  // Pastille de 38 (cercle visible du ✕ de l'en-tête de l'Éditeur, story 4.2), dans la cible de 48.
  photoCloseCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  photoImage: {
    flex: 1,
  },
});
