import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { UserCircle, ChevronDown, Check, LogOut } from 'lucide-react';
import { logoutUser } from '../../store/slices/authSlice';
import { setActiveDivision } from '../../store/slices/divisionSlice';

export default function ProfileMenu({ isOpen, onToggle, onClose }) {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector(state => state.auth || {});
  const { items: allDivisions = [] } = useSelector(state => state.divisions || {});
  const activeDivisionRaw = useSelector(state => state.divisions?.activeDivision);
  const activeDivId = typeof activeDivisionRaw === 'object' ? activeDivisionRaw?._id : activeDivisionRaw;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const availableDivisions = React.useMemo(() => {
    if (!user?.divisions) return [];
    return user.divisions.map(userDiv => {
      const id = userDiv?._id || userDiv;
      const fullDetails = allDivisions.find(d => d._id === id);
      return fullDetails || { _id: id, divisionName: `Division ${String(id).slice(-4)}` };
    });
  }, [user, allDivisions]);

  const handleSwitchDivision = (div) => {
    const divId = div?._id || div;
    if (divId === activeDivId) return; 
    
    dispatch(setActiveDivision(div));
    navigate('/'); 
    onClose();
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    onClose();
    navigate('/login');
  };

  return (
    <div className="relative hidden sm:block" ref={dropdownRef}>
      <button 
        onClick={onToggle}
        className={`flex items-center gap-3 rounded-2xl py-1.5 pl-1.5 pr-4 border transition-all duration-300 ${isOpen ? 'bg-white/80 border-slate-300 shadow-md' : 'bg-white/40 border-slate-200 text-slate-700 shadow-sm hover:bg-white/80 hover:shadow-md'}`}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 border border-white shadow-inner">
          <UserCircle className="h-5 w-5 text-gray-500" />
        </div>
        <div className="flex flex-col items-start min-w-0 text-left">
          <span className="max-w-[120px] truncate text-xs font-black tracking-tight leading-none mb-0.5">
            {user?.name || user?.firstName || 'Portal User'}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            Context <ChevronDown size={10} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-72 origin-top-right rounded-[2rem] border border-white/80 bg-white/80 backdrop-blur-3xl backdrop-saturate-150 shadow-[0_20px_60px_rgba(0,0,0,0.1)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 slide-in-from-top-4 z-50 overflow-hidden flex flex-col">
          
          <div className="px-6 py-5 border-b border-slate-200/60 bg-white/40">
            <p className="text-sm font-black text-slate-900 truncate">
              {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Authorized User'}
            </p>
            <p className="text-[10px] font-bold text-slate-500 truncate mt-1 uppercase tracking-widest">{user?.email || 'user@example.com'}</p>
          </div>

          {availableDivisions.length > 0 && (
            <div className="p-3 border-b border-slate-100/80 bg-slate-50/50">
              <p className="px-3 pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Division Context</p>
              <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                {availableDivisions.map((div) => {
                  const divId = div?._id || div;
                  const divName = div?.divisionName || `Division ${String(divId).slice(-4)}`;
                  const isCurrentlySelected = divId === activeDivId;

                  return (
                    <button
                      key={divId}
                      onClick={() => handleSwitchDivision(div)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                        isCurrentlySelected 
                          ? 'bg-slate-900 text-white shadow-md cursor-default' 
                          : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm'
                      }`}
                    >
                      <span className="text-xs font-bold truncate pr-3">{divName}</span>
                      {isCurrentlySelected && <Check size={14} className="text-brand-gold shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-3 bg-white/40">
            <button 
              onClick={handleLogout} 
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}