import { ChevronLeft, RefreshCcw, X } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "../ui/drawer";
import { DialogTitle } from "../ui/dialog";
import { fetchData } from "@/lib/api";
import ContentLoader from "../common/ContentLoader";
import ContentError from "../common/ContentError";
import useSWR from "swr";
import UpcomingBirthdays from "../pages/coach/dashboard/feature-statistics/UpcomingBirthdays";
import ClubSubscriptions from "../pages/coach/dashboard/feature-statistics/ClubSubscriptions";
import PlansAboutToExpire from "../pages/coach/dashboard/feature-statistics/PlansAboutToExpire";

export default function DashboardFeaturesDetails() {
  return <Drawer direction="right">
    <DrawerTrigger className="flex items-center gap-1 font-bold fixed top-1/2 translate-y-[40px] translate-x-[-24px] right-0 opacity-60 hover:opacity-100">
      <ChevronLeft />
      Statistics
    </DrawerTrigger>
    <DrawerContent className="p-0 overflow-y-auto overflow-x-hidden !max-w-[90vw] min-w-[90vw] w-full">
      <DialogTitle className="p-4 border-b-1 bg-[var(--comp-1)]">
        Dashboard Feature Statistics
      </DialogTitle>
      <Container />
      <DrawerClose className="bg-[var(--primary-1)] p-2 absolute top-1/2 left-0 translate-x-[-20px rounded-full">
        {/* <X /> */}
      </DrawerClose>
    </DrawerContent>
  </Drawer>
}

function Container() {
  const { isLoading, error, data, mutate } = useSWR(
    "upcomingBirthdays",
    () => fetchData("app/dashboard/statistics")
  );

  if (isLoading) return <ContentLoader />

  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} />

  const {
    birthdays = [],
    subscriptions = [],
    plans = []
  } = data.data || {}

  return <div className="p-4">
    <div className="grid grid-cols-2 gap-4">
      <UpcomingBirthdays birthdays={birthdays} />
      <ClubSubscriptions subscriptions={subscriptions} />
      <PlansAboutToExpire plans={plans} />
      {/* Plans about to expire */}
    </div>
  </div>
}