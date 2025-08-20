import React from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

import { LoginForm } from "@/components/login-form";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { isAuthenticated, logout, token } = useUser();
  const router = useRouter();

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
          <LoginForm />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Actions
          </ThemedText>

          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <IconSymbol name="door.right.hand.open" size={20} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Log Out</ThemedText>
          </TouchableOpacity>
        </View>
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
    opacity: 0.7,
    marginTop: 16,
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
    backgroundColor: "#ff4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginTop: 8,
  },
});
