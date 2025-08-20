import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
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
            height: 84,
            paddingBottom: 34,
            paddingTop: 8,
            backgroundColor: "#ffffff",
            borderTopWidth: 1,
            borderTopColor: "rgba(0, 0, 0, 0.04)",
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 16,
            elevation: 8,
          },
          default: {
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
            backgroundColor: "#ffffff",
            borderTopWidth: 1,
            borderTopColor: "rgba(0, 0, 0, 0.04)",
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 16,
            elevation: 8,
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
                backgroundColor: "#007AFF",
                borderRadius: 28,
                width: 56,
                height: 56,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: Platform.OS === "ios" ? 12 : 8,
                shadowColor: "#007AFF",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
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
