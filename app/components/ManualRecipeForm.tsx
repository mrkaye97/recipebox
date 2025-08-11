import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/hooks/useUser";
import { fetchClient } from "@/src/lib/api/client";
import { router } from "expo-router";

interface ManualRecipeFormProps {
  onCancel: () => void;
}

export function ManualRecipeForm({ onCancel }: ManualRecipeFormProps) {
  const colorScheme = useColorScheme();
  const { token } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prepTime: "",
    cookTime: "",
    servings: "",
    difficulty: "",
    ingredients: "",
    instructions: "",
    tags: "",
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Recipe title is required");
      return;
    }

    if (!formData.ingredients.trim()) {
      Alert.alert("Error", "Ingredients are required");
      return;
    }

    if (!formData.instructions.trim()) {
      Alert.alert("Error", "Instructions are required");
      return;
    }

    setIsLoading(true);

    try {
      // Parse ingredients - split by newlines and create structured objects
      const ingredientsList = formData.ingredients
        .split("\n")
        .map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // Try to parse quantity and units from ingredient line
          // Simple pattern: "2 cups flour" -> quantity: 2, units: "cups", name: "flour"
          const match = trimmed.match(/^(\d+(?:\.\d+)?)\s+(\w+)\s+(.+)$/);
          if (match) {
            return {
              quantity: parseFloat(match[1]),
              units: match[2],
              name: match[3],
            };
          } else {
            // If can't parse, assume quantity 1 and no units
            return {
              quantity: 1,
              units: "",
              name: trimmed,
            };
          }
        })
        .filter((ingredient) => ingredient !== null);

      // Parse instructions - split by newlines and create structured objects
      const instructionsList = formData.instructions
        .split("\n")
        .map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          return {
            step_number: index + 1,
            content: trimmed,
          };
        })
        .filter((instruction) => instruction !== null);

      // Parse tags - split by commas and filter empty tags
      const tagsList = formData.tags
        ? formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        : [];

      const recipeData = {
        name: formData.title.trim(),
        author: "User", // Default author - could be made configurable
        cuisine: formData.difficulty.trim() || "Unknown", // Using difficulty field as cuisine for now
        time_estimate_minutes:
          (formData.prepTime ? parseInt(formData.prepTime) : 0) +
          (formData.cookTime ? parseInt(formData.cookTime) : 0),
        tags: tagsList,
        dietary_restrictions_met: [] as const, // Empty array for now - could be made configurable
        ingredients: ingredientsList,
        instructions: instructionsList,
        notes: formData.description.trim() || null,
        location: "made_up" as const,
      };

      const response = await fetchClient.POST("/recipes/made-up", {
        body: recipeData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) {
        throw new Error("Failed to create recipe");
      }

      Alert.alert("Success", "Recipe created successfully!", [
        {
          text: "OK",
          onPress: () => {
            onCancel(); // Close the form
            router.push("/"); // Navigate to recipes list
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating recipe:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create recipe",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <IconSymbol
            name="xmark"
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>
        <ThemedText type="title">Manual Recipe</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Basic Information
          </ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Title *</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
              value={formData.title}
              onChangeText={(value) => updateFormData("title", value)}
              placeholder="Enter recipe title"
              placeholderTextColor={Colors[colorScheme ?? "light"].icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Description</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
              value={formData.description}
              onChangeText={(value) => updateFormData("description", value)}
              placeholder="Brief description of the recipe"
              placeholderTextColor={Colors[colorScheme ?? "light"].icon}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <ThemedText style={styles.label}>Prep Time (min)</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
                value={formData.prepTime}
                onChangeText={(value) => updateFormData("prepTime", value)}
                placeholder="15"
                placeholderTextColor={Colors[colorScheme ?? "light"].icon}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <ThemedText style={styles.label}>Cook Time (min)</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
                value={formData.cookTime}
                onChangeText={(value) => updateFormData("cookTime", value)}
                placeholder="30"
                placeholderTextColor={Colors[colorScheme ?? "light"].icon}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <ThemedText style={styles.label}>Servings</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
                value={formData.servings}
                onChangeText={(value) => updateFormData("servings", value)}
                placeholder="4"
                placeholderTextColor={Colors[colorScheme ?? "light"].icon}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <ThemedText style={styles.label}>Difficulty</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
                value={formData.difficulty}
                onChangeText={(value) => updateFormData("difficulty", value)}
                placeholder="Easy, Medium, Hard"
                placeholderTextColor={Colors[colorScheme ?? "light"].icon}
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Ingredients *
          </ThemedText>
          <ThemedText style={styles.helperText}>
            Enter each ingredient on a new line
          </ThemedText>

          <TextInput
            style={[
              styles.input,
              styles.largeTextArea,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
            value={formData.ingredients}
            onChangeText={(value) => updateFormData("ingredients", value)}
            placeholder={`2 cups flour\n1 tsp salt\n3 eggs\n1 cup milk`}
            placeholderTextColor={Colors[colorScheme ?? "light"].icon}
            multiline
            numberOfLines={6}
          />
        </View>

        <View style={styles.formSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Instructions *
          </ThemedText>
          <ThemedText style={styles.helperText}>
            Enter each step on a new line
          </ThemedText>

          <TextInput
            style={[
              styles.input,
              styles.largeTextArea,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
            value={formData.instructions}
            onChangeText={(value) => updateFormData("instructions", value)}
            placeholder={`Preheat oven to 350°F\nMix dry ingredients in a bowl\nAdd wet ingredients and stir\nBake for 25-30 minutes`}
            placeholderTextColor={Colors[colorScheme ?? "light"].icon}
            multiline
            numberOfLines={8}
          />
        </View>

        <View style={styles.formSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Tags
          </ThemedText>
          <ThemedText style={styles.helperText}>
            Separate tags with commas (e.g., &quot;dinner, italian,
            vegetarian&quot;)
          </ThemedText>

          <TextInput
            style={[
              styles.input,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
            value={formData.tags}
            onChangeText={(value) => updateFormData("tags", value)}
            placeholder="dinner, italian, vegetarian"
            placeholderTextColor={Colors[colorScheme ?? "light"].icon}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            isLoading && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <ThemedText style={styles.submitButtonText}>
            {isLoading ? "Creating Recipe..." : "Create Recipe"}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  cancelButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  largeTextArea: {
    height: 120,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 40,
  },
});
