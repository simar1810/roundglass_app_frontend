"use client";

import useDebounce from "@/hooks/useDebounce";
import { searchIngredients } from "@/lib/fetchers/app";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

const MIN_QUERY_LEN = 2;

function keyFactory(namespace, q, category, source, skip, enabled) {
	return enabled ? [namespace, q, category, source, skip] : null;
}

export default function useIngredientCatalogSearch({
	namespace,
	pageSize = 30,
	debounceMs = 280,
	source = "all",
	minQueryLength = MIN_QUERY_LEN,
}) {
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState("");
	const [skip, setSkip] = useState(0);
	const [rows, setRows] = useState([]);

	const debouncedQ = useDebounce(query, debounceMs);
	const debouncedCategory = useDebounce(category, debounceMs);
	const normalizedSource = source === "admin" || source === "manual" ? source : "all";

	const trimmedQ = debouncedQ.trim();
	const trimmedCategory = debouncedCategory.trim();
	const canFetch =
		trimmedQ.length >= minQueryLength ||
		trimmedCategory.length > 0 ||
		normalizedSource === "manual";

	useEffect(() => {
		setSkip(0);
		setRows([]);
	}, [trimmedQ, trimmedCategory, normalizedSource]);

	const swrKey = useMemo(
		() =>
			keyFactory(
				namespace,
				trimmedQ,
				trimmedCategory,
				normalizedSource,
				skip,
				canFetch,
			),
		[namespace, trimmedQ, trimmedCategory, normalizedSource, skip, canFetch],
	);

	const { data, isLoading, isValidating, error } = useSWR(
		swrKey,
		() =>
			searchIngredients({
				q: trimmedQ || undefined,
				category: trimmedCategory || undefined,
				limit: pageSize,
				skip,
				source: normalizedSource !== "all" ? normalizedSource : undefined,
			}),
		{
			keepPreviousData: true,
			dedupingInterval: 5000,
			revalidateOnFocus: false,
		},
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
		canFetch,
		minQueryLength,
		canLoadMore,
		loadMore: () => setSkip((value) => value + pageSize),
		reset: () => {
			setSkip(0);
			setRows([]);
		},
	};
}
