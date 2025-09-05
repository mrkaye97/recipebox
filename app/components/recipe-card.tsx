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
            <ThemedText style={styles.recipeCuisine} numberOfLines={1}>
              {cuisine}
            </ThemedText>
          </View>
          <View style={styles.mealContainer}>
            <ThemedText style={styles.recipeMeal}>{meal}</ThemedText>
          </View>
          <View style={styles.typeContainer}>
            <ThemedText style={styles.recipeType}>{type}</ThemedText>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.timeContainer}>
            <IconSymbol name="clock" size={14} color={Colors.textSecondary} />
            <ThemedText style={styles.recipeTime}>
              {timeEstimate} min
            </ThemedText>
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
        </View>
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
    borderRadius: BorderRadius["2xl"],
    padding: 0,
    marginBottom: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: "hidden",
    transform: [{ scale: 1 }],
  },
  recipeCardContent: {
    padding: Spacing["3xl"],
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  recipeName: {
    flex: 1,
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text,
    marginRight: Spacing.lg,
    lineHeight: Typography.fontSizes.xl * Typography.lineHeights.tight,
    letterSpacing: Typography.letterSpacing.tight,
    overflow: "hidden",
  },
  recipeAuthor: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontWeight: Typography.fontWeights.medium,
    lineHeight: Typography.fontSizes.sm * Typography.lineHeights.normal,
    letterSpacing: Typography.letterSpacing.wide,
    overflow: "hidden",
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: "wrap",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
    flexWrap: "wrap",
  },
  cuisineContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeCuisine: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: Typography.letterSpacing.wider,
    textAlign: "center",
    lineHeight: Typography.fontSizes.xs * 1.4,
  },
  mealContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    maxWidth: 100,
    alignSelf: "flex-start",
  },
  recipeMeal: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: Typography.letterSpacing.wider,
    overflow: "hidden",
    maxWidth: 100,
  },
  typeContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    maxWidth: 100,
    alignSelf: "flex-start",
    borderColor: Colors.border,
    borderWidth: 1.5,
  },
  recipeType: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: Typography.letterSpacing.wider,
    overflow: "hidden",
    maxWidth: 100,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    borderColor: Colors.border,
    borderWidth: 1.5,
  },
  recipeTime: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.medium,
    letterSpacing: Typography.letterSpacing.wide,
  },
  cookedDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cookedDateText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.semibold,
    letterSpacing: Typography.letterSpacing.wide,
  },
  cookedByContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.accent2,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  cookedByText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.secondaryDark,
    fontWeight: Typography.fontWeights.semibold,
    textTransform: "uppercase",
    letterSpacing: Typography.letterSpacing.wide,
  },
});
