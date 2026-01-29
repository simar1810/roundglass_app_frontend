"use client";

import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import AddMeasurementModal from "@/components/modals/growth/AddMeasurementModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAppClientPortfolioDetails } from "@/lib/fetchers/app";
import { getClientStatus } from "@/lib/fetchers/growth";
import { nameInitials } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { differenceInMonths, differenceInYears, format, parse } from "date-fns";
import { CalendarIcon, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

export default function ClientGrowthStatus({ clientId }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [standard, setStandard] = useState("IPA");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Fetch client data
  const { isLoading: clientLoading, error: clientError, data: clientData } = useSWR(
    clientId ? `clientDetails/${clientId}` : null,
    () => getAppClientPortfolioDetails(clientId)
  );

  // Build query params for status
  const statusKey = clientId
    ? `growth/client-status/${clientId}?${selectedDate ? `date=${format(selectedDate, "yyyy-MM-dd")}&` : ""}standard=${standard}`
    : null;

  // Fetch growth status
  const { isLoading: statusLoading, error: statusError, data: statusData } = useSWR(
    statusKey,
    () => getClientStatus(clientId, selectedDate ? format(selectedDate, "yyyy-MM-dd") : null, standard)
  );

  const handleMeasurementSuccess = () => {
    // Refresh status data
    mutate(statusKey);
    toast.success("Measurement added successfully");
  };

  if (clientLoading) return <ContentLoader />;
  if (clientError || clientData?.status_code !== 200) {
    const { getGrowthErrorMessage } = require("@/lib/utils/growthErrors");
    const errorMessage = getGrowthErrorMessage(
      clientData?.status_code || 500,
      clientError || clientData?.message || "Failed to load client data",
      clientData
    );
    return <ContentError title={errorMessage} />;
  }

  const client = clientData?.data;
  if (!client) return <ContentError title="Client not found" />;

  // Calculate age
  const age = useMemo(() => {
    if (!client.dob) return null;
    try {
      // Try parsing different date formats
      let dobDate;
      if (client.dob.includes("-")) {
        // Try yyyy-MM-dd or dd-MM-yyyy
        const parts = client.dob.split("-");
        if (parts[0].length === 4) {
          dobDate = parse(client.dob, "yyyy-MM-dd", new Date());
        } else {
          dobDate = parse(client.dob, "dd-MM-yyyy", new Date());
        }
      } else {
        dobDate = parse(client.dob, "dd/MM/yyyy", new Date());
      }
      return {
        years: differenceInYears(new Date(), dobDate),
        months: differenceInMonths(new Date(), dobDate),
      };
    } catch {
      return null;
    }
  }, [client.dob]);

  const status = statusData?.data;
  const benchmark = status?.benchmark;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={client.profilePhoto} />
                <AvatarFallback>{nameInitials(client.name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{client.name}</CardTitle>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  {age && (
                    <span>
                      Age: {age.years} years {age.months % 12} months
                    </span>
                  )}
                  {client.gender && (
                    <span className="capitalize">Gender: {client.gender}</span>
                  )}
                </div>
              </div>
            </div>
            <AddMeasurementModal clientId={clientId} onSuccess={handleMeasurementSuccess} />
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Date Filter */}
            <div className="w-full min-w-0">
              <label className="text-sm font-medium mb-2 block">Filter by Date</label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate
                      ? format(selectedDate, "dd-MM-yyyy")
                      : "View Latest Status"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setDatePickerOpen(false);
                    }}
                    initialFocus
                    maxDate={new Date()}
                  />
                  {selectedDate && (
                    <div className="p-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedDate(null);
                          setDatePickerOpen(false);
                        }}
                      >
                        Clear Date Filter
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Standard Selector */}
            <div className="w-full min-w-0">
              <label className="text-sm font-medium mb-2 block">Standard</label>
              <Select value={standard} onValueChange={setStandard}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IPA">IPA</SelectItem>
                  <SelectItem value="IAP">IAP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Status Display */}
      {statusLoading ? (
        <ContentLoader />
      ) : statusError || statusData?.status_code !== 200 ? (
        <Card>
          <CardContent className="pt-6">
            <ContentError
              title={(() => {
                const { getGrowthErrorMessage } = require("@/lib/utils/growthErrors");
                return getGrowthErrorMessage(
                  statusData?.status_code || 500,
                  statusError || statusData?.message || "No measurement data available",
                  statusData
                );
              })()}
            />
          </CardContent>
        </Card>
      ) : status ? (
        <>
          <StatusCards status={status} benchmark={benchmark} />
          {/* Note: ClientGrowthTrendChart requires measurement history array */}
          {/* This will be implemented when backend provides history endpoint */}
          <GrowthHistoryTable clientId={clientId} standard={standard} />
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">No measurement data available for this client.</p>
            <AddMeasurementModal clientId={clientId} onSuccess={handleMeasurementSuccess} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusCards({ status, benchmark }) {
  if (!benchmark) return null;

  const heightScore = benchmark.heightScore;
  const weightScore = benchmark.weightScore;
  const heightGap = benchmark.heightGapCm ?? 0;
  const weightGap = benchmark.weightGapKg ?? 0;
  const p50Height = benchmark.p50HeightCm ?? 0;
  const p50Weight = benchmark.p50WeightKg ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Current Measurements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current Measurements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-muted-foreground">Height: </span>
              <span className="font-semibold">
                {status.height} {status.heightUnit}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Weight: </span>
              <span className="font-semibold">
                {status.weight} {status.weightUnit}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Date: {status.createdDate}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Height Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Height Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant={heightScore === 1 ? "default" : "destructive"}
              className={heightScore === 1 ? "bg-green-500" : ""}
            >
              {heightScore === 1 ? "Healthy" : "Below Standard"}
            </Badge>
            <span className="text-2xl font-bold">{heightScore}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            {heightGap > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : heightGap < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-gray-500" />
            )}
            <span className={cn(
              heightGap > 0 ? "text-green-600" : heightGap < 0 ? "text-red-600" : "text-gray-600"
            )}>
              {heightGap > 0 ? "+" : ""}
              {typeof heightGap === "number" ? heightGap.toFixed(2) : "0.00"} cm
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            P50: {typeof p50Height === "number" ? p50Height.toFixed(2) : "0.00"} cm
          </div>
        </CardContent>
      </Card>

      {/* Weight Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Weight Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant={weightScore === 1 ? "default" : "destructive"}
              className={weightScore === 1 ? "bg-green-500" : ""}
            >
              {weightScore === 1 ? "Healthy" : "Below Standard"}
            </Badge>
            <span className="text-2xl font-bold">{weightScore}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            {weightGap > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : weightGap < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-gray-500" />
            )}
            <span className={cn(
              weightGap > 0 ? "text-green-600" : weightGap < 0 ? "text-red-600" : "text-gray-600"
            )}>
              {weightGap > 0 ? "+" : ""}
              {typeof weightGap === "number" ? weightGap.toFixed(2) : "0.00"} kg
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            P50: {typeof p50Weight === "number" ? p50Weight.toFixed(2) : "0.00"} kg
          </div>
        </CardContent>
      </Card>

      {/* Benchmark Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Benchmark Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Age: </span>
              <span className="font-semibold">{benchmark.ageMonths} months</span>
            </div>
            <div>
              <span className="text-muted-foreground">Standard: </span>
              <span className="font-semibold">{benchmark.standard}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Gender: </span>
              <span className="font-semibold capitalize">{benchmark.gender}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GrowthHistoryTable({ clientId, standard }) {
  // Note: The API doesn't have a direct endpoint for history
  // This would need to be implemented if the backend provides it
  // For now, we'll show a placeholder or fetch from healthMatrix if available

  // TODO: Implement history fetching when backend endpoint is available
  // This could be: GET /api/growth/clients/:clientId/history?standard=IPA

  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>Growth history tracking will be available soon.</p>
          <p className="text-sm mt-2">
            Historical measurements will be displayed here once the backend endpoint is implemented.
          </p>
        </div>
        {/* Future implementation:
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Height</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Height Score</TableHead>
              <TableHead>Weight Score</TableHead>
              <TableHead>Height Gap</TableHead>
              <TableHead>Weight Gap</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((entry) => (
              <TableRow key={entry._id}>
                <TableCell>{entry.createdDate}</TableCell>
                <TableCell>{entry.height} {entry.heightUnit}</TableCell>
                <TableCell>{entry.weight} {entry.weightUnit}</TableCell>
                <TableCell>
                  <Badge variant={entry.benchmark.heightScore === 1 ? "default" : "destructive"}>
                    {entry.benchmark.heightScore}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={entry.benchmark.weightScore === 1 ? "default" : "destructive"}>
                    {entry.benchmark.weightScore}
                  </Badge>
                </TableCell>
                <TableCell>
                  {entry.benchmark?.heightGapCm != null 
                    ? entry.benchmark.heightGapCm.toFixed(2) 
                    : "—"} cm
                </TableCell>
                <TableCell>
                  {entry.benchmark?.weightGapKg != null 
                    ? entry.benchmark.weightGapKg.toFixed(2) 
                    : "—"} kg
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        */}
      </CardContent>
    </Card>
  );
}


