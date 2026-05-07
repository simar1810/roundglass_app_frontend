"use client";

import useCurrentStateContext from "@/providers/CurrentStateContext";
import { Plus, FolderPlus, ChefHat, CalendarClock, Dumbbell } from "lucide-react";

const EMPTY_ICONS = {
  "chef-hat": ChefHat,
  "calendar-clock": CalendarClock,
  dumbbell: Dumbbell,
  folder: FolderPlus,
};

export default function CategoryEmptyState() {
  const {
    state: { isAdding },
    categories,
    dispatch,
    meta,
  } = useCurrentStateContext();

  if (categories.length > 0 || isAdding) return <></>;

  const Icon =
    EMPTY_ICONS[meta.emptyIcon] ?? FolderPlus;
  const heading = meta.emptyHeading ?? "No categories yet";
  const description =
    meta.emptyDescription ??
    "Create your first category to organize this library.";
  const ctaLabel = meta.emptyCtaLabel ?? "Add your first category";

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-slate-50 border-2 border-dashed border-zinc-200 rounded-[10px] p-12 transition-all hover:border-[#70C041]/50 group">
      <div className="w-20 h-20 bg-[#70C041]/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon size={40} className="text-[#70C041]" strokeWidth={1.5} />
      </div>

      <div className="text-center max-w-md mb-8 px-2">
        <h3 className="text-xl font-bold text-zinc-900 mb-2">{heading}</h3>
        <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
      </div>

      <button
        onClick={() => dispatch({ type: "OPEN_FORM" })}
        className="bg-[#70C041] hover:bg-[#62aa38] text-white px-8 py-3 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-md active:scale-95"
      >
        <Plus size={20} strokeWidth={3} />
        {ctaLabel}
      </button>
    </div>
  );
}