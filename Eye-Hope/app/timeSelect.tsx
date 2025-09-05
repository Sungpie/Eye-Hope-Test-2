import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TimeSelectScreen() {
  const { categories, fromSettings } = useLocalSearchParams<{
    categories: string;
    fromSettings?: string;
  }>();
  const router = useRouter();

  // JSON 문자열을 파싱하여 카테고리 배열로 변환
  const selectedCategories = categories ? JSON.parse(categories) : [];
  const [selectedMorningTime, setSelectedMorningTime] = useState<string | null>(
    null
  );
  const [selectedEveningTime, setSelectedEveningTime] = useState<string | null>(
    null
  );

  const morningTimes = [
    "5시",
    "6시",
    "7시",
    "8시",
    "9시",
    "10시",
    "11시",
    "12시",
    "13시",
  ];
  const eveningTimes = [
    "13시",
    "14시",
    "15시",
    "16시",
    "17시",
    "18시",
    "19시",
    "20시",
    "21시",
  ];

  const handleMorningTimeSelect = (time: string) => {
    setSelectedMorningTime(time);
  };

  const handleEveningTimeSelect = (time: string) => {
    setSelectedEveningTime(time);
  };

  // 설정 완료 플래그 저장 함수
  const saveSetupCompleted = async () => {
    try {
      await AsyncStorage.setItem("setupCompleted", "true");
      console.log("설정 완료 플래그가 저장되었습니다");
    } catch (error) {
      console.error("설정 완료 플래그 저장 오류:", error);
    }
  };

  const handleComplete = async () => {
    if (selectedMorningTime && selectedEveningTime) {
      // fromSettings 파라미터 확인
      if (fromSettings === "true") {
        // 설정 페이지에서 왔다면 설정 페이지로 돌아가면서 시간 정보 전달
        router.push({
          pathname: "/(tabs)/settings",
          params: {
            selectedTimes: JSON.stringify({
              morning: selectedMorningTime,
              evening: selectedEveningTime,
            }),
            fromSettings: "true",
          },
        });
      } else {
        // 일반 플로우(초기 설정)라면 닉네임 입력 페이지로 이동
        router.replace({
          pathname: "/nicknameInput" as any,
          params: {
            categories: categories,
            selectedTimes: JSON.stringify({
              morning: selectedMorningTime,
              evening: selectedEveningTime,
            }),
          },
        });
      }
    }
  };

  const renderTimeButton = (
    time: string,
    isSelected: boolean,
    onPress: () => void,
    accessibilityLabel: string
  ) => (
    <Pressable
      style={[styles.timeButton, isSelected && styles.selectedTimeButton]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityHint="이 시간을 선택하려면 두 번 탭하세요"
    >
      <Text
        style={[
          styles.timeButtonText,
          isSelected && styles.selectedTimeButtonText,
        ]}
      >
        {time}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 안내 문구 */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          매일 아침 / 저녁으로 핫한 뉴스를 알림으로 보내드려요.
        </Text>
        <Text style={styles.instructionTextBlue}>
          어느 시간 대를 원하는지 골라주세요.
        </Text>
      </View>

      {/* 시간 선택 영역 */}
      <ScrollView
        style={styles.timeSelectionContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timeGridContainer}>
          {/* 아침 섹션 */}
          <View style={styles.timeSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>아침</Text>
            </View>
            <View style={styles.timeButtonsContainer}>
              {morningTimes.map((time) => (
                <View key={time} style={styles.timeButtonWrapper}>
                  {renderTimeButton(
                    time,
                    selectedMorningTime === time,
                    () => handleMorningTimeSelect(time),
                    `${time} 아침 시간 선택`
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* 저녁 섹션 */}
          <View style={styles.timeSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>저녁</Text>
            </View>
            <View style={styles.timeButtonsContainer}>
              {eveningTimes.map((time) => (
                <View key={time} style={styles.timeButtonWrapper}>
                  {renderTimeButton(
                    time,
                    selectedEveningTime === time,
                    () => handleEveningTimeSelect(time),
                    `${time} 저녁 시간 선택`
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 하단 완료 버튼 */}
      <View style={styles.completeButtonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.completeButton,
            (!selectedMorningTime || !selectedEveningTime) &&
              styles.disabledCompleteButton,
            pressed && styles.pressedButton,
          ]}
          onPress={handleComplete}
          disabled={!selectedMorningTime || !selectedEveningTime}
          accessibilityLabel="완료 버튼"
          accessibilityRole="button"
          accessibilityState={{
            disabled: !selectedMorningTime || !selectedEveningTime,
          }}
          accessibilityHint={
            selectedMorningTime && selectedEveningTime
              ? "선택한 시간으로 진행하려면 두 번 탭하세요"
              : "아침과 저녁 시간을 모두 선택해주세요"
          }
        >
          <Text
            style={[
              styles.completeButtonText,
              (!selectedMorningTime || !selectedEveningTime) &&
                styles.disabledCompleteButtonText,
            ]}
          >
            완료
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  instructionContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  instructionText: {
    fontSize: 16,
    textAlign: "center",
    color: "#000000",
    lineHeight: 24,
    marginBottom: 8,
  },
  instructionTextBlue: {
    fontSize: 16,
    textAlign: "center",
    color: "#007AFF",
    lineHeight: 24,
    fontWeight: "500",
  },
  timeSelectionContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  timeGridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeSection: {
    flex: 1,
    marginHorizontal: 8,
  },
  sectionHeader: {
    backgroundColor: "#87CEEB",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  timeButtonsContainer: {
    alignItems: "center",
  },
  timeButtonWrapper: {
    marginBottom: 12,
    width: "100%",
  },
  timeButton: {
    backgroundColor: "#87CEEB",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  selectedTimeButton: {
    backgroundColor: "#007AFF",
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  selectedTimeButtonText: {
    color: "#FFFFFF",
  },
  completeButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: "center",
  },
  completeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    minWidth: 120,
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
  disabledCompleteButton: {
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
  disabledCompleteButtonText: {
    color: "#999999",
  },
});
