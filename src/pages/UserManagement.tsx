import React, { useEffect, useState } from 'react';
import { userService } from '../services/firebaseService';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Search,
  MoreVertical,
  Mail,
  Calendar,
  Filter
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved'>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = userService.getAllUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, []);

  const handleUpdateStatus = async (uid: string, status: 'Approved' | 'Pending') => {
    try {
      await userService.updateUserProfile(uid, { status });
      toast.success(`User ${status === 'Approved' ? 'approved' : 'moved to pending'}`);
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const handleUpdateRole = async (uid: string, role: 'Admin' | 'Member') => {
    try {
      await userService.updateUserProfile(uid, { role });
      toast.success(`User role updated to ${role}`);
    } catch (err) {
      toast.error('Failed to update user role');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName?.toLowerCase().includes(search.toLowerCase()) || 
                         user.email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || user.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: users.length,
    pending: users.filter(u => u.status === 'Pending').length,
    approved: users.filter(u => u.status === 'Approved').length,
    admins: users.filter(u => u.role === 'Admin').length
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 uppercase">User Management</h1>
          <p className="text-slate-500 font-medium mt-1">Manage platform access, roles, and approvals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-slate-600', bg: 'bg-slate-100' },
          { label: 'Pending Approval', value: stats.pending, icon: UserX, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Approved Access', value: stats.approved, icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-100' },
          { label: 'Administrators', value: stats.admins, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-50 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by name or email..." 
                className="pl-10 h-11 bg-slate-50/50 border-slate-100 rounded-xl focus:ring-slate-100 focus:border-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
              {(['All', 'Pending', 'Approved'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-4 h-9 font-bold text-[11px] uppercase tracking-widest transition-all ${
                    filter === f ? "bg-black text-white hover:bg-zinc-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">User</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Title</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Joined</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {filteredUsers.map((user) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={user.uid} 
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                            <AvatarImage src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} />
                            <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-slate-900 tracking-tight">{user.displayName}</p>
                            <p className="text-[11px] font-medium text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs font-bold text-slate-700 leading-tight">{user.jobTitle || 'N/A'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{user.department || 'No Dept'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`font-bold text-[9px] uppercase tracking-widest rounded-md border-transparent px-2 py-0.5 ${
                          user.role === 'Admin' ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`font-bold text-[9px] uppercase tracking-widest rounded-md border px-2 py-0.5 ${
                          user.status === 'Approved' ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-xl border-none ring-1 ring-black/5">
                            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Manage Access</div>
                            {user.status === 'Pending' ? (
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(user.uid, 'Approved')}
                                className="rounded-lg gap-2 cursor-pointer focus:bg-indigo-50 focus:text-indigo-600"
                              >
                                <UserCheck className="w-4 h-4" />
                                <span className="font-bold text-xs uppercase tracking-tight">Approve Access</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(user.uid, 'Pending')}
                                className="rounded-lg gap-2 cursor-pointer focus:bg-amber-50 focus:text-amber-600"
                              >
                                <UserX className="w-4 h-4" />
                                <span className="font-bold text-xs uppercase tracking-tight">Revoke Access</span>
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator className="bg-slate-50" />
                            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Alter Role</div>
                            <DropdownMenuItem 
                              onClick={() => handleUpdateRole(user.uid, user.role === 'Admin' ? 'Member' : 'Admin')}
                              className="rounded-lg gap-2 cursor-pointer focus:bg-slate-50"
                            >
                              <Shield className="w-4 h-4" />
                              <span className="font-bold text-xs uppercase tracking-tight">
                                make {user.role === 'Admin' ? 'Member' : 'Admin'}
                              </span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 grayscale opacity-30">
                        <Users className="w-12 h-12" />
                        <p className="font-bold text-slate-400 uppercase tracking-widest text-[11px]">No users found matching your criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
