import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { sendData } from "@/lib/api";
import { Trash } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export default function DeleteClientModal({ _id }) {
  const [loading, setLoading] = useState(false);
  const closeBtnRef = useRef(null);

  async function deleteClient() {
    try {
      setLoading(true);
      const response = await sendData(`deleteClient?id=${_id}`, {}, "DELETE");
      throw new Error("this is error")
      if (!response.success) throw new Error(response.message);
      toast.success(response.message);
      mutate("getMeetings")
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }
  // return <></>
  return <AlertDialog>
    <AlertDialogTrigger className="font-semibold text-[var(--accent-2)] px-2 flex items-center gap-2">
      <Trash className="w-[16px]" />
      Delete Client
    </AlertDialogTrigger>
    <AlertDialogContent className="!max-w-[450px] text-center border-0 px-0 overflow-auto gap-0">
      <AlertDialogTitle className="text-[24px]">Are you sure?</AlertDialogTitle>
      <p className="text-[var(--dark-1)]/50 mb-4">You are deleting a client.</p>
      <div>
        <AlertDialogCancel ref={closeBtnRef} className="bg-[var(--accent-2)] text-white mr-2 py-[9px] px-4 rounded-[8px]">Cancel</AlertDialogCancel>
        <Button onClick={deleteClient} disabled={loading}>Confirm</Button>
      </div>
    </AlertDialogContent>
  </AlertDialog>
}