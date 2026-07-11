import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "@/components/ui/sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Compass,
  Map,
  CalendarCheck,
  MessageSquare,
  Image,
  Layout,
  Settings,
  LogOut,
  Loader2,
  Plane,
  BookOpen,
  FileText,
  Paintbrush,
  Star,
  Users,
  Search,
  Globe,
  Banknote,
  Link2,
  Sparkles,
  Plus,
  User,
  Palette,
  PlusCircle,
  ChevronDown,
  FilePlus,
  HelpCircle,
  Shield,
  ClipboardCheck,
  Train,
  Building2,
  History,
  Wrench,
  CreditCard,
  BarChart3,
  Package,
  Database
} from "lucide-react";
import { AdminContainer } from "@/components/layout";
import { hasPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NewBookingModal from "./NewBookingModal";

const navGroups = [
  {
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard, permission: "dashboard.view" },
      { title: "Bookings", url: "/admin/bookings", icon: CalendarCheck, permission: "bookings.view" },
      { title: "Booking Forms", url: "/admin/booking-forms", icon: Link2, permission: "bookings.view" },
      { title: "Verification & Approvals", url: "/admin/approvals-hub", icon: ClipboardCheck, permission: "bookings.view" },
      { title: "Departures", url: "/admin/operations", icon: Compass, permission: "ops.view" },
      { title: "Quotations", url: "/admin/quotations", icon: FileText, badge: "NEW", permission: "quotations.view" },
      { title: "Inquiries", url: "/admin/inquiries", icon: MessageSquare, badge: "NEW", permission: "inquiries.view" },
    ]
  },
  {
    label: "ACCOUNTING",
    items: [
      { title: "Overview", url: "/admin/accounting?tab=overview", icon: LayoutDashboard, permission: "accounting.view" },
      { title: "Transactions", url: "/admin/accounting?tab=transactions", icon: History, permission: "accounting.view" },
      { title: "Cash Book", url: "/admin/accounting?tab=cash_book", icon: Banknote, permission: "accounting.view" },
      { title: "Bank Accounts", url: "/admin/accounting?tab=bank_accounts", icon: Building2, permission: "accounting.view" },
      { title: "Vendor Payments", url: "/admin/accounting?tab=vendor_payments", icon: Users, permission: "accounting.view" },
      { title: "Office Expenses", url: "/admin/accounting?tab=office_expenses", icon: Wrench, permission: "accounting.view" },
      { title: "Payments", url: "/admin/accounting?tab=payments", icon: CreditCard, permission: "accounting.view" },
      { title: "Profit & Loss", url: "/admin/accounting?tab=profit_loss", icon: BarChart3, permission: "accounting.view" },
      { title: "Trip Profitability", url: "/admin/accounting?tab=trip_profitability", icon: Compass, permission: "accounting.view" },
      { title: "Reports", url: "/admin/accounting?tab=reports", icon: FileText, permission: "accounting.view" },
    ]
  },
  {
    label: "HR & People",
    items: [
      { title: "HR & People", url: "/admin/hr", icon: Users, permission: "hr.view" },
    ]
  },
  {
    label: "Inventory",
    items: [
      { title: "Trips & Tours", url: "/admin/trips", icon: Map, permission: "trips.view" },
      { title: "Vendor Management", url: "/admin/vendors", icon: Building2, permission: "settings.view" },
    ]
  },
  {
    label: "Guide Operations",
    items: [
      { title: "Guide Operations", url: "/admin/guides-hub", icon: ClipboardCheck, permission: "guides.view" },
    ]
  },
  {
    label: "Website",
    items: [
      { title: "Website", url: "/admin/website", icon: Globe, permission: "settings.view" },
    ]
  },
  {
    label: "PACKAGES",
    items: [
      { title: "Package Builder", url: "/admin/package-builder", icon: Package, permission: "packages.view" },
      { title: "Master Database", url: "/admin/package-builder/master-data", icon: Database, permission: "packages.view" },
    ]
  },
  {
    label: "Administration",
    items: [
      { title: "User Management", url: "/admin/users", icon: Users, permission: "users.manage" },
      { title: "Access Control", url: "/admin/access-control", icon: Shield, permission: "roles.manage" },
      { title: "Train Templates", url: "/admin/train-templates", icon: Train, permission: "tickets.templates.manage" },
      { title: "Audit Logs", url: "/admin/audit-logs", icon: FileText, permission: "audit.view" },
    ]
  }
];

interface NavItem {
  title: string;
  url: string;
  icon: any;
  badge?: string;
  permission?: string;
}

function AdminSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { logout, admin } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-close sidebar on mobile when navigating
  React.useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname, isMobile, setOpenMobile]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-white/8 shadow-sm">
      <SidebarContent className="scrollbar-hide flex flex-col h-full bg-[#112238]">
        {/* Brand / Logo (compact, 44px height, bottom border) */}
        <div className={cn(
          "flex items-center gap-2.5 border-b border-white/8 shrink-0 h-11 px-4",
          collapsed && "justify-center px-0"
        )}>
          <div className="h-7 w-7 rounded bg-[#F97316] flex items-center justify-center flex-shrink-0 shadow">
            <Plane className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-white text-[13px] tracking-tight leading-none">
                Youth<span className="text-[#F97316]">Camping</span>
              </span>
              <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#70819A] mt-0.5">ADMIN WORKSPACE</span>
            </div>
          )}
        </div>

        {/* Navigation Items (16px outer padding, 8px between items, 10-12px item padding) */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-4">
          {navGroups.map((group, gIdx) => {
            const filteredItems = (group.items as NavItem[]).filter(item => {
              if (!item.permission) return true;
              if (!admin) return true; 
              return hasPermission(admin.role, item.permission);
            });

            if (filteredItems.length === 0) return null;

            return (
              <SidebarGroup key={gIdx} className="p-0">
                {group.label && !collapsed && (
                  <SidebarGroupLabel className="text-white/30 text-[9px] font-bold uppercase tracking-widest px-2.5 mb-2">
                    {group.label}
                  </SidebarGroupLabel>
                )}
                {group.label && collapsed && <div className="h-px bg-white/8 my-2 mx-1.5" />}
                <SidebarGroupContent>
                  <SidebarMenu className="gap-2">
                    {filteredItems.map((item) => {
                      const currentFull = location.pathname + location.search;
                      const isActive = item.url.includes("?")
                        ? currentFull === item.url
                        : (location.pathname === item.url || (item.url !== "/admin" && location.pathname.startsWith(item.url)));

                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild className="h-8 rounded-md transition-colors duration-150 p-0">
                            <NavLink
                              to={item.url}
                              onClick={() => {
                                if (isMobile) setOpenMobile(false);
                                if (item.url === "/admin/bookings") {
                                  window.dispatchEvent(new CustomEvent("reset-bookings-view"));
                                }
                              }}
                              className={cn(
                                "flex items-center w-full h-full rounded-md px-2.5 transition-colors relative",
                                isActive 
                                  ? "bg-[#1B304B] text-[#F97316] font-semibold" 
                                  : "text-[#70819A] hover:text-white hover:bg-white/5"
                              )}
                              activeClassName=""
                            >
                              {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#F97316] rounded-r" />
                              )}
                              <item.icon className={cn(
                                "h-4 w-4 shrink-0 transition-colors", 
                                collapsed ? "mx-auto" : "mr-[10px]",
                                isActive ? "text-[#F97316]" : "opacity-60 group-hover:opacity-100"
                              )} />
                              {!collapsed && <span className="text-[11px] tracking-tight flex-1 truncate">{item.title}</span>}
                              {!collapsed && item.badge && (
                                <span className="bg-[#F97316]/20 text-[#F97316] text-[8px] font-black px-1.5 py-0.5 rounded ml-auto">
                                  {item.badge}
                                </span>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </div>

        {/* Logout (pinned to bottom, compact) */}
        <div className="p-3 border-t border-white/8 bg-[#112238]">
          <Button variant="ghost" size={collapsed ? "icon" : "default"} onClick={handleLogout}
            className="w-full text-white/40 hover:text-rose-450 hover:bg-white/5 justify-start h-8 rounded px-2.5">
            <LogOut className="h-4 w-4 mr-2.5" />
            {!collapsed && <span className="text-[11px] font-medium tracking-tight text-[#C7D2E0]">Logout System</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !admin) {
      checkAuth();
    }
  }, [checkAuth, isAuthenticated, admin]);

  useEffect(() => {
    if (!admin || isLoading) return;

    const currentPath = location.pathname;
    
    // Skip checks for login and unauthorized pages
    if (currentPath === "/admin/login" || currentPath === "/admin/unauthorized") return;

    // Special redirect for guides accessing dashboard root
    if ((currentPath === "/admin" || currentPath === "/") && admin.role === 'guide') {
      navigate("/admin/guide-portal");
      return;
    }

    let allowed = true;

    for (const group of navGroups) {
      const item = group.items.find(i => i.url === currentPath);
      if (item) {
        if (item.permission && !hasPermission(admin.role, item.permission)) {
          allowed = false;
        }
        break;
      }
    }

    // Special permissions check for guide portal: only guide and superadmin can view
    if (currentPath.startsWith("/admin/guide-portal") && admin.role !== "guide" && admin.role !== "superadmin") {
      allowed = false;
    }

    if (!allowed) {
      console.warn("🚫 Unauthorized access attempt to:", currentPath);
      navigate("/admin/unauthorized");
    }
  }, [location.pathname, admin, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.pathname !== "/admin/login") {
      console.log("🔒 Not authenticated, redirecting to login...");
      navigate("/admin/login");
    }
  }, [isLoading, isAuthenticated, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center gap-6">
           <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white opacity-40">System Initializing...</p>
        </div>
      </div>
    );
  }

  // The redirect effect above handles unauthenticated access.

  // Determine if we should show the "Need Help" sidebar (VacationLabs style)
  const showHelpPanel = location.pathname.includes('/settings') || location.pathname.includes('/seo') || location.pathname.includes('/pages');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" style={{ background: "#f1f5f9" }}>
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Top Navbar */}
          <header className="h-12 flex items-center justify-between border-b border-[#E2E8F0] bg-white px-4 sm:px-6 shrink-0 z-20 sticky top-0">
            <div className="flex items-center gap-3 min-w-0">
               <SidebarTrigger className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 h-8 w-8 rounded-md shrink-0 flex items-center justify-center transition-colors" />
               <div className="h-4 w-px bg-slate-200 hidden md:block" />
               <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 truncate leading-none">
                 {(() => {
                   const parts = location.pathname.split("/").filter(Boolean);
                   if (parts.length === 0 || (parts.length === 1 && parts[0] === "admin")) {
                     return <span className="text-slate-800 font-bold">Dashboard</span>;
                   }
                   if (location.pathname.startsWith("/admin/accounting")) {
                     const tab = searchParams.get("tab") || "overview";
                     const tabLabel = tab.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                     return (
                       <div className="flex items-center gap-1.5">
                         <span className="text-slate-400 font-medium">Accounting</span>
                         <span className="text-slate-350 font-normal">›</span>
                         <span className="text-slate-800 font-bold">{tabLabel}</span>
                       </div>
                     );
                   }
                   const lastPart = parts.pop() || "";
                   const cleanName = lastPart.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                   return (
                     <div className="flex items-center gap-1.5">
                       <span className="text-slate-400 font-medium">Admin</span>
                       <span className="text-slate-350 font-normal">›</span>
                       <span className="text-slate-800 font-bold">{cleanName}</span>
                     </div>
                   );
                 })()}
               </div>
            </div>

            <div className="flex items-center gap-3.5 shrink-0">
               {/* Search Input */}
               <div className="relative hidden md:block">
                   <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                   <Input 
                     placeholder="Search anything..." 
                     className="h-8 w-52 bg-slate-50 border border-slate-200 rounded-[4px] text-[11px] font-medium text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#F97316] pl-8 shadow-xs"
                   />
                   <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-350 bg-slate-200/50 px-1 py-0.5 rounded">/</span>
               </div>

               <div className="w-px h-4 bg-slate-200 hidden sm:block" />

               {/* Notifications, Help, Settings & Avatar */}
               <div className="flex items-center gap-3">
                 <button className="relative text-slate-500 hover:text-slate-800 transition-colors mt-0.5">
                   <span className="absolute -top-1 -right-1.5 bg-[#E23D4D] text-[8px] font-extrabold text-white h-3.5 w-3.5 rounded-full flex items-center justify-center border border-white">12</span>
                   <span className="text-sm">🔔</span>
                 </button>

                 <button className="text-slate-400 hover:text-slate-700 text-sm mt-0.5">
                   ❓
                 </button>

                 <button className="text-slate-400 hover:text-slate-700 text-sm mt-0.5">
                   ⚙️
                 </button>

                 <div className="flex items-center gap-2 border-l border-slate-200 pl-3.5 h-7">
                   <img src={admin?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                   <div className="hidden lg:flex flex-col text-left">
                     <span className="text-[11px] font-bold text-slate-850 leading-none">{admin?.name || "Hemal Patel"}</span>
                     <span className="text-[8.5px] text-[#74839A] font-bold mt-0.5 leading-none">{admin?.role === "superadmin" ? "Founder" : (admin?.role || "Founder")}</span>
                   </div>
                 </div>
               </div>

               {/* Action Buttons */}
               <div className="hidden sm:flex items-center gap-2 pl-1">
                  <Button 
                    onClick={() => setBookingModalOpen(true)}
                    className="bg-[#F97316] hover:bg-[#EA580C] text-white rounded-[4px] h-8 px-3.5 font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />New booking
                  </Button>
               </div>

            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
             {/* Main Content Area */}
             <main className="flex-1 overflow-y-auto overflow-x-hidden p-0 no-scrollbar">
                <div className="w-full h-full">
                   {children}
                </div>
             </main>

             {/* Help Sidebar */}
             {showHelpPanel && (
               <aside className="w-[380px] border-l bg-white hidden 2xl:flex flex-col overflow-y-auto p-12 no-scrollbar">
                  <div className="space-y-12">
                     <section className="space-y-8">
                        <div className="flex items-center justify-between">
                           <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Resources</h3>
                           <HelpCircle className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="bg-slate-50 rounded-[40px] p-10 border border-slate-100 relative overflow-hidden group">
                           <div className="relative z-10 space-y-6">
                              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-premium">
                                 <BookOpen className="w-6 h-6 text-slate-900" />
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-bold text-lg tracking-tight text-slate-900">Knowledge Base</h4>
                                <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                                   Learn how to configure your platform with our step-by-step tutorials.
                                </p>
                              </div>
                           </div>
                        </div>
                     </section>

                     <section className="space-y-8">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Pro Tips</h3>
                        <div className="bg-primary rounded-[40px] p-10 text-white relative overflow-hidden shadow-luxury">
                           <div className="relative z-10 space-y-6">
                              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                                 <Sparkles className="w-6 h-6 text-white" />
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-bold text-xl tracking-tight leading-tight">Master the platform like a pro.</h4>
                                <p className="text-[12px] text-white/80 font-medium">Join our weekly webinars to learn about advanced growth features.</p>
                              </div>
                           </div>
                        </div>
                     </section>
                  </div>
               </aside>
             )}
          </div>
        </div>
      </div>
      <NewBookingModal 
        open={bookingModalOpen} 
        onOpenChange={setBookingModalOpen} 
        onSuccess={() => {
          console.log("📅 Booking created successfully!");
          if (location.pathname === '/admin/bookings') {
             window.location.reload();
          }
        }}
      />
    </SidebarProvider>
  );
}
