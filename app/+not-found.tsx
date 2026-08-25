import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { strings } from "@/shared/i18n";
import { colors, spacing, type } from "@/shared/ui/tokens";

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text
        style={styles.title}
        accessibilityLabel={strings.screens.notFound.accessibility.title}
        accessibilityRole="header"
      >
        {strings.screens.notFound.title}
      </Text>
      <Link
        href="/"
        style={styles.link}
        accessibilityLabel={strings.screens.notFound.accessibility.backHome}
      >
        {strings.screens.notFound.backHome}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    paddingHorizontal: spacing[24],
    gap: spacing[16],
  },
  title: {
    ...type.screenTitle,
    color: colors.textPrimary,
  },
  link: {
    ...type.button,
    color: colors.primary,
  },
});
