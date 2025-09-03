import React from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { Colors } from "@/constants/design-system";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.backgroundSubtle, Colors.borderLight],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
}

export function RecipeSkeleton() {
  return (
    <View style={styles.recipeCard}>
      <Skeleton
        width="100%"
        height={200}
        borderRadius={12}
        style={styles.recipeThumbnail}
      />
      <View style={styles.recipeContent}>
        <Skeleton width="80%" height={24} style={styles.recipeTitle} />
        <Skeleton width="60%" height={16} style={styles.recipeSubtitle} />
        <View style={styles.recipeFooter}>
          <Skeleton width={60} height={16} />
          <Skeleton width={80} height={16} />
        </View>
      </View>
    </View>
  );
}

export function ActivitySkeleton() {
  return (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.activityHeaderText}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="50%" height={14} style={styles.activityTime} />
        </View>
      </View>
      <Skeleton
        width="100%"
        height={100}
        borderRadius={8}
        style={styles.activityImage}
      />
    </View>
  );
}

export function PendingShareSkeleton() {
  return (
    <View style={styles.shareCard}>
      <View style={styles.shareHeader}>
        <Skeleton width="60%" height={18} />
        <Skeleton width="30%" height={14} />
      </View>
      <Skeleton
        width="100%"
        height={80}
        borderRadius={8}
        style={styles.shareContent}
      />
      <View style={styles.shareActions}>
        <Skeleton width={80} height={32} borderRadius={16} />
        <Skeleton width={80} height={32} borderRadius={16} />
      </View>
    </View>
  );
}

export function FriendSkeleton() {
  return (
    <View style={styles.friendCard}>
      <View style={styles.friendInfo}>
        <Skeleton width="70%" height={18} style={styles.friendName} />
        <Skeleton width="50%" height={14} />
      </View>
    </View>
  );
}

export function FriendRequestSkeleton() {
  return (
    <View style={styles.friendCard}>
      <View style={styles.friendInfo}>
        <Skeleton width="60%" height={18} style={styles.friendName} />
        <Skeleton width="40%" height={14} />
      </View>
      <Skeleton width={70} height={32} borderRadius={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  recipeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recipeThumbnail: {
    marginBottom: 12,
  },
  recipeContent: {
    padding: 16,
  },
  recipeTitle: {
    marginBottom: 8,
  },
  recipeSubtitle: {
    marginBottom: 12,
  },
  recipeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  activityHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  activityTime: {
    marginTop: 4,
  },
  activityImage: {
    marginTop: 8,
  },
  shareCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shareHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  shareContent: {
    marginBottom: 12,
  },
  shareActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  friendCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 12,
  },
  friendInfo: {
    flex: 1,
    marginRight: 12,
  },
  friendName: {
    marginBottom: 4,
  },
});
