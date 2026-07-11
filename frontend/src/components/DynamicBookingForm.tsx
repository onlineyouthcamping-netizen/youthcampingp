"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Phone, Calendar, Hash, Train, Bed, 
  CreditCard, CheckCircle, Send, Loader2, 
  AlertCircle, ChevronDown
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface DynamicBookingFormProps {
  formId: string;
}

const DynamicBookingForm: React.FC<DynamicBookingFormProps> = ({ formId }) => {
  // 1. DATA SAFETY: Controlled State with safe defaults
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    trainClass: '',
    ticketStatus: '',
    advancePayment: '',
    advanceTransactionId: '',
    advanceVerifiedBy: '',
    advancePaymentDate: '',
    remainingPayment: '',
    remainingTransactionId: '',
    remainingVerifiedBy: '',
    remainingPaymentDate: '',
    mobileNumber: '',
    room: '',
    remark: ''
  });

  const [applyGST, setApplyGST] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 2. GST LOGIC: Real-time calculation using useMemo for stability
  const pricing = useMemo(() => {
    const advance = parseFloat(formData.advancePayment) || 0;
    const remaining = parseFloat(formData.remainingPayment) || 0;
    const subtotal = advance + remaining;
    const gst = applyGST ? subtotal * 0.05 : 0;
    return {
      subtotal,
      gst,
      total: subtotal + gst
    };
  }, [formData.advancePayment, formData.remainingPayment, applyGST]);

  const { subtotal, gst: gstAmount, total: totalAmount } = pricing;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 7. ERROR HANDLING: Prevent empty submission
    if (!formData.name.trim() || !formData.mobileNumber.trim()) {
      setError("Please enter at least Name and Mobile Number.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 3. GOOGLE SHEET PAYLOAD: Send data as ARRAY in exact column order
      // Order: name, age, gender, trainClass, ticketStatus, advancePayment, advanceTxId, advanceVerified, advanceDate, remainingPayment, remainingTxId, remainingVerified, remainingDate, mobile, room, remark
      const payloadArray = [
        formData.name || '',
        formData.age || '',
        formData.gender || '',
        formData.trainClass || '',
        formData.ticketStatus || '',
        formData.advancePayment || '0',
        formData.advanceTransactionId || '',
        formData.advanceVerifiedBy || '',
        formData.advancePaymentDate || '',
        formData.remainingPayment || '0',
        formData.remainingTransactionId || '',
        formData.remainingVerifiedBy || '',
        formData.remainingPaymentDate || '',
        formData.mobileNumber || '',
        formData.room || '',
        formData.remark || ''
      ];

      const res = await fetch(`${API_BASE_URL}/dynamic-forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: payloadArray, 
          is_array: true,
          pricing: {
            subtotal: pricing.subtotal,
            gst: pricing.gst,
            total: pricing.total,
            gstEnabled: applyGST
          }
        })
      });

      const result = await res.json();
      if (result.success) {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(result.message || "Submission failed. Please check your data.");
      }
    } catch (err) {
      setError("Unable to connect to sync server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-12 bg-white rounded-[3rem] shadow-2xl text-center border-t-8 border-primary animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-4xl font-bold capitalize tracking-tighter mb-4">Booking Saved!</h2>
        <p className="text-muted-foreground mb-8 font-medium">Your data has been successfully pushed to the Master Sheet.</p>
        <button onClick={() => setSuccess(false)} className="w-full bg-primary py-5 rounded-2xl text-white font-bold capitalize tracking-widest text-xs hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">Create New Booking</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 pb-32 md:pb-12"> {/* 6. MOBILE FIX: Bottom spacing */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* --- PERSONAL INFO --- */}
        <Section title="Personal Info">
          <Input label="Full Name" icon={<User size={18}/>} value={formData.name} onChange={(v) => handleChange('name', v)} placeholder="Enter Name" />
          <Input label="Age" icon={<Hash size={18}/>} value={formData.age} onChange={(v) => handleChange('age', v)} placeholder="Enter Age" type="number" />
          <Select label="Gender" icon={<User size={18}/>} value={formData.gender} onChange={(v) => handleChange('gender', v)} options={['Male', 'Female']} />
          <Input label="Mobile Number" icon={<Phone size={18}/>} value={formData.mobileNumber} onChange={(v) => handleChange('mobileNumber', v)} placeholder="10-digit number" />
        </Section>

        {/* --- TRAVEL INFO --- */}
        <Section title="Travel Info">
          <Select label="Train Class" icon={<Train size={18}/>} value={formData.trainClass} onChange={(v) => handleChange('trainClass', v)} options={['3AC', 'SL']} />
          <Select label="Ticket Status" icon={<CheckCircle size={18}/>} value={formData.ticketStatus} onChange={(v) => handleChange('ticketStatus', v)} options={['Done', 'Pending']} />
          <Select label="Room Sharing" icon={<Bed size={18}/>} value={formData.room} onChange={(v) => handleChange('room', v)} options={['1 Room', '2 Room', '3 Room']} />
        </Section>

        {/* --- PAYMENT INFO --- */}
        <Section title="Payment Info">
          <Input label="Advance Payment" icon={<CreditCard size={18}/>} value={formData.advancePayment} onChange={(v) => handleChange('advancePayment', v)} placeholder="₹ Amount" type="number" />
          <Input label="Advance Txn ID" icon={<Hash size={18}/>} value={formData.advanceTransactionId} onChange={(v) => handleChange('advanceTransactionId', v)} placeholder="TXN123..." />
          <Input label="Advance Verified By" icon={<User size={18}/>} value={formData.advanceVerifiedBy} onChange={(v) => handleChange('advanceVerifiedBy', v)} placeholder="Staff Name" />
          <Input label="Advance Payment Date" icon={<Calendar size={18}/>} value={formData.advancePaymentDate} onChange={(v) => handleChange('advancePaymentDate', v)} type="date" />
          
          <Input label="Remaining Payment" icon={<CreditCard size={18}/>} value={formData.remainingPayment} onChange={(v) => handleChange('remainingPayment', v)} placeholder="₹ Amount" type="number" />
          <Input label="Remaining Txn ID" icon={<Hash size={18}/>} value={formData.remainingTransactionId} onChange={(v) => handleChange('remainingTransactionId', v)} placeholder="TXN456..." />
          <Input label="Remaining Verified By" icon={<User size={18}/>} value={formData.remainingVerifiedBy} onChange={(v) => handleChange('remainingVerifiedBy', v)} placeholder="Staff Name" />
          <Input label="Remaining Payment Date" icon={<Calendar size={18}/>} value={formData.remainingPaymentDate} onChange={(v) => handleChange('remainingPaymentDate', v)} type="date" />
        </Section>

        {/* --- OTHER --- */}
        <Section title="Other">
          <div className="md:col-span-2 lg:col-span-3">
            <label className="text-[10px] font-bold capitalize tracking-widest text-muted-foreground mb-2 block">Remark</label>
            <textarea 
              className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 min-h-[100px] outline-none focus:border-primary transition-all font-medium text-sm"
              value={formData.remark}
              onChange={(e) => handleChange('remark', e.target.value)}
              placeholder="Any special requests or notes..."
            />
          </div>
        </Section>

        {/* --- GST & TOTAL --- */}
        <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-xl">
          <div className="flex items-center gap-4">
            <div 
              onClick={() => setApplyGST(!applyGST)}
              className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all flex items-center ${applyGST ? 'bg-primary' : 'bg-zinc-700'}`}
            >
              <motion.div 
                animate={{ x: applyGST ? 24 : 0 }}
                className="w-6 h-6 bg-white rounded-full shadow-lg"
              />
            </div>
            <div>
              <p className="text-xs font-bold capitalize tracking-widest">Apply 5% GST</p>
              <p className="text-[10px] text-zinc-500 font-bold">Automatic Tax Calculation</p>
            </div>
          </div>

          <div className="flex gap-8 items-center text-right">
            <div>
              <p className="text-[10px] font-bold capitalize tracking-widest text-zinc-500">Subtotal</p>
              <p className="text-xl font-bold">₹{subtotal.toLocaleString()}</p>
            </div>
            {applyGST && (
              <div>
                <p className="text-[10px] font-bold capitalize tracking-widest text-primary">GST (5%)</p>
                <p className="text-xl font-bold">₹{gstAmount.toLocaleString()}</p>
              </div>
            )}
            <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold capitalize tracking-widest text-primary">Grand Total</p>
              <p className="text-3xl font-bold text-primary">₹{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* --- SUBMIT --- */}
        <button 
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-[2rem] shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 capitalize tracking-[0.2em] text-xs"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Send size={18}/> Sync to Master Sheet</>}
        </button>

      </form>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-4">
      <h3 className="text-xs font-bold capitalize tracking-[0.3em] text-zinc-400 whitespace-nowrap">{title}</h3>
      <div className="h-px bg-zinc-100 w-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  </div>
);

const Input = ({ label, icon, value, onChange, placeholder, type = "text" }: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold capitalize tracking-widest text-muted-foreground ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">
        {icon}
      </div>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-50 border-2 border-zinc-50 pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-primary/20 focus:bg-white transition-all font-bold text-sm"
      />
    </div>
  </div>
);

const Select = ({ label, icon, value, onChange, options }: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  options: string[];
}) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold capitalize tracking-widest text-muted-foreground ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors z-10 pointer-events-none">
        {icon}
      </div>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-50 border-2 border-zinc-50 pl-12 pr-10 py-4 rounded-2xl outline-none focus:border-primary/20 focus:bg-white transition-all font-bold text-sm appearance-none cursor-pointer relative"
      >
        <option value="">Select {label}</option>
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
        <ChevronDown size={14} />
      </div>
    </div>
  </div>
);

export default DynamicBookingForm;
;
