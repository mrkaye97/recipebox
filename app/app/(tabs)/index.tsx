import { PendingRecipeShares } from "@/components/pending-recipe-shares";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  BorderRadius,
  Colors,
  Layout,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/design-system";
import { useRecipes } from "@/hooks/use-recipes";
import { useUser } from "@/hooks/use-user";
import { Redirect, router } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface RecipeCardProps {
  id: string;
  name: string;
  author: string;
  cuisine: string;
  timeEstimate: number;
}

function RecipeCard({
  id,
  name,
  author,
  cuisine,
  timeEstimate,
}: RecipeCardProps) {
  const handlePress = () => {
    router.push(`/recipe/${id}`);
  };

  return (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.recipeCardContent}>
        <View style={styles.recipeHeader}>
          <ThemedText type="defaultSemiBold" style={styles.recipeName}>
            {name}
          </ThemedText>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={Colors.textSecondary}
            style={styles.chevronIcon}
          />
        </View>
        <ThemedText style={styles.recipeAuthor}>by {author}</ThemedText>
        <View style={styles.recipeMetadata}>
          <View style={styles.cuisineContainer}>
            <ThemedText style={styles.recipeCuisine}>{cuisine}</ThemedText>
          </View>
          <View style={styles.timeContainer}>
            <IconSymbol name="clock" size={12} color={Colors.textSecondary} />
            <ThemedText style={styles.recipeTime}>
              {timeEstimate} min
            </ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RecipesScreen() {
  const { isAuthenticated, isLoading: isAuthLoading } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: recipes,
    isLoading,
    error,
    refetch,
    pendingShares: {
      data: pendingShares = [],
      isLoading: pendingSharesLoading,
    },
  } = useRecipes({ search: searchQuery });

  const [sharesDrawerVisible, setSharesDrawerVisible] = useState(false);

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const getRandomRecipe = () => {
    if (!recipes || recipes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * recipes.length);
    const randomRecipe = recipes[randomIndex];
    router.push(`/recipe/${randomRecipe.id}`);
  };

  if (!isAuthenticated && !isAuthLoading) {
    return <Redirect href={"/(tabs)/profile"} />;
  }

  if (isLoading || isAuthLoading) {
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
          <ThemedText type="title">My Recipes</ThemedText>
          {pendingShares.length > 0 && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setSharesDrawerVisible(true)}
                style={[
                  styles.sharesButton,
                  pendingShares.length > 0 && styles.sharesButtonWithBadge,
                ]}
              >
                <IconSymbol
                  name="tray.and.arrow.down"
                  size={18}
                  color={Colors.textSecondary}
                />
                {pendingShares.length > 0 && (
                  <View style={styles.sharesBadge}>
                    <ThemedText style={styles.sharesBadgeText}>
                      {pendingShares.length}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <IconSymbol
              name="magnifyingglass"
              size={16}
              color={Colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes, authors, or cuisines..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <IconSymbol
                  name="xmark.circle.fill"
                  size={16}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.centerContainer}>
          <ThemedText type="subtitle">
            {searchQuery ? "No recipes found" : "No recipes yet"}
          </ThemedText>
          <ThemedText style={styles.emptyStateText}>
            {searchQuery 
              ? "Try adjusting your search terms"
              : "Get started by creating your first recipe in the Create tab!"
            }
          </ThemedText>
        </View>

        <Modal
          visible={sharesDrawerVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSharesDrawerVisible(false)}
        >
          <ThemedView style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
              <ThemedText type="title">Shared Recipes</ThemedText>
              <TouchableOpacity
                onPress={() => setSharesDrawerVisible(false)}
                style={styles.closeButton}
              >
                <IconSymbol
                  name="xmark.circle.fill"
                  size={28}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <PendingRecipeShares />
          </ThemedView>
        </Modal>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">My Recipes</ThemedText>
        <View style={styles.headerActions}>
          {pendingShares.length > 0 && (
            <TouchableOpacity
              onPress={() => setSharesDrawerVisible(true)}
              style={[
                styles.sharesButton,
                pendingShares.length > 0 && styles.sharesButtonWithBadge,
              ]}
            >
              <IconSymbol
                name="tray.and.arrow.down"
                size={18}
                color={Colors.textSecondary}
              />
              {pendingShares.length > 0 && (
                <View style={styles.sharesBadge}>
                  <ThemedText style={styles.sharesBadgeText}>
                    {pendingShares.length}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={getRandomRecipe}
            disabled={!recipes || recipes.length === 0}
            style={[
              styles.randomButton,
              (!recipes || recipes.length === 0) && styles.randomButtonDisabled,
            ]}
          >
            <IconSymbol name="dice" size={18} color={Colors.textSecondary} />
            <ThemedText
              style={[
                styles.randomButtonText,
                (!recipes || recipes.length === 0) &&
                  styles.randomButtonTextDisabled,
              ]}
            >
              Random
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <IconSymbol
            name="magnifyingglass"
            size={16}
            color={Colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes, authors, or cuisines..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <IconSymbol
                name="xmark.circle.fill"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.recipesList}
        contentContainerStyle={styles.recipesListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
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
            />
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={sharesDrawerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSharesDrawerVisible(false)}
      >
        <ThemedView style={styles.drawerContainer}>
          <View style={styles.drawerHeader}>
            <ThemedText type="title">Shared Recipes</ThemedText>
            <TouchableOpacity
              onPress={() => setSharesDrawerVisible(false)}
              style={styles.closeButton}
            >
              <IconSymbol
                name="xmark.circle.fill"
                size={28}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <PendingRecipeShares />
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Layout.headerHeight,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.sm,
  },
  randomButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "transparent",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  randomButtonDisabled: {
    opacity: 0.5,
  },
  randomButtonText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.textSecondary,
  },
  randomButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["3xl"],
  },
  errorText: {
    textAlign: "center",
    color: Colors.error,
    marginTop: Spacing.lg,
    fontSize: Typography.fontSizes.md,
    lineHeight: Typography.fontSizes.md * Typography.lineHeights.relaxed,
  },
  emptyStateText: {
    textAlign: "center",
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 0,
    marginBottom: Spacing.lg,
    ...Shadows.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: "hidden",
  },
  recipeCardContent: {
    padding: Spacing["2xl"],
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  recipeName: {
    flex: 1,
    fontSize: Typography.fontSizes["2xl"],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text,
    marginRight: Spacing.lg,
    lineHeight: Typography.fontSizes["2xl"] * Typography.lineHeights.tight,
    letterSpacing: Typography.letterSpacing.tight,
  },
  recipeAuthor: {
    fontSize: Typography.fontSizes.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontWeight: Typography.fontWeights.normal,
    lineHeight: Typography.fontSizes.base * Typography.lineHeights.normal,
  },
  recipeMetadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  cuisineContainer: {
    backgroundColor: Colors.backgroundSubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  recipeCuisine: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: Typography.letterSpacing.wide,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  recipeTime: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.medium,
  },
  chevronIcon: {
    // No additional styling needed - handled by container
  },
  shareAcceptSection: {
    marginTop: Spacing["3xl"],
    paddingTop: Spacing["2xl"],
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.backgroundSubtle,
    marginHorizontal: -Layout.screenPadding,
    paddingHorizontal: 0,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing["2xl"],
    marginHorizontal: Layout.screenPadding,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sharesButton: {
    position: "relative",
    padding: Spacing.sm,
    backgroundColor: "transparent",
    borderRadius: BorderRadius.md,
  },
  sharesButtonWithBadge: {
    marginRight: Spacing.xs,
  },
  sharesBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    paddingHorizontal: Spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  sharesBadgeText: {
    color: Colors.surface,
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    lineHeight: Typography.fontSizes.xs,
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 44,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.sm,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizes.base,
    color: Colors.text,
    paddingVertical: Spacing.xs,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
});
