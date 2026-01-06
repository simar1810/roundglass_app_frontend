import { DisplayMealStats } from "@/app/(authorized)/coach/meals/list-custom/[id]/page";
import { Button } from "@/components/ui/button";
import {
	customWorkoutUpdateField,
	dailyMealRP,
	mealPlanCreationRP,
} from "@/config/state-reducers/custom-meal";
import { sendData, uploadImage } from "@/lib/api";
import { _throwError, format24hr_12hr } from "@/lib/formatter";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import CustomMealMetaData from "./CustomMealMetaData";
import MonthlyMealCreation from "./MonthlyMealCreation";
import SelectMeals from "./SelectMeals";
import WeeklyMealCreation from "./WeeklyMealCreation";

export default function Stage2() {
	const [loading, setLoading] = useState(false);
	const { dispatch, ...state } = useCurrentStateContext();
	const component = selectWorkoutCreationComponent(state.mode);
	const { cache } = useSWRConfig();

	const router = useRouter();

	const mealsForSelectedType = useMemo(() => {
		const plan = state.selectedPlans?.[state.selectedPlan] ?? {};
		  const normalizedMeals = [
			  { mealType: "breakfast", meals: plan.breakfast },
    		  { mealType: "lunch", meals: plan.lunch },
    		  { mealType: "dinner", meals: plan.dinner },
    		  { mealType: "snacks", meals: plan.snacks },
		].filter(item => Array.isArray(item.meals) && item.meals.length > 0);
  		const mealTypesArray = Array.isArray(plan)
    		? plan
    		: normalizedMeals;
		const selected = mealTypesArray.find(
			(item) => item?.mealType === state.selectedMealType
		);
		return Array.isArray(selected?.meals) ? selected.meals : [];
	}, [state.selectedPlans, state.selectedPlan, state.selectedMealType]);

	const totals = useMemo(() => {
		const parseNum = (val) => {
			if (typeof val === "number") return Number.isFinite(val) ? val : 0;
			if (typeof val === "string") {
				const n = parseFloat(val.replace(/,/g, ""));
				return Number.isFinite(n) ? n : 0;
			}
			return 0;
		};

		return mealsForSelectedType.reduce(
			(acc, meal) => {
				const caloriesVal =
					typeof meal?.calories === "object"
						? meal?.calories?.total
						: meal?.calories;
				const proteinVal = meal?.protein ?? meal?.calories?.proteins;
				const carbsVal = meal?.carbohydrates ?? meal?.calories?.carbs;
				const fatsVal = meal?.fats ?? meal?.calories?.fats;

				acc.calories += parseNum(caloriesVal);
				acc.protein += parseNum(proteinVal);
				acc.carbohydrates += parseNum(carbsVal);
				acc.fats += parseNum(fatsVal);
				return acc;
			},
			{ calories: 0, protein: 0, carbohydrates: 0, fats: 0 }
		);
	}, [mealsForSelectedType]);

	async function saveCustomWorkout({
		draft
	}) {
		try {
			// check the conditions only if creation type is not a draft.
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
							// for (const field of ["time", "dish_name", "meal_time"]) {
							if (!meal.time && !meal.meal_time)
								_throwError(
									`Time should be selected for all the meals. Not provided for ${mealType.mealType}`
								);
							if (!meal.dish_name)
								_throwError(
									`Dish should be selected for all the meals. Not provided for ${mealType.mealType}`
								);
							// }
							// if (!meal._id && !meal.mealId) _throwError(`Please select a dish from the options`);
							meal.meal_time = format24hr_12hr(meal.time || meal.meal_time);

						}
					}
				}
			}

			if (["new", "copy_edit"].includes(state.creationType)) {
				newWorkout({ draft });
			} else if (["edit"].includes(state.creationType)) {
				editWorkout({ draft });
			}
		} catch (error) {
			toast.error(error.message || "Something went wrong!");
		}
	}

	async function editWorkout({ draft }) {
		try {
			setLoading(true);
			let thumbnail;
			if (state.file) {
				const toastId = toast.loading("Uploading Thumbnail...");
				thumbnail = await uploadImage(state.file);
				dispatch(customWorkoutUpdateField("image", thumbnail.img));
				toast.dismiss(toastId);
			}
			const plans = {};
			for (const key in state.selectedPlans) {
				const toastId = toast.loading(`Creating Meal Plan - ${key}...`);
				let createdMealPlan;
				if (state.editPlans[key]) {
					createdMealPlan = await sendData(
						`app/update-custom-plan?id=${state.editPlans[key]}`,
						mealPlanCreationRP(state.selectedPlans[key],),
						"PUT"
					);
				} else {
					createdMealPlan = await sendData(
						"app/create-custom-plan",
						mealPlanCreationRP(state.selectedPlans[key]),
						"POST"
					);
				}
				if (createdMealPlan.status_code !== 200) {
					toast.dismiss(toastId);
					_throwError(createdMealPlan.message);
				}
				plans[key] =
					createdMealPlan?.data?.planId || createdMealPlan?.data?._id;
				toast.dismiss(toastId);
			}

			const toastId = toast.loading("Creating The Custom Meal Plan...");
			const formData = dailyMealRP(state);

			const response = await sendData(
				`app/meal-plan/custom`,
				{
					...formData,
					image: thumbnail?.img || state.thumbnail,
					plans: state.selectedPlans,
					id: state.id,
					planIds: plans,
					draft
				},
				"PUT"
			);
			toast.dismiss(toastId);
			if (response.status_code !== 200) _throwError(response.message);
			toast.success(response.message);
			window.location.href = `/coach/meals/list-custom?mode=${state.mode}`;
		} catch (error) {
			toast.error(error.message || "Something went wrong!");
		} finally {
			setLoading(false);
		}
	}

	async function newWorkout({ draft }) {
		try {
			setLoading(true);
			const plans = {};
			let toastId;
			
			// Check if this is an AI-generated meal plan that already exists
			const aiMealPlanId = state.aiMealPlanId;
			const isUpdatingAiPlan = Boolean(aiMealPlanId);
			
			for (const key in state.selectedPlans) {
				toastId = toast.loading(`${isUpdatingAiPlan ? 'Updating' : 'Creating'} Meal Plan - ${key}...`);
				
				// Normalize the plan data to ensure it's in the correct format
				let planData = state.selectedPlans[key];
				if (!Array.isArray(planData)) {
					// If it's an object with meals property, use that
					if (Array.isArray(planData?.meals)) {
						planData = planData.meals;
					} else {
						// If it's an object with meal type keys (breakfast, lunch, etc.), transform it
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
					toast.dismiss(toastId);
					_throwError(`No meals found for ${key}. Please add at least one meal.`);
				}
				
				// For AI plans, the day plans might already exist, but we'll still create/update them
				// The backend will handle updating existing plans if needed
				const createdMealPlan = await sendData(
					"app/create-custom-plan",
					mealPlanCreationRP(planData)
				);
				if (createdMealPlan.status_code !== 200) {
					toast.dismiss(toastId);
					_throwError(createdMealPlan.message);
				}
				plans[key] = createdMealPlan?.data?.planId;
				toast.dismiss(toastId);
			}

			let thumbnail;
			if (state.file) {
				const uploadToastId = toast.loading("Uploading Thumbnail...");
				thumbnail = await uploadImage(state.file);
				dispatch(customWorkoutUpdateField("image", thumbnail.img));
				toast.dismiss(uploadToastId);
			}

			toastId = toast.loading(`${isUpdatingAiPlan ? 'Updating' : 'Creating'} The Custom Meal Plan...`);
			const formData = dailyMealRP(state);
			
			// If this is an AI-generated plan with an ID, use PUT to update instead of POST to create
			if (isUpdatingAiPlan) {
				const response = await sendData(
					`app/meal-plan/custom`,
					{
						...formData,
						image: thumbnail?.img || state.thumbnail,
						plans: state.selectedPlans,
						id: aiMealPlanId,
						planIds: plans,
						draft
					},
					"PUT"
				);
				toast.dismiss(toastId);
				if (response.status_code !== 200) _throwError(response.message);
				cache.delete("custom-meal-plans");
				toast.success(response.message);
				localStorage.removeItem("aiMealPlan");
				router.push(`/coach/meals/list-custom?mode=${state.mode}`);
			} else {
				const response = await sendData(`app/meal-plan/custom`, {
					...formData,
					image: thumbnail?.img || state.thumbnail,
					plans,
					draft
				});
				toast.dismiss(toastId);
				if (response.status_code !== 200) _throwError(response.message);
				cache.delete("custom-meal-plans");
				toast.success(response.message);
				localStorage.removeItem("aiMealPlan");
				router.push(`/coach/meals/list-custom?mode=${state.mode}`);
			}
		} catch (error) {
			toast.error(error.message || "Something went wrong!");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			<div className="flex flex-col gap-y-4">
				<DisplayMealStats meals={{ plans: { [state.selectedPlan]: state.selectedPlans[state.selectedPlan] } ?? {} }} />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0 md:divide-x-2">
					<CustomMealMetaData />
					<div className="md:pl-8">
						{component}
						<SelectMeals
							key={`${state.selectedPlan}${state.selectedMealType}`}
						/>
						<div className="mt-4 rounded-lg border px-4 py-2 text-sm text-muted-foreground grid grid-cols-4 gap-6">
							<div>{totals.calories.toFixed(2)} Calories</div>
							<div>{totals.protein.toFixed(2)} Protein</div>
							<div>{totals.fats.toFixed(2)} Fats</div>
							<div>{totals.carbohydrates.toFixed(2)} Carbs</div>
						</div>
						<div className="mt-10 grid grid-cols-2 gap-4">
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
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function selectWorkoutCreationComponent(mode) {
	switch (mode) {
		case "daily":
			return (() => <></>)();
		case "weekly":
			return <WeeklyMealCreation />;
		case "monthly":
			return <MonthlyMealCreation />;
	}
}
