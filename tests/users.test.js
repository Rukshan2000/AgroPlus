import { describe, it, expect, vi } from "vitest"
import * as auth from "../lib/auth.js"
import { list } from "../controllers/userController.js"

// Simple example: controller returns 403 for non-privileged roles
describe("users controller RBAC", () => {
  it("returns 403 for non-privileged user", async () => {
    vi.spyOn(auth, "getSession").mockResolvedValue({
      token: "t",
      user: { id: 1, email: "u@e.com", role: "user" },
    })

    const res = await list()
    expect(res.status).toBe(403)
  })
})
