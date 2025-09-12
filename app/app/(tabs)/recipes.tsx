import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ManualRecipeForm } from "@/components/manual-recipe-form";
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
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";

type CreateOption = "online" | "manual" | "cookbook";

interface CreateOptionCard {
  type: CreateOption;
  title: string;
  description: string;
  icon: string;
}

const createOptions: CreateOptionCard[] = [
  {
    type: "online",
    title: "From URL",
    description: "Import a recipe from a cooking website",
    icon: "link",
  },
  {
    type: "manual",
    title: "Manual Entry",
    description: "Type in your recipe details manually",
    icon: "pencil",
  },
  {
    type: "cookbook",
    title: "Cookbook Photo",
    description: "Take a photo of a cookbook page",
    icon: "camera.fill",
  },
];

function CreateOptionButton({
  option,
  onPress,
}: {
  option: CreateOptionCard;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        {
          backgroundColor: Colors.surface,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.optionHeader}>
        <IconSymbol
          name={option.icon as any}
          size={24}
          color={Colors.primary}
        />
        <ThemedText type="subtitle">{option.title}</ThemedText>
      </View>
      <ThemedText style={styles.optionDescription}>
        {option.description}
      </ThemedText>
    </TouchableOpacity>
  );
}

function OnlineRecipeForm() {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const { create } = useRecipes();

  const handleSubmit = async () => {
    if (!url.trim()) {
      Alert.alert("Error", "Please enter a URL");
      return;
    }

    const recipeData = {
      location: "online" as const,
      url: url.trim(),
      notes: notes.trim() || null,
    };

    const response = await create.perform(recipeData);

    if (response) {
      setUrl("");
      setNotes("");
      router.push(`/recipe/${response.id}`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidContent}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
      >
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inputGroup}>
            <ThemedText type="defaultSemiBold">Recipe URL</ThemedText>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com/recipe"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!create.isPending}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="defaultSemiBold">Notes (optional)</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this recipe..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
              editable={!create.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            create.isPending && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={create.isPending}
        >
          <ThemedText style={styles.submitButtonText}>
            {create.isPending ? "Creating..." : "Import"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CookbookRecipeForm() {
  const [cookbookName, setCookbookName] = useState("");
  const [author, setAuthor] = useState("");
  const [pageNumber, setPageNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const { create } = useRecipes();

  const selectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera roll permission is required to select photos",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...newImages]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take photos",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImages((prev) => [...prev, result.assets[0].uri]);

      Alert.alert("Photo Added", "Would you like to take another photo?", [
        { text: "Done", style: "cancel" },
        { text: "Take Another", onPress: takePhoto },
      ]);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert("Add Photos", "Choose how you'd like to add photos", [
      { text: "Camera", onPress: takePhoto },
      { text: "Photo Library", onPress: selectImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const clearAllImages = () => {
    Alert.alert(
      "Clear All Photos",
      "Are you sure you want to remove all photos?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => setSelectedImages([]),
        },
      ],
    );
  };

  const handleSubmit = async () => {
    if (!cookbookName.trim()) {
      Alert.alert("Error", "Cookbook name is required");
      return;
    }

    if (!author.trim()) {
      Alert.alert("Error", "Author is required");
      return;
    }

    if (!pageNumber.trim()) {
      Alert.alert("Error", "Page number is required");
      return;
    }

    if (selectedImages.length === 0) {
      Alert.alert(
        "Error",
        "Please select or take at least one photo of the recipe",
      );
      return;
    }

    const imageFiles = selectedImages.map((imageUri, index) => {
      const filename =
        imageUri.split("/").pop() || `recipe-photo-${index + 1}.jpg`;
      return {
        uri: imageUri,
        type: "image/jpeg",
        name: filename,
      } as any;
    });

    const response = await create.perform({
      location: "cookbook" as const,
      files: imageFiles,
      author: author.trim(),
      cookbook_name: cookbookName.trim(),
      page_number: parseInt(pageNumber.trim()),
      notes: notes.trim() || null,
    });

    if (response) {
      setCookbookName("");
      setAuthor("");
      setPageNumber("");
      setNotes("");
      setSelectedImages([]);
      router.push(`/recipe/${response.id}`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidContent}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
      >
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inputGroup}>
            <ThemedText type="defaultSemiBold">Cookbook Name</ThemedText>
            <TextInput
              style={styles.input}
              value={cookbookName}
              onChangeText={setCookbookName}
              placeholder="e.g., Joy of Cooking"
              placeholderTextColor={Colors.textSecondary}
              editable={!create.isPending}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="defaultSemiBold">Author</ThemedText>
            <TextInput
              style={styles.input}
              value={author}
              onChangeText={setAuthor}
              placeholder="e.g., Julia Child"
              placeholderTextColor={Colors.textSecondary}
              editable={!create.isPending}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="defaultSemiBold">Page Number</ThemedText>
            <TextInput
              style={styles.input}
              value={pageNumber}
              onChangeText={setPageNumber}
              placeholder="e.g., 42"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
              editable={!create.isPending}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="defaultSemiBold">Notes (optional)</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this recipe..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
              editable={!create.isPending}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.photoSectionHeader}>
              <ThemedText type="defaultSemiBold">Recipe Photos</ThemedText>
              {selectedImages.length > 1 && (
                <TouchableOpacity onPress={clearAllImages}>
                  <ThemedText style={styles.clearAllText}>Clear All</ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {selectedImages.length > 0 && (
              <ScrollView
                horizontal
                style={styles.imageScrollContainer}
                showsHorizontalScrollIndicator={false}
              >
                {selectedImages.map((imageUri, index) => (
                  <View key={index} style={styles.selectedImageCard}>
                    <View style={styles.imagePreview}>
                      <IconSymbol
                        name="photo"
                        size={20}
                        color={Colors.primary}
                      />
                      <ThemedText style={styles.imageNumber}>
                        {index + 1}
                      </ThemedText>
                    </View>
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <IconSymbol
                        name="xmark.circle.fill"
                        size={20}
                        color="#FF6B6B"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={showImagePickerOptions}
              disabled={create.isPending}
            >
              <View style={styles.imagePickerContent}>
                <IconSymbol
                  name="camera.fill"
                  size={24}
                  color={Colors.primary}
                />
                <ThemedText style={styles.imagePickerText}>
                  {selectedImages.length > 0
                    ? `Add More Photos (${selectedImages.length} selected)`
                    : "Take Photos or Select from Library"}
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            create.isPending && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={create.isPending}
        >
          <ThemedText style={styles.submitButtonText}>
            {create.isPending ? "Creating..." : "Create"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CreateRecipeScreen() {
  const { option } = useLocalSearchParams<{ option?: CreateOption }>();
  const [selectedOption, setSelectedOption] = useState<CreateOption | null>(
    option || null,
  );
  const { isAuthenticated } = useUser();

  useEffect(() => {
    if (option) {
      setSelectedOption(option);
    }
  }, [option]);

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContainer}>
          <ThemedText type="title">Not Authenticated</ThemedText>
          <ThemedText style={styles.messageText}>
            Please log in to create recipes
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (option === "online" || selectedOption === "online") {
    return (
      <ThemedView style={styles.container}>
        <OnlineRecipeForm />
      </ThemedView>
    );
  }

  if (option === "manual" || selectedOption === "manual") {
    return <ManualRecipeForm onCancel={() => router.back()} />;
  }

  if (option === "cookbook" || selectedOption === "cookbook") {
    return (
      <ThemedView style={styles.container}>
        <CookbookRecipeForm />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Create a recipe</ThemedText>
      </View>

      <View style={styles.optionsContainer}>
        {createOptions.map((option) => (
          <CreateOptionButton
            key={option.type}
            option={option}
            onPress={() => setSelectedOption(option.type)}
          />
        ))}
        <View style={styles.bottomSpacer} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingTop: Layout.headerHeight,
  },
  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing["md"],
    alignItems: "center",
  },
  subtitle: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontSize: Typography.fontSizes.md,
    lineHeight: Typography.fontSizes.md * Typography.lineHeights.normal,
  },
  optionsContainer: {
    padding: Layout.screenPadding,
    gap: Spacing.xl,
    paddingBottom: Layout.bottomPadding.list,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
  optionCard: {
    backgroundColor: Colors.surface,
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.xl,
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  optionDescription: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.base,
    lineHeight: Typography.fontSizes.base * Typography.lineHeights.normal,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["3xl"],
  },
  messageText: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    fontSize: Typography.fontSizes.md,
    lineHeight: Typography.fontSizes.md * Typography.lineHeights.relaxed,
  },
  backButton: {
    backgroundColor: "#FF7A5C",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: "#FF7A5C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  backButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    backgroundColor: "#ffffff",
    marginHorizontal: -24,
    paddingHorizontal: 24,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.04)",
  },
  placeholder: {
    width: 24,
  },
  inputGroup: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.02)",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#ffffff",
    marginTop: 8,
    lineHeight: 22,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  submitButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#e9ecef",
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.08)",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    marginTop: 8,
  },
  imagePickerContent: {
    alignItems: "center",
    gap: 12,
  },
  imagePickerText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 22,
  },
  selectedImageContainer: {
    alignItems: "center",
    gap: 12,
  },
  selectedImagePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  imageSelectedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF7A5C",
  },
  changePhotoText: {
    fontSize: 14,
    color: "#6c757d",
  },
  photoSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  clearAllText: {
    fontSize: Typography.fontSizes.sm,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  imageScrollContainer: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  selectedImageCard: {
    width: 80,
    height: 80,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    ...Shadows.sm,
  },
  imagePreview: {
    alignItems: "center",
    gap: 4,
  },
  imageNumber: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary,
  },
  removeImageButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    padding: 2,
  },
  closeButton: {
    alignSelf: "flex-end",
    margin: Layout.screenPadding,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  keyboardAvoidContent: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Layout.screenPadding,
    paddingBottom: 120,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
