import { randomUUID } from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const generateUUID = (): string => {
  return randomUUID();
};

export const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem("deviceId");

    if (!deviceId) {
      deviceId = generateUUID();
      await AsyncStorage.setItem("deviceId", deviceId);
      console.log("새로운 디바이스 ID 생성:", deviceId);
    } else {
      console.log("기존 디바이스 ID 사용:", deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error("디바이스 ID 가져오기 오류:", error);
    // 오류 발생 시 임시 UUID 생성
    return generateUUID();
  }
};

export const clearDeviceId = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem("deviceId");
    console.log("디바이스 ID 삭제됨");
  } catch (error) {
    console.error("디바이스 ID 삭제 오류:", error);
  }
};

// Expo Router가 이 파일을 라우트로 인식하지 않도록 더미 default export 추가
const UuidUtils = {
  generateUUID,
  getDeviceId,
  clearDeviceId,
};

export default UuidUtils;
