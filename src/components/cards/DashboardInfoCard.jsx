import {
  TrendingDown,
  TrendingUp
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader
} from "../ui/card";
import { Avatar, AvatarImage } from "../ui/avatar";

export default function DashboardInfoCard({
  icon = "/svgs/users-icon.svg",
  trendUp = false,
  title = "Total Clients",
  quantity = 100
}) {
  return <Card className="!border-0 !shadow-none gap-2 rounded-[10px] hover:scale- [1.01] hover:bg- [var(--comp-1)]">
    <CardHeader className="flex flex-row items-center justify-between">
      <Avatar className="w-[40px] h-[40px] rounded-none">
        <AvatarImage
          src={icon}
          className="w-[40px] h-[40px] !rounded-none"
        />
      </Avatar>
      {trendUp
        ? <TrendingUp className="w-[16px] h-[16px] text-[var(--accent-1)]" />
        : <TrendingDown className="w-[16px] h-[16px] text-[var(--accent-2)]" />}
    </CardHeader>
    <CardContent>
      <div className="text-[20px] font-bold">{quantity}</div>
      <p className="text-[11px] font-[600] text-[var(--dark-2)]">{title}</p>
    </CardContent>
  </Card>
}