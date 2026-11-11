/**
 * A1 — Sections « Bibliothèques » et « Bibliothèques installées » du Profil (Figma 12119:25611,
 * premier lot, A-4 du 11/11/2026) : « Ajouter une bibliothèque », « Envoyer mes mouvements »,
 * Bibliothèques installées avec pastille « Mettre à jour » lorsqu'une révision est connue, et
 * reprise d'une opération interrompue. « Mes bibliothèques », « Bibliothèques partagées » et la
 * désinstallation sont hors premier lot (écrans Figma conservés, non développés).
 * Profil n'est pas un éditeur de Mouvement : la création et la modification restent au Catalogue.
 */
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { InstalledLibraryRecord } from "@/domain/catalogue/libraryPlan";
import type { LibraryProgress } from "@/features/catalogue/LibraryService";
import { librarySession } from "@/features/catalogue/librarySession";
import { plural } from "@/features/catalogue/libraryPresentation";
import { Divider, Pill, Row } from "@/features/catalogue/libraryUi";
import { useLibraryServices } from "@/features/catalogue/useLibraryServices";
import { colors, spacing, type } from "@/shared/ui/tokens";

export function ProfileLibrariesSection() {
  const router = useRouter();
  const { services } = useLibraryServices();
  const [installed, setInstalled] = useState<readonly InstalledLibraryRecord[]>([]);
  const [interrupted, setInterrupted] = useState<readonly LibraryProgress[]>([]);

  useFocusEffect(useCallback(() => {
    if (!services) return;
    let cancelled = false;
    void (async () => {
      const [list, pending] = [await services.libraries.installed(), await services.libraries.interrupted()];
      if (!cancelled) {
        setInstalled(list);
        setInterrupted(pending);
      }
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [services]));

  return (
    <View style={styles.sections} testID="profile-libraries">
      <View style={styles.group}>
        <Text style={styles.groupTitle} accessibilityRole="header">Bibliothèques</Text>
        <Row
          title="Ajouter une bibliothèque"
          subtitle="Depuis un fichier ou l'administration (PC)"
          onPress={() => router.push("/library-add")}
          testID="profile-libraries-add"
        />
        <Divider />
        <Row
          title="Envoyer mes mouvements"
          subtitle="Vers l'administration (PC)"
          onPress={() => router.push("/library-send")}
          testID="profile-libraries-send"
        />
      </View>
      {installed.length > 0 || interrupted.length > 0 ? (
        <View style={styles.group} testID="profile-libraries-installed">
          <Text style={styles.groupTitle} accessibilityRole="header">Bibliothèques installées</Text>
          {interrupted.map((operation) => (
            <Row
              key={"op/" + operation.catalogueId + "/" + operation.libraryId}
              title={operation.title}
              subtitle={`${operation.kind === "UPDATE" ? "Mise à jour" : "Installation"} interrompue · ${operation.applied} sur ${operation.total}`}
              pill={<Pill label="Reprendre" tone="warning" />}
              onPress={() => router.push({ pathname: "/library-resume", params: { catalogueId: operation.catalogueId, libraryId: operation.libraryId } })}
              testID={`profile-libraries-resume-${operation.libraryId}`}
            />
          ))}
          {installed.map((library, index) => {
            const preview = librarySession.preview(library.catalogueId, library.libraryId);
            const update = preview?.status === "UPDATE_AVAILABLE";
            const count = plural(library.library.members.length, "mouvement", "mouvements");
            return (
              <View key={library.catalogueId + "/" + library.libraryId}>
                {index > 0 || interrupted.length > 0 ? <Divider /> : null}
                <Row
                  title={library.library.title}
                  subtitle={update ? count : `${count} · à jour`}
                  pill={update ? <Pill label="Mettre à jour" tone="action" testID={`profile-libraries-update-${library.libraryId}`} /> : undefined}
                  onPress={() => router.push({ pathname: "/library-installed", params: { catalogueId: library.catalogueId, libraryId: library.libraryId } })}
                  testID={`profile-libraries-installed-${library.libraryId}`}
                />
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing[16] },
  group: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  groupTitle: { ...type.sectionTitle, color: colors.textPrimary, paddingTop: spacing[8] },
});
