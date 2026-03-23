"use client";

import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import AddClientsToGroupModal from "@/components/modals/growth/AddClientsToGroupModal";
import CreateGroupModal from "@/components/modals/growth/CreateGroupModal";
import { AgeGroupComparisonChart, P50DistributionChart } from "@/components/pages/growth/GrowthCharts";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllGroups, getGroupReport } from "@/lib/fetchers/growth";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import { format, subMonths } from "date-fns";
import {
    AlertTriangle,
    CalendarIcon,
    Users,
    X
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

export default function Page() {
  const searchParams = useSearchParams();
  const groupFromUrl = searchParams.get("group");
  
  const [selectedGroupId, setSelectedGroupId] = useState(() => groupFromUrl || "");
  const [fromDate, setFromDate] = useState(() => subMonths(new Date(), 6)); // Default: 6 months ago
  const [toDate, setToDate] = useState(() => new Date()); // Default: today
  const { client_categories = [] } = useAppSelector((state) => state.coach.data || {});
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [standard, setStandard] = useState("IPA");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  useEffect(() => {
    if (!Array.isArray(client_categories) || client_categories.length === 0) {
      setSelectedCategoryIds([]);
      return;
    }

    // Default-select U14/U16/U18 style categories when available.
    const defaultCategoryIds = client_categories
      .filter((category) => {
        const name = String(category?.name || "").toLowerCase().replace(/\s+/g, "");
        return (
          name === "u14" ||
          name === "u16" ||
          name === "u18" ||
          name === "under14" ||
          name === "under16" ||
          name === "under18"
        );
      })
      .map((category) => category._id)
      .filter(Boolean);

    if (defaultCategoryIds.length > 0) {
      setSelectedCategoryIds(defaultCategoryIds);
      return;
    }

    // If no U14/U16/U18 category exists, default to all categories.
    const allCategoryIds = client_categories.map((category) => category?._id).filter(Boolean);
    setSelectedCategoryIds(allCategoryIds);
  }, [client_categories]);

  const [fromDateOpen, setFromDateOpen] = useState(false);
  const [toDateOpen, setToDateOpen] = useState(false);

  // Update selected group when URL parameter changes
  useEffect(() => {
    if (groupFromUrl && groupFromUrl !== selectedGroupId) {
      setSelectedGroupId(groupFromUrl);
    } else if (!groupFromUrl && selectedGroupId) {
      // Clear selection if URL param is removed
      setSelectedGroupId("");
    }
  }, [groupFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch groups
  const { isLoading: groupsLoading, error: groupsError, data: groupsData } = useSWR(
    "api/growth/groups",
    () => getAllGroups()
  );

  // Fetch group report when group is selected
  const reportKey = selectedGroupId
    ? `growth/group-report/${selectedGroupId}?from=${format(fromDate, "yyyy-MM-dd")}&to=${format(toDate, "yyyy-MM-dd")}&categoryIds=${selectedCategoryIds.length > 0 ? selectedCategoryIds.join(",") : "all"}&standard=${standard}`
    : null;

  const { isLoading: reportLoading, error: reportError, data: reportData } = useSWR(
    reportKey,
    () =>
      getGroupReport(selectedGroupId, {
        from: format(fromDate, "yyyy-MM-dd"),
        to: format(toDate, "yyyy-MM-dd"),
        ...(selectedCategoryIds.length > 0 ? { categoryIds: selectedCategoryIds } : {}),
        standard,
      })
  );

  const groups = useMemo(() => {
    if (!groupsData?.data) return [];
    return Array.isArray(groupsData.data) ? groupsData.data : [];
  }, [groupsData]);

  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    return groups.find((g) => String(g._id) === String(selectedGroupId)) || null;
  }, [groups, selectedGroupId]);

  const report = reportData?.data;

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Download/View Full Report actions removed (not required for this dashboard).

  // Calculate statistics
  const stats = useMemo(() => {
    if (!report) return null;

    const overall = report.overall || {};
    // Don't treat "not computed yet" as 0.
    if (overall.total === undefined || overall.total === null) return null;
    const total = overall.total || 0;
    const heightBelow = overall.height?.belowP50 || 0;
    const weightBelow = overall.weight?.belowP50 || 0;

    return {
      totalPlayers: total,
      heightBelowPercent: total > 0 ? ((heightBelow / total) * 100).toFixed(1) : 0,
      weightBelowPercent: total > 0 ? ((weightBelow / total) * 100).toFixed(1) : 0,
      // Note: Intervention count would need individual client data
      // For now, we'll estimate based on those below both standards
      interventionCount: Math.min(heightBelow, weightBelow),
    };
  }, [report]);

  return (
    <div className="content-container space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">IPA Growth Dashboard</h1>
            <p className="text-sm text-slate-600 mt-1">
              Track and analyze growth metrics for your teams
            </p>
          </div>
          <div className="flex gap-2">
            <CreateGroupModal
              onSuccess={(groupData) => {
                setSelectedGroupId(groupData._id);
                toast.success("Group created successfully");
              }}
            />
            <AddClientsToGroupModal
              groupId={selectedGroupId}
              onSuccess={() => {
                toast.success("Clients added successfully");
              }}
            />
          </div>
        </div>

        {/* Group Selector */}
        <div className="mt-4">
          <label className="text-sm font-medium mb-2 block">Select Group</label>
          {groupsLoading ? (
            <ContentLoader />
          ) : groupsError || groupsData?.status_code !== 200 ? (
            <ContentError
              className="min-h-auto"
              title={(() => {
                const { getGrowthErrorMessage } = require("@/lib/utils/growthErrors");
                return getGrowthErrorMessage(
                  groupsData?.status_code || 500,
                  groupsError || groupsData?.message || "Failed to load groups",
                  groupsData
                );
              })()}
            />
          ) : groups.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No groups available. Create one to get started.
            </div>
          ) : (
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group._id} value={group._id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Group Clients (from populated groups endpoint) */}
          {selectedGroup && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Players in group</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Click a player to open their profile.
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-700 bg-slate-100 rounded-full px-2 py-1">
                  {(Array.isArray(selectedGroup.clients) ? selectedGroup.clients.length : 0)} total
                </div>
              </div>

              {Array.isArray(selectedGroup.clients) && selectedGroup.clients.length > 0 ? (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {selectedGroup.clients.map((c) => {
                    const name = c?.name || "Unnamed";
                    const id = c?._id;
                    return (
                      <Link
                        key={String(id || c?.clientId || name)}
                        href={id ? `/coach/clients/${id}` : "#"}
                        className={cn(
                          "group rounded-xl border bg-slate-50 hover:bg-white hover:shadow-sm transition-all px-3 py-2",
                          !id && "pointer-events-none opacity-60"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {name}
                            </div>
                            <div className="text-[11px] text-slate-600 truncate">
                              {c?.clientId ? `ID: ${c.clientId}` : "ID: —"}
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500 group-hover:text-[var(--accent-1)]">
                            Open
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 text-sm text-slate-600">
                  No players in this group yet. Use “Add Clients to Group”.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filters Section */}
      {selectedGroupId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range - From */}
              <div>
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Popover open={fromDateOpen} onOpenChange={setFromDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fromDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "dd-MM-yyyy") : "Pick start date"}
                      {fromDate && (
                        <X
                          className="ml-auto h-4 w-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFromDate(subMonths(new Date(), 6));
                          }}
                        />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={(date) => {
                        if (date) setFromDate(date);
                        setFromDateOpen(false);
                      }}
                      initialFocus
                      maxDate={toDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date Range - To */}
              <div>
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Popover open={toDateOpen} onOpenChange={setToDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !toDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "dd-MM-yyyy") : "Pick end date"}
                      {toDate && (
                        <X
                          className="ml-auto h-4 w-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            setToDate(new Date());
                          }}
                        />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={(date) => {
                        if (date) setToDate(date);
                        setToDateOpen(false);
                      }}
                      initialFocus
                      minDate={fromDate}
                      maxDate={new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Categories */}
              <div>
                <label className="text-sm font-medium mb-2 block">Categories</label>
                <Popover open={categoryDropdownOpen} onOpenChange={setCategoryDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="truncate">
                        {selectedCategoryIds.length > 0
                          ? `${selectedCategoryIds.length} categor${selectedCategoryIds.length === 1 ? "y" : "ies"} selected`
                          : "Select categories"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {client_categories.length} total
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-3" align="start">
                    {client_categories.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No categories available.</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Choose one or more categories
                          </p>
                          <div className="flex items-center gap-3">
                            {client_categories.length > 0 && (
                              <button
                                type="button"
                                className="text-xs text-blue-600 hover:underline"
                                onClick={() => {
                                  const allSelected = selectedCategoryIds.length === client_categories.length;
                                  if (allSelected) {
                                    setSelectedCategoryIds([]);
                                    return;
                                  }
                                  setSelectedCategoryIds(
                                    client_categories.map((category) => category?._id).filter(Boolean)
                                  );
                                }}
                              >
                                {selectedCategoryIds.length === client_categories.length
                                  ? "Deselect all"
                                  : "Select all"}
                              </button>
                            )}
                            {selectedCategoryIds.length > 0 && (
                              <button
                                type="button"
                                className="text-xs text-blue-600 hover:underline"
                                onClick={() => setSelectedCategoryIds([])}
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                          {client_categories.map((category) => (
                            <label
                              key={category._id}
                              htmlFor={`category-${category._id}`}
                              className="flex items-center gap-2 rounded px-1 py-1 hover:bg-slate-50 cursor-pointer"
                            >
                              <Checkbox
                                id={`category-${category._id}`}
                                checked={selectedCategoryIds.includes(category._id)}
                                onCheckedChange={() => handleCategoryToggle(category._id)}
                              />
                              <span className="text-sm truncate">{category.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Standard */}
              <div>
                <label className="text-sm font-medium mb-2 block">Standard</label>
                <Select value={standard} onValueChange={setStandard}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IPA">IPA</SelectItem>
                    <SelectItem value="IAP">IAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      {selectedGroupId && (
        <>
          {reportLoading ? (
            <ContentLoader />
          ) : reportError || reportData?.status_code !== 200 ? (
            <Card>
              <CardContent className="pt-6">
                <ContentError
                  title={(() => {
                    const { getGrowthErrorMessage } = require("@/lib/utils/growthErrors");
                    return getGrowthErrorMessage(
                      reportData?.status_code || 500,
                      reportError || reportData?.message || "Failed to load report",
                      reportData
                    );
                  })()}
                />
              </CardContent>
            </Card>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Players
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.totalPlayers}</div>
                    <p className="text-xs text-muted-foreground mt-1">Active in group</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Below Height Standard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{stats.heightBelowPercent}%</div>
                    <Progress value={parseFloat(stats.heightBelowPercent)} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Below 50th percentile
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Below Weight Standard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{stats.weightBelowPercent}%</div>
                    <Progress value={parseFloat(stats.weightBelowPercent)} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Below 50th percentile
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Needs Intervention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">{stats.interventionCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Below both standards
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <P50DistributionChart groupReport={report} type="height" />
                  <P50DistributionChart groupReport={report} type="weight" />
                </div>
                <AgeGroupComparisonChart groupReport={report} />
              </div>

              {/* Age Group Breakdown */}
              {report.buckets && report.buckets.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {report.buckets.map((bucket) => (
                    <AgeGroupCard key={bucket.bucket} bucket={bucket} />
                  ))}
                </div>
              )}

              {/* Intervention Alerts */}
              <InterventionAlertsSection
                report={report}
                selectedCategoryIds={selectedCategoryIds}
                standard={standard}
              />

              {/* Action Buttons removed */}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  Select a group and apply filters to view statistics.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!selectedGroupId && groups.length === 0 && !groupsLoading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Groups Found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first group to start tracking growth metrics.
            </p>
            <CreateGroupModal />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AgeGroupCard({ bucket }) {
  const total = bucket.total || 0;
  const heightAbove = bucket.height?.aboveP50 || 0;
  const heightBelow = bucket.height?.belowP50 || 0;
  const weightAbove = bucket.weight?.aboveP50 || 0;
  const weightBelow = bucket.weight?.belowP50 || 0;

  const heightBelowPercent = total > 0 ? ((heightBelow / total) * 100).toFixed(1) : 0;
  const weightBelowPercent = total > 0 ? ((weightBelow / total) * 100).toFixed(1) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{bucket.bucket} Team</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Total Players</span>
            <span className="text-lg font-bold">{total}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Height</span>
              <span className="text-xs text-muted-foreground">
                {heightBelowPercent}% below standard
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-green-50 p-2 rounded">
                <div className="font-semibold text-green-700">{heightAbove}</div>
                <div className="text-green-600">Above P50</div>
              </div>
              <div className="bg-red-50 p-2 rounded">
                <div className="font-semibold text-red-700">{heightBelow}</div>
                <div className="text-red-600">Below P50</div>
              </div>
            </div>
            <Progress value={parseFloat(heightBelowPercent)} className="mt-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Weight</span>
              <span className="text-xs text-muted-foreground">
                {weightBelowPercent}% below standard
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-green-50 p-2 rounded">
                <div className="font-semibold text-green-700">{weightAbove}</div>
                <div className="text-green-600">Above P50</div>
              </div>
              <div className="bg-red-50 p-2 rounded">
                <div className="font-semibold text-red-700">{weightBelow}</div>
                <div className="text-red-600">Below P50</div>
              </div>
            </div>
            <Progress value={parseFloat(weightBelowPercent)} className="mt-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InterventionAlertsSection({ report, selectedCategoryIds, standard }) {
  // Note: The API doesn't provide individual client data in the report
  // This section would need to be implemented when backend provides client-level data
  // For now, we'll show a placeholder with the count

  const interventionCount = useMemo(() => {
    if (!report?.buckets) return 0;
    return report.buckets.reduce((sum, bucket) => {
      const heightBelow = bucket.height?.belowP50 || 0;
      const weightBelow = bucket.weight?.belowP50 || 0;
      // Estimate: clients below both standards
      return sum + Math.min(heightBelow, weightBelow);
    }, 0);
  }, [report]);

  if (interventionCount === 0) return null;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-lg text-orange-900">Intervention Alerts</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-orange-800">
            <strong>{interventionCount}</strong> player{interventionCount !== 1 ? "s" : ""} need
            immediate attention as they are below both height and weight standards.
          </p>
          <div className="bg-white p-4 rounded-lg border border-orange-200">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Individual client details will be available when the backend
              provides client-level data in the report. For now, this is an estimated count based
              on aggregate statistics.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              To view individual client growth status, navigate to the client profile and check the
              Growth tab.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

