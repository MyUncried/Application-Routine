import { Image } from "expo-image";
import { Animated, StyleSheet, Text, View } from "react-native";

export type KodjoSplashProps = {
  opacity: Animated.Value;
  onLayout: () => void;
};

/** Splash applicatif correspondant à la frame Figma 1992:469 (402 × 874). */
export function KodjoSplash({ opacity, onLayout }: KodjoSplashProps) {
  return (
    <Animated.View style={[styles.container, { opacity }]} onLayout={onLayout} testID="kodjo-splash">
      <View style={styles.identityBlock}>
        <Image
          source={require("../../../assets/branding/logo_icon_only_transparent_1024.png")}
          style={styles.logo}
          contentFit="contain"
          accessible
          accessibilityLabel="Logo KODJO"
          testID="kodjo-splash-logo"
        />
        <Text style={styles.name}>KODJO</Text>
        <Text style={styles.tagline}>Keep On. Do Just One.</Text>
      </View>
      <Text style={styles.subtitle}>Votre assistant du quotidien</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: "#0001F1",
  },
  identityBlock: {
    position: "absolute",
    top: "31.8%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
  name: {
    width: 220,
    height: 41,
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    lineHeight: 41,
    textAlign: "center",
  },
  tagline: {
    width: 300,
    height: 18,
    marginTop: 12,
    color: "rgba(227, 237, 255, 0.85)",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 18,
    textAlign: "center",
  },
  subtitle: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 27,
    height: 16,
    color: "rgba(204, 219, 255, 0.75)",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 16,
    textAlign: "center",
  },
});
