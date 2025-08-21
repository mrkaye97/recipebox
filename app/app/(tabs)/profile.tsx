import React from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { isAuthenticated, logout, token } = useUser();
  const router = useRouter();
  const [showSignup, setShowSignup] = React.useState(false);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.navigate("/(tabs)/profile");
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loginContainer}>
          {showSignup ? <SignupForm /> : <LoginForm />}
          
          <View style={styles.toggleContainer}>
            <ThemedText style={styles.toggleText}>
              {showSignup ? "Already have an account?" : "Don't have an account?"}
            </ThemedText>
            <TouchableOpacity onPress={() => setShowSignup(!showSignup)}>
              <ThemedText style={styles.toggleLink}>
                {showSignup ? "Log In" : "Sign Up"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.centerContainer}>
        <ThemedText type="subtitle" style={styles.messageText}>
          You're all set! 
        </ThemedText>
        <ThemedText style={styles.subMessageText}>
          Use the Recipes tab to view your collection or the + button to add new recipes.
        </ThemedText>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <IconSymbol name="door.right.hand.open" size={16} color="#fff" />
          <ThemedText style={styles.actionButtonText}>Log Out</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  messageText: {
    textAlign: "center",
    marginBottom: 12,
    fontSize: 18,
    fontWeight: "600",
  },
  subMessageText: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 32,
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusText: {
    marginLeft: "auto",
    fontSize: 14,
    fontWeight: "500",
  },
  tokenText: {
    marginLeft: "auto",
    fontSize: 12,
    fontFamily: "monospace",
    opacity: 0.7,
  },
  actionButton: {
    backgroundColor: "#ee3333",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    marginTop: "auto",
    alignItems: "center",
    paddingBottom: 100,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.5,
    textAlign: "center",
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
  },
  toggleText: {
    fontSize: 14,
    color: "#666",
  },
  toggleLink: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginTop: 8,
  },
});
