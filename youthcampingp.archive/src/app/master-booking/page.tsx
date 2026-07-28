import DynamicBookingForm from '@/components/DynamicBookingForm';

export default async function MasterBookingPage() {
  // We'll look up the form named 'Master Booking Form'
  // In a real app, you might pass this via URL or fetch it by name
  // For now, we'll use a placeholder or the first one found
  
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="pt-24 pb-12">
        <DynamicBookingForm formId="master-booking-placeholder" />
      </div>
    </main>
  );
}
