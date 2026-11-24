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
 *
 * Décision de Hermann du 12/11/2026 et recette c2 (« se référer à Figma, écran P-Profil — Modifier le profil — Sections
 * sans bibliothèque », 12116:25015) : deux sections. « Mes bibliothèques » : ligne « Créer une bibliothèque » puis
 * les Bibliothèques de l'utilisateur ; « Bibliothèques installées », toujours affichée : première ligne « Ajouter une
 * bibliothèque », puis les Bibliothèques installées. [Avant : section « Bibliothèques » (Ajouter, Envoyer) et section
 * « Bibliothèques installées » affichée seulement si non vide — remplacé.]
 * « Créer une bibliothèque » ouvre l'écran Figma 12206:26111 ; les Bibliothèques personnelles suivent, chacune vers
 * « Ma bibliothèque » (12210:26150) — décision de Hermann du 12/11/2026 : « Suivre les écrans Figma, tu peux commencer ».
 * [Avant : « Créer une bibliothèque » n'ouvrait rien (spécification en attente) — remplacé.]
 * Décision de Hermann du 12/11/2026 : « on retire "Envoyer mes mouvements" il n'y a pas de scénario pour cela. On
 * partage une bibliothèque de mouvements, pas des mouvements individuels. » [Avant : ligne « Envoyer mes mouvements »
 * (A2) — remplacé.]
 */
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import type { InstalledLibraryRecord } from "@/domain/catalogue/libraryPlan";
import type { PersonalLibrary } from "@/domain/catalogue/personalLibrary";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import type { LibraryProgress } from "@/features/catalogue/LibraryService";
import { refreshInstalledStatusSilently } from "@/features/catalogue/adminLibraryRefresh";
import { librarySession } from "@/features/catalogue/librarySession";
import { plural } from "@/features/catalogue/libraryPresentation";
import { Card, Divider, Pill, Row, Section } from "@/features/catalogue/libraryUi";
import { useLibraryServices } from "@/features/catalogue/useLibraryServices";
import { strings } from "@/shared/i18n";
import { spacing } from "@/shared/ui/tokens";

const L = strings.libraries.profileSection;
const C = strings.libraries.common;

export function ProfileLibrariesSection() {
  const router = useRouter();
  const { services } = useLibraryServices();
  const [installed, setInstalled] = useState<readonly InstalledLibraryRecord[]>([]);
  const [interrupted, setInterrupted] = useState<readonly LibraryProgress[]>([]);
  const [mine, setMine] = useState<readonly PersonalLibrary[]>([]);
  // Statut relu auprès du PC appairé (aperçus de la session) : nouveau rendu une fois la lecture faite.
  const [, setStatusReadAt] = useState(0);

  useFocusEffect(useCallback(() => {
    if (!services) return;
    let cancelled = false;
    void (async () => {
      const [list, pending, personal] = [
        await services.libraries.installed(),
        await services.libraries.interrupted(),
        await services.personal.list(),
      ];
      if (!cancelled) {
        setInstalled(list);
        setInterrupted(pending);
        setMine(personal);
      }
      // Recette du 15/11/2026 (autres remarques : « le statut des bibliothèques installées devrait être mis à jour
      // automatiquement à l'affichage de cet écran, sans avoir à passer par Ajouter une bibliothèque ») : relecture
      // silencieuse de l'administration appairée, après l'affichage de ce qui est connu.
      if (list.length > 0 && (await refreshInstalledStatusSilently(services)) && !cancelled) setStatusReadAt(Date.now());
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [services]));

  return (
    <View style={styles.sections} testID="profile-libraries">
      <Section label={L.mine} testID="profile-libraries-mine">
        <Card>
          <Row
            icon="library-add"
            title={L.create}
            onPress={() => router.push("/library-edit")}
            testID="profile-libraries-create"
          />
          {mine.map((library) => (
            <View key={"mine/" + library.libraryId}>
              <Divider />
              <Row
                icon="library-book-profile"
                title={library.title}
                subtitle={plural(library.movementIds.length, C.movementSingular, C.movementPlural)}
                onPress={() => router.push({ pathname: "/library-mine", params: { libraryId: library.libraryId } })}
                testID={`profile-libraries-mine-${library.libraryId}`}
              />
            </View>
          ))}
        </Card>
      </Section>
      <Section label={L.installed} testID="profile-libraries-installed">
        <Card>
          <Row
            icon="library-add"
            title={L.add}
            subtitle={L.addSubtitle}
            onPress={() => router.push("/library-add")}
            testID="profile-libraries-add"
          />
          {interrupted.map((operation) => (
            <View key={"op/" + operation.catalogueId + "/" + operation.libraryId}>
              <Divider />
              <Row
                icon="library-book-profile"
                title={operation.title}
                subtitle={fillTemplate(operation.kind === "UPDATE" ? L.interruptedUpdate : L.interruptedInstall, { applied: String(operation.applied), total: String(operation.total) })}
                pill={<Pill label={L.resume} tone="warning" />}
                onPress={() => router.push({ pathname: "/library-resume", params: { catalogueId: operation.catalogueId, libraryId: operation.libraryId } })}
                testID={`profile-libraries-resume-${operation.libraryId}`}
              />
            </View>
          ))}
          {installed.map((library) => {
            const preview = librarySession.preview(library.catalogueId, library.libraryId);
            const update = preview?.status === "UPDATE_AVAILABLE";
            const count = plural(library.library.members.length, C.movementSingular, C.movementPlural);
            return (
              <View key={library.catalogueId + "/" + library.libraryId}>
                <Divider />
                <Row
                  icon="library-book-profile"
                  title={library.library.title}
                  subtitle={update ? count : fillTemplate(L.upToDate, { count })}
                  pill={update ? <Pill label={L.update} tone="action" testID={`profile-libraries-update-${library.libraryId}`} /> : undefined}
                  onPress={() => router.push({ pathname: "/library-installed", params: { catalogueId: library.catalogueId, libraryId: library.libraryId } })}
                  testID={`profile-libraries-installed-${library.libraryId}`}
                />
              </View>
            );
          })}
        </Card>
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing[16] },
});
