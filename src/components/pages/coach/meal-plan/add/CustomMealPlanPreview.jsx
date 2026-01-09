"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import PDFCustomMealPortrait from "@/components/pages/coach/meals/PDFCustomMealPortrait";
import { getPersonalBranding } from "@/lib/fetchers/app";
import { getBase64ImageFromUrl } from "@/lib/image";
import { customMealDailyPDFData } from "@/lib/pdf";
import { useAppSelector } from "@/providers/global/hooks";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

// Module-level cache for brand assets to persist across component unmounts
const brandAssetsCache = new Map();
const loadingPromisesCache = new Map();

/**
 * Converts custom meal plan state to PDF data format
 */
function convertCustomMealPlanToPDFData(customMealState) {
  const { title, description, guidelines, supplements, selectedPlans, mode } = customMealState;

  // Create a custom plan object in the format expected by customMealDailyPDFData
  const customPlan = {
    title: title || "Custom Meal Plan",
    description: description || "",
    guidelines: guidelines || "",
    supplements: supplements || "",
    mode: mode || "daily",
    plans: selectedPlans || {},
    notes: [],
  };

  return customPlan;
}

export default function CustomMealPlanPreview({ customMealState }) {
  const coach = useAppSelector((state) => state?.coach?.data);
  const [brandLogo, setBrandLogo] = useState("");
  const [coachLogo, setCoachLogo] = useState("");
  const [assetsLoading, setAssetsLoading] = useState(true);
  const { isLoading, error, data } = useSWR("app/personalBranding", getPersonalBranding);

  const brands = Array.isArray(data?.data) ? data.data : [];
  const obtainedPhoto = coach?.profilePhoto || "";

  // Load all brand assets in parallel with caching
  useEffect(() => {
    let cancelled = false;
    
    const latestBrand = brands.length > 0 ? brands[brands.length - 1] : null;
    const brandLogoUrl = latestBrand?.brandLogo?.trim() || "";
    const coachLogoUrl = obtainedPhoto?.trim() || "";

    // Check cache first
    const cachedBrandLogo = brandLogoUrl ? brandAssetsCache.get(brandLogoUrl) : null;
    const cachedCoachLogo = coachLogoUrl ? brandAssetsCache.get(coachLogoUrl) : null;

    // If both are cached, use them immediately
    if (cachedBrandLogo !== undefined && cachedCoachLogo !== undefined) {
      setBrandLogo(cachedBrandLogo || "");
      setCoachLogo(cachedCoachLogo || "");
      setAssetsLoading(false);
      return;
    }

    // Otherwise, set loading state and load assets
    setAssetsLoading(true);

    // Helper function to load image with caching
    const loadImageWithCache = (url) => {
      if (!url) return Promise.resolve("");

      // Check cache first
      const cached = brandAssetsCache.get(url);
      if (cached !== undefined) {
        return Promise.resolve(cached);
      }

      // Check if already loading
      const existingPromise = loadingPromisesCache.get(url);
      if (existingPromise) {
        return existingPromise;
      }

      // Create new loading promise
      const promise = getBase64ImageFromUrl(url)
        .then((base64) => {
          brandAssetsCache.set(url, base64);
          loadingPromisesCache.delete(url);
          return base64;
        })
        .catch(() => {
          brandAssetsCache.set(url, "");
          loadingPromisesCache.delete(url);
          return "";
        });

      loadingPromisesCache.set(url, promise);
      return promise;
    };

    // Load both images in parallel
    const loadPromises = [];

    if (brandLogoUrl) {
      loadPromises.push(
        loadImageWithCache(brandLogoUrl).then((logo) => {
          if (!cancelled) setBrandLogo(logo);
        })
      );
    } else {
      setBrandLogo("");
    }

    if (coachLogoUrl) {
      loadPromises.push(
        loadImageWithCache(coachLogoUrl).then((logo) => {
          if (!cancelled) setCoachLogo(logo);
        })
      );
    } else {
      setCoachLogo("");
    }

    // Wait for all images to load (or fail) before marking as complete
    Promise.allSettled(loadPromises)
      .then(() => {
        if (!cancelled) {
          // Use requestAnimationFrame to ensure state updates are batched
          requestAnimationFrame(() => {
            if (!cancelled) setAssetsLoading(false);
          });
        }
      });

    // If no images to load, mark as complete immediately
    if (loadPromises.length === 0) {
      setAssetsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [brands, obtainedPhoto]);

  const primaryBrand = brands[0] || {};
  const latestBrand = brands.length > 0 ? brands[brands.length - 1] : {};
  const primaryColor = latestBrand?.primaryColor
    ? `#${latestBrand.primaryColor.slice(-6)}`
    : "#67BC2A";
  const textColor = latestBrand?.textColor
    ? `#${latestBrand.textColor.slice(-6)}`
    : "#ffffff";

  // Convert state to custom plan format
  const customPlan = useMemo(() => {
    return convertCustomMealPlanToPDFData(customMealState);
  }, [customMealState]);

  // Generate PDF data using the existing function
  const pdfData = useMemo(() => {
    if (!customPlan || !customPlan.plans || Object.keys(customPlan.plans).length === 0) {
      return null;
    }
    return customMealDailyPDFData(customPlan, null, coach, {
      includeMacros: true,
      includeDescription: true,
      includeGuidelines: true,
      includeSupplements: true,
    });
  }, [customPlan, coach]);

  // Only create brand object when assets are loaded to prevent re-renders
  const brand = useMemo(() => {
    // Don't create brand object until assets are loaded
    if (assetsLoading) {
      return {
        ...primaryBrand,
        brandLogo: "",
        coachLogo: "",
        primaryColor,
        textColor,
      };
    }
    return {
      ...primaryBrand,
      brandLogo,
      coachLogo,
      primaryColor,
      textColor,
    };
  }, [primaryBrand, brandLogo, coachLogo, primaryColor, textColor, assetsLoading]);

  if (isLoading || assetsLoading) {
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
  if (!pdfData || !pdfData.plans || pdfData.plans.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 p-4">
        <p className="text-center">Add meal plans to see preview</p>
      </div>
    );
  }

  // Only render PDF once all assets are loaded
  return (
    <div className="h-full w-full overflow-hidden">
      <div className="h-full w-full [&>div]:h-full [&>div]:w-full">
        <PDFCustomMealPortrait data={pdfData} brand={brand} />
      </div>
    </div>
  );
}



