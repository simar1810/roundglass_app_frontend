"use client"
import { useAppDispatch } from "@/providers/global/hooks"
import { redirect } from "next/navigation"
import { useEffect } from "react";
import useSWR from "swr";
import ContentLoader from "./ContentLoader";
import { getCoachProfile } from "@/lib/fetchers/app";
import { store } from "@/providers/global/slices/coach";

export default function Guardian({
  children,
  _id
}) {
  const { isLoading, error, data } = useSWR("/coach", () => getCoachProfile(_id))
  const dispatchRedux = useAppDispatch();

  useEffect(function () {
    if (data && data.status_code === 200) dispatchRedux(store(data.data));
  }, [isLoading]);

  if (isLoading) return <ContentLoader />

  if (error) redirect("/login");

  return children;
}