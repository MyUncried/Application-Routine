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
import { currentPairing, forgetStoredPairing, storePairing } from "@/features/catalogue/pairingStore";
import {
  REVIEW_REASON_LABELS,
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
import { KodjoIcon, type KodjoIconName } from "@/shared/ui/KodjoIcon";
import { colors, spacing, type } from "@/shared/ui/tokens";

/** Dépendances remplaçables (tests). */
export type LibraryScreenDependencies = {
  readonly client?: AdminClient;
  readonly pickFile?: () => Promise<unknown | null>;
  readonly deviceName?: string;
};

const defaultClient = new AdminClient();
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
    <LibraryScreen title="Ajouter une bibliothèque" testID="library-add">
      <Paragraph>Choisissez d&apos;où provient la bibliothèque à ajouter.</Paragraph>
      <View style={screenStyles.sourceCards}>
        <SourceCard
          icon="library-file"
          title="Depuis un fichier"
          subtitle="Importer un fichier de bibliothèque enregistré sur ce téléphone."
          onPress={() => void fileImport.run()}
          testID="library-add-file"
        />
        <SourceCard
          icon="library-computer"
          title="Depuis l'administration (PC)"
          subtitle="Se connecter à l'administration KODJO de votre PC, sur le même Wi-Fi."
          onPress={() => router.push("/library-connect")}
          testID="library-add-admin"
        />
      </View>
      {fileImport.error ? <Notice tone="danger" title="Fichier illisible" testID="library-add-error">{fileImport.error}</Notice> : null}
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
          <Paragraph tone="note">Le téléphone et le PC doivent être sur le même Wi-Fi.</Paragraph>
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
        <>
          <StatusHero
            tone="success"
            title={`Connecté à « ${phase.session.name} »`}
            message="Votre PC est prêt à envoyer les bibliothèques disponibles."
            testID="library-connect-connected"
          />
          {/* Revue du 11/11 : sur un Wi-Fi partagé, vérifier que l'adresse est bien celle de votre PC. */}
          <Paragraph tone="note" align="center" testID="library-connect-address">{`Adresse du PC : ${phase.session.host}`}</Paragraph>
        </>
      );
      primary = params.next === "send"
        ? { label: "Choisir les mouvements à envoyer", onPress: () => void showLibraries(phase.session), testID: "library-connect-continue" }
        : { label: "Voir les bibliothèques disponibles", onPress: () => void showLibraries(phase.session), testID: "library-connect-continue" };
      break;
    case "notFound":
      body = (
        <View style={screenStyles.heroBlock} testID="library-connect-not-found">
          <StatusHero tone="notFound" title="PC introuvable sur le Wi-Fi" />
          <Card>
            <BulletRow title="Le PC est allumé et l'administration KODJO est ouverte." />
            <BulletRow title="Le téléphone et le PC sont sur le même Wi-Fi." />
            <BulletRow title="Aucun pare-feu ne bloque la connexion." />
          </Card>
        </View>
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
    setPhase((current) => (current.kind === "loading" ? current : { kind: "loading" }));
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
      if (unauthorized) forgetStoredPairing();
      setPhase({
        kind: "error",
        unauthorized,
        message: unauthorized
          ? "L'appairage a expiré ou a été révoqué sur votre PC. Connectez-vous de nouveau."
          : "La connexion avec votre PC a été perdue. Vérifiez le Wi-Fi, puis actualisez.",
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
  const withheldNotice = phase.kind === "ready" && (phase.withheld?.length ?? 0) > 0 ? (
    <Notice tone="warning" title="Bibliothèques non transférées" testID="library-available-withheld">
      {`${phase.withheld!.join(", ")} : un média n'a pas de droits confirmés. Confirmez ses droits dans l'administration du PC, puis actualisez.`}
    </Notice>
  ) : null;
  if (phase.kind === "loading") {
    body = (
      <>
        <Busy label="Chargement de la liste…" compact testID="library-available-loading" />
        <SkeletonList />
      </>
    );
  } else if (phase.kind === "error") {
    body = <Notice tone="danger" title="Liste indisponible" testID="library-available-error">{phase.message}</Notice>;
    primary = phase.unauthorized
      ? { label: "Se reconnecter", onPress: () => router.replace("/library-connect"), testID: "library-available-reconnect" }
      : { label: "Actualiser", onPress: () => void runRefresh(), testID: "library-available-refresh" };
  } else if (phase.previews.length === 0) {
    body = (
      <StatusHero
        tone="empty"
        title="Aucune bibliothèque disponible"
        message="L'administration n'a publié aucune bibliothèque pour ce téléphone pour le moment."
        testID="library-available-empty"
      />
    );
    secondary = [{ label: "Importer depuis un fichier", onPress: () => void fileImport.run(), testID: "library-available-file" }];
    primary = isAdmin ? { label: "Actualiser", onPress: () => void runRefresh(), testID: "library-available-refresh" } : null;
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
            <Text style={LIBRARY_TEXT.note}>Actualisée à l&apos;instant</Text>
            <TextLink label="Actualiser" onPress={() => void runRefresh()} testID="library-available-refresh-row" />
          </View>
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
        <StatusHero
          tone="success"
          title={phase.decision === "DEFERRED" ? "Mise à jour reportée" : "Mise à jour refusée"}
          message={phase.decision === "DEFERRED"
            ? "Aucun mouvement n'a été modifié. La mise à jour reste proposée."
            : "Aucun mouvement n'a été modifié. Cette révision ne sera plus proposée ; une révision ultérieure le sera."}
          testID="library-preview-decided"
        />
      </LibraryScreen>
    );
  }
  if (phase.kind === "done") return <LibraryResult report={phase.report} preview={phase.preview} />;

  const { preview, file: source } = phase;
  const isUpdate = preview.installedRevision !== null;
  const applicable = preview.added.length + preview.attached.length + preview.modified.length;
  const toReview = preview.toReview.length > 0 ? (
    <Section label={`À examiner (${preview.toReview.length})`}>
      <Card testID="library-preview-review">
        {preview.toReview.map((entry, index) => (
          <View key={entry.item.sheetId}>
            {index > 0 ? <Divider /> : null}
            <Row
              title={entry.item.name}
              titleVariant="semibold"
              subtitle={REVIEW_REASON_LABELS[entry.reason]}
              subtitleTone="secondary"
              testID={`library-preview-review-${entry.item.sheetId}`}
            />
          </View>
        ))}
      </Card>
    </Section>
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
        {/* 12118:25189 : grand compteur, puces bleue (nouvelles) et verte (déjà présentes), note. */}
        <Card style={screenStyles.summaryCard}>
          <View style={screenStyles.bigCountLine} testID="library-preview-count" accessible>
            <Text style={screenStyles.bigCount}>{plural(preview.memberCount, "fiche", "fiches")}</Text>
            <Text style={LIBRARY_TEXT.note}>dans cette bibliothèque</Text>
          </View>
          <Divider />
          <SummaryLine
            dot={colors.primary}
            title={`${preview.added.length} ${preview.added.length > 1 ? "nouvelles" : "nouvelle"}`}
            subtitle="ajoutées à votre Catalogue"
            testID="library-preview-added"
          />
          <SummaryLine
            dot={LIBRARY_COLORS.positiveText}
            title={`${preview.attached.length} déjà ${preview.attached.length > 1 ? "présentes" : "présente"}`}
            subtitle="rattachées à vos mouvements, sans doublon"
            testID="library-preview-attached"
          />
          <Text style={LIBRARY_TEXT.captionMuted}>Vos mouvements existants ne sont ni copiés, ni modifiés.</Text>
        </Card>
        {ownerWarning}
        {preview.added.length > 0 ? (
          <Section label="Nouvelles fiches">
            <Card testID="library-preview-new-list">
              {preview.added.slice(0, 3).map((item, index) => (
                <View key={item.sheetId}>
                  {index > 0 ? <Divider /> : null}
                  <Row title={item.name} titleVariant="regular" pill={<Pill label="Nouvelle" tone="positive" />} testID={`library-preview-new-${item.sheetId}`} />
                </View>
              ))}
              {preview.added.length > 3 ? (
                <Text style={[LIBRARY_TEXT.note, screenStyles.moreLine]}>{`et ${plural(preview.added.length - 3, "autre fiche nouvelle", "autres fiches nouvelles")}`}</Text>
              ) : null}
            </Card>
          </Section>
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
      {/* 12118:25270 : une carte, trois compteurs. */}
      <Card style={screenStyles.counters} testID="library-preview-counters">
        <Counter value={preview.modified.length} label={preview.modified.length > 1 ? "Modifiées" : "Modifiée"} />
        <Counter value={preview.added.length + preview.attached.length} label={preview.added.length + preview.attached.length > 1 ? "Nouvelles" : "Nouvelle"} />
        <Counter value={preview.removed.length} label={preview.removed.length > 1 ? "Retirées" : "Retirée"} />
      </Card>
      <Section
        label={preview.installedRevision === preview.targetRevision
          ? "Fiches révisées · détail par fiche"
          : `Révision ${preview.installedRevision} → ${preview.targetRevision} · détail par fiche`}
      >
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
                  detail={alsoIn.length > 0 ? alsoIn.map((title) => `Aussi dans ${title} : mise à jour appliquée là aussi.`).join("\n") : null}
                  pill={<Pill label="Modifiée" tone="action" />}
                  pillOnTitle
                  link="Voir le détail"
                  onPress={() => router.push({ pathname: "/library-sheet", params: { catalogueId: preview.catalogueId, libraryId: preview.libraryId, sheetId: item.sheetId } })}
                  testID={`library-preview-modified-${item.sheetId}`}
                />
              </View>
            );
          })}
          {[...preview.added, ...preview.attached].map((item, index) => (
            <View key={item.sheetId}>
              {preview.modified.length + index > 0 ? <Divider /> : null}
              <Row
                title={item.name}
                titleVariant="semibold"
                subtitle="Ajoutée à la bibliothèque et à votre Catalogue"
                subtitleTone="secondary"
                pill={<Pill label="Nouvelle" tone="positive" />}
                pillOnTitle
                testID={`library-preview-new-${item.sheetId}`}
              />
            </View>
          ))}
          {removedNames.map((entry, index) => (
            <View key={entry.key}>
              {preview.modified.length + preview.added.length + preview.attached.length + index > 0 ? <Divider /> : null}
              <Row
                title={entry.name}
                titleVariant="semibold"
                subtitle="Retirée de la bibliothèque · reste dans le Catalogue"
                subtitleTone="secondary"
                pill={<Pill label="Retirée" />}
                pillOnTitle
                testID={`library-preview-removed-${entry.key}`}
              />
            </View>
          ))}
        </Card>
      </Section>
      <Paragraph tone="note">Les fiches modifiées sont mises à jour dans toutes vos bibliothèques qui les contiennent. La composition de vos autres bibliothèques ne change pas.</Paragraph>
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
        secondary={[{ label: "Terminer", onPress: () => router.dismissTo("/profile-edit"), testID: "library-result-finish" }]}
        secondaryBelow
        primary={{ label: "Voir dans le Catalogue", onPress: () => router.dismissTo("/"), testID: "library-result-catalogue" }}
      >
        <StatusHero tone="success" title={`${report.title} est installée`} message="Les fiches sont disponibles dans votre Catalogue." testID="library-result-installed" />
        <Card>
          <Row title={`${plural(report.added, "fiche ajoutée", "fiches ajoutées")}`} titleVariant="semibold" testID="library-result-added" />
          <Divider />
          <Row title={`${plural(report.attached, "fiche rattachée", "fiches rattachées")}, sans doublon`} titleVariant="semibold" testID="library-result-attached" />
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
      <StatusHero tone="success" title={`${report.title} est à jour`} message={`Révision ${report.revision}`} testID="library-result-updated" />
      <Card>
        <Row
          title={plural(report.updated, "fiche mise à jour", "fiches mises à jour")}
          titleVariant="semibold"
          subtitle={alsoIn.length > 0 ? `dont ${alsoIn.length} aussi dans ${[...new Set(alsoIn)].join(", ")}` : null}
          testID="library-result-modified"
        />
        <Divider />
        <Row title={plural(report.added + report.attached, "fiche ajoutée", "fiches ajoutées")} titleVariant="semibold" subtitle={`au Catalogue et à ${report.title}`} testID="library-result-added" />
        <Divider />
        <Row title={plural(report.removed, `fiche retirée de ${report.title}`, `fiches retirées de ${report.title}`)} titleVariant="semibold" subtitle="elles restent dans le Catalogue" testID="library-result-removed" />
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
      {/* 12118:25336… : une carte par champ — intitulé 11 et pastille, colonnes « Actuelle » | « Nouvelle ». */}
      {detail.changed.map((row) => (
        <Card key={row.path} style={screenStyles.fieldCard} testID={`library-sheet-field-${row.path}`}>
          <View style={screenStyles.fieldHeader} testID={`library-sheet-label-${row.path}`}>
            <Text style={[LIBRARY_TEXT.caption, screenStyles.flex]}>{row.label}</Text>
            <Pill label={row.conflict ? "Modifiée sur ce téléphone" : "Modifiée"} tone={row.conflict ? "warning" : "action"} />
          </View>
          <View style={screenStyles.fieldColumns}>
            <View style={screenStyles.fieldColumn}>
              <Text style={LIBRARY_TEXT.captionMuted}>Actuelle</Text>
              <Text style={LIBRARY_TEXT.medium14}>{row.current}</Text>
            </View>
            <View style={screenStyles.fieldSeparator} />
            <View style={screenStyles.fieldColumn}>
              <Text style={LIBRARY_TEXT.captionMuted}>Nouvelle</Text>
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
            <TextLink label={`Voir les champs inchangés (${detail.unchanged.length})`} onPress={() => setShowUnchanged(true)} testID="library-sheet-show-unchanged" />
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
      <LibraryScreen title={progress.title} testID="library-resume" primary={{ label: "Terminer", onPress: () => router.dismissTo("/profile-edit"), testID: "library-resume-finish" }}>
        <StatusHero tone="success" title={`${progress.title} est à jour`} message={`Révision ${progress.revision}`} testID="library-resume-done" />
      </LibraryScreen>
    );
  }
  if (state === "loading" || state === "running") {
    return <LibraryScreen title={progress?.title ?? "Bibliothèque"} testID="library-resume"><Busy label={state === "running" ? "Reprise en cours…" : "Chargement…"} /></LibraryScreen>;
  }
  if (!progress) {
    return <LibraryScreen title="Bibliothèque" testID="library-resume"><StatusHero tone="success" title="Aucune opération interrompue" message="Rien n'est à reprendre." /></LibraryScreen>;
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
      {/* 12119:25264 : pastille Reprise, titre, texte, barre de progression et décompte dans une carte. */}
      <Card style={screenStyles.resumeCard} testID="library-resume-card">
        <View style={screenStyles.resumeHeader}>
          <View style={screenStyles.resumeBadge}>
            <KodjoIcon name="library-resume" />
          </View>
          <View style={screenStyles.summaryText}>
            <Text style={screenStyles.resumeTitle}>{isUpdate ? "Mise à jour interrompue" : "Installation interrompue"}</Text>
            <Text style={screenStyles.resumeText}>
              {`${isUpdate ? "La mise à jour" : "L'installation"} de ${progress.title} (révision ${progress.revision}) s'est arrêtée avant la fin.`}
            </Text>
          </View>
        </View>
        <View style={screenStyles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: progress.total, now: progress.applied }}>
          <View style={[screenStyles.progressFill, { width: `${Math.round(ratio * 100)}%` }]} />
        </View>
        <Text style={LIBRARY_TEXT.note} testID="library-resume-progress">{`${progress.applied} fiches sur ${progress.total} déjà appliquées`}</Text>
      </Card>
      <Paragraph tone="note">Rien n&apos;est perdu : les fiches déjà appliquées sont conservées, la reprise continue là où elle s&apos;est arrêtée.</Paragraph>
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
      <Notice tone="danger" large title="Fichier refusé en entier" testID="library-invalid-notice">
        Aucune fiche n&apos;a été importée. Corrigez le fichier, puis réessayez.
      </Notice>
      {/* 12119:25186 : puce rouge, élément en Semi Bold 13 (« Fiche 12 « Burpee » »), problème en 12 dessous. */}
      <Section label={`Problèmes détectés (${lines.length})`}>
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
      {lines.length > 50 ? <Paragraph tone="note">{`et ${lines.length - 50} autres problèmes`}</Paragraph> : null}
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
  const openUpdate = () => router.push({ pathname: "/library-preview", params: { catalogueId: library.catalogueId, libraryId: library.libraryId } });
  // 12098:115 : pastille « Mettre à jour » en face du titre, état en 13 gris dessous, carte des mouvements
  // (nom Medium 14, zones 12, chevron). Sans « Désinstaller la bibliothèque » ni sa note (A-4, reporté).
  return (
    <LibraryScreen
      title={library.library.title}
      testID="library-installed"
      headerTrailing={updateAvailable ? (
        <Pressable onPress={openUpdate} accessibilityRole="button" accessibilityLabel="Mettre à jour la bibliothèque" hitSlop={spacing[12]} testID="library-installed-update">
          <Pill label="Mettre à jour" tone="action" />
        </Pressable>
      ) : null}
    >
      <Text style={screenStyles.installedStatus} testID="library-installed-status">
        {`${plural(library.library.members.length, "mouvement", "mouvements")} · ${updateAvailable ? "mise à jour disponible" : "à jour"}`}
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
        if (!cancelled) setPhase({ kind: "error", reconnect: false, message: "Vos mouvements n'ont pas pu être lus. Réessayez." });
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
      setPhase({ kind: "error", reconnect: false, message: "Les catégories et zones n'ont pas pu être lues. Rien n'a été envoyé." });
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
        message: "Un mouvement choisi ne peut pas être envoyé (" + built.issues.map((issue) => issue.path).join(", ") + "). Rien n'a été envoyé.",
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
        <StatusHero
          tone="success"
          title={`${plural(phase.received, "mouvement envoyé", "mouvements envoyés")} à « ${session.name} »`}
          message={phase.duplicates > 0
            ? `${plural(phase.duplicates, "était déjà reçu", "étaient déjà reçus")}, sans doublon. Vos mouvements restent inchangés sur ce téléphone.`
            : "Vos mouvements restent inchangés sur ce téléphone."}
          testID="library-send-done"
        />
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
      {/* Sans maquette : aligné sur les autres écrans (introduction 13, carte, note 12). */}
      <Paragraph>{`Vers l'administration · ${session.name}`}</Paragraph>
      {phase.kind === "error" ? <Notice tone="danger" title="Envoi impossible" testID="library-send-error">{phase.message}</Notice> : null}
      {movements.length === 0 ? (
        <StatusHero
          tone="empty"
          title="Aucun mouvement personnel à envoyer"
          message="Les mouvements importés d'une bibliothèque ne sont pas envoyés."
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
      <Paragraph tone="note">Les photos et vidéos ne sont pas envoyées dans cette version.</Paragraph>
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
  // Envoyer mes mouvements (sans maquette) : lignes Medium 15 à interrupteur natif.
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 52, paddingVertical: spacing[8], gap: spacing[8] },
  switchLabel: { ...LIBRARY_TEXT.medium15, flex: 1 },
});
