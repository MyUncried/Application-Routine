import { Pressable, StyleSheet, Text, View } from "react-native";

import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import type { ImportedMovementInfo } from "@/features/catalogue/importedMovements";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * A-2 : un Mouvement importé n'a pas de crayon « Modifier le mouvement ».
 *
 * Recette du 11/11/2026 (Hermann, a1-lecture-seule) : « Ne laisser que le symbole, dans un cadre tel que celui de
 * l'édition. A l'appui, affichage des information complémentaires de la fiche (source, propriétaire, auteur, éditeur,
 * version, etc.) Réappuyer sur la fiche ferme la fenêtre d'information. »
 * Cadre identique au crayon (`EditMovementAction` : 40 × 32, rayon 10, fond #F3F4F9) ; icône livre de Figma
 * (12119:25409). Ouvert : fond bleu KODJO, icône blanche, comme le crayon actif.
 */
const FRAME = { width: 40, height: 32, radius: 10, background: "#F3F4F9" } as const;
const L = strings.libraries.importedBadge;

export function ImportedMovementAction({ open, onPress }: { readonly open: boolean; readonly onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={L.accessibilityLabel}
      accessibilityHint={open ? L.closeHint : L.openHint}
      accessibilityState={{ expanded: open }}
      hitSlop={{
        top: (minTouchTarget - FRAME.height) / 2,
        bottom: (minTouchTarget - FRAME.height) / 2,
        left: (minTouchTarget - FRAME.width) / 2,
        right: (minTouchTarget - FRAME.width) / 2,
      }}
      style={[styles.action, open ? styles.actionOpen : null]}
      testID="movement-imported-badge"
    >
      <KodjoIcon name="library-book-source" tintColor={open ? colors.background : undefined} />
    </Pressable>
  );
}

const ORIGIN_LABELS: Record<string, string> = L.origins;

function day(iso: string): string {
  const value = new Date(iso);
  return Number.isNaN(value.getTime()) ? iso : value.toLocaleDateString("fr-FR");
}

/** Lignes de la fenêtre d'information (exportées pour les tests). */
export function importedInfoRows(info: ImportedMovementInfo): readonly (readonly [string, string])[] {
  const unknown = L.unknown;
  return [
    [L.rows.library, info.libraries.join(", ") || "—"],
    [L.rows.catalogue, info.catalogueId],
    [L.rows.source, info.upstream
      ? `${info.upstream.catalogueId.replace(/^xlsx:/, "")} · ${info.upstream.sheetId} · ${info.upstream.revision}`
      : ORIGIN_LABELS[info.origin] ?? info.origin],
    [L.rows.owner, info.owner ?? unknown],
    [L.rows.author, info.author ?? unknown],
    [L.rows.editor, info.editors.join(", ") || info.publisher || unknown],
    [L.rows.rightsHolder, info.rightsHolder ?? unknown],
    [L.rows.license, info.license ?? unknown],
    [L.rows.version, fillTemplate(L.version, { revision: info.revision, installed: day(info.installedAt) }) +
      (info.updatedAt !== info.installedAt ? fillTemplate(L.versionUpdated, { updated: day(info.updatedAt) }) : "")],
  ];
}

/** Fenêtre d'information de la fiche ; un appui sur la fenêtre ou sur le symbole la ferme. */
export function ImportedMovementInfoPanel({ info, onClose }: { readonly info: ImportedMovementInfo; readonly onClose: () => void }) {
  return (
    <Pressable
      onPress={onClose}
      accessibilityRole="button"
      accessibilityLabel={L.panelAccessibilityLabel}
      style={styles.panel}
      testID="movement-imported-info"
    >
      {importedInfoRows(info).map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    width: FRAME.width,
    height: FRAME.height,
    borderRadius: FRAME.radius,
    backgroundColor: FRAME.background,
    alignItems: "center",
    justifyContent: "center",
  },
  actionOpen: { backgroundColor: colors.primary },
  panel: {
    marginHorizontal: spacing[16],
    marginVertical: spacing[8],
    padding: spacing[12],
    gap: spacing[6],
    borderRadius: 12,
    backgroundColor: colors.contextBand,
  },
  row: { flexDirection: "row", gap: spacing[8] },
  label: { ...type.supporting, color: colors.textSecondary, width: 96 },
  value: { ...type.supporting, color: colors.textPrimary, flex: 1 },
});
