import React from "react";
import { useAuthStore } from "@/store/auth.store";

// Role hierarchy definition where higher roles possess access to lower levels implicitly
const ROLE_HIERARCHY: Record<string, number> = {
  admin: 3,
  superadmin: 3,
  manager: 2,
  user: 1,
};

interface RoleGuardProps {
  allowedRoles: ("admin" | "manager" | "user" | "superadmin")[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  allowedRoles, 
  children, 
  fallback = null 
}) => {
  const { admin } = useAuthStore();

  if (!admin) {
    return <>{fallback}</>;
  }

  // Allow implicit access if user's hierarchical rank matches or exceeds any allowed roles
  const userRank = ROLE_HIERARCHY[admin.role.toLowerCase()] || 0;
  const isAllowed = allowedRoles.some(role => {
    const requiredRank = ROLE_HIERARCHY[role.toLowerCase()] || 0;
    return userRank >= requiredRank;
  });

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export const RequireRole: React.FC<RoleGuardProps> = ({ allowedRoles, children, fallback }) => {
  return (
    <RoleGuard allowedRoles={allowedRoles} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

