import { PendingShareSkeleton } from "@/components/skeleton";
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
import { useRecipes } from "@/hooks/use-recipes";
import { components } from "@/src/lib/api/v1";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type PendingShare = components["schemas"]["ListPendingRecipeShareRequestsRow"];

export function PendingRecipeShares() {
  const { pendingShares, deleteShare } = useRecipes();

  const handleDeleteShare = async (
    recipeId: string,
    recipeName: string,
    fromUserName: string
  ) => {
    Alert.alert(
      "Delete Share",
      `Are you sure you want to delete the share for "${recipeName}" from ${fromUserName}?`,
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
              await deleteShare.perform(recipeId);
            } catch (error) {
              console.error("Error deleting share:", error);
              Alert.alert("Error", "Failed to delete share. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleViewRecipe = (recipeId: string) => {
    console.log("Viewing recipe:", recipeId);
    router.push(`/recipe/${recipeId}`);
  };

  const renderPendingShare = ({ item: share }: { item: PendingShare }) => (
    <View style={styles.shareCard}>
      <TouchableOpacity
        style={styles.shareInfo}
        onPress={() => handleViewRecipe(share.id)}
        activeOpacity={0.7}
      >
        <ThemedText type="defaultSemiBold" style={styles.recipeName}>
          {share.recipe_name}
        </ThemedText>
        <View style={styles.fromUser}>
          <IconSymbol
            name="person.circle"
            size={16}
            color={Colors.textSecondary}
          />
          <ThemedText style={styles.fromUserText}>
            from {share.from_user_name}
          </ThemedText>
        </View>
        <View style={styles.tapHint}>
          <IconSymbol
            name="arrow.right.circle"
            size={16}
            color={Colors.primary}
          />
          <ThemedText style={styles.tapHintText}>Tap to view recipe</ThemedText>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.deleteButton,
          deleteShare.isPending && styles.deleteButtonDisabled,
        ]}
        onPress={() =>
          handleDeleteShare(share.id, share.recipe_name, share.from_user_name)
        }
        disabled={deleteShare.isPending}
      >
        <IconSymbol
          name="trash"
          size={20}
          color={deleteShare.isPending ? Colors.textSecondary : "#EF4444"}
        />
      </TouchableOpacity>
    </View>
  );

  if (pendingShares.isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Pending Recipe Shares
          </ThemedText>
          {Array.from({ length: 2 }).map((_, index) => (
            <PendingShareSkeleton key={index} />
          ))}
        </View>
      </ThemedView>
    );
  }

  if (pendingShares.isError) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Pending Recipe Shares
          </ThemedText>
          <ThemedText style={styles.errorText}>
            Failed to load pending shares. Please try again.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const shares = pendingShares.data || [];

  if (shares.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Pending Recipe Shares
          </ThemedText>
          <View style={styles.emptyState}>
            <IconSymbol name="tray" size={32} color={Colors.textSecondary} />
            <ThemedText style={styles.emptyText}>
              No pending recipe shares
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              When friends share recipes with you, they&apos;ll appear here
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Pending Recipe Shares
        </ThemedText>
        <ThemedText style={styles.sectionSubtitle}>
          {shares.length} recipe{shares.length === 1 ? "" : "s"} shared with
          you. Tap a recipe to view and bookmark it.
        </ThemedText>

        <FlatList
          data={shares}
          renderItem={renderPendingShare}
          keyExtractor={(share) => share.recipe_name + share.from_user_name}
          style={styles.sharesList}
          contentContainerStyle={styles.sharesListContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Layout.screenPadding,
  },
  section: {
    gap: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    color: Colors.text,
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
    marginBottom: Spacing.sm,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.md,
    textAlign: "center",
    padding: Spacing["2xl"],
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSizes.md,
    textAlign: "center",
    padding: Spacing["2xl"],
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing["3xl"],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    opacity: 0.7,
  },
  sharesList: {
    maxHeight: 400,
  },
  sharesListContent: {
    gap: Spacing.lg,
  },
  shareCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  shareInfo: {
    flex: 1,
    marginRight: Spacing.md,
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  recipeName: {
    marginBottom: Spacing.xs,
    color: Colors.text,
  },
  fromUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  fromUserText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
  },
  fromUserEmail: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    opacity: 0.8,
  },
  deleteButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tapHintText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.primary,
    fontStyle: "italic",
  },
});
