"use client";

import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import SelectControl from "@/components/Select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAppClients } from "@/lib/fetchers/app";
import { addClientsToGroup, getAllGroups } from "@/lib/fetchers/growth";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

export default function AddClientsToGroupModal({ groupId: preSelectedGroupId, onSuccess, children }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const closeBtnRef = useRef(null);

  // Form state
  const [selectedGroupId, setSelectedGroupId] = useState(preSelectedGroupId || "");
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [query, setQuery] = useState("");

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

  const clients = useMemo(() => {
    if (!clientsData?.data) return [];
    return Array.isArray(clientsData.data) ? clientsData.data : [];
  }, [clientsData]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const name = String(c?.name || "").toLowerCase();
      const email = String(c?.email || "").toLowerCase();
      const mobile = String(c?.mobileNumber || "").toLowerCase();
      const clientId = String(c?.clientId || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        mobile.includes(q) ||
        clientId.includes(q)
      );
    });
  }, [clients, query]);

  const selectedSet = useMemo(() => new Set(selectedClientIds), [selectedClientIds]);

  function toggleClient(id) {
    if (!id) return;
    setSelectedClientIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  function setClientChecked(id, nextChecked) {
    if (!id) return;
    setSelectedClientIds((prev) => {
      const has = prev.includes(id);
      if (nextChecked && !has) return [...prev, id];
      if (!nextChecked && has) return prev.filter((x) => x !== id);
      return prev;
    });
  }

  function selectAllFiltered() {
    const ids = filteredClients.map((c) => c?._id).filter(Boolean);
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return Array.from(next);
    });
  }

  function clearAll() {
    setSelectedClientIds([]);
  }

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
      setQuery("");
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
      <DialogContent className="!max-w-[920px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-[18px]">Add players to group</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Pick a group and select the players you want to include.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
          <div className="px-6 py-4 flex-1 flex flex-col gap-4">
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {!preSelectedGroupId && (
                <div className="md:col-span-1">
                  {groupsLoading ? (
                    <div className="rounded-md border border-border/60 bg-background/40 p-3">
                      <ContentLoader />
                    </div>
                  ) : groupsError || groupsData?.status_code !== 200 ? (
                    <ContentError
                      className="!min-h-[80px]"
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

              <div className={preSelectedGroupId ? "md:col-span-3" : "md:col-span-2"}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="label font-[600] text-[14px] block">Athlete</label>
                  <div className="flex items-center gap-2">
                    {selectedClientIds.length > 0 && (
                      <Badge variant="secondary" className="text-[11px]">
                        {selectedClientIds.length} selected
                      </Badge>
                    )}
                    <Button type="button" variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={selectAllFiltered} disabled={clientsLoading || filteredClients.length === 0}>
                      Select all
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={clearAll} disabled={selectedClientIds.length === 0}>
                      Clear
                    </Button>
                  </div>
                </div>

                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search players by name, email, phone, or ID…"
                />
              </div>
            </div>

            {/* List */}
            {clientsLoading ? (
              <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                <ContentLoader />
              </div>
            ) : clientsError || clientsData?.status_code !== 200 ? (
              <ContentError
                className="!min-h-[200px]"
                title={clientsError || clientsData?.message || "Failed to load clients"}
              />
            ) : (
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <ScrollArea className="h-[52vh]">
                  <div className="divide-y">
                    {filteredClients.length === 0 ? (
                      <div className="p-6 text-sm text-muted-foreground">
                        No players found.
                      </div>
                    ) : (
                      filteredClients.map((client) => {
                        const id = client?._id;
                        const checked = selectedSet.has(id);
                        const sub =
                          client?.email ||
                          client?.mobileNumber ||
                          (client?.clientId ? `ID: ${client.clientId}` : "");
                        return (
                          <div
                            key={id}
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleClient(id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleClient(id);
                              }
                            }}
                            className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/40 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer"
                          >
                            <div
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="shrink-0"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => setClientChecked(id, v === true)}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">{client?.name || "Unnamed player"}</div>
                              {sub ? (
                                <div className="text-xs text-muted-foreground truncate mt-0.5">
                                  {sub}
                                </div>
                              ) : null}
                            </div>
                            {checked ? (
                              <Badge variant="secondary" className="text-[11px]">
                                Selected
                              </Badge>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="px-6 py-4 border-t bg-background flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Select players, then click Add.
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

