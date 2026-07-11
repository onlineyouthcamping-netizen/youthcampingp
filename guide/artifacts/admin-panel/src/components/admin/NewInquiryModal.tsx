import { useState, useEffect } from "react";
import { AdminModal } from "./AdminModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { tripsService } from "@/services/trips.service";
import { inquiriesService } from "@/services/inquiries.service";
import type { Trip } from "@/types";
import { toast } from "sonner";
import { Loader2, X, Calendar } from "lucide-react";

interface NewInquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function NewInquiryModal({ open, onOpenChange, onSuccess }: NewInquiryModalProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [tripSelection, setTripSelection] = useState<"none" | "select">("none");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    tripId: "",
    date: "",
    message: "",
    sendEmail: false
  });

  useEffect(() => {
    if (open) {
      const loadTrips = async () => {
        setLoadingTrips(true);
        try {
          const data = await tripsService.getAll();
          setTrips(data);
        } catch (error) {
          toast.error("Failed to load trips");
        } finally {
          setLoadingTrips(false);
        }
      };
      loadTrips();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      toast.error("Name and phone are required");
      return;
    }

    setSubmitting(true);
    try {
      const selectedTrip = trips.find(t => t.id === form.tripId);
      await inquiriesService.create({
        ...form,
        tripTitle: selectedTrip?.title || undefined,
        source: 'backoffice',
        status: 'new'
      });
      toast.success("Inquiry created successfully");
      onOpenChange(false);
      onSuccess?.();
      setForm({ name: "", phone: "", email: "", tripId: "", date: "", message: "", sendEmail: false });
    } catch (error) {
      toast.error("Failed to create inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <div className="flex w-full items-center justify-end gap-3">
      <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-12 px-6 font-bold text-slate-600 border-slate-200">
        Discard
      </Button>
      <Button 
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] h-12 px-10 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Create Inquiry
      </Button>
    </div>
  );

  return (
    <AdminModal
      open={open}
      onOpenChange={onOpenChange}
      title="New Inquiry"
      description="Register a lead or customer request"
      footer={footer}
    >
      <div className="space-y-10">
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lead Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name *</Label>
              <Input 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Prospect name" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Number *</Label>
              <div className="flex h-11 rounded-xl border border-slate-200 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <div className="w-14 h-full bg-slate-50 border-r border-slate-200 flex items-center justify-center text-xs font-black text-slate-400">
                  +91
                </div>
                <Input 
                  value={form.phone} 
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="10-digit number" 
                  className="h-full border-none rounded-none flex-1 focus-visible:ring-0 shadow-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</Label>
              <Input 
                type="email"
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="customer@example.com" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Preferred Travel Date</Label>
              <div className="relative">
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input 
                  type="date"
                  value={form.date} 
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expedition Interest</h3>
          </div>

          <div className="space-y-4">
            <RadioGroup value={tripSelection} onValueChange={(v: any) => setTripSelection(v)} className="flex items-center gap-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="no-trip" />
                <Label htmlFor="no-trip" className="text-xs font-bold text-slate-600 cursor-pointer">General Inquiry</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="select" id="select-trip" />
                <Label htmlFor="select-trip" className="text-xs font-bold text-slate-600 cursor-pointer">Specific Experience</Label>
              </div>
            </RadioGroup>

            {tripSelection === "select" && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <Select value={form.tripId} onValueChange={(v) => setForm({ ...form, tripId: v })}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue placeholder={loadingTrips ? "Loading experiences..." : "Select experience"} />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map(trip => (
                      <SelectItem key={trip.id} value={trip.id}>
                        <span className="font-black text-primary mr-2 uppercase tracking-tighter text-[10px]">{trip.shortName || trip.id.substring(0, 4)}</span>
                        {trip.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Internal Notes / Requirements</Label>
          <Textarea 
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            placeholder="What is the customer looking for?" 
            className="min-h-[120px] rounded-2xl border-slate-200 shadow-sm transition-all focus-visible:ring-primary/20 focus-visible:border-primary p-4"
          />
        </section>

        <section className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Automated Confirmation</h4>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Send acknowledgement email to customer</p>
          </div>
          <Checkbox 
            id="send-email" 
            checked={form.sendEmail}
            onCheckedChange={(v: boolean) => setForm({ ...form, sendEmail: v })}
            className="w-6 h-6 rounded-lg data-[state=checked]:bg-primary border-slate-200 shadow-none"
          />
        </section>
      </div>
    </AdminModal>
  );
}
