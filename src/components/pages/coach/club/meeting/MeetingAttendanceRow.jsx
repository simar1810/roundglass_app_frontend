import { TableCell, TableRow } from "@/components/ui/table";

export default function MeetingAttendanceRow({
  attendance,
  index
}) {
  return <TableRow>
    <TableCell>{index + 1}</TableCell>
    <TableCell>{attendance.name}</TableCell>
    <TableCell>{attendance.rollno}</TableCell>
    <TableCell>null in api</TableCell>
    <TableCell>{attendance.attendance.time}</TableCell>
    <TableCell>{attendance.attendance.date}</TableCell>
  </TableRow>
}