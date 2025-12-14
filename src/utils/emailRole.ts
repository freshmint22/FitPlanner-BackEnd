// src/utils/emailRole.ts

export const ADMIN_TAG_REGEX = /\(\s*\.gym\s*\)/i;

export function parseEmailAndRole(inputEmail: string) {
  const raw = (inputEmail || "").trim().toLowerCase();

  const isAdmin = ADMIN_TAG_REGEX.test(raw);

  const normalizedEmail = raw.replace(/\(\s*\.gym\s*\)/gi, "");

  return {
    rawEmail: raw,
    email: normalizedEmail, // correo REAL (gmail, hotmail, etc.)
    rol: isAdmin ? "admin" : "user"
  };
}
