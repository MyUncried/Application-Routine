import { Image } from "expo-image";
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

  // Recette r6 (11/11/2026, Hermann : « Ok, il faudra ensuite se référer à Figma pour la position exacte des différents
  // éléments de l'écran. » ; 12/11/2026 : « Oui pour l'écran d'exécution de séance ») : disposition du Figma
  // `1992:8132` « P-Exécution d'une séance — Démarrée » — titre et ligne de contexte, chrono circulaire (côté en haut
  // de l'anneau), zone « Progression et suite » (Série • Tour, piste par Tours, cadre Temps écoulé / À suivre), barre
  // de commandes à icônes (Son, Réinitialiser, Pause, Suivant, Voix). [Son et Voix en en-tête, commandes en texte,
  // temps total sous les commandes — remplacé.]
  const next = projection.next === null ? null : nextParts(projection.next);
  return (
    <View style={[styles.runningScreen, { paddingTop: insets.top + spacing[4], paddingBottom: Math.max(insets.bottom - 10, spacing[12]) }]} testID="execution-running">
      <ScrollView style={styles.top} contentContainerStyle={styles.content} bounces={false}>
        {/*
          Recette du 11/11/2026 (Hermann, constat) : « Entre deux exercices d'une séance, le chronomètre et les autres
          éléments affichés ne doivent jamais changer de position sur l'écran ». Titre, contexte et côté occupent
          toujours la même hauteur, qu'ils soient affichés ou non.
        */}
        <View style={styles.titleSlot}>
          <Text
            style={styles.exerciseName}
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            testID="execution-title"
          >
            {title}
          </Text>
        </View>
        <View style={styles.contextSlot}>
          <Text style={styles.context} numberOfLines={1} testID="execution-context">
            {projection.phase !== "ACTIVITY" && projection.exerciseName !== null ? projection.exerciseName : projection.sessionName}
          </Text>
        </View>
        <ExecutionTimerRing
          motion={ringMotion(
            projection.timer,
            projection.status === "RUNNING",
            projection.phase === "INITIAL_COUNTDOWN" || projection.phase === "SESSION_END",
          )}
          testID="execution-ring"
        >
          <View style={styles.ringContent}>
            <View style={styles.sideSlot}>
              {projection.sideRank !== null ? (
                <Text style={styles.side} numberOfLines={1} testID="execution-side">
                  {t.side(projection.sideRank)}
                </Text>
              ) : null}
            </View>
            <View style={styles.timerSlot}>
              <Text
                style={styles.timer}
                numberOfLines={1}
                adjustsFontSizeToFit
                accessibilityLabel={timerAccessibility(projection)}
                testID="execution-timer"
              >
                {timerText(projection)}
              </Text>
            </View>
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
          </View>
        </ExecutionTimerRing>
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

      {/* Figma `5041:6048` « Zone — Progression et suite ». */}
      <View style={styles.zone}>
        <View style={styles.seriesTour}>
          <Text style={[styles.seriesTourText, styles.right]} numberOfLines={1} testID="execution-series">
            {projection.series !== null
              ? `${t.series} ${projection.series.current}/${projection.series.total}`
              : ""}
          </Text>
          <Text style={styles.seriesTourDot}>{projection.series !== null && projection.tour !== null ? "•" : ""}</Text>
          <Text style={styles.seriesTourText} numberOfLines={1} testID="execution-tour">
            {projection.tour !== null
              ? `${t.tour} ${projection.tour.current}/${projection.tour.total}`
              : ""}
          </Text>
        </View>
        {/* Piste structurée par Tours (Figma « DSF / Controls / Progression par tours », ch10 RM-077 : repères de
            lecture seulement, l'avancement reste global et continu). */}
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
        <Text style={styles.progressCaption}>{projection.tour !== null ? t.tour : ""}</Text>
        {/* Figma `4790:6204` « Cadre — Informations secondaires — À suivre + Temps écoulé ». */}
        <View style={styles.card}>
          <View style={styles.elapsedRow}>
            <Text style={styles.elapsedLabel} numberOfLines={1}>{t.elapsed}</Text>
            <Text style={styles.elapsedValue} numberOfLines={1} adjustsFontSizeToFit testID="execution-elapsed">
              {formatClock(projection.sessionElapsedMs)} / {estimateLabel(projection)}
            </Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.next} testID="execution-next">
            <Text style={styles.nextLabel}>{next !== null ? t.next : ""}</Text>
            <View style={styles.nextRow}>
              <Text style={styles.nextName} numberOfLines={1} testID="execution-next-name">
                {next?.name ?? ""}
              </Text>
              <Text style={styles.nextValue} numberOfLines={1} adjustsFontSizeToFit testID="execution-next-value">
                {next?.value ?? ""}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Barre de commandes du Figma `1992:8132` : Son, Réinitialiser, Mettre en pause, Activité suivante, Voix. */}
      <View style={styles.commands}>
        <Pressable
          onPress={toggleSound}
          accessibilityRole="switch"
          accessibilityState={{ checked: soundEnabled }}
          accessibilityLabel={soundEnabled ? t.soundOn : t.soundOff}
          hitSlop={12}
          style={styles.toggle}
          testID="execution-sound"
        >
          <Image source={soundEnabled ? ICONS.soundOn : ICONS.soundOff} style={styles.toggleIcon} contentFit="contain" />
        </Pressable>
        <IconCommand
          label={
            projection.commands.resetScope === "RECOVERY"
              ? t.commands.resetRecovery
              : t.commands.resetExercise
          }
          icon={ICONS.reset}
          size={48}
          disabled={!projection.commands.reset}
          onPress={onReset}
          testID="execution-reset"
        />
        <IconCommand
          label={t.commands.pause}
          icon={ICONS.pause}
          size={72}
          disabled={!projection.commands.pause}
          onPress={() =>
            void service.dispatch({ type: "PAUSE", reason: "USER" })
          }
          style={styles.pauseCommand}
          testID="execution-pause"
        />
        <IconCommand
          label={
            projection.commands.isContinue
              ? t.commands.continue
              : t.commands.next
          }
          icon={ICONS.next}
          size={48}
          disabled={!projection.commands.next}
          onPress={onNext}
          testID="execution-next-command"
        />
        <Pressable
          onPress={toggleVoice}
          accessibilityRole="switch"
          accessibilityState={{ checked: voiceEnabled }}
          accessibilityLabel={voiceEnabled ? t.voiceOn : t.voiceOff}
          hitSlop={12}
          style={styles.toggle}
          testID="execution-voice"
        >
          <Image source={voiceEnabled ? ICONS.voiceOn : ICONS.voiceOff} style={styles.toggleIcon} contentFit="contain" />
        </Pressable>
      </View>

      {/* Un seul Modal, toujours monté pendant l'Exécution (voir ExecutionDialog, recette du 09/11/2026). */}
      <ExecutionDialog
        visible={dialogView !== null}
        {...(dialogView ?? viewOf(lastShown))}
      />
    </View>
  );
}

/** Icônes exportées du Figma `1992:8132` (« Mettre en pause », « Activité suivante », « Réinitialiser la séance —
 * confirmation ») et des composants « DSF / Controls / Son » (`5544:4770`) et « DSF / Controls / Voix » (`5544:4790`). */
const ICONS = {
  pause: require("../../../assets/icons/execution-pause.svg"),
  next: require("../../../assets/icons/execution-suivant.svg"),
  reset: require("../../../assets/icons/execution-reinitialiser.svg"),
  soundOn: require("../../../assets/icons/execution-son-active.svg"),
  soundOff: require("../../../assets/icons/execution-son-desactive.svg"),
  voiceOn: require("../../../assets/icons/execution-voix-activee.svg"),
  voiceOff: require("../../../assets/icons/execution-voix-desactivee.svg"),
} as const;

/** Bouton rond de la barre de commandes ; libellé porté par l'accessibilité. */
function IconCommand({
  label,
  icon,
  size,
  disabled,
  onPress,
  style,
  testID,
}: {
  label: string;
  icon: number;
  size: number;
  disabled: boolean;
  onPress: () => void;
  style?: object;
  testID: string;
}) {
  // « Mettre en pause » est exporté avec son ombre portée : 92 × 92 pour un bouton de 72 (débord de 10 et 8 à 12).
  const shadowed = size === 72;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={8}
      style={[{ width: size, height: size }, style, disabled ? styles.commandDisabled : null]}
      testID={testID}
    >
      <Image
        source={icon}
        style={shadowed ? styles.pauseIcon : { width: size, height: size }}
        contentFit="contain"
      />
    </Pressable>
  );
}

/** « À suivre » : nom (puis Série, recette PRE-10 du 09/11/2026) à gauche, cible ou durée à droite (Figma `4790:6206`, `4790:6207`). */
function nextParts(next: NextView): { readonly name: string; readonly value: string | null } {
  if (next.kind === "STOP_POINT") return { name: t.nextStopPoint, value: null };
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
  if (next.kind === "ACTIVITY" && next.mode === "REPETITIONS" && next.target?.kind === "NUMBER")
    return { name, value: t.repetitions(next.target.value) };
  if (next.kind === "ACTIVITY" && next.target?.kind === "FAILURE") return { name, value: t.failure };
  return { name, value: next.plannedMs !== null ? formatClock(next.plannedMs) : null };
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
const executionColors = { side: "#8F8F94", track: "#E0E3E8", progress: "#8283F2", caption: "#7A7A80", zone: "#F6F6FA", card: "#FAFAFE" } as const;
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
  // Recette r6 : positions du Figma `1992:8132` (écran de 402 × 874, barre d'état de 36).
  runningScreen: { flex: 1, backgroundColor: colors.background },
  top: { flexGrow: 0, flexShrink: 1 },
  content: { alignItems: "center", paddingHorizontal: layout.screenGutter },
  // Titre à 20 sous la barre d'état (Figma : 56), contexte dessous (92), anneau à 14 du contexte (122).
  titleSlot: { height: 36, marginTop: spacing[16], alignSelf: "stretch", justifyContent: "center" },
  contextSlot: { height: 16, alignSelf: "stretch", justifyContent: "center", marginBottom: 14 },
  exerciseName: {
    ...executionType.title,
    color: colors.textPrimary,
    textAlign: "center",
  },
  context: { ...type.caption, fontSize: 13, lineHeight: 16, color: executionColors.caption, textAlign: "center" },
  // Contenu de l'anneau (288) : côté centré à 45,5 du haut, chrono centré, objectif et guidage dessous.
  ringContent: { width: 252, height: 288, alignItems: "center" },
  sideSlot: { height: 30, marginTop: 30, justifyContent: "center" },
  timerSlot: { height: 108, marginTop: 31, alignSelf: "stretch", justifyContent: "center" },
  lineSlot: { height: 20, justifyContent: "center" },
  side: { ...executionType.side, color: executionColors.side },
  timer: {
    ...executionType.timer,
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  target: { ...type.label, color: colors.textSecondary },
  guidance: { ...type.label, color: colors.primary },
  // Figma `5041:6048` : fond #F6F6FA, coins supérieurs de 24, 13 sous l'anneau.
  zone: {
    marginTop: 13,
    backgroundColor: executionColors.zone,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 30,
    paddingBottom: spacing[16],
    paddingHorizontal: layout.screenGutter,
  },
  // « Série 2/3 • Tour 1/3 » : texte de gauche aligné à droite jusqu'à 29 du centre, point centré, texte de droite à 29.
  seriesTour: { flexDirection: "row", alignItems: "center", height: 30 },
  seriesTourText: { ...executionType.metric, color: colors.textPrimary, flex: 1 },
  seriesTourDot: { ...executionType.metric, fontFamily: "RobotoCondensed_600SemiBold", fontWeight: "600", width: 58, textAlign: "center", color: colors.textPrimary },
  right: { textAlign: "right" },
  progressTrack: { flexDirection: "row", gap: 3, height: 9, marginTop: 20 },
  progressSegment: { flex: 1, height: 9, borderRadius: 4.5, backgroundColor: executionColors.track, overflow: "hidden" },
  progressFill: { height: 9, borderRadius: 4.5, backgroundColor: executionColors.progress },
  progressCaption: { ...type.caption, fontSize: 10, lineHeight: 12, marginTop: 4, color: executionColors.caption },
  // Figma `4790:6204` : cadre 370 × 132, fond #FAFAFE, rayon 12, 40 sous la légende de la piste.
  card: { marginTop: 40, height: 132, borderRadius: 12, backgroundColor: executionColors.card, paddingLeft: 16, paddingRight: 32, paddingTop: 21 },
  elapsedRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 32, gap: spacing[8] },
  elapsedLabel: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 16, color: colors.textPrimary, marginBottom: 3 },
  elapsedValue: { ...executionType.metric, color: colors.textPrimary, flexShrink: 1, textAlign: "right" },
  cardDivider: { height: 1, backgroundColor: executionColors.track, marginTop: 12 },
  next: { marginTop: 9 },
  nextLabel: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 10, lineHeight: 16, color: colors.primary },
  nextRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 28, gap: spacing[8] },
  nextName: { fontFamily: "RobotoCondensed_600SemiBold", fontWeight: "600", fontSize: 16, lineHeight: 22, color: colors.textSecondary, flexShrink: 1 },
  nextValue: { ...executionType.metric, color: colors.textSecondary, textAlign: "right" },
  saveError: {
    padding: spacing[12],
    backgroundColor: colors.dangerSurface,
    borderRadius: 12,
    marginTop: spacing[8],
  },
  saveErrorText: { ...type.body, color: colors.danger },
  // Barre de commandes : Son (24) 30 Réinitialiser (48) 37 Pause (72) 37 Suivant (48) 30 Voix (24), 24 sous la zone.
  commands: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 72, marginTop: 24, gap: 30 },
  toggle: { width: 24, height: 24 },
  toggleIcon: { width: 24, height: 24 },
  pauseCommand: { marginHorizontal: 7 },
  pauseIcon: { width: 92, height: 92, marginLeft: -10, marginTop: -8 },
  commandDisabled: { opacity: 0.4 },
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
