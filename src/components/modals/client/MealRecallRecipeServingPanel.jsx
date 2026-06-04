"use client";

import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { buildRecipeMealRecallRow } from "@/lib/mealRecallNutrition";
import {
	applyDefaultServingNutrition,
	buildPer100gSnapshot,
	extractPer100gNutrition,
	formatServingSizeLabel,
	normalizeRecipeForMealPlan,
	scaleNutritionFromPer100g,
} from "@/lib/nutrition/per100g";
import { checkArray } from "@/lib/formatter";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

function ServingQuantityInput({ quantity, onCommit }) {
	const [draft, setDraft] = useState(() => String(quantity ?? 1));

	useEffect(() => {
		setDraft(String(quantity ?? 1));
	}, [quantity]);

	return (
		<input
			type="text"
			inputMode="decimal"
			autoComplete="off"
			aria-label="Serving quantity"
			className="w-[5.5rem] min-w-[5.5rem] px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]/30"
			value={draft}
			onChange={(e) => {
				const v = e.target.value;
				if (v === "" || /^\d*\.?\d*$/.test(v)) {
					setDraft(v);
					if (v !== "" && v !== ".") {
						const n = parseFloat(v);
						if (Number.isFinite(n) && n > 0) onCommit(n);
					}
				}
			}}
			onBlur={() => {
				const n = parseFloat(draft);
				const q = Number.isFinite(n) && n > 0 ? n : 1;
				setDraft(String(q));
				onCommit(q);
			}}
		/>
	);
}

export default function MealRecallRecipeServingPanel({
	recipe,
	initialMeal,
	mealTypes,
	onConfirm,
	onCancel,
	confirmLabel = "Add meal",
}) {
	const baseNutritionRef = useRef(extractPer100gNutrition(recipe));
	const [formData, setFormData] = useState(() =>
		buildFormFromRecipe(recipe, initialMeal)
	);

	useEffect(() => {
		if (!recipe) return;
		setFormData(buildFormFromRecipe(recipe, initialMeal));
		const normalized = normalizeRecipeForMealPlan(recipe);
		const servingState = applyDefaultServingNutrition(normalized);
		baseNutritionRef.current = extractPer100gNutrition({
			...normalized,
			per_100g: servingState.per_100g,
		});
	}, [recipe, initialMeal]);

	const backendMeasures = Array.isArray(formData?.measures)
		? formData.measures
		: [];

	const previewNutrition = useMemo(
		() => ({
			calories: formData.calories,
			protein: formData.protein,
			carbohydrates: formData.carbohydrates,
			fats: formData.fats,
		}),
		[formData.calories, formData.protein, formData.carbohydrates, formData.fats]
	);

	function onMeasureChange(measureName, qty = formData.quantity || 1) {
		const m = backendMeasures.find((x) => x.name === measureName);
		if (!m) return;

		const quantity = qty > 0 ? qty : 1;
		const totalGrams = m.grams * quantity;
		const scaled = scaleNutritionFromPer100g(
			baseNutritionRef.current,
			totalGrams
		);

		setFormData((prev) => ({
			...prev,
			quantity,
			selected_measure_name: m.name,
			serving_size: `${quantity} ${m.name} (${totalGrams}g)`,
			calories: scaled.calories,
			protein: scaled.protein,
			carbohydrates: scaled.carbohydrates,
			fats: scaled.fats,
		}));
	}

	function updateQuantity(qty) {
		const q =
			typeof qty === "number" && Number.isFinite(qty) && qty > 0 ? qty : 1;
		const measure =
			formData.selected_measure_name || formData.default_measure?.name || "";
		const hasBackendMeasure = backendMeasures.some(
			(item) => item.name === measure
		);

		if (hasBackendMeasure) {
			onMeasureChange(measure, q);
			return;
		}

		setFormData((prev) => ({
			...prev,
			quantity: q,
			serving_size: formatServingSizeLabel({ ...prev, quantity: q }),
		}));
	}

	function handleConfirm() {
		if (!formData.mealType?.trim()) return;

		const row = buildRecipeMealRecallRow(
			{
				...formData,
				per_100g: formData.per_100g || buildPer100gSnapshot(formData),
				serving_size: formatServingSizeLabel(formData),
			},
			{
				mealType: formData.mealType,
				location: formData.location,
				comments: formData.comments,
			}
		);
		onConfirm?.(row);
	}

	if (!recipe) return null;

	const imageSrc =
		formData.image && String(formData.image).startsWith("http")
			? formData.image
			: null;

	return (
		<div className="text-left space-y-4">
			<div className="flex items-start gap-3">
				{imageSrc && (
					<div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
						<Image
							src={imageSrc}
							alt={formData.dish_name || "Meal"}
							fill
							className="object-cover"
						/>
					</div>
				)}
				<div>
					<p className="font-semibold text-sm">
						{formData.dish_name || formData.title || "Selected meal"}
					</p>
					<p className="text-xs text-muted-foreground mt-1">
						Adjust serving size — macros update automatically.
					</p>
				</div>
			</div>

			<Select
				value={formData.mealType}
				onValueChange={(value) =>
					setFormData((prev) => ({ ...prev, mealType: value }))
				}
			>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Select meal type *" />
				</SelectTrigger>
				<SelectContent>
					{mealTypes.map((type) => (
						<SelectItem key={type} value={type}>
							{type}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<div>
				<label className="text-sm font-medium mb-2 block">Serving size</label>
				<div className="flex gap-2 items-center flex-wrap">
					<ServingQuantityInput
						quantity={formData.quantity ?? 1}
						onCommit={updateQuantity}
					/>
					{backendMeasures.length ? (
						<Select
							value={
								formData.selected_measure_name ||
								formData.default_measure?.name
							}
							onValueChange={(value) =>
								onMeasureChange(value, formData.quantity || 1)
							}
						>
							<SelectTrigger className="min-w-[180px]">
								<SelectValue placeholder="Select measure" />
							</SelectTrigger>
							<SelectContent>
								{backendMeasures.map((option) => (
									<SelectItem key={option.name} value={option.name}>
										{option.name}
										{option.grams != null ? ` (${option.grams}g)` : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : (
						<FormControl
							placeholder="Measure (e.g. cup, bowl)"
							value={formData.selected_measure_name || ""}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									selected_measure_name: e.target.value,
								}))
							}
						/>
					)}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 rounded-lg border bg-slate-50/80 p-3 text-xs">
				{[
					{ label: "Calories", value: previewNutrition.calories, unit: "kcal" },
					{ label: "Protein", value: previewNutrition.protein, unit: "g" },
					{ label: "Carbs", value: previewNutrition.carbohydrates, unit: "g" },
					{ label: "Fats", value: previewNutrition.fats, unit: "g" },
				].map((stat) => (
					<div key={stat.label}>
						<span className="text-slate-500 font-medium">{stat.label}</span>
						<p className="font-bold text-slate-800">
							{stat.value || "—"}
							{stat.value ? (
								<span className="font-normal text-slate-500 ml-0.5">
									{stat.unit}
								</span>
							) : null}
						</p>
					</div>
				))}
			</div>

			<FormControl
				placeholder="Location (optional)"
				value={formData.location || ""}
				onChange={(e) =>
					setFormData((prev) => ({ ...prev, location: e.target.value }))
				}
			/>
			<Textarea
				placeholder="Comments (optional)"
				value={formData.comments || ""}
				onChange={(e) =>
					setFormData((prev) => ({ ...prev, comments: e.target.value }))
				}
				className="min-h-[60px]"
			/>

			<div className="flex gap-2 pt-1">
				{onCancel && (
					<Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button
					variant="wz"
					className="flex-1"
					onClick={handleConfirm}
					disabled={!formData.mealType?.trim()}
				>
					{confirmLabel}
				</Button>
			</div>
		</div>
	);
}

function buildFormFromRecipe(recipe, initialMeal) {
	const normalized = normalizeRecipeForMealPlan(recipe || {});
	const servingState = applyDefaultServingNutrition(normalized);
	const merged = { ...normalized, ...servingState };

	return {
		...merged,
		mealType: initialMeal?.mealType || "",
		location: initialMeal?.location || "",
		comments: initialMeal?.comments || "",
		measures: checkArray(merged.measures),
	};
}
