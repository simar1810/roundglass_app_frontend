export const INGREDIENT_SOURCE_TABS = [
	{ value: "all", label: "All" },
	{ value: "admin", label: "Admin" },
	{ value: "manual", label: "Manual" },
];

/** Resolve coach id from Redux coach slice or API ingredient row. */
export function normalizeIngredientCoachRef(coachRef) {
	if (coachRef == null) return null;
	if (typeof coachRef === "object") {
		const id = coachRef._id ?? coachRef.coachId ?? coachRef.id;
		if (id != null && String(id).trim() !== "") return String(id);
		return null;
	}
	const text = String(coachRef).trim();
	return text || null;
}

export function getAppCoachId(coachData) {
	return normalizeIngredientCoachRef(coachData);
}

export function isCoachOwnedIngredient(row, coachId) {
	const rowCoachId = normalizeIngredientCoachRef(row?.coach);
	const normalizedCoachId = normalizeIngredientCoachRef(coachId);
	if (!normalizedCoachId || !rowCoachId) return false;
	return rowCoachId === normalizedCoachId;
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
