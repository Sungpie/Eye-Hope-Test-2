// services/NotificationService.ts
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;
  private onForegroundNotification?: (notification: NotificationData) => void;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 포그라운드 알림 콜백 설정
  setForegroundNotificationHandler(
    callback: (notification: NotificationData) => void
  ) {
    this.onForegroundNotification = callback;
  }

  // 알림 권한 요청
  async requestPermissions(): Promise<boolean> {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.log("알림 권한이 거부되었습니다.");
          return false;
        }

        return true;
      } else {
        console.log("물리적 디바이스에서만 푸시 알림이 작동합니다.");
        return false;
      }
    } catch (error) {
      console.error("알림 권한 요청 오류:", error);
      return false;
    }
  }

  // FCM 토큰 받기
  async getFCMToken(): Promise<string | null> {
    try {
      // 권한 확인
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Android 설정
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      // FCM 토큰 받기
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.error("Project ID를 찾을 수 없습니다.");
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log("FCM 토큰 받기 성공:", token.data);

      // 토큰을 AsyncStorage에 저장
      await AsyncStorage.setItem("fcmToken", token.data);

      return token.data;
    } catch (error) {
      console.error("FCM 토큰 받기 오류:", error);
      return null;
    }
  }

  // 저장된 토큰 가져오기
  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("fcmToken");
    } catch (error) {
      console.error("저장된 토큰 가져오기 오류:", error);
      return null;
    }
  }

  // 백엔드로 토큰 전송
  async sendTokenToBackend(token: string, deviceId: string): Promise<boolean> {
    try {
      console.log("🔔 백엔드로 FCM 토큰 전송 시작");
      console.log("📤 토큰:", token);
      console.log("📤 디바이스 ID:", deviceId);

      // 사용자 정보 업데이트 API에 FCM 토큰 추가
      const response = await fetch(
        `http://13.124.111.205:8080/api/users/${encodeURIComponent(deviceId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fcmToken: token,
          }),
        }
      );

      const result = await response.json();
      console.log("📥 토큰 전송 응답:", result);

      if (response.ok && result.success) {
        console.log("✅ FCM 토큰 전송 성공");
        return true;
      } else {
        console.error("❌ FCM 토큰 전송 실패:", result.message);
        return false;
      }
    } catch (error) {
      console.error("❌ FCM 토큰 전송 오류:", error);
      return false;
    }
  }

  // 알림 설정
  setupNotificationHandler() {
    // 앱이 포그라운드에 있을 때 알림 처리 방법 설정
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  // 알림 리스너 등록
  setupNotificationListeners() {
    // 알림을 받았을 때 (앱이 포그라운드에 있을 때)
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("🔔 알림 수신 (포그라운드):", notification);
        this.handleForegroundNotification(notification);
      }
    );

    // 알림을 터치했을 때
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 알림 터치:", response);
        this.handleNotificationTap(response);
      });

    return {
      notificationListener,
      responseListener,
    };
  }

  // 포그라운드 알림 처리
  private handleForegroundNotification(
    notification: Notifications.Notification
  ) {
    const { title, body, data } = notification.request.content;

    console.log("📱 포그라운드 알림 처리:");
    console.log("  제목:", title);
    console.log("  내용:", body);
    console.log("  데이터:", data);

    // 커스텀 알림 표시를 위한 이벤트 발생
    if (this.onForegroundNotification) {
      this.onForegroundNotification({
        title: title || "알림",
        body: body || "",
        data: data || {},
      });
    }
  }

  // 알림 터치 처리
  private handleNotificationTap(response: Notifications.NotificationResponse) {
    const { title, body, data } = response.notification.request.content;

    console.log("👆 알림 터치 처리:");
    console.log("  제목:", title);
    console.log("  내용:", body);
    console.log("  데이터:", data);

    // 여기서 특정 화면으로 이동하거나 다른 액션을 수행할 수 있습니다
    // 예: 뉴스 상세 화면으로 이동
    if (data?.newsId) {
      // router.push(`/news/${data.newsId}`);
    }
  }

  // 리스너 정리
  removeNotificationListeners(listeners: any) {
    if (listeners.notificationListener) {
      Notifications.removeNotificationSubscription(
        listeners.notificationListener
      );
    }
    if (listeners.responseListener) {
      Notifications.removeNotificationSubscription(listeners.responseListener);
    }
  }
}

export default NotificationService;
