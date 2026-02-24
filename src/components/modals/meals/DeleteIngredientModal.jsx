"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteIngredient } from "@/lib/fetchers/app";
import { getIngredientRecipeErrorMessage } from "@/lib/utils/ingredientRecipeErrors";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export default function DeleteIngredientModal({ id, mutateKey, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const closeBtnRef = useRef(null);

  async function handleDelete() {
    if (!id) return;
    try {
      setLoading(true);
      const response = await deleteIngredient(id);
      if (!response?.success) {
        const msg = getIngredientRecipeErrorMessage(response, "ingredient_delete");
        toast.error(msg);
        return;
      }
      toast.success(response.message ?? "Ingredient deleted successfully");
      if (Array.isArray(mutateKey)) {
        mutate(mutateKey);
      } else if (mutateKey) {
        mutate(mutateKey);
      }
      onSuccess?.();
      closeBtnRef.current?.click();
    } catch (error) {
      toast.error(error?.message ?? "Failed to delete ingredient");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger className="font-semibold text-[var(--accent-2)] p-0 text-[12px]">
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent className="!max-w-[450px] text-center border-0 px-0 overflow-auto gap-0">
        <AlertDialogTitle className="text-[24px]">Are you sure?</AlertDialogTitle>
        <p className="text-[var(--dark-1)]/50 mb-4">You are deleting this ingredient.</p>
        <div>
          <AlertDialogCancel
            ref={closeBtnRef}
            className="bg-[var(--accent-2)] text-white mr-2 py-[9px] px-4 rounded-[8px]"
          >
            Cancel
          </AlertDialogCancel>
          <Button onClick={handleDelete} disabled={loading}>
            Confirm
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
