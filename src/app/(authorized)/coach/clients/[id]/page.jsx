import ClientData from "@/components/pages/coach/client/ClientData";
import ClientDetailsCard from "@/components/pages/coach/client/ClientDetailsCard";

export default function Page() {
  return <div className="mt-4 grid md:grid-cols-2 items-start gap-4">
    <ClientDetailsCard />
    <ClientData />
  </div>
}