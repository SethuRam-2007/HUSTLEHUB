import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, UserPlus, Loader2 } from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}

interface RoleManagementProps {
  userId: string;
  userName: string;
  currentRoles: UserRole[];
  onRoleChanged: () => void;
}

const RoleManagement = ({ userId, userName, currentRoles, onRoleChanged }: RoleManagementProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'moderator' | 'user'>('moderator');
  const [open, setOpen] = useState(false);

  const hasRole = (role: 'admin' | 'moderator' | 'user') => 
    currentRoles.some(r => r.role === role);

  const assignRole = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Check if role already exists
      if (hasRole(selectedRole)) {
        toast.error(`User already has ${selectedRole} role`);
        setLoading(false);
        return;
      }

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: selectedRole,
        });

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_audit_logs').insert({
        admin_id: user.id,
        action: `Assigned ${selectedRole} role`,
        target_type: 'user',
        target_id: userId,
        details: { role: selectedRole, user_name: userName },
      });

      toast.success(`${selectedRole} role assigned to ${userName}`);
      setOpen(false);
      onRoleChanged();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast.error(error.message || 'Failed to assign role');
    }
    
    setLoading(false);
  };

  const removeRole = async (roleId: string, roleName: string) => {
    if (!user) return;
    
    if (roleName === 'admin') {
      toast.error('Cannot remove admin role');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_audit_logs').insert({
        admin_id: user.id,
        action: `Removed ${roleName} role`,
        target_type: 'user',
        target_id: userId,
        details: { role: roleName, user_name: userName },
      });

      toast.success(`${roleName} role removed from ${userName}`);
      onRoleChanged();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast.error(error.message || 'Failed to remove role');
    }
    
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Display current roles */}
      <div className="flex gap-1">
        {currentRoles.length === 0 && (
          <Badge variant="outline">User</Badge>
        )}
        {currentRoles.map((role) => (
          <Badge
            key={role.id}
            variant={role.role === 'admin' ? 'default' : role.role === 'moderator' ? 'secondary' : 'outline'}
            className="cursor-pointer hover:opacity-80"
            onClick={() => role.role !== 'admin' && removeRole(role.id, role.role)}
            title={role.role !== 'admin' ? 'Click to remove' : ''}
          >
            {role.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
            {role.role}
            {role.role !== 'admin' && ' ×'}
          </Badge>
        ))}
      </div>

      {/* Add role button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={loading}>
            <UserPlus className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to {userName}</DialogTitle>
            <DialogDescription>
              Select a role to assign to this user. Only admin can assign roles.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <Select 
              value={selectedRole} 
              onValueChange={(v) => setSelectedRole(v as 'moderator' | 'user')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={assignRole} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Assign Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;
