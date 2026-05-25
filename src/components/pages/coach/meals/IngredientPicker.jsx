"use client";

import FormControl from "@/components/FormControl";
import Loader from "@/components/common/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useIngredientCatalogSearch from "@/hooks/useIngredientCatalogSearch";
import {
	filterIngredientsBySource,
	INGREDIENT_SOURCE_TABS,
} from "@/lib/ingredients/ingredientSource";
import { INGREDIENTS_CATALOG_KEY } from "@/lib/swr/revalidateIngredientCatalogCaches";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

function IngredientSourceTabs({ value, onChange }) {
	return (
		<div
			className="flex gap-4 border-b border-border/60"
			role="tablist"
			aria-label="Ingredient source"
		>
			{INGREDIENT_SOURCE_TABS.map((tab) => (
				<button
					key={tab.value}
					type="button"
					role="tab"
					aria-selected={value === tab.value}
					onClick={() => onChange(tab.value)}
					className={cn(
						"pb-2 text-xs font-medium transition-colors -mb-px",
						value === tab.value
							? "border-b-2 border-[var(--accent-1)] text-[var(--accent-1)] font-semibold"
							: "text-[var(--dark-1)]/50 hover:text-[var(--dark-1)]",
					)}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}

/**
 * Debounced catalog search + pagination. Picks an ingredient from API `data[]`.
 * @param {{ onSelect: (ingredient: Record<string, unknown>) => void, className?: string }} props
 */
export function IngredientCatalogSearch({ onSelect, className }) {
	const { _id: coachId } = useAppSelector((state) => state.coach.data);
	const [sourceFilter, setSourceFilter] = useState("all");
	const {
		query,
		setQuery,
		category,
		setCategory,
		skip,
		rows,
		data,
		isLoading,
		isValidating,
		error,
		canLoadMore,
		loadMore,
	} = useIngredientCatalogSearch({
		namespace: INGREDIENTS_CATALOG_KEY,
		pageSize: 50,
	});

	const displayRows = useMemo(
		() => filterIngredientsBySource(rows, coachId, sourceFilter),
		[rows, coachId, sourceFilter],
	);

	const requestOk =
		!error &&
		Boolean(data) &&
		(data.status_code === 200 ||
			data.status_code === "200" ||
			data.success === true);
	const showInitialLoader = isLoading && skip === 0 && rows.length === 0;

	return (
		<div className={cn("flex flex-col gap-3 p-3", className)}>
			<div className="relative">
				<Search
					className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
					aria-hidden
				/>
				<Input
					className="pl-9"
					placeholder="Search ingredients…"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					aria-label="Search ingredients"
				/>
			</div>
			<IngredientSourceTabs value={sourceFilter} onChange={setSourceFilter} />
			<div>
				<p className="mb-1 text-[11px] text-muted-foreground">Category (optional)</p>
				<Input
					className="h-9 text-[13px]"
					placeholder="Filter by category"
					value={category}
					onChange={(e) => setCategory(e.target.value)}
					aria-label="Filter by category"
				/>
			</div>
			<div
				className="min-h-[10rem] max-h-[min(45vh,280px)] overflow-y-auto overscroll-y-contain rounded-md border border-border/60 bg-white"
				onWheel={(e) => e.stopPropagation()}
			>
				{showInitialLoader ? (
					<div className="flex min-h-[10rem] items-center justify-center">
						<Loader />
					</div>
				) : null}
				{!showInitialLoader && !requestOk ? (
					<p className="p-4 text-center text-sm text-destructive">
						{error?.message || data?.message || "Could not load ingredients."}
					</p>
				) : null}
				{!showInitialLoader && requestOk && displayRows.length === 0 ? (
					<p className="p-4 text-center text-sm text-muted-foreground">
						{rows.length > 0
							? "No ingredients in this tab. Try All or load more."
							: "No ingredients match. Try another search."}
					</p>
				) : null}
				{!showInitialLoader && displayRows.length > 0 ? (
					<ul className="divide-y divide-border/60">
						{displayRows.map((item) => (
							<li key={String(item._id)}>
								<button
									type="button"
									className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-[var(--accent-1)]/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-1)]/40"
									onClick={() => onSelect(item)}
								>
									<span className="font-medium leading-tight text-[var(--dark-1)]">
										{item.foodName || "—"}
									</span>
									<span className="text-[11px] text-[var(--dark-1)]/50">
										{item.foodCode != null && item.foodCode !== ""
											? `Code: ${item.foodCode}`
											: ""}
										{item.category
											? `${item.foodCode != null && item.foodCode !== "" ? " · " : ""}${item.category}`
											: ""}
									</span>
								</button>
							</li>
						))}
					</ul>
				) : null}
			</div>
			{canLoadMore && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-full"
					disabled={isLoading}
					onClick={loadMore}
				>
					{isLoading && skip > 0 ? "Loading…" : "Load more"}
				</Button>
			)}
		</div>
	);
}

/**
 * Full line-item editor: catalog rows + grams + add/remove.
 * @param {{
 *   lineItems: Array<{ ingredientId: string, quantityGrams: number, foodName?: string, foodCode?: string }>,
 *   onLineItemsChange: (next: typeof lineItems) => void,
 *   disabled?: boolean,
 * }} props
 */
export default function RecipeIngredientLineItems({
	lineItems,
	onLineItemsChange,
	disabled,
	compactHeader = false,
}) {
	const updateRow = (index, patch) => {
		const next = lineItems.map((row, i) =>
			i === index ? { ...row, ...patch } : row,
		);
		onLineItemsChange(next);
	};

	const removeRow = (index) => {
		onLineItemsChange(lineItems.filter((_, i) => i !== index));
	};

	return (
		<div className="space-y-3">
			{!compactHeader ? (
				<div>
					<p className="font-medium">Ingredients from catalog</p>
					<p className="mt-1 text-xs text-muted-foreground leading-snug">
						Add items from the nutrition catalog and set grams. When you use catalog
						lines, calories and macros are calculated on save.
					</p>
				</div>
			) : null}

			<div className="space-y-2">
				{lineItems.map((row, index) => (
					<CatalogLineRow
						key={`${row.ingredientId}-${index}`}
						row={row}
						onGramsChange={(grams) =>
							updateRow(index, { quantityGrams: grams })
						}
						onReplaceIngredient={(ing) =>
							updateRow(index, {
								ingredientId: String(ing._id),
								foodName: ing.foodName,
								foodCode: ing.foodCode,
								quantityGrams: row.quantityGrams || 100,
							})
						}
						onRemove={() => removeRow(index)}
						disabled={disabled}
					/>
				))}
			</div>

			<IngredientCatalogPicker
				disabled={disabled}
				onPick={(ing) =>
					onLineItemsChange([
						...lineItems,
						{
							ingredientId: String(ing._id),
							quantityGrams: 100,
							foodName: ing.foodName,
							foodCode: ing.foodCode,
						},
					])
				}
			/>
		</div>
	);
}

/** Inline catalog picker — avoids popover stacking under modal dialogs. */
function IngredientCatalogPicker({ onPick, disabled, triggerLabel = "Add ingredient from catalog" }) {
	const [open, setOpen] = useState(false);

	return (
		<div className="space-y-2">
			<Button
				type="button"
				variant="outline"
				className="w-full border-dashed border-[var(--accent-1)]/40 text-[13px]"
				disabled={disabled}
				onClick={() => setOpen((prev) => !prev)}
				aria-expanded={open}
			>
				<Plus className={cn("mr-2 size-4 shrink-0 transition-transform", open && "rotate-45")} aria-hidden />
				{open ? "Hide ingredient catalog" : triggerLabel}
			</Button>
			{open ? (
				<div
					className="overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm"
					onWheel={(e) => e.stopPropagation()}
				>
					<IngredientCatalogSearch
						onSelect={(ing) => {
							onPick(ing);
							setOpen(false);
						}}
					/>
				</div>
			) : null}
		</div>
	);
}

function CatalogLineRow({
	row,
	onGramsChange,
	onReplaceIngredient,
	onRemove,
	disabled,
}) {
	const [open, setOpen] = useState(false);
	const label =
		row.foodName ||
		(row.ingredientId ? `Ingredient ${row.ingredientId.slice(0, 8)}…` : "—");

	return (
		<div className="flex flex-wrap items-end gap-2 rounded-lg border border-border/80 bg-muted/20 p-2">
			<div className="min-w-0 flex-1 space-y-1">
				<p className="truncate text-[13px] font-medium leading-tight">{label}</p>
				{row.foodCode != null && row.foodCode !== "" ? (
					<p className="truncate text-[11px] text-muted-foreground">
						Code: {row.foodCode}
					</p>
				) : null}
				<Button
					type="button"
					variant="link"
					className="h-auto p-0 text-[12px] text-[var(--accent-1)]"
					disabled={disabled}
					onClick={() => setOpen((prev) => !prev)}
					aria-expanded={open}
				>
					{open ? "Cancel change" : "Change ingredient"}
				</Button>
				{open ? (
					<div
						className="mt-2 overflow-hidden rounded-lg border border-border/60 bg-white"
						onWheel={(e) => e.stopPropagation()}
					>
						<IngredientCatalogSearch
							onSelect={(ing) => {
								onReplaceIngredient(ing);
								setOpen(false);
							}}
						/>
					</div>
				) : null}
			</div>
			<div className="flex items-center gap-1.5">
				<FormControl
					className="w-[5.5rem] [&_.label]:sr-only"
					label="Grams"
					type="number"
					placeholder="g"
					min={1}
					step={1}
					value={String(row.quantityGrams ?? "")}
					onChange={(e) => {
						const v = e.target.value;
						const n = parseFloat(v);
						if (v === "" || Number.isNaN(n)) {
							onGramsChange(0);
							return;
						}
						onGramsChange(n);
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
					aria-label="Remove ingredient row"
				>
					<X className="size-4" />
				</Button>
			</div>
		</div>
	);
}
