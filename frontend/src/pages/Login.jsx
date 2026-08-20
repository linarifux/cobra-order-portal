import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, clearAuthError } from '../store/slices/authSlice';
import { setActiveDivision } from '../store/slices/divisionSlice';
import { Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';



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

  // Premium input class with responsive heights and padding (Updated to Brand Gold)
  const premiumInputClass = "block w-full h-12 sm:h-14 pl-10 sm:pl-12 pr-4 rounded-xl sm:rounded-2xl border border-white/60 bg-white/50 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/20 shadow-inner";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* Deep Glassmorphic Background Orbs (Branded Gold & Slate) */}
      <div className="absolute top-[-5%] left-[-10%] w-64 h-64 sm:w-[500px] sm:h-[500px] bg-amber-400/20 rounded-full mix-blend-multiply filter blur-[60px] sm:blur-[100px] animate-blob pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-64 h-64 sm:w-[500px] sm:h-[500px] bg-slate-400/20 rounded-full mix-blend-multiply filter blur-[60px] sm:blur-[100px] animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-10 sm:-bottom-32 left-[10%] sm:left-[20%] w-64 h-64 sm:w-[500px] sm:h-[500px] bg-yellow-500/10 rounded-full mix-blend-multiply filter blur-[60px] sm:blur-[100px] animate-blob animation-delay-4000 pointer-events-none"></div>

      {/* Premium Frosted Glass Card */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-3xl backdrop-saturate-150 p-6 sm:p-12 rounded-3xl sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white/80 relative z-10 animate-in fade-in zoom-in-95 duration-700">

        {/* Header with MI-KRO Logo */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="mx-auto flex justify-center mb-6">
            <img
              src="/mi-kro/mi-kro-logo.png"
              alt="MI-KRO Industries"
              className="h-14 sm:h-16 object-contain drop-shadow-sm"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Welcome to MI-KRO <p className='text-xl font-semibold'>Ordering Portal</p>
          </h2>
          <p className="mt-2 text-xs sm:text-sm font-bold text-slate-400 max-w-[250px] sm:max-w-none mx-auto tracking-widest">
            Sign in to access the fulfillment portal.
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
              <label className="block text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5 sm:mb-2 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-brand-gold transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={premiumInputClass}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2 ml-1">
                <label className="block text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Password
                </label>

              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-brand-gold transition-colors" />
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

          <div className="pt-1 sm:pt-4">
            <button
              type="submit"
              disabled={status === 'loading'}
              // Updated background, text, hover, and shadow classes to feature the brand-gold
              className="w-full flex items-center justify-center gap-2 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-brand-gold text-slate-900 uppercase tracking-widest font-black shadow-lg shadow-brand-gold/30 hover:shadow-brand-gold/40 hover:bg-yellow-500 focus:outline-none focus:ring-4 focus:ring-brand-gold/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-[0.98] text-xs sm:text-sm"
            >
              {status === 'loading' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <> Login to Portal <ArrowRight className="h-4 w-4" /></>
    )}
          </button>
      </div>
    </form>
        
      </div >
    </div >
  );
}