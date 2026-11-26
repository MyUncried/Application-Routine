import * as AppleAuthentication from "expo-apple-authentication";
import { Image } from "expo-image";
import * as Network from "expo-network";
import { useState } from "react";
import { ActivityIndicator, Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AccountProvider, SignInOutcome } from "@/domain/account/AccountService";
import { useAccountService } from "@/features/account/AccountServiceContext";
import { strings } from "@/shared/i18n";

/** Adresse publique de la politique de confidentialité (fournie par EAS ; lien masqué tant qu'elle n'est pas publiée). */
const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? "";

const BUTTON_HEIGHT = 50;

export type SignInScreenProps = {
  existingInstallation: boolean;
  onLinked: () => void;
};

/**
 * É1 — écran de connexion, porte d'entrée (CPT-02, CPT-16). Même fond et même logo que l'écran de démarrage.
 * iOS : bouton Apple natif (`AppleAuthenticationButton`) puis Google ; Android : Google puis Apple, de même taille.
 * Refus : alertes natives É4 (téléphone lié à un autre compte) et É4-R5 (compte supprimé, CPT-32).
 */
export function SignInScreen({ existingInstallation, onLinked }: SignInScreenProps) {
  const t = strings.account;
  const service = useAccountService();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);

  const handle = async (provider: AccountProvider) => {
    if (busy) return;
    const network = await Network.getNetworkStateAsync().catch(() => null);
    if (network && network.isConnected === false) {
      setOffline(true);
      return;
    }
    setOffline(false);
    setBusy(true);
    let outcome: SignInOutcome;
    try {
      outcome = await service.signIn(provider);
    } finally {
      setBusy(false);
    }
    presentOutcome(outcome, onLinked);
  };

  const appleButton =
    Platform.OS === "ios" ? (
      <AppleAuthentication.AppleAuthenticationButton
        key="apple"
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={BUTTON_HEIGHT / 2}
        style={styles.nativeAppleButton}
        onPress={() => void handle("apple")}
      />
    ) : (
      <Pressable
        key="apple"
        accessibilityRole="button"
        onPress={() => void handle("apple")}
        style={[styles.button, styles.appleButton]}
        testID="sign-in-apple"
      >
        <Text style={styles.appleLabel}>{` ${t.signIn.continueWithApple}`}</Text>
      </Pressable>
    );
  const googleButton = (
    <Pressable
      key="google"
      accessibilityRole="button"
      onPress={() => void handle("google")}
      style={[styles.button, styles.googleButton]}
      testID="sign-in-google"
    >
      <Text style={styles.googleLabel}>{t.signIn.continueWithGoogle}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]} testID="sign-in-screen">
      <View style={styles.identity}>
        <Image
          source={require("../../../assets/branding/logo_icon_only_transparent_1024.png")}
          style={styles.logo}
          contentFit="contain"
          accessible={false}
        />
        <Text style={styles.title} accessibilityRole="header">
          {t.signIn.title}
        </Text>
        <Text style={styles.body}>{existingInstallation ? t.signIn.bodyExistingInstallation : t.signIn.body}</Text>
        {offline ? (
          <Text style={styles.offline} testID="sign-in-offline">
            {t.signIn.offline}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        {busy ? <ActivityIndicator color="#FFFFFF" accessibilityLabel={t.signIn.signingIn} testID="sign-in-busy" /> : null}
        {Platform.OS === "ios" ? [appleButton, googleButton] : [googleButton, appleButton]}
        {PRIVACY_POLICY_URL ? (
          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)} testID="sign-in-privacy">
            <Text style={styles.privacy}>{t.signIn.privacyPolicy}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function presentOutcome(outcome: SignInOutcome, onLinked: () => void): void {
  const t = strings.account;
  switch (outcome.kind) {
    case "linked":
      onLinked();
      return;
    case "cancelled":
      return;
    case "refused_other_account":
      Alert.alert(t.refusedOtherAccount.title, t.refusedOtherAccount.message(t.providerName[outcome.provider], outcome.email ?? ""), [
        { text: t.signIn.ok },
      ]);
      return;
    case "refused_deleted_account":
      Alert.alert(t.refusedDeletedAccount.title, t.refusedDeletedAccount.message, [{ text: t.signIn.ok }]);
      return;
    case "error":
      Alert.alert(t.signIn.errorTitle, t.signIn.error, [{ text: t.signIn.ok }]);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0001F1",
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  identity: {
    marginTop: "28%",
    alignItems: "center",
    gap: 16,
  },
  logo: { width: 160, height: 160 },
  title: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
  },
  body: {
    color: "rgba(227, 237, 255, 0.9)",
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  offline: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
  },
  actions: { gap: 12, alignItems: "stretch" },
  nativeAppleButton: { height: BUTTON_HEIGHT, width: "100%" },
  button: {
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_HEIGHT / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  appleButton: { backgroundColor: "#000000" },
  appleLabel: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold", fontSize: 17 },
  googleButton: { backgroundColor: "#FFFFFF" },
  googleLabel: { color: "#1F1F1F", fontFamily: "Inter_600SemiBold", fontSize: 17 },
  privacy: {
    color: "rgba(227, 237, 255, 0.9)",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    textDecorationLine: "underline",
    paddingVertical: 8,
  },
});
