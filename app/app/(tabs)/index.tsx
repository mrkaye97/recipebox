import { PendingRecipeShares } from "@/components/pending-recipe-shares";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeCreationDrawer } from "@/components/recipe-creation-drawer";
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

function RecipeHeader({
  searchQuery,
  onSearchChange,
  onClearSearch,
  pendingSharesCount,
  onShowShares,
  onRandomRecipe,
  hasRecipes,
  hasRecommendedRecipe,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  pendingSharesCount: number;
  onShowShares: () => void;
  onRandomRecipe: () => void;
  hasRecipes: boolean;
  hasRecommendedRecipe: boolean;
}) {
  return (
    <View style={styles.header}>
      <ThemedText type="title">Recipes</ThemedText>
      <View style={styles.headerActions}>
        {pendingSharesCount > 0 && (
          <TouchableOpacity
            onPress={onShowShares}
            style={[
              styles.sharesButton,
              pendingSharesCount > 0 && styles.sharesButtonWithBadge,
            ]}
          >
            <IconSymbol
              name="tray.and.arrow.down"
              size={18}
              color={Colors.textSecondary}
            />
            {pendingSharesCount > 0 && (
              <View style={styles.sharesBadge}>
                <ThemedText style={styles.sharesBadgeText}>
                  {pendingSharesCount}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        )}
        {hasRecommendedRecipe && (
          <TouchableOpacity
            onPress={onRandomRecipe}
            disabled={!hasRecipes}
            style={[
              styles.randomButton,
              !hasRecipes && styles.randomButtonDisabled,
            ]}
          >
            <IconSymbol
              name="wand.and.stars"
              size={16}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function SearchBar({
  searchQuery,
  onSearchChange,
  onClearSearch,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
}) {
  return (
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
          placeholder="Search recipes..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={onClearSearch} style={styles.clearButton}>
            <IconSymbol
              name="xmark.circle.fill"
              size={16}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
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
    pendingShares: { data: pendingShares = [] },
    recommendation: { data: recommendedRecipe },
  } = useRecipes({ search: searchQuery });

  const [sharesDrawerVisible, setSharesDrawerVisible] = useState(false);
  const [creationDrawerVisible, setCreationDrawerVisible] = useState(false);

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

  const renderContent = () => {
    if (!recipes || recipes.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ThemedText type="subtitle">
            {searchQuery ? "No recipes found" : "No recipes yet"}
          </ThemedText>
          <ThemedText style={styles.emptyStateText}>
            {searchQuery
              ? "Try adjusting your search terms"
              : "Get started by creating your first recipe in the Create tab!"}
          </ThemedText>
        </View>
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
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              name={recipe.name}
              author={recipe.author}
              cuisine={recipe.cuisine}
              timeEstimate={recipe.time_estimate_minutes}
              cookedAt={recipe.last_made_at}
            />
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <RecipeHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery("")}
        pendingSharesCount={pendingShares.length}
        onShowShares={() => setSharesDrawerVisible(true)}
        onRandomRecipe={getRandomRecipe}
        hasRecipes={Boolean(recipes && recipes.length > 0)}
        hasRecommendedRecipe={!!recommendedRecipe}
      />

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery("")}
      />

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
        <IconSymbol size={28} name="plus" color="#ffffff" />
      </TouchableOpacity>

      <RecipeCreationDrawer
        visible={creationDrawerVisible}
        onClose={() => setCreationDrawerVisible(false)}
        onSelectOption={handleCreateRecipe}
      />
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
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.sm,
  },
  searchContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background,
  },
  randomButton: {
    padding: Spacing.sm,
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
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
    minHeight: 52,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSizes.base,
    color: Colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  floatingButton: {
    position: "absolute",
    right: Layout.screenPadding,
    bottom: 100,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius["2xl"],
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.primaryLarge,
    zIndex: 1000,
  },
});
