import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { sendData } from "@/lib/api";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export default function CategoryDelete({ categoryId, mutateKey }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(setLoading, btnRef) {
    setIsDeleting(true);
    setLoading(true);
    try {
      const response = await sendData(mutateKey, { categoryId }, "DELETE");
      if (response.status_code !== 200) throw new Error(response.message);

      toast.success("Category removed");
      mutate(mutateKey);
      btnRef.current.click()
    } catch (err) {
      toast.error(err.message);
    }
    setIsDeleting(false);
    setLoading();
  }

  return <DualOptionActionModal
    description="You are deleting this category. This action is permanent and cannot be undone."
    action={(setLoading, btnRef) => handleDelete(setLoading, btnRef)}
  >
    <AlertDialogTrigger asChild>
      <button
        disabled={isDeleting}
        className="p-2 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
      >
        {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
      </button>
    </AlertDialogTrigger>
  </DualOptionActionModal>
}