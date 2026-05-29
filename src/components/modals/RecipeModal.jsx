"use client";

import RecipeIngredientLineItems from "@/components/pages/coach/meals/IngredientPicker";
import FormControl from "@/components/FormControl";
import Loader from "@/components/common/Loader";
import BasicPopoverSelect from "@/components/common/selects/BasicPopoverSelect";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
	changeFieldvalue,
	generateRequestPayload,
	init,
	isLineItemMode,
	newRecipeeReducer,
	validateRecipeForm,
} from "@/config/state-reducers/new-recipe";
import { useFeatureScope } from "@/hooks/useFeatureScope";
import { mapFeatureCategories } from "@/features/feature-categories/config/helpers";
import { checkArray } from "@/lib/formatter";
import { fetchData, sendDataWithFormData } from "@/lib/api";
import { getRecipeById } from "@/lib/fetchers/app";
import {
	getRecipeMutationErrorMessage,
	revalidateRecipeListCaches,
} from "@/lib/swr/revalidateRecipeCaches";
import { cn, getObjectUrl } from "@/lib/utils";
import useCurrentStateContext, {
	CurrentStateProvider,
} from "@/providers/CurrentStateContext";
import { ImagePlus } from "lucide-react";
import Image from "next/image";
import { cloneElement, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

const MACRO_FIELDS = [
	{ id: 1, label: "Calories", name: "total", unit: "kcal" },
	{ id: 2, label: "Protein", name: "proteins", unit: "g" },
	{ id: 3, label: "Carbs", name: "carbs", unit: "g" },
	{ id: 4, label: "Fat", name: "fats", unit: "g" },
	{ id: 5, label: "Fibre", name: "fibers", unit: "g" },
];

const COPY = {
	new: {
		title: "Create recipe",
		save: "Save recipe",
		defaultTrigger: "Add recipe",
	},
	edit: {
		title: "Edit recipe",
		save: "Save changes",
		defaultTrigger: "Edit",
	},
};

export default function RecipeModal({
	type,
	recipe,
	editTrigger,
	open,
	onOpenChange,
	onTriggerClick,
}) {
	const { hasAccess } = useFeatureScope("meal_plans:manage");
	if (!hasAccess) return null;
	return (
		<Container
			type={type}
			recipe={recipe}
			editTrigger={editTrigger}
			open={open}
			onOpenChange={onOpenChange}
			onTriggerClick={onTriggerClick}
		/>
	);
}

function Container({ type, recipe, editTrigger, open, onOpenChange, onTriggerClick }) {
	const copy = COPY[type === "new" ? "new" : "edit"];
	const isControlled = open !== undefined;
	const isEdit = type === "edit";
	const recipeId = recipe?._id != null ? String(recipe._id) : "";

	const { data: recipeDetail, isLoading: loadingRecipeDetail } = useSWR(
		isEdit && recipeId ? ["recipe-detail", recipeId] : null,
		() => getRecipeById(recipeId),
	);

	const recipeForForm = useMemo(() => {
		if (!isEdit) return recipe;
		if (recipeDetail?.status_code === 200 && recipeDetail?.data) {
			return recipeDetail.data;
		}
		return recipe;
	}, [isEdit, recipe, recipeDetail]);

	const formReady = !isEdit || (!loadingRecipeDetail && Boolean(recipeForForm));

	const hasTrigger = !isControlled || Boolean(editTrigger);

	return (
		<Dialog
			open={isControlled ? open : undefined}
			onOpenChange={isControlled ? onOpenChange : undefined}
		>
			{hasTrigger && type === "new" ? (
				editTrigger ? (
					<DialogTrigger asChild>
						{onTriggerClick
							? cloneTriggerWithClick(editTrigger, onTriggerClick)
							: editTrigger}
					</DialogTrigger>
				) : (
					<DialogTrigger
						className="inline-flex items-center justify-center rounded-lg bg-[var(--accent-1)] px-4 py-2 text-sm font-semibold text-[var(--primary-1)] shadow-sm transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-1)]/50"
						onClick={() => onTriggerClick?.()}
					>
						{copy.defaultTrigger}
					</DialogTrigger>
				)
			) : hasTrigger && editTrigger ? (
				<DialogTrigger asChild>
					{onTriggerClick
						? cloneTriggerWithClick(editTrigger, onTriggerClick)
						: editTrigger}
				</DialogTrigger>
			) : hasTrigger ? (
				<DialogTrigger className="rounded-md px-2 py-1.5 text-xs font-medium text-[var(--accent-1)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-1)]/40">
					{copy.defaultTrigger}
				</DialogTrigger>
			) : null}
			<DialogContent className="flex max-h-[min(92vh,820px)] w-[min(96vw,42rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-border/70 p-0 shadow-xl">
				<DialogHeader className="shrink-0 border-b border-border/60 bg-white px-5 py-4 text-left sm:px-6">
					<DialogTitle className="text-lg font-semibold tracking-tight text-[var(--dark-1)]">
						{copy.title}
					</DialogTitle>
					<DialogDescription className="sr-only">{copy.title}</DialogDescription>
				</DialogHeader>
				<div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--comp-1)]/40">
					{!formReady ? (
						<div className="flex h-48 items-center justify-center">
							<Loader />
						</div>
					) : (
						<CurrentStateProvider
							key={isEdit ? `edit-${recipeId}-${recipeDetail?.data?.updatedAt ?? "list"}` : "new"}
							state={init(type, recipeForForm)}
							reducer={newRecipeeReducer}
						>
							<RecipeForm type={type} saveLabel={copy.save} />
						</CurrentStateProvider>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

function RecipeForm({ type, saveLabel }) {
	const { isLoading, data } = useSWR("app/feature-categories/recipes", () =>
		fetchData("app/feature-categories/recipes"),
	);
	const { hasAccess: canManageIngredients } = useFeatureScope([
		"ingredients:read",
		"ingredients:manage",
	]);
	const { dispatch, ...state } = useCurrentStateContext();
	const [loading, setLoading] = useState(false);
	const [categories, subCategories] = useMemo(
		() => mapFeatureCategories(checkArray(data?.data)),
		[data],
	);

	const closeBtnRef = useRef(null);
	const fileRef = useRef(null);
	const lineItemMode = isLineItemMode(state);

	async function handleSave() {
		if (loading) return;
		try {
			const validation = validateRecipeForm(state);
			if (!validation.ok) {
				toast.error(validation.message);
				return;
			}
			setLoading(true);
			const payload = generateRequestPayload(state);
			const response = await saveRecipe(type, payload, state._id);

			if (response instanceof Error) {
				toast.error(response.message || "Could not save recipe.");
				return;
			}
			if (!response || typeof response !== "object") {
				toast.error("Could not save recipe.");
				return;
			}
			if (response.status_code !== 200) {
				const detail =
					(response.error != null && String(response.error).trim()) || "";
				toast.error(
					detail
						? `${getRecipeMutationErrorMessage(response)} (${detail})`
						: getRecipeMutationErrorMessage(response),
				);
				return;
			}

			const successMsg =
				(response.message != null && String(response.message).trim()) ||
				"Recipe saved.";
			toast.success(successMsg);
			await revalidateRecipeListCaches();
			closeBtnRef.current?.click();
		} catch (error) {
			const msg =
				error?.message ||
				(typeof error === "string" ? error : "Could not save recipe.");
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	}

	if (isLoading) {
		return (
			<div className="flex h-48 items-center justify-center">
				<Loader />
			</div>
		);
	}

	return (
		<div
			className="flex min-h-0 flex-1 flex-col"
			onWheel={(e) => e.stopPropagation()}
		>
			<DialogClose ref={closeBtnRef} />
			<div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-contain px-5 py-5 sm:px-6 sm:py-6">
				<FormControl
					placeholder="e.g. Grilled chicken bowl"
					className="w-full [&_.input]:bg-white"
					value={state.title}
					onChange={(e) => dispatch(changeFieldvalue("title", e.target.value))}
					label="Recipe name"
				/>

				{canManageIngredients ? (
					<FormSection title="Ingredients">
						<div className="rounded-xl border border-border/60 bg-white p-3 sm:p-4">
							<RecipeIngredientLineItems
								lineItems={state.ingredientLineItems}
								onLineItemsChange={(next) =>
									dispatch(changeFieldvalue("ingredientLineItems", next))
								}
								disabled={loading}
								compactHeader
							/>
						</div>
					</FormSection>
				) : null}

				<FormSection
					title="Ingredient notes"
					hint={
						lineItemMode
							? "Optional — catalog lines above are used for nutrition."
							: "List ingredients and amounts as plain text."
					}
				>
					<Textarea
						placeholder="e.g. 150g chicken breast, 1 cup rice, 1 tbsp olive oil…"
						className={cn(
							"min-h-[88px] resize-y border-border/70 bg-white text-sm",
							lineItemMode && "opacity-80",
						)}
						value={state.ingredients}
						onChange={(e) =>
							dispatch(changeFieldvalue("ingredients", e.target.value))
						}
					/>
				</FormSection>

				<div className="grid gap-6 sm:grid-cols-2">
					<FormSection title="Photo" hint="Optional cover image.">
						<button
							type="button"
							onClick={() => fileRef.current?.click()}
							className="group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-white transition-colors hover:border-[var(--accent-1)]/50 hover:bg-[var(--accent-1)]/[0.03]"
						>
							{state.file || state.image ? (
								<Image
									src={getObjectUrl(state.file) || state.image}
									alt=""
									height={160}
									width={160}
									className="h-36 w-full object-contain p-2"
								/>
							) : (
								<div className="flex h-36 w-full flex-col items-center justify-center gap-2 text-[var(--dark-1)]/40">
									<ImagePlus className="size-7" aria-hidden />
									<span className="text-xs font-medium">Upload photo</span>
								</div>
							)}
							<span className="absolute inset-x-0 bottom-0 bg-black/50 py-1.5 text-center text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
								Change photo
							</span>
						</button>
						<input
							ref={fileRef}
							type="file"
							accept="image/*"
							hidden
							onChange={(e) =>
								dispatch(changeFieldvalue("file", e.target.files?.[0]))
							}
						/>
					</FormSection>

					<FormSection title="Method" hint="Steps to prepare this dish.">
						<Textarea
							placeholder={"1. Marinate…\n2. Grill…"}
							className="min-h-[144px] resize-y border-border/70 bg-white text-sm sm:min-h-[9rem]"
							value={state.method}
							onChange={(e) =>
								dispatch(changeFieldvalue("method", e.target.value))
							}
						/>
					</FormSection>
				</div>

				<FormSection
					title="Nutrition"
					hint={
						lineItemMode
							? "Calculated from catalog ingredients when you save."
							: "Per serving — required when not using catalog lines."
					}
				>
					<div
						className={cn(
							"rounded-xl border border-border/60 bg-white p-3 sm:p-4",
							lineItemMode && "opacity-90",
						)}
					>
						{lineItemMode ? (
							<p className="mb-3 text-xs leading-snug text-[var(--dark-1)]/50">
								Manual values are disabled while catalog ingredients are set.
								{type === "edit"
									? " Shown numbers reflect your last save until you save again."
									: null}
							</p>
						) : null}
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{MACRO_FIELDS.map((field) => (
								<FormControl
									key={field.id}
									value={state[field.name]}
									onChange={(e) =>
										dispatch(changeFieldvalue(field.name, e.target.value))
									}
									className="[&_.input]:bg-[var(--comp-1)]/50 [&_.input]:text-sm [&_.label]:text-xs [&_.label]:font-medium [&_.label]:text-[var(--dark-1)]/70"
									placeholder="0"
									type="number"
									disabled={lineItemMode}
									label={`${field.label} (${field.unit})`}
								/>
							))}
							<FormControl
								value={state.defaultMeasure}
								onChange={(e) =>
									dispatch(changeFieldvalue("defaultMeasure", e.target.value))
								}
								className="[&_.input]:bg-[var(--comp-1)]/50 [&_.input]:text-sm [&_.label]:text-xs [&_.label]:font-medium [&_.label]:text-[var(--dark-1)]/70"
								placeholder="0"
								type="number"
								disabled={lineItemMode}
								label="Serving size (g)"
							/>
						</div>
					</div>
				</FormSection>

				<FormSection title="Classification" hint="Helps organize recipes in your library.">
					<div className="grid gap-3 sm:grid-cols-2">
						<BasicPopoverSelect
							options={categories.map((opt) => ({ value: opt, label: opt }))}
							selectLabel="Category"
							value={state.category}
							onValueChange={(value) =>
								dispatch(changeFieldvalue("category", value))
							}
							className="w-full"
						/>
						<BasicPopoverSelect
							options={subCategories.map((opt) => ({ value: opt, label: opt }))}
							selectLabel="Subcategory"
							value={state.subCategory}
							onValueChange={(value) =>
								dispatch(changeFieldvalue("subCategory", value))
							}
							className="w-full"
						/>
					</div>
				</FormSection>
			</div>

			<div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/60 bg-white px-5 py-3 sm:px-6">
				<DialogClose asChild>
					<Button type="button" variant="outline" className="min-w-[5.5rem]">
						Cancel
					</Button>
				</DialogClose>
				<Button
					type="button"
					variant="wz"
					className="min-w-[7.5rem]"
					disabled={loading}
					onClick={handleSave}
				>
					{loading ? "Saving…" : saveLabel}
				</Button>
			</div>
		</div>
	);
}

function FormSection({ title, hint, children }) {
	return (
		<section className="space-y-2.5">
			<div>
				<h3 className="text-sm font-semibold text-[var(--dark-1)]">{title}</h3>
				{hint ? (
					<p className="mt-0.5 text-xs leading-snug text-[var(--dark-1)]/50">{hint}</p>
				) : null}
			</div>
			{children}
		</section>
	);
}

function cloneTriggerWithClick(trigger, onClick) {
	if (!trigger || !onClick) return trigger;
	return cloneElement(trigger, {
		onClick: (e) => {
			onClick(e);
			trigger.props?.onClick?.(e);
		},
	});
}

async function saveRecipe(type, payload, id) {
	if (type === "new") {
		return sendDataWithFormData("app/addRecipes", payload);
	}
	return sendDataWithFormData(`app/editRecipes?id=${id}`, payload, "PUT");
}
