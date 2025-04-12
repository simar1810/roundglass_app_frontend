"use client";
import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from "@/components/ui/input-otp";
import { useState } from "react";

export default function Page() {
  const [stage, setStage] = useState(1)

  const Component = (function () {
    switch (stage) {
      case 1:
        return InputMobileNumber
      case 2:
        return InputOTPContainer
    }
  })();

  return <div className="grow">
    <Component setStage={setStage} />
  </div>
}

function InputMobileNumber({
  setStage
}) {
  return <div>
    <h3 className="text-[32px] mb-4">Hi, Welcome</h3>
    <h5 className="mb-1">Ready to Inspire Wellness?</h5>
    <p className="text-[var(--dark-1)]/25 text-[14px] mb-8">Signup or Login Now to Transform</p>
    <FormControl
      label="Mobile Number"
      className="w-full"
      type="tel"
      placeholder="Enter Mobile Number"
    />
    <Button
      variant="wz"
      size="lg"
      className="block px-12 mx-auto mt-10"
      onClick={() => setStage(2)}
    >
      OTP
    </Button>
  </div>
}

function InputOTPContainer() {
  const [otp, setOtp] = useState()
  return <div>
    <h3 className="text-[32px] mb-4">Security Code</h3>
    <p className="text-[var(--dark-1)]/25 text-[14px] mb-8">
      <span>Enter 4-Digit OTP sent on</span>
      <span className="text-black">+91 9876543210</span>
    </p>
    <InputOTP
      maxLength={4}
      value={otp}
      onChange={(value) => setOtp(value)}
    >
      <InputOTPGroup>
        {Array.from({ length: 4 }, (_, i) => i).map(index => <InputOTPSlot
          index={index}
          key={index}
          className="h-[48px] w-[48px] bg-[var(--comp-1)] focus:outline-none data-[active=true]:ring-0 !rounded-[10px] mr-2 border-1"
        />)}
      </InputOTPGroup>
    </InputOTP>
    <div className="text-[14px] mt-4 flex items-center gap-1">
      <p className="text-[var(--dark-1)]/50">Didn&apos;t received OTP?</p>
      <button className="font-bold">Resend OTP</button>
    </div>
    <Button variant="wz" size="lg" className="block px-12 mx-auto mt-10">Sign In</Button>
  </div>
}