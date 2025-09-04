import * as _ from "lodash";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/design-system";
import {
  PrivacyPreference,
  PrivacyPreferences,
  useUser,
} from "@/hooks/use-user";
import { useRouter } from "expo-router";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [privacyPreference, setPrivacyPreference] =
    useState<PrivacyPreference>("public");

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { register } = useUser();

  const handleSignup = async () => {
    if (
      !email.trim() ||
      !name.trim() ||
      !password.trim() ||
      !signupToken.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const token = await register(
        email.trim(),
        name.trim(),
        password,
        privacyPreference,
        signupToken.trim(),
      );

      if (token) {
        router.navigate("/(tabs)");
      } else {
        Alert.alert("Error", "Signup failed - no token received");
      }
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert(
        "Signup Failed",
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Sign Up
        </ThemedText>

        <View style={styles.inputContainer}>
          <ThemedText type="defaultSemiBold" style={styles.label}>
            Name
          </ThemedText>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="defaultSemiBold" style={styles.label}>
            Email
          </ThemedText>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="defaultSemiBold" style={styles.label}>
            Password
          </ThemedText>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password (min 6 characters)"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="defaultSemiBold" style={styles.label}>
            Signup Token
          </ThemedText>
          <TextInput
            style={styles.input}
            value={signupToken}
            onChangeText={setSignupToken}
            placeholder="Enter your signup token"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            onSubmitEditing={handleSignup}
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="defaultSemiBold" style={styles.label}>
            Profile Visibility
          </ThemedText>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              ActionSheetIOS.showActionSheetWithOptions(
                {
                  options: [
                    "Cancel",
                    ...PrivacyPreferences.map((p) => _.capitalize(p)),
                  ],
                  cancelButtonIndex: 0,
                  title: "Select Profile Visibility",
                },
                (buttonIndex) => {
                  if (buttonIndex > 0) {
                    setPrivacyPreference(PrivacyPreferences[buttonIndex - 1]);
                  }
                },
              );
            }}
          >
            <Text style={styles.pickerButtonText}>
              {_.capitalize(privacyPreference)}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.signupButton,
            isLoading && styles.signupButtonDisabled,
          ]}
          onPress={handleSignup}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.signupButtonText}>
            {isLoading ? "Creating..." : "Sign Up"}
          </Text>
        </TouchableOpacity>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    gap: Spacing.xl,
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.lg,
    fontSize: Typography.fontSizes["2xl"],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text,
    letterSpacing: Typography.letterSpacing.tight,
  },
  inputContainer: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: Typography.letterSpacing.wide,
  },
  input: {
    borderWidth: 0.5,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSizes.base,
    backgroundColor: Colors.surface,
    color: Colors.text,
    minHeight: 52,
    ...Shadows.sm,
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    minHeight: 52,
    ...Shadows.sm,
  },
  pickerButtonText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.text,
    flex: 1,
    fontWeight: Typography.fontWeights.medium,
  },
  pickerArrow: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  signupButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xl,
    minHeight: 56,
    ...Shadows.primaryLarge,
  },
  signupButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    ...Shadows.sm,
  },
  signupButtonText: {
    color: Colors.surface,
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: Typography.letterSpacing.wide,
  },
});
