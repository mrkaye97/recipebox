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
          },
          default: {
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={24}
              name="house.fill"
              color={focused ? color : Colors[colorScheme ?? "light"].icon}
            />
          ),
          tabBarLabelStyle: { fontSize: 12, marginTop: 4 },
        }}
      />
      <Tabs.Screen
        name="explore"
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
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
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
        name="recipe"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
