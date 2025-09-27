import { TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getDaysInMonth, nameInitials } from "@/lib/formatter"
import { cn } from "@/lib/utils"
import { clientWiseHistory, statusClases } from "@/lib/physical-attendance"
import { getMonth, getYear } from "date-fns"

function TableHeader({ days }) {
  return (
    <thead>
      <tr className="text-sm text-gray-500">
        <th className="px-4 py-2 text-left whitespace-nowrap">Sr No.</th>
        <th className="px-4 py-2 text-left">Name</th>
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

function TableRow({
  index,
  client
}) {
  return (
    <tr className="text-sm">
      <td className="px-4 py-2">{index}</td>
      <td className="whitespace-nowrap px-4 py-2 flex items-center gap-2">
        <Avatar>
          <AvatarImage src={client.clientProfile} />
          <AvatarFallback>{nameInitials(client?.clientName)}</AvatarFallback>
        </Avatar>
        {client.clientName}
      </td>
      {client.monthlyAttendance.map((day, i) => (
        <td key={i} className="px-2 py-1">
          <div
            className={cn("w-6 h-6 flex items-center justify-center rounded-md", statusClases(day.status))}
          >
            {nameInitials(day.status) || <>-</>}
          </div>
        </td>
      ))}
    </tr>
  )
}

export function ClientwiseHistory({
  query,
  data
}) {
  const now = new Date();
  const days = getDaysInMonth(getYear(now), getMonth(now))

  const result = (clientWiseHistory(data) || [])
    .filter(client => new RegExp(query, "i").test(client?.clientName))

  return (
    <TabsContent value="clientwise-history">
      <Card className="p-0 shadow-none border-1 rounded-[10px] bg-[var(--comp-1)]">
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <TableHeader days={days} />
            <tbody>
              {result.map((client, idx) => (
                <TableRow
                  key={idx}
                  index={idx + 1}
                  client={client}
                  days={days}
                />
              ))}
            </tbody>
          </table>
        </div>
        {result.length === 0 && <div className="bg-white m-4 border-1 rounded-[6px] h-[200px] flex items-center justify-center font-bold">
          No Matches Found!
        </div>}
      </Card>
    </TabsContent>
  )
}