import { RecipeShareModal } from "@/components/recipe-share-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/design-system";
import { useRecipeDetails } from "@/hooks/use-recipe-details";
import { useActivity } from "@/hooks/use-activity";
import { components } from "@/src/lib/api/v1";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type RecipeLocation = components["schemas"]["RecipeLocation"];

const RecipeLocation = ({ location }: { location: RecipeLocation }) => {
  switch (location.location.location) {
    case "made_up":
      return null;
    case "online":
      return (
        <View style={styles.recipeInfo}>
          <View style={styles.infoRow}>
            <IconSymbol name="link" size={24} color={Colors.textSecondary} />
            <Button
              title={
                location.location.location === "online"
                  ? location.location.url.slice(0, 32) +
                    (location.location.url.length > 32 ? "..." : "")
                  : ""
              }
              onPress={() => {
                if (location.location.location === "online") {
                  Linking.openURL(location.location.url);
                }
              }}
            />
          </View>
        </View>
      );
    case "cookbook":
      return (
        <View style={styles.recipeInfo}>
          <View style={styles.infoRow}>
            <IconSymbol
              name="book.closed"
              size={24}
              color={Colors.textSecondary}
            />
            <ThemedText
              style={{
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              {location.location.cookbook_name}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol
              name="number.circle"
              size={24}
              color={Colors.textSecondary}
            />
            <ThemedText
              style={{
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Page {location.location.page_number}
            </ThemedText>
          </View>
        </View>
      );
    default:
      const exhaustiveCheck: never = location.location;
      throw new Error(`Unhandled recipe location: ${exhaustiveCheck}`);
  }
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ingredientsCollapsed, setIngredientsCollapsed] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  const { data: recipe, isLoading } = useRecipeDetails(id);
  const {
    markAsCookedRecently: {
      perform: markAsCookedRecently,
      isPending: isMarkingCooked,
    },
  } = useActivity();

  const handleBack = () => {
    router.back();
  };

  const handleMarkAsCooked = async () => {
    if (!recipe || !id) return;

    try {
      await markAsCookedRecently(id);
    } catch (error) {
      Alert.alert("Error", "Failed to mark recipe as cooked");
    }
  };

  const handleShareRecipe = () => {
    setShareModalVisible(true);
  };

  const handleCloseShareModal = () => {
    setShareModalVisible(false);
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
            color={Colors.textSecondary}
          />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Recipe
        </ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleShareRecipe}
            style={styles.shareButton}
          >
            <IconSymbol
              name="square.and.arrow.up"
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleMarkAsCooked}
            disabled={isMarkingCooked}
            style={styles.cookedButton}
          >
            <IconSymbol
              name="checkmark.circle"
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>
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
          <View style={styles.recipeBasicInfo}>
            <View style={styles.infoItem}>
              <IconSymbol name="fork.knife" size={16} color={Colors.primary} />
              <ThemedText style={styles.infoLabel}>Cuisine:</ThemedText>
              <ThemedText style={styles.infoValue}>{recipe.cuisine}</ThemedText>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="clock" size={16} color={Colors.primary} />
              <ThemedText style={styles.infoLabel}>Time:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {recipe.time_estimate_minutes} min
              </ThemedText>
            </View>
          </View>
        </View>

        <RecipeLocation location={recipe.location} />

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
                      backgroundColor: Colors.secondary,
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
                    <IconSymbol name="heart" size={16} color={Colors.primary} />
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
              <ThemedText
                type="subtitle"
                style={styles.collapsibleSectionTitle}
              >
                Ingredients ({recipe.ingredients.length})
              </ThemedText>
              <IconSymbol
                name={ingredientsCollapsed ? "chevron.down" : "chevron.up"}
                size={16}
                color={Colors.textSecondary}
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

      <RecipeShareModal
        visible={shareModalVisible}
        recipe={recipe}
        onClose={handleCloseShareModal}
      />
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
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  shareButton: {
    padding: 8,
  },
  cookedButton: {
    padding: 8,
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  recipeBasicInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
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
  },
  tagText: {
    fontSize: 12,
    color: Colors.text,
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
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  collapsibleSectionTitle: {
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
    backgroundColor: Colors.primaryDark,
  },
  ingredientContent: {
    flex: 1,
  },
  ingredientQuantity: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
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
    backgroundColor: Colors.primary,
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
