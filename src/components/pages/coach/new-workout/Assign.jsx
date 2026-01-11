import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import { fetchData, sendData } from "@/lib/api";
import useSWR from "swr";
import { _throwError, buildUrlWithQueryParams } from "@/lib/formatter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import FormControl from "@/components/FormControl";
import { useState } from "react";
import Image from "next/image";
import Loader from "@/components/common/Loader";

export default function AssignWorkout({ workoutId }) {
  if (!workoutId) _throwError("workoutId is manddatory!")
  return <Dialog>
    <DialogTrigger>
      <Plus className="bg-green-600 text-white rounded-[4px]" size={22} />
    </DialogTrigger>
    <DialogContent className="!max-w-[750px] w-full block gap-0 space-y-0 p-0 max-h-[70vh] h-full overflow-y-auto">
      <DialogTitle className="p-4 border-b-1">Assign Workout</DialogTitle>
      <DialogContainer workoutId={workoutId} />
    </DialogContent>
  </Dialog>
}

function DialogContainer({ workoutId }) {
  const endpoint = buildUrlWithQueryParams(
    "app/newWorkout/get-client-for-workout",
    { workoutId }
  );

  const { isLoading, error, data, mutate } = useSWR(
    endpoint,
    () => fetchData(endpoint)
  );

  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false)

  if (isLoading) return <ContentLoader />;
  if (error || data.status_code !== 200)
    return <ContentError title={error || data.message} />;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchesQuery = (c) =>
    !normalizedQuery || c.name?.toLowerCase().includes(normalizedQuery);

  const assignedClients = data.data.assignedClients.filter(matchesQuery);

  const unassignedClients = [
    ...data.data.unassignedClients,
    ...data.data.assignedToOtherWorkouts,
  ].filter(matchesQuery);

  async function assignWorkout() {
    try {
      setLoading(true)
      const res = await sendData("app/newWorkout/assign-to-client", {
        workoutId,
        clientIds: [selectedClient],
      });
      if (res.status_code !== 200) throw new Error(res.message);
      toast.success(res.message);
      setSelectedClient(null);
      mutate();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 text-sm mb-auto">
      <div className="px-4 pt-4">
        <FormControl
          placeholder="Search client"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <p className="mt-3 font-medium text-xs text-muted-foreground">
          {unassignedClients.length} clients available
        </p>
      </div>

      <div className="px-4 grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-3">Already Assigned</h3>
          <div className="space-y-3">
            {assignedClients.map((client) => (
              <ClientCard
                key={client._id}
                client={client}
                disabled
              />
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-3">Available</h3>
          <div className="space-y-3">
            {unassignedClients.map((client) => (
              <ClientCard
                key={client._id}
                client={client}
                selected={selectedClient === client._id}
                onClick={() => setSelectedClient(client._id)}
              />
            ))}
          </div>
        </div>
      </div>
      {selectedClient && (
        <div className="sticky bottom-0 bg-white border-t py-3 mt-auto text-center">
          <Button disabled={loading} onClick={assignWorkout} variant="wz">
            {loading
              ? <Loader className="border-black !w-6" />
              : <>Assign Workout</>}
          </Button>
        </div>
      )}
    </div>
  );
}

function ClientCard({
  client,
  onClick,
  selected = false,
  disabled = false,
}) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        flex items-center gap-3 p-3 border rounded-md
        ${disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:border-black"}
        ${selected ? "border-black" : "border-gray-200"}
      `}
    >
      <Image
        src={client.profilePhoto || "/avatar-placeholder.png"}
        alt={client.name}
        onError={e => e.target.src = "/not-found.png"}
        height={400}
        width={400}
        className="h-9 w-9 rounded-md object-cover border"
      />
      <div className="flex-1">
        <p className="font-medium leading-tight">{client.name}</p>
        {disabled && (
          <p className="text-[11px] text-muted-foreground">
            Already assigned
          </p>
        )}
      </div>
    </div>
  );
}