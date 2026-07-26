import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Calendar, Users, Pencil, Trash2, Plus, ArrowLeft, Check, X, 
  ChevronRight, CreditCard, Globe, Languages, Tag, MessageSquare, 
  Clock, Send, HelpCircle, User, Phone, Mail, FileText, AlertCircle, CheckCircle2,
  ShieldCheck, MapPin, History, Train
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Booking, BookingTrip } from "@/types";
import { toast } from "sonner";
import { bookingsService } from "@/services/bookings.service";
import { paymentsService } from "@/services/payments.service";
import { tripsService } from "@/services/trips.service";
import { settingsService } from "@/services/settings.service";
import { bookingVerificationService } from "@/services/bookingVerification.service";
import { cn, safeFormatDate, safeFormatDateTime, computeGst } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import VerificationDetailsPanel from "./VerificationDetailsPanel";
import TrainTicketsPanel from "./TrainTicketsPanel";
import { trainTicketService } from "@/services/trainTicket.service";
import EmailComposerDrawer from "./EmailComposerDrawer";
import EmailLogsTimeline from "./EmailLogsTimeline";
import { erpService } from "@/services/erp.service";

interface BookingDetailsViewProps {
  booking: Booking;
  onBack: () => void;
  onRefresh: () => void;
  trips: BookingTrip[];
  defaultTab?: string;
}

export default function BookingDetailsView({ booking, onBack, onRefresh, trips, defaultTab }: BookingDetailsViewProps) {
  const { admin: currentAdmin } = useAuthStore();
  const [customerTimeline, setCustomerTimeline] = useState<any[]>([]);
  const [customerTimelineOpen, setCustomerTimelineOpen] = useState(false);

  const handleViewCustomerTimeline = async () => {
    try {
      const data = await erpService.getCustomerTimeline(booking.email);
      setCustomerTimeline(data);
      setCustomerTimelineOpen(true);
    } catch (err) {
      toast.error("Failed to load customer profile timeline");
    }
  };

  // Local states
  const [showAddPassenger, setShowAddPassenger] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<any>(null);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editedCustomerName, setEditedCustomerName] = useState(booking.fullName || booking.name || "");
  const [editedCustomerPhone, setEditedCustomerPhone] = useState(booking.mobile || booking.phone || "");
  const [editedCustomerEmail, setEditedCustomerEmail] = useState(booking.email || "");
  const [newPassenger, setNewPassenger] = useState({
    salutation: "Mr.",
    firstName: "",
    lastName: "",
    gender: "Male",
    age: "",
    phone: "",
    email: "",
    foodPreference: "Normal Food"
  });
  
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [colleagues, setColleagues] = useState<any[]>([]);
  const [loadingActivityLogs, setLoadingActivityLogs] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // For Task Creation
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);
  const [showVerificationPanel, setShowVerificationPanel] = useState(false);

  const [settings, setSettings] = useState<any>(null);
  const [paymentTab, setPaymentTab] = useState<'successful' | 'outstanding' | 'failed'>('successful');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  
  // Inline confirmation fields
  const [confirmTotal, setConfirmTotal] = useState("");
  const [confirmAdvance, setConfirmAdvance] = useState("");
  const [confirmMode, setConfirmMode] = useState("UPI");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmTrainStatus, setConfirmTrainStatus] = useState("PENDING");
  const [confirmingLoading, setConfirmingLoading] = useState(false);
  const [confirmSendTicket, setConfirmSendTicket] = useState(false);
  const [confirmTicketFile, setConfirmTicketFile] = useState<string | null>(null);
  const [confirmTicketFileName, setConfirmTicketFileName] = useState<string | null>(null);
  const [confirmTicketFilesList, setConfirmTicketFilesList] = useState<Array<{ name: string; content: string }>>([]);
  const [revertingLoading, setRevertingLoading] = useState(false);

  // Manual payment recording inline form
  const [showAddPaymentInline, setShowAddPaymentInline] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [newPaymentMode, setNewPaymentMode] = useState("UPI");
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Quick edit note/comment states
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const [editingSource, setEditingSource] = useState(false);
  const [sourceValue, setSourceValue] = useState("");
  
  const [editingLang, setEditingLang] = useState(false);
  const [langValue, setLangValue] = useState("English");

  const [editingTags, setEditingTags] = useState(false);
  const [tagsValue, setTagsValue] = useState("");

  // Change dates state
  const [showChangeDates, setShowChangeDates] = useState(false);
  const [newDepartureDate, setNewDepartureDate] = useState("");
  const [changeReason, setChangeReason] = useState("");

  // Edit Booking Items state
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editRate, setEditRate] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editDiscount, setEditDiscount] = useState("");
  const [editDiscountLabel, setEditDiscountLabel] = useState("GST Discount");

  // Create payment modal state
  const [showCreatePayment, setShowCreatePayment] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [paymentSource, setPaymentSource] = useState<'collected' | 'online' | 'venue'>('collected');
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("UPI");
  const [payComments, setPayComments] = useState("");

  // Cancellation and Refund Modal States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelCharges, setCancelCharges] = useState("0");
  const [cancelRefund, setCancelRefund] = useState("0");
  const [cancelRefundMode, setCancelRefundMode] = useState("UPI");
  const [cancelProcessing, setCancelProcessing] = useState(false);

  // Workspace tab state
  const [adminActiveTab, setAdminActiveTab] = useState(defaultTab || "overview");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskCategory, setTaskCategory] = useState("General");

  useEffect(() => {
    if (defaultTab) {
      setAdminActiveTab(defaultTab);
    }
  }, [defaultTab]);

  useEffect(() => {
    if (booking) {
      if (booking.totalAmount) setConfirmTotal(booking.totalAmount.toString());
      if (booking.advancePaid !== undefined) setConfirmAdvance(booking.advancePaid.toString());
      if (booking.paymentMode) setConfirmMode(booking.paymentMode);
      if (booking.email) setConfirmEmail(booking.email);
      if (booking.trainTicketStatus) {
        const raw = booking.trainTicketStatus.toUpperCase();
        setConfirmTrainStatus(raw === "SELF BOOKED" ? "SELF_BOOKED" : raw);
      }
    }
  }, [booking]);

  const [savingPayment, setSavingPayment] = useState(false);

  // Trips service & full details
  const [fullTrip, setFullTrip] = useState<any>(null);
  
  // Custom states matching screenshots
  const [bookingItems, setBookingItems] = useState<any[]>([]);
  const [selectedTravelOptionToAdd, setSelectedTravelOptionToAdd] = useState("");
  const [selectedRoomOptionToAdd, setSelectedRoomOptionToAdd] = useState("");
  
  const [customDescription, setCustomDescription] = useState("");
  const [customRate, setCustomRate] = useState("");
  const [customQty, setCustomQty] = useState("1");
  
  // Sidebar elements editing states
  const [editingInternalNotes, setEditingInternalNotes] = useState(false);
  const [editingTravel, setEditingTravel] = useState(false);
  const [pickupCityValue, setPickupCityValue] = useState(booking.pickupCity || "");
  const [trainClassValue, setTrainClassValue] = useState(booking.trainClass || "");
  const [internalNotesValue, setInternalNotesValue] = useState("");
  
  const [editingGuestDetails, setEditingGuestDetails] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  const getInitialDateString = (dateVal: any) => {
    if (!dateVal) return "";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "";
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return "";
    }
  };

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await paymentsService.getByBooking(booking.id);
      setPaymentsList(res.payments || []);
    } catch (e) {
      console.error("Failed to load payments", e);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchEmailLogs = async () => {
    try {
      const logs = await bookingsService.getEmailLogs(booking.id);
      setEmailLogs(logs);
    } catch (e) {
      console.error("Failed to fetch email logs", e);
    }
  };

  const fetchActivityLogs = async () => {
    setLoadingActivityLogs(true);
    try {
      const logs = await bookingsService.getActivityLogs(booking.id);
      setActivityLogs(logs || []);
    } catch (e) {
      console.error("Failed to fetch activity logs", e);
    } finally {
      setLoadingActivityLogs(false);
    }
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const t = await bookingsService.getTasks(booking.id);
      setTasks(t || []);
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchColleagues = async () => {
    try {
      const c = await bookingsService.getColleagues();
      setColleagues(c || []);
    } catch (e) {
      console.error("Failed to fetch colleagues", e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskAssignedTo) {
      toast.error("Task title and assignee are required");
      return;
    }
    setCreatingTask(true);
    try {
      await bookingsService.createTask(booking.id, {
        title: taskTitle,
        description: taskDescription,
        assignedToId: taskAssignedTo,
        dueDate: taskDueDate || undefined
      });
      toast.success("Task assigned successfully");
      setTaskTitle("");
      setTaskDescription("");
      setTaskAssignedTo("");
      setTaskDueDate("");
      setShowCreateTask(false);
      fetchTasks();
      fetchActivityLogs();
    } catch (e) {
      toast.error("Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      await bookingsService.updateTask(taskId, status);
      toast.success(`Task status updated to ${status}`);
      fetchTasks();
      fetchActivityLogs();
    } catch (e) {
      toast.error("Failed to update task status");
    }
  };

  // Math helpers matching correct GST + Discount Calculation Order
  const qty = booking.numberOfTravelers || 1;
  const gstRate = (fullTrip?.gstPercentage ?? 5) / 100;
  const packageAmt = booking.baseAmount || (booking.gstAmount ? (booking.totalAmount - booking.gstAmount) : (booking.totalAmount / (1 + gstRate)));
  const itemRate = packageAmt / qty;

  const getSafeMeta = (b: any): any => {
    if (!b || !b.sourceMeta) return {};
    let raw = b.sourceMeta;
    while (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        console.error("Failed to parse sourceMeta:", e);
        return {};
      }
    }
    return raw || {};
  };

  const meta = getSafeMeta(booking);
  const storedItems = meta.bookingItems || [];
  
  let basePrice = 0;
  let otherDiscount = 0;
  let gstDiscount = 0;
  if (bookingItems.length > 0) {
    const activeItems = bookingItems.filter((item: any) => item.qty > 0 || item.rate < 0);
    const gstDiscounts = activeItems.filter((item: any) => item.name.toLowerCase().includes("gst") && item.rate < 0);
    const otherDiscounts = activeItems.filter((item: any) => (item.name.toLowerCase().includes("discount") || item.rate < 0) && !gstDiscounts.includes(item));
    const baseItems = activeItems.filter((item: any) => !(item.name.toLowerCase().includes("discount") || item.rate < 0));
    
    basePrice = baseItems.reduce((acc: number, item: any) => acc + (item.rate * item.qty), 0);
    otherDiscount = otherDiscounts.reduce((acc: number, item: any) => acc + Math.abs(item.rate * item.qty), 0);
    gstDiscount = gstDiscounts.reduce((acc: number, item: any) => acc + Math.abs(item.rate * item.qty), 0);
  } else {
    basePrice = booking.baseAmount ?? packageAmt ?? 0;
    otherDiscount = 0;
    gstDiscount = 0;
  }
  
  const gstAmount = (booking.gstAmount !== undefined && booking.gstAmount !== null)
    ? booking.gstAmount 
    : computeGst(basePrice, otherDiscount, gstRate);
  const totalWithGST = basePrice + gstAmount;
  const calculatedTotal = totalWithGST - otherDiscount - gstDiscount;
  const daysToGo = booking.departureDate 
    ? Math.max(0, Math.ceil((new Date(booking.departureDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) 
    : 0;

  // Live preview values during editing
  const { previewItems, previewBasePrice, previewGstDiscount, previewGstAmount, previewTotalWithGST, previewFinalTotal } = useMemo(() => {
    const items = [...bookingItems];
    if (customDescription && customRate) {
      items.push({
        name: customDescription,
        rate: parseFloat(customRate) || 0,
        qty: parseInt(customQty) || 1
      });
    }
    
    const active = items.filter(item => item.qty > 0 || item.rate < 0);
    
    // Separate GST discounts from regular discounts
    const gstDiscounts = active.filter(item => item.name.toLowerCase().includes("gst") && item.rate < 0);
    const otherDiscounts = active.filter(item => item.rate < 0 && !gstDiscounts.includes(item));
    const base = active.filter(item => item.rate >= 0);
    
    const baseP = base.reduce((acc, item) => acc + (item.rate * item.qty), 0);
    const baseDiscount = otherDiscounts.reduce((acc, item) => acc + Math.abs(item.rate * item.qty), 0);
    const gstDiscount = gstDiscounts.reduce((acc, item) => acc + Math.abs(item.rate * item.qty), 0);
    
    const gstA = computeGst(baseP, baseDiscount, gstRate);
    const finalT = (baseP - baseDiscount) - gstDiscount + gstA;
    const totalW = baseP + gstA;

    return {
      previewItems: items,
      previewBasePrice: baseP,
      previewGstDiscount: gstDiscount,
      previewGstAmount: gstA,
      previewTotalWithGST: totalW,
      previewFinalTotal: finalT
    };
  }, [bookingItems, customDescription, customRate, customQty, gstRate]);

  useEffect(() => {
    setLoadingPayments(true);
    fetchActivityLogs();
    fetchTasks();
    fetchColleagues();
    Promise.allSettled([
      settingsService.get(),
      bookingsService.getEmailLogs(booking.id),
      paymentsService.getByBooking(booking.id),
      trainTicketService.getTicketsByBooking(booking.id)
    ]).then(([settingsRes, logsRes, paymentsRes, ticketsRes]) => {
      if (settingsRes.status === 'fulfilled' && settingsRes.value) {
        setSettings(settingsRes.value);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value) {
        setEmailLogs(logsRes.value);
      }
      if (paymentsRes.status === 'fulfilled' && paymentsRes.value) {
        setPaymentsList(paymentsRes.value.payments || []);
      }
      if (ticketsRes.status === 'fulfilled' && ticketsRes.value) {
        setTickets(ticketsRes.value || []);
      }
    }).finally(() => {
      setLoadingPayments(false);
    });

    setNotesValue(booking.notes || "");
    setInternalNotesValue(booking.adminNotes || "");
    setConfirmEmail(booking.email || "");
    setGuestName(booking.fullName || "");
    setGuestEmail(booking.email || "");
    setGuestPhone(booking.mobile || "");
    setEditedCustomerName(booking.fullName || booking.name || "");
    setEditedCustomerPhone(booking.mobile || booking.phone || "");
    setEditedCustomerEmail(booking.email || "");
    setPickupCityValue(booking.pickupCity || "");
    setTrainClassValue(booking.trainClass || "");
    
    // Set language and source value
    const meta = getSafeMeta(booking);
    setLangValue(meta.language || "English");
    
    const linkPrefix = (booking as any)?.sourceBookingLink?.tokenPrefix;
    const salesAdminId = (booking as any)?.salesAdminId;
    let src = meta.bookingSource || "Website Form";
    if (!meta.bookingSource) {
      if (linkPrefix) {
        src = `Booking Link #${linkPrefix}`;
      } else if (salesAdminId) {
        src = `Sales ${salesAdminId}`;
      } else {
        const lowerNotes = (booking.notes || "").toLowerCase();
        if (lowerNotes.includes("source:")) {
          const match = booking.notes?.match(/source:\s*([^\n]+)/i);
          if (match && match[1]) src = match[1].trim();
        } else {
          src = booking.status === "confirmed" ? "Admin Panel" : "Website Form";
        }
      }
    }
    setSourceValue(src);

    // Initialize passengers
    let passengersList: any[] = [];
    
    // Add main guest
    passengersList.push({
      id: 'main',
      name: booking.fullName || booking.name || "Guest",
      phone: booking.mobile || booking.phone || "Not specified",
      email: booking.email || "Not specified",
      gender: booking.gender || "Male",
      age: booking.age || 20,
      type: `${booking.trainClass || 'Sleeper'} Train`,
      status: 'Form complete',
      foodPreference: booking.foodPreference || "Normal Food",
      roomSharing: booking.roomSharing || "Double"
    });
    
    if (booking.passengers) {
      let parsed: any = null;
      if (typeof booking.passengers === 'string') {
        try { parsed = JSON.parse(booking.passengers); } catch (e) {}
      } else {
        parsed = booking.passengers;
      }
      
      const persons = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) 
        ? (parsed.persons || parsed.passengers || null) 
        : null;
      if (Array.isArray(persons)) {
        persons.forEach((p: any, idx: number) => {
          if (p.name && p.name.toLowerCase() !== (booking.fullName || "").toLowerCase()) {
            passengersList.push({
              id: `co-${idx}`,
              name: p.name,
              phone: p.phone || "Not specified",
              email: p.email || "Not specified",
              gender: p.gender || "Male",
              age: p.age || 20,
              type: p.type || `${booking.trainClass || 'Sleeper'} Train`,
              status: p.status || 'Form complete',
              foodPreference: p.foodPreference || "Normal Food",
              roomSharing: p.roomSharing || "Double",
              idProof: p.idProof
            });
          }
        });
      } else if (Array.isArray(parsed)) {
        parsed.forEach((p: any, idx: number) => {
          if (p.name && p.name.toLowerCase() !== (booking.fullName || "").toLowerCase()) {
            passengersList.push({
              id: p.id || `p-${idx}`,
              name: p.name,
              phone: p.phone || "Not specified",
              email: p.email || "Not specified",
              gender: p.gender || "Male",
              age: p.age || 20,
              type: p.type || `${booking.trainClass || 'Sleeper'} Train`,
              status: p.status || 'Form complete',
              foodPreference: p.foodPreference || "Normal Food",
              roomSharing: p.roomSharing || "Double",
              idProof: p.idProof
            });
          }
        });
      }
    }
    
    // Pad passengers to match expected passenger count in header (booking.numberOfTravelers)
    const expectedCount = booking.numberOfTravelers || 1;
    if (passengersList.length < expectedCount) {
      for (let i = passengersList.length; i < expectedCount; i++) {
        passengersList.push({
          id: `gen-co-${i}`,
          name: "",
          phone: "",
          email: "",
          gender: "Female",
          age: "",
          type: `${booking.trainClass || 'Sleeper'} Train`,
          status: 'Pending',
          foodPreference: "Normal Food",
          roomSharing: "Double"
        });
      }
    }
    
    setPassengers(passengersList);

    // Set confirmation amount based on trip price
    const trip = trips.find(t => t.tripCode === booking.tripId);
    if (trip && trip.price) {
      setConfirmTotal(trip.price.toString());
    } else {
      setConfirmTotal(booking.totalAmount?.toString() || "");
    }
    setConfirmAdvance(booking.advancePaid?.toString() || "");

    // Fetch full trip details and populate bookingItems
    const loadTripData = async () => {
      try {
        const res = await tripsService.getById(booking.tripId);
        setFullTrip(res);
        
        // If booking already has stored items in sourceMeta, load them
        if (meta.bookingItems && Array.isArray(meta.bookingItems)) {
          setBookingItems(meta.bookingItems);
        } else {
          // Initialize default items list:
          // Try to get travel options of the trip, otherwise use default train options
          const travOpts = res?.travelOptions || [
            { label: "Sleeper Class Train", priceDelta: 0 },
            { label: "3AC Class Train", priceDelta: 3000 }
          ];
          const roomOpts = res?.roomOptions || [
            { label: "Quad Sharing", priceDelta: 0 },
            { label: "Double Sharing", priceDelta: 1999 }
          ];

          const matchTrainClass = (optLabel: string, trainClass: string) => {
            if (!optLabel || !trainClass) return false;
            const label = optLabel.toLowerCase().trim();
            const cls = trainClass.toLowerCase().trim();
            if (label.includes(cls) || cls.includes(label)) return true;
            
            const clsIsNonAc = cls.includes("non ac") || cls.includes("non-ac");
            const labelIsNonAc = label.includes("non ac") || label.includes("non-ac");
            
            if (cls.includes("sleeper") || cls === "sl") {
              if (!cls.includes("ac") || clsIsNonAc) {
                return label.includes("sleeper") || label.includes("sl");
              }
            }
            if (cls.includes("3ac") || cls.includes("3-tier") || cls.includes("ac") || cls.includes("3c") || cls.includes("3-tier ac train")) {
              if (clsIsNonAc) {
                return labelIsNonAc;
              } else {
                return (label.includes("3ac") || label.includes("3-tier") || label.includes("ac") || label.includes("3c")) && !labelIsNonAc;
              }
            }
            return false;
          };

          const matchRoomType = (optLabel: string, roomType: string) => {
            if (!optLabel || !roomType) return false;
            const label = optLabel.toLowerCase();
            const room = roomType.toLowerCase();
            if (label.includes(room) || room.includes(label)) return true;
            if (room.includes("double") || room.includes("couple")) {
              return label.includes("double") || label.includes("couple");
            }
            if (room.includes("triple")) {
              return label.includes("triple");
            }
            if (room.includes("quad")) {
              return label.includes("quad");
            }
            return false;
          };

          // Find matching indices
          let selectedTravelIdx = -1;
          if (booking.trainClass) {
            selectedTravelIdx = travOpts.findIndex((opt: any) => matchTrainClass(opt.label, booking.trainClass));
          }
          if (selectedTravelIdx === -1) {
            selectedTravelIdx = 0; // fallback to first travel option
          }

          let selectedRoomIdx = -1;
          if (booking.roomType) {
            selectedRoomIdx = roomOpts.findIndex((opt: any) => matchRoomType(opt.label, booking.roomType));
          }
          if (selectedRoomIdx === -1) {
            selectedRoomIdx = roomOpts.findIndex((opt: any) => opt.priceDelta === 0);
            if (selectedRoomIdx === -1) selectedRoomIdx = 0;
          }

          const defaultItems: any[] = [];
          const baseRate = itemRate > 0 ? itemRate : (res?.price || 11999);
          
          travOpts.forEach((opt: any, idx: number) => {
            const isSelected = idx === selectedTravelIdx;
            defaultItems.push({
              id: opt.label.replace(/\s+/g, '_').toLowerCase(),
              name: opt.label,
              rate: parseFloat((baseRate + (opt.priceDelta || 0)).toFixed(2)),
              qty: isSelected ? (booking.numberOfTravelers || 1) : 0
            });
          });

          roomOpts.forEach((opt: any, idx: number) => {
            const isSelected = idx === selectedRoomIdx;
            defaultItems.push({
              id: opt.label.replace(/\s+/g, '_').toLowerCase(),
              name: opt.label,
              rate: opt.priceDelta || 0,
              qty: isSelected ? (booking.numberOfTravelers || 1) : 0
            });
          });
          
          setBookingItems(defaultItems);
        }
      } catch (err) {
        console.error("Failed to fetch full trip details", err);
      }
    };
    if (booking.tripId) {
      loadTripData();
    }
  }, [booking, trips]);


  const syncBookingDataWithPassengers = async (updatedPassengers: any[], extraFields: any = {}) => {
    const newQty = updatedPassengers.length;
    
    // 1. Get current bookingItems or generate defaults
    let currentItems = [...bookingItems];
    if (currentItems.length === 0) {
      // Generate default bookingItems
      const travOpts = fullTrip?.travelOptions || [
        { label: "Sleeper Class Train", priceDelta: 0 },
        { label: "3AC Class Train", priceDelta: 3000 }
      ];
      const roomOpts = fullTrip?.roomOptions || [
        { label: "Quad Sharing", priceDelta: 0 },
        { label: "Double Sharing", priceDelta: 1999 }
      ];

      const matchTrainClass = (optLabel: string, trainClass: string) => {
        if (!optLabel || !trainClass) return false;
        const label = optLabel.toLowerCase().trim();
        const cls = trainClass.toLowerCase().trim();
        if (label.includes(cls) || cls.includes(label)) return true;
        
        const clsIsNonAc = cls.includes("non ac") || cls.includes("non-ac");
        const labelIsNonAc = label.includes("non ac") || label.includes("non-ac");
        
        if (cls.includes("sleeper") || cls === "sl") {
          if (!cls.includes("ac") || clsIsNonAc) {
            return label.includes("sleeper") || label.includes("sl");
          }
        }
        if (cls.includes("3ac") || cls.includes("3-tier") || cls.includes("ac") || cls.includes("3c") || cls.includes("3-tier ac train")) {
          if (clsIsNonAc) {
            return labelIsNonAc;
          } else {
            return (label.includes("3ac") || label.includes("3-tier") || label.includes("ac") || label.includes("3c")) && !labelIsNonAc;
          }
        }
        return false;
      };

      const matchRoomType = (optLabel: string, roomType: string) => {
        if (!optLabel || !roomType) return false;
        const label = optLabel.toLowerCase();
        const room = roomType.toLowerCase();
        if (label.includes(room) || room.includes(label)) return true;
        if (room.includes("double") || room.includes("couple")) return label.includes("double") || label.includes("couple");
        if (room.includes("triple")) return label.includes("triple");
        if (room.includes("quad")) return label.includes("quad");
        return false;
      };

      let selectedTravelIdx = -1;
      if (booking.trainClass) {
        selectedTravelIdx = travOpts.findIndex((opt: any) => matchTrainClass(opt.label, booking.trainClass));
      }
      if (selectedTravelIdx === -1) selectedTravelIdx = 0;

      let selectedRoomIdx = -1;
      if (booking.roomType) {
        selectedRoomIdx = roomOpts.findIndex((opt: any) => matchRoomType(opt.label, booking.roomType));
      }
      if (selectedRoomIdx === -1) {
        selectedRoomIdx = roomOpts.findIndex((opt: any) => opt.priceDelta === 0);
        if (selectedRoomIdx === -1) selectedRoomIdx = 0;
      }

      travOpts.forEach((opt: any, idx: number) => {
        currentItems.push({
          id: opt.label.replace(/\s+/g, '_').toLowerCase(),
          name: opt.label,
          rate: fullTrip?.price ? (fullTrip.price + (opt.priceDelta || 0)) : (booking.baseAmount || 11999),
          qty: idx === selectedTravelIdx ? newQty : 0
        });
      });

      roomOpts.forEach((opt: any, idx: number) => {
        currentItems.push({
          id: opt.label.replace(/\s+/g, '_').toLowerCase(),
          name: opt.label,
          rate: opt.priceDelta || 0,
          qty: idx === selectedRoomIdx ? newQty : 0
        });
      });
    } else {
      // Update quantities in existing items
      const activeTravelItem = currentItems.find(item => 
        item.qty > 0 && 
        !item.name.toLowerCase().includes("sharing") && 
        !item.name.toLowerCase().includes("discount") && 
        item.rate >= 0
      );
      if (activeTravelItem) {
        activeTravelItem.qty = newQty;
      } else {
        const firstTravel = currentItems.find(item => 
          !item.name.toLowerCase().includes("sharing") && 
          !item.name.toLowerCase().includes("discount") && 
          item.rate >= 0
        );
        if (firstTravel) firstTravel.qty = newQty;
      }

      const activeRoomItem = currentItems.find(item => 
        item.qty > 0 && 
        item.name.toLowerCase().includes("sharing")
      );
      if (activeRoomItem) {
        activeRoomItem.qty = newQty;
      } else {
        const firstRoom = currentItems.find(item => 
          item.name.toLowerCase().includes("sharing")
        );
        if (firstRoom) firstRoom.qty = newQty;
      }
    }

    // Recalculate totals
    const activeItems = currentItems.filter(item => item.qty > 0 || item.rate < 0);
    const gstDiscounts = activeItems.filter(item => item.name.toLowerCase().includes("gst") && item.rate < 0);
    const otherDiscounts = activeItems.filter(item => item.rate < 0 && !gstDiscounts.includes(item));
    const baseItems = activeItems.filter(item => item.rate >= 0);

    const calculatedBase = baseItems.reduce((acc, item) => acc + (item.rate * item.qty), 0);
    const calculatedDiscount = otherDiscounts.reduce((acc, item) => acc + Math.abs(item.rate * item.qty), 0);
    const calculatedGstDiscount = gstDiscounts.reduce((acc, item) => acc + Math.abs(item.rate * item.qty), 0);

    const gstRate = (fullTrip?.gstPercentage ?? 5) / 100;
    const calculatedGst = computeGst(calculatedBase, calculatedDiscount, gstRate);

    const totalAmount = calculatedBase - calculatedDiscount - calculatedGstDiscount + calculatedGst;
    const totalPaymentsPaid = paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remainingAmount = totalAmount - totalPaymentsPaid;

    const meta = getSafeMeta(booking);
    const newMeta = {
      ...meta,
      bookingItems: currentItems
    };

    await bookingsService.update(booking.id, {
      passengers: updatedPassengers,
      numberOfTravelers: newQty,
      baseAmount: calculatedBase,
      gstAmount: calculatedGst,
      totalAmount,
      remainingAmount,
      sourceMeta: newMeta,
      advancePaid: totalPaymentsPaid,
      ...extraFields
    });
  };

  const canManageBooking = (() => {
    if (!currentAdmin) return false;
    if (currentAdmin.role === "admin" || currentAdmin.role === "superadmin") return true;
    if (currentAdmin.role === "sales") {
      return String((booking as any)?.salesAdminId || "") === String(currentAdmin.id || "");
    }
    return false;
  })();

  const isExpired = (() => {
    const expiresAt =
      (booking as any)?.sourceMeta?.expiresAt ||
      (booking as any)?.sourceBookingLink?.expiresAt ||
      null;
    if (!expiresAt) return false;
    const ts = new Date(expiresAt).getTime();
    if (isNaN(ts)) return false;
    return booking.status === "pending" && ts < Date.now();
  })();

  const flowStatus = (() => {
    if (booking.status === "confirmed") return "Confirmed";
    if (booking.status === "cancelled") return "Cancelled";
    if (isExpired) return "Expired";

    const paymentStatus = (booking.paymentStatus || "").toString().toLowerCase();
    const advance = Number(booking.advancePaid || 0);
    if (paymentStatus === "partial") return "Partially Paid";
    if (paymentStatus === "paid") return "Paid";
    if (paymentStatus === "pending") {
      if (advance <= 0) return "Inquiry";
      return "Pending Payment";
    }
    if (advance <= 0) return "Inquiry";
    return "Pending Payment";
  })();

  const handleSendEmail = async (type: 'confirmation' | 'reminder' | 'invoice') => {
    const targetEmail = booking.email;
    if (!targetEmail || targetEmail.includes("no-email") || targetEmail.includes("example.com")) {
      toast.error("Real customer email is missing! Please edit the reservation with a valid email first.");
      return;
    }
    const toastId = toast.loading(`Sending ${type} email...`);
    try {
      await bookingsService.sendEmail(booking.id, type, booking.totalAmount);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} email sent successfully!`, { id: toastId });
      fetchEmailLogs();
    } catch (e: any) {
      toast.error(`Failed to send email: ${e.response?.data?.message || 'Server error'}`, { id: toastId });
    }
  };

  const handleConfirmSubmit = async () => {
    if (!canManageBooking) return toast.error("Not authorized to confirm this booking");
    if (isExpired) return toast.error("This booking has expired");
    if (!confirmTotal || parseFloat(confirmTotal) <= 0) {
      toast.error("Enter a valid total amount");
      return;
    }
    setConfirmingLoading(true);
    try {
      const tot = parseFloat(confirmTotal);
      const adv = parseFloat(confirmAdvance) || 0;
      await bookingsService.confirm(booking.id, {
        totalAmount: tot,
        advancePaid: adv,
        paymentMode: confirmMode,
        paymentStatus: adv >= tot ? 'Paid' : adv > 0 ? 'Partial' : 'Pending',
        email: confirmEmail,
        trainTicketStatus: confirmTrainStatus
      });

      // Auto create or update train tickets for passengers in this booking with the selected status
      const passengersList = booking.passengers && Array.isArray(booking.passengers) ? booking.passengers : [];
      if (passengersList.length > 0) {
        await Promise.all(
          passengersList.map(async (p: any) => {
            const existing = tickets.find(t => t.travelerName === p.name);
            if (existing) {
              return trainTicketService.updateTicket(existing.id, { ticketStatus: confirmTrainStatus });
            }
            return trainTicketService.createTicket(booking.bookingId, {
              travelerName: p.name,
              ticketStatus: confirmTrainStatus,
              sourceStation: booking.pickupCity || "Ahmedabad",
              destinationStation: "Jalandhar"
            });
          })
        );
      } else {
        const existing = tickets.find(t => t.travelerName === booking.fullName);
        if (existing) {
          await trainTicketService.updateTicket(existing.id, { ticketStatus: confirmTrainStatus });
        } else {
          await trainTicketService.createTicket(booking.bookingId, {
            travelerName: booking.fullName,
            ticketStatus: confirmTrainStatus,
            sourceStation: booking.pickupCity || "Ahmedabad",
            destinationStation: "Jalandhar"
          });
        }
      }

      toast.success("Booking confirmed successfully!");
      setIsConfirming(false);
      try {
        const singleFile = confirmTicketFilesList[0]?.content || confirmTicketFile;
        const singleFileName = confirmTicketFilesList[0]?.name || confirmTicketFileName;
        await bookingsService.sendEmail(
          booking.id, 
          'confirmation', 
          undefined, 
          confirmSendTicket, 
          singleFile, 
          singleFileName, 
          confirmTrainStatus,
          confirmTicketFilesList
        );
        toast.success("Confirmation email sent to guest!");
      } catch (err) {
        toast.error("Booking confirmed, but email notification failed");
      }
      onRefresh();
    } catch (err) {
      toast.error("Failed to confirm booking");
    } finally {
      setConfirmingLoading(false);
    }
  };

  const handleRevertConfirmation = async () => {
    if (!canManageBooking) return toast.error("Not authorized to modify this booking");
    if (!window.confirm("Are you sure you want to revert this confirmed booking back to Pending Payment status?")) {
      return;
    }
    setRevertingLoading(true);
    try {
      await bookingsService.update(booking.id, {
        status: 'pending_payment',
        paymentStatus: 'Pending',
        trainTicketStatus: 'PENDING'
      });
      toast.success("Booking confirmation reverted back to Pending Payment!");
      onRefresh();
    } catch (err: any) {
      toast.error(`Failed to revert booking: ${err.message || 'Server error'}`);
    } finally {
      setRevertingLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    setCancelProcessing(true);
    try {
      await bookingsService.cancelWithRefund(booking.id, {
        reason: cancelReason,
        cancellationCharges: parseFloat(cancelCharges) || 0,
        refundAmount: parseFloat(cancelRefund) || 0,
        refundPaymentMode: cancelRefundMode
      });
      toast.success("Booking cancelled, associated train tickets updated, and refund logged!");
      setShowCancelModal(false);
      onRefresh();
    } catch (err) {
      toast.error("Failed to cancel booking");
    } finally {
      setCancelProcessing(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!canManageBooking) return toast.error("Not authorized to reject this booking");
    if (isExpired) return toast.error("This booking has expired");
    if (!confirm("Are you sure you want to reject and delete this booking request?")) return;
    try {
      await bookingsService.delete(booking.id);
      toast.success("Booking request rejected (cancelled).");
      onBack();
      onRefresh();
    } catch (err) {
      toast.error("Failed to delete booking request");
    }
  };

  const handleAddPaymentSubmit = async () => {
    const amt = parseFloat(newPaymentAmount);
    if (!newPaymentAmount || isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setRecordingPayment(true);
    try {
      await paymentsService.add({
        bookingId: booking.id,
        amount: amt,
        paymentMode: newPaymentMode,
        notes: "Recorded inline"
      });

      toast.success(`Payment of ₹${amt.toLocaleString('en-IN')} recorded!`);
      setNewPaymentAmount("");
      setShowAddPaymentInline(false);
      onRefresh();
    } catch (err) {
      toast.error("Failed to record payment");
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await bookingsService.update(booking.id, { notes: notesValue });
      toast.success("Notes updated successfully");
      setEditingNotes(false);
      onRefresh();
    } catch (err) {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSaveDates = async () => {
    if (!newDepartureDate) return toast.error("Please select a valid date");
    try {
      await bookingsService.update(booking.id, { 
        departureDate: newDepartureDate,
        reason: changeReason
      });
      toast.success("Departure date updated successfully!");
      setShowChangeDates(false);
      setChangeReason("");
      onRefresh();
    } catch (e) {
      toast.error("Failed to update departure date");
    }
  };

  const handleUpdateTotal = () => {
    if (customDescription && customRate) {
      const rateVal = parseFloat(customRate);
      const qtyVal = parseInt(customQty) || 1;
      const newItem = {
        id: customDescription.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now(),
        name: customDescription,
        rate: rateVal,
        qty: qtyVal,
        isCustom: true
      };
      setBookingItems([...bookingItems, newItem]);
      setCustomDescription("");
      setCustomRate("");
      setCustomQty("1");
      toast.success("Custom item added!");
    } else {
      toast.info("Total updated dynamically");
    }
  };

  const handleSaveBookingItems = async () => {
    try {
      // Auto-add any custom item in progress
      let currentItems = [...bookingItems];
      if (customDescription && customRate) {
        const rateVal = parseFloat(customRate);
        const qtyVal = parseInt(customQty) || 1;
        const newItem = {
          id: customDescription.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now(),
          name: customDescription,
          rate: rateVal,
          qty: qtyVal,
          isCustom: true
        };
        currentItems.push(newItem);
        setBookingItems(currentItems);
        setCustomDescription("");
        setCustomRate("");
        setCustomQty("1");
      }

      const activeItems = currentItems.filter(item => item.qty > 0 || item.rate < 0);
      const gstDiscounts = activeItems.filter(item => item.name.toLowerCase().includes("gst") && item.rate < 0);
      const otherDiscounts = activeItems.filter(item => item.rate < 0 && !gstDiscounts.includes(item));
      const baseItems = activeItems.filter(item => item.rate >= 0);

      const calculatedBase = baseItems.reduce((acc, item) => acc + (item.rate * item.qty), 0);
      const calculatedDiscount = otherDiscounts.reduce((acc, item) => acc + Math.abs(item.rate * item.qty), 0);
      const calculatedGstDiscount = gstDiscounts.reduce((acc, item) => acc + Math.abs(item.rate * item.qty), 0);

      const gstRate = (fullTrip?.gstPercentage ?? 5) / 100;
      const calculatedGst = computeGst(calculatedBase, calculatedDiscount, gstRate);

      const totalAmount = calculatedBase - calculatedDiscount - calculatedGstDiscount + calculatedGst;
      const totalPaymentsPaid = paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const remainingAmount = totalAmount - totalPaymentsPaid;
      
      const totalQty = baseItems.reduce((acc, item) => acc + item.qty, 0);

      const newMeta = {
        ...getSafeMeta(booking),
        bookingItems: activeItems
      };

      await bookingsService.update(booking.id, {
        totalAmount,
        remainingAmount,
        baseAmount: calculatedBase,
        gstAmount: calculatedGst,
        advancePaid: totalPaymentsPaid,
        sourceMeta: newMeta
      });

      toast.success("Booking items updated successfully!");
      setIsEditingItems(false);
      onRefresh();
    } catch (e) {
      toast.error("Failed to update booking items");
    }
  };

  const handleCreatePaymentSave = async () => {
    if (paymentSource === 'collected') {
      const amt = parseFloat(payAmount);
      if (isNaN(amt) || amt <= 0) return toast.error("Please enter a valid amount");
      if (!payMode) return toast.error("Please select a payment mode");
      setSavingPayment(true);
      try {
        await paymentsService.add({
          bookingId: booking.id,
          amount: amt,
          paymentMode: payMode,
          notes: payComments
        });
        toast.success("Payment recorded successfully!");
        setShowCreatePayment(false);
        setPayComments("");
        onRefresh();
      } catch (err) {
        toast.error("Failed to record payment");
      } finally {
        setSavingPayment(false);
      }
    } else if (paymentSource === 'online') {
      try {
        await handleSendEmail('reminder');
        toast.success("Online payment request sent to guest!");
        setShowCreatePayment(false);
      } catch (e) {
        toast.error("Failed to send online request");
      }
    } else if (paymentSource === 'venue') {
      const remaining = Number(booking.remainingAmount || 0);
      try {
        await bookingsService.update(booking.id, {
          notes: booking.notes ? `${booking.notes}\n[Collect at Venue: ₹${remaining.toLocaleString('en-IN')}]` : `[Collect at Venue: ₹${remaining.toLocaleString('en-IN')}]`,
          // Preserve the actual remaining amount so outstanding reports remain correct.
          // A dedicated venueCollectionAmount flag is stored for staff to know what to collect.
          venueCollectionAmount: remaining,
          venueCollectionStatus: 'pending',
        });
        toast.success("Payment configured to be collected at venue!");
        setShowCreatePayment(false);
        onRefresh();
      } catch (e) {
        toast.error("Failed to update payment directives");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, passengerId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File validation: Size limit under 1 MB
    if (file.size > 1024 * 1024) {
      toast.error("File size must be under 1 MB.");
      e.target.value = ""; // Reset
      return;
    }

    // Mimetype check (PDF, JPG, PNG)
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.png') && !file.name.toLowerCase().endsWith('.jpg') && !file.name.toLowerCase().endsWith('.jpeg')) {
      toast.error("Invalid file type. Only JPG, PNG, and PDF are allowed.");
      e.target.value = "";
      return;
    }

    try {
      toast.loading("Uploading document...", { id: `upload-${passengerId}` });
      await bookingsService.uploadDocument(booking.id, passengerId, file);
      toast.success("Document uploaded successfully!", { id: `upload-${passengerId}` });
      onRefresh(); // Refresh details to load new documents metadata
    } catch (err: any) {
      console.error(err);
      toast.error("Document upload failed. Please retry later.", { id: `upload-${passengerId}` });
    } finally {
      e.target.value = "";
    }
  };

  const handleViewDoc = async (passengerId: string, fileName: string) => {
    try {
      toast.loading("Loading document...", { id: `view-${passengerId}` });
      const blob = await bookingsService.downloadDocument(booking.id, passengerId);
      const url = window.URL.createObjectURL(blob);
      
      // Open in new tab
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        // Fallback to download link if popup is blocked
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
      }
      toast.success("Document loaded", { id: `view-${passengerId}` });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load document", { id: `view-${passengerId}` });
    }
  };

  const handleRemoveDoc = async (passengerId: string) => {
    if (!confirm("Are you sure you want to remove this document?")) return;
    try {
      toast.loading("Removing document...", { id: `remove-doc-${passengerId}` });
      await bookingsService.deleteDocument(booking.id, passengerId);
      toast.success("Document removed successfully", { id: `remove-doc-${passengerId}` });
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove document", { id: `remove-doc-${passengerId}` });
    }
  };

  const handleEditPassenger = (p: any) => {
    let rawName = p.name || "";
    let salutation = "Mr.";
    if (rawName.toLowerCase().startsWith("mr. ")) {
      salutation = "Mr.";
      rawName = rawName.substring(4);
    } else if (rawName.toLowerCase().startsWith("mrs. ")) {
      salutation = "Mrs.";
      rawName = rawName.substring(5);
    } else if (rawName.toLowerCase().startsWith("ms. ")) {
      salutation = "Ms.";
      rawName = rawName.substring(4);
    }
    const names = rawName.split(' ');
    setEditingPassenger(p);
    setNewPassenger({
      salutation,
      firstName: names[0] || "",
      lastName: names.slice(1).join(' ') || "",
      gender: p.gender || "Male",
      age: p.age?.toString() || "",
      phone: p.phone || "",
      email: p.email !== "Not specified" ? p.email : "",
      foodPreference: p.foodPreference || "Normal Food"
    });
    setShowAddPassenger(true);
  };

  const handleSavePassenger = async (keepOpen = false) => {
    if (!newPassenger.firstName) {
      toast.error("Please enter at least a first name");
      return;
    }

    let updatedPassengers = [];
    let isMainGuestUpdate = false;
    const salutationPrefix = newPassenger.salutation ? `${newPassenger.salutation} ` : "";
    const name = `${salutationPrefix}${newPassenger.firstName} ${newPassenger.lastName}`.trim();

    if (editingPassenger) {
      if (editingPassenger.id === 'main' || editingPassenger.name === booking.fullName || editingPassenger.name === booking.name) {
        isMainGuestUpdate = true;
      }
      updatedPassengers = passengers.map(p => p.id === editingPassenger.id ? {
        ...p,
        name: name,
        phone: newPassenger.phone || "N/A",
        email: newPassenger.email || "N/A",
        gender: newPassenger.gender,
        age: newPassenger.age || "N/A",
        foodPreference: newPassenger.foodPreference || "Normal Food"
      } : p);
      toast.success("Passenger updated");
    } else {
      const passenger = {
        id: Math.random().toString(36).substr(2, 9),
        name: name,
        phone: newPassenger.phone || "N/A",
        email: newPassenger.email || "N/A",
        gender: newPassenger.gender,
        age: newPassenger.age || "N/A",
        type: `${booking.trainClass} Train`,
        status: 'Form complete',
        foodPreference: newPassenger.foodPreference || "Normal Food"
      };
      updatedPassengers = [...passengers, passenger];
      toast.success(`${newPassenger.firstName} added to booking`);
    }
    
    setPassengers(updatedPassengers);

    let extraFields: any = {};
    if (isMainGuestUpdate) {
      extraFields = {
        fullName: name,
        mobile: newPassenger.phone || "N/A",
        phone: newPassenger.phone || "N/A",
        email: newPassenger.email || "N/A"
      };
    }

    try {
      await syncBookingDataWithPassengers(updatedPassengers, extraFields);
      onRefresh();
    } catch (e) {
      toast.error("Failed to sync passengers and booking items with backend");
    }

    setNewPassenger({ salutation: "Mr.", firstName: "", lastName: "", gender: "Male", age: "", phone: "", email: "", foodPreference: "Normal Food" });
    setEditingPassenger(null);
    if (!keepOpen) setShowAddPassenger(false);
  };

  const handleDownloadInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const logoUrl = `${window.location.origin}/logo.png`;
    const invoiceHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Invoice - ${booking.bookingId}</title>
          <style>
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #1e293b;
              background: #fff;
              font-size: 13px;
              line-height: 1.5;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page { size: A4 portrait; margin: 18mm 16mm 18mm 16mm; }
            @media print {
              html, body { width: 210mm; min-height: 297mm; }
              .no-print { display: none !important; }
            }
            .invoice-wrapper { max-width: 780px; margin: 0 auto; padding: 48px; background: #fff; }
            .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; margin-bottom: 32px; border-bottom: 2px solid #e2e8f0; }
            .logo-wrap img { height: 52px; width: auto; max-width: 200px; object-fit: contain; }
            .invoice-meta { text-align: right; }
            .invoice-meta .invoice-title { font-size: 22px; font-weight: 900; color: #1e293b; text-transform: uppercase; margin-bottom: 6px; }
            .invoice-meta p { font-size: 11px; color: #64748b; font-weight: 600; margin: 2px 0; text-transform: uppercase; }
            .invoice-meta .status-badge { display: inline-block; margin-top: 8px; padding: 3px 12px; border-radius: 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
            .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; }
            .section-title { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 1.5px; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
            .info-item { margin-bottom: 10px; }
            .info-label { font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; }
            .info-value { font-size: 14px; font-weight: 700; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
            thead tr { background: #f1f5f9; }
            th { text-align: left; font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; padding: 10px 14px; border-bottom: 2px solid #e2e8f0; }
            td { padding: 12px 14px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
            .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 40px; }
            .totals-box { width: 320px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
            .total-row { display: flex; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid #f1f5f9; }
            .total-row.grand { background: #1e293b; color: #fff; }
            .total-row.grand .val { font-size: 18px; font-weight: 900; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            <div class="header">
              <div class="logo-wrap">
                <span style="font-size:22px; font-weight:900; color:#1e293b; letter-spacing:-1px;">YOUTHCAMPING.</span>
              </div>
              <div class="invoice-meta">
                <div class="invoice-title">Invoice</div>
                <p>Invoice No: ${booking.bookingId}</p>
                <p>Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <span class="status-badge">${booking.paymentStatus}</span>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-card">
                <div class="section-title">Guest Details</div>
                <div class="info-item">
                  <div class="info-label">Full Name</div>
                  <div class="info-value">${booking.fullName}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Mobile Number</div>
                  <div class="info-value">+91 ${booking.mobile}</div>
                </div>
                ${booking.email ? `<div class="info-item"><div class="info-label">Email</div><div class="info-value">${booking.email}</div></div>` : ''}
              </div>
              <div class="info-card">
                <div class="section-title">Travel Details</div>
                <div class="info-item">
                  <div class="info-label">Trip</div>
                  <div class="info-value">${booking.tripName || booking.tripId}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Train Class / Transport</div>
                  <div class="info-value">${booking.trainClass} &mdash; ${booking.ticketStatus}</div>
                </div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th style="text-align:right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(() => {
                  const activeItems = bookingItems.filter((item: any) => item.qty > 0 || item.rate < 0);
                  if (activeItems.length > 0) {
                    return activeItems.map((item: any) => `
                      <tr>
                        <td>${item.name}</td>
                        <td>${item.qty} Traveller(s)</td>
                        <td style="text-align:right; font-weight:700">&#8377;${(item.rate * item.qty).toLocaleString('en-IN')}</td>
                      </tr>
                    `).join('');
                  } else {
                    return `
                      <tr>
                        <td>Trip Package &mdash; ${booking.tripName || booking.tripId} (${booking.trainClass || 'Standard'})</td>
                        <td>${booking.numberOfTravelers || 1} Traveller(s)</td>
                        <td style="text-align:right; font-weight:700">&#8377;${basePrice.toLocaleString('en-IN')}</td>
                      </tr>
                    `;
                  }
                })()}
              </tbody>
            </table>
            <div class="totals-wrap">
              <div class="totals-box">
                <div class="total-row"><span class="lbl">Subtotal</span><span class="val">&#8377;${basePrice.toLocaleString('en-IN')}</span></div>
                <div class="total-row"><span class="lbl">GST @ ${Math.round(gstRate * 100)}%</span><span class="val">&#8377;${gstAmount.toLocaleString('en-IN')}</span></div>
                ${gstDiscount > 0 ? `<div class="total-row"><span class="lbl" style="color:#e11d48">GST Discount</span><span class="val" style="color:#e11d48">&minus;&#8377;${gstDiscount.toLocaleString('en-IN')}</span></div>` : ''}
                <div class="total-row"><span class="lbl">Total Amount</span><span class="val">&#8377;${booking.totalAmount.toLocaleString('en-IN')}</span></div>
                <div class="total-row"><span class="lbl">Advance Paid</span><span class="val" style="color:#059669">&minus;&#8377;${booking.advancePaid.toLocaleString('en-IN')}</span></div>
                <div class="total-row grand"><span class="lbl">Balance Due</span><span class="val">&#8377;${booking.remainingAmount.toLocaleString('en-IN')}</span></div>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for booking with us. We look forward to serving you.</p>
              <p>This is a computer-generated invoice and does not require a physical signature.</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(function(){ window.close(); }, 800); };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };



  return (
    <div className="min-h-full flex flex-col bg-white text-[#1a1a1a] font-sans antialiased">
      <style dangerouslySetInnerHTML={{ __html: `
        .workspace-kpi-strip {
            background: #fff;
            border-bottom: 1px solid #f5f5f5;
            padding: 16px 24px;
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 16px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        @media (max-width: 1024px) {
            .workspace-kpi-strip { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
            .workspace-kpi-strip { grid-template-columns: repeat(2, 1fr); }
        }
        .workspace-kpi-card {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 12px;
            background: #fafafa;
            border: 1px solid #f5f5f5;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .workspace-kpi-card:hover {
            background: #f5f5f5;
            border-color: #c0c0c0;
        }
      `}} />

      {/* ─── Workspace Header ─── */}
      <div className="border-b border-zinc-200 px-4 py-3 md:px-6 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6 bg-white sticky top-0 z-30 font-sans">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-900 text-sm font-bold pr-2 border-r border-slate-200">← Back</button>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Booking ID</span>
              <span className="font-bold text-slate-800 text-xs sm:text-sm font-mono">{booking.bookingId}</span>
            </div>
          </div>
          <span className={cn("sm:hidden px-2 py-0.5 rounded-full text-[9px] font-bold uppercase", 
            booking.status === "confirmed" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"
          )}>
            {booking.status === "confirmed" ? "Confirmed" : flowStatus}
          </span>
        </div>

        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="font-bold text-slate-900 text-sm sm:text-base truncate">{booking.tripName || fullTrip?.tripName || "Trip"}</div>
          <div className="text-slate-500 text-xs mt-0.5 font-medium">
            {booking.departureDate 
              ? `${safeFormatDate(booking.departureDate, { day: '2-digit', month: 'short' })} to ${(() => {
                  const durationStr = fullTrip?.duration || "";
                  const daysMatch = durationStr.match(/(\d+)\s*[Dd]ay/);
                  const durationDays = daysMatch ? parseInt(daysMatch[1], 10) : (durationStr ? 10 : 10);
                  return safeFormatDate(new Date(booking.departureDate).getTime() + durationDays*24*60*60*1000, { day: '2-digit', month: 'short', year: 'numeric' });
                })()}`
              : '—'}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="font-bold text-slate-800 text-xs">{booking.fullName || booking.name}</div>
            <div className="text-slate-400 font-mono text-[11px] mt-0.5">{booking.mobile || booking.phone || "—"}</div>
          </div>
          <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase", 
            booking.status === "confirmed" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"
          )}>
            {booking.status === "confirmed" ? "Confirmed" : flowStatus}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button 
            onClick={() => {
              setPayAmount(booking.remainingAmount.toString());
              setPaymentSource('collected');
              setPayMode("UPI");
              setPayComments("");
              setShowCreatePayment(true);
            }} 
            className="bg-[#F5760E] hover:opacity-90 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all shadow-xs"
          >
            + Add Payment
          </button>
          <button onClick={() => setShowCreateTask(true)} className="bg-white border border-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-1.5 rounded-lg hover:bg-slate-50 transition-all">
            Assign Task
          </button>
          {(booking.status === 'confirmed' || flowStatus === 'Confirmed') && (
            <button 
              onClick={handleRevertConfirmation}
              disabled={revertingLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all shadow-xs"
            >
              {revertingLoading ? "Reverting..." : "Revert Confirmation"}
            </button>
          )}
          {booking.status !== 'cancelled' && (
            <button 
              onClick={() => {
                setCancelReason("");
                setCancelCharges("0");
                setCancelRefund((booking.advancePaid || 0).toString());
                setCancelRefundMode("UPI");
                setShowCancelModal(true);
              }}
              className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-all"
            >
              Cancel Booking
            </button>
          )}
          <button onClick={() => setIsComposerOpen(true)} className="bg-white border border-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-1.5 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-slate-500" />
            Send Email
          </button>
        </div>
      </div>

      {/* Inline alerts */}
      {flowStatus === 'Confirmed' || booking.status === 'confirmed' ? (
        <div className="mx-6 mt-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase leading-none">CONFIRMED</span>
            <span className="font-semibold">This booking is confirmed.</span>
          </div>
          <button 
            onClick={handleRevertConfirmation}
            disabled={revertingLoading}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded transition-all shrink-0 cursor-pointer shadow-2xs"
          >
            {revertingLoading ? "Reverting..." : "Revert Confirmation"}
          </button>
        </div>
      ) : (
        <div className="mx-6 mt-4 bg-[#fffbea] border border-[#fce588] rounded-xl px-4 py-3 text-xs text-slate-700 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-[#f0ad4e] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase leading-none">{flowStatus}</span>
            <span>
              {flowStatus === 'Cancelled' ? 'This booking was cancelled.'
                : flowStatus === 'Expired' ? 'This booking link has expired.'
                : flowStatus === 'Partially Paid' ? 'Partially paid. Remaining balance is pending.'
                : flowStatus === 'Pending Payment' ? 'Payment pending. Confirmation will be possible once paid.'
                : "Pending Inquiry."}
            </span>
          </div>
          {flowStatus !== 'Cancelled' && flowStatus !== 'Expired' && (
            <button 
              onClick={() => {
                setConfirmTotal((booking.totalAmount || 0).toString());
                setConfirmAdvance((booking.advancePaid || 0).toString());
                setConfirmEmail(booking.email || "");
                setIsConfirming(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded transition-all shrink-0"
            >
              Confirm Booking
            </button>
          )}
        </div>
      )}

      {isRejecting && (
        <div className="mx-6 mt-3 p-4 bg-red-50 border border-red-200 rounded-xl text-xs space-y-2">
          <p className="font-bold text-red-800">Are you sure you want to reject this booking?</p>
          <div className="flex gap-2">
            <button onClick={handleRejectSubmit} className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded">Yes, Reject</button>
            <button onClick={() => setIsRejecting(false)} className="bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded">Cancel</button>
          </div>
        </div>
      )}

      {isConfirming && (
        <div className="mx-6 mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-3">
          <h3 className="font-bold text-emerald-800">Confirm Booking Inline</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400">Total Amount</label>
              <Input type="number" value={confirmTotal} onChange={e => setConfirmTotal(e.target.value)} className="h-8 text-xs font-mono bg-white" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400">Advance Paid</label>
              <Input type="number" value={confirmAdvance} onChange={e => setConfirmAdvance(e.target.value)} className="h-8 text-xs font-mono bg-white" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400">Mode</label>
              <Select value={confirmMode} onValueChange={setConfirmMode}>
                <SelectTrigger className="h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="UPI">UPI</SelectItem><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Bank Transfer">Bank Transfer</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400">Train Ticket Status</label>
              <Select value={confirmTrainStatus} onValueChange={setConfirmTrainStatus}>
                <SelectTrigger className="h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="BOOKED">Booked</SelectItem>
                  <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="RAC">RAC</SelectItem>
                  <SelectItem value="SELF_BOOKED">Self booked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-slate-400">Email</label>
              <Input type="email" value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} className="h-8 text-xs bg-white" />
            </div>
          </div>
          {confirmTrainStatus !== 'SELF_BOOKED' && (
            <div className="flex flex-col gap-2 p-2 bg-emerald-100/60 rounded border border-emerald-200/50 max-w-md">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="sendTrainWithEmail" 
                  checked={confirmSendTicket} 
                  onChange={e => setConfirmSendTicket(e.target.checked)} 
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                />
                <label htmlFor="sendTrainWithEmail" className="text-[10px] font-bold text-emerald-800 cursor-pointer select-none">
                  Include train ticket confirmation details inside email
                </label>
              </div>
              {confirmSendTicket && (
                <div className="space-y-1.5 pl-5">
                  <label className="block text-[9px] font-bold uppercase text-slate-600">Attach Train Tickets / Voucher Files (Multiple Supported)</label>
                  <input 
                    type="file" 
                    multiple
                    accept=".pdf,image/*"
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const base64Str = reader.result as string;
                            const base64Data = base64Str.split(',')[1] || base64Str;
                            setConfirmTicketFilesList(prev => {
                              if (prev.some(f => f.name === file.name)) return prev;
                              return [...prev, { name: file.name, content: base64Data }];
                            });
                          };
                          reader.readAsDataURL(file);
                        });
                      }
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  />
                  {confirmTicketFilesList.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] text-emerald-800 font-extrabold">Attached Files ({confirmTicketFilesList.length}):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {confirmTicketFilesList.map((f, fIdx) => (
                          <div key={fIdx} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white border border-emerald-300 text-[10px] font-mono font-bold text-slate-700 shadow-2xs">
                            <span className="truncate max-w-[200px]">{f.name}</span>
                            <button 
                              type="button" 
                              onClick={() => setConfirmTicketFilesList(prev => prev.filter((_, i) => i !== fIdx))}
                              className="text-slate-400 hover:text-rose-600 font-black cursor-pointer"
                              title="Remove file"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2 border-t">
            <button onClick={() => setIsConfirming(false)} className="bg-white border text-slate-655 px-4 py-1.5 rounded">Cancel</button>
            <button onClick={handleConfirmSubmit} disabled={confirmingLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-1.5 rounded">{confirmingLoading ? "Confirming..." : "Confirm Booking"}</button>
          </div>
        </div>
      )}

      {/* ─── KPI Strip ─── */}
      <div className="workspace-kpi-strip sticky top-[53px] z-20">
        <div className="workspace-kpi-card" onClick={() => setAdminActiveTab("payments")}>
          <div className="text-[10px] uppercase font-semibold text-slate-400">Payment</div>
          <div className="text-base font-bold text-slate-800">₹{(booking.totalAmount || 0).toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 font-medium">Due ₹{booking.remainingAmount.toLocaleString('en-IN')}</div>
        </div>
        <div className="workspace-kpi-card" onClick={() => setAdminActiveTab("passengers")}>
          <div className="text-[10px] uppercase font-semibold text-slate-400">Passengers</div>
          <div className="text-base font-bold text-slate-800">{qty}</div>
          <div className="text-[11px] text-slate-500 font-medium">Confirmed</div>
        </div>
        <div className="workspace-kpi-card">
          <div className="text-[10px] uppercase font-semibold text-slate-400">Departure</div>
          <div className="text-base font-bold text-slate-800">{daysToGo}</div>
          <div className="text-[11px] text-slate-500 font-medium">Days to go</div>
        </div>
        <div className="workspace-kpi-card" onClick={() => setAdminActiveTab("operations")}>
          <div className="text-[10px] uppercase font-semibold text-slate-400">Operations</div>
          <div className="text-base font-bold text-slate-800">2/6</div>
          <div className="text-[11px] text-emerald-600 font-semibold">Booked</div>
        </div>
        <div className="workspace-kpi-card" onClick={() => setAdminActiveTab("ticketing")}>
          <div className="text-[10px] uppercase font-semibold text-slate-400">Ticketing</div>
          <div className="text-base font-bold text-slate-800">{booking.ticketStatus === "ISSUED" ? "1" : "0"}</div>
          <div className="text-[11px] text-amber-600 font-semibold">Pending</div>
        </div>
        <div className="workspace-kpi-card" onClick={() => setAdminActiveTab("operations")}>
          <div className="text-[10px] uppercase font-semibold text-slate-400">Tasks</div>
          <div className="text-base font-bold text-slate-800">{tasks.length}</div>
          <div className="text-[11px] text-slate-500 font-medium">Open</div>
        </div>
      </div>

      {/* ─── Main Content Split Layout ─── */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto min-h-0">
        {/* Left Column - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">

          {/* Tab Strip */}
          <div className="border-b border-slate-200 bg-white flex gap-4 md:gap-6 overflow-x-auto no-scrollbar sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6">
            {[
              { id: "overview", label: "Overview" },
              { id: "passengers", label: "Passengers" },
              { id: "payments", label: "Payments" },
              { id: "operations", label: "Operations" },
              { id: "ticketing", label: "Ticketing" },
              { id: "accounting", label: "Accounting" },
              { id: "files", label: "Files & Notes" },
              { id: "emails", label: "Email Logs" },
              { id: "activity", label: "Activity" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAdminActiveTab(tab.id)}
                className={cn(
                  "py-2.5 text-[12px] font-bold border-b-2 transition-all whitespace-nowrap",
                  adminActiveTab === tab.id 
                    ? "border-[#F5760E] text-[#F5760E]" 
                    : "border-transparent text-slate-500 hover:text-slate-900"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* === OVERVIEW TAB === */}
          {adminActiveTab === "overview" && (
            <div className="space-y-6">
              {/* Items Needing Attention */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  ⚠️ Items Needing Attention
                </h3>
                <div className="space-y-2.5">
                  {booking.remainingAmount > 0 && (
                    <div className="bg-[#fffbea] border-l-4 border-[#f5760e] rounded-r-lg px-4 py-3 text-xs text-slate-700 flex items-center gap-2.5 shadow-sm">
                      <span className="text-base">💰</span>
                      <span className="font-semibold">Outstanding Balance: ₹{booking.remainingAmount.toLocaleString('en-IN')} due</span>
                    </div>
                  )}
                  <div className="bg-[#fffbea] border-l-4 border-[#f5760e] rounded-r-lg px-4 py-3 text-xs text-slate-700 flex items-center gap-2.5 shadow-sm">
                    <span className="text-base">🎫</span>
                    <span className="font-semibold">1 Ticket pending approval</span>
                  </div>
                </div>
              </div>

              {/* Trip Summary */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Trip Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Package</div>
                    <div className="text-sm font-bold text-slate-800 mt-1">{booking.trainClass || "Sleeper Train"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upgrade</div>
                    <div className="text-sm font-bold text-[#F5760E] mt-1">3AC Available</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between gap-2">
                      <span>Departure</span>
                      {canManageBooking && !isExpired && (
                        <button 
                          onClick={() => {
                            setNewDepartureDate(getInitialDateString(booking.departureDate));
                            setChangeReason("");
                            setShowChangeDates(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-[10px] font-semibold flex items-center gap-0.5"
                        >
                          <Pencil className="w-2.5 h-2.5" /> Edit
                        </button>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-800 mt-1">
                      {safeFormatDate(booking.departureDate, { day: '2-digit', month: 'short', year: 'numeric' }, "27 Jul 2026")}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</div>
                    <div className="text-sm font-bold text-slate-800 mt-1">{fullTrip?.duration || 10} Days</div>
                  </div>
                </div>
              </div>

              {/* Departure History */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Departure History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-250 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-4 py-2.5">Departure Date</th>
                        <th className="px-4 py-2.5">Return Date</th>
                        <th className="px-4 py-2.5">Changed By</th>
                        <th className="px-4 py-2.5">Updated At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50/50 transition-colors text-slate-700">
                        <td className="px-4 py-3 font-medium">
                          {safeFormatDate(booking.departureDate, { day: '2-digit', month: 'short', year: 'numeric' }, "—")}
                        </td>
                        <td className="px-4 py-3">
                          {booking.departureDate 
                            ? safeFormatDate(new Date(booking.departureDate).getTime() + (fullTrip?.duration || 10)*24*60*60*1000, { day: '2-digit', month: 'short', year: 'numeric' })
                            : "—"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">Sales Admin</td>
                        <td className="px-4 py-3">{safeFormatDate(booking.updatedAt || booking.createdAt, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* === PASSENGERS TAB === */}
          {adminActiveTab === "passengers" && (
            <div className="space-y-4">
{/* Card 4: Passenger Manifest */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-xs">Passengers</h3>
              {canManageBooking && !isExpired ? (
                <button 
                  onClick={() => {
                    setEditingPassenger(null);
                    setNewPassenger({ firstName: "", lastName: "", gender: "Male", age: "", phone: "", email: "", foodPreference: "Normal Food" });
                    setShowAddPassenger(true);
                  }}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] uppercase px-3 py-1 rounded transition-all shadow-sm"
                >
                  + Add passengers
                </button>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Passengers locked
                </span>
              )}
            </div>

            <div className="p-0 overflow-x-auto no-scrollbar">
               <table className="w-full text-left text-xs table-striped min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-2 w-20">Action</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2 w-16">Age</th>
                    <th className="px-4 py-2 w-18">Gender</th>
                    <th className="px-4 py-2 w-40">E-mail</th>
                    <th className="px-4 py-2 w-28">Documents</th>
                    <th className="px-4 py-2 w-32">Room Sharing</th>
                    <th className="px-4 py-2 w-32">Food Preference</th>
                    <th className="px-4 py-2 w-36">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {passengers.map((p, index) => {
                    const hasDocs = true;
                    
                    // Room sharing option label helper
                    const getRoomSharingLabel = (roomType: string) => {
                      if (!roomType) return "Double";
                      const lower = roomType.toLowerCase();
                      if (lower.includes("quad")) return "Quad";
                      if (lower.includes("triple")) return "Triple";
                      if (lower.includes("couple") || lower.includes("double")) return "Double";
                      return roomType;
                    };

                    // Train status check helper
                    const getPassengerStatus = (passengerName: string) => {
                      const ticket = tickets.find(t => t.travelerName === passengerName);
                      if (ticket) {
                        if (ticket.ticketStatus === "RAC") {
                          return {
                            label: `${ticket.sourceStation || "Ahmedabad"} (RAC)`,
                            colorClass: 'bg-amber-50 text-amber-700 border-amber-200'
                          };
                        }
                        if (ticket.ticketStatus === "WAITLISTED") {
                          return {
                            label: `${ticket.sourceStation || "Ahmedabad"} (WL)`,
                            colorClass: 'bg-amber-50 text-amber-700 border-amber-200'
                          };
                        }
                        if (ticket.ticketStatus === "SELF_BOOKED") {
                          return {
                            label: "Self Booked",
                            colorClass: 'bg-purple-50 text-purple-700 border-purple-200'
                          };
                        }
                        if (ticket.ticketStatus === "PENDING") {
                          return {
                            label: "Pending",
                            colorClass: 'bg-slate-50 text-slate-700 border-slate-200'
                          };
                        }
                        if (ticket.ticketStatus === "BOOKED") {
                          return {
                            label: "Booked",
                            colorClass: 'bg-blue-50 text-blue-700 border-blue-200'
                          };
                        }
                        if (ticket.ticketStatus === "CONFIRMED") {
                          return {
                            label: "Confirmed",
                            colorClass: 'bg-green-50 text-green-700 border-green-200'
                          };
                        }
                      }
                      return {
                        label: "Confirmed",
                        colorClass: 'bg-green-50 text-green-700 border-green-200'
                      };
                    };

                    const passStatus = getPassengerStatus(p.name);

                    return (
                      <tr key={p.id || index}>
                        {/* Action buttons */}
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {canManageBooking && !isExpired ? (
                              <>
                                <button 
                                  onClick={() => handleEditPassenger(p)}
                                  className="p-1 text-slate-400 hover:text-slate-700 border border-slate-200 bg-slate-50/60 rounded"
                                  title="Edit details"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={async () => {
                                    if (confirm(`Remove passenger ${p.name}?`)) {
                                      const updated = passengers.filter(x => x.id !== p.id);
                                      setPassengers(updated);
                                      try {
                                        await syncBookingDataWithPassengers(updated);
                                        toast.success("Passenger removed and booking items updated");
                                        onRefresh();
                                      } catch (e) {
                                        toast.error("Failed to sync delete passenger and update items");
                                      }
                                    }
                                  }}
                                  className="p-1 text-red-400 hover:text-red-600 border border-slate-200 bg-slate-50/60 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">—</span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 font-bold text-slate-800">
                          {p.name || "N/A"}
                        </td>
                        <td className="px-4 py-3 font-mono">{p.age}</td>
                        <td className="px-4 py-3">{p.gender}</td>
                        <td className="px-4 py-3 font-mono text-slate-500 truncate max-w-[120px]">{p.email || 'N/A'}</td>
                        
                        {/* Documents */}
                        <td className="px-4 py-3">
                          {(() => {
                            const isGuide = currentAdmin?.role === 'guide';
                            const isSales = currentAdmin?.role === 'sales';
                            const isOwnBooking = booking.salesAdminId === currentAdmin?.id;
                            const canAccessDocs = !isGuide && (!isSales || isOwnBooking);

                            if (!canAccessDocs) {
                              return <span className="text-slate-400 font-medium">—</span>;
                            }

                            const passengerDoc = (booking as any).documents?.find((d: any) => d.passengerId === p.id);

                            return (
                              <div className="flex flex-col gap-1 items-start">
                                <input
                                  type="file"
                                  id={`doc-file-${p.id}`}
                                  className="hidden"
                                  accept=".jpg,.jpeg,.png,.pdf"
                                  onChange={(e) => handleFileChange(e, p.id)}
                                />
                                {passengerDoc ? (
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]" title={passengerDoc.originalFileName}>
                                      📄 {passengerDoc.originalFileName}
                                    </span>
                                    <div className="flex gap-1.5 items-center">
                                      <button
                                        type="button"
                                        onClick={() => handleViewDoc(p.id, passengerDoc.originalFileName)}
                                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase transition-colors"
                                      >
                                        View
                                      </button>
                                      <span className="text-slate-300 text-[10px]">|</span>
                                      <button
                                        type="button"
                                        onClick={() => document.getElementById(`doc-file-${p.id}`)?.click()}
                                        className="text-[10px] text-slate-500 hover:text-slate-700 font-bold uppercase transition-colors"
                                      >
                                        Replace
                                      </button>
                                      <span className="text-slate-300 text-[10px]">|</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDoc(p.id)}
                                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold uppercase transition-colors"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById(`doc-file-${p.id}`)?.click()}
                                    className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-bold py-1 px-2.5 rounded transition-all shadow-sm uppercase tracking-wider"
                                  >
                                    Add Document
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Room Sharing */}
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {getRoomSharingLabel(booking.roomType)}
                        </td>

                        {/* Food Preference */}
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                            (p.foodPreference || "").toLowerCase() === 'jain food' || (p.foodPreference || "").toLowerCase() === 'jain'
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-green-50 text-green-700 border-green-200'
                          )}>
                            {p.foodPreference || 'Normal Food'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                            passStatus.colorClass
                          )}>
                            {passStatus.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
            </div>
          )}

          {/* === PAYMENTS TAB === */}
          {adminActiveTab === "payments" && (
            <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-slate-800 text-xs">Payments</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 uppercase font-mono">
                  Balance ₹ {booking.remainingAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <button 
                onClick={() => {
                  setPayAmount(booking.remainingAmount.toString());
                  setPaymentSource('collected');
                  setPayMode("UPI");
                  setPayComments("");
                  setShowCreatePayment(true);
                }}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] uppercase px-3 py-1 rounded transition-all shadow-sm"
              >
                + Payment
              </button>
            </div>

            {/* Inline Payment Submission block */}
            {showAddPaymentInline && (
              <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-3">
                <p className="font-bold text-slate-850">Record Manual Payment</p>
                <div className="flex gap-3 flex-wrap">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400">Amount Paid</label>
                    <Input 
                      type="number" 
                      value={newPaymentAmount} 
                      onChange={e => setNewPaymentAmount(e.target.value)} 
                      placeholder="₹"
                      className="h-8 text-xs w-28" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400">Payment Mode</label>
                    <Select value={newPaymentMode} onValueChange={setNewPaymentMode}>
                      <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-1.5">
                    <Button 
                      onClick={handleAddPaymentSubmit}
                      disabled={recordingPayment}
                      size="sm" 
                      className="bg-slate-900 text-white text-[10px] font-bold uppercase h-8 px-3.5 rounded"
                    >
                      {recordingPayment ? 'Recording...' : 'Record'}
                    </Button>
                    <Button 
                      onClick={() => setShowAddPaymentInline(false)}
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-400 hover:text-slate-800 h-8 text-[10px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs section */}
            <div className="border-b border-slate-100 flex">
              {(['successful', 'outstanding', 'failed'] as const).map(tabName => (
                <button
                  key={tabName}
                  onClick={() => setPaymentTab(tabName)}
                  className={cn("px-4 py-2 text-[10px] uppercase tracking-wide font-bold border-b-2 transition-all", 
                    paymentTab === tabName 
                      ? "border-primary text-primary bg-slate-50/40" 
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  )}
                >
                  {tabName === 'successful' ? 'Successful' : tabName === 'outstanding' ? 'Outstanding Requests' : 'Expired/Failed'}
                </button>
              ))}
            </div>

            {/* Active Tab Panel */}
            <div className="p-5">
              {paymentTab === 'successful' && (
                paymentsList.length > 0 ? (
                  <div className="border border-slate-200/60 rounded overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                          <th className="px-4 py-2">Payment comments</th>
                          <th className="px-4 py-2">Ref num</th>
                          <th className="px-4 py-2 text-right">Amt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paymentsList.map((p: any) => {
                          const isExpanded = expandedPaymentId === p.id;
                          const processor = p.paymentMode === 'Cash' || p.paymentMode === 'UPI' || p.paymentMode === 'Bank Transfer' ? 'payments.offlinepayment' : 'online';
                          const displayDate = safeFormatDateTime(p.createdAt, {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: false
                          });
                          
                          return (
                            <React.Fragment key={p.id}>
                              <tr 
                                className="text-slate-700 hover:bg-slate-50/50 cursor-pointer"
                                onClick={() => setExpandedPaymentId(isExpanded ? null : p.id)}
                              >
                                <td className="px-4 py-3 font-semibold flex items-center gap-1.5">
                                  <span className="text-[8px] font-bold px-1 rounded uppercase bg-slate-200 text-slate-700 font-mono">
                                    {p.paymentMode || 'Unknown'}
                                  </span>
                                  {p.notes || `${booking.bookingId} payment`}
                                </td>
                                <td className="px-4 py-3 text-slate-400 font-mono">
                                  {processor}
                                </td>
                                <td className="px-4 py-3 text-right font-bold font-mono">₹ {p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              </tr>
                              {isExpanded && (
                                <tr key={`${p.id}-details`} className="bg-slate-50/50">
                                  <td colSpan={3} className="px-6 py-4 border-t border-b border-slate-200">
                                    <div className="max-w-xl space-y-2 text-xs text-slate-750">
                                      <div className="grid grid-cols-3 gap-y-1.5 py-1 border-b border-slate-200/60">
                                        <span className="text-red-600 font-bold">Processor</span>
                                        <span className="col-span-2 font-mono text-slate-600">{processor}</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-y-1.5 py-1 border-b border-slate-200/60">
                                        <span className="text-red-600 font-bold">Successful at</span>
                                        <span className="col-span-2 text-slate-600">
                                          {displayDate} <span className="text-[10px] text-slate-400 ml-1">initiated via backoffice</span>
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-y-1.5 py-1 border-b border-slate-200/60">
                                        <span className="text-red-600 font-bold">Payment mode</span>
                                        <span className="col-span-2 font-bold text-slate-800">{p.paymentMode || 'Unknown'}</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-y-1.5 py-1 border-b border-slate-200/60">
                                        <span className="text-red-600 font-bold">Merchant Ref#</span>
                                        <span className="col-span-2 font-mono text-slate-600">{p.transactionId || `${booking.bookingId}-${p.id.slice(-6)}`}</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-y-1.5 py-1 border-b border-slate-200/60">
                                        <span className="text-red-600 font-bold">Comments</span>
                                        <span className="col-span-2 text-slate-600">{p.notes || `Payment for booking ${booking.bookingId}`}</span>
                                      </div>
                                      <div className="flex gap-2 pt-2.5">
                                        <button 
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            const reason = prompt("Refund reason / reference (required):");
                                            if (!reason) return;
                                            try {
                                              await paymentsService.refund(p.id, { reason, amount: p.amount });
                                              toast.success("Refund recorded and payment reversed!");
                                              onRefresh();
                                            } catch (err: any) {
                                              toast.error(err?.response?.data?.message || "Refund failed");
                                            }
                                          }}
                                          className="bg-[#31b0d5] hover:bg-[#269abc] text-white font-bold uppercase text-[9px] px-3.5 py-1.5 rounded transition-all shadow-sm"
                                        >
                                          Refund
                                        </button>
                                        <button 
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            const reason = prompt("Reversal reason / reference (required):");
                                            if (!reason) return;
                                            try {
                                              await paymentsService.reverse(p.id, { reason });
                                              toast.success("Payment reversed!");
                                              onRefresh();
                                            } catch (err: any) {
                                              toast.error(err?.response?.data?.message || "Reversal failed");
                                            }
                                          }}
                                          className="bg-[#f0ad4e] hover:bg-[#ec971f] text-white font-bold uppercase text-[9px] px-3.5 py-1.5 rounded transition-all shadow-sm"
                                        >
                                          Reverse
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 text-center text-slate-400">
                    <CreditCard className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-[11px] italic mb-3">No successful payments yet</p>
                    <button 
                      onClick={() => {
                        setPayAmount(booking.remainingAmount.toString());
                        setPaymentSource('collected');
                        setPayMode("UPI");
                        setPayComments("");
                        setShowCreatePayment(true);
                      }}
                      className="bg-primary hover:bg-primary/95 text-white font-bold text-[9px] uppercase px-4 py-1.5 rounded transition-all shadow-sm"
                    >
                      + Create Payment Request
                    </button>
                  </div>
                )
              )}

              {paymentTab === 'outstanding' && (
                booking.remainingAmount > 0 ? (
                  <div className="border border-slate-200/60 rounded overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="px-4 py-2">Request Type</th>
                          <th className="px-4 py-2">Updated At</th>
                          <th className="px-4 py-2 text-right">Outstanding</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-slate-700">
                          <td className="px-4 py-3 font-semibold">
                            Balance Payment due collection
                            <span className="ml-2 text-[8px] font-bold bg-amber-50 text-amber-600 border border-amber-250 px-1 py-0.2 rounded uppercase">PENDING</span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 font-mono">
                            {safeFormatDate(booking.updatedAt, { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="px-4 py-3 text-right font-bold font-mono text-red-650">₹ {booking.remainingAmount.toLocaleString('en-IN')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic py-2">No outstanding balance requests.</p>
                )
              )}

              {paymentTab === 'failed' && (
                <p className="text-[11px] text-slate-400 italic py-2">No expired or failed payment histories recorded.</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-xs">Additional booking details</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 border border-emerald-250/30 uppercase">
                  Form complete
                </span>
              </div>
              <button 
                onClick={() => {
                  setEditedCustomerName(booking.fullName || booking.name || "");
                  setEditedCustomerPhone(booking.mobile || booking.phone || "");
                  setEditedCustomerEmail(booking.email || "");
                  setIsEditingCustomer(true);
                  toast.info("Please use the guest attributes edit form in the right sidebar!");
                }}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                Edit
              </button>
            </div>

            <div className="p-0">
              <table className="w-full text-left text-xs table-striped">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-2 w-[40%]">Query</th>
                    <th className="px-4 py-2">Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  <tr>
                    <td className="px-4 py-2.5 text-slate-500">Title first name and last name</td>
                    <td className="px-4 py-2.5 text-slate-850 font-bold">{booking.fullName}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-500">Gender</td>
                    <td className="px-4 py-2.5">
                      <span className="bg-slate-150 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                        {booking.gender}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-500">Age</td>
                    <td className="px-4 py-2.5 text-slate-850">{booking.age}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-500">Country code and phone number</td>
                    <td className="px-4 py-2.5 text-slate-850 font-mono">+91 {booking.mobile}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-500">E-mail</td>
                    <td className="px-4 py-2.5 text-slate-850 font-mono">{booking.email || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-500">Newsletter signup</td>
                    <td className="px-4 py-2.5 text-slate-400 italic">Not specified</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-500">Special Requests / Notes</td>
                    <td className="px-4 py-2.5 text-slate-850">{booking.notes || 'Not specified'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
            </div>
          )}

          {/* === OPERATIONS TAB === */}
          {adminActiveTab === "operations" && (
            <div className="space-y-4">
{/* Team Interaction & Booking Tasks */}
          <div className="bg-white border border-slate-200 rounded p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h4 className="font-black text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-4 h-4 text-primary" /> Team Interaction & Tasks
              </h4>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowCreateTask(true)}
                className="h-7 text-[9px] font-bold uppercase rounded"
              >
                Assign Task
              </Button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {loadingTasks ? (
                <p className="text-[10px] text-slate-450 italic">Loading tasks...</p>
              ) : tasks.length === 0 ? (
                <p className="text-[10px] text-slate-450 italic">No tasks assigned for this booking.</p>
              ) : (
                tasks.map((task: any) => (
                  <div key={task.id} className="p-3 bg-slate-50/70 border border-slate-150 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-slate-800 text-xs">{task.title}</h5>
                        {task.description && <p className="text-[10px] text-slate-500">{task.description}</p>}
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                        task.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700" :
                        task.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[9px] text-slate-400 font-medium">
                      <span>By <b>{task.assignedBy?.name}</b> &rarr; <b>{task.assignedTo?.name}</b></span>
                      {task.dueDate && <span>Due: {safeFormatDate(task.dueDate)}</span>}
                    </div>

                    {task.status !== 'COMPLETED' && (
                      <div className="flex gap-2 justify-end pt-1 border-t border-slate-100">
                        {task.status === 'PENDING' && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                            className="h-6 px-2 text-[8px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 uppercase"
                          >
                            Mark In Progress
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                          className="h-6 px-2 text-[8px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 uppercase"
                        >
                          Mark Completed
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
            </div>
          )}

          {/* === TICKETING TAB === */}
          {adminActiveTab === "ticketing" && (
            <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider pb-2 border-b">
                Ticket Booking & PNR Details
              </h4>
              <TrainTicketsPanel bookingId={booking.id} booking={booking} passengers={passengers} onCountChange={() => {}} />
            </div>
          )}

          {/* === ACCOUNTING TAB === */}
          {adminActiveTab === "accounting" && (
            <div className="space-y-4">
{/* Card 1: Booking Items */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-xs">Booking Items</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded shadow-sm">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Passenger Details
                </span>
              </div>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => {
                    setNewDepartureDate(getInitialDateString(booking.departureDate));
                    setShowChangeDates(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded transition-all shadow-sm"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Change dates
                </button>
                <button 
                  onClick={() => {
                    // Pre-populate dynamic names so they are directly editable in the input fields
                    const populatedItems = bookingItems.map(item => {
                      let displayName = item.name;
                      if (!item.name.startsWith("Pickup:") && (item.name.toLowerCase().includes("train") || item.name.toLowerCase().includes("sleeper"))) {
                        const is3ac = (item.name.toLowerCase().includes("3ac") || item.name.toLowerCase().includes("3-tier") || item.name.toLowerCase().includes("3c") || item.name.toLowerCase().includes("ac")) && !(item.name.toLowerCase().includes("non ac") || item.name.toLowerCase().includes("non-ac"));
                        displayName = `Pickup: ${(booking.pickupCity || 'AHMEDABAD').toUpperCase()}, Drop: ${(fullTrip?.location || 'GANDHINAGAR').toUpperCase()} ${is3ac ? '3TIER AC' : 'Non AC'} Sleeper`;
                      }
                      return { ...item, name: displayName };
                    });
                    setBookingItems(populatedItems);
                    setEditRate((booking.baseAmount || itemRate).toFixed(0));
                    setEditQty(qty.toString());
                    setEditDiscount("");
                    setIsEditingItems(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded transition-all shadow-sm"
                >
                  <Pencil className="w-3 h-3 text-slate-500" />
                  Edit
                </button>
              </div>
            </div>
            
            {isEditingItems ? (
              /* ─── EDIT BOOKING ITEMS MODE (VACATIONLABS STYLE) ─── */
              <div className="p-5 space-y-5 text-xs bg-[#fafbfc]">
                
                {/* Header notes */}
                <div className="bg-[#f8fafc] border border-slate-200/80 rounded-lg p-4 text-slate-600 shadow-sm leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <span className="text-amber-500 text-base mt-0.5">⚠️</span>
                    <div>
                      <p className="font-bold text-slate-800 mb-1">Impact Warning</p>
                      <p className="text-[11px] text-slate-500">Editing booking items directly modifies rates & final billing amounts. You can manually adjust line items or use the presets below. Remember to click <strong>Update</strong> to preview totals before saving.</p>
                    </div>
                  </div>
                </div>

                {/* Subactions bar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 flex-wrap gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Passengers</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => toast.info("Passengers are automatically selected.")} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded text-[11px] font-semibold text-slate-700 shadow-sm transition-all">Special Charge/Discount</button>
                    <button type="button" onClick={() => toast.info("No coupons available for this trip.")} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded text-[11px] font-semibold text-slate-700 shadow-sm transition-all">Coupon</button>
                    <button type="button" onClick={() => toast.info("No addons configured for this trip.")} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded text-[11px] font-semibold text-slate-700 shadow-sm transition-all">Addon (0 Available)</button>
                  </div>
                </div>

                {/* Table for inputs */}
                <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-5 py-3">Name & Description</th>
                        <th className="px-5 py-3 w-32">Rate</th>
                        <th className="px-5 py-3 w-24">Quantity</th>
                        <th className="px-5 py-3 w-36 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {bookingItems
                        .filter(item => item.qty > 0 || item.rate < 0)
                        .map((item, index) => {
                          return (
                            <tr key={item.id || index} className="hover:bg-slate-50/30 transition-colors duration-150">
                              <td className="px-5 py-3.5">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="text"
                                      value={item.name}
                                      onChange={e => {
                                        const updated = bookingItems.map(x => x.id === item.id ? { ...x, name: e.target.value } : x);
                                        setBookingItems(updated);
                                      }}
                                      className="h-8 text-xs font-bold text-slate-800 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400 w-full"
                                    />
                                  </div>
                                {item.name.toLowerCase().includes("nonac") && (
                                  <p className="text-[10px] text-slate-400">Get Non-AC Sleeper Train Tickets for Upward & Return journey</p>
                                )}
                                {item.name.toLowerCase().includes("3ac") && (
                                  <p className="text-[10px] text-slate-400">Get 3-Tier AC Train Tickets for Upward & Return journey</p>
                                )}
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const updated = bookingItems.filter(x => x.id !== item.id);
                                    setBookingItems(updated);
                                    toast.success("Item removed");
                                  }} 
                                  className="text-[10px] text-rose-500 font-bold hover:text-rose-700 hover:underline transition-colors mt-1 block"
                                >
                                  Remove item
                                </button>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 font-mono text-xs">₹</span>
                                <Input 
                                  type="number"
                                  value={item.rate}
                                  onChange={e => {
                                    const updated = bookingItems.map(x => x.id === item.id ? { ...x, rate: parseFloat(e.target.value) || 0 } : x);
                                    setBookingItems(updated);
                                  }}
                                  className="h-8 text-xs w-24 font-mono font-semibold border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400"
                                />
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <Input 
                                type="number"
                                value={item.qty}
                                onChange={e => {
                                  const updated = bookingItems.map(x => x.id === item.id ? { ...x, qty: parseInt(e.target.value) || 0 } : x);
                                  setBookingItems(updated);
                                }}
                                className="h-8 text-xs w-16 font-mono font-semibold border-slate-200 text-center focus-visible:ring-1 focus-visible:ring-slate-400"
                              />
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold font-mono text-[12px] text-slate-800">
                              ₹ {(item.rate * item.qty).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Custom item input line */}
                      <tr className="bg-slate-50/20">
                        <td className="px-5 py-4">
                          <Input 
                            placeholder="Add custom item description (e.g. GST Discount)"
                            value={customDescription}
                            onChange={e => setCustomDescription(e.target.value)}
                            className="h-8.5 text-xs w-full border-slate-200 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-450"
                          />
                          {customDescription && (
                            <button 
                              type="button" 
                              onClick={() => { setCustomDescription(""); setCustomRate(""); setCustomQty("1"); }}
                              className="text-[10px] text-rose-500 font-bold hover:underline mt-1 block"
                            >
                              Clear custom input
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-mono text-xs">₹</span>
                            <Input 
                              placeholder="Rate"
                              type="number"
                              value={customRate}
                              onChange={e => setCustomRate(e.target.value)}
                              className="h-8.5 text-xs w-24 font-mono border-slate-200 text-slate-800 focus-visible:ring-1 focus-visible:ring-slate-450"
                            />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Input 
                            type="number"
                            value={customQty}
                            onChange={e => setCustomQty(e.target.value)}
                            className="h-8.5 text-xs w-16 font-mono border-slate-200 text-center focus-visible:ring-1 focus-visible:ring-slate-450"
                          />
                        </td>
                        <td className="px-5 py-4 text-right font-bold font-mono text-[12px] text-slate-800">
                          ₹ {((parseFloat(customRate) || 0) * (parseInt(customQty) || 1)).toLocaleString('en-IN')}
                        </td>
                      </tr>

                      {/* Live Breakdown in Edit Mode */}
                      <tr className="bg-slate-550/5 border-t border-slate-150">
                        <td colSpan={3} className="px-5 py-2.5 text-right font-semibold text-slate-500 text-[10px] uppercase tracking-wider">Base Price Preview</td>
                        <td className="px-5 py-2.5 text-right font-mono font-bold text-slate-700">₹ {previewBasePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="bg-slate-550/5">
                        <td colSpan={3} className="px-5 py-2.5 text-right font-semibold text-slate-500 text-[10px] uppercase tracking-wider">GST ({Math.round(gstRate * 100)}%) Preview</td>
                        <td className="px-5 py-2.5 text-right font-mono font-bold text-slate-700">₹ {previewGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                      {previewGstDiscount > 0 && (
                        <tr className="bg-slate-550/5">
                          <td colSpan={3} className="px-5 py-2.5 text-right font-bold text-rose-600 text-[10px] uppercase tracking-wider">GST Discount</td>
                          <td className="px-5 py-2.5 text-right font-mono font-bold text-rose-600">-₹ {previewGstDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      )}
                      <tr className="bg-slate-900 text-white">
                        <td colSpan={3} className="px-5 py-3.5 text-right text-[11px] uppercase tracking-wider text-slate-300 font-bold align-middle">
                          <div className="flex items-center justify-end gap-3.5">
                            <span>Final Total Preview</span>
                            <button 
                              type="button" 
                              onClick={handleUpdateTotal} 
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] uppercase tracking-wider rounded font-bold transition-all shadow-sm"
                            >
                              Update
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-extrabold font-mono text-base text-emerald-400 align-middle">
                          ₹ {previewFinalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Dropdowns to add Room Sharing Options */}
                <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-sm">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Add Travel Options</label>
                    <div className="flex gap-2">
                      <Select value={selectedTravelOptionToAdd} onValueChange={setSelectedTravelOptionToAdd}>
                        <SelectTrigger className="h-9 text-xs flex-1 bg-white border-slate-200 shadow-sm">
                          <SelectValue placeholder="Select Travel Option" />
                        </SelectTrigger>
                        <SelectContent>
                          {fullTrip?.travelOptions?.map((opt: any, idx: number) => (
                            <SelectItem key={idx} value={JSON.stringify(opt)} className="text-xs">
                              {opt.label} (+₹{opt.priceDelta || 0})
                            </SelectItem>
                          ))}
                          {(!fullTrip?.travelOptions || fullTrip.travelOptions.length === 0) && (
                            <>
                              <SelectItem value={JSON.stringify({ label: "Ahmedabad/Gandhinagar NonAC Sleeper Train", priceDelta: 0 })} className="text-xs">
                                Ahmedabad/Gandhinagar NonAC Sleeper Train
                              </SelectItem>
                              <SelectItem value={JSON.stringify({ label: "Ahmedabad/Gandhinagar 3AC Train", priceDelta: 3000 })} className="text-xs">
                                Ahmedabad/Gandhinagar 3AC Train
                              </SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <button 
                        type="button" 
                        onClick={() => {
                          if (!selectedTravelOptionToAdd) return toast.error("Select a travel option first");
                          const opt = JSON.parse(selectedTravelOptionToAdd);
                          const existingIdx = bookingItems.findIndex(item => item.name === opt.label);
                          if (existingIdx > -1) {
                            const updated = [...bookingItems];
                            updated[existingIdx].qty += 1;
                            setBookingItems(updated);
                          } else {
                            setBookingItems([...bookingItems, {
                              id: opt.label.replace(/\s+/g, '_').toLowerCase(),
                              name: opt.label,
                              rate: fullTrip?.price ? (fullTrip.price + (opt.priceDelta || 0)) : 14999,
                              qty: 1
                            }]);
                          }
                          toast.success(`${opt.label} added to items`);
                        }}
                        className="h-9 w-9 flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Add Room Sharing Options</label>
                    <div className="flex gap-2">
                      <Select value={selectedRoomOptionToAdd} onValueChange={setSelectedRoomOptionToAdd}>
                        <SelectTrigger className="h-9 text-xs flex-1 bg-white border-slate-200 shadow-sm">
                          <SelectValue placeholder="Select Room Option" />
                        </SelectTrigger>
                        <SelectContent>
                          {fullTrip?.roomOptions?.map((opt: any, idx: number) => (
                            <SelectItem key={idx} value={JSON.stringify(opt)} className="text-xs">
                              {opt.label} (+₹{opt.priceDelta || 0})
                            </SelectItem>
                          ))}
                          {(!fullTrip?.roomOptions || fullTrip.roomOptions.length === 0) && (
                            <>
                              <SelectItem value={JSON.stringify({ label: "Triple Sharing Room", priceDelta: 0 })} className="text-xs">
                                Triple Sharing Room
                              </SelectItem>
                              <SelectItem value={JSON.stringify({ label: "Couple Sharing Room", priceDelta: 2000 })} className="text-xs">
                                Couple Sharing Room
                              </SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <button 
                        type="button" 
                        onClick={() => {
                          if (!selectedRoomOptionToAdd) return toast.error("Select a room option first");
                          const opt = JSON.parse(selectedRoomOptionToAdd);
                          const existingIdx = bookingItems.findIndex(item => item.name === opt.label);
                          if (existingIdx > -1) {
                            const updated = [...bookingItems];
                            updated[existingIdx].qty += 1;
                            setBookingItems(updated);
                          } else {
                            setBookingItems([...bookingItems, {
                              id: opt.label.replace(/\s+/g, '_').toLowerCase(),
                              name: opt.label,
                              rate: opt.priceDelta || 0,
                              qty: 1
                            }]);
                          }
                          toast.success(`${opt.label} added to items`);
                        }}
                        className="h-9 w-9 flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save actions */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <Button 
                    onClick={() => {
                      setIsEditingItems(false);
                      const meta = getSafeMeta(booking);
                      if (meta.bookingItems) setBookingItems(meta.bookingItems);
                    }}
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-500 hover:bg-slate-100 h-9 font-semibold px-4 text-xs rounded-lg transition-colors"
                  >
                    Discard Changes
                  </Button>
                  <Button 
                    onClick={handleSaveBookingItems}
                    size="sm" 
                    className="bg-[#C9A84C] hover:bg-[#b0913b] text-white h-9 font-bold px-5 text-xs rounded-lg shadow-md transition-all duration-150"
                  >
                    Save Changes
                  </Button>
                </div>

              </div>
            ) : (
              /* ─── STATIC VIEW (DEFAULT) ─── */
              <div className="p-0 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
                      <th className="px-6 py-3 text-left">Description</th>
                      <th className="px-6 py-3 w-28 text-right">Rate</th>
                      <th className="px-6 py-3 w-20 text-right">Qty</th>
                      <th className="px-6 py-3 w-36 text-right">Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {bookingItems.length > 0 ? (
                      bookingItems
                        .filter(item => item.qty > 0 || item.rate < 0)
                        .map((item, index) => {
                          const isRoom = item.name.toLowerCase().includes("sharing");
                          const isDiscount = item.name.toLowerCase().includes("discount") || item.rate < 0;
                          const badgeText = isDiscount ? "Manual" : "Per-Pax";
                          
                          const absRate = Math.abs(item.rate);
                          const absAmt = Math.abs(item.rate * item.qty);
                          
                          const rateFormatted = (isDiscount ? "- " : "") + absRate.toLocaleString('en-IN', {
                            minimumFractionDigits: absRate % 1 === 0 ? 0 : 2,
                            maximumFractionDigits: 2
                          });
                          const amtFormatted = (isDiscount ? "- " : "") + absAmt.toLocaleString('en-IN', {
                            minimumFractionDigits: absAmt % 1 === 0 ? 0 : 2,
                            maximumFractionDigits: 2
                          });

                          let displayName = item.name;
                          if (!item.name.startsWith("Pickup:") && (item.name.toLowerCase().includes("train") || item.name.toLowerCase().includes("sleeper"))) {
                            const is3ac = (item.name.toLowerCase().includes("3ac") || 
                                          item.name.toLowerCase().includes("3-tier") || 
                                          item.name.toLowerCase().includes("3 tier") || 
                                          item.name.toLowerCase().includes("ac")) && 
                                          !(item.name.toLowerCase().includes("non ac") || 
                                          item.name.toLowerCase().includes("non-ac"));
                            displayName = `Pickup: ${(booking.pickupCity || 'AHMEDABAD').toUpperCase()}, Drop: ${(fullTrip?.location || 'GANDHINAGAR').toUpperCase()} ${is3ac ? '3TIER AC' : 'Non AC'} Sleeper`;
                          }

                          return (
                            <tr key={item.id || index} className="hover:bg-slate-50/30 transition-colors duration-150">
                              <td className="px-6 py-4 font-normal text-slate-800">
                                <span className="bg-[#808080] text-white font-semibold px-1.5 py-0.5 rounded-[3px] text-[10px] mr-2.5 inline-block leading-none">
                                  {badgeText}
                                </span>
                                {displayName}
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-slate-700">{rateFormatted}</td>
                              <td className="px-6 py-4 text-right font-mono text-slate-700">{item.qty}</td>
                              <td className="px-6 py-4 text-right font-semibold font-mono text-slate-900">{amtFormatted}</td>
                            </tr>
                          );
                        })
                    ) : (
                      <tr className="hover:bg-slate-50/30 transition-colors duration-150">
                        <td className="px-6 py-4 font-normal text-slate-800">
                          <span className="bg-[#808080] text-white font-semibold px-1.5 py-0.5 rounded-[3px] text-[10px] mr-2.5 inline-block leading-none">
                            Per-Pax
                          </span>
                          Pickup: {(booking.pickupCity || 'AHMEDABAD').toUpperCase()}, Drop: {(fullTrip?.location || 'GANDHINAGAR').toUpperCase()} {(((booking.trainClass === '3AC' || booking.trainClass?.includes('3AC') || booking.trainClass?.toLowerCase().includes('3-tier') || booking.trainClass?.toLowerCase().includes('3c') || booking.trainClass?.toLowerCase().includes('ac')) && !(booking.trainClass?.toLowerCase().includes('non ac') || booking.trainClass?.toLowerCase().includes('non-ac'))) ? '3TIER AC' : 'Non AC')} Sleeper
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-700">
                          {itemRate.toLocaleString('en-IN', {
                            minimumFractionDigits: itemRate % 1 === 0 ? 0 : 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-700">{qty}</td>
                        <td className="px-6 py-4 text-right font-semibold font-mono text-slate-900">
                          {packageAmt.toLocaleString('en-IN', {
                            minimumFractionDigits: packageAmt % 1 === 0 ? 0 : 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                      </tr>
                    )}
                    {gstAmount > 0 && (
                      <tr className="hover:bg-slate-50/30 transition-colors duration-150">
                        <td className="px-6 py-4 font-normal text-slate-800">
                          GST (Reg no. 24CRFPP3172G1ZT) @ {Math.round(gstRate * 100)}%
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-700">
                          {gstAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: gstAmount % 1 === 0 ? 0 : 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-700">1</td>
                        <td className="px-6 py-4 text-right font-semibold font-mono text-slate-900">
                          {gstAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: gstAmount % 1 === 0 ? 0 : 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-slate-200 bg-white">
                      <td colSpan={3} className="px-6 py-5 text-left font-bold text-slate-800 text-lg">
                        Total
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-slate-900 text-lg">
                        ₹ {(bookingItems.length > 0 && Math.abs(calculatedTotal - booking.totalAmount) > 1 ? calculatedTotal : booking.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
            </div>
          )}

          {/* === FILES TAB === */}
          {adminActiveTab === "files" && (
            <div className="bg-white border border-slate-200 rounded p-5 shadow-sm space-y-4">
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider pb-2 border-b">Files & Notes</h4>
              
              {/* Customer Booking Notes / Special Requests */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Customer Booking Notes / Special Requests</label>
                  {!editingNotes && (
                    <button
                      type="button"
                      onClick={() => setEditingNotes(true)}
                      className="text-[10px] font-bold text-[#F5760E] hover:underline"
                    >
                      Edit Notes
                    </button>
                  )}
                </div>
                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      className="w-full min-h-[100px] text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F5760E] focus:ring-1 focus:ring-[#F5760E]/20"
                      placeholder="Add customer requests or booking notes..."
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingNotes(false)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="px-3 py-1.5 bg-[#F5760E] hover:bg-[#D9650C] text-white rounded text-xs font-semibold disabled:opacity-50"
                      >
                        {savingNotes ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-150 whitespace-pre-wrap">
                    {booking.notes || "No special requests or customer notes recorded."}
                  </p>
                )}
              </div>

              <div className="h-px bg-slate-100" />

              {/* Office Admin Notes */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Office Admin Notes</label>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-150 whitespace-pre-wrap">{booking.adminNotes || "No office notes recorded."}</p>
              </div>
            </div>
          )}

          {/* === EMAILS TAB === */}
          {adminActiveTab === "emails" && (
            <div className="bg-white border border-slate-200 rounded p-5 shadow-sm space-y-4">
              <EmailLogsTimeline contextType="booking" contextId={booking.id} />
            </div>
          )}

          {/* === ACTIVITY TAB === */}
          {adminActiveTab === "activity" && (
            <div className="space-y-4">
{/* Booking Activity Log / Audit Trail */}
          <div className="bg-white border border-slate-200 rounded p-5 shadow-sm space-y-4">
            <h4 className="font-black text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider pb-2 border-b">
              <History className="w-4 h-4 text-slate-450" /> Booking Activity Logs
            </h4>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {loadingActivityLogs ? (
                <p className="text-[10px] text-slate-450 italic">Loading activity logs...</p>
              ) : activityLogs.length === 0 ? (
                <p className="text-[10px] text-slate-450 italic">No activity logs recorded.</p>
              ) : (
                <div className="relative border-l border-slate-200 ml-2.5 pl-4 space-y-4">
                  {activityLogs.map((log: any) => {
                    const actionColors: Record<string, string> = {
                      CREATE: "bg-emerald-500",
                      STATUS_CHANGE: "bg-blue-500",
                      TRAIN_TICKET: "bg-purple-500",
                      PAYMENT_SUBMITTED: "bg-amber-500",
                      PAYMENT_APPROVED: "bg-emerald-600",
                      PAYMENT_REJECTED: "bg-red-500",
                      TASK_ASSIGNED: "bg-indigo-500",
                      TASK_UPDATED: "bg-sky-500",
                      DETAILS_UPDATE: "bg-slate-500",
                    };
                    const color = actionColors[log.action] || "bg-slate-400";
                    return (
                      <div key={log.id} className="relative text-[11px] space-y-1">
                        {/* Timeline dot */}
                        <span className={cn("absolute -left-[21.5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white", color)} />
                        
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[9px]">
                          <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase", color)}>
                            {log.action}
                          </span>
                          <span className="text-slate-400 font-medium">
                            {safeFormatDateTime(log.createdAt, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>

                        <p className="text-slate-700 font-medium leading-relaxed">
                          {log.details}
                        </p>
                        
                        {log.performedBy && (
                          <p className="text-[9px] text-slate-450 font-bold uppercase">
                            By {log.performedBy.name} ({log.performedBy.role})
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
            </div>
          )}

        </div>

        {/* Right Column Sidebar - scrollable */}
        <div className="w-full lg:w-[340px] border-t lg:border-t-0 lg:border-l border-slate-200 p-4 md:p-6 overflow-y-auto flex-shrink-0 space-y-4 font-sans">
          {/* Customer Main Info Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
            {isEditingCustomer ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400">Guest Name</label>
                  <Input 
                    value={editedCustomerName} 
                    onChange={e => setEditedCustomerName(e.target.value)} 
                    className="h-8 text-xs bg-white" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400">Phone</label>
                  <Input 
                    value={editedCustomerPhone} 
                    onChange={e => setEditedCustomerPhone(e.target.value)} 
                    className="h-8 text-xs bg-white" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400">Email</label>
                  <Input 
                    value={editedCustomerEmail} 
                    onChange={e => setEditedCustomerEmail(e.target.value)} 
                    className="h-8 text-xs bg-white" 
                  />
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-[10px] uppercase font-bold" 
                    onClick={() => setIsEditingCustomer(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-7 text-[10px] uppercase font-bold bg-primary text-white" 
                    onClick={async () => {
                      try {
                        const updatedPassengers = passengers.map(p => {
                          if (p.id === 'main' || p.name === booking.fullName || p.name === booking.name) {
                            return {
                              ...p,
                              name: editedCustomerName,
                              phone: editedCustomerPhone,
                              email: editedCustomerEmail
                            };
                          }
                          return p;
                        });
                        await bookingsService.update(booking.id, {
                          fullName: editedCustomerName,
                          mobile: editedCustomerPhone,
                          email: editedCustomerEmail,
                          passengers: updatedPassengers
                        });
                        toast.success("Guest details updated successfully!");
                        setIsEditingCustomer(false);
                        onRefresh();
                      } catch {
                        toast.error("Failed to update guest details");
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 relative group">
                <h2 className="text-lg font-bold text-slate-800 leading-tight flex justify-between items-center">
                  {booking.fullName || booking.name}
                  <button 
                    onClick={() => {
                      setEditedCustomerName(booking.fullName || booking.name || "");
                      setEditedCustomerPhone(booking.mobile || booking.phone || "");
                      setEditedCustomerEmail(booking.email || "");
                      setIsEditingCustomer(true);
                    }} 
                    className="text-primary hover:text-primary-dark ml-2 p-1 rounded hover:bg-slate-50 transition-all border border-slate-100"
                    title="Edit Customer Info"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </h2>
                <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] mt-1.5">
                  <span>📞</span>
                  <span>{booking.mobile || booking.phone || "+91 9978567823"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <span>✉️</span>
                  <span>{booking.email || "sureshchaudhary310@gmail.com"}</span>
                </div>
                <button 
                  onClick={handleViewCustomerTimeline}
                  className="mt-2.5 flex items-center gap-1 text-[9px] font-extrabold uppercase text-[#FF6B00] hover:text-[#E56000] tracking-wider transition-colors hover:underline"
                >
                  View Lifetime Journey →
                </button>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead Source</div>
                <div className="font-semibold text-slate-700 mt-0.5">{booking.leadSource || "Website Booking"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booking Executive</div>
                <div className="font-semibold text-slate-700 mt-0.5">Sales Admin Master</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pickup City</div>
                <div className="font-semibold text-slate-700 mt-0.5">{booking.pickupCity || "Ahmedabad"}</div>
              </div>
            </div>
          </div>

          {/* Internal Note Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 text-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Internal Note</div>
            <div className="bg-[#fafafa] border border-slate-200/80 rounded-lg p-3 text-slate-655 italic leading-relaxed">
              {booking.adminNotes || "Customer prefers morning departures. Has medical requirements - mild asthma."}
            </div>
          </div>

          {/* Tags Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 text-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tags</div>
            <div className="bg-[#fafafa] border border-slate-200/80 rounded-lg p-3 text-center text-slate-400 italic">
              No tags added
            </div>
          </div>

          {/* Automation Actions Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 text-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Automation</div>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleSendEmail('confirmation')} className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded shadow-sm text-center">
                Resend Confirmation
              </button>
              <button onClick={() => handleSendEmail('reminder')} className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded shadow-sm text-center">
                Send Reminder
              </button>
              <button onClick={() => {
                navigator.clipboard.writeText(`https://onlineyouthcamping.net/pay/${booking.bookingId}`);
                toast.success("Payment link copied to clipboard");
              }} className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded shadow-sm text-center">
                Payment Link
              </button>
              <button onClick={() => handleSendEmail('invoice')} className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded shadow-sm text-center">
                Push Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs & Overlays */}
{/* ─── Add/Edit Passenger Dialog Overlay ─── */}
      <Dialog open={showAddPassenger} onOpenChange={(o) => { setShowAddPassenger(o); if(!o) setEditingPassenger(null); }}>
        <DialogContent hideClose className="sm:max-w-[480px] p-0 border border-slate-200 rounded-lg overflow-hidden shadow-premium bg-white">
          <div className="bg-slate-900 px-4 py-3 text-white flex justify-between items-center">
            <DialogTitle className="text-xs font-bold uppercase tracking-wider text-white">
              {editingPassenger ? "Edit Passenger Details" : "Please enter details for new passenger"}
            </DialogTitle>
            <DialogDescription className="sr-only">Passenger registration form</DialogDescription>
            <button 
              onClick={() => { setShowAddPassenger(false); setEditingPassenger(null); }}
              className="text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-5 space-y-3.5 text-xs text-slate-700">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[10.5px]">
              <span className="font-bold text-slate-500 uppercase mr-1">Passenger Option:</span>
              <span className="font-medium">{booking.trainClass} Sleeper, Pickup/Drop: {booking.pickupCity || 'AHMEDABAD'}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400">Salutation</label>
                <Select value={newPassenger.salutation} onValueChange={v => setNewPassenger({...newPassenger, salutation: v})}>
                  <SelectTrigger className="h-8 text-xs rounded"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr." className="text-xs">Mr.</SelectItem>
                    <SelectItem value="Mrs." className="text-xs">Mrs.</SelectItem>
                    <SelectItem value="Ms." className="text-xs">Ms.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400">First Name *</label>
                <Input value={newPassenger.firstName} onChange={e => setNewPassenger({...newPassenger, firstName: e.target.value})} placeholder="First Name" className="h-8 text-xs rounded" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400">Last Name</label>
                <Input value={newPassenger.lastName} onChange={e => setNewPassenger({...newPassenger, lastName: e.target.value})} placeholder="Last Name" className="h-8 text-xs rounded" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400">Gender</label>
                <Select value={newPassenger.gender} onValueChange={v => setNewPassenger({...newPassenger, gender: v})}>
                  <SelectTrigger className="h-8 text-xs rounded"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male" className="text-xs">Male</SelectItem>
                    <SelectItem value="Female" className="text-xs">Female</SelectItem>
                    <SelectItem value="Other" className="text-xs">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400">Age</label>
                <Input type="number" value={newPassenger.age} onChange={e => setNewPassenger({...newPassenger, age: e.target.value})} placeholder="Years" className="h-8 text-xs rounded" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400">Phone number</label>
                <Input value={newPassenger.phone} onChange={e => setNewPassenger({...newPassenger, phone: e.target.value})} placeholder="Phone number" className="h-8 text-xs rounded font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400">E-mail</label>
                <Input value={newPassenger.email} onChange={e => setNewPassenger({...newPassenger, email: e.target.value})} placeholder="Email address" className="h-8 text-xs rounded font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400">Food Preference</label>
                <Select value={newPassenger.foodPreference} onValueChange={v => setNewPassenger({...newPassenger, foodPreference: v})}>
                  <SelectTrigger className="h-8 text-xs rounded"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal Food" className="text-xs">Normal Food</SelectItem>
                    <SelectItem value="Jain Food" className="text-xs">Jain Food</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <p className="text-[9px] text-slate-400 leading-tight">Enter name according to Government ID. Train/Expedition registration tickets will be processed on this identity.</p>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button 
                onClick={() => { setShowAddPassenger(false); setEditingPassenger(null); }}
                className="bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold uppercase text-[9px] px-3.5 h-8 rounded"
              >
                Close
              </button>
              {!editingPassenger && (
                <button 
                  onClick={() => handleSavePassenger(true)}
                  className="bg-[#31b0d5] hover:bg-[#269abc] text-white font-bold uppercase text-[9px] px-4 h-8 rounded"
                >
                  Save & add another
                </button>
              )}
              <button 
                onClick={() => handleSavePassenger(false)}
                className="bg-[#5cb85c] hover:bg-[#449d44] text-white font-bold uppercase text-[9px] px-4 h-8 rounded"
              >
                {editingPassenger ? "Update details" : "Save"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Departure Dates Modal Dialog */}
      <Dialog open={showChangeDates} onOpenChange={setShowChangeDates}>
        <DialogContent hideClose className="sm:max-w-[400px] p-0 border border-slate-200 rounded-lg overflow-hidden shadow-premium bg-white">
          <div className="bg-slate-900 px-4 py-3 text-white flex justify-between items-center">
            <DialogTitle className="text-xs font-bold uppercase tracking-wider text-white">Change departure date</DialogTitle>
            <DialogDescription className="sr-only">Departure date scheduler</DialogDescription>
            <button onClick={() => setShowChangeDates(false)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-4 text-xs text-slate-700">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-450">Departure Date</label>
              <Input 
                type="date"
                value={newDepartureDate}
                onChange={e => setNewDepartureDate(e.target.value)}
                className="h-8 text-xs rounded"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-450">Reason for Change</label>
              <Input 
                type="text"
                placeholder="e.g., Customer requested rescheduling"
                value={changeReason}
                onChange={e => setChangeReason(e.target.value)}
                className="h-8 text-xs rounded"
              />
            </div>
            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button 
                onClick={() => setShowChangeDates(false)}
                className="bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold uppercase text-[9px] px-3.5 h-8 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveDates}
                className="bg-[#5cb85c] hover:bg-[#449d44] text-white font-bold uppercase text-[9px] px-4 h-8 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create a Payment Dialog (VacationLabs Style) */}
      <Dialog open={showCreatePayment} onOpenChange={setShowCreatePayment}>
        <DialogContent hideClose className="sm:max-w-[500px] p-0 border border-slate-200 rounded-lg overflow-hidden shadow-premium bg-white">
          <div className="bg-slate-900 px-4 py-3 text-white flex justify-between items-center">
            <DialogTitle className="text-xs font-bold uppercase tracking-wider text-white">Create a payment</DialogTitle>
            <DialogDescription className="sr-only">Payment transaction logging form</DialogDescription>
            <button onClick={() => setShowCreatePayment(false)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-5 space-y-4 text-xs text-slate-700">
            {/* Payment Source Radios */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase text-slate-400">Payment Source</label>
              <div className="flex items-center gap-4 mt-1">
                <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                  <input 
                    type="radio" 
                    name="paySource"
                    checked={paymentSource === 'collected'}
                    onChange={() => setPaymentSource('collected')}
                    className="text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span>Collected by Us</span>
                </label>
                <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                  <input 
                    type="radio" 
                    name="paySource"
                    checked={paymentSource === 'online'}
                    onChange={() => setPaymentSource('online')}
                    className="text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span>Request it Online</span>
                </label>
                <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                  <input 
                    type="radio" 
                    name="paySource"
                    checked={paymentSource === 'venue'}
                    onChange={() => setPaymentSource('venue')}
                    className="text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span>To be Collected at Venue</span>
                </label>
              </div>
            </div>

            {/* Form parameters depending on Payment Source selection */}
            {paymentSource === 'collected' && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-550">Amount</label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-[10px]">INR</span>
                      <Input 
                        type="number"
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        className="pl-9 h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="w-24">
                      <Select value={payMode} onValueChange={setPayMode}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="-- Select --" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-550">Comments</label>
                  <Input 
                    value={payComments}
                    onChange={e => setPayComments(e.target.value)}
                    placeholder="e.g. YAC 26/05/2026"
                    className="h-8 text-xs rounded"
                  />
                </div>
              </div>
            )}

            {paymentSource === 'online' && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded text-primary animate-fade-in">
                <p className="font-semibold mb-0.5">Online Request Automation:</p>
                <p>Saving this will auto-generate a secure checkout payment link and send it via email reminder to: <strong>{booking.email || 'no-email'}</strong>.</p>
              </div>
            )}

            {paymentSource === 'venue' && (
              <div className="p-3 bg-amber-50 border border-amber-150 rounded text-[#b38515] animate-fade-in">
                <p className="font-semibold mb-0.5">Venue Collection Directive:</p>
                <p>Saving this will mark the remaining balance amount <strong>₹ {booking.remainingAmount.toLocaleString('en-IN')}</strong> to be collected directly from the customer at the trip venue.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button 
                onClick={() => setShowCreatePayment(false)}
                disabled={savingPayment}
                className="bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold uppercase text-[9px] px-3.5 h-8 rounded disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreatePaymentSave}
                disabled={savingPayment}
                className="bg-[#5cb85c] hover:bg-[#449d44] text-white font-bold uppercase text-[9px] px-4 h-8 rounded"
              >
                {savingPayment ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification & Tickets Side Panel */}
      <VerificationDetailsPanel 
        bookingId={booking.bookingId} 
        booking={booking} 
        open={showVerificationPanel} 
        onClose={() => setShowVerificationPanel(false)} 
        onRefresh={() => {
          onRefresh();
          fetchActivityLogs();
        }}
      />
      <EmailComposerDrawer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        contextType="booking"
        contextId={booking.id}
        recipientEmail={booking.email || ""}
        recipientName={booking.fullName || booking.name || ""}
        onSent={onRefresh}
      />
      {/* DIALOG: CUSTOMER LIFETIME JOURNEY */}
      <Dialog open={customerTimelineOpen} onOpenChange={setCustomerTimelineOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[4px] border border-[#E2E8F0] p-5 bg-white max-h-[80vh] overflow-y-auto shadow-xl">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="font-bold uppercase tracking-tight text-xs flex items-center gap-2 text-slate-850">
              👤 Customer Lifetime Journey
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="relative border-l border-slate-200 ml-2.5 pl-4 space-y-4 text-xs font-semibold text-slate-705">
              {customerTimeline.length > 0 ? (
                customerTimeline.map((item, idx) => {
                  const colors: Record<string, string> = {
                    Sales: "bg-[#FF6B00]",
                    Finance: "bg-green-500",
                    Operations: "bg-blue-500",
                    Marketing: "bg-purple-500"
                  };
                  const color = colors[item.type] || "bg-slate-400";
                  return (
                    <div key={idx} className="relative space-y-1">
                      <span className={cn("absolute -left-[21.5px] top-1 w-2 h-2 rounded-full ring-4 ring-white", color)} />
                      <div className="flex items-center justify-between gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        <span className={cn("px-1.5 py-0.2 rounded text-[7px] text-white", color)}>{item.type}</span>
                        <span>{item.date}</span>
                      </div>
                      <p className="text-slate-800 text-xs font-bold leading-normal">{item.action}</p>
                      {item.notes && <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">{item.notes}</p>}
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-400 italic">No timeline entries found.</p>
              )}
            </div>
          </div>
          <DialogFooter className="pt-2 border-t">
            <Button onClick={() => setCustomerTimelineOpen(false)} className="rounded-[4px] font-semibold text-xs h-8.5 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border-none shadow-none">
              Close Profile Journey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ASSIGN TASK TO COLLEAGUE */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-xl shadow-lg border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#F5760E]" /> Assign Task to Colleague
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">
              Assign an operational or administrative task for this booking.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">Task Title *</label>
              <Input 
                required 
                value={taskTitle} 
                onChange={e => setTaskTitle(e.target.value)} 
                placeholder="e.g. Call client for remaining payment" 
                className="h-9 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">Task Description</label>
              <Textarea 
                value={taskDescription} 
                onChange={e => setTaskDescription(e.target.value)} 
                placeholder="e.g. Ask for GPay screenshot" 
                className="text-xs bg-white border border-slate-200 rounded-lg min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500">Assign To *</label>
                <select 
                  required
                  value={taskAssignedTo}
                  onChange={e => setTaskAssignedTo(e.target.value)}
                  className="w-full h-9 text-xs bg-white border border-slate-200 rounded-lg px-2"
                >
                  <option value="">Select colleague...</option>
                  {colleagues.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500">Due Date</label>
                <Input 
                  type="date"
                  value={taskDueDate} 
                  onChange={e => setTaskDueDate(e.target.value)} 
                  className="h-9 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <DialogFooter className="pt-2 flex justify-end gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowCreateTask(false)}
                className="h-9 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={creatingTask} 
                className="h-9 text-xs font-semibold bg-[#F5760E] hover:opacity-90 text-white rounded-lg px-4"
              >
                {creatingTask ? "Assigning..." : "Assign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CANCEL BOOKING & REFUND MODULE */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-[450px] bg-white p-6 rounded-xl shadow-lg border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-rose-600 uppercase tracking-wider flex items-center gap-2">
              ⚠️ Cancel Booking & Process Refund
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400">
              This will cancel the booking workspace, auto-cancel any associated train tickets, and record the refund in the accounting ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-3 text-xs">
            <div className="bg-slate-55 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Advance Paid</p>
                <p className="text-sm font-bold font-mono text-slate-800">₹{(booking.advancePaid || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Booking ID</p>
                <p className="text-sm font-bold font-mono text-slate-800">#{booking.bookingId}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">Reason for Cancellation *</label>
              <Input 
                required 
                value={cancelReason} 
                onChange={e => setCancelReason(e.target.value)} 
                placeholder="e.g. Traveler cancelled at last moment due to emergency" 
                className="h-9 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500">Cancellation Charges (₹)</label>
                <Input 
                  type="number"
                  value={cancelCharges} 
                  onChange={e => {
                    setCancelCharges(e.target.value);
                    const charges = parseFloat(e.target.value) || 0;
                    const advance = booking.advancePaid || 0;
                    setCancelRefund(Math.max(0, advance - charges).toString());
                  }} 
                  className="h-9 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-500">Refund Amount (₹)</label>
                <Input 
                  type="number"
                  value={cancelRefund} 
                  onChange={e => setCancelRefund(e.target.value)} 
                  className="h-9 text-xs bg-white border border-slate-200 rounded-lg font-mono text-emerald-600 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500">Refund Payment Method</label>
              <Select value={cancelRefundMode} onValueChange={setCancelRefundMode}>
                <SelectTrigger className="h-9 text-xs bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI (GPay/PhonePe)</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3 border-t flex justify-end gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowCancelModal(false)}
                className="h-9 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Go Back
              </Button>
              <Button 
                onClick={handleCancelBooking}
                disabled={cancelProcessing} 
                className="h-9 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-4"
              >
                {cancelProcessing ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}