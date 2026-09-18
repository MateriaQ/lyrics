export function ratelimitGenerator(req: Request, server: Bun.Server<unknown> | null): string {
  const socketAddress = server?.requestIP(req)?.address ?? "";
  const cfHeaderIp = req.headers.get("cf-connecting-ip");

  return cfHeaderIp ?? socketAddress ?? "unknown";
}
