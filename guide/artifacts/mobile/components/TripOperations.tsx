import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { customFetch } from "@workspace/api-client-react";
import {
  addOfflineOperation,
  getOfflineOperations,
  syncPendingOperations,
  cacheParticipantList,
  getCachedParticipantList,
} from "../utils/operationsQueue";

declare var FormData: any;

interface Traveler {
  bookingId: string;
  name: string;
  phone: string;
  gender?: string | null;
  paymentStatus?: string;
  attendanceStatus?: string;
  foodPreference?: string;
}

interface TripOperationsProps {
  assignmentId: number;
}

export default function TripOperations({ assignmentId }: TripOperationsProps) {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"participants" | "checkin" | "hotel" | "food" | "movement" | "photos">("participants");

  // State lists
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Participant Tab State
  const [participants, setParticipants] = useState<Traveler[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Checkin Tab State
  const [checkinType, setCheckinType] = useState<"railway_station" | "bus_pickup" | "hotel" | "sightseeing" | "return_journey">("railway_station");
  const [checkinLoc, setCheckinLoc] = useState("");
  const [checkinNotes, setCheckinNotes] = useState("");
  const [checkinPhoto, setCheckinPhoto] = useState<string | null>(null);

  // Hotel Tab State
  const [hotelName, setHotelName] = useState("");
  const [roomsUsed, setRoomsUsed] = useState("");
  const [roomAllocStatus, setRoomAllocStatus] = useState("allocated");
  const [hotelPhoto, setHotelPhoto] = useState<string | null>(null);
  const [hotelNotes, setHotelNotes] = useState("");

  // Food Tab State
  const [foodDay, setFoodDay] = useState("1");
  const [foodRating, setFoodRating] = useState<number>(3);
  const [foodJainCount, setFoodJainCount] = useState("");
  const [foodNonJainCount, setFoodNonJainCount] = useState("");
  const [foodExtraMeals, setFoodExtraMeals] = useState("");
  const [foodNotes, setFoodNotes] = useState("");
  const [foodPhoto, setFoodPhoto] = useState<string | null>(null);
  const [foodVideo, setFoodVideo] = useState<string | null>(null);

  // Movement Tab State
  const [moveType, setMoveType] = useState<"departed_pickup" | "train_boarded" | "bus_started" | "reached_destination" | "sightseeing_started" | "sightseeing_completed" | "return_journey_started">("departed_pickup");
  const [moveLoc, setMoveLoc] = useState("");
  const [moveNotes, setMoveNotes] = useState("");
  const [movePhoto, setMovePhoto] = useState<string | null>(null);
  const [moveVideo, setMoveVideo] = useState<string | null>(null);

  // Group Photos Tab State
  const [photoDay, setPhotoDay] = useState("1");
  const [photoLoc, setPhotoLoc] = useState("");
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const [photoNotes, setPhotoNotes] = useState("");

  // Initial load
  useEffect(() => {
    const initData = async () => {
      await loadData();
      await checkOfflineQueue();
    };
    initData();
  }, [assignmentId]);

  const checkOfflineQueue = async () => {
    const queue = await getOfflineOperations();
    setPendingCount(queue.length);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch from Cache first
      const cachedList = await getCachedParticipantList(assignmentId);
      if (cachedList) {
        setParticipants(cachedList);
      }

      // 2. Query Live Travelers List
      const travList = await customFetch<Traveler[]>(`/api/guide/my-travelers/${assignmentId}`);
      setParticipants(travList);
      await cacheParticipantList(assignmentId, travList);

      // 3. Query Live Operational Stats (gender, food preferences, pickup cities)
      const opStats = await customFetch<any>(`/api/guide/operations/stats/${assignmentId}`);
      setStats(opStats);
      
      // Auto-populate manual food preference counts from stats
      if (opStats) {
        setFoodJainCount(String(opStats.jainPreferenceCount || 0));
        setFoodNonJainCount(String(opStats.nonJainPreferenceCount || 0));
      }
    } catch (err) {
      console.warn("Failed to load operations data from server, using cached data if available:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger sync of pending queue
  const triggerSync = async () => {
    setSyncing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await syncPendingOperations((item, error) => {
        if (error) {
          Alert.alert("Sync Notice", `Failed to sync operation: ${error}`);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      });
      await checkOfflineQueue();
    } catch (err) {
      Alert.alert("Sync Error", (err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  // Media Picker Handler
  const handleSelectMedia = async (
    type: "photo" | "video" | "both",
    onSelect: (uri: string, isVideo: boolean) => void
  ) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted" || libraryStatus.status !== "granted") {
        Alert.alert("Permission Denied", "Camera and gallery permissions are required.");
        return;
      }

      Alert.alert(
        "Upload Attachment",
        "Choose source",
        [
          {
            text: "Take Photo / Record Video",
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: type === "video" 
                  ? ImagePicker.MediaTypeOptions.Videos 
                  : type === "photo" 
                  ? ImagePicker.MediaTypeOptions.Images 
                  : ImagePicker.MediaTypeOptions.All,
                allowsEditing: true,
                quality: 0.7, // Compress images automatically!
              });

              if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                const isVid = asset.type === "video";
                onSelect(asset.uri, isVid);
              }
            }
          },
          {
            text: "Choose from Gallery",
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: type === "video" 
                  ? ImagePicker.MediaTypeOptions.Videos 
                  : type === "photo" 
                  ? ImagePicker.MediaTypeOptions.Images 
                  : ImagePicker.MediaTypeOptions.All,
                allowsEditing: true,
                quality: 0.7, // Compress images automatically!
              });

              if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                const isVid = asset.type === "video";
                onSelect(asset.uri, isVid);
              }
            }
          },
          { text: "Cancel", style: "cancel" }
        ]
      );
    } catch (e) {
      Alert.alert("Error Selecting Media", (e as Error).message);
    }
  };

  // Attendance Checkin/Status trigger
  const handleMarkAttendance = async (bookingId: string, travelerName: string, phone: string, status: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      // Opt to post directly via customFetch
      await customFetch("/api/guide/traveler-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          bookingId,
          travelerName,
          travelerPhone: phone || null,
          status,
          notes: "Marked from Live Operations Panel",
        }),
      });

      // Update local state
      const updated = participants.map((p) =>
        p.bookingId === bookingId && p.name === travelerName
          ? { ...p, attendanceStatus: status }
          : p
      );
      setParticipants(updated);
      await cacheParticipantList(assignmentId, updated);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // If offline
      const localBody = {
        assignmentId,
        bookingId,
        travelerName,
        travelerPhone: phone || null,
        status,
        notes: "Marked from Live Operations Panel (Offline)",
      };
      await addOfflineOperation("checkin", {
        assignmentId,
        checkinType: "bus_pickup",
        locationName: "Pickup status mark",
        photoUrl: "placeholder_attendance", // bypass photo req for quick checklist marks
        notes: JSON.stringify(localBody)
      });
      await checkOfflineQueue();
      Alert.alert("Offline Mode", "Saved attendance status mark to Pending Sync.");
    }
  };

  // 1. Submit Location Check-in
  const submitCheckin = async () => {
    if (!checkinPhoto) {
      Alert.alert("Photo Required", "Please take/upload a check-in photo as proof.");
      return;
    }
    if (!checkinLoc.trim()) {
      Alert.alert("Location Required", "Please enter location name.");
      return;
    }

    const payload = {
      assignmentId,
      checkinType,
      locationName: checkinLoc,
      photoUrl: checkinPhoto,
      notes: checkinNotes,
      latitude: 0,
      longitude: 0,
    };

    setLoading(true);
    try {
      await customFetch("/api/guide/operations/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      Alert.alert("Success", "Check-in point recorded successfully!");
      setCheckinLoc("");
      setCheckinNotes("");
      setCheckinPhoto(null);
    } catch (e) {
      await addOfflineOperation("checkin", payload);
      await checkOfflineQueue();
      Alert.alert("Offline Sync", "Saved check-in locally as Pending Sync.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Hotel Update
  const submitHotel = async (status: "pending" | "done" | "issue_reported") => {
    if (!hotelName.trim()) {
      Alert.alert("Hotel Required", "Please enter the Hotel Name.");
      return;
    }
    if (!hotelPhoto && status === "done") {
      Alert.alert("Photo Required", "Photo proof is required to check-in and mark as Done.");
      return;
    }

    const payload = {
      assignmentId,
      hotelName,
      roomsUsed: roomsUsed ? parseInt(roomsUsed, 10) : 0,
      roomAllocationStatus: roomAllocStatus,
      hotelPhotos: hotelPhoto ? [hotelPhoto] : [],
      notes: hotelNotes,
      status,
    };

    setLoading(true);
    try {
      await customFetch("/api/guide/operations/hotel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      Alert.alert("Success", `Hotel update marked as ${status.replace("_", " ")}!`);
      if (status === "done" || status === "issue_reported") {
        setHotelName("");
        setRoomsUsed("");
        setHotelPhoto(null);
        setHotelNotes("");
      }
    } catch (e) {
      await addOfflineOperation("hotel", payload);
      await checkOfflineQueue();
      Alert.alert("Offline Sync", "Saved hotel stay update locally as Pending Sync.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Food update
  const submitFood = async () => {
    if (!foodPhoto && !foodVideo) {
      Alert.alert("Media Required", "Dinner/food update requires a photo or video upload.");
      return;
    }

    const payload = {
      assignmentId,
      dayNumber: parseInt(foodDay, 10) || 1,
      photoUrl: foodPhoto || undefined,
      videoUrl: foodVideo || undefined,
      rating: foodRating,
      jainCount: foodJainCount ? parseInt(foodJainCount, 10) : 0,
      nonJainCount: foodNonJainCount ? parseInt(foodNonJainCount, 10) : 0,
      extraMeals: foodExtraMeals ? parseInt(foodExtraMeals, 10) : 0,
      notes: foodNotes,
    };

    setLoading(true);
    try {
      await customFetch("/api/guide/operations/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      Alert.alert("Success", "Food/meals log recorded successfully!");
      setFoodPhoto(null);
      setFoodVideo(null);
      setFoodNotes("");
      setFoodExtraMeals("");
    } catch (e) {
      await addOfflineOperation("food", payload);
      await checkOfflineQueue();
      Alert.alert("Offline Sync", "Saved meals log locally as Pending Sync.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit live transit movement
  const submitMovement = async () => {
    const payload = {
      assignmentId,
      movementType: moveType,
      locationName: moveLoc || null,
      photoUrl: movePhoto || undefined,
      videoUrl: moveVideo || undefined,
      notes: moveNotes,
    };

    setLoading(true);
    try {
      await customFetch("/api/guide/operations/movement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      Alert.alert("Success", "Movement update logged successfully!");
      setMoveLoc("");
      setMoveNotes("");
      setMovePhoto(null);
      setMoveVideo(null);
    } catch (e) {
      await addOfflineOperation("movement", payload);
      await checkOfflineQueue();
      Alert.alert("Offline Sync", "Saved movement transit update locally as Pending Sync.");
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit group photo
  const submitGroupPhoto = async () => {
    if (!groupPhoto) {
      Alert.alert("Photo Required", "Sightseeing Group Photo is mandatory.");
      return;
    }
    if (!photoLoc.trim()) {
      Alert.alert("Location Required", "Please enter the sightseeing point/location name.");
      return;
    }

    const payload = {
      assignmentId,
      photoUrl: groupPhoto,
      locationName: photoLoc,
      dayNumber: parseInt(photoDay, 10) || 1,
      notes: photoNotes,
    };

    setLoading(true);
    try {
      await customFetch("/api/guide/operations/group-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      Alert.alert("Success", "Sightseeing group photo saved successfully!");
      setGroupPhoto(null);
      setPhotoLoc("");
      setPhotoNotes("");
    } catch (e) {
      await addOfflineOperation("group-photo", payload);
      await checkOfflineQueue();
      Alert.alert("Offline Sync", "Saved group photo locally as Pending Sync.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Pending Offline Sync Badge */}
      {pendingCount > 0 && (
        <View style={[styles.syncBanner, { backgroundColor: `${colors.warning}18`, borderColor: colors.warning }]}>
          <Ionicons name="cloud-offline-outline" size={18} color={colors.warning} />
          <Text style={[styles.syncText, { color: colors.warning }]}>
            {pendingCount} update{pendingCount > 1 ? "s" : ""} pending sync.
          </Text>
          <TouchableOpacity
            style={[styles.syncBtn, { backgroundColor: colors.warning }]}
            onPress={triggerSync}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#0F172A" />
            ) : (
              <Text style={styles.syncBtnText}>Sync Now</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={{ paddingRight: 20 }}>
        {[
          { key: "participants", label: "Participants", icon: "people-outline" },
          { key: "checkin", label: "Check-ins", icon: "location-outline" },
          { key: "hotel", label: "Hotel Check-in", icon: "business-outline" },
          { key: "food", label: "Meals Quality", icon: "restaurant-outline" },
          { key: "movement", label: "Transit", icon: "bus-outline" },
          { key: "photos", label: "Group Photo", icon: "camera-outline" },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.tab,
              activeTab === t.key && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => {
              setActiveTab(t.key as any);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons name={t.icon as any} size={15} color={activeTab === t.key ? "#0F172A" : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: activeTab === t.key ? "#0F172A" : colors.mutedForeground }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <View style={styles.contentContainer}>
        {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />}

        {/* Tab 1: Participants List */}
        {activeTab === "participants" && !loading && (
          <View>
            {/* Stats Overview */}
            {stats && (
              <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Participant Analytics</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statCol}>
                    <Text style={[styles.statVal, { color: colors.primary }]}>{stats.totalParticipants}</Text>
                    <Text style={styles.statLabel}>Total Guests</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={[styles.statVal, { color: colors.success }]}>{stats.confirmedCount}</Text>
                    <Text style={styles.statLabel}>Confirmed</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={[styles.statVal, { color: colors.foreground }]}>{stats.maleCount}M / {stats.femaleCount}F</Text>
                    <Text style={styles.statLabel}>Gender Ratio</Text>
                  </View>
                </View>

                {/* Pickup break down */}
                <Text style={[styles.subSectionTitle, { color: colors.mutedForeground, marginTop: 14 }]}>PICKUP CITIES</Text>
                {Object.entries(stats.pickupCityBreakdown || {}).map(([city, count]) => (
                  <View key={city} style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.foreground }]}>{city}</Text>
                    <Text style={[styles.infoVal, { color: colors.mutedForeground }]}>{count as number} guests</Text>
                  </View>
                ))}
              </View>
            )}

            {/* List */}
            <Text style={[styles.subSectionTitle, { color: colors.mutedForeground, marginTop: 14, marginBottom: 8 }]}>TRAVELER LIST (READ-ONLY)</Text>
            {participants.length === 0 ? (
              <Text style={{ fontStyle: "italic", color: colors.mutedForeground, marginVertical: 12 }}>No traveler data found.</Text>
            ) : (
              participants.map((p, idx) => (
                <View key={idx} style={[styles.travelerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.travelerHeader}>
                    <View>
                      <Text style={[styles.travelerName, { color: colors.foreground }]}>{p.name}</Text>
                      <Text style={[styles.travelerPhone, { color: colors.mutedForeground }]}>
                        {p.phone || "No phone"} · {p.gender || "Unknown"} · Meal: {p.foodPreference || "Other"}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: p.paymentStatus === "Paid" ? `${colors.success}20` : `${colors.warning}20` }]}>
                      <Text style={{ color: p.paymentStatus === "Paid" ? colors.success : colors.warning, fontSize: 10, fontWeight: "bold" }}>
                        {p.paymentStatus || "Unpaid"}
                      </Text>
                    </View>
                  </View>

                  {/* Attendance Controls */}
                  <View style={styles.attendanceButtons}>
                    {[
                      { status: "arrived_pickup", label: "Arrived", color: colors.primary },
                      { status: "boarded_train", label: "Boarded", color: colors.accent },
                      { status: "reached_destination", label: "Reached", color: colors.success },
                      { status: "missing_delayed", label: "Delayed/Issue", color: colors.error },
                    ].map((b) => (
                      <TouchableOpacity
                        key={b.status}
                        style={[
                          styles.attBtn,
                          p.attendanceStatus === b.status
                            ? { backgroundColor: b.color }
                            : { backgroundColor: `${colors.border}30`, borderColor: colors.border }
                        ]}
                        onPress={() => handleMarkAttendance(p.bookingId, p.name, p.phone, b.status)}
                      >
                        <Text style={[
                          styles.attBtnText,
                          p.attendanceStatus === b.status ? { color: "#0F172A" } : { color: colors.mutedForeground }
                        ]}>
                          {b.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Tab 2: Location Checkin */}
        {activeTab === "checkin" && (
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Check-in Location Point</Text>
            
            <Text style={styles.label}>Check-in Location Type</Text>
            <View style={styles.pickerRow}>
              {[
                { key: "railway_station", label: "Railway" },
                { key: "bus_pickup", label: "Bus Pickup" },
                { key: "hotel", label: "Hotel" },
                { key: "sightseeing", label: "Sightseeing" },
                { key: "return_journey", label: "Return" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.pickerChip, checkinType === item.key && { backgroundColor: colors.primary }]}
                  onPress={() => setCheckinType(item.key as any)}
                >
                  <Text style={[styles.pickerChipText, { color: checkinType === item.key ? "#0F172A" : colors.mutedForeground }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Location Name</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. Manali Railway Station Platform 1"
              placeholderTextColor={colors.mutedForeground}
              value={checkinLoc}
              onChangeText={setCheckinLoc}
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, height: 60 }]}
              placeholder="Any details (optional)"
              placeholderTextColor={colors.mutedForeground}
              multiline
              value={checkinNotes}
              onChangeText={setCheckinNotes}
            />

            <Text style={styles.label}>Photo Proof (Mandatory)</Text>
            {checkinPhoto ? (
              <View style={styles.imagePreviewWrap}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} style={styles.successIcon} />
                <Text style={{ color: colors.foreground, fontSize: 13 }}>Photo Attached Successfully</Text>
                <TouchableOpacity onPress={() => setCheckinPhoto(null)}>
                  <Text style={{ color: colors.error, fontWeight: "bold", marginLeft: 10 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadBox, { borderColor: colors.border }]}
                onPress={() => handleSelectMedia("photo", (uri) => setCheckinPhoto(uri))}
              >
                <Ionicons name="camera" size={30} color={colors.mutedForeground} />
                <Text style={[styles.uploadLabel, { color: colors.mutedForeground }]}>Capture Photo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={submitCheckin}>
              <Text style={styles.submitButtonText}>Submit Check-in Point</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab 3: Hotel check-in */}
        {activeTab === "hotel" && (
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Hotel Stay Management</Text>

            <Text style={styles.label}>Hotel Name</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. Snow Valley Resort Manali"
              placeholderTextColor={colors.mutedForeground}
              value={hotelName}
              onChangeText={setHotelName}
            />

            <Text style={styles.label}>Rooms Used</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. 8"
              keyboardType="number-pad"
              placeholderTextColor={colors.mutedForeground}
              value={roomsUsed}
              onChangeText={setRoomsUsed}
            />

            <Text style={styles.label}>Room Allocation Status</Text>
            <View style={styles.pickerRow}>
              {[
                { key: "allocated", label: "Allocated" },
                { key: "pending", label: "Pending" },
                { key: "issue_reported", label: "Issue Reported" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.pickerChip, roomAllocStatus === item.key && { backgroundColor: roomAllocStatus === "issue_reported" ? colors.error : colors.primary }]}
                  onPress={() => setRoomAllocStatus(item.key)}
                >
                  <Text style={[styles.pickerChipText, { color: roomAllocStatus === item.key ? (roomAllocStatus === "issue_reported" ? "white" : "#0F172A") : colors.mutedForeground }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, height: 60 }]}
              placeholder="Room numbers, complaints, extra charges..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              value={hotelNotes}
              onChangeText={setHotelNotes}
            />

            <Text style={styles.label}>Hotel Room Photo proof (Mandatory for Done)</Text>
            {hotelPhoto ? (
              <View style={styles.imagePreviewWrap}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} style={styles.successIcon} />
                <Text style={{ color: colors.foreground, fontSize: 13 }}>Photo Attached</Text>
                <TouchableOpacity onPress={() => setHotelPhoto(null)}>
                  <Text style={{ color: colors.error, fontWeight: "bold", marginLeft: 10 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadBox, { borderColor: colors.border }]}
                onPress={() => handleSelectMedia("photo", (uri) => setHotelPhoto(uri))}
              >
                <Ionicons name="image" size={30} color={colors.mutedForeground} />
                <Text style={[styles.uploadLabel, { color: colors.mutedForeground }]}>Select Room Photo</Text>
              </TouchableOpacity>
            )}

            <View style={styles.dualButtons}>
              <TouchableOpacity
                style={[styles.halfBtn, { backgroundColor: colors.error }]}
                onPress={() => submitHotel("issue_reported")}
              >
                <Text style={styles.btnTextWhite}>Report Issue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.halfBtn, { backgroundColor: colors.success }]}
                onPress={() => submitHotel("done")}
              >
                <Text style={styles.btnTextWhite}>Mark as Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tab 4: Food rating */}
        {activeTab === "food" && (
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Meals Logs & Quality</Text>

            <Text style={styles.label}>Day Number</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. 1"
              keyboardType="number-pad"
              placeholderTextColor={colors.mutedForeground}
              value={foodDay}
              onChangeText={setFoodDay}
            />

            <Text style={styles.label}>Meal Quality Rating (1 - 5 Stars)</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setFoodRating(star)}>
                  <Ionicons
                    name={star <= foodRating ? "star" : "star-outline"}
                    size={28}
                    color={star <= foodRating ? colors.primary : colors.mutedForeground}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Jain / Non-Jain Sync manually */}
            <Text style={[styles.subSectionTitle, { color: colors.mutedForeground, marginTop: 14 }]}>TEMPORARY FOOD COUNT OVERRIDE</Text>
            <Text style={styles.helpText}>Read from bookings automatically. If missing or changed on trail, edit here manually.</Text>
            
            <View style={styles.statsRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Jain Meal Count</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                  placeholder="e.g. 4"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.mutedForeground}
                  value={foodJainCount}
                  onChangeText={setFoodJainCount}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Non-Jain Count</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                  placeholder="e.g. 18"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.mutedForeground}
                  value={foodNonJainCount}
                  onChangeText={setFoodNonJainCount}
                />
              </View>
            </View>

            <Text style={styles.label}>Extra Meals Purchased</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. 2"
              keyboardType="number-pad"
              placeholderTextColor={colors.mutedForeground}
              value={foodExtraMeals}
              onChangeText={setFoodExtraMeals}
            />

            <Text style={styles.label}>Meal Notes</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, height: 60 }]}
              placeholder="Dinner menu, delay details, vendor remarks..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              value={foodNotes}
              onChangeText={setFoodNotes}
            />

            <Text style={styles.label}>Photo / Video Proof (Mandatory)</Text>
            {foodPhoto || foodVideo ? (
              <View style={styles.imagePreviewWrap}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} style={styles.successIcon} />
                <Text style={{ color: colors.foreground, fontSize: 13 }}>
                  {foodPhoto ? "Photo Attached" : "Video Attached"}
                </Text>
                <TouchableOpacity onPress={() => { setFoodPhoto(null); setFoodVideo(null); }}>
                  <Text style={{ color: colors.error, fontWeight: "bold", marginLeft: 10 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadBox, { borderColor: colors.border }]}
                onPress={() => handleSelectMedia("both", (uri, isVid) => {
                  if (isVid) setFoodVideo(uri);
                  else setFoodPhoto(uri);
                })}
              >
                <Ionicons name="videocam" size={30} color={colors.mutedForeground} />
                <Text style={[styles.uploadLabel, { color: colors.mutedForeground }]}>Capture Photo or Video</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={submitFood}>
              <Text style={styles.submitButtonText}>Submit Food Quality Update</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab 5: Live movement transit */}
        {activeTab === "movement" && (
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Transit & Movement Log</Text>

            <Text style={styles.label}>Movement Type</Text>
            <View style={styles.pickerRow}>
              {[
                { key: "departed_pickup", label: "Departed" },
                { key: "train_boarded", label: "Train Boarded" },
                { key: "bus_started", label: "Bus Started" },
                { key: "reached_destination", label: "Reached" },
                { key: "sightseeing_started", label: "Sightseeing Start" },
                { key: "sightseeing_completed", label: "Sightseeing End" },
                { key: "return_journey_started", label: "Return Start" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.pickerChip, moveType === item.key && { backgroundColor: colors.primary }]}
                  onPress={() => setMoveType(item.key as any)}
                >
                  <Text style={[styles.pickerChipText, { color: moveType === item.key ? "#0F172A" : colors.mutedForeground }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Current Location</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. Ambala Cantt Railway Station"
              placeholderTextColor={colors.mutedForeground}
              value={moveLoc}
              onChangeText={setMoveLoc}
            />

            <Text style={styles.label}>Transit Notes</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, height: 60 }]}
              placeholder="Traffic blocks, rest stops, arrival estimates..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              value={moveNotes}
              onChangeText={setMoveNotes}
            />

            <Text style={styles.label}>Media Attachment (Optional)</Text>
            {movePhoto || moveVideo ? (
              <View style={styles.imagePreviewWrap}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} style={styles.successIcon} />
                <Text style={{ color: colors.foreground, fontSize: 13 }}>
                  {movePhoto ? "Photo Attached" : "Video Attached"}
                </Text>
                <TouchableOpacity onPress={() => { setMovePhoto(null); setMoveVideo(null); }}>
                  <Text style={{ color: colors.error, fontWeight: "bold", marginLeft: 10 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadBox, { borderColor: colors.border }]}
                onPress={() => handleSelectMedia("both", (uri, isVid) => {
                  if (isVid) setMoveVideo(uri);
                  else setMovePhoto(uri);
                })}
              >
                <Ionicons name="attach" size={30} color={colors.mutedForeground} />
                <Text style={[styles.uploadLabel, { color: colors.mutedForeground }]}>Select Photo or Video</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={submitMovement}>
              <Text style={styles.submitButtonText}>Submit Movement Update</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab 6: Sightseeing Group Photo */}
        {activeTab === "photos" && (
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Group Sightseeing Photos</Text>

            <Text style={styles.label}>Day Number</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. 1"
              keyboardType="number-pad"
              placeholderTextColor={colors.mutedForeground}
              value={photoDay}
              onChangeText={setPhotoDay}
            />

            <Text style={styles.label}>Sightseeing Location Name</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. Rohtang Pass Viewpoint"
              placeholderTextColor={colors.mutedForeground}
              value={photoLoc}
              onChangeText={setPhotoLoc}
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, height: 60 }]}
              placeholder="Weather description, guests feedback..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              value={photoNotes}
              onChangeText={setPhotoNotes}
            />

            <Text style={styles.label}>Group Photo (Mandatory)</Text>
            {groupPhoto ? (
              <View style={styles.imagePreviewWrap}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} style={styles.successIcon} />
                <Text style={{ color: colors.foreground, fontSize: 13 }}>Photo Attached</Text>
                <TouchableOpacity onPress={() => setGroupPhoto(null)}>
                  <Text style={{ color: colors.error, fontWeight: "bold", marginLeft: 10 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadBox, { borderColor: colors.border }]}
                onPress={() => handleSelectMedia("photo", (uri) => setGroupPhoto(uri))}
              >
                <Ionicons name="camera" size={30} color={colors.mutedForeground} />
                <Text style={[styles.uploadLabel, { color: colors.mutedForeground }]}>Capture Group Photo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={submitGroupPhoto}>
              <Text style={styles.submitButtonText}>Submit Group Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 15 },
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  syncText: { flex: 1, fontSize: 12, fontWeight: "600" },
  syncBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  syncBtnText: { color: "#0F172A", fontSize: 11, fontWeight: "bold" },
  tabsContainer: { flexDirection: "row", marginBottom: 15 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#2D3748",
    marginRight: 8,
  },
  tabText: { fontSize: 11.5, fontWeight: "bold" },
  contentContainer: { marginBottom: 20 },
  statsCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 15 },
  cardTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statCol: { alignItems: "center" },
  statVal: { fontSize: 16, fontWeight: "bold" },
  statLabel: { fontSize: 10, color: "#718096", marginTop: 2 },
  subSectionTitle: { fontSize: 10, fontWeight: "bold", letterSpacing: 1 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  infoLabel: { fontSize: 12 },
  infoVal: { fontSize: 12 },
  travelerCard: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10 },
  travelerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  travelerName: { fontSize: 13.5, fontWeight: "bold" },
  travelerPhone: { fontSize: 11.5 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  attendanceButtons: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  attBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: "transparent" },
  attBtnText: { fontSize: 11, fontWeight: "600" },
  formCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  label: { fontSize: 11, fontWeight: "bold", color: "#A0AEC0", marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 8,
  },
  pickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 6 },
  pickerChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  pickerChipText: { fontSize: 11, fontWeight: "600" },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  uploadLabel: { fontSize: 12, marginTop: 6 },
  imagePreviewWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(72, 187, 120, 0.08)",
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
  },
  successIcon: { marginRight: 8 },
  submitButton: { borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 15 },
  submitButtonText: { color: "#0F172A", fontWeight: "bold", fontSize: 13 },
  dualButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 15, gap: 10 },
  halfBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  btnTextWhite: { color: "white", fontWeight: "bold", fontSize: 13 },
  ratingRow: { flexDirection: "row", gap: 12, marginVertical: 8 },
  helpText: { fontSize: 10.5, color: "#718096", marginBottom: 8 },
});
