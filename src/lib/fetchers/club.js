import { fetchData } from "../api";

export function getMeetings(date, meetingType) {
  let query = "?"
  if (date) query += "date=" + date;
  if (meetingType) query += "&meetingType" + meetingType;
  return fetchData(`allMeeting${query}`);
}

export function getMeeting(id) {
  const meetingLink = `${process.env.NEXT_PUBLIC_CLIENT_ENDPOINT}/meet/${id}`
  return fetchData(`getMeetingDetails?meetingLink=${meetingLink}`);
}

export function getFreeTrialUsers() {
  return fetchData("free-trial-users");
}

export function getClubClientVolumePoints() {
  return fetchData("clubClientsWithVP");
}

export function getClubClientSubscriptions() {
  return fetchData("getAllClubSubscriptions")
}

export function getMeetingZoomEvents(_id) {
  return fetchData(`zoom/${_id}/event`);
}

export function getRequestVolumePoints() {
  return fetchData("getReqVpByClients");
}