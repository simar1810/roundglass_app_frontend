"use client"
import { useAppDispatch } from "@/providers/global/hooks"
import { redirect } from "next/navigation"
import { useEffect } from "react";
import useSWR from "swr";
import ContentLoader from "./ContentLoader";
import { getCoachProfile } from "@/lib/fetchers/app";
import { store } from "@/providers/global/slices/coach";

async function logout() {
  await fetch("/api/logout", { method: "DELETE" });
}

export default function Guardian({
  children,
  _id
}) {
  const { isLoading, error, data } = useSWR("/coach", () => getCoachProfile(_id))
  const dispatchRedux = useAppDispatch();

  useEffect(function () {
    if (data && data.status_code === 200) dispatchRedux(store(data.data));
  }, [isLoading]);

  if (error || data?.status_code === 400 || data?.success === false) {
    logout();
    redirect("/login")
  };

  if (isLoading) return <ContentLoader />

  return children;
}