"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMetricName } from "@/lib/utils/roundglassAnalytics";

// Available metrics
const AVAILABLE_METRICS = [
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
 * Metrics Filter Modal Component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Trigger element
 * @param {Array} props.availableMetrics - Array of metric objects { value, label } (optional, defaults to AVAILABLE_METRICS)
 * @param {Array} props.selectedMetrics - Array of selected metric values
 * @param {Function} props.onApply - Callback when Apply is clicked (receives selected metrics)
 * @param {Function} props.onCancel - Callback when Cancel is clicked
 * @param {boolean} props.multiple - Allow multiple selection (default: true)
 * @param {boolean} props.open - Controlled open state
 * @param {Function} props.onOpenChange - Callback when open state changes
 */
export default function MetricsFilterModal({
  children,
  availableMetrics = AVAILABLE_METRICS,
  selectedMetrics = [],
  onApply,
  onCancel,
  multiple = true,
  open,
  onOpenChange,
}) {
  const [internalSelected, setInternalSelected] = useState(selectedMetrics);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync internal state with prop changes
  useEffect(() => {
    setInternalSelected(selectedMetrics);
  }, [selectedMetrics]);

  // Filter metrics based on search
  const filteredMetrics = availableMetrics.filter((metric) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const label = metric.label || formatMetricName(metric.value);
    return (
      label.toLowerCase().includes(query) ||
      metric.value.toLowerCase().includes(query)
    );
  });

  const handleToggle = (value) => {
    if (multiple) {
      setInternalSelected((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      );
    } else {
      setInternalSelected([value]);
    }
  };

  const handleSelectAll = () => {
    if (internalSelected.length === filteredMetrics.length) {
      setInternalSelected([]);
    } else {
      setInternalSelected(filteredMetrics.map((metric) => metric.value));
    }
  };

  const handleClear = () => {
    setInternalSelected([]);
    setSearchQuery("");
  };

  const handleApply = () => {
    if (onApply) {
      onApply(internalSelected);
    }
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setInternalSelected(selectedMetrics); // Reset to original
    setSearchQuery("");
    if (onCancel) {
      onCancel();
    }
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const selectedCount = internalSelected.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Filter by Metrics</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search metrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Select All / Clear */}
          {multiple && filteredMetrics.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-8 px-2"
              >
                {internalSelected.length === filteredMetrics.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              {selectedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-8 px-2 text-muted-foreground"
                >
                  Clear ({selectedCount})
                </Button>
              )}
            </div>
          )}

          {/* Metrics List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {filteredMetrics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
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
              filteredMetrics.map((metric) => {
                const isSelected = internalSelected.includes(metric.value);
                const label = metric.label || formatMetricName(metric.value);
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
                    <Label className="flex-1 cursor-pointer">{label}</Label>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply {selectedCount > 0 && `(${selectedCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

