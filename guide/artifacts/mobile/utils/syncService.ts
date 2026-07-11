import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/constants/config";
import { getOfflineQueue, removeOfflineItem, OfflineAttendanceItem } from "./offlineQueue";
import { triggerUnauthorized } from "@workspace/api-client-react";

async function getStoredUserId(): Promise<string | null> {
  const stored = await AsyncStorage.getItem("@yc_auth_v2");
  if (stored) {
    const parsed = JSON.parse(stored);
    return parsed.userId ? parsed.userId.toString() : null;
  }
  return null;
}

export async function syncOfflineQueue(
  onProgress?: (item: OfflineAttendanceItem, error?: string) => void
): Promise<void> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return;

  const userId = await getStoredUserId();
  if (!userId) return;

  for (const item of queue) {
    const formData = new FormData();
    formData.append("latitude", item.latitude.toString());
    formData.append("longitude", item.longitude.toString());
    formData.append("locationName", item.locationName);
    
    // Selfie preparation
    let fileToUpload: any;
    if (Platform.OS === "web") {
      try {
        const response = await fetch(item.selfieUri);
        const blob = await response.blob();
        fileToUpload = new File([blob], "selfie.jpg", { type: "image/jpeg" }) as any;
      } catch (e) {
        console.error("Failed to read selfie blob for web", e);
        if (onProgress) onProgress(item, "Failed to read local selfie file.");
        continue;
      }
    } else {
      const filename = item.selfieUri.split("/").pop() || "selfie.jpg";
      const fileType = filename.split(".").pop();
      const mimeType = fileType === "png" ? "image/png" : "image/jpeg";
      fileToUpload = {
        uri: item.selfieUri,
        name: filename,
        type: mimeType,
      } as any;
    }
    formData.append("selfie", fileToUpload);

    const url = `${API_BASE_URL}/api/attendance/${item.type === "check-in" ? "check-in" : "check-out"}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${userId}`,
        },
        body: formData,
      });

      if (res.ok) {
        await removeOfflineItem(item.id);
        if (onProgress) onProgress(item);
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error || `Server responded with ${res.status}`;
        
        // If it's a client/validation error (e.g. 400 Bad Request, duplicate submission), 
        // we discard the item so it doesn't block the queue indefinitely.
        if (res.status === 400) {
          await removeOfflineItem(item.id);
        }
        if (res.status === 401) {
          triggerUnauthorized();
        }
        if (onProgress) onProgress(item, errMsg);
      }
    } catch (e) {
      console.error("Sync failed for item", item.id, e);
      if (onProgress) onProgress(item, (e as Error).message || "Network connection failed");
      // Stop queue execution on connection loss
      break;
    }
  }
}
