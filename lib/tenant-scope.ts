// Pure argument rewriting behind scopedPrisma (lib/db-scoped.ts), kept free of
// server-only imports so it can be unit-tested.

export const TENANT_MODELS = new Set([
  "RegistryItem",
  "Contribution",
  "Media",
  "Wish",
  "Rsvp",
  "StoryPhoto",
  "StoryBeat",
  "StoryContent",
  "BankDetails",
]);

export class TenantScopeError extends Error {
  name = "TenantScopeError";
}

type Obj = Record<string, unknown>;

const WHERE_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "delete",
  "deleteMany",
]);

const UPDATE_OPERATIONS = new Set(["update", "updateMany", "updateManyAndReturn"]);
const CREATE_MANY_OPERATIONS = new Set(["createMany", "createManyAndReturn"]);

function scopeWhere(model: string, where: unknown, weddingId: string): Obj {
  const w = (where ?? {}) as Obj;
  if (w.weddingId !== undefined && w.weddingId !== weddingId) {
    throw new TenantScopeError(`${model}: query targets another wedding`);
  }
  return { ...w, weddingId };
}

function scopeCreateData(model: string, data: unknown, weddingId: string): Obj {
  const d = (data ?? {}) as Obj;
  if ("wedding" in d) {
    throw new TenantScopeError(`${model}: set weddingId, not the wedding relation`);
  }
  if (d.weddingId !== undefined && d.weddingId !== weddingId) {
    throw new TenantScopeError(`${model}: cannot create rows for another wedding`);
  }
  return { ...d, weddingId };
}

function assertNoReparent(model: string, data: unknown, weddingId: string) {
  const d = (data ?? {}) as Obj;
  if ("wedding" in d || (d.weddingId !== undefined && d.weddingId !== weddingId)) {
    throw new TenantScopeError(`${model}: cannot move rows to another wedding`);
  }
}

/**
 * Forces every query on a tenant model to stay inside `weddingId`: filters are
 * narrowed to the wedding and created rows are stamped with it. Anything that
 * would reach or move rows outside the wedding throws. Nested writes through
 * relations are not rewritten, so tenant code must create child rows directly.
 */
export function scopeArgs(model: string | undefined, operation: string, args: unknown, weddingId: string) {
  if (!model || !TENANT_MODELS.has(model)) return args;
  const a = (args ?? {}) as Obj;

  if (WHERE_OPERATIONS.has(operation)) {
    return { ...a, where: scopeWhere(model, a.where, weddingId) };
  }
  if (UPDATE_OPERATIONS.has(operation)) {
    assertNoReparent(model, a.data, weddingId);
    return { ...a, where: scopeWhere(model, a.where, weddingId) };
  }
  if (operation === "create") {
    return { ...a, data: scopeCreateData(model, a.data, weddingId) };
  }
  if (CREATE_MANY_OPERATIONS.has(operation)) {
    const data = Array.isArray(a.data)
      ? a.data.map((d) => scopeCreateData(model, d, weddingId))
      : scopeCreateData(model, a.data, weddingId);
    return { ...a, data };
  }
  if (operation === "upsert") {
    assertNoReparent(model, a.update, weddingId);
    return {
      ...a,
      where: scopeWhere(model, a.where, weddingId),
      create: scopeCreateData(model, a.create, weddingId),
    };
  }

  throw new TenantScopeError(`${model}.${operation} is not supported on a wedding-scoped client`);
}
