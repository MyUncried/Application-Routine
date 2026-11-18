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

import type { Frame } from "@/domain/execution/kernel";
import { AMRAP_PILOT, type AmrapLocal } from "@/domain/execution/policies/amrap";
import { EMOM_PILOT, type EmomLocal } from "@/domain/execution/policies/emom";
import { FOR_TIME_PILOT, type ForTimeLocal } from "@/domain/execution/policies/forTime";
import {
  projectExecution,
  type ExecutionProjection,
  type NextView,
} from "@/domain/execution/projection";
import type { Profile } from "@/domain/preferences/Profile";
import { profileGuidance } from "@/domain/preferences/Profile";
import { parseGuidanceSettings } from "@/domain/preferences/guidanceSettings";
import { effectiveGuidance, type SessionGuidance } from "@/domain/sessions/sessionGuidance";
import { ExecutionCornerBadge } from "@/features/execution/ExecutionCornerBadge";
import { ExecutionClosureSheet } from "@/features/execution/ExecutionClosureSheet";
import { ExecutionEmomBanner } from "@/features/execution/ExecutionEmomBanner";
import { ExecutionTimerRing } from "@/features/execution/ExecutionTimerRing";
import { ExecutionPartialRepetitionsSheet } from "@/features/execution/ExecutionPartialRepetitionsSheet";
import { REST_RING_COLOR, ringColorOf, ringMotion, ringSegmentsOf } from "@/features/execution/timerRing";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import { reclaimExecutionAudio, releaseExecutionAudio } from "@/infrastructure/audio/ExecutionSounds";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";

import { ExecutionDialog } from "./ExecutionDialog";
import {
  ExecutionBlockedError,
  type ActiveExecution,
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
  // Largeur de la zone du cercle, pour les cadres en coin (recette du 13/11/2026).
  const [ringAreaWidth, setRingAreaWidth] = useState<number | null>(null);
  // PRE-11, correction 3 : modale « Répétitions partielles » de l’arrêt d’un For time.
  const [partialOpen, setPartialOpen] = useState(false);
  // Durée tenue relevée à l'ouverture de la modale pendant un exercice en durée (For time, 16/11/2026, règle 6).
  const [partialHeldMs, setPartialHeldMs] = useState<number | null>(null);
  // Recette du 17/11/2026 (ft-arret-serie, ft-arret-duree) : instant de l’appui sur « Arrêt » du For time en cours, retenu
  // comme fin du temps enregistré, la validation pouvant venir plus tard (le chrono continue derrière la modale).
  const [partialStopAtMs, setPartialStopAtMs] = useState<number | null>(null);
  // Exercice et nature de la modale, figés à l'appui : la borne peut ouvrir la Clôture pendant que la modale reste ouverte.
  const [partialOf, setPartialOf] = useState<{ readonly name: string | null; readonly inSeries: boolean; readonly targetText: string | null }>({ name: null, inSeries: false, targetText: null });
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
  // Voile du Point d'arrêt, en fondu (recette du 13/11/2026).
  // Recette du 13/11/2026 (Hermann : « Appliquer ce mécanisme dès qu’on appuie aussi sur le bouton pause pour interrompre un
  // exercice ») : le même voile en Pause (hors Pause des dialogues : Réinitialiser, Arrêt) ; Démarrer et Arrêt au-dessus.
  const veil = useVeil(
    active !== null &&
      ((active.state.status === "RUNNING" && active.state.leaf?.spec.kind === "STOP_POINT") ||
        (active.state.status === "PAUSED" && active.state.pause?.reason !== "DIALOG")),
  );
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
        // Recette du 13/11/2026 (Hermann : « Au point d’arrêt sortir de l’application met la séance en pause ; mais quand on
        // revient on a un écran sans voile et d’autres valeurs, il faut réappuyer sur démarrer pour atteindre le point
        // d’arrêt de nouveau ») : le Point d’arrêt attend déjà ; il n’est pas mis en Pause.
        const leaf = service.current()?.state.leaf?.spec;
        // PRE-11, correction 4 (14/11/2026, modale bloquée) : une saisie de résultat (Clôture) n'est pas mise en Pause — en
        // Pause, sa validation était refusée en silence (le noyau n'accepte SUBMIT qu'en cours) et la feuille masquait
        // Redémarrer et Arrêt : plus aucune sortie. Même traitement que le Point d'arrêt.
        // Registre ch07 (16/11/2026, Hermann : « Le chrono continue », classe A, ch10 « L'Exécution continue à progresser lorsque
        // l'application passe en arrière-plan… ») : pendant le travail d'un For time, aucune mise en Pause ; le temps est
        // recalculé au retour depuis les horodatages (TICK de `onForeground`).
        if (leaf?.kind !== "STOP_POINT" && leaf?.end !== "INTERACTION" && !inForTimeWork(service.current()?.state.frames ?? []))
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

  // Recette du 13/11/2026 : une Exécution retrouvée en Pause sur un Point d’arrêt (Pause d’arrière-plan antérieure,
  // reprise après fermeture) revient à l’attente du Point d’arrêt. L’Arrêt (Pause « dialogue » puis Arrêt) n’est pas visé.
  // PRE-11, correction 4 : de même, une saisie de résultat retrouvée en Pause (Pause d'arrière-plan d'une version antérieure,
  // reprise après fermeture) reprend, pour que sa validation soit acceptée.
  const pausedAtStopPoint =
    active !== null &&
    active.state.status === "PAUSED" &&
    (active.state.leaf?.spec.kind === "STOP_POINT" || active.state.leaf?.spec.end === "INTERACTION") &&
    active.state.pause?.reason !== "DIALOG";
  useEffect(() => {
    if (pausedAtStopPoint) void service.dispatch({ type: "RESUME" }).catch(() => undefined);
  }, [pausedAtStopPoint, service]);

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

  const live = active === null ? null : service.project();
  // Recette du 17/11/2026 (ftr2-modale-borne, Hermann : « Lorsqu'on laisse le temps filer pendant que la modale d'arrêt défile : il faut
  // s'arrêter sur la fin du dernier exercice et ne pas changer d'écran ; il faut aller directement à la synthèse de la séance quand on
  // ferme la modale, ne pas exécuter le compte à rebours de la fin de séance ») : la modale de l'Arrêt ouverte, dès que l'exercice affiché à
  // l'appui se termine (exercice suivant, fin du For time, Durée maximum), l'écran reste figé sur sa dernière image ; hors du travail du For
  // time (fin de séance, élément suivant), la suite est suspendue. La coche arrête la séance (synthèse), au temps de l'appui. [Écran de
  // l'exercice suivant, fenêtre Résultat, puis compte à rebours de la fin — remplacés.]
  // Dernière image de l'étape retenue, relevée à chaque notification du service tant que la modale est ouverte ; au premier changement
  // d'étape, elle devient l'image figée (posée dans la même notification que le nouvel état : aucune image de l'étape suivante ne passe).
  const lastOnStep = useRef<ExecutionProjection | null>(null);
  const [frozenView, setFrozenView] = useState<ExecutionProjection | null>(null);
  // Recette du 18/11/2026 (Hermann, borne pendant un exercice en durée : « il remet le compte à rebours de durée à l'objectif, et
  // remplis l'anneau en vert. Il ne faut pas ») : dernier état du moteur pendant le travail, reprojeté à l'instant de la fin (borne ou
  // fin de l'étape) ; la dernière image notifiée pouvait dater du lancement de la durée. [Dernière image notifiée — remplacé.]
  const lastWork = useRef<ActiveExecution | null>(null);
  const [capView, setCapView] = useState<ExecutionProjection | null>(null);
  useEffect(
    () =>
      service.subscribe(() => {
        const now = service.project();
        if (now === null) return;
        // Recette du 18/11/2026 (Hermann, For time arrêté par la limite de temps pendant un exercice en répétitions : « Je ne veux pas de
        // cet écran résultat à la fin » ; « Je ne veux pas de fin de séance lorsqu'on a validé la modale ») : dernière image du travail du
        // For time, figée dès que la borne ouvre la Clôture, jusqu'à la synthèse. [Écran « Résultat », puis Fin de séance — remplacés.]
        const previous = lastWork.current;
        const active = service.current();
        const endedAtMs = active === null ? null : forTimeWorkEndedAt(active.state.frames);
        const endView = (fallback: ExecutionProjection) =>
          previous === null ? fallback : projectExecution(previous.plan, previous.state, endedAtMs ?? service.now());
        // PRE-11 (T3) : de même à l'échéance d'un bloc AMRAP (arbitrage de Hermann du 18/11/2026 : « écran figé à l'échéance »).
        const nowWork = now.status === "RUNNING" && forTimeLike(now.format?.kind) && now.format?.phase === "WORK";
        if (nowWork) lastWork.current = active;
        if (now.phase === "CLOSURE" && forTimeLike(now.format?.kind) && now.format?.interrupted !== null && now.format?.interrupted !== undefined) {
          if (previous !== null) setCapView((current) => current ?? endView(now));
        } else if (now.phase !== "SESSION_END" && now.status !== "FINISHED") setCapView(null);
        const step = lastOnStep.current;
        if (step === null) return;
        const onStep = nowWork && now.target === step.target;
        if (onStep) lastOnStep.current = now;
        else setFrozenView((current) => current ?? endView(step));
      }),
    [service],
  );
  // Troisième recette du 17/11/2026 (ftr3-modale-duree : à l'issue du temps limite, « Durée retenue […] en fonction du type d'exercice ») :
  // dernier relevé de l'exercice en durée en cours (notification du service), pour la durée tenue jusqu'à la Durée maximum.
  const [durationSample, setDurationSample] = useState<{ readonly heldMs: number; readonly running: boolean; readonly elapsedMs: number } | null>(null);
  useEffect(
    () =>
      service.subscribe(() => {
        const now = service.project();
        const active = now?.format?.phase === "WORK" ? now.format.duration : null;
        if (active === null || active === undefined || active.state === "PENDING") return;
        setDurationSample({ heldMs: Math.max(0, active.totalMs - active.remainingMs), running: active.state === "RUNNING", elapsedMs: now?.format?.elapsedMs ?? 0 });
      }),
    [service],
  );
  const releaseFreeze = () => {
    lastOnStep.current = null;
    setFrozenView(null);
  };
  const liveForTimeWork = live !== null && live.status === "RUNNING" && forTimeLike(live.format?.kind) && live.format?.phase === "WORK";
  const frozen = partialOpen && frozenView !== null && live !== null && live.status !== "FINISHED";
  // Borne atteinte (recette du 18/11/2026) : l'écran reste sur le dernier exercice pendant la Clôture, et pendant la Fin de séance qui suit
  // aussitôt sautée.
  const capFrozen = !frozen && capView !== null && live !== null && live.status !== "FINISHED" && (live.phase === "CLOSURE" || live.phase === "SESSION_END");
  const still = frozen || capFrozen;
  const projection = frozen ? frozenView : capFrozen ? capView : live;
  const liveTarget = typeof live?.target === "string" ? live.target : null;
  const skipSessionEnd = capFrozen && live?.status === "RUNNING" && live.phase === "SESSION_END" && liveTarget !== null;
  useEffect(() => {
    if (!skipSessionEnd || liveTarget === null) return;
    void service.dispatch({ type: "NEXT", validated: true }, liveTarget).catch(() => undefined);
  }, [skipSessionEnd, liveTarget, service]);
  const liveStatus = live?.status ?? null;
  const livePhase = live?.phase ?? null;
  useEffect(() => {
    if (!frozen || liveForTimeWork || liveStatus !== "RUNNING" || livePhase === "CLOSURE") return;
    void service.dispatch({ type: "PAUSE", reason: "DIALOG" }).catch(() => undefined);
  }, [frozen, liveForTimeWork, liveStatus, livePhase, service]);

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

  // Seconde recette du 17/11/2026 (constat b : « Je ne peux plus désactiver le son et les annonces sur l'écran », non reproduit) :
  // chaque appui est tracé dans le journal de développement pour le diagnostic.
  const toggleSound = () => {
    if (__DEV__) console.log(`[guidage] interrupteur Sons : ${soundEnabled ? "coupé" : "activé"}`);
    setSoundChoice(!soundEnabled);
  };
  const toggleVoice = () => {
    if (__DEV__) console.log(`[guidage] interrupteur Voix : ${voiceEnabled ? "coupée" : "activée"}`);
    setVoiceChoice(!voiceEnabled);
  };

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
    const partials = service.partialRepetitions();
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
                {/* Recette du 15/11/2026 (g7) : répétitions saisies pour la série interrompue. */}
                {occurrence.series
                  .flatMap((step) => (partials.has(step.key) ? [partials.get(step.key)!] : []))
                  .map((count) => `· ${t.repetitions(count)} `)
                  .join("")}
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
    projection.phase === "ACTIVITY" || projection.phase === "WINDOW_REST"
      ? (projection.exerciseName ?? "")
      : pauseLike
        ? // Recette du 14/11/2026 : « Changez de côté » au changement de côté ; « Pause » entre les Séries.
          t.phases[projection.phase === "SIDE_RECOVERY" ? "SIDE_RECOVERY" : "SERIES_PAUSE"]
        : phaseLabel;
  const viewOf = (dialog: NonNullable<Dialog>): DialogView =>
    dialog.kind === "RESET"
        ? {
            title: t.resetDialog.title,
            // Recette du 13/11/2026 (Hermann : « supprimer le texte sous le titre de la modale » ; « doubler la hauteur des
            // deux boutons d'action »).
            message: "",
            tallActions: true,
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
  // Recette du 13/11/2026 (Hermann, Réinitialiser : « les boutons d'action ne doivent pas changer ») : la suspension pendant
  // une fenêtre de confirmation (raison DIALOG) ne transforme pas la barre de commandes en Démarrer / Arrêt.
  const paused = projection.status === "PAUSED" && projection.pauseReason !== "DIALOG";
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
  // Recette du 13/11/2026 (Hermann : « Lorsqu'on a atteint une pause, une récupération ou un point d'arrêt, le nombre de
  // séries, de tours et de cycles ne doit pas changer ») : compteurs de l'exercice qui vient de se terminer ; pendant le
  // Compte à rebours initial, ceux de l'exercice à venir. Puis (Hermann, 13/11/2026 : « Pour le point d'arrêt : exercice qui
  // suit. Pour la pause et récupération, l'exercice qui vient de s'exécuter ») : au Point d'arrêt, l'exercice qui suit (e1f).
  const previous = projection.previousCounters ?? null;
  const series =
    ahead !== null
      ? { series: ahead.series, tour: ahead.tour, cycle: ahead.cycle }
      : previous !== null
        ? previous
        : { series: projection.series, tour: projection.tour, cycle: projection.cycle };
  const progress = projection.phase === "INITIAL_COUNTDOWN" ? 0 : projection.progress;
  const shownTitle = waiting !== null ? (waiting.name ?? "") : title;
  // Recette du 13/11/2026 (Hermann : « un cadre gris léger en bas à gauche du cercle pour accueillir le nombre de
  // répétitions s'il existe ; le même cadre à droite pour la charge si elle existe. Pas de cadre si l'information
  // n'existe pas ») : objectif (répétitions, ou À l'échec) et charge sortent du cercle.
  const repetitions = waiting !== null ? null : repetitionsText(projection);
  // PRE-11 (T1) — For time, décision de Hermann du 13/11/2026 (« Temps écoulé. La borne peut apparaître dans le triangle du
  // haut à gauche ») : la borne occupe le coin du haut à gauche pendant le travail ; l'objectif de la Série passe alors
  // sous le chrono, dans le cercle.
  // Registre ch07, « For time — exécution : exercices en durée, « + Tour », sans Pause » (16/11/2026) ; Formats §11.1 : exercice
  // en durée du tour (à lancer, en cours, retenu). En cours ou retenu, son compte à rebours prend le coin du haut à gauche
  // (« une seule forme d'angle ») : la borne n'y est pas affichée pendant la durée (à confirmer, voir le rapport).
  // PRE-11 (T3) : un bloc AMRAP a l'écran du For time (barre, + Tour / Suivant, exercices en durée), son grand chrono décompte le bloc.
  const forTimeWork = forTimeLike(projection.format?.kind) && projection.format?.phase === "WORK";
  // PRE-11 (T2) — EMOM (Figma `8982:15709`) : grand chrono = temps restant de la fenêtre ; une Série en Durée a son compte à rebours
  // dans le coin du bas à gauche, comme le For time.
  const emomView = projection.format?.kind === "EMOM" ? projection.format.emom : null;
  const emomWork = emomView !== null && projection.format?.phase === "WORK";
  const duration = (forTimeWork || emomWork) && waiting === null ? (projection.format?.duration ?? null) : null;
  const durationActive = duration !== null && duration.state !== "PENDING" ? duration : null;
  const forTimeCap =
    waiting === null && projection.format?.kind === "FOR_TIME" && projection.format.phase === "WORK" && projection.format.capMs !== null ? projection.format.capMs : null;
  const autoCount = waiting !== null || projection.guidance === null ? null : projection.autoRepetitions;
  // Recette du 15/11/2026 (Hermann, g3 : « L’objectif de la série doit passer dans le triangle du bas à droite ») : avec la borne,
  // l'objectif occupe le coin du bas à droite (sauf compteur « mouv. » déjà posé là). [Sous le chrono, dans le cercle — remplacé.]
  const objectiveCorner = forTimeCap !== null && repetitions !== null && autoCount === null ? repetitions : null;
  // Recette du 13/11/2026 (Hermann : « Lorsque le compteur de mouvement dépasse l'objectif du nombre de répétitions faire
  // passer la couleur de fond du mouvement en vert ») : vert dès que l'objectif est atteint.
  const goalReps = projection.seriesTarget !== null && projection.seriesTarget.kind === "NUMBER" ? projection.seriesTarget.value : null;
  const goalReached = autoCount !== null && autoCount !== undefined && goalReps !== null && autoCount >= goalReps;
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
  // Recette du 17/11/2026 (Hermann : « À chaque exercice, certains triangles disparaissent et réapparaissent alors que seule une information
  // remplace l'autre ») : en For time, les triangles (objectif, charge) et le contenu du cercle changent de valeur sur place, sans fondu
  // (`forTimeBar` sur leurs `Fade`). [Fondu à chaque étape — remplacé pour le For time.]
  // Recette du 13/11/2026 (Hermann : « Au passage entre les pauses et les exercices, les données à l’intérieur du grand
  // cadre disparaissent et réapparaissent. Il ne faut pas. ») : la zone du bas ne s’efface plus à aucun changement d’étape ;
  // ses valeurs changent sur place. [Fondus de la zone, sauf départ et Série suivante — remplacé.]
  const titleOut = textOut && !countdownNow;
  const same = stepView.fromSame;
  const dialogView: DialogView | null =
    shownNow === null ? null : viewOf(shownNow);
  // Arrêt définitif : depuis la Pause, ou depuis le Point d'arrêt (suspendu d'abord, l'arrêt n'existant que depuis la
  // Pause).
  // For time en cours (16/11/2026) : « Arrêt » sans Pause préalable, le chrono continue derrière la modale.
  const forTimeRunning = forTimeWork && projection.status === "RUNNING" && !atStopPoint;
  // PRE-11 (T2), arbitrage de Hermann du 18/11/2026 (« Comme le For time ») : Arrêt sans Pause, chrono qui continue derrière la feuille.
  const emomRunning = emomWork && projection.status === "RUNNING";
  const emomBar = projection.format?.kind === "EMOM";
  const stopSession = async (payload?: { readonly partialRepetitions: number | null; readonly partialDurationMs?: number | null }, stopAtMs?: number | null) => {
    // Arrêt daté de l'appui (For time) : aucune Pause, y compris si la borne a ouvert la Clôture depuis (seconde recette du 17/11/2026).
    const dated = (forTimeBar || emomBar) && typeof stopAtMs === "number";
    if (projection.status === "RUNNING" && typeof projection.target === "string" && !forTimeRunning && !emomRunning && !dated)
      await service.dispatch({ type: "PAUSE", reason: "DIALOG" }, projection.target);
    const at = (forTimeRunning || emomRunning || dated) && typeof stopAtMs === "number" ? { atMs: stopAtMs } : {};
    await service.dispatch(payload === undefined ? { type: "STOP", ...at } : { type: "STOP", payload, ...at });
  };
  // PRE-11, corrections 3 et 4 de Hermann du 14/11/2026 : barre propre au For time — en cours, Réinitialiser inactif (48),
  // Pause orange (56), ✓ bleu (72) qui valide l'étape sans saisie ; en Pause, Arrêt rouge (48), Redémarrer bleu (72), ✓ grisé
  // inactif (48). L'Arrêt ouvre d'abord la modale « Répétitions partielles » ; sa croix revient à la Pause.
  const forTimeBar = forTimeLike(projection.format?.kind);
  const amrapBar = projection.format?.kind === "AMRAP";
  const forTimeRing =
    projection.format?.kind === "FOR_TIME" && projection.timer.kind === "STOPWATCH"
      ? ringSegmentsOf(projection.format.phaseStarts.map((start) => ({ atMs: start.atMs, color: ringColorOf(start.kind) })), projection.timer.elapsedMs).past
      : null;
  const forTimeFinal = projection.format?.kind === "FOR_TIME" && projection.format.phase === "CLOSURE" && projection.timer.kind === "STOPWATCH";
  // PRE-11 (T2) : la portion de la fenêtre déjà travaillée garde la couleur du travail ; le repos avance en orange (Figma `8982:15709`).
  const emomRing =
    emomView !== null && emomView.resting && emomView.workEndedMs !== null && emomView.windowMs > 0
      ? [{ from: 0, to: Math.min(1, emomView.workEndedMs / emomView.windowMs), color: ringColorOf("ACTIVITY") }]
      : null;
  const ringSegments = forTimeRing ?? emomRing;
  // Pas de fondu des textes en For time ni en EMOM : seules les valeurs changent.
  const steadyFormat = forTimeBar || emomBar;
  // Bouton de droite de l'EMOM : « Suivant » (travail de la fenêtre terminé, FMT-24), actif pendant une Série en Répétitions.
  const emomNextEnabled = emomRunning && projection.phase === "ACTIVITY" && durationActive === null && projection.commands.next;
  const inSeries = projection.phase === "ACTIVITY" && projection.mode === "REPETITIONS";
  const onStop = () => {
    // Recette du 14/11/2026 (Hermann, arrêt entre deux séries : « Supprimer cette modale, l’arrêt pendant la pause amène
    // directement à l’écran de fin de séance ») : la modale des répétitions partielles ne s'ouvre que pendant une série en
    // Répétitions. [Modale « Aucune série en cours » — remplacée.]
    // Mission du 16/11/2026, règle 6 : pendant une durée, la modale s'ouvre aussi et propose la durée tenue (relevée ici).
    if ((forTimeBar || emomBar) && !atStopPoint && durationActive !== null) {
      // Lecture fraîche à l'instant de l'appui (l'affichage peut dater d'un rafraîchissement).
      // Recette du 17/11/2026 (ftr2-modale-duree, Hermann : « il faut remettre la modale d'arrêt de confirmation de la durée retenue » ;
      // autres remarques, b : « En durée : Le titre : "Durée tenue" ; Une seule ligne avec le nom de l'exercice, et la durée ; boutons
      // annuler et valider »). [Arrêt sans modale (demande du même jour) — remplacé.]
      const now = service.project()?.format?.duration ?? durationActive;
      setPartialHeldMs(Math.max(0, now.totalMs - now.remainingMs));
      setPartialStopAtMs(service.now());
      lastOnStep.current = projection;
      setPartialOf({ name: projection.exerciseName, inSeries: false, targetText: formatClock(now.totalMs) });
      setPartialOpen(true);
    } else if ((forTimeBar || emomBar) && !atStopPoint && inSeries) {
      setPartialHeldMs(null);
      setPartialStopAtMs(forTimeRunning || emomRunning ? service.now() : null);
      if (forTimeRunning) lastOnStep.current = projection;
      setPartialOf({ name: projection.exerciseName, inSeries: true, targetText: projection.seriesTarget?.kind === "NUMBER" ? t.stopRepetitions(projection.seriesTarget.value) : null });
      setPartialOpen(true);
    } else void stopSession();
  };
  const onValidate = () => {
    if (typeof projection.target === "string") void service.dispatch({ type: "NEXT", validated: true }, projection.target);
  };
  // Recette du 17/11/2026 : « Suivant » (buy-in, buy-out, exercice de la boucle avant le dernier du tour), « + Tour » (dernier
  // exercice du tour) ou Succès (dernier exercice du For time).
  const forTimeCommand = forTimeWork ? (projection.format?.command ?? null) : null;
  // Mission du 17/11/2026 (Hermann, « Bouton de droite, par ordre de priorité ») : actif pendant un exercice en répétitions,
  // inactif pendant un exercice en durée (il se termine à son terme). Avant un exercice en durée, « Suivant » le lance, « comme
  // un appui sur le cercle ». [Inactif tant qu'un exercice en durée du tour reste à lancer — remplacé.]
  const plusTourEnabled = forTimeRunning && durationActive === null && forTimeCommand?.duration !== true && projection.commands.next;
  const onPlusTour = () => {
    if (typeof projection.target === "string") void service.dispatch({ type: "NEXT", validated: true, advance: "ROUND" }, projection.target);
  };
  const onForTimeNext = () => {
    if (typeof projection.target !== "string") return;
    if (duration?.state === "PENDING") void service.dispatch({ type: "NEXT", validated: true, advance: "DURATION" }, projection.target);
    else if (forTimeCommand?.advance === "ROUND") onPlusTour();
    else onValidate();
  };
  // Appui dans la zone du haut : lancer l'exercice en durée (après une Série en répétitions), le retenir, le reprendre.
  // Recette du 17/11/2026 (ftr2-regle-suivant, Hermann : « désactiver l'appui sur le cercle lorsque rien n'est écrit ») : le cercle ne
  // réagit que pendant la durée (pause, reprise) ; l'exercice en durée se lance par « Suivant ». [Lancement par l'appui dans le cercle —
  // remplacé.]
  const onDurationZone =
    forTimeRunning && durationActive !== null && typeof projection.target === "string"
      ? () => {
          const step = typeof projection.target === "string" ? projection.target : undefined;
          void service.dispatch({ type: durationActive.state === "RUNNING" ? "HOLD" : "RELEASE" }, step);
        }
      : null;
  const durationMention =
    !forTimeWork || waiting !== null || forTimeFinal
      ? null
      : duration === null
        ? // Mission du 17/11/2026 (Hermann : « aucun texte dans les autres cas »). [« Appuyez à chaque tour terminé » — remplacé.]
          null
        : duration.state === "PENDING"
          ? // Recette du 17/11/2026 (Hermann : « Supprimer le texte "Appuyer pour lancer..." un exercice, ne conserver que les texte de pause
            // et de redémarrage »). [« Appuyez pour lancer <exercice> » — remplacé ; reste le libellé d'accessibilité de la zone.]
            null
          : duration.state === "RUNNING"
            ? { lines: t.pressToHold, color: MENTION.running }
            : { lines: t.pressToRelease, color: MENTION.held };
  // Mission du 17/11/2026 (Hermann : « Fond blanc par défaut, vert quand l'exercice en durée court, orange quand son compte à rebours
  // est en pause ; jamais gris »). [Gris en attente du lancement — remplacé.]
  const circleFill = !forTimeWork || durationActive === null || durationActive.state === "PENDING" ? undefined : DURATION_FILL[durationActive.state];

  // Recette r6 (11/11/2026, Hermann : « Ok, il faudra ensuite se référer à Figma pour la position exacte des différents
  // éléments de l'écran. » ; 12/11/2026 : « Oui pour l'écran d'exécution de séance ») : disposition du Figma
  // `1992:8132` « P-Exécution d'une séance — Démarrée » — titre et ligne de contexte, chrono circulaire (côté en haut
  // de l'anneau), zone « Progression et suite » (Série • Tour, piste par Tours, cadre Temps écoulé / À suivre), barre
  // de commandes à icônes (Son, Réinitialiser, Pause, Suivant, Voix). [Son et Voix en en-tête, commandes en texte,
  // temps total sous les commandes — remplacé.]
  // Seconde recette du 17/11/2026 (Hermann : « Pendant le compte à rebours initial, le contenu du cadre gris (séries / tours, doit être
  // déjà préparé pour l'exercice suivant. dans ce cas "Buy In" doit être affiché ») : partie de l'exercice à venir.
  const shownSegment = ahead !== null ? (ahead.segment ?? null) : (forTimeCommand?.segment ?? null);
  const nextView = waiting !== null ? waiting.after : projection.next;
  const next = nextView === null ? null : nextParts(nextView);
  return (
    <View style={[styles.runningScreen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom - 16, spacing[8]) }]} testID="execution-running">
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
          {/* Recette du 13/11/2026 (Hermann : « Côté 1 peut retourner dans le cercle en haut et la phase dans le cercle en
              bas ») : la ligne sous le titre ne porte plus le côté. [« Côté n » sous le titre — remplacé.] */}
          {(
            <Text style={styles.context} numberOfLines={1} testID="execution-context">
              {/* Recette du 12/11/2026 (Hermann : « Retirer le nom de la séance de l’écran ») : la ligne ne montre plus que l’exercice
                  en cours pendant une récupération ; sa place reste réservée. [Nom de la séance — remplacé.] */}
              {projection.phase !== "ACTIVITY" && projection.phase !== "WINDOW_REST" && !pauseLike && waiting === null && projection.exerciseName !== null ? projection.exerciseName : ""}
            </Text>
          )}
        </Fade>
        {/* For time (Formats §11.1) : « Appuyer dans la zone du haut lance l’exercice en durée […], le met en pause, puis le
            reprend » ; zone inerte sans exercice en durée à lancer ou en cours. */}
        <View style={styles.ringArea} testID="execution-ring-area" onLayout={(event) => setRingAreaWidth(event.nativeEvent.layout.width)}>
        <ExecutionTimerRing
          fill={circleFill}
          inner={
            durationActive === null || durationActive.totalMs <= 0
              ? null
              : { fraction: durationActive.remainingMs / durationActive.totalMs, ratePerMs: durationActive.state === "RUNNING" && !still ? 1 / durationActive.totalMs : 0 }
          }
          motion={ringMotion(
            projection.timer,
            // Troisième recette du 17/11/2026 (ftr3-modale-figee, Hermann : « A l'issue du temps limite, le cercle doit s'arrêter de tourner avec le chronomètre » ; « figer l'écran au dernier exercice exécuté (chronomètre, compte à rebours, anneau...), ne jamais exécuter le compte à rebours de la fin de séance (ne pas afficher l'écran), l'appuie sur la croix amène directement à l'écran de synthèse de la séance ») : écran figé, anneau arrêté avec le chrono.
            projection.status === "RUNNING" && !forTimeFinal && !still && projection.phase !== "CLOSURE",
            projection.phase === "INITIAL_COUNTDOWN" ||
              projection.phase === "SESSION_END" ||
              waiting !== null ||
              // Recette du 17/11/2026 (Hermann, constat c : « pendant la durée de changement de côté, ne pas faire tourner le
              // cercle ») ; hors For time, dont l'anneau porte le chrono global qui continue.
              // PRE-11 (T2) : en EMOM non plus — l'anneau porte la fenêtre, qui continue.
              (projection.phase === "SIDE_RECOVERY" && projection.format === null),
          )}
          // Recette du 13/11/2026 (Hermann : « Après le compte à rebours, au démarrage de l’exercice, le cercle guide de
          // couleur disparaît et réapparaît ») : l’anneau, vide pendant le Compte à rebours, ne s’efface pas à sa fin.
          fading={fadingOut && !countdownNow && !emomBar}
          // Recette du 17/11/2026 (Hermann : « À chaque transition d'exercice le chronomètre disparaît et réapparaît. Cela ne doit pas arriver […] ne disparaît jamais. Ne pas changer la couleur de l'anneau lorsqu'on passe en exercice en durée, ni celle du chronomètre. ») : même anneau pendant un exercice en durée. [Anneau estompé gris (Figma `12514:27223`, puis #D6DAE1) — remplacé.]
          color={ringColorOf(projection.phase)}
          // PRE-11, précision FT-15 (14/11/2026) : For time, anneau bicolore — chaque portion de la minute garde la couleur de sa
          // phase ; seule la portion en cours prend la couleur de la phase en cours (et la pastille).
          {...(ringSegments !== null ? { segments: ringSegments } : {})}
          testID="execution-ring"
        >
          {/*
            Recette du 12/11/2026 (Hermann, e1g : « en haut le guidage : Côté, puis Phase ; en bas les objectifs : nombre
            de répétitions, puis Charge ») ; chaque ligne garde sa place, affichée ou non (positions fixes).
          */}
          {/* Recette du 17/11/2026 (Hermann : « À chaque transition d'exercice le chronomètre disparaît et réapparaît. Cela ne doit pas arriver […] ne disparaît jamais. Ne pas changer la couleur de l'anneau lorsqu'on passe en exercice en durée, ni celle du chronomètre. ») : en For time, le grand chrono (temps global) ne s'efface jamais entre deux exercices. [Fondu à chaque étape — remplacé
              pour le For time.] */}
          {/* Recette du 17/11/2026 (Hermann : « Exercice libre, le chronomètre disparaît et réapparaît lorsqu'on passe d'un exercice à une
              pause et vice versa, éviter cela ») : le grand chrono n'a plus de fondu, dans toute séance ; seuls le côté (en haut) et la ligne
              du bas (phase guidée, mention) gardent le leur, hors For time. [Fondu de tout le contenu du cercle à chaque étape — remplacé.] */}
          <View style={styles.ringContent}>
            <Fade stepKey={stepKey} out={textOut && !steadyFormat} still={same || steadyFormat} style={styles.sideSlot}>
              {waiting !== null ? null : shownSide !== null ? (
                // Recette du 13/11/2026 : suffixe ordinal en exposant (« 1er », « 2d »), aligné en haut du rang.
                <View style={styles.sideRow} accessible accessibilityLabel={t.side(shownSide).spoken} testID="execution-side">
                  <Text style={styles.side}>{t.side(shownSide).rank}</Text>
                  <Text style={[styles.side, styles.sideSuffix]}>{t.side(shownSide).suffix}</Text>
                  <Text style={styles.side}>{` ${t.side(shownSide).label}`}</Text>
                </View>
              ) : null}
            </Fade>
            <View style={styles.phaseSlot}>
              {/* PRE-11 (T2) : « Repos » dans le cercle, en orange, une fois le travail de la fenêtre terminé (Figma `8982:15709`). */}
              {emomView?.resting === true ? (
                <Text style={[styles.guidance, styles.emomRest]} numberOfLines={1} testID="execution-emom-rest">
                  {t.phases.WINDOW_REST}
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
            <Fade stepKey={stepKey} out={textOut && !steadyFormat} still={same || steadyFormat} style={styles.objectiveSlot}>
              {forTimeFinal ? (
                <Text style={styles.guidance} numberOfLines={1} testID="execution-final-time">
                  {t.forTimeFinal}
                </Text>
              ) : waiting !== null ? null : projection.guidance !== null ? (
                <Text style={styles.guidance} numberOfLines={1} testID="execution-guidance">
                  {projection.guidance.label} · {phaseDuration(projection.guidance.phaseMs)}
                </Text>
              ) : durationMention !== null ? (
                // Recette du 17/11/2026 (ft-lancer, ft-encours : « affiche seulement Appuyez ») : la case de 30 ne laissait mesurer
                // qu'une ligne ; la mention se pose en haut de la case, sans contrainte de hauteur, sur ses deux lignes.
                <View style={styles.mentionLayer}>
                  <Text style={[styles.mention, { color: durationMention.color }]} numberOfLines={2} testID="execution-duration-mention">
                    {durationMention.lines.join("\n")}
                  </Text>
                </View>
              ) : null}
            </Fade>
            <View style={styles.loadSlot} />
          </View>
        </ExecutionTimerRing>
        {/* Recette du 13/11/2026 (Hermann : cadres en coin « dans l'esprit Apple Watch ») : voir ExecutionCornerBadge.
            [Cadres rectangulaires — remplacé.] */}
        {durationActive !== null && ringAreaWidth !== null ? (
          // Formats §11.1 : compte à rebours de l’exercice dans une forme d’angle, vert en cours, orange retenu (Figma « Décompte —
          // durée »). Recette du 17/11/2026 (ft-borne : « laisser la durée max en haut à gauche, et positionner la durée des comptes
          // à rebours en bas à gauche (tout le temps, avec un temps max ou sans) »). [Coin du haut à gauche, à la place de
          // l’objectif et de la borne — remplacé.]
          <View style={styles.badgeLayer}>
            <ExecutionCornerBadge
              side="left"
              vertical="bottom"
              areaWidth={ringAreaWidth}
              color={durationActive.state === "RUNNING" ? DURATION_BADGE.running : DURATION_BADGE.held}
              // Troisième recette du 17/11/2026 (Hermann, autres remarques, d : « pendant le compte à rebours du For Time en durée (3 secondes), faire clignoter le triangle du compte à rebours à chaque seconde (vert actuel > vert plus foncé > vert actuel) »).
              pulse={
                durationActive.state === "RUNNING" && !still && durationActive.remainingMs > 0 && durationActive.remainingMs <= 3000
                  ? { key: Math.ceil(durationActive.remainingMs / 1000), color: DURATION_BADGE.pulse }
                  : null
              }
            >
              {/* Recette du 17/11/2026 (autres remarques, c : « compte à rebours de la durée dans le triangle : mettre le texte en vert et en
                  orange (même couleur que le texte central) »). [Gris des triangles — remplacé.] */}
              <Text style={[styles.pillText, { color: durationActive.state === "RUNNING" ? MENTION.running : MENTION.held }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} testID="execution-duration-countdown">
                {formatClock(durationActive.remainingMs, true)}
              </Text>
            </ExecutionCornerBadge>
          </View>
        ) : null}
        {forTimeCap !== null && ringAreaWidth !== null ? (
          <View style={styles.badgeLayer}>
            <ExecutionCornerBadge side="left" areaWidth={ringAreaWidth}>
              {/* Recette du 14/11/2026 (Hermann : « Mettre la Durée maximum sur deux lignes à l’écran : ligne du haut : la durée ;
                  ligne du bas : « max ». Respecter les tailles de polices comme pour les autres textes des triangles ») : même
                  disposition que le compteur « mouv. ». [« 1:00 max » sur une ligne — remplacé.] */}
              <View style={styles.capLines} testID="execution-cap">
                {/* Seconde recette du 17/11/2026 (Hermann : « utiliser le format 00:00 pour toutes les durées »). [« 1′00″ » (ft-k8,
                    15/11/2026) — remplacé.] */}
                <Text style={styles.pillText} numberOfLines={1} testID="execution-cap-value">
                  {formatClock(forTimeCap)}
                </Text>
                <Text style={[styles.pillText, styles.autoCountUnit]} numberOfLines={1}>
                  {t.capUnit}
                </Text>
              </View>
            </ExecutionCornerBadge>
          </View>
        ) : repetitions !== null && ringAreaWidth !== null ? (
          <Fade stepKey={stepKey} out={textOut && !steadyFormat} still={same || steadyFormat} style={styles.badgeLayer}>
            <ExecutionCornerBadge side="left" areaWidth={ringAreaWidth}>
              <CornerValue text={repetitions} align="left" testID="execution-objective" />
            </ExecutionCornerBadge>
          </Fade>
        ) : null}
        {/* Recette du 13/11/2026 (Hermann : « on peut ajouter un compteur automatique dans ce cas puisqu'on est supposé
            suivre ce guidage. Il serait posé dans un triangle en bas à droite. ») : répétitions faites d'après les phases. */}
        {autoCount !== null && ringAreaWidth !== null ? (
          <View style={styles.badgeLayer}>
            <ExecutionCornerBadge side="right" vertical="bottom" areaWidth={ringAreaWidth} color={goalReached ? GOAL_GREEN : undefined}>
              {/* Recette du 13/11/2026 (Hermann : « Il faut écrire 2 tours dans le triangle, éventuellement sur deux lignes, 2
                  au-dessus »). [Nombre seul — remplacé.] */}
              <View style={styles.autoCount}>
                <Text style={[styles.pillText, goalReached ? styles.goalText : null]} numberOfLines={1} testID="execution-auto-count">
                  {autoCount}
                </Text>
                {/* « mouv. » (Hermann, 13/11/2026), à la taille de « rép. » et « kg ». [« tours », « mouvements » — remplacés.] */}
                <Text style={[styles.pillText, styles.autoCountUnit, goalReached ? styles.goalText : null]} numberOfLines={1}>
                  {t.movements()}
                </Text>
              </View>
            </ExecutionCornerBadge>
          </View>
        ) : null}
        {objectiveCorner !== null && ringAreaWidth !== null ? (
          <Fade stepKey={stepKey} out={textOut && !steadyFormat} still={same || steadyFormat} style={styles.badgeLayer}>
            <ExecutionCornerBadge side="right" vertical="bottom" areaWidth={ringAreaWidth}>
              <CornerValue text={objectiveCorner} align="right" testID="execution-objective" />
            </ExecutionCornerBadge>
          </Fade>
        ) : null}
        {load !== null && ringAreaWidth !== null ? (
          <Fade stepKey={stepKey} out={textOut && !steadyFormat} still={same || steadyFormat} style={styles.badgeLayer}>
            <ExecutionCornerBadge side="right" areaWidth={ringAreaWidth}>
              <CornerValue text={load} align="right" testID="execution-load" />
            </ExecutionCornerBadge>
          </Fade>
        ) : null}
        {onDurationZone !== null ? (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onDurationZone}
            accessibilityRole="button"
            accessibilityLabel={durationMention?.lines.join(" ")}
            testID="execution-duration-zone"
          />
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
        <Fade stepKey={stepKey} out={false} still style={styles.seriesTour}>
          {/* Recette du 13/11/2026 (Hermann : « réduire la taille de Série et de Tour, garder la taille des valeurs, et les
              mettre sur deux lignes (texte en haut, valeur en dessous) »). [« Série 1/2 • Tour 1/2 » sur une ligne — remplacé.] */}
          {/* Recette du 13/11/2026 (Hermann : « Centrer Série et Tour sur leur valeur. Mettre un trait vertical blanc de
              séparation à la place du point. Mettre plus d'espace entre le texte et sa valeur. »). */}
          {/* Recette du 13/11/2026 (Hermann : « Il faut ajouter le cycle et donc séparer le cadre en trois. Lorsqu'il n'y a pas
              de cycle / tour / série, alors le texte et les valeurs sont écrits en gris ») : Série | Tour | Cycle, toujours
              affichés ; sans valeur, libellé et « – » en gris clair. [Série et Tour seuls, masqués sans valeur — remplacé.] */}
          <Counter label={t.series} value={series.series} testID="execution-series" />
          <View style={styles.seriesTourDivider}>
            <View style={styles.seriesTourLine} />
          </View>
          {/* Recette du 17/11/2026 (ft-barre : « Pendant le Buy-In, "Buy In" doit être écrit sur l'écran (voir Figma) ») : sous
              « Tour », la pastille « Buy-in ✓ » remplace la valeur (Figma `12512:27117`) ; « Buy-out ✓ » de même. */}
          <Counter
            label={t.tour}
            value={series.tour}
            badge={shownSegment === "BUY_IN" ? t.buyInBadge : shownSegment === "BUY_OUT" ? t.buyOutBadge : null}
            testID="execution-tour"
          />
          <View style={styles.seriesTourDivider}>
            <View style={styles.seriesTourLine} />
          </View>
          <Counter label={t.cycle} value={series.cycle} testID="execution-cycle" />
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
          <Fade stepKey={stepKey} out={false} still style={styles.next} testID="execution-next">
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

      {/*
        Recette du 13/11/2026 (Hermann : « Au point d'arrêt : texte Appuyer sur démarrer sur deux lignes ; voile orange sur
        tout l'écran sauf le texte Appuyer, le bouton démarrer et le bouton arrêt ») : voile au-dessus du haut de l'écran et
        de la zone du bas ; la barre de commandes a son propre voile, sous Démarrer et Arrêt. L'invitation est dessinée
        au-dessus du voile, à la place qu'elle occupait en haut de l'anneau.
      */}
      {/* Recette du 13/11/2026 (Hermann : « Le voile apparaît en fondu rapide, et disparaît de la même manière quand on
          appuie sur un bouton. Le chronomètre qui tourne doit aussi être dessus. ») */}
      {veil.mounted ? (
        <Animated.View pointerEvents="none" style={[styles.veil, { opacity: veil.opacity, bottom: Math.max(insets.bottom - 16, spacing[8]) + COMMANDS_HEIGHT }]} testID="execution-stop-veil" />
      ) : null}
      {atStopPoint ? (
        <>
          <View pointerEvents="none" style={[styles.pressStartLayer, { top: insets.top + PRESS_START_TOP }]}>
            <Text style={styles.pressStart} numberOfLines={2} testID="execution-press-start">
              {t.pressStartLines}
            </Text>
          </View>
          <View pointerEvents="none" style={[styles.waitLayer, { top: insets.top + WAIT_CLOCK_TOP }]}>
            <Text style={styles.waitClock} numberOfLines={1} testID="execution-wait">
              {projection.timer.kind === "STOPWATCH" ? formatClock(projection.timer.elapsedMs) : ""}
            </Text>
          </View>
        </>
      ) : null}

      {/* PRE-11 (T2, Q1) : bandeau non bloquant d'une fenêtre EMOM non terminée, au-dessus de la barre de commandes. */}
      {emomRunning && emomView?.banner !== null && emomView?.banner !== undefined && !partialOpen ? (
        <View style={[styles.emomBannerLayer, { bottom: Math.max(insets.bottom - 16, spacing[8]) + COMMANDS_HEIGHT + spacing[8] }]} pointerEvents="box-none">
          <ExecutionEmomBanner
            key={emomView.banner.window}
            window={emomView.banner.window}
            onDeclare={(partialRepetitions) => void service.dispatch({ type: "DECLARE", payload: { window: emomView.banner?.window, partialRepetitions } })}
            onSkip={() => void service.dispatch({ type: "DECLARE", payload: { window: emomView.banner?.window, skip: true } })}
          />
        </View>
      ) : null}

      {/* Barre de commandes du Figma `1992:8132` : Son, Réinitialiser, Mettre en pause, Activité suivante, Voix. */}
      <View style={[styles.commands, veil.mounted ? styles.commandsAboveVeil : null]}>
        {veil.mounted ? <Animated.View pointerEvents="none" style={[styles.commandsVeil, { opacity: veil.opacity, bottom: -Math.max(insets.bottom - 16, spacing[8]) }]} /> : null}
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
            onPress={onStop}
            style={veil.mounted ? styles.aboveVeil : undefined}
            testID="execution-stop"
          />
        ) : forTimeRunning || emomRunning ? (
          // Registre ch07 (16/11/2026), Hermann : « remplacer le bouton réinitialisé par le bouton d’arrêt rouge ». PRE-11 (T2) : EMOM. [Réinitialiser
          // inactif (correction 3 du 14/11/2026) — remplacé pour le For time en cours.]
          <IconCommand label={t.commands.stop} icon={ICONS.stop} size={48} disabled={false} onPress={onStop} testID="execution-stop" />
        ) : forTimeBar || emomBar ? (
          <IconCommand label={t.commands.resetExercise} icon={ICONS.resetInactive} size={48} disabled dimmed={false} onPress={onReset} testID="execution-reset" />
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
            style={veil.mounted ? [styles.pauseCommand, styles.aboveVeil] : styles.pauseCommand}
            testID={paused ? "execution-resume" : "execution-continue"}
          />
        ) : forTimeBar || emomBar ? (
          // Registre ch07 (16/11/2026), Hermann : « désactiver le bouton pause » ; Figma « Mettre en pause — désactivé » (48).
          // [Pause orange 56 (correction 3 du 14/11/2026) — remplacé.]
          <IconCommand label={t.commands.pause} icon={ICONS.pauseDisabled} size={48} disabled dimmed={false} onPress={noop} testID="execution-pause" />
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
        {emomBar ? (
          // PRE-11 (T2) : « Suivant » (72) — travail de la fenêtre terminé (FMT-24) ; inactif pendant une Série en Durée et le repos.
          <IconCommand
            label={t.commands.next}
            icon={emomNextEnabled ? ICONS.next72 : ICONS.next72Inactive}
            size={72}
            disabled={!emomNextEnabled}
            dimmed={false}
            onPress={onValidate}
            testID="execution-emom-next"
          />
        ) : forTimeBar ? (
          // Registre ch07 (16/11/2026) : « + Tour » (72) remplace la coche et compte un tour ; composant DSF « Bouton + Tour »
          // (Actif, Désactivé). [✓ qui valide l'étape (correction 3 du 14/11/2026) — remplacé.]
          forTimeRunning && forTimeCommand?.kind === "NEXT" ? (
            // Recette du 17/11/2026 (ft-buyin : « remplacer le bouton "+Tour" par le bouton "Suivant" classique, à la même taille
            // que le bouton "+ Tour" » ; ft-barre : « "+ Tour" ne doit pas être actif tant qu'on n'arrive pas au dernier exercice du
            // tour ») ; Figma « DSF / Actions / Bouton Suivant — série suivante (72) » (`12556:29192`).
            // Recette du 17/11/2026 (ftr-mention : « fond bleu, symbole blanc ») ; inactif : modèle du « + Tour » désactivé.
            <IconCommand
              label={t.commands.next}
              icon={plusTourEnabled ? ICONS.next72 : ICONS.next72Inactive}
              size={72}
              disabled={!plusTourEnabled}
              dimmed={false}
              onPress={onForTimeNext}
              testID="execution-for-time-next"
            />
          ) : forTimeRunning && forTimeCommand?.kind === "SUCCESS" ? (
            // Recette du 17/11/2026 (ft-sans-duree : « A la dernière série, le bouton ne doit plus afficher "+ Tour" mais la coche
            // "Succès" (voir figma) » ; ft-buyin : « pour le dernier exercice du For Time (en boucle ou en Buy-out) »).
            <IconCommand
              label={t.commands.validate}
              icon={plusTourEnabled ? ICONS.success : ICONS.successInactive}
              size={72}
              disabled={!plusTourEnabled}
              dimmed={false}
              onPress={onPlusTour}
              testID="execution-validate"
            />
          ) : forTimeRunning ? (
            <PlusTourButton enabled={plusTourEnabled} onPress={onPlusTour} />
          ) : forTimeWork ? (
            <PlusTourButton enabled={false} onPress={noop} />
          ) : (
            <IconCommand label={t.commands.validate} icon={ICONS.success} size={72} disabled={!projection.commands.next} onPress={onValidate} testID="execution-validate" />
          )
        ) : (
        <IconCommand
          label={
            projection.commands.isContinue
              ? t.commands.continue
              : t.commands.next
          }
          // Recette du 13/11/2026 (Hermann : « En mode répétition, le bouton suivant doit être en fond bleu KODJO (symbole
          // blanc) dès le début de l'exercice, ou dès que l'objectif est atteint lorsqu'il y a des phases cadencées ou une
          // cadence de bip. Il reste toujours actif quelle que soit sa couleur. »)
          icon={projection.nextHighlighted === true && !atStopPoint ? ICONS.nextActive : ICONS.next}
          size={48}
          // Recette du 12/11/2026 (Hermann, e1f : « le bouton Suivant doit être désactivé » au Point d'arrêt).
          disabled={!projection.commands.next || atStopPoint}
          onPress={onNext}
          testID="execution-next-command"
        />
        )}
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

      {/* PRE-11 (T1) : Clôture bloquante d'un élément formaté (D3), modèle « Résultat de série » (Figma 8937:35362). */}
      {/* PRE-11, correction 4 : plus de feuille en fin normale (affichage du temps final) ; seule la borne qui interrompt une
          série demande ses répétitions. [Clôture « Vos résultats » à chaque fin de For time — remplacé.] */}
      {/* Seconde recette du 17/11/2026 (Hermann : « Si j'appuie sur Arrêter, que la modale est ouverte mais que je laisse ensuite courir
          l'exercice jusqu'à la fin du temps max, une fenêtre Résultat apparaît encore et se fige […] L'écran Résultat ne doit pas
          afficher ») : la modale de l'Arrêt reste seule ouverte ; « Terminer » amène à la synthèse. */}
      {live !== null && live.phase === "CLOSURE" && live.format !== null && live.format.interrupted !== null && !(live.format.kind === "FOR_TIME" && live.format.phase === "CLOSURE" && live.timer.kind === "STOPWATCH") && !partialOpen ? (
        <ExecutionClosureSheet
          key={liveTarget ?? "closure"}
          format={live.format}
          {...(live.format.kind === "EMOM"
            ? { title: t.emomClosureTitle, exerciseName: t.emomWindowName(live.format.interrupted.name, live.format.emom?.closingWindow ?? 0) }
            : live.format.kind === "AMRAP"
              ? { title: t.amrapClosureTitle }
              : {})}
          heldDurationMs={
            durationSample === null
              ? null
              : durationSample.running && live.format.capMs !== null
                ? durationSample.heldMs + Math.max(0, live.format.capMs - durationSample.elapsedMs)
                : durationSample.heldMs
          }
          bottomInset={insets.bottom}
          onSubmit={(payload) => void service.dispatch({ type: "SUBMIT", payload }, liveTarget ?? undefined)}
        />
      ) : null}

      {/* For time en cours (16/11/2026) : la modale s'ouvre sans Pause ; « le chrono continue derrière la modale ». */}
      {partialOpen && (paused || forTimeRunning || emomRunning || ((forTimeBar || emomBar) && partialStopAtMs !== null)) ? (
        <ExecutionPartialRepetitionsSheet
          {...(emomBar ? { title: t.emomStopTitle } : amrapBar ? { title: t.amrapStopTitle } : {})}
          exerciseName={partialOf.name}
          targetText={partialOf.targetText}
          inSeries={partialOf.inSeries}
          heldDurationMs={partialHeldMs}
          closeLabel={paused ? t.partialClose : t.partialBackToExercise}
          bottomInset={insets.bottom}
          onCancel={() => {
            setPartialOpen(false);
            releaseFreeze();
            // Troisième recette du 17/11/2026 (ftr3-modale-figee, Hermann : « A l'issue du temps limite, le cercle doit s'arrêter de tourner avec le chronomètre » ; « figer l'écran au dernier exercice exécuté (chronomètre, compte à rebours, anneau...), ne jamais exécuter le compte à rebours de la fin de séance (ne pas afficher l'écran), l'appuie sur la croix amène directement à l'écran de synthèse de la séance ») : écran figé (l'exercice affiché est terminé), la croix mène directement à la synthèse, sans le résultat saisi.
            // [Reprise de la suite (fenêtre Résultat, fin de séance) — remplacé.]
            if (frozen) void stopSession(undefined, partialStopAtMs);
          }}
          onConfirm={(partialRepetitions, partialDurationMs) => {
            setPartialOpen(false);
            releaseFreeze();
            void stopSession(partialDurationMs === undefined || partialDurationMs === null ? { partialRepetitions } : { partialRepetitions, partialDurationMs }, partialStopAtMs);
          }}
        />
      ) : null}

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

/** Compteur Série, Tour ou Cycle : libellé centré au-dessus de la valeur ; sans valeur, libellé et « – » en gris clair. */
function Counter({
  label,
  value,
  badge = null,
  testID,
}: {
  label: string;
  value: { readonly current: number; readonly total: number } | null;
  /** Pastille à la place de la valeur (« Buy-in ✓ », recette du 17/11/2026). */
  badge?: string | null;
  testID: string;
}) {
  // Projection d’une version précédente encore en mémoire après une mise à jour à chaud (journal Metro du 13/11/2026) :
  // valeur absente.
  const absent = value === null || value === undefined;
  return (
    <View style={styles.seriesTourColumn}>
      <View style={styles.seriesTourPair}>
        <Text style={[styles.seriesTourLabel, absent ? styles.counterAbsent : null]} numberOfLines={1}>
          {label}
        </Text>
        {badge !== null ? (
          <View style={styles.counterBadge}>
            <Text style={styles.counterBadgeText} numberOfLines={1} testID={testID}>
              {badge}
            </Text>
          </View>
        ) : (
          <Text style={[styles.seriesTourText, absent ? styles.counterAbsent : null]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} testID={testID}>
            {/* PRE-11 (T3) : tour de boucle AMRAP, compte ouvert (total 0) — le rang seul. */}
            {absent ? "–" : value.total > 0 ? `${value.current}/${value.total}` : `${value.current}`}
          </Text>
        )}
      </View>
    </View>
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
  // Recette du 13/11/2026 : Suivant mis en avant (fond bleu KODJO, symbole blanc).
  nextActive: require("../../../assets/icons/execution-suivant-actif.svg"),
  reset: require("../../../assets/icons/execution-reinitialiser.svg"),
  // Recette e1 du 12/11/2026 (Hermann, e) : Démarrer (bleu) et Arrêt définitif (carré plein blanc sur fond rouge).
  start: require("../../../assets/icons/execution-demarrer.svg"),
  stop: require("../../../assets/icons/execution-arret.svg"),
  // PRE-11, correction 3 (Figma « Exécution d'une séance — For time » 8982:15849) : Pause 56, Réinitialiser inactif, ✓ 72 ;
  // ✓ inactif 48 construit sur le modèle de Réinitialiser inactif (absent du Figma).
  pauseSmall: require("../../../assets/icons/execution-pause-56.svg"),
  resetInactive: require("../../../assets/icons/execution-reinitialiser-inactif.svg"),
  success: require("../../../assets/icons/execution-succes.svg"),
  successInactive: require("../../../assets/icons/execution-succes-inactif.svg"),
  // Registre ch07 (16/11/2026) : Pause désactivée du For time, Figma « Mettre en pause — désactivé » (`8982:15852`).
  pauseDisabled: require("../../../assets/icons/execution-pause-desactive.svg"),
  // Recette du 17/11/2026 (ft-buyin) : Figma « DSF / Actions / Bouton Suivant — série suivante (72) » (`12556:29192`).
  next72: require("../../../assets/icons/execution-suivant-72.svg"),
  next72Inactive: require("../../../assets/icons/execution-suivant-72-inactif.svg"),
  soundOn: require("../../../assets/icons/execution-son-active.svg"),
  soundOff: require("../../../assets/icons/execution-son-desactive.svg"),
  voiceOn: require("../../../assets/icons/execution-voix-activee.svg"),
  voiceOff: require("../../../assets/icons/execution-voix-desactivee.svg"),
} as const;

/** Bouton rond de la barre de commandes ; libellé porté par l'accessibilité. */
const noop = () => undefined;

/**
 * For time, exercice en durée (Formats §11.1 ; Figma `8982:15849`, `12514:27223`, `12514:27329`) : fond du cercle — gris en
 * attente du lancement, vert en cours, orange retenu ; cadre du coin ; couleur de la mention ; chrono principal estompé.
 */
// Recette du 17/11/2026 (ft-encours : « La couleur de fond orange du cercle doit être la même que celle du triangle en haut à
// gauche ») : fond retenu = coin retenu. [#FFE6C2 du Figma — remplacé.]
const DURATION_FILL = { RUNNING: "#D1F2D9", HELD: "#FFD194" } as const;
// `pulse` : vert plus foncé du clignotement des 3 dernières secondes (autres remarques, d, du 17/11/2026).
const DURATION_BADGE = { running: "#BDEBC9", held: "#FFD194", pulse: "#7FD39A" } as const;
const MENTION = { idle: "#8F8F94", running: "#126B38", held: "#B85408" } as const;
/** Composant DSF « DSF / Actions / Bouton + Tour » (`12548:29210`) : 72 × 72, Actif (bleu KODJO) et Désactivé. */
const PLUS_TOUR = { blue: "#0508E5", grey: "#B4B9C4" } as const;

/**
 * Travail d'un For time en cours (registre ch07, 16/11/2026 : l'arrière-plan ne met pas en Pause). PRE-11 (T2) : de même pendant les
 * fenêtres d'un EMOM, qui s'enchaînent à l'heure quoi qu'il arrive (FMT-23, D5 ; ch10 « L'Exécution continue à progresser lorsque
 * l'application passe en arrière-plan »).
 */
function inForTimeWork(frames: readonly Frame[]): boolean {
  return frames.some(
    (frame) =>
      (frame.spec.pilot === FOR_TIME_PILOT && (frame.local as ForTimeLocal | null)?.phase === "WORK") ||
      (frame.spec.pilot === EMOM_PILOT && (frame.local as EmomLocal | null)?.phase === "WORK") ||
      // PRE-11 (T3) : de même pendant un bloc AMRAP, dont la borne court quoi qu'il arrive (D1).
      (frame.spec.pilot === AMRAP_PILOT && (frame.local as AmrapLocal | null)?.phase === "WORK"),
  );
}

/** PRE-11 (T3) : Formats qui ont l'écran du For time (barre, commandes, exercices en durée) — For time et AMRAP. */
function forTimeLike(kind: string | undefined): boolean {
  return kind === "FOR_TIME" || kind === "AMRAP";
}

/** Instant de fin du travail d'un For time (borne ou fin normale), s'il vient de se terminer. */
function forTimeWorkEndedAt(frames: readonly Frame[]): number | null {
  for (const frame of frames) {
    if (frame.spec.pilot !== FOR_TIME_PILOT && frame.spec.pilot !== AMRAP_PILOT) continue;
    // PRE-11 (T3) : de même pour l'échéance d'un bloc AMRAP.
    const local = frame.local as ForTimeLocal | AmrapLocal | null;
    if (local?.phase === "CLOSURE" && typeof local.workEndedAtMs === "number") return local.workEndedAtMs;
  }
  return null;
}

/** Registre ch07 (16/11/2026), Hermann : « +Tour sur deux lignes » — « le + plus gros ». */
function PlusTourButton({ enabled, onPress }: { readonly enabled: boolean; readonly onPress: () => void }) {
  const tint = enabled ? "#FFFFFF" : PLUS_TOUR.grey;
  return (
    <Pressable
      onPress={enabled ? onPress : noop}
      accessibilityRole="button"
      accessibilityLabel={t.plusTour}
      accessibilityState={{ disabled: !enabled }}
      hitSlop={8}
      style={[styles.plusTour, enabled ? styles.plusTourActive : styles.plusTourDisabled]}
      testID="execution-plus-tour"
    >
      <Text style={[styles.plusTourSign, { color: tint }]}>{t.plusTourSign}</Text>
      <Text style={[styles.plusTourWord, { color: tint }]}>{t.plusTourWord}</Text>
    </Pressable>
  );
}

function IconCommand({
  label,
  icon,
  size,
  disabled,
  onPress,
  shadowed = false,
  iconStyle,
  dimmed = true,
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
  /** Boîte de l'icône exportée avec son ombre (Pause 56 du For time). */
  iconStyle?: object;
  /** Inactif : atténué ; `false` pour une icône déjà grisée par le Figma. */
  dimmed?: boolean;
  style?: object;
  testID: string;
}) {
  // Recette e1 (c) : un bouton qui en remplace un autre (Pause, Démarrer, Arrêt) apparaît en fondu.
  const opacity = useFadeIn(icon);
  return (
    <Pressable
      // Inactif : appui absorbé sur place, jamais transmis à un parent (correction 3, Réinitialiser inerte du For time).
      onPress={disabled ? noop : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={8}
      style={[{ width: size, height: size }, style, disabled && dimmed ? styles.commandDisabled : null]}
      testID={testID}
    >
      <Animated.View style={{ opacity }}>
        <Image
          source={icon}
          style={iconStyle ?? (shadowed ? styles.pauseIcon : { width: size, height: size })}
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
/**
 * Valeur d'un cadre : chiffres à la taille du cadre, unité (« rép. », « kg ») plus petite (recette du 13/11/2026,
 * Hermann : « rép et kg peuvent être un peu plus petits (conserver la taille des chiffres) et gris foncé sur gris clair »).
 */
/** Hauteur de la barre de commandes (voile du Point d'arrêt). */
const COMMANDS_HEIGHT = 72;
/**
 * Haut de l'invitation du Point d'arrêt sous la marge haute : titre (4 + 36), ligne sous le titre (24 + 3), anneau
 * (contenu de 288 centré dans 314 : 13), ligne du haut de l'anneau (30, centrée à 58), deux lignes de 24 centrées : 67 + 34.
 * Recette du 13/11/2026 (Hermann : « Baisser le texte Appuyer sur démarrer pour qu'il soit mieux positionné par rapport
 * au bord du cercle dont il est trop proche ») : 8 de plus, le bas du texte reste à 9 environ au-dessus des chiffres du
 * chronomètre (créneau de 108 à partir de 148, corps 100). [101 — remplacé.]
 */
const PRESS_START_TOP = 109;
/** Haut du chronomètre de l'attente : ligne du bas de l'anneau (13 + 30 + 30 + 22 + 8 + 108 + 30 = 241) sous 67. */
const WAIT_CLOCK_TOP = 308;
/** Fondu rapide du voile (recette du 13/11/2026). */
const VEIL_FADE_MS = 250;

/** Voile du Point d'arrêt : monté pendant son fondu d'entrée et de sortie. */
function useVeil(visible: boolean): { readonly opacity: Animated.Value; readonly mounted: boolean } {
  const [opacity] = useState(() => new Animated.Value(0));
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  useEffect(() => {
    Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: VEIL_FADE_MS, useNativeDriver: true }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, opacity]);
  return { opacity, mounted };
}
/** Voile du Point d'arrêt. */
const STOP_VEIL = "rgba(255, 149, 0, 0.28)";

/** Vert du compteur automatique, objectif atteint (vert système d'iOS). */
const GOAL_GREEN = "#34C759";

/**
 * Valeur d'un coin (seconde recette du 17/11/2026, Hermann : textes des triangles « sur deux lignes ») : nombre en haut, unité
 * dessous, à la taille de « max » et « mouv. » ; une valeur sans unité (durée, « À l'échec ») tient sur une ligne. [Nombre et unité
 * sur une ligne — remplacé.]
 */
function CornerValue({ text, align, testID }: { text: string; align: "left" | "right"; testID: string }) {
  const match = /^([\d\s.,]+)\s(\S.*)$/.exec(text);
  return (
    <View style={[styles.cornerLines, { alignItems: align === "left" ? "flex-start" : "flex-end" }]} accessible accessibilityLabel={text} testID={testID}>
      <Text style={styles.pillText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {match === null ? text : match[1]}
      </Text>
      {match === null ? null : (
        <Text style={[styles.pillText, styles.autoCountUnit]} numberOfLines={1}>
          {match[2]}
        </Text>
      )}
    </View>
  );
}

function repetitionsText(projection: ExecutionProjection): string | null {
  // Recette du 14/11/2026 (Hermann : « la durée doit apparaître dans le triangle en haut à gauche pendant les pauses et les
  // récupérations aussi ») : durée prévue de la Pause, de la Pause au changement de côté ou de la Récupération.
  if (
    (projection.phase === "SERIES_PAUSE" || projection.phase === "SIDE_RECOVERY" || projection.phase === "POST_ACTIVITY_RECOVERY") &&
    projection.timer.kind === "COUNTDOWN"
  )
    return formatClock(projection.timer.totalMs);
  if (projection.phase !== "ACTIVITY" || projection.seriesTarget === null) return null;
  const target = projection.seriesTarget;
  // Demande de Hermann du 14/11/2026 (soir) : « Un exercice en durée : il doit avoir dans le triangle haut à gauche la durée cible
  // de l'exercice » — durée de la Série au format des durées (`formatPhraseDuration`, « M′SS″ » ou « S″ »). [Rien pour un
  // exercice en Durée — remplacé.]
  // Seconde recette du 17/11/2026 (« utiliser le format 00:00 pour toutes les durées »). [« M′SS″ » — remplacé.]
  if (projection.mode === "DURATION") return target.kind === "NUMBER" ? formatClock(target.value * 1000) : null;
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
  // Recette du 13/11/2026 (Hermann : « Réduire un peu les deux tailles ») : côté et phase 24 → 21.
  side: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 21, lineHeight: 25 },
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
  // PRE-11 (T2) : « Repos » d'une fenêtre EMOM (orange de l'anneau de repos) ; bandeau Q1 au-dessus de la barre de commandes.
  emomRest: { color: REST_RING_COLOR },
  emomBannerLayer: { position: "absolute", left: 0, right: 0, zIndex: 2 },
  // Recette e1 (h : « le bord du cercle tout en bas est rogné par le cadre gris ») : le haut ne rétrécit plus ; c'est
  // l'espace au-dessus du cadre À suivre qui se resserre sur un écran plus petit.
  top: { flexGrow: 0, flexShrink: 0 },
  content: { alignItems: "center", paddingHorizontal: layout.screenGutter },
  // Titre à 20 sous la barre d'état (Figma : 56), contexte dessous (92), anneau à 14 du contexte (122).
  titleFill: { flex: 1, alignSelf: "stretch", justifyContent: "center" },
  // Recette du 13/11/2026 : titre remonté (16 → 8), côté dessous.
  titleSlot: { height: 36, marginTop: 4, alignSelf: "stretch", justifyContent: "center" },
  // Recette du 12/11/2026 (Hermann : « c’est le cercle qu’il faut centrer verticalement ») : le cercle (repères compris)
  // est centré entre le titre et le cadre gris : 16 + 6 au-dessus (ligne de contexte comprise), 22 en dessous.
  // [Contexte à 14 de l’anneau, cadre à 13 — remplacé.]
  // Recette du 13/11/2026 : ligne du côté (24), cercle toujours centré entre le titre et le cadre gris (24 de part et d'autre).
  // Recette du 13/11/2026 (cadre gris abaissé de 20) : cercle descendu de 10, toujours centré (34 au-dessus et en dessous).
  contextSlot: { height: 24, alignSelf: "stretch", justifyContent: "center", marginBottom: 3 },
  sideLine: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 20, lineHeight: 24, color: executionColors.side, textAlign: "center" },
  // Recette du 13/11/2026 (capture de Hermann : cadres « 12 rép. » / « 15 kg » coupés en bas) : la zone du cercle
  // s’étend de 12 sous l’anneau pour contenir les cadres (le défilement coupait ce qui dépassait) ; l’écart de 24 jusqu’au
  // cadre gris est inchangé (12 + 12). [Cadres à −12 hors de la zone — remplacé.]
  // Recette du 13/11/2026 (Hermann : « Même taille de cadre, texte centré à l’intérieur. Mettre les deux cadres en haut et non
  // en bas ») : cadres de 92 × 40 en haut à gauche et à droite du cercle, 12 au-dessus de l’anneau (dans l’écart sous le côté).
  // [Cadres en bas, largeur selon le texte — remplacé.]
  // Coin du bas (compteur automatique) : 18 sous l'anneau (28 avant le 13/11, rapprochement des coins), compris dans la zone ; l'écart jusqu'au cadre gris est inchangé.
  ringArea: { alignSelf: "stretch", alignItems: "center", paddingBottom: 18 },
  // Cadres gris clair en bas du cercle : répétitions à gauche, charge à droite (recette du 13/11/2026).
  // Recette du 13/11/2026 (Hermann : « Remonter un peu les deux cadres sur les côtés ») : 20 au-dessus de l’anneau (au lieu de 12).
  // Puis « Remonter un peu les deux cadres » : 28 au-dessus de l’anneau.
  pill: { position: "absolute", top: -28, height: 40, width: 92, paddingHorizontal: 8, borderRadius: 12, backgroundColor: "#F0F1F5", alignItems: "center", justifyContent: "center" },
  pillLeft: { left: 0 },
  badgeLayer: { position: "absolute", top: 0, left: 0, right: 0, height: 0 },
  pillRight: { right: 0 },
  // Recette du 13/11/2026 : texte gris foncé sur le gris clair du cadre ; unité en 18. [Noir, unité en 24 — remplacé.]
  pillText: { fontFamily: "RobotoCondensed_700Bold", fontWeight: "700", fontSize: 24, lineHeight: 28, color: "#3C3C43", textAlign: "center" },
  cornerLines: { flexDirection: "column" },
  autoCount: { alignItems: "flex-end", alignSelf: "stretch" },
  // Durée maximum du For time sur deux lignes, calée à gauche (recette du 14/11/2026).
  capLines: { alignItems: "flex-start", alignSelf: "stretch" },
  // Recette du 13/11/2026 (Hermann : « Tour de la même taille que kg et rép ») : 18, comme les unités des autres coins.
  autoCountUnit: { fontSize: 18, lineHeight: 20 },
  goalText: { color: "#FFFFFF" },
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
  sideRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "center" },
  // Exposant : 60 % du corps, haut aligné sur celui des chiffres.
  sideSuffix: { fontSize: 13, lineHeight: 17 },
  phaseSlot: { height: 22, justifyContent: "center" },
  timerSlot: { height: 108, marginTop: 8, alignSelf: "stretch", justifyContent: "center" },
  // Recette du 13/11/2026 (Hermann : « Abaisser un peu la phase dans le cercle 2/3 1/3 ») : bas des chiffres du chrono à
  // 178, bord intérieur de l’anneau à 276 ; la phase est centrée aux deux tiers (243). [Juste sous le chrono — remplacé.]
  objectiveSlot: { height: 30, marginTop: 30, justifyContent: "center" },
  loadSlot: { height: 0 },
  side: { ...executionType.side, color: executionColors.side },
  timer: {
    ...executionType.timer,
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  objective: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 20, lineHeight: 24, color: colors.textSecondary },
  // Point d'arrêt (e1f) : invitation en bleu, chronomètre de l'attente en noir, chrono à l'arrêt en gris foncé.
  pressStart: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 20, lineHeight: 24, color: colors.primary, textAlign: "center" },
  waitClock: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 20, lineHeight: 24, color: colors.textPrimary, fontVariant: ["tabular-nums"] },
  timerWaiting: { color: "#4A4A50" },
  // For time, exercice en durée : « La couleur du chrono principal doit être estompée » (Hermann, 16/11/2026).
  // Figma « Indication — appui sur le cercle » : Roboto Condensed 16, deux lignes. Graisse Medium : la Regular n'est pas chargée.
  // Figma « Zone — Buy-in ✓ » (`12512:27117`) : fond blanc, bord #B4B9C4, rayon 16,5, Inter Medium 16 #595E6B.
  counterBadge: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#B4B9C4", borderRadius: 16.5, height: 33, paddingHorizontal: 8.5, justifyContent: "center", marginTop: 6 },
  counterBadgeText: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 16, color: "#595E6B" },
  // Seconde recette du 17/11/2026 (« Je ne vois plus du tout le texte ») : la case, sans autre contenu, n'avait aucune largeur ; la
  // mention prend la largeur du contenu du cercle, centrée sur la case. [left: 0, right: 0 — remplacé.]
  // Recette du 17/11/2026 (Hermann, capture : « Remonte un peu le texte et augmente un peu la taille ») : 18 / 22 ; puis « Remonte le
  // texte (idem pour les deux autres situations) » : lancer, pause et repartir, 24 plus haut que la case. [top -4, 16 / 19, puis top -14 — remplacés.]
  mentionLayer: { position: "absolute", top: -28, left: -126, width: 252 },
  mention: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 18, lineHeight: 22, textAlign: "center" },
  plusTour: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  plusTourActive: { backgroundColor: PLUS_TOUR.blue },
  plusTourDisabled: { backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: PLUS_TOUR.grey },
  plusTourSign: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 30, lineHeight: 24, paddingTop: 4, textAlign: "center" },
  plusTourWord: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 18, lineHeight: 24, textAlign: "center" },
  // Recette du 12/11/2026 (Hermann : « Le texte des phases doit être de la même police que Côté et le reste des textes ») :
  // Roboto Condensed Medium, 18 (hauteur de sa ligne, 22). [Inter Medium 14 — remplacé.]
  // Recette du 13/11/2026 (Hermann : « Le texte relâcher a une taille différente de côté, il faut harmoniser les deux
  // tailles ») : phase à la taille du côté (24). [18 — remplacé.]
  guidance: { ...executionType.side, color: colors.primary },
  // Figma `5041:6048` : fond #F6F6FA, 13 sous l'anneau. Recette e1/e2 du 12/11/2026 (Hermann : « mettre les 4 coins
  // du cadre gris arrondis ; laisser une marge à gauche et à droite entre le fond gris clair et le bord de l'écran »).
  // [Coins supérieurs seuls, pleine largeur — remplacé.]
  zone: {
    // Recette du 13/11/2026 (Hermann : « Abaisser les chiffres série et tour de quelques points, les textes un peu plus pour
    // resserrer un peu, et beaucoup plus pour le cadre gris (il y a trop d’espace avec le bord haut) ») : bord haut abaissé
    // de 20 (cercle +10, écart +10), libellés +8, valeurs +4 ; piste et cadre blanc inchangés.
    // Recette du 13/11/2026 (Hermann : « On doit pouvoir abaisser encore le cadre gris ») : bord haut encore abaissé de 10
    // (cercle +5, écart +5), contenu de la zone à la même place.
    // Recette du 13/11/2026 (Hermann : « Le cercle peut être recentré verticalement ») puis côté revenu dans le cercle :
    // cercle centré entre le titre et le cadre gris, 39 de part et d'autre (ligne sous le titre comprise, vide pendant un
    // exercice).
    // Recette du 13/11/2026 (Hermann : « Remonter un peu le grand cadre gris pour respecter la marge avec le bouton
    // démarrer ») : cadre gris remonté de 8 (cercle −4, écart 35 / 35), commandes à 20 sous le cadre (au lieu de 12).
    // Recette du 13/11/2026 (Hermann : « Abaisser de 6 px le cercle ») : cercle +6 (41 au-dessus, 29 en dessous), cadre gris
    // à la même place.
    // Recette du 13/11/2026 (Hermann : « Remonter un peu le cercle, je dois trouver un moyen de préserver une marge entre le
    // triangle du bas et le cadre. Il faut rogner un peu partout équitablement. ») : 12 sous le coin du bas ; place prise
    // au-dessus du cercle (−8), sur Série / Tour / Cycle (−4), le cadre blanc (−4), les commandes (−2) et l’écart minimal
    // au-dessus du cadre blanc (−2). [1 — remplacé.] Puis (Hermann : « Abaisser un peu la barre de progression, les lignes
    // série tour et cycle ; et le cadre ») : cadre gris et son contenu abaissés de 6 (18 sous le coin du bas).
    marginTop: 18,
    marginHorizontal: layout.screenGutter,
    flexShrink: 1,
    backgroundColor: executionColors.zone,
    borderRadius: 24,
    // Recette du 13/11/2026 (Hermann : « le cadre blanc s’est abaissé et a perdu sa marge en bas avec le cadre gris. Le
    // restaurer. ») : la zone ne tenait plus (elle rétrécit, le cadre blanc débordait). Place reprise en haut de l’écran
    // (titre −8), sous la zone (commandes à 12 au lieu de 24, marge basse −6) et sur l’écart minimal du cadre (10).
    // Recette du 13/11/2026 (Hermann : « abaisser la première ligne dans le cadre en respectant les marges ») : Série /
    // Tour / Cycle 8 plus bas (12 → 20) ; la piste remonte d’autant (30 → 22) pour garder sa place et l’écart au cadre blanc.
    paddingTop: 20,
    paddingBottom: spacing[16],
    paddingHorizontal: layout.screenGutter,
  },
  // « Série 2/3 • Tour 1/3 » : texte de gauche aligné à droite jusqu'à 29 du centre, point centré, texte de droite à 29.
  // Recette du 13/11/2026 : libellé (16) au-dessus de la valeur (30, inchangée) ; point médian au niveau des valeurs.
  // Recette du 13/11/2026 (Hermann : « Augmenter la taille des valeurs ») : valeurs et point médian 30 → 36.
  // Libellé centré sur sa valeur, 8 au-dessus ; trait vertical blanc entre Série et Tour (recette du 13/11/2026).
  // Recette du 13/11/2026 (Hermann : « Augmenter légèrement la taille des valeurs, du texte série et tour aussi (même
  // taille que temps écoulé). Rabaisser un peu la ligne Série / Tour et leurs valeurs, abaisser le cadre gris. ») :
  // libellés 18, valeurs 40, ligne de 76 ; zone à 34 du haut du cadre gris.
  seriesTour: { flexDirection: "row", alignItems: "center", height: 68 },
  // Recette du 13/11/2026 (Hermann : « Centrer horizontalement série et tour dans leur espace respectif »).
  // [Série calée à droite, Tour à gauche, contre le trait — remplacé.]
  seriesTourColumn: { flex: 1, alignItems: "center" },
  seriesTourColumnLeft: {},
  seriesTourPair: { alignItems: "center", alignSelf: "stretch" },
  seriesTourDivider: { width: 14, alignItems: "center", justifyContent: "center" },
  counterAbsent: { color: "#C4C6CE" },
  seriesTourLine: { width: 2, height: 52, borderRadius: 1, backgroundColor: "#FFFFFF" },
  seriesTourLabel: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500", fontSize: 18, lineHeight: 21, marginBottom: 2, color: executionColors.caption },
  seriesTourText: { ...executionType.metric, fontSize: 40, lineHeight: 45, color: colors.textPrimary },
  right: { textAlign: "right" },
  // Recette du 13/11/2026 (Hermann : « Abaisser la barre de progression ») : 20 → 26 sous les valeurs.
  progressTrack: { flexDirection: "row", gap: 3, height: 9, marginTop: 22 },
  // Puis « C’est d’abord la barre de progression qu’il faut abaisser, il y a trop d’espace avec le cadre blanc » : 20 → 30.
  // Recette du 13/11/2026 (Hermann : « Abaisser un peu la barre de progression, et tout ce qui va avec ») : 14 → 20 sous
  // Série / Tour / Cycle ; légende et cadre blanc suivent (l’écart au-dessus du cadre blanc se resserre d’autant).
  progressSegment: { flex: 1, height: 9, borderRadius: 4.5, backgroundColor: executionColors.track, overflow: "hidden" },
  progressFill: { height: 9, borderRadius: 4.5, backgroundColor: executionColors.progress },
  captionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  progressCaption: { ...type.caption, fontSize: 13, lineHeight: 16, color: executionColors.caption },
  // Figma `4790:6204` : cadre 370 × 132, fond #FAFAFE, rayon 12, 40 sous la légende de la piste.
  // Recette du 12/11/2026 (Hermann : « Abaisser un peu le bord haut du cadre du temps écoulé pour que la marge intérieure
  // en haut soit égale à la marge en bas ») : bord haut abaissé de 8 (cadre 124, marge haute 13), bas inchangé.
  // [Écart 40, cadre 132, marge haute 21 — remplacé.]
  cardGap: { height: 48, minHeight: 8, flexShrink: 1 },
  // Recette du 12/11/2026 (Hermann : « Le temps écoulé, la ligne de séparation et le nombre de répétitions ont plus de
  // marge à droite qu'il n'en a à gauche ») : marges égales. [Marge droite de 32 relevée dans Figma — remplacé.]
  // Recette du 13/11/2026 (Hermann : « Réduire d’autant la hauteur du cadre », après la barre abaissée de 6) : cadre blanc
  // 120 → 114, marges intérieures 8 en haut et en bas ; l’écart au-dessus du cadre blanc retrouve sa valeur.
  card: { height: 114, borderRadius: 12, backgroundColor: executionColors.card, paddingHorizontal: 16, paddingTop: 8 },
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
  commands: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: COMMANDS_HEIGHT, marginTop: 18, gap: 30 },
  // Voile du Point d'arrêt (recette du 13/11/2026).
  veil: { position: "absolute", top: 0, left: 0, right: 0, backgroundColor: STOP_VEIL, zIndex: 1 },
  commandsAboveVeil: { zIndex: 2 },
  commandsVeil: { position: "absolute", top: 0, left: 0, right: 0, backgroundColor: STOP_VEIL, zIndex: 1 },
  aboveVeil: { zIndex: 2 },
  waitLayer: { position: "absolute", left: 0, right: 0, height: 30, alignItems: "center", justifyContent: "center", zIndex: 3 },
  pressStartLayer: { position: "absolute", left: 0, right: 0, height: 48, alignItems: "center", justifyContent: "center", zIndex: 3 },
  toggle: { width: 24, height: 24 },
  toggleIcon: { width: 24, height: 24 },
  pauseCommand: { marginHorizontal: 7 },
  pauseIcon: { width: 92, height: 92, marginLeft: -10, marginTop: -8 },
  // Pause 56 du For time : export de 71,56 avec ombre (débord 7,78 à gauche, 6,22 en haut).
  pauseSmallIcon: { width: 71.5556, height: 71.5556, marginLeft: -7.7778, marginTop: -6.2222 },
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
