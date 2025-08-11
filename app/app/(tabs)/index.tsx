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
    paddingTop: 60,
  },
  header: {
    padding: 20,
    alignItems: "center",
    paddingBottom: 16,
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
  },
  recipesListContent: {
    padding: 20,
    paddingBottom: 100, // Extra padding for tab bar
  },
  recipesGrid: {
    gap: 16,
  },
  recipeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recipeName: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    marginRight: 12,
  },
  recipeAuthor: {
    fontSize: 15,
    opacity: 0.7,
    marginBottom: 12,
    fontStyle: "italic",
  },
  recipeMetadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recipeCuisine: {
    fontSize: 13,
    fontWeight: "600",
    backgroundColor: "#007AFF",
    color: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: "hidden",
  },
  recipeTime: {
    fontSize: 14,
    opacity: 0.6,
    fontWeight: "500",
  },
});
