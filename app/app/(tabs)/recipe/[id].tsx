import { RecipeShareModal } from "@/components/recipe-share-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/design-system";
import { useActivity } from "@/hooks/use-activity";
import { useRecipeDetails } from "@/hooks/use-recipe-details";
import { useRecipes } from "@/hooks/use-recipes";
import { components } from "@/src/lib/api/v1";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Linking,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type RecipeLocation = components["schemas"]["RecipeLocation"];

const RecipeLocationUI = ({ location }: { location: RecipeLocation }) => {
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
  const [justMarkedCooked, setJustMarkedCooked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState<any>(null);

  const { data: recipe, isLoading, refetch } = useRecipeDetails(id);
  const {
    updateRecipe: { perform: updateRecipe, isPending: isUpdating },
  } = useRecipes();
  const {
    markAsCookedRecently: {
      perform: markAsCookedRecently,
      isPending: isMarkingCooked,
    },
  } = useActivity({ who: "me" });

  const handleBack = () => {
    router.back();
  };

  const handleMarkAsCooked = async () => {
    if (!recipe || !id) return;

    try {
      await markAsCookedRecently(id);
      setJustMarkedCooked(true);
    } catch {
      Alert.alert("Error", "Failed to mark recipe as cooked");
    }
  };

  useEffect(() => {
    if (justMarkedCooked) {
      const timeout = setTimeout(() => {
        setJustMarkedCooked(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [justMarkedCooked]);

  const handleShareRecipe = () => {
    setShareModalVisible(true);
  };

  const handleCloseShareModal = () => {
    setShareModalVisible(false);
  };

  const handleEditRecipe = () => {
    if (recipe) {
      setEditedRecipe({
        name: recipe.name,
        author: recipe.author,
        cuisine: recipe.cuisine,
        notes: recipe.notes || "",
        tags: recipe.tags || [],
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        time_estimate_minutes: recipe.time_estimate_minutes,
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedRecipe(null);
  };

  const handleSaveEdit = async () => {
    if (!editedRecipe || !id) return;

    try {
      await updateRecipe(id, editedRecipe);
      await refetch();
      setIsEditing(false);
      setEditedRecipe(null);
      Alert.alert("Success", "Recipe updated successfully!");
    } catch {
      Alert.alert("Error", "Failed to update recipe");
    }
  };

  const updateEditedField = (field: string, value: any) => {
    if (editedRecipe) {
      setEditedRecipe({ ...editedRecipe, [field]: value });
    }
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
          {isEditing ? "Edit Recipe" : "Recipe"}
        </ThemedText>
        <View style={styles.headerActions}>
          {isEditing ? (
            <>
              <TouchableOpacity
                onPress={handleCancelEdit}
                style={styles.cancelButton}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                disabled={isUpdating}
                style={styles.saveButton}
              >
                <ThemedText style={styles.saveButtonText}>
                  {isUpdating ? "Saving..." : "Save"}
                </ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={handleEditRecipe}
                style={styles.editButton}
              >
                <IconSymbol name="pencil" size={24} color={Colors.primary} />
              </TouchableOpacity>
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
                  name={
                    justMarkedCooked
                      ? "checkmark.circle.fill"
                      : "checkmark.circle"
                  }
                  size={24}
                  color={justMarkedCooked ? "#10B981" : Colors.primary}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.recipeHeader}>
          {isEditing ? (
            <>
              <TextInput
                style={[styles.recipeName, styles.editableInput]}
                value={editedRecipe?.name || ""}
                onChangeText={(text) => updateEditedField("name", text)}
                placeholder="Recipe name"
                multiline
              />
              <View style={styles.authorEditContainer}>
                <ThemedText style={styles.authorLabel}>by </ThemedText>
                <TextInput
                  style={[
                    styles.recipeAuthor,
                    styles.editableInput,
                    styles.authorInput,
                  ]}
                  value={editedRecipe?.author || ""}
                  onChangeText={(text) => updateEditedField("author", text)}
                  placeholder="Author name"
                />
              </View>
            </>
          ) : (
            <>
              <ThemedText type="title" style={styles.recipeName}>
                {recipe.name}
              </ThemedText>
              <ThemedText style={styles.recipeAuthor}>
                by {recipe.author}
              </ThemedText>
            </>
          )}
          <View style={styles.recipeBasicInfo}>
            <View style={styles.infoItem}>
              <IconSymbol name="fork.knife" size={16} color={Colors.primary} />
              <ThemedText style={styles.infoLabel}>Cuisine:</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.infoValue,
                    styles.editableInput,
                    styles.cuisineInput,
                  ]}
                  value={editedRecipe?.cuisine || ""}
                  onChangeText={(text) => updateEditedField("cuisine", text)}
                  placeholder="Cuisine"
                />
              ) : (
                <ThemedText style={styles.infoValue}>
                  {recipe.cuisine}
                </ThemedText>
              )}
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

        <RecipeLocationUI location={recipe.location} />

        {(recipe.tags && recipe.tags.length > 0) || isEditing ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Tags
            </ThemedText>
            {isEditing ? (
              <TextInput
                style={[styles.editableInput, styles.tagsInput]}
                value={editedRecipe?.tags?.join(", ") || ""}
                onChangeText={(text) =>
                  updateEditedField(
                    "tags",
                    text
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter((tag) => tag.length > 0),
                  )
                }
                placeholder="Enter tags separated by commas"
                multiline
              />
            ) : (
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
            )}
          </View>
        ) : null}

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

        {(recipe.ingredients && recipe.ingredients.length > 0) || isEditing ? (
          <View style={styles.section}>
            {isEditing ? (
              <>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Ingredients
                </ThemedText>
                <ThemedText style={styles.editingInstructions}>
                  Enter each ingredient on a new line in format: &quot;quantity
                  units name&quot;
                </ThemedText>
                <TextInput
                  style={[styles.editableInput, styles.ingredientsInput]}
                  value={
                    editedRecipe?.ingredients
                      ?.map(
                        (ing: any) =>
                          `${ing.quantity} ${ing.units} ${ing.name}`,
                      )
                      .join("\n") || ""
                  }
                  onChangeText={(text) => {
                    const ingredients = text
                      .split("\n")
                      .filter((line) => line.trim())
                      .map((line, index) => {
                        const parts = line.trim().split(" ");
                        if (parts.length >= 3) {
                          const quantity = parts[0];
                          const units = parts[1];
                          const name = parts.slice(2).join(" ");
                          return { quantity, units, name };
                        }
                        return { quantity: "", units: "", name: line.trim() };
                      });
                    updateEditedField("ingredients", ingredients);
                  }}
                  placeholder="1 cup flour\n2 tbsp sugar\n3 eggs"
                  multiline
                  numberOfLines={6}
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </View>
        ) : null}

        {(recipe.instructions && recipe.instructions.length > 0) ||
        isEditing ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Instructions
            </ThemedText>
            {isEditing ? (
              <>
                <ThemedText style={styles.editingInstructions}>
                  Enter each step on a new line
                </ThemedText>
                <TextInput
                  style={[styles.editableInput, styles.instructionsInput]}
                  value={
                    editedRecipe?.instructions
                      ?.map((inst: any) => inst.content)
                      .join("\n") || ""
                  }
                  onChangeText={(text) => {
                    const instructions = text
                      .split("\n")
                      .filter((line) => line.trim())
                      .map((content, index) => ({
                        step_number: index + 1,
                        content: content.trim(),
                      }));
                    updateEditedField("instructions", instructions);
                  }}
                  placeholder="Heat oil in a large pan\nAdd onions and cook until soft\nAdd remaining ingredients"
                  multiline
                  numberOfLines={8}
                />
              </>
            ) : (
              recipe.instructions.map((instruction, index) => (
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
              ))
            )}
          </View>
        ) : null}

        {recipe.notes || isEditing ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Notes
            </ThemedText>
            {isEditing ? (
              <TextInput
                style={[styles.editableInput, styles.notesInput]}
                value={editedRecipe?.notes || ""}
                onChangeText={(text) => updateEditedField("notes", text)}
                placeholder="Add any additional notes or comments about this recipe..."
                multiline
                numberOfLines={4}
              />
            ) : (
              <ThemedText style={styles.notes}>{recipe.notes}</ThemedText>
            )}
          </View>
        ) : null}
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
  editButton: {
    padding: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.borderLight,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
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
  editableInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  authorEditContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  authorLabel: {
    fontSize: 18,
    fontStyle: "italic",
    opacity: 0.7,
  },
  authorInput: {
    flex: 1,
    marginLeft: 4,
    fontSize: 18,
    fontStyle: "italic",
  },
  cuisineInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  tagsInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  ingredientsInput: {
    minHeight: 120,
    textAlignVertical: "top",
    fontFamily: "monospace",
  },
  instructionsInput: {
    minHeight: 160,
    textAlignVertical: "top",
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  editingInstructions: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontStyle: "italic",
  },
});
