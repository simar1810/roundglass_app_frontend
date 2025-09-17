"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { dummyRequests } from "./ShakeRequestsTable"
import { TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { nameInitials } from "@/lib/formatter"
import { generateAttendanceRows, statusClases } from "@/lib/physical-attendance"
import { cn } from "@/lib/utils"

function SearchBar() {
  return (
    <div className="flex items-center justify-between mb-4">
      <Input placeholder="Search Client" className="w-64" />
      <div className="flex items-center gap-2">
        <div className="border rounded-md px-3 py-2 text-sm text-gray-600">
          Date: 15 Sept 25
        </div>
        <Button variant="outline">Export CSV</Button>
      </div>
    </div>
  )
}

function TableHeader() {
  return (
    <thead>
      <tr className="text-sm text-gray-500">
        <th className="px-4 py-2 text-left">Sr No</th>
        <th className="px-4 py-2 text-left">Client Name</th>
        <th className="px-4 py-2 text-left">Date</th>
        <th className="px-4 py-2 text-left">Attendance Status</th>
      </tr>
    </thead>
  )
}

function TableRow({
  client,
  index
}) {
  return (
    <tr className="text-sm">
      <td className="px-4 py-2">{index}</td>
      <td className="px-4 py-2 flex items-center gap-2">
        <Avatar>
          <AvatarImage src={client.profilePhoto} />
          <AvatarFallback>{nameInitials(client.clientName)}</AvatarFallback>
        </Avatar>
        {client.clientName}
      </td>
      <td className="px-4 py-2">{client.date}</td>
      <td className="px-4 py-2">
        <span className={cn("px-2 py-1 rounded-full text-xs capitalize", statusClases(client.status))}>
          {client.status || <>N/A</>}
        </span>
      </td>
    </tr>
  )
}

export default function DailyAttendancePage({
  query,
  data
}) {
  const clients = (generateAttendanceRows(data) || [])
    .filter(client => new RegExp(query, "i").test(client?.clientName))

  return (
    <TabsContent value="daily-attendance" className="border-1 shadow-none rounded-[10px]">
      <Card className="p-4 bg-[var(--comp-1)] border-0 rounded-[10px]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <TableHeader />
            <tbody>
              {clients.map((client, idx) => (
                <TableRow
                  key={idx}
                  client={client}
                  index={idx + 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </TabsContent>
  )
}
