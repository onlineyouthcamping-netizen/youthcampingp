import { useState, useEffect } from "react";
import { AdminModal } from "./AdminModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tripsService } from "@/services/trips.service";
import { bookingsService } from "@/services/bookings.service";
import type { Trip, BookingFormData } from "@/types";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Calendar, Users, IndianRupee } from "lucide-react";

interface NewBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function NewBookingModal({ open, onOpenChange, onSuccess }: NewBookingModalProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState<any>({
    fullName: "",
    mobile: "",
    tripId: "",
    age: 20,
    gender: "Male",
    trainClass: "Sleeper",
    ticketStatus: "Not Booked",
    roomType: "Double Sharing",
    totalAmount: 0,
    advancePaid: 0,
    status: "confirmed",
    paymentStatus: "Pending",
    paymentMode: "UPI",
    notes: "",
    email: "",
    departureDate: "",
  });

  useEffect(() => {
    if (open) {
      const loadTrips = async () => {
        setLoadingTrips(true);
        try {
          const data = await bookingsService.getTrips();
          setTrips((data || []) as any);
        } catch (error) {
          toast.error("Failed to load trips");
        } finally {
          setLoadingTrips(false);
        }
      };
      loadTrips();
    }
  }, [open]);

  const handleTripChange = (tripId: string) => {
    const selectedTrip = trips.find((t: any) => t.id === tripId || t.tripCode === tripId);
    setForm(prev => ({
      ...prev,
      tripId,
      totalAmount: (selectedTrip as any)?.price || prev.totalAmount
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields (including aliases for backend consistency)
    const payload = {
      ...form,
      name: form.fullName, // Alias for backend
      phone: form.mobile,   // Alias for backend
      amount: form.totalAmount // Alias for backend
    };

    console.log("📡 Sending booking:", payload);

    if (!payload.name || !payload.phone || !payload.tripId || !payload.email || !payload.departureDate) {
      toast.error("Required fields: Name, Phone, Trip, Email, and Departure Date");
      return;
    }

    setSubmitting(true);
    try {
      const response = await bookingsService.create(payload);
      console.log("✅ Booking Success:", response);
      toast.success("Booking created successfully");
      onOpenChange(false);
      onSuccess?.();
      
      setForm({
        fullName: "",
        mobile: "",
        tripId: "",
        age: 20,
        gender: "Male",
        trainClass: "Sleeper",
        ticketStatus: "Not Booked",
        roomType: "Double Sharing",
        totalAmount: 0,
        advancePaid: 0,
        status: "confirmed",
        paymentStatus: "Pending",
        paymentMode: "UPI",
        notes: "",
        email: "",
        departureDate: "",
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to create booking";
      console.error("❌ FULL ERROR:", error.response?.data || error);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Balance Due</span>
        <span className="text-xl font-black text-slate-900">₹{(form.totalAmount - (form.advancePaid || 0)).toLocaleString()}</span>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-12 px-6 font-bold text-slate-600 border-slate-200">
          Discard
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] h-12 px-10 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Create Booking
        </Button>
      </div>
    </>
  );

  return (
    <AdminModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create Booking"
      description="Register a new expedition reservation"
      footer={footer}
    >
      <div className="space-y-10">
        {/* Customer Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name *</Label>
              <Input 
                value={form.fullName} 
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                placeholder="Primary guest name" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Number *</Label>
              <div className="flex h-11 rounded-xl border border-slate-200 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <div className="w-14 h-full bg-slate-50 border-r border-slate-200 flex items-center justify-center text-xs font-black text-slate-400">
                  +91
                </div>
                <Input 
                  value={form.mobile} 
                  onChange={e => setForm({ ...form, mobile: e.target.value })}
                  placeholder="10-digit number" 
                  className="h-full border-none rounded-none flex-1 focus-visible:ring-0 shadow-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address *</Label>
              <Input 
                type="email"
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="customer@example.com" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender</Label>
                <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Age</Label>
                <Input 
                  type="number"
                  value={form.age} 
                  onChange={e => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Trip Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expedition Logistics</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Select Trip *</Label>
                <button 
                  type="button"
                  onClick={() => setForm({ ...form, isManualTrip: !form.isManualTrip, tripId: "" })}
                  className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  {form.isManualTrip ? "Select from list" : "Manual Code"}
                </button>
              </div>
              {form.isManualTrip ? (
                <Input 
                  value={form.tripId} 
                  onChange={e => setForm({ ...form, tripId: e.target.value })}
                  placeholder="e.g. MKA1" 
                  className="font-black uppercase tracking-widest"
                />
              ) : (
                <Select value={form.tripId} onValueChange={handleTripChange}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue placeholder={loadingTrips ? "Loading..." : "Select trip"} />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map(trip => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.title} (₹{trip.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Departure Date *</Label>
              <Input 
                type="date"
                value={form.departureDate} 
                onChange={e => setForm({ ...form, departureDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Room Type</Label>
              <Input 
                value={form.roomType} 
                onChange={e => setForm({ ...form, roomType: e.target.value })}
                placeholder="e.g. Triple Sharing" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Train Class</Label>
              <Select value={form.trainClass} onValueChange={v => setForm({ ...form, trainClass: v })}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sleeper">Sleeper</SelectItem>
                  <SelectItem value="3AC">3AC</SelectItem>
                  <SelectItem value="Flight">Flight</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Financials */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-primary" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Financial Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Total Fee (₹) *</Label>
              <Input 
                type="number"
                value={form.totalAmount} 
                onChange={e => setForm({ ...form, totalAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Advance Paid (₹)</Label>
              <Input 
                type="number"
                value={form.advancePaid} 
                onChange={e => setForm({ ...form, advancePaid: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Payment Status</Label>
              <Select value={form.paymentStatus} onValueChange={(v: any) => setForm({ ...form, paymentStatus: v })}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partial">Partial Payment</SelectItem>
                  <SelectItem value="Paid">Fully Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Payment Mode</Label>
              <Select value={form.paymentMode} onValueChange={(v: any) => setForm({ ...form, paymentMode: v })}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Internal Notes</Label>
          <Textarea 
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Special requests or payment remarks..." 
            className="min-h-[120px] rounded-2xl border-slate-200 shadow-sm transition-all focus-visible:ring-primary/20 focus-visible:border-primary p-4"
          />
        </section>
      </div>
    </AdminModal>
  );
}
