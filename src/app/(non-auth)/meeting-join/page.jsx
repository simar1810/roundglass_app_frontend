import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function Page() {
  return <div className="container h-screen flex flex-col">
    <Image
      src="/wz-landscape.png"
      height={200}
      width={200}
      alt=""
      className="w-full max-h-[80px] object-left object-contain border-b-2"
    />
    <div className="max-w-[500px] w-full bg-[var(--comp-1)] py-6 px-8 mx-auto my-auto border-1 shadow-2xl rounded-[8px]">
      <h3 className="text-[32px] text-center">
        <span className="text-[var(--accent-1)]">WellnessZ</span>&nbsp;
        <span>Club</span>
      </h3>
      <p className="text-[14px] text-[var(--dark-1)]/25 text-center font-semibold mt-2">Please Enter Allocated Roll Number given by your Coach</p>
      <div className="flex gap-2 mt-10">
        <Input placeholder="Please enter your Roll No." />
        <Button variant="wz">Enter</Button>
      </div>
    </div>
  </div>
}