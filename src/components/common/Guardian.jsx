"use client"
import { useAppDispatch, useAppSelector } from "@/providers/global/hooks"
import { redirect } from "next/navigation"
import { useEffect } from "react";
import useSWR from "swr";
import { getCoachProfile } from "@/lib/fetchers/app";
import { store } from "@/providers/global/slices/coach";
import Loader from "./Loader";

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

  if (error || data?.status_code === 400 || data?.success === false) {
    logout();
    redirect("/login");
  };

  if (isLoading || !coach) return <div className="min-h-screen flex items-center justify-center">
    <Loader />
  </div>

  return children;
}