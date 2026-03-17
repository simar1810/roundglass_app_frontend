"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  History,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import useLocalStorage from "@/hooks/useLocalStorage";

const STORAGE_KEY = "roundglass_export_history";
const MAX_HISTORY_ITEMS = 50; // Keep last 50 exports

/**
 * Export History Component
 * Tracks and displays export history (currently using localStorage)
 * Can be extended to work with backend API if export history endpoint is added
 * 
 * @param {Object} props
 * @param {boolean} [props.showHeader] - Show card header (default: true)
 * @param {number} [props.maxItems] - Maximum number of items to display (default: 20)
 * @param {Function} [props.onExportClick] - Callback when export is clicked (for re-export)
 */
export default function ExportHistory({
  showHeader = true,
  maxItems = 20,
  onExportClick,
}) {
  const [exportHistory, setExportHistory] = useLocalStorage(STORAGE_KEY, []);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");

  // Filter exports
  const filteredExports = useMemo(() => {
    let filtered = [...exportHistory];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    // Filter by format
    if (formatFilter !== "all") {
      filtered = filtered.filter((item) => item.format === formatFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit items
    return filtered.slice(0, maxItems);
  }, [exportHistory, statusFilter, typeFilter, formatFilter, maxItems]);

  // Clear history
  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all export history?")) {
      setExportHistory([]);
      toast.success("Export history cleared");
    }
  };

  // Clear old exports (keep only recent ones)
  const handleClearOld = () => {
    const recent = exportHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, MAX_HISTORY_ITEMS);
    setExportHistory(recent);
    toast.success("Old exports cleared");
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  // Get type badge
  const getTypeBadge = (type) => {
    const colors = {
      client: "bg-blue-500",
      team: "bg-purple-500",
    };
    return (
      <Badge variant="outline" className={colors[type] || ""}>
        {type === "client" ? "Player Data" : "Team Data"}
      </Badge>
    );
  };

  // Get format icon
  const getFormatIcon = (format) => {
    return format === "excel" ? (
      <FileSpreadsheet className="h-4 w-4" />
    ) : (
      <FileText className="h-4 w-4" />
    );
  };

  // Handle re-export
  const handleReExport = (exportItem) => {
    if (onExportClick) {
      onExportClick(exportItem);
    } else {
      toast.info("Re-export functionality - click export button to export again");
    }
  };

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Export History
              </CardTitle>
              <CardDescription>
                View and manage your recent data exports
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {exportHistory.length > MAX_HISTORY_ITEMS && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearOld}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Clear Old
                </Button>
              )}
              {exportHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearHistory}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        {exportHistory.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Export History</h3>
            <p className="text-sm text-muted-foreground">
              Your export history will appear here after you export data.
            </p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="client">Player Data</SelectItem>
                    <SelectItem value="team">Team Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Format</label>
                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All formats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Export History Table */}
            {filteredExports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No exports found matching the selected filters.
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExports.map((exportItem, index) => (
                      <TableRow key={exportItem.id || index}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(
                                new Date(exportItem.timestamp),
                                "MMM dd, yyyy"
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(
                                new Date(exportItem.timestamp),
                                "HH:mm:ss"
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(exportItem.type)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {exportItem.type === "client" ? (
                              <span className="text-sm">
                                Player ID: {exportItem.clientId?.slice(-8) || "N/A"}
                              </span>
                            ) : (
                              <span className="text-sm">
                                {exportItem.categoryIds?.length || 0} categor
                                {exportItem.categoryIds?.length === 1 ? "y" : "ies"}
                              </span>
                            )}
                            {exportItem.metrics && exportItem.metrics.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {exportItem.metrics.length} metric
                                {exportItem.metrics.length === 1 ? "" : "s"}
                              </span>
                            )}
                            {exportItem.filename && (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {exportItem.filename}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFormatIcon(exportItem.format)}
                            <span className="text-sm uppercase">
                              {exportItem.format}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(exportItem.status)}</TableCell>
                        <TableCell className="text-right">
                          {exportItem.status === "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReExport(exportItem)}
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Re-export
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Summary */}
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredExports.length} of {exportHistory.length} export
              {exportHistory.length === 1 ? "" : "s"}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Hook to add export to history
 * Call this after a successful export
 * 
 * @param {Object} exportData - Export data to add to history
 * @param {string} exportData.type - Export type: 'client' or 'team'
 * @param {string} exportData.status - Export status: 'completed', 'failed', 'processing'
 * @param {string} exportData.format - Export format: 'csv' or 'excel'
 * @param {string} [exportData.clientId] - Client ID (for client exports)
 * @param {string[]} [exportData.categoryIds] - Category IDs (for team exports)
 * @param {string[]} [exportData.metrics] - Selected metrics (for team exports)
 * @param {string} [exportData.filename] - Export filename
 * @param {string} [exportData.error] - Error message (if failed)
 */
export function useExportHistory() {
  const [exportHistory, setExportHistory] = useLocalStorage(STORAGE_KEY, []);

  const addExport = (exportData) => {
    const newExport = {
      id: `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: exportData.type, // 'client' or 'team'
      status: exportData.status || "completed", // 'completed', 'failed', 'processing'
      format: exportData.format, // 'csv' or 'excel'
      clientId: exportData.clientId,
      categoryIds: exportData.categoryIds,
      metrics: exportData.metrics,
      filename: exportData.filename,
      error: exportData.error,
    };

    setExportHistory((prev) => {
      const updated = [newExport, ...prev];
      // Keep only the most recent MAX_HISTORY_ITEMS
      return updated.slice(0, MAX_HISTORY_ITEMS);
    });

    return newExport.id;
  };

  const clearHistory = () => {
    setExportHistory([]);
  };

  return {
    exportHistory,
    addExport,
    clearHistory,
  };
}

