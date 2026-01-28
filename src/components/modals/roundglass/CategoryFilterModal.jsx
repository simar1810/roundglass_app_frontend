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

/**
 * Category Filter Modal Component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Trigger element
 * @param {Array} props.categories - Array of category objects { value, label }
 * @param {Array} props.selectedCategories - Array of selected category values
 * @param {Function} props.onApply - Callback when Apply is clicked (receives selected categories)
 * @param {Function} props.onCancel - Callback when Cancel is clicked
 * @param {boolean} props.multiple - Allow multiple selection (default: true)
 * @param {boolean} props.open - Controlled open state
 * @param {Function} props.onOpenChange - Callback when open state changes
 */
export default function CategoryFilterModal({
  children,
  categories = [],
  selectedCategories = [],
  onApply,
  onCancel,
  multiple = true,
  open,
  onOpenChange,
}) {
  const [internalSelected, setInternalSelected] = useState(selectedCategories);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync internal state with prop changes
  useEffect(() => {
    setInternalSelected(selectedCategories);
  }, [selectedCategories]);

  // Filter categories based on search
  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      cat.label?.toLowerCase().includes(query) ||
      cat.name?.toLowerCase().includes(query) ||
      cat.title?.toLowerCase().includes(query)
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
    if (internalSelected.length === filteredCategories.length) {
      setInternalSelected([]);
    } else {
      setInternalSelected(filteredCategories.map((cat) => cat.value));
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
    setInternalSelected(selectedCategories); // Reset to original
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
          <DialogTitle>Filter by Category</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Select All / Clear */}
          {multiple && filteredCategories.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-8 px-2"
              >
                {internalSelected.length === filteredCategories.length
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

          {/* Categories List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No categories found</p>
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
              filteredCategories.map((category) => {
                const isSelected = internalSelected.includes(category.value);
                return (
                  <div
                    key={category.value}
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer",
                      isSelected && "bg-muted"
                    )}
                    onClick={() => handleToggle(category.value)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(category.value)}
                    />
                    <Label className="flex-1 cursor-pointer">
                      {category.label || category.name || category.title || "Unknown"}
                    </Label>
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

