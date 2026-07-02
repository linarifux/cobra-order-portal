import { Layers, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductSidebar({ 
  dynamicCategories, 
  activeCategory, 
  setActiveCategory, 
  expandedCategories, 
  handleCategoryClick 
}) {
  return (
    <aside className="w-full md:w-64 flex-shrink-0 flex flex-col bg-white/40 backdrop-blur-2xl backdrop-saturate-150 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden h-full">
      <div className="p-4 border-b border-white/50 bg-white/30">
        <button 
          onClick={() => setActiveCategory('All')}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${
            activeCategory === 'All' 
              ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20' 
              : 'text-gray-600 hover:bg-white/60 hover:text-gray-900 hover:shadow-sm'
          }`}
        >
          <Layers className="h-4 w-4" />
          All Products
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {dynamicCategories.map((cat) => (
          <div key={cat.division} className="mb-6">
            <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
              {cat.division}
            </h3>
            <div className="flex flex-col space-y-1">
              {cat.categories.map((cat1) => (
                <div key={cat1.path} className="flex flex-col">
                  
                  {/* LEVEL 1: Top Category */}
                  <button
                    onClick={() => handleCategoryClick(cat1.name, cat1.path, cat1.children.length > 0)}
                    className={`text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center justify-between group ${
                      activeCategory === cat1.name 
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50' 
                        : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <span className="truncate pr-2">{cat1.name}</span>
                    {cat1.children.length > 0 && (
                      <ChevronRight className={`h-3 w-3 shrink-0 transition-transform duration-300 ${expandedCategories[cat1.path] ? 'rotate-90 text-blue-500' : 'text-slate-400'}`} />
                    )}
                  </button>
                  
                  {/* LEVEL 2: Sub-categories */}
                  <AnimatePresence>
                    {expandedCategories[cat1.path] && cat1.children.length > 0 && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="pl-3 ml-3 mt-1 flex flex-col space-y-1 border-l border-slate-200/80 overflow-hidden"
                      >
                        {cat1.children.map(cat2 => (
                          <div key={cat2.path} className="flex flex-col">
                            <button
                              onClick={() => handleCategoryClick(cat2.name, cat2.path, cat2.children.length > 0)}
                              className={`text-left px-4 py-2 rounded-xl text-[11px] font-semibold transition-all duration-300 flex items-center justify-between group ${
                                activeCategory === cat2.name 
                                  ? 'bg-blue-50/80 text-blue-700 shadow-sm border border-blue-100/50' 
                                  : 'text-slate-500 hover:bg-white/60 hover:text-slate-900 border border-transparent'
                              }`}
                            >
                              <span className="truncate pr-2">{cat2.name}</span>
                              {cat2.children.length > 0 && (
                                <ChevronRight className={`h-3 w-3 shrink-0 transition-transform duration-300 ${expandedCategories[cat2.path] ? 'rotate-90 text-blue-500' : 'text-slate-300'}`} />
                              )}
                            </button>
                            
                            {/* LEVEL 3: Deep Sub-categories */}
                            <AnimatePresence>
                              {expandedCategories[cat2.path] && cat2.children.length > 0 && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }} 
                                  animate={{ height: 'auto', opacity: 1 }} 
                                  exit={{ height: 0, opacity: 0 }}
                                  className="pl-3 ml-3 mt-1 flex flex-col space-y-1 border-l border-slate-200/80 overflow-hidden"
                                >
                                  {cat2.children.map(cat3 => (
                                    <button
                                      key={cat3.path}
                                      onClick={() => handleCategoryClick(cat3.name, cat3.path, false)}
                                      className={`text-left px-4 py-1.5 rounded-xl text-[10px] font-semibold transition-all duration-300 flex items-center justify-between group ${
                                        activeCategory === cat3.name 
                                          ? 'bg-blue-50/80 text-blue-700 shadow-sm border border-blue-100/50' 
                                          : 'text-slate-400 hover:bg-white/60 hover:text-slate-800 border border-transparent'
                                      }`}
                                    >
                                      <span className="truncate pr-2">{cat3.name}</span>
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}