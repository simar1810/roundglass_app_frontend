"use client";

import ContentLoader from "@/components/common/ContentLoader";
import FeatureDisabled from "@/components/common/error/FeatureDisabled";
import FormControl from "@/components/FormControl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFeatureScope } from "@/hooks/useFeatureScope";
import useIngredientCatalogSearch from "@/hooks/useIngredientCatalogSearch";
import {
	createIngredient,
	deleteIngredient,
	updateIngredient,
} from "@/lib/fetchers/app";
import {
	buildIngredientMutationBody,
	emptyIngredientForm,
	hasAtLeastOneNutritionValue,
	ingredientToFormValues,
} from "@/lib/ingredients/catalogForm";
import {
	getIngredientMutationErrorMessage,
	getIngredientMutationSuccessMessage,
} from "@/lib/ingredients/catalogMutations";
import {
	INGREDIENTS_ADMIN_KEY,
	revalidateIngredientCatalogCaches,
} from "@/lib/swr/revalidateIngredientCatalogCaches";
import { parseMeasurementWithUncertainty } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import {
	Eye,
	Pencil,
	Plus,
	Search,
	Trash2,
	UtensilsCrossed,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const TYPE_TABS = [
	{ value: "all", label: "All" },
	{ value: "admin", label: "Admin" },
	{ value: "manual", label: "Manual" },
];

function isCoachOwnedIngredient(row, coachId) {
	if (!coachId || row?.coach == null) return false;
	return String(row.coach) === String(coachId);
}

function formatNutritionValue(value) {
	if (value == null || value === "") return "—";
	const parsed = parseMeasurementWithUncertainty(value);
	if (parsed?.number != null) return String(parsed.number);
	return String(value);
}

function DetailRow({ label, value }) {
	return (
		<div className="flex items-start justify-between gap-4 border-b border-border/50 py-2.5 last:border-0">
			<span className="shrink-0 text-sm text-[var(--dark-1)]/55">{label}</span>
			<span className="text-right text-sm font-medium text-[var(--dark-1)]">
				{value}
			</span>
		</div>
	);
}

function IngredientDetailsDialog({
	ingredient,
	coachId,
	open,
	onOpenChange,
	canManage,
	onEdit,
}) {
	if (!ingredient) return null;

	const mine = isCoachOwnedIngredient(ingredient, coachId);
	const fiberTotal =
		ingredient.dietaryFibre &&
		typeof ingredient.dietaryFibre === "object" &&
		ingredient.dietaryFibre.total != null
			? formatNutritionValue(ingredient.dietaryFibre.total)
			: "—";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="pr-6">
						{ingredient.foodName || "Ingredient details"}
					</DialogTitle>
				</DialogHeader>

				<div className="mb-4 flex flex-wrap items-center gap-2">
					{mine ? (
						<Badge
							variant="outline"
							className="border-[var(--accent-1)]/40 text-[var(--accent-1)]"
						>
							Manual
						</Badge>
					) : (
						<Badge variant="wz">Admin</Badge>
					)}
				</div>

				<div className="rounded-lg border border-border/60 bg-[var(--comp-1)]/30 px-3">
					<DetailRow label="Food code" value={ingredient.foodCode ?? "—"} />
					<DetailRow label="Category" value={ingredient.category ?? "—"} />
					<DetailRow
						label="Regions"
						value={
							ingredient.noOfRegions != null
								? String(ingredient.noOfRegions)
								: "—"
						}
					/>
				</div>

				<p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--dark-1)]/45">
					Nutrition per 100 g
				</p>
				<div className="rounded-lg border border-border/60 bg-white px-3">
					<DetailRow label="Moisture (g)" value={formatNutritionValue(ingredient.moisture)} />
					<DetailRow label="Protein (g)" value={formatNutritionValue(ingredient.protein)} />
					<DetailRow label="Ash (g)" value={formatNutritionValue(ingredient.ash)} />
					<DetailRow label="Total fat (g)" value={formatNutritionValue(ingredient.totalFat)} />
					<DetailRow
						label="Carbohydrate (g)"
						value={formatNutritionValue(ingredient.carbohydrate)}
					/>
					<DetailRow label="Energy (kJ)" value={formatNutritionValue(ingredient.energyKJ)} />
					<DetailRow label="Fibre total (g)" value={fiberTotal} />
				</div>

				<DialogFooter className="mt-4 gap-2 sm:gap-0">
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
					{canManage && mine ? (
						<Button
							type="button"
							variant="wz"
							onClick={() => {
								onOpenChange(false);
								onEdit(ingredient);
							}}
						>
							Edit
						</Button>
					) : null}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function TypeTabs({ value, onChange }) {
	return (
		<div
			className="flex gap-6 border-b border-border/60"
			role="tablist"
			aria-label="Ingredient source"
		>
			{TYPE_TABS.map((tab) => (
				<button
					key={tab.value}
					type="button"
					role="tab"
					aria-selected={value === tab.value}
					onClick={() => onChange(tab.value)}
					className={cn(
						"pb-3 text-sm font-medium transition-colors -mb-px",
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

function IngredientRow({ row, coachId, canManage, onView, onEdit, onDelete }) {
	const mine = isCoachOwnedIngredient(row, coachId);
	const initial = (row.foodName || row.foodCode || "?").charAt(0).toUpperCase();

	return (
		<li className="group flex flex-col gap-3 rounded-xl border border-border/70 bg-white p-4 shadow-sm transition-shadow hover:border-[var(--accent-1)]/35 hover:shadow-md sm:flex-row sm:items-center sm:gap-4">
			<div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
				<div
					className={cn(
						"flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
						mine
							? "bg-[var(--accent-1)]/15 text-[var(--accent-1)]"
							: "bg-[var(--comp-1)] text-[var(--dark-1)]/70",
					)}
					aria-hidden
				>
					{initial}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<p className="truncate text-base font-semibold text-[var(--dark-1)]">
							{row.foodName || "Unnamed ingredient"}
						</p>
						{mine ? (
							<Badge
								variant="outline"
								className="shrink-0 border-[var(--accent-1)]/40 text-[10px] text-[var(--accent-1)]"
							>
								Manual
							</Badge>
						) : (
							<Badge variant="wz" className="shrink-0 text-[10px]">
								Admin
							</Badge>
						)}
					</div>
					<p className="mt-0.5 truncate text-xs text-[var(--dark-1)]/50">
						{row.foodCode ? `Code ${row.foodCode}` : "No code"}
						{row.category ? ` · ${row.category}` : ""}
					</p>
				</div>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-6">
				<div className="flex gap-5 text-xs sm:text-sm">
					<div>
						<p className="text-[10px] font-medium uppercase tracking-wide text-[var(--dark-1)]/40">
							Protein
						</p>
						<p className="mt-0.5 font-semibold tabular-nums text-[var(--dark-1)]">
							{row.protein != null ? `${row.protein} g` : "—"}
							<span className="font-normal text-[var(--dark-1)]/45"> /100g</span>
						</p>
					</div>
					{row.energyKJ != null && (
						<div className="hidden sm:block">
							<p className="text-[10px] font-medium uppercase tracking-wide text-[var(--dark-1)]/40">
								Energy
							</p>
							<p className="mt-0.5 font-semibold tabular-nums text-[var(--dark-1)]">
								{row.energyKJ}
								<span className="font-normal text-[var(--dark-1)]/45"> kJ</span>
							</p>
						</div>
					)}
				</div>

				<div className="flex shrink-0 flex-wrap gap-1">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-8 gap-1.5 border-[var(--accent-1)]/30 text-[var(--accent-1)] hover:bg-[var(--accent-1)]/10"
						onClick={() => onView(row)}
					>
						<Eye className="size-3.5" />
						View details
					</Button>
					{canManage && mine ? (
						<>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="h-8 gap-1.5 border-[var(--accent-1)]/30 text-[var(--accent-1)] hover:bg-[var(--accent-1)]/10"
								onClick={() => onEdit(row)}
							>
								<Pencil className="size-3.5" />
								Edit
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="h-8 gap-1.5 text-destructive hover:bg-destructive/10"
								onClick={() => onDelete(row)}
							>
								<Trash2 className="size-3.5" />
								Delete
							</Button>
						</>
					) : null}
				</div>
			</div>
		</li>
	);
}

function EmptyState({ title, description, action }) {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--accent-1)]/25 bg-[var(--comp-1)]/25 px-6 py-16 text-center">
			<div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--accent-1)]/10 text-[var(--accent-1)]">
				<UtensilsCrossed className="size-7" aria-hidden />
			</div>
			<p className="text-base font-semibold text-[var(--dark-1)]">{title}</p>
			<p className="mt-1 max-w-sm text-sm text-[var(--dark-1)]/55">{description}</p>
			{action ? <div className="mt-6">{action}</div> : null}
		</div>
	);
}

export default function IngredientsCatalogPage() {
	const { hasAccess } = useFeatureScope("meal_plans:manage");
	if (!hasAccess) return <FeatureDisabled />;

	return <IngredientsCatalogContainer />;
}

function IngredientsCatalogContainer() {
	const { _id: coachId } = useAppSelector((state) => state.coach.data);
	const { hasAccess: canManage } = useFeatureScope("ingredients:manage");
	const {
		query,
		setQuery,
		category,
		setCategory,
		skip,
		rows,
		data,
		isLoading,
		error,
		canLoadMore,
		loadMore,
		reset,
	} = useIngredientCatalogSearch({
		namespace: INGREDIENTS_ADMIN_KEY,
		pageSize: 50,
	});

	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState("create");
	const [editingId, setEditingId] = useState(null);
	const [form, setForm] = useState(emptyIngredientForm);
	const [saving, setSaving] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [deleting, setDeleting] = useState(false);
	const [typeFilter, setTypeFilter] = useState("all");
	const [viewTarget, setViewTarget] = useState(null);

	const displayRows = useMemo(() => {
		return rows.filter((row) => {
			const manual = isCoachOwnedIngredient(row, coachId);
			if (typeFilter === "all") return true;
			if (typeFilter === "admin") return !manual;
			if (typeFilter === "manual") return manual;
			return true;
		});
	}, [rows, coachId, typeFilter]);

	function openCreate() {
		setDialogMode("create");
		setEditingId(null);
		setForm(emptyIngredientForm());
		setDialogOpen(true);
	}

	function openEdit(row) {
		setDialogMode("edit");
		setEditingId(String(row._id));
		setForm(ingredientToFormValues(row));
		setDialogOpen(true);
	}

	async function handleSave() {
		if (saving) return;
		if (!String(form.foodCode).trim() || !String(form.foodName).trim()) {
			toast.error("Food code and name are required.");
			return;
		}
		if (dialogMode === "create" && !hasAtLeastOneNutritionValue(form)) {
			toast.error(
				"Add at least one nutrition value (e.g. protein, carbs, or energy kJ per 100 g).",
			);
			return;
		}
		try {
			setSaving(true);
			const body = buildIngredientMutationBody(form);
			const response =
				dialogMode === "create"
					? await createIngredient(body)
					: await updateIngredient(editingId, body);
			const operation = dialogMode === "create" ? "Create" : "Update";
			const errorMessage = getIngredientMutationErrorMessage(response, operation);
			if (errorMessage) {
				toast.error(errorMessage);
				return;
			}
			toast.success(getIngredientMutationSuccessMessage(response, operation));
			setDialogOpen(false);
			await revalidateIngredientCatalogCaches();
			reset();
		} catch (e) {
			toast.error(e?.message || "Something went wrong.");
		} finally {
			setSaving(false);
		}
	}

	async function handleDeleteConfirm() {
		if (deleting || !deleteTarget?._id) return;
		try {
			setDeleting(true);
			const response = await deleteIngredient(String(deleteTarget._id));
			const errorMessage = getIngredientMutationErrorMessage(response, "Delete");
			if (errorMessage) {
				toast.error(errorMessage);
				return;
			}
			toast.success(getIngredientMutationSuccessMessage(response, "Delete"));
			setDeleteTarget(null);
			await revalidateIngredientCatalogCaches();
			reset();
		} catch (e) {
			toast.error(e?.message || "Delete failed.");
		} finally {
			setDeleting(false);
		}
	}

	const hasLoadError = error || (data && data.status_code !== 200);
	const showingInitialLoad = isLoading && skip === 0;

	return (
		<div className="content-container mt-6 pb-12 md:mt-0">
			{/* Header */}
			<div className="flex flex-col gap-4 border-b border-border/60 pb-6 md:flex-row md:items-end md:justify-between">
				<div className="min-w-0">
					<h1 className="text-2xl font-bold tracking-tight text-[var(--dark-1)] md:text-3xl">
						Ingredient catalog
					</h1>
					<p className="mt-1 max-w-xl text-sm text-[var(--dark-1)]/55">
						Browse IFDB reference foods and your custom entries. Values are per
						100&nbsp;g edible portion for recipe line items.
					</p>
				</div>
				{canManage && (
					<Button variant="wz" className="h-10 shrink-0 gap-2 px-5" onClick={openCreate}>
						<Plus className="size-4" />
						Add ingredient
					</Button>
				)}
			</div>

			{/* Toolbar */}
			<div className="mt-6 space-y-4 rounded-xl border border-border/60 bg-white p-4 shadow-sm md:p-5">
				<TypeTabs value={typeFilter} onChange={setTypeFilter} />
				<div className="flex flex-col gap-3 pt-1 md:flex-row md:items-end">
					<FormControl
						className="min-w-0 flex-1 [&_.input]:bg-[var(--comp-1)]/50 [&_.input]:focus:shadow-md text-[13px]"
						placeholder="Search by name or code…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						aria-label="Search ingredients"
					/>
					<div className="relative md:w-52">
						<Search
							className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--dark-1)]/35 md:hidden"
							aria-hidden
						/>
						<Input
							className="h-[42px] border-[#D6D6D6] bg-[var(--comp-1)]/50 pl-9 md:pl-4 focus-visible:ring-[var(--accent-1)]"
							placeholder="Category"
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							aria-label="Category filter"
						/>
					</div>
				</div>
			</div>

			{/* Results */}
			<div className="mt-6">
				{showingInitialLoad ? (
					<div className="flex justify-center py-24">
						<ContentLoader />
					</div>
				) : hasLoadError ? (
					<EmptyState
						title="Could not load ingredients"
						description={
							error?.message || data?.message || "Please try again in a moment."
						}
					/>
				) : rows.length === 0 ? (
					<EmptyState
						title="No ingredients found"
						description="Try a different search or category. You can add your own ingredient if you have access."
						action={
							canManage ? (
								<Button variant="wz" className="gap-2" onClick={openCreate}>
									<Plus className="size-4" />
									Add your first ingredient
								</Button>
							) : null
						}
					/>
				) : displayRows.length === 0 ? (
					<EmptyState
						title={`No ${typeFilter === "admin" ? "admin" : "manual"} ingredients`}
						description="Switch to another tab or clear your search filters."
					/>
				) : (
					<ul className="flex flex-col gap-3">
						{displayRows.map((row) => (
							<IngredientRow
								key={String(row._id)}
								row={row}
								coachId={coachId}
								canManage={canManage}
								onView={setViewTarget}
								onEdit={openEdit}
								onDelete={setDeleteTarget}
							/>
						))}
					</ul>
				)}
			</div>

			<IngredientDetailsDialog
				ingredient={viewTarget}
				coachId={coachId}
				open={Boolean(viewTarget)}
				onOpenChange={(open) => !open && setViewTarget(null)}
				canManage={canManage}
				onEdit={openEdit}
			/>

			{canLoadMore && !showingInitialLoad && !hasLoadError ? (
				<div className="mt-6 flex justify-center">
					<Button
						type="button"
						variant="outline"
						className="min-w-[140px] border-[var(--accent-1)]/40 text-[var(--accent-1)] hover:bg-[var(--accent-1)]/8"
						disabled={isLoading}
						onClick={loadMore}
					>
						{isLoading && skip > 0 ? "Loading…" : "Load more"}
					</Button>
				</div>
			) : null}

			{canManage && (
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
						<DialogHeader>
							<DialogTitle>
								{dialogMode === "create"
									? "Add ingredient"
									: "Edit ingredient"}
							</DialogTitle>
						</DialogHeader>
						<div className="grid gap-3 py-2">
							<div className="grid gap-2">
								<Label htmlFor="foodCode">Food code *</Label>
								<Input
									id="foodCode"
									value={form.foodCode}
									onChange={(e) =>
										setForm((f) => ({ ...f, foodCode: e.target.value }))
									}
									placeholder="Unique code"
									disabled={dialogMode === "edit"}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="foodName">Food name *</Label>
								<Input
									id="foodName"
									value={form.foodName}
									onChange={(e) =>
										setForm((f) => ({ ...f, foodName: e.target.value }))
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="category">Category</Label>
								<Input
									id="category"
									value={form.category}
									onChange={(e) =>
										setForm((f) => ({ ...f, category: e.target.value }))
									}
								/>
							</div>
							<p className="rounded-lg bg-[var(--comp-1)]/60 px-3 py-2 text-xs text-[var(--dark-1)]/60">
								Nutrition per 100 g (edible portion). Add at least one value when
								creating.
							</p>
							<div className="grid grid-cols-2 gap-2">
								{[
									["moisture", "Moisture (g)"],
									["protein", "Protein (g)"],
									["ash", "Ash (g)"],
									["totalFat", "Total fat (g)"],
									["carbohydrate", "Carbohydrate (g)"],
									["energyKJ", "Energy (kJ)"],
									["fiberTotal", "Fibre total (g)"],
								].map(([field, label]) => (
									<div key={field} className="grid gap-1">
										<Label className="text-xs" htmlFor={field}>
											{label}
										</Label>
										<Input
											id={field}
											type="number"
											step="any"
											value={form[field]}
											onChange={(e) =>
												setForm((f) => ({ ...f, [field]: e.target.value }))
											}
										/>
									</div>
								))}
							</div>
							<div className="grid gap-2">
								<Label htmlFor="noOfRegions">No. of regions</Label>
								<Input
									id="noOfRegions"
									type="number"
									step="1"
									value={form.noOfRegions}
									onChange={(e) =>
										setForm((f) => ({ ...f, noOfRegions: e.target.value }))
									}
								/>
							</div>
						</div>
						<DialogFooter className="gap-2 sm:gap-0">
							<Button
								type="button"
								variant="outline"
								onClick={() => setDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="button"
								variant="wz"
								disabled={saving}
								onClick={handleSave}
							>
								{saving ? "Saving…" : "Save"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{canManage && (
				<Dialog
					open={Boolean(deleteTarget)}
					onOpenChange={(o) => !o && setDeleteTarget(null)}
				>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Delete ingredient?</DialogTitle>
						</DialogHeader>
						<p className="text-sm text-muted-foreground">
							Delete{" "}
							<span className="font-medium text-foreground">
								{deleteTarget?.foodName || deleteTarget?.foodCode}
							</span>
							? This cannot be undone. If a recipe still references it, the server
							will reject the delete.
						</p>
						<DialogFooter className="gap-2 sm:gap-0">
							<Button
								type="button"
								variant="outline"
								onClick={() => setDeleteTarget(null)}
							>
								Cancel
							</Button>
							<Button
								type="button"
								variant="destructive"
								disabled={deleting}
								onClick={handleDeleteConfirm}
							>
								{deleting ? "Deleting…" : "Delete"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
