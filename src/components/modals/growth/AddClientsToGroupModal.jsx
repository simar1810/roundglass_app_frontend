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
import SelectControl from "@/components/Select";
import { addClientsToGroup, getAllGroups } from "@/lib/fetchers/growth";
import { getAppClients } from "@/lib/fetchers/app";
import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AddClientsToGroupModal({ groupId: preSelectedGroupId, onSuccess, children }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const closeBtnRef = useRef(null);

  // Form state
  const [selectedGroupId, setSelectedGroupId] = useState(preSelectedGroupId || "");
  const [selectedClientIds, setSelectedClientIds] = useState([]);

  // Fetch groups (if not pre-selected)
  const { isLoading: groupsLoading, error: groupsError, data: groupsData } = useSWR(
    !preSelectedGroupId && open ? "api/growth/groups" : null,
    () => getAllGroups()
  );

  // Fetch clients for selection
  const { isLoading: clientsLoading, error: clientsError, data: clientsData } = useSWR(
    open ? "app/getAppClients" : null,
    () => getAppClients({ page: 1, limit: 1000 })
  );

  // Prepare group options
  const groupOptions = useMemo(() => {
    if (!groupsData?.data) return [];
    const groups = Array.isArray(groupsData.data) ? groupsData.data : [];
    return groups.map((group) => ({
      id: group._id,
      name: group.name,
      value: group._id,
    }));
  }, [groupsData]);

  // Prepare client options for SelectMultiple
  const clientOptions = useMemo(() => {
    if (!clientsData?.data) return [];
    return clientsData.data.map((client) => ({
      id: client._id,
      name: client.name,
      value: client._id,
    }));
  }, [clientsData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const targetGroupId = preSelectedGroupId || selectedGroupId;
    if (!targetGroupId) {
      toast.error("Please select a group");
      return;
    }

    if (selectedClientIds.length === 0) {
      toast.error("Please select at least one client");
      return;
    }

    try {
      setLoading(true);

      const response = await addClientsToGroup(targetGroupId, selectedClientIds);

      if (response.status_code !== 200) {
        const { getGrowthErrorMessage } = await import("@/lib/utils/growthErrors");
        const errorMessage = getGrowthErrorMessage(
          response.status_code,
          response.message || "Failed to add clients to group",
          response
        );
        throw new Error(errorMessage);
      }

      toast.success(response.message || "Clients added to group successfully");

      // Reset form
      setSelectedClientIds([]);
      if (!preSelectedGroupId) {
        setSelectedGroupId("");
      }

      // Close modal
      closeBtnRef.current?.click();
      setOpen(false);

      // Refresh groups cache
      mutate("api/growth/groups");

      // Call success callback
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      toast.error(error.message || "Failed to add clients to group");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset form when closing
      setSelectedClientIds([]);
      if (!preSelectedGroupId) {
        setSelectedGroupId("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            Add Clients to Group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="!max-w-[720px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-[18px]">Add players to group</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Pick a group and select the players you want to include.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
          <ScrollArea className="px-6 py-4 flex-1">
          {/* Group Selection - only show if not pre-selected */}
          {!preSelectedGroupId && (
            <div className="mb-5">
              {groupsLoading ? (
                <ContentLoader />
              ) : groupsError || groupsData?.status_code !== 200 ? (
                <ContentError
                  className="min-h-auto mb-4"
                  title={groupsError || groupsData?.message || "Failed to load groups"}
                />
              ) : (
                <SelectControl
                  label="Group"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  options={groupOptions}
                  className="text-[14px] block [&_.label]:font-[600]"
                  required
                />
              )}
            </div>
          )}

          {/* Client Selection */}
          <div className="mb-2">
            <label className="label font-[600] text-[14px] block mb-2">Players</label>
            {clientsLoading ? (
              <ContentLoader />
            ) : clientsError || clientsData?.status_code !== 200 ? (
              <ContentError
                className="min-h-auto"
                title={clientsError || clientsData?.message || "Failed to load clients"}
              />
            ) : (
              <SelectMultiple
                label="Search and select players"
                options={clientOptions}
                value={selectedClientIds}
                onChange={setSelectedClientIds}
                className="[&_.option]:px-4 [&_.option]:py-2"
                searchable
                selectAll
              />
            )}
            {selectedClientIds.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedClientIds.length} player{selectedClientIds.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>
          </ScrollArea>

          {/* Buttons */}
          <div className="px-6 py-4 border-t bg-background flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Tip: use “Select All” to add everyone.
            </div>
            <div className="flex gap-3 justify-end">
              <DialogClose ref={closeBtnRef} asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="wz"
                type="submit"
                disabled={
                  loading ||
                  (!preSelectedGroupId && !selectedGroupId) ||
                  selectedClientIds.length === 0
                }
              >
                {loading ? "Adding..." : `Add (${selectedClientIds.length})`}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

