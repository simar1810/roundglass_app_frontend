"use client";

import FormControl from "@/components/FormControl";
import SelectControl from "@/components/Select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createMeasurement } from "@/lib/fetchers/growth";
import { getAppClients } from "@/lib/fetchers/app";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { cn } from "@/lib/utils";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import { nameInitials } from "@/lib/formatter";

export default function AddMeasurementModal({ clientId: preSelectedClientId, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const closeBtnRef = useRef(null);

  // Form state
  const [clientId, setClientId] = useState(preSelectedClientId || "");
  const [measuredAt, setMeasuredAt] = useState(new Date());
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState("Cms");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("KG");
  const [standard, setStandard] = useState("IPA");

  // Reset form when modal closes
  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset form
      setClientId(preSelectedClientId || "");
      setMeasuredAt(new Date());
      setHeight("");
      setWeight("");
      setHeightUnit("Cms");
      setWeightUnit("KG");
      setStandard("IPA");
      setShowResults(false);
      setBenchmarkData(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }

    if (!measuredAt) {
      toast.error("Please select a measurement date");
      return;
    }

    if (!height || parseFloat(height) <= 0) {
      toast.error("Please enter a valid height");
      return;
    }

    if (!weight || parseFloat(weight) <= 0) {
      toast.error("Please enter a valid weight");
      return;
    }

    try {
      setLoading(true);

      // Format date as YYYY-MM-DD
      const formattedDate = format(measuredAt, "yyyy-MM-dd");

      const response = await createMeasurement(clientId, {
        measuredAt: formattedDate,
        height: parseFloat(height),
        heightUnit,
        weight: parseFloat(weight),
        weightUnit,
        standard,
      });

      if (response.status_code !== 201) {
        const { getGrowthErrorMessage } = await import("@/lib/utils/growthErrors");
        const errorMessage = getGrowthErrorMessage(
          response.status_code,
          response.message || "Failed to create measurement",
          response
        );
        throw new Error(errorMessage);
      }

      // Show benchmark results
      setBenchmarkData(response.data.benchmark);
      setShowResults(true);

      toast.success(response.message || "Measurement created successfully");

      // Refresh data if callback provided
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Refresh client status cache
      mutate((key) => typeof key === "string" && key.includes(`growth/clients/${clientId}`));
    } catch (error) {
      toast.error(error.message || "Failed to create measurement");
    } finally {
      setLoading(false);
    }
  };

  const handleNewMeasurement = () => {
    setShowResults(false);
    setBenchmarkData(null);
    // Reset form but keep client and date
    setHeight("");
    setWeight("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="wz" size="sm">
          Add Measurement
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-[500px] max-h-[80vh] border-0 p-0 overflow-y-auto">
        <DialogHeader className="bg-[var(--comp-2)] py-4 px-6 border-b-1">
          <DialogTitle className="text-black text-[20px]">
            {showResults ? "Measurement Results" : "Add Growth Measurement"}
          </DialogTitle>
        </DialogHeader>

        {showResults && benchmarkData ? (
          <MeasurementResults
            benchmarkData={benchmarkData}
            onNewMeasurement={handleNewMeasurement}
            onClose={() => closeBtnRef.current?.click()}
          />
        ) : (
          <MeasurementForm
            clientId={clientId}
            setClientId={setClientId}
            preSelectedClientId={preSelectedClientId}
            measuredAt={measuredAt}
            setMeasuredAt={setMeasuredAt}
            height={height}
            setHeight={setHeight}
            heightUnit={heightUnit}
            setHeightUnit={setHeightUnit}
            weight={weight}
            setWeight={setWeight}
            weightUnit={weightUnit}
            setWeightUnit={setWeightUnit}
            standard={standard}
            setStandard={setStandard}
            onSubmit={handleSubmit}
            loading={loading}
            closeBtnRef={closeBtnRef}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function MeasurementForm({
  clientId,
  setClientId,
  preSelectedClientId,
  measuredAt,
  setMeasuredAt,
  height,
  setHeight,
  heightUnit,
  setHeightUnit,
  weight,
  setWeight,
  weightUnit,
  setWeightUnit,
  standard,
  setStandard,
  onSubmit,
  loading,
  closeBtnRef,
}) {
  return (
    <form className="px-6 py-4" onSubmit={onSubmit}>
      {/* Client Selection - only show if not pre-selected */}
      {!preSelectedClientId && (
        <ClientSelector clientId={clientId} setClientId={setClientId} />
      )}

      {/* Measurement Date */}
      <div className="mb-4">
        <label className="label font-[600] text-[14px] block mb-2">Measurement Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !measuredAt && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {measuredAt ? format(measuredAt, "dd-MM-yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={measuredAt}
              onSelect={(date) => date && setMeasuredAt(date)}
              initialFocus
              maxDate={new Date()} // Can't select future dates
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Height */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="col-span-2">
          <FormControl
            label="Height"
            type="number"
            step="0.1"
            min="0"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Enter height"
            className="text-[14px] [&_.label]:font-[400] block"
            required
          />
        </div>
        <div className="col-span-1">
          <SelectControl
            label="Unit"
            value={heightUnit}
            onChange={(e) => setHeightUnit(e.target.value)}
            options={[
              { id: 1, name: "Cms", value: "Cms" },
              { id: 2, name: "Inches", value: "Inches" },
            ]}
            className="text-[14px] [&_.label]:font-[400] block"
          />
        </div>
      </div>

      {/* Weight */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="col-span-2">
          <FormControl
            label="Weight"
            type="number"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter weight"
            className="text-[14px] [&_.label]:font-[400] block"
            required
          />
        </div>
        <div className="col-span-1">
          <SelectControl
            label="Unit"
            value={weightUnit}
            onChange={(e) => setWeightUnit(e.target.value)}
            options={[
              { id: 1, name: "KG", value: "KG" },
              { id: 2, name: "Pounds", value: "Pounds" },
            ]}
            className="text-[14px] [&_.label]:font-[400] block"
          />
        </div>
      </div>

      {/* Standard */}
      <div className="mb-6">
        <SelectControl
          label="Standard"
          value={standard}
          onChange={(e) => setStandard(e.target.value)}
          options={[
            { id: 1, name: "IPA", value: "IPA" },
            { id: 2, name: "IAP", value: "IAP" },
          ]}
          className="text-[14px] [&_.label]:font-[400] block"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end">
        <DialogClose ref={closeBtnRef} className="px-4 py-2 rounded-[8px] border-2">
          Cancel
        </DialogClose>
        <Button variant="wz" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Measurement"}
        </Button>
      </div>
    </form>
  );
}

function ClientSelector({ clientId, setClientId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { isLoading, error, data } = useSWR(
    "app/getAppClients",
    () => getAppClients({ page: 1, limit: 1000 })
  );

  if (isLoading) return <ContentLoader />;
  if (error || data?.status_code !== 200)
    return <ContentError title={error || data?.message} />;

  const clients = data.data || [];
  const filteredClients = clients.filter((client) =>
    client.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClient = clients.find((c) => c._id === clientId);

  return (
    <div className="mb-4">
      <label className="label font-[600] text-[14px] block mb-2">Select Client</label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !clientId && "text-muted-foreground"
            )}
          >
            {selectedClient ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedClient.profilePhoto} />
                  <AvatarFallback className="text-xs">
                    {nameInitials(selectedClient.name)}
                  </AvatarFallback>
                </Avatar>
                <span>{selectedClient.name}</span>
              </div>
            ) : (
              "Select a client"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)]"
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No clients found
              </div>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client._id}
                  type="button"
                  onClick={() => {
                    setClientId(client._id);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 hover:bg-gray-100 transition-colors",
                    clientId === client._id && "bg-blue-50"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={client.profilePhoto} />
                    <AvatarFallback>{nameInitials(client.name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{client.name}</span>
                  {clientId === client._id && (
                    <CheckCircle2 className="h-4 w-4 text-[var(--accent-1)] ml-auto" />
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function MeasurementResults({ benchmarkData, onNewMeasurement, onClose }) {
  const heightScore = benchmarkData.heightScore;
  const weightScore = benchmarkData.weightScore;
  const heightGap = benchmarkData.heightGapCm;
  const weightGap = benchmarkData.weightGapKg;
  const p50Height = benchmarkData.p50HeightCm;
  const p50Weight = benchmarkData.p50WeightKg;

  return (
    <div className="px-6 py-4">
      <div className="space-y-4">
        {/* Scores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Height Score</div>
            <div className="flex items-center gap-2">
              <Badge
                variant={heightScore === 1 ? "default" : "destructive"}
                className={heightScore === 1 ? "bg-green-500" : ""}
              >
                {heightScore === 1 ? "Healthy" : "Below Standard"}
              </Badge>
              <span className="text-2xl font-bold">{heightScore}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Gap: {heightGap > 0 ? "+" : ""}
              {heightGap.toFixed(2)} cm
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Weight Score</div>
            <div className="flex items-center gap-2">
              <Badge
                variant={weightScore === 1 ? "default" : "destructive"}
                className={weightScore === 1 ? "bg-green-500" : ""}
              >
                {weightScore === 1 ? "Healthy" : "Below Standard"}
              </Badge>
              <span className="text-2xl font-bold">{weightScore}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Gap: {weightGap > 0 ? "+" : ""}
              {weightGap.toFixed(2)} kg
            </div>
          </div>
        </div>

        {/* P50 Reference Values */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-semibold mb-2">50th Percentile Reference Values</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Height: </span>
              <span className="font-semibold">{p50Height.toFixed(2)} cm</span>
            </div>
            <div>
              <span className="text-muted-foreground">Weight: </span>
              <span className="font-semibold">{p50Weight.toFixed(2)} kg</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Age:</strong> {benchmarkData.ageMonths} months
          </p>
          <p>
            <strong>Standard:</strong> {benchmarkData.standard}
          </p>
          <p>
            <strong>Gender:</strong> {benchmarkData.gender}
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end mt-6">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button variant="wz" onClick={onNewMeasurement}>
          Add Another Measurement
        </Button>
      </div>
    </div>
  );
}

