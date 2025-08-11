import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/hooks/useUser";
import { $api } from "@/src/lib/api/client";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const { token } = useUser();

  const { data: recipe, isLoading } = $api.useQuery(
    "get",
    "/recipes/{id}",
    {
      params: {
        path: { id: id! },
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    {
      enabled: !!token && !!id,
    }
  );

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading recipe...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (!recipe) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContainer}>
          <ThemedText type="title">Recipe Not Found</ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backIconButton}>
          <IconSymbol
            name="chevron.right"
            size={24}
            color={Colors[colorScheme ?? "light"].icon}
          />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Recipe
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.recipeHeader}>
          <ThemedText type="title" style={styles.recipeName}>
            {recipe.name}
          </ThemedText>
          <ThemedText style={styles.recipeAuthor}>
            by {recipe.author}
          </ThemedText>
        </View>

        <View style={styles.recipeInfo}>
          <View style={styles.infoRow}>
            <ThemedText type="defaultSemiBold">Cuisine:</ThemedText>
            <ThemedText>{recipe.cuisine}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText type="defaultSemiBold">Cook Time:</ThemedText>
            <ThemedText>{recipe.time_estimate_minutes} minutes</ThemedText>
          </View>
        </View>

        {recipe.tags && recipe.tags.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Tags
            </ThemedText>
            <View style={styles.tagsContainer}>
              {recipe.tags.map((tag, index) => (
                <View
                  key={index}
                  style={[
                    styles.tag,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#48484a" : "#e5e5ea",
                    },
                  ]}
                >
                  <ThemedText style={styles.tagText}>{tag}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {recipe.dietary_restrictions_met &&
          recipe.dietary_restrictions_met.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Dietary Restrictions
              </ThemedText>
              <View style={styles.restrictionsContainer}>
                {recipe.dietary_restrictions_met.map((restriction, index) => (
                  <View key={index} style={styles.restriction}>
                    <IconSymbol
                      name="house.fill"
                      size={16}
                      color={Colors[colorScheme ?? "light"].tint}
                    />
                    <ThemedText style={styles.restrictionText}>
                      {restriction.replace("_", " ").toUpperCase()}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Ingredients
            </ThemedText>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredient}>
                <ThemedText style={styles.ingredientQuantity}>
                  {ingredient.quantity} {ingredient.units}
                </ThemedText>
                <ThemedText style={styles.ingredientName}>
                  {ingredient.name}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {recipe.instructions && recipe.instructions.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Instructions
            </ThemedText>
            {recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instruction}>
                <View style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>
                    {instruction.step_number}
                  </ThemedText>
                </View>
                <ThemedText style={styles.instructionText}>
                  {instruction.content}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {recipe.notes && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Notes
            </ThemedText>
            <ThemedText style={styles.notes}>{recipe.notes}</ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backIconButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
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
  recipeHeader: {
    marginBottom: 24,
  },
  recipeName: {
    marginBottom: 8,
  },
  recipeAuthor: {
    opacity: 0.7,
    fontSize: 16,
  },
  recipeInfo: {
    marginBottom: 24,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    opacity: 0.8,
  },
  restrictionsContainer: {
    gap: 8,
  },
  restriction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  restrictionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  ingredient: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  ingredientQuantity: {
    width: 80,
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
  },
  ingredientName: {
    flex: 1,
    fontSize: 14,
  },
  instruction: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  stepNumberText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    fontStyle: "italic",
  },
});
