"use client";
import LoginContainer from "@/components/pages/auth/LoginContainer";
import state from "@/config/state-data/login";
import reducer from "@/config/state-reducers/login";
import { CurrentStateProvider } from "@/providers/CurrentStateContext";

export default function Page() {
  return <CurrentStateProvider
    reducer={reducer}
    state={state}
  >
    <LoginContainer />
  </CurrentStateProvider>
}