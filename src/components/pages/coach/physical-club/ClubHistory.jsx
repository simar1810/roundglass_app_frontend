"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { dummyRequests } from "./ShakeRequestsTable"
import { TabsContent } from "@/components/ui/tabs"
import { nameInitials } from "@/lib/formatter"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

function TableHeader() {
  return (
    <thead>
      <tr className="text-sm text-gray-500">
        <th className="px-4 py-2 text-left">Client ID</th>
        <th className="px-4 py-2 text-left">Client Name</th>
        <th className="px-4 py-2 text-left">Client Status</th>
        <th className="px-4 py-2 text-left">Present Days</th>
        <th className="px-4 py-2 text-left">Absent Days</th>
        <th className="px-4 py-2 text-left">Showup Percentage</th>
      </tr>
    </thead>
  )
}

function TableRow({ client }) {
  const getStatusClass = (status) =>
    status === "Active"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-600"

  const getPercentageClass = (percent = 10) => {
    if (percent >= 75) return "text-green-600"
    if (percent >= 45) return "text-yellow-600"
    return "text-red-600"
  }

  const getBadgeClass = (label = "Low") => {
    switch (label) {
      case "High":
        return "bg-green-100 text-green-700"
      case "Moderate":
        return "bg-orange-100 text-orange-600"
      case "Low":
        return "bg-yellow-100 text-yellow-600"
      case "Very Low":
        return "bg-red-100 text-red-600"
      default:
        return "bg-purple-500"
    }
  }

  return (
    <tr className="text-sm">
      <td className="px-4 py-2">{client.id}</td>
      <td className="px-4 py-2 flex items-center gap-2">
        <Avatar>
          <AvatarImage src={client.profilePhoto} />
          <AvatarFallback>{nameInitials(client.clientName)}</AvatarFallback>
        </Avatar>
        {client.clientName}
      </td>
      <td className="px-4 py-2">
        <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusClass(client.status)}`}>
          {client.status}
        </span>
      </td>
      <td className="px-4 py-2">{client.present || 4} Days</td>
      <td className="px-4 py-2">{client.absent || 1} Days</td>
      <td className="px-4 py-2 flex items-center gap-2">
        <span className={`font-medium ${getPercentageClass(client.percentage)}`}>
          {client.percentage}%
        </span>
        <span className={`px-2 py-1 rounded-full text-xs ${getBadgeClass(client.label)}`}>
          {client.label || <>Very Low</>}
        </span>
      </td>
    </tr>
  )
}

export default function ClubHistoryPage() {
  const clients = dummyRequests || []
  return (
    <TabsContent value="club-history">
      <Card className="p-4 border-1 bg-[var(--comp-1)]">
        <SearchBar />
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <TableHeader />
            <tbody>
              {clients.map((client, idx) => (
                <TableRow key={idx} client={client} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </TabsContent>
  )
}
