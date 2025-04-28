"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { idealWeight } from "@/config/state-data/ideal-weight";
import { changeGender, idealWeightReducer } from "@/config/state-reducers/ideal-weight";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import Image from "next/image";

export default function Page() {
  return <CurrentStateProvider
    state={idealWeight}
    reducer={idealWeightReducer}
  >
    <div className="content-container">
      <h4>What&apos;s your Height?</h4>
      <h2 className="text-[24px] text-center mt-10">Select your height</h2>
      <GenderSelection />
      <HeightScale />
    </div>
  </CurrentStateProvider>
}

function GenderSelection() {
  const { gender, heightUnit, dispatch } = useCurrentStateContext();

  return <div className="flex items-end justify-center gap-20">
    <RadioGroup value={gender} className="mt-4 flex items-center justify-center gap-4">
      <div className="flex items-center gap-1">
        <input
          id="feet"
          value="male"
          type="radio"
          className="w-[14px] h-[14px]"
          checked={gender === "male"}
          onChange={() => dispatch(changeGender("male"))}
        />
        <Label htmlFor="feet" className="text-[18px]">
          Male
        </Label>
      </div>
      <div className="flex items-center gap-1">
        <input
          id="cms"
          value="female"
          type="radio"
          checked={gender === "female"}
          className="w-[14px] h-[14px]"
          onChange={() => dispatch(changeGender("female"))}
        />
        <Label htmlFor="cms" className="text-[18px]">
          Female
        </Label>
      </div>
    </RadioGroup>
    <div className="flex items-center gap-2">
      <Label htmlFor="airplane-mode" className="text-[18px]">cm</Label>
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode" className="text-[18px]">foot</Label>
    </div>
  </div>
}

function HeightScale() {
  return <div className="mt-20 mb-10 flex items-center justify-center gap-10">
    <AnatomyImage />
    <div className="flex items-end gap-[3px]">
      <p className="font-bold text-[24px] leading-[1]">6</p>
      <p className="leading-[1.2] text-[var(--dark-2)]">ft</p>
      <p className="font-bold text-[24px] leading-[1]">0</p>
      <p className="leading-[1.2] text-[var(--dark-2)]">in</p>
    </div>
    <div className="w-[120px] h-96 bg-[#F0F0F0] rounded-[8px] border-1 border-[var(--accent-1)] relative">
      <Image
        src="/arrow-left.svg"
        alt=""
        height={100}
        width={100}
        className="w-[32px] h-[32px] absolute top-1/2 translate-y-[-50%] right-[-2px]"
      />
    </div>
    <div>
      <h4 className="w-full text-center">Your Ideal Weight Is <span className="text-[var(--accent-1)] text-center">80 KGs</span></h4>
      <div className="mt-10 flex gap-4">
        <div>
          <Button variant="wz_outline" className="text-center text-[#03632C] block mx-auto border-[#03632C]">60 - 70 Kg</Button>
          <p className="text-center text-[14px] text-[var(--dark-1)]/25 mt-2">Within Limits</p>
        </div>
        <div>
          <Button variant="wz_outline" className="text-center text-[#FB8A2E] block mx-auto border-[#FB8A2E]">60 - 70 Kg</Button>
          <p className="text-center text-[14px] text-[var(--dark-1)]/25 mt-2">Slightly Overweight</p>
        </div>
        <div>
          <Button variant="wz_outline" className="text-center text-[#FF1D1D] block mx-auto border-[#FF1D1D]">60 - 70 Kg</Button>
          <p className="text-center text-[14px] text-[var(--dark-1)]/25 mt-2">Highly Overweight</p>
        </div>
      </div>
    </div>
  </div>
}

function AnatomyImage() {
  const { gender } = useCurrentStateContext();
  if (gender === "male") return <Image
    src="/male-anatomy.png"
    alt=""
    height={372}
    width={176}
    draggable={false}
    className="w-[176px]"
  />
  return <Image
    src="/woman-anatomy.png"
    alt=""
    height={372}
    width={139}
    className="w-[176px] h-[360px] object-contain"
    draggable={false}
  />
}