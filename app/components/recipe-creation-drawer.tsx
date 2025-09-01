import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  BorderRadius,
  Colors,
  Layout,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/design-system";

type CreateOption = "online" | "manual" | "cookbook";

interface CreateOptionCard {
  type: CreateOption;
  title: string;
  description: string;
  icon: string;
}

const createOptions: CreateOptionCard[] = [
  {
    type: "online",
    title: "From URL",
    description: "Import a recipe from a cooking website",
    icon: "link",
  },
  {
    type: "manual",
    title: "Manual Entry",
    description: "Type in your recipe details manually",
    icon: "pencil",
  },
  {
    type: "cookbook",
    title: "Cookbook Photo",
    description: "Take a photo of a cookbook page",
    icon: "camera.fill",
  },
];

function CreateOptionButton({
  option,
  onPress,
}: {
  option: CreateOptionCard;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        {
          backgroundColor: Colors.surface,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.optionHeader}>
        <IconSymbol
          name={option.icon as any}
          size={24}
          color={Colors.primary}
        />
        <ThemedText type="subtitle">{option.title}</ThemedText>
      </View>
      <ThemedText style={styles.optionDescription}>
        {option.description}
      </ThemedText>
    </TouchableOpacity>
  );
}

interface RecipeCreationDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (option: CreateOption) => void;
}

export function RecipeCreationDrawer({
  visible,
  onClose,
  onSelectOption,
}: RecipeCreationDrawerProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleOptionPress = (option: CreateOption) => {
    onSelectOption(option);
    onClose();
  };

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View
          style={[
            styles.drawerWrapper,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            style={styles.drawerContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.drawerHandle} />
            <View style={styles.optionsContainer}>
              {createOptions.map((option) => (
                <CreateOptionButton
                  key={option.type}
                  option={option}
                  onPress={() => handleOptionPress(option.type)}
                />
              ))}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  backdrop: {
    flex: 1,
  },
  drawerWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "60%",
  },
  drawerContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    ...Shadows.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.textSecondary,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: Spacing.md,
    opacity: 0.3,
  },
  optionsContainer: {
    padding: Layout.screenPadding,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing["6xl"],
  },
  optionCard: {
    backgroundColor: Colors.surface,
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.xl,
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  optionDescription: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.base,
    lineHeight: Typography.fontSizes.base * Typography.lineHeights.normal,
  },
});
