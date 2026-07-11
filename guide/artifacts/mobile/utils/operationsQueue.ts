import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { API_BASE_URL } from "@/constants/config";

declare var FormData: any;
declare var File: any;


export interface OfflineOperation {
  id: string;
  type: "checkin" | "hotel" | "food" | "group-photo" | "movement" | "trip-timing";
  body: any;
  timestamp: string;
}

const OPERATIONS_QUEUE_KEY = "@yc_operations_sync_queue";

async function getStoredUserId(): Promise<string | null> {
  const stored = await AsyncStorage.getItem("@yc_auth_v2");
  if (stored) {
    const parsed = JSON.parse(stored);
    return parsed.userId ? parsed.userId.toString() : null;
  }
  return null;
}

export async function getOfflineOperations(): Promise<OfflineOperation[]> {
  try {
    const data = await AsyncStorage.getItem(OPERATIONS_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to read offline operations queue", e);
    return [];
  }
}

export async function saveOfflineOperations(queue: OfflineOperation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(OPERATIONS_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to save offline operations queue", e);
  }
}

export async function addOfflineOperation(
  type: OfflineOperation["type"],
  body: any
): Promise<OfflineOperation> {
  const queue = await getOfflineOperations();
  const newItem: OfflineOperation = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    body,
    timestamp: new Date().toISOString(),
  };
  queue.push(newItem);
  await saveOfflineOperations(queue);
  return newItem;
}

export async function removeOfflineOperation(id: string): Promise<void> {
  const queue = await getOfflineOperations();
  const updated = queue.filter((item) => item.id !== id);
  await saveOfflineOperations(updated);
}

// Media upload helper for offline sync
async function uploadMediaFile(localUri: string, userId: string): Promise<string> {
  // If it's already a web/remote URL, skip upload
  if (!localUri || localUri.startsWith("http://") || localUri.startsWith("https://") || localUri.startsWith("data:")) {
    return localUri;
  }

  const formData = new FormData();
  
  if (Platform.OS === "web") {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const filename = localUri.split("/").pop() || "upload.jpg";
    const extension = filename.split(".").pop() || "jpg";
    const mimeType = [".mp4", ".webm"].includes("." + extension) ? "video/" + extension : "image/" + extension;
    formData.append("file", new File([blob], filename, { type: mimeType }) as any);
  } else {
    const filename = localUri.split("/").pop() || "upload.jpg";
    const extension = filename.split(".").pop()?.toLowerCase() || "jpg";
    const isVideo = ["mp4", "webm"].includes(extension);
    const mimeType = isVideo ? `video/${extension}` : `image/${extension}`;
    
    formData.append("file", {
      uri: localUri,
      name: filename,
      type: mimeType,
    } as any);
  }

  const url = `${API_BASE_URL}/guide/operations/upload-media`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${userId}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Media upload failed: ${errText || res.status}`);
  }

  const data = await res.json();
  if (!data.url) {
    throw new Error("No URL returned from media upload");
  }

  return data.url;
}

// Sync background processor
export async function syncPendingOperations(
  onProgress?: (item: OfflineOperation, error?: string) => void
): Promise<void> {
  const queue = await getOfflineOperations();
  if (queue.length === 0) return;

  const userId = await getStoredUserId();
  if (!userId) return;

  for (const item of queue) {
    try {
      const updatedBody = { ...item.body };

      // 1. Process and upload local media files if any
      if (item.type === "checkin" && updatedBody.photoUrl) {
        updatedBody.photoUrl = await uploadMediaFile(updatedBody.photoUrl, userId);
      } else if (item.type === "hotel" && Array.isArray(updatedBody.hotelPhotos)) {
        const uploadedPhotos = [];
        for (const photo of updatedBody.hotelPhotos) {
          uploadedPhotos.push(await uploadMediaFile(photo, userId));
        }
        updatedBody.hotelPhotos = uploadedPhotos;
      } else if (item.type === "food") {
        if (updatedBody.photoUrl) {
          updatedBody.photoUrl = await uploadMediaFile(updatedBody.photoUrl, userId);
        }
        if (updatedBody.videoUrl) {
          updatedBody.videoUrl = await uploadMediaFile(updatedBody.videoUrl, userId);
        }
      } else if (item.type === "group-photo" && updatedBody.photoUrl) {
        updatedBody.photoUrl = await uploadMediaFile(updatedBody.photoUrl, userId);
      } else if (item.type === "movement") {
        if (updatedBody.photoUrl) {
          updatedBody.photoUrl = await uploadMediaFile(updatedBody.photoUrl, userId);
        }
        if (updatedBody.videoUrl) {
          updatedBody.videoUrl = await uploadMediaFile(updatedBody.videoUrl, userId);
        }
      }

      // 2. Perform the operational endpoint POST request
      let endpoint = "";
      if (item.type === "checkin") endpoint = "/guide/operations/checkin";
      else if (item.type === "hotel") endpoint = "/guide/operations/hotel";
      else if (item.type === "food") endpoint = "/guide/operations/food";
      else if (item.type === "group-photo") endpoint = "/guide/operations/group-photo";
      else if (item.type === "movement") endpoint = "/guide/operations/movement";
      else if (item.type === "trip-timing") endpoint = "/guide/operations/trip-timing";

      const url = `${API_BASE_URL}${endpoint}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userId}`,
        },
        body: JSON.stringify(updatedBody),
      });

      if (res.ok) {
        await removeOfflineOperation(item.id);
        if (onProgress) onProgress(item);
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error || `Server responded with ${res.status}`;
        
        // If validation error, remove it so it doesn't block the queue
        if (res.status === 400) {
          await removeOfflineOperation(item.id);
        }
        if (onProgress) onProgress(item, errMsg);
      }
    } catch (e) {
      console.error(`Sync failed for operation ${item.id}`, e);
      if (onProgress) onProgress(item, (e as Error).message || "Network sync failed");
      break; // Stop syncing queue on network failure
    }
  }
}

// ─── CACHING UTILITIES ───

export async function cacheParticipantList(assignmentId: number, data: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(`@yc_participant_list_${assignmentId}`, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to cache participant list", e);
  }
}

export async function getCachedParticipantList(assignmentId: number): Promise<any[] | null> {
  try {
    const data = await AsyncStorage.getItem(`@yc_participant_list_${assignmentId}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Failed to get cached participant list", e);
    return null;
  }
}

export async function cacheTodayTasks(assignmentId: number, data: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(`@yc_today_tasks_${assignmentId}`, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to cache today tasks", e);
  }
}

export async function getCachedTodayTasks(assignmentId: number): Promise<any[] | null> {
  try {
    const data = await AsyncStorage.getItem(`@yc_today_tasks_${assignmentId}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Failed to get cached today tasks", e);
    return null;
  }
}

export async function cacheLastUpdates(assignmentId: number, data: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(`@yc_last_updates_${assignmentId}`, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to cache last updates", e);
  }
}

export async function getCachedLastUpdates(assignmentId: number): Promise<any[] | null> {
  try {
    const data = await AsyncStorage.getItem(`@yc_last_updates_${assignmentId}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Failed to get cached last updates", e);
    return null;
  }
}
