import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Map,
  CalendarCheck,
  ClipboardList,
  Banknote,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import GuidesDashboardPage from "./GuidesDashboardPage";
import GuidesListPage from "./GuidesListPage";
import LiveTripOperationsPage from "./LiveTripOperationsPage";
import AttendanceLogsPage from "./AttendanceLogsPage";
import AssignmentsPage from "./AssignmentsPage";
import PayrollPage from "./PayrollPage";
import ExpensesApprovalPage from "./ExpensesApprovalPage";
import { cn } from "@/lib/utils";

type TabId =
  | "dashboard"
  | "list"
  | "live"
  | "attendance"
  | "assignments"
  | "payroll"
  | "expenses";

export default function GuideOperationsCenterPage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Guides Dashboard", icon: LayoutDashboard },
    { id: "list", label: "Guides List", icon: Users },
    { id: "live", label: "Live Operations", icon: Map },
    { id: "attendance", label: "Attendance Logs", icon: CalendarCheck },
    { id: "assignments", label: "Assignments", icon: ClipboardList },
    { id: "payroll", label: "Payroll & Payouts", icon: Banknote },
    { id: "expenses", label: "Expense Approvals", icon: FileText }
  ];

  return (
    <div className="space-y-6 pb-20 p-6 bg-[#F4F7FB] min-h-screen -mx-6 -mt-6">
      {/* Zoho Style Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#F97316]" />
            Guide Operations {activeTab && <span className="text-slate-400 font-medium text-sm">/ {menuItems.find(i => i.id === activeTab)?.label}</span>}
          </h1>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
            Manage guide assignments, attendance, live rosters, expenses, and payroll.
          </p>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-6">
        {/* Left Side: Secondary Vertical Menu */}
        <div className="lg:col-span-3 flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 gap-1 bg-white p-2.5 rounded-[4px] border border-[#E2E8F0] shadow-sm lg:sticky lg:top-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabId)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-[3px] text-left transition-all whitespace-nowrap",
                  isActive
                    ? "bg-[#F97316]/10 text-[#F97316] font-bold border-l-2 border-[#F97316]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-[#F97316]" : "text-slate-400")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Main Content Panel */}
        <div className="lg:col-span-9 animate-fade-in">
          {activeTab === "dashboard" && <GuidesDashboardPage />}
          {activeTab === "list" && <GuidesListPage />}
          {activeTab === "live" && <LiveTripOperationsPage />}
          {activeTab === "attendance" && <AttendanceLogsPage />}
          {activeTab === "assignments" && <AssignmentsPage />}
          {activeTab === "payroll" && <PayrollPage />}
          {activeTab === "expenses" && <ExpensesApprovalPage />}
        </div>
      </div>
    </div>
  );
}
