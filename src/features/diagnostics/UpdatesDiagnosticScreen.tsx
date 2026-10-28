import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { readKeyboardJournal } from "@/features/diagnostics/keyboardJournal";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * Diagnostic des mises à jour OTA (recette PRE-3, blocage OTA-NON-APPLIQUEE).
 *
 * Écran technique de recette, ouvert uniquement par le lien
 * `routine://diagnostic-updates` : aucun écran du produit n'y mène. Il lit sur
 * l'appareil ce que le serveur ne peut pas prouver : la mise à jour réellement
 * exécutée, la nature du lancement (embarqué, OTA, urgence), les dernières
 * erreurs de vérification et de téléchargement, et le journal d'`expo-updates`.
 * La vérification manuelle interroge le serveur sans rien télécharger ni
 * relancer.
 */
export function UpdatesDiagnosticScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const state = Updates.useUpdates();
  const [logs, setLogs] = useState<readonly Updates.UpdatesLogEntry[] | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [check, setCheck] = useState<string | null>(null);
  // Recette 3 (N-01) : journal clavier / focus des feuilles de référentiels (session en cours).
  const [keyboardJournal] = useState(() => readKeyboardJournal());

  useEffect(() => {
    let active = true;
    Updates.readLogEntriesAsync(LOG_MAX_AGE_MS)
      .then((entries) => {
        if (active) setLogs(entries.slice(-LOG_MAX_ENTRIES).reverse());
      })
      .catch((error: unknown) => {
        if (active) setLogsError(describeError(error));
      });
    return () => {
      active = false;
    };
  }, []);

  async function runCheck() {
    setCheck("Vérification en cours…");
    try {
      const result = await Updates.checkForUpdateAsync();
      const id = result.manifest && "id" in result.manifest ? String(result.manifest.id) : "—";
      setCheck(
        result.isAvailable
          ? `Mise à jour disponible : ${id}`
          : `Aucune mise à jour plus récente${"reason" in result && result.reason ? ` (${String(result.reason)})` : ""}`,
      );
    } catch (error) {
      setCheck(`Erreur : ${describeError(error)}`);
    }
  }

  const rows: readonly (readonly [string, string])[] = [
    ["Mise à jour exécutée", Updates.updateId ?? "—"],
    ["Lancement", Updates.isEmbeddedLaunch ? "bundle embarqué du build" : "mise à jour OTA"],
    ["Créée le", Updates.createdAt ? Updates.createdAt.toISOString() : "—"],
    ["Lancement d’urgence", Updates.isEmergencyLaunch ? `oui — ${Updates.emergencyLaunchReason ?? "raison inconnue"}` : "non"],
    ["Canal", Updates.channel ?? "—"],
    ["Runtime", Updates.runtimeVersion ?? "—"],
    ["Build", `${Constants.nativeAppVersion ?? "—"} (${Constants.nativeBuildVersion ?? "—"})`],
    ["Mises à jour actives", Updates.isEnabled ? "oui" : "non"],
    ["Vérification auto.", Updates.checkAutomatically ?? "—"],
    [
      "Dernière vérification",
      state.lastCheckForUpdateTimeSinceRestart ? state.lastCheckForUpdateTimeSinceRestart.toISOString() : "aucune depuis le lancement",
    ],
    ["Disponible", state.availableUpdate?.updateId ?? "—"],
    ["Téléchargée, en attente", state.downloadedUpdate?.updateId ?? (state.isUpdatePending ? "oui" : "—")],
    ["Erreur de vérification", state.checkError ? describeError(state.checkError) : "—"],
    ["Erreur de téléchargement", state.downloadError ? describeError(state.downloadError) : "—"],
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="updates-diagnostic">
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer le diagnostic"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          style={styles.headerAction}
          testID="updates-diagnostic-close"
        >
          <Text style={styles.link}>Fermer</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          Diagnostic des mises à jour
        </Text>
      </View>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing[24] }]}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text selectable style={styles.value} testID={`updates-diagnostic-${label}`}>
              {value}
            </Text>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={runCheck}
          style={styles.button}
          testID="updates-diagnostic-check"
        >
          <Text style={styles.buttonLabel}>Vérifier maintenant (sans télécharger)</Text>
        </Pressable>
        {check ? (
          <Text selectable style={styles.value} testID="updates-diagnostic-check-result">
            {check}
          </Text>
        ) : null}
        <Text style={styles.section}>Journal clavier et focus (session en cours, chronologique)</Text>
        {keyboardJournal.length === 0 ? <Text style={styles.value}>Journal vide</Text> : null}
        {keyboardJournal.map((entry, index) => (
          <Text key={`k${index}`} selectable style={styles.log} testID="updates-diagnostic-keyboard">
            {`${new Date(entry.at).toISOString().slice(11, 23)} ${entry.event}`}
          </Text>
        ))}
        <Text style={styles.section}>Journal expo-updates (7 jours, plus récent d’abord)</Text>
        {logsError ? <Text style={styles.value}>Erreur : {logsError}</Text> : null}
        {logs === null && !logsError ? <Text style={styles.value}>Lecture…</Text> : null}
        {logs?.length === 0 ? <Text style={styles.value}>Journal vide</Text> : null}
        {logs?.map((entry, index) => (
          <Text key={index} selectable style={styles.log} testID="updates-diagnostic-log">
            {`${new Date(entry.timestamp).toISOString()} ${entry.level} ${entry.code}${entry.updateId ? ` [${entry.updateId}]` : ""} ${entry.message}`}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const LOG_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const LOG_MAX_ENTRIES = 80;

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return String(error);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing[16], paddingVertical: spacing[12], gap: spacing[8] },
  headerAction: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center" },
  title: { ...type.screenHeaderTitle, color: colors.textPrimary },
  body: { paddingHorizontal: spacing[16], gap: spacing[8] },
  row: { gap: 2 },
  label: { ...type.button, color: colors.textPrimary },
  value: { color: colors.textPrimary },
  section: { ...type.button, color: colors.textPrimary, marginTop: spacing[16] },
  log: { color: colors.textPrimary, fontSize: 11 },
  link: { ...type.button, color: colors.primary },
  button: {
    marginTop: spacing[8],
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[16],
  },
  buttonLabel: { ...type.button, color: "#FFFFFF" },
});
