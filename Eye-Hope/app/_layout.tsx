import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="selectCategory"
          options={{
            headerShown: false,
            title: "카테고리 선택",
          }}
        />
        <Stack.Screen
          name="confirmation"
          options={{
            headerShown: false,
            title: "확인",
          }}
        />
        <Stack.Screen
          name="timeSelect"
          options={{
            headerShown: false,
            title: "시간 선택",
          }}
        />
        <Stack.Screen
          name="newsList"
          options={{
            headerShown: false,
            title: "관심 뉴스",
          }}
        />
        <Stack.Screen
          name="categoryNews"
          options={{
            headerShown: false,
            title: "카테고리별 뉴스",
          }}
        />
        <Stack.Screen
          name="nicknameInput"
          options={{
            headerShown: false,
            title: "닉네임 입력",
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
