import React from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { UserSearchCombobox } from "@/components/user-search-combobox";
import {
  BorderRadius,
  Colors,
  Components,
  Layout,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/design-system";
import { useFriends } from "@/hooks/use-friends";
import { useNotifications } from "@/hooks/use-notifications";
import { useUser } from "@/hooks/use-user";
import { components } from "@/src/lib/api/v1";
import { useRouter } from "expo-router";

type User = components["schemas"]["src__schemas__User"];

export default function ProfileScreen() {
  const { isAuthenticated, logout } = useUser();
  const router = useRouter();
  const [showSignup, setShowSignup] = React.useState(false);
  const [acceptingUserId, setAcceptingUserId] = React.useState<string | null>(
    null,
  );

  const { requests, friends, sendRequest, acceptRequest, sendingRequest } =
    useFriends({ query: "" });

  const { ensureNotificationSetup } = useNotifications();

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
      await ensureNotificationSetup();
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
          <ScrollView
            style={styles.loginScrollContainer}
            contentContainerStyle={styles.loginContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
          </ScrollView>
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          <View style={styles.sectionNoCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Find Friends
            </ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Search for users and send friend requests
            </ThemedText>
            <UserSearchCombobox
              onAddFriend={handleAddFriend}
              placeholder="Search for friends"
              isAddingFriend={sendingRequest}
            />
          </View>

          {showFriendRequestsSection && (
            <View style={styles.sectionNoCard}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Friend Requests
              </ThemedText>
              <ThemedText style={styles.sectionSubtitle}>
                People who want to be your friend
              </ThemedText>
              <View style={styles.requestsList}>
                {requests.isLoading
                  ? Array.from({ length: 2 }).map((_, index) => (
                      <View key={index} style={styles.requestItem}>
                        <IconSymbol
                          name="person.crop.circle.badge.plus"
                          size={20}
                          color={Colors.textSecondary}
                        />
                        <View style={styles.requestSkeleton} />
                        <View style={styles.requestButtonSkeleton} />
                      </View>
                    ))
                  : pendingRequests.map((user) => (
                      <View key={user.id} style={styles.requestItem}>
                        <IconSymbol
                          name="person.crop.circle.badge.plus"
                          size={20}
                          color={Colors.primary}
                        />
                        <ThemedText style={styles.requestName}>
                          {user.name}
                        </ThemedText>
                        <TouchableOpacity
                          style={[
                            styles.acceptButtonSmall,
                            acceptingUserId === user.id &&
                              styles.acceptButtonDisabled,
                          ]}
                          onPress={() => handleAcceptRequest(user)}
                          disabled={acceptingUserId === user.id}
                        >
                          <ThemedText style={styles.acceptButtonSmallText}>
                            {acceptingUserId === user.id ? "..." : "Accept"}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    ))}
              </View>
            </View>
          )}

          {showFriendsSection && (
            <View style={styles.sectionNoCard}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Friends
              </ThemedText>
              <View style={styles.friendsList}>
                {friends.isLoading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <View key={index} style={styles.friendItem}>
                        <View style={styles.friendSkeleton} />
                      </View>
                    ))
                  : friendsList.map((user) => (
                      <View key={user.id} style={styles.friendItem}>
                        <IconSymbol
                          name="person.circle.fill"
                          size={20}
                          color={Colors.primary}
                        />
                        <ThemedText style={styles.friendName}>
                          {user.name}
                        </ThemedText>
                      </View>
                    ))}
              </View>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <IconSymbol name="door.right.hand.open" size={18} color="#fff" />
        <ThemedText style={styles.logoutButtonText}>Log Out</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingTop: Layout.headerHeight,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: 100, // Space for logout button
    gap: Spacing.xl,
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
    gap: Spacing.lg,
  },
  userCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing["2xl"],
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  userInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  friendsList: {
    gap: Spacing.sm,
    maxHeight: 200,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  friendName: {
    fontSize: Typography.fontSizes.base,
    color: Colors.text,
  },
  friendSkeleton: {
    width: 120,
    height: 20,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
  },
  requestsList: {
    gap: Spacing.sm,
    maxHeight: 150,
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  requestName: {
    flex: 1,
    fontSize: Typography.fontSizes.base,
    color: Colors.text,
  },
  requestSkeleton: {
    flex: 1,
    height: 20,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
  },
  requestButtonSkeleton: {
    width: 60,
    height: 28,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
  },
  acceptButtonSmall: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    minWidth: 60,
    alignItems: "center",
  },
  acceptButtonSmallText: {
    color: Colors.surface,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
  },
  userEmail: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.primary,
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
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius["2xl"],
    padding: Spacing["3xl"],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionNoCard: {
    gap: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    color: Colors.text,
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
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
  logoutButton: {
    position: "absolute",
    bottom: Layout.bottomPadding.form,
    left: Layout.screenPadding,
    right: Layout.screenPadding,
    backgroundColor: Colors.error,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  logoutButtonText: {
    color: Colors.surface,
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semibold,
    letterSpacing: Typography.letterSpacing.wide,
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
  loginScrollContainer: {
    flex: 1,
  },
  loginContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Layout.screenPadding,
    minHeight: "100%",
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
