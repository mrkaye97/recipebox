import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  BorderRadius,
  Colors,
  Components,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/design-system";
import { useFriends } from "@/hooks/use-friends";
import { components } from "@/src/lib/api/v1";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type User = components["schemas"]["src__schemas__User"];

interface UserSearchComboboxProps {
  onAddFriend?: (user: User) => void;
  placeholder?: string;
  isAddingFriend?: boolean;
}

export function UserSearchCombobox({
  onAddFriend,
  placeholder = "Search for users...",
  isAddingFriend = false,
}: UserSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { search } = useFriends({ query: debouncedQuery });

  const users = useMemo(() => {
    return search.data || [];
  }, [search.data]);

  const handleInputChange = (text: string) => {
    setQuery(text);
    setIsOpen(text.length > 0);
  };

  const handleAddFriend = (user: User) => {
    onAddFriend?.(user);
    setQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
    Keyboard.dismiss();
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      Keyboard.dismiss();
    }, 150);
  };

  const handleOutsidePress = () => {
    setIsOpen(false);
    Keyboard.dismiss();
  };

  return (
    <>
      {isOpen && (
        <TouchableWithoutFeedback onPress={handleOutsidePress}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}
      <ThemedView style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            placeholderTextColor={Colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>

        {isOpen && (
          <View style={styles.dropdownContainer}>
            {search.isLoading && debouncedQuery.length > 0 && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <ThemedText style={styles.loadingText}>Searching...</ThemedText>
              </View>
            )}

            {!search.isLoading &&
              users.length === 0 &&
              debouncedQuery.length > 0 && (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>
                    No users found
                  </ThemedText>
                </View>
              )}

            {users.length > 0 && (
              <ScrollView
                style={styles.userList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                {users.map((user) => (
                  <View key={user.id} style={styles.userItem}>
                    <View style={styles.userInfo}>
                      <ThemedText type="defaultSemiBold">
                        {user.name}
                      </ThemedText>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        isAddingFriend && styles.addButtonDisabled,
                      ]}
                      onPress={() => handleAddFriend(user)}
                      disabled={isAddingFriend}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addButtonText}>
                        {isAddingFriend ? "Adding..." : "Add Friend"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9,
  },
  container: {
    position: "relative",
    zIndex: 10,
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    ...Components.input,
    color: Colors.text,
  },
  dropdownContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 0,
    borderRadius: BorderRadius.md,
    maxHeight: 200,
    ...Shadows.xl,
    zIndex: 11,
  },
  userList: {
    maxHeight: 200,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    borderRadius: BorderRadius.xl,
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
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  addButtonDisabled: {
    backgroundColor: Colors.buttonDisabled,
  },
  addButtonText: {
    color: Colors.surface,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  loadingText: {
    marginLeft: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
  },
  emptyContainer: {
    alignItems: "center",
    padding: Spacing.lg,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
  },
});
