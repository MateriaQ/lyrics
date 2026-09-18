export const parseBearer = (bearer?: string): string | undefined => {
  if (!bearer) return undefined;
  return bearer.startsWith("Bearer ") ? bearer.slice(7) : bearer;
};
