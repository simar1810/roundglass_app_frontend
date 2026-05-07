import { ddMMyyyy } from "@/config/data/regex";
import { addDays, compareDesc, format, parse } from "date-fns";
import { checkArray } from "./formatter";

const dayMap = {
	sun: 0, sunday: 0,
	mon: 1, monday: 1,
	tue: 2, tuesday: 2,
	wed: 3, wednesday: 3,
	thu: 4, thursday: 4,
	fri: 5, friday: 5,
	sat: 6, saturday: 6
};

const sortDates = (dates) => dates
	.map(key => ddMMyyyy.test(key)
		? parse(key, "dd-MM-yyyy", new Date())
		: parse(key, "yyyy-MM-dd", new Date())
	)
	.sort(compareDesc)

export const buildImportPayload = function (plan, currentPlans) {
	const sortedDates = sortDates(Object.keys(currentPlans))
	const lastDate = sortedDates?.at(0)

	switch (plan.mode) {
		case "daily": {
			const newDateKey = format(addDays(lastDate, 1), "dd-MM-yyyy")
			return {
				...currentPlans,
				[newDateKey]: checkArray(plan?.plans?.daily?.meals)
			}
		}
		case "weekly": {
			const importSource = plan.plans;
			const normalizedImport = {};

			Object.keys(importSource).forEach(key => {
				const dayIndex = dayMap[key.toLowerCase()];
				if (dayIndex !== undefined) {
					normalizedImport[dayIndex] = importSource[key];
				}
			});

			return Array.from({ length: 7 }).reduce((acc, _, idx) => {
				const nextDate = addDays(lastDate, idx + 1);
				const nextDateKey = format(nextDate, "dd-MM-yyyy");
				const dayOfWeek = nextDate.getDay();
				const mealsToImport = normalizedImport[dayOfWeek]?.meals;
				return {
					...acc,
					[nextDateKey]: checkArray(mealsToImport)
				};
			}, currentPlans);
		}
		case "monthly": {
			const mealsList = plan.plans
			const sortedImportPlanDates = sortDates(Object.keys(plan?.plans)).reverse()
			return sortedImportPlanDates
				.reduce((acc, curr, idx) => ({
					...acc,
					[format(addDays(lastDate, idx + 1), "dd-MM-yyyy")]: checkArray(mealsList[format(curr, "dd-MM-yyyy")]?.meals)
				}), currentPlans)
		}
		default:
			throw new Error("Invalid plan mode!");
	}
}