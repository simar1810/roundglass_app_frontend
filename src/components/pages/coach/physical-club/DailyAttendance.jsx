"use client"
import { Card } from "@/components/ui/card"
import { TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { nameInitials } from "@/lib/formatter"
import { generateAttendanceRows, statusClases } from "@/lib/physical-attendance"
import { cn } from "@/lib/utils"

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
  data,
  range
}) {
  const clients = (generateAttendanceRows(data, range) || [])
    .filter(client => new RegExp(query, "i").test(client?.clientName))

  return (
    <TabsContent value="daily-attendance" className="border-1 shadow-none rounded-[10px]">
      <Card className="bg-[var(--comp-1)] border-0 rounded-[10px]">
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
        {clients.length === 0 && <div className="bg-white m-4 border-1 rounded-[6px] h-[200px] flex items-center justify-center font-bold">
          No Matches Found!
        </div>}
      </Card>
    </TabsContent>
  )
}
