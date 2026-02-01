"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoundglassDataExport } from "@/hooks/useRoundglassDataExport";
import { useAppSelector } from "@/providers/global/hooks";
import ClientDataExport from "@/components/pages/roundglass/ClientDataExport";
import TeamDataExport from "@/components/pages/roundglass/TeamDataExport";
import SelectMultiple from "@/components/SelectMultiple";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Download, User, Users, FileSpreadsheet, FileText, Info, Search, Loader2, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAppClients } from "@/lib/fetchers/app";
import useSWR from "swr";
import useDebounce from "@/hooks/useDebounce";
import { nameInitials } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";

export default function DataExportPage() {
  const { client_categories = [] } = useAppSelector((state) => state.coach.data);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState("excel");
  const clientSearchRef = useRef(null);
  const clientDropdownRef = useRef(null);

  // Debounce client search
  const debouncedClientSearch = useDebounce(clientSearch, 300);

  // Fetch clients with search
  const { data: clientsData, isLoading: isLoadingClients, error: clientsError } = useSWR(
    debouncedClientSearch && debouncedClientSearch.trim() 
      ? `clients-search-${debouncedClientSearch}` 
      : null,
    () => getAppClients({ limit: 50, search: debouncedClientSearch.trim() }),
    {
      revalidateOnFocus: false,
      revalidateOnRevalidate: false,
    }
  );

  // Fetch all clients when no search (for initial load)
  const { data: allClientsData, isLoading: isLoadingAllClients } = useSWR(
    !debouncedClientSearch || !debouncedClientSearch.trim() 
      ? "all-clients-export" 
      : null,
    () => getAppClients({ limit: 100 }),
    {
      revalidateOnFocus: false,
    }
  );

  const clients = useMemo(() => {
    if (debouncedClientSearch && clientsData?.status_code === 200) {
      return Array.isArray(clientsData.data) ? clientsData.data : [];
    }
    if (!debouncedClientSearch && allClientsData?.status_code === 200) {
      return Array.isArray(allClientsData.data) ? allClientsData.data : [];
    }
    return [];
  }, [clientsData, allClientsData, debouncedClientSearch]);

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients.slice(0, 10); // Show first 10 when no search
    
    const searchLower = clientSearch.toLowerCase();
    return clients.filter(
      (client) =>
        client.name?.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.mobileNumber?.toLowerCase().includes(searchLower) ||
        client.clientId?.toLowerCase().includes(searchLower)
    ).slice(0, 10); // Limit to 10 results
  }, [clients, clientSearch]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target) &&
        clientSearchRef.current &&
        !clientSearchRef.current.contains(event.target)
      ) {
        setShowClientDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle client selection
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setSelectedClientId(client._id);
    setClientSearch(client.name || "");
    setShowClientDropdown(false);
  };

  // Clear client selection
  const handleClearClient = () => {
    setSelectedClient(null);
    setSelectedClientId("");
    setClientSearch("");
    setShowClientDropdown(false);
  };

  // Prepare category options
  const categoryOptions = useMemo(() => {
    return client_categories.map((cat) => ({
      value: cat._id,
      label: cat.name || cat.title || "Unknown",
      id: cat._id,
    }));
  }, [client_categories]);

  return (
    <div className="content-container space-y-6 py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-6 w-6" />
                Data Export
              </CardTitle>
              <CardDescription className="mt-2">
                Export client data or team data in CSV or Excel format
              </CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center text-muted-foreground hover:text-foreground"
                  aria-label="Learn about data export"
                >
                  <Info className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <div className="space-y-2 text-xs">
                  <p className="font-semibold">Data Export Options:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Client Export:</strong> Export comprehensive data for a specific client</li>
                    <li><strong>Team Export:</strong> Export aggregated data for one or more categories</li>
                    <li><strong>Formats:</strong> CSV (multiple files) or Excel (multi-sheet)</li>
                    <li><strong>Includes:</strong> Client info, preferences, health stats, training, supplements, injuries, and more</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="client" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="client" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Client Data Export
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Data Export
              </TabsTrigger>
            </TabsList>

            {/* Client Data Export Tab */}
            <TabsContent value="client" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Export Individual Client Data</CardTitle>
                  <CardDescription>
                    Export comprehensive data for a specific client including preferences, training modules, supplements, injuries, and diet recall
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientSearch">Select Client</Label>
                    <div className="relative" ref={clientSearchRef}>
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="clientSearch"
                        placeholder="Search by name, email, or client ID..."
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setShowClientDropdown(true);
                          if (!e.target.value.trim()) {
                            handleClearClient();
                          }
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        className="pl-10 pr-10"
                      />
                      {selectedClient && (
                        <button
                          type="button"
                          onClick={handleClearClient}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}

                      {/* Client Dropdown */}
                      {showClientDropdown && (
                        <div
                          ref={clientDropdownRef}
                          className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
                        >
                        {isLoadingClients || isLoadingAllClients ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : filteredClients.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            {clientSearch.trim() ? "No clients found" : "Start typing to search for clients"}
                          </div>
                        ) : (
                          <div className="p-1">
                            {filteredClients.map((client) => (
                              <button
                                key={client._id}
                                type="button"
                                onClick={() => handleClientSelect(client)}
                                className={cn(
                                  "w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left",
                                  selectedClientId === client._id && "bg-muted"
                                )}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={client.profilePhoto} />
                                  <AvatarFallback className="text-xs">
                                    {nameInitials(client.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{client.name}</p>
                                  {client.email && (
                                    <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                                  )}
                                </div>
                                {selectedClientId === client._id && (
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        </div>
                      )}
                    </div>

                    {/* Selected Client Display */}
                    {selectedClient && (
                      <div className="p-3 bg-muted/50 rounded-md border flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedClient.profilePhoto} />
                          <AvatarFallback>
                            {nameInitials(selectedClient.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{selectedClient.name}</p>
                          {selectedClient.email && (
                            <p className="text-xs text-muted-foreground">{selectedClient.email}</p>
                          )}
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            ID: {selectedClient._id}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearClient}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {!selectedClient && (
                      <p className="text-xs text-muted-foreground">
                        Search and select a client from the list above
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Export Format</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="clientFormat"
                          value="excel"
                          checked={selectedFormat === "excel"}
                          onChange={(e) => setSelectedFormat(e.target.value)}
                          className="w-4 h-4"
                        />
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>Excel (.xlsx)</span>
                        </div>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="clientFormat"
                          value="csv"
                          checked={selectedFormat === "csv"}
                          onChange={(e) => setSelectedFormat(e.target.value)}
                          className="w-4 h-4"
                        />
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>CSV (.csv)</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <ClientDataExport
                      clientId={selectedClientId}
                      defaultFormat={selectedFormat}
                      showFormatDropdown={false}
                      variant="default"
                      size="default"
                    />
                  </div>

                  {selectedClientId && (
                    <div className="p-4 bg-muted/50 rounded-md border">
                      <p className="text-sm font-medium mb-2">What's included in client export:</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-2">
                        <li>Client basic information</li>
                        <li>Health preferences and medical history</li>
                        <li>Training modules and schedules</li>
                        <li>Supplement usage data</li>
                        <li>Injury records and rehabilitation progress</li>
                        <li>Diet recall information</li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Data Export Tab */}
            <TabsContent value="team" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Export Team Data</CardTitle>
                  <CardDescription>
                    Export aggregated data for one or more client categories. Includes analytics, preferences, health statistics, and comparison data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="categories">
                      Select Categories <span className="text-destructive">*</span>
                    </Label>
                    <SelectMultiple
                      label="Select categories"
                      options={categoryOptions}
                      value={selectedCategoryIds}
                      onChange={setSelectedCategoryIds}
                      selectAll={true}
                      searchable={true}
                      className="w-full"
                    />
                    {selectedCategoryIds.length === 0 && (
                      <p className="text-sm text-destructive">
                        At least one category must be selected
                      </p>
                    )}
                    {selectedCategoryIds.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {selectedCategoryIds.length} categor{selectedCategoryIds.length === 1 ? "y" : "ies"} selected
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Export Format</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="teamFormat"
                          value="excel"
                          checked={selectedFormat === "excel"}
                          onChange={(e) => setSelectedFormat(e.target.value)}
                          className="w-4 h-4"
                        />
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>Excel (.xlsx)</span>
                        </div>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="teamFormat"
                          value="csv"
                          checked={selectedFormat === "csv"}
                          onChange={(e) => setSelectedFormat(e.target.value)}
                          className="w-4 h-4"
                        />
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>CSV (.csv)</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <TeamDataExport
                      defaultCategoryIds={selectedCategoryIds}
                      defaultFormat={selectedFormat}
                      showFormatDropdown={false}
                      variant="default"
                      size="default"
                    />
                  </div>

                  {selectedCategoryIds.length > 0 && (
                    <div className="p-4 bg-muted/50 rounded-md border">
                      <p className="text-sm font-medium mb-2">What's included in team export:</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-2">
                        <li>Category information and coach details</li>
                        <li>Client lists and profiles</li>
                        <li>Aggregated preferences data</li>
                        <li>Health statistics and metrics</li>
                        <li>Training statistics</li>
                        <li>Supplement usage statistics</li>
                        <li>Injury statistics</li>
                        <li>Client comparison data</li>
                        <li>Inter-category comparison (when multiple categories selected)</li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

