import React from 'react';
import { Folder, ChevronRight } from 'lucide-react';

export default function CategoryBadge({
  category,
  subcategory,
  className = ""
}) {
  if (!category) return null;

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Folder size={14} className="text-blue-600 fill-blue-600/10" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {category}
        </span>
      </div>

      {subcategory && (
        <>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-500">
            {subcategory}
          </span>
        </>
      )}
    </div>
  );
}