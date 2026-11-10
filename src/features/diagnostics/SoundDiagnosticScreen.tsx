import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { hasNativeModule, SOURCES, startExecutionAudio, type BeepTone } from "@/infrastructure/audio/ExecutionSounds";
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

type Method = "VOLUME_ONCE" | "VOLUME_EACH" | "FRESH" | "FRESH_NO_VOLUME" | "WITH_VIBRATION";

// A reproduit la première livraison du 09/11/2026 (b362aa34, sans click) ; B la méthode actuelle, où le volume
// est réglé avant chaque son depuis 9b9339ef (premier click signalé à la recette suivante).
const METHODS: readonly { readonly method: Method; readonly label: string }[] = [
  { method: "VOLUME_ONCE", label: "A — Comme la première version : volume réglé une seule fois" },
  { method: "VOLUME_EACH", label: "B — Comme aujourd'hui : volume réglé avant chaque son" },
  { method: "FRESH", label: "C — Lecteur neuf à chaque son" },
  { method: "FRESH_NO_VOLUME", label: "D — Lecteur neuf, volume non modifié" },
  // Seule différence restante avec l'Exécution (recette du 10/11/2026, après la suppression des reconfigurations).
  { method: "WITH_VIBRATION", label: "E — Comme B, avec la vibration moyenne de la séance" },
];

const REPEAT = 3;
const INTERVAL_MS = 1000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function SoundDiagnosticScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [toneIndex, setToneIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [journal, setJournal] = useState<readonly string[]>([]);
  const toDispose = useRef<AudioPlayer[]>([]);
  const selected = TONES[toneIndex]!;

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
      const { tone, volume } = selected;
      if (method === "VOLUME_ONCE" || method === "VOLUME_EACH" || method === "WITH_VIBRATION") {
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
          if (method === "FRESH") player.volume = volume;
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
        <Text style={styles.section}>Essais</Text>
        {METHODS.map((entry) => (
          <Pressable key={entry.method} onPress={() => void run(entry.method)} disabled={running} accessibilityRole="button" style={[styles.button, running && styles.buttonDisabled]}>
            <Text style={styles.buttonText}>{entry.label}</Text>
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
