import { useState, useEffect } from "react";
import { adminUsersService } from "@/services/adminUsers.service";
import { Admin, AdminRole } from "@/types";
import { 
  Users, 
  Shield, 
  User as UserIcon, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Key,
  Calendar,
  Lock,
  Mail,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const ROLES: { value: AdminRole; label: string; desc: string }[] = [
  { value: 'superadmin', label: 'Super Admin', desc: 'Full unrestricted system access' },
  { value: 'admin', label: 'Admin', desc: 'Manage trips, bookings, reports (No users/settings)' },
  { value: 'sales', label: 'Sales', desc: 'View and manage own bookings, leads and quotes only' },
  { value: 'operations', label: 'Operations', desc: 'View trip rosters, assign guides and rooms' },
  { value: 'finance', label: 'Finance', desc: 'View payments, GST, process invoice updates' },
  { value: 'guide', label: 'Guide', desc: 'Read assigned trips operations, meal preferences' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access to approved system modules' }
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create user dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("admin");
  const [isCreating, setIsCreating] = useState(false);

  // Reset password dialog state
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Admin | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await adminUsersService.listAdmins();
      setUsers(data);
    } catch (error: any) {
      console.error("Failed to fetch admins:", error);
      toast.error(error.response?.data?.message || "Failed to load admin users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword || !newRole) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsCreating(true);
      await adminUsersService.createAdmin({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole
      });
      toast.success("Admin user created successfully");
      setCreateOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("admin");
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to create admin:", error);
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: AdminRole) => {
    try {
      await adminUsersService.updateAdminRole(userId, role);
      toast.success(`Role updated successfully to ${role}`);
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to update role:", error);
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      const res = await adminUsersService.toggleAdminActive(userId);
      toast.success(`User account is now ${res.isActive ? 'active' : 'inactive'}`);
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to toggle status:", error);
      toast.error(error.response?.data?.message || "Failed to change active status");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetPasswordVal) {
      toast.error("Please enter a new password");
      return;
    }

    try {
      setIsResetting(true);
      await adminUsersService.resetAdminPassword(selectedUser.id, resetPasswordVal);
      toast.success(`Password reset successfully for ${selectedUser.name}`);
      setResetOpen(false);
      setSelectedUser(null);
      setResetPasswordVal("");
    } catch (error: any) {
      console.error("Failed to reset password:", error);
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Admin Accounts</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Manage roles, permissions, deactivation, and reset credentials</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" /> Create User
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {users.map((user) => (
          <Card key={user.id} className="rounded-[4px] border border-[#E2E8F0] hover:border-primary-orange/30 transition-all shadow-none bg-white">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0 ${user.role === 'superadmin' ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-primary-orange'}`}>
                    {user.role === 'superadmin' ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-slate-800">{user.name}</h3>
                      {!user.isActive && (
                        <Badge variant="destructive" className="font-bold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] bg-red-50 text-red-600 border border-red-200">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{user.email}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 md:gap-10">
                  <div className="text-left md:text-right">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Access Level</p>
                    <Badge className={`
                      ${user.role === 'superadmin' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                        user.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        user.role === 'sales' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        user.role === 'operations' ? 'bg-violet-50 text-violet-700 border-violet-200' : 
                        user.role === 'finance' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        user.role === 'guide' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                        'bg-slate-50 text-slate-700 border-slate-200'} 
                      font-bold uppercase text-[9px] tracking-wider px-2 py-0.5 rounded-[4px] border
                    `}>
                      {user.role}
                    </Badge>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Last Login</p>
                    <p className="text-xs font-semibold text-slate-700 flex items-center md:justify-end gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                    </p>
                  </div>

                  <div className="hidden md:block w-px h-8 bg-slate-100" />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-[4px] h-8 w-8 hover:bg-slate-50 border border-slate-100">
                        <MoreVertical className="w-4 h-4 text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-[4px] border border-slate-200 p-1 shadow-sm bg-white z-50">
                      <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-wider text-slate-400 p-2">Account Actions</DropdownMenuLabel>
                      
                      {/* Toggle active status */}
                      <DropdownMenuItem 
                        onClick={() => handleToggleActive(user.id)}
                        className={`rounded-[4px] p-2 cursor-pointer ${user.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                        disabled={user.id === 'root_admin_bypass'}
                      >
                        {user.isActive ? (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            <span className="text-xs font-semibold">Deactivate User</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            <span className="text-xs font-semibold">Reactivate User</span>
                          </>
                        )}
                      </DropdownMenuItem>

                      {/* Reset password */}
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedUser(user);
                          setResetOpen(true);
                        }}
                        className="rounded-[4px] p-2 cursor-pointer text-slate-700 hover:bg-slate-50"
                        disabled={user.id === 'root_admin_bypass'}
                      >
                        <Key className="w-4 h-4 mr-2 text-slate-450" />
                        <span className="text-xs font-semibold">Reset Password</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="my-1 border-slate-100" />
                      <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1.5">Change Role</DropdownMenuLabel>
                      
                      {ROLES.filter(r => r.value !== user.role).map((roleObj) => (
                        <DropdownMenuItem
                          key={roleObj.value}
                          onClick={() => handleUpdateRole(user.id, roleObj.value)}
                          className="rounded-[4px] px-2 py-1.5 cursor-pointer text-xs text-slate-700 hover:bg-slate-50 font-medium"
                          disabled={user.id === 'root_admin_bypass'}
                        >
                          <span>{roleObj.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && (
          <div className="h-48 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 rounded-[4px] border border-dashed border-slate-200">
            <Users className="w-8 h-8 text-slate-350" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No users found</p>
          </div>
        )}
      </div>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-[4px] border border-slate-200 p-5 bg-white">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-primary-orange" /> Create Admin Account
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400 font-medium">
              Fill in credentials and choose an initial role mapping.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-3 py-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="John Doe"
                className="rounded-[4px] h-8.5 border-slate-200 text-xs font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@youthcamping.in"
                  className="rounded-[4px] h-8.5 border-slate-200 pl-8.5 text-xs font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-[4px] h-8.5 border-slate-200 pl-8.5 text-xs font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="role" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">System Role</Label>
              <select
                id="role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as AdminRole)}
                className="w-full rounded-[4px] h-8.5 border border-slate-200 px-2.5 bg-white text-xs font-semibold focus:outline-none focus:border-primary-orange"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} ({r.desc})
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-3 border-t gap-2 flex justify-end">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="rounded-[4px] text-xs font-semibold h-8.5">
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="rounded-[4px] text-xs font-semibold h-8.5 bg-primary-orange hover:bg-primary-orange/90 text-white">
                {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-[360px] rounded-[4px] border border-slate-200 p-5 bg-white">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Key className="w-4 h-4 text-rose-500" /> Reset Password
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400 font-medium">
              Enter a new password for <span className="font-semibold text-slate-900">{selectedUser?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-3 py-3">
            <div className="space-y-1">
              <Label htmlFor="new-password" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="new-password"
                  type="password"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-[4px] h-8.5 border-slate-200 pl-8.5 text-xs font-medium"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t gap-2 flex justify-end">
              <Button type="button" variant="outline" onClick={() => {
                setResetOpen(false);
                setSelectedUser(null);
                setResetPasswordVal("");
              }} className="rounded-[4px] text-xs font-semibold h-8.5">
                Cancel
              </Button>
              <Button type="submit" disabled={isResetting} className="bg-rose-55 hover:bg-rose-600 rounded-[4px] text-xs font-semibold h-8.5 text-white">
                {isResetting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Reset Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
