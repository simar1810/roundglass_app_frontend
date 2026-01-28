"use client";
import PDFCustomMealPortrait from "@/components/pages/coach/meals/PDFCustomMealPortrait";
import { getPersonalBranding } from "@/lib/fetchers/app";
import { getBase64ImageFromUrl } from "@/lib/image";
import { useAppSelector } from "@/providers/global/hooks";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";

/**
 * Converts meal plan state to PDF data format
 */
function convertMealPlanToPDFData(mealPlanState) {
  const { name, description, meals = [] } = mealPlanState;

  // Convert meals structure to PDF format
  // PDF expects: plans array with { key, label, meals: [{ mealType, timeWindow, items }] }
  const planMeals = meals.map((mealTypeGroup) => {
    const mealType = mealTypeGroup.mealType || "";
    const recipes = mealTypeGroup.meals || [];

    // Convert recipes to items format
    // Each recipe becomes an item with title and details
    const items = recipes
      .filter((recipe) => recipe.name && recipe.name.trim() !== "") // Only include recipes with names
      .map((recipe) => {
        const detailsParts = [];
        if (recipe.description && recipe.description.trim() !== "") {
          detailsParts.push(recipe.description);
        }
        if (recipe.meal_time && recipe.meal_time.trim() !== "") {
          detailsParts.push(`Time: ${recipe.meal_time}`);
        }

        return {
          title: recipe.name || "",
          details: detailsParts.length > 0 ? detailsParts.join(" | ") : undefined,
        };
      });

    // Get the first meal_time as timeWindow (for the meal type header)
    const timeWindow = recipes.length > 0 && recipes[0].meal_time 
      ? recipes[0].meal_time 
      : "";

    return {
      mealType,
      timeWindow,
      items: items.length > 0 ? items : [],
    };
  }).filter((meal) => meal.mealType && meal.mealType.trim() !== ""); // Only include meals with meal types

  // Create a single plan entry (since this is a simple meal plan, not multi-day)
  const plan = {
    key: "plan-1",
    label: name || "Meal Plan",
    meals: planMeals,
    notes: [],
  };

  // Extract meal types
  const mealTypes = meals.map((m) => m.mealType).filter(Boolean);

  return {
    title: name || "Meal Plan Preview",
    description: description || "",
    coachName: "",
    plans: [plan],
    mealTypes,
    selectedPlanKey: "plan-1",
    generalNotes: [],
  };
}

export default function MealPlanPreview({ mealPlanState }) {
  const coach = useAppSelector((state) => state?.coach?.data);
  const [brandLogo, setBrandLogo] = useState("");
  const [coachLogo, setCoachLogo] = useState("");
  const { isLoading, error, data } = useSWR("app/personalBranding", getPersonalBranding);

  const brands = Array.isArray(data?.data) ? data.data : [];
  const obtainedPhoto = coach?.profilePhoto || "";

  useEffect(() => {
    const latestBrand = brands.length > 0 ? brands[brands.length - 1] : null;

    if (latestBrand?.brandLogo && latestBrand.brandLogo.trim() !== "") {
      getBase64ImageFromUrl(latestBrand.brandLogo)
        .then(setBrandLogo)
        .catch(() => setBrandLogo(""));
    } else {
      setBrandLogo("");
    }

    if (obtainedPhoto && obtainedPhoto.trim() !== "") {
      getBase64ImageFromUrl(obtainedPhoto)
        .then(setCoachLogo)
        .catch(() => setCoachLogo(""));
    } else {
      setCoachLogo("");
    }
  }, [brands, obtainedPhoto]);

  const primaryBrand = brands[0] || {};
  const latestBrand = brands.length > 0 ? brands[brands.length - 1] : {};
  const primaryColor = latestBrand?.primaryColor
    ? `#${latestBrand.primaryColor.slice(-6)}`
    : "#67BC2A";
  const textColor = latestBrand?.textColor
    ? `#${latestBrand.textColor.slice(-6)}`
    : "#ffffff";

  const pdfData = useMemo(() => {
    const data = convertMealPlanToPDFData(mealPlanState);
    return {
      ...data,
      coachName: coach?.name || "",
    };
  }, [mealPlanState, coach]);

  const brand = useMemo(
    () => ({
      ...primaryBrand,
      brandLogo,
      coachLogo,
      primaryColor,
      textColor,
    }),
    [primaryBrand, brandLogo, coachLogo, primaryColor, textColor]
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <ContentLoader />
      </div>
    );
  }

  if (error || data?.status_code !== 200) {
    return (
      <div className="h-full flex items-center justify-center">
        <ContentError title={error?.message || data?.message} />
      </div>
    );
  }

  // Check if there's any meal data to show
  if (!mealPlanState?.meals || mealPlanState.meals.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 p-4">
        <p className="text-center">Add meal types and recipes to see preview</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="h-full w-full [&>div]:h-full [&>div]:w-full">
        <PDFCustomMealPortrait data={pdfData} brand={brand} />
      </div>
    </div>
  );
}

