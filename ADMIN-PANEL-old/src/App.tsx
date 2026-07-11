// Sync trigger for Vercel admin deployment
import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/auth.store";
import { hasPermission } from "@/lib/permissions";

const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const LoginPage = lazy(() => import("./pages/admin/LoginPage.tsx"));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage.tsx"));
const TripsPage = lazy(() => import("./pages/admin/TripsPage.tsx"));
const BookingsPage = lazy(() => import("./pages/admin/BookingsPage.tsx"));
const InquiriesPage = lazy(() => import("./pages/admin/InquiriesPage.tsx"));
const BlogsPage = lazy(() => import("./pages/admin/BlogsPage.tsx"));
const ReviewsPage = lazy(() => import("./pages/admin/ReviewsPage.tsx"));
const MediaPage = lazy(() => import("./pages/admin/MediaPage.tsx"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage.tsx"));
const FooterManagementPage = lazy(() => import("./pages/admin/FooterManagementPage.tsx"));
const PagesPage = lazy(() => import("./pages/admin/PagesPage.tsx"));
const PageEditorPage = lazy(() => import("./pages/admin/PageEditorPage.tsx"));
const ThemePage = lazy(() => import("./pages/admin/ThemePage.tsx"));
const DesignControlCenterPage = lazy(() => import("./pages/admin/DesignControlCenterPage.tsx"));
const SeoCenterPage = lazy(() => import("./pages/admin/SeoCenterPage.tsx"));
const InquiryFormPage = lazy(() => import("./pages/admin/InquiryFormPage.tsx"));
const WebsiteControlCenterPage = lazy(() => import("./pages/admin/WebsiteControlCenterPage.tsx"));
const ApprovalsHubPage = lazy(() => import("./pages/admin/ApprovalsHubPage.tsx"));
const PageBuilderPage = lazy(() => import("./pages/admin/PageBuilderPage.tsx"));
const PreviewPage = lazy(() => import("./pages/admin/PreviewPage.tsx"));
const AttractionsPage = lazy(() => import("./pages/admin/AttractionsPage.tsx"));
const VendorsPage = lazy(() => import("./pages/admin/VendorsPage.tsx"));
const BookingLinksPage = lazy(() => import("./pages/admin/BookingLinksPage.tsx"));
const QuotationsPage = lazy(() => import("./pages/admin/QuotationsPage.tsx"));
const QuotationFormPage = lazy(() => import("./pages/admin/QuotationFormPage.tsx"));
const AIItineraryGeneratorPage = lazy(() => import("./pages/admin/AIItineraryGeneratorPage.tsx"));
const QuestionsPage = lazy(() => import("./pages/admin/QuestionsPage.tsx"));
const UserManagementPage = lazy(() => import("./pages/admin/UserManagementPage.tsx"));
const AccessControlPage = lazy(() => import("./pages/admin/AccessControlPage.tsx"));
const AuditLogsPage = lazy(() => import("./pages/admin/AuditLogsPage.tsx"));
const UnauthorizedPage = lazy(() => import("./pages/admin/UnauthorizedPage.tsx"));
const DynamicFormAdmin = lazy(() => import("./pages/admin/DynamicFormAdmin.tsx"));
const GuidesDashboardPage = lazy(() => import("./pages/admin/GuidesDashboardPage.tsx"));
const GuideOperationsCenterPage = lazy(() => import("./pages/admin/GuideOperationsCenterPage.tsx"));
const GuidesListPage = lazy(() => import("./pages/admin/GuidesListPage.tsx"));
const AttendanceLogsPage = lazy(() => import("./pages/admin/AttendanceLogsPage.tsx"));
const AssignmentsPage = lazy(() => import("./pages/admin/AssignmentsPage.tsx"));
const PayrollPage = lazy(() => import("./pages/admin/PayrollPage.tsx"));
const ExpensesApprovalPage = lazy(() => import("./pages/admin/ExpensesApprovalPage.tsx"));
const GuideDashboardPage = lazy(() => import("./pages/admin/GuideDashboardPage.tsx"));
const GuideTripDetailPage = lazy(() => import("./pages/admin/GuideTripDetailPage.tsx"));
const HRPage = lazy(() => import("./pages/admin/HRPage.tsx"));
const PackageMasterDatabasePage = lazy(() => import("./pages/admin/PackageMasterDatabasePage.tsx"));
const PackageBuilderPage = lazy(() => import("./pages/admin/PackageBuilderPage.tsx"));

// Named exports from PlaceholderPages Adapted to default exports expected by lazy
const CollectionsPage = lazy(() => import("./pages/admin/PlaceholderPages.tsx").then(m => ({ default: m.CollectionsPage })));
const PromotionsPage = lazy(() => import("./pages/admin/PlaceholderPages.tsx").then(m => ({ default: m.PromotionsPage })));
const DistributionPage = lazy(() => import("./pages/admin/PlaceholderPages.tsx").then(m => ({ default: m.DistributionPage })));
const ReportsPage = lazy(() => import("./pages/admin/PlaceholderPages.tsx").then(m => ({ default: m.ReportsPage })));
const BillingPage = lazy(() => import("./pages/admin/PlaceholderPages.tsx").then(m => ({ default: m.BillingPage })));

const LiveTripOperationsPage = lazy(() => import("./pages/admin/LiveTripOperationsPage.tsx"));
const VerificationQueuePage = lazy(() => import("./pages/admin/VerificationQueuePage.tsx"));
const TrainTemplatesPage = lazy(() => import("./pages/admin/TrainTemplatesPage.tsx"));
const TicketApprovalsPage = lazy(() => import("./pages/admin/TicketApprovalsPage.tsx"));
const AccountingPage = lazy(() => import("./pages/admin/AccountingPage.tsx"));
const OperationsHubPage = lazy(() => import("./pages/admin/OperationsHubPage.tsx"));
const StaticWorkspacePage = lazy(() => import("./pages/admin/StaticWorkspacePage.tsx"));

import { AdminLayout } from "./components/admin/AdminLayout.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import { DynamicThemeProvider } from "./components/admin/DynamicThemeProvider.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,              // 1 min default stale time for queries
      gcTime: 5 * 60_000,             // 5 min cache garbage collection
      refetchOnWindowFocus: false,    // prevent unwanted refetches on tab switch
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const LoadingUI = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-6">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Loading page content...</p>
  </div>
);

function AdminRoute({ children, requiredPermission }: { children: React.ReactNode; requiredPermission?: string }) {
  const { admin } = useAuthStore();

  if (requiredPermission && admin && !hasPermission(admin.role, requiredPermission)) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return (
    <AdminLayout>
      <Suspense fallback={<LoadingUI />}>
        {children}
      </Suspense>
    </AdminLayout>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <DynamicThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/login" element={<Suspense fallback={<LoadingUI />}><LoginPage /></Suspense>} />
              <Route path="/admin/login" element={<Suspense fallback={<LoadingUI />}><LoginPage /></Suspense>} />
              <Route path="/" element={<AdminRoute requiredPermission="dashboard.view"><DashboardPage /></AdminRoute>} />
              <Route path="/admin" element={<AdminRoute requiredPermission="dashboard.view"><DashboardPage /></AdminRoute>} />
              <Route path="/admin/trips" element={<AdminRoute requiredPermission="trips.view"><TripsPage /></AdminRoute>} />
              <Route path="/admin/bookings" element={<AdminRoute requiredPermission="bookings.view"><BookingsPage /></AdminRoute>} />
              <Route path="/admin/verification-queue" element={<AdminRoute requiredPermission="bookings.view"><VerificationQueuePage /></AdminRoute>} />
              <Route path="/admin/approvals-hub" element={<AdminRoute requiredPermission="bookings.view"><ApprovalsHubPage /></AdminRoute>} />
              <Route path="/admin/train-templates" element={<AdminRoute requiredPermission="tickets.templates.manage"><TrainTemplatesPage /></AdminRoute>} />
              <Route path="/admin/ticket-approvals" element={<AdminRoute requiredPermission="tickets.approve"><TicketApprovalsPage /></AdminRoute>} />
              <Route path="/admin/collections" element={<AdminRoute requiredPermission="settings.view"><CollectionsPage /></AdminRoute>} />
              <Route path="/admin/promotions" element={<AdminRoute requiredPermission="settings.view"><PromotionsPage /></AdminRoute>} />
              <Route path="/admin/blogs" element={<AdminRoute requiredPermission="settings.view"><BlogsPage /></AdminRoute>} />
              <Route path="/admin/attractions" element={<AdminRoute requiredPermission="trips.view"><AttractionsPage /></AdminRoute>} />
              <Route path="/admin/reviews" element={<AdminRoute requiredPermission="settings.view"><ReviewsPage /></AdminRoute>} />
              <Route path="/admin/pages" element={<AdminRoute requiredPermission="settings.view"><PagesPage /></AdminRoute>} />
              <Route path="/admin/pages/:id" element={<AdminRoute requiredPermission="settings.view"><PageEditorPage /></AdminRoute>} />
              <Route path="/admin/theme" element={<AdminRoute requiredPermission="settings.view"><ThemePage /></AdminRoute>} />
              <Route path="/admin/design-control-center" element={<AdminRoute requiredPermission="settings.view"><DesignControlCenterPage /></AdminRoute>} />
              <Route path="/admin/seo" element={<AdminRoute requiredPermission="seo.view"><SeoCenterPage /></AdminRoute>} />
              <Route path="/admin/inquiry-form" element={<AdminRoute requiredPermission="inquiries.view"><InquiryFormPage /></AdminRoute>} />
              <Route path="/admin/website" element={<AdminRoute requiredPermission="settings.view"><WebsiteControlCenterPage /></AdminRoute>} />
              <Route path="/admin/page-builder" element={<AdminRoute requiredPermission="settings.view"><PageBuilderPage /></AdminRoute>} />
              <Route path="/admin/page_builder" element={<AdminRoute requiredPermission="settings.view"><PageBuilderPage /></AdminRoute>} />
              <Route path="/admin/preview" element={<AdminRoute requiredPermission="settings.view"><PreviewPage /></AdminRoute>} />
              <Route path="/admin/inquiries" element={<AdminRoute requiredPermission="inquiries.view"><InquiriesPage /></AdminRoute>} />
              <Route path="/admin/media" element={<AdminRoute requiredPermission="settings.view"><MediaPage /></AdminRoute>} />
              <Route path="/admin/vendors" element={<AdminRoute requiredPermission="settings.view"><VendorsPage /></AdminRoute>} />
              <Route path="/admin/booking-forms" element={<AdminRoute requiredPermission="bookings.view"><BookingLinksPage /></AdminRoute>} />
              <Route path="/admin/quotations" element={<AdminRoute requiredPermission="quotations.view"><QuotationsPage /></AdminRoute>} />
              <Route path="/admin/quotations/:id" element={<AdminRoute requiredPermission="quotations.view"><QuotationFormPage /></AdminRoute>} />
              <Route path="/admin/ai-itinerary" element={<AdminRoute requiredPermission="trips.view"><AIItineraryGeneratorPage /></AdminRoute>} />
              <Route path="/admin/questions" element={<AdminRoute requiredPermission="settings.view"><QuestionsPage /></AdminRoute>} />
              <Route path="/admin/footer-management" element={<AdminRoute requiredPermission="settings.view"><FooterManagementPage /></AdminRoute>} />
              <Route path="/admin/settings" element={<Navigate to="/admin/website" replace />} />
              <Route path="/admin/distribution" element={<AdminRoute requiredPermission="settings.view"><DistributionPage /></AdminRoute>} />
              <Route path="/admin/reports" element={<AdminRoute requiredPermission="reports.view"><ReportsPage /></AdminRoute>} />
              <Route path="/admin/billing" element={<AdminRoute requiredPermission="settings.view"><BillingPage /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute requiredPermission="users.manage"><UserManagementPage /></AdminRoute>} />
              <Route path="/admin/access-control" element={<AdminRoute requiredPermission="roles.manage"><AccessControlPage /></AdminRoute>} />
              <Route path="/admin/audit-logs" element={<AdminRoute requiredPermission="audit.view"><AuditLogsPage /></AdminRoute>} />
              <Route path="/admin/unauthorized" element={<AdminRoute><UnauthorizedPage /></AdminRoute>} />
              <Route path="/admin/dynamic-sync" element={<AdminRoute requiredPermission="settings.view"><DynamicFormAdmin /></AdminRoute>} />
              <Route path="/admin/guides-dashboard" element={<AdminRoute requiredPermission="guides.view"><GuidesDashboardPage /></AdminRoute>} />
              <Route path="/admin/guides-hub" element={<AdminRoute requiredPermission="guides.view"><GuideOperationsCenterPage /></AdminRoute>} />
              <Route path="/admin/guides" element={<AdminRoute requiredPermission="guides.view"><GuidesListPage /></AdminRoute>} />
              <Route path="/admin/attendance-logs" element={<AdminRoute requiredPermission="guides.view"><AttendanceLogsPage /></AdminRoute>} />
              <Route path="/admin/assignments" element={<AdminRoute requiredPermission="guides.view"><AssignmentsPage /></AdminRoute>} />
              <Route path="/admin/payroll" element={<AdminRoute requiredPermission="guides.view"><PayrollPage /></AdminRoute>} />
              <Route path="/admin/expenses" element={<AdminRoute requiredPermission="guides.view"><ExpensesApprovalPage /></AdminRoute>} />
              <Route path="/admin/live-operations" element={<AdminRoute requiredPermission="guides.view"><LiveTripOperationsPage /></AdminRoute>} />
              <Route path="/admin/guide-portal" element={<AdminRoute requiredPermission="trips.view"><GuideDashboardPage /></AdminRoute>} />
              <Route path="/admin/guide-portal/trip/:assignmentId" element={<AdminRoute requiredPermission="trips.view"><GuideTripDetailPage /></AdminRoute>} />
              <Route path="/admin/hr" element={<AdminRoute requiredPermission="hr.view"><HRPage /></AdminRoute>} />
              <Route path="/admin/hr/:tab" element={<AdminRoute requiredPermission="hr.view"><HRPage /></AdminRoute>} />
              <Route path="/admin/accounting" element={<AdminRoute requiredPermission="accounting.view"><AccountingPage /></AdminRoute>} />
              <Route path="/admin/operations" element={<AdminRoute requiredPermission="ops.view"><OperationsHubPage /></AdminRoute>} />
              <Route path="/admin/package-builder" element={<AdminRoute requiredPermission="packages.view"><PackageBuilderPage /></AdminRoute>} />
              <Route path="/admin/package-builder/master-data" element={<AdminRoute requiredPermission="packages.view"><PackageMasterDatabasePage /></AdminRoute>} />
              <Route path="/admin/package-builder/:id" element={<AdminRoute requiredPermission="packages.view"><PackageBuilderPage /></AdminRoute>} />
              <Route path="/admin/booking-workspace" element={<AdminRoute requiredPermission="bookings.view"><StaticWorkspacePage src="/booking-workspace.html" title="Booking Workspace" /></AdminRoute>} />
              <Route path="/admin/departure-workspace" element={<AdminRoute requiredPermission="bookings.view"><StaticWorkspacePage src="/departure-workspace.html" title="Departure Workspace" /></AdminRoute>} />
              <Route path="/admin/accounting-workspace" element={<AdminRoute requiredPermission="accounting.view"><StaticWorkspacePage src="/accounting-workspace.html" title="Accounting Workspace" /></AdminRoute>} />
              <Route path="/admin/web-workspace" element={<AdminRoute requiredPermission="bookings.view"><StaticWorkspacePage src="/web.html" title="Web Booking Workspace" /></AdminRoute>} />
              <Route path="*" element={<Suspense fallback={<LoadingUI />}><NotFound /></Suspense>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DynamicThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
export default App;
