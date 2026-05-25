"use client"
import FeatureDisabled from "@/components/common/error/FeatureDisabled"
import { useFeatureScope } from "@/hooks/useFeatureScope"

export default function Layout({ children }) {
  const { hasAccess } = useFeatureScope(["ingredients:read", "ingredients:manage"])
  if (!hasAccess) return <FeatureDisabled />
  return children
}