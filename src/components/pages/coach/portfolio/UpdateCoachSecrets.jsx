import React, { useState } from "react";
import { Pencil, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { sendData } from "@/lib/api";
import { toast } from "sonner";

export default function UpdateCoachSecrets({ initialData, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    razorpayClientId: initialData?.razorpayClientId || "",
    razorpaySecret: initialData?.razorpaySecret || "",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    let tempErrors = {};
    if (!formData.razorpayClientId.trim()) tempErrors.razorpayClientId = "Client ID is required";
    if (!formData.razorpaySecret.trim()) tempErrors.razorpaySecret = "Secret key is required";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async function (e) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const response = await sendData("app/secrets", formData);
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      setOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrors({ api: "Failed to update keys. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="w-4 h-4" /> Edit Keys
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Razorpay Keys</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="razorpayClientId">Client ID</Label>
            <Input
              id="razorpayClientId"
              name="razorpayClientId"
              value={formData.razorpayClientId}
              onChange={handleChange}
              className={errors.razorpayClientId ? "border-red-500" : ""}
              placeholder="rzp_live_..."
            />
            {errors.razorpayClientId && (
              <p className="text-xs text-red-500">{errors.razorpayClientId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="razorpaySecret">Secret</Label>
            <Input
              id="razorpaySecret"
              name="razorpaySecret"
              type="password"
              value={formData.razorpaySecret}
              onChange={handleChange}
              className={errors.razorpaySecret ? "border-red-500" : ""}
              placeholder="••••••••••••"
            />
            {errors.razorpaySecret && (
              <p className="text-xs text-red-500">{errors.razorpaySecret}</p>
            )}
          </div>

          {errors.api && <p className="text-sm text-red-500 font-medium">{errors.api}</p>}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}