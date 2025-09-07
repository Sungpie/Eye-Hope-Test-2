// components/FCMHandler.tsx
import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationService from "../services/NotificationService";
import { useNotification } from "./CustomNotification";

export function FCMHandler() {
  const { showNotification } = useNotification();
  const notificationListeners = useRef<any>(null);

  // FCM 초기화
  const initializeFCM = async () => {
    try {
      console.log("🔔 === FCM 초기화 시작 ===");

      const notificationService = NotificationService.getInstance();

      // 포그라운드 알림 핸들러 설정
      notificationService.setForegroundNotificationHandler((notification) => {
        console.log("📱 커스텀 알림 표시:", notification);
        showNotification(notification);
      });

      // 알림 핸들러 설정
      notificationService.setupNotificationHandler();

      // 알림 리스너 등록
      const listeners = notificationService.setupNotificationListeners();
      notificationListeners.current = listeners;

      // FCM 토큰 받기
      const token = await notificationService.getFCMToken();

      if (token) {
        console.log("✅ FCM 토큰 받기 성공");

        // DeviceId 가져오기
        const deviceId = await AsyncStorage.getItem("deviceId");

        if (deviceId) {
          // 토큰을 백엔드로 전송 (사용자가 등록되어 있는 경우에만)
          const setupCompleted = await AsyncStorage.getItem("setupCompleted");
          if (setupCompleted === "true") {
            const success = await notificationService.sendTokenToBackend(
              token,
              deviceId
            );
            if (success) {
              console.log("✅ FCM 토큰 백엔드 전송 성공");
            } else {
              console.log("⚠️ FCM 토큰 백엔드 전송 실패 (나중에 재시도)");
            }
          } else {
            console.log(
              "🔄 사용자 등록이 완료되지 않음 - 토큰은 등록 시 전송 예정"
            );
          }
        }
      } else {
        console.log("⚠️ FCM 토큰 받기 실패");
      }

      console.log("🔔 === FCM 초기화 완료 ===");
    } catch (error) {
      console.error("❌ FCM 초기화 오류:", error);
    }
  };

  useEffect(() => {
    initializeFCM();

    // 컴포넌트 언마운트 시 리스너 정리
    return () => {
      if (notificationListeners.current) {
        const notificationService = NotificationService.getInstance();
        notificationService.removeNotificationListeners(
          notificationListeners.current
        );
      }
    };
  }, []);

  return null; // UI를 렌더링하지 않는 컴포넌트
}
