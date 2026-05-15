import React, { useEffect, useState } from 'react';
import { projectService, taskService, userService } from '../services/firebaseService';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar,
  Users,
  ChevronRight,
  TrendingUp,
  Layout as LayoutIcon,
  Activity,
  FolderKanban
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from 'motion/react';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
    if (!user) return;
    
    const unsubProjects = projectService.getMyProjects((data) => {
      setProjects(data);
    });

    const unsubTasks = taskService.getAllMyTasks((data) => {
      setTasks(data);
      setLoading(false);
    });

    return () => {
      if (unsubProjects) unsubProjects();
      if (unsubTasks) unsubTasks();
    };
  }, [user]);

  // Real stats calculation
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const openTasks = tasks.filter(t => t.status !== 'Completed').length;
  
  // Checking overdue tasks (simple date comparison)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'Completed') return false;
    const due = new Date(t.dueDate);
    return due < today;
  }).length;

  const stats = [
    { label: 'Active Projects', value: projects.length, icon: LayoutIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Completed Tasks', value: completedTasks, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Open tasks', value: openTasks, icon: Clock, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Overdue', value: overdueTasks, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  // Productivity Chart Data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      ts: d.setHours(0, 0, 0, 0),
      tasks: 0
    };
  }).reverse();

  tasks.forEach(task => {
    if (task.status === 'Completed' && task.updatedAt) {
      const taskDate = task.updatedAt.toDate ? task.updatedAt.toDate() : new Date(task.updatedAt);
      const taskDayTs = new Date(taskDate).setHours(0, 0, 0, 0);
      const dayIndex = last7Days.findIndex(d => d.ts === taskDayTs);
      if (dayIndex !== -1) {
        last7Days[dayIndex].tasks += 1;
      }
    }
  });

  const chartData = last7Days;

  // Status Distribution Data
  const statusCounts = tasks.reduce((acc: any, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = [
    { name: 'To Do', value: statusCounts['To Do'] || 0, color: '#94A3B8' },
    { name: 'In Progress', value: statusCounts['In Progress'] || 0, color: '#4F46E5' },
    { name: 'Review', value: statusCounts['Review'] || 0, color: '#F59E0B' },
    { name: 'Completed', value: statusCounts['Completed'] || 0, color: '#10B981' },
  ].filter(d => d.value > 0);

  // Default if no data
  const finalStatusData = statusData.length > 0 ? statusData : [{ name: 'No Tasks', value: 1, color: '#F1F5F9' }];

  const completionPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1 leading-tight">Project Dashboard</h1>
          <p className="text-slate-500 font-medium tracking-tight">Overview of all active operations and task statuses.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-600">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden group bg-white">
              <CardContent className="p-6 text-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-colors`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  {stat.label === 'Active Projects' && projects.length > 0 && (
                    <div className="flex items-center text-xs font-bold text-emerald-600">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Live
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 mb-1">{stat.label}</p>
                  <h3 className={`text-3xl font-extrabold tracking-tight ${stat.label === 'Overdue' && stat.value > 0 ? 'text-rose-600' : stat.label === 'Completed Tasks' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {stat.value}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <Card className="lg:col-span-2 border border-slate-200 shadow-sm rounded-2xl p-6 bg-white overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Task Productivity</CardTitle>
              <p className="text-slate-400 text-sm font-medium">Daily completed tasks this week</p>
            </div>
          </div>
          <div className="h-[300px] w-full" style={{ minHeight: 300 }}>
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #E2E8F0', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="tasks" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Task Status Breakdown */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl p-6 bg-white overflow-hidden">
          <CardTitle className="text-lg font-bold text-slate-900 mb-1">Task Distribution</CardTitle>
          <p className="text-slate-400 text-sm font-medium mb-8">Status breakdown of current goals</p>
          <div className="h-[220px] w-full relative" style={{ minHeight: 220 }}>
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <PieChart>
                  <Pie
                    data={finalStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {finalStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-3xl font-black text-slate-900">{completionPercentage}%</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-center">Done</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {finalStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-[11px] font-bold text-slate-700">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Projects List */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Projects</h2>
        <Button 
          variant="ghost" 
          onClick={() => navigate('/projects')}
          className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg gap-2"
        >
          View All Projects <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
        {projects.length > 0 ? projects.slice(0, 6).map((project) => (
          <ProjectCard key={project.id} project={project} tasks={tasks.filter(t => t.projectId === project.id)} />
        )) : (
          <div className="col-span-full py-20 bg-white border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
            <Activity className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold">No projects yet. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectCard: React.FC<{ project: any; tasks: any[] }> = ({ project, tasks }) => {
  const navigate = useNavigate();
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  useEffect(() => {
    if (project.members?.length) {
      userService.getUsersByUids(project.members.slice(0, 3)).then(data => {
        setProjectMembers(data || []);
      });
    }
  }, [project.members]);

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="group"
    >
      <Card className="border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center pointer-events-none">
              <FolderKanban className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex -space-x-2">
              {projectMembers.map((member) => (
                <Avatar key={member.uid} className="w-7 h-7 border-2 border-white shadow-sm">
                  <AvatarImage src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.uid}`} />
                  <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                </Avatar>
              ))}
              {project.members?.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
          </div>
          
          <h3 className="text-lg font-bold mb-1 text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>{project.name}</h3>
          <p className="text-slate-500 text-xs font-semibold line-clamp-2 mb-6 h-8 leading-relaxed">
            {project.description || 'No description provided.'}
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className="text-slate-400">Progress</span>
              <span className="text-indigo-600">{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-indigo-500 rounded-full"
              />
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-tight">
                {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/projects/${project.id}`)}
              className="font-bold text-[11px] h-8 px-3 rounded-lg hover:bg-indigo-50 text-slate-600 hover:text-indigo-600"
            >
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
