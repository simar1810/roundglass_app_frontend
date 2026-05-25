export const INGREDIENT_SOURCE_TABS = [
	{ value: "all", label: "All" },
	{ value: "admin", label: "Admin" },
	{ value: "manual", label: "Manual" },
];

export function isCoachOwnedIngredient(row, coachId) {
	if (!coachId || row?.coach == null) return false;
	return String(row.coach) === String(coachId);
}

export function filterIngredientsBySource(rows, coachId, source) {
	return rows.filter((row) => {
		const manual = isCoachOwnedIngredient(row, coachId);
		if (source === "all") return true;
		if (source === "admin") return !manual;
		if (source === "manual") return manual;
		return true;
	});
}
