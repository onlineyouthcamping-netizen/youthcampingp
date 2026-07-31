const { prisma } = require('../lib/prisma');

const PERMISSION_CATALOG = [
  // Dashboard & Analytics
  { module: 'Dashboard', action: 'dashboard.view', name: 'View Dashboard', description: 'Access dashboard metrics and summary widgets' },
  { module: 'Dashboard', action: 'dashboard.analytics', name: 'View Analytics', description: 'Access high-level business analytics' },

  // Bookings
  { module: 'Bookings', action: 'bookings.view', name: 'View Bookings', description: 'View assigned bookings list' },
  { module: 'Bookings', action: 'bookings.view_all', name: 'View All Company Bookings', description: 'View all company-wide bookings regardless of salesperson' },
  { module: 'Bookings', action: 'bookings.create', name: 'Create Bookings', description: 'Create new reservations' },
  { module: 'Bookings', action: 'bookings.edit', name: 'Edit Bookings', description: 'Modify booking passenger, trip, or package details' },
  { module: 'Bookings', action: 'bookings.cancel', name: 'Cancel Bookings', description: 'Cancel existing bookings' },
  { module: 'Bookings', action: 'bookings.delete', name: 'Delete Bookings', description: 'Permanently remove booking records' },
  { module: 'Bookings', action: 'bookings.assign', name: 'Assign Bookings', description: 'Reassign booking executive' },
  { module: 'Bookings', action: 'bookings.export', name: 'Export Bookings', description: 'Download CSV/Excel manifest of bookings' },
  { module: 'Bookings', action: 'bookings.payment', name: 'Record Booking Payment', description: 'Record payment collections' },
  { module: 'Bookings', action: 'bookings.refund', name: 'Process Booking Refund', description: 'Submit or approve refund requests' },
  { module: 'Bookings', action: 'bookings.ticketing', name: 'Manage Booking Tickets', description: 'Upload or update train tickets' },
  { module: 'Bookings', action: 'bookings.operations', name: 'Manage Booking Ops', description: 'Update rooming, transport, or hotel allocation' },
  { module: 'Bookings', action: 'bookings.verify', name: 'Verify Bookings', description: 'Verify payment proofs and passenger IDs' },
  { module: 'Bookings', action: 'customers.view', name: 'View Customers', description: 'View customer directory' },

  // Leads & Inquiries
  { module: 'Leads', action: 'leads.view', name: 'View Leads', description: 'Access inquiries and lead pipeline' },
  { module: 'Leads', action: 'leads.create', name: 'Create Leads', description: 'Add new lead/inquiry' },
  { module: 'Leads', action: 'leads.edit', name: 'Edit Leads', description: 'Update lead status and communications' },
  { module: 'Leads', action: 'leads.delete', name: 'Delete Leads', description: 'Remove inquiries' },
  { module: 'Leads', action: 'leads.assign', name: 'Assign Leads', description: 'Assign leads to sales executives' },

  // Trips & Products
  { module: 'Trips', action: 'trips.view', name: 'View Trips', description: 'Access catalog of trips and itineraries' },
  { module: 'Trips', action: 'trips.create', name: 'Create Trips', description: 'Create new trip packages' },
  { module: 'Trips', action: 'trips.edit', name: 'Edit Trips', description: 'Modify trip dates, pricing, or itineraries' },
  { module: 'Trips', action: 'trips.publish', name: 'Publish Trips', description: 'Publish trips to live website' },
  { module: 'Trips', action: 'trips.archive', name: 'Archive Trips', description: 'Archive obsolete trips' },

  // Quotations
  { module: 'Quotations', action: 'quotations.view', name: 'View Quotations', description: 'View custom quotes' },
  { module: 'Quotations', action: 'quotations.create', name: 'Create Quotations', description: 'Build custom PDF quotes' },
  { module: 'Quotations', action: 'quotations.edit', name: 'Edit Quotations', description: 'Modify generated quotations' },
  { module: 'Quotations', action: 'quotations.approve', name: 'Approve Quotations', description: 'Approve special discount quotes' },
  { module: 'Quotations', action: 'quotations.delete', name: 'Delete Quotations', description: 'Delete quotes' },

  // Package Builder
  { module: 'Package Builder', action: 'packages.view', name: 'View Packages', description: 'Access package builder templates' },
  { module: 'Package Builder', action: 'packages.create', name: 'Create Packages', description: 'Create dynamic multi-day packages' },
  { module: 'Package Builder', action: 'packages.edit', name: 'Edit Packages', description: 'Modify day itineraries and inclusions' },
  { module: 'Package Builder', action: 'packages.publish', name: 'Publish Packages', description: 'Publish package templates' },

  // Finance & Accounting
  { module: 'Finance', action: 'finance.view', name: 'View Finance Hub', description: 'Access revenue, collections, and daily closing' },
  { module: 'Finance', action: 'finance.edit', name: 'Manage Accounting', description: 'Edit accounting entries and vouchers' },
  { module: 'Finance', action: 'finance.refund', name: 'Approve Refunds', description: 'Approve customer refunds' },
  { module: 'Finance', action: 'finance.export', name: 'Export Financials', description: 'Export accounting ledger' },
  { module: 'Finance', action: 'finance.gst', name: 'Manage GST Reports', description: 'View and export GST reports' },

  // Operations & Guides
  { module: 'Operations', action: 'operations.view', name: 'View Live Operations', description: 'Access departure rosters and room allocations' },
  { module: 'Operations', action: 'operations.assign', name: 'Assign Trip Leaders', description: 'Assign guides to departures' },
  { module: 'Operations', action: 'operations.rooms', name: 'Manage Room Allocation', description: 'Assign hotel rooms' },
  { module: 'Operations', action: 'operations.transport', name: 'Manage Transport Fleet', description: 'Assign tempo travelers and vehicles' },
  { module: 'Operations', action: 'operations.hotels', name: 'Manage Hotel Bookings', description: 'Book hotel inventory' },
  { module: 'Operations', action: 'operations.departures', name: 'Manage Departures', description: 'Control trip departure dates' },

  // Train Ticketing
  { module: 'Train Ticketing', action: 'tickets.view', name: 'View Train Tickets', description: 'Access ticketing queue' },
  { module: 'Train Ticketing', action: 'tickets.create', name: 'Create Ticket Requests', description: 'Request train tickets' },
  { module: 'Train Ticketing', action: 'tickets.edit', name: 'Edit Train Tickets', description: 'Update PNR, seat, berth' },
  { module: 'Train Ticketing', action: 'tickets.submit', name: 'Submit Ticket Verification', description: 'Submit tickets for review' },
  { module: 'Train Ticketing', action: 'tickets.approve', name: 'Approve Train Tickets', description: 'Approve ticket verification' },

  // Guide Portal
  { module: 'Guide', action: 'guide.view', name: 'View Assigned Trips', description: 'View assigned departure manifests' },
  { module: 'Guide', action: 'guide.update', name: 'Update Trip Status', description: 'Update live trip status' },
  { module: 'Guide', action: 'guide.expense', name: 'Submit Trip Expenses', description: 'Log guide vouchers and bills' },
  { module: 'Guide', action: 'guide.attendance', name: 'Log Passenger Attendance', description: 'Track passenger attendance' },

  // Users & Access Control
  { module: 'Users', action: 'users.view', name: 'View Staff Members', description: 'View staff directory' },
  { module: 'Users', action: 'users.create', name: 'Create Staff Profiles', description: 'Create staff accounts' },
  { module: 'Users', action: 'users.edit', name: 'Edit Staff Accounts', description: 'Update staff details' },
  { module: 'Users', action: 'users.delete', name: 'Delete Staff Accounts', description: 'Deactivate staff' },
  { module: 'Users', action: 'users.permissions', name: 'Manage Roles & Permissions', description: 'Configure custom roles and permissions' },

  // Settings & Integrations
  { module: 'Settings', action: 'settings.view', name: 'View Settings', description: 'View system settings' },
  { module: 'Settings', action: 'settings.edit', name: 'Edit Settings', description: 'Update company profile' },
  { module: 'Settings', action: 'settings.company', name: 'Company Details', description: 'Manage company information' },
  { module: 'Settings', action: 'settings.integrations', name: 'Manage Integrations', description: 'Configure WhatsApp, Meta, Razorpay' },
  { module: 'Settings', action: 'settings.security', name: 'Security Settings', description: 'Configure session timeout and security policies' },

  // Documents
  { module: 'Documents', action: 'documents.view', name: 'View Company Documents', description: 'Access document library' },
  { module: 'Documents', action: 'documents.upload', name: 'Upload Documents', description: 'Upload company SOPs or permits' },
  { module: 'Documents', action: 'documents.delete', name: 'Delete Documents', description: 'Remove files' },

  // Reports
  { module: 'Reports', action: 'reports.view', name: 'View Business Reports', description: 'Access sales and ops reports' },
  { module: 'Reports', action: 'reports.export', name: 'Export Reports', description: 'Download CSV reports' },
  { module: 'Reports', action: 'reports.analytics', name: 'Advanced Analytics', description: 'View deep analytics dashboard' }
];

const SYSTEM_ROLES = [
  {
    name: 'Super Admin',
    description: 'Full unrestricted system access across all modules and settings',
    isSystem: true,
    isCustom: false,
    permissions: PERMISSION_CATALOG.map(p => p.action)
  },
  {
    name: 'Admin',
    description: 'Full operational and management access across all business modules',
    isSystem: true,
    isCustom: false,
    permissions: PERMISSION_CATALOG.map(p => p.action).filter(a => !['users.delete', 'settings.security'].includes(a))
  },
  {
    name: 'Sales',
    description: 'Lead management, quotations, bookings, and customer communications',
    isSystem: true,
    isCustom: false,
    permissions: ['dashboard.view', 'bookings.view', 'bookings.view_all', 'bookings.create', 'bookings.edit', 'bookings.payment', 'leads.view', 'leads.create', 'leads.edit', 'leads.assign', 'quotations.view', 'quotations.create', 'quotations.edit', 'packages.view', 'tickets.view', 'tickets.create', 'customers.view']
  },
  {
    name: 'Operations',
    description: 'Live departure management, guide assignments, rooming, and fleet',
    isSystem: true,
    isCustom: false,
    permissions: ['dashboard.view', 'trips.view', 'bookings.view', 'bookings.view_all', 'bookings.edit', 'bookings.operations', 'operations.view', 'operations.assign', 'operations.rooms', 'operations.transport', 'operations.hotels', 'operations.departures', 'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.submit', 'tickets.approve', 'documents.view', 'documents.upload']
  },
  {
    name: 'Finance',
    description: 'Revenue collections, daily cash closing, refunds, and GST reporting',
    isSystem: true,
    isCustom: false,
    permissions: ['dashboard.view', 'bookings.view', 'bookings.view_all', 'bookings.payment', 'bookings.refund', 'finance.view', 'finance.edit', 'finance.refund', 'finance.export', 'finance.gst', 'reports.view', 'reports.export']
  },
  {
    name: 'Guide',
    description: 'Trip leader roster access, passenger check-in, and voucher logs',
    isSystem: true,
    isCustom: false,
    permissions: ['dashboard.view', 'guide.view', 'guide.update', 'guide.expense', 'guide.attendance', 'trips.view', 'operations.view']
  },
  {
    name: 'Viewer',
    description: 'Read-only access to operational manifests, leads, and dashboards',
    isSystem: true,
    isCustom: false,
    permissions: ['dashboard.view', 'trips.view', 'bookings.view', 'bookings.view_all', 'leads.view', 'quotations.view', 'reports.view']
  }
];

async function seedEnterpriseRbac() {
  console.log('[RBAC SEEDER] Starting Enterprise RBAC Seeding & Migration...');

  // 1. Seed Permissions Catalog
  const permMap = new Map();
  for (const permData of PERMISSION_CATALOG) {
    const perm = await prisma.permission.upsert({
      where: { action: permData.action },
      create: permData,
      update: {
        name: permData.name,
        description: permData.description,
        module: permData.module
      }
    });
    permMap.set(perm.action, perm.id);
  }
  console.log(`[RBAC SEEDER] Seeded ${PERMISSION_CATALOG.length} permissions in catalog.`);

  // 2. Seed System Roles & Map Permissions
  const roleMap = new Map();
  for (const roleDef of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: {
        tenantId_name: {
          tenantId: 'default',
          name: roleDef.name
        }
      },
      create: {
        tenantId: 'default',
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
        isCustom: false,
        status: 'active'
      },
      update: {
        description: roleDef.description,
        isSystem: true
      }
    });
    roleMap.set(role.name.toLowerCase(), role.id);

    // Map role permissions
    for (const actionKey of roleDef.permissions) {
      const permId = permMap.get(actionKey);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permId
            }
          },
          create: {
            roleId: role.id,
            permissionId: permId
          },
          update: {}
        });
      }
    }
  }
  console.log(`[RBAC SEEDER] Seeded ${SYSTEM_ROLES.length} system roles and permission mappings.`);

  // 3. Migrate existing Admin users to UserRoleAssignment
  const admins = await prisma.admin.findMany({ select: { id: true, role: true } });
  let migratedCount = 0;

  for (const adminUser of admins) {
    const roleName = String(adminUser.role).toLowerCase();
    let targetRoleId = roleMap.get(roleName);

    if (!targetRoleId) {
      if (roleName.includes('admin') || roleName.includes('super')) {
        targetRoleId = roleMap.get('super admin') || roleMap.get('admin');
      } else if (roleName.includes('sales')) {
        targetRoleId = roleMap.get('sales');
      } else if (roleName.includes('ops') || roleName.includes('operation')) {
        targetRoleId = roleMap.get('operations');
      } else if (roleName.includes('fin')) {
        targetRoleId = roleMap.get('finance');
      } else if (roleName.includes('guide')) {
        targetRoleId = roleMap.get('guide');
      } else {
        targetRoleId = roleMap.get('admin');
      }
    }

    if (targetRoleId) {
      await prisma.userRoleAssignment.upsert({
        where: {
          userId_roleId: {
            userId: adminUser.id,
            roleId: targetRoleId
          }
        },
        create: {
          userId: adminUser.id,
          roleId: targetRoleId,
          isPrimary: true
        },
        update: {
          isPrimary: true
        }
      });
      migratedCount++;
    }
  }

  console.log(`[RBAC SEEDER] Successfully migrated ${migratedCount} staff accounts to UserRoleAssignment.`);
  console.log('[RBAC SEEDER] Enterprise RBAC Seeding Complete!');
}

if (require.main === module) {
  seedEnterpriseRbac()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[RBAC SEEDER ERROR]', err);
      process.exit(1);
    });
}

module.exports = { seedEnterpriseRbac, PERMISSION_CATALOG, SYSTEM_ROLES };
