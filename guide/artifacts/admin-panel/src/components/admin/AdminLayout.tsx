import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Bell,
  Search,
  ExternalLink,
  Banknote,
  Link2,
  Sparkles,
  Plus,
  User,
  Palette,
  PlusCircle,
  ChevronDown,
  FilePlus,
  HelpCircle
} from "lucide-react";
import { AdminContainer } from "@/components/layout";
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
import NewInquiryModal from "./NewInquiryModal";
import NewBookingModal from "./NewBookingModal";

// VacationLabs exact navigation structure
const navGroups = [
  {
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard, roles: ['admin', 'manager', 'user'] },
      { title: "Bookings", url: "/admin/bookings", icon: CalendarCheck, roles: ['admin', 'manager'] },
      { title: "Quotations", url: "/admin/quotations", icon: FileText, badge: "NEW", roles: ['admin', 'manager'] },
      { title: "Inquiries", url: "/admin/inquiries", icon: MessageSquare, badge: "NEW", roles: ['admin', 'manager'] },
    ]
  },
  {
    label: "Inventory",
    items: [
      { title: "Trips & Tours", url: "/admin/trips", icon: Map, roles: ['admin', 'manager'] },
    ]
  },
  {
    label: "Guide Operations",
    items: [
      { title: "Guides Dashboard", url: "/admin/guides-dashboard", icon: LayoutDashboard, roles: ['admin'] },
      { title: "Guides List", url: "/admin/guides", icon: Users, roles: ['admin'] },
      { title: "Attendance Logs", url: "/admin/attendance-logs", icon: CalendarCheck, roles: ['admin'] },
      { title: "Assignments", url: "/admin/assignments", icon: Map, roles: ['admin'] },
      { title: "Payroll & Payouts", url: "/admin/payroll", icon: Banknote, roles: ['admin'] },
    ]
  },
  {
    label: "Website Content",
    items: [
      { title: "Page Builder", url: "/admin/page-builder", icon: FilePlus, roles: ['admin'] },
      { title: "Website Theme", url: "/admin/theme", icon: Paintbrush, roles: ['admin'] },
      { title: "Watch & Read", url: "/admin/blogs", icon: BookOpen, roles: ['admin', 'manager'] },
      { title: "Attractions", url: "/admin/attractions", icon: Map, roles: ['admin', 'manager'] },
      { title: "Review Center", url: "/admin/reviews", icon: Star, roles: ['admin', 'manager'] },
    ]
  },
  {
    label: "Marketing & Growth",
    items: [
      { title: "Inquiry Form", url: "/admin/inquiry-form", icon: MessageSquare, roles: ['admin', 'manager'] },
      { title: "Booking Forms", url: "/admin/booking-forms", icon: Link2, roles: ['admin', 'manager'] },
    ]
  },
  {
    label: "Administration",
    items: [
      { title: "User Management", url: "/admin/users", icon: Users, roles: ['admin'] },
      { title: "System Settings", url: "/admin/settings", icon: Settings, roles: ['admin'] },
    ]
  }
];

interface NavItem {
  title: string;
  url: string;
  icon: any;
  badge?: string;
  roles?: string[];
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-sm">
      <SidebarContent className="scrollbar-hide">
        <div className="p-4 mb-2 flex items-center gap-2.5">
          <div className="h-8.5 w-8.5 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-md">
            <Plane className="h-4.5 w-4.5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-white text-[15px] tracking-tight leading-none">Youth<span className="text-primary">Camping</span></span>
              <span className="text-[8px] font-semibold uppercase tracking-[0.15em] text-white/40 mt-1">Admin v4.0</span>
            </div>
          )}
        </div>

        {navGroups.map((group, gIdx) => {
          const filteredItems = (group.items as NavItem[]).filter(item => {
            if (!item.roles) return true;
            // Fallback: Show all items if in development or if admin role check is pending
            if (!admin) return true; 
            if (admin.role === 'superadmin') return true;
            return item.roles.includes(admin.role);
          });

          if (filteredItems.length === 0) return null;

          return (
            <SidebarGroup key={gIdx} className="px-2.5 py-1">
              {group.label && !collapsed && (
                <SidebarGroupLabel className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1 px-3 mt-3">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {filteredItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="h-8.5 rounded-lg transition-all duration-200">
                        <NavLink
                          to={item.url}
                          className="flex items-center text-white/60 hover:text-white hover:bg-white/10 px-3 group/item"
                          activeClassName="bg-white/15 text-white font-semibold border-l-[3px] border-primary"
                        >
                          <item.icon className={cn("h-4 w-4 shrink-0", collapsed ? "mx-auto" : "mr-3.5 opacity-70 group-hover/item:opacity-100")} />
                          {!collapsed && <span className="text-[11.5px] font-medium tracking-tight flex-1 truncate">{item.title}</span>}
                          {!collapsed && item.badge && (
                            <span className="bg-primary/20 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full ml-auto">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        <div className="mt-auto p-4 border-t border-white/10">
          <Button variant="ghost" size={collapsed ? "icon" : "default"} onClick={handleLogout}
            className="w-full text-white/40 hover:text-rose-400 hover:bg-white/5 justify-start h-8.5 rounded-lg px-3">
            <LogOut className="h-4 w-4 mr-3" />
            {!collapsed && <span className="text-[11.5px] font-medium tracking-tight">Logout System</span>}
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

  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    // Verify JWT session on every admin route load
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!admin || isLoading) return;

    // Check if the current route is restricted for the user's role
    const currentPath = location.pathname;
    
    // Skip checks for login and the base admin path if it's the redirect target
    if (currentPath === "/admin/login") return;

    let allowed = true;
    let targetItem = null;

    for (const group of navGroups) {
      const item = group.items.find(i => i.url === currentPath);
      if (item) {
        targetItem = item;
        if (item.roles && !item.roles.includes(admin.role) && admin.role !== 'superadmin') {
          allowed = false;
        }
        break;
      }
    }

    if (!allowed && currentPath !== "/admin") {
      console.warn("🚫 Unauthorized access attempt to:", currentPath);
      navigate("/admin");
      // Use a timeout to ensure navigation completes before toast
      setTimeout(() => toast.error("Access Restricted: Unauthorized for your role"), 100);
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
      <div className="min-h-screen flex w-full bg-[#FAFAFB]">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Top Navbar */}
          <header className="h-13 md:h-14 flex items-center justify-between border-b border-[#2a4058] bg-[#243447] px-4 sm:px-6 md:px-8 shrink-0 z-20 sticky top-0">
            <div className="flex items-center gap-4 min-w-0">
               <SidebarTrigger className="text-white/60 hover:text-white hover:bg-white/10 h-8.5 w-8.5 rounded-lg shrink-0" />
               <div className="h-6 w-px bg-white/20 hidden md:block" />
               <h2 className="font-bold text-white text-sm md:text-base tracking-tight leading-none truncate capitalize">
                 {location.pathname === "/admin" || location.pathname === "/" 
                   ? "Dashboard Overview" 
                   : (location.pathname.split("/").filter(Boolean).pop() || "Page").replace(/-/g, " ")}
               </h2>
            </div>

            <div className="flex items-center gap-3 shrink-0">
               {/* Action Buttons */}
               <div className="hidden sm:flex items-center gap-2">
                   <Button 
                     onClick={() => setInquiryModalOpen(true)}
                     className="bg-white/10 hover:bg-white/20 text-white rounded-lg h-8.5 px-4 font-semibold text-[10.5px] uppercase tracking-wide flex items-center gap-1.5 transition-all border border-white/20"
                   >
                     <Plus className="w-3.5 h-3.5" /><span className="hidden lg:inline">New inquiry</span>
                   </Button>
                  <Button 
                    onClick={() => setBookingModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white rounded-lg h-8.5 px-4 font-semibold text-[10.5px] uppercase tracking-wide flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /><span className="hidden lg:inline">New booking</span>
                  </Button>
               </div>

               <div className="w-px h-6 bg-white/20 mx-1 hidden sm:block" />

               <div className="relative hidden xl:block">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                   <Input 
                     placeholder="Search panel..." 
                     className="h-8.5 w-48 bg-white/10 border border-white/20 rounded-lg text-[11px] font-medium text-white placeholder:text-white/40 focus-visible:ring-primary pl-9"
                   />
               </div>
                <div className="flex items-center gap-2">
                   <button title="Notifications" className="relative w-8.5 h-8.5 flex items-center justify-center text-white/60 hover:text-white transition-colors bg-white/10 rounded-lg border border-white/20">
                       <Bell className="w-4 h-4" />
                       <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full border border-[#243447]"></span>
                    </button>
                </div>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
             {/* Main Content Area */}
             <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 lg:p-6 no-scrollbar">
                <AdminContainer>
                   {children}
                </AdminContainer>
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
                              <Button className="w-full h-12 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider">
                                 Read Articles <ExternalLink className="w-3 h-3 ml-2" />
                              </Button>
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
                              <button className="text-[11px] font-bold uppercase text-white tracking-widest border-b-2 border-white/30 pb-1 hover:border-white transition-all w-fit">
                                 Secure your spot
                              </button>
                           </div>
                        </div>
                     </section>
                  </div>
               </aside>
             )}
          </div>
        </div>
      </div>
      <NewInquiryModal 
        open={inquiryModalOpen} 
        onOpenChange={setInquiryModalOpen} 
        onSuccess={() => {
          if (location.pathname === '/admin/inquiries') {
            // Trigger internal refresh logic here
          }
        }}
      />
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
