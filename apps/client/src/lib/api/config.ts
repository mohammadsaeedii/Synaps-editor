/** Base URL for the Nest API (proxied via Next rewrites in dev). */
export const API_BASE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")) ||
  "/api";
