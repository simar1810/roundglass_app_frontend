"use client"

import { useAppSelector } from "@/providers/global/hooks"
import { redirect } from "next/navigation"

export default function Guardian({ children }) {
  const { coach, isLoggedIn } = useAppSelector(state => state.coach)

  if (!coach || !isLoggedIn) redirect("/login");

  return children
}