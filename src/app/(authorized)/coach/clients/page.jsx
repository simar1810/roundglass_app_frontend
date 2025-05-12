"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import ClientListItemStatus from "@/components/pages/coach/client/ClientListItemStatus";
import { getAppClients } from "@/lib/fetchers/app";
import { useState } from "react";
import useSWR from "swr";

const initialQuery = {
  page: 1,
  limit: 50
}

export default function Page() {
  const [query, setQuery] = useState(() => initialQuery);

  const { isLoading, error, data } = useSWR(
    `getAppClients?page=${query.page}&limit=${query.limit}`,
    () => getAppClients(query)
  );

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />

  const clients = data.data

  return <div className="mt-8">
    <div className="grid grid-cols-2 gap-4 divide-y-1">
      {clients.map((client, index) => <ClientListItemStatus
        key={index}
        src={client.profilePhoto}
        name={client.name}
        status={client.isVerified}
        id={client._id}
        client={client}
      />)}
    </div>
  </div>
}