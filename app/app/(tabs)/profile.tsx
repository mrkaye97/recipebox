import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { FriendRequestSkeleton, FriendSkeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { UserSearchCombobox } from "@/components/user-search-combobox";
import {
  BorderRadius,
  Colors,
  Components,
  Layout,
  Spacing,
  Typography,
} from "@/constants/design-system";
import { useFriends } from "@/hooks/use-friends";
import { useUser } from "@/hooks/use-user";
import { components } from "@/src/lib/api/v1";
import { useRouter } from "expo-router";

type User = components["schemas"]["User"];

export default function ProfileScreen() {
  const { isAuthenticated, logout } = useUser();
  const router = useRouter();
  const [showSignup, setShowSignup] = React.useState(false);
  const [acceptingUserId, setAcceptingUserId] = React.useState<string | null>(
    null,
  );

  const { requests, friends, sendRequest, acceptRequest, sendingRequest } =
    useFriends({ query: "" });

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.navigate("/(tabs)/profile");
        },
      },
    ]);
  };

  const handleAddFriend = async (user: User) => {
    try {
      await sendRequest(user.id);
      Alert.alert("Success", `Friend request sent to ${user.name}!`);
    } catch (error) {
      console.error("Error sending friend request:", error);
      Alert.alert("Error", "Failed to send friend request. Please try again.");
    }
  };

  const handleAcceptRequest = async (user: User) => {
    try {
      setAcceptingUserId(user.id);
      await acceptRequest(user.id);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      Alert.alert(
        "Error",
        "Failed to accept friend request. Please try again.",
      );
    } finally {
      setAcceptingUserId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
        >
          <View style={styles.loginContainer}>
            {showSignup ? <SignupForm /> : <LoginForm />}

            <View style={styles.toggleContainer}>
              <ThemedText style={styles.toggleText}>
                {showSignup
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowSignup(!showSignup)}>
                <ThemedText style={styles.toggleLink}>
                  {showSignup ? "Log In" : "Sign Up"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
    );
  }

  const pendingRequests = requests.data || [];
  const friendsList = friends.data || [];

  const showFriendRequestsSection =
    requests.isLoading || pendingRequests.length > 0;
  const showFriendsSection = friends.isLoading || friendsList.length > 0;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Find Friends
          </ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Search for users and send friend requests
          </ThemedText>
          <UserSearchCombobox
            onAddFriend={handleAddFriend}
            placeholder="Search for users by name or email..."
            isAddingFriend={sendingRequest}
          />
        </View>

        {showFriendRequestsSection && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Friend Requests
            </ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              People who want to be your friend
            </ThemedText>
            <View style={styles.usersList}>
              {requests.isLoading
                ? Array.from({ length: 2 }).map((_, index) => (
                    <FriendRequestSkeleton key={index} />
                  ))
                : pendingRequests.map((user) => (
                    <View key={user.id} style={styles.userCard}>
                      <View style={styles.userInfo}>
                        <ThemedText type="defaultSemiBold">
                          {user.name}
                        </ThemedText>
                        <ThemedText style={styles.userEmail}>
                          {user.email}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.acceptButton,
                          acceptingUserId === user.id &&
                            styles.acceptButtonDisabled,
                        ]}
                        onPress={() => handleAcceptRequest(user)}
                        disabled={acceptingUserId === user.id}
                      >
                        <ThemedText style={styles.acceptButtonText}>
                          {acceptingUserId === user.id
                            ? "Accepting..."
                            : "Accept"}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  ))}
            </View>
          </View>
        )}

        {showFriendsSection && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Friends
            </ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Your recipe sharing buddies
            </ThemedText>
            <View style={styles.usersList}>
              {friends.isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <FriendSkeleton key={index} />
                  ))
                : friendsList.map((user) => (
                    <View key={user.id} style={styles.userCard}>
                      <View style={styles.userInfo}>
                        <ThemedText type="defaultSemiBold">
                          {user.name}
                        </ThemedText>
                        <ThemedText style={styles.userEmail}>
                          {user.email}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <IconSymbol name="door.right.hand.open" size={16} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Log Out</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Layout.headerHeight,
  },
  content: {
    flex: 1,
    padding: Layout.screenPadding,
    paddingTop: Spacing.lg,
    gap: Spacing["3xl"],
    justifyContent: "flex-start",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Layout.screenPadding,
  },
  messageText: {
    textAlign: "center",
    marginBottom: Spacing.md,
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.text,
  },
  subMessageText: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginBottom: Spacing["3xl"],
    fontSize: Typography.fontSizes.md,
    lineHeight: Typography.lineHeights.relaxed * Typography.fontSizes.md,
    paddingHorizontal: Layout.screenPadding,
  },
  usersList: {
    gap: Spacing.md,
  },
  userCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  userInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  userEmail: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  acceptButton: {
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
  infoCard: {
    ...Components.card,
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  statusText: {
    marginLeft: "auto",
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.text,
  },
  tokenText: {
    marginLeft: "auto",
    fontSize: Typography.fontSizes.xs,
    fontFamily: "monospace",
    color: Colors.textSecondary,
  },
  actionButton: {
    backgroundColor: Colors.error,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
  },
  actionButtonText: {
    color: Colors.surface,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  footer: {
    marginTop: "auto",
    alignItems: "center",
    paddingBottom: Layout.bottomPadding.form,
  },
  footerText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  keyboardAvoid: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    padding: Layout.screenPadding,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 50,
  },
  toggleText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
  },
  toggleLink: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeights.semibold,
  },
  subtitle: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});
