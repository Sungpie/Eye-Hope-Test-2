import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userApiService, debugApiRequest } from "./services/userApi"; // debugApiRequest 추가
import { getDeviceId } from "./utils/uuid";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedSetup, setHasCompletedSetup] = useState(false);

  useEffect(() => {
    checkInitialSetup();
  }, []);

  const checkInitialSetup = async () => {
    try {
      console.log("초기 설정 확인 시작");

      // 디바이스 ID 확인/생성
      const deviceId = await getDeviceId();
      console.log("디바이스 ID:", deviceId);

      // 🔍 API 디버깅 실행 (500 오류 분석용)
      console.log("🔍 API 디버깅 시작...");
      await debugApiRequest(deviceId);

      // 백엔드에서 사용자 존재 여부 확인 (에러 처리 개선)
      try {
        const userExists = await userApiService.checkUserExists();
        console.log("백엔드 사용자 존재 여부:", userExists);

        if (userExists) {
          // 백엔드에 사용자가 있으면 사용자 정보를 가져와서 로컬에 저장
          try {
            const profileResponse = await userApiService.getUserProfile();
            if (profileResponse.success && profileResponse.data) {
              const profile = profileResponse.data;
              console.log("사용자 프로필 가져오기 성공:", profile);

              // 로컬 스토리지에 사용자 정보 저장
              await AsyncStorage.setItem(
                "userNickname",
                profile.nickname || ""
              );
              await AsyncStorage.setItem("userEmail", profile.email || "");
              await AsyncStorage.setItem(
                "userCategories",
                JSON.stringify(profile.categories || [])
              );
              await AsyncStorage.setItem(
                "userTimes",
                JSON.stringify(profile.schedules || {})
              );
              await AsyncStorage.setItem("setupCompleted", "true");

              setHasCompletedSetup(true);
              return; // 성공 시 바로 반환
            }
          } catch (profileError) {
            console.log("프로필 가져오기 실패:", profileError);
          }
        }
      } catch (apiError) {
        console.log("백엔드 API 호출 실패:", apiError);
        // API 실패는 정상적인 상황으로 처리 (서버가 없을 수 있음)
      }

      // 백엔드 실패 시 또는 사용자가 없을 시 로컬 데이터 확인
      console.log("로컬 데이터로 초기 설정 확인");
      await checkLocalSetup();
    } catch (error) {
      console.error("초기 설정 확인 중 예상치 못한 오류:", error);
      // 모든 오류 발생 시 기본적으로 설정 미완료로 처리
      setHasCompletedSetup(false);
    } finally {
      // 반드시 로딩 상태 해제
      setIsLoading(false);
    }
  };

  const checkLocalSetup = async () => {
    try {
      // 로컬 저장된 설정 정보 확인
      const savedNickname = await AsyncStorage.getItem("userNickname");
      const savedCategories = await AsyncStorage.getItem("userCategories");
      const savedTimes = await AsyncStorage.getItem("userTimes");
      const setupCompleted = await AsyncStorage.getItem("setupCompleted");

      console.log("로컬 설정 확인:");
      console.log("- 닉네임:", savedNickname);
      console.log("- 카테고리:", savedCategories ? "있음" : "없음");
      console.log("- 시간:", savedTimes ? "있음" : "없음");
      console.log("- 설정완료:", setupCompleted);

      // 모든 필수 정보가 있으면 설정 완료로 판단
      if (
        savedNickname &&
        savedCategories &&
        savedTimes &&
        setupCompleted === "true"
      ) {
        setHasCompletedSetup(true);
      } else {
        setHasCompletedSetup(false);
      }
    } catch (error) {
      console.error("로컬 설정 확인 오류:", error);
      setHasCompletedSetup(false);
    }
  };

  // 로딩 중일 때 스플래시 화면 표시
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // 설정 완료 여부에 따라 적절한 화면으로 리다이렉트
  if (hasCompletedSetup) {
    // 설정이 완료되었으면 바로 관심뉴스 탭으로 이동 (index 탭)
    return <Redirect href="/(tabs)" />;
  } else {
    // 설정이 완료되지 않았으면 카테고리 선택 화면으로 이동
    return <Redirect href="/selectCategory" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
