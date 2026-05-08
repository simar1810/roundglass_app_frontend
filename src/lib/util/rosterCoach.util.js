/**
 * Roster coach shape from the API (additive on client payloads).
 * `coachId` is the public id (post AppCoach.decryptForResponse), not Mongo _id.
 *
 * Backend ownership (documented for frontend readers; enforced server-side):
 * - If `sponseredBy` is set → that AppCoach is the canonical roster owner.
 * - Else resolve from `client.coach` (public id), including encrypted coachId handling
 *   (same scan as team invites).
 *
 * @typedef {{ coachId?: string|null, name?: string|null, email?: string|null }} RosterCoach
 */

/**
 * @param {unknown} client
 * @returns {RosterCoach|null}
 */
export function parseRosterCoach(client) {
  const rc = client?.rosterCoach;
  if (!rc || typeof rc !== "object" || Array.isArray(rc)) return null;
  const coachId = rc.coachId != null ? String(rc.coachId).trim() : "";
  const name = rc.name != null ? String(rc.name).trim() : "";
  const email = rc.email != null ? String(rc.email).trim() : "";
  if (!coachId && !name && !email) return null;
  return {
    coachId: coachId || null,
    name: name || null,
    email: email || null,
  };
}

/**
 * Single-line label for lists and badges.
 * @param {RosterCoach|null|undefined} shape
 * @returns {string|null}
 */
export function rosterCoachLabelFromShape(shape) {
  if (!shape) return null;
  if (shape.name) return shape.name;
  if (shape.email) return shape.email;
  if (shape.coachId) return `Coach ID ${shape.coachId}`;
  return null;
}
