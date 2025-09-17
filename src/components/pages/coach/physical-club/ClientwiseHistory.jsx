import { TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { dummyRequests } from "./ShakeRequestsTable"
import Paginate from "@/components/Paginate"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { nameInitials } from "@/lib/formatter"

function SearchBar() {
  return (
    <div className="flex items-center justify-between mb-4">
      <Input placeholder="Search Client" className="w-64" />
      <div className="flex items-center gap-2">
        <div className="border rounded-md px-3 py-2 text-sm text-gray-600">
          Date Range: 15 Aug 2025 - 15 Sept 2025
        </div>
        <Button variant="outline">Export CSV</Button>
      </div>
    </div>
  )
}

function TableHeader({ days }) {
  return (
    <thead>
      <tr className="text-sm text-gray-500">
        <th className="px-4 py-2 text-left">Client ID</th>
        <th className="px-4 py-2 text-left">Client Name</th>
        {days.map((day) => (
          <th key={day.date} className="px-2 py-1">
            <div>{day.date}</div>
            <div className="text-xs text-gray-400">{day.day}</div>
          </th>
        ))}
      </tr>
    </thead>
  )
}

function TableRow({ client, days }) {
  return (
    <tr className="text-sm">
      <td className="px-4 py-2">{client.id}</td>
      <td className="whitespace-nowrap px-4 py-2 flex items-center gap-2">
        <Avatar>
          <AvatarImage src={client.profilePhoto} />
          <AvatarFallback>{nameInitials(client.clientName)}</AvatarFallback>
        </Avatar>
        {client.clientName}
      </td>
      {days.map((day, i) => (
        <td key={i} className="px-2 py-1">
          <div
            className={`w-6 h-6 flex items-center justify-center rounded-md ${day.status === "P"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
              }`}
          >
            {day.status}
          </div>
        </td>
      ))}
    </tr>
  )
}

export function ClientwiseHistory() {
  const days = Array.from({ length: 24 }, (_, i) => ({
    date: i + 1,
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7],
    status: i % 7 === 5 || i % 7 === 6 ? "A" : "P",
  }))

  const clients = dummyRequests || [];

  const totalPages = Math.ceil(clients.length / 8)
  const totalResults = clients.length

  return (
    <TabsContent value="clientwise-history">
      <Card className="p-4">
        <SearchBar />
        <div className="bg-[var(--comp-1)] border-1 rounded-[10px] overflow-x-auto">
          <table className="min-w-full border-collapse">
            <TableHeader days={days} />
            <tbody>
              {clients.map((client, idx) => (
                <TableRow key={idx} client={client} days={days} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Paginate
            page={1}
            limit={8}
            totalPages={totalPages}
            totalResults={totalResults}
            onChange={({ page, limit }) => {
              console.log("Changed:", page, limit)
            }}
          />
        </div>
      </Card>
    </TabsContent>
  )
}