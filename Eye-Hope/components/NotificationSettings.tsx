// components/NotificationSettings.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import NotificationService from "../services/NotificationService";
import {
  requestTestNotification,
  updateUserFCMToken,
} from "../utils/BackendIntegration";

interface NotificationSettingsProps {
  userInfo: {
    deviceId: string;
    nickname: string;
  } | null;
}

export function NotificationSettings({ userInfo }: NotificationSettingsProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
    loadFCMToken();
  }, []);

  // 알림 권한 상태 확인
  const checkNotificationStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === "granted");
    } catch (error) {
      console.error("알림 권한 상태 확인 오류:", error);
    }
  };

  // FCM 토큰 로드
  const loadFCMToken = async () => {
    try {
      const notificationService = NotificationService.getInstance();
      const token = await notificationService.getStoredToken();
      setFcmToken(token);
    } catch (error) {
      console.error("FCM 토큰 로드 오류:", error);
    }
  };

  // 알림 권한 토글
  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      // 알림 끄기 - 설정 앱으로 안내
      Alert.alert(
        "알림 설정",
        "알림을 끄시려면 기기의 설정 > 알림에서 직접 변경해주세요.",
        [{ text: "확인" }]
      );
    } else {
      // 알림 켜기 - 권한 요청
      setLoading(true);
      try {
        const notificationService = NotificationService.getInstance();
        const hasPermission = await notificationService.requestPermissions();

        if (hasPermission) {
          setNotificationsEnabled(true);

          // FCM 토큰 다시 받기
          const token = await notificationService.getFCMToken();
          if (token) {
            setFcmToken(token);

            // 백엔드에 토큰 전송
            if (userInfo?.deviceId) {
              await updateUserFCMToken(userInfo.deviceId);
            }

            Alert.alert("완료", "알림이 활성화되었습니다.");
          }
        } else {
          Alert.alert(
            "권한 필요",
            "알림 기능을 사용하려면 기기 설정에서 알림 권한을 허용해주세요.",
            [{ text: "확인" }]
          );
        }
      } catch (error) {
        console.error("알림 활성화 오류:", error);
        Alert.alert("오류", "알림 활성화 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
  };

  // 테스트 알림 전송
  const sendTestNotification = async () => {
    if (!userInfo?.deviceId) {
      Alert.alert("오류", "사용자 정보를 찾을 수 없습니다.");
      return;
    }

    if (!notificationsEnabled) {
      Alert.alert("알림 권한 필요", "먼저 알림 권한을 허용해주세요.");
      return;
    }

    setTestLoading(true);
    try {
      const success = await requestTestNotification(
        userInfo.deviceId,
        `안녕하세요 ${userInfo.nickname}님! 알림이 정상적으로 작동합니다.`
      );

      if (success) {
        Alert.alert(
          "테스트 알림 전송 완료",
          "잠시 후 알림이 도착합니다. 알림이 오지 않으면 앱을 백그라운드로 보낸 후 다시 확인해보세요.",
          [{ text: "확인" }]
        );
      } else {
        Alert.alert(
          "전송 실패",
          "테스트 알림 전송에 실패했습니다. 네트워크 연결과 서버 상태를 확인해주세요.",
          [{ text: "확인" }]
        );
      }
    } catch (error) {
      console.error("테스트 알림 전송 오류:", error);
      Alert.alert("오류", "테스트 알림 전송 중 오류가 발생했습니다.");
    } finally {
      setTestLoading(false);
    }
  };

  // FCM 토큰 새로고침
  const refreshFCMToken = async () => {
    if (!userInfo?.deviceId) {
      Alert.alert("오류", "사용자 정보를 찾을 수 없습니다.");
      return;
    }

    setLoading(true);
    try {
      const notificationService = NotificationService.getInstance();

      // 새 토큰 요청
      const newToken = await notificationService.getFCMToken();

      if (newToken) {
        setFcmToken(newToken);

        // 백엔드에 토큰 업데이트
        const success = await updateUserFCMToken(userInfo.deviceId);

        if (success) {
          Alert.alert("완료", "FCM 토큰이 새로고침되었습니다.");
        } else {
          Alert.alert(
            "부분 완료",
            "토큰은 새로고침되었지만 서버 업데이트에 실패했습니다. 나중에 자동으로 재시도됩니다."
          );
        }
      } else {
        Alert.alert("실패", "FCM 토큰을 가져올 수 없습니다.");
      }
    } catch (error) {
      console.error("FCM 토큰 새로고침 오류:", error);
      Alert.alert("오류", "FCM 토큰 새로고침 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>알림 설정</Text>

      {/* 알림 활성화 토글 */}
      <View style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingLabel}>푸시 알림</Text>
          <Text style={styles.settingDescription}>
            뉴스 알림을 받으시려면 활성화해주세요
          </Text>
        </View>
        <View style={styles.switchContainer}>
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: "#E5E5EA", true: "#34C759" }}
              thumbColor={notificationsEnabled ? "#FFFFFF" : "#FFFFFF"}
              ios_backgroundColor="#E5E5EA"
            />
          )}
        </View>
      </View>

      {/* FCM 토큰 정보 */}
      <View style={styles.tokenSection}>
        <Text style={styles.tokenTitle}>FCM 토큰 상태</Text>
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenLabel}>토큰:</Text>
          <Text style={styles.tokenValue}>
            {fcmToken ? `${fcmToken.substring(0, 20)}...` : "토큰 없음"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshFCMToken}
          disabled={loading}
        >
          <Ionicons name="refresh" size={16} color="#007AFF" />
          <Text style={styles.refreshButtonText}>토큰 새로고침</Text>
        </TouchableOpacity>
      </View>

      {/* 테스트 알림 버튼 */}
      <TouchableOpacity
        style={[
          styles.testButton,
          (!notificationsEnabled || !fcmToken) && styles.disabledButton,
        ]}
        onPress={sendTestNotification}
        disabled={!notificationsEnabled || !fcmToken || testLoading}
      >
        {testLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>테스트 알림 보내기</Text>
          </>
        )}
      </TouchableOpacity>

      {/* 안내 메시지 */}
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
        <Text style={styles.infoText}>
          • 테스트 알림이 오지 않으면 앱을 백그라운드로 보낸 후 확인해보세요
          {"\n"}• 알림 시간은 '알림 시간대 변경'에서 설정할 수 있습니다{"\n"}•
          알림이 계속 오지 않으면 '토큰 새로고침'을 시도해보세요
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 20,
    textAlign: "center",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 20,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 18,
  },
  switchContainer: {
    marginLeft: 16,
  },
  tokenSection: {
    marginBottom: 20,
  },
  tokenTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 12,
  },
  tokenContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8E8E93",
    width: 50,
  },
  tokenValue: {
    fontSize: 12,
    color: "#000000",
    fontFamily: "monospace",
    flex: 1,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  refreshButtonText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    marginLeft: 6,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: "#C7C7CC",
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  infoText: {
    fontSize: 12,
    color: "#8E8E93",
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
  },
});
