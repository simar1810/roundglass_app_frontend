"use client";

import FormControl from "@/components/FormControl";
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
import { Textarea } from "@/components/ui/textarea";
import { createGroup } from "@/lib/fetchers/growth";
import { getAppClients } from "@/lib/fetchers/app";
import { useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";

export default function CreateGroupModal({ onSuccess }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const closeBtnRef = useRef(null);

  // Form state
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState([]);

  // Fetch clients for selection
  const { isLoading: clientsLoading, error: clientsError, data: clientsData } = useSWR(
    open ? "app/getAppClients" : null,
    () => getAppClients({ page: 1, limit: 1000 })
  );

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
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    try {
      setLoading(true);

      const response = await createGroup({
        name: groupName.trim(),
        description: description.trim() || undefined,
        clientIds: selectedClientIds.length > 0 ? selectedClientIds : undefined,
      });

      if (response.status_code !== 201) {
        const { getGrowthErrorMessage } = await import("@/lib/utils/growthErrors");
        const errorMessage = getGrowthErrorMessage(
          response.status_code,
          response.message || "Failed to create group",
          response
        );
        throw new Error(errorMessage);
      }

      toast.success(response.message || "Group created successfully");

      // Reset form
      setGroupName("");
      setDescription("");
      setSelectedClientIds([]);

      // Close modal
      closeBtnRef.current?.click();
      setOpen(false);

      // Call success callback
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      toast.error(error.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset form when closing
      setGroupName("");
      setDescription("");
      setSelectedClientIds([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="wz" size="sm">
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-[500px] max-h-[80vh] border-0 p-0 overflow-y-auto">
        <DialogHeader className="bg-[var(--comp-2)] py-4 px-6 border-b-1">
          <DialogTitle className="text-black text-[20px]">Create New Group</DialogTitle>
        </DialogHeader>

        <form className="px-6 py-4" onSubmit={handleSubmit}>
          {/* Group Name */}
          <FormControl
            label="Group Name"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name (e.g., U-14 Team)"
            className="text-[14px] [&_.label]:font-[400] block mb-4"
            required
          />

          {/* Description */}
          <div className="mb-4">
            <label className="label font-[600] text-[14px] block mb-2">Description (Optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description..."
              className="w-full px-4 py-2 rounded-[8px] focus:outline-none border-1 border-[#D6D6D6] min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          {/* Client Selection */}
          <div className="mb-6">
            <label className="label font-[600] text-[14px] block mb-2">
              Add Clients (Optional)
            </label>
            {clientsLoading ? (
              <ContentLoader />
            ) : clientsError || clientsData?.status_code !== 200 ? (
              <ContentError
                className="min-h-auto"
                title={clientsError || clientsData?.message || "Failed to load clients"}
              />
            ) : (
              <SelectMultiple
                label="Select clients to add to this group"
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
                {selectedClientIds.length} client{selectedClientIds.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <DialogClose ref={closeBtnRef} className="px-4 py-2 rounded-[8px] border-2">
              Cancel
            </DialogClose>
            <Button variant="wz" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


