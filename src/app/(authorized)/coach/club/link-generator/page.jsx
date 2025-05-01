"use client";
import LinkGenerator from "@/components/modals/club/LinkGenerator";
import ZoomConnectNowModal from "@/components/modals/club/ZoomConnectNowModal";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import {
  EllipsisVertical,
  Settings,
  Unlink
} from "lucide-react";
import Image from "next/image";

export default function first() {
  return <CurrentStateProvider>
    <div className="content-height-screen content-container">
      <h4>WellnessZ Link Generator</h4>
      <div className="relative">
        <Image
          src="/illustrations/link-generator.svg"
          alt=""
          height={240}
          width={240}
          className="object-contain mx-auto mt-24"
        />
        <div className="mt-10 flex items-center justify-center gap-4">
          <ZoomMeetingOptions />
          <LinkGenerator>
            <DialogTrigger className="px-4 py-2 rounded-[8px] flex items-center gap-2 border-1 border-[var(--accent-1)]">
              <span className="w-[28px] italic text-[12px] text-center leading-[28px] aspect-square rounded-full border-1">
                <span>w</span>
                <span className="text-[var(--accent-1)]">z</span>
              </span>
              <span>Without Zoom Meetings</span>
            </DialogTrigger>
          </LinkGenerator>
        </div>
      </div>
    </div>
  </CurrentStateProvider>
}

function ZoomMeetingOptions() {
  return <div className="flex items-center border-1 border-[var(--accent-1)] rounded-[10px]">
    <LinkGenerator withZoom={true}>
      <DialogTrigger className="px-4 py-2 flex items-center gap-2 rounded-[8px]">
        <span className="w-[28px] italic text-[12px] text-center leading-[28px] aspect-square rounded-full border-1">
          <span>w</span>
          <span className="text-[var(--accent-1)]">z</span>
        </span>
        With Zoom Meeting
      </DialogTrigger>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <EllipsisVertical className="w-[18px] ml-1 mr-2 cursor-pointer" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="text-[14px] py-0 flex items-center gap-2">
            <Settings className="w-[14px]" />
            Edit Details
          </DropdownMenuLabel>
          <DropdownMenuLabel className="text-412px] text-[var(--accent-2)] py-0 flex items-center gap-2">
            <Unlink className="w-[14px]" />
            Delete Client
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    </LinkGenerator>
  </div>
}