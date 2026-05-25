import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { sendData } from "@/lib/api";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { revalidateRecipeListCaches } from "@/lib/swr/revalidateRecipeCaches";

export default function DeleteRecipeModal({ _id, trigger }) {
  const [loading, setLoading] = useState(false);
  const closeBtnRef = useRef(null);

  async function deleteClient() {
    try {
      setLoading(true);
      const response = await sendData(`app/deleteRecipes?id=${_id}`, {}, "DELETE");
      if (!response.success) throw new Error(response.message);
      toast.success(response.message);
      await revalidateRecipeListCaches();
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <AlertDialog>
    {trigger ? (
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
    ) : (
      <AlertDialogTrigger className="rounded-md px-2 py-1.5 text-[12px] font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30">
        Delete
      </AlertDialogTrigger>
    )}
    <AlertDialogContent className="max-w-md gap-0 overflow-hidden rounded-xl border border-border/70 p-0 text-center shadow-lg sm:max-w-md">
      <div className="border-b border-[var(--accent-1)]/15 bg-[var(--comp-1)]/60 px-6 py-5">
        <AlertDialogTitle className="text-xl font-semibold text-[var(--dark-1)]">
          Delete recipe?
        </AlertDialogTitle>
        <p className="mt-2 text-sm text-[var(--dark-1)]/60">
          This cannot be undone. The recipe will be removed from your library.
        </p>
      </div>
      <div className="flex flex-col-reverse gap-2 px-6 py-5 sm:flex-row sm:justify-center">
        <AlertDialogCancel
          ref={closeBtnRef}
          className="mt-0 border-[var(--accent-1)]/30 text-[var(--dark-1)] hover:bg-[var(--comp-1)]"
        >
          Cancel
        </AlertDialogCancel>
        <Button
          variant="destructive"
          onClick={deleteClient}
          disabled={loading}
          className="font-semibold"
        >
          {loading ? "Deleting…" : "Delete recipe"}
        </Button>
      </div>
    </AlertDialogContent>
  </AlertDialog>
}