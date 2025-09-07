// components/CustomNotification.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

interface CustomNotificationProps {
  notification: NotificationData | null;
  visible: boolean;
  onClose: () => void;
  onPress?: (data?: any) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function CustomNotification({
  notification,
  visible,
  onClose,
  onPress,
}: CustomNotificationProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && notification) {
      // 알림 표시 애니메이션
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // 5초 후 자동으로 숨기기
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      // 알림 숨기기 애니메이션
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, notification]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handlePress = () => {
    if (onPress && notification?.data) {
      onPress(notification.data);
    }
    handleClose();
  };

  if (!notification) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.notificationCard}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {/* 알림 아이콘 */}
        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={24} color="#007AFF" />
        </View>

        {/* 알림 내용 */}
        <View style={styles.contentContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>

        {/* 닫기 버튼 */}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// 알림 관리를 위한 Context
import { createContext, useContext, useState, ReactNode } from "react";

interface NotificationContextType {
  showNotification: (notification: NotificationData) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationData | null>(
    null
  );
  const [visible, setVisible] = useState(false);

  const showNotification = (notificationData: NotificationData) => {
    setNotification(notificationData);
    setVisible(true);
  };

  const hideNotification = () => {
    setVisible(false);
    setTimeout(() => {
      setNotification(null);
    }, 300);
  };

  const handleNotificationPress = (data?: any) => {
    // 여기서 알림 터치 시 동작을 정의
    console.log("알림 터치됨:", data);

    // 예: 특정 뉴스로 이동
    if (data?.newsId) {
      // navigation.navigate('NewsDetail', { newsId: data.newsId });
    }
  };

  return (
    <NotificationContext.Provider
      value={{ showNotification, hideNotification }}
    >
      {children}
      <CustomNotification
        notification={notification}
        visible={visible}
        onClose={hideNotification}
        onPress={handleNotificationPress}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 50, // 상태바 아래에 표시
    paddingHorizontal: 16,
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});
