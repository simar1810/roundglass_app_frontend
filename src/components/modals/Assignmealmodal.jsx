import FormControl from "@/components/FormControl";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sendData } from "@/lib/api";
import { getClientForMeals, getClientsForCustomMeals } from "@/lib/fetchers/app";
import { isBefore, parse } from "date-fns";
import { useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import ContentError from "../common/ContentError";
import ContentLoader from "../common/ContentLoader";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import Image from "next/image";

export default function AssignMealModal({
  plan,
  type,
  planId,
  mode = "coach",
  adminConfig,
  triggerLabel = "Assign Meal",
}) {
  const Component = selectComponent(type, mode);
  return (
    <Dialog>
      <DialogTrigger className="p-0">
        <Badge variant="wz_fill" className={"px-4 py-2 font-semibold"}>{triggerLabel}</Badge>
      </DialogTrigger>
      <DialogContent
        className="w-[95vw] max-w-[750px] block gap-0 space-y-0 p-0 max-h-[70vh] h-full overflow-y-auto"
        aria-describedby="assign-meal-description"
      >
        <DialogHeader className="p-4 border-b-1">
          <DialogTitle>Assign Meal</DialogTitle>
        </DialogHeader>
        <p id="assign-meal-description" className="sr-only">
          Select a client from the list to assign this meal plan.
        </p>
        <Component plan={plan} planId={planId} adminConfig={adminConfig} />
      </DialogContent>
    </Dialog>
  );
}

function checkIfDatesInPast(plans, setter) {
  const dates = Object.keys(plans)
    .map(date => parse(date, "dd-MM-yyyy", new Date()))
    .sort((dateA, dateB) => isBefore(dateA, dateB) ? 1 : -1)
  const lastDate = dates?.at(0)
  if (lastDate < new Date()) {
    setter(true)
    return false;
  }
  return true;
}

function normalizeClientIds(clientsInput) {
  if (Array.isArray(clientsInput)) {
    return clientsInput.filter(Boolean);
  }
  return clientsInput ? [clientsInput] : [];
}

function matchesClientSearch(client, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  const nestedClientId = client?.clientId && typeof client.clientId === "object"
    ? client.clientId
    : {};
  const fields = [
    client?.name,
    client?.clientId,
    nestedClientId?.clientId,
    client?.rollno,
    client?.rollNo,
    nestedClientId?.rollno,
    nestedClientId?.rollNo,
    client?.phone,
    client?.phoneNumber,
    client?.mobileNumber,
    client?.mobile,
  ];
  return fields.some((value) =>
    String(value ?? "").toLowerCase().includes(q)
  );
}

function AssignCustomMealPlanContainer({ plan, planId }) {
  const { isLoading, error, data, mutate } = useSWR(`getClientForCustomMeals/${planId}`, () => getClientsForCustomMeals(planId));
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedAssignedClients, setSelectedAssignedClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const closeRef = useRef();

  if (isLoading) return <ContentLoader />
  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  async function assignMealPlan(needToCheck = false) {
    try {
      if (needToCheck) {
        const isAfter = checkIfDatesInPast(plan.plans, setShowWarning);
        if (!isAfter) return;
      }
      const clients = normalizeClientIds(selectedClients);
      if (clients.length === 0) {
        toast.error("Please select at least one client.");
        return;
      }

      setIsAssigning(true);
      const response = await sendData("app/meal-plan/custom/assign", { id: planId, clients });
      if (response.status_code !== 200) throw new Error(response.error || response.message);
      toast.success(response.message);
      setSelectedClients([]);
      closeRef.current.click();
      mutate();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsAssigning(false);
    }
  }

  async function unassignMealPlanClients(clientIdsInput) {
    try {
      const clients = normalizeClientIds(clientIdsInput);
      if (clients.length === 0) {
        toast.error("Please select at least one client.");
        return;
      }
      setIsUnassigning(true);
      const response = await sendData("app/meal-plan/custom/unassign", { id: planId, clients }, "POST");
      if (response.status_code !== 200) throw new Error(response.message || "Please try again later!");
      toast.success(response.message);
      setSelectedAssignedClients([]);
      mutate();
    } catch (error) {
      toast.error(error.message || "Please try again later!");
    } finally {
      setIsUnassigning(false);
    }
  }

  const assignedClients = data.data.assignedClients.filter(client => matchesClientSearch(client, searchQuery));
  const unassignedClients = data.data.notAssignedClients.filter(client => matchesClientSearch(client, searchQuery));
  const unassignedClientIds = unassignedClients
    .map((client) => client?._id || client?.clientId)
    .filter(Boolean);
  const allUnassignedSelected = unassignedClientIds.length > 0
    && unassignedClientIds.every((id) => selectedClients.includes(id));

  return <div className="space-y-4 text-sm mb-auto">
    {/* <button onClick={mutate}>mutate</button> */}
    <DialogClose ref={closeRef} hidden />
    {showWarning && <div className="z-100 absolute bottom-0 left-[10px] p-4 text-[var(--accent-2)] bg-[var(--comp-1)] border-1 w-[calc(100%-20px)] flex items-end gap-4">
      <p className="leading-[1.2] font-bold italic text-sm">This meal plan is in the past and will not be visible to the client.
        Use the “Start from Today” option in the meal plan to make it visible, or press OK to continue.</p>
      <Button onClick={() => assignMealPlan(false)} variant="wz">OK</Button>
    </div>}
    <div className="px-4 pt-2">
      <FormControl
        placeholder="Search client"
        className="w-full"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <p className="mt-3 font-medium text-xs text-muted-foreground">
        {unassignedClients.length} clients available
      </p>
    </div>
    <div className="px-4 grid grid-cols-2 gap-6">
      <div>
        <h3 className="font-medium mb-3">Already Assigned</h3>
        <div className="space-y-3">
          {assignedClients.map((client, index) => <SelectedClient
            key={index}
            client={client}
            selectedClientIds={selectedAssignedClients}
            setSelectedClientIds={setSelectedAssignedClients}
            clearOtherSelection={() => setSelectedClients([])}
            statusText="Already assigned"
          />)}
        </div>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">Available</h3>
          <button
            type="button"
            className="text-xs font-semibold text-[var(--accent-1)]"
            onClick={() => {
              setSelectedAssignedClients([]);
              setSelectedClients(allUnassignedSelected ? [] : unassignedClientIds);
            }}
          >
            {allUnassignedSelected ? "Clear" : "Select all"}
          </button>
        </div>
        <div className="space-y-3">
          {unassignedClients.map((client, index) => <SelectClient
            key={index}
            client={client}
            selectedClients={selectedClients}
            setSelectedClients={setSelectedClients}
            clearOtherSelection={() => setSelectedAssignedClients([])}
          />)}
        </div>
      </div>
    </div>
    {!showWarning && <div className="sticky bottom-0 bg-white border-t py-3 mt-auto text-center flex items-center justify-center gap-3">
      <Button
        onClick={() => unassignMealPlanClients(selectedAssignedClients)}
        variant="wz_outline"
        disabled={selectedAssignedClients.length === 0 || isUnassigning || isAssigning}
      >
        {isUnassigning ? "Unassigning..." : "Unassign Selected"}
      </Button>
      <Button
        onClick={() => assignMealPlan(true)}
        variant="wz"
        disabled={selectedClients.length === 0 || isAssigning || isUnassigning}
      >
        {isAssigning ? "Assigning..." : "Assign Meal"}
      </Button>
    </div>}
  </div>
}

function AssignMealPlanContainer({ planId }) {
  const { isLoading, error, data, mutate } = useSWR(`/getClientForMeals/${planId}`, () => getClientForMeals(planId));
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedAssignedClients, setSelectedAssignedClients] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  if (isLoading) return <ContentLoader />
  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />
  async function assignMealPlan() {
    try {
      const clients = normalizeClientIds(selectedClients);
      if (clients.length === 0) {
        toast.error("Please select at least one client.");
        return;
      }
      setIsAssigning(true);
      const response = await sendData("app/assign-plan", {
        id: planId,
        clients,
        planId,
        clientId: clients[0],
      });
      if (response.status_code !== 200) throw new Error(response.error || response.message);
      toast.success(response.message);
      setSelectedClients([]);
      mutate();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsAssigning(false);
    }
  }
  async function unassignMealPlan() {
    try {
      const clients = normalizeClientIds(selectedAssignedClients);
      if (clients.length === 0) {
        toast.error("Please select at least one client.");
        return;
      }
      setIsUnassigning(true);
      const response = await sendData("app/unassign-plan", {
        id: planId,
        clients,
        planId,
        clientId: clients[0],
      });
      if (response.status_code !== 200) throw new Error(response.error || response.message);
      toast.success(response.message);
      setSelectedAssignedClients([]);
      mutate();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUnassigning(false);
    }
  }
  const assignedClients = data.data.assignedClients.filter(client => matchesClientSearch(client, searchQuery));
  const unassignedClients = [
    ...data.data.unassignedClients.filter(client => matchesClientSearch(client, searchQuery)),
    ...data.data.assignedToOtherPlans.filter(client => matchesClientSearch(client, searchQuery)),
  ];
  const unassignedClientIds = unassignedClients
    .map((client) => client?._id || client?.clientId)
    .filter(Boolean);
  const allUnassignedSelected = unassignedClientIds.length > 0
    && unassignedClientIds.every((id) => selectedClients.includes(id));

  return <div className="space-y-4 text-sm mb-auto">
    <div className="px-4 pt-2">
      <FormControl
        placeholder="Search client"
        className="w-full"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <p className="mt-3 font-medium text-xs text-muted-foreground">
        {unassignedClients.length} clients available
      </p>
    </div>
    <div className="px-4 grid grid-cols-2 gap-6">
      <div>
        <h3 className="font-medium mb-3">Already Assigned</h3>
        <div className="space-y-3">
          {assignedClients.map((client, index) => <SelectedClient
            key={index}
            client={client}
            selectedClientIds={selectedAssignedClients}
            setSelectedClientIds={setSelectedAssignedClients}
            clearOtherSelection={() => setSelectedClients([])}
            statusText="Already assigned"
          />)}
        </div>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">Available</h3>
          <button
            type="button"
            className="text-xs font-semibold text-[var(--accent-1)]"
            onClick={() => {
              setSelectedAssignedClients([]);
              setSelectedClients(allUnassignedSelected ? [] : unassignedClientIds);
            }}
          >
            {allUnassignedSelected ? "Clear" : "Select all"}
          </button>
        </div>
        <div className="space-y-3">
          {unassignedClients.map((client, index) => <SelectClient
            key={index}
            client={client}
            selectedClients={selectedClients}
            setSelectedClients={setSelectedClients}
            clearOtherSelection={() => setSelectedAssignedClients([])}
          />)}
        </div>
      </div>
    </div>
    <div className="sticky bottom-0 bg-white border-t py-3 mt-auto text-center flex items-center justify-center gap-3">
      <Button
        onClick={unassignMealPlan}
        variant="wz_outline"
        disabled={selectedAssignedClients.length === 0 || isAssigning || isUnassigning}
      >
        {isUnassigning ? "Unassigning..." : "Unassign Selected"}
      </Button>
      <Button
        onClick={assignMealPlan}
        variant="wz"
        disabled={selectedClients.length === 0 || isAssigning || isUnassigning}
      >
        {isAssigning ? "Assigning..." : "Assign Meal"}
      </Button>
    </div>
  </div>
}

function AssignAdminMealPlanContainer({ adminConfig }) {
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedAssignedClients, setSelectedAssignedClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const assignedClients = Array.isArray(adminConfig?.assignedClients)
    ? adminConfig.assignedClients
    : [];
  const unassignedClients = Array.isArray(adminConfig?.unassignedClients)
    ? adminConfig.unassignedClients
    : [];
  const loading = Boolean(adminConfig?.loading);

  if (loading) return <ContentLoader />;

  const filteredAssigned = assignedClients.filter(client => matchesClientSearch(client, searchQuery));
  const filteredUnassigned = unassignedClients.filter(client => matchesClientSearch(client, searchQuery));
  const filteredUnassignedIds = filteredUnassigned
    .map((client) => client?._id || client?.clientId)
    .filter(Boolean);
  const allUnassignedSelected = filteredUnassignedIds.length > 0
    && filteredUnassignedIds.every((id) => selectedClients.includes(id));

  return <div className="space-y-4 text-sm mb-auto">
    <div className="px-4 pt-2">
      <FormControl
        placeholder="Search client"
        className="w-full"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <p className="mt-3 font-medium text-xs text-muted-foreground">
        {filteredUnassigned.length} clients available
      </p>
    </div>
    <div className="px-4 grid grid-cols-2 gap-6">
      <div>
        <h3 className="font-medium mb-3">Already Assigned</h3>
        <div className="space-y-3">
          {filteredAssigned.map((client, index) => <SelectedClient
            key={client?._id || client?.clientId || index}
            client={client}
            selectedClientIds={selectedAssignedClients}
            setSelectedClientIds={setSelectedAssignedClients}
            clearOtherSelection={() => setSelectedClients([])}
            statusText="Already assigned"
          />)}
        </div>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">Available</h3>
          <button
            type="button"
            className="text-xs font-semibold text-[var(--accent-1)]"
            onClick={() => {
              setSelectedAssignedClients([]);
              setSelectedClients(allUnassignedSelected ? [] : filteredUnassignedIds);
            }}
          >
            {allUnassignedSelected ? "Clear" : "Select all"}
          </button>
        </div>
        <div className="space-y-3">
          {filteredUnassigned.map((client, index) => <SelectClient
            key={client?._id || client?.clientId || index}
            client={client}
            selectedClients={selectedClients}
            setSelectedClients={setSelectedClients}
            clearOtherSelection={() => setSelectedAssignedClients([])}
          />)}
        </div>
      </div>
    </div>
    <div className="sticky bottom-0 bg-white border-t py-3 mt-auto text-center flex items-center justify-center gap-3">
      <Button
        onClick={() => adminConfig?.onUnassign?.(selectedAssignedClients)}
        variant="wz_outline"
        disabled={selectedAssignedClients.length === 0}
      >
        Unassign Selected
      </Button>
      <Button
        onClick={() => adminConfig?.onAssign?.(selectedClients)}
        variant="wz"
        disabled={selectedClients.length === 0}
      >
        Assign Meal
      </Button>
    </div>
  </div>
}

function SelectedClient({
  client,
  selectedClientIds,
  setSelectedClientIds,
  clearOtherSelection,
  statusText = "",
}) {
  const clientIdentifier = client?._id || client?.clientId;
  const isSelected = selectedClientIds?.includes(clientIdentifier);
  function toggleSelectedClient() {
    if (!setSelectedClientIds || !clientIdentifier) return;
    clearOtherSelection?.();
    setSelectedClientIds((prev = []) =>
      prev.includes(clientIdentifier)
        ? prev.filter((id) => id !== clientIdentifier)
        : [...prev, clientIdentifier]
    );
  }
  return <div
    onClick={toggleSelectedClient}
    className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:border-black ${isSelected ? "border-black" : "border-gray-200"}`}
  >
    <Image
      src={client.profilePhoto || "/avatar-placeholder.png"}
      alt={client.name || "Client"}
      onError={e => e.target.src = "/not-found.png"}
      height={100}
      width={100}
      className="h-9 w-9 rounded-md object-cover border"
    />
    <div className="flex-1 min-w-0">
      <p className="font-medium leading-tight truncate">{client.name}</p>
      {statusText && (
        <p className="text-[11px] text-muted-foreground truncate">{statusText}</p>
      )}
    </div>
  </div>
}

function SelectClient({
  client,
  selectedClients,
  setSelectedClients,
  clearOtherSelection,
}) {
  const clientIdentifier = client?._id || client?.clientId;
  const isSelected = selectedClients?.includes(clientIdentifier);
  return <div
    onClick={() => {
      clearOtherSelection?.();
      setSelectedClients((prev = []) =>
        prev.includes(clientIdentifier)
          ? prev.filter((id) => id !== clientIdentifier)
          : [...prev, clientIdentifier]
      );
    }}
    className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:border-black ${isSelected ? "border-black" : "border-gray-200"}`}
  >
    <Image
      src={client.profilePhoto || "/avatar-placeholder.png"}
      alt={client.name || "Client"}
      onError={e => e.target.src = "/not-found.png"}
      height={100}
      width={100}
      className="h-9 w-9 rounded-md object-cover border"
    />
    <div className="flex-1 min-w-0">
      <p className="font-medium leading-tight truncate">{client.name}</p>
    </div>
  </div>
}

function selectComponent(type, mode = "coach") {
  if (mode === "admin") {
    return AssignAdminMealPlanContainer;
  }
  switch (type) {
    case "normal":
      return AssignMealPlanContainer;
    case "custom":
      return AssignCustomMealPlanContainer;
  }
}