"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    assignClientsToUser,
    getAvailableClients,
    getUserClients,
    removeClientFromUser
} from "@/lib/fetchers/app";
import {
    ChevronDown,
    ChevronUp,
    Loader2,
    Search,
    SlidersHorizontal,
    UserMinus,
    UserPlus,
    Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/providers/global/hooks";

export default function UserClientAssignmentModal({ open, onClose, user, onSuccess }) {
  const { client_categories = [] } = useAppSelector((state) => state.coach.data || {});

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableClients, setAvailableClients] = useState([]);
  const [userClients, setUserClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [filterCategoryIds, setFilterCategoryIds] = useState([]);
  const [accessCategoryIds, setAccessCategoryIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const resolvedUserId = String(
    user?._id ||
    user?.id ||
    user?.user?._id ||
    user?.user?.id ||
    user?.data?._id ||
    user?.data?.id ||
    ""
  ).trim();

  useEffect(() => {
    if (open && user) {
      const initialAccessCategories = Array.isArray(user?.categoryIds)
        ? user.categoryIds
        : Array.isArray(user?.clientCategoryAccess)
          ? user.clientCategoryAccess
          : Array.isArray(user?.categories)
            ? user.categories
            : [];
      setAccessCategoryIds(
        initialAccessCategories.map((id) => String(id || "").trim()).filter(Boolean)
      );
      if (resolvedUserId) {
        fetchUserClients();
        fetchAvailableClients();
      }
    }
  }, [open, user, resolvedUserId]);

  useEffect(() => {
    if (searchTerm) {
      const debounceTimer = setTimeout(() => {
        fetchAvailableClients(1, searchTerm);
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      fetchAvailableClients();
    }
  }, [searchTerm]);

  const fetchUserClients = async () => {
    if (!resolvedUserId) return;
    try {
      setLoadingClients(true);
      const response = await getUserClients(resolvedUserId);
      if (response.status_code === 200) {
        setUserClients(response.data.clients || []);
        const serverCategoryIds = Array.isArray(response?.data?.categoryIds)
          ? response.data.categoryIds
            .map((id) => String(id || "").trim())
            .filter(Boolean)
          : [];
        if (serverCategoryIds.length > 0 || !Array.isArray(user?.categoryIds)) {
          setAccessCategoryIds(serverCategoryIds);
        }
      }
    } catch (error) { } finally {
      setLoadingClients(false);
    }
  };

  const fetchAvailableClients = async (page = 1, search = "") => {
    try {
      setLoadingClients(true);
      const response = await getAvailableClients(page, 1000, search);
      if (response.status_code === 200) {
        setAvailableClients(response.data.clients || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(page);
      }
    } catch (error) {
      // Error handling
    } finally {
      setLoadingClients(false);
    }
  };

  const displayedAvailableClients = filterCategoryIds.length
    ? availableClients.filter((client) => {
      const clientCategoryIds = Array.isArray(client?.categories) ? client.categories : [];
      return filterCategoryIds.some((catId) => clientCategoryIds.includes(catId));
    })
    : availableClients;

  const normalizedSearch = String(searchTerm || "").trim().toLowerCase();
  const matchClientWithQuery = (client) => {
    if (!normalizedSearch) return true;
    const haystack = [
      client?.name,
      client?.email,
      client?.mobileNumber,
      client?.clientId,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  };

  const filteredAvailableClients = displayedAvailableClients.filter(matchClientWithQuery);
  const filteredUserClients = userClients.filter(matchClientWithQuery);

  // If user changes categories, keep selected clients consistent (avoid assigning clients from other categories).
  useEffect(() => {
    if (!filterCategoryIds.length) return;

    setSelectedClients((prev) => {
      return prev.filter((client) => {
        const clientCategoryIds = Array.isArray(client?.categories) ? client.categories : [];
        return filterCategoryIds.some((catId) => clientCategoryIds.includes(catId));
      });
    });
  }, [filterCategoryIds.join(",")]); // intentionally coarse key

  const handleSelectCategoryClients = () => {
    if (!filterCategoryIds.length) return;

    const assignedIds = new Set(userClients.map((c) => c._id));
    setSelectedClients((prev) => {
      const selectedIds = new Set(prev.map((c) => c._id));
      const next = displayedAvailableClients
        .filter((client) => !assignedIds.has(client._id))
        .filter((client) => client._id && !selectedIds.has(client._id));
      return [...prev, ...next];
    });
  };

  const handleClientSelect = (client) => {
    setSelectedClients(prev => {
      const isSelected = prev.some(c => c._id === client._id);
      if (isSelected) {
        return prev.filter(c => c._id !== client._id);
      } else {
        return [...prev, client];
      }
    });
  };

  const handleAssignClients = async () => {
    if (!resolvedUserId) {
      toast.error("Valid user ID is required!");
      return;
    }
    if (selectedClients.length === 0) {
      toast.error("Please select at least one client to assign");
      return;
    }

    try {
      setLoading(true);
      const clientIds = selectedClients
        .map((client) => String(client?._id || "").trim())
        .filter(Boolean);
      if (clientIds.length === 0) {
        toast.error("No valid client IDs found for assignment.");
        return;
      }
      const response = await assignClientsToUser(resolvedUserId, clientIds, {
        categoryIds: accessCategoryIds.map((id) => String(id || "").trim()).filter(Boolean),
      });

      if (response.status_code === 200) {
        toast.success(`Successfully assigned ${selectedClients.length} client(s) to ${user.name}`);
        setSelectedClients([]);
        fetchUserClients();
        fetchAvailableClients();
        onSuccess?.();
      } else {
        throw new Error(response.message || "Failed to assign clients");
      }
    } catch (error) {
      toast.error(error.message || "Failed to assign clients");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClient = async (client) => {
    if (!resolvedUserId) {
      toast.error("Valid user ID is required!");
      return;
    }
    try {
      setLoading(true);
      const response = await removeClientFromUser(resolvedUserId, client._id);

      if (response.status_code === 200) {
        toast.success(`Removed ${client.name} from ${user.name}`);
        fetchUserClients();
        fetchAvailableClients();
        onSuccess?.();
      } else {
        throw new Error(response.message || "Failed to remove client");
      }
    } catch (error) {
      toast.error(error.message || "Failed to remove client");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedClients([]);
    setFilterCategoryIds([]);
    setAccessCategoryIds([]);
    setSearchTerm("");
    setShowFiltersPanel(false);
    setCurrentPage(1);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-[1080px] w-full h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b bg-white">
          <DialogTitle className="text-2xl font-semibold text-gray-900 tracking-tight">
            Manage Clients for {user?.name}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Control category access and assign players from one place.
          </p>
        </DialogHeader>

        <div className="px-6 py-3 border-b bg-gray-50/80">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border px-3 py-2 bg-slate-50/50">
              <p className="text-xs text-gray-500">Selected Clients</p>
              <p className="text-lg font-semibold text-gray-900">{selectedClients.length}</p>
            </div>
            <div className="rounded-lg border px-3 py-2 bg-slate-50/50">
              <p className="text-xs text-gray-500">Assigned Clients</p>
              <p className="text-lg font-semibold text-gray-900">{userClients.length}</p>
            </div>
            <div className="rounded-lg border px-3 py-2 bg-slate-50/50">
              <p className="text-xs text-gray-500">Category Access</p>
              <p className="text-lg font-semibold text-gray-900">{accessCategoryIds.length}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b bg-white">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search players by name, ID, email or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-w-[120px]"
              onClick={() => setShowFiltersPanel((prev) => !prev)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {showFiltersPanel ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Search applies to both available and assigned player lists.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5 flex-1 overflow-y-auto px-6 py-5 bg-slate-50/40">
          <div className="space-y-4 flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Available Clients</h3>
              <Badge variant="outline">{filteredAvailableClients.length} visible</Badge>
            </div>
            <div className="border rounded-xl bg-white overflow-y-auto h-[720px] max-h-[720px] custom-scrollbar">
              {loadingClients ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {filteredAvailableClients.map((client) => {
                    const isAssigned = userClients.some(uc => uc._id === client._id);
                    const isSelected = selectedClients.some(sc => sc._id === client._id);

                    return (
                      <label
                        key={client._id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${isAssigned
                          ? 'bg-gray-50 border-gray-200 opacity-60'
                          : isSelected
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={isAssigned}
                          onCheckedChange={() => handleClientSelect(client)}
                        />

                        <Avatar className="h-10 w-10">
                          <AvatarImage src={client.profilePhoto} />
                          <AvatarFallback>
                            {client.name?.charAt(0)?.toUpperCase() || 'C'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {client.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {client.email || client.mobileNumber || client.clientId}
                          </p>
                        </div>

                        {isAssigned && (
                          <Badge variant="secondary" className="text-xs">
                            Assigned
                          </Badge>
                        )}
                      </label>
                    );
                  })}

                  {filteredAvailableClients.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No available clients match your search/filter</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Assigned Clients</h3>
              <Badge variant="outline">{filteredUserClients.length} assigned</Badge>
            </div>

            {showFiltersPanel && (
              <div className="rounded-xl border bg-white p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-gray-900">Filters & Access</h4>
                  <Badge variant="outline">{accessCategoryIds.length} categories enabled</Badge>
                </div>

                {client_categories.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-gray-900">Filter Available by Category</h5>
                      {filterCategoryIds.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => setFilterCategoryIds([])}
                        >
                          Clear
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {client_categories.map((category) => {
                        const isChecked = filterCategoryIds.includes(category._id);
                        return (
                          <label
                            key={category._id}
                            className={`flex items-center gap-2 border rounded-lg px-2 py-1 cursor-pointer select-none ${
                              isChecked ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(val) => {
                                const checked = Boolean(val);
                                setFilterCategoryIds((prev) => {
                                  if (checked) return prev.includes(category._id) ? prev : [...prev, category._id];
                                  return prev.filter((id) => id !== category._id);
                                });
                              }}
                            />
                            <span className="text-xs font-semibold text-gray-900">{category.name}</span>
                          </label>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={handleSelectCategoryClients}
                      disabled={filteredAvailableClients.length === 0 || loadingClients}
                    >
                      {filterCategoryIds.length > 0
                        ? `Select ${filteredAvailableClients.length} filtered clients`
                        : "Select filtered clients"}
                    </Button>
                  </div>
                )}

                {client_categories.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <h5 className="text-sm font-medium text-gray-900">Category Access for User</h5>
                    <p className="text-xs text-gray-500">
                      User can access clients in these categories (backend enforced).
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {client_categories.map((category) => {
                        const checked = accessCategoryIds.includes(String(category._id));
                        return (
                          <label
                            key={`access-${category._id}`}
                            className={`flex items-center gap-2 border rounded-lg px-2 py-1 cursor-pointer select-none ${
                              checked ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(val) => {
                                const isChecked = Boolean(val);
                                setAccessCategoryIds((prev) => {
                                  const id = String(category._id);
                                  if (isChecked) return prev.includes(id) ? prev : [...prev, id];
                                  return prev.filter((x) => x !== id);
                                });
                              }}
                            />
                            <span className="text-xs font-semibold text-gray-900">{category.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={`border rounded-xl bg-white overflow-y-auto custom-scrollbar ${
              showFiltersPanel ? "h-[468px] max-h-[468px]" : "h-[720px] max-h-[720px]"
            }`}>
              {loadingClients ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {filteredUserClients.map((client) => (
                    <div
                      key={client._id}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 bg-white"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={client.profilePhoto} />
                        <AvatarFallback>
                          {client.name?.charAt(0)?.toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {client.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {client.email || client.mobileNumber || client.clientId}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveClient(client)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {filteredUserClients.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No assigned clients match your search/filter</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
          <div className="text-sm text-gray-600">
            {selectedClients.length > 0 && (
              <span>{selectedClients.length} client(s) selected for assignment</span>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignClients}
              disabled={loading || selectedClients.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign {selectedClients.length} Client(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
