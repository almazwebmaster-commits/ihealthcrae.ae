/** Better Auth error code / HTTP status → key in the "Auth.errors" namespace. */
export function authErrorKey(error: { code?: string; status?: number } | null | undefined) {
  if (!error) return "generic";
  if (error.status === 429) return "tooMany";
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "invalidCredentials";
    case "EMAIL_NOT_VERIFIED":
      return "emailNotVerified";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "userExists";
    case "PASSWORD_TOO_SHORT":
      return "passwordTooShort";
    case "INVALID_EMAIL":
      return "invalidEmail";
    case "INVALID_TOKEN":
      return "invalidToken";
    case "INVALID_PASSWORD":
      return "wrongPassword";
    case "BANNED_USER":
      return "blocked";
    default:
      return "generic";
  }
}

/** Only allow same-site relative paths as post-login destinations (prevents open redirects). */
export function safeNext(next: string | null | undefined, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
