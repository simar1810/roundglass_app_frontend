"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sendData } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Lightbulb } from "lucide-react";

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;

const CATEGORY_OPTIONS = [
  { value: "new_feature", label: "New feature" },
  { value: "improvement", label: "Improvement" },
  { value: "integration", label: "Integration" },
  { value: "bug_fix", label: "Bug fix" },
  { value: "other", label: "Other" },
];

const initialForm = () => ({
  title: "",
  category: "",
  description: "",
});

export default function SuggestFeatureModal({ open, onClose }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const title = form.title?.trim() || "";
    const category = form.category?.trim() || "";
    const description = form.description?.trim() || "";

    if (!title) {
      setError("Please add a short title for your suggestion.");
      return;
    }
    if (!category) {
      setError("Please choose a category.");
      return;
    }
    if (!description) {
      setError("Please describe the feature you have in mind.");
      return;
    }

    setLoading(true);
    try {
      const response = await sendData("app/suggest-feature", {
        title,
        category,
        description,
      });
      if (response?.status_code === 200) {
        toast.success(response.message ?? "Thanks! Your suggestion was submitted.");
        setForm(initialForm());
        onClose?.();
      } else {
        const msg = response?.message ?? "Something went wrong. Please try again.";
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err?.message ?? "Something went wrong. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    if (!loading) {
      setForm(initialForm());
      setError("");
      onClose?.();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleCancel()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lightbulb className="w-5 h-5 text-[var(--accent-1)] shrink-0" />
            Suggest a Feature
          </DialogTitle>
          <p className="text-sm text-[var(--dark-1)]/70 font-normal">
            Share your idea so we can make the app better for you.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="suggest-feature-title" className="text-[var(--dark-1)]">
              Title
            </Label>
            <Input
              id="suggest-feature-title"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
              placeholder="e.g. Schedule reminder messages for clients"
              maxLength={MAX_TITLE_LENGTH}
              disabled={loading}
              className="bg-[var(--comp-1)] border-[var(--comp-3)] focus-visible:ring-[var(--accent-1)]"
            />
            <span className="text-xs text-[var(--comp-4)]">
              {form.title.length} / {MAX_TITLE_LENGTH}
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--dark-1)]">Category</Label>
            <Select
              value={form.category || undefined}
              onValueChange={(v) => updateForm("category", v)}
              disabled={loading}
            >
              <SelectTrigger className="w-full bg-[var(--comp-1)] border-[var(--comp-3)]">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggest-feature-description" className="text-[var(--dark-1)]">
              Description
            </Label>
            <p className="text-xs text-[var(--comp-4)]">
              Describe the feature in as much detail as you like. For example: what problem it solves, how you’d use it, and where in the app it could live.
            </p>
            <textarea
              id="suggest-feature-description"
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="e.g. I’d find it helpful if I could schedule reminder messages for my clients from the dashboard, so they get a nudge at a time I choose..."
              rows={6}
              className="min-h-[140px] w-full resize-y rounded-lg border border-[var(--comp-3)] bg-[var(--comp-1)] px-4 py-3 text-sm text-[var(--dark-1)] placeholder:text-[var(--comp-4)] focus:border-[var(--accent-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]/20"
              disabled={loading}
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            <span className="text-xs text-[var(--comp-4)]">
              {form.description.length} / {MAX_DESCRIPTION_LENGTH} characters
            </span>
          </div>

          {error && (
            <p className="text-sm text-[var(--accent-2)]">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--comp-3)]">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="min-w-[90px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-w-[100px] bg-[var(--accent-1)] text-white hover:bg-[var(--accent-1)]/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                  Submitting…
                </>
              ) : (
                "Submit suggestion"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
