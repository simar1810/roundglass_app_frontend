"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoundglassDataExport } from "@/hooks/useRoundglassDataExport";
import { useAppSelector } from "@/providers/global/hooks";
import SelectMultiple from "@/components/SelectMultiple";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  User,
  Users,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Available metrics for team export
const AVAILABLE_METRICS = [
  { value: "bmi", label: "BMI" },
  { value: "muscle", label: "Muscle %" },
  { value: "fat", label: "Fat %" },
  { value: "rm", label: "Resting Metabolic Rate" },
  { value: "bodyAge", label: "Body Age" },
  { value: "visceral_fat", label: "Visceral Fat" },
  { value: "weight", label: "Weight" },
  { value: "sub_fat", label: "Subcutaneous Fat" },
];

/**
 * Unified Data Export Modal Component
 * Reusable modal for configuring export options for both client and team data
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Trigger element
 * @param {string} [props.defaultExportType] - Default export type: 'client' or 'team' (default: 'team')
 * @param {string} [props.defaultClientId] - Default client ID for client export
 * @param {string|string[]} [props.defaultCategoryIds] - Default selected category IDs for team export
 * @param {string|string[]} [props.defaultMetrics] - Default selected metrics for team export
 * @param {string} [props.defaultFormat] - Default export format: 'csv' or 'excel' (default: 'excel')
 * @param {string} [props.filename] - Optional custom filename (without extension)
 * @param {boolean} [props.open] - Controlled open state
 * @param {Function} [props.onOpenChange] - Callback when open state changes
 */
export default function DataExportModal({
  children,
  defaultExportType = "team",
  defaultClientId = "",
  defaultCategoryIds = [],
  defaultMetrics = [],
  defaultFormat = "excel",
  filename = null,
  open,
  onOpenChange,
}) {
  const { client_categories = [] } = useAppSelector((state) => state.coach.data);
  const { isExporting, exportProgress, exportClient, exportTeam } =
    useRoundglassDataExport();

  const [internalOpen, setInternalOpen] = useState(open || false);
  const [exportType, setExportType] = useState(defaultExportType);
  const [clientId, setClientId] = useState(defaultClientId);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(
    Array.isArray(defaultCategoryIds)
      ? defaultCategoryIds
      : defaultCategoryIds
      ? [defaultCategoryIds]
      : []
  );
  const [selectedMetrics, setSelectedMetrics] = useState(
    Array.isArray(defaultMetrics)
      ? defaultMetrics
      : defaultMetrics
      ? [defaultMetrics]
      : []
  );
  const [selectedFormat, setSelectedFormat] = useState(defaultFormat);

  // Sync with controlled open state
  useEffect(() => {
    if (open !== undefined) {
      setInternalOpen(open);
    }
  }, [open]);

  // Reset to defaults when modal opens
  useEffect(() => {
    if (internalOpen) {
      setExportType(defaultExportType);
      setClientId(defaultClientId);
      setSelectedCategoryIds(
        Array.isArray(defaultCategoryIds)
          ? defaultCategoryIds
          : defaultCategoryIds
          ? [defaultCategoryIds]
          : []
      );
      setSelectedMetrics(
        Array.isArray(defaultMetrics)
          ? defaultMetrics
          : defaultMetrics
          ? [defaultMetrics]
          : []
      );
      setSelectedFormat(defaultFormat);
    }
  }, [
    internalOpen,
    defaultExportType,
    defaultClientId,
    defaultCategoryIds,
    defaultMetrics,
    defaultFormat,
  ]);

  const handleOpenChange = (newOpen) => {
    setInternalOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  // Prepare category options
  const categoryOptions = useMemo(() => {
    return client_categories.map((cat) => ({
      value: cat._id,
      label: cat.name || cat.title || "Unknown",
      id: cat._id,
    }));
  }, [client_categories]);

  // Handle export
  const handleExport = async () => {
    if (exportType === "client") {
      if (!clientId) {
        return;
      }
      await exportClient(clientId, selectedFormat, filename);
    } else {
      if (selectedCategoryIds.length === 0) {
        return;
      }
      const metricsToExport = selectedMetrics.length > 0 ? selectedMetrics : null;
      await exportTeam(selectedCategoryIds, metricsToExport, selectedFormat, filename);
    }

    // Close modal after successful export (error handling is in the hook)
    if (!isExporting) {
      handleOpenChange(false);
    }
  };

  // Toggle metric selection
  const handleToggleMetric = (metricValue) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricValue)
        ? prev.filter((v) => v !== metricValue)
        : [...prev, metricValue]
    );
  };

  // Select/Deselect all metrics
  const handleSelectAllMetrics = () => {
    if (selectedMetrics.length === AVAILABLE_METRICS.length) {
      setSelectedMetrics([]);
    } else {
      setSelectedMetrics(AVAILABLE_METRICS.map((m) => m.value));
    }
  };

  const canExport =
    (exportType === "client" && clientId) ||
    (exportType === "team" && selectedCategoryIds.length > 0);

  // Preview summary
  const exportPreview = useMemo(() => {
    if (exportType === "client") {
      return {
        type: "Player Data",
        details: clientId ? `Player ID: ${clientId}` : "No player selected",
        format: selectedFormat.toUpperCase(),
      };
    } else {
      return {
        type: "Team Data",
        details: `${selectedCategoryIds.length} categor${
          selectedCategoryIds.length === 1 ? "y" : "ies"
        }${selectedMetrics.length > 0 ? `, ${selectedMetrics.length} metric${selectedMetrics.length === 1 ? "" : "s"}` : ", all metrics"}`,
        format: selectedFormat.toUpperCase(),
      };
    }
  }, [exportType, clientId, selectedCategoryIds.length, selectedMetrics.length, selectedFormat]);

  return (
    <Dialog open={internalOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Configure and export player or team data in your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Type</Label>
            <Tabs value={exportType} onValueChange={setExportType}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="client" className="gap-2">
                  <User className="h-4 w-4" />
                  Player Data
                </TabsTrigger>
                <TabsTrigger value="team" className="gap-2">
                  <Users className="h-4 w-4" />
                  Team Data
                </TabsTrigger>
              </TabsList>

              {/* Client Export Tab */}
              <TabsContent value="client" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId" className="text-sm font-medium">
                    Player ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="clientId"
                    placeholder="Enter player ID (MongoDB ObjectId)"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full"
                  />
                  {!clientId && (
                    <p className="text-sm text-muted-foreground">
                      Please enter a valid player ID
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Team Export Tab */}
              <TabsContent value="team" className="space-y-4 mt-4">
                {/* Category Selection */}
                <div className="space-y-2">
                  <Label htmlFor="categories" className="text-sm font-medium">
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
                    <p className="text-sm text-muted-foreground">
                      At least one category must be selected
                    </p>
                  )}
                  {selectedCategoryIds.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedCategoryIds.length} categor
                      {selectedCategoryIds.length === 1 ? "y" : "ies"} selected
                    </p>
                  )}
                </div>

                {/* Metrics Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Select Metrics (Optional)
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllMetrics}
                      className="h-7 text-xs"
                    >
                      {selectedMetrics.length === AVAILABLE_METRICS.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to export all metrics. Select specific metrics to
                    include only those in the comparison data.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 border rounded-md max-h-48 overflow-y-auto">
                    {AVAILABLE_METRICS.map((metric) => {
                      const isSelected = selectedMetrics.includes(metric.value);
                      return (
                        <div
                          key={metric.value}
                          className={cn(
                            "flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer",
                            isSelected && "bg-muted"
                          )}
                          onClick={() => handleToggleMetric(metric.value)}
                        >
                          <Checkbox
                            id={`metric-${metric.value}`}
                            checked={isSelected}
                            onCheckedChange={() => handleToggleMetric(metric.value)}
                          />
                          <Label
                            htmlFor={`metric-${metric.value}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {metric.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  {selectedMetrics.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedMetrics.length} metric
                      {selectedMetrics.length === 1 ? "" : "s"} selected
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup
              value={selectedFormat}
              onValueChange={setSelectedFormat}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="format-excel" />
                <Label
                  htmlFor="format-excel"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Excel (.xlsx)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="format-csv" />
                <Label
                  htmlFor="format-csv"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span>CSV (.csv)</span>
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              {exportType === "client"
                ? "Excel format includes multiple sheets. CSV format creates a single file."
                : "Excel format includes multiple sheets. CSV format creates separate files for each data type."}
            </p>
          </div>

          {/* Export Preview */}
          <div className="p-4 bg-muted/50 rounded-md border space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4" />
              <span>Export Preview</span>
            </div>
            <div className="text-sm space-y-1 pl-6">
              <p>
                <span className="font-medium">Type:</span> {exportPreview.type}
              </p>
              <p>
                <span className="font-medium">Details:</span> {exportPreview.details}
              </p>
              <p>
                <span className="font-medium">Format:</span> {exportPreview.format}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!canExport || isExporting} className="gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Exporting... {exportProgress}%</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Export</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

