"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateIngredient } from "@/lib/fetchers/app";
import { getIngredientRecipeErrorMessage } from "@/lib/utils/ingredientRecipeErrors";
import { useRef, useState } from "react";
import { toast } from "sonner";
import IngredientForm, { ingredientToForm } from "./IngredientForm";

export default function EditIngredientModal({ ingredient, onSuccess }) {
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef(null);

  function handleCancel() {
    closeBtnRef.current?.click();
    setOpen(false);
  }

  async function handleSubmit(payload) {
    if (!ingredient?._id) throw new Error("Ingredient not found.");
    const response = await updateIngredient(ingredient._id, payload);
    if (!response?.success) {
      const msg = getIngredientRecipeErrorMessage(response, "ingredient_update");
      throw new Error(msg);
    }
    toast.success(response.message ?? "Ingredient updated successfully");
    onSuccess?.();
    closeBtnRef.current?.click();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-[var(--accent-1)] text-[12px] font-[400] px-2">
        Edit
      </DialogTrigger>
      <DialogContent className="!max-w-[500px] max-h-[85vh] border-0 p-0 overflow-y-auto gap-0">
        <DialogHeader className="py-4 px-6 border-b">
          <DialogTitle className="text-lg font-semibold">Edit Ingredient</DialogTitle>
        </DialogHeader>
        <DialogClose ref={closeBtnRef} className="hidden" />
        <IngredientForm
          key={ingredient?._id}
          initialForm={ingredientToForm(ingredient)}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Update Ingredient"
        />
      </DialogContent>
    </Dialog>
  );
}
