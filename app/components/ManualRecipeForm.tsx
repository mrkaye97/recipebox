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
import { useRecipes } from "@/hooks/useRecipes";
import { router } from "expo-router";

interface ManualRecipeFormProps {
  onCancel: () => void;
}

export function ManualRecipeForm({ onCancel }: ManualRecipeFormProps) {
  const colorScheme = useColorScheme();
  const { create } = useRecipes();

  const [formData, setFormData] = useState({
    name: "",
    author: "",
    cuisine: "",
    time_estimate_minutes: "",
    ingredients: "",
    instructions: "",
    tags: "",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Recipe name is required");
      return;
    }

    if (!formData.author.trim()) {
      Alert.alert("Error", "Author is required");
      return;
    }

    if (!formData.cuisine.trim()) {
      Alert.alert("Error", "Cuisine is required");
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
      name: formData.name.trim(),
      author: formData.author.trim(),
      cuisine: formData.cuisine.trim(),
      time_estimate_minutes: formData.time_estimate_minutes
        ? parseInt(formData.time_estimate_minutes)
        : 0,
      tags: tagsList,
      dietary_restrictions_met: [] as const, // Empty array for now - could be made configurable
      ingredients: ingredientsList,
      instructions: instructionsList,
      notes: formData.notes.trim() || null,
      location: "made_up" as const,
    };

    const response = await create.perform(recipeData);

    if (response) {
      Alert.alert("Success", "Recipe created successfully!", [
        {
          text: "OK",
          onPress: () => {
            onCancel(); // Close the form
            router.push("/"); // Navigate to recipes list
          },
        },
      ]);
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
            <ThemedText style={styles.label}>Recipe Name *</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
              value={formData.name}
              onChangeText={(value) => updateFormData("name", value)}
              placeholder="Enter recipe name"
              placeholderTextColor={Colors[colorScheme ?? "light"].icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Author *</ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
              value={formData.author}
              onChangeText={(value) => updateFormData("author", value)}
              placeholder="Recipe author or source"
              placeholderTextColor={Colors[colorScheme ?? "light"].icon}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <ThemedText style={styles.label}>Cuisine *</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
                value={formData.cuisine}
                onChangeText={(value) => updateFormData("cuisine", value)}
                placeholder="Italian, Mexican, etc."
                placeholderTextColor={Colors[colorScheme ?? "light"].icon}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <ThemedText style={styles.label}>Total Time (min)</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
                value={formData.time_estimate_minutes}
                onChangeText={(value) =>
                  updateFormData("time_estimate_minutes", value)
                }
                placeholder="45"
                placeholderTextColor={Colors[colorScheme ?? "light"].icon}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Notes</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
              value={formData.notes}
              onChangeText={(value) => updateFormData("notes", value)}
              placeholder="Any additional notes about the recipe"
              placeholderTextColor={Colors[colorScheme ?? "light"].icon}
              multiline
              numberOfLines={3}
            />
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
            create.isPending && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={create.isPending}
        >
          <ThemedText style={styles.submitButtonText}>
            {create.isPending ? "Creating Recipe..." : "Create Recipe"}
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
    backgroundColor: "#fafafa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.04)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    width: 44,
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.02)",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  helperText: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#ffffff",
    lineHeight: 22,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  largeTextArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 32,
    marginHorizontal: 24,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#e9ecef",
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  bottomPadding: {
    height: 140,
  },
});
