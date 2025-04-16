"use client";
import RegisterContainer from "@/components/pages/auth/RegisterContainer";
import registerState from "@/config/state-data/register";
import registerReducer from "@/config/state-reducers/register";
import { CurrentStateProvider } from "@/providers/CurrentStateContext";

export default function Page() {
  return <CurrentStateProvider
    reducer={registerReducer}
    state={registerState}
  >
    <RegisterContainer />
  </CurrentStateProvider>
}