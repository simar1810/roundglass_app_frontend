// components/manual-attendance/ShakeRequestsTable.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";

export const dummyRequests = [
  {
    id: 1,
    clientId: "1234",
    clientName: "John Doe",
    requestDate: "01 Sept, 2025",
    time: "07:17 AM",
    requestType: "Shake",
    status: "pending",
  },
  {
    id: 2,
    clientId: "1235",
    clientName: "John Doe",
    requestDate: "01 Sept, 2025",
    time: "07:17 AM",
    requestType: "Shake",
    status: "approved",
  },
  {
    id: 3,
    clientId: "1236",
    clientName: "John Doe",
    requestDate: "01 Sept, 2025",
    time: "07:17 AM",
    requestType: "Shake",
    status: "rejected",
  },
];

export default function ShakeRequestsTable() {
  const [requests, setRequests] = useState(dummyRequests);

  const handleApprove = (id) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: "approved" } : req
      )
    );
  };

  const handleReject = (id) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: "rejected" } : req
      )
    );
  };

  return (
    <TabsContent value="shake-requests" className="space-y-4">
      {/* Search + Export */}
      <div className="flex justify-between items-center">
        <Input placeholder="Search Client" className="w-[250px]" />
        <Button variant="outline">Export CSV</Button>
      </div>

      {/* Table */}
      <Table className="bg-[var(--comp-1)] border-1">
        <TableHeader>
          <TableRow>
            <TableHead>Client ID</TableHead>
            <TableHead>Client Name</TableHead>
            <TableHead>Request Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Request Type</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => (
            <TableRow key={req.id}>
              <TableCell>{req.clientId}</TableCell>
              <TableCell>{req.clientName}</TableCell>
              <TableCell>{req.requestDate}</TableCell>
              <TableCell>{req.time}</TableCell>
              <TableCell>{req.requestType}</TableCell>
              <TableCell className="flex justify-end gap-2">
                {req.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      className="text-green-600 border-green-600"
                      onClick={() => handleApprove(req.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-600"
                      onClick={() => handleReject(req.id)}
                    >
                      ✕
                    </Button>
                  </>
                )}
                {req.status === "approved" && (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-700"
                  >
                    ● Approved
                  </Badge>
                )}
                {req.status === "rejected" && (
                  <Badge
                    variant="outline"
                    className="bg-red-100 text-red-700"
                  >
                    ● Rejected
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TabsContent>
  );
}