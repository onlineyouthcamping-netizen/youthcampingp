import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { isLoggedIn, isLoading, userRole } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#FF6B00" size="large" />
      </View>
    );
  }

  if (!isLoggedIn) return <Redirect href="/login" />;
  if (userRole !== "guide") return <Redirect href="/login" />;
  return <Redirect href="/(tabs)" />;
}
