import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useGetActiveTrip, useGetTodayAttendance } from "@workspace/api-client-react";
import { getOfflineQueue } from "../../utils/offlineQueue";
import { syncOfflineQueue } from "../../utils/syncService";
import { useFocusEffect } from "expo-router";

const ACTIVITIES = [
  { id: "1", text: "Checked in at Base Camp", time: "08:30 AM", date: "Today", icon: "log-in-outline" as const },
  { id: "2", text: "Daily report submitted", time: "06:00 PM", date: "Yesterday", icon: "document-text-outline" as const },
  { id: "3", text: "Checked out from Manali", time: "05:45 PM", date: "Yesterday", icon: "log-out-outline" as const },
  { id: "4", text: "Assigned to Himalayan Trek", time: "10:00 AM", date: "Jun 1", icon: "flag-outline" as const },
  { id: "5", text: "Payment of \u20b96,000 approved", time: "03:00 PM", date: "May 28", icon: "checkmark-circle-outline" as const },
];

export default function GuideDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userName, logout } = useAuth();

  const { data: activeTrip, isLoading: tripLoading } = useGetActiveTrip();
  const { data: todayAttendance, refetch: refetchAttendance, isLoading: attendanceLoading } = useGetTodayAttendance();

  const trip = activeTrip && typeof activeTrip === "object" && "id" in activeTrip ? activeTrip : null;

  const [offlineCheckIn, setOfflineCheckIn] = useState(false);
  const [offlineCheckOut, setOfflineCheckOut] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const checkOfflineStatus = React.useCallback(async () => {
    const queue = await getOfflineQueue();
    setPendingSyncCount(queue.length);
    const todayStr = new Date().toISOString().split("T")[0];
    const hasTodayCheckIn = queue.some((item) => item.date === todayStr && item.type === "check-in");
    const hasTodayCheckOut = queue.some((item) => item.date === todayStr && item.type === "check-out");
    setOfflineCheckIn(hasTodayCheckIn);
    setOfflineCheckOut(hasTodayCheckOut);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkOfflineStatus();
      
      const runSync = async () => {
        await syncOfflineQueue(() => {
          refetchAttendance();
          checkOfflineStatus();
        });
      };
      runSync();
    }, [checkOfflineStatus, refetchAttendance])
  );

  React.useEffect(() => {
    const interval = setInterval(async () => {
      const queue = await getOfflineQueue();
      if (queue.length > 0) {
        await syncOfflineQueue((item, err) => {
          if (!err) {
            refetchAttendance();
          }
        });
        checkOfflineStatus();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [checkOfflineStatus, refetchAttendance]);

  const checkedIn = !!todayAttendance?.checkInTime || offlineCheckIn;
  const checkedOut = !!todayAttendance?.checkOutTime || offlineCheckOut;

  const checkInTime = todayAttendance?.checkInTime
    ? new Date(todayAttendance.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : offlineCheckIn
      ? "Pending Sync"
      : null;

  const checkOutTime = todayAttendance?.checkOutTime
    ? new Date(todayAttendance.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : offlineCheckOut
      ? "Pending Sync"
      : null;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleCheckToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/report");
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: logout },
      ]
    );
  };

  if (tripLoading || attendanceLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting}</Text>
          <Text style={[styles.guideName, { color: colors.foreground }]}>{userName || "Guide"}</Text>
          <Text style={[styles.dateStr, { color: colors.mutedForeground }]}>{dateStr}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}18`, borderColor: colors.primary, marginRight: 8 }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initials || "G"}</Text>
          </View>
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: colors.border }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {pendingSyncCount > 0 && (
          <View style={[styles.syncBanner, { backgroundColor: colors.warning + "20", borderColor: colors.warning, marginTop: 10, marginBottom: 4 }]}>
            <Ionicons name="cloud-offline" size={16} color={colors.warning} />
            <Text style={[styles.syncBannerText, { color: colors.warning }]}>
              Pending Sync ({pendingSyncCount} item{pendingSyncCount > 1 ? "s" : ""} offline)
            </Text>
          </View>
        )}

        {/* Active Trip */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACTIVE TRIP</Text>
        <TouchableOpacity onPress={() => trip && router.push("/(tabs)/trip")} activeOpacity={trip ? 0.88 : 1}>
          <LinearGradient
            colors={["#FFF8F0", "#F8F8FA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.tripCard, { borderColor: colors.border }]}
          >
            <View style={styles.tripTop}>
              <View style={[styles.activeBadge, { backgroundColor: trip ? `${colors.success}18` : `${colors.warning}18` }]}>
                <View style={[styles.activeDot, { backgroundColor: trip ? colors.success : colors.warning }]} />
                <Text style={[styles.activeBadgeText, { color: trip ? colors.success : colors.warning }]}>
                  {trip ? "Active" : "Unassigned"}
                </Text>
              </View>
              {trip && <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />}
            </View>
            <Text style={[styles.tripName, { color: colors.foreground }]}>
              {trip?.name || "No Active Trek Assigned"}
            </Text>
            {trip ? (
              <>
                <View style={styles.tripMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={13} color={colors.primary} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{trip.location}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color={colors.primary} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      {new Date(trip.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – {new Date(trip.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="star-outline" size={13} color={colors.primary} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>Lead Guide</Text>
                  </View>
                </View>
                <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { backgroundColor: colors.primary, width: "100%" }]} />
                </View>
                <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>Trek in progress</Text>
              </>
            ) : (
              <Text style={[styles.progressLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
                Please contact base office for trip assignment.
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Today's Status */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TODAY'S STATUS</Text>
        <View style={[styles.checkinCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.checkinLeft}>
            <View style={[
              styles.statusIcon,
              { backgroundColor: checkedOut ? `${colors.success}18` : checkedIn ? `${colors.success}18` : `${colors.warning}18` },
            ]}>
              <Ionicons
                name={checkedOut ? "checkmark-done-circle" : checkedIn ? "checkmark-circle" : "time-outline"}
                size={26}
                color={checkedOut ? colors.success : checkedIn ? colors.success : colors.warning}
              />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.checkinTitle, { color: colors.foreground }]}>
                {checkedOut ? "Work Completed" : checkedIn ? "Checked In" : "Not Checked In"}
              </Text>
              <Text style={[styles.checkinSub, { color: colors.mutedForeground }]}>
                {checkedOut 
                  ? `Checked out at ${checkOutTime}` 
                  : checkInTime 
                    ? `Since ${checkInTime}` 
                    : "Tap to check in for today"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.checkBtn,
              {
                backgroundColor: checkedOut 
                  ? `${colors.success}12` 
                  : checkedIn 
                    ? `${colors.error}12` 
                    : colors.primary,
                borderColor: checkedOut 
                  ? colors.success 
                  : checkedIn 
                    ? colors.error 
                    : colors.primary,
                opacity: checkedOut ? 0.7 : 1
              },
            ]}
            onPress={handleCheckToggle}
            disabled={checkedOut}
            activeOpacity={0.85}
          >
            <Ionicons
              name={checkedOut ? "checkmark-outline" : checkedIn ? "log-out-outline" : "log-in-outline"}
              size={16}
              color={checkedOut ? colors.success : checkedIn ? colors.error : colors.primaryForeground}
            />
            <Text style={[styles.checkBtnText, { color: checkedOut ? colors.success : checkedIn ? colors.error : colors.primaryForeground }]}>
              {checkedOut ? "Completed" : checkedIn ? "Check Out" : "Check In"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.primary}14` }]}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statVal, { color: colors.foreground }]}>12</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Working Days</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.accent}14` }]}>
              <Ionicons name="wallet" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.statVal, { color: colors.foreground }]}>\u20b918,000</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Total Earnings</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RECENT ACTIVITY</Text>
        <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {ACTIVITIES.map((act, i) => (
            <View key={act.id}>
              <View style={styles.actItem}>
                <View style={[styles.actIcon, { backgroundColor: `${colors.primary}14` }]}>
                  <Ionicons name={act.icon} size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actText, { color: colors.foreground }]}>{act.text}</Text>
                  <Text style={[styles.actTime, { color: colors.mutedForeground }]}>
                    {act.date} · {act.time}
                  </Text>
                </View>
              </View>
              {i < ACTIVITIES.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  syncBannerText: {
    fontSize: 12,
    fontFamily: "Montserrat_600SemiBold",
  },
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "flex-start" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  logoutBtn: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  greeting: { fontSize: 13, fontFamily: "Montserrat_500Medium", marginBottom: 2 },
  guideName: { fontSize: 24, fontFamily: "Montserrat_700Bold" },
  dateStr: { fontSize: 12, fontFamily: "Montserrat_400Regular", marginTop: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 16, fontFamily: "Montserrat_700Bold" },
  scroll: { paddingHorizontal: 20 },
  sectionLabel: { fontSize: 10, fontFamily: "Montserrat_600SemiBold", letterSpacing: 1.4, marginTop: 22, marginBottom: 10 },
  tripCard: { borderRadius: 18, padding: 18, borderWidth: 1 },
  tripTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  activeBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 5 },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeBadgeText: { fontSize: 11, fontFamily: "Montserrat_600SemiBold" },
  tripName: { fontSize: 18, fontFamily: "Montserrat_700Bold", marginBottom: 14 },
  tripMeta: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, fontFamily: "Montserrat_400Regular" },
  progressBg: { height: 4, borderRadius: 2, marginBottom: 6 },
  progressFill: { height: 4, borderRadius: 2 },
  progressLabel: { fontSize: 11, fontFamily: "Montserrat_400Regular" },
  checkinCard: { borderRadius: 16, padding: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  checkinLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  statusIcon: { width: 50, height: 50, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  checkinTitle: { fontSize: 14, fontFamily: "Montserrat_600SemiBold" },
  checkinSub: { fontSize: 11, fontFamily: "Montserrat_400Regular", marginTop: 3 },
  checkBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 11, borderWidth: 1.5, gap: 6 },
  checkBtnText: { fontSize: 13, fontFamily: "Montserrat_600SemiBold" },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 2 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, borderWidth: 1 },
  statIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  statVal: { fontSize: 22, fontFamily: "Montserrat_700Bold" },
  statLbl: { fontSize: 12, fontFamily: "Montserrat_400Regular", marginTop: 3 },
  activityCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  actItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  actIcon: { width: 38, height: 38, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  actText: { fontSize: 13, fontFamily: "Montserrat_500Medium", marginBottom: 3 },
  actTime: { fontSize: 11, fontFamily: "Montserrat_400Regular" },
  divider: { height: 1, marginLeft: 66 },
});
