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
 *
 * Correction du 11/11/2026 : mise en page reprise des maquettes (cartes, intitulés de section, icônes,
 * pastilles, encarts, états centrés, boutons secondaires) ; logique, navigation, textes et testID inchangés.
 */
import * as Device from "expo-device";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import type { Movement } from "@/domain/activities/Movement";

import type { MovementCatalogueFile } from "@/domain/catalogue/MovementCatalogueFile";
import type { SheetLoadItem } from "@/domain/catalogue/catalogueLoadPlan";
import type { InstalledLibraryRecord, LibraryPreview } from "@/domain/catalogue/libraryPlan";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { AdminClient, AdminClientError, type AdminEndpoint, type AdminSession } from "@/features/catalogue/adminClient";
import { referenceLabels } from "@/features/catalogue/catalogueLoadPresentation";
import type { LibraryApplyReport, LibraryProgress } from "@/features/catalogue/LibraryService";
import { fetchAdminPreviews } from "@/features/catalogue/adminLibraryRefresh";
import { librarySession } from "@/features/catalogue/librarySession";
import { currentPairing, forgetStoredPairing, storePairing } from "@/features/catalogue/pairingStore";
import {
  reviewLabel,
  UNKNOWN_LIBRARY_OWNER_TEXT,
  availableLine,
  issueLine,
  modifiedLine,
  plural,
  sheetDetail,
  sheetName,
} from "@/features/catalogue/libraryPresentation";
import {
  BulletRow,
  Busy,
  Card,
  Divider,
  LIBRARY_CARD,
  LIBRARY_COLORS,
  LIBRARY_TEXT,
  LibraryScreen,
  Notice,
  Paragraph,
  Pill,
  Row,
  Section,
  SkeletonList,
  StatusHero,
  TextLink,
} from "@/features/catalogue/libraryUi";
import { buildMovementInbox } from "@/features/catalogue/movementInboxBuilder";
import { pickCatalogueFile } from "@/features/catalogue/pickCatalogueFile";
import { useLibraryServices, type LibraryServices } from "@/features/catalogue/useLibraryServices";
import { strings } from "@/shared/i18n";
import { KodjoIcon, type KodjoIconName } from "@/shared/ui/KodjoIcon";
import { colors, spacing, type } from "@/shared/ui/tokens";

/** Dépendances remplaçables (tests). */
export type LibraryScreenDependencies = {
  readonly client?: AdminClient;
  readonly pickFile?: () => Promise<unknown | null>;
  readonly deviceName?: string;
};

const defaultClient = new AdminClient();
const L = strings.libraries;
const C = strings.libraries.common;
/** Pas de rechargement automatique de la liste dans les 2 s qui suivent le précédent (recette du 11/11). */
const AUTO_REFRESH_PAUSE_MS = 2_000;

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
    <LibraryScreen title={L.addSource.title} testID="library-add">
      <Paragraph>{L.addSource.intro}</Paragraph>
      <View style={screenStyles.sourceCards}>
        <SourceCard
          icon="library-file"
          title={L.addSource.fileTitle}
          subtitle={L.addSource.fileSubtitle}
          onPress={() => void fileImport.run()}
          testID="library-add-file"
        />
        <SourceCard
          icon="library-computer"
          title={L.addSource.adminTitle}
          subtitle={L.addSource.adminSubtitle}
          onPress={() => router.push("/library-connect")}
          testID="library-add-admin"
        />
      </View>
      {fileImport.error ? <Notice tone="danger" title={C.fileUnreadable} testID="library-add-error">{fileImport.error}</Notice> : null}
    </LibraryScreen>
  );
}

/** Carte de provenance (12116:25093, 12116:25098) : icône, titre Medium 15, texte 12, petit chevron. */
function SourceCard({ icon, title, subtitle, onPress, testID }: { readonly icon: KodjoIconName; readonly title: string; readonly subtitle: string; readonly onPress: () => void; readonly testID: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title + ", " + subtitle} style={screenStyles.sourceCard} testID={testID}>
      <View style={screenStyles.sourceIcon}>
        <KodjoIcon name={icon} />
      </View>
      <View style={screenStyles.sourceText}>
        <Text style={LIBRARY_TEXT.medium15}>{title}</Text>
        <Text style={LIBRARY_TEXT.note}>{subtitle}</Text>
      </View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <KodjoIcon name="library-chevron-go-small" />
      </View>
    </Pressable>
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

  // Recette du 11/11 : un appairage encore valide (jeton du PC non expiré) est repris tel quel,
  // sans redemander de code — écran « Connecté » (12116:25175).
  useEffect(() => {
    let active = true;
    void currentPairing().then((session) => {
      if (active && session) setPhase((current) => (current.kind === "entry" ? { kind: "connected", session } : current));
    });
    return () => { active = false; };
  }, []);

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
      librarySession.restorePairing(session);
      storePairing(session);
      if (!cancelled.current) setPhase({ kind: "connected", session });
    } catch (reason) {
      if (cancelled.current) return;
      const failure = reason instanceof AdminClientError ? reason.code : "SERVER";
      if (failure === "CODE_REFUSED") setPhase({ kind: "refused" });
      else if (failure === "LOCKED") setPhase({ kind: "locked" });
      else if (failure === "NETWORK") setPhase({ kind: "notFound" });
      else setPhase({ kind: "failed", message: L.adminPairing.unexpectedResponse });
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
          <Paragraph>{L.adminPairing.instructions}</Paragraph>
          <CodeBoxes value={code} onChange={setCode} error={phase.kind !== "entry"} />
          {phase.kind === "refused" ? (
            <Notice tone="danger" title={L.adminPairing.refusedTitle} testID="library-connect-refused">
              {L.adminPairing.refusedMessage}
            </Notice>
          ) : null}
          {phase.kind === "locked" ? (
            <Notice tone="danger" title={L.adminPairing.lockedTitle} testID="library-connect-locked">
              {L.adminPairing.lockedMessage}
            </Notice>
          ) : null}
          <Paragraph tone="note">{L.adminPairing.sameWifi}</Paragraph>
        </>
      );
      primary = phase.kind === "entry"
        ? { label: L.adminPairing.connect, onPress: () => void connect(), disabled: !codeComplete, testID: "library-connect-submit" }
        : { label: C.retry, onPress: retry, testID: "library-connect-retry" };
      break;
    case "connecting":
      body = (
        <>
          <Paragraph>{L.adminPairing.instructions}</Paragraph>
          <CodeBoxes value={code} onChange={() => {}} disabled />
          <Busy label={L.adminPairing.connecting} detail={L.adminPairing.connectingDetail} testID="library-connect-busy" />
        </>
      );
      secondary = [{ label: C.cancel, onPress: () => { cancelled.current = true; setPhase({ kind: "entry" }); }, testID: "library-connect-cancel" }];
      break;
    case "connected":
      body = (
        <>
          <StatusHero
            tone="success"
            title={fillTemplate(L.adminPairing.connectedTitle, { name: phase.session.name })}
            message={L.adminPairing.connectedMessage}
            testID="library-connect-connected"
          />
          {/* Revue du 11/11 : sur un Wi-Fi partagé, vérifier que l'adresse est bien celle de votre PC. */}
          <Paragraph tone="note" align="center" testID="library-connect-address">{fillTemplate(L.adminPairing.address, { host: phase.session.host })}</Paragraph>
        </>
      );
      primary = params.next === "send"
        ? { label: L.adminPairing.chooseMovements, onPress: () => void showLibraries(phase.session), testID: "library-connect-continue" }
        : { label: L.adminPairing.seeLibraries, onPress: () => void showLibraries(phase.session), testID: "library-connect-continue" };
      break;
    case "notFound":
      body = (
        <View style={screenStyles.heroBlock} testID="library-connect-not-found">
          <StatusHero tone="notFound" title={L.adminPairing.notFoundTitle} />
          <Card>
            <BulletRow title={L.adminPairing.notFoundCheckPc} />
            <BulletRow title={L.adminPairing.notFoundCheckWifi} />
            <BulletRow title={L.adminPairing.notFoundCheckFirewall} />
          </Card>
        </View>
      );
      secondary = params.next === "send" ? [] : [{ label: C.importFromFile, onPress: () => void fileImport.run(), testID: "library-connect-file" }];
      primary = { label: C.retry, onPress: () => void connect(), testID: "library-connect-retry" };
      break;
    case "failed":
      body = <Notice tone="danger" title={L.adminPairing.failedTitle} testID="library-connect-failed">{phase.message}</Notice>;
      primary = { label: C.retry, onPress: retry, testID: "library-connect-retry" };
      break;
  }

  return (
    <LibraryScreen title={L.adminPairing.title} testID="library-connect" primary={primary} secondary={secondary}>
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
        accessibilityLabel={L.adminPairing.codeAccessibilityLabel}
        style={codeStyles.hidden}
        testID="library-connect-code"
      />
      <View style={codeStyles.row} onTouchEnd={() => input.current?.focus()} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {Array.from({ length: 6 }, (_, index) => (
          <View key={index} style={[codeStyles.box, error ? codeStyles.boxError : null]}>
            <Text style={[codeStyles.digit, disabled ? codeStyles.digitDisabled : null]}>{value[index] ?? ""}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Cases du code (12116:25123…) : 48 × 56, rayon 10, liseré #C7CCD6 (rouge #D11F1F 1,5 si refusé), écart 8, centrées. */
const codeStyles = StyleSheet.create({
  hidden: { position: "absolute", opacity: 0, width: 1, height: 1 },
  row: { flexDirection: "row", justifyContent: "center", gap: spacing[8], paddingVertical: spacing[16] },
  box: {
    flex: 1,
    maxWidth: 48,
    aspectRatio: 48 / 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LIBRARY_COLORS.codeBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  boxError: { borderColor: LIBRARY_COLORS.dangerText, borderWidth: 1.5 },
  digit: { ...type.metricPrimary, color: colors.textPrimary },
  digitDisabled: { color: LIBRARY_COLORS.muted },
});

// ——— Bibliothèques disponibles (12118:25124, 12119:25204, 12119:25277) ———

type AvailablePhase =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly previews: readonly LibraryPreview[]; readonly origin: string; readonly refreshedAt: number }
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
    setPhase((current) => (current.kind === "loading" ? current : { kind: "loading" }));
    if (source.kind === "FILE") {
      const available = await services.libraries.available(source.file);
      const previews = available.ok ? available.previews : [];
      librarySession.rememberPreviews(previews);
      setPhase({ kind: "ready", previews, origin: fillTemplate(L.available.fromFile, { title: source.file.catalogue.title }), refreshedAt: Date.now() });
      return;
    }
    try {
      // Lecture partagée avec le Profil (mise à jour silencieuse du statut, 15/11/2026) : `fetchAdminPreviews`.
      const { previews, entries } = await fetchAdminPreviews(client, services, source.session);
      librarySession.setSource({ ...source, entries, refreshedAt: Date.now() });
      setPhase({ kind: "ready", previews, origin: fillTemplate(L.available.fromAdmin, { name: source.session.name }), refreshedAt: Date.now() });
    } catch (reason) {
      const unauthorized = reason instanceof AdminClientError && reason.code === "UNAUTHORIZED";
      if (unauthorized) forgetStoredPairing();
      setPhase({
        kind: "error",
        unauthorized,
        message: unauthorized
          ? C.pairingExpired
          : L.available.connectionLost,
      });
    }
  }, [services, client]);

  // Recette du 11/11 (« Maximum update depth exceeded », liste qui clignote) : sur l'iPhone, le rappel
  // de focus était relancé à chaque rendu, et `refresh` repasse l'écran en chargement, d'où un
  // nouveau rendu. Le rappel ne dépend plus que de la disponibilité des services, lit la dernière
  // version de `refresh` dans une référence, et ne relance rien pendant un chargement ni juste après.
  const refreshRef = useRef(refresh);
  useEffect(() => { refreshRef.current = refresh; }, [refresh]);
  const inFlight = useRef(false);
  const lastRefresh = useRef(0);
  const runRefresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await refreshRef.current();
    } finally {
      inFlight.current = false;
      lastRefresh.current = Date.now();
    }
  }, []);
  const servicesReady = services !== null;
  useFocusEffect(useCallback(() => {
    if (!servicesReady || inFlight.current || Date.now() - lastRefresh.current < AUTO_REFRESH_PAUSE_MS) return;
    void runRefresh();
  }, [servicesReady, runRefresh]));

  const isAdmin = librarySession.source()?.kind === "ADMIN";
  let body: React.ReactNode;
  let primary: Parameters<typeof LibraryScreen>[0]["primary"] = null;
  let secondary: Parameters<typeof LibraryScreen>[0]["secondary"] = [];
  // MOUV-D2. Décision de Hermann du 12/11/2026 : « L'utilisateur n'a pas besoin de savoir qu'une fiche a
  // été retenue, c'est le problème de l'expéditeur » : plus d'encadré « Fiche non transférée ». Recette du 13/11
  // (a1-medias : « Le destinataire n'a pas à savoir que des fiches ne lui sont pas transférées, c'est à l'expéditeur
  // de le savoir et de corriger ») : plus d'encadré non plus pour une Bibliothèque entièrement refusée ; l'information
  // est dans l'administration du PC. [Avant (12/11) : encadré « Bibliothèques non transférées » nommant la
  // Bibliothèque — remplacé.]
  if (phase.kind === "loading") {
    body = (
      <>
        <Busy label={L.available.loading} compact testID="library-available-loading" />
        <SkeletonList />
      </>
    );
  } else if (phase.kind === "error") {
    body = <Notice tone="danger" title={L.available.unavailableTitle} testID="library-available-error">{phase.message}</Notice>;
    primary = phase.unauthorized
      ? { label: C.reconnect, onPress: () => router.replace("/library-connect"), testID: "library-available-reconnect" }
      : { label: C.refresh, onPress: () => void runRefresh(), testID: "library-available-refresh" };
  } else if (phase.previews.length === 0) {
    body = (
      <StatusHero
        tone="empty"
        title={L.available.emptyTitle}
        message={L.available.emptyMessage}
        testID="library-available-empty"
      />
    );
    secondary = [{ label: C.importFromFile, onPress: () => void fileImport.run(), testID: "library-available-file" }];
    primary = isAdmin ? { label: C.refresh, onPress: () => void runRefresh(), testID: "library-available-refresh" } : null;
  } else {
    body = (
      <>
        <Paragraph>{phase.origin}</Paragraph>
        <Card testID="library-available-list">
          {phase.previews.map((preview, index) => {
            const line = availableLine(preview);
            return (
              <View key={preview.catalogueId + "/" + preview.libraryId}>
                {index > 0 ? <Divider /> : null}
                {/* 12118:25145… : livre, nom Medium 15, ligne 12, pastille ; la ligne entière s'ouvre (sans chevron). */}
                <Row
                  icon="library-book"
                  title={preview.title}
                  subtitle={line.subtitle}
                  pill={<Pill label={line.pill} tone={line.tone} />}
                  chevron={false}
                  spacious
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
          <View style={screenStyles.refreshLine}>
            <Text style={LIBRARY_TEXT.note}>{L.available.refreshedNow}</Text>
            <TextLink label={C.refresh} onPress={() => void runRefresh()} testID="library-available-refresh-row" />
          </View>
        ) : null}
      </>
    );
  }
  return (
    <LibraryScreen title={L.available.title} testID="library-available" primary={primary} secondary={secondary}>
      {body}
      {fileImport.error ? <Notice tone="danger" title={C.fileUnreadable}>{fileImport.error}</Notice> : null}
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
      () => { if (!cancelled) setPhase({ kind: "failed", message: L.preview.previewFailed }); },
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
      setPhase({ kind: "failed", message: L.preview.applyFailed });
    }
  }, [services]);

  const decide = useCallback(async (preview: LibraryPreview, source: MovementCatalogueFile, decision: "DEFERRED" | "REFUSED") => {
    if (!services) return;
    if (decision === "DEFERRED") await services.libraries.defer(source, preview.libraryId);
    else await services.libraries.refuse(source, preview.libraryId);
    const after = await services.libraries.preview(source, preview.libraryId);
    if (after) librarySession.rememberPreviews([after]);
    // Recette du 13/11 (x-d-maj : « Bouton refuser : on reste sur l'écran […] Il faudrait directement revenir sur l'écran »)
    // : un refus ramène à l'écran précédent, où la Bibliothèque porte « Refusée ». [Avant : écran « Mise à jour refusée »
    // et bouton Terminer — remplacé pour le refus.]
    if (decision === "REFUSED") {
      router.back();
      return;
    }
    setPhase({ kind: "decided", decision, preview });
  }, [services, router]);

  if (phase.kind === "loading") return <LibraryScreen title={C.library} testID="library-preview"><Busy label={L.preview.preparing} /></LibraryScreen>;
  if (phase.kind === "missing") return <LibraryScreen title={C.library} testID="library-preview"><Notice tone="warning" title={L.preview.missingTitle}>{L.preview.missingMessage}</Notice></LibraryScreen>;
  if (phase.kind === "failed") {
    return (
      <LibraryScreen title={C.library} testID="library-preview" primary={{ label: C.finish, onPress: () => router.dismissTo("/profile-edit"), testID: "library-preview-finish" }}>
        <Notice tone="danger" title={L.preview.interruptedTitle} testID="library-preview-failed">{phase.message}</Notice>
      </LibraryScreen>
    );
  }
  if (phase.kind === "applying") {
    return <LibraryScreen title={phase.preview.title} testID="library-preview"><Busy label={phase.preview.installedRevision === null ? L.preview.installing : L.preview.updating} testID="library-preview-applying" /></LibraryScreen>;
  }
  if (phase.kind === "decided") {
    return (
      <LibraryScreen title={fillTemplate(L.preview.updateOf, { title: phase.preview.title })} testID="library-preview" primary={{ label: C.finish, onPress: () => router.back(), testID: "library-preview-finish" }}>
        <StatusHero
          tone="success"
          title={phase.decision === "DEFERRED" ? L.preview.deferredTitle : L.preview.refusedTitle}
          message={phase.decision === "DEFERRED"
            ? L.preview.deferredMessage
            : L.preview.refusedMessage}
          testID="library-preview-decided"
        />
      </LibraryScreen>
    );
  }
  if (phase.kind === "done") return <LibraryResult report={phase.report} preview={phase.preview} />;

  const { preview, file: source } = phase;
  const isUpdate = preview.installedRevision !== null;
  const toReview = preview.toReview.length > 0 ? (
    <Section label={fillTemplate(L.preview.toReview, { count: String(preview.toReview.length) })}>
      <Card testID="library-preview-review">
        {preview.toReview.map((entry, index) => (
          <View key={entry.item.sheetId}>
            {index > 0 ? <Divider /> : null}
            <Row
              title={entry.item.name}
              titleVariant="semibold"
              subtitle={reviewLabel(entry)}
              subtitleTone="secondary"
              testID={`library-preview-review-${entry.item.sheetId}`}
            />
          </View>
        ))}
      </Card>
    </Section>
  ) : null;
  // Constat d) du 12/11/2026 : avertissement « uniquement si le propriétaire de la bibliothèque est inconnu »,
  // texte de Figma. [Avant : aussi pour des fiches sans propriétaire dans une bibliothèque qui en a un, avec
  // « Cause : … » (fn14) — remplacé. La restriction de ces fiches reste appliquée.]
  const ownerWarning = preview.ownerlessLibrary ? (
    <Notice tone="warning" title={L.preview.unknownOwnerTitle} testID="library-preview-unknown-owner">
      {UNKNOWN_LIBRARY_OWNER_TEXT}
    </Notice>
  ) : null;

  if (!isUpdate) {
    // Aperçu avant installation (12118:25170).
    return (
      <LibraryScreen
        title={preview.title}
        testID="library-preview"
        primary={{ label: fillTemplate(L.preview.install, { count: plural(preview.memberCount, C.sheetSingular, C.sheetPlural) }), onPress: () => void apply(preview, source), testID: "library-preview-install" }}
      >
        {/* 12118:25189 : grand compteur, puces bleue (nouvelles) et verte (déjà présentes), note. */}
        <Card style={screenStyles.summaryCard}>
          <View style={screenStyles.bigCountLine} testID="library-preview-count" accessible>
            <Text style={screenStyles.bigCount}>{plural(preview.memberCount, C.sheetSingular, C.sheetPlural)}</Text>
            <Text style={LIBRARY_TEXT.note}>{L.preview.inThisLibrary}</Text>
          </View>
          <Divider />
          <SummaryLine
            dot={colors.primary}
            title={fillTemplate(preview.newCount > 1 ? L.preview.newCountPlural : L.preview.newCountSingular, { count: String(preview.newCount) })}
            subtitle={L.preview.addedToCatalogue}
            testID="library-preview-added"
          />
          <SummaryLine
            dot={LIBRARY_COLORS.positiveText}
            title={fillTemplate(preview.presentCount > 1 ? L.preview.presentCountPlural : L.preview.presentCountSingular, { count: String(preview.presentCount) })}
            subtitle={L.preview.attachedNoDuplicate}
            testID="library-preview-attached"
          />
          <Text style={LIBRARY_TEXT.captionMuted}>{L.preview.existingUntouched}</Text>
        </Card>
        {ownerWarning}
        {preview.added.length > 0 ? (
          <Section label={L.preview.newSheets}>
            <Card testID="library-preview-new-list">
              {preview.added.slice(0, 3).map((item, index) => (
                <View key={item.sheetId}>
                  {index > 0 ? <Divider /> : null}
                  <Row title={item.name} titleVariant="regular" pill={<Pill label={L.preview.newPill} tone="positive" />} testID={`library-preview-new-${item.sheetId}`} />
                </View>
              ))}
              {preview.added.length > 3 ? (
                <Text style={[LIBRARY_TEXT.note, screenStyles.moreLine]}>{fillTemplate(L.preview.moreNew, { count: plural(preview.added.length - 3, L.preview.otherNewSingular, L.preview.otherNewPlural) })}</Text>
              ) : null}
            </Card>
          </Section>
        ) : null}
        {toReview}
        {preview.missingExternal.length > 0 ? (
          <Notice tone="warning" title={plural(preview.missingExternal.length, L.preview.missingExternalSingular, L.preview.missingExternalPlural)}>
            {L.preview.missingExternalMessage}
          </Notice>
        ) : null}
      </LibraryScreen>
    );
  }

  // Aperçu d'une mise à jour (12118:25251).
  // Constat d) du 12/11/2026 : « Nouvelles » = fiches qui entrent dans la bibliothèque, qu'elles soient déjà dans le
  // Catalogue ou non ; « Reporter » supprimé (même effet que le retour) ; « Refuser » pleine largeur au-dessus de
  // « Mettre à jour ». [Avant : seules les fiches absentes du Catalogue comptaient ; Reporter et Refuser côte à côte — remplacé.]
  const removedNames = preview.removed.map((member) => ({ key: member.catalogueId + "/" + member.sheetId, name: sheetName(source, member.sheetId) }));
  const joinedCount = preview.joined.length;
  return (
    <LibraryScreen
      title={fillTemplate(L.preview.updateOf, { title: preview.title })}
      testID="library-preview"
      secondary={[
        { label: L.preview.refuse, onPress: () => void decide(preview, source, "REFUSED"), testID: "library-preview-refuse" },
      ]}
      primary={{ label: C.updatePill, onPress: () => void apply(preview, source), disabled: preview.status === "UP_TO_DATE", testID: "library-preview-update" }}
    >
      {/* 12118:25270 : une carte, trois compteurs. */}
      <Card style={screenStyles.counters} testID="library-preview-counters">
        <Counter value={preview.modified.length} label={preview.modified.length > 1 ? L.preview.counterModifiedPlural : L.preview.counterModifiedSingular} />
        <Counter value={joinedCount} label={joinedCount > 1 ? L.preview.counterNewPlural : L.preview.counterNewSingular} />
        <Counter value={preview.removed.length} label={preview.removed.length > 1 ? L.preview.counterRemovedPlural : L.preview.counterRemovedSingular} />
      </Card>
      <Section label={fillTemplate(L.preview.revisionSection, { from: String(preview.installedRevision), to: String(preview.targetRevision) })}>
        <Card testID="library-preview-sheets">
          {preview.modified.map((item, index) => {
            const alsoIn = preview.alsoIn[preview.catalogueId + "/" + item.sheetId] ?? [];
            return (
              <View key={item.sheetId}>
                {index > 0 ? <Divider /> : null}
                <Row
                  title={item.name}
                  titleVariant="semibold"
                  subtitle={modifiedLine(item, labels)}
                  subtitleTone="secondary"
                  detail={alsoIn.length > 0 ? alsoIn.map((title) => fillTemplate(L.preview.alsoIn, { title })).join("\n") : null}
                  pill={<Pill label={L.preview.modifiedPill} tone="action" />}
                  pillOnTitle
                  link={L.preview.seeDetail}
                  onPress={() => router.push({ pathname: "/library-sheet", params: { catalogueId: preview.catalogueId, libraryId: preview.libraryId, sheetId: item.sheetId } })}
                  testID={`library-preview-modified-${item.sheetId}`}
                />
              </View>
            );
          })}
          {preview.joined.map((item, index) => (
            <View key={item.sheetId}>
              {preview.modified.length + index > 0 ? <Divider /> : null}
              <Row
                title={item.name}
                titleVariant="semibold"
                subtitle={item.state === "NEW" ? L.preview.joinedNew : L.preview.joinedPresent}
                subtitleTone="secondary"
                pill={<Pill label={L.preview.newPill} tone="positive" />}
                pillOnTitle
                testID={`library-preview-new-${item.sheetId}`}
              />
            </View>
          ))}
          {removedNames.map((entry, index) => (
            <View key={entry.key}>
              {preview.modified.length + joinedCount + index > 0 ? <Divider /> : null}
              <Row
                title={entry.name}
                titleVariant="semibold"
                subtitle={L.preview.removedSubtitle}
                subtitleTone="secondary"
                pill={<Pill label={L.preview.removedPill} />}
                pillOnTitle
                testID={`library-preview-removed-${entry.key}`}
              />
            </View>
          ))}
        </Card>
      </Section>
      <Paragraph tone="note">{L.preview.updateNote}</Paragraph>
      {ownerWarning}
      {toReview}
    </LibraryScreen>
  );
}

/** Ligne de résumé à puce colorée de 8 (12118:25193, 12118:25196). */
function SummaryLine({ dot, title, subtitle, testID }: { readonly dot: string; readonly title: string; readonly subtitle: string; readonly testID: string }) {
  return (
    <View style={screenStyles.summaryLine} testID={testID}>
      <View style={[screenStyles.summaryDot, { backgroundColor: dot }]} />
      <View style={screenStyles.summaryText}>
        <Text style={LIBRARY_TEXT.semibold14}>{title}</Text>
        <Text style={LIBRARY_TEXT.note}>{subtitle}</Text>
      </View>
    </View>
  );
}

function Counter({ value, label }: { readonly value: number; readonly label: string }) {
  return (
    <View style={screenStyles.counter}>
      <Text style={screenStyles.counterValue}>{value}</Text>
      <Text style={LIBRARY_TEXT.captionMuted}>{label}</Text>
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
        secondary={[{ label: C.finish, onPress: () => router.dismissTo("/profile-edit"), testID: "library-result-finish" }]}
        secondaryBelow
        primary={{ label: L.result.seeInCatalogue, onPress: () => router.dismissTo("/"), testID: "library-result-catalogue" }}
      >
        <StatusHero tone="success" title={fillTemplate(L.result.installedTitle, { title: report.title })} message={L.result.installedMessage} testID="library-result-installed" />
        <Card>
          <Row title={`${plural(report.added, L.result.addedSingular, L.result.addedPlural)}`} titleVariant="semibold" testID="library-result-added" />
          <Divider />
          <Row title={fillTemplate(L.result.attachedLine, { count: plural(report.attached, L.result.attachedSingular, L.result.attachedPlural) })} titleVariant="semibold" testID="library-result-attached" />
        </Card>
        <ResultWarnings report={report} preview={preview} />
      </LibraryScreen>
    );
  }
  return (
    <LibraryScreen
      title={report.title}
      testID="library-result"
      primary={{ label: C.finish, onPress: () => router.dismissTo("/profile-edit"), testID: "library-result-finish" }}
    >
      <StatusHero tone="success" title={fillTemplate(L.result.upToDateTitle, { title: report.title })} message={fillTemplate(L.result.revision, { revision: String(report.revision) })} testID="library-result-updated" />
      <Card>
        <Row
          title={plural(report.updated, L.result.updatedSingular, L.result.updatedPlural)}
          titleVariant="semibold"
          subtitle={alsoIn.length > 0 ? fillTemplate(L.result.alsoInSubtitle, { count: String(alsoIn.length), titles: [...new Set(alsoIn)].join(", ") }) : null}
          testID="library-result-modified"
        />
        <Divider />
        <Row title={plural(report.added + report.attached, L.result.addedSingular, L.result.addedPlural)} titleVariant="semibold" subtitle={fillTemplate(L.result.addedSubtitle, { title: report.title })} testID="library-result-added" />
        <Divider />
        <Row title={plural(report.removed, fillTemplate(L.result.removedSingular, { title: report.title }), fillTemplate(L.result.removedPlural, { title: report.title }))} titleVariant="semibold" subtitle={L.result.removedSubtitle} testID="library-result-removed" />
      </Card>
      <ResultWarnings report={report} preview={preview} />
    </LibraryScreen>
  );
}

function ResultWarnings({ report, preview }: { readonly report: LibraryApplyReport; readonly preview: LibraryPreview }) {
  return (
    <>
      {report.toReview > 0 ? (
        <Notice tone="warning" title={plural(report.toReview, L.result.toReviewSingular, L.result.toReviewPlural)} testID="library-result-review">
          {preview.toReview.map((entry) => fillTemplate(L.result.reviewLine, { name: entry.item.name, reason: reviewLabel(entry) })).join("\n")}
        </Notice>
      ) : null}
      {report.failed.length > 0 ? (
        <Notice tone="danger" title={plural(report.failed.length, L.result.failedSingular, L.result.failedPlural)} testID="library-result-failed">
          {L.result.failedMessage}
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

  if (!item) return <LibraryScreen title={L.sheetDetail.title} testID="library-sheet"><Busy label={C.loading} /></LibraryScreen>;
  const detail = sheetDetail(item, labels);
  return (
    <LibraryScreen title={item.name} testID="library-sheet" primary={{ label: L.sheetDetail.backToSummary, onPress: () => router.back(), testID: "library-sheet-back" }}>
      <Paragraph testID="library-sheet-summary">
        {fillTemplate(L.sheetDetail.summary, {
          from: String(item.installedRevision ?? "—"),
          to: String(item.revision),
          changed: plural(detail.changed.length, L.sheetDetail.changedSingular, L.sheetDetail.changedPlural),
          unchanged: plural(detail.unchanged.length, L.sheetDetail.unchangedSingular, L.sheetDetail.unchangedPlural),
        })}
      </Paragraph>
      {/* 12118:25336… : une carte par champ — intitulé 11 et pastille, colonnes « Actuelle » | « Nouvelle ». */}
      {detail.changed.map((row) => (
        <Card key={row.path} style={screenStyles.fieldCard} testID={`library-sheet-field-${row.path}`}>
          <View style={screenStyles.fieldHeader} testID={`library-sheet-label-${row.path}`}>
            <Text style={[LIBRARY_TEXT.caption, screenStyles.flex]}>{row.label}</Text>
            <Pill label={row.conflict ? L.sheetDetail.modifiedOnPhone : L.sheetDetail.modified} tone={row.conflict ? "warning" : "action"} />
          </View>
          <View style={screenStyles.fieldColumns}>
            <View style={screenStyles.fieldColumn}>
              <Text style={LIBRARY_TEXT.captionMuted}>{L.sheetDetail.current}</Text>
              <Text style={LIBRARY_TEXT.medium14}>{row.current}</Text>
            </View>
            <View style={screenStyles.fieldSeparator} />
            <View style={screenStyles.fieldColumn}>
              <Text style={LIBRARY_TEXT.captionMuted}>{L.sheetDetail.next}</Text>
              <Text style={LIBRARY_TEXT.medium14}>{row.next}</Text>
            </View>
          </View>
        </Card>
      ))}
      {detail.unchanged.length > 0 ? (
        showUnchanged ? (
          <Card testID="library-sheet-unchanged">
            {detail.unchanged.map((row, index) => (
              <View key={row.path}>
                {index > 0 ? <Divider /> : null}
                <Row title={row.label} titleVariant="medium14" subtitle={row.next} testID={`library-sheet-unchanged-${row.path}`} />
              </View>
            ))}
          </Card>
        ) : (
          <View style={screenStyles.linkLine}>
            <TextLink label={fillTemplate(L.sheetDetail.showUnchanged, { count: String(detail.unchanged.length) })} onPress={() => setShowUnchanged(true)} testID="library-sheet-show-unchanged" />
          </View>
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
      <LibraryScreen title={progress.title} testID="library-resume" primary={{ label: C.finish, onPress: () => router.dismissTo("/profile-edit"), testID: "library-resume-finish" }}>
        <StatusHero tone="success" title={fillTemplate(L.result.upToDateTitle, { title: progress.title })} message={fillTemplate(L.result.revision, { revision: String(progress.revision) })} testID="library-resume-done" />
      </LibraryScreen>
    );
  }
  if (state === "loading" || state === "running") {
    return <LibraryScreen title={progress?.title ?? C.library} testID="library-resume"><Busy label={state === "running" ? L.resume.running : C.loading} /></LibraryScreen>;
  }
  if (!progress) {
    return <LibraryScreen title={C.library} testID="library-resume"><StatusHero tone="success" title={L.resume.noneTitle} message={L.resume.noneMessage} /></LibraryScreen>;
  }
  const isUpdate = progress.kind === "UPDATE";
  const ratio = progress.total === 0 ? 0 : progress.applied / progress.total;
  return (
    <LibraryScreen
      title={progress.title}
      testID="library-resume"
      secondary={[{ label: L.resume.later, onPress: () => router.back(), testID: "library-resume-later" }]}
      primary={{ label: isUpdate ? L.resume.resumeUpdate : L.resume.resumeInstall, onPress: () => void resume(), testID: "library-resume-continue" }}
    >
      {/* 12119:25264 : pastille Reprise, titre, texte, barre de progression et décompte dans une carte. */}
      <Card style={screenStyles.resumeCard} testID="library-resume-card">
        <View style={screenStyles.resumeHeader}>
          <View style={screenStyles.resumeBadge}>
            <KodjoIcon name="library-resume" />
          </View>
          <View style={screenStyles.summaryText}>
            <Text style={screenStyles.resumeTitle}>{isUpdate ? L.resume.updateInterrupted : L.resume.installInterrupted}</Text>
            <Text style={screenStyles.resumeText}>
              {fillTemplate(isUpdate ? L.resume.messageUpdate : L.resume.messageInstall, { title: progress.title, revision: String(progress.revision) })}
            </Text>
          </View>
        </View>
        <View style={screenStyles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: progress.total, now: progress.applied }}>
          <View style={[screenStyles.progressFill, { width: `${Math.round(ratio * 100)}%` }]} />
        </View>
        <Text style={LIBRARY_TEXT.note} testID="library-resume-progress">{fillTemplate(L.resume.progress, { applied: String(progress.applied), total: String(progress.total) })}</Text>
      </Card>
      <Paragraph tone="note">{L.resume.note}</Paragraph>
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
      title={L.invalid.title}
      testID="library-invalid"
      primary={{ label: L.invalid.pickAnother, onPress: () => void fileImport.run(), testID: "library-invalid-pick" }}
    >
      <Notice tone="danger" large title={L.invalid.noticeTitle} testID="library-invalid-notice">
        {L.invalid.noticeMessage}
      </Notice>
      {/* 12119:25186 : puce rouge, élément en Semi Bold 13 (« Fiche 12 « Burpee » »), problème en 12 dessous. */}
      <Section label={fillTemplate(L.invalid.problems, { count: String(lines.length) })}>
        <Card testID="library-invalid-issues">
          {lines.slice(0, 50).map((line, index) => {
            const cut = line.indexOf(" — ");
            return (
              <View key={index}>
                {index > 0 ? <Divider /> : null}
                <BulletRow
                  tone="danger"
                  title={cut < 0 ? line : line.slice(0, cut)}
                  detail={cut < 0 ? null : line.slice(cut + 3)}
                  testID={`library-invalid-issue-${index}`}
                />
              </View>
            );
          })}
        </Card>
      </Section>
      {lines.length > 50 ? <Paragraph tone="note">{fillTemplate(L.invalid.moreProblems, { count: String(lines.length - 50) })}</Paragraph> : null}
    </LibraryScreen>
  );
}

// ——— Bibliothèque installée (12098:115 ; désinstallation ajoutée au lot le 13/11/2026) ———

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

  if (!library) return <LibraryScreen title={C.library} testID="library-installed"><Busy label={C.loading} /></LibraryScreen>;
  const preview = librarySession.preview(library.catalogueId, library.libraryId);
  const updateAvailable = preview?.status === "UPDATE_AVAILABLE";
  const openUpdate = () => router.push({ pathname: "/library-preview", params: { catalogueId: library.catalogueId, libraryId: library.libraryId } });
  // 12098:115 : pastille « Mettre à jour » en face du titre, état en 13 gris dessous, carte des mouvements
  // (nom Medium 14, zones 12, chevron), carte « Désinstaller la bibliothèque » (Medium 14 rouge) et sa note 12 grise.
  // [Remplacé le 13/11/2026 : « Sans « Désinstaller la bibliothèque » ni sa note (A-4, reporté). »]
  const uninstall = () => {
    if (!services) return;
    void (async () => {
      const key = { catalogueId: library.catalogueId, libraryId: library.libraryId };
      const preview = await services.libraries.uninstallPreview(key);
      if (!preview) return;
      const lines = [
        preview.removed > 0 ? fillTemplate(L.installed.removedLine, { movements: plural(preview.removed, L.installed.removedSingular, L.installed.removedPlural) }) : null,
        preview.kept > 0
          ? fillTemplate(L.installed.keptLine, { movements: plural(preview.kept, L.installed.keptSingular, L.installed.keptPlural) })
          : null,
      ].filter((line): line is string => line !== null);
      Alert.alert(fillTemplate(L.installed.confirmTitle, { title: preview.title }), lines.join("\n"), [
        { text: C.cancel, style: "cancel" },
        {
          text: L.installed.uninstall,
          style: "destructive",
          onPress: () => {
            void services.libraries.uninstall(key).then(
              () => router.back(),
              (error: unknown) => {
                console.error("La désinstallation a échoué.", error);
                Alert.alert(L.installed.interruptedTitle, L.installed.interruptedMessage);
              },
            );
          },
        },
      ]);
    })();
  };
  return (
    <LibraryScreen
      title={library.library.title}
      testID="library-installed"
      headerTrailing={updateAvailable ? (
        <Pressable onPress={openUpdate} accessibilityRole="button" accessibilityLabel={L.installed.updateAccessibilityLabel} hitSlop={spacing[12]} testID="library-installed-update">
          <Pill label={C.updatePill} tone="action" />
        </Pressable>
      ) : null}
    >
      <Text style={screenStyles.installedStatus} testID="library-installed-status">
        {fillTemplate(L.installed.status, {
          movements: plural(library.library.members.length, C.movementSingular, C.movementPlural),
          state: updateAvailable ? L.installed.statusUpdateAvailable : L.installed.statusUpToDate,
        })}
      </Text>
      <Card testID="library-installed-members">
        {members.map((member, index) => (
          <View key={member.key}>
            {index > 0 ? <Divider /> : null}
            <Row
              title={member.name}
              titleVariant="medium14"
              subtitle={member.zones || null}
              onPress={member.movementId ? () => router.push({ pathname: "/movement", params: { movementId: member.movementId! } }) : undefined}
              testID={`library-installed-member-${member.key}`}
            />
          </View>
        ))}
      </Card>
      <View style={screenStyles.uninstallBlock}>
        <Card>
          <Row title={L.installed.uninstallRow} titleVariant="medium14" titleTone="danger" chevron={false} onPress={uninstall} testID="library-installed-uninstall" />
        </Card>
        <Paragraph tone="note" testID="library-installed-uninstall-note">
          {L.installed.uninstallNote}
        </Paragraph>
      </View>
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
      try {
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
      } catch {
        if (!cancelled) setPhase({ kind: "error", reconnect: false, message: L.send.readFailed });
      }
    })();
    return () => { cancelled = true; };
  }, [services, activity, session]);

  const send = useCallback(async () => {
    if (!activity || !session) return;
    setPhase({ kind: "sending" });
    let categories: Awaited<ReturnType<typeof activity.listCategories>>;
    let zones: Awaited<ReturnType<typeof activity.listBodyZones>>;
    try {
      categories = await activity.listCategories();
      zones = await activity.listBodyZones();
    } catch {
      setPhase({ kind: "error", reconnect: false, message: L.send.referencesFailed });
      return;
    }
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
        message: fillTemplate(L.send.invalidMovement, { paths: built.issues.map((issue) => issue.path).join(", ") }),
      });
      return;
    }
    try {
      const result = await client.sendMovements(session, built.envelope);
      setPhase({ kind: "sent", received: result.received, duplicates: result.duplicates });
    } catch (reason) {
      const unauthorized = reason instanceof AdminClientError && reason.code === "UNAUTHORIZED";
      if (unauthorized) forgetStoredPairing();
      setPhase({
        kind: "error",
        reconnect: unauthorized,
        message: unauthorized
          ? C.pairingExpired
          : L.send.sendFailed,
      });
    }
  }, [activity, session, movements, selected, client, name]);

  if (!session) {
    return (
      <LibraryScreen
        title={L.send.title}
        testID="library-send"
        primary={{ label: L.send.connect, onPress: () => router.replace({ pathname: "/library-connect", params: { next: "send" } }), testID: "library-send-connect" }}
      >
        <Paragraph>{L.send.connectFirst}</Paragraph>
      </LibraryScreen>
    );
  }
  if (phase.kind === "loading" || phase.kind === "sending") {
    return (
      <LibraryScreen title={L.send.title} testID="library-send">
        <Busy label={phase.kind === "sending" ? L.send.sending : L.send.loading} testID="library-send-busy" />
      </LibraryScreen>
    );
  }
  if (phase.kind === "sent") {
    return (
      <LibraryScreen title={L.send.title} testID="library-send" primary={{ label: C.finish, onPress: () => router.dismissTo("/profile-edit"), testID: "library-send-finish" }}>
        <StatusHero
          tone="success"
          title={fillTemplate(L.send.sentTitle, { movements: plural(phase.received, L.send.sentSingular, L.send.sentPlural), name: session.name })}
          message={phase.duplicates > 0
            ? fillTemplate(L.send.duplicatesMessage, { count: plural(phase.duplicates, L.send.duplicatesSingular, L.send.duplicatesPlural) })
            : L.send.unchangedMessage}
          testID="library-send-done"
        />
      </LibraryScreen>
    );
  }
  const count = selected.size;
  return (
    <LibraryScreen
      title={L.send.title}
      testID="library-send"
      primary={phase.kind === "error" && phase.reconnect
        ? { label: C.reconnect, onPress: () => router.replace({ pathname: "/library-connect", params: { next: "send" } }), testID: "library-send-reconnect" }
        : { label: count > 0 ? fillTemplate(L.send.sendCount, { count: String(count) }) : L.send.send, onPress: () => void send(), disabled: count === 0, testID: "library-send-submit" }}
    >
      {/* Sans maquette : aligné sur les autres écrans (introduction 13, carte, note 12). */}
      <Paragraph>{fillTemplate(L.send.destination, { name: session.name })}</Paragraph>
      {phase.kind === "error" ? <Notice tone="danger" title={L.send.errorTitle} testID="library-send-error">{phase.message}</Notice> : null}
      {movements.length === 0 ? (
        <StatusHero
          tone="empty"
          title={L.send.emptyTitle}
          message={L.send.emptyMessage}
          testID="library-send-empty"
        />
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
      <Paragraph tone="note">{L.send.mediaNote}</Paragraph>
    </LibraryScreen>
  );
}

const screenStyles = StyleSheet.create({
  flex: { flex: 1 },
  // Ajouter une bibliothèque : deux cartes séparées de 12, icône dans une colonne de 34, chevron à 18 du bord.
  sourceCards: { gap: spacing[12] },
  sourceCard: {
    ...LIBRARY_CARD,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 84,
    paddingVertical: spacing[16],
    paddingLeft: 18,
    paddingRight: 18,
  },
  sourceIcon: { width: 34, alignItems: "flex-start" },
  sourceText: { flex: 1, gap: spacing[4], paddingRight: spacing[16] },
  heroBlock: { gap: spacing[24] },
  refreshLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  // Aperçu avant installation (12118:25189).
  summaryCard: { paddingVertical: spacing[16], gap: spacing[12] },
  bigCountLine: { flexDirection: "row", alignItems: "baseline", gap: spacing[14], paddingBottom: spacing[2] },
  bigCount: { ...type.metricPrimary, color: colors.textPrimary },
  summaryLine: { flexDirection: "row", alignItems: "flex-start", gap: spacing[10] },
  summaryDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  summaryText: { flex: 1, gap: spacing[4] },
  moreLine: { paddingTop: spacing[4], paddingBottom: spacing[16] },
  // Aperçu d'une mise à jour (12118:25270).
  counters: { flexDirection: "row", paddingVertical: spacing[12] },
  counter: { flex: 1, alignItems: "center", gap: spacing[6] },
  counterValue: { ...type.screenTitle, color: colors.textPrimary },
  // Détail d'une fiche (12118:25336).
  fieldCard: { paddingVertical: spacing[12], gap: spacing[8] },
  fieldHeader: { flexDirection: "row", alignItems: "center", gap: spacing[8] },
  fieldColumns: { flexDirection: "row", gap: spacing[12], paddingBottom: spacing[12] },
  fieldColumn: { flex: 1, gap: spacing[6] },
  fieldSeparator: { width: 1, backgroundColor: colors.divider },
  linkLine: { flexDirection: "row" },
  // Reprise après interruption (12119:25264).
  resumeCard: { paddingVertical: spacing[16], gap: spacing[12] },
  resumeHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing[12], paddingBottom: spacing[12] },
  resumeBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: LIBRARY_COLORS.actionSurface, alignItems: "center", justifyContent: "center" },
  resumeTitle: { ...type.listCardTitle, color: colors.textPrimary },
  resumeText: { ...type.supporting, color: colors.textSecondary },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: LIBRARY_COLORS.skeleton, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  // Bibliothèque installée (12098:212) : état 13 #7A7A80.
  installedStatus: { ...LIBRARY_TEXT.intro, color: LIBRARY_COLORS.muted },
  uninstallBlock: { gap: spacing[8] },
  // Envoyer mes mouvements (sans maquette) : lignes Medium 15 à interrupteur natif.
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 52, paddingVertical: spacing[8], gap: spacing[8] },
  switchLabel: { ...LIBRARY_TEXT.medium15, flex: 1 },
});
