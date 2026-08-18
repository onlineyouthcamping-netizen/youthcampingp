/**
 * YouthCamping Role-Permission Mapping Configuration
 */

const PERMISSIONS = [
  "dashboard.view",
  "trips.view",
  "trips.create",
  "trips.edit",
  "trips.publish",
  "trips.archive",
  "trips.delete",
  "departures.view",
  "departures.create",
  "departures.edit",
  "departures.manage",
  "departures.delete",
  "bookings.view",
  "bookings.create",
  "bookings.edit",
  "bookings.approve",
  "bookings.reject",
  "bookings.financial_edit",
  "bookings.refund",
  "payments.view",
  "payments.edit",
  "inquiries.view",
  "inquiries.create",
  "inquiries.edit",
  "quotations.view",
  "quotations.create",
  "quotations.edit",
  "customers.view",
  "customers.export",
  "pagebuilder.view",
  "pagebuilder.edit",
  "seo.view",
  "seo.edit",
  "guides.view",
  "guides.manage",
  "operations.view",
  "operations.edit",
  "reports.view",
  "reports.export",
  "users.view",
  "users.manage",
  "roles.manage",
  "staff_profiles.view",
  "staff_profiles.manage",
  "roles_permissions.manage",
  "payroll.view",
  "payroll.manage",
  "attendance.view",
  "attendance.manage",
  "marketing.social",
  "audit.view",
  "settings.view",
  "settings.edit",
  "bookings.verify",
  "tickets.view",
  "tickets.create",
  "tickets.edit",
  "tickets.submit",
  "tickets.approve",
  "tickets.reopen",
  "tickets.bulk",
  "tickets.templates.manage",
  "tickets.alerts.view",
  "accounting.view",
  "accounting.submit",
  "accounting.approve",
  "ops.view",
  "ops.manage",
  "ops.allocate",
  "ops.checklist",
  "packages.view",
  "packages.manage",
  "design.view",
  "design.edit",
  "design.publish",
  "design.restore",
  "design.css",
  "design.presets",
  "emails.view",
  "emails.send",
  "emails.send_bulk",
  "emails.manage_templates",
  "emails.view_logs",
  "vendors.view",
  "vendors.create",
  "vendors.edit",
  "vendors.import",
  "vendors.activate",
  "vendors.delete",
  "vendors.deactivate",
  "vendors.payments.view",
  "vendors.payments.manage",
  "vendors.mapping.manage",
  "vendors.costing.calculate",
  "vendors.rates.manage",
  "vendors.rate.manage",
  "vendors.trip.assign",
  "package.vendor.select",
  "ops.vendor.allocate",
  "ops.vendor.confirm",
  "ops.vendor.rate.override",

  // Notification Center
  "notifications.view_own",
  "notifications.mark_read",

  // Activity Timeline
  "activity.view",

  // Company Documents
  "company_documents.view",
  "company_documents.upload",
  "company_documents.edit",
  "company_documents.download",
  "company_documents.archive",
  "company_documents.manage_categories",

  // Audit Logs
  "audit_logs.view",

  // Recurring Tasks
  "recurring_tasks.view",
  "recurring_tasks.create",
  "recurring_tasks.edit",
  "recurring_tasks.pause",
  "recurring_tasks.assign",

  // Customer Timeline
  "customers.timeline.view",
  "customers.timeline.view_finance",

  // Station Payment Collection
  "station_payments.view",
  "station_payments.collect",
  "station_payments.edit_before_handover",
  "station_payments.cancel",
  "station_payments.handover",
  "station_payments.receive",
  "station_payments.reconcile",
  "station_payments.export",
  "station_payments.resend_receipt",
  "station_payments.manage_accounts",
  "station_payments.verify_upi",

  // Website Management
  "website.view",
  "website.edit",
  "website.publish",

  // Finance Control Center & Verification
  "finance.control_center.view",
  "finance.incoming.verify",
  "finance.incoming.approve",
  "finance.cash.verify",
  "finance.cash.approve",
  "finance.cash.reject",
  "finance.outgoing.verify",
  "finance.outgoing.approve",
  "finance.outgoing.pay",
  "finance.tickets.verify",
  "finance.tickets.approve",
  "finance.refunds.view",
  "finance.refunds.approve",
  "finance.discrepancy.manage",
  "finance.reports.export",

  // Finance Comprehensive Sub-Modules
  "finance.refund.create",
  "finance.refund.view",
  "finance.refund.approve",
  "finance.refund.reject",
  "finance.credit.view",
  "finance.credit.apply",
  "finance.coupons.view",
  "finance.coupons.manage",
  "finance.ticketing.view",
  "finance.ticketing.create",
  "finance.ticketing.verify",
  "finance.ticketing.approve",
  "finance.ticketing.bulk",
  "finance.services.view",
  "finance.services.manage",
  "finance.services.verify",
  "finance.tasks.view",
  "finance.tasks.manage",
  "finance.tasks.comment",
  "finance.audit.view",
  "finance.audit.export",
  "finance.accounting.view",
  "finance.accounting.manage",
];

const { isProtectedSuperadminIdentity } = require("./superadmin");

const ROLE_PERMISSIONS = {
  superadmin: [...PERMISSIONS], // Unrestricted access
  founder: [...PERMISSIONS],
  owner: [...PERMISSIONS],
  super_admin: [...PERMISSIONS],

  admin: [
    "dashboard.view",
    "trips.view",
    "trips.create",
    "trips.edit",
    "trips.publish",
    "trips.archive",
    "trips.delete",
    "departures.view",
    "departures.create",
    "departures.edit",
    "departures.manage",
    "departures.delete",
    "design.view",
    "design.edit",
    "bookings.view",
    "bookings.create",
    "bookings.edit",
    "bookings.approve",
    "bookings.reject",
    "bookings.financial_edit",
    "bookings.refund",
    "payments.view",
    "payments.edit",
    "inquiries.view",
    "inquiries.create",
    "inquiries.edit",
    "quotations.view",
    "quotations.create",
    "quotations.edit",
    "customers.view",
    "guides.view",
    "guides.manage",
    "operations.view",
    "operations.edit",
    "reports.view",
    "reports.export",
    "settings.view",
    "payroll.view",
    "payroll.manage",
    "attendance.view",
    "attendance.manage",
    "company_documents.view",
    "bookings.verify",
    "tickets.view",
    "tickets.create",
    "tickets.edit",
    "tickets.submit",
    "tickets.approve",
    "tickets.reopen",
    "tickets.bulk",
    "tickets.templates.manage",
    "tickets.alerts.view",
    "accounting.view",
    "accounting.submit",
    "accounting.approve",
    "ops.view",
    "ops.manage",
    "ops.allocate",
    "ops.checklist",
    "emails.view",
    "emails.send",
    "emails.send_bulk",
    "emails.manage_templates",
    "emails.view_logs",
    "vendors.view",
    "vendors.create",
    "vendors.edit",
    "vendors.import",
    "vendors.activate",
    "vendors.delete",
    "vendors.deactivate",
    "vendors.payments.view",
    "vendors.payments.manage",
    "vendors.mapping.manage",
    "vendors.costing.calculate",
    "vendors.rates.manage",
    "vendors.rate.manage",
    "vendors.trip.assign",
    "package.vendor.select",
    "ops.vendor.allocate",
    "ops.vendor.confirm",
    "ops.vendor.rate.override",
    // Station Payment Collection
    "station_payments.view",
    "station_payments.collect",
    "station_payments.edit_before_handover",
    "station_payments.cancel",
    "station_payments.handover",
    "station_payments.receive",
    "station_payments.reconcile",
    "station_payments.export",
    "station_payments.resend_receipt",
    "station_payments.manage_accounts",
    "station_payments.verify_upi",
    // Website Management
    "website.view",
    "website.edit",
    "website.publish",
    // Notifications, ERP, and Timelines
    "notifications.view_own",
    "notifications.mark_read",
    "activity.view",
    "recurring_tasks.view",
    "customers.timeline.view",
  ],

  sales: [
    "dashboard.view",
    "trips.view",
    "departures.view",
    "bookings.view",
    "bookings.create",
    "bookings.edit",
    "bookings.approve",
    "payments.view",
    "accounting.submit",
    "inquiries.view",
    "inquiries.create",
    "inquiries.edit",
    "quotations.view",
    "quotations.create",
    "quotations.edit",
    "tickets.view",
    "tickets.create",
    "tickets.edit",
    "tickets.submit",
    "tickets.bulk",
    "tickets.alerts.view",
    "emails.view",
    "emails.send",
    "emails.send_bulk",
    "emails.view_logs",
    "vendors.view",
    "package.vendor.select",
    "notifications.view_own",
    "notifications.mark_read",
    "activity.view",
    "customers.view",
    "customers.timeline.view",
    "company_documents.view",
    "recurring_tasks.view",
    // Station Payment Collection - sales view own bookings
    "station_payments.view",
  ],

  operations: [
    "dashboard.view",
    "trips.view",
    "trips.create",
    "trips.edit",
    "departures.view",
    "departures.create",
    "departures.edit",
    "departures.manage",
    "bookings.view",
    "bookings.edit",
    "operations.view",
    "operations.edit",
    "guides.view",
    "guides.manage",
    "tickets.view",
    "tickets.create",
    "tickets.edit",
    "tickets.submit",
    "tickets.approve",
    "tickets.reopen",
    "tickets.bulk",
    "tickets.templates.manage",
    "tickets.alerts.view",
    "ops.view",
    "ops.manage",
    "ops.allocate",
    "ops.checklist",
    "emails.view",
    "emails.send",
    "emails.view_logs",
    "vendors.view",
    "vendors.create",
    "vendors.edit",
    "vendors.import",
    "vendors.activate",
    "vendors.delete",
    "vendors.deactivate",
    "vendors.payments.view",
    "vendors.payments.manage",
    "vendors.mapping.manage",
    "vendors.costing.calculate",
    "vendors.rates.manage",
    "vendors.rate.manage",
    "vendors.trip.assign",
    "package.vendor.select",
    "ops.vendor.allocate",
    "ops.vendor.confirm",
    "ops.vendor.rate.override",
    "notifications.view_own",
    "notifications.mark_read",
    "activity.view",
    "company_documents.view",
    "recurring_tasks.view",
    "recurring_tasks.assign",
    // Station Payment Collection - ops can collect and handover
    "station_payments.view",
    "station_payments.collect",
    "station_payments.edit_before_handover",
    "station_payments.cancel",
    "station_payments.handover",
    "station_payments.resend_receipt",
  ],

  finance: [
    "dashboard.view",
    "bookings.view",
    "bookings.edit",
    "payments.view",
    "payments.edit",
    "reports.view",
    "accounting.view",
    "accounting.approve",
    "emails.view",
    "emails.send",
    // Station Payment Collection - finance verifies, receives, reconciles
    "station_payments.view",
    "station_payments.receive",
    "station_payments.reconcile",
    "station_payments.export",
    "station_payments.manage_accounts",
    "station_payments.verify_upi",
  ],

  finance_controller: [
    "dashboard.view",
    "bookings.view",
    "payments.view",
    "reports.view",
    "reports.export",
    "accounting.view",
    "accounting.approve",
    "finance.control_center.view",
    "finance.incoming.verify",
    "finance.incoming.approve",
    "finance.cash.verify",
    "finance.cash.approve",
    "finance.cash.reject",
    "finance.outgoing.verify",
    "finance.outgoing.approve",
    "finance.outgoing.pay",
    "finance.tickets.verify",
    "finance.tickets.approve",
    "finance.refunds.view",
    "finance.refunds.approve",
    "finance.discrepancy.manage",
    "finance.reports.export",
    "station_payments.view",
    "station_payments.receive",
    "station_payments.reconcile",
    "station_payments.export",
    "station_payments.manage_accounts",
    "station_payments.verify_upi",
    "vendors.view",
    "vendors.payments.view",
    "tickets.view",
    "audit_logs.view",
    "audit.view",
    "customers.timeline.view",
    "customers.timeline.view_finance",

    // Sub-module permissions
    "finance.refund.create",
    "finance.refund.view",
    "finance.refund.approve",
    "finance.refund.reject",
    "finance.credit.view",
    "finance.credit.apply",
    "finance.coupons.view",
    "finance.coupons.manage",
    "finance.ticketing.view",
    "finance.ticketing.create",
    "finance.ticketing.verify",
    "finance.ticketing.approve",
    "finance.ticketing.bulk",
    "finance.services.view",
    "finance.services.manage",
    "finance.services.verify",
    "finance.tasks.view",
    "finance.tasks.manage",
    "finance.tasks.comment",
    "finance.audit.view",
    "finance.audit.export",
    "finance.accounting.view",
    "finance.accounting.manage",
  ],

  guide: [
    "trips.view",
    "departures.view",
    "bookings.view",
    "operations.view",
    "operations.edit",
    // Station Payment Collection - guides can view and collect for assigned departures
    "station_payments.view",
    "station_payments.collect",
  ],

  viewer: [
    "dashboard.view",
    "trips.view",
    "bookings.view",
    "inquiries.view",
    "quotations.view",
    "reports.view",
  ],

  BOOKING_VERIFIER: [
    "dashboard.view",
    "bookings.view",
    "bookings.verify",
    "tickets.view",
    "tickets.create",
    "tickets.edit",
    "tickets.submit",
    "tickets.approve",
    "tickets.reopen",
    "tickets.bulk",
    "tickets.templates.manage",
    "tickets.alerts.view",
    "bookings.view_all",
    "emails.view",
    "emails.send",
    "emails.view_logs",
  ],
};

/**
 * Check if a role or user object is authorized for a specific permission.
 * Accepts either a role string or a user object ({ role, customPermissions }).
 */
function hasPermission(roleOrUser, permission) {
  if (!roleOrUser) return false;

  const role = (
    typeof roleOrUser === "string" ? roleOrUser : roleOrUser.role || ""
  ).toLowerCase().trim();
  const custom =
    typeof roleOrUser === "object" ? roleOrUser.customPermissions : null;
  const userPerms =
    typeof roleOrUser === "object" ? roleOrUser.permissions : null;

  if (
    role === "superadmin" ||
    role === "super_admin" ||
    role === "founder" ||
    role === "owner" ||
    (typeof roleOrUser === "object" &&
      isProtectedSuperadminIdentity({
        email: roleOrUser?.email,
        name: roleOrUser?.name,
      }))
  ) {
    return true;
  }

  // Build combined permissions set
  const combined = new Set();
  const defaultAllowed = ROLE_PERMISSIONS[role] || [];
  defaultAllowed.forEach((p) => combined.add(p));

  if (Array.isArray(custom)) {
    custom.forEach((p) => {
      combined.add(p);
      if (ROLE_PERMISSIONS[p]) {
        ROLE_PERMISSIONS[p].forEach((rp) => combined.add(rp));
      }
    });
  }

  if (Array.isArray(userPerms)) {
    userPerms.forEach((p) => combined.add(p));
  }

  if (Array.isArray(permission)) {
    return permission.some((p) => hasPermission(roleOrUser, p));
  }

  if (typeof permission !== "string") return false;

  if (combined.has(permission)) return true;

  // Precise legacy synonym aliases
  if (
    (permission === "view_trip" || permission === "trips.view") &&
    (combined.has("trips.view") || combined.has("view_trip") || combined.has("operations.view") || combined.has("ops.view"))
  ) {
    return true;
  }
  if (
    (permission === "edit_trip" || permission === "trips.edit") &&
    (combined.has("trips.edit") || combined.has("edit_trip") || combined.has("operations.edit") || combined.has("ops.manage"))
  ) {
    return true;
  }
  if (
    (permission === "create_trip" || permission === "trips.create") &&
    (combined.has("trips.create") || combined.has("create_trip") || combined.has("operations.edit") || combined.has("ops.manage"))
  ) {
    return true;
  }
  if (
    (permission === "delete_trip" || permission === "trips.delete") &&
    (combined.has("trips.delete") || combined.has("delete_trip"))
  ) {
    return true;
  }
  if (permission === "departures.view" && (combined.has("operations.view") || combined.has("ops.view"))) {
    return true;
  }
  if (
    (permission === "ops.view" || permission === "operations.view") &&
    (combined.has("ops.view") || combined.has("operations.view"))
  ) {
    return true;
  }
  if (
    (permission === "ops.manage" || permission === "operations.edit") &&
    (combined.has("ops.manage") || combined.has("operations.edit"))
  ) {
    return true;
  }
  if (
    (permission === "guides.view" || permission === "guides.manage") &&
    (combined.has("ops.view") || combined.has("operations.view") || combined.has("ops.manage") || combined.has("operations.edit") || combined.has("guides.view") || combined.has("guides.manage"))
  ) {
    return true;
  }
  if (
    (permission === "vendors.view" || permission === "vendors.payments.view") &&
    (combined.has("ops.view") || combined.has("operations.view") || combined.has("vendors.view"))
  ) {
    return true;
  }
  if (
    (permission === "vendors.rates.manage" ||
      permission === "vendors.rate.manage" ||
      permission === "vendors.edit" ||
      permission === "vendors.create" ||
      permission === "vendors.mapping.manage" ||
      permission === "vendors.trip.assign" ||
      permission === "vendors.costing.calculate" ||
      permission === "vendors.payments.manage" ||
      permission === "vendors.activate" ||
      permission === "vendors.deactivate" ||
      permission === "vendors.delete") &&
    (combined.has("vendors.rates.manage") ||
      combined.has("vendors.rate.manage") ||
      combined.has("vendors.edit") ||
      combined.has("ops.manage") ||
      combined.has("operations.edit"))
  ) {
    return true;
  }
  if (
    (permission === "tickets.manage" || permission === "tickets.edit") &&
    (combined.has("tickets.manage") || combined.has("tickets.edit") || combined.has("tickets.approve") || combined.has("ops.manage") || combined.has("operations.edit"))
  ) {
    return true;
  }
  if (
    (permission === "company_documents.view" || permission === "documents.view") &&
    (combined.has("company_documents.view") || combined.has("documents.view"))
  ) {
    return true;
  }

  return false;
}

function getRolePermissions(role) {
  if (!role) return [];
  const normalized = String(role).trim().toLowerCase();
  return ROLE_PERMISSIONS[normalized] || ROLE_PERMISSIONS[role] || [];
}

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  getRolePermissions,
};
