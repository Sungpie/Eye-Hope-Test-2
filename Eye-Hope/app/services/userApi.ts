import { getDeviceId } from "../utils/uuid";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://13.124.111.205:8080"; // 실제 백엔드 서버 URL

export interface UserRegistrationData {
  deviceId: string;
  name: string;
  email: string;
  nickname: string;
  password: string;
}

export interface UserSchedule {
  morning: string;
  evening: string;
}

export interface UserProfile {
  deviceId: string;
  name: string;
  email: string;
  nickname: string;
  categories: string[];
  schedules: UserSchedule;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// 🔍 API 디버깅 함수 추가
export const debugApiRequest = async (deviceId: string) => {
  console.log("=== API 디버깅 시작 ===");
  console.log("1. 디바이스 ID 검증:");
  console.log("   - 값:", deviceId);
  console.log("   - 타입:", typeof deviceId);
  console.log("   - 길이:", deviceId.length);
  console.log(
    "   - UUID 형식 검증:",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      deviceId
    )
  );

  console.log("2. 요청 URL 구성:");
  const url = `${BASE_URL}/api/users/exists/${deviceId}`;
  console.log("   - 전체 URL:", url);
  console.log("   - 인코딩된 deviceId:", encodeURIComponent(deviceId));

  console.log("3. 요청 헤더:");
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  console.log("   - Headers:", headers);

  try {
    console.log("4. 실제 요청 전송...");
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    console.log("5. 응답 분석:");
    console.log("   - 상태 코드:", response.status);
    console.log("   - 상태 텍스트:", response.statusText);
    console.log(
      "   - Headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (response.status === 500) {
      console.log("6. 500 오류 상세 분석:");
      const errorText = await response.text();
      console.log("   - 오류 응답 본문:", errorText);

      try {
        const errorJson = JSON.parse(errorText);
        console.log("   - 파싱된 오류:", errorJson);
      } catch (e) {
        console.log("   - JSON 파싱 실패, 텍스트 응답:", errorText);
      }
    } else {
      const responseText = await response.text();
      console.log("   - 응답 본문:", responseText);
      try {
        const responseJson = JSON.parse(responseText);
        console.log("   - 파싱된 응답:", responseJson);
      } catch (e) {
        console.log("   - JSON 파싱 실패");
      }
    }
  } catch (networkError) {
    console.log("6. 네트워크 오류:");
    console.log("   - 오류:", networkError);
    console.log(
      "   - 오류 메시지:",
      networkError instanceof Error
        ? networkError.message
        : String(networkError)
    );
  }

  console.log("=== API 디버깅 완료 ===");
};

class UserApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${BASE_URL}${endpoint}`;
      console.log(`API 요청: ${options.method || "GET"} ${url}`);

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`API 응답:`, data);

      return data;
    } catch (error) {
      console.error(`API 요청 실패 (${endpoint}):`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      };
    }
  }

  // 사용자 등록
  async registerUser(
    userData: Omit<UserRegistrationData, "deviceId">
  ): Promise<ApiResponse<any>> {
    try {
      const deviceId = await getDeviceId();
      const registrationData: UserRegistrationData = {
        ...userData,
        deviceId,
      };

      return await this.makeRequest("/api/users/register", {
        method: "POST",
        body: JSON.stringify(registrationData),
      });
    } catch (error) {
      console.error("사용자 등록 오류:", error);
      return {
        success: false,
        message: "사용자 등록 중 오류가 발생했습니다.",
      };
    }
  }

  // 사용자 스케줄 조회
  async getUserSchedule(): Promise<ApiResponse<UserSchedule>> {
    try {
      const deviceId = await getDeviceId();
      return await this.makeRequest<UserSchedule>(
        `/api/users/schedules/${deviceId}`
      );
    } catch (error) {
      console.error("사용자 스케줄 조회 오류:", error);
      return {
        success: false,
        message: "사용자 스케줄 조회 중 오류가 발생했습니다.",
      };
    }
  }

  // 사용자 카테고리 업데이트 (가정)
  async updateUserCategories(categories: string[]): Promise<ApiResponse<any>> {
    try {
      const deviceId = await getDeviceId();
      return await this.makeRequest("/api/users/categories", {
        method: "PUT",
        body: JSON.stringify({
          deviceId,
          categories,
        }),
      });
    } catch (error) {
      console.error("카테고리 업데이트 오류:", error);
      return {
        success: false,
        message: "카테고리 업데이트 중 오류가 발생했습니다.",
      };
    }
  }

  // 사용자 스케줄 업데이트 (가정)
  async updateUserSchedule(schedule: UserSchedule): Promise<ApiResponse<any>> {
    try {
      const deviceId = await getDeviceId();
      return await this.makeRequest("/api/users/schedule", {
        method: "PUT",
        body: JSON.stringify({
          deviceId,
          schedule,
        }),
      });
    } catch (error) {
      console.error("스케줄 업데이트 오류:", error);
      return {
        success: false,
        message: "스케줄 업데이트 중 오류가 발생했습니다.",
      };
    }
  }

  // 사용자 프로필 조회 (가정)
  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      const deviceId = await getDeviceId();
      return await this.makeRequest<UserProfile>(
        `/api/users/profile/${deviceId}`
      );
    } catch (error) {
      console.error("사용자 프로필 조회 오류:", error);
      return {
        success: false,
        message: "사용자 프로필 조회 중 오류가 발생했습니다.",
      };
    }
  }

  // 사용자 존재 여부 확인 (에러 처리 개선)
  async checkUserExists(): Promise<boolean> {
    try {
      const deviceId = await getDeviceId();
      console.log(`사용자 존재 확인 요청: ${deviceId}`);

      const response = await this.makeRequest(`/api/users/exists/${deviceId}`);

      // API 호출이 성공하고 데이터가 있으면 해당 값 반환
      if (response.success && typeof response.data === "boolean") {
        console.log(`사용자 존재 여부: ${response.data}`);
        return response.data;
      }

      // 성공이지만 데이터가 없거나 잘못된 형식이면 false 반환
      console.log("사용자 존재 확인 - 응답이 있지만 데이터가 올바르지 않음");
      return false;
    } catch (error) {
      console.log("사용자 존재 확인 실패 - 신규 사용자로 간주:", error);
      // API 호출 실패는 신규 사용자로 간주
      return false;
    }
  }
}

export const userApiService = new UserApiService();
