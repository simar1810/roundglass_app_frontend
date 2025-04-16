"use client"
import FormControl from "@/components/FormControl";
import SelectControl from "@/components/Select";
import { Button } from "@/components/ui/button";
import { setFieldValue } from "@/config/state-reducers/register";
import { sendData } from "@/lib/api";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterContainer() {
  const { dispatch, ...state } = useCurrentStateContext();

  async function registerCoach() {
    try {
      const data = {
        name: state.name,
        expectedNoOfClients: "",
        role: "",
        coachId: "",
        terms: false
      }
      const response = await sendData("app/register", data)
    } catch (error) {
      toast(error.message)
    }
  }

  return <div className="grow">
    <h3 className="text-[32px] mb-4">Welcome, Coach</h3>
    <div className="mt-4 grid grid-cols-2 gap-4">
      <FormControl
        label="Name"
        placeholder="Enter Phone No."
        className="text-[14px] [&_.label]:font-[500]"
        value={state.name}
        onChange={e => dispatch(setFieldValue("name", e.target.value))}
      />
      <FormControl
        label="No. Of Clients"
        placeholder="Enter Phone No."
        className="text-[14px] [&_.label]:font-[500]"
        value={state.expectedNoOfClients}
        onChange={e => dispatch(setFieldValue("expectedNoOfClients", e.target.value))}
      />
      <SelectControl
        label="Your Role"
        className="text-[14px] [&_.label]:font-[500]"
        options={[]}
        placeholder="Select Role"
        value={state.role}
        onChange={e => dispatch(setFieldValue("role", e.target.value))}
      />
      <FormControl
        label="Coach Code (optional)"
        placeholder="Coach Code"
        className="text-[14px] [&_.label]:font-[500]"
        value={state.coachId}
        onChange={e => dispatch(setFieldValue("coachId", e.target.value))}
      />
    </div>
    <div className="text-[13px] mt-8 flex items-center gap-1">
      <FormControl
        className="[&_.input]:mt-0"
        type="checkbox"
        checked={state.terms}
        onChange={e => dispatch(setFieldValue("terms", e.target.value))}
      />
      <div>
        <span>I agree to all the</span>&nbsp;
        <span className="text-[var(--accent-1)]">Terms</span>&nbsp;
        <span>and</span>&nbsp;
        <span className="text-[var(--accent-1)]">Privacy Policies</span>
      </div>
    </div>
    <Button
      variant="wz"
      className="block px-12 mx-auto mt-10"
      onClick={registerCoach}
    >
      Register
    </Button>
    <div className="text-[14px] mt-4 flex items-center justify-center gap-1">
      <p className="text-[var(--dark-1)]/50">Already have an account?</p>
      <Link href="/login" className="text-[var(--accent-1)] font-bold">Login</Link>
    </div>
  </div>
}