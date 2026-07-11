import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
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
import { useGetTodayAttendance, useCheckIn, useCheckOut, useGetActiveTrip } from "@workspace/api-client-react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getOfflineQueue, addOfflineItem } from "../../utils/offlineQueue";
import { syncOfflineQueue } from "../../utils/syncService";
import { useFocusEffect } from "expo-router";

export default function ReportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [locationText, setLocationText] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);



  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const { data: activeTrip } = useGetActiveTrip();
  const trip = activeTrip && typeof activeTrip === "object" && "id" in activeTrip ? activeTrip : null;

  const { data: todayAttendance, refetch: refetchAttendance } = useGetTodayAttendance();
  const { mutateAsync: checkInMutate } = useCheckIn();
  const { mutateAsync: checkOutMutate } = useCheckOut();

  const checkedIn = !!todayAttendance?.checkInTime;
  const checkedOut = !!todayAttendance?.checkOutTime;

  React.useEffect(() => {
    if (todayAttendance) {
      if (todayAttendance.notes) {
        setNotes(todayAttendance.notes);
      }
      
      // If checked out, show the checkout details as locked
      if (todayAttendance.checkOutTime) {
        if (todayAttendance.checkOutLocationName) {
          setLocationText(todayAttendance.checkOutLocationName);
          setLocationVerified(true);
          setCoordinates({
            latitude: todayAttendance.checkOutLatitude ?? 0,
            longitude: todayAttendance.checkOutLongitude ?? 0,
          });
        }
        if (todayAttendance.checkOutSelfieUrl) {
          setSelfieUri(todayAttendance.checkOutSelfieUrl);
        }
      }
    }
  }, [todayAttendance]);

  const checkPendingQueue = React.useCallback(async () => {
    const queue = await getOfflineQueue();
    setPendingCount(queue.length);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkPendingQueue();
      
      const runSync = async () => {
        await syncOfflineQueue(() => {
          refetchAttendance();
          checkPendingQueue();
        });
      };
      runSync();
    }, [checkPendingQueue, refetchAttendance])
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
        checkPendingQueue();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [checkPendingQueue, refetchAttendance]);

  const checkInTimeText = todayAttendance?.checkInTime
    ? new Date(todayAttendance.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "Pending";

  const checkOutTimeText = todayAttendance?.checkOutTime
    ? new Date(todayAttendance.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "Pending";

  const handleGetLocation = async () => {
    setGpsLoading(true);
    try {
      if (Platform.OS === "web") {
        await new Promise((r) => setTimeout(r, 800));
        setLocationText("Manali, Himachal Pradesh");
        setCoordinates({ latitude: 32.2396, longitude: 77.1887 });
        setLocationVerified(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location access is required for verification.");
          setGpsLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [geo] = await Location.reverseGeocodeAsync(loc.coords);
        const place = [geo?.city, geo?.region].filter(Boolean).join(", ");
        setLocationText(place || `${loc.coords.latitude.toFixed(4)}°N, ${loc.coords.longitude.toFixed(4)}°E`);
        setCoordinates({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        setLocationVerified(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Location Error", "Could not fetch location. Please try again.");
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSelfie = async () => {
    try {
      if (Platform.OS === "web") {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
        if (!result.canceled) setSelfieUri(result.assets[0].uri);
        return;
      }
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Camera access is required for selfie verification.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
      });
      if (!result.canceled) {
        setSelfieUri(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Camera Error", "Could not open camera. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!locationVerified || !coordinates || !locationText) {
      Alert.alert("Location Required", "Please verify your GPS location before submitting.");
      return;
    }
    if (!selfieUri) {
      Alert.alert("Selfie Required", "Please capture a verification selfie before submitting.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      let fileToUpload: any;
      if (Platform.OS === "web") {
        const response = await fetch(selfieUri);
        const blob = await response.blob();
        fileToUpload = new File([blob], "selfie.jpg", { type: "image/jpeg" }) as any;
      } else {
        const filename = selfieUri.split("/").pop() || "selfie.jpg";
        const fileType = filename.split(".").pop();
        const mimeType = fileType === "png" ? "image/png" : "image/jpeg";
        fileToUpload = {
          uri: selfieUri,
          name: filename,
          type: mimeType,
        } as any;
      }

      if (!checkedIn) {
        // Check-in
        await checkInMutate({
          data: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            locationName: locationText,
            selfie: fileToUpload,
          },
        });
      } else {
        // Check-out
        await checkOutMutate({
          data: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            locationName: locationText,
            selfie: fileToUpload,
          },
        });
      }

      await refetchAttendance();
      setSubmitted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const errorMsg = (error as any).message || "";
      const isNetworkError =
        errorMsg.toLowerCase().includes("network") ||
        errorMsg.toLowerCase().includes("failed to fetch") ||
        errorMsg.toLowerCase().includes("load failed") ||
        errorMsg.toLowerCase().includes("fetch failed");

      if (isNetworkError) {
        try {
          const activeTripId = trip?.id;
          const guideIdStr = await AsyncStorage.getItem("@yc_auth_v2");
          const parsedGuide = guideIdStr ? JSON.parse(guideIdStr) : {};
          const guideId = parsedGuide.userId;

          if (!activeTripId || !guideId) {
            Alert.alert("Error", "Could not resolve active trip or guide details for offline logging.");
            setSubmitting(false);
            return;
          }

          // Duplicate check
          const queue = await getOfflineQueue();
          const todayStr = new Date().toISOString().split("T")[0];
          const type = !checkedIn ? "check-in" : "check-out";
          const isDuplicate = queue.some(
            (item) => item.guideId === guideId && item.tripId === activeTripId && item.date === todayStr && item.type === type
          );

          if (isDuplicate) {
            Alert.alert("Already Saved", `An offline ${type} request is already queued for today.`);
            setSubmitting(false);
            return;
          }

          await addOfflineItem({
            type,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            locationName: locationText,
            selfieUri: selfieUri,
            date: todayStr,
            tripId: activeTripId,
            guideId,
            notes,
          });

          setSubmitted(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert(
            "Captured Offline",
            "You are currently offline. Your report has been saved locally and will automatically sync when connection returns."
          );
        } catch (e) {
          Alert.alert("Local Save Failed", "Failed to cache report locally: " + (e as Error).message);
        }
      } else {
        Alert.alert("Submission Failed", (error as any).message || "An error occurred during submission.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 32 }]}>
        <View style={[styles.successRing, { backgroundColor: `${colors.success}18` }]}>
          <Ionicons name="checkmark-circle" size={60} color={colors.success} />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>Report Submitted</Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          Your daily report for {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" })} has been submitted successfully.
        </Text>
        <TouchableOpacity
          style={[styles.resetBtn, { borderColor: colors.primary }]}
          onPress={() => { setSubmitted(false); setLocationVerified(false); setLocationText(null); setCoordinates(null); setSelfieUri(null); setNotes(""); }}
        >
          <Text style={[styles.resetBtnText, { color: colors.primary }]}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Daily Report</Text>
        <Text style={[styles.pageDate, { color: colors.mutedForeground }]}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </Text>

        {pendingCount > 0 && (
          <View style={[styles.syncBanner, { backgroundColor: colors.warning + "20", borderColor: colors.warning }]}>
            <Ionicons name="cloud-offline" size={16} color={colors.warning} />
            <Text style={[styles.syncBannerText, { color: colors.warning }]}>
              Pending Sync ({pendingCount} item{pendingCount > 1 ? "s" : ""} offline)
            </Text>
          </View>
        )}

        {/* GPS */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LOCATION VERIFICATION</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.gpsRow}>
            <View style={[styles.gpsIcon, { backgroundColor: locationVerified ? `${colors.success}18` : `${colors.warning}18` }]}>
              <Ionicons
                name={locationVerified ? "location" : "location-outline"}
                size={22}
                color={locationVerified ? colors.success : colors.warning}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.gpsTitle, { color: colors.foreground }]}>
                GPS {locationVerified ? "Verified" : "Not Verified"}
              </Text>
              <Text style={[styles.gpsLoc, { color: colors.mutedForeground }]}>
                {locationText ?? "Location not captured yet"}
              </Text>
            </View>
            {locationVerified && (
              <View style={[styles.verifiedBadge, { backgroundColor: `${colors.success}18` }]}>
                <Ionicons name="shield-checkmark" size={13} color={colors.success} />
                <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
              </View>
            )}
          </View>
          {!locationVerified && (
            <TouchableOpacity
              style={[styles.gpsBtn, { backgroundColor: `${colors.primary}12`, borderColor: colors.primary, opacity: checkedOut ? 0.6 : 1 }]}
              onPress={handleGetLocation}
              disabled={gpsLoading || checkedOut || submitting}
              activeOpacity={0.85}
            >
              {gpsLoading
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <>
                  <Ionicons name="navigate" size={16} color={colors.primary} />
                  <Text style={[styles.gpsBtnText, { color: colors.primary }]}>Get Current Location</Text>
                </>
              }
            </TouchableOpacity>
          )}
        </View>

        {/* Selfie */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SELFIE VERIFICATION</Text>
        <TouchableOpacity
          style={[styles.selfieCard, {
            backgroundColor: colors.card,
            borderColor: selfieUri ? colors.primary : colors.border,
            opacity: checkedOut ? 0.6 : 1,
          }]}
          onPress={handleSelfie}
          disabled={checkedOut || submitting}
          activeOpacity={0.88}
        >
          {selfieUri ? (
            <>
              <Image source={{ uri: selfieUri }} style={styles.selfieImg} contentFit="cover" />
              <View style={[styles.selfieOverlay]}>
                <Ionicons name="camera" size={22} color="#fff" />
                <Text style={styles.retakeText}>Retake</Text>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.selfieIconWrap, { backgroundColor: `${colors.primary}14` }]}>
                <Ionicons name="camera" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.selfieTitle, { color: colors.foreground }]}>
                {Platform.OS === "web" ? "Upload Selfie" : "Take Verification Selfie"}
              </Text>
              <Text style={[styles.selfieSub, { color: colors.mutedForeground }]}>
                {Platform.OS === "web" ? "Tap to choose from gallery" : "Tap to open front camera"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Times */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CHECK-IN / CHECK-OUT</Text>
        <View style={styles.timeRow}>
          <View style={[styles.timeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.timeIcon, { backgroundColor: `${colors.success}14` }]}>
              <Ionicons name="log-in-outline" size={18} color={colors.success} />
            </View>
            <Text style={[styles.timeLbl, { color: colors.mutedForeground }]}>CHECK-IN</Text>
            <Text style={[styles.timeVal, { color: colors.foreground }]}>{checkInTimeText}</Text>
          </View>
          <View style={[styles.timeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.timeIcon, { backgroundColor: `${colors.warning}14` }]}>
              <Ionicons name="log-out-outline" size={18} color={colors.warning} />
            </View>
            <Text style={[styles.timeLbl, { color: colors.mutedForeground }]}>CHECK-OUT</Text>
            <Text style={[styles.timeVal, { color: colors.foreground }]}>{checkOutTimeText}</Text>
          </View>
        </View>

        {/* Notes */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NOTES</Text>
        <View style={[styles.notesWrap, { backgroundColor: colors.card, borderColor: colors.border, opacity: checkedOut ? 0.6 : 1 }]}>
          <TextInput
            style={[styles.notesInput, { color: colors.foreground }]}
            placeholder="Daily observations, incidents, or notes..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
            editable={!checkedOut && !submitting}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { opacity: submitting || checkedOut ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={submitting || checkedOut}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={["#FF6B00", "#FF8800"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGrad}
          >
            {submitting
              ? <ActivityIndicator color="#070B14" />
              : <>
                <Ionicons name={checkedOut ? "checkmark-outline" : "send"} size={18} color="#070B14" />
                <Text style={styles.submitText}>
                  {checkedOut 
                    ? "Work Completed" 
                    : checkedIn 
                      ? "Submit Check-Out" 
                      : "Submit Check-In"}
                </Text>
              </>
            }
          </LinearGradient>
        </TouchableOpacity>
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
    marginTop: 14,
    marginBottom: 8,
  },
  syncBannerText: {
    fontSize: 12,
    fontFamily: "Montserrat_600SemiBold",
  },
  content: { paddingHorizontal: 20 },
  pageTitle: { fontSize: 26, fontFamily: "Montserrat_700Bold" },
  pageDate: { fontSize: 13, fontFamily: "Montserrat_400Regular", marginTop: 4 },
  sectionLabel: { fontSize: 10, fontFamily: "Montserrat_600SemiBold", letterSpacing: 1.4, marginTop: 22, marginBottom: 10 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  gpsRow: { flexDirection: "row", alignItems: "center" },
  gpsIcon: { width: 50, height: 50, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  gpsTitle: { fontSize: 14, fontFamily: "Montserrat_600SemiBold" },
  gpsLoc: { fontSize: 12, fontFamily: "Montserrat_400Regular", marginTop: 2 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 },
  verifiedText: { fontSize: 11, fontFamily: "Montserrat_600SemiBold" },
  gpsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, borderWidth: 1.5, borderRadius: 11, paddingVertical: 13 },
  gpsBtnText: { fontSize: 14, fontFamily: "Montserrat_600SemiBold" },
  selfieCard: { borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", height: 160, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  selfieImg: { width: "100%", height: "100%" },
  selfieOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(7,11,20,0.55)", alignItems: "center", justifyContent: "center", gap: 6 },
  retakeText: { fontSize: 13, fontFamily: "Montserrat_600SemiBold", color: "#fff" },
  selfieIconWrap: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  selfieTitle: { fontSize: 15, fontFamily: "Montserrat_600SemiBold", marginBottom: 4 },
  selfieSub: { fontSize: 12, fontFamily: "Montserrat_400Regular" },
  timeRow: { flexDirection: "row", gap: 12 },
  timeCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1 },
  timeIcon: { width: 38, height: 38, borderRadius: 11, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  timeLbl: { fontSize: 9, fontFamily: "Montserrat_700Bold", letterSpacing: 1.2, marginBottom: 4 },
  timeVal: { fontSize: 16, fontFamily: "Montserrat_700Bold" },
  notesWrap: { borderRadius: 14, borderWidth: 1, padding: 14 },
  notesInput: { fontSize: 14, fontFamily: "Montserrat_400Regular", minHeight: 100, lineHeight: 22 },
  submitBtn: { marginTop: 24, borderRadius: 14, overflow: "hidden" },
  submitGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17 },
  submitText: { fontSize: 15, fontFamily: "Montserrat_700Bold", color: "#FFFFFF" },
  successRing: { width: 110, height: 110, borderRadius: 55, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  successTitle: { fontSize: 24, fontFamily: "Montserrat_700Bold", marginBottom: 12 },
  successSub: { fontSize: 14, fontFamily: "Montserrat_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 32 },
  resetBtn: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  resetBtnText: { fontSize: 14, fontFamily: "Montserrat_600SemiBold" },
});
