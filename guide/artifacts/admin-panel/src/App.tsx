import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import LoginPage from "./pages/admin/LoginPage.tsx";
import DashboardPage from "./pages/admin/DashboardPage.tsx";
import TripsPage from "./pages/admin/TripsPage.tsx";
import BookingsPage from "./pages/admin/BookingsPage.tsx";
import InquiriesPage from "./pages/admin/InquiriesPage.tsx";
import BlogsPage from "./pages/admin/BlogsPage.tsx";
import ReviewsPage from "./pages/admin/ReviewsPage.tsx";
import MediaPage from "./pages/admin/MediaPage.tsx";
import SettingsPage from "./pages/admin/SettingsPage.tsx";
import PagesPage from "./pages/admin/PagesPage.tsx";
import PageEditorPage from "./pages/admin/PageEditorPage.tsx";
import ThemePage from "./pages/admin/ThemePage.tsx";
import SeoCenterPage from "./pages/admin/SeoCenterPage.tsx";
import InquiryFormPage from "./pages/admin/InquiryFormPage.tsx";
import PageBuilderPage from "./pages/admin/PageBuilderPage.tsx";
import PreviewPage from "./pages/admin/PreviewPage.tsx";
import AttractionsPage from "./pages/admin/AttractionsPage.tsx";
import VendorsPage from "./pages/admin/VendorsPage.tsx";
import BookingLinksPage from "./pages/admin/BookingLinksPage.tsx";
import QuotationsPage from "./pages/admin/QuotationsPage.tsx";
import QuotationFormPage from "./pages/admin/QuotationFormPage.tsx";
import AIItineraryGeneratorPage from "./pages/admin/AIItineraryGeneratorPage.tsx";
import QuestionsPage from "./pages/admin/QuestionsPage.tsx";
import UserManagementPage from "./pages/admin/UserManagementPage.tsx";
import DynamicFormAdmin from "./pages/admin/DynamicFormAdmin.tsx";
import GuidesDashboardPage from "./pages/admin/GuidesDashboardPage.tsx";
import GuidesListPage from "./pages/admin/GuidesListPage.tsx";
import AttendanceLogsPage from "./pages/admin/AttendanceLogsPage.tsx";
import AssignmentsPage from "./pages/admin/AssignmentsPage.tsx";
import PayrollPage from "./pages/admin/PayrollPage.tsx";
import { 
  CollectionsPage, PromotionsPage, DistributionPage, 
  ReportsPage, BillingPage 
} from "./pages/admin/PlaceholderPages.tsx";
import { AdminLayout } from "./components/admin/AdminLayout.tsx";

import ErrorBoundary from "./components/ErrorBoundary.tsx";

import { DynamicThemeProvider } from "./components/admin/DynamicThemeProvider.tsx";

const queryClient = new QueryClient();

function AdminRoute({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
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
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/" element={<AdminRoute><DashboardPage /></AdminRoute>} />
              <Route path="/admin" element={<AdminRoute><DashboardPage /></AdminRoute>} />
              <Route path="/admin/trips" element={<AdminRoute><TripsPage /></AdminRoute>} />
              <Route path="/admin/bookings" element={<AdminRoute><BookingsPage /></AdminRoute>} />
              <Route path="/admin/collections" element={<AdminRoute><CollectionsPage /></AdminRoute>} />
              <Route path="/admin/promotions" element={<AdminRoute><PromotionsPage /></AdminRoute>} />
              <Route path="/admin/blogs" element={<AdminRoute><BlogsPage /></AdminRoute>} />
              <Route path="/admin/attractions" element={<AdminRoute><AttractionsPage /></AdminRoute>} />
              <Route path="/admin/reviews" element={<AdminRoute><ReviewsPage /></AdminRoute>} />
              <Route path="/admin/pages" element={<AdminRoute><PagesPage /></AdminRoute>} />
              <Route path="/admin/pages/:id" element={<AdminRoute><PageEditorPage /></AdminRoute>} />
              <Route path="/admin/theme" element={<AdminRoute><ThemePage /></AdminRoute>} />
              <Route path="/admin/seo" element={<AdminRoute><SeoCenterPage /></AdminRoute>} />
              <Route path="/admin/inquiry-form" element={<AdminRoute><InquiryFormPage /></AdminRoute>} />
              <Route path="/admin/page-builder" element={<AdminRoute><PageBuilderPage /></AdminRoute>} />
              <Route path="/admin/page_builder" element={<AdminRoute><PageBuilderPage /></AdminRoute>} />
              <Route path="/admin/preview" element={<AdminRoute><PreviewPage /></AdminRoute>} />
              <Route path="/admin/inquiries" element={<AdminRoute><InquiriesPage /></AdminRoute>} />
              <Route path="/admin/media" element={<AdminRoute><MediaPage /></AdminRoute>} />
              <Route path="/admin/vendors" element={<AdminRoute><VendorsPage /></AdminRoute>} />
              <Route path="/admin/booking-forms" element={<AdminRoute><BookingLinksPage /></AdminRoute>} />
              <Route path="/admin/quotations" element={<AdminRoute><QuotationsPage /></AdminRoute>} />
              <Route path="/admin/quotations/:id" element={<AdminRoute><QuotationFormPage /></AdminRoute>} />
              <Route path="/admin/ai-itinerary" element={<AdminRoute><AIItineraryGeneratorPage /></AdminRoute>} />
              <Route path="/admin/questions" element={<AdminRoute><QuestionsPage /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
              <Route path="/admin/distribution" element={<AdminRoute><DistributionPage /></AdminRoute>} />
              <Route path="/admin/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
              <Route path="/admin/billing" element={<AdminRoute><BillingPage /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><UserManagementPage /></AdminRoute>} />
              <Route path="/admin/dynamic-sync" element={<AdminRoute><DynamicFormAdmin /></AdminRoute>} />
              <Route path="/admin/guides-dashboard" element={<AdminRoute><GuidesDashboardPage /></AdminRoute>} />
              <Route path="/admin/guides" element={<AdminRoute><GuidesListPage /></AdminRoute>} />
              <Route path="/admin/attendance-logs" element={<AdminRoute><AttendanceLogsPage /></AdminRoute>} />
              <Route path="/admin/assignments" element={<AdminRoute><AssignmentsPage /></AdminRoute>} />
              <Route path="/admin/payroll" element={<AdminRoute><PayrollPage /></AdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DynamicThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
