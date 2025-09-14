import { $api } from "@/src/lib/api/client";
import { components } from "@/src/lib/api/v1";
import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useCallback, useEffect } from "react";
import { useUser } from "./use-user";

type PushNotificationPayload = components["schemas"]["PushNotificationPayload"];

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
  const queryClient = useQueryClient();
  const { mutateAsync: storePushToken, isPending: isPushTokenPending } =
    $api.useMutation("post", "/users/push-token");

  useEffect(() => {
    const notificationSubscription =
      Notifications.addNotificationReceivedListener((notification) => {});

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data: PushNotificationPayload = response.notification.request
          .content.data as PushNotificationPayload;

        if (!data || !data.navigate_to) return;

        switch (data.navigate_to) {
          case "friend_requests":
            router.push("/profile");
            return;
          case "friends":
            router.push("/profile");
            return;
          case "shared_recipes":
            router.push("/recipes");
            return;
        }
      });

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const showLocalNotification = useCallback(
    async (title: string, body: string) => {
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      });
    },
    [],
  );

  const requestPushPermissions = useCallback(async () => {
    if (!token || !userInfo) return false;

    try {
      let pushTokenData = "development-placeholder";

      try {
        const pushToken = await Notifications.getExpoPushTokenAsync({
          projectId: "fe0ab037-a4e4-4d25-9e05-dd73df93f81b",
        });
        pushTokenData = pushToken.data;
      } catch {}

      await storePushToken({
        body: {
          expo_push_token: pushTokenData,
          push_permission: "accepted",
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      queryClient.invalidateQueries({ queryKey: ["get", "/users"] });

      return true;
    } catch {
      return false;
    }
  }, [storePushToken, token, userInfo, queryClient]);

  const rejectPushPermissions = useCallback(async () => {
    if (!token || !userInfo) return false;

    try {
      await storePushToken({
        body: {
          expo_push_token: null,
          push_permission: "rejected",
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      queryClient.invalidateQueries({ queryKey: ["get", "/users"] });

      return true;
    } catch {
      return false;
    }
  }, [storePushToken, token, userInfo, queryClient]);

  const ensureNotificationSetup = useCallback(async () => {
    if (!token || !userInfo) return false;

    if (userInfo.push_permission === "none") {
      return await requestPushPermissions();
    }

    if (userInfo.expo_push_token) {
      const { status } = await Notifications.getPermissionsAsync();
      return (
        status === "granted" ||
        (await Notifications.requestPermissionsAsync()).status === "granted"
      );
    }

    return await requestPushPermissions();
  }, [requestPushPermissions, token, userInfo]);

  const shouldRequestPushPermissions = useCallback(() => {
    return userInfo?.push_permission === "none";
  }, [userInfo]);

  return {
    showLocalNotification,
    ensureNotificationSetup,
    requestPushPermissions,
    rejectPushPermissions,
    shouldRequestPushPermissions,
    isPushTokenPending,
  };
};
