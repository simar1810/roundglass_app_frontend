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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { nameInitials } from "@/lib/formatter";

/**
 * Client Filter Modal Component (for Coach)
 * @param {Object} props
 * @param {React.ReactNode} props.children - Trigger element
 * @param {Array} props.clients - Array of client objects { value, label, name, email, avatar }
 * @param {Array} props.selectedClients - Array of selected client IDs
 * @param {Function} props.onApply - Callback when Apply is clicked (receives selected client IDs)
 * @param {Function} props.onCancel - Callback when Cancel is clicked
 * @param {boolean} props.multiple - Allow multiple selection (default: true)
 * @param {boolean} props.open - Controlled open state
 * @param {Function} props.onOpenChange - Callback when open state changes
 */
export default function ClientFilterModal({
  children,
  clients = [],
  selectedClients = [],
  onApply,
  onCancel,
  multiple = true,
  open,
  onOpenChange,
}) {
  const [internalSelected, setInternalSelected] = useState(selectedClients);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync internal state with prop changes
  useEffect(() => {
    setInternalSelected(selectedClients);
  }, [selectedClients]);

  // Filter clients based on search
  const filteredClients = clients.filter((client) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = client.name || client.label || "";
    const email = client.email || "";
    return (
      name.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query)
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
    if (internalSelected.length === filteredClients.length) {
      setInternalSelected([]);
    } else {
      setInternalSelected(filteredClients.map((client) => client.value));
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
    setInternalSelected(selectedClients); // Reset to original
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
          <DialogTitle>Filter by Clients</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Select All / Clear */}
          {multiple && filteredClients.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-8 px-2"
              >
                {internalSelected.length === filteredClients.length
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

          {/* Clients List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {filteredClients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No clients found</p>
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
              filteredClients.map((client) => {
                const isSelected = internalSelected.includes(client.value);
                const name = client.name || client.label || "Unknown";
                const email = client.email || "";
                const avatar = client.avatar || client.image || "";

                return (
                  <div
                    key={client.value}
                    className={cn(
                      "flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer",
                      isSelected && "bg-muted"
                    )}
                    onClick={() => handleToggle(client.value)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(client.value)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatar} alt={name} />
                      <AvatarFallback>
                        {nameInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Label className="cursor-pointer font-medium truncate block">
                        {name}
                      </Label>
                      {email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {email}
                        </p>
                      )}
                    </div>
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

