"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadGroupReportPDF } from "@/lib/fetchers/growth";
import { format } from "date-fns";
import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function GroupReport({
  report,
  groupName,
  fromDate,
  toDate,
  standard,
  onDownloadPDF,
}) {
  const [loadingPDF, setLoadingPDF] = useState(false);

  if (!report) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No report data available.</p>
        </CardContent>
      </Card>
    );
  }

  const overall = report.overall || {};
  const buckets = report.buckets || [];

  const handleDownloadPDF = async () => {
    if (onDownloadPDF) {
      onDownloadPDF();
      return;
    }

    try {
      setLoadingPDF(true);
      const filename = `growth-report-${groupName || "group"}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      // Note: This would need groupId to be passed as prop
      toast.info("PDF download functionality requires groupId prop");
    } catch (error) {
      toast.error(error.message || "Failed to download PDF");
    } finally {
      setLoadingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl mb-2">{groupName || "Growth Report"}</CardTitle>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {fromDate && toDate && (
                  <span>
                    Date Range: {format(fromDate, "dd-MM-yyyy")} to {format(toDate, "dd-MM-yyyy")}
                  </span>
                )}
                {standard && <span>Standard: {standard}</span>}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={loadingPDF}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {loadingPDF ? "Generating..." : "Export PDF"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Metric</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Above P50</TableHead>
                  <TableHead className="text-center">Below P50</TableHead>
                  <TableHead className="text-center">% Below Standard</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Total Players</TableCell>
                  <TableCell className="text-center font-bold">{overall.total || 0}</TableCell>
                  <TableCell className="text-center">—</TableCell>
                  <TableCell className="text-center">—</TableCell>
                  <TableCell className="text-center">—</TableCell>
                </TableRow>
                <StatisticsRow
                  label="Height"
                  total={overall.total}
                  above={overall.height?.aboveP50 || 0}
                  below={overall.height?.belowP50 || 0}
                />
                <StatisticsRow
                  label="Weight"
                  total={overall.total}
                  above={overall.weight?.aboveP50 || 0}
                  below={overall.weight?.belowP50 || 0}
                />
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Age Bucket Breakdown */}
      {buckets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Age Group Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buckets.map((bucket) => (
              <AgeBucketCard key={bucket.bucket} bucket={bucket} />
            ))}
          </div>
        </div>
      )}

      {/* Age Bucket Detailed Tables */}
      {buckets.length > 0 && (
        <div className="space-y-6">
          {buckets.map((bucket) => (
            <AgeBucketTable key={bucket.bucket} bucket={bucket} />
          ))}
        </div>
      )}

      {/* Client-Level Details Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Client-Level Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">
              Individual client details will be displayed here when available.
            </p>
            <p className="text-sm">
              The backend API currently provides aggregate statistics. Client-level data will be
              shown here once the endpoint is enhanced to include individual client information.
            </p>
          </div>
          {/* Future implementation:
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Age Group</TableHead>
                <TableHead>Height Score</TableHead>
                <TableHead>Weight Score</TableHead>
                <TableHead>Height Gap</TableHead>
                <TableHead>Weight Gap</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client._id}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.ageGroup}</TableCell>
                  <TableCell>
                    <Badge variant={client.heightScore === 1 ? "default" : "destructive"}>
                      {client.heightScore}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.weightScore === 1 ? "default" : "destructive"}>
                      {client.weightScore}
                    </Badge>
                  </TableCell>
                  <TableCell>{client.heightGap.toFixed(2)} cm</TableCell>
                  <TableCell>{client.weightGap.toFixed(2)} kg</TableCell>
                  <TableCell>
                    {client.heightScore === 0 && client.weightScore === 0 ? (
                      <Badge variant="destructive">Needs Intervention</Badge>
                    ) : (
                      <Badge variant="outline">Normal</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          */}
        </CardContent>
      </Card>
    </div>
  );
}

function StatisticsRow({ label, total, above, below }) {
  const belowPercent = total > 0 ? ((below / total) * 100).toFixed(1) : 0;

  return (
    <TableRow>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell className="text-center">{total}</TableCell>
      <TableCell className="text-center">
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {above}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          {below}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Progress value={parseFloat(belowPercent)} className="flex-1" />
          <span className="text-sm font-medium w-12 text-right">{belowPercent}%</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

function AgeBucketCard({ bucket }) {
  const total = bucket.total || 0;
  const heightAbove = bucket.height?.aboveP50 || 0;
  const heightBelow = bucket.height?.belowP50 || 0;
  const weightAbove = bucket.weight?.aboveP50 || 0;
  const weightBelow = bucket.weight?.belowP50 || 0;

  const heightBelowPercent = total > 0 ? ((heightBelow / total) * 100).toFixed(1) : 0;
  const weightBelowPercent = total > 0 ? ((weightBelow / total) * 100).toFixed(1) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{bucket.bucket} Team</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Total Players</span>
            <span className="text-2xl font-bold">{total}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Height</span>
              <span className="text-xs text-muted-foreground">
                {heightBelowPercent}% below
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div className="bg-green-50 p-2 rounded border border-green-200">
                <div className="font-semibold text-green-700">{heightAbove}</div>
                <div className="text-green-600">Above P50</div>
              </div>
              <div className="bg-red-50 p-2 rounded border border-red-200">
                <div className="font-semibold text-red-700">{heightBelow}</div>
                <div className="text-red-600">Below P50</div>
              </div>
            </div>
            <Progress value={parseFloat(heightBelowPercent)} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Weight</span>
              <span className="text-xs text-muted-foreground">
                {weightBelowPercent}% below
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div className="bg-green-50 p-2 rounded border border-green-200">
                <div className="font-semibold text-green-700">{weightAbove}</div>
                <div className="text-green-600">Above P50</div>
              </div>
              <div className="bg-red-50 p-2 rounded border border-red-200">
                <div className="font-semibold text-red-700">{weightBelow}</div>
                <div className="text-red-600">Below P50</div>
              </div>
            </div>
            <Progress value={parseFloat(weightBelowPercent)} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AgeBucketTable({ bucket }) {
  const total = bucket.total || 0;
  const heightAbove = bucket.height?.aboveP50 || 0;
  const heightBelow = bucket.height?.belowP50 || 0;
  const weightAbove = bucket.weight?.aboveP50 || 0;
  const weightBelow = bucket.weight?.belowP50 || 0;

  const heightBelowPercent = total > 0 ? ((heightBelow / total) * 100).toFixed(1) : 0;
  const weightBelowPercent = total > 0 ? ((weightBelow / total) * 100).toFixed(1) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{bucket.bucket} Team - Detailed Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Metric</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Above P50</TableHead>
                <TableHead className="text-center">Below P50</TableHead>
                <TableHead className="text-center">% Below Standard</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Players</TableCell>
                <TableCell className="text-center font-bold">{total}</TableCell>
                <TableCell className="text-center">—</TableCell>
                <TableCell className="text-center">—</TableCell>
                <TableCell className="text-center">—</TableCell>
              </TableRow>
              <StatisticsRow
                label="Height"
                total={total}
                above={heightAbove}
                below={heightBelow}
              />
              <StatisticsRow
                label="Weight"
                total={total}
                above={weightAbove}
                below={weightBelow}
              />
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}






