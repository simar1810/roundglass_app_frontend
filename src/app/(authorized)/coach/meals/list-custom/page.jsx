"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import FormControl from "@/components/FormControl";
import AssignMealModal from "@/components/modals/Assignmealmodal";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  SAVED_MEAL_PLAN_STORAGE_KEY,
  DRAFT_PLAN_ID_STORAGE_KEY,
  DRAFT_PLAN_MODE_STORAGE_KEY,
  getMealPlanStorageKey,
} from "@/config/state-data/custom-meal";
import { sendData } from "@/lib/api";
import { getCustomMealPlans } from "@/lib/fetchers/app";
import { cn } from "@/lib/utils";
import { Package, Pencil, Plus, SquarePen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAppSelector } from "@/providers/global/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiFilter } from "react-icons/fi";
import { IoIosArrowDropdown, IoMdAddCircle } from "react-icons/io";
import { LuTrash } from "react-icons/lu";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { useFeatureScope } from "@/hooks/useFeatureScope";
export default function Page() {
  const { hasAccess: canManageMealPlans } = useFeatureScope("meal_plans:manage")
  const { hasAccess: canManageIngredients } = useFeatureScope(["ingredients:manage", "ingredients:read"])
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "daily";
  const router = useRouter();

  const [query, setQuery] = useState("");
  // typeFilter: "all" | "admin" | "manual" | "draft"
  const typeFilter = searchParams.get("type") || "all";
  const tagFilter = searchParams.get("tag") || "all";
  const [showFilters, setShowFilters] = useState(false);
  const [showTagFilters, setShowTagFilters] = useState(false);
  const { isLoading, error, data } = useSWR("custom-meal-plans", () =>
    getCustomMealPlans("coach"),
    { revalidateOnFocus: true, revalidateIfStale: true }
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const filterRef = useRef(null);
  const tagFilterRef = useRef(null);
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [editingTagId, setEditingTagId] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [savingTagId, setSavingTagId] = useState("");
  const [plansState, setPlansState] = useState([]);
  const coachId = useAppSelector((s) => s.coach?.data?._id) ?? null;
  const savedKey = getMealPlanStorageKey(SAVED_MEAL_PLAN_STORAGE_KEY, coachId);
  const draftIdKey = getMealPlanStorageKey(DRAFT_PLAN_ID_STORAGE_KEY, coachId);
  const draftModeKey = getMealPlanStorageKey(DRAFT_PLAN_MODE_STORAGE_KEY, coachId);

  const setTypeFilter = (value) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", mode);
    if (value && value !== "all") params.set("type", value);
    else params.delete("type");
    if (tagFilter && tagFilter !== "all") params.set("tag", tagFilter);
    else params.delete("tag");
    router.push(`?${params.toString()}`);
  };
  const setTagFilter = (value) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", mode);
    if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
    else params.delete("type");
    if (value && value !== "all") params.set("tag", value);
    else params.delete("tag");
    router.push(`?${params.toString()}`);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
      if (tagFilterRef.current && !tagFilterRef.current.contains(event.target)) {
        setShowTagFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setPlansState(Array.isArray(data?.data) ? data.data : []);
  }, [data]);

  const mealRegex = new RegExp(query, "i")

  const applyTypeFilter = (meal) => {
    if (typeFilter === "all") return true;
    if (typeFilter === "admin") return Boolean(meal.admin);
    if (typeFilter === "manual") return !meal.admin;
    if (typeFilter === "draft") return Boolean(meal.draft);
    return true;
  };
  const applyTagFilter = (meal) => {
    if (tagFilter === "all") return true;
    return getTagValue(meal) === tagFilter;
  };

  const availableTags = useMemo(() => {
    const source = ["daily", "weekly", "monthly"].includes(mode)
      ? plansState.filter((meal) => meal.mode === mode)
      : plansState;

    return Array.from(
      new Set(
        source
          .map((meal) => getTagValue(meal))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [plansState, mode]);

  const filteredMealPlans = ["daily", "weekly", "monthly"].includes(mode)
    ? plansState
      .filter((meal) => meal.mode === mode)
      .filter((meal) => mealRegex.test(meal.title))
      .filter(applyTypeFilter)
      .filter(applyTagFilter)
      .sort(sortMealsByTagThenRecent)
    : plansState
      .filter((meal) => mealRegex.test(meal.title))
      .filter(applyTypeFilter)
      .filter(applyTagFilter)
      .sort(sortMealsByTagThenRecent);

  const handleNavigate = (planMode) => {
    localStorage.removeItem(savedKey);
    localStorage.removeItem(draftIdKey);
    localStorage.removeItem(draftModeKey);
    router.push(`/coach/meals/add-custom/${planMode}`);
    setShowDropdown(false);
  };
  const handleDeleteMeal = async (id) => {
    try {
      setLoading(true);
      const response = await sendData(`app/meal-plan/custom?id=${id}`, {}, "DELETE");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success("Meal deleted successfully!");
      await mutate("custom-meal-plans");
      await mutate("dashboardStatistics");
    } catch (error) {
      toast.error(error.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const openTagModal = (meal) => {
    const mealId = String(meal?._id || "");
    if (!mealId) return;
    setEditingTagId(mealId);
    setTagDraft(getTagValue(meal));
    setTagModalOpen(true);
  };

  const closeTagModal = () => {
    if (savingTagId) return;
    setTagModalOpen(false);
    setEditingTagId("");
    setTagDraft("");
  };

  const handleUpdateTag = async (mealId, nextTagInput) => {
    const nextTag = String(nextTagInput || "").trim();
    if (!mealId) return;
    const meal = plansState.find((item) => String(item?._id) === mealId);
    const currentTag = getTagValue(meal);
    if (nextTag === currentTag) {
      closeTagModal();
      return;
    }

    const previousTag = currentTag;
    setSavingTagId(mealId);

    setPlansState((prev) =>
      prev.map((item) => (String(item?._id) === mealId ? { ...item, tag: nextTag } : item))
    );
    mutate(
      "custom-meal-plans",
      (prev) => {
        if (!prev || !Array.isArray(prev?.data)) return prev;
        return {
          ...prev,
          data: prev.data.map((item) =>
            String(item?._id) === mealId ? { ...item, tag: nextTag } : item
          ),
        };
      },
      false
    );

    try {
      const response = await sendData(
        `app/meal-plan/custom/edit-tag?id=${mealId}`,
        { tag: nextTag },
        "PUT"
      );
      if (response?.status_code !== 200) {
        throw new Error(response?.message || "Unable to update tag");
      }
      toast.success("Tag updated");
      closeTagModal();
    } catch (error) {
      setPlansState((prev) =>
        prev.map((item) => (String(item?._id) === mealId ? { ...item, tag: previousTag } : item))
      );
      mutate(
        "custom-meal-plans",
        (prev) => {
          if (!prev || !Array.isArray(prev?.data)) return prev;
          return {
            ...prev,
            data: prev.data.map((item) =>
              String(item?._id) === mealId ? { ...item, tag: previousTag } : item
            ),
          };
        },
        false
      );
      toast.error(error?.message || "Failed to update tag");
    } finally {
      setSavingTagId("");
    }
  };

  if (isLoading) return <ContentLoader />;
  if (error || data?.status_code !== 200)
    return <ContentError title={error || data?.message} />;

  return (
    <>
      <main className="content-container flex flex-col">
        <div>
          <div className="flex flex-col lg:flex-row items-start md:items-center md:justify-between py-3 border-b border-gray-200 relative gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h2 className="text-2xl font-bold text-gray-800">Meals & Recipes</h2>
              {/* {canManageIngredients && (
                <Link
                  href="/coach/meals/ingredients-catalog"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#67BC2A] px-3 py-1.5 text-xs font-semibold text-[#2d5016] bg-white hover:bg-green-50 transition w-fit"
                >
                  <Package className="size-3.5 shrink-0" aria-hidden />
                  Ingredient catalog
                </Link>
              )} */}
            </div>
            <div className="flex gap-3 items-center">
              {canManageMealPlans && <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown((prev) => !prev)}
                  className="px-2 md:px-3 py-2 md:py-3 flex items-center justify-around gap-1 rounded-lg bg-[#67BC2A] hover:bg-green-700 text-white font-semibold text-[10px] md:text-xs"
                >
                  <IoMdAddCircle size={14} className="text-white" />
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
                  <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg border border-gray-200 rounded-md z-20">
                    {["daily", "weekly", "monthly"].map((item) => (
                      <button
                        key={item}
                        onClick={() => handleNavigate(item)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition"
                      >
                        {item.charAt(0).toUpperCase() + item.slice(1)} Plan
                      </button>
                    ))}
                  </div>
                )}
              </div>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center justify-between ">
            <div className="flex gap-6 mt-5">
              {["daily", "weekly", "monthly"].map((tab) => {
                const params = new URLSearchParams();
                params.set("mode", tab);
                if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
                if (tagFilter && tagFilter !== "all") params.set("tag", tagFilter);
                return (
                  <Link
                    key={tab}
                    href={`?${params.toString()}`}
                    className={cn(
                      "pb-2 text-sm md:text-base font-medium text-gray-600 hover:text-black transition",
                      mode === tab
                        ? "border-b-2 border-[#67BC2A] text-[#67BC2A] font-semibold"
                        : ""
                    )}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} Plans
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-5">
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={cn(
                    "px-3 py-2 flex items-center gap-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition",
                    typeFilter !== "all" && "border-[#67BC2A] bg-green-50 text-[#67BC2A]"
                  )}
                >
                  <FiFilter size={16} />
                  Type
                  {typeFilter !== "all" && (
                    <span className="ml-1 bg-[#67BC2A] text-white text-xs px-1.5 py-0.5 rounded-full">
                      1
                    </span>
                  )}
                </button>
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg border border-gray-200 rounded-lg z-20 p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Show plans</h4>
                    <div className="space-y-1.5">
                      {[
                        { value: "all", label: "All" },
                        { value: "admin", label: "Admin only" },
                        { value: "manual", label: "Manual only" },
                        { value: "draft", label: "Draft only" },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => {
                            setTypeFilter(value);
                            setShowFilters(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition",
                            typeFilter === value
                              ? "bg-[#67BC2A] text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative" ref={tagFilterRef}>
                <button
                  onClick={() => setShowTagFilters((prev) => !prev)}
                  className={cn(
                    "px-3 py-2 flex items-center gap-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition",
                    tagFilter !== "all" && "border-[#67BC2A] bg-green-50 text-[#67BC2A]"
                  )}
                >
                  <FiFilter size={16} />
                  Tag
                  {tagFilter !== "all" && (
                    <span className="ml-1 bg-[#67BC2A] text-white text-xs px-1.5 py-0.5 rounded-full">
                      1
                    </span>
                  )}
                </button>
                {showTagFilters && (
                  <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg border border-gray-200 rounded-lg z-20 p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Filter by tag</h4>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => {
                          setTagFilter("all");
                          setShowTagFilters(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition",
                          tagFilter === "all"
                            ? "bg-[#67BC2A] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        All tags
                      </button>
                      {availableTags.length === 0 && (
                        <p className="px-3 py-2 text-xs text-gray-500">No tags available</p>
                      )}
                      {availableTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setTagFilter(tag);
                            setShowTagFilters(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition",
                            tagFilter === tag
                              ? "bg-[#67BC2A] text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          )}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <SearchFormControl
                query={query}
                setQuery={setQuery}
              />
            </div>
          </div>
        </div>
        <div className="flex-1  no-scrollbar mt-4 pb-20">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            {mode.charAt(0).toUpperCase() + mode.slice(1)} Meal Plans{" "}
            <span className="text-green-600 bg-green-50 p-[5px] rounded-xl text-sm">
              {filteredMealPlans.length}
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredMealPlans.map((meal) => (
              <div
                key={meal._id}
                className="relative rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <Link href={`/coach/meals/list-custom/${meal._id}`}>
                  <Image
                    src={meal.image || "/healthy-diet-food.webp"}
                    alt={meal.title}
                    width={400}
                    height={200}
                    className="w-full h-40 object-cover"
                    onError={(e) => (e.currentTarget.src = "/not-found.png")}
                  />
                </Link>
                <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5">
                  <Badge className="text-xs font-normal bg-[#00000081] text-white px-2 py-0.5">
                    {meal.admin ? "Admin" : "Manual"}
                  </Badge>
                  {meal.admin && (
                    getTagValue(meal) && (
                      <Badge className="text-xs font-normal bg-[#67BC2A] text-white px-2 py-0.5">
                        {getTagValue(meal)}
                      </Badge>
                    )
                  )}
                  {!meal.admin && getTagValue(meal) && (
                    <>
                      <Badge className="text-xs font-normal bg-[#67BC2A] text-white px-2 py-0.5">
                        {getTagValue(meal)}
                      </Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => openTagModal(meal)}
                            className="w-6 h-6 inline-flex items-center justify-center bg-white/95 text-[#67BC2A] rounded-full border border-gray-200 hover:bg-green-50"
                            aria-label="Edit tag"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>Edit tag</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                  {!meal.admin && !getTagValue(meal) && canManageMealPlans && (
                    <button
                      type="button"
                      onClick={() => openTagModal(meal)}
                      className="w-6 h-6 inline-flex items-center justify-center bg-white/95 text-[#67BC2A] rounded-full border border-gray-200 hover:bg-green-50"
                      aria-label="Add tag"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {meal.draft && (
                    <Badge className="text-xs font-normal text-white px-2 py-0.5" variant="wz_fill">
                      <SquarePen className="w-3 h-3" />
                      Draft
                    </Badge>
                  )}
                </div>
                {!meal.admin && canManageMealPlans && (
                  <button
                    onClick={() => handleDeleteMeal(meal._id)}
                    className="absolute z-10 top-[-2px] right-[-2px] bg-red-600 hover:bg-red-700 text-white pl-2 pr-3 pt-3 pb-2 rounded-md"
                  >
                    <LuTrash size={14} />
                  </button>
                )}
                <p className="font-bold px-4 pt-2">{meal.title}</p>
                <div className="p-4 pt-0 flex items-center justify-between gap-5">
                  <Link href={`/coach/meals/list-custom/${meal._id}`}>
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2">
                      {meal.description}
                    </p>
                  </Link>
                  {meal.draft && (
                    <Link
                      href={`/coach/meals/add-custom?creationType=edit&mode=${meal.mode || "daily"}&mealId=${meal._id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#67BC2A] hover:bg-green-700 text-white text-sm font-medium transition"
                    >
                      <SquarePen className="w-3.5 h-3.5" />
                      Continue to draft
                    </Link>
                  )}
                  {!meal.draft && canManageMealPlans && (
                    <AssignMealModal plan={meal} planId={meal._id} type="custom" />
                  )}
                </div>
              </div>
            ))}
          </div>
          {filteredMealPlans.length === 0 && (
            <ContentError
              title="No Meal Plans Found!"
              className="font-bold mt-10 border-0"
            />
          )}
        </div>
      </main>
      <Dialog open={tagModalOpen} onOpenChange={(open) => (open ? setTagModalOpen(true) : closeTagModal())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tagDraft ? "Edit Tag" : "Add Tag"}</DialogTitle>
            <DialogDescription>
              Update tag for this meal plan. You can pick an existing one or type a new tag.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              list="meal-tag-options"
              placeholder="Enter tag"
              className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#67BC2A]/30 focus:border-[#67BC2A]"
            />
            <datalist id="meal-tag-options">
              {availableTags.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={closeTagModal}
              disabled={Boolean(savingTagId)}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleUpdateTag(editingTagId, tagDraft)}
              disabled={!editingTagId || savingTagId === editingTagId}
              className="px-4 py-2 text-sm rounded-md bg-[#67BC2A] text-white disabled:opacity-60"
            >
              {savingTagId === editingTagId ? "Saving..." : "Save Tag"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>

  );
}


function SearchFormControl({ query, setQuery }) {
  return <FormControl
    query={query}
    onChange={e => setQuery(e.target.value)}
    placeholder="search by title"
  />
}

function resolveNestedTag(value) {
  const visited = new Set();

  function walk(node) {
    if (!node || typeof node !== "object") return "";
    if (visited.has(node)) return "";
    visited.add(node);

    if (typeof node.tag === "string" && node.tag.trim()) {
      return node.tag.trim();
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        const tag = walk(item);
        if (tag) return tag;
      }
      return "";
    }

    for (const key of Object.keys(node)) {
      const tag = walk(node[key]);
      if (tag) return tag;
    }
    return "";
  }

  return walk(value);
}

function getTagValue(value) {
  const tag = resolveNestedTag(value);
  if (!tag) return "";
  return tag;
}

function sortMealsByTagThenRecent(a, b) {
  const aTag = getTagValue(a);
  const bTag = getTagValue(b);

  // Prioritize plans that actually have a meaningful backend tag.
  if (aTag && !bTag) return -1;
  if (!aTag && bTag) return 1;
  if (aTag && bTag) {
    const tagCompare = aTag.localeCompare(bTag, undefined, { sensitivity: "base" });
    if (tagCompare !== 0) return tagCompare;
  }

  return String(b?._id || "").localeCompare(String(a?._id || ""));
}
