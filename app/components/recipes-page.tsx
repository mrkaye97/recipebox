import { RECIPE_MEALS, RECIPE_TYPES } from "@/app/(tabs)/recipe/[id]";
import { PendingRecipeShares } from "@/components/pending-recipe-shares";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeCreationDrawer } from "@/components/recipe-creation-drawer";
import { RecipeSkeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Dropdown, DropdownOption } from "@/components/ui/dropdown";
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
  Keyboard,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

function SearchBar({
  searchQuery,
  onSearchChange,
  onClearSearch,
  onRandomRecipe,
  hasRecipes,
  hasRecommendedRecipe,
  pendingSharesCount,
  onShowShares,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  onRandomRecipe: () => void;
  hasRecipes: boolean;
  hasRecommendedRecipe: boolean;
  pendingSharesCount: number;
  onShowShares: () => void;
}) {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <IconSymbol
            name="magnifyingglass"
            size={18}
            color={Colors.primary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={Keyboard.dismiss}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={onClearSearch}
              style={styles.clearButton}
            >
              <IconSymbol
                name="xmark.circle.fill"
                size={18}
                color={Colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
        {pendingSharesCount > 0 && (
          <TouchableOpacity
            onPress={onShowShares}
            style={[styles.actionButton, styles.sharesButtonWithBadge]}
          >
            <IconSymbol
              name="tray.and.arrow.down"
              size={20}
              color={Colors.primary}
            />
            <View style={styles.sharesBadge}>
              <ThemedText style={styles.sharesBadgeText}>
                {pendingSharesCount}
              </ThemedText>
            </View>
          </TouchableOpacity>
        )}
        {hasRecommendedRecipe && (
          <TouchableOpacity
            onPress={onRandomRecipe}
            disabled={!hasRecipes}
            style={[
              styles.actionButton,
              !hasRecipes && styles.randomButtonDisabled,
            ]}
          >
            <IconSymbol
              name="wand.and.stars"
              size={18}
              color={Colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function RecipesScreen({
  onlyCurrentUser,
}: {
  onlyCurrentUser: boolean;
}) {
  const { isAuthenticated, isLoading: isAuthLoading } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeal, setSelectedMeal] = useState<string | undefined>();
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [selectedCuisine, setSelectedCuisine] = useState<string | undefined>();

  const {
    data: { recipes, isLoading, refetch, error },
    pendingShares: { data: pendingShares = [] },
    recommendation: { data: recommendedRecipe },
    filterOptions: { data: filterOptions },
  } = useRecipes({
    search: searchQuery,
    meal: selectedMeal,
    type: selectedType,
    cuisine: selectedCuisine,
    onlyCurrentUser,
  });

  const [sharesDrawerVisible, setSharesDrawerVisible] = useState(false);
  const [creationDrawerVisible, setCreationDrawerVisible] = useState(false);

  const mealOptions: DropdownOption[] = RECIPE_MEALS.map((meal) => ({
    label: meal.label,
    value: meal.value,
  }));

  const typeOptions: DropdownOption[] = RECIPE_TYPES.map((type) => ({
    label: type.label,
    value: type.value,
  }));

  const cuisineOptions: DropdownOption[] = React.useMemo(() => {
    if (filterOptions?.cuisines) {
      return filterOptions.cuisines.map((cuisine) => ({
        label: cuisine,
        value: cuisine,
      }));
    }
    const uniqueCuisines = Array.from(
      new Set(recipes?.map((r) => r.cuisine) || []),
    );
    return uniqueCuisines.map((cuisine) => ({
      label: cuisine,
      value: cuisine,
    }));
  }, [filterOptions?.cuisines, recipes]);

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const getRandomRecipe = () => {
    if (!recommendedRecipe) return;

    router.push(`/recipe/${recommendedRecipe.id}`);
  };

  const handleCreateRecipe = (option: "online" | "manual" | "cookbook") => {
    router.push(`/(tabs)/recipes?option=${option}`);
  };

  if (!isAuthenticated && !isAuthLoading) {
    return <Redirect href={"/(tabs)/profile"} />;
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

  const renderContent = () => {
    if (isLoading || isAuthLoading) {
      return (
        <ScrollView
          style={styles.recipesList}
          contentContainerStyle={styles.recipesListContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.recipesGrid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <RecipeSkeleton key={index} />
            ))}
          </View>
        </ScrollView>
      );
    }

    if (recipes.length === 0) {
      const hasAnyRecipes = recipes && recipes.length > 0;
      return (
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
          <View style={styles.centerContainer}>
            <ThemedText type="subtitle">
              {hasAnyRecipes
                ? "No matching recipes"
                : searchQuery
                  ? "No recipes found"
                  : "No recipes yet"}
            </ThemedText>
            <ThemedText style={styles.emptyStateText}>
              {hasAnyRecipes
                ? "Try adjusting your filters or search terms"
                : searchQuery
                  ? "Try adjusting your search terms"
                  : "Get started by creating your first recipe in the Create tab!"}
            </ThemedText>
          </View>
        </ScrollView>
      );
    }

    return (
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
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery("")}
          onRandomRecipe={getRandomRecipe}
          hasRecipes={recipes.length > 0}
          hasRecommendedRecipe={!!recommendedRecipe}
          pendingSharesCount={pendingShares.length}
          onShowShares={() => setSharesDrawerVisible(true)}
        />

        <View style={styles.filtersContainer}>
          <Dropdown
            options={mealOptions}
            value={selectedMeal}
            onValueChange={setSelectedMeal}
            placeholder="Meal"
          />
          <Dropdown
            options={typeOptions}
            value={selectedType}
            onValueChange={setSelectedType}
            placeholder="Type"
          />
          <Dropdown
            options={cuisineOptions}
            value={selectedCuisine}
            onValueChange={setSelectedCuisine}
            placeholder="Cuisine"
          />
        </View>

        {renderContent()}

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

        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setCreationDrawerVisible(true)}
        >
          <IconSymbol size={32} name="plus" color="#ffffff" />
        </TouchableOpacity>

        <RecipeCreationDrawer
          visible={creationDrawerVisible}
          onClose={() => setCreationDrawerVisible(false)}
          onSelectOption={handleCreateRecipe}
        />
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingTop: Layout.headerHeight,
  },
  searchContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderColor: Colors.border,
  },
  actionButton: {
    backgroundColor: Colors.accent2,
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
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
    paddingHorizontal: Spacing["3xl"],
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
    gap: Spacing.lg,
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
  sharesButtonWithBadge: {
    position: "relative",
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
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceTinted,
    borderRadius: BorderRadius["2xl"],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
    minHeight: 56,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizes.base,
    color: Colors.text,
    paddingVertical: 0,
    fontWeight: Typography.fontWeights.medium,
    letterSpacing: Typography.letterSpacing.normal,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  floatingButton: {
    position: "absolute",
    right: Layout.screenPadding,
    bottom: 110,
    backgroundColor: Colors.primary,
    borderRadius: 36,
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.primaryLarge,
    zIndex: 1000,
    elevation: 12,
    borderWidth: 3,
    borderColor: Colors.surface,
  },
});
