import { useNotifications } from "@/hooks/use-notifications";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";

export function PushPermissionPrompt() {
  const {
    requestPushPermissions,
    rejectPushPermissions,
    shouldRequestPushPermissions,
    isPushTokenPending,
  } = useNotifications();
  const hasShownPrompt = useRef(false);

  useEffect(() => {
    if (
      shouldRequestPushPermissions() &&
      !hasShownPrompt.current &&
      !isPushTokenPending
    ) {
      hasShownPrompt.current = true;

      const timer = setTimeout(() => {
        Alert.alert(
          "Enable Notifications",
          "Get notified when friends send you recipe shares and friend requests. You can always change this later in settings.",
          [
            {
              text: "Not Now",
              style: "cancel",
              onPress: async () => {
                await rejectPushPermissions();
              },
            },
            {
              text: "Enable",
              onPress: async () => {
                try {
                  const success = await requestPushPermissions();
                  if (!success) {
                    Alert.alert(
                      "Permission Denied",
                      "You can enable notifications later in your device settings if you change your mind.",
                    );
                    hasShownPrompt.current = false;
                  }
                } catch (error) {
                  console.error("Error requesting push permissions:", error);
                  Alert.alert(
                    "Error",
                    "Failed to set up notifications. Please try again.",
                  );
                  hasShownPrompt.current = false;
                }
              },
            },
          ],
        );
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    shouldRequestPushPermissions,
    requestPushPermissions,
    rejectPushPermissions,
    isPushTokenPending,
  ]);

  useEffect(() => {
    if (!shouldRequestPushPermissions()) {
      hasShownPrompt.current = false;
    }
  }, [shouldRequestPushPermissions]);

  return null;
}
