import Link from "next/link";
import TopPerformerClientList from "./ClientListTopPerformer";

export default function TopPerformers({ clients }) {
  return <div className="bg-white py-4 rounded-[10px]">
    <div className="mb-4 px-4 flex items-center justify-between">
      <p className="text-[14px] font-bold">Top Performers</p>
      <Link
        href="/coach/add-client"
        className="bg-[var(--accent-1)] text-white text-[10px] font-semibold px-3 py-2 rounded-[4px]"
      >
        + Add Client
      </Link>
    </div>
    <div className="divide-y-1 divide-[#ECECEC]">
      {clients.map(client => <TopPerformerClientList
        key={client.clientId}
        src={client.profilePhoto}
        name={client.name}
        id={client.clientId}
      />)}
    </div>
  </div>
}