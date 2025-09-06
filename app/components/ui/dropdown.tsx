import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/design-system";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "../themed-text";
import { IconSymbol } from "./icon-symbol";

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onValueChange: (value: string | undefined) => void;
  placeholder: string;
}

export function Dropdown({
  options,
  value,
  onValueChange,
  placeholder,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (optionValue: string) => {
    if (optionValue === value) {
      onValueChange(undefined);
    } else {
      onValueChange(optionValue);
    }
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsOpen(true)}
      >
        <ThemedText style={styles.dropdownText}>
          {selectedOption ? selectedOption.label : placeholder}
        </ThemedText>
        <IconSymbol
          name="chevron.down"
          size={16}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdownModal}>
            <ScrollView style={styles.optionsList}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    option.value === value && styles.selectedOption,
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <ThemedText
                    style={[
                      styles.optionText,
                      option.value === value && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                  {option.value === value && (
                    <IconSymbol
                      name="checkmark"
                      size={16}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceTinted,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 110,
    minHeight: 52,
    ...Shadows.sm,
  },
  dropdownText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.text,
    marginRight: Spacing.sm,
    fontWeight: Typography.fontWeights.medium,
    letterSpacing: Typography.letterSpacing.wide,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  dropdownModal: {
    backgroundColor: Colors.surfaceTinted,
    borderRadius: BorderRadius["2xl"],
    maxHeight: 320,
    minWidth: 260,
    maxWidth: "90%",
    ...Shadows.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionsList: {
    maxHeight: 300,
    paddingVertical: Spacing.xs,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    marginVertical: 1,
  },
  selectedOption: {
    backgroundColor: Colors.accent1,
  },
  optionText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.text,
    fontWeight: Typography.fontWeights.medium,
    flex: 1,
    letterSpacing: Typography.letterSpacing.normal,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeights.semibold,
  },
});
