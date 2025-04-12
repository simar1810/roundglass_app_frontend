import FormControl from "@/components/FormControl";
import SelectControl from "@/components/Select";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
  return <div className="grow">
    <h3 className="text-[32px] mb-4">Welcome, Coach</h3>
    <div className="mt-4 grid grid-cols-2 gap-4">
      <FormControl
        label="Name"
        placeholder="Enter Phone No."
        className="text-[14px] [&_.label]:font-[500]"
      />
      <FormControl
        label="No. Of Clients"
        placeholder="Enter Phone No."
        className="text-[14px] [&_.label]:font-[500]"
      />
      <SelectControl
        label="Your Role"
        className="text-[14px] [&_.label]:font-[500]"
        options={[]}
        placeholder="Select Role"
      />
      <FormControl
        label="Coach Code (optional)"
        placeholder="Coach Code"
        className="text-[14px] [&_.label]:font-[500]"
      />
    </div>
    <div className="text-[13px] mt-8 flex items-center gap-1">
      <FormControl className="[&_.input]:mt-0" type="checkbox" />
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
    >
      Register
    </Button>
    <div className="text-[14px] mt-4 flex items-center justify-center gap-1">
      <p className="text-[var(--dark-1)]/50">Already have an account?</p>
      <Link href="/login" className="text-[var(--accent-1)] font-bold">Login</Link>
    </div>
  </div>
}