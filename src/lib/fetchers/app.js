import { fetchData } from "../api";

export function getCoachProfile(_id) {
  return fetchData(`app/coachProfile?id=${_id}`)
}