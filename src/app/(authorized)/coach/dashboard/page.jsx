import DashboardInfoCard from "@/components/cards/DashboardInfoCard";
import ClientList from "@/components/pages/coach/client/ClientList";
import Tools from "@/components/pages/coach/Tools";
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@/components/ui/avatar";
import { dashboardCards } from "@/config/data/ui";
import { Plus } from "lucide-react";

export default function Page() {
  return <div className="mt-8">
    <div className="grid grid-cols-5 gap-4">
      {dashboardCards.map(item => <DashboardInfoCard
        key={item.id}
        {...item}
        trendUp={Math.random() > 0.5}
      />)}
    </div>
    <Stories />
    <Tools />
    <div className="mt-8 grid grid-cols-2 gap-4">
      <ClientList
        title="Favorite Clients"
        type={1}
      />
      <ClientList
        title="Pending Followups"
        type={2}
      />
    </div>
  </div>
}

function Stories() {
  return <div className="mt-8">
    <h4 className="mb-4">Stories</h4>
    <div className="flex items-center gap-2">
      <div className="w-[64px] h-[64px] border-2 border-[var(--accent-1)] relative rounded-full">
        <Avatar className="w-full h-full p-3">
          <AvatarImage src="/logo.png" />
        </Avatar>
        <Plus className="w-[18px] h-[18px] bg-black text-white absolute bottom-0 right-0 rounded-full" />
      </div>
      {Array.from({ length: 4 }, (_, i) => i).map(item => <Avatar
        key={item}
        className="w-[64px] h-[64px] border-2 border-[var(--accent-1)]"
      >
        <AvatarImage src="/" />
        <AvatarFallback className="bg-[var(--accent-2)] text-white">SN</AvatarFallback>
      </Avatar>)}
    </div>
  </div>
}