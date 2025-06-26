"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FormControl from "../FormControl";
import useSWR, { mutate } from "swr";
import { getClientsForWorkout } from "@/lib/fetchers/app";
import ContentLoader from "../common/ContentLoader";
import ContentError from "../common/ContentError";
import { toast } from "sonner";
import { use, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { nameInitials } from "@/lib/formatter";
import { Button } from "../ui/button";
import { sendData } from "@/lib/api";

export default function AssignWorkoutModal({ workoutId }) {
  return (
    <Dialog>
      <DialogTrigger className="bg-[var(--accent-1)] text-white text-[12px] font-bold px-4 py-2 rounded-[8px] overflow-auto">
        Assign
      </DialogTrigger>
      <DialogContent className="!max-w-[650px] h-[70vh] border-0 p-0 overflow-auto block">
        <DialogHeader className="py-4 px-6 border-b">
          <DialogTitle className="text-lg font-semibold pb-1 w-fit">
            Assign Workout
          </DialogTitle>
        </DialogHeader>
        <AssignWorkoutContainer workoutId={workoutId} />
      </DialogContent>
    </Dialog>
  );
}

function AssignWorkoutContainer({ workoutId }) {
  const { isLoading, error, data } = useSWR(`getClientsForWorkouts/${workoutId}`, () => getClientsForWorkout(workoutId));
  const [selectedClient, setSelectedClient] = useState();
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />

  async function assignWorkout() {
    try {
      const data = {
        workoutCollectionId: workoutId,
        clientId: selectedClient
      }
      const response = await sendData("app/workout/coach/assignWorkout", data, "PUT")
      if (response.status_code !== 200) throw new Error(response.error || response.message);
      toast.success(response.message);
      mutate(`getClientsForWorkouts/${workoutId}`)
    } catch (error) {
      toast.error(error.message);
    }
  }

  const assignedToOtherPlans = data.data.assignedToOtherPlans.filter(client => client.name.includes(searchQuery));
  const unassignedClients = data.data.unassignedClients.filter(client => client.name.includes(searchQuery));
  console.log(data)
  return <div className="p-4 mb-auto text-sm space-y-6">
    <div>
      <FormControl
        placeholder="Search Client here"
        className="w-full bg-gray-50 rounded-lg"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <p className="mt-4 font-medium">{unassignedClients.length + assignedToOtherPlans.length} Clients Available</p>
    </div>
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h3 className="font-medium mb-4">Assigned To Other Workouts</h3>
        <div className="space-y-4">
          {assignedToOtherPlans.map((client, index) => <SelectClient
            key={index}
            client={client}
            selectedClient={selectedClient}
            setSelectedClient={setSelectedClient}
          />)}
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-4">Not Assigned</h3>
        <div className="space-y-4">
          {unassignedClients.map((client, index) => <SelectClient
            key={index}
            client={client}
            selectedClient={selectedClient}
            setSelectedClient={setSelectedClient}
          />)}
        </div>
      </div>
    </div>
    {selectedClient && <div className="bg-white sticky bottom-0 text-center py-2">
      <Button onClick={assignWorkout} variant="wz">
        Assign Workout
      </Button>
    </div>}
  </div>
}

function SelectedClient({ client }) {
  return <div className="flex items-center gap-3">
    <Avatar>
      <AvatarImage src={client.profilePhoto || "/"} />
      <AvatarFallback>{nameInitials(client.name)}</AvatarFallback>
    </Avatar>
    <span className="flex-1">{client.name}</span>
    <FormControl
      type="checkbox"
      checked
      disabled
      className="w-5 h-5"
    />
  </div>
}

function SelectClient({
  client,
  selectedClient,
  setSelectedClient
}) {
  return <div className="flex items-center gap-3">
    <Avatar>
      <AvatarImage src={client.profilePhoto || "/"} />
      <AvatarFallback>{nameInitials(client.name)}</AvatarFallback>
    </Avatar>
    <span className="flex-1">{client.name}</span>
    <FormControl
      type="checkbox"
      name="assign"
      value="symond"
      checked={selectedClient === client._id}
      onChange={() => setSelectedClient(prev => prev === client._id ? undefined : client._id)}
      className="w-5 h-5"
    />
  </div>
}
