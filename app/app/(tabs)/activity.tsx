import React, { useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

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
import { useActivity } from "@/hooks/use-activity";
import { useUser } from "@/hooks/use-user";
import { components } from "@/src/lib/api/v1";
import { Redirect, router } from "expo-router";

type ActivityItem = components["schemas"]["ListRecentRecipeCooksRow"];

interface ActivityCardProps {
  item: ActivityItem;
}

function ActivityCard({ item }: ActivityCardProps) {
  const handlePress = () => {
    router.push(`/recipe/${item.id}`);
  };

  const formatCookedDate = (cookedAt: string) => {
    const date = new Date(cookedAt);
    const now = new Date();

    const dateStart = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const nowStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const diffTime = nowStart.getTime() - dateStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Cooked today";
    } else if (diffDays === 1) {
      return "Cooked yesterday";
    } else if (diffDays > 1 && diffDays < 7) {
      return `Cooked ${diffDays} days ago`;
    } else if (diffDays < 0) {
      return `Cooked on ${date.toLocaleDateString()}`;
    } else {
      return `Cooked on ${date.toLocaleDateString()}`;
    }
  };

  return (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.activityCardContent}>
        <View style={styles.recipeHeader}>
          <ThemedText type="defaultSemiBold" style={styles.recipeName}>
            {item.name}
          </ThemedText>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={Colors.textSecondary}
          />
        </View>
        <ThemedText style={styles.recipeAuthor}>by {item.author}</ThemedText>
        <View style={styles.recipeMetadata}>
          <View style={styles.cuisineContainer}>
            <ThemedText style={styles.recipeCuisine}>{item.cuisine}</ThemedText>
          </View>
          <View style={styles.timeContainer}>
            <IconSymbol name="clock" size={12} color={Colors.textSecondary} />
            <ThemedText style={styles.recipeTime}>
              {item.time_estimate_minutes} min
            </ThemedText>
          </View>
        </View>
        <View style={styles.cookedDateContainer}>
          <IconSymbol
            name="checkmark.circle.fill"
            size={16}
            color={Colors.primary}
          />
          <ThemedText style={styles.cookedDateText}>
            {formatCookedDate(item.cooked_at)}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ActivityScreen() {
  const { isAuthenticated, isLoading: isAuthLoading } = useUser();
  const [includeFriends, setIncludeFriends] = useState(false);

  const { recentCooks, isRecentCooksLoading, isRecentCooksError } =
    useActivity();

  if (!isAuthenticated && !isAuthLoading) {
    return <Redirect href={"/(tabs)/profile"} />;
  }

  if (isRecentCooksLoading || isAuthLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContainer}>
          <ThemedText type="title">Loading Activity...</ThemedText>
        </View>
      </ThemedView>
    );
  }

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
    <ActivityCard item={item} />
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Activity</ThemedText>
        <View style={styles.switchContainer}>
          <ThemedText style={styles.switchLabel}>Include Friends</ThemedText>
          <Switch
            value={includeFriends}
            onValueChange={setIncludeFriends}
            trackColor={{
              false: Colors.backgroundSubtle,
              true: Colors.primary,
            }}
            thumbColor={Colors.surface}
          />
        </View>
      </View>

      {allItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <ThemedText type="subtitle">No activity yet</ThemedText>
          <ThemedText style={styles.emptyStateText}>
            Start cooking some recipes to see your activity here!
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={allItems}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.id}-${item.cooked_at}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRecentCooksLoading}
              onRefresh={() => {}}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        />
      )}
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
    padding: Spacing["3xl"],
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
  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 0,
    marginBottom: Spacing.lg,
    ...Shadows.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: "hidden",
  },
  activityCardContent: {
    padding: Spacing["2xl"],
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  recipeName: {
    flex: 1,
    fontSize: Typography.fontSizes["2xl"],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text,
    marginRight: Spacing.lg,
    lineHeight: Typography.fontSizes["2xl"] * Typography.lineHeights.tight,
    letterSpacing: Typography.letterSpacing.tight,
  },
  recipeAuthor: {
    fontSize: Typography.fontSizes.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontWeight: Typography.fontWeights.normal,
    lineHeight: Typography.fontSizes.base * Typography.lineHeights.normal,
  },
  recipeMetadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  cuisineContainer: {
    backgroundColor: Colors.backgroundSubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  recipeCuisine: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: Typography.letterSpacing.wide,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  recipeTime: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.medium,
  },
  cookedDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.backgroundSubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
  },
  cookedDateText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeights.medium,
  },
});
