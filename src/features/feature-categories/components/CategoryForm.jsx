"use client";
import { useCallback, useEffect, useState } from "react";
import { sendData } from "@/lib/api";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { initialActiveCategory } from "../config";

export default function CategoryForm() {
  const {
    state: { isAdding },
    activeCategory
  } = useCurrentStateContext();

  if (isAdding || activeCategory) return <CategoryFormContainer />
}

function CategoryFormContainer({ initialData }) {
  const {
    dispatch,
    meta: { mutateKey },
    activeCategory,
    mutate
  } = useCurrentStateContext();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialActiveCategory);

  const onClose = useCallback(() => dispatch({ type: "CLOSE_FORM" }), [])

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const method = activeCategory ? "PUT" : "POST";
      const response = await sendData(mutateKey, formData, method);
      if (![200, 201].includes(response.status_code)) throw new Error(response.message);

      mutate();
      toast.success(activeCategory ? "Category updated" : "Category created");
      onClose()
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    if (activeCategory) setFormData(activeCategory)
  }, [activeCategory])

  return (
    <div className="bg-slate-100/70 border border-zinc-200 p-4 mb-4 rounded-[10px] shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-zinc-800">{activeCategory ? "Update Category" : "New Category"}</h2>
        <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          required
          className="bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#70C041]"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <select
          className="bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
          value={formData.level}
          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
        >
          <option value="category">Main Category</option>
          <option value="sub-category">Sub Category</option>
        </select>
        <button
          disabled={loading}
          onClick={handleSubmit}
          className="bg-[#70C041] text-white rounded-xl font-bold text-sm hover:bg-[#62aa38] transition-colors flex items-center justify-center h-[42px]"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Save Category"}
        </button>
      </div>
    </div>
  );
}