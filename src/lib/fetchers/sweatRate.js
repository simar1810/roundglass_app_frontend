import { fetchData, sendData } from "../api";
import { buildUrlWithQueryParams } from "../formatter";

export function getSweatRateEntries(params = {}) {
  const query = {};
  if (params.clientId) query.clientId = params.clientId;
  if (params.from) query.from = params.from;
  if (params.to) query.to = params.to;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  const endpoint = buildUrlWithQueryParams("app/sweat-rate/entries", query);
  return fetchData(endpoint);
}

export function getSweatRateSummary(params = {}) {
  const query = {};
  if (params.clientId) query.clientId = params.clientId;
  if (params.from) query.from = params.from;
  if (params.to) query.to = params.to;
  if (params.includeTrend !== undefined) query.includeTrend = params.includeTrend;

  const endpoint = buildUrlWithQueryParams("app/sweat-rate/summary", query);
  return fetchData(endpoint);
}

export function createSweatRateEntry(payload) {
  return sendData("app/sweat-rate/entries", payload, "POST");
}

export function updateSweatRateEntry(entryId, payload) {
  return sendData(`app/sweat-rate/entries/${entryId}`, payload, "PUT");
}

export function deleteSweatRateEntry(entryId) {
  return sendData(`app/sweat-rate/entries/${entryId}`, {}, "DELETE");
}

