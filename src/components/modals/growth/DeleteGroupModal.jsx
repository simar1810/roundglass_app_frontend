"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteGroup } from "@/lib/fetchers/growth";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function DeleteGroupModal({ group, onSuccess, children }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const closeBtnRef = useRef(null);

  const handleDelete = async () => {
    if (!group?._id) return;
    try {
      setLoading(true);
      const res = await deleteGroup(group._id);
      if (res?.status_code !== 200) throw new Error(res?.message || "Failed to delete group");
      toast.success(res?.message || "Group deleted");
      closeBtnRef.current?.click?.();
      setOpen(false);
      onSuccess?.(res?.data);
    } catch (err) {
      toast.error(err?.message || "Failed to delete group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="destructive" size="sm">
            Delete group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="!max-w-[520px] border-0">
        <DialogHeader>
          <DialogTitle>Delete group?</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          This will permanently delete <span className="font-semibold text-foreground">{group?.name || "this group"}</span>.
          Group membership will be removed and growth reports for this group will no longer be available.
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <DialogClose ref={closeBtnRef} asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

