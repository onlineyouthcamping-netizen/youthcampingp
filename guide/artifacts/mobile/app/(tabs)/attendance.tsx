import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type DayStatus = "present" | "absent" | "pending" | "none";

const ATTENDANCE: Record<string, DayStatus> = {
  "2025-06-01": "present",
  "2025-06-02": "present",
  "2025-06-03": "present",
  "2025-06-04": "present",
  "2025-06-05": "absent",
  "2025-06-06": "present",
  "2025-06-07": "present",
  "2025-06-08": "present",
  "2025-06-09": "present",
  "2025-06-10": "pending",
  "2025-06-11": "pending",
  "2025-06-12": "pending",
  "2025-06-13": "pending",
  "2025-06-14": "pending",
  "2025-06-15": "pending",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function AttendanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const dateKey = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const statusColor = (s: DayStatus) => {
    if (s === "present") return colors.success;
    if (s === "absent") return colors.error;
    if (s === "pending") return colors.warning;
    return "transparent";
  };

  const statusBg = (s: DayStatus) => {
    if (s === "present") return `${colors.success}20`;
    if (s === "absent") return `${colors.error}20`;
    if (s === "pending") return `${colors.warning}20`;
    return "transparent";
  };

  const handlePrev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const handleNext = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const cells: Array<number | null> = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Math.floor(cells.length / 7);

  const stats = Object.values(ATTENDANCE).reduce<Record<string, number>>((acc, s) => {
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Attendance</Text>

        {/* Month Nav */}
        <View style={[styles.monthNav, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity onPress={handlePrev} style={styles.navBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: colors.foreground }]}>
            {MONTHS[month]} {year}
          </Text>
          <TouchableOpacity onPress={handleNext} style={styles.navBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <View style={[styles.calendar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Day headers */}
          <View style={styles.weekRow}>
            {DAY_LABELS.map((d, i) => (
              <Text key={i} style={[styles.dayHeader, { color: colors.mutedForeground }]}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          {Array.from({ length: weeks }, (_, w) => (
            <View key={w} style={styles.weekRow}>
              {cells.slice(w * 7, (w + 1) * 7).map((day, i) => {
                if (!day) return <View key={i} style={styles.cell} />;
                const key = dateKey(day);
                const status: DayStatus = ATTENDANCE[key] ?? "none";
                const isToday =
                  day === now.getDate() &&
                  month === now.getMonth() &&
                  year === now.getFullYear();
                return (
                  <View
                    key={i}
                    style={[
                      styles.cell,
                      isToday && { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 10 },
                    ]}
                  >
                    <View style={[
                      styles.cellInner,
                      status !== "none" && { backgroundColor: statusBg(status), borderRadius: 8 },
                    ]}>
                      <Text style={[
                        styles.dayNum,
                        { color: status !== "none" ? statusColor(status) : colors.foreground },
                        isToday && { fontFamily: "Montserrat_700Bold" },
                      ]}>
                        {day}
                      </Text>
                      {status !== "none" && (
                        <View style={[styles.daydot, { backgroundColor: statusColor(status) }]} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {[
            { label: "Present", color: colors.success },
            { label: "Absent", color: colors.error },
            { label: "Pending", color: colors.warning },
          ].map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{l.label}</Text>
            </View>
          ))}
        </View>

        {/* Monthly Summary */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MONTHLY SUMMARY</Text>
        <View style={styles.statsRow}>
          {[
            { label: "Present", value: stats["present"] ?? 0, color: colors.success },
            { label: "Absent", value: stats["absent"] ?? 0, color: colors.error },
            { label: "Pending", value: stats["pending"] ?? 0, color: colors.warning },
          ].map((s) => (
            <View key={s.label} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  pageTitle: { fontSize: 26, fontFamily: "Montserrat_700Bold", marginBottom: 16 },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  navBtn: { padding: 4 },
  monthLabel: { fontSize: 16, fontFamily: "Montserrat_600SemiBold" },
  calendar: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 12 },
  weekRow: { flexDirection: "row" },
  dayHeader: { flex: 1, textAlign: "center", fontSize: 11, fontFamily: "Montserrat_700Bold", paddingVertical: 8 },
  cell: { flex: 1, aspectRatio: 1, padding: 2 },
  cellInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  dayNum: { fontSize: 13, fontFamily: "Montserrat_500Medium" },
  daydot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  legend: { flexDirection: "row", justifyContent: "center", gap: 22, marginBottom: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontFamily: "Montserrat_400Regular" },
  sectionLabel: { fontSize: 10, fontFamily: "Montserrat_600SemiBold", letterSpacing: 1.4, marginBottom: 10 },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: { flex: 1, borderRadius: 14, padding: 16, borderWidth: 1, alignItems: "center" },
  statVal: { fontSize: 30, fontFamily: "Montserrat_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Montserrat_500Medium", marginTop: 4 },
});
