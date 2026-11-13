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
  type ReactNode,
} from "react";
import {
  Animated,
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
  const [lastShown, setLastShown] = useState<NonNullable<Dialog>>({ kind: "RESET", target: "" });
  // Étape affichée et provenance du dernier changement d'étape (fondus du départ, recette du 13/11/2026).
  const [stepView, setStepView] = useState<StepView>({ step: "", ahead: false, countdown: false, continues: false, fromAhead: false, fromCountdown: false, fromSame: false });
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

  // Recette du 12/11/2026 (Hermann, e1e : « L'annonce doit s'arrêter net à la pause, et reprendre au début lorsqu'on
  // recommence l'exercice »).
  const voiceStatus = useRef<string | null>(null);
  const status = projection?.status ?? null;
  const voiceTarget = typeof projection?.target === "string" ? projection.target : null;
  useEffect(() => {
    const previous = voiceStatus.current;
    voiceStatus.current = status;
    if (previous === "RUNNING" && status === "PAUSED") signals.pauseVoice(voiceTarget);
    else if (previous === "PAUSED" && status === "RUNNING") signals.resumeVoice(voiceTarget);
  }, [status, voiceTarget, signals]);

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
  // Recette du 13/11/2026 (Hermann : « Lors d’une pause ou une pause entre les côtés, retirer le sous-titre, et n’écrire
  // que Pause ») : titre « Pause » pour les deux, sans le nom de l’exercice dessous. [« Pause entre les côtés » — remplacé.]
  const pauseLike = projection.phase === "SERIES_PAUSE" || projection.phase === "SIDE_RECOVERY";
  const title =
    projection.phase === "ACTIVITY"
      ? (projection.exerciseName ?? "")
      : pauseLike
        ? t.phases.SERIES_PAUSE
        : phaseLabel;
  const viewOf = (dialog: NonNullable<Dialog>): DialogView =>
    dialog.kind === "RESET"
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
  // Recette e1 du 12/11/2026 (Hermann, e : « on supprime la fenêtre de dialogue, à la place : le bouton pause se
  // transforme en bouton Démarrer (couleur bleue) ; le bouton réinitialiser se transforme en bouton Arrêt définitif
  // (symbole carré plein blanc sur fond rouge) ; aucun texte explicatif ») : la Pause n'ouvre plus de modale ; seules
  // les confirmations Réinitialiser et Suivant en gardent une. [Modale « Séance en pause » — remplacée.]
  const shownNow: NonNullable<Dialog> | null = dialog;
  const paused = projection.status === "PAUSED";
  // Recette e1 (f : « Au point d'arrêt : le bouton pause doit se transformer en bouton démarrer, appuyer dessus doit
  // relancer l'exercice ») : au Point d'arrêt, Démarrer vaut Continuer.
  const atStopPoint = projection.status === "RUNNING" && projection.phase === "STOP_POINT";
  const stepKey = typeof projection.target === "string" ? projection.target : "";
  const fadingOut = projection.status === "RUNNING" && projection.timer.kind === "COUNTDOWN" && projection.timer.remainingMs <= FADE_OUT_MS;
  // Recette du 12/11/2026 (Hermann, e1f) : au Point d'arrêt, l'écran présente l'exercice qui suit, en attente :
  // chrono à son départ, « Appuyer sur démarrer » en haut de l'anneau, chronomètre de l'attente en bas.
  // [Titre « Point d'arrêt », anneau gris en mouvement — remplacé.]
  const upcoming = projection.upcoming;
  const waiting = atStopPoint && upcoming !== null ? upcoming : null;
  // e1b : pendant le Compte à rebours, Série, Tour et piste de l'exercice à venir, sans progression.
  const ahead = projection.phase === "INITIAL_COUNTDOWN" || waiting !== null ? upcoming : null;
  const series = ahead !== null ? { series: ahead.series, tour: ahead.tour } : { series: projection.series, tour: projection.tour };
  const progress = projection.phase === "INITIAL_COUNTDOWN" ? 0 : projection.progress;
  const shownTitle = waiting !== null ? (waiting.name ?? "") : title;
  // Recette du 13/11/2026 (Hermann : « un cadre gris léger en bas à gauche du cercle pour accueillir le nombre de
  // répétitions s'il existe ; le même cadre à droite pour la charge si elle existe. Pas de cadre si l'information
  // n'existe pas ») : objectif (répétitions, ou À l'échec) et charge sortent du cercle.
  const repetitions = waiting !== null ? null : repetitionsText(projection);
  const shownSide = waiting !== null ? waiting.sideRank : projection.phase === "ACTIVITY" ? projection.sideRank : null;
  const load = waiting !== null || projection.phase !== "ACTIVITY" || projection.loadKg === null ? null : t.load(projection.loadKg);
  if (shownNow !== null && shownNow !== lastShown) setLastShown(shownNow);
  // Recette du 13/11/2026 (Hermann : « Après le compte à rebours, au départ du premier exercice, toutes les informations
  // du cadre (sauf le temps total) disparaissent et réapparaissent. Elles ne doivent pas disparaître. » ; « qu'il n'y ait
  // pas de blanc entre Préparez-vous et le nom de l'exercice qui arrive ») : le cadre montre déjà l'exercice à venir
  // pendant le Compte à rebours et au Point d'arrêt ; il ne s'efface ni ne réapparaît au départ de cet exercice. Le titre
  // « Préparez-vous » s'efface pendant que le nom de l'exercice apparaît (fondu enchaîné).
  const countdownNow = projection.phase === "INITIAL_COUNTDOWN";
  // Recette du 13/11/2026 (Hermann : « Entre deux séries, même côté, les informations à l'intérieur du cercle
  // disparaissent et les nouvelles apparaissent, cela fait un effet flash qu'il faut supprimer, comme pour le nom de
  // l'exercice ») : la Série suivante du même exercice, du même côté et sans Pause entre elles, remplace les textes sur
  // place, sans fondu ; seul l'anneau de couleur s'efface et repart de zéro.
  const continues =
    projection.phase === "ACTIVITY" &&
    projection.next !== null &&
    projection.next.kind === "ACTIVITY" &&
    projection.next.name === projection.exerciseName &&
    projection.next.sideRank === projection.sideRank;
  if (stepView.step !== stepKey)
    setStepView({ step: stepKey, ahead: ahead !== null, countdown: countdownNow, continues, fromAhead: stepView.ahead, fromCountdown: stepView.countdown, fromSame: stepView.continues });
  else if (stepView.ahead !== (ahead !== null) || stepView.countdown !== countdownNow || stepView.continues !== continues)
    setStepView({ ...stepView, ahead: ahead !== null, countdown: countdownNow, continues });
  const textOut = fadingOut && !continues;
  const zoneOut = textOut && ahead === null;
  const titleOut = textOut && !countdownNow;
  const same = stepView.fromSame;
  const dialogView: DialogView | null =
    shownNow === null ? null : viewOf(shownNow);
  // Arrêt définitif : depuis la Pause, ou depuis le Point d'arrêt (suspendu d'abord, l'arrêt n'existant que depuis la
  // Pause).
  const stopSession = async () => {
    if (projection.status === "RUNNING" && typeof projection.target === "string")
      await service.dispatch({ type: "PAUSE", reason: "DIALOG" }, projection.target);
    await service.dispatch({ type: "STOP" });
  };

  // Recette r6 (11/11/2026, Hermann : « Ok, il faudra ensuite se référer à Figma pour la position exacte des différents
  // éléments de l'écran. » ; 12/11/2026 : « Oui pour l'écran d'exécution de séance ») : disposition du Figma
  // `1992:8132` « P-Exécution d'une séance — Démarrée » — titre et ligne de contexte, chrono circulaire (côté en haut
  // de l'anneau), zone « Progression et suite » (Série • Tour, piste par Tours, cadre Temps écoulé / À suivre), barre
  // de commandes à icônes (Son, Réinitialiser, Pause, Suivant, Voix). [Son et Voix en en-tête, commandes en texte,
  // temps total sous les commandes — remplacé.]
  const nextView = waiting !== null ? waiting.after : projection.next;
  const next = nextView === null ? null : nextParts(nextView);
  return (
    <View style={[styles.runningScreen, { paddingTop: insets.top + spacing[4], paddingBottom: Math.max(insets.bottom - 10, spacing[12]) }]} testID="execution-running">
      <ScrollView style={styles.top} contentContainerStyle={styles.content} bounces={false}>
        {/*
          Recette du 11/11/2026 (Hermann, constat) : « Entre deux exercices d'une séance, le chronomètre et les autres
          éléments affichés ne doivent jamais changer de position sur l'écran ». Titre, contexte et côté occupent
          toujours la même hauteur, qu'ils soient affichés ou non.
        */}
        <View style={styles.titleSlot}>
          <Fade stepKey={stepKey} out={titleOut} still={same} style={styles.titleFill}>
            <Text
              style={styles.exerciseName}
              accessibilityRole="header"
              accessibilityLiveRegion="polite"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              testID="execution-title"
            >
              {shownTitle}
            </Text>
          </Fade>
          <Ghost trigger={stepKey} text={stepView.fromCountdown ? t.phases.INITIAL_COUNTDOWN : null} textStyle={styles.exerciseName} />
        </View>
        <Fade stepKey={stepKey} out={textOut} still={same} style={styles.contextSlot}>
          {/* Recette du 13/11/2026 (Hermann : « Positionner l'information de côté sous le nom de l'exercice, qu'on peut
              remonter un peu sur l'écran ») : « Côté 1 » sous le titre. [Côté en haut de l'anneau — remplacé.] */}
          {shownSide !== null ? (
            <Text style={styles.sideLine} numberOfLines={1} testID="execution-side">
              {t.side(shownSide)}
            </Text>
          ) : (
            <Text style={styles.context} numberOfLines={1} testID="execution-context">
              {/* Recette du 12/11/2026 (Hermann : « Retirer le nom de la séance de l’écran ») : la ligne ne montre plus que l’exercice
                  en cours pendant une récupération ; sa place reste réservée. [Nom de la séance — remplacé.] */}
              {projection.phase !== "ACTIVITY" && !pauseLike && waiting === null && projection.exerciseName !== null ? projection.exerciseName : ""}
            </Text>
          )}
        </Fade>
        <View style={styles.ringArea}>
        <ExecutionTimerRing
          motion={ringMotion(
            projection.timer,
            projection.status === "RUNNING",
            projection.phase === "INITIAL_COUNTDOWN" || projection.phase === "SESSION_END" || waiting !== null,
          )}
          // Recette du 13/11/2026 (Hermann : « Après le compte à rebours, au démarrage de l’exercice, le cercle guide de
          // couleur disparaît et réapparaît ») : l’anneau, vide pendant le Compte à rebours, ne s’efface pas à sa fin.
          fading={fadingOut && !countdownNow}
          testID="execution-ring"
        >
          {/*
            Recette du 12/11/2026 (Hermann, e1g : « en haut le guidage : Côté, puis Phase ; en bas les objectifs : nombre
            de répétitions, puis Charge ») ; chaque ligne garde sa place, affichée ou non (positions fixes).
          */}
          <Fade stepKey={stepKey} out={textOut} still={same} style={styles.ringContent}>
            <View style={styles.sideSlot}>
              {waiting !== null ? (
                <Text style={styles.pressStart} numberOfLines={1} testID="execution-press-start">
                  {t.pressStart}
                </Text>
              ) : null}
            </View>
            <View style={styles.phaseSlot}>
              {waiting === null && projection.guidance !== null ? (
                <Text style={styles.guidance} numberOfLines={1} testID="execution-guidance">
                  {projection.guidance.label} · {phaseDuration(projection.guidance.phaseMs)}
                </Text>
              ) : null}
            </View>
            <View style={styles.timerSlot}>
              <Text
                // Recette du 12/11/2026 (Hermann : « le chrono à l’arrêt est en gris, le petit chrono qui tourne est en noir »).
                style={waiting !== null ? [styles.timer, styles.timerWaiting] : styles.timer}
                numberOfLines={1}
                adjustsFontSizeToFit
                accessibilityLabel={waiting !== null ? undefined : timerAccessibility(projection)}
                testID="execution-timer"
              >
                {waiting !== null ? formatClock(waiting.timedMs ?? 0) : timerText(projection)}
              </Text>
            </View>
            <View style={styles.objectiveSlot}>
              {waiting !== null ? (
                <Text style={styles.waitClock} numberOfLines={1} testID="execution-wait">
                  {projection.timer.kind === "STOPWATCH" ? formatClock(projection.timer.elapsedMs) : ""}
                </Text>
              ) : null}
            </View>
            <View style={styles.loadSlot} />
          </Fade>
        </ExecutionTimerRing>
        {repetitions !== null ? (
          <Fade stepKey={stepKey} out={textOut} still={same} style={[styles.pill, styles.pillLeft]}>
            <Text style={styles.pillText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} testID="execution-objective">
              {repetitions}
            </Text>
          </Fade>
        ) : null}
        {load !== null ? (
          <Fade stepKey={stepKey} out={textOut} still={same} style={[styles.pill, styles.pillRight]}>
            <Text style={styles.pillText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} testID="execution-load">
              {load}
            </Text>
          </Fade>
        ) : null}
        </View>
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
        <Fade stepKey={stepKey} out={zoneOut} still={stepView.fromAhead || same} style={styles.seriesTour}>
          {/* Recette du 13/11/2026 (Hermann : « réduire la taille de Série et de Tour, garder la taille des valeurs, et les
              mettre sur deux lignes (texte en haut, valeur en dessous) »). [« Série 1/2 • Tour 1/2 » sur une ligne — remplacé.] */}
          {/* Recette du 13/11/2026 (Hermann : « Centrer Série et Tour sur leur valeur. Mettre un trait vertical blanc de
              séparation à la place du point. Mettre plus d'espace entre le texte et sa valeur. »). */}
          <View style={[styles.seriesTourColumn, styles.seriesTourColumnLeft]}>
            <View style={styles.seriesTourPair}>
              <Text style={styles.seriesTourLabel} numberOfLines={1}>{series.series !== null ? t.series : ""}</Text>
              <Text style={styles.seriesTourText} numberOfLines={1} testID="execution-series">
                {series.series !== null ? `${series.series.current}/${series.series.total}` : ""}
              </Text>
            </View>
          </View>
          <View style={styles.seriesTourDivider}>
            {series.series !== null && series.tour !== null ? <View style={styles.seriesTourLine} /> : null}
          </View>
          <View style={styles.seriesTourColumn}>
            <View style={styles.seriesTourPair}>
              <Text style={styles.seriesTourLabel} numberOfLines={1}>{series.tour !== null ? t.tour : ""}</Text>
              <Text style={styles.seriesTourText} numberOfLines={1} testID="execution-tour">
                {series.tour !== null ? `${series.tour.current}/${series.tour.total}` : ""}
              </Text>
            </View>
          </View>
        </Fade>
        {/* Piste structurée par Tours (Figma « DSF / Controls / Progression par tours », ch10 RM-077 : repères de
            lecture seulement, l'avancement reste global et continu). */}
        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(progress * 100),
          }}
          testID="execution-progress-track"
        >
          {tourSegments({ progress, tour: series.tour }).map((fill, index) => (
            <View key={index} style={styles.progressSegment} testID={`execution-progress-segment-${index}`}>
              <View
                style={[styles.progressFill, { width: `${Math.round(fill * 1000) / 10}%` }]}
                testID={index === 0 ? "execution-progress" : undefined}
              />
            </View>
          ))}
        </View>
        {/* Recette du 12/11/2026 (Hermann, e1-haut h et e1b) : temps total retiré de la ligne Temps écoulé, placé sous
            la piste, à droite, à hauteur de « Tour » ; même taille, un peu plus grande. */}
        <View style={styles.captionRow}>
          <Text style={styles.progressCaption}>{series.tour !== null ? t.tour : ""}</Text>
          <Text style={styles.progressCaption} testID="execution-estimate">{estimateLabel(projection)}</Text>
        </View>
        <View style={styles.cardGap} />
        {/* Figma `4790:6204` « Cadre — Informations secondaires — À suivre + Temps écoulé ». */}
        <View style={styles.card}>
          <View style={styles.elapsedRow}>
            <Text style={styles.elapsedLabel} numberOfLines={1}>{t.elapsed}</Text>
            <Text style={styles.elapsedValue} numberOfLines={1} adjustsFontSizeToFit testID="execution-elapsed">
              {formatClock(projection.sessionElapsedMs)}
            </Text>
          </View>
          <View style={styles.cardDivider} />
          <Fade stepKey={stepKey} out={zoneOut} still={stepView.fromAhead || same} style={styles.next} testID="execution-next">
            <Text style={styles.nextLabel}>{next !== null ? t.next : ""}</Text>
            <View style={styles.nextRow}>
              <Text style={styles.nextName} numberOfLines={1} testID="execution-next-name">
                {next?.name ?? ""}
              </Text>
              <Text style={styles.nextValue} numberOfLines={1} adjustsFontSizeToFit testID="execution-next-value">
                {next?.value ?? ""}
              </Text>
            </View>
          </Fade>
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
        {paused || atStopPoint ? (
          <IconCommand
            label={t.commands.stop}
            icon={ICONS.stop}
            size={48}
            disabled={false}
            onPress={() => void stopSession()}
            testID="execution-stop"
          />
        ) : (
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
        )}
        {paused || atStopPoint ? (
          <IconCommand
            label={paused ? t.commands.resume : t.commands.continue}
            icon={ICONS.start}
            size={72}
            disabled={false}
            onPress={paused ? () => void service.dispatch({ type: "RESUME" }) : onNext}
            style={styles.pauseCommand}
            testID={paused ? "execution-resume" : "execution-continue"}
          />
        ) : (
          <IconCommand
            label={t.commands.pause}
            icon={ICONS.pause}
            size={72}
            shadowed
            disabled={!projection.commands.pause}
            onPress={() =>
              void service.dispatch({ type: "PAUSE", reason: "USER" })
            }
            style={styles.pauseCommand}
            testID="execution-pause"
          />
        )}
        <IconCommand
          label={
            projection.commands.isContinue
              ? t.commands.continue
              : t.commands.next
          }
          icon={ICONS.next}
          size={48}
          // Recette du 12/11/2026 (Hermann, e1f : « le bouton Suivant doit être désactivé » au Point d'arrêt).
          disabled={!projection.commands.next || atStopPoint}
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

/**
 * Recette e1 du 12/11/2026 (Hermann, c : « Disparition et apparition de tous les textes et symboles ou contrôles en
 * fondu moyennement lent. Disparition à la fin du temps / Apparition en début du suivant. ») : les textes d'une étape
 * s'effacent pendant la dernière demi-seconde d'un compte à rebours et apparaissent en fondu au début de l'étape
 * suivante (et à chaque reprise d'une étape réinitialisée). Les positions ne changent pas.
 */
export const FADE_OUT_MS = 500;
const FADE_IN_MS = 500;

function Fade({
  stepKey,
  out,
  still = false,
  style,
  testID,
  children,
}: {
  stepKey: string;
  out: boolean;
  /** Changement d'étape sans fondu : le contenu montrait déjà l'étape qui commence (recette du 13/11/2026). */
  still?: boolean;
  style?: object;
  testID?: string;
  children: ReactNode;
}) {
  const [opacity] = useState(() => new Animated.Value(1));
  const shownKey = useRef(stepKey);
  useEffect(() => {
    if (shownKey.current !== stepKey) {
      shownKey.current = stepKey;
      if (still) {
        opacity.setValue(1);
        return;
      }
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: FADE_IN_MS, useNativeDriver: true }).start();
      return;
    }
    Animated.timing(opacity, { toValue: out ? 0 : 1, duration: out ? FADE_OUT_MS - 50 : FADE_IN_MS, useNativeDriver: true }).start();
  }, [stepKey, out, still, opacity]);
  return (
    <Animated.View style={[style, { opacity }]} testID={testID}>
      {children}
    </Animated.View>
  );
}

/** Fondu enchaîné : l'ancien texte s'efface par-dessus le nouveau, qui apparaît (recette du 13/11/2026). */
function Ghost({ trigger, text, textStyle }: { trigger: string; text: string | null; textStyle: object }) {
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (text === null) return;
    opacity.setValue(1);
    Animated.timing(opacity, { toValue: 0, duration: FADE_IN_MS, useNativeDriver: true }).start();
  }, [trigger, text, opacity]);
  if (text === null) return null;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { justifyContent: "center", opacity }]}>
      <Text style={textStyle} numberOfLines={1}>
        {text}
      </Text>
    </Animated.View>
  );
}

type StepView = { step: string; ahead: boolean; countdown: boolean; continues: boolean; fromAhead: boolean; fromCountdown: boolean; fromSame: boolean };

/** Opacité d'un contenu qui apparaît en fondu à chaque changement de `value` (pas au premier affichage). */
function useFadeIn(value: unknown): Animated.Value {
  const [opacity] = useState(() => new Animated.Value(1));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: FADE_IN_MS, useNativeDriver: true }).start();
  }, [value, opacity]);
  return opacity;
}

/** Durée d'une phase guidée : « 2 s », « 1 min », « 1 min 30 s » (recette e1, d). */
function phaseDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  const rest = seconds % 60;
  return rest === 0 ? `${Math.floor(seconds / 60)} min` : `${Math.floor(seconds / 60)} min ${rest} s`;
}

/** Icônes exportées du Figma `1992:8132` (« Mettre en pause », « Activité suivante », « Réinitialiser la séance —
 * confirmation ») et des composants « DSF / Controls / Son » (`5544:4770`) et « DSF / Controls / Voix » (`5544:4790`). */
const ICONS = {
  pause: require("../../../assets/icons/execution-pause.svg"),
  next: require("../../../assets/icons/execution-suivant.svg"),
  reset: require("../../../assets/icons/execution-reinitialiser.svg"),
  // Recette e1 du 12/11/2026 (Hermann, e) : Démarrer (bleu) et Arrêt définitif (carré plein blanc sur fond rouge).
  start: require("../../../assets/icons/execution-demarrer.svg"),
  stop: require("../../../assets/icons/execution-arret.svg"),
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
  shadowed = false,
  style,
  testID,
}: {
  label: string;
  icon: number;
  size: number;
  disabled: boolean;
  onPress: () => void;
  /** « Mettre en pause » est exporté avec son ombre portée : 92 × 92 pour un bouton de 72 (débord de 10 et 8 à 12). */
  shadowed?: boolean;
  style?: object;
  testID: string;
}) {
  // Recette e1 (c) : un bouton qui en remplace un autre (Pause, Démarrer, Arrêt) apparaît en fondu.
  const opacity = useFadeIn(icon);
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
      <Animated.View style={{ opacity }}>
        <Image
          source={icon}
          style={shadowed ? styles.pauseIcon : { width: size, height: size }}
          contentFit="contain"
        />
      </Animated.View>
    </Pressable>
  );
}

/** « À suivre » : nom (puis Série, recette PRE-10 du 09/11/2026) à gauche, cible ou durée à droite (Figma `4790:6206`, `4790:6207`). */
function nextParts(next: NextView): { readonly name: string; readonly value: string | null } {
  if (next.kind === "STOP_POINT") return { name: t.nextStopPoint, value: null };
  // Recette du 13/11/2026 (Hermann : « Enlever l’information série dans le "À suivre" »). [« Nom · Série n/N » — remplacé.]
  const name = next.kind === "ACTIVITY" ? (next.name ?? "") : t.phases[next.kind];
  if (next.kind === "ACTIVITY" && next.mode === "REPETITIONS" && next.target?.kind === "NUMBER")
    return { name, value: t.repetitions(next.target.value) };
  if (next.kind === "ACTIVITY" && next.target?.kind === "FAILURE") return { name, value: t.failure };
  return { name, value: next.plannedMs !== null ? formatClock(next.plannedMs) : null };
}

function timerText(projection: ExecutionProjection): string {
  // Recette e1 du 12/11/2026 (Hermann, b : « compte à rebours initial : montrer 3, 2, 1 puis ne pas montrer 0 ») :
  // secondes seules, jamais 0. [« 00:03 » … « 00:00 » — remplacé.]
  if (projection.phase === "INITIAL_COUNTDOWN" && projection.timer.kind === "COUNTDOWN")
    return String(Math.max(1, Math.ceil(projection.timer.remainingMs / 1000 - 1e-9)));
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

/** Nombre de répétitions de la Série (ou À l'échec), pour le cadre en bas à gauche du cercle (recette du 13/11/2026). */
function repetitionsText(projection: ExecutionProjection): string | null {
  if (projection.phase !== "ACTIVITY" || projection.seriesTarget === null || projection.mode === "DURATION") return null;
  const target = projection.seriesTarget;
  if (target.kind === "FAILURE") return t.failure;
  return target.kind === "NUMBER" ? t.repetitions(target.value) : null;
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
const executionColors = { side: "#8F8F94", track: "#E0E3E8", progress: "#8283F2", caption: "#7A7A80", zone: "#F6F6FA", card: "#FFFFFF" } as const;
// Recette du 13/11/2026 (Hermann : « Éclaircir le cadre du temps écoulé pour améliorer le contraste ») : cadre blanc sur
// la zone #F6F6FA. [#FAFAFE (Figma) — remplacé.]
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
  // Recette e1 (h : « le bord du cercle tout en bas est rogné par le cadre gris ») : le haut ne rétrécit plus ; c'est
  // l'espace au-dessus du cadre À suivre qui se resserre sur un écran plus petit.
  top: { flexGrow: 0, flexShrink: 0 },
  content: { alignItems: "center", paddingHorizontal: layout.screenGutter },
  // Titre à 20 sous la barre d'état (Figma : 56), contexte dessous (92), anneau à 14 du contexte (122).
  titleFill: { flex: 1, alignSelf: "stretch", justifyContent: "center" },
  // Recette du 13/11/2026 : titre remonté (16 → 8), côté dessous.
  titleSlot: { height: 36, marginTop: spacing[8], alignSelf: "stretch", justifyContent: "center" },
  // Recette du 12/11/2026 (Hermann : « c’est le cercle qu’il faut centrer verticalement ») : le cercle (repères compris)
  // est centré entre le titre et le cadre gris : 16 + 6 au-dessus (ligne de contexte comprise), 22 en dessous.
  // [Contexte à 14 de l’anneau, cadre à 13 — remplacé.]
  // Recette du 13/11/2026 : ligne du côté (24), cercle toujours centré entre le titre et le cadre gris (24 de part et d'autre).
  contextSlot: { height: 24, alignSelf: "stretch", justifyContent: "center", marginBottom: 0 },
  sideLine: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 20, lineHeight: 24, color: executionColors.side, textAlign: "center" },
  ringArea: { alignSelf: "stretch", alignItems: "center" },
  // Cadres gris clair en bas du cercle : répétitions à gauche, charge à droite (recette du 13/11/2026).
  pill: { position: "absolute", bottom: -12, height: 40, minWidth: 64, maxWidth: 92, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#F0F1F5", alignItems: "center", justifyContent: "center" },
  pillLeft: { left: 0 },
  pillRight: { right: 0 },
  pillText: { fontFamily: "RobotoCondensed_700Bold", fontWeight: "700", fontSize: 24, lineHeight: 28, color: colors.textPrimary, textAlign: "center" },
  exerciseName: {
    ...executionType.title,
    color: colors.textPrimary,
    textAlign: "center",
  },
  context: { ...type.caption, fontSize: 13, lineHeight: 16, color: executionColors.caption, textAlign: "center" },
  // Contenu de l'anneau (288) : côté centré à 45,5 du haut, chrono centré, objectif et guidage dessous.
  // Recette e1g : haut — côté (24) puis phase ; chrono ; bas — objectif puis charge, plus grands et écartés du chrono.
  ringContent: { width: 252, height: 288, alignItems: "center" },
  // Recette du 12/11/2026 (Hermann : « Le chrono n'est plus centré verticalement dans son cercle ») : zones symétriques
  // autour du chrono (30 + 30 + 22 + 8 au-dessus, 8 + 26 + 26 + 30 en dessous) → chrono de 90 à 198, centre 144 = 288 / 2.
  sideSlot: { height: 30, marginTop: 30, justifyContent: "center" },
  phaseSlot: { height: 22, justifyContent: "center" },
  timerSlot: { height: 108, marginTop: 8, alignSelf: "stretch", justifyContent: "center" },
  objectiveSlot: { height: 26, marginTop: 8, justifyContent: "center" },
  loadSlot: { height: 26, justifyContent: "center" },
  side: { ...executionType.side, color: executionColors.side },
  timer: {
    ...executionType.timer,
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  objective: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 20, lineHeight: 24, color: colors.textSecondary },
  // Point d'arrêt (e1f) : invitation en bleu, chronomètre de l'attente en noir, chrono à l'arrêt en gris foncé.
  pressStart: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 20, lineHeight: 24, color: colors.primary },
  waitClock: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 20, lineHeight: 24, color: colors.textPrimary, fontVariant: ["tabular-nums"] },
  timerWaiting: { color: "#4A4A50" },
  // Recette du 12/11/2026 (Hermann : « Le texte des phases doit être de la même police que Côté et le reste des textes ») :
  // Roboto Condensed Medium, 18 (hauteur de sa ligne, 22). [Inter Medium 14 — remplacé.]
  guidance: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 18, lineHeight: 22, color: colors.primary },
  // Figma `5041:6048` : fond #F6F6FA, 13 sous l'anneau. Recette e1/e2 du 12/11/2026 (Hermann : « mettre les 4 coins
  // du cadre gris arrondis ; laisser une marge à gauche et à droite entre le fond gris clair et le bord de l'écran »).
  // [Coins supérieurs seuls, pleine largeur — remplacé.]
  zone: {
    marginTop: 24,
    marginHorizontal: layout.screenGutter,
    flexShrink: 1,
    backgroundColor: executionColors.zone,
    borderRadius: 24,
    paddingTop: 30,
    paddingBottom: spacing[16],
    paddingHorizontal: layout.screenGutter,
  },
  // « Série 2/3 • Tour 1/3 » : texte de gauche aligné à droite jusqu'à 29 du centre, point centré, texte de droite à 29.
  // Recette du 13/11/2026 : libellé (16) au-dessus de la valeur (30, inchangée) ; point médian au niveau des valeurs.
  // Recette du 13/11/2026 (Hermann : « Augmenter la taille des valeurs ») : valeurs et point médian 30 → 36.
  // Libellé centré sur sa valeur, 8 au-dessus ; trait vertical blanc entre Série et Tour (recette du 13/11/2026).
  seriesTour: { flexDirection: "row", alignItems: "center", height: 70 },
  seriesTourColumn: { flex: 1, alignItems: "flex-start" },
  seriesTourColumnLeft: { alignItems: "flex-end" },
  seriesTourPair: { alignItems: "center" },
  seriesTourDivider: { width: 58, alignItems: "center", justifyContent: "center" },
  seriesTourLine: { width: 2, height: 52, borderRadius: 1, backgroundColor: "#FFFFFF" },
  seriesTourLabel: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 16, lineHeight: 19, marginBottom: 8, color: executionColors.caption },
  seriesTourText: { ...executionType.metric, fontSize: 36, lineHeight: 43, color: colors.textPrimary },
  right: { textAlign: "right" },
  // Recette du 13/11/2026 (Hermann : « Abaisser la barre de progression ») : 20 → 26 sous les valeurs.
  progressTrack: { flexDirection: "row", gap: 3, height: 9, marginTop: 26 },
  progressSegment: { flex: 1, height: 9, borderRadius: 4.5, backgroundColor: executionColors.track, overflow: "hidden" },
  progressFill: { height: 9, borderRadius: 4.5, backgroundColor: executionColors.progress },
  captionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  progressCaption: { ...type.caption, fontSize: 13, lineHeight: 16, color: executionColors.caption },
  // Figma `4790:6204` : cadre 370 × 132, fond #FAFAFE, rayon 12, 40 sous la légende de la piste.
  // Recette du 12/11/2026 (Hermann : « Abaisser un peu le bord haut du cadre du temps écoulé pour que la marge intérieure
  // en haut soit égale à la marge en bas ») : bord haut abaissé de 8 (cadre 124, marge haute 13), bas inchangé.
  // [Écart 40, cadre 132, marge haute 21 — remplacé.]
  cardGap: { height: 48, minHeight: 12, flexShrink: 1 },
  // Recette du 12/11/2026 (Hermann : « Le temps écoulé, la ligne de séparation et le nombre de répétitions ont plus de
  // marge à droite qu'il n'en a à gauche ») : marges égales. [Marge droite de 32 relevée dans Figma — remplacé.]
  card: { height: 124, borderRadius: 12, backgroundColor: executionColors.card, paddingHorizontal: 16, paddingTop: 13 },
  elapsedRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 32, gap: spacing[8] },
  // Recette du 13/11/2026 (Hermann : « Augmenter un peu la taille de mes trois textes du cadre temps écoulé. Pas les
  // valeurs ») : Temps écoulé 18, À suivre 12, nom suivant 18. [16, 10, 16 — remplacé.]
  elapsedLabel: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 18, color: colors.textPrimary, marginBottom: 3 },
  elapsedValue: { ...executionType.metric, color: colors.textPrimary, flexShrink: 1, textAlign: "right" },
  cardDivider: { height: 1, backgroundColor: executionColors.track, marginTop: 12 },
  next: { marginTop: 9 },
  nextLabel: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 12, lineHeight: 16, color: colors.primary },
  nextRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 28, gap: spacing[8] },
  nextName: { fontFamily: "RobotoCondensed_600SemiBold", fontWeight: "600", fontSize: 18, lineHeight: 24, color: colors.textSecondary, flexShrink: 1 },
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
