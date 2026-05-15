import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  Plus,
  Users
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { motion, AnimatePresence } from 'motion/react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
    ...(profile?.role === 'Admin' ? [{ icon: Users, label: 'Users', path: '/users' }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="w-64 bg-white border-r border-slate-200 flex flex-col z-50 shadow-sm"
          >
            <div className="h-20 flex items-center px-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                  <FolderKanban className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900">TaskFlow</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <item.icon className="w-5 h-5 opacity-90" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-3">Project Workspace</p>
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9 border border-white shadow-sm ring-2 ring-indigo-50">
                    <AvatarImage src={profile?.photoURL} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                      {profile?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{profile?.displayName}</p>
                    <p className="text-[11px] text-indigo-600 font-semibold tracking-wide">
                      {profile?.role === 'Admin' ? 'Administrator' : 'Team Member'}
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={handleLogout} 
                className="mt-2 w-full justify-start text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-40 shadow-sm relative">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="text-slate-500 hover:text-indigo-600">
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg w-72 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                placeholder="Search resources..." 
                className="bg-transparent border-none focus:outline-none text-[13px] w-full font-medium text-slate-600 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white"></span>
            </Button>
            <div className="w-px h-6 bg-slate-100 mx-1"></div>
            <Button 
              onClick={() => navigate('/projects')}
              className="rounded-lg px-5 h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-100 gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-semibold tracking-tight">New Project</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-8 h-full max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
