import React from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/hooks/useUser";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, logout, token } = useUser();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContainer}>
          <ThemedText type="title">Not Authenticated</ThemedText>
          <ThemedText style={styles.messageText}>
            Please go to the Recipes tab to login
          </ThemedText>
        </ThemedView>
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
            Account Information
          </ThemedText>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <IconSymbol
                name="person.fill"
                size={20}
                color={Colors[colorScheme ?? "light"].icon}
              />
              <ThemedText type="defaultSemiBold">Authenticated</ThemedText>
              <ThemedText style={styles.statusText}>✅ Logged in</ThemedText>
            </View>

            <View style={styles.infoRow}>
              <IconSymbol
                name="key.fill"
                size={20}
                color={Colors[colorScheme ?? "light"].icon}
              />
              <ThemedText type="defaultSemiBold">Token</ThemedText>
              <ThemedText style={styles.tokenText}>
                {token?.substring(0, 12)}...
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Actions
          </ThemedText>

          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <IconSymbol name="paperplane.fill" size={20} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Logout</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>RecipeBox v1.0.0</ThemedText>
          <ThemedText style={styles.footerText}>
            Manage your recipes with ease
          </ThemedText>
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
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.5,
    textAlign: "center",
  },
});
