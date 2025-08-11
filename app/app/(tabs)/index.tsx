import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { LoginForm } from "@/components/LoginForm";
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
      <View style={styles.recipeHeader}>
        <ThemedText type="defaultSemiBold" style={styles.recipeName}>
          {name}
        </ThemedText>
        <IconSymbol
          name="chevron.right"
          size={16}
          color={Colors[colorScheme ?? "light"].icon}
        />
      </View>
      <ThemedText style={styles.recipeAuthor}>by {author}</ThemedText>
      <View style={styles.recipeMetadata}>
        <ThemedText style={styles.recipeCuisine}>{cuisine}</ThemedText>
        <ThemedText style={styles.recipeTime}>{timeEstimate} min</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

export default function RecipesScreen() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useUser();
  const { data: recipes, isLoading, error } = useRecipes();

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Welcome to RecipeBox</ThemedText>
          <ThemedText style={styles.subtitle}>
            Please log in to view your recipes
          </ThemedText>
        </View>
        <View style={styles.loginContainer}>
          <LoginForm />
        </View>
      </ThemedView>
    );
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
        <View style={styles.header}>
          <ThemedText type="title">Your Recipes</ThemedText>
        </View>
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
      <View style={styles.header}>
        <ThemedText type="title">Your Recipes</ThemedText>
        <ThemedText style={styles.subtitle}>
          {recipes.length} recipe{recipes.length !== 1 ? "s" : ""}
        </ThemedText>
      </View>

      <ScrollView
        style={styles.recipesList}
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
        <View style={styles.bottomPadding} />
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
    padding: 20,
    alignItems: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginTop: 8,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    textAlign: "center",
    color: "#ff4444",
    marginTop: 16,
  },
  emptyStateText: {
    textAlign: "center",
    opacity: 0.7,
    marginTop: 16,
  },
  recipesList: {
    flex: 1,
    padding: 20,
  },
  recipesGrid: {
    gap: 16,
  },
  recipeCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  recipeName: {
    flex: 1,
    fontSize: 18,
  },
  recipeAuthor: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  recipeMetadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recipeCuisine: {
    fontSize: 14,
    fontWeight: "500",
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recipeTime: {
    fontSize: 14,
    opacity: 0.7,
  },
  bottomPadding: {
    height: 40,
  },
});
