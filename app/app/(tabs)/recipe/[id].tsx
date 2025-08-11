import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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
  const [ingredientsCollapsed, setIngredientsCollapsed] = useState(false);

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
            name="chevron.left"
            size={24}
            color={Colors[colorScheme ?? "light"].icon}
          />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Recipe
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
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
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setIngredientsCollapsed(!ingredientsCollapsed)}
            >
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Ingredients ({recipe.ingredients.length})
              </ThemedText>
              <IconSymbol
                name={ingredientsCollapsed ? "chevron.down" : "chevron.up"}
                size={20}
                color={Colors[colorScheme ?? "light"].icon}
              />
            </TouchableOpacity>
            {!ingredientsCollapsed && (
              <View style={styles.ingredientsList}>
                {recipe.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredient}>
                    <View style={styles.ingredientBullet}>
                      <View style={styles.bullet} />
                    </View>
                    <View style={styles.ingredientContent}>
                      <ThemedText style={styles.ingredientQuantity}>
                        {ingredient.quantity} {ingredient.units}
                      </ThemedText>
                      <ThemedText style={styles.ingredientName}>
                        {ingredient.name}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            )}
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
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  recipeHeader: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  recipeName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    lineHeight: 34,
  },
  recipeAuthor: {
    opacity: 0.7,
    fontSize: 18,
    fontStyle: "italic",
  },
  recipeInfo: {
    marginBottom: 24,
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
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
    backgroundColor: "#007AFF",
  },
  tagText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "500",
  },
  restrictionsContainer: {
    gap: 8,
  },
  restriction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    backgroundColor: "#e8f5e8",
    borderRadius: 8,
  },
  restrictionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2e7d32",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: "600",
  },
  ingredientsList: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ingredient: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
  },
  ingredientBullet: {
    marginRight: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#007AFF",
  },
  ingredientContent: {
    flex: 1,
  },
  ingredientQuantity: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 2,
  },
  ingredientName: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
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
