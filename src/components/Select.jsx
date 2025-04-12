export default function SelectControl({
  label,
  className,
  options,
  ...props
}) {
  return <label className={className}>
    <span className="label font-[600]">{label}</span>
    <select
      {...props}
      className="w-full input block mt-1 px-4 py-2 rounded-[8px] focus:outline-none border-1 border-[#D6D6D6] placeholder:text-[#1C1B1F]/25"
    >
      {options.map(item => <option key={item.id}>

      </option>)}
    </select>
  </label>
}