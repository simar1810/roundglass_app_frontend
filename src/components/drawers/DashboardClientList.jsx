import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"
import TopPerformers from "../pages/coach/dashboard/TopPerformers"
import FollowUpList from "../pages/coach/dashboard/FollowUpList"
import { ChevronLeft, X } from "lucide-react"
import { DialogTitle } from "../ui/dialog"

export default function DashboardClientList({
  topPerformers,
  fourClients
}) {
  return <Drawer direction="right">
    <DrawerTrigger className="flex items-center gap-1 font-bold fixed top-1/2 translate-x-[-5 0%] right-0">
      <ChevronLeft />
      {/* Clients */}
    </DrawerTrigger>
    <DrawerContent className="p-4">
      <DialogTitle />
      <TopPerformers clients={topPerformers} />
      <FollowUpList clients={fourClients} />
      <DrawerClose className="bg-[var(--primary-1)] p-2 absolute top-1/2 left-0 translate-[-110%] rounded-full">
        <X />
      </DrawerClose>
    </DrawerContent>
  </Drawer>
}