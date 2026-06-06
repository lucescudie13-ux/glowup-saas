import { collectionRoutes } from "@/server/shared/route-factory";
import { dangersService } from "@/server/dangers/dangers.service";
import { createDangerSchema, updateDangerSchema } from "@/server/dangers/dangers.validation";

const handlers = collectionRoutes(dangersService, { create: createDangerSchema, update: updateDangerSchema });
export const GET = handlers.GET;
export const POST = handlers.POST;
