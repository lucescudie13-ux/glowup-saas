// server/shared/route-factory.ts
import type { NextRequest } from "next/server";
import type { ZodType, ZodTypeDef } from "zod";
import { ok, created, fail, requireUser, parseBody } from "./api";

interface CrudService<TCreate, TUpdate> {
  list: (userId: string) => Promise<unknown>;
  get?: (userId: string, id: string) => Promise<unknown>;
  create: (userId: string, input: TCreate) => Promise<unknown>;
  update?: (userId: string, id: string, patch: TUpdate) => Promise<unknown>;
  remove: (userId: string, id: string) => Promise<unknown>;
}

interface Schemas<TCreate, TUpdate> {
  create: ZodType<TCreate, ZodTypeDef, unknown>;
  update?: ZodType<TUpdate, ZodTypeDef, unknown>;
}

function handleError(e: unknown) {
  const message = e instanceof Error ? e.message : "Erreur serveur.";
  return fail(message, 500);
}

/** Builds GET (list) + POST (create) handlers for a collection route. */
export function collectionRoutes<TCreate, TUpdate>(
  service: CrudService<TCreate, TUpdate>,
  schemas: Schemas<TCreate, TUpdate>
) {
  return {
    GET: async () => {
      const { user, response } = await requireUser();
      if (!user) return response;
      try {
        return ok(await service.list(user.id));
      } catch (e) {
        return handleError(e);
      }
    },
    POST: async (request: NextRequest) => {
      const { user, response } = await requireUser();
      if (!user) return response;
      const parsed = await parseBody(request, schemas.create);
      if (parsed.response) return parsed.response;
      try {
        return created(await service.create(user.id, parsed.data));
      } catch (e) {
        return handleError(e);
      }
    },
  };
}

/** Builds GET/PATCH/DELETE handlers for an item route ([id]). */
export function itemRoutes<TCreate, TUpdate>(
  service: CrudService<TCreate, TUpdate>,
  schemas: Schemas<TCreate, TUpdate>
) {
  type Ctx = { params: Promise<{ id: string }> };
  return {
    GET: async (_request: NextRequest, ctx: Ctx) => {
      const { user, response } = await requireUser();
      if (!user) return response;
      const { id } = await ctx.params;
      try {
        if (!service.get) return fail("Non supporté.", 405);
        const row = await service.get(user.id, id);
        return row ? ok(row) : fail("Introuvable.", 404);
      } catch (e) {
        return handleError(e);
      }
    },
    PATCH: async (request: NextRequest, ctx: Ctx) => {
      const { user, response } = await requireUser();
      if (!user) return response;
      if (!service.update || !schemas.update) return fail("Non supporté.", 405);
      const { id } = await ctx.params;
      const parsed = await parseBody(request, schemas.update);
      if (parsed.response) return parsed.response;
      try {
        const row = await service.update(user.id, id, parsed.data);
        return row ? ok(row) : fail("Introuvable.", 404);
      } catch (e) {
        return handleError(e);
      }
    },
    DELETE: async (_request: NextRequest, ctx: Ctx) => {
      const { user, response } = await requireUser();
      if (!user) return response;
      const { id } = await ctx.params;
      try {
        await service.remove(user.id, id);
        return ok({ id, deleted: true });
      } catch (e) {
        return handleError(e);
      }
    },
  };
}
