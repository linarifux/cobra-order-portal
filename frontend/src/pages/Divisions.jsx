import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDivisions, setActiveDivision } from '../store/slices/divisionSlice';
import { Layers, ArrowRight, ShieldAlert, Building2, CheckCircle2, Loader2 } from 'lucide-react';

export default function Divisions() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Extract user context from auth slice and division options from the new slice
  const { user } = useSelector((state) => state.auth);
  const { items: apiDivisions, status, error } = useSelector((state) => state.divisions);
  const activeDivision = useSelector((state) => state.divisions.activeDivision);

  // Fallback map check: use user object allocations if global route index isn't populated yet
  const divisionList = apiDivisions.length > 0 ? apiDivisions : (user?.divisions || []);

  useEffect(() => {
    // Fetch divisions from API on mount to guarantee fresh layout parameters
    dispatch(fetchDivisions());
  }, [dispatch]);

  const handleSelectDivision = (division) => {
    // Update global Redux slice data + storage backups simultaneously
    dispatch(setActiveDivision(division));
    
    // Redirect cleanly to dashboard workspace environment
    navigate('/');
  };

  // Render Loader during database profile mapping requests
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center gap-4 text-blue-600 animate-in fade-in text-center">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="font-bold tracking-tight text-gray-600">Mounting Workspace Environments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Deep Glassmorphic Background Orbs (Responsive) */}
      <div className="absolute top-[-5%] left-[-5%] w-64 h-64 sm:w-[500px] sm:h-[500px] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-[60px] sm:blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-64 h-64 sm:w-[500px] sm:h-[500px] bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-[60px] sm:blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-2xl space-y-6 sm:space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Top Branding Section */}
        <div className="text-center max-w-md mx-auto px-2 sm:px-0">
          <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 mb-5 sm:mb-6 border border-white/20">
            <Layers className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Select Workspace Division
          </h2>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-gray-500 leading-relaxed">
            Please choose an assigned operational sector to load authorized product streams and routing contexts.
          </p>
        </div>

        {/* Divisions Iteration Grid */}
        {divisionList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {divisionList.map((division, idx) => {
              const currentId = division._id || division;
              const currentName = division.divisionName || `Division Channel ${idx + 1}`;
              const isCurrentlyActive = activeDivision?._id === currentId;

              return (
                <div
                  key={currentId}
                  onClick={() => handleSelectDivision(division)}
                  className={`relative flex flex-col justify-between p-5 sm:p-6 rounded-3xl sm:rounded-[2rem] border transition-all duration-300 cursor-pointer group bg-white/70 backdrop-blur-3xl backdrop-saturate-150 ${
                    isCurrentlyActive
                      ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-[0_12px_40px_rgba(37,99,235,0.08)]'
                      : 'border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:border-blue-400 hover:bg-white/90 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]'
                  }`}
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-5 sm:mb-6">
                      <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl border transition-colors shadow-inner shrink-0 ${
                        isCurrentlyActive 
                          ? 'bg-blue-50 border-blue-200 text-blue-600' 
                          : 'bg-gray-50 border-gray-100 text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50/50 group-hover:border-blue-100'
                      }`}>
                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      
                      {isCurrentlyActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-md bg-emerald-50 text-emerald-700 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-emerald-200/50 shadow-sm shrink-0">
                          <CheckCircle2 className="h-3 w-3" /> <span className="hidden xs:inline">Active</span> Workspace
                        </span>
                      ) : (
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity flex h-6 w-6 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 shrink-0">
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>

                    {/* Title Profile */}
                    <h3 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight transition-colors group-hover:text-blue-600 pr-2">
                      {currentName}
                    </h3>
                    <p className="mt-1 sm:mt-1.5 font-mono text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-tight truncate">
                      ID: {currentId}
                    </p>
                  </div>

                  <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-gray-100/60 flex items-center justify-between text-[11px] sm:text-xs font-semibold text-gray-400 group-hover:text-gray-500">
                    <span>Authorized Portal</span>
                    <span className="uppercase tracking-wider font-bold text-gray-600 truncate ml-2">{user?.portal || 'Order'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Error or Action Needed Fallback Banner */
          <div className="rounded-[2rem] sm:rounded-[2.5rem] bg-white/60 backdrop-blur-3xl p-6 sm:p-10 border border-white/80 text-center shadow-lg shadow-black/5">
            <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-red-50 text-red-500 border border-red-100 shadow-inner mb-3 sm:mb-4">
              <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">No Divisions Allocated</h3>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mt-2 max-w-sm mx-auto">
              Your profile currently layout references no operational divisions. Please check your admin configuration controls.
            </p>
          </div>
        )}
        
      </div>
    </div>
  );
}