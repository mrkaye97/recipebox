import { $api } from "@/src/lib/api/client";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { useUser } from "./use-user";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotifications = () => {
  const { token, userInfo } = useUser();
  const { mutateAsync: storePushToken } = $api.useMutation(
    "post",
    "/users/push-token",
  );

  useEffect(() => {
    const notificationSubscription =
      Notifications.addNotificationReceivedListener(() => {});
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const showLocalNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  };

  const ensureNotificationSetup = async (): Promise<boolean> => {
    if (!token || !userInfo) return false;

    if (userInfo.expo_push_token) {
      const { status } = await Notifications.getPermissionsAsync();
      return (
        status === "granted" ||
        (await Notifications.requestPermissionsAsync()).status === "granted"
      );
    }

    const { status } = await Notifications.getPermissionsAsync();
    const finalStatus =
      status === "granted"
        ? status
        : (await Notifications.requestPermissionsAsync()).status;

    if (finalStatus !== "granted") return false;

    try {
      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: "fe0ab037-a4e4-4d25-9e05-dd73df93f81b",
      });

      await storePushToken({
        body: { expo_push_token: pushToken.data },
        headers: { Authorization: `Bearer ${token}` },
      });

      return true;
    } catch {
      return false;
    }
  };

  return {
    showLocalNotification,
    ensureNotificationSetup,
  };
};
