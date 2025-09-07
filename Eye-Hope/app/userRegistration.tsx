// app/userRegistration.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import NotificationService from "../services/NotificationService";

interface UserRegistrationData {
  deviceId: string;
  name?: string;
  email?: string;
  nickname: string;
  password?: string;
}

interface UserUpdateData {
  deviceId: string;
  name?: string;
  email?: string;
  nickname: string;
}

interface NotificationScheduleData {
  deviceId: string;
  notificationTime: string[];
}

export default function UserRegistrationScreen() {
  const router = useRouter();
  const { categories, selectedTimes } = useLocalSearchParams<{
    categories: string;
    selectedTimes: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nickname: "",
  });

  // 파라미터에서 데이터 파싱 및 디버깅
  const selectedCategories = categories ? JSON.parse(categories) : [];

  console.log("🔍 === UserRegistration 파라미터 디버깅 ===");
  console.log("📋 categories (raw):", categories);
  console.log("📋 selectedTimes (raw):", selectedTimes);
  console.log("📋 selectedCategories (parsed):", selectedCategories);

  let timeData = null;
  try {
    timeData = selectedTimes ? JSON.parse(selectedTimes) : null;
    console.log("⏰ timeData (parsed):", timeData);
    console.log("⏰ timeData type:", typeof timeData);
    if (timeData) {
      console.log("⏰ timeData.morning:", timeData.morning);
      console.log("⏰ timeData.evening:", timeData.evening);
    }
  } catch (parseError) {
    console.error("❌ selectedTimes 파싱 오류:", parseError);
    console.error("❌ selectedTimes 원본:", selectedTimes);
  }
  console.log("🔍 =======================================");

  // DeviceId 생성 또는 가져오기
  const getOrCreateDeviceId = async (): Promise<string> => {
    try {
      let deviceId = await AsyncStorage.getItem("deviceId");
      if (!deviceId) {
        deviceId = uuid.v4() as string;
        await AsyncStorage.setItem("deviceId", deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error("DeviceId 생성/조회 오류:", error);
      return uuid.v4() as string;
    }
  };

  // 사용자 존재 여부 확인
  const checkUserExists = async (deviceId: string): Promise<boolean> => {
    try {
      console.log("👤 사용자 존재 여부 확인 중:", deviceId);

      const response = await fetch(
        `http://13.124.111.205:8080/api/users/${encodeURIComponent(deviceId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("👤 사용자 존재 확인 응답 상태:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("👤 사용자 존재 확인 응답:", result);
        return result.success && result.data;
      }

      return false;
    } catch (error) {
      console.error("👤 사용자 존재 확인 오류:", error);
      return false;
    }
  };

  // 사용자 등록 API 호출
  const registerUser = async (userData: UserRegistrationData) => {
    try {
      console.log("👤 === 사용자 등록 API 호출 시작 ===");
      console.log("📤 전송 데이터:", JSON.stringify(userData, null, 2));

      const response = await fetch(
        "http://13.124.111.205:8080/api/users/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deviceId: userData.deviceId,
            name: userData.name || null,
            email: userData.email || null,
            nickname: userData.nickname,
            password: null,
          }),
        }
      );

      const result = await response.json();
      console.log("👤 사용자 등록 응답:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "사용자 등록에 실패했습니다.");
      }

      return result;
    } catch (error) {
      console.error("👤 사용자 등록 오류:", error);
      throw error;
    }
  };

  // 사용자 정보 업데이트 API 호출 (새로 추가)
  const updateUser = async (userData: UserUpdateData) => {
    try {
      console.log("🔄 === 사용자 정보 업데이트 API 호출 시작 ===");
      console.log("📤 전송 데이터:", JSON.stringify(userData, null, 2));

      const response = await fetch(
        `http://13.124.111.205:8080/api/users/${encodeURIComponent(
          userData.deviceId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: userData.name || null,
            email: userData.email || null,
            nickname: userData.nickname,
          }),
        }
      );

      const result = await response.json();
      console.log("🔄 사용자 정보 업데이트 응답:", result);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "사용자 정보 업데이트에 실패했습니다."
        );
      }

      return result;
    } catch (error) {
      console.error("🔄 사용자 정보 업데이트 오류:", error);
      throw error;
    }
  };

  // 시간 형식 변환 함수 (HH:MM 형식 확인 및 변환)
  const convertTimeFormat = (timeString: string): string => {
    console.log("🔄 convertTimeFormat 호출:", timeString);

    if (!timeString) {
      console.log("   ❌ 입력값이 없음");
      return "";
    }

    // 이미 HH:MM 형식인 경우 그대로 반환
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      console.log("   ✅ 이미 HH:MM 형식:", timeString);
      return timeString;
    }

    // "9시" → "09:00" 형식으로 변환 (기존 호환성)
    const hourMatch = timeString.match(/(\d+)시/);
    if (hourMatch) {
      const hour = parseInt(hourMatch[1]);
      const result = hour.toString().padStart(2, "0") + ":00";
      console.log("   ✅ '시' 형식 변환:", timeString, "→", result);
      return result;
    }

    console.log("   ⚠️ 변환할 수 없는 형식, 원본 반환:", timeString);
    return timeString;
  };

  // 알림 시간 등록 API 호출
  const registerNotificationSchedule = async (
    scheduleData: NotificationScheduleData
  ) => {
    try {
      console.log("🌐 === 알림 시간 등록 API 호출 시작 ===");
      console.log("📤 전송 데이터:", JSON.stringify(scheduleData, null, 2));

      const response = await fetch(
        "http://13.124.111.205:8080/api/users/schedules",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(scheduleData),
        }
      );

      console.log("📥 응답 상태:", response.status);

      const result = await response.json();
      console.log("📥 응답 데이터:", JSON.stringify(result, null, 2));
      console.log("🌐 === 알림 시간 등록 API 호출 종료 ===");

      if (!response.ok || !result.success) {
        throw new Error(result.message || "알림 시간 등록에 실패했습니다.");
      }

      return result;
    } catch (error) {
      console.error("🚨 알림 시간 등록 오류:", error);
      throw error;
    }
  };

  // FCM 토큰 처리
  const handleFCMToken = async (deviceId: string) => {
    try {
      console.log("🔔 === FCM 토큰 처리 시작 ===");

      const notificationService = NotificationService.getInstance();

      // 기존에 저장된 토큰이 있는지 확인
      let token = await notificationService.getStoredToken();

      if (!token) {
        console.log("📱 저장된 토큰이 없음 - 새로 요청");
        token = await notificationService.getFCMToken();
      } else {
        console.log("📱 저장된 토큰 사용:", token);
      }

      if (token) {
        const success = await notificationService.sendTokenToBackend(
          token,
          deviceId
        );
        if (success) {
          console.log("✅ FCM 토큰 백엔드 전송 성공");
          return true;
        } else {
          console.log("⚠️ FCM 토큰 백엔드 전송 실패");
          return false;
        }
      } else {
        console.log("⚠️ FCM 토큰을 받지 못함");
        return false;
      }
    } catch (error) {
      console.error("❌ FCM 토큰 처리 오류:", error);
      return false;
    }
  };

  // 설정 완료 플래그 저장
  const saveSetupCompleted = async () => {
    try {
      await AsyncStorage.setItem("setupCompleted", "true");
      console.log("설정 완료 플래그가 저장되었습니다");
    } catch (error) {
      console.error("설정 완료 플래그 저장 오류:", error);
    }
  };

  // 완료 버튼 처리 (수정됨)
  const handleComplete = async () => {
    // 필수 필드 검증 (닉네임만)
    if (!formData.nickname.trim()) {
      Alert.alert("입력 오류", "닉네임은 필수 입력 항목입니다.");
      return;
    }

    setLoading(true);

    try {
      // DeviceId 생성/가져오기
      const deviceId = await getOrCreateDeviceId();
      console.log("🆔 DeviceId:", deviceId);

      // 사용자 존재 여부 확인
      const userExists = await checkUserExists(deviceId);
      console.log("👤 사용자 존재 여부:", userExists);

      // 사용자가 존재하면 업데이트, 존재하지 않으면 등록
      if (userExists) {
        console.log("🔄 기존 사용자 정보 업데이트 진행");
        const userUpdateData: UserUpdateData = {
          deviceId: deviceId,
          name: undefined, // 빈 값 대신 undefined
          email: undefined, // 빈 값 대신 undefined
          nickname: formData.nickname.trim(),
        };

        await updateUser(userUpdateData);
        console.log("✅ 사용자 정보 업데이트 성공");
      } else {
        console.log("👤 새 사용자 등록 진행");
        const userRegistrationData: UserRegistrationData = {
          deviceId: deviceId,
          name: undefined, // 빈 값 대신 undefined
          email: undefined, // 빈 값 대신 undefined
          nickname: formData.nickname.trim(),
          password: undefined,
        };

        await registerUser(userRegistrationData);
        console.log("✅ 사용자 등록 성공");
      }

      // 사용자 정보를 AsyncStorage에 저장
      await AsyncStorage.setItem(
        "userInfo",
        JSON.stringify({
          deviceId: deviceId,
          name: "", // 빈 값으로 저장
          email: "", // 빈 값으로 저장
          nickname: formData.nickname.trim(),
        })
      );

      // 설정 완료 플래그 저장
      await saveSetupCompleted();

      // FCM 토큰 처리
      console.log("🔔 FCM 토큰 처리 시작");
      const fcmSuccess = await handleFCMToken(deviceId);
      if (fcmSuccess) {
        console.log("✅ FCM 토큰 처리 성공");
      } else {
        console.log("⚠️ FCM 토큰 처리 실패 (나중에 자동으로 재시도됩니다)");
      }

      // 알림 시간 등록 (별도 처리 - 실패해도 진행)
      let notificationSuccess = true;

      console.log("⏰ === 알림 시간 등록 프로세스 시작 ===");
      console.log("⏰ timeData:", timeData);

      if (timeData && timeData.morning && timeData.evening) {
        try {
          // 시간 변환
          const morningTime = convertTimeFormat(timeData.morning);
          const eveningTime = convertTimeFormat(timeData.evening);

          console.log(
            "⏰ 변환된 시간 - 아침:",
            morningTime,
            "저녁:",
            eveningTime
          );

          if (!morningTime || !eveningTime) {
            throw new Error("시간 변환 실패");
          }

          const notificationScheduleData: NotificationScheduleData = {
            deviceId: deviceId,
            notificationTime: [morningTime, eveningTime],
          };

          await registerNotificationSchedule(notificationScheduleData);
          console.log("✅ 알림 시간 등록 성공!");
        } catch (notificationError) {
          console.error("❌ 알림 시간 등록 실패:", notificationError);
          notificationSuccess = false;

          // 기본값으로 재시도
          try {
            console.log("⏰ 기본값으로 재시도");
            const defaultData: NotificationScheduleData = {
              deviceId: deviceId,
              notificationTime: ["09:00", "18:00"],
            };

            await registerNotificationSchedule(defaultData);
            console.log("✅ 기본값으로 알림 시간 등록 성공!");
            notificationSuccess = true;
          } catch (defaultError) {
            console.error("❌ 기본값 등록도 실패:", defaultError);
          }
        }
      } else {
        console.log("⏰ timeData 없음 - 기본값으로 등록 시도");
        try {
          const defaultData: NotificationScheduleData = {
            deviceId: deviceId,
            notificationTime: ["09:00", "18:00"],
          };

          await registerNotificationSchedule(defaultData);
          console.log("✅ 기본값으로 알림 시간 등록 성공!");
        } catch (defaultError) {
          console.error("❌ 기본값 등록 실패:", defaultError);
          notificationSuccess = false;
        }
      }

      // 결과에 따른 메시지 표시
      let message = "등록이 완료되었습니다!";

      if (!fcmSuccess && !notificationSuccess) {
        message =
          "사용자 등록은 완료되었으나, 알림 설정에 문제가 있었습니다.\n설정에서 나중에 변경할 수 있습니다.";
      } else if (!fcmSuccess) {
        message = "등록이 완료되었습니다!\n알림 토큰은 자동으로 재시도됩니다.";
      } else if (!notificationSuccess) {
        message =
          "등록이 완료되었습니다!\n알림 시간 설정에 문제가 있었습니다. 설정에서 변경할 수 있습니다.";
      }

      Alert.alert("완료", message, [
        {
          text: "확인",
          onPress: () => {
            router.push({
              pathname: "/(tabs)",
              params: {
                categories: categories,
                selectedTimes: selectedTimes,
              },
            });
          },
        },
      ]);
    } catch (error) {
      console.error("등록 과정 오류:", error);

      const errorMessage =
        error instanceof Error ? error.message : "처리 중 오류가 발생했습니다.";

      Alert.alert("오류", errorMessage, [{ text: "확인" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </Pressable>
        <Text style={styles.headerTitle}>사용자 정보 입력</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 안내 문구 */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            마지막 단계입니다!{"\n"}닉네임을 입력해주세요.
          </Text>
          <Text style={styles.instructionSubText}>
            * 표시된 항목은 필수 입력사항입니다.
          </Text>
        </View>

        {/* 입력 폼 */}
        <View style={styles.formContainer}>
          {/* 이름 (숨김 처리) */}
          <View style={[styles.inputGroup, styles.hiddenInput]}>
            <Text style={styles.inputLabel}>이름 (선택사항)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="실명을 입력해주세요"
              placeholderTextColor="#C7C7CC"
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* 이메일 (숨김 처리) */}
          <View style={[styles.inputGroup, styles.hiddenInput]}>
            <Text style={styles.inputLabel}>이메일 (선택사항)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="example@email.com"
              placeholderTextColor="#C7C7CC"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* 닉네임 (필수) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, styles.requiredLabel]}>
              닉네임 *
            </Text>
            <TextInput
              style={[styles.textInput, styles.requiredInput]}
              value={formData.nickname}
              onChangeText={(text) =>
                setFormData({ ...formData, nickname: text })
              }
              placeholder="사용하실 닉네임을 입력해주세요"
              placeholderTextColor="#C7C7CC"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleComplete}
            />
          </View>
        </View>

        {/* 설정 요약 */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>설정 요약</Text>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>관심 분야:</Text>
            <Text style={styles.summaryValue}>
              {selectedCategories.join(", ")}
            </Text>
          </View>

          {timeData && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>알림 시간:</Text>
              <Text style={styles.summaryValue}>
                아침 {timeData.morning}, 저녁 {timeData.evening}
              </Text>
            </View>
          )}

          {/* FCM 알림 안내 추가 */}
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>알림 설정:</Text>
            <Text style={styles.summaryValue}>
              푸시 알림이 자동으로 설정됩니다
            </Text>
          </View>
        </View>

        {/* 완료 버튼 */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.completeButton,
              !formData.nickname.trim() && styles.disabledButton,
              pressed && styles.pressedButton,
            ]}
            onPress={handleComplete}
            disabled={!formData.nickname.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.completeButtonText,
                  !formData.nickname.trim() && styles.disabledButtonText,
                ]}
              >
                등록 완료
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  instructionContainer: {
    marginTop: 20,
    marginBottom: 30,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  instructionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 26,
  },
  instructionSubText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  // 숨김 처리 스타일 추가
  hiddenInput: {
    display: "none",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 8,
  },
  requiredLabel: {
    color: "#FF3B30",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },
  requiredInput: {
    borderColor: "#FF3B30",
    borderWidth: 2,
  },
  summaryContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
    textAlign: "center",
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8E8E93",
    width: 80,
  },
  summaryValue: {
    fontSize: 14,
    color: "#000000",
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingBottom: 30,
  },
  completeButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: "#C7C7CC",
  },
  pressedButton: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  disabledButtonText: {
    color: "#8E8E93",
  },
});
