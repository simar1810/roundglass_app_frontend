"use client";

import Loader from "@/components/common/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useDebounce from "@/hooks/useDebounce";
import { fetchData } from "@/lib/api";
import { getServingNutrition, formatServingSizeLabel } from "@/lib/nutrition/per100g";
import { cn } from "@/lib/utils";
import { Flame, Search } from "lucide-react";
import { useEffect, useState } from "react";
import useSWR from "swr";

const MIN_QUERY = 2;

function mealSearchKey(query, skip) {
	const q = query.trim();
	if (q.length < MIN_QUERY) return ["meal-catalog-popular", skip];
	return ["meal-catalog-search", q, skip];
}

function fetchMeals(query, skip) {
	const q = query.trim();
	if (q.length < MIN_QUERY) {
		return fetchData(
			`app/mostSearchedRecipes?person=coach${skip ? `&skip=${skip}` : ""}`,
		);
	}
	return fetchData(`app/recipees?query=${encodeURIComponent(q)}`);
}

/**
 * Inline search for dishes/meals from the meal database (for recipe composition).
 */
export default function MealCatalogSearch({ onSelect, className }) {
	const [query, setQuery] = useState("");
	const [skip, setSkip] = useState(0);
	const debouncedQ = useDebounce(query, 300);

	useEffect(() => {
		setSkip(0);
	}, [debouncedQ]);

	const { data, isLoading, error } = useSWR(
		mealSearchKey(debouncedQ, skip),
		() => fetchMeals(debouncedQ, skip),
		{ keepPreviousData: true, revalidateOnFocus: false },
	);

	const meals = data?.status_code === 200 ? data?.data || [] : [];
	const showHint = query.trim().length > 0 && query.trim().length < MIN_QUERY;
	const showLoader = isLoading && meals.length === 0;

	return (
		<div className={cn("flex flex-col gap-3", className)}>
			<div className="relative">
				<Search
					className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
					aria-hidden
				/>
				<Input
					className="pl-9"
					placeholder="Search meals (min 2 characters)…"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					autoFocus
				/>
			</div>
			<p className="text-[11px] text-muted-foreground leading-snug">
				{showHint
					? `Type at least ${MIN_QUERY} characters to search, or clear the box to browse popular meals.`
					: debouncedQ.trim().length < MIN_QUERY
						? "Popular meals from the database — click one to add."
						: "Search results from the meal database."}
			</p>
			<div
				className="min-h-[10rem] max-h-[min(40vh,260px)] overflow-y-auto overscroll-y-contain rounded-md border border-border/60 bg-white"
				onWheel={(e) => e.stopPropagation()}
			>
				{showLoader ? (
					<div className="flex min-h-[10rem] items-center justify-center">
						<Loader />
					</div>
				) : null}
				{!showLoader && error ? (
					<p className="p-4 text-center text-sm text-destructive">
						{error.message || "Could not load meals."}
					</p>
				) : null}
				{!showLoader && !error && meals.length === 0 ? (
					<p className="p-4 text-center text-sm text-muted-foreground">
						No meals found. Try another search term.
					</p>
				) : null}
				{!showLoader && meals.length > 0 ? (
					<ul className="divide-y divide-border/60">
						{meals.map((meal) => {
							const id = meal?._id?.$oid || meal?._id;
							const nutrition = getServingNutrition(meal);
							return (
								<li key={String(id)}>
									<button
										type="button"
										className="flex w-full flex-col items-start gap-1 px-3 py-2.5 text-left transition-colors hover:bg-[var(--accent-1)]/8"
										onClick={() => onSelect?.(meal)}
									>
										<span className="text-[13px] font-medium text-[var(--dark-1)]">
											{meal.dish_name || meal.title || "Meal"}
										</span>
										<span className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
											<span>{formatServingSizeLabel(meal)}</span>
											{nutrition.calories ? (
												<span className="inline-flex items-center gap-0.5">
													<Flame className="size-3 text-[var(--accent-1)]" />
													{nutrition.calories} kcal
												</span>
											) : null}
										</span>
									</button>
								</li>
							);
						})}
					</ul>
				) : null}
			</div>
			{debouncedQ.trim().length >= MIN_QUERY && meals.length >= 20 ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-full"
					disabled={isLoading}
					onClick={() => setSkip((s) => s + 20)}
				>
					Load more
				</Button>
			) : null}
		</div>
	);
}
