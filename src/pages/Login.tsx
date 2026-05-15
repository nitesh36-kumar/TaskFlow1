import React from 'react';
import { FolderKanban, ArrowRight, UserCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const { login, user, profile, logout } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/popup-blocked') {
        toast.error('Login popup was blocked. Please allow popups for this site.', {
          duration: 5000,
        });
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignore this as it's just the user closing the popup
      } else if (err.code === 'auth/network-request-failed') {
        toast.error('Network error. Please check your connection.', {
          duration: 5000,
        });
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (user && profile?.jobTitle && (profile?.status === 'Approved' || profile?.role === 'Admin' || user.email === 'nitesh.kumar@ethara.ai')) return <Navigate to="/" />;
  if (user && !profile?.jobTitle) return <Navigate to="/onboarding" />;

  const isPending = user && profile?.status === 'Pending' && profile?.role !== 'Admin' && user.email !== 'nitesh.kumar@ethara.ai';

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-black/5 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[30%] h-[30%] rounded-full bg-black/5 blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">TaskFlow</h1>
          <p className="text-slate-400 font-bold tracking-widest text-[10px] uppercase mt-2">Bento productivity system</p>
        </div>

        <Card className="border-none shadow-2xl shadow-black/5 rounded-[40px] overflow-hidden">
          {isPending ? (
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <div className="animate-pulse">
                  <UserCircle className="w-10 h-10" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold mb-4 uppercase">Verification Required</CardTitle>
              <CardDescription className="text-slate-500 font-medium mb-8 leading-relaxed">
                Welcome, <span className="text-black font-bold">{user.displayName}</span>. 
                Your workspace registration is <span className="text-amber-600 font-bold">Pending Review</span>. 
                The platform administrator will review your title and credentials shortly.
              </CardDescription>
              <div className="flex flex-col gap-3">
                <div className="py-3 px-4 bg-slate-50 rounded-xl text-xs font-bold text-slate-400 uppercase tracking-widest border border-slate-100">
                  Status: Awaiting Approval
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => logout()}
                  className="text-slate-400 hover:text-slate-600 font-bold h-12"
                >
                  Sign out and check back later
                </Button>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="p-10 pb-4 text-center">
                <CardTitle className="text-3xl font-bold tracking-tight">Access Portal</CardTitle>
                <CardDescription className="text-base text-gray-500 font-medium">
                  Select your role to continue into the workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-6 space-y-4">
                <Button 
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full h-16 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group shadow-xl shadow-black/10"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <span>Google Auth Login</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Workspace Roles</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Owner</p>
                    <p className="text-xs text-slate-400 font-medium">Admin controls & setup</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Member</p>
                    <p className="text-xs text-slate-400 font-medium">Team collaboration</p>
                  </div>
                </div>

                <p className="mt-8 text-center text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-widest">
                  Secure OAuth 2.0 Environment
                </p>
              </CardContent>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
};
