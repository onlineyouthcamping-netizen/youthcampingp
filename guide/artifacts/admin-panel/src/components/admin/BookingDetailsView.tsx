import { useState, useEffect } from "react";
import { 
  Calendar, Users, Pencil, Trash2, Plus, ArrowLeft, Check, X, 
  ChevronRight, CreditCard, Globe, Languages, Tag, MessageSquare, 
  Clock, Send, HelpCircle, User, Phone, Mail, FileText, AlertCircle, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Booking, BookingTrip } from "@/types";
import { toast } from "sonner";
import { bookingsService } from "@/services/bookings.service";
import { paymentsService } from "@/services/payments.service";
import { tripsService } from "@/services/trips.service";
import { settingsService } from "@/services/settings.service";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

interface BookingDetailsViewProps {
  booking: Booking;
  onBack: () => void;
  onRefresh: () => void;
  trips: BookingTrip[];
}

export default function BookingDetailsView({ booking, onBack, onRefresh, trips }: BookingDetailsViewProps) {
  const { admin: currentAdmin } = useAuthStore();

  // Local states
  const [showAddPassenger, setShowAddPassenger] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<any>(null);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [newPassenger, setNewPassenger] = useState({
    firstName: "",
    lastName: "",
    gender: "Male",
    age: "",
    phone: "",
    email: ""
  });
  
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [paymentTab, setPaymentTab] = useState<'successful' | 'outstanding' | 'failed'>('successful');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  
  // Inline confirmation fields
  const [confirmTotal, setConfirmTotal] = useState("");
  const [confirmAdvance, setConfirmAdvance] = useState("");
  const [confirmMode, setConfirmMode] = useState("UPI");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmingLoading, setConfirmingLoading] = useState(false);

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

  // Edit Booking Items state
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editRate, setEditRate] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editDiscount, setEditDiscount] = useState("");
  const [editDiscountLabel, setEditDiscountLabel] = useState("GST Discount");

  // Create payment modal state
  const [showCreatePayment, setShowCreatePayment] = useState(false);
  const [paymentSource, setPaymentSource] = useState<'collected' | 'online' | 'venue'>('collected');
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("UPI");
  const [payComments, setPayComments] = useState("");
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

  // Math helpers matching correct GST + Discount Calculation Order
  const qty = booking.numberOfTravelers || 1;
  const gstRate = (fullTrip?.gstPercentage ?? 5) / 100;
  const packageAmt = booking.baseAmount || (booking.gstAmount ? (booking.totalAmount - booking.gstAmount) : (booking.totalAmount / (1 + gstRate)));
  const itemRate = packageAmt / qty;

  const meta = (booking as any)?.sourceMeta || {};
  const storedItems = meta.bookingItems || [];
  
  let basePrice = 0;
  let gstDiscount = 0;
  
  if (storedItems.length > 0) {
    const activeItems = storedItems.filter((item: any) => item.qty > 0 || item.rate < 0);
    const baseItems = activeItems.filter((item: any) => !(item.name.toLowerCase().includes("discount") || item.rate < 0));
    const discountItems = activeItems.filter((item: any) => item.name.toLowerCase().includes("discount") || item.rate < 0);
    
    basePrice = baseItems.reduce((acc: number, item: any) => acc + (item.rate * item.qty), 0);
    gstDiscount = discountItems.reduce((acc: number, item: any) => acc + Math.abs(item.rate * item.qty), 0);
  } else {
    basePrice = booking.baseAmount || packageAmt;
    gstDiscount = 0;
  }
  
  const gstAmount = Math.round(basePrice * gstRate);
  const totalWithGST = basePrice + gstAmount;
  const calculatedTotal = totalWithGST - gstDiscount;

  // Live preview values during editing
  const previewItems = [...bookingItems];
  if (customDescription && customRate) {
    previewItems.push({
      name: customDescription,
      rate: parseFloat(customRate) || 0,
      qty: parseInt(customQty) || 1
    });
  }
  
  const activePreviewItems = previewItems.filter(item => item.qty > 0 || item.rate < 0);
  const basePreviewItems = activePreviewItems.filter(item => !(item.name.toLowerCase().includes("discount") || item.rate < 0));
  const discountPreviewItems = activePreviewItems.filter(item => item.name.toLowerCase().includes("discount") || item.rate < 0);
  
  const previewBasePrice = basePreviewItems.reduce((acc, item) => acc + (item.rate * item.qty), 0);
  const previewGstDiscount = discountPreviewItems.reduce((acc, item) => acc + Math.abs(item.rate * item.qty), 0);
  
  const previewGstAmount = Math.round(previewBasePrice * gstRate);
  const previewTotalWithGST = previewBasePrice + previewGstAmount;
  const previewFinalTotal = previewTotalWithGST - previewGstDiscount;

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const data = await settingsService.get();
        if (data) setSettings(data);
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    fetchGlobalSettings();
    fetchEmailLogs();
    fetchPayments();
    setNotesValue(booking.notes || "");
    setInternalNotesValue(booking.adminNotes || "");
    setConfirmEmail(booking.email || "");
    setGuestName(booking.fullName || "");
    setGuestEmail(booking.email || "");
    setGuestPhone(booking.mobile || "");
    
    // Set language and source value
    const meta = (booking as any)?.sourceMeta || {};
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
    if (booking.passengers && Array.isArray(booking.passengers) && booking.passengers.length > 0) {
      setPassengers(booking.passengers);
    } else {
      setPassengers([{
        id: 'main',
        name: booking.fullName,
        phone: booking.mobile,
        email: booking.email || "Not specified",
        gender: booking.gender,
        age: booking.age,
        type: `${booking.trainClass} Train`,
        status: 'Form complete'
      }]);
    }

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
          
          const defaultItems: any[] = [];
          
          // Let's check which travel option was selected by the booking
          travOpts.forEach((opt: any) => {
            const isSelected = booking.trainClass && opt.label.toLowerCase().includes(booking.trainClass.toLowerCase());
            defaultItems.push({
              id: opt.label.replace(/\s+/g, '_').toLowerCase(),
              name: opt.label,
              rate: res?.price ? (res.price + (opt.priceDelta || 0)) : (booking.baseAmount || 11999),
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

  const canManageBooking = (() => {
    if (!currentAdmin) return false;
    if (currentAdmin.role === "admin") return true;
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
    if (paymentStatus === "paid") return "Pending Payment";
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
        email: confirmEmail
      });
      toast.success("Booking confirmed successfully!");
      setIsConfirming(false);
      try {
        await bookingsService.sendEmail(booking.id, 'confirmation');
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
      await bookingsService.update(booking.id, { departureDate: newDepartureDate });
      toast.success("Departure date updated successfully!");
      setShowChangeDates(false);
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
      const baseItems = activeItems.filter(item => !(item.name.toLowerCase().includes("discount") || item.rate < 0));
      const discountItems = activeItems.filter(item => item.name.toLowerCase().includes("discount") || item.rate < 0);

      const calculatedBase = baseItems.reduce((acc, item) => acc + (item.rate * item.qty), 0);
      const gstRate = (fullTrip?.gstPercentage ?? 5) / 100;
      const calculatedGst = Math.round(calculatedBase * gstRate);
      const calculatedDiscount = discountItems.reduce((acc, item) => acc + Math.abs(item.rate * item.qty), 0);

      const totalAmount = calculatedBase + calculatedGst - calculatedDiscount;
      const remainingAmount = totalAmount - booking.advancePaid;
      
      const totalQty = baseItems.reduce((acc, item) => acc + item.qty, 0);

      const meta = (booking as any)?.sourceMeta || {};
      const newMeta = {
        ...meta,
        bookingItems: currentItems
      };

      await bookingsService.update(booking.id, {
        totalAmount,
        remainingAmount,
        numberOfTravelers: totalQty || booking.numberOfTravelers || 1,
        baseAmount: calculatedBase,
        gstAmount: calculatedGst,
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
      try {
        await bookingsService.update(booking.id, {
          notes: booking.notes ? `${booking.notes}\n[Collect at Venue]` : `[Collect at Venue]`
        });
        toast.success("Payment configured to be collected at venue!");
        setShowCreatePayment(false);
        onRefresh();
      } catch (e) {
        toast.error("Failed to update payment directives");
      }
    }
  };

  const handleEditPassenger = (p: any) => {
    const names = p.name.split(' ');
    setEditingPassenger(p);
    setNewPassenger({
      firstName: names[0] || "",
      lastName: names.slice(1).join(' ') || "",
      gender: p.gender || "Male",
      age: p.age?.toString() || "",
      phone: p.phone || "",
      email: p.email !== "Not specified" ? p.email : ""
    });
    setShowAddPassenger(true);
  };

  const handleSavePassenger = async (keepOpen = false) => {
    if (!newPassenger.firstName) {
      toast.error("Please enter at least a first name");
      return;
    }

    let updatedPassengers = [];
    if (editingPassenger) {
      updatedPassengers = passengers.map(p => p.id === editingPassenger.id ? {
        ...p,
        name: `${newPassenger.firstName} ${newPassenger.lastName}`,
        phone: newPassenger.phone || "N/A",
        email: newPassenger.email || "N/A",
        gender: newPassenger.gender,
        age: newPassenger.age || "N/A",
      } : p);
      toast.success("Passenger updated");
    } else {
      const passenger = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${newPassenger.firstName} ${newPassenger.lastName}`,
        phone: newPassenger.phone || "N/A",
        email: newPassenger.email || "N/A",
        gender: newPassenger.gender,
        age: newPassenger.age || "N/A",
        type: `${booking.trainClass} Train`,
        status: 'Form complete'
      };
      updatedPassengers = [...passengers, passenger];
      toast.success(`${newPassenger.firstName} added to booking`);
    }
    
    setPassengers(updatedPassengers);
    try {
      await bookingsService.update(booking.id, { passengers: updatedPassengers });
      onRefresh();
    } catch (e) {
      toast.error("Failed to sync passengers with backend");
    }

    setNewPassenger({ firstName: "", lastName: "", gender: "Male", age: "", phone: "", email: "" });
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
    <div className="space-y-4 animate-premium pb-16">
      
      {/* ─── Back Nav & Header Section ─── */}
      <div className="flex flex-col gap-2 bg-white border border-slate-200/80 p-4 rounded shadow-sm">
        
        {/* Navigation row */}
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Booking list
          </button>
          
          {/* Header Action Buttons */}
          <div className="flex gap-2">
            {booking.status === "pending" && !isConfirming && !isExpired && canManageBooking && (
              <>
                <button 
                  onClick={() => setIsRejecting(true)}
                  className="bg-[#f0ad4e] hover:bg-[#ec971f] text-white font-bold text-xs px-4 py-1.5 rounded transition-colors shadow-sm"
                >
                  Reject this
                </button>
                <button 
                  onClick={() => setIsConfirming(true)}
                  className="bg-[#5cb85c] hover:bg-[#449d44] text-white font-bold text-xs px-4 py-1.5 rounded transition-colors shadow-sm"
                >
                  Confirm this
                </button>
              </>
            )}
            {booking.status === "confirmed" && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded">
                Confirmed Reservation
              </span>
            )}
            {booking.status !== "confirmed" && isExpired && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded">
                Expired
              </span>
            )}
          </div>
        </div>

        {/* Title and details row */}
        <div className="mt-2 border-t border-slate-100 pt-3">
          <h2 className="text-lg font-bold text-slate-800 flex items-baseline gap-2 flex-wrap">
            <span>Booking details</span> 
            <span className="text-slate-400 font-normal text-sm">Booking ID -</span>
            <span className="font-mono text-slate-900 text-base font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{booking.bookingId}</span>
          </h2>
          
          {/* Warning banner / Status info */}
          <div className="mt-2 bg-[#fffbea] border border-[#fce588] rounded px-4 py-2 text-xs text-slate-700 flex items-center gap-2">
            <span className="bg-[#f0ad4e] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
              {flowStatus}
            </span>
            <span>
              {flowStatus === 'Confirmed'
                ? 'This booking is confirmed and payment logs are synced.'
                : flowStatus === 'Cancelled'
                  ? 'This booking request was cancelled.'
                  : flowStatus === 'Expired'
                    ? 'This booking link has expired. Confirmation actions are disabled.'
                    : flowStatus === 'Partially Paid'
                      ? 'This booking is partially paid. Remaining balance is pending.'
                      : flowStatus === 'Pending Payment'
                        ? 'This booking has payment pending. Confirmation will be possible once the right payment is recorded.'
                        : "Pending Inquiry because of trip's booking mode."}
            </span>
          </div>
        </div>

        {/* ─── Inline Rejection Warning Panel ─── */}
        {isRejecting && (
          <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded text-xs space-y-2">
            <p className="font-bold text-red-800">Are you sure you want to reject this booking inquiry?</p>
            <p className="text-red-600/90">This action will cancel the reservation request and notify the administrators.</p>
            <div className="flex gap-2">
              <button 
                onClick={handleRejectSubmit}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded transition-colors"
              >
                Yes, Reject and Cancel
              </button>
              <button 
                onClick={() => setIsRejecting(false)}
                className="bg-slate-200 hover:bg-slate-350 text-slate-700 font-medium px-3 py-1.5 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ─── Inline Confirmation Form (Replacing ConfirmModal Popup) ─── */}
        {isConfirming && (
          <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded text-xs space-y-3.5">
            <h3 className="font-bold text-emerald-800 text-sm border-b border-emerald-250/60 pb-1.5">Confirm Booking Inline</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Total Amount *</label>
                <Input 
                  type="number" 
                  value={confirmTotal} 
                  onChange={e => setConfirmTotal(e.target.value)} 
                  className="font-bold font-mono h-8 text-xs rounded border-emerald-200 bg-white focus-visible:ring-emerald-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Advance Paid</label>
                <Input 
                  type="number" 
                  value={confirmAdvance} 
                  onChange={e => setConfirmAdvance(e.target.value)} 
                  className="font-bold font-mono text-emerald-700 h-8 text-xs rounded border-emerald-200 bg-white focus-visible:ring-emerald-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Payment Mode</label>
                <Select value={confirmMode} onValueChange={setConfirmMode}>
                  <SelectTrigger className="h-8 text-xs rounded border-emerald-200 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI" className="text-xs">UPI</SelectItem>
                    <SelectItem value="Cash" className="text-xs">Cash</SelectItem>
                    <SelectItem value="Bank Transfer" className="text-xs">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Guest Email</label>
                <Input 
                  type="email" 
                  value={confirmEmail} 
                  onChange={e => setConfirmEmail(e.target.value)} 
                  className="h-8 text-xs rounded border-emerald-200 bg-white focus-visible:ring-emerald-500" 
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-emerald-200/50">
              <button 
                onClick={() => setIsConfirming(false)}
                className="bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 font-semibold px-4 py-1.5 rounded transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmSubmit}
                disabled={confirmingLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-1.5 rounded transition-colors shadow-sm"
              >
                {confirmingLoading ? "Confirming..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Dates range & Passengers status strip ─── */}
      <div className="bg-[#f8fafc] border border-slate-200/80 p-3 rounded flex items-center gap-5 text-slate-700 shadow-sm text-xs font-semibold">
        <span className="flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5 text-slate-400" />
          <span>
            {booking.departureDate 
              ? `${new Date(booking.departureDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} to ${new Date(new Date(booking.departureDate).getTime() + 10*24*60*60*1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
              : '30 Jun to 10 Jul, 2026' /* Fallback to screenshot default dates */}
          </span>
        </span>
        <span className="w-px h-4 bg-slate-300" />
        <span className="flex items-center gap-2">
          <Users className="w-4.5 h-4.5 text-slate-400" />
          <span>{qty} passengers</span>
        </span>
      </div>

      {/* ─── Main Content Split Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Booking items, payments, custom forms */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Card 1: Booking Items */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-xs">Booking Items</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-650 border border-slate-300/40">
                  👥 Passenger Details
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setNewDepartureDate(getInitialDateString(booking.departureDate));
                    setShowChangeDates(true);
                  }}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Change dates
                </button>
                <span className="text-slate-300">|</span>
                <button 
                  onClick={() => {
                    setEditRate((booking.baseAmount || itemRate).toFixed(0));
                    setEditQty(qty.toString());
                    setEditDiscount("");
                    setIsEditingItems(true);
                  }}
                  className="text-xs font-bold text-[#C9A84C] hover:text-[#b0913b] hover:underline transition-colors duration-150"
                >
                  Edit Items
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
                      {bookingItems.map((item, index) => {
                        const isZeroQty = item.qty === 0;
                        return (
                          <tr key={item.id || index} className="hover:bg-slate-50/30 transition-colors duration-150">
                            <td className="px-5 py-3.5">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 text-[12px]">{item.name}</span>
                                </div>
                                {item.name.toLowerCase().includes("nonac") && (
                                  <p className="text-[10px] text-slate-400">Get Non-AC Sleeper Train Tickets for Upward & Return journey</p>
                                )}
                                {item.name.toLowerCase().includes("3ac") && (
                                  <p className="text-[10px] text-slate-400">Get 3-Tier AC Train Tickets for Upward & Return journey</p>
                                )}
                                {(item.isCustom || item.name.toLowerCase().includes("sharing") || item.name.toLowerCase().includes("discount")) && (
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
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              {!isZeroQty || item.rate < 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-400 font-mono text-xs">₹</span>
                                  <Input 
                                    type="number"
                                    value={item.rate}
                                    onChange={e => {
                                      const updated = [...bookingItems];
                                      updated[index].rate = parseFloat(e.target.value) || 0;
                                      setBookingItems(updated);
                                    }}
                                    className="h-8 text-xs w-24 font-mono font-semibold border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400"
                                  />
                                </div>
                              ) : (
                                <span className="text-slate-300 font-mono pl-3">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <Input 
                                type="number"
                                value={item.qty}
                                onChange={e => {
                                  const updated = [...bookingItems];
                                  updated[index].qty = parseInt(e.target.value) || 0;
                                  setBookingItems(updated);
                                }}
                                className="h-8 text-xs w-16 font-mono font-semibold border-slate-200 text-center focus-visible:ring-1 focus-visible:ring-slate-400"
                              />
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold font-mono text-[12px] text-slate-800">
                              {!isZeroQty || item.rate < 0 ? `₹ ${(item.rate * item.qty).toLocaleString('en-IN')}` : "—"}
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
                      const meta = (booking as any)?.sourceMeta || {};
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
                    <tr className="border-b border-slate-200/80 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-3">Item Details</th>
                      <th className="px-6 py-3 w-28">Rate</th>
                      <th className="px-6 py-3 w-20">Quantity</th>
                      <th className="px-6 py-3 w-36 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {bookingItems.length > 0 ? (
                      bookingItems
                        .filter(item => item.qty > 0 || item.rate < 0)
                        .map((item, index) => {
                          const isRoom = item.name.toLowerCase().includes("sharing");
                          const isDiscount = item.name.toLowerCase().includes("discount") || item.rate < 0;
                          const isTravel = !isRoom && !isDiscount;
                          return (
                            <tr key={item.id || index} className="hover:bg-slate-50/30 transition-colors duration-150">
                              <td className="px-6 py-4 font-medium text-slate-800">
                                <span className={cn(
                                  "font-semibold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider mr-2.5 border inline-block leading-normal",
                                  isRoom && "bg-purple-50 text-purple-700 border-purple-100",
                                  isDiscount && "bg-rose-50 text-rose-700 border-rose-100",
                                  isTravel && "bg-blue-50 text-blue-700 border-blue-100"
                                )}>
                                  {isRoom ? "Room" : isDiscount ? "Discount" : "Travel"}
                                </span>
                                {item.name}
                              </td>
                              <td className="px-6 py-4 font-mono text-slate-600">₹ {item.rate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                              <td className="px-6 py-4 font-mono text-slate-600">{item.qty}</td>
                              <td className="px-6 py-4 text-right font-semibold font-mono text-slate-900">₹ {(item.rate * item.qty).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                            </tr>
                          );
                        })
                    ) : (
                      <tr className="hover:bg-slate-50/30 transition-colors duration-150">
                        <td className="px-6 py-4 font-medium text-slate-800">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider mr-2.5 inline-block leading-normal">
                            Package
                          </span>
                          Pickup: {booking.pickupCity || 'AHMEDABAD'}, Drop: {booking.pickupCity || 'AHMEDABAD'} {booking.trainClass} Sleeper
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">₹ {itemRate.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        <td className="px-6 py-4 font-mono text-slate-600">{qty}</td>
                        <td className="px-6 py-4 text-right font-semibold font-mono text-slate-900">₹ {packageAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      </tr>
                    )}
                    {/* Transparent Breakdown in Static Mode */}
                    <tr className="bg-slate-50/20 border-t border-slate-150">
                      <td colSpan={3} className="px-6 py-2.5 font-semibold text-right text-slate-500 text-[10px] uppercase tracking-wider">
                        Base Price (Subtotal)
                      </td>
                      <td className="px-6 py-2.5 text-right font-semibold font-mono text-slate-800">
                        ₹ {basePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/20">
                      <td colSpan={3} className="px-6 py-2.5 font-semibold text-right text-slate-500 text-[10px] uppercase tracking-wider">
                        GST (Reg no. 24CRFPP3172G1ZT) @ {Math.round(gstRate * 100)}%
                      </td>
                      <td className="px-6 py-2.5 text-right font-semibold font-mono text-slate-800">
                        ₹ {gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {gstDiscount > 0 && (
                      <tr className="bg-slate-50/20">
                        <td colSpan={3} className="px-6 py-2.5 font-bold text-right text-rose-600 text-[10px] uppercase tracking-wider">
                          GST Discount
                        </td>
                        <td className="px-6 py-2.5 text-right font-bold font-mono text-rose-600">
                          -₹ {gstDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-slate-100/60 border-t border-slate-200">
                      <td colSpan={3} className="px-6 py-3.5 font-bold text-right text-slate-900 text-xs uppercase tracking-wider">
                        Final Total
                      </td>
                      <td className="px-6 py-3.5 text-right font-extrabold font-mono text-slate-900 text-sm">
                        ₹ {booking.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card 2: Payments */}
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
                          const displayDate = new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + " " + new Date(p.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
                          
                          return (
                            <>
                              <tr 
                                key={p.id} 
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
                                            if(confirm("Refund this payment?")) {
                                              try {
                                                await paymentsService.remove(p.id);
                                                toast.success("Payment refunded!");
                                                onRefresh();
                                              } catch {
                                                toast.error("Refund failed");
                                              }
                                            }
                                          }}
                                          className="bg-[#31b0d5] hover:bg-[#269abc] text-white font-bold uppercase text-[9px] px-3.5 py-1.5 rounded transition-all shadow-sm"
                                        >
                                          Refund
                                        </button>
                                        <button 
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if(confirm("Reverse this payment?")) {
                                              try {
                                                await paymentsService.remove(p.id);
                                                toast.success("Payment reversed!");
                                                onRefresh();
                                              } catch {
                                                toast.error("Reversal failed");
                                              }
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
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  booking.advancePaid > 0 ? (
                    <div className="border border-slate-200/60 rounded overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-150 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-4 py-2">Payment comments</th>
                            <th className="px-4 py-2">Ref num</th>
                            <th className="px-4 py-2 text-right">Amt</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-slate-700">
                            <td className="px-4 py-3 font-semibold flex items-center gap-1.5">
                              <span className="text-[8px] font-bold px-1 rounded uppercase bg-slate-200 text-slate-700 font-mono">
                                {booking.paymentMode || 'Unknown'}
                              </span>
                              Advance booking payment
                            </td>
                            <td className="px-4 py-3 text-slate-400 font-mono">
                              payments.offlinepayment
                            </td>
                            <td className="px-4 py-3 text-right font-bold font-mono">₹ {booking.advancePaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
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
                            {new Date(booking.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
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

          {/* Card 3: Additional Booking Details */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-xs">Additional booking details</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 border border-emerald-250/30 uppercase">
                  Form complete
                </span>
              </div>
              <button 
                onClick={() => toast.info("Use edit guest attributes sidebar option to update legal info")}
                className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
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
                    <td className="px-4 py-2.5 text-slate-500">Street Address</td>
                    <td className="px-4 py-2.5 text-slate-850">{booking.notes ? booking.notes.substring(0, 50) : 'Not specified'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 4: Passenger Manifest */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-xs">Passengers</h3>
              {canManageBooking && !isExpired ? (
                <button 
                  onClick={() => {
                    setEditingPassenger(null);
                    setNewPassenger({ firstName: "", lastName: "", gender: "Male", age: "", phone: "", email: "" });
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
                    <th className="px-4 py-2 w-44">Form Status</th>
                    <th className="px-4 py-2">Title first name and last name</th>
                    <th className="px-4 py-2 w-18">Gender</th>
                    <th className="px-4 py-2 w-16">Age</th>
                    <th className="px-4 py-2 w-32">Phone</th>
                    <th className="px-4 py-2 w-40">E-mail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {passengers.map((p, index) => (
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
                                      await bookingsService.update(booking.id, { passengers: updated });
                                      toast.success("Passenger removed");
                                      onRefresh();
                                    } catch (e) {
                                      toast.error("Failed to sync delete passenger");
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
                      
                      {/* Status pills */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 border border-emerald-250/30 uppercase leading-none">
                            Form complete
                          </span>
                          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200 uppercase leading-none truncate max-w-[150px]">
                            Pickup: {booking.pickupCity || 'AHMEDABAD'}, Drop: {booking.pickupCity || 'AHMEDABAD'}
                          </span>
                        </div>
                      </td>
                      
                      {/* Legal attributes */}
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {p.name.startsWith("Mr") || p.name.startsWith("Mrs") || p.name.startsWith("Ms") ? "" : "Mr. "}{p.name}
                      </td>
                      <td className="px-4 py-3">{p.gender}</td>
                      <td className="px-4 py-3 font-mono">{p.age}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{p.phone}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 truncate max-w-[120px]">{p.email || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar metadata attributes */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Main trip descriptor card */}
          <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3.5 text-xs text-slate-700">
            
            {/* Trip label info */}
            <div className="pb-3 border-b border-slate-100">
              <span className="bg-[#428bca] text-white font-bold text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wide mr-2">
                {booking.tripId}
              </span>
              <a href="#" className="font-bold text-blue-600 hover:underline leading-tight text-xs">
                {booking.tripName || trips.find(t => t.tripCode === booking.tripId)?.tripName || "Spiti Valley Road Trip"}
              </a>
            </div>

            {/* Attributes blocks with VL pencil icons */}
            
            {/* 1. Booking Source */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> Booking Source
                </span>
                <button 
                  onClick={() => setEditingSource(!editingSource)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
              
              {editingSource ? (
                <div className="space-y-1.5 mt-1">
                  <Select value={sourceValue} onValueChange={setSourceValue}>
                    <SelectTrigger className="h-8 text-xs rounded"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Direct Booking" className="text-xs">Direct Booking</SelectItem>
                      <SelectItem value="Website Form" className="text-xs">Website Form</SelectItem>
                      <SelectItem value="Booking Link" className="text-xs">Booking Link</SelectItem>
                      <SelectItem value="Admin Panel" className="text-xs">Admin Panel</SelectItem>
                      <SelectItem value="Referral" className="text-xs">Referral</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1.5 justify-end">
                    <button 
                      onClick={() => setEditingSource(false)}
                      className="px-2.5 py-1 bg-white border rounded text-[10px]"
                    >
                      Discard changes
                    </button>
                    <button 
                      onClick={async () => { 
                        setEditingSource(false); 
                        const meta = (booking as any)?.sourceMeta || {};
                        await bookingsService.update(booking.id, { sourceMeta: { ...meta, bookingSource: sourceValue } });
                        toast.success("Booking source updated!");
                        onRefresh();
                      }}
                      className="px-2.5 py-1 bg-[#5cb85c] text-white rounded text-[10px] font-bold"
                    >
                      Save booking source
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pl-5 space-y-0.5">
                  <p className="font-bold text-slate-800">{sourceValue}</p>
                  <p className="text-[10px] text-slate-400">Referrer: <span className="font-mono">www.google.com</span></p>
                </div>
              )}
            </div>

            {/* 2. Booking Comments */}
            <div className="space-y-1 pt-2.5 border-t border-slate-100/70">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-red-400" /> Booking Comments
                </span>
                <button 
                  onClick={() => setEditingNotes(!editingNotes)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-850"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
              
              {editingNotes ? (
                <div className="space-y-1.5 mt-1">
                  <textarea 
                    value={notesValue}
                    onChange={e => setNotesValue(e.target.value)}
                    className="w-full border border-slate-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary outline-none"
                    rows={3}
                  />
                  <div className="flex gap-1.5 justify-end">
                    <button 
                      onClick={() => setEditingNotes(false)}
                      className="h-7 px-2.5 border border-slate-200 rounded hover:bg-slate-50 text-[10px]"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="h-7 px-3 bg-slate-900 text-white font-bold rounded text-[10px]"
                    >
                      {savingNotes ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pl-5">
                  <p className={cn("leading-relaxed", !booking.notes && "text-slate-400 italic")}>
                    {booking.notes || "(none)"}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Internal Notes */}
            <div className="space-y-1 pt-2.5 border-t border-slate-100/70">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Internal Notes
                </span>
                <button 
                  onClick={() => setEditingInternalNotes(!editingInternalNotes)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
              
              {editingInternalNotes ? (
                <div className="space-y-1.5 mt-1">
                  <textarea 
                    value={internalNotesValue}
                    onChange={e => setInternalNotesValue(e.target.value)}
                    className="w-full border border-slate-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-primary outline-none"
                    rows={3}
                  />
                  <div className="flex gap-1.5 justify-end">
                    <button 
                      onClick={() => { setEditingInternalNotes(false); setInternalNotesValue(booking.adminNotes || ""); }}
                      className="h-7 px-2.5 border border-slate-200 rounded hover:bg-slate-50 text-[10px]"
                    >
                      Discard changes
                    </button>
                    <button 
                      onClick={async () => {
                        setEditingInternalNotes(false);
                        await bookingsService.update(booking.id, { adminNotes: internalNotesValue });
                        toast.success("Internal notes updated successfully");
                        onRefresh();
                      }}
                      className="h-7 px-3 bg-[#5cb85c] text-white font-bold rounded text-[10px]"
                    >
                      Save Internal Notes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pl-5">
                  <p className={cn("leading-relaxed", !booking.adminNotes && "text-slate-400 italic")}>
                    {booking.adminNotes || "(none)"}
                  </p>
                </div>
              )}
            </div>

            {/* 4. Guest Identity Contact */}
            <div className="space-y-1 pt-2.5 border-t border-slate-100/70">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Guest Details
                </span>
                <button 
                  onClick={() => setEditingGuestDetails(!editingGuestDetails)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
              
              {editingGuestDetails ? (
                <div className="space-y-2 mt-1">
                  <div className="space-y-1.5">
                    <Input 
                      value={guestName} 
                      onChange={e => setGuestName(e.target.value)} 
                      placeholder="Guest Name"
                      className="h-8 text-xs rounded"
                    />
                    <Input 
                      value={guestEmail} 
                      onChange={e => setGuestEmail(e.target.value)} 
                      placeholder="Email address"
                      className="h-8 text-xs rounded font-mono"
                    />
                    <div className="flex gap-1.5 items-center">
                      <span className="bg-slate-100 px-2 py-1.5 rounded text-xs border font-mono">🇮🇳 +91</span>
                      <Input 
                        value={guestPhone} 
                        onChange={e => setGuestPhone(e.target.value)} 
                        placeholder="Mobile number"
                        className="h-8 text-xs rounded font-mono flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-1.5 justify-end">
                    <button 
                      onClick={() => {
                        setEditingGuestDetails(false);
                        setGuestName(booking.fullName || "");
                        setGuestEmail(booking.email || "");
                        setGuestPhone(booking.mobile || "");
                      }}
                      className="px-2.5 py-1 bg-white border rounded text-[10px]"
                    >
                      Discard changes
                    </button>
                    <button 
                      onClick={async () => {
                        setEditingGuestDetails(false);
                        await bookingsService.update(booking.id, {
                          fullName: guestName,
                          name: guestName,
                          email: guestEmail,
                          mobile: guestPhone,
                          phone: guestPhone
                        });
                        toast.success("Guest details updated!");
                        onRefresh();
                      }}
                      className="px-2.5 py-1 bg-[#5cb85c] text-white rounded text-[10px] font-bold"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pl-5 space-y-0.5">
                  <p className="font-bold text-slate-800">{booking.fullName}</p>
                  <p className="text-blue-600 hover:underline font-mono truncate max-w-[180px]">{booking.email || 'no-email@details.com'}</p>
                  <p className="font-mono text-slate-500">+91 {booking.mobile}</p>
                </div>
              )}
            </div>

            {/* 5. Booking Language */}
            <div className="space-y-1 pt-2.5 border-t border-slate-100/70">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-slate-400" /> Booking Language
                </span>
                <button 
                  onClick={() => setEditingLang(!editingLang)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800"
                  id="btn-edit-lang"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
              {editingLang ? (
                <div className="space-y-1.5 mt-1.5 pl-5">
                  <Select value={langValue} onValueChange={setLangValue}>
                    <SelectTrigger className="h-8 text-xs rounded"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English (en)</SelectItem>
                      <SelectItem value="Hindi">Hindi (hi)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1.5 justify-end">
                    <button 
                      onClick={() => {
                        setEditingLang(false);
                        const meta = (booking as any)?.sourceMeta || {};
                        setLangValue(meta.language || "English");
                      }}
                      className="px-2.5 py-1 bg-white border rounded text-[10px]"
                    >
                      Discard changes
                    </button>
                    <button 
                      onClick={async () => {
                        setEditingLang(false);
                        const meta = (booking as any)?.sourceMeta || {};
                        await bookingsService.update(booking.id, { sourceMeta: { ...meta, language: langValue } });
                        toast.success("Language updated successfully!");
                        onRefresh();
                      }}
                      className="px-2.5 py-1 bg-[#5cb85c] text-white rounded text-[10px] font-bold"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pl-5">
                  <p className="font-bold text-slate-800">{langValue === "English" ? "English (en)" : "Hindi (hi)"}</p>
                </div>
              )}
            </div>

            {/* 6. Plugins Section */}
            <div className="space-y-1 pt-3 border-t border-slate-150 bg-slate-50/50 p-2.5 rounded">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Plugins</span>
              <button 
                onClick={() => toast.success("Payment Link generated! SMS/Email dispatched to customer.")}
                className="w-full py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold uppercase text-[9px] tracking-wide rounded text-center transition-colors flex items-center justify-center gap-1.5"
              >
                Send Flexi Payment Link &rarr;
              </button>
            </div>

            {/* 7. Created At Timestamp */}
            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-350" />
              <span>Created at: {new Date(booking.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })} via website</span>
            </div>

            {/* 8. Tags Category */}
            <div className="space-y-1 pt-2.5 border-t border-slate-100/70">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> Tags
                </span>
                <button 
                  onClick={() => setEditingTags(!editingTags)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
              
              {editingTags ? (
                <div className="flex gap-1.5 mt-1">
                  <Input 
                    value={tagsValue} 
                    onChange={e => setTagsValue(e.target.value)} 
                    placeholder="e.g. vip, repeat" 
                    className="h-7 text-xs px-2"
                  />
                  <button 
                    onClick={() => { setEditingTags(false); toast.success("Tags updated"); }}
                    className="p-1.5 bg-slate-900 text-white rounded"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="pl-5">
                  {tagsValue ? (
                    <span className="bg-slate-100 text-slate-650 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200 font-mono">{tagsValue}</span>
                  ) : (
                    <p className="text-slate-400 italic">(none)</p>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Action Log / Automation Engine panel */}
          <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Send className="w-4 h-4 text-slate-400" /> Automation Triggers
            </h4>
            
            <div className="grid grid-cols-3 gap-1.5">
              <button 
                onClick={() => handleSendEmail('confirmation')}
                className="py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold uppercase text-[8px] tracking-wide rounded text-center transition-colors"
              >
                Resend Confirm
              </button>
              <button 
                onClick={() => handleSendEmail('reminder')}
                className="py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold uppercase text-[8px] tracking-wide rounded text-center transition-colors"
              >
                Send Reminder
              </button>
              <button 
                onClick={() => handleSendEmail('invoice')}
                className="py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold uppercase text-[8px] tracking-wide rounded text-center transition-colors"
              >
                Push Invoice
              </button>
            </div>

            {/* Email log listings */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mail Log</h5>
              
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto no-scrollbar">
                {emailLogs.length === 0 ? (
                  <p className="text-[10px] text-slate-450 italic">No emails sent yet.</p>
                ) : (
                  emailLogs.map((log: any) => (
                    <div key={log.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-150 text-[10px]">
                      <div>
                        <p className="font-bold text-slate-800 uppercase">{log.type}</p>
                        <p className="text-[8px] text-slate-400">{new Date(log.sentAt).toLocaleDateString()}</p>
                      </div>
                      <span className={cn("text-[8px] font-bold px-1 rounded uppercase", log.status === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                        {log.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <button 
              onClick={handleDownloadInvoice}
              className="w-full py-2 bg-slate-850 hover:bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wide rounded shadow-sm text-center"
            >
              Generate Invoice PDF
            </button>
          </div>
        </div>

      </div>

      {/* ─── Add/Edit Passenger Dialog Overlay ─── */}
      <Dialog open={showAddPassenger} onOpenChange={(o) => { setShowAddPassenger(o); if(!o) setEditingPassenger(null); }}>
        <DialogContent className="sm:max-w-[480px] p-0 border border-slate-200 rounded-lg overflow-hidden shadow-premium bg-white">
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
        <DialogContent className="sm:max-w-[400px] p-0 border border-slate-200 rounded-lg overflow-hidden shadow-premium bg-white">
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
        <DialogContent className="sm:max-w-[500px] p-0 border border-slate-200 rounded-lg overflow-hidden shadow-premium bg-white">
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
              <div className="p-3 bg-blue-50 border border-blue-150 rounded text-blue-700 animate-fade-in">
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
                className="bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold uppercase text-[9px] px-3.5 h-8 rounded"
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

    </div>
  );
}
