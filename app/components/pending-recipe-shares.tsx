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
  const { pendingShares, acceptShare, deleteShare } = useRecipes();

  const handleAcceptShare = async (share: PendingShare) => {
    try {
      await acceptShare.perform(share.token);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "detail" in error &&
        (error as { detail?: string }).detail === "duplicate"
      ) {
        await deleteShare.perform(share.token);
        return;
      }
      console.error("Error accepting recipe share:", error);
      Alert.alert("Error", "Failed to accept recipe share. Please try again.");
    }
  };

  const renderPendingShare = ({ item: share }: { item: PendingShare }) => (
    <View style={styles.shareCard}>
      <View style={styles.shareInfo}>
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
        <ThemedText style={styles.fromUserEmail}>
          {share.from_user_email}
        </ThemedText>
      </View>

      <TouchableOpacity
        style={[
          styles.acceptButton,
          acceptShare.isPending &&
            acceptShare.pendingAcceptShareToken === share.token &&
            styles.acceptButtonDisabled,
        ]}
        onPress={() => handleAcceptShare(share)}
        disabled={acceptShare.isPending}
      >
        <IconSymbol
          name="checkmark.circle"
          size={20}
          color={
            acceptShare.isPending &&
            acceptShare.pendingAcceptShareToken === share.token
              ? Colors.textSecondary
              : Colors.surface
          }
        />
        <ThemedText style={styles.acceptButtonText}>
          {acceptShare.isPending &&
          acceptShare.pendingAcceptShareToken === share.token
            ? "Adding..."
            : "Accept"}
        </ThemedText>
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
          {shares.length} recipe{shares.length === 1 ? "" : "s"} shared with you
        </ThemedText>

        <FlatList
          data={shares}
          renderItem={renderPendingShare}
          keyExtractor={(share) => share.token}
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
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  acceptButtonDisabled: {
    backgroundColor: Colors.buttonDisabled,
  },
  acceptButtonText: {
    color: Colors.surface,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
  },
});
