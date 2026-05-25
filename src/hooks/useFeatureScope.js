import { useAppSelector } from "@/providers/global/hooks"

export const useFeatureScope = function (scope) {
  const coachData = useAppSelector((state) => state.coach.data) || {};
  const { featureScopes } = coachData;
  const scopes = Array.isArray(featureScopes) ? featureScopes : [];

  // Roundglass uses subscription permissions on the sidebar; when scopes are
  // not provisioned yet, allow access so meal routes stay usable.
  if (scopes.length === 0) {
    return { hasAccess: true };
  }

  const hasAccess = !Array.isArray(scope)
    ? scopes.includes(scope)
    : scope.some((item) => scopes.includes(item));

  return { hasAccess };
}