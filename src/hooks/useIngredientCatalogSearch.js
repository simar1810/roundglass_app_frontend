"use client";

import useDebounce from "@/hooks/useDebounce";
import { searchIngredients } from "@/lib/fetchers/app";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

function keyFactory(namespace, q, category, skip) {
	return [namespace, q, category, skip];
}

export default function useIngredientCatalogSearch({
	namespace,
	pageSize = 50,
	debounceMs = 400,
}) {
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState("");
	const [skip, setSkip] = useState(0);
	const [rows, setRows] = useState([]);

	const debouncedQ = useDebounce(query, debounceMs);
	const debouncedCategory = useDebounce(category, debounceMs);

	useEffect(() => {
		setSkip(0);
		setRows([]);
	}, [debouncedQ, debouncedCategory]);

	const swrKey = useMemo(
		() => keyFactory(namespace, debouncedQ, debouncedCategory, skip),
		[namespace, debouncedQ, debouncedCategory, skip],
	);

	const { data, isLoading, isValidating, error } = useSWR(swrKey, () =>
		searchIngredients({
			q: debouncedQ.trim() || undefined,
			category: debouncedCategory.trim() || undefined,
			limit: pageSize,
			skip,
		}),
	);

	useEffect(() => {
		if (!data) return;
		const ok =
			data.status_code === 200 ||
			data.status_code === "200" ||
			data.success === true;
		if (!ok) return;

		const incoming = Array.isArray(data.data)
			? data.data
			: Array.isArray(data.ingredients)
				? data.ingredients
				: [];

		setRows((prev) => {
			if (skip === 0) return incoming;
			const seen = new Set(prev.map((item) => String(item?._id)));
			const fresh = incoming.filter(
				(item) => item && !seen.has(String(item?._id)),
			);
			return fresh.length > 0 ? [...prev, ...fresh] : prev;
		});
	}, [data, skip]);

	const total = Number.isFinite(data?.total) ? data.total : 0;
	const canLoadMore = rows.length > 0 && rows.length < total;

	return {
		query,
		setQuery,
		category,
		setCategory,
		skip,
		setSkip,
		rows,
		isLoading,
		isValidating,
		error,
		data,
		total,
		canLoadMore,
		loadMore: () => setSkip((value) => value + pageSize),
		reset: () => {
			setSkip(0);
			// setRows([]);
		},
	};
}
