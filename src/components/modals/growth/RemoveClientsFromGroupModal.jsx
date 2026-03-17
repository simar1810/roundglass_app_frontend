"use client";

import SelectMultiple from "@/components/SelectMultiple";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { removeClientsFromGroup } from "@/lib/fetchers/growth";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RemoveClientsFromGroupModal({
  group,
  onSuccess,
  children,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const closeBtnRef = useRef(null);
  const [selectedClientIds, setSelectedClientIds] = useState([]);

  const clientOptions = useMemo(() => {
    const clients = Array.isArray(group?.clients) ? group.clients : [];
    return clients
      .map((c) => ({
        id: c?._id,
        value: c?._id,
        label: `${c?.name || "Unnamed"}${c?.clientId ? ` (${c.clientId})` : ""}`,
      }))
      .filter((c) => Boolean(c.value));
  }, [group]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!group?._id) return;
    if (selectedClientIds.length === 0) {
      toast.error("Select at least one client to remove");
      return;
    }
    try {
      setLoading(true);
      const res = await removeClientsFromGroup(group._id, selectedClientIds);
      if (res?.status_code !== 200) throw new Error(res?.message || "Failed to remove clients");
      toast.success(res?.message || "Clients removed from group");
      setSelectedClientIds([]);
      closeBtnRef.current?.click?.();
      setOpen(false);
      onSuccess?.(res?.data);
    } catch (err) {
      toast.error(err?.message || "Failed to remove clients");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) setSelectedClientIds([]);
  };

  const total = Array.isArray(group?.clients) ? group.clients.length : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            Remove clients
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="!max-w-[720px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-[18px]">Remove players</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {group?.name || "Group"} · {total} player{total !== 1 ? "s" : ""}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
          <ScrollArea className="px-6 py-4 flex-1">

          {clientOptions.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No clients in this group.
            </div>
          ) : (
            <SelectMultiple
              label="Search and select players to remove"
              options={clientOptions}
              value={selectedClientIds}
              onChange={setSelectedClientIds}
              searchable
              selectAll
            />
          )}
          {selectedClientIds.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {selectedClientIds.length} player{selectedClientIds.length !== 1 ? "s" : ""} selected
            </p>
          )}
          </ScrollArea>

          <div className="px-6 py-4 border-t bg-background flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Tip: use “Select All” to remove everyone currently shown.
            </div>
            <div className="flex gap-3 justify-end">
              <DialogClose ref={closeBtnRef} asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                type="submit"
                disabled={loading || clientOptions.length === 0 || selectedClientIds.length === 0}
              >
                {loading ? "Removing..." : `Remove (${selectedClientIds.length})`}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

