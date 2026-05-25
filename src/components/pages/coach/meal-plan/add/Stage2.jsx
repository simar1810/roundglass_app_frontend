import { DisplayMealStats } from "@/app/(authorized)/coach/meals/list-custom/[id]/page";
import { Button } from "@/components/ui/button";
import {
	DRAFT_PLAN_ID_STORAGE_KEY,
	DRAFT_PLAN_MODE_STORAGE_KEY,
	getMealPlanStorageKey,
	SAVED_MEAL_PLAN_STORAGE_KEY,
} from "@/config/state-data/custom-meal";
import {
	changeStateDifferentCreationMeal,
	customWorkoutUpdateField,
	dailyMealRP,
	deleteMonthlyDate,
	mealPlanCreationRP,
	startFromToday,
} from "@/config/state-reducers/custom-meal";
import { sendData, uploadImage } from "@/lib/api";
import { _throwError, checkArray, format24hr_12hr } from "@/lib/formatter";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { useAppSelector } from "@/providers/global/hooks";
import { format } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Clock, ListCollapse, SquarePen, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import CustomMealMetaData from "./CustomMealMetaData";
import CustomMealPlanPreview from "./CustomMealPlanPreview";
import MealPlanActionsMenu from "./MealPlanActionsMenu";
import MonthlyMealCreation, { AddNextDay } from "./MonthlyMealCreation";
import SelectMeals from "./SelectMeals";
import WeeklyMealCreation from "./WeeklyMealCreation";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import useMealPlanAutoSave from "@/hooks/useMealPlanAutoSave";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
const DRAFT_API_DEBOUNCE_MS = 1500;
/** When a draft PUT is already in flight, debounced saves skip; retry so bulk actions (e.g. copy meals) are not dropped. */
const DRAFT_API_BUSY_RETRY_MS = 400;

function hasMinimumContentForDraft(state) {
	if (!state?.title?.trim()) return false;
	const plans = state.selectedPlans || {};
	const keys = Object.keys(plans);
	if (keys.length === 0) return false;
	// Require at least one meal somewhere for draft (newWorkout sends each day to create-custom-plan; empty days may be allowed by backend).
	for (const key of keys) {
		const day = plans[key];
		const arr = Array.isArray(day) ? day : day?.meals || [];
		if (arr.some((m) => Array.isArray(m?.meals) && m.meals.length > 0)) return true;
	}
	// No meals in any day yet. For monthly/daily/weekly, newWorkout can still run if each day has meal-type structure (e.g. array of { mealType, meals: [] }).
	// Allow draft when we have at least one day so "just started" (title + generated dates) can save.
	return true;
}

export default function Stage2({
	context,
}) {
	const [isExpanded, setIsExpanded] = useState(false)
	const [viewType, setViewType] = useState("horizontal") // horizontal, vertical
	const onToggleViewType = () => setViewType(prev => prev === "horizontal" ? "vertical" : "horizontal")
	const [loading, setLoading] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [lastSavedAt, setLastSavedAt] = useState(null); // Date or null
	const isFirstMountRef = useRef(true);
	const stateRef = useRef(null);
	const coachId = useAppSelector((s) => s.coach?.data?._id) ?? null;
	const mealPlanAutosaveEnabled = useAppSelector((s) => s.coach?.data?.mealPlanAutosaveEnabled === true);
	const { dispatch, ...state } = useCurrentStateContext();
	stateRef.current = state;
	const component = selectWorkoutCreationComponent(state.mode, viewType);
	const { cache, mutate } = useSWRConfig();

	const router = useRouter();
	const savedKey = getMealPlanStorageKey(SAVED_MEAL_PLAN_STORAGE_KEY, coachId);
	useMealPlanAutoSave({
		state,
		isFirstMountRef,
		mealPlanAutosaveEnabled,
		stateRef,
		savedKey,
		setLastSavedAt
	})
	const draftIdKey = getMealPlanStorageKey(DRAFT_PLAN_ID_STORAGE_KEY, coachId);
	const draftModeKey = getMealPlanStorageKey(DRAFT_PLAN_MODE_STORAGE_KEY, coachId);

	useEffect(() => {
		if (context && Object.keys(context).length > 0) {
			dispatch(changeStateDifferentCreationMeal(context));
		}
	}, [context, dispatch]);

	const draftApiTimerRef = useRef(null);
	const isDraftSavingRef = useRef(false);
	// When a silent draft is first created, we store its plan id here so that
	// subsequent autosaves always target the same draft plan (never the original).
	const draftIdRef = useRef(null);
	const draftSignatureRef = useRef(null);
	// edit + loaded plan id (published or server draft): skip first debounced tick, then silent draft PUT on same id.
	const editExistingPlanBaselineRef = useRef({ planId: null, sig: null });

	// Debounced auto-save to draft API when draft-relevant content changes. Requires autosave in Portfolio → Settings.
	useEffect(() => {
		if (isFirstMountRef.current) return;
		if (!mealPlanAutosaveEnabled) return;

		// Deterministic signature so copy-meal-plan, thumbnail & text changes trigger draft save
		const selectedPlansOrdered = state.selectedPlans && typeof state.selectedPlans === "object"
			? Object.keys(state.selectedPlans).sort().reduce((acc, k) => {
				acc[k] = state.selectedPlans[k];
				return acc;
			}, {})
			: state.selectedPlans;
		const signature = JSON.stringify({
			title: state.title,
			description: state.description,
			mode: state.mode,
			creationType: state.creationType,
			id: state.id,
			selectedPlans: selectedPlansOrdered,
			image: state.image || state.thumbnail,
		});
		const sameSignature = draftSignatureRef.current === signature;
		if (sameSignature) return;
		draftSignatureRef.current = signature;

		const runDraftSave = () => {
			const s = stateRef.current;
			const hasMin = s ? hasMinimumContentForDraft(s) : false;
			if (!s) return;
			if (isDraftSavingRef.current) {
				if (draftApiTimerRef.current) clearTimeout(draftApiTimerRef.current);
				draftApiTimerRef.current = setTimeout(() => {
					draftApiTimerRef.current = null;
					runDraftSave();
				}, DRAFT_API_BUSY_RETRY_MS);
				return;
			}
			// If we already have a draft id (created via a previous silent draft save),
			// always autosave into that draft – never touch the original plan id.
			if (draftIdRef.current) {
				isDraftSavingRef.current = true;
				editWorkout({
					draft: true,
					silent: true,
					planId: draftIdRef.current,
				}).finally(() => {
					isDraftSavingRef.current = false;
				});
				return;
			}

			// Editing an existing plan on the server (published → originalPlanId set, or draft → no originalPlanId).
			// Not using draftIdRef (that is only set after silent newWorkout from new/copy_edit). Same silent PUT as Draft.
			if (s.creationType === "edit" && s.id) {
				if (!hasMin) return;
				const pid = s.id;
				const baseline = editExistingPlanBaselineRef.current;
				if (baseline.planId !== pid) {
					editExistingPlanBaselineRef.current = { planId: pid, sig: null };
				}
				const b = editExistingPlanBaselineRef.current;
				const sig = draftSignatureRef.current;
				if (b.sig === null) {
					b.sig = sig;
					return;
				}
				if (b.sig === sig) return;
				isDraftSavingRef.current = true;
				editWorkout({ draft: true, silent: true, planId: s.id })
					.then(() => {
						const cur = editExistingPlanBaselineRef.current;
						if (cur.planId === pid) cur.sig = draftSignatureRef.current;
					})
					.catch(() => { })
					.finally(() => {
						isDraftSavingRef.current = false;
					});
				return;
			}

			// For brand-new plans and copy_edit (copy & edit), create the initial draft on first
			// autosave once there's enough content. copy_edit is like "new" – we create a new draft,
			// we don't touch the plan we copied from.
			const isNewOrCopyEdit = s.creationType === "new" || s.creationType === "copy_edit";
			if (!isNewOrCopyEdit) return;
			if (!hasMin) return;
			isDraftSavingRef.current = true;
			newWorkout({ draft: true, silent: true }).finally(() => {
				isDraftSavingRef.current = false;
			});
		};

		// Clear any existing timer only when we're scheduling a new one (signature changed).
		// Do not return a cleanup that clears the timer: when the effect re-runs with the same
		// signature we return early, but React would still run the previous cleanup and cancel
		// the scheduled save. Timer is cleared on unmount in a separate effect below.
		if (draftApiTimerRef.current) clearTimeout(draftApiTimerRef.current);
		draftApiTimerRef.current = setTimeout(runDraftSave, DRAFT_API_DEBOUNCE_MS);
	}, [state, mealPlanAutosaveEnabled]);

	// Clear draft save timer on unmount only.
	useEffect(() => {
		return () => {
			if (draftApiTimerRef.current) {
				clearTimeout(draftApiTimerRef.current);
				draftApiTimerRef.current = null;
			}
		};
	}, []);


	async function saveCustomWorkout({
		draft
	}) {
		try {
			if (!draft) {
				for (const field of ["title", "description"]) {
					if (!Boolean(state[field]))
						_throwError(`${field} - for the meal plan is required!`);
				}

				for (const day in state.selectedPlans) {
					const dayPlan = state.selectedPlans[day];
					const normalizedMeals = [
						{ mealType: "breakfast", meals: dayPlan.breakfast },
						{ mealType: "lunch", meals: dayPlan.lunch },
						{ mealType: "dinner", meals: dayPlan.dinner },
						{ mealType: "snacks", meals: dayPlan.snacks },
					].filter(item => Array.isArray(item.meals) && item.meals.length > 0);
					const mealTypesArray = Array.isArray(dayPlan)
						? dayPlan
						: Array.isArray(normalizedMeals)
							? normalizedMeals
							: [];
					if (mealTypesArray.length === 0)
						_throwError(`There are no plans assigned for the day - ${day}!`);
					for (const mealType of mealTypesArray) {
						if (!mealType.meals || mealType.meals?.length === 0)
							_throwError(
								`On ${day}, for ${mealType.mealType || "First Meal Type"
								} at least one meal should be assigned!`
							);
						for (const meal of mealType.meals) {
							delete meal.isNew;
							if (!meal.time && !meal.meal_time)
								_throwError(
									`Time should be selected for all the meals. Not provided for ${mealType.mealType}`
								);
							if (!meal.dish_name)
								_throwError(
									`Dish should be selected for all the meals. Not provided for ${mealType.mealType}`
								);
							meal.meal_time = format24hr_12hr(meal.time || meal.meal_time);

						}
					}
				}
			}

			if (["new", "copy_edit"].includes(state.creationType)) {
				newWorkout({ draft });
			} else if (["edit"].includes(state.creationType)) {
				// When editing:
				// - If draft === true, keep working on the current draft id (state.id).
				// - If draft === false, and we came from an existing non-draft plan,
				//   apply the final save to the original plan id so that autosave /
				//   draft edits don't mutate the assigned plan until Save is pressed.
				const targetPlanId = draft
					? state.id
					: (state.originalPlanId || state.id);
				editWorkout({ draft, planId: targetPlanId });
			}
		} catch (error) {
			toast.error(error.message || "Something went wrong!");
		}
	}

	async function editWorkout({ draft, silent = false, planId: planIdOverride }) {
		let loadingToastId = null;
		try {
			if (!silent) setLoading(true);
			let thumbnail;
			if (state.file) {
				const toastId = silent ? null : toast.loading("Uploading Thumbnail...");
				thumbnail = await uploadImage(state.file);
				dispatch(customWorkoutUpdateField("image", thumbnail.img));
				if (toastId) toast.dismiss(toastId);
			}
			const plans = {};
			const selectedPlans = updateMealPlanDishes(state.selectedPlans);
			for (const key in selectedPlans) {
				const toastId = silent ? null : toast.loading(`Creating Meal Plan - ${key}...`);
				let createdMealPlan;
				if (state.editPlans[key]) {
					createdMealPlan = await sendData(
						`app/update-custom-plan?id=${state.editPlans[key]}`,
						mealPlanCreationRP(selectedPlans[key]),
						"PUT"
					);
				} else {
					createdMealPlan = await sendData(
						"app/create-custom-plan",
						mealPlanCreationRP(selectedPlans[key]),
						"POST"
					);
				}
				if (createdMealPlan.status_code !== 200) {
					if (toastId) toast.dismiss(toastId);
					_throwError(createdMealPlan.message);
				}
				plans[key] =
					createdMealPlan?.data?.planId || createdMealPlan?.data?._id;
				if (toastId) toast.dismiss(toastId);
			}

			const toastId = silent ? null : toast.loading("Creating The Custom Meal Plan...");
			const formData = dailyMealRP(state);

			const response = await sendData(
				`app/meal-plan/custom`,
				{
					...formData,
					image: thumbnail?.img || state.thumbnail || state.image,
					plans: selectedPlans,
					id: planIdOverride ?? state.id,
					planIds: plans,
					draft
				},
				"PUT"
			);
			if (toastId) toast.dismiss(toastId);
			if (loadingToastId) toast.dismiss(loadingToastId);
			if (response.status_code !== 200) _throwError(response.message);
			if (silent) {
				setLastSavedAt(new Date());
				const resolvedId = planIdOverride ?? state.id;
				cache.delete("custom-meal-plans");
				if (resolvedId) cache.delete(`custom-meal-plans/${resolvedId}`);
				void mutate("custom-meal-plans");
				void mutate("dashboardStatistics");
				if (resolvedId) void mutate(`custom-meal-plans/${resolvedId}`);
				return;
			}
			toast.success(response.message);
			localStorage.removeItem(savedKey);
			localStorage.removeItem(draftIdKey);
			localStorage.removeItem(draftModeKey);
			window.location.href = `/coach/meals/list-custom?mode=${state.mode}`;
		} catch (error) {
			if (loadingToastId) toast.dismiss(loadingToastId);
			toast.error(error.message || "Something went wrong!");
			if (silent) throw error;
		} finally {
			setLoading(false);
		}
	}

	async function newWorkout({ draft, silent = false }) {
		let loadingToastId = null;
		try {
			if (!silent) setLoading(true);
			const plans = {};
			let toastId;

			const selectedPlans = updateMealPlanDishes(state.selectedPlans);
			for (const key in selectedPlans) {
				toastId = silent ? null : toast.loading(`Creating Meal Plan - ${key}...`);

				// Normalize the plan data to ensure it's in the correct format
				let planData = selectedPlans[key];
				if (!Array.isArray(planData)) {
					if (Array.isArray(planData?.meals)) {
						planData = planData.meals;
					} else {
						const mealTypes = [];
						const mealTypeKeys = ["breakfast", "lunch", "dinner", "snacks", "morning snacks", "evening snacks"];
						mealTypeKeys.forEach(mealKey => {
							const meals = planData[mealKey];
							if (Array.isArray(meals) && meals.length > 0) {
								const mealTypeName = mealKey.charAt(0).toUpperCase() + mealKey.slice(1);
								mealTypes.push({
									mealType: mealTypeName === "Snacks" ? "Morning Snacks" : mealTypeName,
									meals: meals
								});
							}
						});
						planData = mealTypes.length > 0 ? mealTypes : [];
					}
				}

				// Ensure planData is an array before passing to mealPlanCreationRP
				if (!Array.isArray(planData) || planData.length === 0) {
					if (toastId) toast.dismiss(toastId);
					_throwError(`No meals found for ${key}. Please add at least one meal.`);
				}

				const createdMealPlan = await sendData(
					"app/create-custom-plan",
					mealPlanCreationRP(planData)
				);
				if (createdMealPlan.status_code !== 200) {
					if (toastId) toast.dismiss(toastId);
					_throwError(createdMealPlan.message);
				}
				const dayPlanId = createdMealPlan?.data?.planId ?? createdMealPlan?.data?._id ?? createdMealPlan?.planId ?? createdMealPlan?.data?.id;
				plans[key] = typeof dayPlanId === "string" ? dayPlanId : (dayPlanId != null ? String(dayPlanId) : undefined);
				if (toastId) toast.dismiss(toastId);
			}

			let thumbnail;
			if (state.file) {
				const uploadToastId = silent ? null : toast.loading("Uploading Thumbnail...");
				thumbnail = await uploadImage(state.file);
				dispatch(customWorkoutUpdateField("image", thumbnail.img));
				if (uploadToastId) toast.dismiss(uploadToastId);
			}

			toastId = silent ? null : toast.loading("Creating The Custom Meal Plan...");
			const formData = dailyMealRP(state);

			// POST create: backend expects "plans" to be day key -> plan ID string (from create-custom-plan)
			const response = await sendData(`app/meal-plan/custom`, {
				...formData,
				image: thumbnail?.img || state.thumbnail || state.image,
				plans,
				draft,
			});
			if (toastId) toast.dismiss(toastId);
			if (loadingToastId) toast.dismiss(loadingToastId);
			if (response.status_code !== 200) _throwError(response.message);
			cache.delete("custom-meal-plans");
			if (silent) {
				const data = response?.data;
				const newId =
					data?._id ??
					data?.id ??
					data?.planId ??
					data?.mealPlanId ??
					response?._id ??
					response?.id ??
					(typeof data === "string" ? data : null);
				if (newId) {
					draftIdRef.current = newId;
					dispatch(customWorkoutUpdateField("id", newId));
					dispatch(customWorkoutUpdateField("editPlans", plans));
					dispatch(customWorkoutUpdateField("creationType", "edit"));
					if (typeof localStorage !== "undefined") {
						localStorage.setItem(draftIdKey, newId);
						localStorage.setItem(draftModeKey, state.mode || "daily");
					}
					setLastSavedAt(new Date());
				}
				return;
			}
			toast.success(response.message);
			localStorage.removeItem(savedKey);
			localStorage.removeItem(draftIdKey);
			localStorage.removeItem(draftModeKey);
			router.push(`/coach/meals/list-custom?mode=${state.mode}`);
		} catch (error) {
			if (loadingToastId) toast.dismiss(loadingToastId);
			toast.error(error.message || "Something went wrong!");
		} finally {
			setLoading(false);
		}
	}

	const daysToDisplay = Object
		.keys(state.selectedPlans)
		.filter(day => viewType === "vertical" || state.selectedPlan === day)

	const handleToggle = function() {
		setIsExpanded(prev => !prev)
	}
	const canStartFromToday = ["copy_edit", "edit"].includes(state.creationType);

	return (
		<div className="flex flex-col gap-y-4 relative">
			<div className={cn("md:flex items-center justify-between")}>
				<DisplayMealStats
					meals={{ plans: { [state.selectedPlan]: state.selectedPlans[state.selectedPlan] } ?? {} }}
				/>
				<div className="px-4 py-2 flex items-center gap-3">
					<div className="flex items-center justify-between">
						<div className="flex p-1 bg-slate-100 rounded-xl border border-gray-200 gap-2">
							<button
								onClick={() => onToggleViewType("horizontal")}
								className={`p-2 rounded-[8px] transition-all duration-200 ${viewType === 'horizontal'
									? 'bg-white shadow-sm border border-gray-100'
									: 'opacity-50 hover:opacity-100'
									}`}
							>
								<img
									src="/horizontal.svg"
									alt="Horizontal"
									className="w-5 h-5 object-contain"
								/>
							</button>
							<button
								onClick={() => onToggleViewType("vertical")}
								className={`p-2 rounded-[8px] transition-all duration-200 ${viewType === 'vertical'
									? 'bg-white shadow-sm border border-gray-100'
									: 'opacity-50 hover:opacity-100'
									}`}
							>
								<img
									src="/vertical.svg"
									alt="Vertical"
									className="w-5 h-5 object-contain"
								/>
							</button>
						</div>
					</div>
				</div>
			</div>
			<div className={cn("grid gap-6 md:gap-4 md:divide-x-2", viewType === "vertical" ? "grid-cols-1 md:grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
				<CustomMealMetaData viewType={viewType} />
				<div className={cn("", viewType === "horizontal" && "border-1 p-4 rounded-[10px] bg-slate-50/20")}>
					{viewType === "vertical" && (
						<div className="flex items-center justify-between grow mb-4">
							<button
								onClick={handleToggle}
								className="group flex items-center gap-2 px-2.5 py-1.5 
								text-[13px] font-medium text-slate-500 
								bg-transparent rounded-md mb-4
								hover:bg-slate-100 hover:text-slate-800 
								transition-all duration-150 active:scale-95"
							>
								{isExpanded ? (
									<>
										<ListCollapse className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
										<span>Collapse All</span>
									</>
								) : (
									<>
										<ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
										<span>Expand All</span>
									</>
								)}
							</button>
							<div className="flex items-center gap-2">
								{state.mode === "monthly" && <AddNextDay />}
								<MealPlanActionsMenu
									toPlan={state.selectedPlan}
									selectedPlan={state.selectedPlan}
									showStartFromToday={state.mode === "monthly" && canStartFromToday}
									showRearrangeMealTypes
									onStartFromToday={() => dispatch(startFromToday())}
								/>
							</div>
						</div>
					)}
					<div className="fixed right-4 top-1/2 -translate-y-1/2 z-30">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPreviewOpen(!previewOpen)}
							className="rounded-l-lg rounded-r-none border-r-0 shadow-md bg-white hover:bg-gray-50"
						>
							{previewOpen ? (
								<ChevronRight className="w-4 h-4" />
							) : (
								<>
									<ChevronLeft className="w-4 h-4" />
									<span className="ml-2">Preview</span>
								</>
							)}
						</Button>
					</div>
					{component}
					{checkArray(daysToDisplay).map(day => <DayMealDishes
						key={day}
						selectedMealType={day}
						mealsForSelectedType={state.selectedPlans[day]}
						viewType={viewType}
						isExpanded={isExpanded}
						planMode={state.mode}
					/>)}
					<div className="mt-10 flex flex-wrap items-center gap-4">
						<Button
							disabled={loading}
							onClick={() => saveCustomWorkout({ draft: true })}
						>
							<SquarePen />
							Draft
						</Button>
						<Button
							disabled={loading}
							variant="wz"
							onClick={() => saveCustomWorkout({ draft: false })}
						>
							Save Meal
						</Button>
						{lastSavedAt && (
							<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
								<Clock className="w-3.5 h-3.5 shrink-0" />
								Last saved {format(lastSavedAt, "h:mm a")}
							</span>
						)}
					</div>
				</div>
			</div>
			{previewOpen && (
				<div
					className="fixed inset-0 bg-black/20 z-10 transition-opacity duration-300"
					onClick={() => setPreviewOpen(false)}
				/>
			)}

			<div className={`fixed right-0 top-0 bottom-0 bg-white border-l-1 shadow-2xl transition-all duration-300 ease-in-out z-[200] ${previewOpen ? 'w-[70%] translate-x-0' : 'w-0 translate-x-full overflow-hidden'
				}`}>
				{previewOpen && (
					<div className="h-full flex flex-col w-full">
						<div className="flex items-center justify-between p-3 border-b-1 flex-shrink-0 bg-gray-50">
							<h4 className="font-medium text-base text-gray-700">PDF Preview</h4>
							<button
								onClick={() => setPreviewOpen(false)}
								className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-200 transition-colors text-gray-600"
								aria-label="Close preview"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
						<div className="flex-1 overflow-hidden min-h-0">
							<CustomMealPlanPreview customMealState={state} />
						</div>
					</div>
				)}
			</div>

		</div>
	);
}

function DayMealDishes({
	selectedMealType,
	viewType,
	isExpanded,
	planMode
}) {
	const { dispatch } = useCurrentStateContext();
	const [open, setOpen] = useState(isExpanded)

	const props = {
		...(viewType === "horizontal"
			? { open: true }
			: { open: open, onOpenChange: setOpen  }),
	}

	useEffect(function() {
		setOpen(isExpanded)
	}, [isExpanded])
	
	return <Collapsible
		className="group mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300"
		{...props}
	>
		{viewType === "vertical" && (
			<CollapsibleTrigger asChild className="flex w-full items-center justify-between bg-slate-50/50 px-5 py-4 transition-colors hover:bg-slate-50">
				<div className="flex items-center justify-between w-full gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-sm">
						<ChevronDown size={18} className="transition-transform duration-300 group-data-[state=open]:rotate-180" />
					</div>
					<h3 className="text-sm mr-auto font-bold uppercase tracking-widest text-slate-700">
						{selectedMealType}
					</h3>
					{planMode === "monthly" && <Button
						variant="ghost"
						size="sm"
						onClick={(e) => {
							e.preventDefault()
							dispatch(deleteMonthlyDate(selectedMealType));
						}}
						className="h-8 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all group"
					>
						<Trash2 className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
						<span className="text-xs font-medium">Remove</span>
					</Button>}
				</div>
			</CollapsibleTrigger>
		)}

		<CollapsibleContent className="p-4 pt-2">
			<SelectMeals selectedPlan={selectedMealType} viewType={viewType} />
		</CollapsibleContent>
	</Collapsible>
}

function selectWorkoutCreationComponent(mode, viewType) {
	switch (mode) {
		case "daily":
			return (() => <></>)();
		case "weekly":
			return <WeeklyMealCreation viewType={viewType} />;
		case "monthly":
			return <MonthlyMealCreation viewType={viewType} />;
	}
}

function updateMealPlanDishes(plans) {
	const result = {};
	for (const key in plans) {
		const dayPayload = plans[key];
		result[key] = dayPayload.map(item => ({
			...item,
			meals: item.meals.map(dish => ({
				...dish,
				...parseImages(dish)
			}))
		}))
	}
	return result;
}

function parseImages(dish) {
	const regex = new RegExp(/^(https?:\/\/).*\.((jpg)|(jpeg)|(png)|(webp))$/i)
	if (regex.test(dish.image)) return dish
	return {
		image: dish.s3,
		s3: undefined
	}
}

function parseNum(val) {
	if (typeof val === "number") return Number.isFinite(val) ? val : 0;
	if (typeof val === "string") {
		const n = parseFloat(val.replace(/,/g, ""));
		return Number.isFinite(n) ? n : 0;
	}
	return 0;
}
