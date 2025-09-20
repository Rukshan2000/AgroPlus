import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(255),
  role: z.enum(["admin", "manager", "user", "cashier"]).optional().default("user"),
  hourlyRate: z.string().optional(),
  position: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const updateRoleSchema = z.object({
  role: z.enum(["admin", "manager", "user", "cashier"]),
})

export const themeSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
})
