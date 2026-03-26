"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AVAILABLE_USER_PERMISSIONS } from "@/config/data/user-permissions";
import { sendData } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function UserPermissionsModal({ open, onClose, user, onSuccess }) {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setSelectedPermissions(user.permissions || []);
    }
  }, [user]);

  const handlePermissionChange = (permissionId, checked) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("No user selected");
      return;
    }

    try {
      setLoading(true);
      
      const response = await sendData("app/users/permissions", {
        id: user._id,
        permissions: selectedPermissions
      }, "PUT");
      
      if (response.status_code === 200) {
        const currentUserId = document.cookie
          .split("; ")
          .find(row => row.startsWith("_id="))
          ?.split("=")[1];

        // If the edited user is the currently logged-in user, update cookie immediately
        // so feature access changes are applied without manual refresh.
        if (currentUserId && currentUserId === user._id) {
          document.cookie = `userPermissions=${encodeURIComponent(JSON.stringify(selectedPermissions))}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
          window.dispatchEvent(new Event("user-permissions-updated"));
        }

        toast.success("User permissions updated successfully!");
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || "Failed to update permissions");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPermissions([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage User Permissions</DialogTitle>
          {user && (
            <p className="text-sm text-gray-600">
              Setting permissions for: <strong>{user.name}</strong> ({user.userId})
            </p>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <Label className="text-base font-semibold">Available Permissions</Label>
            <div className="grid gap-3">
              {AVAILABLE_USER_PERMISSIONS.map((permission) => (
                <Card key={permission.id} className="p-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={`permission-${permission.id}`}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(permission.id, checked)
                      }
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={`permission-${permission.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {permission.name}
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--accent-1)] hover:bg-[var(--accent-1)]/90"
            >
              {loading ? "Updating..." : "Update Permissions"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
