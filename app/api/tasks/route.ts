import { collectionRoutes } from "@/server/shared/route-factory";
import { tasksService } from "@/server/tasks/tasks.service";
import { createTaskSchema, updateTaskSchema } from "@/server/tasks/tasks.validation";

const handlers = collectionRoutes(tasksService, { create: createTaskSchema, update: updateTaskSchema });
export const GET = handlers.GET;
export const POST = handlers.POST;
