import useCurrentStateContext from "@/providers/CurrentStateContext"
import CategoryCard from "./CategoryCard"

export default function CategoryListing() {
  const { categories } = useCurrentStateContext()
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {categories.map((cat) => (
      <CategoryCard
        key={cat._id}
        category={cat}
      />
    ))}
  </div>
}