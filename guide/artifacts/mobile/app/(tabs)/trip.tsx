import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import TripOperations from "../../components/TripOperations";

export default function TripScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  // Fetch Guide's Assignments dynamically
  const { data: assignments, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/guide/my-assignments"],
    queryFn: () => customFetch<any[]>("/api/guide/my-assignments"),
  });

  const activeAssignment = assignments?.find((a) => a.status === "ongoing" || a.status === "assigned");

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Fallback if no active trip assignment is found
  if (!activeAssignment) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 24 }]}>
        <Ionicons name="map-outline" size={54} color={colors.mutedForeground} />
        <Text style={[styles.noTripTitle, { color: colors.foreground }]}>No Active Assignment</Text>
        <Text style={[styles.noTripText, { color: colors.mutedForeground }]}>
          You are not currently assigned to any ongoing trip. Once assigned, your live operations panel will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Trip Operations</Text>

        {/* Dynamic Hero Card */}
        <LinearGradient
          colors={["#FFF8F0", "#F8F8FA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderColor: colors.border }]}
        >
          <View style={[styles.heroBadge, { backgroundColor: `${colors.success}18` }]}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={[styles.heroBadgeText, { color: colors.success }]}>
              {activeAssignment.status.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            {activeAssignment.tripName}
          </Text>
          <View style={styles.heroDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={15} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                Departure: {new Date(activeAssignment.departureDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="shield-checkmark" size={15} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                Role: {activeAssignment.role.replace("_", " ").toUpperCase()}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Live Trip Operations Tab Controller */}
        <TripOperations assignmentId={activeAssignment.id} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  pageTitle: { fontSize: 26, fontFamily: "Montserrat_700Bold", marginBottom: 16 },
  noTripTitle: { fontSize: 18, fontFamily: "Montserrat_700Bold", marginTop: 14, textAlign: "center" },
  noTripText: { fontSize: 13, fontFamily: "Montserrat_400Regular", textAlign: "center", marginTop: 8, lineHeight: 20 },
  heroCard: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 16 },
  heroBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5, marginBottom: 12 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  heroBadgeText: { fontSize: 11, fontFamily: "Montserrat_600SemiBold" },
  heroTitle: { fontSize: 20, fontFamily: "Montserrat_700Bold", marginBottom: 16, lineHeight: 28 },
  heroDetails: { gap: 10, marginBottom: 4 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 13, fontFamily: "Montserrat_400Regular" },
});
