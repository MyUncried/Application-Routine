import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { hasNativeModule, SOURCES, startExecutionAudio, type BeepTone } from "@/infrastructure/audio/ExecutionSounds";
import { hasScheduledSounds, ScheduledSounds, type SessionPolicy } from "@/infrastructure/audio/ScheduledSounds";
import { bestFrenchVoice, EXECUTION_VOICE_LANGUAGE } from "@/infrastructure/speech/ExecutionVoice";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * Diagnostic du « click » des sons de guidage (recette PRE-10 du 10/11/2026 : click audible aussi aux écouteurs,
 * donc présent dans le signal ; parfois seulement à partir du deuxième son).
 *
 * Écran technique de recette, ouvert uniquement par le lien `routine://diagnostic-sons` : aucun écran du produit
 * n'y mène. Il joue un même son trois fois, à une seconde d'intervalle, de plusieurs façons, pour isoler celle
 * qui produit le click. Chaque essai utilise ses propres lecteurs ; l'Exécution n'est pas touchée.
 */
type AudioPlayer = import("expo-audio").AudioPlayer;

const TONES: readonly { readonly tone: BeepTone; readonly label: string; readonly volume: number }[] = [
  { tone: "BIP_DOUBLE", label: "Double bip", volume: 1 },
  { tone: "SIFFLET_ROULE", label: "Sifflet roulé", volume: 0.55 },
  { tone: "SIFFLET_PUR", label: "Sifflet pur", volume: 0.55 },
  { tone: "BIP_GRAVE", label: "Bip grave", volume: 1 },
];

type Method = "VOLUME_ONCE" | "VOLUME_EACH" | "FRESH" | "FRESH_NO_VOLUME" | "WITH_VIBRATION" | "AFTER_VOICE" | "ALL_PLAYERS" | "VOICE_FRESH" | "VOICE_OWN_SESSION" | "VOICE_REPLACE";

// A reproduit la première livraison du 09/11/2026 (b362aa34, sans click) ; B la méthode actuelle, où le volume
// est réglé avant chaque son depuis 9b9339ef (premier click signalé à la recette suivante).
const METHODS: readonly { readonly method: Method; readonly label: string }[] = [
  { method: "VOLUME_ONCE", label: "A — Comme la première version : volume réglé une seule fois" },
  { method: "VOLUME_EACH", label: "B — Comme aujourd'hui : volume réglé avant chaque son" },
  { method: "FRESH", label: "C — Lecteur neuf à chaque son" },
  { method: "FRESH_NO_VOLUME", label: "D — Lecteur neuf, volume non modifié" },
  // Seule différence restante avec l'Exécution (recette du 10/11/2026, après la suppression des reconfigurations).
  { method: "WITH_VIBRATION", label: "E — Comme B, avec la vibration moyenne de la séance" },
  // Différences restantes avec l'Exécution (aucun click en A à E, quel que soit le mode de session).
  { method: "AFTER_VOICE", label: "F — Comme B, après une annonce vocale" },
  { method: "ALL_PLAYERS", label: "G — Comme B, avec les 9 sons chargés comme en séance" },
  // F a montré le click après une annonce, à partir du deuxième son : deux corrections possibles.
  { method: "VOICE_FRESH", label: "H — Après une annonce, lecteur neuf à chaque son" },
  { method: "VOICE_OWN_SESSION", label: "I — Comme F, annonce dans sa propre session audio" },
  // Alternative au lecteur neuf (correctif retenu, H) : un seul lecteur, fichier rechargé après chaque son.
  { method: "VOICE_REPLACE", label: "J — Après une annonce, même lecteur, son rechargé après chaque lecture" },
];

/**
 * Fin de PRE-10 — spike de la bibliothèque de sons courts (spec `spec-guidage-reglages` §8, §8.1 et §3.5). Critères :
 * aucun click, même après une annonce ; sons à l'instant exact (programmés sur l'horloge audio) ; mode silencieux ;
 * musique ; arrière-plan. Version de l'application construite le 11/11/2026 (build `2e47648d`) seulement.
 */
type Spike = "K1" | "K2" | "K3" | "K4" | "K5" | "K6";
const SPIKES: readonly { readonly spike: Spike; readonly label: string }[] = [
  { spike: "K1", label: "K1 — Après une annonce : 3 bips graves puis double bip, programmés à 1 s d'intervalle" },
  { spike: "K2", label: "K2 — Cadence : 10 clics programmés chaque seconde, annonce vocale au milieu" },
  { spike: "K3", label: "K3 — Tempo : 10 clics avec la méthode actuelle, puis 10 clics programmés" },
  { spike: "K4", label: "K4 — Arrière-plan : un bip toutes les 5 s pendant 60 s, tous programmés d'avance (verrouillez l'écran)" },
  { spike: "K5", label: "K5 — Arrière-plan : un bip toutes les 5 s pendant 60 s, programmés au fil de l'eau (verrouillez l'écran)" },
  { spike: "K6", label: "K6 — Musique modulée : 10 s d'effort (clics, musique baissée), 10 s de récupération (musique rendue), deux fois" },
];
const SPIKE_POLICIES: readonly { readonly policy: SessionPolicy; readonly label: string }[] = [
  { policy: "LIBRARY_DUCK", label: "Musique baissée" },
  { policy: "LIBRARY_MIX", label: "Musique non baissée" },
];

/**
 * Recette e1 du 12/11/2026 (Hermann, i : « la voix n'est pas parfaitement claires, c'est le cas depuis le début et même
 * depuis qu'on a téléchargé le premium » ; priorité le 12/11) : quelle voix est choisie, et la session audio de la
 * séance dégrade-t-elle la voix ? Même phrase, voix choisie : V1 dans sa propre session (référence), V2 comme en
 * séance (session de l'application, bibliothèque de sons démarrée, musique baissée), V3 comme V2, un peu plus lente.
 */
type VoiceTrial = "V1" | "V2" | "V3";
const VOICE_TRIALS: readonly { readonly trial: VoiceTrial; readonly label: string }[] = [
  { trial: "V1", label: "V1 — Voix seule, dans sa propre session audio (référence)" },
  { trial: "V2", label: "V2 — Comme en séance : session de l'application, sons prêts, musique baissée" },
  { trial: "V3", label: "V3 — Comme V2, débit un peu plus lent" },
];
const VOICE_PHRASE = "Récupération. À suivre : Squats assistés, 12 répétitions.";
type FrenchVoice = { readonly identifier: string; readonly name: string; readonly quality: string; readonly chosen: boolean };

const REPEAT = 3;
const INTERVAL_MS = 1000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mode de la session audio (recette du 10/11/2026 : premier essai sans click en « mélange », clicks depuis
// le passage en « atténuation » de toute la séance).
type SessionMode = "mixWithOthers" | "duckOthers";
const SESSION_MODES: readonly { readonly mode: SessionMode; readonly label: string }[] = [
  { mode: "mixWithOthers", label: "Mélange (musique non baissée)" },
  { mode: "duckOthers", label: "Atténuation (musique baissée)" },
];

export function SoundDiagnosticScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [toneIndex, setToneIndex] = useState(0);
  const [sessionMode, setSessionMode] = useState<SessionMode>("mixWithOthers");
  const [running, setRunning] = useState(false);
  const [journal, setJournal] = useState<readonly string[]>([]);
  const toDispose = useRef<AudioPlayer[]>([]);
  const selected = TONES[toneIndex]!;
  const [spikePolicy, setSpikePolicy] = useState<SessionPolicy>("LIBRARY_DUCK");
  const [voices, setVoices] = useState<readonly FrenchVoice[] | null>(null);

  const note = (line: string) => setJournal((lines) => [`${new Date().toLocaleTimeString("fr-FR")} ${line}`, ...lines].slice(0, 40));

  async function create(tone: BeepTone): Promise<AudioPlayer> {
    const { createAudioPlayer } = await import("expo-audio");
    const player = createAudioPlayer(SOURCES[tone], { keepAudioSessionActive: true });
    toDispose.current.push(player);
    return player;
  }

  async function run(method: Method) {
    if (running) return;
    if (!hasNativeModule("ExpoAudio")) {
      note("Module audio absent de cette version de l'application.");
      return;
    }
    setRunning(true);
    note(`${METHODS.find((m) => m.method === method)!.label} · ${selected.label}`);
    try {
      await startExecutionAudio();
      // Session réglée dans le mode choisi avant l'essai, puis laissée stable pendant les trois sons.
      const audio = await import("expo-audio");
      await audio.setIsAudioActiveAsync(false).catch(() => undefined);
      await audio.setAudioModeAsync({ playsInSilentMode: true, interruptionMode: sessionMode, shouldPlayInBackground: false });
      await audio.setIsAudioActiveAsync(true);
      note(`session : ${SESSION_MODES.find((m) => m.mode === sessionMode)!.label}`);
      await wait(500);
      const { tone, volume } = selected;
      if (method === "AFTER_VOICE" || method === "VOICE_FRESH" || method === "VOICE_OWN_SESSION" || method === "VOICE_REPLACE") {
        // Même réglage que les annonces de la séance (ExecutionVoice).
        const Speech = await import("expo-speech");
        const voice = bestFrenchVoice(await Speech.getAvailableVoicesAsync());
        await new Promise<void>((resolve) => {
          Speech.speak("Préparez-vous. À suivre : Pompes", { language: EXECUTION_VOICE_LANGUAGE, ...(voice === null ? {} : { voice }), useApplicationAudioSession: method !== "VOICE_OWN_SESSION", onDone: () => resolve(), onError: () => resolve(), onStopped: () => resolve() });
        });
        note("annonce terminée");
        await wait(1000);
      }
      if (method === "ALL_PLAYERS") {
        for (const other of Object.keys(SOURCES) as BeepTone[]) if (other !== tone) await create(other);
        note("9 sons chargés");
      }
      if (method === "VOICE_REPLACE") {
        const player = await create(tone);
        await wait(500);
        for (let i = 1; i <= REPEAT; i += 1) {
          player.volume = volume;
          player.play();
          note(`son ${i}`);
          await wait(INTERVAL_MS / 2);
          // Rechargé une demi-seconde avant le son suivant, comme le ferait la séance.
          player.replace(SOURCES[tone]);
          await wait(INTERVAL_MS / 2);
        }
      } else if (method === "VOLUME_ONCE" || method === "VOLUME_EACH" || method === "WITH_VIBRATION" || method === "AFTER_VOICE" || method === "ALL_PLAYERS" || method === "VOICE_OWN_SESSION") {
        const player = await create(tone);
        if (method === "VOLUME_ONCE") player.volume = volume;
        else {
          player.addListener("playbackStatusUpdate", (status) => {
            if (status.didJustFinish) void player.seekTo(0).catch(() => undefined);
          });
        }
        await wait(500);
        for (let i = 1; i <= REPEAT; i += 1) {
          if (method !== "VOLUME_ONCE") player.volume = volume;
          if (method === "WITH_VIBRATION") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
          if (method === "VOLUME_ONCE" || player.playing || player.currentTime > 0.01) await player.seekTo(0);
          player.play();
          note(`son ${i}`);
          await wait(INTERVAL_MS);
        }
      } else {
        // Lecteur suivant préparé une demi-seconde avant d'être joué.
        let next = await create(tone);
        await wait(500);
        for (let i = 1; i <= REPEAT; i += 1) {
          const player = next;
          if (method !== "FRESH_NO_VOLUME") player.volume = volume;
          player.play();
          note(`son ${i}`);
          await wait(INTERVAL_MS / 2);
          next = await create(tone);
          await wait(INTERVAL_MS / 2);
        }
      }
      note("fin");
    } catch (error) {
      note(`Erreur : ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await wait(1500);
      for (const player of toDispose.current.splice(0)) {
        try {
          player.remove();
        } catch {
          // Lecteur déjà libéré.
        }
      }
      setRunning(false);
    }
  }

  async function announce(text: string) {
    const Speech = await import("expo-speech");
    const voice = bestFrenchVoice(await Speech.getAvailableVoicesAsync());
    await new Promise<void>((resolve) => {
      Speech.speak(text, { language: EXECUTION_VOICE_LANGUAGE, ...(voice === null ? {} : { voice }), useApplicationAudioSession: true, onDone: () => resolve(), onError: () => resolve(), onStopped: () => resolve() });
    });
  }

  async function listVoices() {
    if (!hasNativeModule("ExpoSpeech")) {
      note("Module de synthèse vocale absent de cette version de l'application.");
      return;
    }
    const Speech = await import("expo-speech");
    const all = await Speech.getAvailableVoicesAsync();
    const chosen = bestFrenchVoice(all);
    const french = all
      .filter((voice) => voice.language.replace("_", "-").toLowerCase().startsWith("fr"))
      .map((voice) => ({ identifier: voice.identifier, name: voice.name, quality: `${voice.language} · ${voice.quality}`, chosen: voice.identifier === chosen }));
    setVoices(french);
    note(`${french.length} voix françaises ; choisie en séance : ${chosen ?? "aucune (voix système par défaut)"}`);
  }

  async function speak(text: string, options: { voice: string | null; ownSession: boolean; rate?: number }) {
    const Speech = await import("expo-speech");
    await new Promise<void>((resolve) => {
      Speech.speak(text, {
        language: EXECUTION_VOICE_LANGUAGE,
        ...(options.voice === null ? {} : { voice: options.voice }),
        ...(options.rate === undefined ? {} : { rate: options.rate }),
        useApplicationAudioSession: !options.ownSession,
        onDone: () => resolve(),
        onError: () => resolve(),
        onStopped: () => resolve(),
      });
    });
  }

  async function playVoice(voice: FrenchVoice) {
    if (running) return;
    setRunning(true);
    note(`voix ${voice.name} (${voice.identifier})`);
    try {
      await speak(VOICE_PHRASE, { voice: voice.identifier, ownSession: true });
    } finally {
      setRunning(false);
    }
  }

  async function runVoiceTrial(trial: VoiceTrial) {
    if (running) return;
    if (!hasNativeModule("ExpoSpeech")) {
      note("Module de synthèse vocale absent de cette version de l'application.");
      return;
    }
    setRunning(true);
    note(VOICE_TRIALS.find((entry) => entry.trial === trial)!.label);
    const Speech = await import("expo-speech");
    const voice = bestFrenchVoice(await Speech.getAvailableVoicesAsync());
    const sounds = trial !== "V1" && hasScheduledSounds() ? new ScheduledSounds() : null;
    try {
      if (trial !== "V1") {
        await startExecutionAudio();
        if (sounds !== null) {
          await sounds.start("LIBRARY_DUCK");
          await sounds.preload(["BIP_DOUBLE"]);
          note("sons prêts, comme en séance");
        }
      }
      await wait(300);
      await speak(VOICE_PHRASE, { voice, ownSession: trial === "V1", ...(trial === "V3" ? { rate: 0.9 } : {}) });
      note("fin");
    } catch (error) {
      note(`Erreur : ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await sounds?.stop();
      setRunning(false);
    }
  }

  async function runSpike(spike: Spike) {
    if (running) return;
    if (!hasScheduledSounds()) {
      note("Bibliothèque de sons courts absente de cette version de l'application : installez la version du 11/11/2026.");
      return;
    }
    setRunning(true);
    note(`${SPIKES.find((entry) => entry.spike === spike)!.label} · ${SPIKE_POLICIES.find((entry) => entry.policy === spikePolicy)!.label}`);
    const sounds = new ScheduledSounds();
    const timers: ReturnType<typeof setTimeout>[] = [];
    try {
      await sounds.start(spikePolicy);
      await sounds.preload(["BIP_GRAVE", "BIP_DOUBLE", "CLIC_DOUX", "SIFFLET_ROULE"]);
      note("sons décodés");
      const at = (offsetSeconds: number) => (sounds.now() ?? 0) + offsetSeconds;
      if (spike === "K1") {
        await announce("Préparez-vous. À suivre : Pompes");
        note("annonce terminée");
        const t0 = at(1);
        for (let i = 0; i < 3; i += 1) await sounds.schedule("BIP_GRAVE", 1, t0 + i);
        await sounds.schedule("BIP_DOUBLE", 1, t0 + 3);
        note("4 sons programmés");
        await wait(5000);
      } else if (spike === "K2") {
        const t0 = at(0.5);
        for (let i = 0; i < 10; i += 1) await sounds.schedule("CLIC_DOUX", 0.35, t0 + i);
        note("10 clics programmés");
        await wait(3500);
        await announce("Pompes, 12 répétitions");
        note("annonce terminée");
        await wait(7000);
      } else if (spike === "K3") {
        note("méthode actuelle (lecteur neuf, joué par le JavaScript)");
        const { createAudioPlayer } = await import("expo-audio");
        for (let i = 0; i < 10; i += 1) {
          const player = createAudioPlayer(SOURCES.CLIC_DOUX, { keepAudioSessionActive: true });
          toDispose.current.push(player);
          await wait(i === 0 ? 300 : 1000 - 300);
          player.volume = 0.35;
          player.play();
          await wait(300);
        }
        await wait(1500);
        note("méthode programmée");
        const t0 = at(0.5);
        for (let i = 0; i < 10; i += 1) await sounds.schedule("CLIC_DOUX", 0.35, t0 + i);
        await wait(11000);
      } else if (spike === "K4") {
        const t0 = at(5);
        for (let i = 0; i < 12; i += 1) await sounds.schedule("BIP_GRAVE", 1, t0 + i * 5);
        note("12 bips programmés : verrouillez l'écran maintenant");
        await wait(65000);
      } else if (spike === "K5") {
        note("verrouillez l'écran maintenant");
        for (let i = 1; i <= 12; i += 1) {
          await wait(5000);
          await sounds.schedule("BIP_GRAVE", 1);
          note(`bip ${i} demandé par le JavaScript`);
        }
        await wait(1000);
      } else {
        // §8.1 : session reconfigurée seulement dans une fenêtre sans son prévu (début de la récupération).
        const { AudioManager } = await import("react-native-audio-api");
        for (let round = 1; round <= 2; round += 1) {
          AudioManager.setSystemOptions({ ios: { category: "playback", mode: "default", options: ["duckOthers"] } });
          await AudioManager.setAudioSessionActivity(true);
          const t0 = at(0.5);
          for (let i = 0; i < 10; i += 1) await sounds.schedule("CLIC_DOUX", 0.35, t0 + i);
          note(`effort ${round} : musique baissée, 10 clics`);
          await wait(10600);
          AudioManager.setSystemOptions({ ios: { category: "playback", mode: "default", options: ["mixWithOthers"] } });
          await AudioManager.setAudioSessionActivity(false).catch(() => undefined);
          await AudioManager.setAudioSessionActivity(true);
          note(`récupération ${round} : musique rendue`);
          await wait(10000);
          await sounds.schedule("SIFFLET_ROULE", 0.55);
        }
        await wait(1500);
      }
      note("fin");
    } catch (error) {
      note(`Erreur : ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      for (const timer of timers) clearTimeout(timer);
      await sounds.stop();
      for (const player of toDispose.current.splice(0)) {
        try {
          player.remove();
        } catch {
          // Lecteur déjà libéré.
        }
      }
      setRunning(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.back}>
          <Text style={styles.link}>Fermer</Text>
        </Pressable>
        <Text style={styles.title}>Diagnostic des sons</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[24] }]}>
        <Text style={styles.text}>Écoutez avec les écouteurs. Chaque essai joue le son 3 fois, à 1 seconde d’intervalle. Notez pour chaque essai si le click apparaît, et sur quel son (1, 2 ou 3).</Text>
        <Text style={styles.section}>Son</Text>
        <View style={styles.row}>
          {TONES.map((entry, index) => (
            <Pressable key={entry.tone} onPress={() => setToneIndex(index)} accessibilityRole="button" accessibilityState={{ selected: index === toneIndex }} style={[styles.chip, index === toneIndex && styles.chipSelected]}>
              <Text style={[styles.chipText, index === toneIndex && styles.chipTextSelected]}>{entry.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.section}>Session audio</Text>
        <View style={styles.row}>
          {SESSION_MODES.map((entry) => (
            <Pressable key={entry.mode} onPress={() => setSessionMode(entry.mode)} accessibilityRole="button" accessibilityState={{ selected: entry.mode === sessionMode }} style={[styles.chip, entry.mode === sessionMode && styles.chipSelected]}>
              <Text style={[styles.chipText, entry.mode === sessionMode && styles.chipTextSelected]}>{entry.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.section}>Essais</Text>
        {METHODS.map((entry) => (
          <Pressable key={entry.method} onPress={() => void run(entry.method)} disabled={running} accessibilityRole="button" style={[styles.button, running && styles.buttonDisabled]}>
            <Text style={styles.buttonText}>{entry.label}</Text>
          </Pressable>
        ))}
        <Text style={styles.section}>Bibliothèque de sons courts (version du 11/11/2026)</Text>
        <Text style={styles.text}>Pour chaque essai : click (oui ou non, sur quel son), régularité, et pour K4 et K5 si les bips continuent écran verrouillé. Mettez une musique pour K6.</Text>
        <View style={styles.row}>
          {SPIKE_POLICIES.map((entry) => (
            <Pressable key={entry.policy} onPress={() => setSpikePolicy(entry.policy)} accessibilityRole="button" accessibilityState={{ selected: entry.policy === spikePolicy }} style={[styles.chip, entry.policy === spikePolicy && styles.chipSelected]}>
              <Text style={[styles.chipText, entry.policy === spikePolicy && styles.chipTextSelected]}>{entry.label}</Text>
            </Pressable>
          ))}
        </View>
        {SPIKES.map((entry) => (
          <Pressable key={entry.spike} onPress={() => void runSpike(entry.spike)} disabled={running} accessibilityRole="button" style={[styles.button, running && styles.buttonDisabled]} testID={`sound-spike-${entry.spike}`}>
            <Text style={styles.buttonText}>{entry.label}</Text>
          </Pressable>
        ))}
        <Text style={styles.section}>Voix (recette e1, i)</Text>
        <Text style={styles.text}>Écoutez V1, V2 et V3 : la voix est-elle plus claire en V1 ? Puis listez les voix et touchez-en plusieurs pour choisir la plus claire. Notez le nom de la voix retenue.</Text>
        {VOICE_TRIALS.map((entry) => (
          <Pressable key={entry.trial} onPress={() => void runVoiceTrial(entry.trial)} disabled={running} accessibilityRole="button" style={[styles.button, running && styles.buttonDisabled]} testID={`voice-trial-${entry.trial}`}>
            <Text style={styles.buttonText}>{entry.label}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => void listVoices()} disabled={running} accessibilityRole="button" style={[styles.button, running && styles.buttonDisabled]} testID="voice-list">
          <Text style={styles.buttonText}>Lister les voix françaises installées</Text>
        </Pressable>
        {voices?.map((voice) => (
          <Pressable key={voice.identifier} onPress={() => void playVoice(voice)} disabled={running} accessibilityRole="button" style={[styles.button, running && styles.buttonDisabled]}>
            <Text style={styles.buttonText}>
              {voice.name}
              {voice.chosen ? " — choisie en séance" : ""}
            </Text>
            <Text style={styles.mono}>{voice.identifier}</Text>
            <Text style={styles.mono}>{voice.quality}</Text>
          </Pressable>
        ))}
        <Text style={styles.section}>Journal</Text>
        {journal.map((line, index) => (
          <Text key={`${index}-${line}`} style={styles.mono}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: spacing[12], paddingHorizontal: spacing[16], paddingVertical: spacing[8] },
  back: { paddingVertical: spacing[8] },
  link: { ...type.label, color: colors.primary },
  title: { ...type.label, color: colors.textPrimary },
  content: { paddingHorizontal: spacing[16], gap: spacing[12] },
  text: { ...type.body, color: colors.textPrimary },
  section: { ...type.label, color: colors.textSecondary, marginTop: spacing[8] },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing[8] },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...type.body, color: colors.textPrimary },
  chipTextSelected: { color: colors.background },
  button: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing[16] },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { ...type.body, color: colors.textPrimary },
  mono: { fontFamily: "Menlo", fontSize: 12, color: colors.textSecondary },
});
