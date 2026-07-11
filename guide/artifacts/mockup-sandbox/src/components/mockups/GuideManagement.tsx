import { useState, useEffect, useCallback } from "react";
import {
  Users,
  ClipboardList,
  CalendarCheck,
  ShieldCheck,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Clock,
  Camera,
  Search,
  RefreshCw,
  ChevronDown,
  X,
  Mountain,
  Download,
  Calendar,
} from "lucide-react";

// ─── Configuration ──────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";
let ADMIN_TOKEN = ""; // Will be set after login

async function adminLogin(): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "9999999999", role: "admin" }),
  });
  if (!res.ok) throw new Error("Admin login failed");
  const data = await res.json();
  ADMIN_TOKEN = String(data.id);
  return ADMIN_TOKEN;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  if (!ADMIN_TOKEN) await adminLogin();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API Error ${res.status}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function getPhotoUrl(url: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/uploads/")) {
    return `http://localhost:5000${url}`;
  }
  return url;
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface Guide {
  id: number;
  name: string;
  phone: string;
  role: string;
  dailyRate: number;
  emergencyContact?: string | null;
  isActive?: string;
  createdAt: string;
}

interface Trip {
  id: number;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  leadGuideId: number;
  leadGuideName?: string;
  status: string;
}

interface Assignment {
  id: number;
  guideId: number;
  guideName: string;
  tripId: number;
  tripName: string;
  departureDate: string;
  role: string;
  perDayAmount: number;
  allowedLatitude?: number | null;
  allowedLongitude?: number | null;
  allowedRadius: number;
  createdAt: string;
}

interface AttendanceLog {
  id: number;
  guideName: string;
  tripName: string;
  date: string;
  checkInTime: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkInLocationName: string | null;
  checkInSelfieUrl: string | null;
  checkInDistance: number | null;
  checkOutTime: string | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  checkOutLocationName: string | null;
  checkOutSelfieUrl: string | null;
  checkOutDistance: number | null;
  notes: string | null;
  status: string;
}

interface PayrollEntry {
  guideId: number;
  guideName: string;
  tripName: string | null;
  totalTripDays: number;
  approvedDays: number;
  rejectedDays: number;
  pendingDays: number;
  incompleteDays: number;
  locationMismatchDays: number;
  payableAmount: number;
  submittedReportsCount: number;
  missingReportsCount: number;
}

// ─── Utility Components ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    rejected:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
    pending:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
    location_mismatch:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
    incomplete:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700",
    active:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    inactive:
      "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
    completed:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
    cancelled:
      "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || styles.pending}`}
    >
      {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

function FlagBadge({
  label,
  variant = "warning",
}: {
  label: string;
  variant?: "warning" | "error" | "info";
}) {
  const colors = {
    warning:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    error: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
    info: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${colors[variant]}`}
    >
      <AlertTriangle className="w-3 h-3" />
      {label}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        {description}
      </p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700" />
        <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
      </div>
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative ${maxWidth} w-full mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all";
const selectClass = inputClass;
const btnPrimary =
  "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed";
const btnSecondary =
  "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/40";
const btnDanger =
  "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/40";
const btnSuccess =
  "inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all";
const btnReject =
  "inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all";

// ═══════════════════════════════════════════════════════════════════════════
// GUIDE TAB
// ═══════════════════════════════════════════════════════════════════════════
function GuidesTab() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    dailyRate: "1500",
    emergencyContact: "",
    isActive: "active",
  });

  const fetchGuides = useCallback(async () => {
    setLoading(true);
    try {
      // Use existing admin/guides endpoint, then also fetch full user list for CRUD
      const data = await apiFetch("/admin/guides");
      setGuides(data);
    } catch (err) {
      console.error("Failed to fetch guides:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  const openCreate = () => {
    setEditingGuide(null);
    setForm({
      name: "",
      phone: "",
      dailyRate: "1500",
      emergencyContact: "",
      isActive: "active",
    });
    setShowModal(true);
  };

  const openEdit = (guide: Guide) => {
    setEditingGuide(guide);
    setForm({
      name: guide.name,
      phone: guide.phone,
      dailyRate: String(guide.dailyRate ?? 1500),
      emergencyContact: guide.emergencyContact || "",
      isActive: guide.isActive || "active",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editingGuide) {
        await apiFetch(`/admin/guides/${editingGuide.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            dailyRate: parseInt(form.dailyRate),
            emergencyContact: form.emergencyContact || null,
            isActive: form.isActive,
          }),
        });
      } else {
        await apiFetch("/admin/guides", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            dailyRate: parseInt(form.dailyRate),
            emergencyContact: form.emergencyContact || null,
            isActive: form.isActive,
          }),
        });
      }
      setShowModal(false);
      fetchGuides();
    } catch (err) {
      alert("Failed to save guide: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const filteredGuides = guides.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.phone.includes(searchTerm),
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Guides
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage all registered guides
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search guides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClass} pl-9 sm:w-64`}
            />
          </div>
          <button onClick={openCreate} className={btnPrimary}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Guide</span>
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredGuides.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No guides found"
          description="Add a new guide or adjust your search filters."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Guide
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Phone
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Active Trip
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Today
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Days Logged
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Flags
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredGuides.map((g: any) => (
                  <tr
                    key={g.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                          {g.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {g.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            ₹{g.dailyRate ?? "—"}/day
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs">
                      {g.phone}
                    </td>
                    <td className="px-4 py-3">
                      {g.activeTripName ? (
                        <span className="text-slate-700 dark:text-slate-300">
                          {g.activeTripName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={g.todayStatus} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-semibold">
                      {g.daysLogged}
                    </td>
                    <td className="px-4 py-3">
                      {g.flagged ? (
                        <FlagBadge label="Flagged" variant="error" />
                      ) : (
                        <span className="text-xs text-slate-400">Clear</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(g)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Edit guide"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingGuide ? "Edit Guide" : "Add New Guide"}
      >
        <div className="space-y-4">
          <FormField label="Full Name" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
            />
          </FormField>
          <FormField label="Phone Number" required>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="e.g. 9876543210"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Daily Rate (₹)" required>
              <input
                className={inputClass}
                type="number"
                value={form.dailyRate}
                onChange={(e) =>
                  setForm({ ...form, dailyRate: e.target.value })
                }
              />
            </FormField>
            <FormField label="Status">
              <select
                className={selectClass}
                value={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
          </div>
          <FormField label="Emergency Contact">
            <input
              className={inputClass}
              value={form.emergencyContact}
              onChange={(e) =>
                setForm({ ...form, emergencyContact: e.target.value })
              }
              placeholder="Phone or name + phone"
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setShowModal(false)} className={btnSecondary}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving} className={btnPrimary}>
              {saving ? "Saving..." : editingGuide ? "Update Guide" : "Add Guide"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ASSIGNMENTS TAB
// ═══════════════════════════════════════════════════════════════════════════
function AssignmentsTab() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    guideId: "",
    tripId: "",
    departureDate: "",
    role: "guide",
    perDayAmount: "1500",
    allowedLatitude: "",
    allowedLongitude: "",
    allowedRadius: "3000",
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [assignData, guideData, tripData] = await Promise.all([
        apiFetch("/admin/assignments"),
        apiFetch("/admin/guides"),
        apiFetch("/admin/trips"),
      ]);
      setAssignments(assignData || []);
      setGuides(guideData || []);
      setTrips(tripData || []);
    } catch (err) {
      console.error("Failed to fetch assignments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openCreate = () => {
    setEditingAssignment(null);
    setForm({
      guideId: "",
      tripId: "",
      departureDate: new Date().toISOString().split("T")[0],
      role: "guide",
      perDayAmount: "1500",
      allowedLatitude: "",
      allowedLongitude: "",
      allowedRadius: "3000",
    });
    setShowModal(true);
  };

  const openEdit = (a: Assignment) => {
    setEditingAssignment(a);
    setForm({
      guideId: String(a.guideId),
      tripId: String(a.tripId),
      departureDate: a.departureDate?.split("T")[0] || "",
      role: a.role,
      perDayAmount: String(a.perDayAmount),
      allowedLatitude: a.allowedLatitude != null ? String(a.allowedLatitude) : "",
      allowedLongitude: a.allowedLongitude != null ? String(a.allowedLongitude) : "",
      allowedRadius: String(a.allowedRadius),
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const body = {
        guideId: parseInt(form.guideId),
        tripId: parseInt(form.tripId),
        departureDate: form.departureDate,
        role: form.role,
        perDayAmount: parseInt(form.perDayAmount),
        allowedLatitude: form.allowedLatitude
          ? parseFloat(form.allowedLatitude)
          : null,
        allowedLongitude: form.allowedLongitude
          ? parseFloat(form.allowedLongitude)
          : null,
        allowedRadius: parseInt(form.allowedRadius),
      };
      if (editingAssignment) {
        await apiFetch(`/admin/assignments/${editingAssignment.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/admin/assignments", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      alert("Failed to save assignment: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await apiFetch(`/admin/assignments/${id}`, { method: "DELETE" });
      fetchAll();
    } catch (err) {
      alert("Failed to delete: " + (err as Error).message);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Assignments
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Assign guides to trips with roles and GPS boundaries
          </p>
        </div>
        <button onClick={openCreate} className={btnPrimary}>
          <Plus className="w-4 h-4" />
          New Assignment
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="Assign guides to upcoming trips to get started."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Guide
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Trip
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Departure
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    ₹/Day
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    GPS Fence
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assignments.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {a.guideName}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {a.tripName}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs">
                      {a.departureDate?.split("T")[0]}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.role} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                      ₹{a.perDayAmount}
                    </td>
                    <td className="px-4 py-3">
                      {a.allowedLatitude != null ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" />
                          {a.allowedLatitude.toFixed(2)},{" "}
                          {a.allowedLongitude?.toFixed(2)} ({a.allowedRadius}m)
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(a)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={
          editingAssignment ? "Edit Assignment" : "Create New Assignment"
        }
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Guide" required>
              <select
                className={selectClass}
                value={form.guideId}
                onChange={(e) =>
                  setForm({ ...form, guideId: e.target.value })
                }
              >
                <option value="">Select guide...</option>
                {guides.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Trip" required>
              <select
                className={selectClass}
                value={form.tripId}
                onChange={(e) =>
                  setForm({ ...form, tripId: e.target.value })
                }
              >
                <option value="">Select trip...</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Departure Date" required>
              <input
                className={inputClass}
                type="date"
                value={form.departureDate}
                onChange={(e) =>
                  setForm({ ...form, departureDate: e.target.value })
                }
              />
            </FormField>
            <FormField label="Role" required>
              <select
                className={selectClass}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="guide">Guide</option>
                <option value="coordinator">Coordinator</option>
                <option value="captain">Captain</option>
              </select>
            </FormField>
            <FormField label="Per Day (₹)" required>
              <input
                className={inputClass}
                type="number"
                value={form.perDayAmount}
                onChange={(e) =>
                  setForm({ ...form, perDayAmount: e.target.value })
                }
              />
            </FormField>
          </div>

          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              GPS Geofence (Optional)
            </p>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Latitude">
                <input
                  className={inputClass}
                  type="number"
                  step="0.0001"
                  value={form.allowedLatitude}
                  onChange={(e) =>
                    setForm({ ...form, allowedLatitude: e.target.value })
                  }
                  placeholder="e.g. 32.2396"
                />
              </FormField>
              <FormField label="Longitude">
                <input
                  className={inputClass}
                  type="number"
                  step="0.0001"
                  value={form.allowedLongitude}
                  onChange={(e) =>
                    setForm({ ...form, allowedLongitude: e.target.value })
                  }
                  placeholder="e.g. 77.1887"
                />
              </FormField>
              <FormField label="Radius (m)">
                <input
                  className={inputClass}
                  type="number"
                  value={form.allowedRadius}
                  onChange={(e) =>
                    setForm({ ...form, allowedRadius: e.target.value })
                  }
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setShowModal(false)} className={btnSecondary}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving} className={btnPrimary}>
              {saving
                ? "Saving..."
                : editingAssignment
                  ? "Update Assignment"
                  : "Create Assignment"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ATTENDANCE LOGS TAB
// ═══════════════════════════════════════════════════════════════════════════
function AttendanceLogsTab({
  setPreviewPhotoUrl,
}: {
  setPreviewPhotoUrl: (url: string | null) => void;
}) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/admin/attendance-logs");
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch attendance logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatTime = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredLogs = logs.filter((l) => {
    const matchSearch =
      l.guideName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.tripName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Attendance Logs
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            All check-in and check-out records from mobile app
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search guide or trip..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClass} pl-9 sm:w-56`}
            />
          </div>
          <select
            className={`${selectClass} w-40`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="location_mismatch">Mismatch</option>
            <option value="incomplete">Incomplete</option>
          </select>
          <button onClick={fetchLogs} className={btnSecondary} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No attendance logs"
          description="Attendance records will appear here once guides check in."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Guide
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Trip
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Check-In
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Check-Out
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Distance
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Flags
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => {
                  const flags: string[] = [];
                  if (log.status === "location_mismatch")
                    flags.push("GPS Mismatch");
                  if (log.status === "incomplete") flags.push("Incomplete");
                  if (log.checkInTime && !log.checkOutTime)
                    flags.push("No Checkout");
                  if (
                    log.checkInTime &&
                    !log.checkInSelfieUrl
                  )
                    flags.push("No CI Selfie");
                  if (
                    log.checkOutTime &&
                    !log.checkOutSelfieUrl
                  )
                    flags.push("No CO Selfie");

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {log.guideName}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {log.tripName}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {log.date}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-mono">
                              {formatTime(log.checkInTime)}
                            </span>
                          </div>
                          {log.checkInTime && (
                            log.checkInSelfieUrl ? (
                              <img
                                src={getPhotoUrl(log.checkInSelfieUrl)}
                                alt="Check-in Selfie"
                                className="w-10 h-10 rounded-lg object-cover cursor-pointer border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
                                onClick={() => setPreviewPhotoUrl(getPhotoUrl(log.checkInSelfieUrl))}
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Photo not available</span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-xs font-mono">
                              {formatTime(log.checkOutTime)}
                            </span>
                          </div>
                          {log.checkOutTime && (
                            log.checkOutSelfieUrl ? (
                              <img
                                src={getPhotoUrl(log.checkOutSelfieUrl)}
                                alt="Check-out Selfie"
                                className="w-10 h-10 rounded-lg object-cover cursor-pointer border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
                                onClick={() => setPreviewPhotoUrl(getPhotoUrl(log.checkOutSelfieUrl))}
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Photo not available</span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {log.checkInDistance != null && (
                            <div className="text-xs text-slate-500">
                              CI: {log.checkInDistance}m
                            </div>
                          )}
                          {log.checkOutDistance != null && (
                            <div className="text-xs text-slate-500">
                              CO: {log.checkOutDistance}m
                            </div>
                          )}
                          {log.checkInDistance == null &&
                            log.checkOutDistance == null && (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {flags.length > 0 ? (
                            flags.map((f) => (
                              <FlagBadge
                                key={f}
                                label={f}
                                variant={
                                  f.includes("Mismatch") ? "error" : "warning"
                                }
                              />
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Attendance Detail"
        maxWidth="max-w-2xl"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Guide</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedLog.guideName}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Trip</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedLog.tripName}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Date</p>
                <p className="font-mono text-sm">{selectedLog.date}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <StatusBadge status={selectedLog.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Check-in section */}
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Check-In
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time</span>
                    <span className="font-mono">
                      {formatTime(selectedLog.checkInTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location</span>
                    <span>{selectedLog.checkInLocationName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS</span>
                    <span className="font-mono text-xs">
                      {selectedLog.checkInLatitude?.toFixed(4)},{" "}
                      {selectedLog.checkInLongitude?.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distance</span>
                    <span className="font-semibold">
                      {selectedLog.checkInDistance != null
                        ? `${selectedLog.checkInDistance}m`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Selfie</span>
                    {selectedLog.checkInSelfieUrl ? (
                      <img
                        src={getPhotoUrl(selectedLog.checkInSelfieUrl)}
                        alt="Check-in Selfie"
                        className="w-24 h-24 rounded-lg object-cover cursor-pointer border border-slate-200 dark:border-slate-700 hover:opacity-85 transition-opacity"
                        onClick={() => setPreviewPhotoUrl(getPhotoUrl(selectedLog.checkInSelfieUrl))}
                      />
                    ) : (
                      <span className="text-slate-400 text-xs italic">Photo not available</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Check-out section */}
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Check-Out
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time</span>
                    <span className="font-mono">
                      {formatTime(selectedLog.checkOutTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location</span>
                    <span>{selectedLog.checkOutLocationName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS</span>
                    <span className="font-mono text-xs">
                      {selectedLog.checkOutLatitude?.toFixed(4)},{" "}
                      {selectedLog.checkOutLongitude?.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distance</span>
                    <span className="font-semibold">
                      {selectedLog.checkOutDistance != null
                        ? `${selectedLog.checkOutDistance}m`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Selfie</span>
                    {selectedLog.checkOutSelfieUrl ? (
                      <img
                        src={getPhotoUrl(selectedLog.checkOutSelfieUrl)}
                        alt="Check-out Selfie"
                        className="w-24 h-24 rounded-lg object-cover cursor-pointer border border-slate-200 dark:border-slate-700 hover:opacity-85 transition-opacity"
                        onClick={() => setPreviewPhotoUrl(getPhotoUrl(selectedLog.checkOutSelfieUrl))}
                      />
                    ) : (
                      <span className="text-slate-400 text-xs italic">Photo not available</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {selectedLog.notes && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300">
                  {selectedLog.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION TAB
// ═══════════════════════════════════════════════════════════════════════════
function VerificationTab({
  setPreviewPhotoUrl,
}: {
  setPreviewPhotoUrl: (url: string | null) => void;
}) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<number | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/admin/attendance-logs");
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleVerify = async (id: number, status: "approved" | "rejected") => {
    setVerifying(id);
    try {
      await apiFetch("/admin/verify-attendance", {
        method: "POST",
        body: JSON.stringify({ attendanceId: id, status }),
      });
      fetchLogs();
    } catch (err) {
      alert("Verification failed: " + (err as Error).message);
    } finally {
      setVerifying(null);
    }
  };

  // Show pending, incomplete, location_mismatch logs first (actionable)
  const actionable = logs.filter((l) =>
    ["pending", "incomplete", "location_mismatch"].includes(l.status),
  );
  const resolved = logs.filter((l) =>
    ["approved", "rejected"].includes(l.status),
  );

  const getFlags = (log: AttendanceLog): string[] => {
    const flags: string[] = [];
    if (log.status === "location_mismatch") flags.push("Location Mismatch");
    if (log.status === "incomplete") flags.push("Incomplete Day");
    if (log.checkInTime && !log.checkOutTime) flags.push("Missing Checkout");
    if (log.checkInTime && !log.checkInSelfieUrl)
      flags.push("Missing CI Selfie");
    if (log.checkOutTime && !log.checkOutSelfieUrl)
      flags.push("Missing CO Selfie");
    return flags;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Verification
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Review and approve/reject attendance records
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
            {logs.filter((l) => l.status === "pending").length}
          </p>
          <p className="text-xs text-amber-600/70 mt-1">Pending Review</p>
        </div>
        <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
            {logs.filter((l) => l.status === "location_mismatch").length}
          </p>
          <p className="text-xs text-orange-600/70 mt-1">GPS Mismatch</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
            {logs.filter((l) => l.status === "incomplete").length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Incomplete</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {logs.filter((l) => l.status === "approved").length}
          </p>
          <p className="text-xs text-emerald-600/70 mt-1">Approved</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : actionable.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
            All caught up!
          </h3>
          <p className="text-sm text-slate-500">
            No pending verifications. {resolved.length} records already
            processed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {actionable.map((log) => {
            const flags = getFlags(log);
            return (
              <div
                key={log.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                        {log.guideName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {log.guideName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {log.tripName} · {log.date}
                        </p>
                      </div>
                      <StatusBadge status={log.status} />
                    </div>

                    {/* Flags */}
                    {flags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {flags.map((f) => (
                          <FlagBadge
                            key={f}
                            label={f}
                            variant={
                              f.includes("Mismatch") ||
                              f.includes("Missing")
                                ? "error"
                                : "warning"
                            }
                          />
                        ))}
                      </div>
                    )}

                    {/* Inline details */}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        In:{" "}
                        {log.checkInTime
                          ? new Date(log.checkInTime).toLocaleTimeString(
                              "en-IN",
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" />
                        Out:{" "}
                        {log.checkOutTime
                          ? new Date(log.checkOutTime).toLocaleTimeString(
                              "en-IN",
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : "—"}
                      </span>
                      {log.checkInDistance != null && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          CI: {log.checkInDistance}m
                        </span>
                      )}
                      {log.checkOutDistance != null && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          CO: {log.checkOutDistance}m
                        </span>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <Camera className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold">Selfies:</span>
                        </span>
                        {log.checkInTime && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">CI:</span>
                            {log.checkInSelfieUrl ? (
                              <img
                                src={getPhotoUrl(log.checkInSelfieUrl)}
                                alt="Check-in Selfie"
                                className="w-8 h-8 rounded-lg object-cover cursor-pointer border border-slate-200 dark:border-slate-700 hover:opacity-85 transition-opacity"
                                onClick={() => setPreviewPhotoUrl(getPhotoUrl(log.checkInSelfieUrl))}
                              />
                            ) : (
                              <span className="text-[10px] text-red-400 italic">Photo not available</span>
                            )}
                          </div>
                        )}
                        {log.checkOutTime && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">CO:</span>
                            {log.checkOutSelfieUrl ? (
                              <img
                                src={getPhotoUrl(log.checkOutSelfieUrl)}
                                alt="Check-out Selfie"
                                className="w-8 h-8 rounded-lg object-cover cursor-pointer border border-slate-200 dark:border-slate-700 hover:opacity-85 transition-opacity"
                                onClick={() => setPreviewPhotoUrl(getPhotoUrl(log.checkOutSelfieUrl))}
                              />
                            ) : (
                              <span className="text-[10px] text-red-400 italic">Photo not available</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleVerify(log.id, "approved")}
                      disabled={verifying === log.id}
                      className={btnSuccess}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerify(log.id, "rejected")}
                      disabled={verifying === log.id}
                      className={btnReject}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  guideName?: string;
  tripName?: string;
}

interface GuideDayReport {
  id: number;
  workDayId: number;
  assignmentId: number;
  guideId: number;
  tripId: number;
  attendanceId?: number | null;
  reportText: string;
  uploadedPhotoUrls: string[];
  completedTasks: string[];
  guideNotes?: string | null;
  submittedAt: string;
  adminStatus: string;
  adminRemarks?: string | null;
  guideName?: string;
  tripName?: string;
  dayNumber?: number;
  journeyTitle?: string;
}

function DayWiseWorkTab({
  setPreviewPhotoUrl,
}: {
  setPreviewPhotoUrl: (url: string | null) => void;
}) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [workDays, setWorkDays] = useState<GuideWorkDay[]>([]);
  const [reports, setReports] = useState<GuideDayReport[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingWorkDay, setEditingWorkDay] = useState<GuideWorkDay | null>(null);

  const [form, setForm] = useState({
    dayNumber: "1",
    date: new Date().toISOString().split("T")[0],
    location: "",
    journeyTitle: "",
    dutyInstructions: "",
    reportingRequirement: "",
    expectedCheckinLatitude: "",
    expectedCheckinLongitude: "",
    expectedCheckoutLatitude: "",
    expectedCheckoutLongitude: "",
    requiredPhotosCount: "1",
  });

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingReport, setVerifyingReport] = useState<GuideDayReport | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<"approved" | "rejected">("approved");
  const [verifyRemarks, setVerifyRemarks] = useState("");
  const [verifying, setVerifying] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [assignData, workDaysData, reportsData] = await Promise.all([
        apiFetch("/admin/assignments"),
        apiFetch("/admin/guide-work-days"),
        apiFetch("/admin/guide-day-reports"),
      ]);
      setAssignments(assignData || []);
      setWorkDays(workDaysData || []);
      setReports(reportsData || []);
    } catch (err) {
      console.error("Failed to fetch day-wise work data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId);

  const filteredWorkDays = workDays.filter(
    (w) => w.assignmentId === selectedAssignmentId
  );

  const filteredReports = reports.filter(
    (r) => r.assignmentId === selectedAssignmentId
  );

  const openCreate = () => {
    if (!selectedAssignmentId) {
      alert("Please select an assignment first.");
      return;
    }
    setEditingWorkDay(null);
    setForm({
      dayNumber: String(filteredWorkDays.length + 1),
      date: new Date().toISOString().split("T")[0],
      location: "",
      journeyTitle: "",
      dutyInstructions: "",
      reportingRequirement: "",
      expectedCheckinLatitude: "",
      expectedCheckinLongitude: "",
      expectedCheckoutLatitude: "",
      expectedCheckoutLongitude: "",
      requiredPhotosCount: "1",
    });
    setShowModal(true);
  };

  const openEdit = (wd: GuideWorkDay) => {
    setEditingWorkDay(wd);
    setForm({
      dayNumber: String(wd.dayNumber),
      date: wd.date?.split("T")[0] || "",
      location: wd.location,
      journeyTitle: wd.journeyTitle,
      dutyInstructions: wd.dutyInstructions,
      reportingRequirement: wd.reportingRequirement || "",
      expectedCheckinLatitude: wd.expectedCheckinLatitude != null ? String(wd.expectedCheckinLatitude) : "",
      expectedCheckinLongitude: wd.expectedCheckinLongitude != null ? String(wd.expectedCheckinLongitude) : "",
      expectedCheckoutLatitude: wd.expectedCheckoutLatitude != null ? String(wd.expectedCheckoutLatitude) : "",
      expectedCheckoutLongitude: wd.expectedCheckoutLongitude != null ? String(wd.expectedCheckoutLongitude) : "",
      requiredPhotosCount: String(wd.requiredPhotosCount),
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;
    setSaving(true);
    try {
      const body = {
        assignmentId: selectedAssignment.id,
        tripId: selectedAssignment.tripId,
        guideId: selectedAssignment.guideId,
        dayNumber: parseInt(form.dayNumber),
        date: form.date,
        location: form.location,
        journeyTitle: form.journeyTitle,
        dutyInstructions: form.dutyInstructions,
        reportingRequirement: form.reportingRequirement || null,
        expectedCheckinLatitude: form.expectedCheckinLatitude ? parseFloat(form.expectedCheckinLatitude) : null,
        expectedCheckinLongitude: form.expectedCheckinLongitude ? parseFloat(form.expectedCheckinLongitude) : null,
        expectedCheckoutLatitude: form.expectedCheckoutLatitude ? parseFloat(form.expectedCheckoutLatitude) : null,
        expectedCheckoutLongitude: form.expectedCheckoutLongitude ? parseFloat(form.expectedCheckoutLongitude) : null,
        requiredPhotosCount: parseInt(form.requiredPhotosCount),
      };

      if (editingWorkDay) {
        await apiFetch(`/admin/guide-work-days/${editingWorkDay.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/admin/guide-work-days", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      alert("Failed to save workday plan: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this workday plan? This will also delete any associated guide reports.")) return;
    try {
      await apiFetch(`/admin/guide-work-days/${id}`, { method: "DELETE" });
      fetchAll();
    } catch (err) {
      alert("Failed to delete workday plan: " + (err as Error).message);
    }
  };

  const openVerify = (report: GuideDayReport, status: "approved" | "rejected") => {
    setVerifyingReport(report);
    setVerifyStatus(status);
    setVerifyRemarks("");
    setShowVerifyModal(true);
  };

  const handleVerify = async () => {
    if (!verifyingReport) return;
    setVerifying(true);
    try {
      await apiFetch(`/admin/guide-day-reports/${verifyingReport.id}/verify`, {
        method: "POST",
        body: JSON.stringify({
          status: verifyStatus,
          remarks: verifyRemarks,
        }),
      });
      setShowVerifyModal(false);
      fetchAll();
    } catch (err) {
      alert("Failed to verify day report: " + (err as Error).message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Day-wise Work Plan
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create day-by-day itineraries, locations, geofences, and review guide reports
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-6">
          {/* Assignment Selector */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 max-w-md">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Select Guide Assignment
              </label>
              <select
                className={selectClass}
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Choose an active assignment...</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.guideName} - {a.tripName} ({a.departureDate?.split("T")[0]})
                  </option>
                ))}
              </select>
            </div>
            {selectedAssignment && (
              <button onClick={openCreate} className={btnPrimary}>
                <Plus className="w-4 h-4" />
                Add Journey Day
              </button>
            )}
          </div>

          {!selectedAssignmentId ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <Calendar className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                No Assignment Selected
              </h3>
              <p className="text-sm text-slate-400 max-w-xs mt-1">
                Select an assignment from the dropdown above to manage its day-wise plans and reports.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Workday Plans */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    Journey Day Plans ({filteredWorkDays.length})
                  </h3>
                </div>

                {filteredWorkDays.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-500">No workday journey plans created yet for this trip assignment.</p>
                    <button onClick={openCreate} className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                      Create Day 1 Plan &rarr;
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredWorkDays.map((wd) => (
                      <div
                        key={wd.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold mb-1">
                              Day {wd.dayNumber} · {wd.date}
                            </span>
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">
                              {wd.journeyTitle}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {wd.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEdit(wd)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(wd.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-500 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Coords & Photos */}
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                          {wd.expectedCheckinLatitude != null && (
                            <span>
                              CI GPS: {wd.expectedCheckinLatitude}, {wd.expectedCheckinLongitude}
                            </span>
                          )}
                          {wd.expectedCheckoutLatitude != null && (
                            <span>
                              CO GPS: {wd.expectedCheckoutLatitude}, {wd.expectedCheckoutLongitude}
                            </span>
                          )}
                          <span>
                            Photos Required: {wd.requiredPhotosCount}
                          </span>
                        </div>

                        {/* Duty Instructions */}
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Duty Instructions:
                          </p>
                          <ul className="list-disc list-inside text-xs text-slate-500 space-y-0.5">
                            {wd.dutyInstructions
                              .split("\n")
                              .filter((line) => line.trim())
                              .map((line, idx) => (
                                <li key={idx}>{line.trim()}</li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Submitted Reports */}
              <div className="lg:col-span-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-500" />
                  Guide Day Reports ({filteredReports.length})
                </h3>

                {filteredReports.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-500">No reports submitted by guide yet for this trip.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredReports.map((report) => (
                      <div
                        key={report.id}
                        className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-1">
                              Day {report.dayNumber} Report
                            </span>
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">
                              {report.journeyTitle}
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              Submitted: {new Date(report.submittedAt).toLocaleString("en-IN")}
                            </p>
                          </div>
                          <StatusBadge status={report.adminStatus} />
                        </div>

                        {/* Report Text */}
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Report Status Text:</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                            {report.reportText}
                          </p>
                        </div>

                        {/* Completed Tasks Checklist */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Completed Instructions Checklist:</p>
                          <div className="grid grid-cols-1 gap-1 text-xs">
                            {report.completedTasks && report.completedTasks.length > 0 ? (
                              report.completedTasks.map((t, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-emerald-600">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>{t}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-slate-400 italic">No instructions marked completed.</p>
                            )}
                          </div>
                        </div>

                        {/* Guide Notes */}
                        {report.guideNotes && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Guide Notes:</p>
                            <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2 rounded border border-slate-100 dark:border-slate-800/50">
                              {report.guideNotes}
                            </p>
                          </div>
                        )}

                        {/* Uploaded Photos */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5 text-slate-400" />
                            Uploaded Photos:
                          </p>
                          {report.uploadedPhotoUrls && report.uploadedPhotoUrls.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {report.uploadedPhotoUrls.map((url, index) => (
                                <img
                                  key={index}
                                  src={getPhotoUrl(url)}
                                  alt={`Guide Upload ${index + 1}`}
                                  className="w-16 h-16 rounded-lg object-cover cursor-pointer border border-slate-200 dark:border-slate-850 hover:opacity-85 transition-opacity"
                                  onClick={() => setPreviewPhotoUrl(getPhotoUrl(url))}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No photos uploaded.</p>
                          )}
                        </div>

                        {/* Admin verification details */}
                        {report.adminStatus !== "pending" && report.adminRemarks && (
                          <div className="text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                            <span className="font-semibold">Admin Remarks:</span> {report.adminRemarks}
                          </div>
                        )}

                        {/* Verify Actions */}
                        {report.adminStatus === "pending" && (
                          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                            <button
                              onClick={() => openVerify(report, "approved")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve Report
                            </button>
                            <button
                              onClick={() => openVerify(report, "rejected")}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject Report
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workday Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingWorkDay ? `Edit Day ${form.dayNumber} Journey` : `Create Day ${form.dayNumber} Journey`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Day Number" required>
              <input
                className={inputClass}
                type="number"
                min="1"
                value={form.dayNumber}
                onChange={(e) => setForm({ ...form, dayNumber: e.target.value })}
              />
            </FormField>
            <FormField label="Date" required>
              <input
                className={inputClass}
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Journey Title (e.g. Manali to Solang Valley Trek)" required>
            <input
              className={inputClass}
              type="text"
              value={form.journeyTitle}
              onChange={(e) => setForm({ ...form, journeyTitle: e.target.value })}
              placeholder="Enter journey title..."
            />
          </FormField>

          <FormField label="Location / Target Destination" required>
            <input
              className={inputClass}
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Solang Valley Basecamp"
            />
          </FormField>

          <FormField label="Required Photos Count" required>
            <input
              className={inputClass}
              type="number"
              min="0"
              value={form.requiredPhotosCount}
              onChange={(e) => setForm({ ...form, requiredPhotosCount: e.target.value })}
            />
          </FormField>

          <FormField label="Duty Instructions (One instruction per line)" required>
            <textarea
              className={`${inputClass} h-24 resize-none`}
              value={form.dutyInstructions}
              onChange={(e) => setForm({ ...form, dutyInstructions: e.target.value })}
              placeholder="Check emergency gear&#10;Distribute lunch packs&#10;Verify group count at Solang base"
            />
          </FormField>

          <FormField label="Reporting Requirement (e.g. Send group selfie from summit)">
            <input
              className={inputClass}
              type="text"
              value={form.reportingRequirement}
              onChange={(e) => setForm({ ...form, reportingRequirement: e.target.value })}
              placeholder="e.g. Upload photo of campground entry"
            />
          </FormField>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Expected Location GPS Coordinates (Optional)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Expected Check-In Latitude">
                <input
                  className={inputClass}
                  type="number"
                  step="0.000001"
                  value={form.expectedCheckinLatitude}
                  onChange={(e) => setForm({ ...form, expectedCheckinLatitude: e.target.value })}
                  placeholder="e.g. 32.2396"
                />
              </FormField>
              <FormField label="Expected Check-In Longitude">
                <input
                  className={inputClass}
                  type="number"
                  step="0.000001"
                  value={form.expectedCheckinLongitude}
                  onChange={(e) => setForm({ ...form, expectedCheckinLongitude: e.target.value })}
                  placeholder="e.g. 77.1887"
                />
              </FormField>
              <FormField label="Expected Check-Out Latitude">
                <input
                  className={inputClass}
                  type="number"
                  step="0.000001"
                  value={form.expectedCheckoutLatitude}
                  onChange={(e) => setForm({ ...form, expectedCheckoutLatitude: e.target.value })}
                  placeholder="e.g. 32.2512"
                />
              </FormField>
              <FormField label="Expected Check-Out Longitude">
                <input
                  className={inputClass}
                  type="number"
                  step="0.000001"
                  value={form.expectedCheckoutLongitude}
                  onChange={(e) => setForm({ ...form, expectedCheckoutLongitude: e.target.value })}
                  placeholder="e.g. 77.1924"
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setShowModal(false)} className={btnSecondary}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving} className={btnPrimary}>
              {saving ? "Saving..." : editingWorkDay ? "Update Plan" : "Create Plan"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Verify Report Modal */}
      <Modal
        open={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        title={verifyStatus === "approved" ? "Approve Guide Day Report" : "Reject Guide Day Report"}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <FormField label="Admin Remarks / Feedback" required={verifyStatus === "rejected"}>
            <textarea
              className={`${inputClass} h-24 resize-none`}
              value={verifyRemarks}
              onChange={(e) => setVerifyRemarks(e.target.value)}
              placeholder="e.g. Approved. Group count verified. Good notes. Or reason for rejection..."
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowVerifyModal(false)} className={btnSecondary}>
              Cancel
            </button>
            <button
              onClick={handleVerify}
              disabled={verifying || (verifyStatus === "rejected" && !verifyRemarks.trim())}
              className={verifyStatus === "approved" ? btnPrimary : btnDanger}
            >
              {verifying ? "Verifying..." : verifyStatus === "approved" ? "Confirm Approval" : "Confirm Rejection"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAYROLL TAB
// ═══════════════════════════════════════════════════════════════════════════
function PayrollTab() {
  const [reports, setReports] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/admin/reports");
      setReports(data);
    } catch (err) {
      console.error("Failed to fetch payroll:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const totalPayable = reports.reduce((sum, r) => sum + r.payableAmount, 0);
  const totalApproved = reports.reduce((sum, r) => sum + r.approvedDays, 0);

  const exportCSV = () => {
    const rows = [
      ["Guide", "Trip", "Total Days", "Approved", "Rejected", "Pending", "Incomplete", "GPS Mismatch", "Payable Amount (₹)"],
      ...reports.map(r => [
        r.guideName,
        r.tripName || "—",
        r.totalTripDays,
        r.approvedDays,
        r.rejectedDays,
        r.pendingDays,
        r.incompleteDays,
        r.locationMismatchDays,
        r.payableAmount,
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Payroll
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Payment summary based on approved attendance
          </p>
        </div>
        <button onClick={exportCSV} className={btnSecondary}>
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
          <p className="text-3xl font-bold">
            ₹{totalPayable.toLocaleString("en-IN")}
          </p>
          <p className="text-sm text-indigo-100 mt-1">Total Payable</p>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
          <p className="text-3xl font-bold">{totalApproved}</p>
          <p className="text-sm text-emerald-100 mt-1">Total Approved Days</p>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
          <p className="text-3xl font-bold">{reports.length}</p>
          <p className="text-sm text-amber-100 mt-1">Active Guides</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No payroll data"
          description="Approve attendance records to generate payroll summaries."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Guide
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Trip
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Total
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                    Approved
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-red-600 dark:text-red-400">
                    Rejected
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">
                    Pending
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Incomplete
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-orange-600 dark:text-orange-400">
                    Mismatch
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Reports (Sub/Miss)
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Payable (₹)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reports.map((r) => (
                  <tr
                    key={r.guideId}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                          {r.guideName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {r.guideName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {r.tripName || "—"}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {r.totalTripDays}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                        {r.approvedDays}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-6 rounded-md bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-bold text-xs">
                        {r.rejectedDays}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-6 rounded-md bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold text-xs">
                        {r.pendingDays}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs">
                        {r.incompleteDays}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-6 rounded-md bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-bold text-xs">
                        {r.locationMismatchDays}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{r.submittedReportsCount || 0}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="font-semibold text-red-500">{r.missingReportsCount || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        ₹{r.payableAmount.toLocaleString("en-IN")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                  <td
                    colSpan={9}
                    className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300"
                  >
                    Grand Total
                  </td>
                  <td className="px-4 py-3 text-right text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    ₹{totalPayable.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GUIDE MANAGEMENT PANEL
// ═══════════════════════════════════════════════════════════════════════════
const tabs = [
  { id: "guides", label: "Guides", icon: Users },
  { id: "assignments", label: "Assignments", icon: ClipboardList },
  { id: "daywork", label: "Day-wise Work", icon: Calendar },
  { id: "attendance", label: "Attendance Logs", icon: CalendarCheck },
  { id: "verification", label: "Verification", icon: ShieldCheck },
  { id: "payroll", label: "Payroll", icon: DollarSign },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function GuideManagement() {
  const [activeTab, setActiveTab] = useState<TabId>("guides");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [serverError, setServerError] = useState(false);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch(`${API_BASE}/healthz`);
        if (res.ok) {
          setServerError(false);
        } else {
          setServerError(true);
        }
      } catch (err) {
        setServerError(true);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-[Inter,system-ui,sans-serif]">
      {/* Sidebar */}
      <aside
        className={`${sidebarCollapsed ? "w-16" : "w-64"} shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-all duration-300 ease-in-out`}
      >
        {/* Brand */}
        <div className="px-4 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Mountain className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                YouthCamping
              </h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Admin Panel
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {!sidebarCollapsed && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-2">
              Guide Management
            </p>
          )}
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`}
                title={tab.label}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`}
                />
                {!sidebarCollapsed && <span>{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar toggle */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center w-full py-2 rounded-lg text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "-rotate-90" : "rotate-90"}`}
            />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {serverError && (
            <div className="mb-6 p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-red-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
              <div>
                <p className="font-semibold text-sm">Server Connection Failed</p>
                <p className="text-xs opacity-90 mt-0.5">
                  Cannot connect to the API server at {API_BASE}. Please ensure the backend server is running.
                </p>
              </div>
            </div>
          )}
          {activeTab === "guides" && <GuidesTab />}
          {activeTab === "assignments" && <AssignmentsTab />}
          {activeTab === "daywork" && <DayWiseWorkTab setPreviewPhotoUrl={setPreviewPhotoUrl} />}
          {activeTab === "attendance" && <AttendanceLogsTab setPreviewPhotoUrl={setPreviewPhotoUrl} />}
          {activeTab === "verification" && <VerificationTab setPreviewPhotoUrl={setPreviewPhotoUrl} />}
          {activeTab === "payroll" && <PayrollTab />}
        </div>
      </main>

      {/* Photo Preview Modal */}
      <Modal
        open={!!previewPhotoUrl}
        onClose={() => setPreviewPhotoUrl(null)}
        title="Photo Preview"
        maxWidth="max-w-3xl"
      >
        {previewPhotoUrl && (
          <div className="flex flex-col items-center justify-center p-2 bg-slate-900 rounded-xl overflow-hidden">
            <img
              src={previewPhotoUrl}
              alt="Preview"
              className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
            <div className="mt-4 flex gap-3">
              <a
                href={previewPhotoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Open in new tab
              </a>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
