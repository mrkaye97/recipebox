import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
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
  Components,
  Layout,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/design-system";
import { useRecipes } from "@/hooks/use-recipes";
import { router } from "expo-router";

interface ManualRecipeFormProps {
  onCancel: () => void;
}

export function ManualRecipeForm({ onCancel }: ManualRecipeFormProps) {
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

    const ingredientsList = formData.ingredients
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

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
      dietary_restrictions_met: [] as const,
      ingredients: ingredientsList,
      instructions: instructionsList,
      notes: formData.notes.trim() || null,
      location: "made_up" as const,
    };

    const response = await create.perform(recipeData);

    if (response) {
      router.push(`/recipe/${response.id}`);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Basic Information
            </ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Recipe Name *</ThemedText>
              <TextInput
                style={[styles.input, { color: Colors.text }]}
                value={formData.name}
                onChangeText={(value) => updateFormData("name", value)}
                placeholder="Enter recipe name"
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="next"
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Author *</ThemedText>
              <TextInput
                style={[styles.input, { color: Colors.text }]}
                value={formData.author}
                onChangeText={(value) => updateFormData("author", value)}
                placeholder="Recipe author or source"
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="next"
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <ThemedText style={styles.label}>Cuisine *</ThemedText>
                <TextInput
                  style={[styles.input, { color: Colors.text }]}
                  value={formData.cuisine}
                  onChangeText={(value) => updateFormData("cuisine", value)}
                  placeholder="Italian, Mexican, etc."
                  placeholderTextColor={Colors.textSecondary}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <ThemedText style={styles.label}>Total Time (min)</ThemedText>
                <TextInput
                  style={[styles.input, { color: Colors.text }]}
                  value={formData.time_estimate_minutes}
                  onChangeText={(value) =>
                    updateFormData("time_estimate_minutes", value)
                  }
                  placeholder="45"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Notes</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { color: Colors.text }]}
                value={formData.notes}
                onChangeText={(value) => updateFormData("notes", value)}
                placeholder="Any additional notes about the recipe"
                placeholderTextColor={Colors.textSecondary}
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
                { color: Colors.text },
              ]}
              value={formData.ingredients}
              onChangeText={(value) => updateFormData("ingredients", value)}
              placeholder={`2 cups flour\n1 tsp salt\n3 eggs\n1 cup milk`}
              placeholderTextColor={Colors.textSecondary}
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
                { color: Colors.text },
              ]}
              value={formData.instructions}
              onChangeText={(value) => updateFormData("instructions", value)}
              placeholder={`Preheat oven to 350°F\nMix dry ingredients in a bowl\nAdd wet ingredients and stir\nBake for 25-30 minutes`}
              placeholderTextColor={Colors.textSecondary}
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
              style={[styles.input, { color: Colors.text }]}
              value={formData.tags}
              onChangeText={(value) => updateFormData("tags", value)}
              placeholder="dinner, italian, vegetarian"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </ScrollView>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              create.isPending && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={create.isPending}
          >
            <ThemedText style={styles.submitButtonText}>
              {create.isPending ? "Creating Recipe..." : "Create"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSubtle,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Layout.headerHeight,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.sm,
  },
  placeholder: {
    width: 44,
  },
  form: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing["4xl"],
  },
  formSection: {
    ...Components.formSection,
    ...Shadows.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: Typography.letterSpacing.tight,
  },
  helperText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: Typography.fontSizes.sm * Typography.lineHeights.normal,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: Typography.letterSpacing.wide,
  },
  input: {
    ...Components.input,
    ...Shadows.sm,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: Spacing.md,
  },
  largeTextArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: Spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  halfWidth: {
    flex: 1,
  },
  submitButton: {
    ...Components.button,
    flex: 1,
    backgroundColor: Colors.buttonPrimary,
    alignItems: "center",
    ...Shadows.primary,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.buttonDisabled,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: Colors.surface,
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    letterSpacing: Typography.letterSpacing.wider,
  },
  bottomPadding: {
    height: Layout.bottomPadding.form,
  },
  closeButton: {
    alignSelf: "flex-end",
    margin: Layout.screenPadding,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Layout.screenPadding,
    paddingBottom: 120,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    letterSpacing: Typography.letterSpacing.wider,
  },
});
