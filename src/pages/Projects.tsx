import React, { useEffect, useState } from 'react';
import { projectService } from '../services/firebaseService';
import { Card, CardContent } from '../components/ui/card';
import { Button, buttonVariants } from '../components/ui/button';
import { cn } from '../lib/utils';
import { 
  Plus, 
  FolderKanban, 
  Search, 
  Filter,
  Grid,
  List as ListIcon,
  Activity,
  CircleDot
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
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
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({ name: '', description: '', status: 'Active' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) return;
    const unsub = projectService.getMyProjects((data) => {
      setProjects(data);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, [user]);

  const handleCreateProject = async () => {
    if (!newProject.name) {
      toast.error('Project name is required');
      return;
    }
    try {
      await projectService.createProject(newProject.name, newProject.description, newProject.status);
      toast.success('Project created successfully');
      setNewProject({ name: '', description: '', status: 'Active' });
      setIsDialogOpen(false);
    } catch (err) {
      toast.error('Failed to create project');
    }
  };

  const isAdmin = profile?.role === 'Admin';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">Projects</h1>
          <p className="text-slate-500 font-medium mt-1">Manage and organize all your workspace projects.</p>
        </div>
        
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              className={cn(
                buttonVariants({ variant: "default" }),
                "rounded-lg px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-100 gap-2 h-11 transition-all active:scale-95"
              )}
              render={<button />}
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Create New Project</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 border-none overflow-hidden shadow-2xl">
              <div className="bg-white p-8">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-bold text-slate-900">New Project</DialogTitle>
                  <p className="text-slate-500 text-sm font-medium">Set up a new workspace for your team.</p>
                </DialogHeader>
                <div className="space-y-5 font-medium">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Project Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g., Q4 Marketing Campaign" 
                      value={newProject.name}
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      className="rounded-lg border-slate-200 bg-slate-50 h-11 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Description</Label>
                    <textarea 
                      id="description" 
                      rows={3}
                      placeholder="Briefly describe the project goals..."
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Project Status</Label>
                    <Select value={newProject.status} onValueChange={(val) => setNewProject({...newProject, status: val})}>
                      <SelectTrigger className="rounded-lg bg-slate-50 border-slate-200 h-11">
                        <SelectValue placeholder="Assessing" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-8 flex gap-3">
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-lg font-bold h-11 px-6 text-slate-500 hover:text-slate-700">Cancel</Button>
                  <Button onClick={handleCreateProject} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold h-11 px-8 shadow-sm shadow-indigo-100">Establish Project</Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100 pb-8">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-full md:w-96 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
          <Search className="w-4 h-4 text-slate-400" />
          <input placeholder="Filter projects by name..." className="bg-transparent border-none focus:outline-none text-sm w-full font-medium text-slate-600" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 shadow-sm rounded-lg">
            <Filter className="w-4 h-4" />
          </Button>
          <div className="h-4 w-px bg-slate-200 mx-2"></div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 bg-white shadow-sm rounded-md">
              <Grid className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-md">
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`} className="group">
            <Card className="border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-7">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <FolderKanban className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                  </div>
                  <Badge variant="outline" className={cn(
                    "font-bold text-[9px] uppercase tracking-widest rounded-md border px-2 py-0.5",
                    project.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                    project.status === 'On Hold' ? "bg-amber-50 text-amber-700 border-amber-100" :
                    "bg-slate-50 text-slate-700 border-slate-100"
                  )}>
                    {project.status || 'Active'}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{project.name}</h3>
                <p className="text-slate-500 font-medium text-xs line-clamp-2 leading-relaxed h-8 mb-6">
                  {project.description || 'Project infrastructure and milestone tracking.'}
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-md">
                    <CircleDot className="w-3 h-3 text-indigo-600" />
                    <span>{project.members?.length || 1} {project.members?.length === 1 ? 'Member' : 'Members'}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {project.createdAt?.seconds ? new Date(project.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
