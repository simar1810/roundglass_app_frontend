"use client";
import FormControl from "@/components/FormControl";
import { Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Page() {
  const [type, setType] = useState("coach");

  const Component = type === "client"
    ? ClientLogin
    : CoachLogin

  return <div className="container py-20 gap-10 flex items-start justify-between">
    <div className="grow">
      <h1 className="text-[40px]">Login</h1>
      <p className="mt-2">Login to access your WellnessZ account</p>
      <div className="w-fit text-[18px] font-bold mt-4 flex items-center rounded-full border-1 border-[var(--accent-1)]">
        <button
          onClick={() => setType("coach")}
          className={`px-16 py-3 flex items-center gap-2 rounded-full ${type === "coach" && "bg-[var(--accent-1)] text-white"}`}>
          Coach
        </button>
        <button
          onClick={() => setType("client")}
          className={`px-16 py-3 flex items-center gap-2 rounded-full ${type === "client" && "bg-[var(--accent-1)] text-white"}`}>
          Client
        </button>
      </div>
      <Component />
    </div>
    <div className="max-w-[450px] min-h-[500px] w-full bg-red-200">
      <Image
        src="/"
        height={1024}
        width={1024}
        alt=""
      />
    </div>
  </div>
}

function ClientLogin() {
  return <form className="max-w-[450px] w-full mt-8">
    <FormControl
      label="Client ID"
      placeholder="Enter your Client ID"
      className="w-full [&_.label]:text-[#808080] [&_.label]:font-[400]"
    />
    <button className="w-full bg-[var(--accent-1)] text-white font-bold px-8 py-3 mt-8 rounded-[10px]">
      Login
    </button>
    <Link href="/signup" className="block text-center text-[16px] mt-4">Don&apos;t have a client ID</Link>
  </form>
}

function CoachLogin() {
  return <form className="max-w-[450px] w-full mt-8">
    <FormControl
      label="Mobile Number"
      placeholder="Enter Your Mobile Number"
      className="w-full [&_.label]:text-[#808080] [&_.label]:font-[400]"
    />
    <div className="mt-4 flex items-end gap-2">
      <div className="grow relative">
        <FormControl
          label="One Time Password (OTP)"
          placeholder="Enter One Time Password"
          type="password"
          className="w-full [&_.label]:text-[#808080] [&_.label]:font-[400]"
        />
        <Eye
          className="text-[#808080] absolute right-2 bottom-1/2 translate-y-[100%]"
        />
      </div>
      <button
        className="bg-[var(--accent-1)] text-white font-bold px-8 py-3 rounded-[10px]"
        type="button"
      >
        Get OTP
      </button>
    </div>
    <button className="w-full bg-[var(--accent-1)] text-white font-bold px-8 py-3 mt-8 rounded-[10px]">
      Login
    </button>
  </form>
}