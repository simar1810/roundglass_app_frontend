"use client";

import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import FormControl from "@/components/FormControl";
import Paginate from "@/components/Paginate";
import AddIngredientModal from "@/components/modals/meals/AddIngredientModal";
import DeleteIngredientModal from "@/components/modals/meals/DeleteIngredientModal";
import EditIngredientModal from "@/components/modals/meals/EditIngredientModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getIngredients } from "@/lib/fetchers/app";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

const DEFAULT_LIMIT = 20;

function buildSwrKey(page, limit, category, q) {
  return ["ingredients", page, limit, category ?? "", q ?? ""];
}

function ingredientsFetcher([_, page, limit, category, q]) {
  const p = Number(page) || 1;
  const l = Number(limit) || DEFAULT_LIMIT;
  return getIngredients({
    limit: l,
    skip: (p - 1) * l,
    ...(category && String(category).trim() !== "" && { category: String(category).trim() }),
    ...(q && String(q).trim() !== "" && { q: String(q).trim() }),
  });
}

export default function Page() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [category, setCategory] = useState("");
  const [q, setQuery] = useState("");

  const swrKey = useMemo(() => buildSwrKey(page, limit, category, q), [page, limit, category, q]);
  const { data, isLoading, isValidating, error, mutate } = useSWR(swrKey, ingredientsFetcher, {
    keepPreviousData: true,
  });

  const handlePaginateChange = useCallback(({ page: newPage, limit: newLimit }) => {
    setPage(newPage);
    setLimit(newLimit);
  }, []);

  const handleQueryChange = useCallback((value) => {
    setQuery(value);
    setPage(1);
  }, []);
  const handleCategoryChange = useCallback((value) => {
    setCategory(value);
    setPage(1);
  }, []);

  const hasData = Boolean(data?.success);
  const ingredients = hasData && Array.isArray(data?.data) ? data.data : [];
  const total = hasData ? Number(data?.total) ?? 0 : 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="content-container mt-8 md:mt-0">
      <Header
        category={category}
        onCategoryChange={handleCategoryChange}
        q={q}
        onQueryChange={handleQueryChange}
        onAddSuccess={mutate}
      />
      <div className="rounded-md border border-[var(--dark-1)]/10 mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Food code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Protein (g)</TableHead>
              <TableHead className="text-right">Fat (g)</TableHead>
              <TableHead className="text-right">Carbs (g)</TableHead>
              <TableHead className="text-right">Energy (kJ)</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error || (data && !data?.success) ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8">
                  <ContentError
                    title={error?.message || data?.message || "Failed to load ingredients"}
                  />
                </TableCell>
              </TableRow>
            ) : !hasData && isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-[var(--dark-1)]/50 py-8">
                  Loading ingredients…
                </TableCell>
              </TableRow>
            ) : ingredients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-[var(--dark-1)]/50 py-8">
                  No ingredients found. Try adjusting search or add one.
                </TableCell>
              </TableRow>
            ) : (
              ingredients.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="font-mono text-xs">{row.foodCode ?? "—"}</TableCell>
                  <TableCell>{row.foodName ?? "—"}</TableCell>
                  <TableCell>{row.category ?? "—"}</TableCell>
                  <TableCell className="text-right">{row.protein ?? "—"}</TableCell>
                  <TableCell className="text-right">{row.totalFat ?? "—"}</TableCell>
                  <TableCell className="text-right">{row.carbohydrate ?? "—"}</TableCell>
                  <TableCell className="text-right">{row.energyKJ ?? "—"}</TableCell>
                  <TableCell className="flex items-center gap-1">
                    <EditIngredientModal ingredient={row} onSuccess={() => mutate()} />
                    <DeleteIngredientModal
                      id={row._id}
                      mutateKey={swrKey}
                      onSuccess={() => mutate()}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {(isValidating || isLoading) && (
        <div className="mt-2 text-xs text-[var(--dark-1)]/50">
          Updating results…
        </div>
      )}
      {total > 0 && (
        <div className="mt-4">
          <Paginate
            page={page}
            limit={limit}
            totalPages={totalPages}
            totalResults={total}
            onChange={handlePaginateChange}
          />
        </div>
      )}
    </div>
  );
}

function Header({ category, onCategoryChange, q, onQueryChange, onAddSuccess }) {
  return (
    <div className="md:mb-4 pb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 md:border-b border-[var(--dark-1)]/10">
      <h4 className="text-lg font-semibold">Ingredients</h4>
      <div className="flex flex-wrap items-center gap-2">
        <FormControl
          className="min-w-[140px] [&_.input]:text-[12px]"
          placeholder="Search…"
          value={q}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <FormControl
          className="min-w-[120px] [&_.input]:text-[12px]"
          placeholder="Category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
        />
        <AddIngredientModal onSuccess={onAddSuccess} />
      </div>
    </div>
  );
}
