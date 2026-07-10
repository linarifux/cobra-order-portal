import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, clearAuthError } from '../store/slices/authSlice';
import { setActiveDivision } from '../store/slices/divisionSlice'; 
import { Box, Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const portal = 'order';
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { status, error, isAuthenticated, user } = useSelector((state) => state.auth);

  // Dynamic Redirection based on user's division access level
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.divisions && user.divisions.length === 1) {
        // Automatically assign the context if they only have one workspace
        dispatch(setActiveDivision(user.divisions[0]));
        navigate('/'); 
      } else if (user.divisions && user.divisions.length > 1) {
        // Route multi-tenant users to the workspace selection matrix
        navigate('/divisions'); 
      } else {
        // Fallback safety route
        navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate, dispatch]);

  // Clear errors when user starts typing again
  useEffect(() => {
    if (error) dispatch(clearAuthError());
  }, [email, password, portal, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !portal) return;
    
    dispatch(loginUser({ email, password, portal }));
  };

  // Premium input class with responsive heights and padding
  const premiumInputClass = "block w-full h-12 sm:h-14 pl-10 sm:pl-12 pr-4 rounded-xl sm:rounded-2xl border border-white/60 bg-white/50 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 shadow-inner";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Deep Glassmorphic Background Orbs (Responsive) */}
      <div className="absolute top-[-5%] left-[-10%] w-64 h-64 sm:w-[500px] sm:h-[500px] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-[60px] sm:blur-[100px] animate-blob pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-64 h-64 sm:w-[500px] sm:h-[500px] bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-[60px] sm:blur-[100px] animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-10 sm:-bottom-32 left-[10%] sm:left-[20%] w-64 h-64 sm:w-[500px] sm:h-[500px] bg-emerald-400/10 rounded-full mix-blend-multiply filter blur-[60px] sm:blur-[100px] animate-blob animation-delay-4000 pointer-events-none"></div>

      {/* Premium Frosted Glass Card */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-3xl backdrop-saturate-150 p-6 sm:p-12 rounded-3xl sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/80 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 mb-5 sm:mb-6 border border-white/20">
            <Box className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-xs sm:text-sm font-medium text-gray-500 max-w-[250px] sm:max-w-none mx-auto">
            Sign in to access the DSM Fulfillment Portal
          </p>
        </div>

        {/* Glassmorphic Error Alert */}
        {error && (
          <div className="rounded-xl sm:rounded-2xl bg-red-50/80 backdrop-blur-md p-3 sm:p-4 border border-red-200/50 shadow-sm mb-6 sm:mb-8 animate-in slide-in-from-top-2">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-xs sm:text-sm font-bold text-red-800">Authentication Failed</h3>
                <div className="mt-1 text-xs sm:text-sm font-medium text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 sm:space-y-5">
            
            {/* Email Field */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 sm:mb-2 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={premiumInputClass}
                  placeholder="admin@dsm-firmenich.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2 ml-1">
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gray-500">
                  Password
                </label>
                <a href="#" className="text-[11px] sm:text-xs font-bold text-blue-600 hover:text-indigo-600 transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={premiumInputClass}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-1 sm:pt-2">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-2 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-[0.98] text-sm sm:text-base"
            >
              {status === 'loading' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>Sign in to Portal <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
}