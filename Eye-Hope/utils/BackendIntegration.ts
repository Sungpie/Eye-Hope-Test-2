// utils/BackendIntegration.ts
import NotificationService from "../services/NotificationService";

// 백엔드에 FCM 토큰과 함께 사용자 등록
export const registerUserWithFCM = async (userData: {
  deviceId: string;
  name?: string;
  email?: string;
  nickname: string;
}): Promise<{ success: boolean; data?: any }> => {
  try {
    console.log("👤 === FCM 토큰과 함께 사용자 등록 시작 ===");

    // FCM 토큰 가져오기
    const notificationService = NotificationService.getInstance();
    let fcmToken = await notificationService.getStoredToken();

    if (!fcmToken) {
      console.log("📱 저장된 FCM 토큰이 없음 - 새로 요청");
      fcmToken = await notificationService.getFCMToken();
    }

    // 사용자 등록 API 호출 (FCM 토큰 포함)
    const registrationData = {
      deviceId: userData.deviceId,
      name: userData.name || null,
      email: userData.email || null,
      nickname: userData.nickname,
      fcmToken: fcmToken || null, // FCM 토큰 추가
      password: null,
    };

    console.log("📤 등록 데이터:", JSON.stringify(registrationData, null, 2));

    const response = await fetch(
      "http://13.124.111.205:8080/api/users/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      }
    );

    const result = await response.json();
    console.log("📥 등록 응답:", result);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "사용자 등록에 실패했습니다.");
    }

    console.log("✅ FCM 토큰과 함께 사용자 등록 성공");
    return { success: true, data: result.data };
  } catch (error) {
    console.error("❌ FCM 토큰과 함께 사용자 등록 실패:", error);
    throw error;
  }
};

// 기존 사용자 FCM 토큰 업데이트
export const updateUserFCMToken = async (deviceId: string, retryCount = 0) => {
  try {
    console.log(`🔄 FCM 토큰 업데이트 시도 (${retryCount + 1}/3):`, deviceId);

    const notificationService = NotificationService.getInstance();
    let fcmToken = await notificationService.getStoredToken();

    if (!fcmToken) {
      console.log("📱 저장된 FCM 토큰이 없음 - 새로 요청");
      fcmToken = await notificationService.getFCMToken();
    }

    if (!fcmToken) {
      throw new Error("FCM 토큰을 가져올 수 없습니다");
    }

    const response = await fetch(
      `http://13.124.111.205:8080/api/users/${encodeURIComponent(deviceId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fcmToken: fcmToken,
        }),
      }
    );

    const result = await response.json();
    console.log("📥 토큰 업데이트 응답:", result);

    if (response.ok && result.success) {
      console.log("✅ FCM 토큰 업데이트 성공");
      return true;
    } else {
      throw new Error(result.message || "FCM 토큰 업데이트 실패");
    }
  } catch (error) {
    console.error(
      `❌ FCM 토큰 업데이트 실패 (시도 ${retryCount + 1}/3):`,
      error
    );

    // 3번까지 재시도
    if (retryCount < 2) {
      console.log(`🔄 ${3 - retryCount - 1}초 후 재시도...`);
      await new Promise((resolve) =>
        setTimeout(resolve, (retryCount + 1) * 3000)
      );
      return updateUserFCMToken(deviceId, retryCount + 1);
    }

    return false;
  }
};

// 백엔드 FCM 테스트 알림 전송 요청
export const requestTestNotification = async (
  deviceId: string,
  message?: string
) => {
  try {
    console.log("🧪 테스트 알림 전송 요청:", deviceId);

    const response = await fetch("http://13.124.111.205:8080/api/v1/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetType: "token",
        deviceId: deviceId, // deviceId로 사용자 찾기
        title: "테스트 알림",
        body: message || "Eye-Hope 앱에서 보내는 테스트 알림입니다.",
        data: {
          type: "test",
          timestamp: new Date().toISOString(),
        },
      }),
    });

    const result = await response.json();
    console.log("📥 테스트 알림 응답:", result);

    if (response.ok && result.success) {
      console.log("✅ 테스트 알림 전송 성공");
      return true;
    } else {
      console.error("❌ 테스트 알림 전송 실패:", result.message);
      return false;
    }
  } catch (error) {
    console.error("❌ 테스트 알림 전송 오류:", error);
    return false;
  }
};
