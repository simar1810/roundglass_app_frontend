export function normalizeFilterText(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function matchesCategoryFilter(itemValue, filterValue) {
  if (filterValue === "all") return true;
  return normalizeFilterText(itemValue) === normalizeFilterText(filterValue);
}

export function hasActiveCategoryFilters(category, subCategory) {
  return category !== "all" || subCategory !== "all";
}

export function getCategoryFilterEmptyMessage({
  entityLabel = "items",
  hasSearch = false,
  hasCategoryFilters = false,
}) {
  if (hasSearch && hasCategoryFilters) {
    return `No ${entityLabel} match your search and category filters.`;
  }
  if (hasSearch) {
    return `No ${entityLabel} match your search.`;
  }
  if (hasCategoryFilters) {
    return `No ${entityLabel} match the selected category filters.`;
  }
  return `No ${entityLabel} found.`;
}
