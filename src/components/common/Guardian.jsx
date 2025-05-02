"use client"
import { useAppDispatch, useAppSelector } from "@/providers/global/hooks"
import { redirect } from "next/navigation"
import { useEffect } from "react";
import useSWR from "swr";
import { getCoachProfile } from "@/lib/fetchers/app";
import { store } from "@/providers/global/slices/coach";
import Loader from "./Loader";
import ContentError from "./ContentError";
import Image from "next/image";
import { TriangleAlert } from "lucide-react";

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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">
    <Loader />
  </div>

  if (data.status_code !== 200 || !coach) return <div className="h-screen text-[var(--accent-2)] flex flex-col gap-0 items-center justify-center font-bold text-[32px]">
    <TriangleAlert className="w-[64px] h-[64px]" />
    <ContentError
      className="min-h-auto border-0 mt-0 p-0"
      title={`${data.message}`}
    />
  </div>

  return children;
}