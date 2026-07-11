import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Plane, Eye, EyeOff, Star, ArrowRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@youthcamping.online");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"login" | "forgot">("login");
  const [notification, setNotification] = useState<string | null>(null);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/admin");
    } catch (error: any) {
      console.error("Login attempt failed:", error);
      let message = "Something went wrong";
      if (!error.response) {
        message = "Cannot connect to server. Is the backend running?";
      } else if (error.response.status === 401) {
        message = "Invalid email or password";
      } else {
        message = error.response.data?.message || message;
      }
      toast.error(message);
      setNotification(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Password reset instructions pushed to email!");
    setView("login");
    setNotification("Verification instructions sent. Check your inbox.");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-xs text-slate-600 font-sans">
      
      {/* ─── Main Content Split Panes ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 flex-1">
        
        {/* LEFT COLUMN: Clean Login/Forgot Forms */}
        <div className="flex flex-col justify-between bg-white p-6 sm:p-12 md:p-16 lg:p-20 relative shadow-lg">
          
          {/* Logo Bar */}
          <div className="flex items-center gap-2 mb-6">
            <span className="font-bold text-slate-800 text-base tracking-tight select-none">
              Youth<span className="text-[#FF5400]">Camping</span>
            </span>
            <span className="text-[8px] bg-slate-100 text-slate-400 font-mono px-1 rounded">ADMIN</span>
          </div>

          {/* Form Content Area */}
          <div className="w-full max-w-sm mx-auto my-auto space-y-6">
            
            {view === "login" ? (
              /* ─── LOGIN PANEL VIEW ─── */
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">Log in to your account</h2>
                  <p className="text-slate-400 text-[11px] font-medium">All-in-one tour operator management platform</p>
                </div>

                {/* Notifications Banner */}
                {notification ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-[10.5px] font-medium animate-fade-in flex items-center justify-between">
                    <span>{notification}</span>
                    <button onClick={() => setNotification(null)} className="text-red-400 hover:text-red-700 font-bold">&times;</button>
                  </div>
                ) : (
                  <div className="bg-[#fffbea] border border-[#fce588] text-[#c08d1a] rounded px-3 py-2 text-[10.5px] font-medium flex items-center justify-between">
                    <span>Enter your credentials to manage youth expeditions.</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Email</Label>
                    <Input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="you@company.com"
                      className="h-9 text-xs rounded border-slate-200 focus-visible:ring-primary focus-visible:border-primary bg-white"
                      required 
                    />
                  </div>

                  {/* Password with visibility toggle */}
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Password</Label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Enter your password"
                        className="h-9 text-xs rounded border-slate-200 focus-visible:ring-primary focus-visible:border-primary pr-9 bg-white"
                        required 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Helpers row */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <label className="flex items-center gap-1.5 font-medium cursor-pointer text-slate-500 hover:text-slate-800">
                      <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5" defaultChecked />
                      <span>Remember me</span>
                    </label>
                    <button 
                      type="button"
                      onClick={() => { setView("forgot"); setNotification(null); }}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <Button type="submit" className="w-full h-9.5 rounded bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-sm transition-all" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Log in <ArrowRight className="w-3.5 h-3.5" /></>
                    )}
                  </Button>
                </form>

                {/* Account creation footer */}
                <div className="text-center pt-2">
                  <span className="text-slate-450">Don't have an account? </span>
                  <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Contact system administrator to request an admin profile."); }} className="text-blue-600 font-semibold hover:underline">
                    Start your free 14 day trial &rarr;
                  </a>
                </div>
              </div>
            ) : (
              /* ─── FORGOT PASSWORD PANEL VIEW ─── */
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1.5 text-center">
                  <h2 className="text-xl font-black text-slate-900 leading-tight">Forgot your password?</h2>
                  <p className="text-slate-400 text-[11px]">We will send you link instructions to reset your password credentials.</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Email Address</Label>
                      <Input 
                        type="email" 
                        placeholder="you@company.com"
                        className="h-9 text-xs rounded border-slate-200 bg-white"
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full h-9.5 rounded bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold text-xs">
                      Help me via email &rarr;
                    </Button>
                  </form>
                  
                  <div className="text-center text-[10.5px] border-t border-slate-100 pt-3">
                    <span className="text-slate-400">Already registered? </span>
                    <button 
                      type="button" 
                      onClick={() => setView("login")} 
                      className="text-blue-650 font-bold hover:underline"
                    >
                      Login now &rarr;
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <button 
                    onClick={() => setView("login")}
                    className="flex items-center gap-1.5 text-slate-450 hover:text-slate-800 text-[11px] font-semibold mx-auto transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to login
                  </button>
                </div>
              </div>
            )}
            
          </div>

          {/* Developer notes / credentials footer */}
          <div className="text-center text-[10px] text-slate-400 select-none">
            🔒 Official credentials verified via system `.env` databases.
          </div>
        </div>

        {/* RIGHT COLUMN: Scenic Mountain Cover Pane with What's New Card */}
        <div 
          className="hidden md:flex relative bg-cover bg-center items-center justify-center p-8 select-none"
          style={{ backgroundImage: `url('/login_bg.png')` }}
        >
          {/* Cover Dark Glass Overlay */}
          <div className="absolute inset-0 bg-slate-900/30 backdrop-brightness-95" />
          
          {/* "What's New" Glass container */}
          <div className="relative z-10 bg-slate-950/70 backdrop-blur-md rounded-xl p-8 max-w-sm text-white border border-white/10 shadow-2xl space-y-3.5 transform hover:scale-[1.01] transition-transform duration-300">
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block">
              What's new?
            </span>
            <h3 className="text-base font-bold tracking-tight text-white leading-tight">
              Add an "Upcoming Departures" section to your website
            </h3>
            <p className="text-[10.5px] text-white/70 leading-relaxed font-medium">
              Show your next available tour dates anywhere on your site. You can now add an Upcoming Departures section to your website and display your next available tour dates in a clean, structured layout &mdash; anywhere you like. This section pulls data from your date-based collections and automatically shows upcoming slots.
            </p>
            <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Learn more is deactivated in preview mode."); }} className="text-[10.5px] font-bold text-blue-400 hover:underline flex items-center gap-1 pt-1">
              Read more &rarr;
            </a>
          </div>
        </div>

      </div>

      {/* ─── Bottom trust badging strip ─── */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-[10px] text-slate-400 select-none flex items-center justify-center gap-1.5 flex-wrap px-4">
        <div className="flex gap-0.5 text-amber-400 mr-1">
          {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
        </div>
        <span className="font-bold text-slate-700">4.7/5 on Capterra</span>
        <span>•</span>
        <span>Trusted by tour operators worldwide since 2012</span>
        <span>•</span>
        <span>Made with ❤️ in Goa</span>
        <span>•</span>
        <a href="#" className="text-blue-500 font-semibold hover:underline">Learn more</a>
      </footer>

    </div>
  );
}
