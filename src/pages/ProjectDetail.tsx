import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectService, taskService, userService, invitationService } from '../services/firebaseService';
import { 
  ChevronLeft, 
  Plus, 
  Calendar, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Hash,
  Users,
  Settings,
  MoreHorizontal,
  Mail,
  UserPlus,
  Trash2,
  Shield,
  FolderX
} from 'lucide-react';
import { Button, buttonVariants } from '../components/ui/button';
import { cn } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium', dueDate: '', status: 'To Do', assignedTo: [] as string[] });
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const isOwner = project?.ownerId === user?.uid;
  const isAdmin = profile?.role === 'Admin';
  const canManage = isOwner || isAdmin;

  useEffect(() => {
    if (!id || !user) return;
    
    const fetchProjectAndMembers = async () => {
      const pData = await projectService.getProject(id) as any;
      setProject(pData);
      if (pData?.members && Array.isArray(pData.members)) {
        const mData = await userService.getUsersByUids(pData.members);
        setMembers(mData || []);
      }
    };

    fetchProjectAndMembers();

    const unsubTasks = taskService.getProjectTasks(id, (data) => {
      setTasks(data);
      setLoading(false);
    });

    const unsubInvites = invitationService.getProjectInvitations(id, (data) => {
      setPendingInvites(data);
    });

    return () => {
      unsubTasks && unsubTasks();
      unsubInvites && unsubInvites();
    };
  }, [id, user]);

  const handleDeleteProject = async () => {
    if (!id) return;
    if (!window.confirm('CRITICAL: Are you sure you want to delete this entire project? This will remove all tasks and data forever.')) return;
    
    try {
      await projectService.deleteProject(id);
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !id) {
      toast.error('Task title is required');
      return;
    }
    try {
      await taskService.createTask(id, newTask);
      toast.success('Task created successfully');
      setNewTask({ title: '', description: '', priority: 'Medium', dueDate: '', status: 'To Do', assignedTo: [] });
      setIsDialogOpen(false);
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      await taskService.updateTaskStatus(taskId, status);
      toast.success(`Moved to ${status}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskService.deleteTask(taskId);
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) return;
    setIsInviting(true);
    const email = inviteEmail.toLowerCase();
    
    try {
      // 1. Check if user already has an account
      const targetUser = await userService.getUserByEmail(email);
      
      if (targetUser) {
        if (project.members.includes(targetUser.uid)) {
          toast.error('User is already a member');
          return;
        }
        const updatedMembers = [...project.members, targetUser.uid];
        await projectService.updateMembers(id!, updatedMembers);
        
        // Update local state
        setProject({ ...project, members: updatedMembers });
        const mData = await userService.getUsersByUids(updatedMembers);
        setMembers(mData || []);
        
        setInviteEmail('');
        toast.success(`Added ${targetUser.displayName} to team`);
      } else {
        // 2. User doesn't exist, create an invitation
        const alreadyInvited = pendingInvites.find(i => i.email === email);
        if (alreadyInvited) {
          toast.error('Invitation already sent to this email');
          return;
        }
        
        await invitationService.createInvitation(id!, email);
        
        // Trigger email notification
        const projectUrl = `${window.location.origin}/projects/${id}`;
        const emailResult = await invitationService.sendInviteEmail(
          email, 
          project?.name || 'a project', 
          user?.displayName || 'A team member', 
          projectUrl
        );

        setInviteEmail('');
        
        if (emailResult?.status === 'mocked') {
          toast.info(`Invitation created, but email was not sent (API key missing or limit reached).`);
        } else if (emailResult?.status === 'success') {
          toast.success(`Invitation sent to ${email}`);
        } else {
          const errMsg = emailResult?.error || 'Unknown error';
          toast.warning(`Invitation created, but email failed: ${errMsg}. Note: Resend requires a verified domain to send to non-signup emails.`);
        }
      }
    } catch (err) {
      toast.error('Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!window.confirm('Revoke this invitation?')) return;
    try {
      await invitationService.deleteInvitation(inviteId);
      toast.success('Invitation revoked');
    } catch (err) {
      toast.error('Failed to revoke invitation');
    }
  };

  const handleRemoveMember = async (memberUid: string) => {
    if (memberUid === project.ownerId) {
      toast.error('Cannot remove the project owner');
      return;
    }
    if (!window.confirm('Remove this member from the project?')) return;
    
    try {
      const updatedMembers = project.members.filter((uid: string) => uid !== memberUid);
      await projectService.updateMembers(id!, updatedMembers);
      
      // Update local state
      setProject({ ...project, members: updatedMembers });
      setMembers(members.filter(m => m.uid !== memberUid));
      
      toast.success('Member removed');
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  const columns = [
    { title: 'To Do', icon: Hash, color: 'text-gray-400' },
    { title: 'In Progress', icon: Clock, color: 'text-blue-500' },
    { title: 'Review', icon: AlertCircle, color: 'text-amber-500' },
    { title: 'Completed', icon: CheckCircle2, color: 'text-emerald-500' },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8 max-w-full mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link to="/projects" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-widest transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Workspace
          </Link>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-none">{project?.name}</h1>
            <p className="text-slate-500 font-medium mt-3 max-w-2xl leading-relaxed text-sm">{project?.description || 'Strategic project framework and asset management.'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canManage && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDeleteProject}
              className="h-11 w-11 rounded-xl border border-rose-200 bg-rose-50/30 text-rose-600 shadow-sm hover:bg-rose-100 transition-all mr-2"
              title="Delete Project"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
          <div className="flex -space-x-3 mr-3">
            {members.map(member => (
              <Avatar key={member.uid} className="w-10 h-10 border-4 border-slate-50 ring-1 ring-slate-100 shadow-sm">
                <AvatarImage src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.uid}`} />
                <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
            <DialogTrigger render={<Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-indigo-600 transition-all" />}>
              <Users className="w-5 h-5" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 border-none overflow-hidden shadow-2xl">
              <div className="bg-white p-8">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Users className="w-5 h-5" />
                    </div>
                    Team Management
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {canManage && (
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 px-1">Invite Team Member</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input 
                            placeholder="teammate@company.com" 
                            className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200" 
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        <Button 
                          onClick={handleInviteMember} 
                          disabled={isInviting || !inviteEmail}
                          className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5"
                        >
                          {isInviting ? "..." : <UserPlus className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-[10px] text-slate-400 px-1 font-medium italic">
                        * Note: If the user doesn't have an account, they will automatically join once they sign up with this email.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 px-1">Current Members ({members.length})</Label>
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                        {members.map(member => (
                          <div key={member.uid} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group transition-all">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9 border-2 border-white shadow-sm">
                                <AvatarImage src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.uid}`} />
                                <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-bold text-slate-900 leading-tight">
                                  {member.displayName}
                                  {member.uid === project.ownerId && (
                                    <span className="ml-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Owner</span>
                                  )}
                                </p>
                                <p className="text-[11px] font-medium text-slate-400">{member.email}</p>
                              </div>
                            </div>
                            {canManage && member.uid !== project.ownerId && member.uid !== user?.uid && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveMember(member.uid)}
                                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {pendingInvites.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 px-1">Pending Invitations ({pendingInvites.length})</Label>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                          {pendingInvites.map(invite => (
                            <div key={invite.id} className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/30 border border-indigo-100/50 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                  <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-indigo-900 leading-tight">{invite.email}</p>
                                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Awaiting Signup</p>
                                </div>
                              </div>
                              {canManage && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleRevokeInvite(invite.id)}
                                  className="h-8 w-8 text-indigo-400 hover:text-rose-600 hover:bg-rose-100/50 transition-all rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {canManage && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "rounded-xl px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-100 gap-2 h-11 transition-all active:scale-95"
                )}
                render={<button />}
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Add New Task</span>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 border-none overflow-hidden shadow-2xl">
                <div className="bg-white p-8">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-bold text-slate-900">Create Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-5 font-medium">
                    <div className="space-y-1.5">
                      <Label htmlFor="task-title" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Task Title</Label>
                      <Input 
                        id="task-title" 
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        placeholder="e.g., Update Brand Identity"
                        className="rounded-lg border-slate-200 bg-slate-50 h-11 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="task-desc" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Description</Label>
                      <textarea 
                        id="task-desc" 
                        rows={3}
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        placeholder="Detailed requirements for this task..."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Status</Label>
                        <Select value={newTask.status} onValueChange={(val) => setNewTask({...newTask, status: val})}>
                          <SelectTrigger className="rounded-lg bg-slate-50 border-slate-200 h-11">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-xl font-medium">
                            <SelectItem value="To Do">To Do</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Review">Review</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Priority</Label>
                        <Select value={newTask.priority} onValueChange={(val) => setNewTask({...newTask, priority: val})}>
                          <SelectTrigger className="rounded-lg bg-slate-50 border-slate-200 h-11">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-xl">
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Assign To</Label>
                      <Select 
                        value={newTask.assignedTo[0] || ""} 
                        onValueChange={(val) => setNewTask({...newTask, assignedTo: val && val !== "unassigned" ? [val] : []})}
                      >
                        <SelectTrigger className="rounded-lg bg-slate-50 border-slate-200 h-11">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl font-medium">
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {members.map(member => (
                            <SelectItem key={member.uid} value={member.uid}>
                              {member.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Target Date</Label>
                      <Input 
                        type="date" 
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                        className="rounded-lg bg-slate-50 border-slate-200 h-11" 
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-8">
                    <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-lg font-bold h-11 px-6 text-slate-500">Cancel</Button>
                    <Button onClick={handleCreateTask} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold h-11 px-8 shadow-sm">Save Task</Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
        {columns.map((col) => (
          <div key={col.title} className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color.replace('text-', 'bg-')}`}></div>
                <h3 className="font-bold text-[13px] tracking-tight text-slate-800 uppercase">{col.title}</h3>
                <Badge variant="secondary" className="bg-white text-slate-400 font-bold border border-slate-200 rounded-md px-1.5 text-[10px]">
                  {tasks.filter(t => t.status === col.title).length}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-5 min-h-[300px]">
              <AnimatePresence mode="popLayout">
                {tasks.filter(t => t.status === col.title).map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteTask}
                    members={members}
                    canManage={canManage}
                    currentUserId={user?.uid}
                  />
                ))}
              </AnimatePresence>
              {tasks.filter(t => t.status === col.title).length === 0 && (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 italic">No tasks active</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TaskCard: React.FC<{ task: any; onStatusChange: (taskId: string, status: string) => void; onDelete: (taskId: string) => void; members: any[]; canManage: boolean; currentUserId: string | undefined }> = ({ task, onStatusChange, onDelete, members, canManage, currentUserId }) => {
  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'High': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
  };

  const statusOptions = ['To Do', 'In Progress', 'Review', 'Completed'];
  const assignedUser = members.find(m => m.uid === (task.assignedTo?.[0]));
  const isAssigned = task.assignedTo?.includes(currentUserId);
  const canUpdateStatus = canManage || isAssigned;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing bg-white">
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <Badge variant="outline" className={`${getPriorityColor(task.priority)} font-bold text-[9px] uppercase tracking-widest rounded-md border px-2 py-0.5`}>
              {task.priority}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "h-6 w-6 text-slate-300 transition-opacity hover:text-slate-600"
                )}
                render={<button />}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl border-none shadow-2xl p-2 font-medium">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-1.5">Change Status</div>
                {statusOptions.map(opt => (
                  <DropdownMenuItem 
                    key={opt} 
                    onClick={() => onStatusChange(task.id, opt)}
                    disabled={task.status === opt || !canUpdateStatus}
                    className="rounded-lg text-xs py-2 px-3 focus:bg-indigo-50 focus:text-indigo-600"
                  >
                    {opt}
                    {task.status === opt && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                  </DropdownMenuItem>
                ))}
                {canManage && (
                  <>
                    <DropdownMenuSeparator className="my-1 bg-slate-100" />
                    <DropdownMenuItem 
                      onClick={() => onDelete(task.id)}
                      className="rounded-lg text-xs py-2 px-3 text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                    >
                      Delete Task
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <h4 className="font-bold text-slate-900 leading-snug mb-2 text-sm tracking-tight">{task.title}</h4>
          <p className="text-slate-500 text-[11px] font-medium line-clamp-2 mb-5 leading-relaxed">
            {task.description}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{task.dueDate || 'Pending'}</span>
            </div>
            <Avatar className="w-7 h-7 border border-white shadow-sm ring-1 ring-slate-100" title={assignedUser?.displayName || 'Unassigned'}>
              <AvatarImage src={assignedUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignedTo?.[0] || 'unassigned'}`} />
              <AvatarFallback className="bg-slate-100 text-slate-400 text-[8px] font-bold">
                {assignedUser?.displayName?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
