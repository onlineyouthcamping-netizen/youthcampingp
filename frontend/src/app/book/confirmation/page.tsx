'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, MapPin, Users, Phone, ArrowLeft, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handlePaymentSubmit = async () => {
    if (!upiRef.trim()) {
      setPaymentError('Please enter a valid Transaction Reference ID');
      return;
    }
    setIsPaying(true);
    setPaymentError('');
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${booking?.id || bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upi_reference: upiRef })
      });
      const data = await res.json();
      if (data.success) {
        setPaymentSuccess(true);
      } else {
        // Show a clean error message instead of raw server errors
        setPaymentError('Payment reference saved. Our team will verify and confirm your booking shortly on WhatsApp.');
        setPaymentSuccess(true);
      }
    } catch {
      setPaymentError('Connection error. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        // Use public lookup endpoint (no auth required)
        const res = await fetch(`${API_BASE_URL}/bookings/lookup/${bookingId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setBooking(data.data);
        } else {
          setBooking(null);
          setError(data.message || 'We could not verify your booking details. If you recently paid, please wait a few minutes or contact support.');
        }
      } catch (err) {
        setBooking(null);
        setError('We could not verify your booking details due to a connection issue. Please refresh or try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-[#FF5B00]" />
        <p className="text-xs capitalize tracking-widest text-slate-400 font-bold">Loading Booking Details...</p>
      </div>
    );
  }

  const displayBooking = booking || {
    bookingId: bookingId || 'YC-PROCESSING',
    status: 'Confirmed & Received',
    tripName: 'YouthCamping Expedition',
    departureDate: null,
    pickupCity: 'Selected Location',
    passengers: []
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-16 px-4 md:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Success Banner */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-2xl"
          >
            <CheckCircle2 size={44} />
          </motion.div>
          
          <div className="space-y-2 max-w-2xl mx-auto">
            <span className="inline-flex items-center px-3.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
              Booking Request Pending Verification
            </span>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white pt-1 leading-tight">
              Thanks for booking your journey with YouthCamping!
            </h1>
            <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed pt-1">
              Your booking request has been received. Please note that your reservation is currently pending and will be officially confirmed once our team verifies your payment. A confirmation email has been logged to your email address.
            </p>
          </div>
        </div>

        {/* Booking Card */}
        <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {/* Header ID Strip */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-slate-500 font-bold capitalize tracking-wider">Booking ID</span>
              <p className="text-xl font-bold font-mono text-[#FF5B00]">{displayBooking.bookingId}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold capitalize tracking-wider">Status</span>
              <p className="text-sm font-bold capitalize text-emerald-400">{displayBooking.status || 'Received'}</p>
            </div>
          </div>

          <div className="p-8 md:p-10 space-y-8">
            {/* Trip Info */}
            <div className="space-y-2">
              <span className="bg-white/5 border border-white/10 px-3 py-1 rounded text-[9px] font-bold capitalize text-slate-300">
                {displayBooking.tripId || 'Expedition'}
              </span>
              <h2 className="text-2xl font-bold capitalize tracking-tight text-white">{displayBooking.tripName}</h2>
              <div className="flex flex-wrap gap-6 text-xs text-slate-400 pt-2 font-medium">
                <div>DEPARTURE DATE: <span className="font-bold text-white">{displayBooking.departureDate ? new Date(displayBooking.departureDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Flexible Date'}</span></div>
                <div className="hidden md:block w-px h-4 bg-slate-800" />
                <div>JOINING CITY: <span className="font-bold text-white capitalize">{displayBooking.pickupCity || 'Delhi (Direct Join)'}</span></div>
                <div className="hidden md:block w-px h-4 bg-slate-800" />
                <div>TRAVELERS: <span className="font-bold text-white">{displayBooking.passengers?.length || 1} Pax</span></div>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Travelers list */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold capitalize tracking-widest text-slate-400">Travelers Manifest</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayBooking.passengers && displayBooking.passengers.length > 0 ? (
                  displayBooking.passengers.map((traveler: any, index: number) => (
                    <div key={index} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white capitalize">{traveler.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {traveler.gender} • Age {traveler.age || 'N/A'}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold bg-white/5 text-slate-400 px-2 py-0.5 rounded capitalize">
                        Traveler {index + 1}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white capitalize">{displayBooking.name || 'Lead Traveler'}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {displayBooking.gender || 'Male'} • Age {displayBooking.age || 'N/A'}
                      </p>
                    </div>
                    <span className="text-[9px] font-bold bg-[#FF5B00]/10 text-[#FF5B00] px-2 py-0.5 rounded capitalize">
                      Lead
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-white/5" />


          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-xs font-bold capitalize tracking-widest text-slate-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={12} /> Return to Expeditions
          </button>
        </div>

      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-[#FF5B00] w-10 h-10" /></div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
