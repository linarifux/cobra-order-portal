import { Box, Search } from 'lucide-react';

export default function ProductHeader({ activeCategory, productCount, searchQuery, setSearchQuery }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 lg:px-8 lg:py-6 border-b border-white/50 bg-white/30 z-10">
      <div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-100 to-indigo-100 border border-white shadow-inner shrink-0">
            <Box className="h-5 w-5 text-blue-600" />
          </div>
          <span className="truncate">{activeCategory === 'All' ? 'Complete Catalog' : activeCategory}</span>
        </h1>
        <p className="text-xs font-bold text-slate-500 mt-1.5 ml-[52px] uppercase tracking-widest">
          {productCount} Items Indexed
        </p>
      </div>

      <div className="relative w-full sm:w-80 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text"
          placeholder="Search by SKU or item name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-2xl border border-white/60 bg-white/50 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
        />
      </div>
    </div>
  );
}