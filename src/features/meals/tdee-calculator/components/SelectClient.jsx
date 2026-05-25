"use client";

import useSWR from "swr";

import { fetchData } from "@/lib/api";
import ErrorComponent from "@/components/common/Error";
import Loader from "@/components/common/Loader";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/common/selects/SearchableSelect";

export default function SelectClient({
  selectedClient,
  onSelectClient,
}) {
  const { isLoading, error, data } = useSWR(
    "app/coach-client-list",
    () => fetchData("app/coach-client-list")
  );

  if (isLoading) return <Loader />;

  if (error || data?.status_code !== 200) {
    return (
      <ErrorComponent
        message={error?.message || data?.message || "Something went wrong"}
      />
    );
  }

  const clients = data?.data || [];

  const options = clients.map((client) => {
    const idPart =
      client.clientId != null && client.clientId !== ""
        ? String(client.clientId)
        : null;
    const mobile =
      client.mobileNumber != null && client.mobileNumber !== ""
        ? String(client.mobileNumber)
        : null;
    const label = [client.name, idPart && `ID ${idPart}`, mobile]
      .filter(Boolean)
      .join(" · ");
    const searchParts = [
      client.name,
      client._id,
      client.clientId,
      client.mobileNumber,
    ]
      .filter((x) => x != null && x !== "")
      .map(String);
    const searchBlob = searchParts.join(" ").toLowerCase();
    const digitsOnly = searchParts.join("").replace(/\D/g, "");
    return {
      value: client._id,
      label,
      searchBlob,
      digitsOnly,
    };
  });

  const clientSearchFn = (option, query) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    if (option.searchBlob.includes(q)) return true;
    const qDigits = q.replace(/\D/g, "");
    if (qDigits.length >= 2 && option.digitsOnly.includes(qDigits)) return true;
    return false;
  };

  return (
    <div className="w-full space-y-2">
      <Label>Select Client</Label>

      <SearchableSelect
        options={options}
        value={selectedClient}
        onValueChange={onSelectClient}
        selectLabel="Select Client"
        searchPlaceholder="Search name, client ID, or mobile…"
        searchFn={clientSearchFn}
      />
    </div>
  );
}