import CoachData from "@/components/pages/coach/portfolio/CoachData";
import CoachDetailsCard from "@/components/pages/coach/portfolio/CoachDetailsCard";

export default function Page() {
  return <div className="mt-4 grid md:grid-cols-2 items-start gap-4">
    <CoachDetailsCard />
    <CoachData />
  </div>
}