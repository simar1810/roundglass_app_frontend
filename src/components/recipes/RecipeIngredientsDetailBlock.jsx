"use client";

import {
	getIngredientLineTableRows,
	getRecipeIngredientsDisplayText,
	shouldShowIngredientLineTable,
} from "@/lib/recipes/recipeIngredientsDisplay";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Catalog line-item table when populated; otherwise legacy ingredients text.
 * @param {{ recipe: Record<string, unknown>, className?: string, suppressLegacyNote?: boolean }} props
 */
export default function RecipeIngredientsDetailBlock({
	recipe,
	className,
	suppressLegacyNote,
}) {
	const showTable = shouldShowIngredientLineTable(recipe);
	const rows = getIngredientLineTableRows(recipe);
	const legacy = String(recipe?.ingredients ?? "").trim();
	const combinedNote =
		!suppressLegacyNote && showTable && rows.length > 0 && legacy
			? legacy
			: "";

	if (showTable && rows.length > 0) {
		return (
			<div className={cn("space-y-3", className)}>
				<div className="rounded-md border overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="min-w-[8rem]">Ingredient</TableHead>
								<TableHead className="w-[5rem]">Code</TableHead>
								<TableHead className="w-[4rem] text-right">g</TableHead>
								<TableHead className="w-[5rem] text-right">kcal (est.)</TableHead>
								<TableHead className="w-[5rem] text-right">Protein (g)</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row, i) => (
								<TableRow key={`${row.name}-${i}`}>
									<TableCell className="font-medium text-[13px] max-w-[14rem] whitespace-normal">
										{row.name}
									</TableCell>
									<TableCell className="text-muted-foreground text-[12px]">
										{row.foodCode}
									</TableCell>
									<TableCell className="text-right tabular-nums">{row.grams}</TableCell>
									<TableCell className="text-right tabular-nums text-muted-foreground">
										{row.kcal != null ? row.kcal : "—"}
									</TableCell>
									<TableCell className="text-right tabular-nums text-muted-foreground">
										{row.protein != null ? row.protein : "—"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
				<p className="text-[11px] text-muted-foreground leading-snug">
					Per-line calories and protein are estimated from catalog values per 100 g and
					your gram amounts.
				</p>
				{combinedNote ? (
					<div>
						<p className="text-xs font-medium text-foreground mb-1">
							Additional notes (text)
						</p>
						<div className="whitespace-pre-line text-sm text-foreground leading-relaxed rounded-md border border-border/60 bg-muted/20 p-3">
							{combinedNote}
						</div>
					</div>
				) : null}
			</div>
		);
	}

	const fallback = getRecipeIngredientsDisplayText(recipe) || legacy;
	return (
		<div
			className={cn(
				"whitespace-pre-line text-foreground leading-relaxed",
				className,
			)}
		>
			{fallback || "—"}
		</div>
	);
}
