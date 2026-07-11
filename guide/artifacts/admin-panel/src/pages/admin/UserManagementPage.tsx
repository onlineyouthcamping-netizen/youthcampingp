import { useState, useEffect } from "react";
import { usersService } from "@/services/users.service";
import { User } from "@/types";
import { 
  Users, 
  Shield, 
  User as UserIcon, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  Loader2
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
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await usersService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'manager' | 'user') => {
    try {
      await usersService.updateUserRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update user role");
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
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">User Management</h1>
          <p className="text-muted-foreground font-medium text-sm">Manage user roles and system access permissions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {users.map((user) => (
          <Card key={user.id} className="rounded-3xl border-2 hover:border-primary transition-all overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    {user.role === 'admin' ? <Shield className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-black text-lg leading-none mb-1">{user.name}</h3>
                    <p className="text-xs text-muted-foreground font-bold">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Access Level</p>
                    <Badge className={`
                      ${user.role === 'admin' ? 'bg-rose-500 hover:bg-rose-600' : 
                        user.role === 'manager' ? 'bg-amber-500 hover:bg-amber-600' : 
                        'bg-blue-500 hover:bg-blue-600'} 
                      text-white font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-full
                    `}>
                      {user.role}
                    </Badge>
                  </div>

                  <div className="w-px h-10 bg-border mx-2" />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl border-2 p-2 shadow-2xl">
                      <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground p-3">Change Role</DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => handleUpdateRole(user.id, 'admin')}
                        className="rounded-xl p-3 cursor-pointer"
                        disabled={user.role === 'admin'}
                      >
                        <Shield className="w-4 h-4 mr-3 text-rose-500" />
                        <span className="text-xs font-bold uppercase">Promote to Admin</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUpdateRole(user.id, 'manager')}
                        className="rounded-xl p-3 cursor-pointer"
                        disabled={user.role === 'manager'}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-3 text-amber-500" />
                        <span className="text-xs font-bold uppercase">Assign Manager</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUpdateRole(user.id, 'user')}
                        className="rounded-xl p-3 cursor-pointer"
                        disabled={user.role === 'user'}
                      >
                        <UserIcon className="w-4 h-4 mr-3 text-blue-500" />
                        <span className="text-xs font-bold uppercase">Demote to User</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuItem className="rounded-xl p-3 cursor-pointer text-rose-500">
                        <XCircle className="w-4 h-4 mr-3" />
                        <span className="text-xs font-bold uppercase">Suspend Account</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 bg-muted/20 rounded-[48px] border-2 border-dashed">
            <Users className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No users found in database</p>
          </div>
        )}
      </div>
    </div>
  );
}
