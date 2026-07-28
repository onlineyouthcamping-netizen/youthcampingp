'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';

export default function BookingLinkResolvePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const run = async () => {
      setError('');
      try {
        const resolveUrl = new URL(`${API_BASE_URL}/booking-links/resolve`);
        resolveUrl.searchParams.set('token', token);
        resolveUrl.searchParams.set('_t', String(Date.now()));

        const res = await fetch(resolveUrl.toString(), { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          setError(json?.message || 'Invalid or expired booking link');
          return;
        }

        const data = json.data || {};

        const qs = new URLSearchParams();
        if (data.tripName) qs.set('trip', String(data.tripName));
        if (data.tripId) qs.set('tid', String(data.tripId));
        if (data.departureDate) {
          // Keep only date part for stable parsing in the wizard
          qs.set('date', String(data.departureDate).slice(0, 10));
        }
        if (data.pickupCity) qs.set('pickupCity', String(data.pickupCity));
        if (data.paymentMode) qs.set('payMode', String(data.paymentMode));
        if (data.customAmount !== undefined && data.customAmount !== null) {
          qs.set('bookAmt', String(data.customAmount));
        }
        if (data.customTime) qs.set('customTime', String(data.customTime));
        if (data.headerTitle) qs.set('headerTitle', String(data.headerTitle));
        if (data.headerSubtitle) qs.set('headerSubtitle', String(data.headerSubtitle));
        if (data.bookingLinkId) qs.set('sourceBookingLinkId', String(data.bookingLinkId));
        
        if (data.customerName) qs.set('customerName', String(data.customerName));
        if (data.customerPhone) qs.set('customerPhone', String(data.customerPhone));
        if (data.customerEmail) qs.set('customerEmail', String(data.customerEmail));
        if (data.travelerCount) qs.set('travelerCount', String(data.travelerCount));

        router.replace(`/book?${qs.toString()}`);
      } catch {
        setError('Failed to load booking link. Please try again.');
      }
    };

    run();
  }, [token, router]);

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
        {error ? (
          <>
            <h1 className="text-lg font-bold capitalize tracking-tight text-red-600">Booking Link Unavailable</h1>
            <p className="mt-2 text-sm text-slate-600 font-medium">{error}</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-bold capitalize tracking-tight text-slate-900">Opening your booking link...</h1>
            <p className="mt-2 text-sm text-slate-600 font-medium">Please wait.</p>
          </>
        )}
      </div>
    </main>
  );
}
