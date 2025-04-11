import DashboardInfoCard from "@/components/cards/DashboardInfoCard";
import ClientList from "@/components/common/client/ClientList";
import Tools from "@/components/pages/coach/Tools";

export default function Page() {
  return <div className="mt-8">
    <div className="grid grid-cols-5 gap-4">
      {Array.from({ length: 7 }, (_, i) => i).map(item => <DashboardInfoCard key={item} />)}
    </div>
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