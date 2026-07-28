'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { User, Phone, Train, Bed, ChevronRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { API_BASE_URL as API } from '@/lib/api';

export default function TripBookingPage() {
  const params = useParams();
  const tripCode = (params.tripCode as string)?.toUpperCase();

  const [tripName, setTripName] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const [form, setForm] = useState({
    fullName: '', age: '', gender: 'Male', mobile: '',
    trainClass: 'Sleeper', ticketStatus: 'Not Booked', roomType: '', notes: ''
  });

  useEffect(() => {
    if (!tripCode) return;
    fetch(`${API}/bookings/trip-info/${tripCode}`)
      .then(r => r.json())
      .then(d => { if (d.success) { setTripName(d.data.tripName); } else { setNotFound(true); } })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [tripCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.mobile) return;
    if (form.mobile.length !== 10) return alert('Mobile must be 10 digits');

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/bookings/submit/${tripCode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) { setSuccess(true); setBookingId(data.data.bookingId); }
      else alert(data.message);
    } catch { alert('Submission failed. Please try again.'); }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white capitalize">Trip Not Found</h1>
        <p className="text-gray-400 mt-2">The booking link is invalid or this trip is no longer active.</p>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 to-slate-900 p-6">
      <div className="text-center max-w-md">
        <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white capitalize mb-2">Booking Submitted!</h1>
        <p className="text-emerald-200 mb-4">Your booking for <strong>{tripName}</strong> has been received.</p>
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6">
          <p className="text-xs text-white/50 capitalize tracking-widest mb-1">Your Booking ID</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{bookingId}</p>
        </div>
        <p className="text-sm text-gray-400">Our team will contact you shortly to confirm your booking and discuss payment details.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-500/20 text-blue-400 px-4 py-1 rounded-full text-xs font-bold capitalize tracking-widest mb-3">{tripCode}</div>
          <h1 className="text-3xl font-bold text-white capitalize tracking-tight">{tripName}</h1>
          <p className="text-gray-400 text-sm mt-2">Fill in your details to book this trip</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-white/40 capitalize tracking-widest flex items-center gap-2"><User className="w-3.5 h-3.5" /> Personal Info</h3>
            <input required placeholder="Full Name *" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <div className="grid grid-cols-3 gap-3">
              <input required placeholder="Mobile *" maxLength={10} value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} className="col-span-2 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              <input type="number" placeholder="Age" value={form.age} onChange={e => setForm({...form, age: e.target.value})} className="bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="Male" className="bg-slate-800">Male</option>
              <option value="Female" className="bg-slate-800">Female</option>
              <option value="Other" className="bg-slate-800">Other</option>
            </select>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-white/40 capitalize tracking-widest flex items-center gap-2"><Train className="w-3.5 h-3.5" /> Travel Details</h3>
            <select value={form.trainClass} onChange={e => setForm({...form, trainClass: e.target.value})} className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none">
              <option value="Sleeper" className="bg-slate-800">Sleeper</option>
              <option value="3AC" className="bg-slate-800">3AC</option>
              <option value="Flight" className="bg-slate-800">Flight</option>
            </select>
            <select value={form.ticketStatus} onChange={e => setForm({...form, ticketStatus: e.target.value})} className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none">
              <option value="Not Booked" className="bg-slate-800">Not Booked</option>
              <option value="Confirmed" className="bg-slate-800">Confirmed</option>
              <option value="Waiting" className="bg-slate-800">Waiting</option>
            </select>
            <input placeholder="Room Type (e.g. Triple Sharing)" value={form.roomType} onChange={e => setForm({...form, roomType: e.target.value})} className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none" />
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-white/40 capitalize tracking-widest">Notes</h3>
            <textarea placeholder="Any special requests..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm min-h-[80px] outline-none" />
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold capitalize tracking-widest py-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
            {submitting ? 'Submitting...' : 'Submit Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
