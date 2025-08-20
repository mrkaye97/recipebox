import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useRecipes } from "@/hooks/useRecipes";
import { useUser } from "@/hooks/useUser";

interface RecipeCardProps {
  id: string;
  name: string;
  author: string;
  cuisine: string;
  timeEstimate: number;
  colorScheme: "light" | "dark" | null | undefined;
}

function RecipeCard({
  id,
  name,
  author,
  cuisine,
  timeEstimate,
  colorScheme,
}: RecipeCardProps) {
  const handlePress = () => {
    router.push(`/recipe/${id}`);
  };

  return (
    <TouchableOpacity style={styles.recipeCard} onPress={handlePress}>
      <View style={styles.recipeCardContent}>
        <View style={styles.recipeHeader}>
          <ThemedText type="defaultSemiBold" style={styles.recipeName}>
            {name}
          </ThemedText>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={Colors[colorScheme ?? "light"].icon}
            style={styles.chevronIcon}
          />
        </View>
        <ThemedText style={styles.recipeAuthor}>by {author}</ThemedText>
        <View style={styles.recipeMetadata}>
          <ThemedText style={styles.recipeCuisine}>{cuisine}</ThemedText>
          <ThemedText style={styles.recipeTime}>{timeEstimate} min</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RecipesScreen() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useUser();
  const { data: recipes, isLoading, error } = useRecipes();

  if (!isAuthenticated) {
    return router.push("/(tabs)/profile");
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContainer}>
          <ThemedText type="title">Loading Recipes...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContainer}>
          <ThemedText type="title">Error Loading Recipes</ThemedText>
          <ThemedText style={styles.errorText}>
            Something went wrong loading your recipes
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContainer}>
          <ThemedText type="subtitle">No recipes yet</ThemedText>
          <ThemedText style={styles.emptyStateText}>
            Get started by creating your first recipe in the Create tab!
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.recipesList}
        contentContainerStyle={styles.recipesListContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.recipesGrid}>
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              name={recipe.name}
              author={recipe.author}
              cuisine={recipe.cuisine}
              timeEstimate={recipe.time_estimate_minutes}
              colorScheme={colorScheme}
            />
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    textAlign: "center",
    color: "#d63384",
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  emptyStateText: {
    textAlign: "center",
    color: "#6c757d",
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  recipesList: {
    flex: 1,
  },
  recipesListContent: {
    padding: 24,
    paddingBottom: 120,
  },
  recipesGrid: {
    gap: 20,
  },
  recipeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 0,
    marginBottom: 4,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  recipeCardContent: {
    padding: 24,
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  recipeName: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginRight: 16,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  recipeAuthor: {
    fontSize: 15,
    color: "#6c757d",
    marginBottom: 16,
    fontWeight: "400",
    lineHeight: 20,
  },
  recipeMetadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  recipeCuisine: {
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "#f8f9fa",
    color: "#495057",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: "hidden",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recipeTime: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  chevronIcon: {
    opacity: 0.6,
  },
});
