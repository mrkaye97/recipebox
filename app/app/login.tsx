import React from "react";
import { ScrollView, StyleSheet } from "react-native";

import { LoginForm } from "@/components/LoginForm";
import { ThemedView } from "@/components/ThemedView";

export default function LoginScreen() {
  const handleLoginSuccess = (token: string) => {
    console.log("Login successful, token saved:", token);
    // You can navigate to another screen here or update app state
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
});
