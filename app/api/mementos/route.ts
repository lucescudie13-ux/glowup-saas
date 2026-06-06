import { collectionRoutes } from "@/server/shared/route-factory";
import { mementosService } from "@/server/mementos/mementos.service";
import { createMementoSchema, updateMementoSchema } from "@/server/mementos/mementos.validation";

const handlers = collectionRoutes(mementosService, { create: createMementoSchema, update: updateMementoSchema });
export const GET = handlers.GET;
export const POST = handlers.POST;
