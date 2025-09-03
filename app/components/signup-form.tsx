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
  PrivacyPreference,
  PrivacyPreferences,
  useUser,
} from "@/hooks/use-user";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/design-system";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [privacyPreference, setPrivacyPreference] =
    useState<PrivacyPreference>("public");

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { register } = useUser();

  const handleSignup = async () => {
    if (!email.trim() || !name.trim() || !password.trim()) {
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            returnKeyType="next"
            blurOnSubmit={false}
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
            returnKeyType="next"
            blurOnSubmit={false}
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
            returnKeyType="done"
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
            {isLoading ? "Creating account..." : "Sign Up"}
          </Text>
        </TouchableOpacity>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.surface,
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.surface,
    minHeight: 50,
  },
  pickerButtonText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  pickerArrow: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  signupButton: {
    backgroundColor: Colors.buttonPrimary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  signupButtonDisabled: {
    backgroundColor: Colors.buttonDisabled,
  },
  signupButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
});
