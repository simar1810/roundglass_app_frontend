import ClientListItemStatus from "@/components/common/client/ClientListItemStatus";

export default function Page() {
  return <div className="mt-8">
    <div className="grid grid-cols-2 gap-4 divide-y-1">
      {Array.from({ length: 20 }, (_, i) => i).map(item => <ClientListItemStatus
        key={item}
        src="/"
        name="Dnyaneshwar Kawade"
        status={Math.random() > 0.5}
        id={123}
      />)}
    </div>
  </div>
}