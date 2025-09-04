import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/design-system";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export interface RecipeCardProps {
  id: string;
  name: string;
  author: string;
  cuisine: string;
  timeEstimate: number;
  cookedAt?: string;
  userId?: string;
  userName?: string;
  currentUserId?: string;
  meal: string;
  type: string;
}

const formatCookedDate = (cookedAt: string) => {
  const date = new Date(cookedAt);
  const now = new Date();

  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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

export function RecipeCard({
  id,
  name,
  author,
  cuisine,
  timeEstimate,
  cookedAt,
  userId,
  userName,
  currentUserId,
  meal,
  type,
}: RecipeCardProps) {
  const handlePress = () => {
    if (isOtherUser && userId) {
      router.push(`/recipe/${id}?belongs_to_friend_user_id=${userId}`);
    } else {
      router.push(`/recipe/${id}`);
    }
  };

  const isOtherUser = userId && currentUserId && userId !== currentUserId;

  return (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.recipeCardContent}>
        <View style={styles.recipeHeader}>
          <ThemedText type="defaultSemiBold" style={styles.recipeName}>
            {name}
          </ThemedText>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={Colors.textSecondary}
          />
        </View>
        <ThemedText style={styles.recipeAuthor}>by {author}</ThemedText>
        <View style={styles.tagsContainer}>
          <View style={styles.cuisineContainer}>
            <ThemedText style={styles.recipeCuisine}>{cuisine}</ThemedText>
          </View>
          <View style={styles.mealContainer}>
            <ThemedText style={styles.recipeMeal}>{meal}</ThemedText>
          </View>
          <View style={styles.typeContainer}>
            <ThemedText style={styles.recipeType}>{type}</ThemedText>
          </View>
        </View>
        <View style={styles.timeContainer}>
          <IconSymbol name="clock" size={12} color={Colors.textSecondary} />
          <ThemedText style={styles.recipeTime}>{timeEstimate} min</ThemedText>
        </View>
        {cookedAt && (
          <View style={styles.cookedDateContainer}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={16}
              color={Colors.primary}
            />
            <ThemedText style={styles.cookedDateText}>
              {formatCookedDate(cookedAt)}
            </ThemedText>
          </View>
        )}
        {isOtherUser && userName && (
          <View style={styles.cookedByContainer}>
            <IconSymbol
              name="person.fill"
              size={16}
              color={Colors.textSecondary}
            />
            <ThemedText style={styles.cookedByText}>
              Cooked by {userName}
            </ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  recipeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 0,
    marginBottom: Spacing.lg,
    ...Shadows.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: "hidden",
  },
  recipeCardContent: {
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
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: "wrap",
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
  mealContainer: {
    backgroundColor: Colors.backgroundSubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  recipeMeal: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: Typography.letterSpacing.wide,
  },
  typeContainer: {
    backgroundColor: Colors.backgroundSubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  recipeType: {
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
    marginBottom: Spacing.md,
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
  cookedByContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.backgroundSubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
    marginTop: Spacing.sm,
  },
  cookedByText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.medium,
  },
});
