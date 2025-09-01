import { Colors, Layout, Shadows } from "@/constants/design-system";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import TabBarBackground from "@/components/ui/tab-bar-background";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            height: Layout.tabBarHeight.ios,
            paddingBottom: 34,
            paddingTop: 8,
            backgroundColor: Colors.surface,
            borderTopWidth: 1,
            borderTopColor: Colors.borderLight,
            ...Shadows.xl,
            shadowOffset: { width: 0, height: -2 },
          },
          default: {
            height: Layout.tabBarHeight.default,
            paddingBottom: 8,
            paddingTop: 8,
            backgroundColor: Colors.surface,
            borderTopWidth: 1,
            borderTopColor: Colors.borderLight,
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
              color={focused ? color : Colors.textSecondary}
            />
          ),
          tabBarLabelStyle: { fontSize: 12, marginTop: 4 },
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          href: null,
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
              color={focused ? color : Colors.textSecondary}
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
