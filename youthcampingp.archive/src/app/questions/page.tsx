import QuestionList from "@/components/QuestionList";
import { HelpCircle, Sparkles, MapPin } from "lucide-react";

export const revalidate = 30;

export const metadata = {
  title: "Knowledge Quest | YouthCamping Experiences",
  description: "Test your travel knowledge with our interactive interactive quiz. Learn about destinations, culture, and adventure.",
};

export default function QuestionsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Header */}
      <section className="bg-slate-900 py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
           <div className="absolute top-10 left-10 w-40 h-40 bg-primary rounded-full blur-3xl animate-pulse" />
           <div className="absolute bottom-10 right-10 w-60 h-60 bg-teal-500 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-primary text-[10px] font-bold capitalize tracking-widest mb-8">
            <Sparkles size={14} /> Interactive Experience
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tighter leading-none">
            Knowledge <span className="text-primary italic font-serif font-light">Quest</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg font-light leading-relaxed">
            Test your travel IQ with our curated collection of questions about destinations, adventure, and local cultures. Are you a true explorer?
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-6 -mt-16 pb-32">
        <QuestionList />
      </main>

      {/* Footer Info */}
      <section className="container mx-auto px-6 pb-24 text-center">
         <div className="max-w-3xl mx-auto bg-white rounded-[3rem] p-12 shadow-2xl shadow-slate-200/50 border border-slate-50">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Want to explore these places?</h2>
            <p className="text-slate-500 mb-10 leading-relaxed">
                Our questions are inspired by real experiences from our trips. If you want to witness these breathtaking locations in person, check out our upcoming expeditions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                    href="/tour-packages" 
                    className="bg-primary text-black px-10 py-5 rounded-2xl font-bold capitalize tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                >
                    View All Trips
                </a>
                <a 
                    href="/contact" 
                    className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold capitalize tracking-widest text-xs hover:bg-black transition-all"
                >
                    Talk to an Expert
                </a>
            </div>
         </div>
      </section>
    </div>
  );
}
