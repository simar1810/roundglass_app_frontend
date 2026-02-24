"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createIngredient } from "@/lib/fetchers/app";
import { getIngredientRecipeErrorMessage } from "@/lib/utils/ingredientRecipeErrors";
import { useRef, useState } from "react";
import { toast } from "sonner";
import IngredientForm, { getInitialForm } from "./IngredientForm";

export default function AddIngredientModal({ onSuccess }) {
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef(null);

  function handleCancel() {
    closeBtnRef.current?.click();
    setOpen(false);
  }

  async function handleSubmit(payload) {
    const response = await createIngredient(payload);
    if (!response?.success) {
      const msg = getIngredientRecipeErrorMessage(response, "ingredient_create");
      throw new Error(msg);
    }
    toast.success(response.message ?? "Ingredient added successfully");
    onSuccess?.();
    closeBtnRef.current?.click();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-[var(--accent-1)] text-[var(--primary-1)] text-xs md:text-[14px] font-[600] px-4 py-2 rounded-[8px]">
        Add Ingredient
      </DialogTrigger>
      <DialogContent className="!max-w-[500px] max-h-[85vh] border-0 p-0 overflow-y-auto gap-0">
        <DialogHeader className="py-4 px-6 border-b">
          <DialogTitle className="text-lg font-semibold">Add Ingredient</DialogTitle>
        </DialogHeader>
        <DialogClose ref={closeBtnRef} className="hidden" />
        <IngredientForm
          key="add"
          initialForm={getInitialForm()}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Save Ingredient"
        />
      </DialogContent>
    </Dialog>
  );
}
