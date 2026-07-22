/**
 * YouthCamping Role-Permission Mapping Configuration
 */

const PERMISSIONS = [
  'dashboard.view',
  'trips.view',
  'trips.create',
  'trips.edit',
  'trips.publish',
  'trips.archive',
  'trips.delete',
  'bookings.view',
  'bookings.create',
  'bookings.edit',
  'bookings.approve',
  'bookings.reject',
  'payments.view',
  'payments.edit',
  'inquiries.view',
  'inquiries.create',
  'inquiries.edit',
  'quotations.view',
  'quotations.create',
  'quotations.edit',
  'customers.view',
  'customers.export',
  'pagebuilder.view',
  'pagebuilder.edit',
  'seo.view',
  'seo.edit',
  'guides.view',
  'guides.manage',
  'operations.view',
  'operations.edit',
  'reports.view',
  'reports.export',
  'users.view',
  'users.manage',
  'roles.manage',
  'audit.view',
  'settings.view',
  'settings.edit',
  'bookings.verify',
  'tickets.view',
  'tickets.create',
  'tickets.edit',
  'tickets.submit',
  'tickets.approve',
  'tickets.reopen',
  'tickets.bulk',
  'tickets.templates.manage',
  'tickets.alerts.view',
  'accounting.view',
  'accounting.submit',
  'accounting.approve',
  'ops.view',
  'ops.manage',
  'ops.allocate',
  'ops.checklist',
  'packages.view',
  'packages.manage',
  'design.view',
  'design.edit',
  'design.publish',
  'design.restore',
  'design.css',
  'design.presets',
  'emails.view',
  'emails.send',
  'emails.send_bulk',
  'emails.manage_templates',
  'emails.view_logs',
  'vendors.view',
  'vendors.create',
  'vendors.edit',
  'vendors.import',
  'vendors.activate',
  'package.vendor.select',
  'ops.vendor.allocate',
  'ops.vendor.confirm',
  'ops.vendor.rate.override',
  
  // Notification Center
  'notifications.view_own',
  'notifications.mark_read',
  
  // Activity Timeline
  'activity.view',
  
  // Company Documents
  'company_documents.view',
  'company_documents.upload',
  'company_documents.edit',
  'company_documents.download',
  'company_documents.archive',
  'company_documents.manage_categories',
  
  // Audit Logs
  'audit_logs.view',
  
  // Recurring Tasks
  'recurring_tasks.view',
  'recurring_tasks.create',
  'recurring_tasks.edit',
  'recurring_tasks.pause',
  'recurring_tasks.assign',
  
  // Customer Timeline
  'customers.timeline.view',
  'customers.timeline.view_finance',

  // Station Payment Collection
  'station_payments.view',
  'station_payments.collect',
  'station_payments.edit_before_handover',
  'station_payments.cancel',
  'station_payments.handover',
  'station_payments.receive',
  'station_payments.reconcile',
  'station_payments.export',
  'station_payments.resend_receipt',
  'station_payments.manage_accounts',
  'station_payments.verify_upi'
];

const ROLE_PERMISSIONS = {
  superadmin: [...PERMISSIONS], // Unrestricted access

  admin: [
    'dashboard.view',
    'trips.view',
    'trips.create',
    'trips.edit',
    'trips.publish',
    'trips.archive',
    'design.view',
    'design.edit',
    'bookings.view',
    'bookings.create',
    'bookings.edit',
    'bookings.approve',
    'bookings.reject',
    'payments.view',
    'payments.edit',
    'inquiries.view',
    'inquiries.create',
    'inquiries.edit',
    'quotations.view',
    'quotations.create',
    'quotations.edit',
    'customers.view',
    'guides.view',
    'guides.manage',
    'operations.view',
    'operations.edit',
    'reports.view',
    'reports.export',
    'settings.view',
    'bookings.verify',
    'tickets.view',
    'tickets.create',
    'tickets.edit',
    'tickets.submit',
    'tickets.approve',
    'tickets.reopen',
    'tickets.bulk',
    'tickets.templates.manage',
    'tickets.alerts.view',
    'accounting.view',
    'accounting.submit',
    'accounting.approve',
    'ops.view',
    'ops.manage',
    'ops.allocate',
    'ops.checklist',
    'emails.view',
    'emails.send',
    'emails.send_bulk',
    'emails.manage_templates',
    'emails.view_logs',
    'vendors.view',
    'vendors.create',
    'vendors.edit',
    'vendors.import',
    'vendors.activate',
    'package.vendor.select',
    'ops.vendor.allocate',
    'ops.vendor.confirm',
    'ops.vendor.rate.override',
    // Station Payment Collection
    'station_payments.view',
    'station_payments.collect',
    'station_payments.edit_before_handover',
    'station_payments.cancel',
    'station_payments.handover',
    'station_payments.receive',
    'station_payments.reconcile',
    'station_payments.export',
    'station_payments.resend_receipt',
    'station_payments.manage_accounts',
    'station_payments.verify_upi'
  ],

  sales: [
    'dashboard.view',
    'trips.view',
    'bookings.view',
    'bookings.create',
    'bookings.edit',
    'bookings.approve',
    'payments.view',
    'inquiries.view',
    'inquiries.create',
    'inquiries.edit',
    'quotations.view',
    'quotations.create',
    'quotations.edit',
    'tickets.view',
    'tickets.create',
    'tickets.edit',
    'tickets.submit',
    'tickets.bulk',
    'tickets.alerts.view',
    'accounting.view',
    'accounting.submit',
    'emails.view',
    'emails.send',
    'emails.send_bulk',
    'emails.view_logs',
    'vendors.view',
    'package.vendor.select',
    'notifications.view_own',
    'notifications.mark_read',
    'activity.view',
    'customers.view',
    'customers.timeline.view',
    'company_documents.view',
    'recurring_tasks.view',
    // Station Payment Collection - sales view own bookings
    'station_payments.view'
  ],

  operations: [
    'dashboard.view',
    'trips.view',
    'bookings.view',
    'bookings.edit',
    'operations.view',
    'operations.edit',
    'guides.view',
    'tickets.view',
    'tickets.create',
    'tickets.edit',
    'tickets.submit',
    'tickets.approve',
    'tickets.reopen',
    'tickets.bulk',
    'tickets.templates.manage',
    'tickets.alerts.view',
    'ops.view',
    'ops.manage',
    'ops.allocate',
    'ops.checklist',
    'emails.view',
    'emails.send',
    'emails.view_logs',
    'vendors.view',
    'vendors.create',
    'vendors.edit',
    'vendors.import',
    'package.vendor.select',
    'ops.vendor.allocate',
    'ops.vendor.confirm',
    'ops.vendor.rate.override',
    'notifications.view_own',
    'notifications.mark_read',
    'activity.view',
    'company_documents.view',
    'recurring_tasks.view',
    'recurring_tasks.assign',
    // Station Payment Collection - ops can collect and handover
    'station_payments.view',
    'station_payments.collect',
    'station_payments.edit_before_handover',
    'station_payments.cancel',
    'station_payments.handover',
    'station_payments.resend_receipt'
  ],

  finance: [
    'dashboard.view',
    'bookings.view',
    'bookings.edit',
    'payments.view',
    'payments.edit',
    'reports.view',
    'accounting.view',
    'accounting.approve',
    'emails.view',
    'emails.send',
    // Station Payment Collection - finance verifies, receives, reconciles
    'station_payments.view',
    'station_payments.receive',
    'station_payments.reconcile',
    'station_payments.export',
    'station_payments.manage_accounts',
    'station_payments.verify_upi'
  ],

  guide: [
    'trips.view',
    'bookings.view',
    'operations.view',
    'operations.edit',
    // Station Payment Collection - guides can view and collect for assigned departures
    'station_payments.view',
    'station_payments.collect'
  ],

  viewer: [
    'dashboard.view',
    'trips.view',
    'bookings.view',
    'inquiries.view',
    'quotations.view',
    'reports.view'
  ],

  BOOKING_VERIFIER: [
    'dashboard.view',
    'bookings.view',
    'bookings.verify',
    'tickets.view',
    'tickets.create',
    'tickets.edit',
    'tickets.submit',
    'tickets.approve',
    'tickets.reopen',
    'tickets.bulk',
    'tickets.templates.manage',
    'tickets.alerts.view',
    'emails.view',
    'emails.send',
    'emails.view_logs'
  ]
};

/**
 * Check if a role or user object is authorized for a specific permission.
 * Accepts either a role string or a user object ({ role, customPermissions }).
 */
function hasPermission(roleOrUser, permission) {
  if (!roleOrUser) return false;

  const role = typeof roleOrUser === 'string' ? roleOrUser : (roleOrUser.role || 'viewer');
  const custom = typeof roleOrUser === 'object' ? roleOrUser.customPermissions : null;

  if (role === 'superadmin') return true;

  // 1. Check primary role permissions
  const allowed = ROLE_PERMISSIONS[role] || [];
  if (allowed.includes(permission)) return true;

  // 2. Check custom permissions or granted extra roles
  if (custom && Array.isArray(custom)) {
    if (custom.includes(permission)) return true;

    for (const item of custom) {
      if (ROLE_PERMISSIONS[item] && ROLE_PERMISSIONS[item].includes(permission)) {
        return true;
      }
    }
  }

  return false;
}

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission
};
