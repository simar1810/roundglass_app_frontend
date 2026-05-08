/**
 * Shared coach roster (team) API shapes — human-facing `coachId`, not Mongo `_id`.
 *
 * @typedef {Object} CoachTeamMember
 * @property {string} [name]
 * @property {string} [coachId]
 * @property {string} [email]
 * @property {string} [_id]
 */

/**
 * @typedef {Object} CoachTeam
 * @property {string} teamId
 * @property {string[]} [memberCoachIds]
 * @property {string[]} [memberCoachIdStrings]
 * @property {string[]} [clientIds]
 * @property {string} [primaryCoachId]
 * @property {CoachTeamMember[]} [members]
 */

/**
 * GET /app/coach-team
 * @typedef {Object} GetCoachTeamResponse
 * @property {number} status_code
 * @property {string} [message]
 * @property {{ team: CoachTeam | null }} [data]
 */

/**
 * POST /app/coach-team
 * @typedef {Object} CreateCoachTeamResponse
 * @property {number} status_code
 * @property {string} [message]
 * @property {{ teamId?: string }} [data]
 */

/**
 * POST /app/coach-team/member
 * @typedef {Object} AddCoachTeamMemberResponse
 * @property {number} status_code
 * @property {string} [message]
 * @property {{ teamId?: string, memberCount?: number }} [data]
 */

export {};
