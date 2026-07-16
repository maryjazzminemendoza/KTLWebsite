type CustomerError = {
  code?: string;
  message?: string;
  status?: number;
} | null | undefined;

/**
 * Converts service and database failures into messages that are useful to a
 * customer without exposing table names, policies, constraints, or setup
 * details. Keep the raw error out of rendered UI.
 */
export function getCustomerErrorMessage(
  error: CustomerError,
  fallback: string,
) {
  const code = error?.code?.toLowerCase() ?? "";
  const message = error?.message?.toLowerCase() ?? "";

  if (
    code.includes("rate_limit") ||
    message.includes("rate limit") ||
    error?.status === 429
  ) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials")
  ) {
    return "The email or password is incorrect. Please try again.";
  }

  if (
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("already exists")
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (code === "weak_password" || message.includes("weak password")) {
    return "Please choose a stronger password and try again.";
  }

  if (
    code === "email_address_invalid" ||
    message.includes("invalid email")
  ) {
    return "Please enter a valid email address.";
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("connection")
  ) {
    return "We could not connect to the service. Check your connection and try again.";
  }

  return fallback;
}
