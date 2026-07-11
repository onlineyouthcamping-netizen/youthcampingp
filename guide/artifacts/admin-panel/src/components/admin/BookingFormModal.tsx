import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookingsService } from "@/services/bookings.service";
import { settingsService } from "@/services/settings.service";
import { toast } from "sonner";
import { Loader2, User, MapPin, CreditCard, FileText, X } from "lucide-react";

interface BookingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  booking?: any | null;
}

export default function BookingFormModal({ open, onOpenChange, onSuccess, booking }: BookingFormModalProps) {
  const [trips, setTrips] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    fullName: "",
    age: "",
    gender: "Male",
    mobile: "",
    tripId: "",
    trainClass: "Sleeper",
    ticketStatus: "Confirmed",
    roomType: "",
    basePrice: "",
    advancePaid: "",
    paymentMode: "UPI",
    paymentStatus: "Pending",
    notes: "",
    email: "",
    departureDate: "",
    pickupCity: "",
    skipDays: "0",
    adjustedPrice: "",
    joiningDate: ""
  });

  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    if (open) {
      const loadTrips = async () => {
        try {
          const t = await bookingsService.getTrips();
          setTrips(t);
        } catch (e) { console.error(e); }
      };
      loadTrips();

      const loadSettings = async () => {
        try {
          const s = await settingsService.get();
          setSettings(s);
        } catch (e) { console.error(e); }
      };
      loadSettings();

      if (booking) {
        setForm({
          fullName: booking.fullName,
          age: (booking.age || 0).toString(),
          gender: booking.gender,
          mobile: booking.mobile,
          tripId: booking.tripId,
          trainClass: booking.trainClass,
          ticketStatus: booking.ticketStatus,
          roomType: booking.roomType,
          basePrice: (booking.basePrice || 0).toString(),
          advancePaid: booking.advancePaid.toString(),
          paymentMode: booking.paymentMode,
          paymentStatus: booking.paymentStatus,
          notes: booking.notes || "",
          email: booking.email || "",
          departureDate: booking.departureDate ? new Date(booking.departureDate).toISOString().split('T')[0] : "",
          pickupCity: booking.pickupCity || "",
          skipDays: (booking.skipDays || 0).toString(),
          adjustedPrice: booking.adjustedPrice ? booking.adjustedPrice.toString() : "",
          joiningDate: booking.joiningDate ? new Date(booking.joiningDate).toISOString().split('T')[0] : ""
        });
      } else {
        setForm({
          fullName: "",
          age: "",
          gender: "Male",
          mobile: "",
          tripId: "",
          trainClass: "Sleeper",
          ticketStatus: "Confirmed",
          roomType: "",
          basePrice: "",
          advancePaid: "",
          paymentMode: "UPI",
          paymentStatus: "Pending",
          notes: "",
          email: "",
          departureDate: "",
          pickupCity: "",
          skipDays: "0",
          adjustedPrice: "",
          joiningDate: ""
        });
      }
    }
  }, [open, booking]);

  const selectedTrip = trips.find(t => t.id === form.tripId || t.tripCode === form.tripId);
  const gstRate = (selectedTrip?.gstPercentage ?? 5) / 100;

  const base = parseFloat(form.basePrice) || 0;
  const advance = parseFloat(form.advancePaid) || 0;

  const gst = Math.round(base * gstRate);
  const total = base + gst;
  const remaining = total - advance;

  const handleSubmit = async () => {
    if (!form.fullName || !form.age || !form.mobile || !form.roomType || !form.basePrice || !form.departureDate) {
      toast.error("Please fill all required fields (Name, Age, Mobile, Room, Price, Date)");
      return;
    }

    if (form.mobile.length !== 10) {
      toast.error("Mobile number must be 10 digits");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        age: parseInt(form.age),
        basePrice: base,
        gstAmount: gst,
        totalAmount: total,
        advancePaid: advance,
        remainingAmount: remaining,
        departureDate: new Date(form.departureDate),
        gender: form.gender as any,
        trainClass: form.trainClass as any,
        ticketStatus: form.ticketStatus as any,
        paymentMode: form.paymentMode as any,
        paymentStatus: form.paymentStatus as any,
        pickupCity: form.pickupCity || null,
        skipDays: parseInt(form.skipDays) || 0,
        adjustedPrice: form.adjustedPrice ? parseFloat(form.adjustedPrice) : null,
        joiningDate: form.joiningDate ? new Date(form.joiningDate) : null
      };

      if (booking?.id) {
        await bookingsService.update(booking.id, payload);
        toast.success("Booking updated successfully!");
      } else {
        await bookingsService.create(payload);
        toast.success("Booking created successfully!");
      }
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        <DialogHeader className="bg-[#1e293b] px-6 py-4 flex flex-row items-center justify-between text-white space-y-0">
          <DialogTitle className="text-lg font-bold uppercase tracking-widest">
            {booking ? `Edit Booking: ${booking.bookingId}` : "New SaaS Booking"}
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-white/60 hover:text-white hover:bg-white/10 h-auto p-1">
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="p-8 max-h-[80vh] overflow-y-auto space-y-8 bg-gray-50/50">
          <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-2 mb-4">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Personal Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Full Name *</Label>
                <Input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Guest Name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Mobile Number *</Label>
                <Input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} placeholder="10 Digit Number" maxLength={10} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Email Address *</Label>
                <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="customer@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Age *</Label>
                <Input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} placeholder="Age" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Gender *</Label>
                <Select value={form.gender} onValueChange={v => setForm({...form, gender: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-2 mb-4">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Expedition Selection</h3>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-gray-400">Select Trip *</Label>
              <Select value={form.tripId} onValueChange={v => setForm({...form, tripId: v})}>
                <SelectTrigger><SelectValue placeholder="Select Trip" /></SelectTrigger>
                <SelectContent>
                  {trips.map(t => (
                    <SelectItem key={t.id} value={t.tripCode}>{t.tripCode} — {t.tripName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-2 mb-4">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Travel Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Train Class *</Label>
                <Select value={form.trainClass} onValueChange={v => setForm({...form, trainClass: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sleeper">Sleeper</SelectItem>
                    <SelectItem value="3AC">3AC</SelectItem>
                    <SelectItem value="Flight">Flight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Departure Date *</Label>
                <Input type="date" value={form.departureDate} onChange={e => setForm({...form, departureDate: e.target.value})} className="font-bold text-blue-600" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Ticket Status *</Label>
                <Select value={form.ticketStatus} onValueChange={v => setForm({...form, ticketStatus: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Waiting">Waiting</SelectItem>
                    <SelectItem value="Not Booked">Not Booked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Room Type *</Label>
                <Input value={form.roomType} onChange={e => setForm({...form, roomType: e.target.value})} placeholder="e.g. Triple Sharing / Couple Room" />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-2 mb-4">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Multi-City Joining Option</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Pickup City</Label>
                <Input value={form.pickupCity} onChange={e => setForm({...form, pickupCity: e.target.value})} placeholder="e.g. Ahmedabad" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Joining Date</Label>
                <Input type="date" value={form.joiningDate} onChange={e => setForm({...form, joiningDate: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Skip Days</Label>
                <Input type="number" value={form.skipDays} onChange={e => setForm({...form, skipDays: e.target.value})} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Adjusted Price / Person</Label>
                <Input type="number" value={form.adjustedPrice} onChange={e => setForm({...form, adjustedPrice: e.target.value})} placeholder="Base price minus deduction" />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-2 mb-4">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Payment & Pricing</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Base Price *</Label>
                <Input type="number" value={form.basePrice} onChange={e => setForm({...form, basePrice: e.target.value})} placeholder="₹ 0.00" className="font-bold text-gray-900" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">GST ({Math.round(gstRate * 100)}%)</Label>
                <div className="h-10 px-3 flex items-center bg-gray-50 border rounded-md font-bold text-gray-400">
                  ₹ {gst.toLocaleString()}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Total Amount</Label>
                <div className="h-10 px-3 flex items-center bg-blue-50 border border-blue-100 rounded-md font-black text-blue-600">
                  ₹ {total.toLocaleString()}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Advance Paid</Label>
                <Input type="number" value={form.advancePaid} onChange={e => setForm({...form, advancePaid: e.target.value})} placeholder="₹ 0.00" className="font-bold text-emerald-600" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Remaining Amount</Label>
                <div className="h-10 px-3 flex items-center bg-red-50 border rounded-md font-black text-red-600">
                  ₹ {remaining.toLocaleString()}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Payment Mode</Label>
                <Select value={form.paymentMode} onValueChange={v => setForm({...form, paymentMode: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Payment Status</Label>
                <Select value={form.paymentStatus} onValueChange={v => setForm({...form, paymentStatus: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-2 mb-4">
              <FileText className="w-4 h-4 text-gray-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Other Details</h3>
            </div>
            <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any special remarks..." className="min-h-[80px]" />
          </section>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest px-8 h-12 rounded-xl shadow-lg shadow-blue-100"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {booking ? "Update Booking" : "Complete Booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
