import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LogOut, Building2, Check } from 'lucide-react';
import { logoutUser } from '../../store/slices/authSlice';
import { setActiveDivision } from '../../store/slices/divisionSlice';

export default function MobileMenu({ isOpen, onClose, navLinks }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector(state => state.auth || {});
  const { items: allDivisions = [] } = useSelector(state => state.divisions || {});
  const activeDivisionRaw = useSelector(state => state.divisions?.activeDivision);
  const activeDivId = typeof activeDivisionRaw === 'object' ? activeDivisionRaw?._id : activeDivisionRaw;

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
    if (divId !== activeDivId) {
      dispatch(setActiveDivision(div));
      navigate('/'); 
    }
    onClose();
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    onClose();
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden absolute top-16 sm:top-20 left-0 w-full bg-white/95 backdrop-blur-3xl border-b border-slate-200 p-4 shadow-2xl animate-in slide-in-from-top-2 z-[90]">
      <div className="space-y-2 mb-4">
        <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Navigation</p>
        {navLinks.map((link) => (
          <NavLink 
            key={link.name} 
            to={link.path} 
            onClick={onClose}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <link.icon className="h-4 w-4" /> {link.name}
          </NavLink>
        ))}
      </div>
      
      <div className="border-t border-slate-200 pt-4 space-y-2">
        <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace Context</p>
        <div className="max-h-48 overflow-y-auto space-y-1 mb-2 custom-scrollbar">
          {availableDivisions.map((div) => {
            const divId = div?._id || div;
            const divName = div?.divisionName || `Division ${String(divId).slice(-4)}`;
            const isCurrentlySelected = divId === activeDivId;

            return (
              <button
                key={divId}
                onClick={() => handleSwitchDivision(div)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-all ${
                  isCurrentlySelected 
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' 
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Building2 className={`h-4 w-4 shrink-0 ${isCurrentlySelected ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="text-sm truncate pr-3">{divName}</span>
                </div>
                {isCurrentlySelected && <Check size={16} className="text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
        
        <button 
          onClick={handleLogout} 
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors mt-2 border border-transparent hover:border-red-100"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}