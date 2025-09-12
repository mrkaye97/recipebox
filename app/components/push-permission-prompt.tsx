import { useNotifications } from "@/hooks/use-notifications";
import { useUser } from "@/hooks/use-user";
import React, { useEffect, useRef } from "react";
import { Alert } from "react-native";

export function PushPermissionPrompt() {
  const { userInfo } = useUser();
  const { requestPushPermissions, shouldRequestPushPermissions } =
    useNotifications();
  const hasShownPrompt = useRef(false);

  useEffect(() => {
    if (shouldRequestPushPermissions() && !hasShownPrompt.current) {
      hasShownPrompt.current = true;

      const timer = setTimeout(() => {
        Alert.alert(
          "Enable Notifications",
          "Get notified when friends send you recipe shares and friend requests. You can always change this later in settings.",
          [
            {
              text: "Not Now",
              style: "cancel",
              onPress: () => {
                // Reset flag if user cancels, so they can be prompted again later
                hasShownPrompt.current = false;
              },
            {
              text: "Enable",
              onPress: async () => {
                try {
                  const success = await requestPushPermissions();
                  if (success) {
                    Alert.alert(
                      "Success",
                      "Push notifications enabled! You'll now receive notifications for friend requests and recipe shares.",
                    );
                  } else {
                    Alert.alert(
                      "Permission Denied",
                      "You can enable notifications later in your device settings if you change your mind.",
                    );
                    // Reset flag on failure so they can try again
                    hasShownPrompt.current = false;
                  }
                } catch (error) {
                  console.error("Error requesting push permissions:", error);
                  Alert.alert(
                    "Error",
                    "Failed to set up notifications. Please try again.",
                  );
                  // Reset flag on error so they can try again
                  hasShownPrompt.current = false;
                }
              },
            },
          ],
        );
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [shouldRequestPushPermissions, requestPushPermissions]);

  // Reset the flag when permission status changes (user data updates)
  useEffect(() => {
    if (!shouldRequestPushPermissions()) {
      hasShownPrompt.current = false;
    }
  }, [shouldRequestPushPermissions]);

  return null;
}
