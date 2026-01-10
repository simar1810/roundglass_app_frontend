"use client";
import useSWR from "swr";
import { useRef, useState } from "react";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import { fetchData } from "@/lib/api";
import { buildUrlWithQueryParams } from "@/lib/formatter";
import Link from "next/link";
import AssignWorkout from "@/components/pages/coach/new-workout/Assign";
import { IoIosArrowDropdown } from "react-icons/io";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function Page() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: "createdAt:desc"
  });

  const endpoint = buildUrlWithQueryParams(
    "app/newWorkout/new-workout",
    filters
  );

  const { isLoading, error, data } = useSWR(
    endpoint,
    () => fetchData(endpoint),
    { keepPreviousData: true }
  );

  if (isLoading) return <ContentLoader />;
  if (error || data.status_code !== 200)
    return <ContentError title={error || data.message} />;

  const {
    results,
    page,
    totalPages
  } = data?.data || {};

  return (
    <div className="content-container content-height-screen flex flex-col h-full mt-0">
      <div className="mb-4 flex items-center justify-between">
        <h4>Workouts</h4>
        <CreationOptions />
        {/* <Link
          className="bg-green-600 px-4 py-2 text-white font-bold rounded-[4px]"
          href="/coach/workouts/new/creation">
          Create
        </Link> */}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {results.map(workout => (<WorkoutCard
          key={workout._id}
          workout={workout}
        />))}
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(newPage) =>
          setFilters(prev => ({ ...prev, page: newPage }))
        }
      />
    </div>
  );
}

function WorkoutCard({ workout }) {
  const {
    _id,
    title,
    mode,
    category,
    subcategory,
    coach,
    exercises,
    image,
    createdAt
  } = workout;

  const exerciseCount = Object.values(exercises || {}).reduce(
    (acc, day) => acc + day.length,
    0
  );

  return (
    <div className="border border-black/15 rounded-md bg-[var(--comp-1)] overflow-hidden flex flex-col">
      <Link href={`/coach/workouts/new/${_id}`}>
        <div className="relative h-36 w-full overflow-hidden cursor-pointer">
          <Image
            height={100}
            width={100}
            src={image || "/not-found.png"}
            onError={e => e.target.src = "/not-found.png"}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      </Link>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h5 className="text-sm font-medium leading-snug line-clamp-2">
            {title || "Untitled Workout"}
          </h5>
          <span className="text-[10px] px-2 py-0.5 rounded-sm border border-white/20 uppercase">
            {mode}
          </span>
        </div>
        <div className="text-xs text-[#808080] space-y-0.5">
          <div>{category} • {subcategory}</div>
          <div>
            Coach: <span className="text-black font-semibold">{coach?.name}</span>
          </div>
        </div>
        <div className="mt-auto flex items-center gap-2 justify-between text-xs text-[#808080]">
          <span>{exerciseCount} exercises</span>
          <span className="ml-auto">{new Date(createdAt).toLocaleDateString()}</span>
          <AssignWorkout workoutId={_id} />
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-auto flex items-center justify-center gap-2">
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
            className={`px-3 py-1 text-sm rounded-lg border 
              ${p === page
                ? "border-white text-[#000000] font-bold"
                : "border-white/10 text-[#000000]/40"
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

function CreationOptions() {
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  return <div className="relative" ref={dropdownRef}>
    <button
      onClick={() => setShowDropdown((prev) => !prev)}
      className="px-2 md:px-4 py-2 md:py-3 flex items-center justify-around gap-1 rounded-lg bg-[#67BC2A] hover:bg-green-700 text-white font-semibold text-[10px] md:text-xs"
    >
      Create Manual Plan
      <IoIosArrowDropdown
        size={16}
        className={cn(
          "text-white ml-1 transition-transform",
          showDropdown ? "rotate-180" : ""
        )}
      />
    </button>
    {showDropdown && (
      <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg border border-gray-200 rounded-md z-20 overflow-clip">
        {["daily", "weekly", "monthly"].map((item) => (
          <Link
            key={item}
            href={`/coach/workouts/new/creation/${item}`}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition"
          >
            {item.charAt(0).toUpperCase() + item.slice(1)} Plan
          </Link>
        ))}
      </div>
    )}
  </div>
}