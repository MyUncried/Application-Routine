import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { programStatus as statusOf, type ProgramStatus } from "@/domain/programs/Program";
import { strings } from "@/shared/i18n";
import { PROGRAM_RADIO_SIZE, ProgramCard, ProgramContext, useProgramSummaries } from "@/features/programs/ProgramCatalogue";
import { cardCountsLine, cardStatusLine, programCounts, visiblePrograms } from "@/features/programs/programPresentation";
import type { ProgramService } from "@/features/programs/ProgramService";
import { catalogueColors, CONTEXT_ZONE_GEOMETRY } from "@/shared/ui/catalogueContext";
import { ScreenShell } from "@/shared/ui/ScreenShell";
import { NativeSheetTop } from "@/shared/ui/SheetFixedTop";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";

/** « DSF / Controls / Radio » (`5544:4736` sélectionné, `5544:4739` vide) — mêmes visuels que les cartes du catalogue des mouvements (D-508). */
const RADIO_CHECKED = require("../../../assets/icons/radio-selectionne.svg");
const RADIO_EMPTY = require("../../../assets/icons/radio-non-selectionne.svg");

/**
 * Modale « Rattacher un programme » (D-545, Hermann, 23/11/2026 ; DSF Programmes § 3 ; Figma « P-Planifier une séance — Choix du
 * programme (proposition) » `13092:50055`) ouverte par la ligne Programme de « Planifier », à la place du menu iOS.
 * - Feuille native sur le modèle de « Catalogue des séances » de la planification (`NativeSheetTop`) : ✕ Annuler à gauche avec
 *   son halo, titre centré, **pas de bouton Valider**.
 * - Zone de contexte du catalogue des programmes (`ProgramContext`, sans Créer) : « Actifs N · Terminés M », Rechercher, Filtre,
 *   Tri ; cartes du catalogue (`ProgramCard`), bouton radio à droite.
 * - Sélection unique : toucher une carte non sélectionnée la choisit et ferme ; toucher la carte sélectionnée rend « Aucun »
 *   (D-332) et ferme. À l'ouverture, le programme actuel est sélectionné (et son statut, Actifs ou Terminés, est affiché).
 * Aucune écriture : le choix est appliqué par « Planifier » à l'enregistrement.
 */
export function ProgramChoiceSheet({
  service,
  selectedId,
  onCancel,
  onChoose,
}: {
  readonly service: ProgramService;
  readonly selectedId: string | null;
  readonly onCancel: () => void;
  readonly onChoose: (programId: string | null) => void;
}) {
  const t = strings.planning.programChoice;
  const insets = useSafeAreaInsets();
  const palette = catalogueColors("programs");
  const today = service.today();
  const { summaries, failed, reload } = useProgramSummaries(service);
  useEffect(() => {
    reload();
  }, [reload]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProgramStatus | null>(null);
  // Statut affiché : celui choisi, sinon celui du programme actuel (Actifs par défaut).
  const current = summaries?.find((summary) => summary.program.id === selectedId) ?? null;
  const shownStatus: ProgramStatus = status ?? (current !== null ? statusOf(current.program, today) : "ACTIVE");
  const counts = useMemo(() => (summaries === null ? null : programCounts(summaries.map((summary) => summary.program), today)), [summaries, today]);
  const visible = summaries === null ? [] : visiblePrograms(summaries, shownStatus, query, today);

  return (
    <ScreenShell backgroundColor={palette.background}>
      <NativeSheetTop
        title={t.title}
        onClose={onCancel}
        closeAccessibilityLabel={t.cancel}
        headerBackground={palette.background}
        bandColor={palette.context}
        bandPadding={{ top: CONTEXT_ZONE_GEOMETRY.paddingTop, bottom: CONTEXT_ZONE_GEOMETRY.paddingBottom }}
        band={<ProgramContext status={shownStatus} onChangeStatus={setStatus} counts={counts} query={query} onChangeQuery={setQuery} />}
        renderScroll={(topHeight) => (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.list, { paddingTop: topHeight + spacing[16], paddingBottom: insets.bottom + spacing[24] }]}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            testID="program-choice-list"
          >
            {summaries === null && !failed ? <ActivityIndicator color={colors.primary} /> : null}
            {failed ? <Text style={styles.message}>{t.loadError}</Text> : null}
            {visible.map((summary) => {
              const id = summary.program.id;
              const selected = id === selectedId;
              return (
                <Pressable
                  key={id}
                  onPress={() => onChoose(selected ? null : id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${summary.program.name}, ${cardStatusLine(summary.program, today)}, ${cardCountsLine(summary)}, ${selected ? t.selected : t.unselected}`}
                  accessibilityHint={selected ? t.selectedHint : t.unselectedHint}
                  testID={`program-choice-${id}`}
                >
                  <ProgramCard
                    summary={summary}
                    today={today}
                    accessory={
                      <Image
                        source={selected ? RADIO_CHECKED : RADIO_EMPTY}
                        style={styles.radio}
                        accessible={false}
                        testID={`program-choice-${id}-${selected ? "selected" : "empty"}`}
                      />
                    }
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  // Figma `13092:50055` : cartes à 16 des bords, 12 entre elles (catalogue des programmes).
  list: { paddingHorizontal: layout.screenGutter, gap: spacing[12] },
  radio: { width: PROGRAM_RADIO_SIZE, height: PROGRAM_RADIO_SIZE },
  message: { ...type.body, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing[24] },
});
