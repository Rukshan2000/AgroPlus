import { query } from "../lib/db"

export async function deleteSessionsForUser(userId) {
  await query('DELETE FROM sessions WHERE user_id = $1', [userId])
}
