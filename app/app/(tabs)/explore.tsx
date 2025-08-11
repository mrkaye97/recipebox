import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ManualRecipeForm } from "@/components/ManualRecipeForm";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/hooks/useUser";

type CreateOption = "online" | "manual" | "cookbook";

interface CreateOptionCard {
  type: CreateOption;
  title: string;
  description: string;
  icon: string;
}

const createOptions: CreateOptionCard[] = [
  {
    type: "online",
    title: "From URL",
    description: "Import a recipe from a cooking website",
    icon: "link",
  },
  {
    type: "manual",
    title: "Manual Entry",
    description: "Type in your recipe details manually",
    icon: "pencil",
  },
  {
    type: "cookbook",
    title: "Cookbook Photo",
    description: "Take a photo of a cookbook page",
    icon: "camera.fill",
  },
];

function CreateOptionButton({
  option,
  onPress,
}: {
  option: CreateOptionCard;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        { backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7" },
      ]}
      onPress={onPress}
    >
      <View style={styles.optionHeader}>
        <IconSymbol
          name={option.icon as any}
          size={24}
          color={Colors[colorScheme ?? "light"].tint}
        />
        <ThemedText type="subtitle">{option.title}</ThemedText>
      </View>
      <ThemedText style={styles.optionDescription}>
        {option.description}
      </ThemedText>
    </TouchableOpacity>
  );
}

function OnlineRecipeForm({ onBack }: { onBack: () => void }) {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!url.trim()) {
      Alert.alert("Error", "Please enter a URL");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement API call to create online recipe
      Alert.alert("Success", "Recipe created successfully!");
      onBack();
    } catch {
      Alert.alert("Error", "Failed to create recipe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.formContainer}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={onBack}>
          <IconSymbol
            name="chevron.right"
            size={24}
            color={Colors.light.tint}
          />
        </TouchableOpacity>
        <ThemedText type="title">Import from URL</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="defaultSemiBold">Recipe URL</ThemedText>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://example.com/recipe"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="defaultSemiBold">Notes (optional)</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any notes about this recipe..."
          multiline
          numberOfLines={4}
          editable={!isLoading}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <ThemedText style={styles.submitButtonText}>
          {isLoading ? "Creating..." : "Import Recipe"}
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function CreateRecipeScreen() {
  const [selectedOption, setSelectedOption] = useState<CreateOption | null>(
    null,
  );
  const { isAuthenticated } = useUser();

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContainer}>
          <ThemedText type="title">Not Authenticated</ThemedText>
          <ThemedText style={styles.messageText}>
            Please log in to create recipes
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (selectedOption === "online") {
    return (
      <ThemedView style={styles.container}>
        <OnlineRecipeForm onBack={() => setSelectedOption(null)} />
      </ThemedView>
    );
  }

  if (selectedOption === "manual") {
    return <ManualRecipeForm onCancel={() => setSelectedOption(null)} />;
  }

  if (selectedOption === "cookbook") {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContainer}>
          <ThemedText type="title">From Cookbook</ThemedText>
          <ThemedText style={styles.messageText}>
            Cookbook photo upload coming soon!
          </ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedOption(null)}
          >
            <ThemedText style={styles.backButtonText}>Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Create Recipe</ThemedText>
        <ThemedText style={styles.subtitle}>
          Choose how you&apos;d like to add a new recipe
        </ThemedText>
      </View>

      <View style={styles.optionsContainer}>
        {createOptions.map((option) => (
          <CreateOptionButton
            key={option.type}
            option={option}
            onPress={() => setSelectedOption(option.type)}
          />
        ))}
        <View style={styles.bottomSpacer} />
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
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginTop: 8,
  },
  optionsContainer: {
    padding: 20,
    gap: 16,
    paddingBottom: 100,
  },
  bottomSpacer: {
    height: 20,
  },
  optionCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  optionDescription: {
    opacity: 0.7,
    fontSize: 14,
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
  backButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  placeholder: {
    width: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
