import { Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader
} from "../ui/card";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";

export default function DashboardInfoCard({
  icon = "/svgs/users-icon.svg",
  title,
  quantity,
  isSubscribed
}) {
  return <div className="relative overflow-clip border-1 rounded-[10px]">
    <Card className="px-0 py-4 shadow-none gap-2 rounded-[10px] border-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <Avatar className="w-[40px] h-[40px] rounded-none">
          <AvatarImage
            src={icon}
            className="w-[40px] h-[40px] !rounded-none"
          />
        </Avatar>
      </CardHeader>
      <CardContent>
        <div className="text-[20px] font-bold">{quantity}</div>
        <p className="text-[11px] font-[600] text-[var(--dark-2)]">{title}</p>
      </CardContent>
    </Card>
    {isSubscribed && <LockedFeature />}
  </div>
}

function LockedFeature() {
  return <div className="h-full w-full absolute top-0 left-0 backdrop-blur-[3px] flex items-center justify-center gap-2">
    <Lock className="w-[32px] h-[32px] text-white bg-[var(--accent-1)] p-[6px] rounded-full" />
    <div>
      <h5 className="text-[10px]">This feature is Locked</h5>
      <p className="leading-[1] text-[8px] mt-[2px]">Upgrade now to unlock</p>
      <Badge variant="wz" size="sm" className="px-[4px] text-[8px] rounded-[2px]">Upgrade</Badge>
    </div>
  </div>
}