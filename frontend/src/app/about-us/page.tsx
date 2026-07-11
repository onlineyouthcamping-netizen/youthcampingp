import { motion } from "framer-motion";
import { Compass, Heart, Shield, Zap } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

const values = [
  {
    title: "Boutique Scale",
    description: "We focus on small groups and intimate stays to ensure every traveler feels seen and every moment feels personal.",
    icon: Heart
  },
  {
    title: "Authentic Connection",
    description: "Our itineraries are built on deep relationships with local communities, giving you access to places others can't go.",
    icon: Compass
  },
  {
    title: "Safety & Care",
    description: "Remote exploration requires expert handling. Our team is trained in high-altitude safety and wilderness first aid.",
    icon: Shield
  },
  {
    title: "Impactful Travel",
    description: "We leave no trace and ensure our journeys contribute positively to the ecosystems and economies we visit.",
    icon: Zap
  }
];

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen pt-20">
      {/* Editorial Header */}
      <section className="py-24 px-6 border-b border-zinc-100">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-emerald-600 font-bold tracking-widest capitalize text-xs mb-6 block">Our Story</span>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-zinc-900 mb-12 leading-[0.9]">
            Redefining <br />
            <span className="italic font-serif font-normal text-zinc-400">The Journey</span>
          </h1>
          <p className="text-2xl md:text-3xl text-zinc-500 font-light max-w-4xl mx-auto leading-relaxed">
            YouthCamping was born out of a simple realization: the world&apos;s most beautiful places deserve to be experienced slowly, respectfully, and deeply.
          </p>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative aspect-[4/5] rounded-[60px] overflow-hidden shadow-2xl">
            <OptimizedImage 
              src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=2070" 
              alt="Travel Philosophy" className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-4xl font-bold tracking-tighter mb-8">Not Just A Travel Company, <br />But A Curator Of Moments</h2>
            <div className="space-y-6 text-lg text-zinc-600 font-light leading-relaxed">
              <p>
                Founded in 2018, YouthCamping started as a group of friends exploring the Himalayas. Today, we are a boutique travel platform specializing in high-end, editorial-style expeditions across the Indian subcontinent.
              </p>
              <p>
                We believe that the best stories are found off the beaten path. Whether it&apos;s sharing a cup of tea with a shepherd in Spiti or witnessing the first light on a frozen lake in Ladakh, we curate experiences that linger in the heart long after the trip is over.
              </p>
              <p>
                Our team consists of seasoned explorers, photographers, and hospitality experts who all share a common goal: to show you the world as it really is.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tighter mb-16 text-center">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <div key={i} className="p-10 bg-white rounded-[40px] shadow-sm hover:shadow-xl transition-all border border-zinc-100 group">
                <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-black mb-8 group-hover:bg-black group-hover:text-white transition-all">
                  <v.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-4 tracking-tight">{v.title}</h3>
                <p className="text-zinc-500 font-light leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
