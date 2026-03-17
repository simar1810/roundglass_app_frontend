"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRoundglassDataExport } from "@/hooks/useRoundglassDataExport";
import { useAppSelector } from "@/providers/global/hooks";
import SelectMultiple from "@/components/SelectMultiple";
import { Download, FileSpreadsheet, FileText, Loader2, Users, Info, HelpCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
 * Team Data Export Component
 * Provides export functionality for team data (coach only)
 * 
 * @param {Object} props
 * @param {string|string[]} [props.defaultCategoryIds] - Default selected category IDs
 * @param {string|string[]} [props.defaultMetrics] - Default selected metrics
 * @param {string} [props.defaultFormat] - Default export format: 'csv' or 'excel' (default: 'excel')
 * @param {string} [props.filename] - Optional custom filename (without extension)
 * @param {string} [props.variant] - Button variant (default: 'outline')
 * @param {string} [props.size] - Button size (default: 'sm')
 * @param {boolean} [props.showFormatDropdown] - Show format dropdown in modal (default: true)
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Custom trigger element (optional)
 */
export default function TeamDataExport({
  defaultCategoryIds = [],
  defaultMetrics = [],
  defaultFormat = "excel",
  filename = null,
  variant = "outline",
  size = "sm",
  showFormatDropdown = true,
  className,
  children,
}) {
  const { client_categories = [] } = useAppSelector((state) => state.coach.data);
  const { isExporting, exportProgress, exportError, exportTeam, clearError } = useRoundglassDataExport();

  const [open, setOpen] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(
    Array.isArray(defaultCategoryIds) ? defaultCategoryIds : defaultCategoryIds ? [defaultCategoryIds] : []
  );
  const [selectedMetrics, setSelectedMetrics] = useState(
    Array.isArray(defaultMetrics) ? defaultMetrics : defaultMetrics ? [defaultMetrics] : []
  );
  const [selectedFormat, setSelectedFormat] = useState(defaultFormat);

  // Use refs to track previous values and prevent infinite loops
  const prevOpenRef = useRef(false);
  const defaultCategoryIdsRef = useRef(defaultCategoryIds);
  const defaultMetricsRef = useRef(defaultMetrics);
  const defaultFormatRef = useRef(defaultFormat);

  // Update refs when props change
  useEffect(() => {
    defaultCategoryIdsRef.current = defaultCategoryIds;
    defaultMetricsRef.current = defaultMetrics;
    defaultFormatRef.current = defaultFormat;
  }, [defaultCategoryIds, defaultMetrics, defaultFormat]);

  // Reset to defaults when modal opens
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // Modal just opened
      const categoryIdsArray = Array.isArray(defaultCategoryIdsRef.current)
        ? defaultCategoryIdsRef.current
        : defaultCategoryIdsRef.current
        ? [defaultCategoryIdsRef.current]
        : [];
      const metricsArray = Array.isArray(defaultMetricsRef.current)
        ? defaultMetricsRef.current
        : defaultMetricsRef.current
        ? [defaultMetricsRef.current]
        : [];

      setSelectedCategoryIds(categoryIdsArray);
      setSelectedMetrics(metricsArray);
      setSelectedFormat(defaultFormatRef.current);
    }
    prevOpenRef.current = open;
  }, [open]);

  // Prepare category options
  const categoryOptions = useMemo(() => {
    return client_categories.map((cat) => ({
      value: cat._id,
      label: cat.name || cat.title || "Unknown",
      id: cat._id,
    }));
  }, [client_categories]);

  // Clear error when modal opens
  useEffect(() => {
    if (open && exportError) {
      clearError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exportError]);

  // Handle export
  const handleExport = async () => {
    if (selectedCategoryIds.length === 0) {
      return;
    }

    const metricsToExport = selectedMetrics.length > 0 ? selectedMetrics : null;
    await exportTeam(selectedCategoryIds, metricsToExport, selectedFormat, filename);
    
    // Close modal after successful export (error handling is in the hook)
    // Only close if not exporting and no error
    setTimeout(() => {
      if (!isExporting && !exportError) {
        setOpen(false);
      }
    }, 500);
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

  const canExport = selectedCategoryIds.length > 0 && !isExporting;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant={variant}
            size={size}
            className={cn("gap-2", className)}
          >
            <Download className="h-4 w-4" />
            <span>Export Team Data</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Export Team Data
          </DialogTitle>
          <DialogDescription>
            Export comprehensive team data including client information, preferences, health statistics, and comparison data.
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="ml-2 inline-flex items-center text-muted-foreground hover:text-foreground"
                  aria-label="Learn more about data export"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2 text-xs">
                  <p className="font-semibold">What's included in the export:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Player information and profiles</li>
                    <li>Health preferences and medical history</li>
                    <li>Training modules and statistics</li>
                    <li>Supplement usage data</li>
                    <li>Injury records and rehabilitation</li>
                    <li>Health metrics and comparisons</li>
                    <li>Inter-category analytics</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Loading State with Progress */}
          {isExporting && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-md border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">Exporting data...</span>
                </div>
                <span className="text-sm text-muted-foreground font-medium">
                  {exportProgress}%
                </span>
              </div>
              <Progress value={exportProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {exportProgress < 50
                  ? "Fetching data from server..."
                  : exportProgress < 90
                  ? "Preparing export file..."
                  : "Finalizing export..."}
              </p>
            </div>
          )}

          {/* Error Display */}
          {exportError && !isExporting && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive font-medium">
                Export Error: {exportError.message || "An error occurred during export"}
              </p>
            </div>
          )}

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
              disabled={isExporting}
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

          {/* Metrics Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select Metrics (Optional)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAllMetrics}
                className="h-7 text-xs"
                disabled={isExporting}
              >
                {selectedMetrics.length === AVAILABLE_METRICS.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to export all metrics. Select specific metrics to include only those in the comparison data.
            </p>
            <div className={cn(
              "grid grid-cols-2 md:grid-cols-3 gap-3 p-3 border rounded-md max-h-48 overflow-y-auto",
              isExporting && "opacity-50 pointer-events-none"
            )}>
              {AVAILABLE_METRICS.map((metric) => {
                const isSelected = selectedMetrics.includes(metric.value);
                return (
                  <div
                    key={metric.value}
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer",
                      isSelected && "bg-muted",
                      isExporting && "cursor-not-allowed"
                    )}
                    onClick={() => !isExporting && handleToggleMetric(metric.value)}
                  >
                    <Checkbox
                      id={`metric-${metric.value}`}
                      checked={isSelected}
                      onCheckedChange={() => !isExporting && handleToggleMetric(metric.value)}
                      disabled={isExporting}
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
                {selectedMetrics.length} metric{selectedMetrics.length === 1 ? "" : "s"} selected
              </p>
            )}
          </div>

          {/* Format Selection - Only show if showFormatDropdown is true */}
          {showFormatDropdown && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Export Format</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center text-muted-foreground hover:text-foreground"
                    aria-label="Learn about export formats"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-semibold mb-1">Excel (.xlsx) Format:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Single file with multiple sheets</li>
                        <li>Organized by data type (Categories, Clients, Preferences, etc.)</li>
                        <li>Best for analysis in Excel or Google Sheets</li>
                        <li>Supports formulas and formatting</li>
                        <li>Recommended for large datasets</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">CSV (.csv) Format:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Multiple separate files (one per data type)</li>
                        <li>Simple text format, easy to import</li>
                        <li>Compatible with all spreadsheet applications</li>
                        <li>Smaller file sizes</li>
                        <li>Best for data import/export workflows</li>
                      </ul>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1 border-t">
                      <strong>Note:</strong> Large exports (&gt;100 clients) may take longer to process.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <RadioGroup
              value={selectedFormat}
              onValueChange={setSelectedFormat}
              className="flex gap-6"
              disabled={isExporting}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="format-excel" disabled={isExporting} />
                <Label
                  htmlFor="format-excel"
                  className={cn(
                    "flex items-center gap-2",
                    isExporting ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  )}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Excel (.xlsx)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="format-csv" disabled={isExporting} />
                <Label
                  htmlFor="format-csv"
                  className={cn(
                    "flex items-center gap-2",
                    isExporting ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  <span>CSV (.csv)</span>
                </Label>
              </div>
            </RadioGroup>
            <div className="p-3 bg-muted/50 rounded-md border space-y-2">
              <p className="text-xs font-medium">Format Details:</p>
              <div className="text-xs text-muted-foreground space-y-1">
                {selectedFormat === "excel" ? (
                  <>
                    <p>• Single Excel file with organized sheets</p>
                    <p>• Includes: Categories, Clients, Preferences, Health Stats, Training Stats, Supplement Stats, Injury Stats, Comparison, and Inter-Category Comparison</p>
                    <p>• Best for comprehensive analysis and reporting</p>
                  </>
                ) : (
                  <>
                    <p>• Multiple CSV files will be created:</p>
                    <p className="ml-2">- team-data-export-categories.csv</p>
                    <p className="ml-2">- team-data-export-clients.csv</p>
                    <p className="ml-2">- team-data-export-preferences.csv</p>
                    <p className="ml-2">- team-data-export-health-stats.csv</p>
                    <p className="ml-2">- And more...</p>
                    <p>• Each file contains one data type for easy import</p>
                  </>
                )}
              </div>
            </div>
          </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            {isExporting ? "Exporting..." : "Cancel"}
          </Button>
          <Button
            onClick={handleExport}
            disabled={!canExport}
            className="gap-2 w-full sm:w-auto"
          >
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

