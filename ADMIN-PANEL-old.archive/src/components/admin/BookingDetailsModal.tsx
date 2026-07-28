import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  User, Phone, MapPin, CreditCard, 
  FileText, Calendar, Trash2, X,
  CheckCircle2, AlertCircle, Clock,
  ArrowRight, Pencil, Plus, Users
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Booking } from "@/types";
import { cn, safeFormatDate, safeFormatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { bookingsService } from "@/services/bookings.service";
import { bookingVerificationService } from "@/services/bookingVerification.service";
import { useAuthStore } from "@/store/auth.store";

interface BookingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onEdit?: (booking: Booking) => void; // New prop
}

export default function BookingDetailsModal({ open, onOpenChange, booking, onEdit }: BookingDetailsModalProps) {
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
  const [savingPassenger, setSavingPassenger] = useState(false);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);

  const fetchEmailLogs = async () => {
    if (!booking) return;
    try {
      const logs = await bookingsService.getEmailLogs(booking.id);
      setEmailLogs(logs);
    } catch (e) {
      console.error("Failed to fetch email logs", e);
    }
  };

  const handleSendEmail = async (type: any) => {
    if (!booking) return;
    
    // Safety check for real email
    const targetEmail = booking.email;
    if (!targetEmail || targetEmail.includes("no-email") || targetEmail.includes("example.com")) {
      toast.error("Real customer email is missing! Please edit the booking to add a valid email.");
      return;
    }

    console.log("Booking:", booking);
    console.log("Booking ID:", booking?.id);
    console.log("Email:", booking?.email);
    console.log("Sending email to:", booking?.email || "No Email");
    console.log("📡 [handleSendEmail] Triggering:", { bookingId: booking.id, type });
    
    const toastId = toast.loading(`Sending ${type} email...`);
    try {
      await bookingsService.sendEmail(booking.id, type, booking.totalAmount);
      console.log("✅ [handleSendEmail] Success");
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} email sent!`, { id: toastId });
      fetchEmailLogs();
    } catch (e: any) {
      console.error("❌ [handleSendEmail] Error:", e.response?.data || e.message);
      toast.error(`Failed to send ${type} email: ${e.response?.data?.message || 'Unknown error'}`, { id: toastId });
    }
  };

  const [submittingVerification, setSubmittingVerification] = useState(false);

  const handleSubmitVerification = async () => {
    if (!booking) return;
    setSubmittingVerification(true);
    const toastId = toast.loading("Submitting booking for ticket verification...");
    try {
      await bookingVerificationService.submitForVerification(booking.bookingId);
      toast.success("Successfully submitted for ticket verification!", { id: toastId });
      onOpenChange(false);
    } catch (e: any) {
      console.error("❌ [handleSubmitVerification] Error:", e.response?.data || e.message);
      toast.error(e.response?.data?.message || "Failed to submit for verification", { id: toastId });
    } finally {
      setSubmittingVerification(false);
    }
  };

  // Initialize passengers with booking owner or from DB
  useEffect(() => {
    if (booking && open) {
      fetchEmailLogs();
      if (booking.passengers && Array.isArray(booking.passengers) && booking.passengers.length > 0) {
        setPassengers(booking.passengers);
      } else {
        setPassengers([{
          id: 'main',
          name: booking.fullName,
          phone: booking.mobile,
          email: "Not specified",
          gender: booking.gender,
          age: booking.age,
          type: `${booking.trainClass} Train`,
          status: 'Form complete'
        }]);
      }
    }
  }, [booking, open]);

  if (!booking) return null;

  const formatDate = (dateString?: string) => {
    return safeFormatDate(dateString, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }, "Not specified");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'partial': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'pending': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
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
    if (savingPassenger) return;

    setSavingPassenger(true);
    let updatedPassengers = [];

    if (editingPassenger) {
      // Update existing
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
      // Add new
      const passenger = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${newPassenger.firstName} ${newPassenger.lastName}`,
        phone: newPassenger.phone || "N/A",
        email: newPassenger.email || "N/A",
        gender: newPassenger.gender,
        age: newPassenger.age || "N/A",
        type: `${booking?.trainClass} Train`,
        status: 'Pending'
      };
      updatedPassengers = [...passengers, passenger];
      toast.success(`${newPassenger.firstName} added to booking`);
    }
    
    setPassengers(updatedPassengers);
    
    try {
      if (booking) {
        await bookingsService.update(booking.id, { passengers: updatedPassengers });
      }
    } catch (e) {
      toast.error("Failed to save to server, but updated locally");
    } finally {
      setSavingPassenger(false);
    }

    setNewPassenger({ firstName: "", lastName: "", gender: "Male", age: "", phone: "", email: "" });
    setEditingPassenger(null);
    
    if (!keepOpen) {
      setShowAddPassenger(false);
    }
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
            /* ── Reset & Base ── */
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

            /* ── A4 Page Setup ── */
            @page {
              size: A4 portrait;
              margin: 18mm 16mm 18mm 16mm;
            }
            @media print {
              html, body { width: 210mm; min-height: 297mm; }
              .no-print { display: none !important; }
              .page-break { page-break-before: always; }
            }

            /* ── Invoice Wrapper ── */
            .invoice-wrapper {
              max-width: 780px;
              margin: 0 auto;
              padding: 48px 48px 40px;
              background: #fff;
            }

            /* ── Header ── */
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-bottom: 24px;
              margin-bottom: 32px;
              border-bottom: 2px solid #e2e8f0;
            }
            .logo-wrap img {
              height: 52px;
              width: auto;
              max-width: 200px;
              object-fit: contain;
              image-rendering: -webkit-optimize-contrast;
              image-rendering: crisp-edges;
              display: block;
            }
            .invoice-meta { text-align: right; }
            .invoice-meta .invoice-title {
              font-size: 22px;
              font-weight: 900;
              letter-spacing: -0.5px;
              color: #1e293b;
              text-transform: uppercase;
              margin-bottom: 6px;
            }
            .invoice-meta p {
              font-size: 11px;
              color: #64748b;
              font-weight: 600;
              margin: 2px 0;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .invoice-meta .status-badge {
              display: inline-block;
              margin-top: 8px;
              padding: 3px 12px;
              border-radius: 20px;
              font-size: 10px;
              font-weight: 900;
              letter-spacing: 1px;
              text-transform: uppercase;
              background: #dcfce7;
              color: #16a34a;
              border: 1px solid #bbf7d0;
            }

            /* ── Info Grid ── */
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin-bottom: 32px;
            }
            .info-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 18px 20px;
            }
            .section-title {
              font-size: 9px;
              font-weight: 900;
              text-transform: uppercase;
              color: #94a3b8;
              letter-spacing: 1.5px;
              margin-bottom: 14px;
              padding-bottom: 8px;
              border-bottom: 1px solid #e2e8f0;
            }
            .info-item { margin-bottom: 10px; }
            .info-item:last-child { margin-bottom: 0; }
            .info-label {
              font-size: 9px;
              font-weight: 900;
              text-transform: uppercase;
              color: #94a3b8;
              letter-spacing: 1px;
              margin-bottom: 2px;
            }
            .info-value {
              font-size: 14px;
              font-weight: 700;
              color: #1e293b;
            }

            /* ── Table ── */
            .table-section { margin-bottom: 32px; }
            .table-section .section-title { margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; }
            thead tr { background: #f1f5f9; }
            th {
              text-align: left;
              font-size: 9px;
              font-weight: 900;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
              padding: 10px 14px;
              border-bottom: 2px solid #e2e8f0;
            }
            td {
              padding: 12px 14px;
              font-size: 13px;
              color: #334155;
              border-bottom: 1px solid #f1f5f9;
            }
            tr:last-child td { border-bottom: none; }

            /* ── Totals ── */
            .totals-wrap {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 40px;
            }
            .totals-box {
              width: 320px;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              overflow: hidden;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 16px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 13px;
            }
            .total-row:last-child { border-bottom: none; }
            .total-row .lbl { color: #64748b; font-weight: 600; }
            .total-row .val { font-weight: 700; color: #1e293b; }
            .total-row.grand {
              background: #1e293b;
              border-bottom: none;
            }
            .total-row.grand .lbl { color: #94a3b8; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
            .total-row.grand .val { color: #fff; font-size: 18px; font-weight: 900; }
            .total-row .val.green { color: #059669; }

            /* ── Footer ── */
            .footer {
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              line-height: 1.8;
            }
            .footer p { margin: 0; }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">

            <!-- Header -->
            <div class="header">
              <div class="logo-wrap">
                <img
                  src="${logoUrl}"
                  alt="Company Logo"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                />
                <span style="display:none; font-size:22px; font-weight:900; color:#1e293b; letter-spacing:-1px;">YOUTHCAMPING.</span>
              </div>
              <div class="invoice-meta">
                <div class="invoice-title">Invoice</div>
                <p>Invoice No: ${booking.bookingId}</p>
                <p>Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <span class="status-badge">${booking.paymentStatus}</span>
              </div>
            </div>

            <!-- Guest & Travel Info -->
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
                ${booking.email ? `
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value" style="font-size:12px">${booking.email}</div>
                </div>` : ''}
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
                <div class="info-item">
                  <div class="info-label">Room Type</div>
                  <div class="info-value">${booking.roomType || 'N/A'}</div>
                </div>
              </div>
            </div>

            <!-- Booking Summary Table -->
            <div class="table-section">
              <div class="section-title">Booking Summary</div>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th style="text-align:right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Trip Package &mdash; ${booking.tripName || booking.tripId} (${booking.trainClass})</td>
                    <td>1 Traveller</td>
                    <td style="text-align:right; font-weight:700">&#8377;${booking.totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totals -->
            <div class="totals-wrap">
              <div class="totals-box">
                <div class="total-row">
                  <span class="lbl">Total Amount</span>
                  <span class="val">&#8377;${booking.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div class="total-row">
                  <span class="lbl">Advance Paid</span>
                  <span class="val green">&minus;&#8377;${booking.advancePaid.toLocaleString('en-IN')}</span>
                </div>
                <div class="total-row grand">
                  <span class="lbl">Balance Due</span>
                  <span class="val">&#8377;${booking.remainingAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>Thank you for booking with us. We look forward to serving you.</p>
              <p>This is a computer-generated invoice and does not require a physical signature.</p>
              <p>For support, contact us at support@youthcamping.com</p>
            </div>

          </div>

          <script>
            window.onload = function() {
              // Wait for logo image to load before printing
              var img = document.querySelector('.logo-wrap img');
              if (img && !img.complete) {
                img.onload = function() { window.print(); setTimeout(function(){ window.close(); }, 800); };
                img.onerror = function() { window.print(); setTimeout(function(){ window.close(); }, 800); };
              } else {
                window.print();
                setTimeout(function(){ window.close(); }, 800);
              }
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    toast.success("Generating invoice...");
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="sm:max-w-[1100px] p-0 overflow-hidden border-none shadow-luxury rounded-[40px] bg-white">
        <DialogHeader className="sr-only">
          <DialogTitle>Booking Details - {booking.bookingId}</DialogTitle>
          <DialogDescription>Detailed view of the booking including passenger and payment information.</DialogDescription>
        </DialogHeader>
        {/* ─── Premium Header ─── */}
        <div className="bg-slate-900 px-12 py-10 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 -mr-16 -mt-16 w-64 h-64 bg-white rounded-full" />
          <div className="relative z-10 flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-[24px] bg-white/10 flex items-center justify-center backdrop-blur-xl">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">Booking Overview</h2>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">{booking.bookingId}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => booking && onEdit?.(booking)}
                className="h-12 px-6 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold text-[10px] uppercase tracking-widest"
              >
                <Pencil className="w-4 h-4 mr-2" /> Modify Booking
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-12 w-12 rounded-2xl text-white/40 hover:text-white hover:bg-white/10">
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 relative z-10">
            <div className={cn("px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10 backdrop-blur-md bg-white/5", getStatusColor(booking.paymentStatus))}>
              Payment: {booking.paymentStatus}
            </div>
            <div className="px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10 backdrop-blur-md bg-white/5 text-white/80">
              {booking.tripId} — {booking.tripName || booking.trip?.title || "Custom Expedition"}
            </div>
            <div className="px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10 backdrop-blur-md bg-white/5 text-white/80">
              {booking.trainClass} Transport
            </div>
          </div>
        </div>

        <div className="p-12 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-10 max-h-[70vh] overflow-y-auto no-scrollbar">
          {/* Guest Information */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Guest Dossier</h3>
            </div>
            
            <div className="modern-card p-10 space-y-8">
              <div className="space-y-1">
                <Label text="Full Legal Name" />
                <p className="text-xl font-bold text-slate-900">{booking.fullName}</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <Label text="Age" />
                  <p className="text-sm font-bold text-slate-600">{booking.age} Years</p>
                </div>
                <div className="space-y-1">
                  <Label text="Gender" />
                  <p className="text-sm font-bold text-slate-600">{booking.gender}</p>
                </div>
              </div>
              <div className="space-y-1">
                <Label text="Contact Identity" />
                <div className="flex items-center gap-3 text-slate-900 font-bold text-sm">
                  <Phone className="w-4 h-4 text-blue-500" />
                  +91 {booking.mobile}
                </div>
                {booking.email && (
                  <p className="text-xs text-slate-400 font-medium mt-1 ml-7">{booking.email}</p>
                )}
              </div>
            </div>
          </section>

          {/* Travel Information */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Expedition Logic</h3>
            </div>
            
            <div className="modern-card p-10 space-y-8">
              <div className="space-y-1">
                <Label text="Selected Trip" />
                <p className="text-xl font-bold text-slate-900 uppercase">
                  {booking.tripName || booking.trip?.title || "Custom Trip"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <Label text="Transport / Class" />
                  <p className="text-sm font-bold text-slate-600">{booking.trainClass}</p>
                </div>
                <div className="space-y-1">
                  <Label text="Ticket Status" />
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-emerald-600 uppercase">{booking.ticketStatus || "DRAFT"}</p>
                    {(!booking.ticketStatus || ['DRAFT', 'PENDING', 'CHANGES_REQUESTED', 'NOT BOOKED'].includes(booking.ticketStatus.toUpperCase())) && (
                      <Button
                        onClick={handleSubmitVerification}
                        disabled={submittingVerification}
                        size="sm"
                        className="h-6 px-2 text-[9px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase rounded shadow-sm transition-all"
                      >
                        {submittingVerification ? "Sending..." : "Send to Verify"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                <div className="space-y-1">
                  <Label text="Accommodation" />
                  <p className="text-sm font-bold text-slate-600">{booking.roomType}</p>
                </div>
                <div className="space-y-1">
                  <Label text="Initial Booking" />
                  <p className="text-sm font-bold text-slate-400">{formatDate(booking.createdAt)}</p>
                </div>
              </div>
              {booking.pickupCity && (
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                  <div className="space-y-1">
                    <Label text="Joining From (Pickup)" />
                    <p className="text-sm font-bold text-slate-700 uppercase">{booking.pickupCity}</p>
                  </div>
                  <div className="space-y-1">
                    <Label text="Joining Date" />
                    <p className="text-sm font-bold text-slate-700">{formatDate(booking.joiningDate)} (Skipped {booking.skipDays} Days)</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Payment Information */}
          <section className="space-y-6 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Financial Ledger</h3>
            </div>
            
            <div className="modern-card p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              <div className="space-y-1">
                <Label text="Total PAX" />
                <p className="text-2xl font-bold text-slate-900">{booking.numberOfTravelers || 1}</p>
              </div>
              <div className="space-y-1">
                <Label text="Base Fare" />
                <p className="text-2xl font-bold text-slate-900">
                  ₹{(booking.baseAmount || 0).toLocaleString()}
                  {booking.adjustedPrice && (
                    <span className="block text-[10px] text-emerald-600 font-bold uppercase tracking-tight">
                      Adjusted: ₹{booking.adjustedPrice.toLocaleString()} / pax
                    </span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <Label text="Total Payable" />
                <p className="text-2xl font-black text-slate-900">₹{booking.totalAmount.toLocaleString()}</p>
                {booking.adjustedPrice && booking.skipDays && booking.skipDays > 0 ? (
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    Includes skip deduction
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label text="Status" />
                <span className={cn("px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest", getStatusColor(booking.paymentStatus))}>
                  {booking.paymentStatus}
                </span>
              </div>
              
              <div className="bg-emerald-50/50 p-10 rounded-[32px] space-y-3 border border-emerald-100 md:col-span-2">
                <Label text="Advance Received" />
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-emerald-600">₹{booking.advancePaid.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">via {booking.paymentMode}</span>
                </div>
              </div>
              
              <div className="bg-rose-50/50 p-10 rounded-[32px] space-y-3 border border-rose-100 md:col-span-2">
                <Label text="Remaining Balance" />
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-rose-500">₹{booking.remainingAmount.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Collection Pending</span>
                </div>
              </div>
            </div>
          </section>

          {/* Automation Actions */}
          <section className="space-y-6 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-slate-900" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Automation Engine</h3>
            </div>
            
            <div className="modern-card p-10 space-y-10">
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => handleSendEmail('confirmation')} variant="outline" className="h-11 px-6 rounded-xl border-slate-100 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                  Resend Confirmation
                </Button>
                <Button onClick={() => handleSendEmail('reminder')} variant="outline" className="h-11 px-6 rounded-xl border-slate-100 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                  Send Reminder
                </Button>
                <Button onClick={() => handleSendEmail('invoice')} variant="outline" className="h-11 px-6 rounded-xl border-slate-100 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                  Push Invoice
                </Button>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Communication History</h4>
                <div className="space-y-3">
                  {emailLogs.length === 0 ? (
                    <p className="text-[11px] text-slate-300 italic font-medium">No system communication recorded.</p>
                  ) : (
                    emailLogs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px] group border border-transparent hover:border-slate-100 transition-all">
                        <div className="flex items-center gap-5">
                          <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center", log.status === 'success' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500")}>
                            {log.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-900 uppercase">{log.type} Transmission</p>
                            <p className="text-[10px] text-slate-400 font-bold">{safeFormatDateTime(log.sentAt)}</p>
                          </div>
                        </div>
                        <span className={cn("text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border", log.status === 'success' ? "text-emerald-600 border-emerald-100 bg-white" : "text-rose-500 border-rose-100 bg-white")}>
                          {log.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Notes */}
          {booking.notes && (
            <section className="space-y-6 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Manual Directives</h3>
              </div>
              <div className="p-10 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                <p className="text-sm text-slate-500 italic leading-relaxed font-medium">"{booking.notes}"</p>
              </div>
            </section>
          )}

          {/* Passenger manifest */}
          <section className="space-y-6 md:col-span-2 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Passenger Manifest</h3>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingPassenger(null);
                  setNewPassenger({ firstName: "", lastName: "", gender: "Male", age: "", phone: "", email: "" });
                  setShowAddPassenger(true);
                }}
                className="h-10 px-5 rounded-xl border-slate-100 font-bold text-[10px] uppercase tracking-widest bg-white shadow-sm flex items-center gap-2 hover:bg-slate-900 hover:text-white transition-all"
              >
                <Plus className="w-4 h-4" /> Register Passenger
              </Button>
            </div>

            <div className="modern-card p-0 overflow-hidden shadow-premium">
              <div className="responsive-table">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Entity</th>
                      <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Attributes</th>
                      <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {passengers.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-10 py-7">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-900 uppercase">{p.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 tracking-tight">+91 {p.phone}</p>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          <span className={cn("px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-tight", p.status === 'Form complete' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-10 py-7">
                           <div className="flex gap-2">
                             <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{p.gender}</span>
                             <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{p.age} Yrs</span>
                           </div>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-900 hover:text-white" onClick={() => handleEditPassenger(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-rose-50 text-rose-500" onClick={async () => { 
                                const updated = passengers.filter(x => x.id !== p.id);
                                setPassengers(updated);
                                if (booking) {
                                  try { await bookingsService.update(booking.id, { passengers: updated }); } 
                                  catch (e) { toast.error("Failed to sync deletion"); }
                                }
                              }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {/* ─── Footer Action ─── */}
        <div className="p-10 border-t border-slate-50 bg-white flex justify-between items-center rounded-b-[40px]">
          <div className="flex items-center gap-3 text-slate-400">
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Recorded on {formatDate(booking.createdAt)}</span>
          </div>
          <Button 
            onClick={handleDownloadInvoice}
            className="px-10 h-14 rounded-2xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200"
          >
            Generate Invoice PDF
          </Button>
        </div>
      </DialogContent>

      {/* Add/Edit Passenger Modal */}
      <Dialog open={showAddPassenger} onOpenChange={(o) => { setShowAddPassenger(o); if(!o) setEditingPassenger(null); }}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <div className="p-8 space-y-6 bg-white">
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
              {editingPassenger ? "Edit Passenger" : "Add New Passenger"}
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label text="First Name" />
                <Input value={newPassenger.firstName} onChange={e => setNewPassenger({...newPassenger, firstName: e.target.value})} placeholder="First Name" />
              </div>
              <div className="space-y-1.5">
                <Label text="Last Name" />
                <Input value={newPassenger.lastName} onChange={e => setNewPassenger({...newPassenger, lastName: e.target.value})} placeholder="Last Name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label text="Gender" />
                  <Select value={newPassenger.gender} onValueChange={v => setNewPassenger({...newPassenger, gender: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label text="Age" />
                  <Input type="number" value={newPassenger.age} onChange={e => setNewPassenger({...newPassenger, age: e.target.value})} placeholder="Age" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label text="Mobile Number" />
                <Input value={newPassenger.phone} onChange={e => setNewPassenger({...newPassenger, phone: e.target.value})} placeholder="10 Digit Number" />
              </div>
              <div className="space-y-1.5">
                <Label text="Email" />
                <Input value={newPassenger.email} onChange={e => setNewPassenger({...newPassenger, email: e.target.value})} placeholder="Email Address" />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-8 py-5 flex justify-end gap-3 border-t">
            <Button variant="ghost" disabled={savingPassenger} onClick={() => { setShowAddPassenger(false); setEditingPassenger(null); }} className="text-xs font-bold uppercase tracking-widest">Cancel</Button>
            {!editingPassenger && (
              <Button onClick={() => handleSavePassenger(true)} disabled={savingPassenger} className="bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 text-xs font-bold uppercase tracking-widest px-6 h-10 rounded-lg">Save & Add Another</Button>
            )}
            <Button onClick={() => handleSavePassenger(false)} disabled={savingPassenger} className="bg-emerald-600 text-white text-xs font-black uppercase tracking-widest px-6 h-10 rounded-lg">
              {editingPassenger ? "Update Details" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function Label({ text }: { text: string }) {
  return <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{text}</p>;
}
