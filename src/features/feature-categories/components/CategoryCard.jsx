"use client";
import { Folder, Layers, Edit2 } from "lucide-react";
import CategoryDelete from "./CategoryDelete";
import { useCallback } from "react";
import useCurrentStateContext from "@/providers/CurrentStateContext";

export default function CategoryCard({ category }) {
  const {
    meta: { mutateKey },
    dispatch
  } = useCurrentStateContext()

  const onEdit = useCallback(() => dispatch({ type: "EDIT_CATEGORY", payload: category }), [])
  
  const isRoot = category.level === "category";
  return (
    <div className="group bg-slate-100/50 border border-zinc-200 rounded-2xl p-6 hover:border-[#70C041]/40 transition-all flex flex-col justify-between h-44 shadow-sm">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${isRoot ? 'bg-[#70C041]/10 text-[#70C041]' : 'bg-zinc-100 text-zinc-500'}`}>
          {isRoot ? <Folder size={20} /> : <Layers size={20} />}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 hover:bg-zinc-50 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors">
            <Edit2 size={16} />
          </button>
          <CategoryDelete categoryId={category._id} mutateKey={mutateKey} />
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <h3 className="text-xl font-bold text-zinc-800 truncate">{category.name}</h3>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md inline-block ${
          isRoot ? 'bg-[#70C041] text-white' : 'bg-zinc-100 text-zinc-400'}`}>
          {category.level}
        </span>
      </div>
    </div>
  );
}