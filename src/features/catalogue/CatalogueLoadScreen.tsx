import { Host, Picker as SwiftUIPicker, Text as SwiftUIText } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { CatalogueIssue } from "@/domain/catalogue/MovementCatalogueFile";
import type { FieldComparison, ProjectedField, SheetLoadItem } from "@/domain/catalogue/catalogueLoadPlan";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import {
  CatalogueLoadService,
  type AcceptOutcome,
  type ConflictResolution,
  type ConflictResolutions,
  type PreparedCatalogueLoad,
} from "@/features/catalogue/CatalogueLoadService";
import {
  DECIDABLE_STATES,
  STATE_LABELS,
  STATE_ORDER,
  fieldLabel,
  formatValue,
  orderedComparison,
  referenceLabels,
  shortSummary,
  summaryLines,
  warningLines,
} from "@/features/catalogue/catalogueLoadPresentation";
import { pickCatalogueFile } from "@/features/catalogue/pickCatalogueFile";
import { freshLocalMovementReader } from "@/features/catalogue/readLocalMovements";
import type { SqliteCatalogueRegistry } from "@/infrastructure/catalogue/SqliteCatalogueRegistry";
import { colors } from "@/shared/ui/tokens";

/**
 * CA-4 — Écran de recette « Charger un catalogue » (variante « Routine Catalogue », hors MVP, sans
 * référence Figma). Remplace « Importer 60 fiches ».
 *
 * Décisions de Hermann du 10/11/2026 : fiche par fiche ; résumé systématique avant acceptation,
 * même sans conflit ; comparaison détaillée champ par champ à la demande, conflits identifiés ;
 * en conflit, rien n'est écrit sans un choix explicite par champ (sélecteur segmenté natif) ;
 * aucune fusion automatique. Seules les fiches « déjà présentes, identiques » (aucune modification
 * du mouvement) peuvent être rattachées ensemble, après confirmation.
 */

type OpenedRegistry = { registry: SqliteCatalogueRegistry; closeAsync(): Promise<void> };

export type CatalogueLoadScreenProps = {
  readonly openRegistry?: () => Promise<OpenedRegistry>;
  readonly pickFile?: () => Promise<unknown | null>;
  readonly newMovementId?: () => string;
};

type Phase =
  | { readonly kind: "idle" }
  | { readonly kind: "busy"; readonly label: string }
  | { readonly kind: "invalid"; readonly issues: readonly CatalogueIssue[] }
  | { readonly kind: "ready"; readonly prepared: Extract<PreparedCatalogueLoad, { ok: true }> };

const RESOLUTION_LABELS: Readonly<Record<ConflictResolution, string>> = {
  KEEP_LOCAL: "Garder ma valeur",
  TAKE_INCOMING: "Prendre la nouvelle",
};

async function defaultOpenRegistry(): Promise<OpenedRegistry> {
  // Chargé à l'appel : ouvre la base distincte `kodjo-catalogue-registry.db` (expo-sqlite).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { openCatalogueRegistry } = require("@/infrastructure/catalogue/openCatalogueRegistry") as typeof import("@/infrastructure/catalogue/openCatalogueRegistry");
  return openCatalogueRegistry();
}

function outcomeMessage(outcome: AcceptOutcome): { title: string; message: string } {
  switch (outcome.status) {
    case "INSTALLED": return { title: "Fiche installée", message: "Le mouvement a été ajouté au Catalogue." };
    case "ADOPTED": return { title: "Fiche rattachée", message: "Le mouvement existant n'a pas été modifié." };
    case "UPDATED": return { title: "Révision acceptée", message: "Le mouvement a été mis à jour ; tes autres modifications sont conservées." };
    case "REGISTERED": return { title: "Révision acceptée", message: "Le mouvement n'a pas été modifié." };
    case "RESOLUTION_REQUIRED": return { title: "Choix nécessaire", message: "Choisis une valeur pour : " + outcome.fields.map(fieldLabel).join(", ") + "." };
    case "BLOCKED": return { title: "Fiche bloquée", message: "Catégorie, Zone ou nom incompatible avec ce téléphone. Rien n'a été écrit." };
    case "NOT_APPLICABLE": return { title: "Aucune action", message: "L'état de la fiche a changé : " + STATE_LABELS[outcome.state] + "." };
    case "MOVEMENT_REFUSED": return { title: "Mouvement refusé", message: "Le Catalogue a refusé l'écriture (" + outcome.reason + "). Rien n'a été écrit." };
    case "UNKNOWN_SHEET": return { title: "Fiche introuvable", message: "La fiche n'est plus dans le fichier." };
    case "PERSONAL_RULE_PENDING": return { title: "Rattachement en attente", message: "Ce mouvement personnel n'est pas rattaché à la fiche tant que la règle n'est pas arbitrée. Rien n'a été écrit." };
  }
}

export function CatalogueLoadScreen({
  openRegistry = defaultOpenRegistry,
  pickFile = pickCatalogueFile,
  newMovementId = Crypto.randomUUID,
}: CatalogueLoadScreenProps) {
  const activityDefinitionService = useActivityDefinitionService();
  const [registry, setRegistry] = useState<OpenedRegistry | null>(null);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [resolutions, setResolutions] = useState<ConflictResolutions>({});
  const working = useRef(false);

  useEffect(() => {
    let opened: OpenedRegistry | null = null;
    let cancelled = false;
    openRegistry().then(
      (result) => {
        if (cancelled) { void result.closeAsync(); return; }
        opened = result;
        setRegistry(result);
      },
      (error: unknown) => { if (!cancelled) setRegistryError(error instanceof Error ? error.message : String(error)); },
    );
    return () => {
      cancelled = true;
      if (opened) void opened.closeAsync();
    };
  }, [openRegistry]);

  const service = useMemo(() => {
    const movements = activityDefinitionService.movementCatalogue;
    const reader = activityDefinitionService.freshMovementReader;
    if (!registry || !movements || !reader) return null;
    return new CatalogueLoadService({
      registry: registry.registry,
      movements,
      readLocalMovements: freshLocalMovementReader(reader),
      listReferentials: async () => ({
        categoryIds: new Set((await activityDefinitionService.listCategories()).map((category) => category.id)),
        bodyZoneIds: new Set((await activityDefinitionService.listBodyZones()).map((zone) => zone.id)),
      }),
      newMovementId,
    });
  }, [registry, activityDefinitionService, newMovementId]);

  const prepared = phase.kind === "ready" ? phase.prepared : null;
  const labels = useMemo(() => (prepared ? referenceLabels(prepared.file) : new Map<string, string>()), [prepared]);
  const selected = prepared?.plan.items.find((item) => item.sheetId === selectedSheetId) ?? null;

  /** Exécute une opération en série ; recalcule le plan ensuite (jamais de décision sur un plan ancien). */
  const run = useCallback(async (label: string, task: () => Promise<void>) => {
    if (working.current) return;
    working.current = true;
    const previous = phase;
    setPhase({ kind: "busy", label });
    try {
      await task();
    } catch (error) {
      setPhase(previous);
      Alert.alert("Opération interrompue", (error instanceof Error ? error.message : String(error)) +
        " Le prochain chargement reprendra l'opération sans doublon.");
    } finally {
      working.current = false;
    }
  }, [phase]);

  const reload = useCallback(async (raw: unknown) => {
    if (!service) throw new Error("Catalogue indisponible.");
    const result = await service.prepare(raw);
    setPhase(result.ok ? { kind: "ready", prepared: result } : { kind: "invalid", issues: result.issues });
    if (result.ok && (result.recovery.completed.length > 0 || result.recovery.abandoned.length > 0)) {
      Alert.alert("Reprise après interruption",
        `${result.recovery.completed.length} opération(s) confirmée(s), ${result.recovery.abandoned.length} abandonnée(s) et reproposée(s).`);
    }
  }, [service]);

  const handlePick = () => {
    void run("Lecture du fichier…", async () => {
      const raw = await pickFile();
      if (raw === null) { setPhase(phase); return; }
      setSelectedSheetId(null);
      await reload(raw);
    }).catch(() => {});
  };

  const backToList = () => {
    setSelectedSheetId(null);
    setShowComparison(false);
    setResolutions({});
  };

  const decide = (item: SheetLoadItem, action: "ACCEPT" | "DEFER" | "REFUSE") => {
    if (!prepared || !service) return;
    const file = prepared.file;
    const perform = () => run("Enregistrement…", async () => {
      if (action === "ACCEPT") {
        const outcome = await service.accept(file, item.sheetId, resolutions);
        const { title, message } = outcomeMessage(outcome);
        await reload(file);
        if (outcome.status !== "RESOLUTION_REQUIRED") backToList();
        Alert.alert(title, message);
      } else {
        const outcome = action === "DEFER" ? await service.defer(file, item.sheetId) : await service.refuse(file, item.sheetId);
        await reload(file);
        backToList();
        Alert.alert(
          outcome.status === "RECORDED" ? (action === "DEFER" ? "Révision reportée" : "Révision refusée") : "Aucune action",
          outcome.status === "RECORDED"
            ? (action === "DEFER" ? "Elle sera reproposée au prochain chargement." : "Elle ne sera plus proposée ; une révision ultérieure le sera.")
            : "L'état de la fiche a changé.",
        );
      }
    });
    if (action === "DEFER") { void perform(); return; }
    const summary = summaryLines(item, labels).join("\n");
    Alert.alert(
      action === "ACCEPT" ? `Accepter « ${item.name} » ?` : `Refuser la révision ${item.revision} ?`,
      action === "ACCEPT" ? summary : "Le mouvement n'est pas modifié. Cette révision ne sera plus proposée.",
      [
        { text: "Annuler", style: "cancel" },
        { text: action === "ACCEPT" ? "Accepter" : "Refuser", style: action === "REFUSE" ? "destructive" : "default", onPress: () => { void perform(); } },
      ],
    );
  };

  const adoptAll = (items: readonly SheetLoadItem[]) => {
    if (!prepared || !service) return;
    const file = prepared.file;
    Alert.alert(
      `Rattacher ${items.length} fiche(s) identique(s) ?`,
      "Ces mouvements sont déjà sur ce téléphone, identiques aux fiches : aucun mouvement ne sera modifié. Seul l'historique d'installation est enregistré.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Rattacher",
          onPress: () => {
            void run("Rattachement…", async () => {
              let adopted = 0;
              for (const item of items) {
                if ((await service.accept(file, item.sheetId)).status === "ADOPTED") adopted++;
              }
              await reload(file);
              Alert.alert("Fiches rattachées", `${adopted} fiche(s) rattachée(s), aucun mouvement modifié.`);
            });
          },
        },
      ],
    );
  };

  if (registryError) {
    return <Centered text={"Registre du catalogue indisponible : " + registryError} />;
  }
  if (!service) return <Centered text="Préparation…" />;

  if (selected && prepared) {
    const conflicts = selected.summary.conflicts;
    const unresolved = conflicts.filter((field) => resolutions[field] === undefined);
    const decidable = DECIDABLE_STATES.has(selected.state);
    const canAccept = decidable && selected.blockers.length === 0 && unresolved.length === 0;
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} testID="catalogue-load-sheet">
        <Pressable onPress={backToList} accessibilityRole="button" testID="catalogue-load-back">
          <Text style={styles.link}>‹ Toutes les fiches</Text>
        </Pressable>
        <Text style={styles.title}>{selected.name}</Text>
        <Text style={styles.meta}>{STATE_LABELS[selected.state]} · fiche {selected.sheetId} · révision {selected.revision}</Text>
        <View style={styles.box} testID="catalogue-load-summary">
          {summaryLines(selected, labels).map((line) => <Text key={line} style={styles.body}>{line}</Text>)}
        </View>
        {selected.comparison.length > 0 ? (
          <Pressable onPress={() => setShowComparison((value) => !value)} accessibilityRole="button" testID="catalogue-load-toggle-comparison">
            <Text style={styles.link}>{showComparison ? "Masquer la comparaison détaillée" : `Comparaison détaillée (${selected.comparison.length} champ(s))`}</Text>
          </Pressable>
        ) : null}
        {showComparison || conflicts.length > 0 ? (
          <View testID="catalogue-load-comparison">
            {orderedComparison(selected.comparison)
              .filter((entry) => showComparison || entry.conflict)
              .map((entry) => (
                <ComparisonRow
                  key={entry.path}
                  entry={entry}
                  labels={labels}
                  resolution={entry.conflict ? resolutions[entry.path as ProjectedField] : undefined}
                  onResolve={(value) => setResolutions((current) => ({ ...current, [entry.path]: value }))}
                />
              ))}
          </View>
        ) : null}
        {decidable ? (
          <View style={styles.actions}>
            <ActionButton label="Accepter" disabled={!canAccept} onPress={() => decide(selected, "ACCEPT")} testID="catalogue-load-accept" primary />
            <ActionButton label="Reporter" onPress={() => decide(selected, "DEFER")} testID="catalogue-load-defer" />
            <ActionButton label="Refuser" onPress={() => decide(selected, "REFUSE")} testID="catalogue-load-refuse" />
          </View>
        ) : null}
        {decidable && unresolved.length > 0 ? (
          <Text style={styles.hint}>Choisis une valeur pour chaque conflit avant d’accepter. Sinon, reporte la révision : ta valeur reste en place.</Text>
        ) : null}
      </ScrollView>
    );
  }

  const items = prepared?.plan.items ?? [];
  const adoptable = items.filter((item) => item.state === "ADOPTABLE");
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} testID="catalogue-load-screen">
      <ActionButton
        label={phase.kind === "busy" ? phase.label : prepared ? "Choisir un autre fichier" : "Choisir un fichier catalogue"}
        disabled={phase.kind === "busy"}
        onPress={handlePick}
        testID="catalogue-load-pick"
        primary
      />
      {phase.kind === "idle" ? (
        <Text style={styles.body}>Sélectionne un fichier KODJO_MOVEMENT_CATALOGUE. Rien n’est écrit avant ta décision, fiche par fiche.</Text>
      ) : null}
      {phase.kind === "invalid" ? (
        <View style={styles.box} testID="catalogue-load-invalid">
          <Text style={styles.danger}>Fichier refusé : {phase.issues.length} problème(s). Rien n’a été lu ni écrit.</Text>
          {phase.issues.slice(0, 20).map((issue) => (
            <Text key={issue.path + issue.code} style={styles.meta}>{issue.path} — {issue.code}{issue.detail ? ` (${issue.detail})` : ""}</Text>
          ))}
        </View>
      ) : null}
      {prepared ? (
        <>
          <Text style={styles.title}>{prepared.file.catalogue.title}</Text>
          <Text style={styles.meta}>{prepared.file.catalogue.id} · révision {prepared.file.catalogue.revision} · {items.length} fiche(s)</Text>
          {warningLines(prepared.warnings).map((line) => <Text key={line} style={styles.warning}>{line}</Text>)}
          {adoptable.length > 0 ? (
            <ActionButton label={`Rattacher les ${adoptable.length} fiche(s) identique(s)`} onPress={() => adoptAll(adoptable)} testID="catalogue-load-adopt-all" />
          ) : null}
          {STATE_ORDER.map((state) => {
            const group = items.filter((item) => item.state === state);
            if (group.length === 0) return null;
            return (
              <View key={state} testID={`catalogue-load-group-${state}`}>
                <Text style={styles.section}>{STATE_LABELS[state]} ({group.length})</Text>
                {group.map((item) => (
                  <Pressable
                    key={item.sheetId}
                    onPress={() => { setSelectedSheetId(item.sheetId); setShowComparison(false); setResolutions({}); }}
                    accessibilityRole="button"
                    style={styles.row}
                    testID={`catalogue-load-item-${item.sheetId}`}
                  >
                    <Text style={styles.rowTitle}>{item.name}</Text>
                    {shortSummary(item) ? <Text style={styles.meta}>{shortSummary(item)}</Text> : null}
                  </Pressable>
                ))}
              </View>
            );
          })}
        </>
      ) : null}
    </ScrollView>
  );
}

function ComparisonRow({ entry, labels, resolution, onResolve }: {
  readonly entry: FieldComparison;
  readonly labels: ReadonlyMap<string, string>;
  readonly resolution: ConflictResolution | undefined;
  readonly onResolve: (value: ConflictResolution) => void;
}) {
  return (
    <View style={[styles.field, entry.conflict ? styles.conflict : null]} testID={`catalogue-load-field-${entry.path}`}>
      <Text style={styles.rowTitle}>{fieldLabel(entry.path)}{entry.conflict ? " — conflit" : ""}</Text>
      {entry.installed !== undefined ? <Text style={styles.meta}>Installé : {formatValue(entry.path, entry.installed, labels)}</Text> : null}
      <Text style={styles.body}>Nouveau : {formatValue(entry.path, entry.incoming, labels)}</Text>
      {"local" in entry ? <Text style={styles.meta}>Sur ce téléphone : {formatValue(entry.path, entry.local, labels)}</Text> : null}
      {entry.conflict ? <ResolutionPicker value={resolution} onChange={onResolve} testID={`catalogue-load-resolve-${entry.path}`} /> : null}
    </View>
  );
}

/** Choix explicite par champ en conflit : sélecteur segmenté natif iOS (aucune valeur par défaut). */
function ResolutionPicker({ value, onChange, testID }: {
  readonly value: ConflictResolution | undefined;
  readonly onChange: (value: ConflictResolution) => void;
  readonly testID: string;
}) {
  const choose = (next: string | number | null) => {
    if (next === "KEEP_LOCAL" || next === "TAKE_INCOMING") onChange(next);
  };
  if (Platform.OS === "ios") {
    return (
      <Host matchContents testID={testID}>
        <SwiftUIPicker selection={value ?? null} onSelectionChange={choose} modifiers={[pickerStyle("segmented")]}>
          <SwiftUIText modifiers={[tag("KEEP_LOCAL")]}>{RESOLUTION_LABELS.KEEP_LOCAL}</SwiftUIText>
          <SwiftUIText modifiers={[tag("TAKE_INCOMING")]}>{RESOLUTION_LABELS.TAKE_INCOMING}</SwiftUIText>
        </SwiftUIPicker>
      </Host>
    );
  }
  return (
    <View style={styles.actions} testID={testID}>
      {(["KEEP_LOCAL", "TAKE_INCOMING"] as const).map((option) => (
        <ActionButton key={option} label={RESOLUTION_LABELS[option]} primary={value === option} onPress={() => onChange(option)} testID={`${testID}-${option}`} />
      ))}
    </View>
  );
}

function ActionButton({ label, onPress, disabled = false, primary = false, testID }: {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly primary?: boolean;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[styles.button, primary ? styles.buttonPrimary : null, disabled ? styles.buttonDisabled : null]}
      testID={testID}
    >
      <Text style={[styles.buttonLabel, primary ? styles.buttonLabelPrimary : null]}>{label}</Text>
    </Pressable>
  );
}

function Centered({ text }: { readonly text: string }) {
  return <View style={styles.centered}><Text style={styles.body}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  section: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginTop: 14, marginBottom: 4 },
  body: { fontSize: 15, color: colors.textPrimary },
  meta: { fontSize: 13, color: colors.textSecondary },
  warning: { fontSize: 13, color: colors.warning },
  danger: { fontSize: 15, color: colors.danger, fontWeight: "600" },
  hint: { fontSize: 13, color: colors.textSecondary },
  link: { fontSize: 15, color: colors.primary, fontWeight: "600" },
  box: { gap: 6, padding: 12, borderRadius: 10, backgroundColor: colors.surfaceSubtle },
  row: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  field: { gap: 4, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  conflict: { borderLeftWidth: 3, borderLeftColor: colors.danger, paddingLeft: 8 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  button: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignSelf: "flex-start" },
  buttonPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  buttonDisabled: { opacity: 0.4 },
  buttonLabel: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  buttonLabelPrimary: { color: "#FFFFFF" },
});
