import { featuresList } from "@/features/feature-categories/config";
import { fetchData } from "@/lib/api";
import useSWR from "swr";

/**
 * @param {"recipes"|"sessions"|"workouts"} feature
 * Workouts API uses `categoryType`; recipes/sessions use `level`.
 */
export function useFeatureCategoryOptions(feature) {
  const config = featuresList[feature];
  const typeKey = feature === "workouts" ? "categoryType" : "level";

  const { data, isLoading } = useSWR(config?.mutateKey, () =>
    fetchData(config.mutateKey),
  );

  const categories = data?.data ?? [];

  const mainCategories = categories.filter(
    (cat) => cat[typeKey] === "category",
  );

  const subCategories = categories.filter(
    (cat) => cat[typeKey] === "sub-category",
  );

  return { mainCategories, subCategories, isLoading };
}
