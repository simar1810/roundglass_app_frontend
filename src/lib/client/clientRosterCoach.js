import {
  parseRosterCoach,
  rosterCoachLabelFromShape,
} from "@/lib/util/rosterCoach.util";

/** Public / numeric coach id (legacy payloads; avoid showing 24-char Mongo ids as "Coach ID"). */
function formatPublicCoachId(val) {
  const s = String(val ?? "").trim();
  if (!s) return null;
  if (/^\d{3,12}$/.test(s)) return `Coach ID ${s}`;
  return null;
}

function labelFromCoachLikeObject(obj) {
  if (!obj || typeof obj !== "object") return null;
  const name =
    obj.name ||
    obj.fullName ||
    [obj.firstName, obj.lastName].filter(Boolean).join(" ").trim();
  if (name) return String(name).trim();
  const idLabel = formatPublicCoachId(obj.coachId);
  if (idLabel) return idLabel;
  return null;
}

/**
 * Human-facing roster coach for a client/athlete.
 * Prefers API `rosterCoach: { coachId, name, email }`; then legacy fields.
 *
 * @param {Record<string, unknown>|null|undefined} client
 * @param {number} [depth]
 * @returns {string|null}
 */
export function getClientRosterCoachLabel(client, depth = 0) {
  if (!client || typeof client !== "object") return null;

  const fromApi = parseRosterCoach(client);
  if (fromApi) {
    const line = rosterCoachLabelFromShape(fromApi);
    if (line) return line;
  }

  const maxDepth = 2;

  const raw = client.coach;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (raw && typeof raw === "object") {
    const fromObj = labelFromCoachLikeObject(raw);
    if (fromObj) return fromObj;
  }

  if (client.coachName && String(client.coachName).trim()) {
    return String(client.coachName).trim();
  }

  const primary = client.primaryCoach;
  if (typeof primary === "string" && primary.trim()) return primary.trim();
  if (primary && typeof primary === "object") {
    const fromPrimary = labelFromCoachLikeObject(primary);
    if (fromPrimary) return fromPrimary;
  }

  const createdBy = client.createdBy;
  if (createdBy && typeof createdBy === "object") {
    const fromCb = labelFromCoachLikeObject(createdBy);
    if (fromCb) return fromCb;
  }

  for (const key of [
    "assignedCoach",
    "registeredCoach",
    "owningCoach",
    "coachDetails",
    "coachRef",
    "coachUser",
  ]) {
    const v = client[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (v && typeof v === "object") {
      const lbl = labelFromCoachLikeObject(v);
      if (lbl) return lbl;
    }
  }

  if (client.rosterCoachId != null && String(client.rosterCoachId).trim()) {
    return `Coach ID ${String(client.rosterCoachId).trim()}`;
  }

  const topCoachId =
    formatPublicCoachId(client.coachId) || formatPublicCoachId(client.primaryCoachId);
  if (topCoachId) return topCoachId;

  if (depth < maxDepth) {
    for (const key of ["user", "client", "profile", "athlete", "member"]) {
      const nested = client[key];
      if (nested && typeof nested === "object" && !Array.isArray(nested)) {
        const inner = getClientRosterCoachLabel(nested, depth + 1);
        if (inner) return inner;
      }
    }
  }

  return null;
}

/**
 * Prefer label from the main record, then from a secondary payload (legacy merge).
 */
export function resolveClientRosterCoachLabel(base, extra) {
  return getClientRosterCoachLabel(base) || getClientRosterCoachLabel(extra);
}

/**
 * Public coach id for display (not Mongo _id). Uses `rosterCoach.coachId` when present.
 * @param {Record<string, unknown>|null|undefined} client
 * @returns {string|null}
 */
export function getClientRosterCoachPublicId(client) {
  if (!client || typeof client !== "object") return null;

  const fromApi = parseRosterCoach(client);
  if (fromApi?.coachId) return fromApi.coachId;

  const raw = client.coach;
  if (raw && typeof raw === "object" && raw.coachId != null && String(raw.coachId).trim()) {
    const s = String(raw.coachId).trim();
    if (/^\d{3,12}$/.test(s)) return s;
  }
  if (client.rosterCoachId != null && String(client.rosterCoachId).trim()) {
    return String(client.rosterCoachId).trim();
  }
  const top = client.coachId ?? client.primaryCoachId;
  if (top != null && String(top).trim() && /^\d{3,12}$/.test(String(top).trim())) {
    return String(top).trim();
  }
  return null;
}

export { parseRosterCoach, rosterCoachLabelFromShape } from "@/lib/util/rosterCoach.util";
