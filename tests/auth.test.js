import { describe, it, expect } from "vitest"
import { hashPassword, comparePassword } from "../lib/hash.js"

describe("password hashing", () => {
  it("hashes and verifies password", async () => {
    const pwd = "StrongPass!123"
    const hash = await hashPassword(pwd)
    expect(hash).toBeTypeOf("string")
    const ok = await comparePassword(pwd, hash)
    expect(ok).toBe(true)
  })
})
