import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { settingsService } from "@/services/settings.service";
import { seoService } from "@/services/seo.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Globe,
  Settings,
  Palette,
  Layout,
  MessageSquare,
  Train,
  Search,
  Plus,
  Trash2,
  Save,
  Undo,
  Eye,
  Share2,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Link2,
  Shield,
  ArrowUpRight,
  Code,
  Smartphone,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle,
  BookOpen,
  MapPin,
  Star
} from "lucide-react";
import api from "@/services/api";
import BlogsPage from "./BlogsPage";
import AttractionsPage from "./AttractionsPage";
import ReviewsPage from "./ReviewsPage";
import DesignControlCenterPage from "./DesignControlCenterPage";

type TabId =
  | "overview"
  | "general"
  | "homepage"
  | "pages"
  | "blogs"
  | "attractions"
  | "reviews"
  | "navigation"
  | "footer"
  | "theme"
  | "inquiry"
  | "booking"
  | "seo"
  | "integrations"
  | "advanced";

export default function WebsiteControlCenterPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<any>({
    siteName: "",
    favicon: "",
    logo: { url: "", alt: "" },
    socialLinks: { instagram: "", facebook: "", youtube: "", linkedin: "", whatsapp: "" },
    navbarLinks: [],
    headerCtaText: "",
    headerStyle: "sticky",
    bookingForm: { submitButtonText: "", successMessage: "", checkoutNotes: "", gstOption: "full", roomSharingOptions: [], trainOptions: [] },
    inquiryPopup: { enabled: true, delay: 12, title: "", description: "" },
    googleAnalyticsId: "",
    facebookPixelId: ""
  });

  // Keep a copy to detect changes and reset
  const [originalSettings, setOriginalSettings] = useState<any>(null);

  // SEO details summary
  const [homepageSeo, setHomepageSeo] = useState<any>({
    metaTitle: "",
    metaDescription: ""
  });

  const baseUrl = import.meta.env.VITE_FRONTEND_URL || "https://youthcamping.online";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await settingsService.get();
      const formatted = {
        ...data,
        navbarLinks: data.navbarLinks || [],
        socialLinks: {
          instagram: data.socialLinks?.instagram || "",
          facebook: data.socialLinks?.facebook || "",
          youtube: data.socialLinks?.youtube || "",
          linkedin: data.socialLinks?.linkedin || "",
          whatsapp: data.socialLinks?.whatsapp || "",
          tripadvisor: data.socialLinks?.tripadvisor || "",
          twitter: data.socialLinks?.twitter || "",
          pinterest: data.socialLinks?.pinterest || "",
          blog: data.socialLinks?.blog || "",
          googleBusiness: data.socialLinks?.googleBusiness || ""
        },
        footer: data.footer || { brandName: "", address: "", phone: "", email: "", copyright: "", showSocial: true, columns: [] },
        bookingForm: data.bookingForm || {
          submitButtonText: "Confirm Booking",
          successMessage: "Your booking has been received!",
          checkoutNotes: "",
          gstOption: "full",
          roomSharingOptions: [],
          trainOptions: []
        },
        inquiryPopup: data.inquiryPopup || {
          enabled: true,
          delay: 12,
          title: "Plan Your Next Trip",
          description: "Connect with our destination experts"
        },
        googleAnalyticsId: data.googleAnalyticsId || "",
        facebookPixelId: data.facebookPixelId || ""
      };
      setSettings(formatted);
      setOriginalSettings(JSON.parse(JSON.stringify(formatted)));

      // Load homepage SEO details for summary
      try {
        const seo = await seoService.get("home");
        if (seo) {
          setHomepageSeo({
            metaTitle: seo.metaTitle || "",
            metaDescription: seo.metaDescription || ""
          });
        }
      } catch (e) {
        // Safe fail
      }
    } catch (err) {
      toast.error("Failed to load website configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await settingsService.update(settings);
      toast.success("Website Control Center settings saved");
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      // Revalidate frontend path
      api.post('/revalidate', { path: '/' }).catch(() => {});
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
      toast.info("Unsaved local changes discarded");
    }
  };

  // Detect if there are unsaved local modifications
  const isChanged = originalSettings ? JSON.stringify(settings) !== JSON.stringify(originalSettings) : false;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-6">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Control Center...</p>
      </div>
    );
  }

  const menuItems = [
    { id: "overview", label: "Overview", icon: Globe },
    { id: "general", label: "General Settings", icon: Settings },
    { id: "homepage", label: "Homepage Sections", icon: Layout },
    { id: "pages", label: "Public Pages", icon: Link2 },
    { id: "blogs", label: "Watch & Read", icon: BookOpen },
    { id: "attractions", label: "Attractions", icon: MapPin },
    { id: "reviews", label: "Review Center", icon: Star },
    { id: "navigation", label: "Navigation & Header", icon: Sparkles },
    { id: "footer", label: "Footer Details", icon: Layout },
    { id: "theme", label: "Design Control Center", icon: Palette },
    { id: "inquiry", label: "Inquiry Popup", icon: MessageSquare },
    { id: "booking", label: "Booking Engine", icon: Train },
    { id: "seo", label: "SEO & Search", icon: Search },
    { id: "integrations", label: "Integrations", icon: Code },
    { id: "advanced", label: "Advanced Settings", icon: Shield }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4 animate-fade-in">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#E3EAF2] gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Website Control Center</h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Configure, preview, and update your public frontend portal</p>
        </div>
        
        {/* Top-Right workspace actions */}
        <div className="flex items-center gap-2">
          {activeTab !== "overview" && isChanged && (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="h-8 rounded-[4px] px-3 text-xs font-semibold"
              >
                <Undo className="w-3.5 h-3.5 mr-1.5" /> Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !isChanged}
                className="h-8 rounded-[4px] px-4 text-xs font-semibold bg-[#F97316] hover:bg-[#EA580C] text-white shadow-sm"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                Save Changes
              </Button>
            </>
          )}
          <a
            href={baseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 px-3 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 text-xs font-semibold shadow-sm transition-colors"
          >
            Live Site <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </a>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Zoho Vertical Tab Menu */}
        <div className="lg:col-span-3 flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar pb-2 lg:pb-0 gap-0.5 bg-white p-1.5 rounded-[4px] border border-[#E2E8F0] lg:sticky lg:top-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabId)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-[3px] text-left text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#FFF8E6] text-primary border-l-2 border-primary"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Main Content Panel */}
        <div className="lg:col-span-9 animate-fade-in">
          
          {/* 1. OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Website Portal Status</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">Status logs of frontend content integrations.</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => navigate("/admin/page-builder")} 
                    className="h-7.5 bg-slate-800 hover:bg-slate-900 text-white rounded-[4px] px-3 text-[11px] font-semibold tracking-wide uppercase"
                  >
                    Open Builder
                  </Button>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Homepage status */}
                <Card className="rounded-[4px] border border-[#E2E8F0] p-4 space-y-2.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Homepage status</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-[2px] bg-emerald-55 text-emerald-600 border border-emerald-100 uppercase">Live</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">Dynamic Hero Video</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{settings.heroVideoEnabled ? "Video playback active" : "Static header image active"}</p>
                  </div>
                  <Button variant="link" onClick={() => setActiveTab("homepage")} className="text-primary hover:text-primary/95 text-xs font-semibold p-0 h-6 justify-start">
                    Edit Homepage Sections &rarr;
                  </Button>
                </Card>

                {/* Design Control Center Card */}
                <Card className="rounded-[4px] border border-[#E2E8F0] p-4 space-y-2.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Design Control Center</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-[2px] bg-primary/10 text-primary border border-primary/20 uppercase">Manage Visuals</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">Advanced Override System</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Configure page background colors, spacing & text overrides.</p>
                  </div>
                  <Button variant="link" onClick={() => navigate("/admin/design-control-center")} className="text-primary hover:text-primary/95 text-xs font-semibold p-0 h-6 justify-start">
                    Go to Design Control Center &rarr;
                  </Button>
                </Card>

                {/* Theme status */}
                <Card className="rounded-[4px] border border-[#E2E8F0] p-4 space-y-2.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Appearance Preset</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-[2px] bg-primary/10 text-primary border border-primary/20 uppercase">Orange Theme</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">Typography Setup</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Montserrat Font Family</p>
                  </div>
                  <Button variant="link" onClick={() => navigate("/admin/theme")} className="text-primary hover:text-primary/95 text-xs font-semibold p-0 h-6 justify-start">
                    Go to Theme Settings &rarr;
                  </Button>
                </Card>

                {/* Footer status */}
                <Card className="rounded-[4px] border border-[#E2E8F0] p-4 space-y-2.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Footer Setup</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-[2px] bg-emerald-55 text-emerald-600 border border-emerald-100 uppercase">Configured</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{settings.footer?.brandName || "YouthCamping"}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate font-medium">{settings.footer?.address || "Address Set"}</p>
                  </div>
                  <Button variant="link" onClick={() => navigate("/admin/footer-management")} className="text-primary hover:text-primary/95 text-xs font-semibold p-0 h-6 justify-start">
                    Manage Footer Grid &rarr;
                  </Button>
                </Card>

                {/* SEO status */}
                <Card className="rounded-[4px] border border-[#E2E8F0] p-4 space-y-2.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">SEO Presets</span>
                    <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">Active</span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase text-slate-800">Meta Tags</h4>
                    <p className="text-xs text-slate-500 mt-1 truncate font-medium">{homepageSeo.metaTitle || "Meta Title configured"}</p>
                  </div>
                  <Button variant="ghost" onClick={() => navigate("/admin/seo")} className="w-full text-primary hover:text-primary/90 text-xs font-bold uppercase h-8 p-0 justify-start">
                    Open SEO Optimizer &rarr;
                  </Button>
                </Card>

                {/* Inquiry Form */}
                <Card className="rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Inquiry System</span>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${settings.inquiryPopup?.enabled ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-400"}`}>
                      {settings.inquiryPopup?.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase text-slate-800">Trigger Delay</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{settings.inquiryPopup?.delay || 12}s delay on detail pages</p>
                  </div>
                  <Button variant="ghost" onClick={() => setActiveTab("inquiry")} className="w-full text-primary hover:text-primary/90 text-xs font-bold uppercase h-8 p-0 justify-start">
                    Configure Inquiry Options &rarr;
                  </Button>
                </Card>

                {/* Booking status */}
                <Card className="rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Booking Checkout</span>
                    <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">Operational</span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase text-slate-800">Gst Calculations</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Rule: {settings.bookingForm?.gstOption === "full" ? "Option A (Full)" : "Option B (Advance)"}</p>
                  </div>
                  <Button variant="ghost" onClick={() => setActiveTab("booking")} className="w-full text-primary hover:text-primary/90 text-xs font-bold uppercase h-8 p-0 justify-start">
                    Modify Checkout Rules &rarr;
                  </Button>
                </Card>

              </div>
            </div>
          )}

          {/* 2. GENERAL SETTINGS */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <Card className="rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 bg-white">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Brand Identity</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Edit public name, logo representations, and favicons.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Company Name *</Label>
                    <Input
                      value={settings.siteName || ""}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      placeholder="e.g. YouthCamping"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Favicon URL Path</Label>
                    <Input
                      value={settings.favicon || ""}
                      onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                      placeholder="e.g. /favicon.ico"
                      className="h-11 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Logo Image URL Path</Label>
                    <Input
                      value={settings.logo?.url || ""}
                      onChange={(e) => setSettings({ ...settings, logo: { ...settings.logo, url: e.target.value } })}
                      placeholder="e.g. /logo.png"
                      className="h-11 rounded-xl font-mono"
                    />
                    {settings.logo?.url && (
                      <div className="mt-2 h-16 rounded-xl border p-2 bg-slate-50 flex items-center justify-center max-w-xs overflow-hidden">
                        <img src={settings.logo.url} className="max-h-full object-contain" alt="Header Logo Preview" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Logo Alt Description</Label>
                    <Input
                      value={settings.logo?.alt || ""}
                      onChange={(e) => setSettings({ ...settings, logo: { ...settings.logo, alt: e.target.value } })}
                      placeholder="e.g. YouthCamping Logo"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
              </Card>

              {/* Public Contact Details */}
              <Card className="rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 bg-white">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Public Contact & Support</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Specify support coordinates shown to customers.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Support Email Address</Label>
                    <Input
                      value={settings.footer?.email || ""}
                      onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, email: e.target.value } })}
                      placeholder="e.g. info@youthcamping.com"
                      className="h-11 rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Support Hotline Number</Label>
                    <Input
                      value={settings.footer?.phone || ""}
                      onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, phone: e.target.value } })}
                      placeholder="e.g. +91 99242 46267"
                      className="h-11 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Office Physical Address</Label>
                  <Textarea
                    value={settings.footer?.address || ""}
                    onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, address: e.target.value } })}
                    placeholder="Physical HQ location details"
                    className="rounded-2xl min-h-[80px]"
                  />
                </div>
              </Card>

              {/* Social links */}
              <Card className="rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 bg-white">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Social Media Coordinates</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Integrate direct links for brand channels.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5 text-slate-450" /> Instagram</Label>
                    <Input
                      value={settings.socialLinks?.instagram || ""}
                      onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram: e.target.value } })}
                      placeholder="https://instagram.com/your-username"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Facebook className="w-3.5 h-3.5 text-slate-450" /> Facebook</Label>
                    <Input
                      value={settings.socialLinks?.facebook || ""}
                      onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })}
                      placeholder="https://facebook.com/your-username"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Youtube className="w-3.5 h-3.5 text-slate-450" /> YouTube Channel</Label>
                    <Input
                      value={settings.socialLinks?.youtube || ""}
                      onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, youtube: e.target.value } })}
                      placeholder="https://youtube.com/channel/..."
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Linkedin className="w-3.5 h-3.5 text-slate-450" /> LinkedIn Organization</Label>
                    <Input
                      value={settings.socialLinks?.linkedin || ""}
                      onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, linkedin: e.target.value } })}
                      placeholder="https://linkedin.com/company/..."
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-slate-450" /> WhatsApp Support Link</Label>
                    <Input
                      value={settings.socialLinks?.whatsapp || ""}
                      onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, whatsapp: e.target.value } })}
                      placeholder="https://wa.me/..."
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* 3. HOMEPAGE */}
          {activeTab === "homepage" && (
            <Card className="rounded-[4px] border border-[#E2E8F0] p-6 shadow-sm space-y-4 bg-white">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Homepage Content Presets</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Control individual sections and features on the website portal.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                <Button onClick={() => navigate("/admin/page-builder")} className="h-14 rounded-[4px] justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <Layout className="w-4 h-4 text-primary" />
                  <div className="text-left flex flex-col">
                    <span>Edit Grid Sections</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Page Builder</span>
                  </div>
                </Button>
                
                <Button onClick={() => navigate("/admin/theme")} className="h-14 rounded-[4px] justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <Palette className="w-4 h-4 text-primary" />
                  <div className="text-left flex flex-col">
                    <span>Appearance & Colors</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Branding preset</span>
                  </div>
                </Button>

                <Button onClick={() => setActiveTab("attractions")} className="h-14 rounded-[4px] justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <MapPin className="w-4 h-4 text-primary" />
                  <div className="text-left flex flex-col">
                    <span>Attractions Grid</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Destination cards</span>
                  </div>
                </Button>

                <Button onClick={() => navigate("/admin/reviews")} className="h-14 rounded-[4px] justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <div className="text-left flex flex-col">
                    <span>Customer Reviews</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Testimonial feed</span>
                  </div>
                </Button>

                <Button onClick={() => navigate("/admin/blogs")} className="h-14 rounded-[4px] justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <Globe className="w-4 h-4 text-primary" />
                  <div className="text-left flex flex-col">
                    <span>Watch & Read Blogs</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Articles & journals</span>
                  </div>
                </Button>

                <Button onClick={() => setActiveTab("navigation")} className="h-14 rounded-[4px] justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <Settings className="w-4 h-4 text-primary" />
                  <div className="text-left flex flex-col">
                    <span>Header Navigation</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Menu Links Setup</span>
                  </div>
                </Button>

                <Button onClick={() => setActiveTab("footer")} className="h-14 rounded-[4px] justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <Layout className="w-4 h-4 text-primary" />
                  <div className="text-left flex flex-col">
                    <span>Footer Details</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Bottom grid text</span>
                  </div>
                </Button>

                <Button onClick={() => setActiveTab("inquiry")} className="h-14 rounded-[4px] justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <div className="text-left flex flex-col">
                    <span>Inquiry Popups</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Trigger delay & text</span>
                  </div>
                </Button>

                <Button onClick={() => setActiveTab("booking")} className="h-14 rounded-[4px] justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <Train className="w-4 h-4 text-primary" />
                  <div className="text-left flex flex-col">
                    <span>Booking Checkout</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Engine options & GST</span>
                  </div>
                </Button>

                <Button onClick={() => setActiveTab("seo")} className="h-14 rounded-[4px] justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <Search className="w-4 h-4 text-primary" />
                  <div className="text-left flex flex-col">
                    <span>SEO Presets</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Meta titles & tags</span>
                  </div>
                </Button>

                <Button onClick={() => setActiveTab("integrations")} className="h-14 rounded-[4px] justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <Code className="w-4 h-4 text-primary" />
                  <div className="text-left flex flex-col">
                    <span>Script Integrations</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">GA4 & FB Pixel scripts</span>
                  </div>
                </Button>

                <Button onClick={() => setActiveTab("advanced")} className="h-14 rounded-[4px] justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-[#E2E8F0] hover:bg-slate-100 text-slate-800 shadow-none">
                  <Shield className="w-4 h-4 text-primary" />
                  <div className="text-left flex flex-col">
                    <span>Advanced Settings</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Developer configs</span>
                  </div>
                </Button>
              </div>

              <div className="p-3 bg-orange-50/50 border border-orange-100 rounded-[4px] flex items-start gap-2.5 mt-2">
                <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] font-semibold text-slate-700 leading-normal">
                  <strong>Homepage Layout Cache Note:</strong> Saving settings or changes in page-builder auto-invalidates the public cache. Staged layouts will instantly reflect on the public website.
                </p>
              </div>
            </Card>
          )}

          {/* 4. PAGES */}
          {activeTab === "pages" && (
            <Card className="rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Public Portal Pages</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Lists active page templates mapped in the system.</p>
                </div>
                <Button onClick={() => navigate("/admin/pages")} size="sm" className="rounded-xl h-9.5 font-bold uppercase text-xs tracking-wider">
                  Manage Custom Pages
                </Button>
              </div>

              <div className="border rounded-2xl overflow-hidden divide-y divide-slate-100">
                {[
                  { name: "Homepage Template", path: "/", type: "Core Page" },
                  { name: "Trips Grid List", path: "/trips", type: "Core Page" },
                  { name: "Customer FAQ / Help", path: "/questions", type: "Custom Form Page" },
                  { name: "Watch & Read Blogs", path: "/blogs", type: "Resource Page" },
                  { name: "Privacy Policy", path: "/privacy", type: "Legal Agreement" },
                  { name: "Terms & Conditions", path: "/terms", type: "Legal Agreement" }
                ].map((item, index) => (
                  <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">{item.name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{item.path}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded border">
                        {item.type}
                      </span>
                      <a
                        href={`${baseUrl}${item.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border hover:bg-slate-50 text-slate-500"
                        title="View Public page"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "blogs" && (
            <BlogsPage />
          )}

          {activeTab === "attractions" && (
            <AttractionsPage />
          )}

          {activeTab === "reviews" && (
            <ReviewsPage />
          )}

          {/* 5. NAVIGATION & HEADER */}
          {activeTab === "navigation" && (
            <Card className="rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Navigation Links</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Manage the header menu links array on the public site.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings({
                    ...settings,
                    navbarLinks: [...settings.navbarLinks, { label: "", href: "", order: settings.navbarLinks.length }]
                  })}
                  className="rounded-xl h-8.5 font-bold uppercase text-[10px] tracking-wider"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Menu Item
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Desktop Header CTA Button text</Label>
                  <Input
                    value={settings.headerCtaText || ""}
                    onChange={(e) => setSettings({ ...settings, headerCtaText: e.target.value })}
                    placeholder="e.g. Book Now"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Header Sticky Behavior</Label>
                  <select
                    value={settings.headerStyle || "sticky"}
                    onChange={(e) => setSettings({ ...settings, headerStyle: e.target.value })}
                    className="h-11 rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="sticky">Sticky Header (Default)</option>
                    <option value="normal">Normal Scroll Layout</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Header Menu items</Label>
                {settings.navbarLinks.map((link: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        value={link.label}
                        onChange={(e) => {
                          const updated = [...settings.navbarLinks];
                          updated[idx].label = e.target.value;
                          setSettings({ ...settings, navbarLinks: updated });
                        }}
                        placeholder="Link Label (e.g. Trips)"
                        className="h-9 rounded-lg"
                      />
                      <Input
                        value={link.href}
                        onChange={(e) => {
                          const updated = [...settings.navbarLinks];
                          updated[idx].href = e.target.value;
                          setSettings({ ...settings, navbarLinks: updated });
                        }}
                        placeholder="Relative Path (e.g. /trips)"
                        className="h-9 rounded-lg font-mono"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSettings({
                          ...settings,
                          navbarLinks: settings.navbarLinks.filter((_: any, i: number) => i !== idx)
                        });
                      }}
                      className="text-red-500 hover:bg-red-50 h-9 w-9"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {settings.navbarLinks.length === 0 && (
                  <div className="text-center py-8 border border-dashed rounded-xl border-slate-200 text-slate-400 text-xs">
                    No navbar links defined. Click Add Menu Item to insert options.
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 6. FOOTER */}
          {activeTab === "footer" && (
            <Card className="rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 bg-white">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Footer Details</h3>
                <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Configuration details for the website bottom columns.</p>
              </div>

              <div className="bg-slate-50 border p-5 rounded-2xl space-y-3.5 text-xs text-slate-700">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-bold text-slate-450 uppercase">Copyright tag</span>
                  <span className="font-semibold text-slate-900">{settings.footer?.copyright || "All Rights Reserved."}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-bold text-slate-450 uppercase">Address</span>
                  <span className="font-semibold text-slate-900 truncate max-w-xs">{settings.footer?.address || "HQ Address"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-bold text-slate-450 uppercase">Brand Name</span>
                  <span className="font-semibold text-slate-900">{settings.footer?.brandName || settings.siteName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-450 uppercase">Support Email</span>
                  <span className="font-semibold text-slate-900">{settings.footer?.email || "N/A"}</span>
                </div>
              </div>

              <Button onClick={() => navigate("/admin/footer-management")} className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider gap-2">
                <Layout className="w-4 h-4" /> Open Footer Management Editor
              </Button>
            </Card>
          )}

          {/* 7. THEME & APPEARANCE */}
          {activeTab === "theme" && (
            <DesignControlCenterPage />
          )}

          {/* 8. INQUIRY POPUP */}
          {activeTab === "inquiry" && (
            <Card className="rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 bg-white">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Trip Inquiry Popup</h3>
                <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Control settings for the automated lead popup on detail pages.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Enable Automatic Popup</Label>
                    <span className="text-[11px] text-slate-500 font-medium">Auto-trigger a lead capture popup.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({
                      ...settings,
                      inquiryPopup: { ...settings.inquiryPopup, enabled: !settings.inquiryPopup.enabled }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      settings.inquiryPopup?.enabled ? 'bg-primary' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.inquiryPopup?.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Popup Trigger Delay (Seconds)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={settings.inquiryPopup?.delay || 12}
                      onChange={(e) => setSettings({
                        ...settings,
                        inquiryPopup: { ...settings.inquiryPopup, delay: parseInt(e.target.value) || 12 }
                      })}
                      className="h-11 rounded-xl"
                      placeholder="e.g. 12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Popup Header Title</Label>
                  <Input
                    value={settings.inquiryPopup?.title || ""}
                    onChange={(e) => setSettings({
                      ...settings,
                      inquiryPopup: { ...settings.inquiryPopup, title: e.target.value }
                    })}
                    placeholder="e.g. Plan Your Next Trip"
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Popup Description Text</Label>
                  <Input
                    value={settings.inquiryPopup?.description || ""}
                    onChange={(e) => setSettings({
                      ...settings,
                      inquiryPopup: { ...settings.inquiryPopup, description: e.target.value }
                    })}
                    placeholder="e.g. Connect with our destination experts"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* 9. BOOKING ENGINE */}
          {activeTab === "booking" && (
            <div className="space-y-6">
              <Card className="rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 bg-white">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Booking Form Rules</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Control GST, submit tags, and success redirection copy.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Submit Button Label Text</Label>
                    <Input
                      value={settings.bookingForm?.submitButtonText || ""}
                      onChange={(e) => setSettings({
                        ...settings,
                        bookingForm: { ...settings.bookingForm, submitButtonText: e.target.value }
                      })}
                      placeholder="Confirm Booking"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Booking Success Alert Text</Label>
                    <Input
                      value={settings.bookingForm?.successMessage || ""}
                      onChange={(e) => setSettings({
                        ...settings,
                        bookingForm: { ...settings.bookingForm, successMessage: e.target.value }
                      })}
                      placeholder="Your booking has been received!"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">GST Calculation Rule</Label>
                  <select
                    value={settings.bookingForm?.gstOption || "full"}
                    onChange={(e) => setSettings({
                      ...settings,
                      bookingForm: { ...settings.bookingForm, gstOption: e.target.value }
                    })}
                    className="h-11 rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-full"
                  >
                    <option value="full">Calculate GST on Full Package Amount (Option A)</option>
                    <option value="advance">Calculate GST only on Booking/Advance Amount (Option B)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Checkout Terms & Consent Notes</Label>
                  <Textarea
                    value={settings.bookingForm?.checkoutNotes || ""}
                    onChange={(e) => setSettings({
                      ...settings,
                      bookingForm: { ...settings.bookingForm, checkoutNotes: e.target.value }
                    })}
                    placeholder="Enter checkout notes or consent policies..."
                    className="rounded-2xl min-h-[100px]"
                  />
                </div>
              </Card>

              {/* Room Sharing accommodation options */}
              <Card className="rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Room Sharing accommodations</h3>
                    <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Manage pricing offsets for room share variants.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSettings({
                      ...settings,
                      bookingForm: {
                        ...settings.bookingForm,
                        roomSharingOptions: [...settings.bookingForm.roomSharingOptions, { label: "", priceAdjustment: 0 }]
                      }
                    })}
                    className="rounded-xl h-8.5 font-bold uppercase text-[10px] tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Option
                  </Button>
                </div>

                <div className="space-y-3">
                  {settings.bookingForm.roomSharingOptions.map((opt: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          value={opt.label}
                          onChange={(e) => {
                            const updated = [...settings.bookingForm.roomSharingOptions];
                            updated[idx].label = e.target.value;
                            setSettings({
                              ...settings,
                              bookingForm: { ...settings.bookingForm, roomSharingOptions: updated }
                            });
                          }}
                          placeholder="e.g. Double Sharing"
                          className="h-9 rounded-lg"
                        />
                        <Input
                          value={opt.priceAdjustment}
                          type="number"
                          onChange={(e) => {
                            const updated = [...settings.bookingForm.roomSharingOptions];
                            updated[idx].priceAdjustment = parseInt(e.target.value) || 0;
                            setSettings({
                              ...settings,
                              bookingForm: { ...settings.bookingForm, roomSharingOptions: updated }
                            });
                          }}
                          placeholder="Price adjustment (+/-)"
                          className="h-9 rounded-lg"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSettings({
                            ...settings,
                            bookingForm: {
                              ...settings.bookingForm,
                              roomSharingOptions: settings.bookingForm.roomSharingOptions.filter((_: any, i: number) => i !== idx)
                            }
                          });
                        }}
                        className="text-red-500 hover:bg-red-50 h-9 w-9"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Train Class Options */}
              <Card className="rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Train Class Selections</h3>
                    <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Manage pricing offsets for train classes.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSettings({
                      ...settings,
                      bookingForm: {
                        ...settings.bookingForm,
                        trainOptions: [...settings.bookingForm.trainOptions, { label: "", priceAdjustment: 0 }]
                      }
                    })}
                    className="rounded-xl h-8.5 font-bold uppercase text-[10px] tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Option
                  </Button>
                </div>

                <div className="space-y-3">
                  {settings.bookingForm.trainOptions.map((opt: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          value={opt.label}
                          onChange={(e) => {
                            const updated = [...settings.bookingForm.trainOptions];
                            updated[idx].label = e.target.value;
                            setSettings({
                              ...settings,
                              bookingForm: { ...settings.bookingForm, trainOptions: updated }
                            });
                          }}
                          placeholder="e.g. 3AC Sleepers"
                          className="h-9 rounded-lg"
                        />
                        <Input
                          value={opt.priceAdjustment}
                          type="number"
                          onChange={(e) => {
                            const updated = [...settings.bookingForm.trainOptions];
                            updated[idx].priceAdjustment = parseInt(e.target.value) || 0;
                            setSettings({
                              ...settings,
                              bookingForm: { ...settings.bookingForm, trainOptions: updated }
                            });
                          }}
                          placeholder="Price adjustment (+/-)"
                          className="h-9 rounded-lg"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSettings({
                            ...settings,
                            bookingForm: {
                              ...settings.bookingForm,
                              trainOptions: settings.bookingForm.trainOptions.filter((_: any, i: number) => i !== idx)
                            }
                          });
                        }}
                        className="text-red-500 hover:bg-red-50 h-9 w-9"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* 10. SEO & SEARCH */}
          {activeTab === "seo" && (
            <Card className="rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 bg-white">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Search Engine Optimizations</h3>
                <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Configuration overview for search snippets.</p>
              </div>

              <div className="bg-slate-50 border p-5 rounded-2xl space-y-3.5 text-xs text-slate-700">
                <div className="flex flex-col gap-1 border-b pb-3">
                  <span className="font-bold text-slate-450 uppercase text-[9px] tracking-wider">Homepage Meta Title</span>
                  <span className="font-bold text-slate-900">{homepageSeo.metaTitle || "Not configured"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-450 uppercase text-[9px] tracking-wider">Homepage Meta Description</span>
                  <span className="font-medium text-slate-700 leading-relaxed">{homepageSeo.metaDescription || "Not configured"}</span>
                </div>
              </div>

              <Button onClick={() => navigate("/admin/seo")} className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider gap-2">
                <Search className="w-4 h-4" /> Open Search Engine Optimization (SEO) Center
              </Button>
            </Card>
          )}

          {/* 11. INTEGRATIONS */}
          {activeTab === "integrations" && (
            <Card className="rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 bg-white">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Analytics & Tracking Pixels</h3>
                <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Integrate Google Analytics and Facebook Pixels safely.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-slate-450" /> Google Analytics Tag ID (GA4)</Label>
                  <Input
                    value={settings.googleAnalyticsId || ""}
                    onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                    placeholder="e.g. G-XXXXXXXXXX"
                    className="h-11 rounded-xl font-mono text-sm"
                  />
                  <span className="text-[10px] text-slate-400 block ml-1">Starts with G- for Google Analytics 4 properties.</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Code className="w-3.5 h-3.5 text-slate-450" /> Facebook Pixel ID</Label>
                  <Input
                    value={settings.facebookPixelId || ""}
                    onChange={(e) => setSettings({ ...settings, facebookPixelId: e.target.value })}
                    placeholder="e.g. 123456789012345"
                    className="h-11 rounded-xl font-mono text-sm"
                  />
                  <span className="text-[10px] text-slate-400 block ml-1">Facebook pixel numerical tracker.</span>
                </div>
              </div>
            </Card>
          )}

          {/* 12. ADVANCED SETTINGS */}
          {activeTab === "advanced" && (
            <Card className="rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 bg-white">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-slate-800">Raw settings viewer</h3>
                <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">Raw JSON view of the global site settings state.</p>
              </div>

              <div className="bg-slate-950 text-slate-100 p-6 rounded-2xl font-mono text-xs overflow-auto max-h-[350px] leading-relaxed">
                <pre>{JSON.stringify(settings, null, 2)}</pre>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
