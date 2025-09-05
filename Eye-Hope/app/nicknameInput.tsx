import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userApiService } from "./services/userApi";

export default function NicknameInputScreen() {
  const { categories, selectedTimes } = useLocalSearchParams<{
    categories: string;
    selectedTimes: string;
  }>();
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // JSON 문자열을 파싱하여 카테고리 배열과 시간 정보로 변환
  const selectedCategories = categories ? JSON.parse(categories) : [];
  const timeInfo = selectedTimes ? JSON.parse(selectedTimes) : null;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleComplete = async () => {
    // 입력 검증
    if (!nickname.trim()) {
      Alert.alert("알림", "닉네임을 입력해주세요.");
      return;
    }

    if (nickname.trim().length < 2) {
      Alert.alert("알림", "닉네임은 2글자 이상 입력해주세요.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("알림", "이메일을 입력해주세요.");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("알림", "올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      console.log("사용자 등록 시작");
      console.log("닉네임:", nickname);
      console.log("이메일:", email);
      console.log("선택된 카테고리:", selectedCategories);
      console.log("시간 정보:", timeInfo);

      // 백엔드에 사용자 등록
      const response = await userApiService.registerUser({
        name: nickname, // API 명세에 따라 name 필드 사용
        email: email,
        nickname: nickname,
        password: "defaultPassword", // 임시 비밀번호 (추후 수정 필요)
      });

      if (response.success) {
        console.log("사용자 등록 성공");

        // 로컬에도 사용자 정보 저장
        await AsyncStorage.setItem("userNickname", nickname.trim());
        await AsyncStorage.setItem("userEmail", email.trim());
        await AsyncStorage.setItem(
          "userCategories",
          JSON.stringify(selectedCategories)
        );
        if (timeInfo) {
          await AsyncStorage.setItem("userTimes", JSON.stringify(timeInfo));
        }
        await AsyncStorage.setItem("setupCompleted", "true");

        console.log("로컬 저장 완료");

        // 성공 메시지 표시
        Alert.alert(
          "가입 완료!",
          `안녕하세요, ${nickname}님!\nEye-Hope에 오신 것을 환영합니다.`,
          [
            {
              text: "확인",
              onPress: () => {
                // 메인 화면으로 이동 - replace 사용으로 무한 루프 방지
                router.replace("/(tabs)" as any);
              },
            },
          ]
        );
      } else {
        console.error("사용자 등록 실패:", response.message);
        Alert.alert("오류", response.message || "사용자 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("사용자 등록 중 오류:", error);
      Alert.alert("오류", "사용자 등록 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = nickname.trim().length >= 2 && validateEmail(email);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 상단 안내 문구 */}
          <View style={styles.headerContainer}>
            <Ionicons name="person-circle" size={80} color="#007AFF" />
            <Text style={styles.headerTitle}>거의 다 왔어요!</Text>
            <Text style={styles.headerSubtitle}>
              마지막으로 닉네임과 이메일을 입력해주세요
            </Text>
          </View>

          {/* 입력 폼 */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>닉네임</Text>
              <TextInput
                style={styles.textInput}
                value={nickname}
                onChangeText={setNickname}
                placeholder="사용하실 닉네임을 입력해주세요"
                placeholderTextColor="#8E8E93"
                maxLength={20}
                autoCapitalize="none"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  // 다음 입력 필드로 포커스 이동 (구현 시 ref 사용)
                }}
              />
              <Text style={styles.inputHelper}>
                2글자 이상, 20글자 이하로 입력해주세요
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>이메일</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="#8E8E93"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleComplete}
              />
              <Text style={styles.inputHelper}>
                알림 및 소식 전달용으로 사용됩니다
              </Text>
            </View>
          </View>

          {/* 선택 사항 요약 */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>설정 요약</Text>
            <View style={styles.summaryItem}>
              <Ionicons name="grid" size={20} color="#007AFF" />
              <Text style={styles.summaryText}>
                관심 카테고리: {selectedCategories.join(", ")}
              </Text>
            </View>
            {timeInfo && (
              <View style={styles.summaryItem}>
                <Ionicons name="time" size={20} color="#007AFF" />
                <Text style={styles.summaryText}>
                  알림 시간: {timeInfo.morning}, {timeInfo.evening}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 하단 완료 버튼 */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.completeButton,
              !isFormValid && styles.disabledButton,
              pressed && styles.pressedButton,
            ]}
            onPress={handleComplete}
            disabled={!isFormValid || loading}
            accessibilityLabel="가입 완료 버튼"
            accessibilityRole="button"
            accessibilityState={{ disabled: !isFormValid || loading }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text
                  style={[
                    styles.completeButtonText,
                    !isFormValid && styles.disabledButtonText,
                  ]}
                >
                  가입 완료
                </Text>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={isFormValid ? "#FFFFFF" : "#999999"}
                  style={styles.buttonIcon}
                />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    minHeight: 52,
  },
  inputHelper: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 6,
    lineHeight: 18,
  },
  summaryContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
    backgroundColor: "#F2F2F7",
  },
  completeButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
    elevation: 0,
    shadowOpacity: 0,
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
    color: "#999999",
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
