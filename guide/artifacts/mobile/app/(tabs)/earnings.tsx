import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const HISTORY = [
  { id: "1", period: "May 1–15", days: 15, amount: 22500, status: "paid" as const, date: "May 18" },
  { id: "2", period: "May 16–31", days: 16, amount: 24000, status: "paid" as const, date: "Jun 2" },
  { id: "3", period: "Jun 1–9", days: 9, amount: 13500, status: "approved" as const, date: "Pending disbursement" },
  { id: "4", period: "Jun 10–15", days: 6, amount: 9000, status: "pending" as const, date: "—" },
];

type PayStatus = "paid" | "approved" | "pending";

export default function EarningsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const chip = (status: PayStatus) => {
    if (status === "paid") return { color: colors.success, bg: `${colors.success}18`, label: "Paid" };
    if (status === "approved") return { color: colors.primary, bg: `${colors.primary}18`, label: "Approved" };
    return { color: colors.warning, bg: `${colors.warning}18`, label: "Pending" };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Earnings</Text>

        {/* Summary Card */}
        <LinearGradient
          colors={["#FFF8F0", "#F8F8FA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.summaryCard, { borderColor: `${colors.primary}50` }]}
        >
          <View style={styles.sumHeader}>
            <Text style={[styles.sumPeriod, { color: colors.mutedForeground }]}>JUNE 2025</Text>
            <View style={[styles.partialBadge, { backgroundColor: `${colors.warning}18` }]}>
              <Ionicons name="time-outline" size={11} color={colors.warning} />
              <Text style={[styles.partialText, { color: colors.warning }]}>Partial Pending</Text>
            </View>
          </View>
          <Text style={[styles.totalAmt, { color: colors.accent }]}>\u20b922,500</Text>
          <Text style={[styles.totalLbl, { color: colors.mutedForeground }]}>Total Payable This Month</Text>

          <View style={[styles.divider, { backgroundColor: `${colors.primary}28` }]} />

          <View style={styles.grid}>
            {[
              { label: "Per Day Rate", value: "\u20b91,500", icon: "cash-outline" as const },
              { label: "Verified Days", value: "9", icon: "checkmark-circle-outline" as const },
              { label: "Approved", value: "\u20b913,500", icon: "wallet-outline" as const },
              { label: "Pending", value: "\u20b99,000", icon: "time-outline" as const },
            ].map((item) => (
              <View key={item.label} style={styles.gridItem}>
                <Ionicons name={item.icon} size={15} color={colors.primary} />
                <Text style={[styles.gridVal, { color: colors.foreground }]}>{item.value}</Text>
                <Text style={[styles.gridLbl, { color: colors.mutedForeground }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Year to Date */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>YEAR TO DATE</Text>
        <View style={styles.ytdRow}>
          {[
            { label: "Total Days", value: "40", icon: "calendar" as const },
            { label: "Total Earned", value: "\u20b960,000", icon: "trending-up" as const },
            { label: "Paid Out", value: "\u20b946,500", icon: "checkmark-done" as const },
          ].map((s) => (
            <View key={s.label} style={[styles.ytdCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={s.icon} size={18} color={colors.primary} />
              <Text style={[styles.ytdVal, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.ytdLbl, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* History */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PAYMENT HISTORY</Text>
        <View style={[styles.histCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {HISTORY.map((p, i) => {
            const c = chip(p.status);
            return (
              <View key={p.id}>
                <View style={styles.histItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.histPeriod, { color: colors.foreground }]}>{p.period}</Text>
                    <Text style={[styles.histDays, { color: colors.mutedForeground }]}>
                      {p.days} days · {p.date}
                    </Text>
                  </View>
                  <View style={styles.histRight}>
                    <Text style={[styles.histAmt, { color: colors.foreground }]}>
                      \u20b9{p.amount.toLocaleString("en-IN")}
                    </Text>
                    <View style={[styles.statusChip, { backgroundColor: c.bg }]}>
                      <Text style={[styles.statusChipText, { color: c.color }]}>{c.label}</Text>
                    </View>
                  </View>
                </View>
                {i < HISTORY.length - 1 && (
                  <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  pageTitle: { fontSize: 26, fontFamily: "Montserrat_700Bold", marginBottom: 16 },
  summaryCard: { borderRadius: 22, padding: 22, borderWidth: 1.5, marginBottom: 16 },
  sumHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sumPeriod: { fontSize: 10, fontFamily: "Montserrat_700Bold", letterSpacing: 1.4 },
  partialBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  partialText: { fontSize: 11, fontFamily: "Montserrat_600SemiBold" },
  totalAmt: { fontSize: 42, fontFamily: "Montserrat_700Bold" },
  totalLbl: { fontSize: 13, fontFamily: "Montserrat_400Regular", marginTop: 4, marginBottom: 20 },
  divider: { height: 1, marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  gridItem: { width: "45%", gap: 4 },
  gridVal: { fontSize: 18, fontFamily: "Montserrat_700Bold" },
  gridLbl: { fontSize: 11, fontFamily: "Montserrat_400Regular" },
  sectionLabel: { fontSize: 10, fontFamily: "Montserrat_600SemiBold", letterSpacing: 1.4, marginBottom: 10 },
  ytdRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  ytdCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, alignItems: "center", gap: 5 },
  ytdVal: { fontSize: 15, fontFamily: "Montserrat_700Bold" },
  ytdLbl: { fontSize: 10, fontFamily: "Montserrat_400Regular", textAlign: "center" },
  histCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  histItem: { flexDirection: "row", alignItems: "center", padding: 16 },
  histPeriod: { fontSize: 14, fontFamily: "Montserrat_600SemiBold", marginBottom: 3 },
  histDays: { fontSize: 12, fontFamily: "Montserrat_400Regular" },
  histRight: { alignItems: "flex-end", gap: 6 },
  histAmt: { fontSize: 16, fontFamily: "Montserrat_700Bold" },
  statusChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusChipText: { fontSize: 10, fontFamily: "Montserrat_600SemiBold" },
  rowDivider: { height: 1, marginLeft: 16 },
});
