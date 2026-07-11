export * from "./generated/api";

// Re-export non-conflicting types
export type {
  HealthStatus,
  LoginRequest,
  LoginRequestRole,
  Trip,
  TripStatus,
  User,
  UserRole,
  Attendance,
  AttendanceStatus,
} from "./generated/types";

// Re-export conflicting types explicitly so TS merges them with Zod values
import type { CheckInBody as CheckInBodyType, CheckOutBody as CheckOutBodyType } from "./generated/types";
export type { CheckInBodyType as CheckInBody, CheckOutBodyType as CheckOutBody };
