import { RecipeShareModal } from "@/components/recipe-share-modal";
import { Skeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Dropdown, DropdownOption } from "@/components/ui/dropdown";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/design-system";
import { useActivity } from "@/hooks/use-activity";
import { useRecipeDetails } from "@/hooks/use-recipe-details";
import { useRecipes } from "@/hooks/use-recipes";
import { useUser } from "@/hooks/use-user";
import { components } from "@/src/lib/api/v1";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Keyboard,
  Linking,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type RecipeLocation = components["schemas"]["RecipeLocation"];
type DietaryRestriction = components["schemas"]["DietaryRestriction"];
type RecipeIngredient = components["schemas"]["RecipeIngredient"];
type RecipeInstruction = components["schemas"]["RecipeInstruction"];
type RecipeType = components["schemas"]["RecipeType"];
type RecipeMeal = components["schemas"]["Meal"];
type RecipePatch = components["schemas"]["RecipePatch"];

export const DIETARY_RESTRICTIONS: {
  value: DietaryRestriction;
  label: string;
}[] = [
  { value: "dairy_free", label: "Dairy Free" },
  { value: "gluten_free", label: "Gluten Free" },
  { value: "nut_free", label: "Nut Free" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "vegan", label: "Vegan" },
  { value: "vegetarian", label: "Vegetarian" },
];

export const RECIPE_TYPES: { value: RecipeType; label: string }[] = [
  { value: "cocktail", label: "Cocktail" },
  { value: "condiment", label: "Condiment" },
  { value: "dessert", label: "Dessert" },
  { value: "main", label: "Main" },
  { value: "other", label: "Other" },
  { value: "salad", label: "Salad" },
  { value: "snack", label: "Snack" },
  { value: "starter", label: "Starter" },
];

export const RECIPE_MEALS: { value: RecipeMeal; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "dinner", label: "Dinner" },
  { value: "lunch", label: "Lunch" },
  { value: "other", label: "Other" },
];

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
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const [ingredientsCollapsed, setIngredientsCollapsed] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [justMarkedCooked, setJustMarkedCooked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState<RecipePatch | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();

  const { data: recipe, isLoading, refetch } = useRecipeDetails(id);
  const {
    updateRecipe: { perform: updateRecipe, isPending: isUpdating },
    deleteRecipe: { perform: deleteRecipe, isPending: isDeleting },
    shareRecipe,
    acceptShare,
    deleteShare,
  } = useRecipes();
  const { userInfo } = useUser();
  const {
    markAsCookedRecently: {
      perform: markAsCookedRecently,
      isPending: isMarkingCooked,
    },
  } = useActivity({ who: "me" });

  const belongsToCurrentUser =
    !!recipe && !!userInfo && recipe?.user_id === userInfo?.id;

  const handleBack = async () => {
    router.back();
    await queryClient.invalidateQueries({
      queryKey: ["get", "/recipes/recommendation"],
    });
  };

  const handleMarkAsCooked = async () => {
    if (!recipe || !id) return;

    try {
      await markAsCookedRecently(id);
      setJustMarkedCooked(true);
      Alert.alert("Success", `You've marked "${recipe.name}" as cooked!`);
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

  const handleSaveRecipe = async () => {
    if (!recipe || !userInfo || belongsToCurrentUser) return;

    setIsSaving(true);
    const shareRequest = await shareRecipe.perform(
      recipe.id,
      userInfo.id,
      "download_button",
      recipe.user_id,
    );

    try {
      if (shareRequest?.token) {
        try {
          await acceptShare.perform(shareRequest.token);

          Alert.alert("Success", "Recipe saved to your collection!", [
            {
              text: "OK",
              style: "default",
            },
          ]);
        } catch (acceptError) {
          if (shareRequest.token) {
            try {
              await deleteShare.perform(shareRequest.token);
            } catch (deleteError) {
              console.error("Error cleaning up share request:", deleteError);
            }
          }
          throw acceptError;
        }
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      Alert.alert("Error", "Failed to save recipe. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseShareModal = () => {
    setShareModalVisible(false);
  };

  const handleDeleteRecipe = async () => {
    if (!recipe) return;

    Alert.alert(
      "Delete Recipe",
      "Are you sure you want to delete this recipe? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRecipe(recipe.id);
              router.back();
            } catch (error) {
              console.error("Error deleting recipe:", error);
              Alert.alert(
                "Error",
                "Failed to delete recipe. Please try again.",
              );
            }
          },
        },
      ],
    );
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
        dietary_restrictions_met: recipe.dietary_restrictions_met || [],
        location: recipe.location,
        meal: recipe.meal,
        type: recipe.type,
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedRecipe(null);
  };

  const handleSaveEdit = async () => {
    if (!editedRecipe || !id || !recipe) return;

    try {
      const completeUpdate = {
        name: editedRecipe.name,
        author: editedRecipe.author,
        cuisine: editedRecipe.cuisine,
        notes: editedRecipe.notes || null,
        tags:
          editedRecipe.tags && editedRecipe.tags.length > 0
            ? editedRecipe.tags.filter((tag: string) => tag.trim().length > 0)
            : null,
        ingredients:
          editedRecipe.ingredients && editedRecipe.ingredients.length > 0
            ? editedRecipe.ingredients
            : null,
        instructions:
          editedRecipe.instructions && editedRecipe.instructions.length > 0
            ? editedRecipe.instructions
            : null,
        time_estimate_minutes: editedRecipe.time_estimate_minutes,
        dietary_restrictions_met: recipe.dietary_restrictions_met,
        location: recipe.location,
        meal: editedRecipe.meal,
        type: editedRecipe.type,
      };

      await updateRecipe(id, completeUpdate);
      await refetch();
      setIsEditing(false);
      setEditedRecipe(null);

      scrollViewRef.current?.scrollTo({ y: 0, animated: true });

      Alert.alert("Success", "Recipe updated successfully!");
    } catch {
      Alert.alert("Error", "Failed to update recipe");
    }
  };

  const updateEditedField = (
    field: keyof RecipePatch,
    value:
      | string
      | number
      | string[]
      | RecipeIngredient[]
      | RecipeInstruction[]
      | DietaryRestriction[]
      | RecipeType
      | RecipeMeal
      | null,
  ) => {
    if (editedRecipe) {
      setEditedRecipe({ ...editedRecipe, [field]: value });
    }
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    if (editedRecipe?.ingredients) {
      const updatedIngredients = [...editedRecipe.ingredients];
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: field === "quantity" ? parseFloat(value) || 0 : value,
      };
      setEditedRecipe({ ...editedRecipe, ingredients: updatedIngredients });
    }
  };

  const deleteIngredient = (index: number) => {
    if (editedRecipe?.ingredients) {
      const updatedIngredients = editedRecipe.ingredients.filter(
        (_: RecipeIngredient, i: number) => i !== index,
      );
      setEditedRecipe({ ...editedRecipe, ingredients: updatedIngredients });
    }
  };

  const addIngredient = () => {
    if (editedRecipe) {
      const newIngredient = { quantity: 0, units: "", name: "" };
      const updatedIngredients = [
        ...(editedRecipe.ingredients || []),
        newIngredient,
      ];
      setEditedRecipe({ ...editedRecipe, ingredients: updatedIngredients });
    }
  };

  const updateInstruction = (index: number, content: string) => {
    if (editedRecipe?.instructions) {
      const updatedInstructions = [...editedRecipe.instructions];
      updatedInstructions[index] = { ...updatedInstructions[index], content };
      setEditedRecipe({ ...editedRecipe, instructions: updatedInstructions });
    }
  };

  const deleteInstruction = (index: number) => {
    if (editedRecipe?.instructions) {
      const updatedInstructions = editedRecipe.instructions
        .filter((_: RecipeInstruction, i: number) => i !== index)
        .map((instruction: RecipeInstruction, newIndex: number) => ({
          ...instruction,
          step_number: newIndex + 1,
        }));
      setEditedRecipe({ ...editedRecipe, instructions: updatedInstructions });
    }
  };

  const addInstruction = () => {
    if (editedRecipe) {
      const newInstruction = {
        step_number: (editedRecipe.instructions?.length || 0) + 1,
        content: "",
      };
      const updatedInstructions = [
        ...(editedRecipe.instructions || []),
        newInstruction,
      ];
      setEditedRecipe({ ...editedRecipe, instructions: updatedInstructions });
    }
  };

  const moveInstructionUp = (index: number) => {
    if (!editedRecipe?.instructions || index === 0) return;

    const instructions = [...editedRecipe.instructions];
    const [movedItem] = instructions.splice(index, 1);
    instructions.splice(index - 1, 0, movedItem);

    const updatedInstructions = instructions.map((instruction, idx) => ({
      ...instruction,
      step_number: idx + 1,
    }));

    setEditedRecipe({ ...editedRecipe, instructions: updatedInstructions });
  };

  const moveInstructionDown = (index: number) => {
    if (
      !editedRecipe?.instructions ||
      index === editedRecipe.instructions.length - 1
    )
      return;

    const instructions = [...editedRecipe.instructions];
    const [movedItem] = instructions.splice(index, 1);
    instructions.splice(index + 1, 0, movedItem);

    const updatedInstructions = instructions.map((instruction, idx) => ({
      ...instruction,
      step_number: idx + 1,
    }));

    setEditedRecipe({ ...editedRecipe, instructions: updatedInstructions });
  };

  const updateTag = (index: number, value: string) => {
    if (editedRecipe?.tags) {
      const updatedTags = [...editedRecipe.tags];
      updatedTags[index] = value;
      setEditedRecipe({ ...editedRecipe, tags: updatedTags });
    }
  };

  const deleteTag = (index: number) => {
    if (editedRecipe?.tags) {
      const updatedTags = editedRecipe.tags.filter(
        (_: string, i: number) => i !== index,
      );
      setEditedRecipe({ ...editedRecipe, tags: updatedTags });
    }
  };

  const addTag = () => {
    if (editedRecipe) {
      const updatedTags = [...(editedRecipe.tags || []), ""];
      setEditedRecipe({ ...editedRecipe, tags: updatedTags });
    }
  };

  const toggleDietaryRestriction = (restriction: DietaryRestriction) => {
    if (!editedRecipe) return;

    const currentRestrictions = editedRecipe.dietary_restrictions_met || [];
    const isSelected = currentRestrictions.includes(restriction);

    const updatedRestrictions = isSelected
      ? currentRestrictions.filter((r: DietaryRestriction) => r !== restriction)
      : [...currentRestrictions, restriction];

    setEditedRecipe({
      ...editedRecipe,
      dietary_restrictions_met: updatedRestrictions,
    });
  };

  const mealOptions: DropdownOption[] = RECIPE_MEALS.map((meal) => ({
    label: meal.label,
    value: meal.value,
  }));

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.recipeHeader}>
            <Skeleton
              width="100%"
              height={250}
              borderRadius={0}
              style={styles.imageSkeleton}
            />
          </View>
          <Skeleton width="80%" height={32} style={styles.titleSkeleton} />
          <Skeleton width="60%" height={20} style={styles.subtitleSkeleton} />
          <View style={styles.metaContainer}>
            <Skeleton width={100} height={16} />
            <Skeleton width={80} height={16} />
          </View>
          <Skeleton
            width="100%"
            height={100}
            style={styles.descriptionSkeleton}
          />
          <Skeleton
            width="100%"
            height={150}
            style={styles.ingredientsSkeleton}
          />
        </ScrollView>
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backIconButton}>
            <IconSymbol
              name="chevron.left"
              size={24}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            {isEditing ? "Edit Recipe" : ""}
          </ThemedText>
          <View style={styles.headerActions}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  style={styles.cancelButton}
                >
                  <ThemedText style={styles.cancelButtonText}>
                    Cancel
                  </ThemedText>
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
            ) : !belongsToCurrentUser ? (
              <>
                <TouchableOpacity
                  onPress={handleSaveRecipe}
                  disabled={isSaving}
                  style={styles.saveRecipeButton}
                >
                  <IconSymbol
                    name="bookmark"
                    size={24}
                    color={Colors.primary}
                  />
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
                  onPress={handleDeleteRecipe}
                  disabled={isDeleting}
                  style={styles.deleteButton}
                >
                  <IconSymbol
                    name="trash"
                    size={24}
                    color={isDeleting ? Colors.textSecondary : "#EF4444"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleMarkAsCooked}
                  disabled={isMarkingCooked}
                  style={styles.cookedButton}
                >
                  <IconSymbol
                    name={"frying.pan"}
                    size={24}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.recipeHeader}>
          {isEditing ? (
            <>
              <TextInput
                style={[styles.recipeName, styles.editableInput]}
                value={editedRecipe?.name || ""}
                onChangeText={(text) => updateEditedField("name", text)}
                placeholder="Recipe name"
                placeholderTextColor={Colors.textSecondary}
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
                  placeholderTextColor={Colors.textSecondary}
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
                  placeholderTextColor={Colors.textSecondary}
                />
              ) : (
                <ThemedText style={styles.infoValue} numberOfLines={1}>
                  {recipe.cuisine}
                </ThemedText>
              )}
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="clock" size={16} color={Colors.primary} />
              <ThemedText style={styles.infoLabel}>Time:</ThemedText>
              {isEditing ? (
                <View style={styles.timeEditContainer}>
                  <TextInput
                    style={[styles.editableInput, styles.timeInput]}
                    value={String(editedRecipe?.time_estimate_minutes || "")}
                    onChangeText={(text) =>
                      updateEditedField(
                        "time_estimate_minutes",
                        parseInt(text) || 0,
                      )
                    }
                    placeholder="30"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                  />
                  <ThemedText style={styles.timeLabel}>min</ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.infoValue}>
                  {recipe.time_estimate_minutes} min
                </ThemedText>
              )}
            </View>
          </View>

          <View style={styles.recipeBasicInfo}>
            <View style={styles.infoItem}>
              <IconSymbol name="calendar" size={16} color={Colors.primary} />
              <ThemedText style={styles.infoLabel}>Meal:</ThemedText>
              {isEditing ? (
                <View style={styles.dropdownContainer}>
                  <Dropdown
                    options={mealOptions}
                    value={editedRecipe?.meal || undefined}
                    onValueChange={(value) =>
                      updateEditedField("meal", value || null)
                    }
                    placeholder="Select meal"
                  />
                </View>
              ) : (
                <ThemedText style={styles.infoValue}>
                  {recipe.meal.charAt(0).toUpperCase() + recipe.meal.slice(1)}
                </ThemedText>
              )}
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="tag" size={16} color={Colors.primary} />
              <ThemedText style={styles.infoLabel}>Type:</ThemedText>
              {isEditing ? (
                <View style={styles.dropdownContainer}>
                  <Dropdown
                    options={RECIPE_TYPES}
                    value={editedRecipe?.type || undefined}
                    onValueChange={(value) =>
                      updateEditedField("type", value || null)
                    }
                    placeholder="Select type"
                  />
                </View>
              ) : (
                <ThemedText style={styles.infoValue}>
                  {recipe.type.charAt(0).toUpperCase() + recipe.type.slice(1)}
                </ThemedText>
              )}
            </View>
          </View>
        </View>

        <RecipeLocationUI location={recipe.location} />

        {(recipe.tags && recipe.tags.length > 0) || isEditing ? (
          <View style={styles.section}>
            {isEditing ? (
              <>
                <View style={styles.sectionHeaderWithButton}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Tags
                  </ThemedText>
                  <TouchableOpacity onPress={addTag} style={styles.addButton}>
                    <IconSymbol
                      name="plus.circle"
                      size={24}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.editableItemsList}>
                  {editedRecipe?.tags?.map((tag: string, index: number) => (
                    <View key={index} style={styles.editableTagRow}>
                      <TextInput
                        style={[styles.editableInput, styles.tagInput]}
                        value={tag}
                        onChangeText={(text) => updateTag(index, text)}
                        placeholder="Enter tag"
                        placeholderTextColor={Colors.textSecondary}
                      />
                      <TouchableOpacity
                        onPress={() => deleteTag(index)}
                        style={styles.deleteButton}
                      >
                        <IconSymbol
                          name="xmark.circle"
                          size={20}
                          color="#FF6B6B"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {(!editedRecipe?.tags || editedRecipe.tags.length === 0) && (
                    <TouchableOpacity
                      onPress={addTag}
                      style={styles.emptyStateButton}
                    >
                      <ThemedText style={styles.emptyStateText}>
                        + Add first tag
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                  {editedRecipe?.tags && editedRecipe.tags.length > 0 && (
                    <TouchableOpacity
                      onPress={addTag}
                      style={styles.addMoreButton}
                    >
                      <IconSymbol
                        name="plus.circle"
                        size={20}
                        color={Colors.primary}
                      />
                      <ThemedText style={styles.addMoreText}>
                        Add tag
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : (
              <>
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
              </>
            )}
          </View>
        ) : null}

        {(recipe.dietary_restrictions_met &&
          recipe.dietary_restrictions_met.length > 0) ||
        isEditing ? (
          <View style={styles.section}>
            {isEditing ? (
              <>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Dietary Restrictions
                </ThemedText>
                <View style={styles.checkboxList}>
                  {DIETARY_RESTRICTIONS.map((restriction) => {
                    const isSelected = (
                      editedRecipe?.dietary_restrictions_met || []
                    ).includes(restriction.value);
                    return (
                      <TouchableOpacity
                        key={restriction.value}
                        style={styles.checkboxRow}
                        onPress={() =>
                          toggleDietaryRestriction(restriction.value)
                        }
                      >
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected,
                          ]}
                        >
                          {isSelected && (
                            <IconSymbol
                              name="checkmark"
                              size={16}
                              color="#fff"
                            />
                          )}
                        </View>
                        <ThemedText style={styles.checkboxLabel}>
                          {restriction.label}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Dietary Restrictions
                </ThemedText>
                <View style={styles.restrictionsContainer}>
                  {recipe.dietary_restrictions_met.map((restriction, index) => (
                    <View key={index} style={styles.restriction}>
                      <IconSymbol
                        name="heart"
                        size={16}
                        color={Colors.primary}
                      />
                      <ThemedText style={styles.restrictionText}>
                        {restriction.replace("_", " ").toUpperCase()}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        ) : null}

        {(recipe.ingredients && recipe.ingredients.length > 0) || isEditing ? (
          <View style={styles.section}>
            {isEditing ? (
              <>
                <View style={styles.sectionHeaderWithButton}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Ingredients
                  </ThemedText>
                  <TouchableOpacity
                    onPress={addIngredient}
                    style={styles.addButton}
                  >
                    <IconSymbol
                      name="plus.circle"
                      size={24}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.editableItemsList}>
                  {editedRecipe?.ingredients?.map(
                    (ingredient: RecipeIngredient, index: number) => (
                      <View key={index} style={styles.editableIngredientRow}>
                        <View style={styles.ingredientInputs}>
                          <TextInput
                            style={[styles.editableInput, styles.quantityInput]}
                            value={String(ingredient.quantity || "")}
                            onChangeText={(text) =>
                              updateIngredient(index, "quantity", text)
                            }
                            placeholder="1"
                            placeholderTextColor={Colors.textSecondary}
                          />
                          <TextInput
                            style={[styles.editableInput, styles.unitsInput]}
                            value={ingredient.units}
                            onChangeText={(text) =>
                              updateIngredient(index, "units", text)
                            }
                            placeholder="cup"
                            placeholderTextColor={Colors.textSecondary}
                          />
                          <TextInput
                            style={[styles.editableInput, styles.nameInput]}
                            value={ingredient.name}
                            onChangeText={(text) =>
                              updateIngredient(index, "name", text)
                            }
                            placeholder="ingredient name"
                            placeholderTextColor={Colors.textSecondary}
                          />
                        </View>
                        <TouchableOpacity
                          onPress={() => deleteIngredient(index)}
                          style={styles.deleteButton}
                        >
                          <IconSymbol
                            name="xmark.circle"
                            size={20}
                            color="#FF6B6B"
                          />
                        </TouchableOpacity>
                      </View>
                    ),
                  )}
                  {(!editedRecipe?.ingredients ||
                    editedRecipe.ingredients.length === 0) && (
                    <TouchableOpacity
                      onPress={addIngredient}
                      style={styles.emptyStateButton}
                    >
                      <ThemedText style={styles.emptyStateText}>
                        + Add first ingredient
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                  {editedRecipe?.ingredients &&
                    editedRecipe.ingredients.length > 0 && (
                      <TouchableOpacity
                        onPress={addIngredient}
                        style={styles.addMoreButton}
                      >
                        <IconSymbol
                          name="plus.circle"
                          size={20}
                          color={Colors.primary}
                        />
                        <ThemedText style={styles.addMoreText}>
                          Add ingredient
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                </View>
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
            {isEditing ? (
              <>
                <View style={styles.sectionHeaderWithButton}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Instructions
                  </ThemedText>
                  <TouchableOpacity
                    onPress={addInstruction}
                    style={styles.addButton}
                  >
                    <IconSymbol
                      name="plus.circle"
                      size={24}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.editableItemsList}>
                  {editedRecipe?.instructions?.map(
                    (instruction: RecipeInstruction, index: number) => (
                      <View key={index} style={styles.editableInstructionRow}>
                        <View style={styles.stepNumber}>
                          <ThemedText style={styles.stepNumberText}>
                            {instruction.step_number}
                          </ThemedText>
                        </View>
                        <TextInput
                          style={[
                            styles.editableInput,
                            styles.instructionContentInput,
                          ]}
                          value={instruction.content}
                          onChangeText={(text) =>
                            updateInstruction(index, text)
                          }
                          placeholder="Enter instruction step..."
                          placeholderTextColor={Colors.textSecondary}
                          multiline
                        />
                        <View style={styles.instructionControls}>
                          <TouchableOpacity
                            onPress={() => moveInstructionUp(index)}
                            style={[
                              styles.reorderButton,
                              index === 0 && styles.disabledButton,
                            ]}
                            disabled={index === 0}
                          >
                            <IconSymbol
                              name="chevron.up"
                              size={16}
                              color={index === 0 ? "#ccc" : Colors.primary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => moveInstructionDown(index)}
                            style={[
                              styles.reorderButton,
                              index ===
                                (editedRecipe?.instructions?.length || 0) - 1 &&
                                styles.disabledButton,
                            ]}
                            disabled={
                              index ===
                              (editedRecipe?.instructions?.length || 0) - 1
                            }
                          >
                            <IconSymbol
                              name="chevron.down"
                              size={16}
                              color={
                                index ===
                                (editedRecipe?.instructions?.length || 0) - 1
                                  ? "#ccc"
                                  : Colors.primary
                              }
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => deleteInstruction(index)}
                            style={styles.deleteButton}
                          >
                            <IconSymbol
                              name="xmark.circle"
                              size={20}
                              color="#FF6B6B"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ),
                  )}
                  {(!editedRecipe?.instructions ||
                    editedRecipe.instructions.length === 0) && (
                    <TouchableOpacity
                      onPress={addInstruction}
                      style={styles.emptyStateButton}
                    >
                      <ThemedText style={styles.emptyStateText}>
                        + Add first instruction
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                  {editedRecipe?.instructions &&
                    editedRecipe.instructions.length > 0 && (
                      <TouchableOpacity
                        onPress={addInstruction}
                        style={styles.addMoreButton}
                      >
                        <IconSymbol
                          name="plus.circle"
                          size={20}
                          color={Colors.primary}
                        />
                        <ThemedText style={styles.addMoreText}>
                          Add step
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                </View>
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
                placeholderTextColor={Colors.textSecondary}
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
    paddingBottom: 16,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
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
  deleteButton: {
    padding: 8,
  },
  saveRecipeButton: {
    padding: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 0.5,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.3,
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
    marginTop: 24,
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
    flexWrap: "wrap",
    gap: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
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
    flexShrink: 1,
    maxWidth: 120,
  },
  recipeName: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 8,
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
    marginBottom: 40,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: Colors.borderLight,
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
    borderWidth: 0.5,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: Colors.surface,
    color: Colors.text,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
  sectionHeaderWithButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addButton: {
    padding: 4,
  },
  editableItemsList: {
    gap: 12,
  },
  editableIngredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  ingredientInputs: {
    flexDirection: "row",
    flex: 1,
    gap: 8,
  },
  quantityInput: {
    width: 60,
    textAlign: "center",
  },
  unitsInput: {
    width: 80,
  },
  nameInput: {
    flex: 1,
  },
  editableInstructionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 4,
  },
  instructionContentInput: {
    flex: 1,
    minHeight: 40,
    textAlignVertical: "top",
  },
  emptyStateButton: {
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  emptyStateText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  instructionControls: {
    flexDirection: "column",
    gap: 2,
  },
  reorderButton: {
    padding: 4,
    borderRadius: 4,
  },
  disabledButton: {
    opacity: 0.3,
  },
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    backgroundColor: "transparent",
    gap: 8,
  },
  addMoreText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  timeEditContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 8,
    gap: 4,
  },
  timeInput: {
    width: 60,
    textAlign: "center",
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  dropdownContainer: {
    flex: 1,
    marginLeft: 8,
  },
  editableTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  tagInput: {
    flex: 1,
  },
  checkboxList: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: 16,
    flex: 1,
  },
  imageSkeleton: {
    marginBottom: 20,
  },
  titleSkeleton: {
    marginBottom: 8,
  },
  subtitleSkeleton: {
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  descriptionSkeleton: {
    marginBottom: 24,
  },
  ingredientsSkeleton: {
    marginBottom: 20,
  },
  prominentCookButton: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  cookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cookButtonSuccess: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  cookButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  cookButtonTextSuccess: {
    color: "#fff",
  },
});
