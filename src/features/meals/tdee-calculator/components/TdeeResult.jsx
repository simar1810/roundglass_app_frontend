"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";

import { SearchableSelect } from "@/components/common/selects/SearchableSelect";
import {
  GOAL_OPTIONS,
  getTargetForGoal,
  goalOptionLabel,
} from "../utils/goals";

function Row({ label, subLabel, calories, percent }) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-border">
      <div className="flex-1 bg-muted/40 p-3">
        <p className="font-medium text-foreground">{label}</p>
        {subLabel && (
          <p className="text-sm text-muted-foreground">{subLabel}</p>
        )}
      </div>
      <div className="min-w-[140px] border-l border-[var(--accent-1)]/25 bg-[var(--accent-1)]/10 p-3 text-right">
        <p className="text-xl font-bold leading-none text-[var(--accent-1)]">
          {calories.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {percent} · kcal/day
        </p>
      </div>
    </div>
  );
}

export default function TdeeResult({
  data,
  onEdit,
  selectedGoal,
  onGoalChange,
  breakdown,
  setBreakdown
}) {
  if (!data) return null;

  const primary = getTargetForGoal(data, selectedGoal);

  const macroFields = [
    { id: 'calories', label: 'Total Calories', unit: 'kcal' },
    { id: 'proteins', label: 'Proteins', unit: 'g' },
    { id: 'fats', label: 'Fats', unit: 'g' },
    { id: 'carbohydrates', label: 'Carbs', unit: 'g' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setBreakdown(name, (isNaN(value) || value === "") ? 0 : parseInt(value));
  };
  
  return (
    <div className="space-y-4 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--comp-1)]/40 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-[var(--dark-3)]">
          Calorie target
        </h2>
        <Button
          type="button"
          size="sm"
          variant="wz_outline"
          onClick={onEdit}
        >
          Edit numbers
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Goal</Label>
        <SearchableSelect
          options={GOAL_OPTIONS}
          value={selectedGoal}
          onValueChange={onGoalChange}
          selectLabel="Select goal"
        />
        <p className="text-xs text-muted-foreground">
          Daily intake shown below matches this goal. Saved history lists only
          snapshots saved with the same goal.
        </p>
      </div>

      {primary && (
        <div className="rounded-xl border-2 border-[var(--accent-1)]/35 bg-[var(--accent-1)]/10 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {goalOptionLabel(selectedGoal)}
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--accent-1)]">
            {primary.calories.toLocaleString()}
            <span className="text-base font-semibold ml-1.5">kcal/day</span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {primary.percent} of maintenance (TDEE {data.tdee?.toLocaleString()}{" "}
            kcal)
            {primary.change ? ` · ${primary.change}` : ""}
          </p>
        </div>
      )}

      <div>
        {/* add nutrition breakdown options calories, proteins, carbohydrates, fats */}
      </div>

      <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-medium mb-4 text-gray-800">Nutrition Breakdown</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {macroFields.map((field) => (
          <div key={field.id} className="flex flex-col">
            <label 
              htmlFor={field.id} 
              className="text-sm font-semibold text-gray-700 mb-1"
            >
              {field.label} ({field.unit})
            </label>
            <input
              id={field.id}
              type="number"
              name={field.id}
              value={breakdown[field.id]}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="any"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        ))}
      </div>
      
      {/* <p className="mt-3 text-xs text-gray-500 italic">
        * Values are automatically converted to numbers for API compatibility.
      </p> */}
    </div>

      <Collapsible className="rounded-xl border border-border bg-muted/20">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/40 [&[data-state=open]>svg]:rotate-180">
          Compare other scenarios
          <ChevronDown className="size-4 shrink-0 transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border px-4 pb-4 pt-2 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Energy intake to lose weight
            </h3>
            <Row
              label="Mild weight loss"
              subLabel={data.cut.mild.change}
              calories={data.cut.mild.calories}
              percent={data.cut.mild.percent}
            />
            <Row
              label="Weight loss"
              subLabel={data.cut.aggressive.change}
              calories={data.cut.aggressive.calories}
              percent={data.cut.aggressive.percent}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Maintenance
            </h3>
            <Row
              label="Maintain weight"
              subLabel=""
              calories={data.maintain.calories}
              percent={data.maintain.percent}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Energy intake to gain weight
            </h3>
            <Row
              label="Mild weight gain"
              subLabel={data.bulk.mild.change}
              calories={data.bulk.mild.calories}
              percent={data.bulk.mild.percent}
            />
            <Row
              label="Weight gain"
              subLabel={data.bulk.lean.change}
              calories={data.bulk.lean.calories}
              percent={data.bulk.lean.percent}
            />
            <Row
              label="Fast weight gain"
              subLabel={data.bulk.aggressive.change}
              calories={data.bulk.aggressive.calories}
              percent={data.bulk.aggressive.percent}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
