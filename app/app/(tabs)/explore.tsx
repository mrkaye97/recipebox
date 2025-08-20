import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ManualRecipeForm } from "@/components/ManualRecipeForm";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useRecipes } from "@/hooks/useRecipes";
import { useUser } from "@/hooks/useUser";
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        { backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7" },
      ]}
      onPress={onPress}
    >
      <View style={styles.optionHeader}>
        <IconSymbol
          name={option.icon as any}
          size={24}
          color={Colors[colorScheme ?? "light"].tint}
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
      Alert.alert("Success", "Recipe imported successfully!", [
        {
          text: "OK",
          onPress: () => {
            onBack();
            router.push("/");
          },
        },
      ]);
    }
  };

  return (
    <ScrollView style={styles.formContainer}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={onBack}>
          <IconSymbol
            name="chevron.right"
            size={24}
            color={Colors.light.tint}
          />
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
      allowsEditing: true,
      aspect: [4, 3],
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
      allowsEditing: true,
      aspect: [4, 3],
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

    // Create the file object for the form data
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
      Alert.alert("Success", "Recipe created from cookbook photo!", [
        {
          text: "OK",
          onPress: () => {
            onBack();
            router.push("/");
          },
        },
      ]);
    }
  };

  return (
    <ScrollView style={styles.formContainer}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={onBack}>
          <IconSymbol name="chevron.left" size={24} color={Colors.light.tint} />
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
                <IconSymbol name="photo" size={24} color={Colors.light.tint} />
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
              <IconSymbol
                name="camera.fill"
                size={24}
                color={Colors.light.tint}
              />
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
    paddingTop: 60,
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginTop: 8,
  },
  optionsContainer: {
    padding: 20,
    gap: 16,
    paddingBottom: 100,
  },
  bottomSpacer: {
    height: 20,
  },
  optionCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  optionDescription: {
    opacity: 0.7,
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  messageText: {
    textAlign: "center",
    opacity: 0.7,
    marginTop: 16,
  },
  backButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  placeholder: {
    width: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    marginTop: 8,
  },
  imagePickerContent: {
    alignItems: "center",
    gap: 8,
  },
  imagePickerText: {
    fontSize: 16,
    color: "#666",
  },
  selectedImageContainer: {
    alignItems: "center",
    gap: 8,
  },
  selectedImagePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  imageSelectedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  changePhotoText: {
    fontSize: 14,
    color: "#666",
  },
});
