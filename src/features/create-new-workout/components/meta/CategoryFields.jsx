import { Input } from "@/components/ui/input";

export default function CategoryFields({
  category,
  subcategory,
  onCategoryChange,
  onSubcategoryChange,
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700">Category</p>
        <Input
          value={category}
          onChange={e => onCategoryChange(e.target.value)}
          className="bg-gray-50"
        />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700">Subcategory</p>
        <Input
          value={subcategory}
          onChange={e => onSubcategoryChange(e.target.value)}
          className="bg-gray-50"
        />
      </div>
    </div>
  );
}
