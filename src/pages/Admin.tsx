import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import Navigation from '@/components/Navigation';
import RoleManagement from '@/components/RoleManagement';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Users, 
  ClipboardList, 
  AlertTriangle, 
  IndianRupee,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  History
} from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  balance: number;
  tasks_completed: number;
  is_verified: boolean;
  roles: UserRole[];
}

interface Task {
  id: string;
  title: string;
  payout: number;
  status: string;
  dispute_status: string | null;
  poster_id: string;
  assignee_id: string | null;
}

interface Dispute {
  id: string;
  task_id: string;
  reason: string;
  status: string;
  created_at: string;
  raised_by: string;
}

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  upi_id: string | null;
  status: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: any;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    openDisputes: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
      toast.error('Access denied. Admin only.');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch all user roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('*');

    // Map roles to users
    const usersWithRoles = usersData?.map(u => ({
      ...u,
      roles: rolesData?.filter(r => r.user_id === u.id) || [],
    })) || [];

    // Fetch tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch disputes
    const { data: disputesData } = await supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch withdrawals
    const { data: withdrawalsData } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch audit logs
    const { data: logsData } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    setUsers(usersWithRoles);
    if (tasksData) setTasks(tasksData);
    if (disputesData) setDisputes(disputesData);
    if (withdrawalsData) setWithdrawals(withdrawalsData);
    if (logsData) setAuditLogs(logsData);

    // Calculate stats
    setStats({
      totalUsers: usersData?.length || 0,
      totalTasks: tasksData?.length || 0,
      openDisputes: disputesData?.filter(d => d.status === 'open').length || 0,
      totalEarnings: tasksData?.filter(t => t.status === 'completed').reduce((sum, t) => sum + Number(t.payout), 0) || 0,
    });

    setLoading(false);
  };

  const resolveDispute = async (disputeId: string, taskId: string, resolution: 'release' | 'refund') => {
    const { error: disputeError } = await supabase
      .from('disputes')
      .update({
        status: 'resolved',
        resolution: resolution === 'release' ? 'Payment released to worker' : 'Refunded to poster',
        resolved_by: user?.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', disputeId);

    if (disputeError) {
      toast.error('Failed to resolve dispute');
      return;
    }

    await supabase
      .from('tasks')
      .update({
        status: resolution === 'release' ? 'completed' : 'cancelled',
        dispute_status: 'resolved',
      })
      .eq('id', taskId);

    // Log admin action
    await supabase.from('admin_audit_logs').insert({
      admin_id: user?.id,
      action: `Dispute ${resolution === 'release' ? 'resolved - payment released' : 'resolved - refunded'}`,
      target_type: 'dispute',
      target_id: disputeId,
    });

    toast.success(`Dispute resolved - ${resolution === 'release' ? 'payment released' : 'refunded'}`);
    fetchData();
  };

  const processWithdrawal = async (id: string, action: 'approve' | 'reject') => {
    await supabase
      .from('withdrawal_requests')
      .update({
        status: action === 'approve' ? 'completed' : 'rejected',
        processed_by: user?.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', id);

    await supabase.from('admin_audit_logs').insert({
      admin_id: user?.id,
      action: `Withdrawal ${action}d`,
      target_type: 'withdrawal',
      target_id: id,
    });

    toast.success(`Withdrawal ${action}d`);
    fetchData();
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (roleFilter === 'all') return matchesSearch;
    if (roleFilter === 'admin') return matchesSearch && u.roles.some(r => r.role === 'admin');
    if (roleFilter === 'moderator') return matchesSearch && u.roles.some(r => r.role === 'moderator');
    if (roleFilter === 'user') return matchesSearch && u.roles.length === 0;
    return matchesSearch;
  });

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <ClipboardList className="h-8 w-8 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Open Disputes</p>
                <p className="text-2xl font-bold">{stats.openDisputes}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <IndianRupee className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">₹{stats.totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users">Users & Roles</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="p-4">
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="moderator">Moderators</SelectItem>
                    <SelectItem value="user">Regular Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Roles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || 'N/A'}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>₹{Number(u.balance).toLocaleString()}</TableCell>
                      <TableCell>{u.tasks_completed}</TableCell>
                      <TableCell>
                        <RoleManagement
                          userId={u.id}
                          userName={u.full_name || u.email || 'User'}
                          currentRoles={u.roles}
                          onRoleChanged={fetchData}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dispute</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>₹{Number(task.payout).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            task.status === 'completed'
                              ? 'default'
                              : task.status === 'disputed'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.dispute_status && (
                          <Badge variant="destructive">{task.dispute_status}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="disputes">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell className="font-medium max-w-md truncate">
                        {dispute.reason}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={dispute.status === 'open' ? 'destructive' : 'default'}
                        >
                          {dispute.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(dispute.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {dispute.status === 'open' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => resolveDispute(dispute.id, dispute.task_id, 'release')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Release
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => resolveDispute(dispute.id, dispute.task_id, 'refund')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Refund
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>UPI ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">₹{Number(w.amount).toLocaleString()}</TableCell>
                      <TableCell>{w.upi_id || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            w.status === 'completed'
                              ? 'default'
                              : w.status === 'rejected'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {w.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(w.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {w.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => processWithdrawal(w.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => processWithdrawal(w.id, 'reject')}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Recent Admin Actions</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.target_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
