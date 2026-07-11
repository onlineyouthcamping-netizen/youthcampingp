import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-[32px] shadow-xl text-center border border-zinc-100">
        <h1 className="text-3xl font-bold text-navy mb-2">Login</h1>
        <p className="text-zinc-500 mb-8">This section is currently restricted.</p>
        
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-primary-orange font-bold hover:text-navy transition-colors bg-orange-50 px-6 py-3 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
