import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { Colors as DesignColors, Typography, Spacing, BorderRadius, Shadows, Layout } from "@/constants/Design";
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
    backgroundColor: DesignColors.background,
    paddingTop: Layout.headerHeight,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing['3xl'],
  },
  errorText: {
    textAlign: "center",
    color: DesignColors.error,
    marginTop: Spacing.lg,
    fontSize: Typography.fontSizes.md,
    lineHeight: Typography.fontSizes.md * Typography.lineHeights.relaxed,
  },
  emptyStateText: {
    textAlign: "center",
    color: DesignColors.textSecondary,
    marginTop: Spacing.lg,
    fontSize: Typography.fontSizes.md,
    lineHeight: Typography.fontSizes.md * Typography.lineHeights.relaxed,
  },
  recipesList: {
    flex: 1,
  },
  recipesListContent: {
    padding: Layout.screenPadding,
    paddingBottom: Layout.bottomPadding.list,
  },
  recipesGrid: {
    gap: Spacing.xl,
  },
  recipeCard: {
    backgroundColor: DesignColors.surface,
    borderRadius: BorderRadius.xl,
    padding: 0,
    marginBottom: Spacing.xs,
    ...Shadows.xl,
    borderWidth: 1,
    borderColor: DesignColors.border,
  },
  recipeCardContent: {
    padding: Spacing['2xl'],
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  recipeName: {
    flex: 1,
    fontSize: Typography.fontSizes['2xl'],
    fontWeight: Typography.fontWeights.bold,
    color: DesignColors.text,
    marginRight: Spacing.lg,
    lineHeight: Typography.fontSizes['2xl'] * Typography.lineHeights.tight,
    letterSpacing: Typography.letterSpacing.tight,
  },
  recipeAuthor: {
    fontSize: Typography.fontSizes.base,
    color: DesignColors.textSecondary,
    marginBottom: Spacing.lg,
    fontWeight: Typography.fontWeights.normal,
    lineHeight: Typography.fontSizes.base * Typography.lineHeights.normal,
  },
  recipeMetadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  recipeCuisine: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    backgroundColor: DesignColors.secondary,
    color: DesignColors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    textTransform: "uppercase",
    letterSpacing: Typography.letterSpacing.widest,
  },
  recipeTime: {
    fontSize: Typography.fontSizes.sm,
    color: DesignColors.textSecondary,
    fontWeight: Typography.fontWeights.medium,
    letterSpacing: Typography.letterSpacing.wider,
  },
  chevronIcon: {
    opacity: 0.6,
  },
});
