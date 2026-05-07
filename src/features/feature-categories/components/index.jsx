"use client"
import { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { buildFeatureCategoryInitialState } from "../config/initialState";
import { featureCategoriesReducer } from "../config/reducer";
import FeatureCategoryHeader from "./FeatureCategoryHeader";
import { useMemo } from "react";
import { featuresList } from "../config";
import useSWR from "swr";
import { fetchData } from "@/lib/api";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import { checkArray } from "@/lib/formatter";
import CategoryForm from "./CategoryForm";
import CategoryListing from "./CategoryListing";
import CategoryEmptyState from "./CategoryEmptyState";

export default function FeatureCategory({ feature }) {
  const featureData = useMemo(() => featuresList[feature], [feature])

  const { isLoading, error, data, mutate } = useSWR(
    featureData.mutateKey, () => fetchData(featureData.mutateKey),
  );

  if (isLoading) return <ContentLoader />

  if (error || data?.status_code !== 200)
    return <ContentError title={error || data?.message} />;

  return <CurrentStateProvider
    key={JSON.stringify(data?.data) || 'initial'}
    state={buildFeatureCategoryInitialState({
      feature,
      mutate,
      categories: checkArray(data?.data)
    })}
    reducer={featureCategoriesReducer}
  >
    <div className="content-container content-height-screen mt-0">
      <FeatureCategoryHeader />
      <CategoryForm />
      <CategoryListing />
      <CategoryEmptyState />
    </div>
  </CurrentStateProvider>
}