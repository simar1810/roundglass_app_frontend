"use client";
import RegisterContainer from "@/components/pages/auth/RegisterContainer";
import registerState from "@/config/state-data/register";
import registerReducer, { init } from "@/config/state-reducers/register";
import { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { redirect, useSearchParams } from "next/navigation";

export default function Page() {
  const params = useSearchParams();
  if (!params.get("coachId")) redirect("/login");
  return <CurrentStateProvider
    reducer={registerReducer}
    state={init({ coachId: params.get("coachId") })}
  >
    <RegisterContainer />
  </CurrentStateProvider>
}