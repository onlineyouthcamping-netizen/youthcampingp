/**
 * Central tenant context resolution.
 *
 * Target flow: authenticated request → resolved tenant → service → query.
 * Controllers should use resolveTenantId(req) instead of hardcoding
 * tenantId: "default" or repeating req.user?.tenantId || "default".
 */

const DEFAULT_TENANT_ID = "default";

const resolveTenantId = (reqOrTenant) => {
  if (typeof reqOrTenant === "string" && reqOrTenant.trim() !== "") {
    return reqOrTenant.trim();
  }
  const tenantId = reqOrTenant?.user?.tenantId || reqOrTenant?.tenantId || "";
  return tenantId.trim() !== "" ? tenantId.trim() : DEFAULT_TENANT_ID;
};

module.exports = {
  DEFAULT_TENANT_ID,
  resolveTenantId,
};