import { Card, CardHeader } from "@/components/ui/card"
import { Bell } from "lucide-react"

export default function Page() {
  return <div className="content-container">
    <h4 className="pb-4 mb-4 border-b-1">Notifications</h4>
    {Array.from({ length: 4 }, (_, i) => i).map(item => <Notification key={item} />)}
  </div>
}


function Notification() {
  return <div className="max-w-[96ch] px-4 py-3 mb-3 flex items-center gap-6 border-1 border-[var(--accent-1)] rounded-[10px]">
    <Bell fill="#67BC2A" className="min-w-[52px] h-[52px] bg-[#90C844]/30 text-[var(--accent-1)] p-3 rounded-full" />
    <div>
      <h4>Learning Portal Demonstration Video</h4>
      <p className="mt-[4px] text-[var(--dark-1)]/25 leading-[1.2] text-[13px]">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
      <div className="mt-2 text-[var(--dark-1)]/25 leading-[1.2] text-[13px] font-semibold flex gap-4">
        <p>01-01-2024</p>
        <p>16:00 PM</p>
      </div>
    </div>
  </div>
}