// =====================================================================
// Per-request Cloudflare execution context.
//
// TanStack Start does not thread the Worker's `ctx` (with waitUntil) into
// individual route handlers. We capture it once in the Worker entry
// (src/server.ts) and read it back here so route handlers can schedule
// background work that outlives the HTTP response.
//
// Kept in its own module so both the Worker entry and route files can import
// it without creating a circular dependency.
// =====================================================================

export type ExecCtx = { waitUntil: (p: Promise<unknown>) => void };

let lastExecCtx: ExecCtx | undefined;

export function setRequestExecCtx(ctx: ExecCtx | undefined): void {
  lastExecCtx = ctx;
}

export function getRequestExecCtx(): ExecCtx | undefined {
  return lastExecCtx;
}
