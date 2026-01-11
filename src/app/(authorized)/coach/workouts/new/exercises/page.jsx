"use client";

import useSWR from "swr";
import { useState } from "react";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import { fetchData } from "@/lib/api";
import { buildUrlWithQueryParams } from "@/lib/formatter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DEFAULT_FILTERS = {
  person: "coach",
  page: 1,
  limit: 10,
  sortBy: "category:asc",
  category: "strength",
  bodyPart: "waist",
  target: "abs",
  equipment: "body weight",
};

export default function Page() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const endpoint = buildUrlWithQueryParams(
    "app/newWorkout/new-exercise",
    filters,
  );

  const { isLoading, error, data } = useSWR(endpoint, () =>
    fetchData(endpoint),
  );

  if (isLoading) return <ContentLoader />;

  if (error || data?.status_code !== 200) {
    return (
      <ContentError
        title={error?.message || data?.message || "Something went wrong"}
      />
    );
  }

  const { results = [], page, totalPages } = data.data;

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      [key]: value,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  return (
    <div className="content-container content-height-screen mt-0 flex flex-col">
      <h4 className="text-xl font-semibold mb-4">These are the exercises</h4>

      <ExerciseFilter filters={filters} onChange={updateFilter} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {results.map((exercise) => (
          <ExerciseCard key={exercise._id} exercise={exercise} />
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

function ExerciseCard({ exercise }) {
  const [videoError, setVideoError] = useState(false);

  const showVideo = exercise.videoLink && !videoError;

  return (
    <Card className="bg-gray-50 border border-border rounded-xl p-4 shadow-none">
      <div className="flex gap-4">
        <div className="w-28 h-28 flex-shrink-0 flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/40">
          {showVideo ? (
            <video
              src={exercise.videoLink}
              muted
              loop
              autoPlay
              playsInline
              onError={() => setVideoError(true)}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-14 h-14 rounded-full border border-muted-foreground/40 flex items-center justify-center text-xs text-muted-foreground">
              No Video
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-tight">
              {exercise.name}
            </h3>

            <Badge variant="outline" className="text-xs">
              {exercise.difficulty}
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground">
            {exercise.target} · {exercise.equipment}
          </div>

          {exercise.instructions?.length > 0 && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {exercise.instructions[0]}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function ExerciseFilters({ filters, onChange }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <input
        value={filters.bodyPart}
        onChange={(e) => onChange("bodyPart", e.target.value)}
        placeholder="Body Part"
        className="border rounded px-3 py-2 text-sm"
      />

      <input
        value={filters.target}
        onChange={(e) => onChange("target", e.target.value)}
        placeholder="Target"
        className="border rounded px-3 py-2 text-sm"
      />

      <input
        value={filters.equipment}
        onChange={(e) => onChange("equipment", e.target.value)}
        placeholder="Equipment"
        className="border rounded px-3 py-2 text-sm"
      />

      <select
        value={filters.category}
        onChange={(e) => onChange("category", e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      >
        <option value="strength">Strength</option>
        <option value="cardio">Cardio</option>
        <option value="stretching">Stretching</option>
      </select>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1 text-sm rounded-lg border border-white/10 disabled:opacity-40"
      >
        Prev
      </button>

      {Array.from({ length: totalPages }).map((_, i) => {
        const p = i + 1;
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1 text-sm rounded-lg border ${p === page
                ? "border-white text-black font-bold"
                : "border-white/10 text-black/40"
              }`}
          >
            {p}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1 text-sm rounded-lg border border-white/10 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
