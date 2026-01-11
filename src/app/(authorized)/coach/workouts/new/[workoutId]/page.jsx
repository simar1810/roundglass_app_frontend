"use client";
import useSWR from "swr";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import { fetchData } from "@/lib/api";
import { useParams } from "next/navigation";
import { copyText } from "@/lib/utils";

export default function Page() {
  const { workoutId } = useParams()
  const { isLoading, error, data } = useSWR(
    `app/newWorkout/workout/${workoutId}`,
    () => fetchData(`app/newWorkout/workout/${workoutId}`),
  );

  if (isLoading) return <ContentLoader />;
  if (error || data.status_code !== 200)
    return <ContentError title={error || data.message} />;

  console.log(data)
  return <div>
    <button onClick={() => copyText(JSON.stringify(data.data))}>copy</button>
  </div>
}