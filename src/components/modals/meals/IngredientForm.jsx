"use client";

import { Button } from "@/components/ui/button";
import FormControl from "@/components/FormControl";
import { useState } from "react";
import { toast } from "sonner";

export const NUTRITION_FIELDS = [
  { key: "moisture", label: "Moisture (g)" },
  { key: "protein", label: "Protein (g)" },
  { key: "ash", label: "Ash (g)" },
  { key: "totalFat", label: "Total fat (g)" },
  { key: "carbohydrate", label: "Carbohydrate (g)" },
  { key: "energyKJ", label: "Energy (kJ)" },
];

function parseNum(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function hasAtLeastOneNutrition(form) {
  for (const { key } of NUTRITION_FIELDS) {
    if (parseNum(form[key]) != null) return true;
  }
  const df = form.dietaryFibre;
  if (df && (parseNum(df.total) != null || parseNum(df.insoluble) != null || parseNum(df.soluble) != null)) return true;
  return false;
}

export function buildPayload(form) {
  const payload = {
    foodCode: String(form.foodCode ?? "").trim(),
    foodName: String(form.foodName ?? "").trim(),
  };
  if (form.category != null && String(form.category).trim() !== "") {
    payload.category = String(form.category).trim();
  }
  for (const { key } of NUTRITION_FIELDS) {
    const v = parseNum(form[key]);
    if (v != null) payload[key] = v;
  }
  const total = parseNum(form.dietaryFibre?.total);
  const insoluble = parseNum(form.dietaryFibre?.insoluble);
  const soluble = parseNum(form.dietaryFibre?.soluble);
  if (total != null || insoluble != null || soluble != null) {
    payload.dietaryFibre = {};
    if (total != null) payload.dietaryFibre.total = total;
    if (insoluble != null) payload.dietaryFibre.insoluble = insoluble;
    if (soluble != null) payload.dietaryFibre.soluble = soluble;
  }
  return payload;
}

export const getInitialForm = () => ({
  foodCode: "",
  foodName: "",
  category: "",
  moisture: "",
  ash: "",
  protein: "",
  totalFat: "",
  carbohydrate: "",
  energyKJ: "",
  dietaryFibre: { total: "", insoluble: "", soluble: "" },
});

/** Map API ingredient to form state (for edit). */
export function ingredientToForm(ingredient) {
  if (!ingredient) return getInitialForm();
  const df = ingredient.dietaryFibre;
  return {
    foodCode: ingredient.foodCode ?? "",
    foodName: ingredient.foodName ?? "",
    category: ingredient.category ?? "",
    moisture: ingredient.moisture !== undefined && ingredient.moisture !== null ? String(ingredient.moisture) : "",
    ash: ingredient.ash !== undefined && ingredient.ash !== null ? String(ingredient.ash) : "",
    protein: ingredient.protein !== undefined && ingredient.protein !== null ? String(ingredient.protein) : "",
    totalFat: ingredient.totalFat !== undefined && ingredient.totalFat !== null ? String(ingredient.totalFat) : "",
    carbohydrate: ingredient.carbohydrate !== undefined && ingredient.carbohydrate !== null ? String(ingredient.carbohydrate) : "",
    energyKJ: ingredient.energyKJ !== undefined && ingredient.energyKJ !== null ? String(ingredient.energyKJ) : "",
    dietaryFibre: {
      total: df?.total !== undefined && df?.total !== null ? String(df.total) : "",
      insoluble: df?.insoluble !== undefined && df?.insoluble !== null ? String(df.insoluble) : "",
      soluble: df?.soluble !== undefined && df?.soluble !== null ? String(df.soluble) : "",
    },
  };
}

/**
 * Shared form for add/edit ingredient.
 * @param {Object} props
 * @param {Object} props.initialForm - Initial form state (from getInitialForm() or ingredientToForm(ingredient))
 * @param {(payload: Object) => Promise<void>} props.onSubmit - Called with built payload; throw on error
 * @param {() => void} props.onCancel - Close/cancel
 * @param {string} props.submitLabel - Button label (e.g. "Save Ingredient", "Update Ingredient")
 */
export default function IngredientForm({ initialForm, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateDietaryFibre(key, value) {
    setForm((prev) => ({
      ...prev,
      dietaryFibre: { ...prev.dietaryFibre, [key]: value },
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const code = String(form.foodCode ?? "").trim();
    const name = String(form.foodName ?? "").trim();
    if (!code) {
      toast.error("Food code is required.");
      return;
    }
    if (!name) {
      toast.error("Food name is required.");
      return;
    }
    if (!hasAtLeastOneNutrition(form)) {
      toast.error("At least one nutrition value (per 100g) is required.");
      return;
    }

    const payload = buildPayload(form);
    try {
      setLoading(true);
      await onSubmit(payload);
      onCancel();
    } catch (error) {
      toast.error(error.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6 space-y-4">
      <div>
        <FormControl
          label="Food code (required)"
          placeholder="e.g. F001"
          value={form.foodCode}
          onChange={(e) => updateField("foodCode", e.target.value)}
          required
        />
      </div>
      <div>
        <FormControl
          label="Food name (required)"
          placeholder="e.g. Oats"
          value={form.foodName}
          onChange={(e) => updateField("foodName", e.target.value)}
          required
        />
      </div>
      <div>
        <FormControl
          label="Category (optional)"
          placeholder="e.g. Cereals"
          value={form.category}
          onChange={(e) => updateField("category", e.target.value)}
        />
      </div>

      <div className="pt-2">
        <p className="font-medium text-sm text-[var(--dark-1)]/80 mb-2">Nutrition per 100g (at least one required)</p>
        <div className="grid grid-cols-2 gap-3">
          {NUTRITION_FIELDS.map(({ key, label }) => (
            <FormControl
              key={key}
              label={label}
              type="number"
              step="any"
              min="0"
              placeholder="—"
              value={form[key]}
              onChange={(e) => updateField(key, e.target.value)}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <FormControl
            label="Fibre total"
            type="number"
            step="any"
            min="0"
            placeholder="—"
            value={form.dietaryFibre?.total ?? ""}
            onChange={(e) => updateDietaryFibre("total", e.target.value)}
          />
          <FormControl
            label="Fibre insoluble"
            type="number"
            step="any"
            min="0"
            placeholder="—"
            value={form.dietaryFibre?.insoluble ?? ""}
            onChange={(e) => updateDietaryFibre("insoluble", e.target.value)}
          />
          <FormControl
            label="Fibre soluble"
            type="number"
            step="any"
            min="0"
            placeholder="—"
            value={form.dietaryFibre?.soluble ?? ""}
            onChange={(e) => updateDietaryFibre("soluble", e.target.value)}
          />
        </div>
      </div>

      <div className="pt-2 flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="wz" disabled={loading}>
          {loading ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
