import { Textarea } from "@/components/ui/textarea";

export default function TextAreaField({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-gray-50 resize-none min-h-[90px]"
      />
    </div>
  );
}