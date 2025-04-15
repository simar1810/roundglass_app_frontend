import { Bell } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";

export default function NotificationModal() {
  return <DropdownMenu>
    <DropdownMenuTrigger>
      <Bell fill="#67BC2A" className="w-[20px] h-[20px] text-[var(--accent-1)]" />
    </DropdownMenuTrigger>
    <DropdownMenuContent className="!max-w-[450px] max-h-[500px] border-0 p-0 overflow-auto border">
      <div className="py-6 h-[56px]">
        <h3 className="text-black text-[14px] ml-4">
          Notifications
        </h3>
      </div>
      <div className="px-4 py-3 divide-y-1">
        {Array.from({ length: 10 }, (_, i) => i).map(item => <Notification key={item} />)}
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
}

function Notification() {
  return <div className="max-w-[96ch] pb-2 mb-3 flex items-start gap-2">
    <Bell fill="#67BC2A" className="min-w-[32px] h-[32px] bg-[#90C844]/30 text-[var(--accent-1)] p-[6px] rounded-full" />
    <div>
      <h4 className="!text-[12px]">Learning Portal Demonstration Video</h4>
      <p className="mt-[4px] text-[var(--dark-1)]/25 leading-[1.2] text-[10px]">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
      <div className="mt-2 text-[var(--dark-1)]/25 leading-[1.2] text-[8px] font-semibold flex gap-4">
        <p>01-01-2024</p>
        <p>16:00 PM</p>
      </div>
    </div>
  </div>
}