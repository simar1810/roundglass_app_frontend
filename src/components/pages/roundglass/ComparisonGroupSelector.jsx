"use client";

import { useState, useEffect, useMemo } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSelector } from "@/providers/global/hooks";
import { cn } from "@/lib/utils";

/**
 * Comparison Group Selector Component
 * Reusable component for selecting comparison groups in analytics
 * 
 * @param {Object} props
 * @param {string} props.value - Current comparison group value ("all" | "category")
 * @param {Function} props.onChange - Callback when comparison group changes (receives { comparisonGroup, categoryId })
 * @param {string} props.selectedCategoryId - Currently selected category ID
 * @param {string} props.person - Person type: "coach" | "client" (default: "coach")
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showLabel - Show label above the selector (default: true)
 * @param {string} props.label - Custom label text (default: "Comparison Group")
 */
export default function ComparisonGroupSelector({
  value = "all",
  onChange,
  selectedCategoryId = "",
  person = "coach",
  className = "",
  showLabel = true,
  label = "Comparison Group",
}) {
  const { client_categories = [] } = useAppSelector((state) => state.coach.data);
  const client = useAppSelector((state) => state.client.data);

  // Determine available options based on person type
  const availableOptions = useMemo(() => {
    if (person === "client") {
      return [
        { value: "all", label: "All Clients" },
        { value: "category", label: "My Category" },
      ];
    }
    // Coach view - show all options
    return [
      { value: "all", label: "All Clients" },
      { value: "category", label: "Category" },
    ];
  }, [person]);

  // Get category options
  const categoryOptions = useMemo(() => {
    if (person === "client" && client?.categories) {
      // For client view, show only their category
      return client_categories
        .filter((cat) => client.categories.includes(cat._id))
        .map((cat) => ({
          value: cat._id,
          label: cat.name || cat.title || "Unknown",
        }));
    }
    // For coach view, show all categories
    return client_categories.map((cat) => ({
      value: cat._id,
      label: cat.name || cat.title || "Unknown",
    }));
  }, [client_categories, client, person]);

  // Handle comparison group change
  const handleComparisonGroupChange = (newValue) => {
    if (onChange) {
      onChange({
        comparisonGroup: newValue,
        categoryId: newValue === "category" ? selectedCategoryId : "",
      });
    }
  };

  // Handle category change
  const handleCategoryChange = (categoryId) => {
    if (onChange) {
      onChange({
        comparisonGroup: value,
        categoryId,
      });
    }
  };

  // Auto-select first category if "category" is selected but no category is chosen
  useEffect(() => {
    if (value === "category" && !selectedCategoryId && categoryOptions.length > 0) {
      handleCategoryChange(categoryOptions[0].value);
    }
  }, [value, selectedCategoryId, categoryOptions]);

  return (
    <div className={cn("space-y-4", className)}>
      {showLabel && (
        <Label className="text-sm font-medium">{label}</Label>
      )}

      {/* Comparison Group Radio Buttons */}
      <RadioGroup
        value={value}
        onValueChange={handleComparisonGroupChange}
        className="flex flex-wrap gap-4"
      >
        {availableOptions.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={`comparison-${option.value}`} />
            <Label
              htmlFor={`comparison-${option.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {/* Category Selector (shown when "category" is selected) */}
      {value === "category" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {person === "client" ? "My Category" : "Select Category"}
          </Label>
          {categoryOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {person === "client"
                ? "You are not assigned to any category."
                : "No categories available."}
            </p>
          ) : (
            <Select
              value={selectedCategoryId}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Hook to manage comparison group state with URL params
 * @param {Object} params
 * @param {string} params.defaultValue - Default comparison group value
 * @param {Function} params.onChange - Callback when values change
 * @param {string} params.person - Person type: "coach" | "client"
 * @returns {Object} { comparisonGroup, categoryId, setComparisonGroup, setCategoryId }
 */
export function useComparisonGroup(params = {}) {
  const { defaultValue = "all", onChange, person = "coach" } = params;
  const [comparisonGroup, setComparisonGroup] = useState(defaultValue);
  const [categoryId, setCategoryId] = useState("");

  const handleChange = (newComparisonGroup, newCategoryId) => {
    setComparisonGroup(newComparisonGroup);
    setCategoryId(newCategoryId || "");
    
    if (onChange) {
      onChange({
        comparisonGroup: newComparisonGroup,
        categoryId: newCategoryId || "",
      });
    }
  };

  return {
    comparisonGroup,
    categoryId,
    setComparisonGroup: (value) => handleChange(value, categoryId),
    setCategoryId: (value) => handleChange(comparisonGroup, value),
    setBoth: (group, category) => handleChange(group, category),
  };
}

