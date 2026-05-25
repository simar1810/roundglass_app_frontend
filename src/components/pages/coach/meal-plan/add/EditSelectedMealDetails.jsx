import FormControl from "@/components/FormControl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTrigger,
} from "@/components/ui/dialog";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import SuggestFeatureModal from "@/components/modals/SuggestFeatureModal";
import { Textarea } from "@/components/ui/textarea";
import {
	getMealTypeDefaultTiming,
	resolveMealTime,
	saveRecipe,
} from "@/config/state-reducers/custom-meal";
import { uploadImage } from "@/lib/api";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { DialogTitle } from "@radix-ui/react-dialog";
import { format, parse } from "date-fns";
import { ChevronLeft, ListOrdered, Plus, Save, Scale, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import RecipeIngredientsDetailBlock from "@/components/recipes/RecipeIngredientsDetailBlock";
import { shouldShowIngredientLineTable } from "@/lib/recipes/recipeIngredientsDisplay";
import { cn } from "@/lib/utils";
import { checkArray } from "@/lib/formatter";
import {
	applyDefaultServingNutrition,
	buildPer100gSnapshot,
	extractPer100gNutrition,
	formatServingSizeLabel,
	getServingNutrition,
	normalizeRecipeForMealPlan,
	scaleNutritionFromPer100g,
} from "@/lib/nutrition/per100g";

function buildFormStateFromRecipe(recipe, defaultMealTiming = "") {
	const normalized = normalizeRecipeForMealPlan(recipe);
	const servingState = applyDefaultServingNutrition(normalized);
	const merged = { ...normalized, ...servingState };
	return {
		...merged,
		time: resolveMealTime(merged, defaultMealTiming),
		method: merged.method || getMethodFromRecipe(recipe),
	};
}

const MEASURE_OPTIONS = [
	{ value: "cup", label: "Cup" },
	{ value: "tablespoon", label: "Tablespoon (tbsp)" },
	{ value: "teaspoon", label: "Teaspoon (tsp)" },
	{ value: "bowl", label: "Bowl (small/medium/large)" },
	{ value: "katori", label: "Katori (standard Indian bowl, ~150 ml)" },
	{ value: "glass", label: "Glass (small/medium/large)" },
	{ value: "plate", label: "Plate (small/full/half)" },
	{ value: "piece", label: "Piece" },
	{ value: "slice", label: "Slice" },
	{ value: "poha_serving", label: "Poha serving (1 medium bowl)" },
	{ value: "rice_serving", label: "Rice serving (1 medium bowl)" },
	{ value: "sabzi", label: "Sabzi (1 katori or ½ cup)" },
	{ value: "dal", label: "Dal (1 katori)" },
	{ value: "spoonful", label: "Spoonful (1 serving spoon, ~10 g)" },
	{ value: "handful", label: "Handful" },
	{ value: "pinch", label: "Pinch (spices, salt)" },
	{ value: "scoop", label: "Scoop" },
	{ value: "packet", label: "Packet" },
	{ value: "bottle", label: "Bottle" },
	{ value: "cup_240ml", label: "Cup (standard 240 ml)" },
	{ value: "gram", label: "Gram (g)" },
	{ value: "kilogram", label: "Kilogram (kg)" },
	{ value: "millilitre", label: "Millilitre (ml)" },
	{ value: "litre", label: "Litre (L)" },
	{ value: "small_medium_large", label: "Small / Medium / Large piece" },
	{ value: "serving", label: "Serving (customized portion)" },
];

// API may return method (string) or recipe (array of steps); e.g. mostSearchedRecipes vs recipees search
function getMethodFromRecipe(recipe) {
	if (!recipe) return "";
	if (recipe.method) return recipe.method;
	if (Array.isArray(recipe.recipe) && recipe.recipe.length > 0) {
		return recipe.recipe.join("\n");
	}
	return "";
}

/** Plain numeric serving qty: allows empty / backspace while typing; commits on blur. */
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
						if (Number.isFinite(n) && n > 0) {
							onCommit(n);
						}
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

export default function EditSelectedMealDetails({
	defaultOpen,
	draftMode = false,
	children,
	recipe,
	index,
	replaceIndex,
	selectedDay,
	selectedMealType,
	onBackToMealSearch,
	onReplaceRequest,
	onMealAddFlowComplete,
	onDiscard,
}) {
	const [open, setOpen] = useState(defaultOpen ?? draftMode);
	const { dispatch, selectedPlans } = useCurrentStateContext();
	const savedRef = useRef(false);
	const skipCloseSideEffectsRef = useRef(false);
	const defaultMealTiming = useMemo(
		() => getMealTypeDefaultTiming(selectedPlans, selectedDay, selectedMealType),
		[selectedPlans, selectedDay, selectedMealType],
	);

	useEffect(() => {
		if (defaultOpen || draftMode) setOpen(true);
	}, [defaultOpen, draftMode]);
	const [formData, setFormData] = useState(() =>
		buildFormStateFromRecipe(recipe, defaultMealTiming),
	);
	const baseNutritionRef = useRef(extractPer100gNutrition(recipe));
	const onChangeHandler = (e) =>
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	const closeBtnRef = useRef();
	const fileRef = useRef();
	const [uploading, setUploading] = useState(false);
	const [suggestFeatureOpen, setSuggestFeatureOpen] = useState(false);
	const [previewImage, setPreviewImage] = useState(
		formData.image || recipe.image || "/not-found.png",
	);
	useEffect(() => {
		const normalized = normalizeRecipeForMealPlan(recipe);
		const servingState = applyDefaultServingNutrition(normalized);
		baseNutritionRef.current = extractPer100gNutrition({
			...normalized,
			per_100g: servingState.per_100g,
		});
		savedRef.current = false;
		setFormData(buildFormStateFromRecipe(recipe, defaultMealTiming));
		setPreviewImage(normalized.image || recipe.image || "/not-found.png");
	}, [recipe, defaultMealTiming]);

	async function handleImageUpload(e) {
		const file = e.target.files?.[0];
		const MAX_SIZE_LIMIT = 1 * 1024 * 1024;
		if (!file) return;
		if (file && file.size > MAX_SIZE_LIMIT) {
			toast.error("File size more than 1MB");
			return;
		}
		const localPreview = URL.createObjectURL(file);
		setPreviewImage(localPreview);
		try {
			setUploading(true);
			const response = await uploadImage(file);
			setFormData((prev) => ({ ...prev, image: response.img }));
			setPreviewImage(response.img || localPreview);
			toast.success("Image uploaded successfully!");
		} catch (error) {
			toast.error(error.message || "Something went wrong!");
		} finally {
			setUploading(false);
		}
	}

	const backendMeasures = Array.isArray(formData?.measures)
		? formData.measures
		: [];

	function onMeasureChange(measureName, qty = formData.quantity || 1) {
		const m = backendMeasures.find((x) => x.name === measureName);
		if (!m) return;

		const quantity = qty > 0 ? qty : 1;
		const totalGrams = m.grams * quantity;
		const scaled = scaleNutritionFromPer100g(baseNutritionRef.current, totalGrams);

		setFormData((prev) => ({
			...prev,
			quantity,
			selected_measure_name: m.name,
			serving_size: `${quantity} ${m.name} (${totalGrams}g)`,
			...(scaled || {}),
		}));
	}

	function updateQuantity(qty) {
		const q =
			typeof qty === "number" && Number.isFinite(qty) && qty > 0 ? qty : 1;
		const measure =
			formData.selected_measure_name || formData.default_measure?.name || "";
		const hasBackendMeasure = backendMeasures.some((item) => item.name === measure);

		if (hasBackendMeasure) {
			onMeasureChange(measure, q);
			return;
		}

		setFormData((prev) => ({
			...prev,
			quantity: q,
			serving_size: measure ? `${q} ${measure}` : prev.serving_size,
		}));
	}

	function discardChanges() {
		if (draftMode) {
			onDiscard?.();
		}
		// Non-draft edits live in local form state until Save — cancel should not mutate the plan.
	}

	function getSaveIndex() {
		if (replaceIndex != null) return replaceIndex;
		if (draftMode) return undefined;
		return index;
	}

	function updateDish() {
		for (const field of ["dish_name", "time"]) {
			if (!formData[field]) {
				toast.error(`${field} is required.`);
				return;
			}
		}
		savedRef.current = true;
		dispatch(
			saveRecipe(
				{
					...formData,
					per_100g: buildPer100gSnapshot({ per_100g: baseNutritionRef.current }),
				},
				getSaveIndex(),
				false,
				selectedDay,
				selectedMealType
			)
		);
		closeBtnRef.current?.click();
		setOpen(false);
	}

	function goToRecipePicker(onNavigate) {
		skipCloseSideEffectsRef.current = true;
		setOpen(false);
		onNavigate?.();
	}

	function handleOpenChange(nextOpen) {
		if (!nextOpen) {
			if (skipCloseSideEffectsRef.current) {
				skipCloseSideEffectsRef.current = false;
			} else if (savedRef.current) {
				onMealAddFlowComplete?.();
			} else {
				discardChanges();
			}
			savedRef.current = false;
		}
		setOpen(nextOpen);
	}

	function addServingForRecipe(form) {
		if(checkArray(formData.measures).some(measure => measure.name === form.name)) {
			return { success: false, message: "Measure with same name already exists!" }
		}
		setFormData(prev => ({
			...prev,
			measures: [
				...checkArray(prev.measures),
				form
			],
			...(!formData.default_measure && { default_measure: form })
		}))
		return { success: true }
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			{!children && !draftMode && (
				<DialogTrigger className="w-full">
					<div className="mt-4 flex items-start gap-4">
						<Image
							alt=""
							src={previewImage}
							height={100}
							width={100}
							className="rounded-lg max-h-[100px] bg-[var(--comp-1)] object-contain border-1"
						/>
						<div className="text-left text-sm md:text-base">
							<h3>{recipe.name || recipe.dish_name || recipe.title}</h3>
							{recipe.description && (
								<p className="leading-[1.2] text-[14px] text-black/60 mt-1 line-clamp-2">
									{recipe.description}
								</p>
							)}
							{recipe.time && (
								<p className="mt-1">
									{format(parse(recipe.time, "HH:mm", new Date()), "hh:mm a")}
								</p>
							)}
							{!recipe.time && recipe.meal_time && (
								<p className="mt-1">{recipe.meal_time}</p>
							)}
							<div className="mt-2 flex flex-wrap gap-1 overflow-x-auto no-scrollbar">
								{typeof recipe.calories === "object" ? (
									<RecipeCalories recipe={recipe} />
								) : (
									<MealCalories recipe={recipe} />
								)}
							</div>
						</div>
					</div>
				</DialogTrigger>
			)}
			{children}
			<DialogContent className="p-0 gap-0 max-h-[70vh] overflow-y-auto">
				<div className="flex items-center gap-2 border-b px-4 py-3">
					{onBackToMealSearch && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => goToRecipePicker(onBackToMealSearch)}
							className="h-8 shrink-0 px-2 text-slate-600 hover:text-slate-900"
						>
							<ChevronLeft size={16} />
							Back
						</Button>
					)}
					<DialogTitle className="min-w-0 flex-1 text-base font-semibold leading-tight">
						{replaceIndex != null
							? "Replace meal"
							: onBackToMealSearch
								? "Add custom meal"
								: "Meal details"}
					</DialogTitle>
				</div>
				<div className="p-4">
					<div
						className="relative w-full h-[250px] bg-[var(--comp-1)] rounded-lg overflow-hidden border-1 cursor-pointer"
						onClick={() => fileRef.current?.click()}
					>
						<Image
							alt=""
							src={previewImage}
							fill
							sizes="100vw"
							className="object-contain"
							onError={(e) => (e.currentTarget.src = "/not-found.png")}
						/>
						<div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm font-semibold transition">
							{uploading ? "Uploading..." : "Click to upload photo"}
						</div>
						<input
							type="file"
							accept="image/*"
							hidden
							ref={fileRef}
							onChange={handleImageUpload}
						/>
					</div>
					<FormControl
						value={formData.dish_name || formData.name || formData.title || ""}
						name="dish_name"
						onChange={onChangeHandler}
						placeholder="Dish Name"
						className="block mb-4"
					/>
					<div>
						<label className="text-sm font-medium mb-2 block">
							Description
						</label>
						<Textarea
							value={formData.description || ""}
							name="description"
							onChange={onChangeHandler}
							placeholder="Description"
							className="min-h-[80px] mb-4"
						/>
					</div>
					<div>
						{shouldShowIngredientLineTable(formData) ? (
							<div className="mb-4">
								<label className="text-sm font-medium mb-2 block">
									Ingredients (catalog)
								</label>
								<RecipeIngredientsDetailBlock
									recipe={formData}
									suppressLegacyNote
								/>
							</div>
						) : null}
						<label className="text-sm font-medium mb-2 block">
							{shouldShowIngredientLineTable(formData)
								? "Ingredients (free text, optional)"
								: "Ingredients"}
						</label>
						{shouldShowIngredientLineTable(formData) ? (
							<p className="text-xs text-muted-foreground mb-2 leading-snug">
								Edit extra notes here if needed; the table above reflects catalog
								line items from the recipe.
							</p>
						) : null}
						<Textarea
							value={formData.ingredients || ""}
							name="ingredients"
							onChange={onChangeHandler}
							placeholder="Enter ingredients (e.g., 2 eggs, 1 cup flour, etc.)"
							className={cn(
								"min-h-[100px] mb-4",
								shouldShowIngredientLineTable(formData) && "opacity-90",
							)}
						/>
					</div>
					<div>
						<label className="text-sm font-medium mb-2 block">Method</label>
						<Textarea
							value={formData.method || ""}
							name="method"
							onChange={onChangeHandler}
							placeholder="Enter cooking method/instructions"
							className="min-h-[100px] mb-4"
						/>
					</div>
					<FormControl
						type="time"
						value={formData.time || ""}
						name="time"
						onChange={onChangeHandler}
						className="block mb-4"
					/>
					<h3>Nutrition Values</h3>
					<label className="mt-2 block">
						<div className="mb-2 flex justify-between items-center">
							<span>Serving Size</span>
							<ServingAdder onSave={addServingForRecipe} />
						</div>

						<div className="flex gap-2 items-center justify-end">
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
											{option.name}{option.grams != null ? ` (${option.grams}g)` : ""}
										</SelectItem>
									))}
									</SelectContent>
								</Select>
							) : (
								<input
									type="text"
									placeholder="Enter measure (e.g. cup, bowl)"
									value={formData.selected_measure_name || ""}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											selected_measure_name: e.target.value,
											serving_size: `${prev.quantity || 1} ${e.target.value}`,
										}))
									}
									className="min-w-[180px] px-2 py-1 border rounded-md focus:outline-none"
								/>
							)}
						</div>
					</label>

					<label className="flex justify-between items-center">
						<span>Calories</span>
						<FormControl
							value={formData.calories || ""}
							name="calories"
							onChange={onChangeHandler}
						/>
					</label>
					<label className="flex justify-between items-center">
						<span>Proteins</span>
						<FormControl
							value={formData.protein || ""}
							name="protein"
							onChange={onChangeHandler}
						/>
					</label>
					<label className="flex justify-between items-center">
						<span>Carbohydrates</span>
						<FormControl
							value={formData.carbohydrates || ""}
							name="carbohydrates"
							onChange={onChangeHandler}
						/>
					</label>
					<label className="flex justify-between items-center">
						<span>Fats</span>
						<FormControl
							value={formData.fats || ""}
							name="fats"
							onChange={onChangeHandler}
						/>
					</label>
					<div className="mt-4 flex flex-col gap-2">
						{onReplaceRequest && !draftMode && replaceIndex == null && (
							<Button
								type="button"
								variant="outline"
								className="w-full"
								onClick={() => goToRecipePicker(onReplaceRequest)}
							>
								Replace with another dish
							</Button>
						)}
						<Button className="w-full" variant="wz" onClick={updateDish}>
							{replaceIndex != null ? "Confirm replacement" : "Save changes"}
						</Button>
					</div>
					<p className="text-sm text-black/70 mt-4 text-left">
						We're constantly improving our data. If you notice anything unusual,
						please share your{" "}
						<button
							type="button"
							onClick={() => setSuggestFeatureOpen(true)}
							className="text-[var(--accent-1)] underline font-medium"
						>
							Feedback
						</button>{" "}
						with us.
					</p>
					<DialogClose ref={closeBtnRef} />
					<SuggestFeatureModal
						open={suggestFeatureOpen}
						onClose={() => setSuggestFeatureOpen(false)}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function ServingAdder({ onSave }) {
	const [isOpen, setIsOpen] = useState(false);
	const [formData, setFormData] = useState({ name: '', grams: '' });

	const handleSave = function () {
		if (!formData.name || !formData.grams) return;
		const { success, message } = onSave(formData);
		if (!success) {
			return toast.error(message || "Something went wrong!")
		}
		setIsOpen(false);
		setFormData({ name: '', grams: '' });
	};

	return <div className="relative inline-block">
		<button
			onClick={() => setIsOpen(!isOpen)}
			className={cn(
				"flex h-8 items-center justify-center rounded-xl border transition-all duration-200 px-4 text-sm gap-1",
				isOpen
					? "bg-[var(--accent-1)] border-slate-900 text-white shadow-lg"
					: "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
			)}
		>
			<Plus size={16} />
			Add
		</button>
		{isOpen && (
			<>
				<div
					className="fixed inset-0 z-40 bg-transparent"
					onClick={() => setIsOpen(false)}
				/>
				<div className="absolute right-0 top-12 z-50 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
					<div className="mb-4 flex items-center justify-between">
						<h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Add Serving</h4>
						<button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
							<X size={16} />
						</button>
					</div>
					<div className="space-y-4">
						<div className="space-y-1.5">
							<label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Serving Name</label>
							<div className="relative">
								<ListOrdered size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
								<input
									autoFocus
									type="text"
									placeholder="e.g. Medium Bowl"
									className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								/>
							</div>
						</div>
						<div className="space-y-1.5">
							<label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Grams / Weight</label>
							<div className="relative">
								<Scale size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
								<input
									type="number"
									placeholder="e.g. 250"
									className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
									value={formData.grams}
									onChange={(e) => setFormData({ ...formData, grams: e.target.value })}
								/>
							</div>
						</div>
						<button
							onClick={handleSave}
							className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-1)] py-3 text-sm font-bold text-white shadow-md shadow-blue-100 transition-all hover:bg-[var(--accent-1)] active:scale-[0.98]"
						>
							<Save size={16} />
							Save Serving
						</button>
					</div>
				</div>
			</>
		)}
	</div>
}

function MealCalories({ recipe }) {
	const nutrition = getServingNutrition(recipe);
	const servingLabel =
		recipe?.serving_size || formatServingSizeLabel(recipe);

	return (
		<div className="flex flex-row flex-wrap gap-1">
			<Badge className="bg-[#EFEFEF] text-black">
				<span className="text-black/40">Serving Size -</span>
				{servingLabel}
			</Badge>
			<Badge className="bg-[#EFEFEF] text-black">
				<span className="text-black/40">Kcal -</span>
				{nutrition.calories}
			</Badge>
			<Badge className="bg-[#EFEFEF] text-black">
				<span className="text-black/40">Protien -</span> {nutrition.protein}
			</Badge>
			<Badge className="bg-[#EFEFEF] text-black">
				<span className="text-black/40">Carbs -</span> {nutrition.carbohydrates}
			</Badge>
			<Badge className="bg-[#EFEFEF] text-black">
				<span className="text-black/40">Fats -</span> {nutrition.fats}
			</Badge>
			{recipe.measure !== undefined && (
				<Badge className="bg-[#EFEFEF] text-black">
					<span className="text-black/40">Measure -</span> {recipe.measure}
				</Badge>
			)}
		</div>
	);
}

function RecipeCalories({ recipe }) {
	const nutrition = getServingNutrition(recipe);

	return (
		<div className="flex flex-row flex-wrap gap-1">
			<Badge className="bg-[#EFEFEF] text-black">
				<span className="text-black/40">Protien -</span> {nutrition.protein}
			</Badge>
			<Badge className="bg-[#EFEFEF] text-black">
				<span className="text-black/40">Carbs -</span> {nutrition.carbohydrates}
			</Badge>
			<Badge className="bg-[#EFEFEF] text-black">
				<span className="text-black/40">Fats -</span> {nutrition.fats}
			</Badge>
			<Badge className="bg-[#EFEFEF] text-black">
				<span className="text-black/40">Kcal -</span>
				{nutrition.calories}
			</Badge>
		</div>
	);
}
