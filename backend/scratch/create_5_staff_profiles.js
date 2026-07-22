const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const defaultPasswordHash = await bcrypt.hash('YouthCamping@2026', 10);

  const staffProfiles = [
    {
      name: 'Hemal Patel',
      email: 'hemal.patel@youthcamping.online',
      role: 'superadmin',
      customPermissions: [
        'users.view', 'users.manage', 'roles.manage',
        'dashboard.view', 'trips.view', 'trips.create', 'trips.edit', 'trips.publish', 'trips.archive',
        'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.approve', 'payments.view', 'payments.edit',
        'inquiries.view', 'inquiries.create', 'inquiries.edit', 'quotations.view', 'quotations.create',
        'customers.view', 'guides.view', 'guides.manage', 'operations.view', 'operations.edit', 'reports.view',
        'reports.export', 'settings.view', 'tickets.view', 'tickets.approve', 'accounting.view', 'accounting.approve',
        'ops.view', 'ops.manage', 'ops.allocate', 'ops.checklist', 'vendors.view', 'vendors.create'
      ]
    },
    {
      name: 'Suresh Chaudhary',
      email: 'suresh.chaudhary@youthcamping.online',
      role: 'admin',
      customPermissions: [
        'dashboard.view', 'trips.view', 'trips.create', 'trips.edit', 'trips.publish', 'trips.archive',
        'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.approve', 'payments.view', 'payments.edit',
        'inquiries.view', 'inquiries.create', 'inquiries.edit', 'quotations.view', 'quotations.create',
        'customers.view', 'guides.view', 'guides.manage', 'operations.view', 'operations.edit', 'reports.view',
        'reports.export', 'settings.view', 'tickets.view', 'tickets.approve', 'accounting.view', 'accounting.approve',
        'ops.view', 'ops.manage', 'ops.allocate', 'ops.checklist', 'vendors.view', 'vendors.create'
      ]
    },
    {
      name: 'Zeel Panchal',
      email: 'zeel.panchal@youthcamping.online',
      role: 'sales',
      customPermissions: [
        'dashboard.view', 'trips.view', 'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.approve',
        'payments.view', 'inquiries.view', 'inquiries.create', 'inquiries.edit', 'quotations.view', 'quotations.create',
        'quotations.edit', 'customers.view', 'customers.timeline.view', 'reports.view', 'reports.export',
        'ops.view', 'company_documents.view'
      ]
    },
    {
      name: 'Vidhi Thummer',
      email: 'vidhi.thummer@youthcamping.online',
      role: 'sales',
      customPermissions: [
        'dashboard.view', 'trips.view', 'bookings.view', 'bookings.create', 'bookings.edit',
        'inquiries.view', 'inquiries.create', 'inquiries.edit', 'quotations.view', 'quotations.create',
        'quotations.edit', 'customers.view', 'design.view', 'design.edit', 'ops.view', 'marketing.view'
      ]
    },
    {
      name: 'Neeki Diyali',
      email: 'nikkiyouthcamping@gmail.com',
      role: 'operations',
      customPermissions: [
        'dashboard.view', 'trips.view', 'bookings.view', 'bookings.edit',
        'operations.view', 'operations.edit', 'guides.view', 'guides.manage',
        'ops.view', 'ops.manage', 'ops.allocate', 'ops.checklist',
        'reports.view', 'company_documents.view', 'tickets.view'
      ]
    }
  ];

  console.log('Seeding / Updating 5 strict staff profiles...');

  for (const staff of staffProfiles) {
    const existing = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: staff.email },
          { name: { equals: staff.name, mode: 'insensitive' } }
        ]
      }
    });

    if (existing) {
      await prisma.admin.update({
        where: { id: existing.id },
        data: {
          name: staff.name,
          email: staff.email,
          role: staff.role,
          customPermissions: staff.customPermissions,
          isActive: true
        }
      });
      console.log(`Updated existing staff profile: ${staff.name} (${staff.email}) -> Role: ${staff.role}`);
    } else {
      await prisma.admin.create({
        data: {
          name: staff.name,
          email: staff.email,
          password: defaultPasswordHash,
          role: staff.role,
          customPermissions: staff.customPermissions,
          tenantId: 'default',
          isActive: true
        }
      });
      console.log(`Created new staff profile: ${staff.name} (${staff.email}) -> Role: ${staff.role}`);
    }
  }

  // Update Neeki Diyali's role specifically if existing under nikkiyouthcamping@gmail.com
  await prisma.admin.updateMany({
    where: { email: 'nikkiyouthcamping@gmail.com' },
    data: { role: 'operations' }
  });

  console.log('\nAll 5 Staff Profiles generated successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
