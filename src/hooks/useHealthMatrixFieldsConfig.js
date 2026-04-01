"use client";

import { DEFAULT_FORM_FIELDS } from "@/config/data/health-matrix";
import { getHealthMatrixFieldsList } from "@/lib/fetchers/app";
import { useMemo } from "react";
import useSWR from "swr";

const SVG_ICONS = [
  "/svgs/body.svg",
  "/svgs/check.svg",
  "/svgs/checklist.svg",
  "/svgs/bmi.svg",
  "/svgs/cutlery.svg",
  "/svgs/fat.svg",
  "/svgs/fats.svg",
  "/svgs/muscle.svg",
  "/svgs/meta.svg",
  "/svgs/person.svg",
  "/svgs/weight.svg",
  "/svgs/flame-icon.svg",
  "/svgs/marathon.svg",
  "/svgs/users-icon.svg",
];

const DEFAULT_KEY_ALIASES = {
  body_water: "bodyWater",
  bodywater: "bodyWater",
  idealWeight: "ideal_weight",
};

function normalizeDefaultKey(key) {
  const raw = String(key || "").trim();
  if (!raw) return raw;
  return DEFAULT_KEY_ALIASES[raw] || raw;
}

export function useHealthMatrixFieldsConfig(scope = "shared") {
  const { data, isLoading, error } = useSWR(
    "health-matrix-fields-list",
    () => getHealthMatrixFieldsList(),
    { revalidateOnFocus: false }
  );

  const normalized = useMemo(() => {
    const ok = data?.status_code === 200 && data?.success === true && data?.data;
    if (!ok) {
      return {
        defaults: [],
        custom: [],
        isFallback: !isLoading,
      };
    }
    const defaultsRaw = Array.isArray(data?.data?.defaultFields) ? data.data.defaultFields : [];
    const defaults = defaultsRaw.map(normalizeDefaultKey);
    const custom = Array.isArray(data?.data?.coachAddedFields) ? data.data.coachAddedFields : [];
    return { defaults, custom, isFallback: false };
  }, [data, isLoading]);

  const formFields = useMemo(() => {
    if (isLoading) return [];
    if (normalized.isFallback) return DEFAULT_FORM_FIELDS;

    const defaultsSet = new Set(normalized.defaults.map((x) => normalizeDefaultKey(x)));
    const visibleDefault = DEFAULT_FORM_FIELDS.filter((field) => {
      if (field.name === "weightInKgs" || field.name === "weightInPounds") return true;
      return defaultsSet.has(normalizeDefaultKey(field.name));
    });

    const customFields = normalized.custom.map((field) => ({
      label: field.title,
      title: field.title,
      value: "0",
      info: `Range: ${field.minValue} - ${field.maxValue}`,
      icon: SVG_ICONS[Number(field.svg)] || "/svgs/checklist.svg",
      name: field.fieldLabel,
      id: field._id || field.fieldLabel,
      getMaxValue: () => Number(field.maxValue),
      getMinValue: () => Number(field.minValue),
    }));

    return [...visibleDefault, ...customFields];
  }, [isLoading, normalized]);

  const customFieldLabels = useMemo(() => {
    if (normalized.isFallback) return [];
    return normalized.custom
      .map((field) => String(field?.fieldLabel || "").trim())
      .filter(Boolean);
  }, [normalized]);

  const showVisceralFatInput = useMemo(() => {
    if (isLoading) return true;
    if (normalized.isFallback) return true;
    return normalized.defaults.map(normalizeDefaultKey).includes("visceral_fat");
  }, [isLoading, normalized]);

  return {
    formFields,
    customFieldLabels,
    showVisceralFatInput,
    isLoading,
    isFallback: normalized.isFallback,
    error,
  };
}
