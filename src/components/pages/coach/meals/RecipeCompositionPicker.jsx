"use client";

import FormControl from "@/components/FormControl";
import { IngredientCatalogSearch } from "@/components/pages/coach/meals/IngredientPicker";
import MealCatalogSearch from "@/components/pages/coach/meals/MealCatalogSearch";
import { Button } from "@/components/ui/button";
import { Beaker, Database, UtensilsCrossed, X } from "lucide-react";
import { useState } from "react";

function normalizeDishId(dish) {
	const id = dish?._id?.$oid ?? dish?._id;
	return id != null ? String(id) : "";
}

function defaultMealGrams(meal) {
	const g = Number(meal?.default_measure?.grams);
	if (Number.isFinite(g) && g > 0) return g;
	return 100;
}

function CompositionLineRow({ label, sublabel, grams, onGramsChange, onReplace, onRemove, disabled }) {
	return (
		<div className="flex flex-wrap items-end gap-2 rounded-lg border border-border/80 bg-muted/20 p-2.5">
			<div className="min-w-0 flex-1">
				<p className="truncate text-[13px] font-medium leading-tight">{label}</p>
				{sublabel ? (
					<p className="truncate text-[11px] text-muted-foreground">{sublabel}</p>
				) : null}
				<Button
					type="button"
					variant="link"
					className="h-auto p-0 text-[12px] text-[var(--accent-1)]"
					disabled={disabled}
					onClick={onReplace}
				>
					Change
				</Button>
			</div>
			<div className="flex items-center gap-1.5">
				<FormControl
					className="w-[5.5rem] [&_.label]:sr-only"
					label="Grams"
					type="number"
					placeholder="g"
					min={1}
					step={1}
					value={String(grams ?? "")}
					onChange={(e) => {
						const n = parseFloat(e.target.value);
						onGramsChange(Number.isFinite(n) && n > 0 ? n : 0);
					}}
					disabled={disabled}
				/>
				<span className="pb-2 text-[12px] text-muted-foreground">g</span>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="shrink-0 text-muted-foreground hover:text-destructive"
					disabled={disabled}
					onClick={onRemove}
					aria-label="Remove"
				>
					<X className="size-4" />
				</Button>
			</div>
		</div>
	);
}

/**
 * Recipe builder: catalog ingredients + meals from meal DB, single inline picker panel.
 */
export default function RecipeCompositionPicker({
	ingredientLineItems,
	mealLineItems,
	onIngredientsChange,
	onMealsChange,
	disabled,
}) {
	const [picker, setPicker] = useState(null);
	const [replaceTarget, setReplaceTarget] = useState(null);

	const activePicker = replaceTarget?.type ?? picker;

	function closePicker() {
		setPicker(null);
		setReplaceTarget(null);
	}

	function handleIngredientPick(ing) {
		const row = {
			ingredientId: String(ing._id),
			quantityGrams: 100,
			foodName: ing.foodName,
			foodCode: ing.foodCode,
		};
		if (replaceTarget?.type === "ingredient") {
			const next = [...ingredientLineItems];
			next[replaceTarget.index] = row;
			onIngredientsChange(next);
		} else {
			onIngredientsChange([...ingredientLineItems, row]);
		}
		closePicker();
	}

	function handleMealPick(meal) {
		const row = {
			dishId: normalizeDishId(meal),
			quantityGrams: defaultMealGrams(meal),
			dishName: meal.dish_name || meal.title || "",
		};
		if (replaceTarget?.type === "meal") {
			const next = [...mealLineItems];
			next[replaceTarget.index] = row;
			onMealsChange(next);
		} else {
			onMealsChange([...mealLineItems, row]);
		}
		closePicker();
	}

	const pickerTitle =
		activePicker === "ingredient"
			? replaceTarget
				? "Replace ingredient"
				: "Add ingredient from catalog"
			: activePicker === "meal"
				? replaceTarget
					? "Replace meal"
					: "Add meal from database"
				: null;

	return (
		<div className="space-y-4">
			<p className="text-xs text-muted-foreground leading-snug">
				Combine <strong>ingredients</strong> and <strong>meals</strong> from the
				meal database. Nutrition is calculated automatically when you
				save.
			</p>

			{ingredientLineItems.length > 0 && (
				<div className="space-y-2">
					<p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--dark-1)]/50 flex items-center gap-1.5">
						<Beaker className="size-3.5" />
						Ingredients
					</p>
					{ingredientLineItems.map((row, index) => (
						<CompositionLineRow
							key={`ing-${row.ingredientId}-${index}`}
							label={row.foodName || `Ingredient ${index + 1}`}
							sublabel={row.foodCode ? `Code: ${row.foodCode}` : "Catalog ingredient"}
							grams={row.quantityGrams}
							onGramsChange={(grams) => {
								const next = [...ingredientLineItems];
								next[index] = { ...row, quantityGrams: grams };
								onIngredientsChange(next);
							}}
							onReplace={() => {
								setPicker(null);
								setReplaceTarget({ type: "ingredient", index });
							}}
							onRemove={() =>
								onIngredientsChange(ingredientLineItems.filter((_, i) => i !== index))
							}
							disabled={disabled}
						/>
					))}
				</div>
			)}

			{mealLineItems.length > 0 && (
				<div className="space-y-2">
					<p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--dark-1)]/50 flex items-center gap-1.5">
						<UtensilsCrossed className="size-3.5" />
						Meals from database
					</p>
					{mealLineItems.map((row, index) => (
						<CompositionLineRow
							key={`meal-${row.dishId}-${index}`}
							label={row.dishName || `Meal ${index + 1}`}
							sublabel="Meal database"
							grams={row.quantityGrams}
							onGramsChange={(grams) => {
								const next = [...mealLineItems];
								next[index] = { ...row, quantityGrams: grams };
								onMealsChange(next);
							}}
							onReplace={() => {
								setPicker(null);
								setReplaceTarget({ type: "meal", index });
							}}
							onRemove={() =>
								onMealsChange(mealLineItems.filter((_, i) => i !== index))
							}
							disabled={disabled}
						/>
					))}
				</div>
			)}

			{!activePicker && (
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="gap-1.5"
						disabled={disabled}
						onClick={() => {
							setReplaceTarget(null);
							setPicker("ingredient");
						}}
					>
						<Beaker className="size-3.5" />
						Add ingredient
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="gap-1.5"
						disabled={disabled}
						onClick={() => {
							setReplaceTarget(null);
							setPicker("meal");
						}}
					>
						<Database className="size-3.5" />
						Add meal from DB
					</Button>
				</div>
			)}

			{activePicker && (
				<div
					className="overflow-hidden rounded-xl border border-[var(--accent-1)]/25 bg-white shadow-sm"
					onWheel={(e) => e.stopPropagation()}
				>
					<div className="flex items-center justify-between gap-2 border-b border-border/60 bg-[var(--comp-1)]/50 px-3 py-2">
						<p className="text-sm font-medium">{pickerTitle}</p>
						<Button type="button" variant="ghost" size="sm" onClick={closePicker}>
							Close
						</Button>
					</div>
					<div className="p-3">
						{activePicker === "ingredient" ? (
							<IngredientCatalogSearch onSelect={handleIngredientPick} />
						) : (
							<MealCatalogSearch onSelect={handleMealPick} />
						)}
					</div>
				</div>
			)}

			{ingredientLineItems.length === 0 && mealLineItems.length === 0 && !activePicker && (
				<p className="text-center text-sm italic text-muted-foreground py-4 rounded-lg border border-dashed">
					Add at least one ingredient or meal to calculate nutrition.
				</p>
			)}
		</div>
	);
}
