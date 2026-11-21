import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { Routine } from "@/domain/planning/Routine";
import { ScreenShell } from "@/shared/ui/ScreenShell";
import { ModalCancelAction } from "@/shared/ui/ModalHeaderActions";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";

import { routineSlotLine } from "./programPresentation";
import type { ProgramService } from "./ProgramService";
import { programStrings } from "./programStrings";

/**
 * « Rattacher une routine existante » (D-549) : liste des routines du calendrier qui n'appartiennent à aucun programme.
 * Toucher une routine la rattache au programme et ferme la feuille. [Interprétation : rattachement d'une routine à la fois,
 * aucune maquette dédiée ; la proposition automatique et l'avertissement hors période sont hors périmètre.]
 */
const t = programStrings.attach;

export function ProgramAttachSheet({
  service,
  programId,
  onAttached,
  onClose,
}: {
  readonly service: ProgramService;
  readonly programId: string;
  readonly onAttached: () => void;
  readonly onClose: () => void;
}) {
  const [routines, setRoutines] = useState<readonly Routine[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    service.unattachedRoutines().then(
      (list) => {
        if (!cancelled) setRoutines(list);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [service]);

  const attach = (routineId: string) => {
    service.attachRoutine(routineId, programId).then(
      () => {
        onAttached();
        onClose();
      },
      () => setFailed(true),
    );
  };

  return (
    <ScreenShell backgroundColor={colors.catalogueProgramsBackground}>
      <View style={styles.header}>
        <ModalCancelAction onPress={onClose} accessibilityLabel={t.cancel} testID="program-attach-cancel" />
        <Text style={styles.title} accessibilityRole="header">
          {t.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content} testID="program-attach-list">
        {failed ? <Text style={styles.error}>{programStrings.catalogue.actionError}</Text> : null}
        {routines !== null && routines.length === 0 ? (
          <Text style={styles.message} testID="program-attach-empty">
            {t.empty}
          </Text>
        ) : null}
        {routines !== null && routines.length > 0 ? (
          <View style={styles.card}>
            {routines.map((routine, index) => (
              <View key={routine.id}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <Pressable
                  onPress={() => attach(routine.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.validate} ${routine.name}`}
                  style={styles.row}
                  testID={`program-attach-${routine.id}`}
                >
                  <Text style={styles.name} numberOfLines={1}>
                    {routine.name}
                  </Text>
                  <Text style={styles.line} numberOfLines={1}>
                    {routineSlotLine(routine)}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 56, paddingHorizontal: spacing[12] + 5, backgroundColor: colors.background },
  title: { ...type.modalTitle, color: colors.textPrimary, flexShrink: 1, textAlign: "center" },
  headerSpacer: { width: 38 },
  content: { padding: layout.screenGutter, gap: spacing[12] },
  card: { backgroundColor: colors.background, borderRadius: 12, overflow: "hidden" },
  row: { paddingHorizontal: spacing[12], paddingVertical: spacing[12], gap: 4 },
  name: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 14, color: colors.textPrimary },
  line: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 12, color: "#9499A8" },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing[12] },
  message: { ...type.body, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing[24] },
  error: { ...type.supporting, color: colors.danger },
});
