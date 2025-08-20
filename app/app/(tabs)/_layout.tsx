import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { Colors as DesignColors, Shadows, BorderRadius, Layout } from "@/constants/Design";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            height: Layout.tabBarHeight.ios,
            paddingBottom: 34,
            paddingTop: 8,
            backgroundColor: DesignColors.surface,
            borderTopWidth: 1,
            borderTopColor: DesignColors.borderLight,
            ...Shadows.xl,
            shadowOffset: { width: 0, height: -2 },
          },
          default: {
            height: Layout.tabBarHeight.default,
            paddingBottom: 8,
            paddingTop: 8,
            backgroundColor: DesignColors.surface,
            borderTopWidth: 1,
            borderTopColor: DesignColors.borderLight,
            ...Shadows.xl,
            shadowOffset: { width: 0, height: -2 },
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={24}
              name="list.bullet.clipboard.fill"
              color={focused ? color : Colors[colorScheme ?? "light"].icon}
            />
          ),
          tabBarLabelStyle: { fontSize: 12, marginTop: 4 },
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: DesignColors.primary,
                borderRadius: BorderRadius['2xl'],
                width: 56,
                height: 56,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: Platform.OS === "ios" ? 12 : 8,
                ...Shadows.primaryLarge,
              }}
            >
              <IconSymbol size={28} name="plus" color="#ffffff" />
            </View>
          ),
          tabBarLabelStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={24}
              name="person.fill"
              color={focused ? color : Colors[colorScheme ?? "light"].icon}
            />
          ),
          tabBarLabelStyle: { fontSize: 12, marginTop: 4 },
        }}
      />
      <Tabs.Screen
        name="recipe/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
