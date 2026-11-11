/**
 * A1 — Profil → Bibliothèques : parcours du premier lot (A-4 du 11/11/2026), d'après les écrans Figma
 * de la page Prototype MVP 510:101 :
 * - Ajouter une bibliothèque 12116:25073 ;
 * - Connexion : saisie 12116:25103, en cours 12116:25138, connecté 12116:25175, code refusé 12116:25200,
 *   PC introuvable 12116:25238 ;
 * - Bibliothèques disponibles 12118:25124, chargement 12119:25204, liste vide 12119:25277 ;
 * - Aperçu avant installation 12118:25170, installation terminée 12118:25220 ;
 * - Aperçu d'une mise à jour 12118:25251, détail d'une fiche 12118:25316, mise à jour appliquée 12118:25370 ;
 * - Fichier invalide 12119:25162 ; reprise après interruption 12119:25245 ;
 * - Bibliothèque installée 12098:115 (sans « Désinstaller » : hors premier lot, A-4).
 *
 * Aucune édition de Mouvement ici (Profil n'est pas un second éditeur). Les fiches à examiner
 * (adaptation historique, règle non arbitrée) sont signalées et ne sont jamais écrasées.
 */
import * as Device from "expo-device";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import type { Movement } from "@/domain/activities/Movement";

import type { MovementCatalogueFile } from "@/domain/catalogue/MovementCatalogueFile";
import type { SheetLoadItem } from "@/domain/catalogue/catalogueLoadPlan";
import type { InstalledLibraryRecord, LibraryPreview } from "@/domain/catalogue/libraryPlan";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { AdminClient, AdminClientError, type AdminEndpoint, type AdminSession } from "@/features/catalogue/adminClient";
import { referenceLabels } from "@/features/catalogue/catalogueLoadPresentation";
import type { LibraryApplyReport, LibraryProgress } from "@/features/catalogue/LibraryService";
import { librarySession } from "@/features/catalogue/librarySession";
import {
  REVIEW_REASON_LABELS,
  availableLine,
  issueLine,
  modifiedLine,
  plural,
  sheetDetail,
  sheetName,
} from "@/features/catalogue/libraryPresentation";
import { Busy, Card, Divider, LibraryScreen, Notice, Paragraph, Pill, Row, SectionTitle } from "@/features/catalogue/libraryUi";
import { buildMovementInbox } from "@/features/catalogue/movementInboxBuilder";
import { pickCatalogueFile } from "@/features/catalogue/pickCatalogueFile";
import { useLibraryServices, type LibraryServices } from "@/features/catalogue/useLibraryServices";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/** Dépendances remplaçables (tests). */
export type LibraryScreenDependencies = {
  readonly client?: AdminClient;
  readonly pickFile?: () => Promise<unknown | null>;
  readonly deviceName?: string;
};

const defaultClient = new AdminClient();

function useServicesOrMessage(): LibraryServices | null {
  return useLibraryServices().services;
}

/** Choisir un fichier puis afficher ses Bibliothèques, ou l'écran « Fichier invalide ». */
function useFileImport(pickFile: () => Promise<unknown | null>) {
  const router = useRouter();
  const services = useServicesOrMessage();
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async () => {
    if (!services) return;
    setError(null);
    let raw: unknown;
    try {
      raw = await pickFile();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      return;
    }
    if (raw === null) return;
    const available = await services.libraries.available(raw);
    if (!available.ok) {
      librarySession.setInvalid({ issues: available.issues, raw });
      router.push("/library-invalid");
      return;
    }
    librarySession.setSource({ kind: "FILE", file: available.file });
    librarySession.rememberPreviews(available.previews);
    router.push("/library-available");
  }, [services, pickFile, router]);
  return { run, error, ready: services !== null };
}

// ——— Ajouter une bibliothèque (12116:25073) ———

export function LibraryAddScreen({ pickFile = pickCatalogueFile }: LibraryScreenDependencies) {
  const router = useRouter();
  const fileImport = useFileImport(pickFile);
  return (
    <LibraryScreen title="Ajouter une bibliothèque" testID="library-add">
      <Paragraph>Choisissez d&apos;où provient la bibliothèque à ajouter.</Paragraph>
      <Card>
        <Row
          title="Depuis un fichier"
          subtitle="Importer un fichier de bibliothèque enregistré sur ce téléphone."
          onPress={() => void fileImport.run()}
          testID="library-add-file"
        />
        <Divider />
        <Row
          title="Depuis l'administration (PC)"
          subtitle="Se connecter à l'administration KODJO de votre PC, sur le même Wi-Fi."
          onPress={() => router.push("/library-connect")}
          testID="library-add-admin"
        />
      </Card>
      {fileImport.error ? <Notice tone="danger" title="Fichier illisible" testID="library-add-error">{fileImport.error}</Notice> : null}
    </LibraryScreen>
  );
}

// ——— Connexion à l'administration (12116:25103 … 12116:25238) ———

type ConnectPhase =
  | { readonly kind: "entry" }
  | { readonly kind: "connecting" }
  | { readonly kind: "connected"; readonly session: AdminSession }
  | { readonly kind: "refused" }
  | { readonly kind: "locked" }
  | { readonly kind: "notFound" }
  | { readonly kind: "failed"; readonly message: string };

export function LibraryConnectScreen({ client = defaultClient, pickFile = pickCatalogueFile, deviceName }: LibraryScreenDependencies) {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<ConnectPhase>({ kind: "entry" });
  const cancelled = useRef(false);
  const fileImport = useFileImport(pickFile);
  const name = deviceName ?? Device.deviceName ?? "iPhone";

  const connect = useCallback(async () => {
    cancelled.current = false;
    setPhase({ kind: "connecting" });
    let endpoint: AdminEndpoint;
    try {
      endpoint = await client.discover(librarySession.knownHosts(), () => cancelled.current);
    } catch {
      if (!cancelled.current) setPhase({ kind: "notFound" });
      return;
    }
    if (cancelled.current) return;
    try {
      const session = await client.pair(endpoint, code, name);
      if (!cancelled.current) setPhase({ kind: "connected", session });
    } catch (reason) {
      if (cancelled.current) return;
      const failure = reason instanceof AdminClientError ? reason.code : "SERVER";
      if (failure === "CODE_REFUSED") setPhase({ kind: "refused" });
      else if (failure === "LOCKED") setPhase({ kind: "locked" });
      else if (failure === "NETWORK") setPhase({ kind: "notFound" });
      else setPhase({ kind: "failed", message: "L'administration a répondu de façon inattendue. Réessayez." });
    }
  }, [client, code, name]);

  const showLibraries = useCallback(async (session: AdminSession) => {
    librarySession.setSource({ kind: "ADMIN", session, entries: [], refreshedAt: 0 });
    router.replace(params.next === "send" ? "/library-send" : "/library-available");
  }, [router, params.next]);

  const codeComplete = /^\d{6}$/.test(code);
  const retry = () => {
    setCode("");
    setPhase({ kind: "entry" });
  };

  let body: React.ReactNode;
  let primary: Parameters<typeof LibraryScreen>[0]["primary"] = null;
  let secondary: Parameters<typeof LibraryScreen>[0]["secondary"] = [];
  switch (phase.kind) {
    case "entry":
    case "refused":
    case "locked":
      body = (
        <>
          <Paragraph>Sur votre PC, ouvrez l&apos;administration KODJO, puis « Appairer un téléphone ». Saisissez le code à 6 chiffres affiché.</Paragraph>
          <CodeBoxes value={code} onChange={setCode} error={phase.kind !== "entry"} />
          {phase.kind === "refused" ? (
            <Notice tone="danger" title="Code refusé ou expiré" testID="library-connect-refused">
              Le code a peut-être expiré. Affichez-en un nouveau sur votre PC, puis saisissez-le ici.
            </Notice>
          ) : null}
          {phase.kind === "locked" ? (
            <Notice tone="danger" title="Trop d'essais" testID="library-connect-locked">
              L&apos;appairage est momentanément bloqué sur votre PC. Affichez un nouveau code dans quelques minutes.
            </Notice>
          ) : null}
          <Paragraph tone="secondary">Le téléphone et le PC doivent être sur le même Wi-Fi.</Paragraph>
        </>
      );
      primary = phase.kind === "entry"
        ? { label: "Se connecter", onPress: () => void connect(), disabled: !codeComplete, testID: "library-connect-submit" }
        : { label: "Réessayer", onPress: retry, testID: "library-connect-retry" };
      break;
    case "connecting":
      body = (
        <>
          <Paragraph>Sur votre PC, ouvrez l&apos;administration KODJO, puis « Appairer un téléphone ». Saisissez le code à 6 chiffres affiché.</Paragraph>
          <CodeBoxes value={code} onChange={() => {}} disabled />
          <Busy label="Connexion en cours…" detail="Recherche de votre PC sur le Wi-Fi" testID="library-connect-busy" />
        </>
      );
      secondary = [{ label: "Annuler", onPress: () => { cancelled.current = true; setPhase({ kind: "entry" }); }, testID: "library-connect-cancel" }];
      break;
    case "connected":
      body = (
        <Notice tone="positive" title={`Connecté à « ${phase.session.name} »`} testID="library-connect-connected">
          Votre PC est prêt à envoyer les bibliothèques disponibles.
        </Notice>
      );
      primary = params.next === "send"
        ? { label: "Choisir les mouvements à envoyer", onPress: () => void showLibraries(phase.session), testID: "library-connect-continue" }
        : { label: "Voir les bibliothèques disponibles", onPress: () => void showLibraries(phase.session), testID: "library-connect-continue" };
      break;
    case "notFound":
      body = (
        <Notice tone="warning" title="PC introuvable sur le Wi-Fi" testID="library-connect-not-found">
          {"• Le PC est allumé et l'administration KODJO est ouverte.\n• Le téléphone et le PC sont sur le même Wi-Fi.\n• Aucun pare-feu ne bloque la connexion."}
        </Notice>
      );
      secondary = params.next === "send" ? [] : [{ label: "Importer depuis un fichier", onPress: () => void fileImport.run(), testID: "library-connect-file" }];
      primary = { label: "Réessayer", onPress: () => void connect(), testID: "library-connect-retry" };
      break;
    case "failed":
      body = <Notice tone="danger" title="Connexion impossible" testID="library-connect-failed">{phase.message}</Notice>;
      primary = { label: "Réessayer", onPress: retry, testID: "library-connect-retry" };
      break;
  }

  return (
    <LibraryScreen title="Connexion à l'administration" testID="library-connect" primary={primary} secondary={secondary}>
      {body}
    </LibraryScreen>
  );
}

function CodeBoxes({ value, onChange, error = false, disabled = false }: { readonly value: string; readonly onChange: (code: string) => void; readonly error?: boolean; readonly disabled?: boolean }) {
  const input = useRef<TextInput>(null);
  return (
    <View>
      <TextInput
        ref={input}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        maxLength={6}
        editable={!disabled}
        autoFocus={!disabled}
        accessibilityLabel="Code à 6 chiffres"
        style={codeStyles.hidden}
        testID="library-connect-code"
      />
      <View style={codeStyles.row} onTouchEnd={() => input.current?.focus()} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {Array.from({ length: 6 }, (_, index) => (
          <View key={index} style={[codeStyles.box, error ? codeStyles.boxError : null, disabled ? codeStyles.boxDisabled : null]}>
            <Text style={codeStyles.digit}>{value[index] ?? ""}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const codeStyles = StyleSheet.create({
  hidden: { position: "absolute", opacity: 0, width: 1, height: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing[8] },
  box: { flex: 1, aspectRatio: 0.85, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  boxError: { borderColor: colors.danger },
  boxDisabled: { opacity: 0.5 },
  digit: { ...type.metricPrimary, color: colors.textPrimary },
});

// ——— Bibliothèques disponibles (12118:25124, 12119:25204, 12119:25277) ———

type AvailablePhase =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly previews: readonly LibraryPreview[]; readonly origin: string; readonly refreshedAt: number; readonly withheld?: readonly string[] }
  | { readonly kind: "error"; readonly message: string; readonly unauthorized: boolean };

export function LibraryAvailableScreen({ client = defaultClient, pickFile = pickCatalogueFile }: LibraryScreenDependencies) {
  const router = useRouter();
  const services = useServicesOrMessage();
  const fileImport = useFileImport(pickFile);
  const [phase, setPhase] = useState<AvailablePhase>({ kind: "loading" });

  const refresh = useCallback(async () => {
    if (!services) return;
    const source = librarySession.source();
    if (!source) {
      setPhase({ kind: "ready", previews: [], origin: "", refreshedAt: Date.now() });
      return;
    }
    setPhase({ kind: "loading" });
    if (source.kind === "FILE") {
      const available = await services.libraries.available(source.file);
      const previews = available.ok ? available.previews : [];
      librarySession.rememberPreviews(previews);
      setPhase({ kind: "ready", previews, origin: `Depuis le fichier · ${source.file.catalogue.title}`, refreshedAt: Date.now() });
      return;
    }
    try {
      const entries = await client.libraries(source.session);
      const previews: LibraryPreview[] = [];
      const withheld: string[] = [];
      for (const catalogueId of [...new Set(entries.map((entry) => entry.catalogueId))]) {
        let raw: unknown;
        try {
          raw = await client.catalogue(source.session, catalogueId);
        } catch (reason) {
          if (!(reason instanceof AdminClientError && reason.code === "MEDIA_RIGHTS")) throw reason;
          withheld.push(...entries.filter((entry) => entry.catalogueId === catalogueId).map((entry) => entry.title));
          continue;
        }
        const available = await services.libraries.available(raw);
        if (!available.ok) {
          librarySession.setInvalid({ issues: available.issues, raw });
          continue;
        }
        librarySession.rememberFile(available.file);
        const published = new Set(entries.filter((entry) => entry.catalogueId === catalogueId).map((entry) => entry.libraryId));
        previews.push(...available.previews.filter((preview) => published.has(preview.libraryId)));
      }
      librarySession.rememberPreviews(previews);
      librarySession.setSource({ ...source, entries, refreshedAt: Date.now() });
      setPhase({ kind: "ready", previews, origin: `Reçues de l'administration · ${source.session.name}`, refreshedAt: Date.now(), withheld });
    } catch (reason) {
      const unauthorized = reason instanceof AdminClientError && reason.code === "UNAUTHORIZED";
      setPhase({
        kind: "error",
        unauthorized,
        message: unauthorized
          ? "L'appairage a expiré ou a été révoqué sur votre PC. Connectez-vous de nouveau."
          : "La connexion avec votre PC a été perdue. Vérifiez le Wi-Fi, puis actualisez.",
      });
    }
  }, [services, client]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const isAdmin = librarySession.source()?.kind === "ADMIN";
  let body: React.ReactNode;
  let primary: Parameters<typeof LibraryScreen>[0]["primary"] = null;
  let secondary: Parameters<typeof LibraryScreen>[0]["secondary"] = [];
  const withheldNotice = phase.kind === "ready" && (phase.withheld?.length ?? 0) > 0 ? (
    <Notice tone="warning" title="Bibliothèques non transférées" testID="library-available-withheld">
      {`${phase.withheld!.join(", ")} : un média n'a pas de droits confirmés. Confirmez ses droits dans l'administration du PC, puis actualisez.`}
    </Notice>
  ) : null;
  if (phase.kind === "loading") {
    body = <Busy label="Chargement de la liste…" testID="library-available-loading" />;
  } else if (phase.kind === "error") {
    body = <Notice tone="danger" title="Liste indisponible" testID="library-available-error">{phase.message}</Notice>;
    primary = phase.unauthorized
      ? { label: "Se reconnecter", onPress: () => router.replace("/library-connect"), testID: "library-available-reconnect" }
      : { label: "Actualiser", onPress: () => void refresh(), testID: "library-available-refresh" };
  } else if (phase.previews.length === 0) {
    body = (
      <View style={screenStyles.empty} testID="library-available-empty">
        <SectionTitle>Aucune bibliothèque disponible</SectionTitle>
        <Paragraph tone="secondary">L&apos;administration n&apos;a publié aucune bibliothèque pour ce téléphone pour le moment.</Paragraph>
      </View>
    );
    secondary = [{ label: "Importer depuis un fichier", onPress: () => void fileImport.run(), testID: "library-available-file" }];
    primary = isAdmin ? { label: "Actualiser", onPress: () => void refresh(), testID: "library-available-refresh" } : null;
  } else {
    body = (
      <>
        <Paragraph tone="secondary">{phase.origin}</Paragraph>
        <Card testID="library-available-list">
          {phase.previews.map((preview, index) => {
            const line = availableLine(preview);
            return (
              <View key={preview.catalogueId + "/" + preview.libraryId}>
                {index > 0 ? <Divider /> : null}
                <Row
                  title={preview.title}
                  subtitle={line.subtitle}
                  pill={<Pill label={line.pill} tone={line.tone} />}
                  onPress={() => router.push({
                    pathname: preview.status === "INTERRUPTED" ? "/library-resume" : "/library-preview",
                    params: { catalogueId: preview.catalogueId, libraryId: preview.libraryId },
                  })}
                  testID={`library-available-${preview.libraryId}`}
                />
              </View>
            );
          })}
        </Card>
        {isAdmin ? (
          <Row
            title="Actualisée à l'instant"
            subtitle="Actualiser"
            onPress={() => void refresh()}
            testID="library-available-refresh-row"
          />
        ) : null}
      </>
    );
  }
  return (
    <LibraryScreen title="Bibliothèques disponibles" testID="library-available" primary={primary} secondary={secondary}>
      {withheldNotice}
      {body}
      {fileImport.error ? <Notice tone="danger" title="Fichier illisible">{fileImport.error}</Notice> : null}
    </LibraryScreen>
  );
}

// ——— Aperçu avant installation / mise à jour, et résultat ———

type PreviewPhase =
  | { readonly kind: "loading" }
  | { readonly kind: "missing" }
  | { readonly kind: "ready"; readonly preview: LibraryPreview; readonly file: MovementCatalogueFile }
  | { readonly kind: "applying"; readonly preview: LibraryPreview }
  | { readonly kind: "done"; readonly report: LibraryApplyReport; readonly preview: LibraryPreview }
  | { readonly kind: "decided"; readonly decision: "DEFERRED" | "REFUSED"; readonly preview: LibraryPreview }
  | { readonly kind: "failed"; readonly message: string };

export function LibraryPreviewScreen() {
  const router = useRouter();
  const services = useServicesOrMessage();
  const { catalogueId, libraryId } = useLocalSearchParams<{ catalogueId: string; libraryId: string }>();
  const file = catalogueId ? librarySession.file(catalogueId) : null;
  const [phase, setPhase] = useState<PreviewPhase>(file && libraryId ? { kind: "loading" } : { kind: "missing" });
  const labels = useMemo(() => (file ? referenceLabels(file) : new Map<string, string>()), [file]);

  useEffect(() => {
    if (!services || !file || !libraryId) return;
    let cancelled = false;
    services.libraries.preview(file, libraryId).then(
      (preview) => { if (!cancelled) setPhase(preview ? { kind: "ready", preview, file } : { kind: "missing" }); },
      () => { if (!cancelled) setPhase({ kind: "failed", message: "L'aperçu n'a pas pu être calculé." }); },
    );
    return () => { cancelled = true; };
  }, [services, file, libraryId]);

  const apply = useCallback(async (preview: LibraryPreview, source: MovementCatalogueFile) => {
    if (!services) return;
    setPhase({ kind: "applying", preview });
    try {
      const report = await services.libraries.apply(source, preview.libraryId);
      if (!report) throw new Error("introuvable");
      const after = await services.libraries.preview(source, preview.libraryId);
      if (after) librarySession.rememberPreviews([after]);
      setPhase({ kind: "done", report, preview });
    } catch {
      setPhase({ kind: "failed", message: "L'opération s'est arrêtée avant la fin. Les fiches déjà appliquées sont conservées : reprenez-la depuis le Profil." });
    }
  }, [services]);

  const decide = useCallback(async (preview: LibraryPreview, source: MovementCatalogueFile, decision: "DEFERRED" | "REFUSED") => {
    if (!services) return;
    if (decision === "DEFERRED") await services.libraries.defer(source, preview.libraryId);
    else await services.libraries.refuse(source, preview.libraryId);
    const after = await services.libraries.preview(source, preview.libraryId);
    if (after) librarySession.rememberPreviews([after]);
    setPhase({ kind: "decided", decision, preview });
  }, [services]);

  if (phase.kind === "loading") return <LibraryScreen title="Bibliothèque" testID="library-preview"><Busy label="Préparation de l'aperçu…" /></LibraryScreen>;
  if (phase.kind === "missing") return <LibraryScreen title="Bibliothèque" testID="library-preview"><Notice tone="warning" title="Bibliothèque introuvable">Rechargez la liste des bibliothèques disponibles.</Notice></LibraryScreen>;
  if (phase.kind === "failed") {
    return (
      <LibraryScreen title="Bibliothèque" testID="library-preview" primary={{ label: "Terminer", onPress: () => router.dismissTo("/profile-edit"), testID: "library-preview-finish" }}>
        <Notice tone="danger" title="Opération interrompue" testID="library-preview-failed">{phase.message}</Notice>
      </LibraryScreen>
    );
  }
  if (phase.kind === "applying") {
    return <LibraryScreen title={phase.preview.title} testID="library-preview"><Busy label={phase.preview.installedRevision === null ? "Installation en cours…" : "Mise à jour en cours…"} testID="library-preview-applying" /></LibraryScreen>;
  }
  if (phase.kind === "decided") {
    return (
      <LibraryScreen title={`Mise à jour de ${phase.preview.title}`} testID="library-preview" primary={{ label: "Terminer", onPress: () => router.back(), testID: "library-preview-finish" }}>
        <Notice tone="positive" title={phase.decision === "DEFERRED" ? "Mise à jour reportée" : "Mise à jour refusée"} testID="library-preview-decided">
          {phase.decision === "DEFERRED"
            ? "Aucun mouvement n'a été modifié. La mise à jour reste proposée."
            : "Aucun mouvement n'a été modifié. Cette révision ne sera plus proposée ; une révision ultérieure le sera."}
        </Notice>
      </LibraryScreen>
    );
  }
  if (phase.kind === "done") return <LibraryResult report={phase.report} preview={phase.preview} />;

  const { preview, file: source } = phase;
  const isUpdate = preview.installedRevision !== null;
  const applicable = preview.added.length + preview.attached.length + preview.modified.length;
  const toReview = preview.toReview.length > 0 ? (
    <>
      <SectionTitle>{`À examiner (${preview.toReview.length})`}</SectionTitle>
      <Card testID="library-preview-review">
        {preview.toReview.map((entry, index) => (
          <View key={entry.item.sheetId}>
            {index > 0 ? <Divider /> : null}
            <Row title={entry.item.name} subtitle={REVIEW_REASON_LABELS[entry.reason]} testID={`library-preview-review-${entry.item.sheetId}`} />
          </View>
        ))}
      </Card>
    </>
  ) : null;
  const ownerWarning = preview.unknownOwner ? (
    <Notice tone="warning" title="Propriétaire inconnu : usage privé" testID="library-preview-unknown-owner">
      Ces fiches restent sur ce téléphone : elles ne peuvent être ni partagées, ni redistribuées.
    </Notice>
  ) : null;

  if (!isUpdate) {
    // Aperçu avant installation (12118:25170).
    return (
      <LibraryScreen
        title={preview.title}
        testID="library-preview"
        primary={{ label: `Installer (${plural(preview.memberCount, "fiche", "fiches")})`, onPress: () => void apply(preview, source), testID: "library-preview-install" }}
      >
        <Paragraph testID="library-preview-count">{`${plural(preview.memberCount, "fiche", "fiches")} dans cette bibliothèque`}</Paragraph>
        <Card>
          <Row title={`${preview.added.length} ${preview.added.length > 1 ? "nouvelles" : "nouvelle"}`} subtitle="ajoutées à votre Catalogue" testID="library-preview-added" />
          <Divider />
          <Row title={`${preview.attached.length} déjà ${preview.attached.length > 1 ? "présentes" : "présente"}`} subtitle="rattachées à vos mouvements, sans doublon" testID="library-preview-attached" />
        </Card>
        <Paragraph tone="secondary">Vos mouvements existants ne sont ni copiés, ni modifiés.</Paragraph>
        {ownerWarning}
        {preview.added.length > 0 ? (
          <>
            <SectionTitle>Nouvelles fiches</SectionTitle>
            <Card testID="library-preview-new-list">
              {preview.added.slice(0, 3).map((item, index) => (
                <View key={item.sheetId}>
                  {index > 0 ? <Divider /> : null}
                  <Row title={item.name} pill={<Pill label="Nouvelle" tone="action" />} testID={`library-preview-new-${item.sheetId}`} />
                </View>
              ))}
            </Card>
            {preview.added.length > 3 ? <Paragraph tone="secondary">{`et ${plural(preview.added.length - 3, "autre fiche nouvelle", "autres fiches nouvelles")}`}</Paragraph> : null}
          </>
        ) : null}
        {toReview}
        {preview.missingExternal.length > 0 ? (
          <Notice tone="warning" title={plural(preview.missingExternal.length, "fiche d'une autre source absente", "fiches d'une autre source absentes")}>
            Elles seront disponibles après l&apos;installation de leur bibliothèque d&apos;origine.
          </Notice>
        ) : null}
      </LibraryScreen>
    );
  }

  // Aperçu d'une mise à jour (12118:25251).
  const removedNames = preview.removed.map((member) => ({ key: member.catalogueId + "/" + member.sheetId, name: sheetName(source, member.sheetId) }));
  return (
    <LibraryScreen
      title={`Mise à jour de ${preview.title}`}
      testID="library-preview"
      secondary={[
        { label: "Reporter", onPress: () => void decide(preview, source, "DEFERRED"), testID: "library-preview-defer" },
        { label: "Refuser", onPress: () => void decide(preview, source, "REFUSED"), testID: "library-preview-refuse" },
      ]}
      primary={{ label: "Mettre à jour", onPress: () => void apply(preview, source), disabled: applicable === 0 && preview.removed.length === 0 && preview.status === "UP_TO_DATE", testID: "library-preview-update" }}
    >
      <View style={screenStyles.counters} testID="library-preview-counters">
        <Counter value={preview.modified.length} label={preview.modified.length > 1 ? "Modifiées" : "Modifiée"} />
        <Counter value={preview.added.length + preview.attached.length} label={preview.added.length + preview.attached.length > 1 ? "Nouvelles" : "Nouvelle"} />
        <Counter value={preview.removed.length} label={preview.removed.length > 1 ? "Retirées" : "Retirée"} />
      </View>
      <SectionTitle>
        {preview.installedRevision === preview.targetRevision
          ? "Fiches révisées · détail par fiche"
          : `Révision ${preview.installedRevision} → ${preview.targetRevision} · détail par fiche`}
      </SectionTitle>
      <Card testID="library-preview-sheets">
        {preview.modified.map((item, index) => (
          <View key={item.sheetId}>
            {index > 0 ? <Divider /> : null}
            <Row
              title={item.name}
              subtitle={modifiedLine(item, labels)}
              pill={<Pill label="Modifiée" tone="warning" />}
              onPress={() => router.push({ pathname: "/library-sheet", params: { catalogueId: preview.catalogueId, libraryId: preview.libraryId, sheetId: item.sheetId } })}
              testID={`library-preview-modified-${item.sheetId}`}
            />
            {(preview.alsoIn[preview.catalogueId + "/" + item.sheetId] ?? []).map((title) => (
              <Paragraph key={title} tone="secondary">{`Aussi dans ${title} : mise à jour appliquée là aussi.`}</Paragraph>
            ))}
          </View>
        ))}
        {[...preview.added, ...preview.attached].map((item, index) => (
          <View key={item.sheetId}>
            {preview.modified.length + index > 0 ? <Divider /> : null}
            <Row title={item.name} subtitle="Ajoutée à la bibliothèque et à votre Catalogue" pill={<Pill label="Nouvelle" tone="action" />} testID={`library-preview-new-${item.sheetId}`} />
          </View>
        ))}
        {removedNames.map((entry, index) => (
          <View key={entry.key}>
            {preview.modified.length + preview.added.length + preview.attached.length + index > 0 ? <Divider /> : null}
            <Row title={entry.name} subtitle="Retirée de la bibliothèque · reste dans le Catalogue" pill={<Pill label="Retirée" />} testID={`library-preview-removed-${entry.key}`} />
          </View>
        ))}
      </Card>
      <Paragraph tone="secondary">Les fiches modifiées sont mises à jour dans toutes vos bibliothèques qui les contiennent. La composition de vos autres bibliothèques ne change pas.</Paragraph>
      {ownerWarning}
      {toReview}
    </LibraryScreen>
  );
}

function Counter({ value, label }: { readonly value: number; readonly label: string }) {
  return (
    <View style={screenStyles.counter}>
      <Text style={screenStyles.counterValue}>{value}</Text>
      <Text style={screenStyles.counterLabel}>{label}</Text>
    </View>
  );
}

/** Installation terminée (12118:25220) ou mise à jour appliquée (12118:25370). */
function LibraryResult({ report, preview }: { readonly report: LibraryApplyReport; readonly preview: LibraryPreview }) {
  const router = useRouter();
  const alsoIn = Object.values(report.alsoIn).flat();
  if (report.kind === "INSTALL") {
    return (
      <LibraryScreen
        title={report.title}
        testID="library-result"
        secondary={[{ label: "Terminer", onPress: () => router.dismissTo("/profile-edit"), testID: "library-result-finish" }]}
        primary={{ label: "Voir dans le Catalogue", onPress: () => router.dismissTo("/"), testID: "library-result-catalogue" }}
      >
        <Notice tone="positive" title={`${report.title} est installée`} testID="library-result-installed">Les fiches sont disponibles dans votre Catalogue.</Notice>
        <Card>
          <Row title={`${plural(report.added, "fiche ajoutée", "fiches ajoutées")}`} testID="library-result-added" />
          <Divider />
          <Row title={`${plural(report.attached, "fiche rattachée", "fiches rattachées")}, sans doublon`} testID="library-result-attached" />
        </Card>
        <ResultWarnings report={report} preview={preview} />
      </LibraryScreen>
    );
  }
  return (
    <LibraryScreen
      title={report.title}
      testID="library-result"
      primary={{ label: "Terminer", onPress: () => router.dismissTo("/profile-edit"), testID: "library-result-finish" }}
    >
      <Notice tone="positive" title={`${report.title} est à jour`} testID="library-result-updated">{`Révision ${report.revision}`}</Notice>
      <Card>
        <Row
          title={plural(report.updated, "fiche mise à jour", "fiches mises à jour")}
          subtitle={alsoIn.length > 0 ? `dont ${alsoIn.length} aussi dans ${[...new Set(alsoIn)].join(", ")}` : null}
          testID="library-result-modified"
        />
        <Divider />
        <Row title={plural(report.added + report.attached, "fiche ajoutée", "fiches ajoutées")} subtitle={`au Catalogue et à ${report.title}`} testID="library-result-added" />
        <Divider />
        <Row title={plural(report.removed, `fiche retirée de ${report.title}`, `fiches retirées de ${report.title}`)} subtitle="elles restent dans le Catalogue" testID="library-result-removed" />
      </Card>
      <ResultWarnings report={report} preview={preview} />
    </LibraryScreen>
  );
}

function ResultWarnings({ report, preview }: { readonly report: LibraryApplyReport; readonly preview: LibraryPreview }) {
  return (
    <>
      {report.toReview > 0 ? (
        <Notice tone="warning" title={plural(report.toReview, "fiche à examiner", "fiches à examiner")} testID="library-result-review">
          {preview.toReview.map((entry) => `• ${entry.item.name} — ${REVIEW_REASON_LABELS[entry.reason]}`).join("\n")}
        </Notice>
      ) : null}
      {report.failed.length > 0 ? (
        <Notice tone="danger" title={plural(report.failed.length, "fiche non appliquée", "fiches non appliquées")} testID="library-result-failed">
          Rien n&apos;a été écrit pour ces fiches. Elles restent proposées.
        </Notice>
      ) : null}
    </>
  );
}

// ——— Détail d'une fiche à mettre à jour (12118:25316) ———

export function LibrarySheetDetailScreen() {
  const router = useRouter();
  const services = useServicesOrMessage();
  const { catalogueId, libraryId, sheetId } = useLocalSearchParams<{ catalogueId: string; libraryId: string; sheetId: string }>();
  const file = catalogueId ? librarySession.file(catalogueId) : null;
  const [item, setItem] = useState<SheetLoadItem | null>(null);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const labels = useMemo(() => (file ? referenceLabels(file) : new Map<string, string>()), [file]);

  useEffect(() => {
    if (!services || !file || !libraryId) return;
    let cancelled = false;
    void services.libraries.preview(file, libraryId).then((preview) => {
      if (cancelled || !preview) return;
      const all = [...preview.modified, ...preview.added, ...preview.attached, ...preview.unchanged, ...preview.toReview.map((entry) => entry.item)];
      setItem(all.find((candidate) => candidate.sheetId === sheetId) ?? null);
    });
    return () => { cancelled = true; };
  }, [services, file, libraryId, sheetId]);

  if (!item) return <LibraryScreen title="Fiche" testID="library-sheet"><Busy label="Chargement…" /></LibraryScreen>;
  const detail = sheetDetail(item, labels);
  return (
    <LibraryScreen title={item.name} testID="library-sheet" primary={{ label: "Retour au résumé", onPress: () => router.back(), testID: "library-sheet-back" }}>
      <Paragraph testID="library-sheet-summary">
        {`Révision ${item.installedRevision ?? "—"} → ${item.revision} · ${plural(detail.changed.length, "champ modifié", "champs modifiés")}, ${plural(detail.unchanged.length, "inchangé", "inchangés")}`}
      </Paragraph>
      {detail.changed.map((row) => (
        <Card key={row.path} testID={`library-sheet-field-${row.path}`}>
          <Row title={row.label} pill={<Pill label={row.conflict ? "Modifiée sur ce téléphone" : "Modifiée"} tone="warning" />} testID={`library-sheet-label-${row.path}`} />
          <Paragraph tone="secondary">Actuelle</Paragraph>
          <Paragraph>{row.current}</Paragraph>
          <Paragraph tone="secondary">Nouvelle</Paragraph>
          <Paragraph>{row.next}</Paragraph>
        </Card>
      ))}
      {detail.unchanged.length > 0 ? (
        showUnchanged ? (
          <Card testID="library-sheet-unchanged">
            {detail.unchanged.map((row, index) => (
              <View key={row.path}>
                {index > 0 ? <Divider /> : null}
                <Row title={row.label} subtitle={row.next} testID={`library-sheet-unchanged-${row.path}`} />
              </View>
            ))}
          </Card>
        ) : (
          <Row title={`Voir les champs inchangés (${detail.unchanged.length})`} onPress={() => setShowUnchanged(true)} testID="library-sheet-show-unchanged" />
        )
      ) : null}
    </LibraryScreen>
  );
}

// ——— Reprise après interruption (12119:25245) ———

export function LibraryResumeScreen() {
  const router = useRouter();
  const services = useServicesOrMessage();
  const { catalogueId, libraryId } = useLocalSearchParams<{ catalogueId: string; libraryId: string }>();
  const [progress, setProgress] = useState<LibraryProgress | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "running" | "none">("loading");
  const [report, setReport] = useState<LibraryApplyReport | null>(null);

  useEffect(() => {
    if (!services) return;
    let cancelled = false;
    void services.libraries.interrupted().then((list) => {
      if (cancelled) return;
      const found = list.find((entry) => entry.catalogueId === catalogueId && entry.libraryId === libraryId) ?? null;
      setProgress(found);
      setState(found ? "ready" : "none");
    });
    return () => { cancelled = true; };
  }, [services, catalogueId, libraryId]);

  const resume = useCallback(async () => {
    if (!services || !progress) return;
    setState("running");
    librarySession.rememberFile(progress.file);
    const result = await services.libraries.resume(progress).catch(() => null);
    setReport(result);
    setState(result ? "ready" : "none");
  }, [services, progress]);

  if (report && progress) {
    const preview = librarySession.preview(progress.catalogueId, progress.libraryId);
    if (preview) return <LibraryResult report={report} preview={preview} />;
    return (
      <LibraryScreen title={progress.title} testID="library-resume" primary={{ label: "Terminer", onPress: () => router.dismissTo("/profile-edit"), testID: "library-resume-finish" }}>
        <Notice tone="positive" title={`${progress.title} est à jour`} testID="library-resume-done">{`Révision ${progress.revision}`}</Notice>
      </LibraryScreen>
    );
  }
  if (state === "loading" || state === "running") {
    return <LibraryScreen title={progress?.title ?? "Bibliothèque"} testID="library-resume"><Busy label={state === "running" ? "Reprise en cours…" : "Chargement…"} /></LibraryScreen>;
  }
  if (!progress) {
    return <LibraryScreen title="Bibliothèque" testID="library-resume"><Notice tone="positive" title="Aucune opération interrompue">Rien n&apos;est à reprendre.</Notice></LibraryScreen>;
  }
  const isUpdate = progress.kind === "UPDATE";
  const ratio = progress.total === 0 ? 0 : progress.applied / progress.total;
  return (
    <LibraryScreen
      title={progress.title}
      testID="library-resume"
      secondary={[{ label: "Plus tard", onPress: () => router.back(), testID: "library-resume-later" }]}
      primary={{ label: isUpdate ? "Reprendre la mise à jour" : "Reprendre l'installation", onPress: () => void resume(), testID: "library-resume-continue" }}
    >
      <Notice tone="warning" title={isUpdate ? "Mise à jour interrompue" : "Installation interrompue"} testID="library-resume-card">
        {`${isUpdate ? "La mise à jour" : "L'installation"} de ${progress.title} (révision ${progress.revision}) s'est arrêtée avant la fin.`}
      </Notice>
      <View style={screenStyles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: progress.total, now: progress.applied }}>
        <View style={[screenStyles.progressFill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      <Paragraph testID="library-resume-progress">{`${progress.applied} fiches sur ${progress.total} déjà appliquées`}</Paragraph>
      <Paragraph tone="secondary">Rien n&apos;est perdu : les fiches déjà appliquées sont conservées, la reprise continue là où elle s&apos;est arrêtée.</Paragraph>
    </LibraryScreen>
  );
}

// ——— Fichier invalide (12119:25162) ———

export function LibraryInvalidScreen({ pickFile = pickCatalogueFile }: LibraryScreenDependencies) {
  const invalid = librarySession.invalid();
  const fileImport = useFileImport(pickFile);
  const lines = invalid ? invalid.issues.map((issue) => issueLine(issue, invalid.raw)) : [];
  return (
    <LibraryScreen
      title="Importer un fichier"
      testID="library-invalid"
      primary={{ label: "Choisir un autre fichier", onPress: () => void fileImport.run(), testID: "library-invalid-pick" }}
    >
      <Notice tone="danger" title="Fichier refusé en entier" testID="library-invalid-notice">
        Aucune fiche n&apos;a été importée. Corrigez le fichier, puis réessayez.
      </Notice>
      <SectionTitle>{`Problèmes détectés (${lines.length})`}</SectionTitle>
      <Card testID="library-invalid-issues">
        {lines.slice(0, 50).map((line, index) => (
          <View key={index}>
            {index > 0 ? <Divider /> : null}
            <Row title={line} testID={`library-invalid-issue-${index}`} />
          </View>
        ))}
      </Card>
      {lines.length > 50 ? <Paragraph tone="secondary">{`et ${lines.length - 50} autres problèmes`}</Paragraph> : null}
    </LibraryScreen>
  );
}

// ——— Bibliothèque installée (12098:115, sans désinstallation : A-4) ———

export function LibraryInstalledScreen() {
  const router = useRouter();
  const services = useServicesOrMessage();
  const { catalogueId, libraryId } = useLocalSearchParams<{ catalogueId: string; libraryId: string }>();
  const [library, setLibrary] = useState<InstalledLibraryRecord | null>(null);
  const [members, setMembers] = useState<readonly { key: string; name: string; zones: string; movementId: string | null }[]>([]);

  useFocusEffect(useCallback(() => {
    if (!services) return;
    let cancelled = false;
    void (async () => {
      const installed = (await services.libraries.installed()).find((entry) => entry.catalogueId === catalogueId && entry.libraryId === libraryId) ?? null;
      const sheets = await services.registry.allInstalledSheets();
      const bySheet = new Map(sheets.map((record) => [record.catalogueId + "/" + record.sheetId, record]));
      if (cancelled || !installed) return;
      setLibrary(installed);
      setMembers(installed.library.members.map((member) => {
        const record = bySheet.get(member.catalogueId + "/" + member.sheetId);
        const file = librarySession.file(member.catalogueId);
        const labels = file ? referenceLabels(file) : new Map<string, string>();
        return {
          key: member.catalogueId + "/" + member.sheetId,
          name: record?.sheet.content.name ?? member.sheetId,
          zones: (record?.sheet.classification.bodyZoneIds ?? []).map((id) => labels.get(id) ?? id).join(", "),
          movementId: record?.movementId ?? null,
        };
      }));
    })();
    return () => { cancelled = true; };
  }, [services, catalogueId, libraryId]));

  if (!library) return <LibraryScreen title="Bibliothèque" testID="library-installed"><Busy label="Chargement…" /></LibraryScreen>;
  const preview = librarySession.preview(library.catalogueId, library.libraryId);
  const updateAvailable = preview?.status === "UPDATE_AVAILABLE";
  return (
    <LibraryScreen title={library.library.title} testID="library-installed">
      <Row
        title={`${plural(library.library.members.length, "mouvement", "mouvements")} · ${updateAvailable ? "mise à jour disponible" : "à jour"}`}
        pill={updateAvailable ? <Pill label="Mettre à jour" tone="action" /> : undefined}
        onPress={updateAvailable ? () => router.push({ pathname: "/library-preview", params: { catalogueId: library.catalogueId, libraryId: library.libraryId } }) : undefined}
        testID="library-installed-status"
      />
      <Card testID="library-installed-members">
        {members.map((member, index) => (
          <View key={member.key}>
            {index > 0 ? <Divider /> : null}
            <Row
              title={member.name}
              subtitle={member.zones || null}
              onPress={member.movementId ? () => router.push({ pathname: "/movement", params: { movementId: member.movementId! } }) : undefined}
              testID={`library-installed-member-${member.key}`}
            />
          </View>
        ))}
      </Card>
    </LibraryScreen>
  );
}

// ——— A2 : Envoyer mes mouvements (entrée Profil Figma 12119:25611 ; écran non représenté dans Figma) ———

type SendPhase =
  | { readonly kind: "loading" }
  | { readonly kind: "ready" }
  | { readonly kind: "sending" }
  | { readonly kind: "sent"; readonly received: number; readonly duplicates: number }
  | { readonly kind: "error"; readonly message: string; readonly reconnect: boolean };

/**
 * Mouvements personnels (jamais les Mouvements importés, A-2) choisis un par un, envoyés à la boîte
 * d'arrivée de l'administration appairée. Aucun Mouvement n'est modifié sur le téléphone ; leur
 * rattachement ultérieur à une fiche reste une décision de l'administrateur, puis du destinataire.
 */
export function LibrarySendScreen({ client = defaultClient, deviceName }: LibraryScreenDependencies) {
  const router = useRouter();
  const services = useServicesOrMessage();
  const activity = useContext(ActivityDefinitionServiceContext);
  const session = librarySession.adminSession();
  const [phase, setPhase] = useState<SendPhase>({ kind: "loading" });
  const [movements, setMovements] = useState<readonly Movement[]>([]);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const name = deviceName ?? Device.deviceName ?? "iPhone";

  useEffect(() => {
    if (!services || !activity || !session) return;
    let cancelled = false;
    void (async () => {
      const entries = (await activity.movementCatalogue?.listEntries()) ?? [];
      const personal: Movement[] = [];
      for (const entry of entries) {
        if (entry.archived) continue;
        if (!(await services.registry.isInstalledMovement(entry.movement.id))) personal.push(entry.movement);
      }
      if (!cancelled) {
        setMovements(personal.sort((a, b) => a.name.localeCompare(b.name, "fr")));
        setPhase({ kind: "ready" });
      }
    })();
    return () => { cancelled = true; };
  }, [services, activity, session]);

  const send = useCallback(async () => {
    if (!activity || !session) return;
    setPhase({ kind: "sending" });
    const categories = await activity.listCategories();
    const zones = await activity.listBodyZones();
    const built = buildMovementInbox({
      movements: movements.filter((movement) => selected.has(movement.id)),
      categoryLabels: new Map(categories.map((category) => [category.id, category.name])),
      bodyZoneLabels: new Map(zones.map((zone) => [zone.id, zone.name])),
      deviceName: name,
      sentAt: new Date().toISOString(),
    });
    if (!built.ok) {
      setPhase({
        kind: "error",
        reconnect: false,
        message: "Un mouvement choisi ne peut pas être envoyé (" + built.issues.map((issue) => issue.path).join(", ") + "). Rien n'a été envoyé.",
      });
      return;
    }
    try {
      const result = await client.sendMovements(session, built.envelope);
      setPhase({ kind: "sent", received: result.received, duplicates: result.duplicates });
    } catch (reason) {
      const unauthorized = reason instanceof AdminClientError && reason.code === "UNAUTHORIZED";
      setPhase({
        kind: "error",
        reconnect: unauthorized,
        message: unauthorized
          ? "L'appairage a expiré ou a été révoqué sur votre PC. Connectez-vous de nouveau."
          : "L'envoi n'a pas abouti : vérifiez le Wi-Fi puis réessayez. Rien n'a été modifié sur ce téléphone.",
      });
    }
  }, [activity, session, movements, selected, client, name]);

  if (!session) {
    return (
      <LibraryScreen
        title="Envoyer mes mouvements"
        testID="library-send"
        primary={{ label: "Se connecter à l'administration", onPress: () => router.replace({ pathname: "/library-connect", params: { next: "send" } }), testID: "library-send-connect" }}
      >
        <Paragraph>Connectez-vous d&apos;abord à l&apos;administration KODJO de votre PC, sur le même Wi-Fi.</Paragraph>
      </LibraryScreen>
    );
  }
  if (phase.kind === "loading" || phase.kind === "sending") {
    return (
      <LibraryScreen title="Envoyer mes mouvements" testID="library-send">
        <Busy label={phase.kind === "sending" ? "Envoi en cours…" : "Chargement de vos mouvements…"} testID="library-send-busy" />
      </LibraryScreen>
    );
  }
  if (phase.kind === "sent") {
    return (
      <LibraryScreen title="Envoyer mes mouvements" testID="library-send" primary={{ label: "Terminer", onPress: () => router.dismissTo("/profile-edit"), testID: "library-send-finish" }}>
        <Notice tone="positive" title={`${plural(phase.received, "mouvement envoyé", "mouvements envoyés")} à « ${session.name} »`} testID="library-send-done">
          {phase.duplicates > 0
            ? `${plural(phase.duplicates, "était déjà reçu", "étaient déjà reçus")}, sans doublon. Vos mouvements restent inchangés sur ce téléphone.`
            : "Vos mouvements restent inchangés sur ce téléphone."}
        </Notice>
      </LibraryScreen>
    );
  }
  const count = selected.size;
  return (
    <LibraryScreen
      title="Envoyer mes mouvements"
      testID="library-send"
      primary={phase.kind === "error" && phase.reconnect
        ? { label: "Se reconnecter", onPress: () => router.replace({ pathname: "/library-connect", params: { next: "send" } }), testID: "library-send-reconnect" }
        : { label: count > 0 ? `Envoyer (${count})` : "Envoyer", onPress: () => void send(), disabled: count === 0, testID: "library-send-submit" }}
    >
      <Paragraph tone="secondary">{`Vers l'administration · ${session.name}`}</Paragraph>
      {phase.kind === "error" ? <Notice tone="danger" title="Envoi impossible" testID="library-send-error">{phase.message}</Notice> : null}
      {movements.length === 0 ? (
        <Paragraph testID="library-send-empty">Aucun mouvement personnel à envoyer. Les mouvements importés d&apos;une bibliothèque ne sont pas envoyés.</Paragraph>
      ) : (
        <Card testID="library-send-list">
          {movements.map((movement, index) => {
            const on = selected.has(movement.id);
            const toggle = () => setSelected((current) => {
              const next = new Set(current);
              if (next.has(movement.id)) next.delete(movement.id);
              else next.add(movement.id);
              return next;
            });
            return (
              <View key={movement.id}>
                {index > 0 ? <Divider /> : null}
                <Pressable
                  onPress={toggle}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={movement.name}
                  style={screenStyles.switchRow}
                  testID={`library-send-item-${movement.id}`}
                >
                  <Text style={screenStyles.switchLabel} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                    {movement.name}
                  </Text>
                  <Switch value={on} onValueChange={toggle} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden />
                </Pressable>
              </View>
            );
          })}
        </Card>
      )}
      <Paragraph tone="secondary">Les photos et vidéos ne sont pas envoyées dans cette version.</Paragraph>
    </LibraryScreen>
  );
}

const screenStyles = StyleSheet.create({
  empty: { alignItems: "center", gap: spacing[8], paddingVertical: spacing[24] },
  counters: { flexDirection: "row", gap: spacing[8] },
  counter: { flex: 1, alignItems: "center", paddingVertical: spacing[12], borderRadius: 12, backgroundColor: colors.surface },
  counterValue: { ...type.metricPrimary, color: colors.textPrimary },
  counterLabel: { ...type.supporting, color: colors.textSecondary },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surface, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: minTouchTarget, paddingVertical: spacing[8], gap: spacing[8] },
  switchLabel: { ...type.label, color: colors.textPrimary, flex: 1 },
});
