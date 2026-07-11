import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGetTodayAttendance, useGetActiveTrip, customFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";

interface GuideWorkDay {
  id: number;
  assignmentId: number;
  tripId: number;
  guideId: number;
  dayNumber: number;
  date: string;
  location: string;
  journeyTitle: string;
  dutyInstructions: string;
  reportingRequirement?: string | null;
  expectedCheckinLatitude?: number | null;
  expectedCheckinLongitude?: number | null;
  expectedCheckoutLatitude?: number | null;
  expectedCheckoutLongitude?: number | null;
  requiredPhotosCount: number;
  status: string;
  report: {
    id: number;
    reportText: string;
    uploadedPhotoUrls: string[];
    completedTasks: string[];
    guideNotes?: string | null;
    submittedAt: string;
    adminStatus: string;
    adminRemarks?: string | null;
  } | null;
}

export default function DayPlanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: activeTrip } = useGetActiveTrip();
  const trip = activeTrip && typeof activeTrip === "object" && "id" in activeTrip ? activeTrip : null;

  const { data: todayAttendance } = useGetTodayAttendance();
  const checkedIn = !!todayAttendance?.checkInTime;

  const { data: activeWorkDays, isLoading: planLoading, refetch: refetchPlans, isError, error } = useQuery<GuideWorkDay[]>({
    queryKey: ["/guide/work-days/active"],
    queryFn: () => customFetch<GuideWorkDay[]>("/api/guide/work-days/active"),
  });

  const [reportText, setReportText] = useState("");
  const [guideNotes, setGuideNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayWorkDay = activeWorkDays?.find((wd) => wd.date === todayStr);

  // Initialize checked tasks list when today's workday plan changes
  React.useEffect(() => {
    if (todayWorkDay && todayWorkDay.dutyInstructions) {
      const tasks = todayWorkDay.dutyInstructions.split("\n").filter((line) => line.trim());
      const initialChecked: Record<string, boolean> = {};
      tasks.forEach((t) => {
        initialChecked[t.trim()] = false;
      });
      setCheckedTasks(initialChecked);
    }
  }, [todayWorkDay]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handlePickPhoto = async (index: number) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Camera access is required to take photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newPhotos = [...photos];
        newPhotos[index] = result.assets[0].uri;
        setPhotos(newPhotos);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Error", "Failed to capture image. Please try again.");
    }
  };

  const handleChooseGallery = async (index: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newPhotos = [...photos];
        newPhotos[index] = result.assets[0].uri;
        setPhotos(newPhotos);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Error", "Failed to select image.");
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleTask = (task: string) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [task]: !prev[task],
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmitReport = async () => {
    if (!todayWorkDay) return;

    if (!checkedIn) {
      Alert.alert("Check-in Required", "Please check-in first on the Home tab to begin your daily tasks.");
      return;
    }

    if (!reportText.trim()) {
      Alert.alert("Report Text Required", "Please describe what was completed during today's journey.");
      return;
    }

    const requiredCount = todayWorkDay.requiredPhotosCount;
    const validPhotos = photos.filter(Boolean);
    if (validPhotos.length < requiredCount) {
      Alert.alert("Photos Required", `This workday plan requires at least ${requiredCount} photo upload(s). You have added ${validPhotos.length}.`);
      return;
    }

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const formData = new FormData();
      formData.append("workDayId", String(todayWorkDay.id));
      formData.append("reportText", reportText);
      formData.append("guideNotes", guideNotes);

      const completed = Object.keys(checkedTasks).filter((k) => checkedTasks[k]);
      formData.append("completedTasks", JSON.stringify(completed));

      for (let i = 0; i < validPhotos.length; i++) {
        const photoUri = validPhotos[i];
        if (Platform.OS === "web") {
          const res = await fetch(photoUri);
          const blob = await res.blob();
          formData.append("photos", new File([blob], `photo_${i}.jpg`, { type: "image/jpeg" }) as any);
        } else {
          const filename = photoUri.split("/").pop() || `photo_${i}.jpg`;
          const ext = filename.split(".").pop();
          const mime = ext === "png" ? "image/png" : "image/jpeg";
          formData.append("photos", {
            uri: photoUri,
            name: filename,
            type: mime,
          } as any);
        }
      }

      await customFetch("/api/guide/day-report", {
        method: "POST",
        body: formData,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Daily report submitted successfully.");
      refetchPlans();
    } catch (error) {
      Alert.alert("Submission Failed", (error as Error).message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (planLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 24 }]}>
        <Ionicons name="cloud-offline-outline" size={54} color={colors.error} />
        <Text style={[styles.title, { color: colors.foreground, marginTop: 14, textAlign: "center" }]}>Connection Failed</Text>
        <Text style={[styles.subText, { color: colors.mutedForeground, textAlign: "center", marginTop: 8, lineHeight: 20 }]}>
          Could not connect to the API server. Please check your network connection and make sure the backend is running.
        </Text>
        <TouchableOpacity
          style={[styles.resetBtn, { borderColor: colors.primary, marginTop: 20 }]}
          onPress={() => refetchPlans()}
        >
          <Text style={[styles.resetBtnText, { color: colors.primary }]}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Case 1: No active trip assigned
  if (!trip) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 20 }]}>
        <Ionicons name="map-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.title, { color: colors.foreground, marginTop: 12 }]}>No Active Trip</Text>
        <Text style={[styles.subText, { color: colors.mutedForeground, textAlign: "center", marginTop: 8 }]}>
          Once you are assigned to an active trip by the admin, your daily journey plans will appear here.
        </Text>
      </View>
    );
  }

  // Case 2: No workday scheduled for today
  if (!todayWorkDay) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>My Day Plan</Text>
          <Text style={[styles.pageDate, { color: colors.mutedForeground }]}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </Text>

          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 24 }]}>
            <Ionicons name="calendar-outline" size={40} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Workday Scheduled</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              There is no day-wise work plan registered for today. Please contact the administrator.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  const instructions = todayWorkDay.dutyInstructions.split("\n").filter((line) => line.trim());
  const reportSubmitted = !!todayWorkDay.report;

  // Case 3: Report already submitted (Show read-only details & verification status)
  if (reportSubmitted && todayWorkDay.report) {
    const report = todayWorkDay.report;
    const status = report.adminStatus;
    const statusColors =
      status === "approved"
        ? colors.success
        : status === "rejected"
          ? colors.error
          : colors.warning;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>My Day Plan</Text>
          <Text style={[styles.pageDate, { color: colors.mutedForeground }]}>
            Day {todayWorkDay.dayNumber} · {todayWorkDay.date}
          </Text>

          {/* Submission status banner */}
          <View style={[styles.statusBanner, { backgroundColor: `${statusColors}12`, borderColor: statusColors }]}>
            <Ionicons
              name={status === "approved" ? "checkmark-circle" : status === "rejected" ? "close-circle" : "time"}
              size={20}
              color={statusColors}
            />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.statusBannerTitle, { color: statusColors }]}>
                Report {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
              {report.adminRemarks && (
                <Text style={[styles.statusBannerDesc, { color: colors.mutedForeground, marginTop: 2 }]}>
                  Remarks: {report.adminRemarks}
                </Text>
              )}
            </View>
          </View>

          {/* Journey info */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 14 }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{todayWorkDay.journeyTitle}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{todayWorkDay.location}</Text>
            </View>
          </View>

          {/* Completed checklist */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>COMPLETED DUTIES</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {report.completedTasks && report.completedTasks.length > 0 ? (
              report.completedTasks.map((t, idx) => (
                <View key={idx} style={[styles.taskItem, { borderBottomWidth: idx < report.completedTasks.length - 1 ? 1 : 0, borderBottomColor: colors.border }]}>
                  <Ionicons name="checkbox" size={20} color={colors.success} />
                  <Text style={[styles.taskText, { color: colors.foreground, textDecorationLine: "line-through" }]}>{t}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: colors.mutedForeground, fontSize: 13, fontStyle: "italic" }}>No tasks were completed.</Text>
            )}
          </View>

          {/* Submitted text */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SUBMITTED REPORT</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.reportTextPreview, { color: colors.foreground }]}>{report.reportText}</Text>
            {report.guideNotes && (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text style={{ fontSize: 11, fontFamily: "Montserrat_600SemiBold", color: colors.mutedForeground }}>GUIDE NOTES:</Text>
                <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>{report.guideNotes}</Text>
              </View>
            )}
          </View>

          {/* Submitted photos */}
          {report.uploadedPhotoUrls && report.uploadedPhotoUrls.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SUBMITTED PHOTOS</Text>
              <View style={styles.photoGrid}>
                {report.uploadedPhotoUrls.map((url, idx) => (
                  <View key={idx} style={[styles.photoThumbWrap, { borderColor: colors.border }]}>
                    <Image source={{ uri: url }} style={styles.photoThumb} contentFit="cover" />
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // Case 4: Form to submit daily report
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>My Day Plan</Text>
        <Text style={[styles.pageDate, { color: colors.mutedForeground }]}>
          Day {todayWorkDay.dayNumber} · {todayWorkDay.date}
        </Text>

        {/* Check-in reminder banner */}
        {!checkedIn && (
          <View style={[styles.warningBanner, { backgroundColor: `${colors.error}12`, borderColor: colors.error }]}>
            <Ionicons name="warning-outline" size={20} color={colors.error} />
            <Text style={[styles.warningText, { color: colors.error, flex: 1, marginLeft: 8 }]}>
              Check-in Required: Please check-in on the Home screen to start your workday journey.
            </Text>
          </View>
        )}

        {/* Journey details */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 14 }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{todayWorkDay.journeyTitle}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{todayWorkDay.location}</Text>
          </View>
        </View>

        {/* Instructions Checklist */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DUTY CHECKLIST</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {instructions.length > 0 ? (
            instructions.map((inst, idx) => {
              const trimmed = inst.trim();
              const isChecked = !!checkedTasks[trimmed];
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.taskItem,
                    {
                      borderBottomWidth: idx < instructions.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                      opacity: !checkedIn ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => checkedIn && toggleTask(trimmed)}
                  disabled={!checkedIn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isChecked ? "checkbox" : "square-outline"}
                    size={22}
                    color={isChecked ? colors.success : colors.mutedForeground}
                  />
                  <Text style={[styles.taskText, { color: colors.foreground, textDecorationLine: isChecked ? "line-through" : "none" }]}>
                    {trimmed}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>No special instructions today.</Text>
          )}
        </View>

        {/* Photos uploads */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          REQUIRED PHOTOS ({photos.filter(Boolean).length}/{todayWorkDay.requiredPhotosCount})
        </Text>
        <View style={styles.photoContainer}>
          {Array.from({ length: Math.max(todayWorkDay.requiredPhotosCount, 1) }).map((_, idx) => {
            const hasPhoto = !!photos[idx];
            return (
              <View key={idx} style={[styles.photoUploadBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {hasPhoto ? (
                  <View style={{ width: "100%", height: "100%" }}>
                    <Image source={{ uri: photos[idx] }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={() => handleRemovePhoto(idx)}>
                      <Ionicons name="close-circle" size={24} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadButtonsWrap}>
                    <TouchableOpacity
                      style={[styles.uploadBtn, { backgroundColor: `${colors.primary}12` }]}
                      onPress={() => checkedIn && handlePickPhoto(idx)}
                      disabled={!checkedIn}
                    >
                      <Ionicons name="camera" size={20} color={colors.primary} />
                      <Text style={[styles.uploadBtnText, { color: colors.primary }]}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.uploadBtn, { backgroundColor: `${colors.accent}12` }]}
                      onPress={() => checkedIn && handleChooseGallery(idx)}
                      disabled={!checkedIn}
                    >
                      <Ionicons name="image" size={20} color={colors.accent} />
                      <Text style={[styles.uploadBtnText, { color: colors.accent }]}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Report Text */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>JOURNEY REPORT SUMMARY</Text>
        <View style={[styles.notesWrap, { backgroundColor: colors.card, borderColor: colors.border, opacity: !checkedIn ? 0.6 : 1 }]}>
          <TextInput
            style={[styles.notesInput, { color: colors.foreground }]}
            placeholder="Describe what was accomplished, team status, safety check, coordinates reached..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            value={reportText}
            onChangeText={setReportText}
            textAlignVertical="top"
            editable={checkedIn && !submitting}
          />
        </View>

        {/* Notes */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ADDITIONAL NOTES (OPTIONAL)</Text>
        <View style={[styles.notesWrap, { backgroundColor: colors.card, borderColor: colors.border, opacity: !checkedIn ? 0.6 : 1 }]}>
          <TextInput
            style={[styles.notesInput, { color: colors.foreground }]}
            placeholder="Incidents, vendor concerns, or equipment requirements..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={2}
            value={guideNotes}
            onChangeText={setGuideNotes}
            textAlignVertical="top"
            editable={checkedIn && !submitting}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { opacity: submitting || !checkedIn ? 0.7 : 1 }]}
          onPress={handleSubmitReport}
          disabled={submitting || !checkedIn}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={["#FF6B00", "#FF8800"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGrad}
          >
            {submitting ? (
              <ActivityIndicator color="#070B14" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color="#070B14" />
                <Text style={styles.submitText}>Submit Journey Report</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontFamily: "Montserrat_700Bold" },
  subText: { fontSize: 13, fontFamily: "Montserrat_400Regular" },
  content: { paddingHorizontal: 20 },
  pageTitle: { fontSize: 26, fontFamily: "Montserrat_700Bold" },
  pageDate: { fontSize: 13, fontFamily: "Montserrat_500Medium", marginTop: 4 },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 14,
  },
  warningText: {
    fontSize: 12,
    fontFamily: "Montserrat_600SemiBold",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 14,
  },
  statusBannerTitle: {
    fontSize: 14,
    fontFamily: "Montserrat_700Bold",
  },
  statusBannerDesc: {
    fontSize: 12,
    fontFamily: "Montserrat_500Medium",
  },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontFamily: "Montserrat_700Bold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  metaText: { fontSize: 13, fontFamily: "Montserrat_400Regular" },
  sectionLabel: { fontSize: 10, fontFamily: "Montserrat_600SemiBold", letterSpacing: 1.4, marginTop: 22, marginBottom: 10 },
  taskItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 10 },
  taskText: { flex: 1, fontSize: 13, fontFamily: "Montserrat_500Medium" },
  photoContainer: { gap: 12, marginTop: 2 },
  photoUploadBox: { height: 120, borderRadius: 16, borderWidth: 1, overflow: "hidden", justifyContent: "center" },
  uploadButtonsWrap: { flexDirection: "row", justifyContent: "space-evenly", alignItems: "center" },
  uploadBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  uploadBtnText: { fontSize: 12, fontFamily: "Montserrat_600SemiBold" },
  removePhotoBtn: { position: "absolute", top: 8, right: 8 },
  notesWrap: { borderRadius: 14, borderWidth: 1, padding: 14 },
  notesInput: { fontSize: 14, fontFamily: "Montserrat_400Regular", minHeight: 80, lineHeight: 22 },
  submitBtn: { marginTop: 24, borderRadius: 14, overflow: "hidden" },
  submitGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17 },
  submitText: { fontSize: 15, fontFamily: "Montserrat_700Bold", color: "#070B14" },
  emptyCard: { borderRadius: 18, padding: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 16, fontFamily: "Montserrat_700Bold", marginTop: 12 },
  emptyDesc: { fontSize: 13, fontFamily: "Montserrat_400Regular", textAlign: "center", marginTop: 6, lineHeight: 20 },
  reportTextPreview: { fontSize: 14, fontFamily: "Montserrat_400Regular", lineHeight: 22 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoThumbWrap: { width: 75, height: 75, borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  photoThumb: { width: "100%", height: "100%" },
  resetBtn: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  resetBtnText: { fontSize: 14, fontFamily: "Montserrat_600SemiBold" },
});
