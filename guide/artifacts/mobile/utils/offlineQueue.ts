import AsyncStorage from "@react-native-async-storage/async-storage";

export interface OfflineAttendanceItem {
  id: string;
  type: "check-in" | "check-out";
  latitude: number;
  longitude: number;
  locationName: string;
  selfieUri: string; // Local device file URI
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string when offline action was captured
  tripId: number;
  guideId: number;
  notes?: string;
}

const STORAGE_KEY = "@attendance_sync_queue";

export async function getOfflineQueue(): Promise<OfflineAttendanceItem[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to read offline queue", e);
    return [];
  }
}

export async function saveOfflineQueue(queue: OfflineAttendanceItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to save offline queue", e);
  }
}

export async function addOfflineItem(item: Omit<OfflineAttendanceItem, "id" | "timestamp">): Promise<OfflineAttendanceItem> {
  const queue = await getOfflineQueue();
  const newItem: OfflineAttendanceItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  queue.push(newItem);
  await saveOfflineQueue(queue);
  return newItem;
}

export async function removeOfflineItem(id: string): Promise<void> {
  const queue = await getOfflineQueue();
  const updated = queue.filter((item) => item.id !== id);
  await saveOfflineQueue(updated);
}

export async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear offline queue", e);
  }
}
