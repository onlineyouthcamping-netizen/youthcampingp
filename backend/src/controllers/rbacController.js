const { prisma } = require("../lib/prisma");

// Helper to log RBAC audit events
async function logRbacAudit({
  tenantId = "default",
  userId,
  userName,
  userEmail,
  action,
  resourceType,
  resourceId,
  details,
  oldValue,
  newValue,
  req,
}) {
  try {
    const ipAddress = req?.ip || req?.connection?.remoteAddress || null;
    const userAgent = req?.headers ? req.headers["user-agent"] : null;

    await prisma.rbacAuditLog.create({
      data: {
        tenantId,
        userId: userId || req?.user?.id || "system",
        userName: userName || req?.user?.name || req?.user?.email || "System",
        userEmail: userEmail || req?.user?.email || null,
        action,
        resourceType,
        resourceId,
        details,
        oldValue: oldValue ? oldValue : undefined,
        newValue: newValue ? newValue : undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error("[RBAC AUDIT LOG ERROR]", err);
  }
}

// ----------------------------------------------------
// ROLE MANAGEMENT CONTROLLERS
// ----------------------------------------------------

exports.getRoles = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || "default";
    const { includeArchived, search } = req.query;

    const where = { tenantId };
    if (includeArchived !== "true") {
      where.isArchived = false;
    }
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const roles = await prisma.role.findMany({
      where,
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { userAssignments: true },
        },
      },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });

    const formattedRoles = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      isCustom: r.isCustom,
      isArchived: r.isArchived,
      status: r.status,
      assignedUsersCount: r._count.userAssignments,
      permissionsCount: r.permissions.length,
      permissions: r.permissions.map((p) => ({
        id: p.permission.id,
        action: p.permission.action,
        name: p.permission.name,
        module: p.permission.module,
      })),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json({ success: true, data: formattedRoles });
  } catch (err) {
    next(err);
  }
};

exports.getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await prisma.role.findFirst({
      where: { id, tenantId: req.user.tenantId || "default" },
      include: {
        permissions: {
          include: { permission: true },
        },
        userAssignments: {
          select: {
            userId: true,
            isPrimary: true,
            assignedAt: true,
          },
        },
      },
    });

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    res.json({
      success: true,
      data: {
        ...role,
        permissions: role.permissions.map((p) => p.permission),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.createRole = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || "default";
    const { name, description, permissionIds = [] } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Role name is required" });
    }

    const existing = await prisma.role.findFirst({
      where: { tenantId, name: { equals: name.trim(), mode: "insensitive" } },
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: `Role "${name}" already exists` });
    }

    const newRole = await prisma.role.create({
      data: {
        tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        isSystem: false,
        isCustom: true,
        createdBy: req.user.id,
      },
    });

    if (Array.isArray(permissionIds) && permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((pId) => ({
          roleId: newRole.id,
          permissionId: pId,
        })),
        skipDuplicates: true,
      });
    }

    await logRbacAudit({
      tenantId,
      action: "CREATE_ROLE",
      resourceType: "Role",
      resourceId: newRole.id,
      details: `Created custom role "${newRole.name}" with ${permissionIds.length} permissions`,
      newValue: { name: newRole.name, permissionIds },
      req,
    });

    res
      .status(201)
      .json({
        success: true,
        data: newRole,
        message: `Role "${newRole.name}" created successfully`,
      });
  } catch (err) {
    next(err);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId || "default";
    const { name, description, permissionIds } = req.body;

    const existing = await prisma.role.findFirst({
      where: { id, tenantId },
      include: { permissions: true },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }
    if (existing.isSystem) {
      return res
        .status(403)
        .json({
          success: false,
          message: "System roles are immutable and cannot be modified",
        });
    }

    const updated = await prisma.role.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined
          ? { description: description?.trim() || null }
          : {}),
      },
    });

    if (Array.isArray(permissionIds)) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((pId) => ({
            roleId: id,
            permissionId: pId,
          })),
          skipDuplicates: true,
        });
      }
    }

    await logRbacAudit({
      tenantId,
      action: "UPDATE_ROLE",
      resourceType: "Role",
      resourceId: id,
      details: `Updated custom role "${updated.name}"`,
      oldValue: {
        name: existing.name,
        permissionCount: existing.permissions.length,
      },
      newValue: {
        name: updated.name,
        permissionCount: permissionIds?.length ?? existing.permissions.length,
      },
      req,
    });

    res.json({
      success: true,
      data: updated,
      message: `Role "${updated.name}" updated successfully`,
    });
  } catch (err) {
    next(err);
  }
};

exports.cloneRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId || "default";
    const { newName } = req.body;

    const sourceRole = await prisma.role.findFirst({
      where: { id, tenantId },
      include: { permissions: true },
    });

    if (!sourceRole) {
      return res
        .status(404)
        .json({ success: false, message: "Source role not found" });
    }

    const targetName = newName?.trim() || `${sourceRole.name} (Copy)`;
    const existing = await prisma.role.findFirst({
      where: { tenantId, name: { equals: targetName, mode: "insensitive" } },
    });
    if (existing) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Role name "${targetName}" already exists`,
        });
    }

    const cloned = await prisma.role.create({
      data: {
        tenantId,
        name: targetName,
        description: `Cloned from ${sourceRole.name}. ${sourceRole.description || ""}`,
        isSystem: false,
        isCustom: true,
        createdBy: req.user.id,
      },
    });

    if (sourceRole.permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: sourceRole.permissions.map((p) => ({
          roleId: cloned.id,
          permissionId: p.permissionId,
        })),
      });
    }

    await logRbacAudit({
      tenantId,
      action: "CLONE_ROLE",
      resourceType: "Role",
      resourceId: cloned.id,
      details: `Cloned role "${sourceRole.name}" as "${cloned.name}"`,
      req,
    });

    res
      .status(201)
      .json({
        success: true,
        data: cloned,
        message: `Role cloned successfully as "${cloned.name}"`,
      });
  } catch (err) {
    next(err);
  }
};

exports.deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId || "default";

    const role = await prisma.role.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { userAssignments: true } },
      },
    });

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }
    if (role.isSystem) {
      return res
        .status(403)
        .json({ success: false, message: "System roles cannot be deleted" });
    }
    if (role._count.userAssignments > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role "${role.name}": it is assigned to ${role._count.userAssignments} active staff member(s). Reassign staff first.`,
      });
    }

    await prisma.role.delete({ where: { id } });

    await logRbacAudit({
      tenantId,
      action: "DELETE_ROLE",
      resourceType: "Role",
      resourceId: id,
      details: `Deleted custom role "${role.name}"`,
      oldValue: { name: role.name },
      req,
    });

    res.json({
      success: true,
      message: `Role "${role.name}" deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------
// PERMISSION CATALOG & MATRIX CONTROLLERS
// ----------------------------------------------------

exports.getPermissions = async (req, res, next) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });

    const grouped = permissions.reduce((acc, p) => {
      if (!acc[p.module]) {
        acc[p.module] = [];
      }
      acc[p.module].push(p);
      return acc;
    }, {});

    res.json({ success: true, data: { permissions, grouped } });
  } catch (err) {
    next(err);
  }
};

exports.getPermissionMatrix = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || "default";

    const [roles, permissions] = await Promise.all([
      prisma.role.findMany({
        where: { tenantId, isArchived: false },
        include: { permissions: true },
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      }),
      prisma.permission.findMany({
        orderBy: [{ module: "asc" }, { name: "asc" }],
      }),
    ]);

    const matrix = permissions.map((perm) => {
      const roleMap = {};
      roles.forEach((role) => {
        roleMap[role.id] = role.permissions.some(
          (rp) => rp.permissionId === perm.id,
        );
      });
      return {
        permissionId: perm.id,
        module: perm.module,
        action: perm.action,
        name: perm.name,
        description: perm.description,
        roles: roleMap,
      };
    });

    res.json({
      success: true,
      data: {
        roles: roles.map((r) => ({
          id: r.id,
          name: r.name,
          isSystem: r.isSystem,
        })),
        matrix,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------
// USER ACCESS & PERMISSION OVERRIDES CONTROLLERS
// ----------------------------------------------------

exports.getUserAccessDetails = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const [userAssignments, customPermissions, delegations] = await Promise.all(
      [
        prisma.userRoleAssignment.findMany({
          where: { userId },
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        }),
        prisma.userCustomPermission.findMany({
          where: { userId },
          include: { permission: true },
        }),
        prisma.permissionDelegation.findMany({
          where: {
            toUserId: userId,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          include: { permission: true },
        }),
      ],
    );

    // Calculate effective permissions set
    const effectiveSet = new Set();
    const deniedSet = new Set();

    customPermissions.forEach((cp) => {
      if (cp.isDenied) {
        deniedSet.add(cp.permission.action);
      } else {
        effectiveSet.add(cp.permission.action);
      }
    });

    userAssignments.forEach((ua) => {
      ua.role.permissions.forEach((rp) => {
        if (!deniedSet.has(rp.permission.action)) {
          effectiveSet.add(rp.permission.action);
        }
      });
    });

    delegations.forEach((del) => {
      if (!deniedSet.has(del.permission.action)) {
        effectiveSet.add(del.permission.action);
      }
    });

    res.json({
      success: true,
      data: {
        userId,
        roles: userAssignments.map((ua) => ({
          roleId: ua.roleId,
          roleName: ua.role.name,
          isPrimary: ua.isPrimary,
          isSystem: ua.role.isSystem,
        })),
        customPermissions: customPermissions.map((cp) => ({
          id: cp.id,
          permissionId: cp.permissionId,
          action: cp.permission.action,
          name: cp.permission.name,
          module: cp.permission.module,
          isDenied: cp.isDenied,
          expiresAt: cp.expiresAt,
        })),
        delegations: delegations.map((d) => ({
          id: d.id,
          fromUserId: d.fromUserId,
          action: d.permission.action,
          name: d.permission.name,
          expiresAt: d.expiresAt,
        })),
        effectivePermissions: Array.from(effectiveSet),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUserRoles = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { roleIds = [], primaryRoleId } = req.body;
    const tenantId = req.user.tenantId || "default";

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "At least one role must be assigned",
        });
    }

    const targetPrimary = primaryRoleId || roleIds[0];

    await prisma.userRoleAssignment.deleteMany({ where: { userId } });

    await prisma.userRoleAssignment.createMany({
      data: roleIds.map((rId) => ({
        userId,
        roleId: rId,
        isPrimary: rId === targetPrimary,
      })),
    });

    // Also sync standard Admin model role field for backward compatibility
    const primaryRoleObj = await prisma.role.findUnique({
      where: { id: targetPrimary },
    });
    if (primaryRoleObj) {
      const mappedEnum = primaryRoleObj.name.toLowerCase().replace(/\s+/g, "_");
      await prisma.admin.updateMany({
        where: { id: userId },
        data: {
          role: ["super_admin", "superadmin"].includes(mappedEnum)
            ? "superadmin"
            : [
                  "admin",
                  "sales",
                  "operations",
                  "finance",
                  "guide",
                  "viewer",
                ].includes(mappedEnum)
              ? mappedEnum
              : "admin",
        },
      });
    }

    await logRbacAudit({
      tenantId,
      action: "ASSIGN_USER_ROLES",
      resourceType: "Admin",
      resourceId: userId,
      details: `Updated role assignments for user ${userId}. Primary role: ${primaryRoleObj?.name}`,
      newValue: { roleIds, primaryRoleId: targetPrimary },
      req,
    });

    res.json({ success: true, message: "User roles updated successfully" });
  } catch (err) {
    next(err);
  }
};

exports.setUserCustomPermission = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { permissionId, isDenied = false, expiresAt } = req.body;
    const tenantId = req.user.tenantId || "default";

    if (!permissionId) {
      return res
        .status(400)
        .json({ success: false, message: "permissionId is required" });
    }

    const override = await prisma.userCustomPermission.upsert({
      where: {
        userId_permissionId: { userId, permissionId },
      },
      create: {
        userId,
        permissionId,
        isDenied,
        grantedBy: req.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      update: {
        isDenied,
        grantedBy: req.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    await logRbacAudit({
      tenantId,
      action: isDenied ? "DENY_USER_PERMISSION" : "GRANT_USER_PERMISSION",
      resourceType: "UserCustomPermission",
      resourceId: override.id,
      details: `${isDenied ? "Denied" : "Granted"} permission ${permissionId} for user ${userId}`,
      req,
    });

    res.json({
      success: true,
      data: override,
      message: "Permission override saved successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.removeUserCustomPermission = async (req, res, next) => {
  try {
    const { userId, permissionId } = req.params;
    const tenantId = req.user.tenantId || "default";

    await prisma.userCustomPermission.deleteMany({
      where: { userId, permissionId },
    });

    await logRbacAudit({
      tenantId,
      action: "REMOVE_USER_PERMISSION_OVERRIDE",
      resourceType: "UserCustomPermission",
      resourceId: `${userId}:${permissionId}`,
      details: `Removed permission override for user ${userId}`,
      req,
    });

    res.json({
      success: true,
      message: "Permission override removed successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------
// PERMISSION DELEGATION CONTROLLERS
// ----------------------------------------------------

exports.delegatePermission = async (req, res, next) => {
  try {
    const { toUserId, permissionId, expiresAt } = req.body;
    const fromUserId = req.user.id;
    const tenantId = req.user.tenantId || "default";

    if (!toUserId || !permissionId || !expiresAt) {
      return res
        .status(400)
        .json({
          success: false,
          message: "toUserId, permissionId, and expiresAt are required",
        });
    }

    const delegation = await prisma.permissionDelegation.create({
      data: {
        fromUserId,
        toUserId,
        permissionId,
        expiresAt: new Date(expiresAt),
      },
    });

    await logRbacAudit({
      tenantId,
      action: "DELEGATE_PERMISSION",
      resourceType: "PermissionDelegation",
      resourceId: delegation.id,
      details: `Delegated permission ${permissionId} from ${fromUserId} to ${toUserId} until ${expiresAt}`,
      req,
    });

    res
      .status(201)
      .json({
        success: true,
        data: delegation,
        message: "Permission delegated successfully",
      });
  } catch (err) {
    next(err);
  }
};

exports.revokeDelegation = async (req, res, next) => {
  try {
    const { delegationId } = req.params;
    const tenantId = req.user.tenantId || "default";

    const delegation = await prisma.permissionDelegation.update({
      where: { id: delegationId },
      data: { revokedAt: new Date() },
    });

    await logRbacAudit({
      tenantId,
      action: "REVOKE_DELEGATION",
      resourceType: "PermissionDelegation",
      resourceId: delegationId,
      details: `Revoked delegation ${delegationId}`,
      req,
    });

    res.json({
      success: true,
      data: delegation,
      message: "Delegation revoked successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------
// AUDIT LOG CONTROLLERS
// ----------------------------------------------------

exports.getAuditLog = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || "default";
    const {
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = { tenantId };
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.rbacAuditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.rbacAuditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
