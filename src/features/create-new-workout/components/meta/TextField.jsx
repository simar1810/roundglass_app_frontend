import { Input } from "@/components/ui/input";

export default function TextField({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-gray-50"
      />
    </div>
  );
}