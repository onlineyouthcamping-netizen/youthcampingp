/**
 * Centralized superadmin/owner authorization.
 *
 * Authorization must come from DB user + role + permissions. The only
 * email-based special case that is genuinely needed is guarding the
 * protected founder account against self-demotion/deletion. That list is
 * centralized here and overridable via the SUPERADMIN_EMAILS env var
 * (comma-separated). Never duplicate email checks in business controllers.
 */

const DEFAULT_SUPERADMIN_EMAILS = ["hemal.patel@youthcamping.online"];

const getSuperadminEmails = () => {
  const envValue = (process.env.SUPERADMIN_EMAILS || "").trim();
  if (envValue) {
    return envValue
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"));
  }
  return DEFAULT_SUPERADMIN_EMAILS;
};

const isProtectedSuperadminEmail = (email) => {
  if (!email) return false;
  return getSuperadminEmails().includes(String(email).trim().toLowerCase());
};

/**
 * Identity-level guard used by the founder-only Staff Profiles module.
 * Matches the protected superadmin email list only.
 */
const isProtectedSuperadminIdentity = ({ email } = {}) =>
  isProtectedSuperadminEmail(email);

module.exports = {
  getSuperadminEmails,
  isProtectedSuperadminEmail,
  isProtectedSuperadminIdentity,
};