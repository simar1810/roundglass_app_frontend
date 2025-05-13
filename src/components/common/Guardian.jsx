"use client"
import { useAppDispatch, useAppSelector } from "@/providers/global/hooks"
import { redirect } from "next/navigation"
import { useEffect } from "react";
import useSWR, { mutate } from "swr";
import { getCoachProfile } from "@/lib/fetchers/app";
import { destroy, store } from "@/providers/global/slices/coach";
import Loader from "./Loader";
import ContentError from "./ContentError";
import { TriangleAlert } from "lucide-react";
import { subscriptionDaysRemaining } from "@/lib/utils";
import Link from "next/link";

async function logout() {
  await fetch("/api/logout", { method: "DELETE" });
}

export default function Guardian({
  children,
  _id
}) {
  const { isLoading, error, data } = useSWR("coachProfile", () => getCoachProfile(_id))

  const dispatchRedux = useAppDispatch();
  const coach = useAppSelector(state => state.coach.data);

  useEffect(function () {
    if (data && data.status_code === 200) dispatchRedux(store(data.data));
  }, [isLoading]);

  if (
    error || data?.success === false ||
    (!!data?.status_code && data?.status_code !== 200)
  ) {
    logout();
    dispatchRedux(destroy());
    mutate(() => true, undefined);
    redirect("/login");
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">
    <Loader />
  </div>

  if (data?.status_code !== 200 || !coach) return <div className="h-screen text-[var(--accent-2)] flex flex-col gap-0 items-center justify-center font-bold text-[32px]">
    <TriangleAlert className="w-[64px] h-[64px]" />
    <ContentError
      className="min-h-auto border-0 mt-0 p-0"
      title={`${data?.message}`}
    />
  </div>

  const subscription = data.data.subscription;
  const subscriptionStatus = subscriptionDaysRemaining(subscription?.planCode, subscription?.endDate)

  if (!subscriptionStatus?.success) {
    return <div className="h-screen flex flex-col gap-0 items-center justify-center text-center">
      <ContentError
        className="max-w-[40ch] min-h-auto border-0 mt-0 p-0"
        title={subscriptionStatus?.message}
      />
      <Link
        href={`https://www.wellnessz.in/plans/${data.data._id}`}
        className="bg-[var(--accent-1)] mt-2 px-4 py-2 rounded-[8px] text-white font-bold text-[14px]"
        target="_blank"
      >
        Upgrade
      </Link>
    </div>
  }
  return children;
}