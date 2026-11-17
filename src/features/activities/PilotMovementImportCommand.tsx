import { File } from "expo-file-system";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";

import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import {
  installPilotMovements,
  PILOT_ADMIN_JSON_MAX_BYTES,
  preparePilotMovementImport,
} from "@/features/activities/pilotMovementImport";

/**
 * Outil de recette interne (PR #434, hors MVP, sans référence Figma) : importe les 60 Mouvements
 * pilotes depuis l'export « brouillons » de l'administration Web. Affiché uniquement par une build
 * construite avec `EXPO_PUBLIC_KODJO_CATALOGUE_IMPORT=1` (variante « Routine Catalogue »).
 */
export const PILOT_IMPORT_ENABLED = process.env.EXPO_PUBLIC_KODJO_CATALOGUE_IMPORT === "1";

/**
 * Sélecteur de fichier chargé à la demande : le module natif `ExpoDocumentPicker` est requis à
 * l'évaluation de `expo-document-picker`. Un import statique ferait échouer l'écran Catalogue dans
 * tout binaire qui ne l'embarque pas (builds antérieures, servies par Metro ou OTA).
 */
async function pickAdminJson() {
  // Même motif que `MediaConsultation` pour `expo-video` : `require` évalué à l'appel seulement.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DocumentPicker = require("expo-document-picker") as typeof import("expo-document-picker");
  return DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
    multiple: false,
  });
}

export function PilotMovementImportCommand({ onImported }: { readonly onImported: () => void }) {
  const activityDefinitionService = useActivityDefinitionService();
  const [importing, setImporting] = useState(false);

  const handlePress = async () => {
    if (importing) return;
    try {
      const selection = await pickAdminJson();
      if (selection.canceled || !selection.assets[0]) return;
      const asset = selection.assets[0];
      const file = new File(asset.uri);
      const size = asset.size ?? file.size;
      if (size > PILOT_ADMIN_JSON_MAX_BYTES) {
        throw new Error("Fichier JSON de " + (size / 1048576).toFixed(1) + " Mo, supérieur à la limite de 24 Mo.");
      }
      const preview = preparePilotMovementImport(JSON.parse(await file.text()) as unknown);
      const catalogue = activityDefinitionService.movementCatalogue;
      if (!catalogue) throw new Error("Catalogue KODJO indisponible.");
      const warning = preview.excludedMediaCount
        ? " " + preview.excludedMediaCount + " média(s) resteront uniquement dans le fichier de brouillons original."
        : "";
      Alert.alert(
        "Importer 60 mouvements locaux ?",
        "Les 60 fiches seront ajoutées au Catalogue des Mouvements, sans créer de séances ni d'exercices. " +
          preview.overriddenCount + " fiche(s) reprennent tes modifications d'administration." +
          warning + " Aucun mouvement existant ne sera écrasé.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Importer",
            onPress: () => {
              setImporting(true);
              void installPilotMovements(catalogue, preview)
                .then(
                  (outcome) => {
                    onImported();
                    Alert.alert(
                      "Catalogue local mis à jour",
                      outcome.inserted + " mouvement(s) ajouté(s), " + outcome.unchanged +
                        " déjà identique(s). Les fiches ne sont pas publiées.",
                    );
                  },
                  (error: unknown) => {
                    onImported();
                    Alert.alert("Import refusé ou interrompu", error instanceof Error ? error.message : String(error));
                  },
                )
                .finally(() => setImporting(false));
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert("Fichier non importable", error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <Pressable
      onPress={() => { void handlePress(); }}
      disabled={importing}
      accessibilityRole="button"
      accessibilityLabel="Importer les mouvements pilotes depuis un fichier JSON"
      style={styles.button}
      testID="catalogue-import-pilot"
    >
      <Text style={styles.label}>{importing ? "Import local en cours…" : "Importer 60 fiches (test local)"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#B3C4E6",
    borderRadius: 8,
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2853A0",
  },
});
