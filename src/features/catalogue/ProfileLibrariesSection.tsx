/**
 * A1 — Sections « Bibliothèques » et « Bibliothèques installées » du Profil (Figma 12119:25611,
 * premier lot, A-4 du 11/11/2026) : « Ajouter une bibliothèque », « Envoyer mes mouvements »,
 * Bibliothèques installées avec pastille « Mettre à jour » lorsqu'une révision est connue, et
 * reprise d'une opération interrompue. « Mes bibliothèques », « Bibliothèques partagées » et la
 * désinstallation sont hors premier lot (écrans Figma conservés, non développés).
 * Profil n'est pas un éditeur de Mouvement : la création et la modification restent au Catalogue.
 *
 * Correction du 11/11/2026 (mise en page Figma) : intitulé de section en Inter Regular 11 #595E66 AU-DESSUS
 * de chaque carte (12119:25636, 12119:25644), icône à gauche de chaque ligne (Ajouter 12119:25658, Envoyer
 * 12119:25659, livre d'une bibliothèque installée 12119:25646) et chevron SVG « Aller » (12119:25649) à droite.
 */
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import type { InstalledLibraryRecord } from "@/domain/catalogue/libraryPlan";
import type { LibraryProgress } from "@/features/catalogue/LibraryService";
import { librarySession } from "@/features/catalogue/librarySession";
import { plural } from "@/features/catalogue/libraryPresentation";
import { Card, Divider, Pill, Row, Section } from "@/features/catalogue/libraryUi";
import { useLibraryServices } from "@/features/catalogue/useLibraryServices";
import { spacing } from "@/shared/ui/tokens";

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
      <Section label="Bibliothèques">
        <Card>
          <Row
            icon="library-add"
            title="Ajouter une bibliothèque"
            subtitle="Depuis un fichier ou l'administration (PC)"
            onPress={() => router.push("/library-add")}
            testID="profile-libraries-add"
          />
          <Divider />
          <Row
            icon="library-send"
            title="Envoyer mes mouvements"
            subtitle="Vers l'administration (PC)"
            onPress={() => router.push("/library-send")}
            testID="profile-libraries-send"
          />
        </Card>
      </Section>
      {installed.length > 0 || interrupted.length > 0 ? (
        <Section label="Bibliothèques installées" testID="profile-libraries-installed">
          <Card>
            {interrupted.map((operation, index) => (
              <View key={"op/" + operation.catalogueId + "/" + operation.libraryId}>
                {index > 0 ? <Divider /> : null}
                <Row
                  icon="library-book-profile"
                  title={operation.title}
                  subtitle={`${operation.kind === "UPDATE" ? "Mise à jour" : "Installation"} interrompue · ${operation.applied} sur ${operation.total}`}
                  pill={<Pill label="Reprendre" tone="warning" />}
                  onPress={() => router.push({ pathname: "/library-resume", params: { catalogueId: operation.catalogueId, libraryId: operation.libraryId } })}
                  testID={`profile-libraries-resume-${operation.libraryId}`}
                />
              </View>
            ))}
            {installed.map((library, index) => {
              const preview = librarySession.preview(library.catalogueId, library.libraryId);
              const update = preview?.status === "UPDATE_AVAILABLE";
              const count = plural(library.library.members.length, "mouvement", "mouvements");
              return (
                <View key={library.catalogueId + "/" + library.libraryId}>
                  {index > 0 || interrupted.length > 0 ? <Divider /> : null}
                  <Row
                    icon="library-book-profile"
                    title={library.library.title}
                    subtitle={update ? count : `${count} · à jour`}
                    pill={update ? <Pill label="Mettre à jour" tone="action" testID={`profile-libraries-update-${library.libraryId}`} /> : undefined}
                    onPress={() => router.push({ pathname: "/library-installed", params: { catalogueId: library.catalogueId, libraryId: library.libraryId } })}
                    testID={`profile-libraries-installed-${library.libraryId}`}
                  />
                </View>
              );
            })}
          </Card>
        </Section>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing[16] },
});
