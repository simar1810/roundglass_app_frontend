"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Search, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMetricName } from "@/lib/utils/roundglassAnalytics";

// Available metrics list
export const AVAILABLE_METRICS = [
  { value: "bmi", label: "BMI" },
  { value: "muscle", label: "Muscle %" },
  { value: "fat", label: "Fat %" },
  { value: "rm", label: "Resting Metabolic Rate" },
  { value: "ideal_weight", label: "Ideal Weight" },
  { value: "bodyAge", label: "Body Age" },
  { value: "visceral_fat", label: "Visceral Fat" },
  { value: "weight", label: "Weight" },
  { value: "sub_fat", label: "Subcutaneous Fat" },
  { value: "chest", label: "Chest" },
  { value: "arm", label: "Arm" },
  { value: "abdomen", label: "Abdomen" },
  { value: "waist", label: "Waist" },
  { value: "hip", label: "Hip" },
  { value: "thighs", label: "Thighs" },
  { value: "height", label: "Height" },
  { value: "shoulder_distance", label: "Shoulder Distance" },
];

/**
 * Metric Selector Component
 * Reusable multi-select component for choosing metrics
 * 
 * @param {Object} props
 * @param {Array<string>} props.value - Array of selected metric values
 * @param {Function} props.onChange - Callback when selection changes (receives array of selected values)
 * @param {Array} props.availableMetrics - Available metrics array (defaults to AVAILABLE_METRICS)
 * @param {string} props.label - Label text (default: "Select Metrics")
 * @param {boolean} props.showLabel - Show label above selector (default: true)
 * @param {boolean} props.searchable - Enable search/filter (default: true)
 * @param {boolean} props.showSelectAll - Show Select All button (default: true)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.placeholder - Placeholder text
 */
export default function MetricSelector({
  value = [],
  onChange,
  availableMetrics = AVAILABLE_METRICS,
  label = "Select Metrics",
  showLabel = true,
  searchable = true,
  showSelectAll = true,
  className = "",
  placeholder = "Select metrics...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter metrics based on search query
  const filteredMetrics = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return availableMetrics;
    }
    const query = searchQuery.toLowerCase().trim();
    return availableMetrics.filter((metric) => {
      const label = metric.label || formatMetricName(metric.value);
      return (
        label.toLowerCase().includes(query) ||
        metric.value.toLowerCase().includes(query)
      );
    });
  }, [availableMetrics, searchQuery, searchable]);

  // Check if all filtered metrics are selected
  const allFilteredSelected = useMemo(() => {
    if (filteredMetrics.length === 0) return false;
    return filteredMetrics.every((metric) => value.includes(metric.value));
  }, [filteredMetrics, value]);

  // Handle metric toggle
  const handleToggle = (metricValue) => {
    const newValue = value.includes(metricValue)
      ? value.filter((v) => v !== metricValue)
      : [...value, metricValue];
    onChange(newValue);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect all filtered metrics
      const newValue = value.filter(
        (v) => !filteredMetrics.some((m) => m.value === v)
      );
      onChange(newValue);
    } else {
      // Select all filtered metrics
      const newSelections = filteredMetrics
        .filter((m) => !value.includes(m.value))
        .map((m) => m.value);
      onChange([...value, ...newSelections]);
    }
  };

  // Handle clear all
  const handleClear = () => {
    onChange([]);
    setSearchQuery("");
  };

  // Get display text
  const displayText = useMemo(() => {
    if (value.length === 0) {
      return placeholder;
    }
    if (value.length <= 2) {
      return value
        .map((v) => {
          const metric = availableMetrics.find((m) => m.value === v);
          return metric?.label || formatMetricName(v);
        })
        .join(", ");
    }
    return `${value.length} metrics selected`;
  }, [value, availableMetrics, placeholder]);

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <Label className="text-sm font-medium">{label}</Label>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal",
              value.length === 0 && "text-muted-foreground"
            )}
          >
            <span className="truncate flex-1">{displayText}</span>
            <div className="flex items-center gap-2 ml-2">
              {value.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {value.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="flex flex-col max-h-96">
            {/* Search Bar */}
            {searchable && (
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search metrics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            )}

            {/* Select All / Clear Actions */}
            {showSelectAll && filteredMetrics.length > 0 && (
              <div className="flex items-center justify-between px-3 py-2 border-b text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 px-2"
                >
                  {allFilteredSelected ? "Deselect All" : "Select All"}
                  {searchable && searchQuery && (
                    <span className="ml-1 text-muted-foreground">
                      ({filteredMetrics.length})
                    </span>
                  )}
                </Button>
                {value.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-7 px-2 text-muted-foreground"
                  >
                    Clear ({value.length})
                  </Button>
                )}
              </div>
            )}

            {/* Metrics List */}
            <div className="overflow-y-auto flex-1">
              {filteredMetrics.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  <p>No metrics found</p>
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredMetrics.map((metric) => {
                    const isSelected = value.includes(metric.value);
                    const displayLabel = metric.label || formatMetricName(metric.value);
                    
                    return (
                      <div
                        key={metric.value}
                        className={cn(
                          "flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer",
                          isSelected && "bg-muted"
                        )}
                        onClick={() => handleToggle(metric.value)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggle(metric.value)}
                        />
                        <Label className="flex-1 cursor-pointer text-sm">
                          {displayLabel}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Count Footer */}
            {value.length > 0 && (
              <div className="px-3 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
                {value.length} metric{value.length !== 1 ? "s" : ""} selected
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected Metrics Pills (Optional - shown below selector) */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.slice(0, 5).map((metricValue) => {
            const metric = availableMetrics.find((m) => m.value === metricValue);
            const displayLabel = metric?.label || formatMetricName(metricValue);
            
            return (
              <Badge
                key={metricValue}
                variant="secondary"
                className="text-xs"
              >
                {displayLabel}
                <button
                  onClick={() => handleToggle(metricValue)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {value.length > 5 && (
            <Badge variant="secondary" className="text-xs">
              +{value.length - 5} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Hook to manage metric selection state
 * @param {Object} params
 * @param {Array<string>} params.defaultValue - Default selected metrics
 * @param {Function} params.onChange - Callback when selection changes
 * @returns {Object} { selectedMetrics, setSelectedMetrics, toggleMetric, selectAll, clearAll }
 */
export function useMetricSelection(params = {}) {
  const { defaultValue = [], onChange } = params;
  const [selectedMetrics, setSelectedMetrics] = useState(defaultValue);

  const handleChange = (newMetrics) => {
    setSelectedMetrics(newMetrics);
    if (onChange) {
      onChange(newMetrics);
    }
  };

  const toggleMetric = (metricValue) => {
    const newMetrics = selectedMetrics.includes(metricValue)
      ? selectedMetrics.filter((v) => v !== metricValue)
      : [...selectedMetrics, metricValue];
    handleChange(newMetrics);
  };

  const selectAll = (availableMetrics = AVAILABLE_METRICS) => {
    handleChange(availableMetrics.map((m) => m.value));
  };

  const clearAll = () => {
    handleChange([]);
  };

  return {
    selectedMetrics,
    setSelectedMetrics: handleChange,
    toggleMetric,
    selectAll,
    clearAll,
  };
}

