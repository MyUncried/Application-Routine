import { useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import type { AccountLink } from "@/domain/account/AccountService";
import { AccountServiceContext, useAccountGateRefresh } from "@/features/account/AccountServiceContext";
import { strings } from "@/shared/i18n";
import { colors, spacing } from "@/shared/ui/tokens";

function displayName(link: AccountLink): string | null {
  const parts = [link.givenName, link.familyName].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" ") : null;
}

/**
 * É2 — section Compte de « Modifier le profil » (CPT-13, CPT-16) : fournisseur, nom, e-mail (mention de l'adresse
 * masquée par Apple), « Pseudo public » grisé (T2), puis « Supprimer mon compte ». Lue hors ligne (`account_link`).
 * Aucune déconnexion (CPT-15). Nom absent : ligne non affichée, aucune valeur inventée.
 */
export function AccountSection() {
  const t = strings.account;
  // Absent hors de l'application (écran rendu seul, par exemple en test) : la section ne s'affiche pas.
  const service = useContext(AccountServiceContext);
  const refreshGate = useAccountGateRefresh();
  const [link, setLink] = useState<AccountLink | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!service) return;
    let active = true;
    service.getLink().then(
      (value) => {
        if (active) setLink(value);
      },
      (error: unknown) => console.warn("Lien de compte illisible.", error),
    );
    return () => {
      active = false;
    };
  }, [service]);

  const runDeletion = useCallback(async () => {
    if (!service) return;
    setDeleting(true);
    let outcome: "deleted" | "offline" | "error";
    try {
      outcome = await service.deleteAccount();
    } catch (error) {
      console.warn("Suppression du compte impossible.", error);
      outcome = "error";
    } finally {
      setDeleting(false);
    }
    if (outcome === "deleted") {
      refreshGate();
      return;
    }
    Alert.alert(t.deletion.title, outcome === "offline" ? t.deletion.offline : t.deletion.error, [{ text: t.signIn.ok }]);
  }, [service, refreshGate, t]);

  const confirmDeletion = useCallback(() => {
    Alert.alert(t.deletion.title, t.deletion.message, [
      { text: t.deletion.cancel, style: "cancel" },
      { text: t.deletion.confirm, style: "destructive", onPress: () => void runDeletion() },
    ]);
  }, [runDeletion, t]);

  if (!link) return null;
  const name = displayName(link);

  return (
    <View testID="account-section">
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {t.section.title}
      </Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.value} testID="account-provider">
            {t.section.connectedWith[link.provider]}
          </Text>
        </View>
        {name ? (
          <>
            <View style={styles.separator} />
            <View style={styles.row}>
              <Text style={styles.label}>{t.section.nameLabel}</Text>
              <Text style={styles.value} testID="account-name">
                {name}
              </Text>
            </View>
          </>
        ) : null}
        {link.email ? (
          <>
            <View style={styles.separator} />
            <View style={styles.row}>
              <Text style={styles.label}>{t.section.emailLabel}</Text>
              <Text style={styles.value} testID="account-email">
                {link.email}
              </Text>
              {link.emailIsPrivateRelay ? (
                <Text style={styles.note} testID="account-email-relay">
                  {t.section.privateRelay}
                </Text>
              ) : null}
            </View>
          </>
        ) : null}
        <View style={styles.separator} />
        {/* Pseudo public : T2 (CPT-25), grisé et inactif comme avant T1. */}
        <View style={[styles.row, styles.disabled]} accessibilityState={{ disabled: true }} testID="account-public-name">
          <Text style={styles.value}>{t.section.publicName}</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={confirmDeletion}
        disabled={deleting}
        style={styles.deleteButton}
        testID="account-delete"
      >
        {deleting ? (
          <ActivityIndicator color={colors.danger} accessibilityLabel={t.deletion.inProgress} />
        ) : (
          <Text style={styles.deleteLabel}>{t.section.deleteAccount}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginTop: spacing[16],
    marginBottom: spacing[8],
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.background,
    borderRadius: 12,
  },
  row: { minHeight: 52, justifyContent: "center", paddingHorizontal: spacing[16], paddingVertical: spacing[8] },
  label: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.textSecondary },
  value: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 15, color: colors.textPrimary },
  note: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing[16] },
  disabled: { opacity: 0.45 },
  deleteButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: spacing[24] },
  deleteLabel: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: colors.danger },
});
