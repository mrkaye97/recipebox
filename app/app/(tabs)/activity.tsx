import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import { RecipeCard } from "@/components/recipe-card";
import { ActivitySkeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  Colors,
  Layout,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/design-system";
import { useActivity, Who } from "@/hooks/use-activity";
import { useUser } from "@/hooks/use-user";
import { components } from "@/src/lib/api/v1";
import { Redirect } from "expo-router";

type ActivityItem = components["schemas"]["ListRecentRecipeCooksRow"];

export default function ActivityScreen() {
  const { isAuthenticated, isLoading: isAuthLoading, userInfo } = useUser();
  const [who, setWho] = useState<Who>("me");

  const {
    recentCooks,
    isRecentCooksLoading,
    isRecentCooksError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useActivity({ who });

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!isAuthenticated && !isAuthLoading) {
    return <Redirect href={"/(tabs)/profile"} />;
  }

  const renderActivityContent = () => {
    if (
      (isRecentCooksLoading && (!recentCooks || recentCooks.length === 0)) ||
      isAuthLoading
    ) {
      return (
        <View style={styles.listContent}>
          {Array.from({ length: 4 }).map((_, index) => (
            <ActivitySkeleton key={index} />
          ))}
        </View>
      );
    }

    if (allItems.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ThemedText type="subtitle">No activity yet</ThemedText>
          <ThemedText style={styles.emptyStateText}>
            Start cooking some recipes to see your activity here!
          </ThemedText>
        </View>
      );
    }

    return (
      <FlatList
        data={allItems}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.id}-${item.cooked_at}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRecentCooksLoading}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListFooterComponent={
          hasNextPage ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : null
        }
      />
    );
  };

  if (isRecentCooksError) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContainer}>
          <ThemedText type="title">Error Loading Activity</ThemedText>
          <ThemedText style={styles.errorText}>
            Something went wrong loading your activity
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const allItems = recentCooks ?? [];

  const renderItem = ({ item }: { item: ActivityItem }) => (
    <RecipeCard
      id={item.id}
      name={item.name}
      author={item.author}
      cuisine={item.cuisine}
      timeEstimate={item.time_estimate_minutes}
      cookedAt={item.cooked_at}
      userId={item.user_id}
      userName={item.user_name}
      currentUserId={userInfo?.userId}
    />
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Activity</ThemedText>
        <View style={styles.switchContainer}>
          <ThemedText style={styles.switchLabel}>Include Friends</ThemedText>
          <Switch
            value={who === "both"}
            onValueChange={(value) => setWho(value ? "both" : "me")}
            trackColor={{
              false: Colors.backgroundSubtle,
              true: Colors.primary,
            }}
            thumbColor={Colors.surface}
          />
        </View>
      </View>

      {renderActivityContent()}
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
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  switchLabel: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["3xl"],
    marginTop: -120,
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
  listContent: {
    padding: Layout.screenPadding,
    paddingBottom: Layout.bottomPadding.list,
  },
  loadingFooter: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
});
