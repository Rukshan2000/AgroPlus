import bcrypt from "bcryptjs"

const ROUNDS = 12

export async function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS)
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}
