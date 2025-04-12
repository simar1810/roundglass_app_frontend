import MealDisplayCard from "@/components/pages/coach/meals/MealDisplayCard";

export default function Page() {
  return <div className="mt-8">
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 10 }, (_, i) => i).map(item => <MealDisplayCard key={item} />)}
    </div>
  </div>
}