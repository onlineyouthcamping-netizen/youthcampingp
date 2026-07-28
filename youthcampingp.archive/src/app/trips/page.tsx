import TripCard from "@/components/TripCard";
import { fetchPublicTrips } from "@/lib/api";
import { Compass, Sparkles, Filter, ChevronLeft } from "lucide-react";
import Link from "next/link";

import { Trip } from "@/types";
export const revalidate = 30;


export default async function TripsPage() {
  let trips: Trip[] = [];
  try {
    const allTrips = await fetchPublicTrips();
    trips = allTrips.filter(t => t.status === 'published');
  } catch (error) {
    console.error("Error fetching trips:", error);
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Search/Header Hero */}
      <section className="pt-40 pb-20 px-6 bg-zinc-50 border-b border-zinc-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="max-w-3xl">
              <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-primary-orange mb-6 md:mb-8 font-bold text-xs capitalize tracking-widest transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back to Home
              </Link>
              <div className="flex items-center gap-3 text-primary-orange mb-6">
                <Compass className="w-6 h-6 animate-spin-slow" />
                <span className="font-bold tracking-[0.3em] capitalize text-xs">Curated Expeditions</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter text-navy mb-8 leading-[0.9]">
                Find Your <br />
                <span className="text-primary-orange">Next Escape</span>
              </h1>
              <p className="text-zinc-500 text-xl font-medium max-w-xl leading-relaxed">
                Choose from our hand-picked community adventures. From high-altitude treks to tropical escapes, your story starts here.
              </p>
            </div>
            
            {/* Quick Filters Placeholder */}
            <div className="flex flex-row overflow-x-auto no-scrollbar gap-4 pb-2 w-full md:w-auto">
              <button className="whitespace-nowrap px-8 py-4 bg-white border border-zinc-200 rounded-full font-bold text-sm flex items-center gap-3 hover:bg-navy hover:text-white hover:border-navy transition-all shadow-sm">
                <Filter className="w-4 h-4" />
                Filter by Region
              </button>
              <button className="whitespace-nowrap px-8 py-4 bg-navy text-white rounded-full font-bold text-sm flex items-center gap-3 shadow-xl hover:bg-primary-orange transition-all">
                <Sparkles className="w-4 h-4" />
                Show All
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trips Grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {trips.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
              {trips.map((trip, i) => (
                <TripCard key={trip.id} trip={trip} index={i} />
              ))}
            </div>
          ) : (
            <div className="py-40 text-center bg-zinc-50 rounded-[60px] border-2 border-dashed border-zinc-200">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Compass className="w-10 h-10 text-zinc-300" />
              </div>
              <h2 className="text-3xl font-bold capitalize text-navy mb-4">No expeditions found</h2>
              <p className="text-zinc-400 font-bold max-w-sm mx-auto capitalize tracking-widest text-xs">
                We are currently curating new routes. Check back in a few days!
              </p>
            </div>
          )}
        </div>
      </section>
      
    </div>
  );
}
