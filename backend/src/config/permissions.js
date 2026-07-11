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
  'emails.view_logs'
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
    'emails.view_logs'
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
    'emails.view_logs'
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
    'emails.view_logs'
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
    'emails.send'
  ],

  guide: [
    'trips.view',
    'bookings.view',
    'operations.view',
    'operations.edit'
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
 * Check if a role is authorized for a specific permission.
 */
function hasPermission(role, permission) {
  if (!role) return false;
  if (role === 'superadmin') return true;
  
  const allowed = ROLE_PERMISSIONS[role];
  if (!allowed) return false;
  
  return allowed.includes(permission);
}

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission
};
