import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  BorderRadius,
  Colors,
  Layout,
  Spacing,
  Typography,
} from "@/constants/design-system";
import { useFriends } from "@/hooks/use-friends";
import { useRecipes } from "@/hooks/use-recipes";
import { components } from "@/src/lib/api/v1";
import React from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type User = components["schemas"]["src__schemas__User"];
type Recipe = components["schemas"]["src__schemas__Recipe"];

interface RecipeShareModalProps {
  visible: boolean;
  recipe: Recipe | null;
  onClose: () => void;
}

export function RecipeShareModal({
  visible,
  recipe,
  onClose,
}: RecipeShareModalProps) {
  const { friends } = useFriends({ query: "" });
  const { shareRecipe } = useRecipes();

  const friendsList = friends.data || [];

  const handleShareWithFriend = async (friend: User) => {
    if (!recipe) return;

    try {
      await shareRecipe.perform(
        recipe.id,
        friend.id,
        "outbound_share",
        undefined,
      );
    } catch (error) {
      console.error("Error sharing recipe:", error);
      Alert.alert("Error", "Failed to share recipe. Please try again.");
    }
  };

  const renderFriend = ({ item: friend }: { item: User }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => handleShareWithFriend(friend)}
      disabled={shareRecipe.isPending}
    >
      <View style={styles.friendInfo}>
        <ThemedText type="defaultSemiBold">{friend.name}</ThemedText>
        <ThemedText style={styles.friendEmail}>{friend.email}</ThemedText>
      </View>
      <IconSymbol
        name="arrow.right.circle"
        size={20}
        color={shareRecipe.isPending ? Colors.textSecondary : Colors.primary}
      />
    </TouchableOpacity>
  );

  if (!recipe) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Share Recipe
          </ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol
              name="xmark.circle.fill"
              size={28}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.recipeInfo}>
          <ThemedText type="subtitle" style={styles.recipeName}>
            {recipe.name}
          </ThemedText>
          <ThemedText style={styles.recipeAuthor}>
            by {recipe.author}
          </ThemedText>
        </View>

        <View style={styles.content}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Share with friends
          </ThemedText>

          {friendsList.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>
                You don&apos;t have any friends yet. Add some friends to share
                recipes!
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={friendsList}
              renderItem={renderFriend}
              keyExtractor={(friend) => friend.id}
              style={styles.friendsList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {shareRecipe.isPending && (
          <View style={styles.loadingOverlay}>
            <ThemedText style={styles.loadingText}>
              Sharing recipe...
            </ThemedText>
          </View>
        )}
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Layout.screenPadding,
    paddingTop: Layout.screenPadding + 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  recipeInfo: {
    padding: Layout.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  recipeName: {
    marginBottom: Spacing.xs,
  },
  recipeAuthor: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
  },
  content: {
    flex: 1,
    padding: Layout.screenPadding,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  friendsList: {
    flex: 1,
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  friendInfo: {
    flex: 1,
  },
  friendEmail: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Layout.screenPadding,
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.md,
  },
  loadingOverlay: {
    position: "absolute",
    bottom: Layout.screenPadding,
    left: Layout.screenPadding,
    right: Layout.screenPadding,
    backgroundColor: Colors.overlay,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
  },
  loadingText: {
    color: Colors.text,
    fontSize: Typography.fontSizes.sm,
  },
});
