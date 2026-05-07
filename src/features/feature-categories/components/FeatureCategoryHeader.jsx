import useCurrentStateContext from "@/providers/CurrentStateContext";

export default function FeatureCategoryHeader() {
  const {
    meta: { title, subtitle },
    dispatch
  } = useCurrentStateContext()
  return <header className="flex justify-between items-center mb-10">
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
      <p className="text-zinc-500 text-sm">{subtitle}</p>
    </div>
    <button
      onClick={() => dispatch({ type: "OPEN_FORM" })}
      className="bg-[#70C041] hover:bg-[#62aa38] text-white px-8 py-2.5 rounded-[4px] flex items-center gap-2 font-bold text-sm transition-all"
    >
      Create
    </button>
  </header>
}