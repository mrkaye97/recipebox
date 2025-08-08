import { Image } from "expo-image";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";

import { HelloWave } from "@/components/HelloWave";
import { LoginForm } from "@/components/LoginForm";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useRecipes } from "@/hooks/useRecipes";
import { useUser } from "@/hooks/useUser";

export default function HomeScreen() {
  const { data } = useRecipes();
  const { login, logout, token } = useUser();

  const handleLoginSuccess = (newToken: string) => {
    console.log("Login successful! Token saved:", newToken);
  };

  const handleLogout = async () => {
    await logout();
    console.log("Logged out successfully");
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">RecipeBox!</ThemedText>
        <HelloWave />
      </ThemedView>

      {/* Authentication Status */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Authentication Status</ThemedText>
        {token ? (
          <ThemedView style={styles.authContainer}>
            <ThemedText>✅ Logged in</ThemedText>
            <ThemedText type="defaultSemiBold">
              Token: {token.substring(0, 20)}...
            </ThemedText>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          <ThemedView style={styles.authContainer}>
            <ThemedText>❌ Not logged in</ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      {/* Login Form - only show if not logged in */}
      {!token && (
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Login</ThemedText>
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </ThemedView>
      )}

      {/* Recipes Data */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Recipes Data</ThemedText>
        <ThemedText>
          {data ? `Found ${data.length || 0} recipes` : "No recipes loaded"}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
          to see changes. Press{" "}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: "cmd + d",
              android: "cmd + m",
              web: "F12",
            })}
          </ThemedText>{" "}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">
            npm run reset-project
          </ThemedText>{" "}
          to get a fresh <ThemedText type="defaultSemiBold">app</ThemedText>{" "}
          directory. This will move the current{" "}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{" "}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  authContainer: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    gap: 8,
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
