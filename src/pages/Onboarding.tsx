import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/firebaseService';
import { Navigate } from 'react-router-dom';
import { serverTimestamp } from 'firebase/firestore';
import { 
  Building2, 
  Briefcase, 
  ArrowRight,
  Sparkles,
  ClipboardCheck
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export const Onboarding: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    jobTitle: '',
    department: ''
  });

  if (!user) return <Navigate to="/login" />;
  if (profile?.jobTitle) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jobTitle || !formData.department) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await userService.updateUserProfile(user.uid, {
        ...formData,
        updatedAt: serverTimestamp()
      });
      toast.success('Registration complete! Awaiting approval.');
    } catch (err) {
      toast.error('Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-amber-100/50 rounded-full blur-3xl -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Complete Registration</h1>
          <p className="text-slate-500 font-medium mt-2">Personalize your workspace profile.</p>
        </div>

        <Card className="border-none shadow-2xl shadow-black/5 rounded-[40px] overflow-hidden bg-white">
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Professional Title</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="e.g., Senior Designer" 
                      className="h-14 pl-10 rounded-2xl bg-slate-50 border-slate-100 focus:ring-black focus:border-black font-medium"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Department</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="e.g., Marketing" 
                      className="h-14 pl-10 rounded-2xl bg-slate-50 border-slate-100 focus:ring-black focus:border-black font-medium"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-6 rounded-[28px] border border-indigo-100/50 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">Workspace Access</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Once you submit, the workspace owner will review your request. 
                      You'll receive full access automatically upon approval.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-2xl bg-black hover:bg-zinc-800 text-white font-bold text-lg transition-all shadow-xl shadow-black/10 group"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>Submit Registration</span>
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={logout}
                  className="text-slate-400 hover:text-slate-600 font-bold h-12"
                >
                  Cancel and Sign out
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
