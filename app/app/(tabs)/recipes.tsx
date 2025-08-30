import React, { useState } from "react";
import {
  Alert,
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
import { router } from "expo-router";

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

function OnlineRecipeForm({ onBack }: { onBack: () => void }) {
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
      router.push(`/recipe/${response.id}`);
    }
  };

  return (
    <ScrollView style={styles.formContainer}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={onBack}>
          <IconSymbol name="chevron.left" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <ThemedText type="title">Import from URL</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="defaultSemiBold">Recipe URL</ThemedText>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://example.com/recipe"
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
          multiline
          numberOfLines={4}
          editable={!create.isPending}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          create.isPending && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={create.isPending}
      >
        <ThemedText style={styles.submitButtonText}>
          {create.isPending ? "Creating..." : "Import Recipe"}
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

function CookbookRecipeForm({ onBack }: { onBack: () => void }) {
  const [cookbookName, setCookbookName] = useState("");
  const [author, setAuthor] = useState("");
  const [pageNumber, setPageNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
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
      setSelectedImage(result.assets[0].uri);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert("Select Photo", "Choose how you'd like to add a photo", [
      { text: "Camera", onPress: takePhoto },
      { text: "Photo Library", onPress: selectImage },
      { text: "Cancel", style: "cancel" },
    ]);
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

    if (!selectedImage) {
      Alert.alert("Error", "Please select or take a photo of the recipe");
      return;
    }

    const imageUri = selectedImage;
    const filename = imageUri.split("/").pop() || "recipe-photo.jpg";
    const imageFile = {
      uri: imageUri,
      type: "image/jpeg",
      name: filename,
    } as any;

    const response = await create.perform({
      location: "cookbook" as const,
      file: imageFile,
      author: author.trim(),
      cookbook_name: cookbookName.trim(),
      page_number: parseInt(pageNumber.trim()),
      notes: notes.trim() || null,
    });

    if (response) {
      router.push(`/recipe/${response.id}`);
    }
  };

  return (
    <ScrollView style={styles.formContainer}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={onBack}>
          <IconSymbol name="chevron.left" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <ThemedText type="title">Cookbook Photo</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="defaultSemiBold">Cookbook Name</ThemedText>
        <TextInput
          style={styles.input}
          value={cookbookName}
          onChangeText={setCookbookName}
          placeholder="e.g., Joy of Cooking"
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
          multiline
          numberOfLines={4}
          editable={!create.isPending}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="defaultSemiBold">Recipe Photo</ThemedText>
        <TouchableOpacity
          style={styles.imagePickerButton}
          onPress={showImagePickerOptions}
          disabled={create.isPending}
        >
          {selectedImage ? (
            <View style={styles.selectedImageContainer}>
              <View style={styles.selectedImagePreview}>
                <IconSymbol name="photo" size={24} color={Colors.primary} />
                <ThemedText style={styles.imageSelectedText}>
                  Photo Selected
                </ThemedText>
              </View>
              <ThemedText style={styles.changePhotoText}>
                Tap to change
              </ThemedText>
            </View>
          ) : (
            <View style={styles.imagePickerContent}>
              <IconSymbol name="camera.fill" size={24} color={Colors.primary} />
              <ThemedText style={styles.imagePickerText}>
                Take Photo or Select from Library
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          create.isPending && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={create.isPending}
      >
        <ThemedText style={styles.submitButtonText}>
          {create.isPending ? "Creating..." : "Create Recipe"}
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function CreateRecipeScreen() {
  const [selectedOption, setSelectedOption] = useState<CreateOption | null>(
    null,
  );
  const { isAuthenticated } = useUser();

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

  if (selectedOption === "online") {
    return (
      <ThemedView style={styles.container}>
        <OnlineRecipeForm onBack={() => setSelectedOption(null)} />
      </ThemedView>
    );
  }

  if (selectedOption === "manual") {
    return <ManualRecipeForm onCancel={() => setSelectedOption(null)} />;
  }

  if (selectedOption === "cookbook") {
    return (
      <ThemedView style={styles.container}>
        <CookbookRecipeForm onBack={() => setSelectedOption(null)} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Create Recipe</ThemedText>
        <ThemedText style={styles.subtitle}>
          Choose how you&apos;d like to add a new recipe
        </ThemedText>
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
    backgroundColor: Colors.backgroundSubtle,
    paddingTop: Layout.headerHeight,
  },
  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing["3xl"],
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.sm,
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
    paddingHorizontal: 24,
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
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 32,
    marginBottom: 96,
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
});
