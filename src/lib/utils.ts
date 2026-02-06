import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "***@***.**";

  const [local, domain] = email.split("@");

  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }

  const masked =
    local[0] + "*".repeat(Math.max(local.length - 4, 3)) + local.slice(-3);
  return `${masked}@${domain}`;
}

// Validation du mot de passe
export function validatePassword(password: string) {
  const checks = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const isValid = Object.values(checks).every((check) => check);

  return { checks, isValid };
}
