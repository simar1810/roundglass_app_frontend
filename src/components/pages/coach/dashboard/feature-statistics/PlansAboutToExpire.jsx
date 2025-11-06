import { useMemo, useState } from "react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { format, isBefore, parse } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"


export default function PlansAboutToExpire({ plans = [] }) {
  const [pagination, setPagination] = useState({
    max: Math.ceil(plans.length / 10),
    current: 1,
    limit: 10
  })
  const sortedPlans = useMemo(() => sortPlans(plans), [plans])
  const toDisplay = sortedPlans.slice(
    (pagination.current - 1) *
    pagination.limit, pagination.current * pagination.limit
  )
  return <div>
    <h5>Plans About to Expire</h5>
    <div className="w-full bg-[var(--comp-1)] rounded-xl border-1 my-4 overflow-clip">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sr No</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Last Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {toDisplay.map((plan, index) => <TableRow
            key={plan._id}
          >
            <TableCell>{index + 1 + (pagination.current - 1) * pagination.limit}</TableCell>
            <TableCell>{plan.title}</TableCell>
            <TableCell>{format(plan.endDate, 'dd-MM-yyyy')}</TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
      <div className="bg-[var(--comp-2)] px-4 py-2 flex items-center justify-between border-t-1">
        <Select value={pagination.limit} onValueChange={(value) => setPagination(prev => ({ ...prev, limit: Number(value) }))}>
          <SelectTrigger className="bg-[var(--comp-1)]">
            <SelectValue placeholder="Select Limit" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--comp-1)]">
            <SelectItem value={10}>10</SelectItem>
            <SelectItem value={15}>15</SelectItem>
            <SelectItem value={20}>20</SelectItem>
            <SelectItem value={25}>25</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
            disabled={pagination.current === 1} className
            ="opacity-50 cursor-not-allowed"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
            disabled={pagination.current === pagination.max}
            className="opacity-50 cursor-not-allowed"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  </div>
}

function sortPlans(plans) {
  return plans
    .map(plan => {
      const endDate = Object
        ?.keys(plan?.plans || {})
        ?.map(plan => parse(plan, 'dd-MM-yyyy', new Date()))
        ?.sort((a, b) => isBefore(b, a) ? -1 : 1)
        ?.at(0)
      plan.endDate = endDate
      return plan
    })
    .sort((a, b) => isBefore(a.endDate, b.endDate) ? 1 : -1)
}