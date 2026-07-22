const { requireFounder } = require('../src/middleware/auth');
const { hasPermission } = require('../src/config/permissions');

describe('Backend Auth & Founder Security Protection Suite', () => {
  test('requireFounder middleware passes strictly for Hemal Patel superadmin account', () => {
    const reqFounder = {
      user: { role: 'superadmin', email: 'hemal.patel@youthcamping.online', name: 'Hemal Patel' }
    };
    const reqNonFounder = {
      user: { role: 'admin', email: 'suresh.chaudhary@youthcamping.online', name: 'Suresh Chaudhary' }
    };

    let nextCalledFunc = false;
    const next = () => { nextCalledFunc = true; };

    const resObj = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        return this;
      }
    };

    requireFounder(reqFounder, resObj, next);
    expect(nextCalledFunc).toBe(true);

    let failedNext = false;
    const nextFail = () => { failedNext = true; };
    const resFail = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        return this;
      }
    };

    requireFounder(reqNonFounder, resFail, nextFail);
    expect(failedNext).toBe(false);
    expect(resFail.statusCode).toBe(403);
    expect(resFail.body.message).toContain('Founder privileges required');
  });

  test('staff_profiles and roles_permissions are denied to admin, sales, and operations roles', () => {
    expect(hasPermission('admin', 'staff_profiles.view')).toBe(false);
    expect(hasPermission('sales', 'staff_profiles.view')).toBe(false);
    expect(hasPermission('operations', 'staff_profiles.view')).toBe(false);
    expect(hasPermission('admin', 'roles_permissions.manage')).toBe(false);
    expect(hasPermission('sales', 'roles_permissions.manage')).toBe(false);

    expect(hasPermission('superadmin', 'staff_profiles.view')).toBe(true);
    expect(hasPermission('superadmin', 'roles_permissions.manage')).toBe(true);
  });
});
