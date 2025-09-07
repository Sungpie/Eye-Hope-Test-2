import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { NotificationSettings } from "../../components/NotificationSettings";

// 카테고리별 색상 매핑 함수 추가
const getCategoryColor = (category: string): string => {
  const colorMap: { [key: string]: string } = {
    경제: "#FF6B6B",
    증권: "#4ECDC4",
    스포츠: "#45B7D1",
    연예: "#96CEB4",
    정치: "#FECA57",
    IT: "#48CAE4",
    사회: "#FF9FF3",
    오피니언: "#54A0FF",
  };

  return colorMap[category] || "#007AFF"; // 기본색상
};

// 카테고리 매핑 함수들 (안전하게 수정)
const categoryToId = (category: string): string => {
  const mapping: { [key: string]: number } = {
    경제: 1,
    증권: 2,
    스포츠: 3,
    연예: 4,
    정치: 5,
    IT: 6,
    사회: 7,
    오피니언: 8,
  };
  const id = mapping[category];
  return id ? id.toString() : "0"; // 숫자를 문자열로 변환
};

const idToCategory = (id: number): string => {
  const mapping: { [key: number]: string } = {
    1: "경제",
    2: "증권",
    3: "스포츠",
    4: "연예",
    5: "정치",
    6: "IT",
    7: "사회",
    8: "오피니언",
  };
  return mapping[id] || "";
};

interface UserInfo {
  deviceId: string;
  name?: string;
  email?: string;
  nickname: string;
}

interface NewsItem {
  id: number;
  category: string;
  pressName: string;
}

interface UserNewsResponse {
  success: boolean;
  message: string;
  data: {
    deviceId: string;
    news: NewsItem[];
  };
}

interface UserScheduleResponse {
  success: boolean;
  message: string;
  data: {
    deviceId: string;
    notificationTime: string[];
  };
}

export default function SettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 상태 관리
  const [currentCategories, setCurrentCategories] = useState<string[]>([
    "경제",
    "정치",
    "사회",
    "IT",
    "스포츠",
  ]);
  const [currentTimes, setCurrentTimes] = useState<{
    morning: string;
    evening: string;
  }>({
    morning: "오전 9시",
    evening: "오후 8시",
  });
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // 앱 시작 시 저장된 데이터 로드
  useEffect(() => {
    loadSavedData();
  }, []);

  // 화면이 포커스될 때마다 저장된 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
      console.log("설정 화면 포커스됨 - 데이터 새로고침");
      console.log("현재 params:", params);

      // 파라미터가 있으면 우선 처리 후 즉시 반환
      if (
        params.selectedCategories ||
        params.selectedTimes ||
        params.updatedUserInfo
      ) {
        console.log("파라미터가 있어서 파라미터 우선 처리");
        handleParamsUpdate();
        return;
      }

      // 파라미터가 없을 때만 저장된 데이터 로드
      console.log("파라미터가 없어서 저장된 데이터 로드");
      loadSavedData();
    }, [
      params.selectedCategories,
      params.selectedTimes,
      params.updatedUserInfo,
      params.fromNewsUpdate,
    ])
  );

  // 백엔드에서 사용자 정보 가져오기
  const fetchUserInfo = async (): Promise<UserInfo | null> => {
    try {
      const deviceId = await AsyncStorage.getItem("deviceId");
      if (!deviceId) {
        console.log("DeviceId가 없습니다");
        return null;
      }

      console.log("👤 === 백엔드에서 사용자 정보 가져오기 시작 ===");
      console.log("📤 DeviceId:", deviceId);

      const response = await fetch(
        `http://13.124.111.205:8080/api/users/${encodeURIComponent(deviceId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📥 사용자 정보 응답 상태:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log(
          "📥 사용자 정보 응답 데이터:",
          JSON.stringify(result, null, 2)
        );

        if (result.success && result.data) {
          return result.data;
        } else {
          console.log(
            "📥 사용자 정보 응답 데이터 형식이 올바르지 않음:",
            result
          );
          return null;
        }
      } else {
        const errorText = await response.text();
        console.log(
          "📥 사용자 정보 HTTP 오류 응답:",
          response.status,
          errorText
        );
        return null;
      }
    } catch (error) {
      console.error("🚨 사용자 정보 가져오기 오류:", error);
      return null;
    }
  };

  // 백엔드에서 사용자 관심 뉴스 가져오기 (수정된 API 경로)
  const fetchUserNews = async (): Promise<string[] | null> => {
    try {
      const deviceId = await AsyncStorage.getItem("deviceId");
      if (!deviceId) {
        console.log("DeviceId가 없습니다");
        return null;
      }

      console.log("📰 === 백엔드에서 사용자 관심 뉴스 가져오기 시작 ===");
      console.log("📤 DeviceId:", deviceId);

      // 수정된 API 엔드포인트 사용 (apis -> api)
      const response = await fetch(
        `http://13.124.111.205:8080/api/users/news/${encodeURIComponent(
          deviceId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📥 관심 뉴스 응답 상태:", response.status);

      if (response.ok) {
        const result: UserNewsResponse = await response.json();
        console.log(
          "📥 관심 뉴스 응답 데이터:",
          JSON.stringify(result, null, 2)
        );

        if (result.success && result.data && Array.isArray(result.data.news)) {
          // 새로운 응답 형식에서 카테고리명 추출
          const categories = result.data.news.map(
            (newsItem: NewsItem) => newsItem.category
          );
          console.log("📰 추출된 카테고리:", categories);

          // 유효한 카테고리만 필터링
          const validCategories = categories.filter(
            (cat) => cat && cat.trim() !== ""
          );
          console.log("📰 유효한 카테고리:", validCategories);

          return validCategories;
        } else {
          console.log("📰 관심 뉴스 응답 데이터 형식이 올바르지 않음:", result);
          return null;
        }
      } else {
        const errorText = await response.text();
        console.log("📰 관심 뉴스 HTTP 오류 응답:", response.status, errorText);
        return null;
      }
    } catch (error) {
      console.error("🚨 사용자 관심 뉴스 가져오기 오류:", error);
      return null;
    }
  };

  // 백엔드에서 사용자 알림 시간 가져오기 (새로 추가)
  const fetchUserSchedule = async (): Promise<{
    morning: string;
    evening: string;
  } | null> => {
    try {
      const deviceId = await AsyncStorage.getItem("deviceId");
      if (!deviceId) {
        console.log("DeviceId가 없습니다");
        return null;
      }

      console.log("⏰ === 백엔드에서 사용자 알림 시간 가져오기 시작 ===");
      console.log("📤 DeviceId:", deviceId);

      const response = await fetch(
        `http://13.124.111.205:8080/api/users/schedules/${encodeURIComponent(
          deviceId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📥 알림 시간 응답 상태:", response.status);

      if (response.ok) {
        const result: UserScheduleResponse = await response.json();
        console.log(
          "📥 알림 시간 응답 데이터:",
          JSON.stringify(result, null, 2)
        );

        if (
          result.success &&
          result.data &&
          Array.isArray(result.data.notificationTime)
        ) {
          const times = result.data.notificationTime;
          if (times.length >= 2) {
            return {
              morning: times[0],
              evening: times[1],
            };
          }
        }

        console.log("📥 알림 시간 응답 데이터 형식이 올바르지 않음:", result);
        return null;
      } else {
        const errorText = await response.text();
        console.log("📥 알림 시간 HTTP 오류 응답:", response.status, errorText);
        return null;
      }
    } catch (error) {
      console.error("🚨 사용자 알림 시간 가져오기 오류:", error);
      return null;
    }
  };

  // 저장된 데이터 불러오기
  const loadSavedData = async () => {
    setLoading(true);

    try {
      // 1. 사용자 정보 가져오기
      const backendUserInfo = await fetchUserInfo();

      if (backendUserInfo) {
        console.log("✅ 백엔드에서 사용자 정보 로드됨:", backendUserInfo);
        setUserInfo(backendUserInfo);
        // 백엔드 데이터를 로컬에도 동기화
        await AsyncStorage.setItem("userInfo", JSON.stringify(backendUserInfo));
      } else {
        // 백엔드에서 가져오기 실패 시 로컬 데이터 사용
        console.log(
          "⚠️ 백엔드에서 사용자 정보 가져오기 실패 - 로컬 데이터 사용"
        );
        const savedUserInfo = await AsyncStorage.getItem("userInfo");
        if (savedUserInfo) {
          const parsedUserInfo = JSON.parse(savedUserInfo);
          setUserInfo(parsedUserInfo);
          console.log("📱 로컬에서 사용자 정보 로드됨:", parsedUserInfo);
        }
      }

      // 2. 관심 뉴스 가져오기
      const backendCategories = await fetchUserNews();

      if (backendCategories && backendCategories.length > 0) {
        console.log("✅ 백엔드에서 관심 뉴스 로드됨:", backendCategories);
        setCurrentCategories(backendCategories);
        // 백엔드 데이터를 로컬에도 동기화
        await AsyncStorage.setItem(
          "userCategories",
          JSON.stringify(backendCategories)
        );
      } else {
        // 백엔드에서 가져오기 실패 시 로컬 데이터 사용
        console.log("⚠️ 백엔드에서 관심 뉴스 가져오기 실패 - 로컬 데이터 사용");
        const savedCategories = await AsyncStorage.getItem("userCategories");
        if (savedCategories) {
          const parsedCategories = JSON.parse(savedCategories);
          setCurrentCategories(parsedCategories);
          console.log("📱 로컬에서 관심 뉴스 로드됨:", parsedCategories);
        }
      }

      // 3. 알림 시간 가져오기
      const backendSchedule = await fetchUserSchedule();

      if (backendSchedule) {
        console.log("✅ 백엔드에서 알림 시간 로드됨:", backendSchedule);
        setCurrentTimes(backendSchedule);
        // 백엔드 데이터를 로컬에도 동기화
        await AsyncStorage.setItem(
          "userTimes",
          JSON.stringify(backendSchedule)
        );
      } else {
        // 백엔드에서 가져오기 실패 시 로컬 데이터 사용
        console.log("⚠️ 백엔드에서 알림 시간 가져오기 실패 - 로컬 데이터 사용");
        const savedTimes = await AsyncStorage.getItem("userTimes");
        if (savedTimes) {
          const parsedTimes = JSON.parse(savedTimes);
          setCurrentTimes(parsedTimes);
          console.log("📱 로컬에서 알림 시간 로드됨:", parsedTimes);
        }
      }
    } catch (error) {
      console.error("❌ 저장된 데이터 로드 오류:", error);

      // 에러 발생 시 사용자에게 알림 (선택사항)
      Alert.alert(
        "데이터 로드 오류",
        "일부 데이터를 불러오는 중 문제가 발생했습니다. 로컬 데이터로 표시됩니다.",
        [{ text: "확인" }]
      );

      // 에러 발생 시에도 로컬 데이터는 로드
      try {
        const savedCategories = await AsyncStorage.getItem("userCategories");
        const savedTimes = await AsyncStorage.getItem("userTimes");
        const savedUserInfo = await AsyncStorage.getItem("userInfo");

        if (savedCategories) {
          setCurrentCategories(JSON.parse(savedCategories));
        }
        if (savedTimes) {
          setCurrentTimes(JSON.parse(savedTimes));
        }
        if (savedUserInfo) {
          setUserInfo(JSON.parse(savedUserInfo));
        }
      } catch (localError) {
        console.error("❌ 로컬 데이터 로드도 실패:", localError);
      }
    } finally {
      setLoading(false);
    }
  };

  // AsyncStorage에 카테고리 저장
  const saveCategoriesToStorage = async (categories: string[]) => {
    try {
      await AsyncStorage.setItem("userCategories", JSON.stringify(categories));
      console.log("카테고리가 저장되었습니다:", categories);
    } catch (error) {
      console.error("카테고리 저장 오류:", error);
    }
  };

  // AsyncStorage에 시간 정보 저장
  const saveTimesToStorage = async (times: {
    morning: string;
    evening: string;
  }) => {
    try {
      await AsyncStorage.setItem("userTimes", JSON.stringify(times));
      console.log("시간 정보가 저장되었습니다:", times);
    } catch (error) {
      console.error("시간 정보 저장 오류:", error);
    }
  };

  // 파라미터 업데이트 처리 함수
  const handleParamsUpdate = () => {
    console.log("파라미터 업데이트 처리 시작");

    // selectedCategories 파라미터가 있으면 업데이트
    if (params.selectedCategories) {
      try {
        const categories = JSON.parse(params.selectedCategories as string);
        console.log("파라미터에서 카테고리 파싱:", categories);
        if (Array.isArray(categories)) {
          console.log("카테고리 상태 업데이트:", categories);
          setCurrentCategories(categories);
          // AsyncStorage에 카테고리 저장
          saveCategoriesToStorage(categories);
        }
      } catch (error) {
        console.error("카테고리 파싱 오류:", error);
      }
    }

    // selectedTimes 파라미터가 있으면 업데이트
    if (params.selectedTimes) {
      try {
        const times = JSON.parse(params.selectedTimes as string);
        if (times.morning && times.evening) {
          const newTimes = {
            morning: times.morning,
            evening: times.evening,
          };
          console.log("시간 상태 업데이트:", newTimes);
          setCurrentTimes(newTimes);
          // AsyncStorage에 시간 정보 저장
          saveTimesToStorage(newTimes);
        }
      } catch (error) {
        console.error("시간 파라미터 파싱 오류:", error);
      }
    }

    // updatedUserInfo 파라미터가 있으면 업데이트
    if (params.updatedUserInfo) {
      try {
        const updatedInfo = JSON.parse(params.updatedUserInfo as string);
        console.log("사용자 정보 상태 업데이트:", updatedInfo);
        setUserInfo(updatedInfo);
        // AsyncStorage에 사용자 정보 저장
        AsyncStorage.setItem("userInfo", JSON.stringify(updatedInfo));
      } catch (error) {
        console.error("사용자 정보 파라미터 파싱 오류:", error);
      }
    }

    // fromNewsUpdate 파라미터가 있으면 백엔드에서 최신 뉴스 정보 다시 로드
    if (params.fromNewsUpdate === "true") {
      console.log("뉴스 업데이트 완료 - 백엔드에서 최신 정보 로드");
      loadSavedData();
    }

    console.log("파라미터 업데이트 처리 완료");
  };

  const handleCategoryChange = () => {
    router.push({
      pathname: "/selectCategory",
      params: { fromSettings: "true" },
    });
  };

  const handleTimeChange = () => {
    router.push({
      pathname: "/timeSelect" as any,
      params: { fromSettings: "true" },
    });
  };

  // 사용자 정보 변경 페이지로 이동
  const handleUserInfoChange = () => {
    router.push({
      pathname: "/userEdit",
      params: {
        currentUserInfo: JSON.stringify(userInfo || {}),
        fromSettings: "true",
      },
    });
  };

  // 접근성을 위한 사용자 정보 텍스트 생성
  const getUserInfoAccessibilityLabel = () => {
    if (!userInfo) {
      return "사용자 정보를 불러올 수 없습니다. 사용자 정보 변경을 원하신다면 두 번 눌러주세요";
    }

    let label = "사용자 정보. ";
    label += `닉네임: ${userInfo.nickname || "정보 없음"}. `;
    if (userInfo.name) {
      label += `이름: ${userInfo.name}. `;
    }
    if (userInfo.email) {
      label += `이메일: ${userInfo.email}. `;
    }
    if (userInfo.deviceId) {
      label += `Device ID: ${userInfo.deviceId.substring(0, 8)}.... `;
    }
    label += "사용자 정보 변경을 원하신다면 두 번 눌러주세요";

    return label;
  };

  // 접근성을 위한 관심뉴스 텍스트 생성
  const getCategoriesAccessibilityLabel = () => {
    let label = "현재 관심뉴스. ";
    if (currentCategories.length > 0) {
      label += `선택된 카테고리: ${currentCategories.join(", ")}. `;
    } else {
      label += "선택된 카테고리가 없습니다. ";
    }
    label +=
      "관심뉴스를 수정 변경하시겠어요? 변경을 원하신다면 두 번 눌러주세요.";

    return label;
  };

  // 접근성을 위한 시간 설정 텍스트 생성
  const getTimeAccessibilityLabel = () => {
    let label = "알림 시간대 변경. ";
    label += `현재 알림 시간대는 ${currentTimes.morning || "미설정"}와 ${
      currentTimes.evening || "미설정"
    }에요. `;
    label += "시간대 변경을 원하신다면 두 번 눌러주세요.";

    return label;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 상단 제목 */}
        <View style={styles.header}>
          <Text style={styles.title}>설정</Text>
        </View>

        {/* 로딩 표시 */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
          </View>
        )}

        {/* 알림 설정 컴포넌트 추가 */}
        <NotificationSettings userInfo={userInfo} />

        {/* 사용자 정보 섹션 - 접근성 개선 */}
        <TouchableOpacity
          style={styles.userInfoSection}
          onPress={handleUserInfoChange}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={getUserInfoAccessibilityLabel()}
          accessibilityHint="사용자 정보를 변경할 수 있는 페이지로 이동합니다"
        >
          <View style={styles.sectionHeaderSimple} accessible={false}>
            <Text style={styles.sectionTitle} accessible={false}>
              사용자 정보
            </Text>
          </View>

          <View accessible={false}>
            {userInfo ? (
              <View style={styles.userInfoContainer} accessible={false}>
                <View style={styles.userInfoItem} accessible={false}>
                  <Text style={styles.userInfoLabel} accessible={false}>
                    닉네임:
                  </Text>
                  <Text style={styles.userInfoValue} accessible={false}>
                    {userInfo.nickname || "정보 없음"}
                  </Text>
                </View>

                {userInfo.name && (
                  <View style={styles.userInfoItem} accessible={false}>
                    <Text style={styles.userInfoLabel} accessible={false}>
                      이름:
                    </Text>
                    <Text style={styles.userInfoValue} accessible={false}>
                      {userInfo.name}
                    </Text>
                  </View>
                )}

                {userInfo.email && (
                  <View style={styles.userInfoItem} accessible={false}>
                    <Text style={styles.userInfoLabel} accessible={false}>
                      이메일:
                    </Text>
                    <Text style={styles.userInfoValue} accessible={false}>
                      {userInfo.email}
                    </Text>
                  </View>
                )}

                <View style={styles.userInfoItem} accessible={false}>
                  <Text style={styles.userInfoLabel} accessible={false}>
                    Device ID:
                  </Text>
                  <Text style={styles.userInfoValue} accessible={false}>
                    {userInfo.deviceId
                      ? userInfo.deviceId.substring(0, 8) + "..."
                      : "정보 없음"}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noUserInfo} accessible={false}>
                사용자 정보를 불러올 수 없습니다
              </Text>
            )}

            {/* 변경 안내 문구 */}
            <Text style={styles.changeHintText} accessible={false}>
              사용자 정보 변경을 원하신다면 두 번 눌러주세요
            </Text>
          </View>
        </TouchableOpacity>

        {/* 현재 관심뉴스 섹션 - 접근성 개선 */}
        <TouchableOpacity
          style={[styles.interestNewsSection, { alignItems: "center" }]}
          onPress={handleCategoryChange}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={getCategoriesAccessibilityLabel()}
          accessibilityHint="관심 뉴스 카테고리를 수정할 수 있는 페이지로 이동합니다"
        >
          <View style={styles.sectionHeaderSimple} accessible={false}>
            <Text
              style={[styles.sectionTitle, { textAlign: "center" }]}
              accessible={false}
            >
              현재 관심뉴스
            </Text>
          </View>

          <View
            style={[styles.categoriesContainer, { justifyContent: "center" }]}
            accessible={false}
          >
            {currentCategories.map((category, index) => (
              <View
                key={index}
                style={styles.categoryItemContainer}
                accessible={false}
              >
                <View
                  style={[
                    styles.categoryTag,
                    { backgroundColor: getCategoryColor(category) },
                  ]}
                  accessible={false}
                >
                  <Text
                    style={[styles.categoryText, { textAlign: "center" }]}
                    accessible={false}
                  >
                    {category || "카테고리"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <Text
            style={[styles.questionText, { textAlign: "center" }]}
            accessible={false}
          >
            관심뉴스를 수정 / 변경하시겠어요?
          </Text>
          <Text
            style={[styles.instructionText, { textAlign: "center" }]}
            accessible={false}
          >
            변경을 원하신다면 두 번 눌러주세요.
          </Text>
        </TouchableOpacity>

        {/* 시간대 변경 섹션 - 접근성 개선 */}
        <TouchableOpacity
          style={[styles.timeChangeSection, { alignItems: "center" }]}
          onPress={handleTimeChange}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={getTimeAccessibilityLabel()}
          accessibilityHint="뉴스 알림을 받을 시간대를 수정할 수 있는 페이지로 이동합니다"
        >
          <Text
            style={[styles.sectionTitle, { textAlign: "center" }]}
            accessible={false}
          >
            알림 시간대 변경
          </Text>
          <View
            style={[styles.timeInfoContainer, { alignItems: "center" }]}
            accessible={false}
          >
            <Text
              style={[styles.timeInfoText, { textAlign: "center" }]}
              accessible={false}
            >
              현재 알림 시간대는
            </Text>
            <View
              style={[
                styles.timeButtonsContainer,
                {
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                },
              ]}
              accessible={false}
            >
              <View style={styles.timeButton} accessible={false}>
                <Text
                  style={[styles.timeButtonText, { textAlign: "center" }]}
                  accessible={false}
                >
                  {currentTimes.morning || "미설정"}
                </Text>
              </View>
              <Text
                style={[styles.timeInfoText, { textAlign: "center" }]}
                accessible={false}
              >
                와
              </Text>
              <View style={styles.timeButton} accessible={false}>
                <Text
                  style={[styles.timeButtonText, { textAlign: "center" }]}
                  accessible={false}
                >
                  {currentTimes.evening || "미설정"}
                </Text>
              </View>
              <Text
                style={[styles.timeInfoText, { textAlign: "center" }]}
                accessible={false}
              >
                에요.
              </Text>
            </View>
          </View>
          <Text
            style={[styles.instructionText, { textAlign: "center" }]}
            accessible={false}
          >
            시간대 변경을 원하신다면 두 번 눌러주세요.
          </Text>
        </TouchableOpacity>

        {/* 앱 정보 섹션 */}
        <View style={styles.appInfoSection}>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <Text style={styles.appInfoText}>
            Eye-Hope v1.0.0{"\n"}
            개인 맞춤형 뉴스 알림 서비스
          </Text>
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  userInfoSection: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#34C759",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeaderSimple: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  userInfoContainer: {
    gap: 8,
    marginBottom: 12,
  },
  userInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8E8E93",
    width: 80,
  },
  userInfoValue: {
    fontSize: 14,
    color: "#000000",
    flex: 1,
  },
  noUserInfo: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 12,
  },
  changeHintText: {
    fontSize: 16,
    color: "#007AFF",
    textAlign: "center",
    fontWeight: "500",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  interestNewsSection: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    marginTop: 16,
  },
  categoryItemContainer: {
    alignItems: "center",
    marginRight: 8,
    marginBottom: 8,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  questionText: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  timeChangeSection: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  timeInfoContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  timeInfoText: {
    fontSize: 16,
    color: "#000000",
    lineHeight: 22,
  },
  timeButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 8,
  },
  timeButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  timeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  appInfoSection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  appInfoText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
});
