import { updateTheme } from "../../../../controllers/settingsController"

export const dynamic = "force-dynamic"

export async function POST(request) {
  return updateTheme(request)
}
