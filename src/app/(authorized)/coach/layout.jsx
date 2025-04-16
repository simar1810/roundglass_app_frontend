"use server";
import AppNavbar from "@/components/common/AppNavbar";
import AppSidebar from "@/components/common/AppSidebar";
import Guardian from "@/components/common/Guardian";
import UpgradeSubscriptionAlert from "@/components/common/UpgradeSubscriptionAlert";
import { SidebarProvider } from "@/components/ui/sidebar";

export default async function Layout({ children }) {
  return <SidebarProvider className="!bg-white">
    <AppSidebar className="!min-w-[250px]" />
    <div className="grow">
      <AppNavbar />
      <div className="bg-[var(--comp-2)] p-4">
        <UpgradeSubscriptionAlert />
        {children}
      </div>
    </div>
  </SidebarProvider>
}