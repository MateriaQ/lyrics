export function getJwtExpiration(token: string): number {
  const payload = token.split(".")[1];
  if (!payload) return 10;

  const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));

  if (typeof decoded.exp !== "number") {
    throw new Error("JWT does not contain an exp claim");
  }

  return decoded.exp;
}
