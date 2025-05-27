import ClientListFollowUp from "./ClientListFollowUp";

export default function FollowUpList({ clients }) {
  return <div className="bg-white py-4 rounded-[10px] border-1">
    <div className="text-[14px] font-bold mb-4 px-4">Pending Followups</div>
    <div className="divide-y-1 divide-[#ECECEC]">
      {clients.map(client => <ClientListFollowUp
        key={client.clientId}
        src={client.profilePhoto}
        name={client.name}
        id={client.clientId}
      />)}
    </div>
  </div>
}