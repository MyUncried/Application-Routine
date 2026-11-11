import { useFocusEffect, useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import {
  AppState,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  ExecutionProjection,
  NextView,
} from "@/domain/execution/projection";
import type { Profile } from "@/domain/preferences/Profile";
import { profileGuidance } from "@/domain/preferences/Profile";
import { parseGuidanceSettings } from "@/domain/preferences/guidanceSettings";
import { effectiveGuidance, type SessionGuidance } from "@/domain/sessions/sessionGuidance";
import { ExecutionTimerRing } from "@/features/execution/ExecutionTimerRing";
import { ringMotion } from "@/features/execution/timerRing";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import { reclaimExecutionAudio, releaseExecutionAudio } from "@/infrastructure/audio/ExecutionSounds";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";

import { ExecutionDialog } from "./ExecutionDialog";
import {
  ExecutionBlockedError,
  type PreparedExecution,
} from "./ExecutionService";
import { useExecution } from "./ExecutionServiceContext";
import { executionStrings as t, formatClock } from "./executionStrings";

/** Délai avant de rendre la session audio en fin de séance : fanfare puis « Bravo, séance terminée ». */
const RELEASE_AUDIO_AFTER_END_MS = 4000;

/**
 * PRE-10.3 — écran d'Exécution d'une Séance Libre (CE-EXEC-SESSION-01 ; ch08 « Exécution » ; conception
 * §16.2). L'écran est une projection : temps, phase, commandes autorisées et progression viennent du
 * moteur (`ExecutionService.project`), jamais d'un compteur React. Le rafraîchissement (250 ms) ne sert qu'à
 * l'affichage et à la demande des signaux récents.
 *
 * - Ouverture : n'exécute rien ; « Démarrer » crée l'Exécution (instantané figé) puis le Compte à rebours.
 * - Commandes : Réinitialiser (confirmation ; l'Exécution est suspendue pendant la modale), Pause (modale
 *   Reprendre / Arrêter, seule voie d'arrêt), Exercice suivant (confirmation avant le terme d'une étape
 *   chronométrée, `Partielle`) ; Continuer sur un Point d'arrêt. Aucun retour vers un Exercice passé.
 * - Fin : fin minimale (statut, Exercices exécutés) ; la Synthèse appartient à une tranche ultérieure.
 * - Retour système et geste de retour inactifs pendant l'Exécution : aucun abandon silencieux du moteur.
 *
 * Rendu : hiérarchie et commandes du contrat ; la conformité visuelle aux nœuds Figma (Roboto Condensed,
 * chrono circulaire, progression segmentée par Tours) reste à qualifier sur iPhone.
 */

type Dialog =
  | { readonly kind: "RESET"; readonly target: string }
  | { readonly kind: "NEXT"; readonly target: string }
  | null;
type DialogView = Omit<ComponentProps<typeof ExecutionDialog>, "visible">;

export function ExecutionScreen({
  sessionId,
}: {
  readonly sessionId: string | null;
}) {
  const { service, signals, screenAwake } = useExecution();
  const profileService = useProfileService();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  const [prepared, setPrepared] = useState<PreparedExecution | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  // Action de dialogue en cours : le dialogue reste affiché jusqu'à la fin de ses commandes, pour qu'aucun
  // autre dialogue (Pause) n'apparaisse entre-temps (recette PRE-10 du 09/11/2026).
  const [dialogBusy, setDialogBusy] = useState(false);
  // Recette iPhone n° 2 du 09/11/2026 (« appuyer sur suivant fait apparaître une fenêtre « séance interrompue » qui
  // s'efface immédiatement ») : dernier dialogue affiché, conservé pendant le fondu de fermeture du Modal.
  const [lastShown, setLastShown] = useState<NonNullable<Dialog> | "PAUSE">(
    "PAUSE",
  );
  // Choix fait pendant la séance avec les interrupteurs Sons et Voix ; `null` : état initial (Séance, sinon Profil).
  const [soundChoice, setSoundChoice] = useState<boolean | null>(null);
  const [voiceChoice, setVoiceChoice] = useState<boolean | null>(null);
  const starting = useRef(false);

  useEffect(() => service.subscribe(refresh), [service]);

  // Préférence Vibrations (fonctionnelles de séance). Groupe Guidage du Profil (suite PRE-10 son et voix, spec
  // `spec-guidage-reglages` §3.1 et §3.3) : Sons et Annonces vocales donnent l'état initial des interrupteurs de
  // l'Exécution, modifiables ensuite sans être enregistrés ; annonce de l'objectif selon le Profil.
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    let cancelled = false;
    signals.setAudible(true, true);
    profileService
      .getProfile()
      .then((loaded) => {
        if (cancelled) return;
        setProfile(loaded);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [profileService, signals]);

  // Fin de PRE-10 (spec `spec-guidage-reglages` §3.3) : guidage propre à la Séance (Composition, élément Guidage),
  // sinon le Profil. Lu dans le plan figé : Séance préparée, ou Exécution reprise.
  const current = service.current();
  const sessionGuidance = current?.plan.guidance ?? (prepared?.status === "ready" ? prepared.plan.guidance : undefined);
  const guidanceKey = sessionGuidance === undefined ? "profile" : JSON.stringify(sessionGuidance);
  // Une Exécution reprise d'avant la modale Guidage sonore (ancienne forme, sans événements) suit le Profil.
  const guidance = useMemo((): SessionGuidance | undefined => (guidanceKey === "profile" || !guidanceKey.includes("\"events\"") ? undefined : parseGuidanceSettings(guidanceKey)), [guidanceKey]);
  // Guidage sonore effectif (documentation de main `ebe72f76`) : réglages validés pour la Séance, sinon le Profil.
  // Les interrupteurs Sons et Voix de la séance démarrent actifs si au moins un son, ou une annonce, est réglé.
  const initial = useMemo(() => {
    if (profile === null) return { sounds: true, voice: true, settings: null };
    const settings = effectiveGuidance(guidance, profileGuidance(profile));
    return {
      sounds: Object.values(settings.events).some((event) => event.sound !== "NONE"),
      voice: Object.values(settings.announcements).some(Boolean),
      settings,
    };
  }, [profile, guidance]);
  const soundEnabled = soundChoice ?? initial.sounds;
  const voiceEnabled = voiceChoice ?? initial.voice;
  useEffect(() => {
    if (initial.settings !== null) signals.setGuidance(initial.settings);
  }, [initial, signals]);
  useEffect(() => {
    signals.setAudible(soundEnabled, voiceEnabled);
  }, [soundEnabled, voiceEnabled, signals]);

  // Recette du 10/11/2026 (h1, a1) : une modification du guidage du Profil pendant une séance s'applique au retour sur
  // l'écran d'Exécution (interrupteurs Sons et Voix de la séance conservés), sauf réglages propres à la Séance.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      profileService
        .getProfile()
        .then((profile) => {
          if (cancelled) return;
          signals.setGuidance(effectiveGuidance(guidance, profileGuidance(profile)));
        })
        .catch(() => undefined);
      return () => {
        cancelled = true;
      };
    }, [guidance, profileService, signals]),
  );

  const active = service.current();
  useEffect(() => {
    if (active !== null || sessionId === null) return;
    let cancelled = false;
    service.prepare(sessionId).then(
      (result) => {
        if (!cancelled) setPrepared(result);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [active, service, sessionId]);

  // Rafraîchissement d'affichage et signaux récents ; retour au premier plan : réconciliation (RM-067).
  const running = active !== null && active.state.status !== "FINISHED";
  useEffect(() => {
    if (!running) return;
    // Rafraîchissement calé sur le changement de seconde affichée (recette PRE-10 du 09/11/2026 : avec un pas
    // fixe de 250 ms non aligné, certaines secondes duraient 750 ms et d'autres 1250 ms) ; au plus 250 ms
    // entre deux demandes de signaux.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tick = () => {
      service.pulse();
      refresh();
      timer = setTimeout(tick, refreshDelayMs(service.project()));
    };
    timer = setTimeout(tick, refreshDelayMs(service.project()));
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void service.onForeground();
        // Recette du 11/11/2026 (Hermann, m2) : la musique lancée hors de l'application est de nouveau atténuée.
        reclaimExecutionAudio();
      }
      // Recette du 11/11/2026 (constat a, Hermann : « Pendant un appel vidéo ou téléphonique, ou l'utilisation d'une
      // autre application, il faut une interruption de la séance, par défaut ») : la séance passe en Pause dès que
      // l'application quitte le premier plan. [À CLARIFIER : iOS ne distingue pas le verrouillage de l'écran, qui met
      // aussi la séance en Pause ; la poursuite explicite en arrière-plan (petit écran flottant) reste à définir.]
      if (state === "background") {
        void service.dispatch({ type: "PAUSE", reason: "USER" }).catch(() => undefined);
        // Recette du 11/11/2026 (Hermann, m2, second essai) : hors de la séance, la musique retrouve son volume.
        releaseExecutionAudio();
      }
    });
    return () => {
      if (timer !== null) clearTimeout(timer);
      subscription.remove();
    };
  }, [running, service]);

  // Recette du 11/11/2026 (Hermann, m2) : « Dernier écart : lorsque la séance est terminée et que je reste sur l'applciation le volume doit revenir à l'original, et notamment lorsque je retrouve sur Spotify. » Séance terminée ou écran quitté : la musique retrouve son volume,
  // après la fanfare et l'annonce de fin.
  useEffect(() => {
    if (!running) return;
    return () => releaseExecutionAudio(RELEASE_AUDIO_AFTER_END_MS);
  }, [running]);

  // ch09 Profil, « Écran maintenu actif » : pas de mise en veille pendant l'exécution, y compris en pause ;
  // la veille revient à la fin de la séance ou à la sortie de l'écran (fin de PRE-10, 11/11/2026).
  useEffect(() => {
    if (!running || screenAwake === undefined) return;
    screenAwake.keepAwake(true);
    return () => screenAwake.keepAwake(false);
  }, [running, screenAwake]);

  useEffect(() => {
    if (!running) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );
    return () => subscription.remove();
  }, [running]);

  const projection = active === null ? null : service.project();

  const start = useCallback(async () => {
    if (prepared?.status !== "ready" || starting.current) return;
    starting.current = true;
    try {
      await service.start(prepared);
    } catch (error) {
      if (error instanceof ExecutionBlockedError) setBlocked(true);
    } finally {
      starting.current = false;
    }
  }, [prepared, service]);

  const close = useCallback(() => {
    service.release();
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, [router, service]);

  /** Ouvre une confirmation : l'Exécution est suspendue pendant l'affichage de la modale (ch13, Réinitialiser et Suivant). */
  const openDialog = useCallback(
    async (kind: "RESET" | "NEXT", step: string) => {
      setDialog({ kind, target: step });
      await service.dispatch({ type: "PAUSE", reason: "DIALOG" }, step);
    },
    [service],
  );

  /** Ferme le dialogue après ses commandes (sérialisées par le service), jamais avant. */
  const runDialogAction = useCallback(
    (commands: () => Promise<unknown>) => {
      if (dialogBusy) return;
      setDialogBusy(true);
      void commands()
        .catch(() => undefined)
        .finally(() => {
          setDialogBusy(false);
          setDialog(null);
        });
    },
    [dialogBusy],
  );

  const onReset = useCallback(() => {
    const step = projection?.target;
    if (typeof step === "string") void openDialog("RESET", step);
  }, [openDialog, projection?.target]);

  const onNext = useCallback(() => {
    if (projection === null || typeof projection.target !== "string") return;
    if (projection.commands.nextNeedsConfirmation)
      void openDialog("NEXT", projection.target);
    else void service.dispatch({ type: "NEXT" }, projection.target);
  }, [openDialog, projection, service]);

  const toggleSound = () => setSoundChoice(!soundEnabled);
  const toggleVoice = () => setVoiceChoice(!voiceEnabled);

  const paddings = useMemo(
    () => ({
      paddingTop: insets.top + spacing[8],
      paddingBottom: insets.bottom + spacing[16],
    }),
    [insets.bottom, insets.top],
  );

  // —————————————————————————————— avant le démarrage
  if (active === null) {
    const name = prepared?.status === "ready" ? prepared.plan.sessionName : "";
    return (
      <View style={[styles.screen, paddings]} testID="execution-screen">
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.back}
            hitSlop={12}
            testID="execution-back"
          >
            <Text style={styles.headerAction}>{t.back}</Text>
          </Pressable>
          <Text style={styles.sessionName} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.center}>
          {prepared?.status === "not-launchable" ? (
            <Text style={styles.notice} testID="execution-not-launchable">
              {prepared.launchability.status === "engine-unavailable"
                ? t.notLaunchableFormats
                : t.notLaunchableInvalid}
            </Text>
          ) : null}
          {blocked ? (
            <Text style={styles.notice} testID="execution-blocked">
              {t.blocked}
            </Text>
          ) : null}
          {prepared?.status === "ready" && !blocked ? (
            <Pressable
              onPress={start}
              accessibilityRole="button"
              accessibilityLabel={t.start}
              style={styles.startButton}
              testID="execution-start"
            >
              <Text style={styles.startLabel}>{t.start}</Text>
            </Pressable>
          ) : null}
          {prepared?.status === "ready" ? (
            <Text style={styles.estimate}>
              {estimateLabel(prepared.projection)}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  // —————————————————————————————— fin minimale
  if (projection === null || projection.status === "FINISHED") {
    const status = active.businessStatus ?? "INTERRUPTED";
    const occurrences = service.occurrences();
    return (
      <View style={[styles.screen, paddings]} testID="execution-end">
        <Text style={styles.sessionName}>{active.plan.sessionName}</Text>
        <Text
          style={styles.endTitle}
          accessibilityRole="header"
          testID="execution-end-status"
        >
          {t.end[status]}
        </Text>
        <Text style={styles.endElapsed}>
          {t.elapsed} {formatClock(projection?.sessionElapsedMs ?? 0)}
        </Text>
        <ScrollView
          style={styles.endList}
          contentContainerStyle={styles.endListContent}
        >
          {occurrences.map((occurrence) => (
            <View
              key={occurrence.occurrenceKey}
              style={styles.endRow}
              testID={`execution-end-row-${occurrence.occurrenceKey}`}
            >
              <Text style={styles.endRowName} numberOfLines={1}>
                {active.plan.exercises[occurrence.exerciseId]?.name ?? ""}
                {occurrence.context?.circuit
                  ? ` · ${t.tour} ${occurrence.context.circuit.tour}`
                  : ""}
              </Text>
              <Text style={styles.endRowStatus}>
                {occurrence.status === "PARTIAL"
                  ? t.end.exercisePartial
                  : t.end.exerciseCompleted}{" "}
                · {formatClock(occurrence.activeMs)}
              </Text>
            </View>
          ))}
        </ScrollView>
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={t.close}
          style={styles.startButton}
          testID="execution-close"
        >
          <Text style={styles.startLabel}>{t.close}</Text>
        </Pressable>
      </View>
    );
  }

  // —————————————————————————————— en cours
  const phaseLabel =
    projection.phase === null ? "" : t.phases[projection.phase];
  const title =
    projection.phase === "ACTIVITY"
      ? (projection.exerciseName ?? "")
      : phaseLabel;
  // Toute suspension sans dialogue ouvert présente la modale de Pause (une suspension de confirmation relue après une
  // interruption du processus ne laisse jamais l'écran bloqué).
  const pauseView: DialogView = {
    title: t.pauseDialog.title,
    message:
      projection.pauseReason === "SAFETY"
        ? `${t.safetyPause}\n${t.pauseDialog.message(projection.exerciseName)}`
        : projection.pauseReason === "RESTORE"
          ? `${t.restorePause}\n${t.pauseDialog.message(projection.exerciseName)}`
          : t.pauseDialog.message(projection.exerciseName),
    testID: "execution-pause-dialog",
    actions: [
      {
        label: t.pauseDialog.resume,
        tone: "primary",
        testID: "execution-pause-resume",
        onPress: () => void service.dispatch({ type: "RESUME" }),
      },
      {
        label: t.pauseDialog.stop,
        tone: "danger",
        testID: "execution-pause-stop",
        onPress: () => void service.dispatch({ type: "STOP" }),
      },
    ],
  };
  const viewOf = (dialog: NonNullable<Dialog> | "PAUSE"): DialogView =>
    dialog === "PAUSE"
      ? pauseView
      : dialog.kind === "RESET"
        ? {
            title: t.resetDialog.title,
            message: t.resetDialog.message,
            testID: "execution-reset-dialog",
            actions: [
              {
                label: t.resetDialog.cancel,
                tone: "neutral",
                testID: "execution-reset-cancel",
                onPress: () =>
                  runDialogAction(() => service.dispatch({ type: "RESUME" })),
              },
              {
                label: t.resetDialog.confirm,
                tone: "primary",
                testID: "execution-reset-confirm",
                onPress: () =>
                  runDialogAction(() =>
                    service
                      .dispatch({ type: "RESET" }, dialog.target)
                      .then(() => service.dispatch({ type: "RESUME" })),
                  ),
              },
            ],
          }
        : {
            title: t.nextDialog.title,
            message: t.nextDialog.message,
            testID: "execution-next-dialog",
            actions: [
              {
                label: t.nextDialog.cancel,
                tone: "neutral",
                testID: "execution-next-cancel",
                onPress: () =>
                  runDialogAction(() => service.dispatch({ type: "RESUME" })),
              },
              {
                label: t.nextDialog.confirm,
                tone: "primary",
                testID: "execution-next-confirm",
                // Reprise puis passage confirmé, rattaché à l'étape affichée (sans effet si elle s'est terminée).
                onPress: () =>
                  runDialogAction(() =>
                    service
                      .dispatch({ type: "RESUME" })
                      .then(() =>
                        service.dispatch(
                          { type: "NEXT", confirmed: true },
                          dialog.target,
                        ),
                      ),
                  ),
              },
            ],
          };
  // Toute suspension sans dialogue ouvert présente la Pause (une suspension de confirmation relue après une
  // interruption du processus ne laisse jamais l'écran bloqué).
  const shownNow: NonNullable<Dialog> | "PAUSE" | null =
    dialog ?? (projection.status === "PAUSED" ? "PAUSE" : null);
  if (shownNow !== null && shownNow !== lastShown) setLastShown(shownNow);
  const dialogView: DialogView | null =
    shownNow === null ? null : viewOf(shownNow);

  return (
    <View style={[styles.screen, paddings]} testID="execution-running">
      <View style={styles.header}>
        <Pressable
          onPress={toggleVoice}
          accessibilityRole="switch"
          accessibilityState={{ checked: voiceEnabled }}
          accessibilityLabel={voiceEnabled ? t.voiceOn : t.voiceOff}
          hitSlop={8}
          testID="execution-voice"
        >
          <Text style={[styles.toggle, voiceEnabled ? null : styles.toggleOff]}>
            {voiceEnabled ? "Voix" : "Voix off"}
          </Text>
        </Pressable>
        <Text style={styles.sessionName} numberOfLines={1}>
          {projection.sessionName}
        </Text>
        <Pressable
          onPress={toggleSound}
          accessibilityRole="switch"
          accessibilityState={{ checked: soundEnabled }}
          accessibilityLabel={soundEnabled ? t.soundOn : t.soundOff}
          hitSlop={8}
          testID="execution-sound"
        >
          <Text style={[styles.toggle, soundEnabled ? null : styles.toggleOff]}>
            {soundEnabled ? "Sons" : "Sons off"}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        {/*
          Recette du 11/11/2026 (Hermann, constat) : « Entre deux exercices d'une séance, le chronomètre et les autres
          éléments affichés ne doivent jamais changer de position sur l'écran ». Titre (deux lignes), contexte et côté
          occupent toujours la même hauteur, qu'ils soient affichés ou non. [Lignes présentes seulement si renseignées — remplacé.]
        */}
        <View style={styles.titleSlot}>
          <Text
            style={styles.exerciseName}
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
            numberOfLines={2}
            testID="execution-title"
          >
            {title}
          </Text>
        </View>
        <View style={styles.contextSlot}>
          {projection.phase !== "ACTIVITY" && projection.exerciseName !== null ? (
            <Text style={styles.context} numberOfLines={1}>{projection.exerciseName}</Text>
          ) : null}
        </View>
        <View style={styles.sideSlot}>
          {projection.sideRank !== null ? (
            <Text style={styles.side} numberOfLines={1} testID="execution-side">
              {t.side(projection.sideRank)}
            </Text>
          ) : null}
        </View>
        {/* Fin de PRE-10 : chrono circulaire (Figma `1992:8132`), côté et chrono centrés dans l'anneau. */}
        <ExecutionTimerRing
          motion={ringMotion(
            projection.timer,
            projection.status === "RUNNING",
            projection.phase === "INITIAL_COUNTDOWN" || projection.phase === "SESSION_END",
          )}
          testID="execution-ring"
        >
          <Text
            style={styles.timer}
            accessibilityLabel={timerAccessibility(projection)}
            testID="execution-timer"
          >
            {timerText(projection)}
          </Text>
        </ExecutionTimerRing>
        {/* Recette du 11/11/2026 : objectif et guidage gardent leur place, affichés ou non (positions fixes). */}
        <View style={styles.lineSlot}>
          {targetText(projection) !== null ? (
            <Text style={styles.target} numberOfLines={1}>{targetText(projection)}</Text>
          ) : null}
        </View>
        <View style={styles.lineSlot}>
          {projection.guidance !== null ? (
            <Text style={styles.guidance} numberOfLines={1} testID="execution-guidance">
              {projection.guidance.label} ·{" "}
              {formatClock(projection.guidance.remainingMs, true)}
            </Text>
          ) : null}
        </View>
        <View style={styles.seriesTour}>
          <Text style={styles.seriesTourText} testID="execution-series">
            {projection.series !== null
              ? `${t.series} ${projection.series.current}/${projection.series.total}`
              : ""}
          </Text>
          <View style={styles.seriesTourDivider} />
          <Text
            style={[styles.seriesTourText, styles.right]}
            testID="execution-tour"
          >
            {projection.tour !== null
              ? `${t.tour} ${projection.tour.current}/${projection.tour.total}`
              : ""}
          </Text>
        </View>
        {projection.next !== null ? (
          <View style={styles.next} testID="execution-next">
            <Text style={styles.nextLabel}>{t.next}</Text>
            <Text style={styles.nextValue} numberOfLines={1}>
              {nextText(projection.next)}
            </Text>
          </View>
        ) : null}
        {active.saveError ? (
          <Pressable
            onPress={() => void service.retry()}
            accessibilityRole="button"
            style={styles.saveError}
            testID="execution-save-error"
          >
            <Text style={styles.saveErrorText}>
              {t.saveError} {t.retry}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <View style={styles.commands}>
        <CommandButton
          label={
            projection.commands.resetScope === "RECOVERY"
              ? t.commands.resetRecovery
              : t.commands.resetExercise
          }
          disabled={!projection.commands.reset}
          onPress={onReset}
          testID="execution-reset"
        />
        <CommandButton
          label={t.commands.pause}
          disabled={!projection.commands.pause}
          onPress={() =>
            void service.dispatch({ type: "PAUSE", reason: "USER" })
          }
          primary
          testID="execution-pause"
        />
        <CommandButton
          label={
            projection.commands.isContinue
              ? t.commands.continue
              : t.commands.next
          }
          disabled={!projection.commands.next}
          onPress={onNext}
          testID="execution-next-command"
        />
      </View>

      <View style={styles.total}>
        <Text style={styles.totalText} testID="execution-elapsed">
          {formatClock(projection.sessionElapsedMs)} /{" "}
          {estimateLabel(projection)}
        </Text>
        {/* Fin de PRE-10 : piste structurée par Tours (Figma « DSF / Controls / Progression par tours », ch10 RM-077 :
            repères de lecture seulement, l'avancement reste global et continu). */}
        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(projection.progress * 100),
          }}
          testID="execution-progress-track"
        >
          {tourSegments(projection).map((fill, index) => (
            <View key={index} style={styles.progressSegment} testID={`execution-progress-segment-${index}`}>
              <View
                style={[styles.progressFill, { width: `${Math.round(fill * 1000) / 10}%` }]}
                testID={index === 0 ? "execution-progress" : undefined}
              />
            </View>
          ))}
        </View>
        {projection.tour !== null ? <Text style={styles.progressCaption}>{t.tour}</Text> : null}
      </View>

      {/* Un seul Modal, toujours monté pendant l'Exécution (voir ExecutionDialog, recette du 09/11/2026). */}
      <ExecutionDialog
        visible={dialogView !== null}
        {...(dialogView ?? viewOf(lastShown))}
      />
    </View>
  );
}

function CommandButton({
  label,
  disabled,
  onPress,
  primary = false,
  testID,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  primary?: boolean;
  testID: string;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[
        styles.command,
        primary ? styles.commandPrimary : null,
        disabled ? styles.commandDisabled : null,
      ]}
      testID={testID}
    >
      <Text
        style={[
          styles.commandLabel,
          primary ? styles.commandPrimaryLabel : null,
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function timerText(projection: ExecutionProjection): string {
  switch (projection.timer.kind) {
    case "COUNTDOWN":
      return formatClock(projection.timer.remainingMs, true);
    case "STOPWATCH":
      return formatClock(projection.timer.elapsedMs);
    case "NONE":
      return "";
    default: {
      const unreachable: never = projection.timer;
      return unreachable;
    }
  }
}

function timerAccessibility(projection: ExecutionProjection): string {
  return projection.timer.kind === "COUNTDOWN"
    ? `${timerText(projection)} restantes`
    : timerText(projection);
}

function targetText(projection: ExecutionProjection): string | null {
  if (projection.phase !== "ACTIVITY" || projection.seriesTarget === null)
    return null;
  const target = projection.seriesTarget;
  const value =
    target.kind === "FAILURE"
      ? t.failure
      : target.kind === "NUMBER"
        ? projection.mode === "REPETITIONS"
          ? t.repetitions(target.value)
          : formatClock(target.value * 1000)
        : null;
  if (value === null) return null;
  return [
    `${t.target} ${value}`,
    projection.loadKg !== null ? t.load(projection.loadKg) : null,
  ]
    .filter((part) => part !== null)
    .join(" · ");
}

/** « À suivre » : nom, puis Série (recette PRE-10 du 09/11/2026), puis cible ou durée. */
function nextText(next: NextView): string {
  if (next.kind === "STOP_POINT") return t.nextStopPoint;
  const name =
    next.kind === "ACTIVITY"
      ? [
          next.name ?? "",
          next.series !== null
            ? t.seriesShort(next.series.current, next.series.total)
            : null,
        ]
          .filter((part) => part !== null)
          .join(" · ")
      : t.phases[next.kind];
  if (
    next.kind === "ACTIVITY" &&
    next.mode === "REPETITIONS" &&
    next.target?.kind === "NUMBER"
  )
    return `${name} · ${t.repetitions(next.target.value)}`;
  if (next.kind === "ACTIVITY" && next.target?.kind === "FAILURE")
    return `${name} · ${t.failure}`;
  return next.plannedMs !== null
    ? `${name} · ${formatClock(next.plannedMs)}`
    : name;
}

/**
 * Délai jusqu'au prochain changement de seconde affichée (compte à rebours arrondi au supérieur, chronomètre
 * arrondi à l'inférieur), plus une marge de 20 ms ; borné à [16, 250] ms pour la demande des signaux.
 */
export function refreshDelayMs(projection: ExecutionProjection | null): number {
  const timer = projection?.timer;
  let untilBoundary = 250;
  if (timer?.kind === "COUNTDOWN" && timer.remainingMs > 0)
    untilBoundary = ((timer.remainingMs - 1) % 1000) + 1;
  else if (timer?.kind === "STOPWATCH")
    untilBoundary = 1000 - (timer.elapsedMs % 1000);
  return Math.min(250, Math.max(16, untilBoundary + 20));
}

function estimateLabel(projection: ExecutionProjection): string {
  const prefix =
    projection.estimated.kind === "estimated"
      ? "≈ "
      : projection.estimated.kind === "lowerBound"
        ? "≥ "
        : "";
  return `${prefix}${formatClock(projection.estimated.ms)}`;
}

/** Couleurs et styles de texte du Figma `1992:8132` propres à l'écran d'Exécution. */
const executionColors = { side: "#8F8F94", track: "#E0E3E8", progress: "#8283F2", caption: "#7A7A80" } as const;
const executionType = {
  title: { fontFamily: "RobotoCondensed_600SemiBold", fontWeight: "600", fontSize: 30, lineHeight: 36 },
  side: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 24, lineHeight: 29 },
  timer: { fontFamily: "RobotoCondensed_700Bold", fontWeight: "700", fontSize: 100, letterSpacing: -1.5 },
  metric: { fontFamily: "RobotoCondensed_700Bold", fontWeight: "700", fontSize: 30 },
} as const;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: layout.screenGutter,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    gap: spacing[8],
  },
  headerAction: { ...type.label, color: colors.primary },
  headerSpacer: { width: 48 },
  sessionName: {
    ...type.screenHeaderTitle,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: "center",
  },
  toggle: {
    ...type.supporting,
    color: colors.primary,
    minWidth: 48,
    textAlign: "center",
  },
  toggleOff: { color: colors.textSecondary },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[16],
  },
  notice: { ...type.body, color: colors.textSecondary, textAlign: "center" },
  startButton: {
    minHeight: 48,
    minWidth: 200,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[24],
    alignSelf: "center",
  },
  startLabel: { ...type.button, color: colors.background },
  estimate: { ...type.supporting, color: colors.textSecondary },
  content: { alignItems: "center", paddingTop: spacing[24], gap: spacing[12] },
  // Fin de PRE-10 : typographie du Figma `1992:8132` (Roboto Condensed).
  titleSlot: { height: 72, alignSelf: "stretch", justifyContent: "center" },
  contextSlot: { height: 17, justifyContent: "center" },
  sideSlot: { height: 29, justifyContent: "center" },
  lineSlot: { height: 20, justifyContent: "center" },
  exerciseName: {
    ...executionType.title,
    color: colors.textPrimary,
    textAlign: "center",
  },
  context: { ...type.contextLine, color: colors.textSecondary },
  side: { ...executionType.side, color: executionColors.side },
  timer: {
    ...executionType.timer,
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  target: { ...type.label, color: colors.textSecondary },
  guidance: { ...type.label, color: colors.primary },
  seriesTour: {
    flexDirection: "row",
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: spacing[8],
  },
  seriesTourText: { ...executionType.metric, color: colors.textPrimary, flex: 1 },
  seriesTourDivider: { width: 24 },
  right: { textAlign: "right" },
  next: {
    alignSelf: "stretch",
    paddingVertical: spacing[12],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    gap: spacing[4],
  },
  nextLabel: { ...type.supporting, color: colors.textSecondary },
  nextValue: { ...type.label, color: colors.textPrimary },
  saveError: {
    padding: spacing[12],
    backgroundColor: colors.dangerSurface,
    borderRadius: 12,
  },
  saveErrorText: { ...type.body, color: colors.danger },
  commands: {
    flexDirection: "row",
    gap: spacing[8],
    paddingVertical: spacing[12],
  },
  command: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  commandPrimary: { backgroundColor: colors.primary },
  commandDisabled: { opacity: 0.4 },
  commandLabel: {
    ...type.button,
    color: colors.textPrimary,
    textAlign: "center",
  },
  commandPrimaryLabel: { color: colors.background },
  total: { gap: spacing[8] },
  totalText: {
    ...type.supporting,
    color: colors.textSecondary,
    textAlign: "center",
  },
  progressTrack: { flexDirection: "row", gap: 3, height: 9 },
  progressSegment: { flex: 1, height: 9, borderRadius: 4.5, backgroundColor: executionColors.track, overflow: "hidden" },
  progressFill: { height: 9, borderRadius: 4.5, backgroundColor: executionColors.progress },
  progressCaption: { ...type.caption, fontSize: 10, color: executionColors.caption },
  endTitle: {
    ...type.activityTitle,
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: spacing[32],
  },
  endElapsed: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing[8],
  },
  endList: { flex: 1, marginTop: spacing[24] },
  endListContent: { gap: spacing[8], paddingBottom: spacing[16] },
  endRow: {
    paddingVertical: spacing[8],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  endRowName: { ...type.label, color: colors.textPrimary },
  endRowStatus: { ...type.supporting, color: colors.textSecondary },
});

/**
 * Fin de PRE-10 — remplissage de chaque segment de la piste : un segment par Tour du Circuit en cours (un seul sans Circuit),
 * l'avancement global (RM-077) réparti dans l'ordre. Repères de lecture seulement (ch10).
 */
export function tourSegments(projection: Pick<ExecutionProjection, "progress" | "tour">): readonly number[] {
  const count = Math.max(1, Math.min(projection.tour?.total ?? 1, 12));
  return Array.from({ length: count }, (_, index) => Math.min(1, Math.max(0, projection.progress * count - index)));
}
