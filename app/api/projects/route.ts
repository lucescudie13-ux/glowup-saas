import { collectionRoutes } from "@/server/shared/route-factory";
import { projectsService } from "@/server/projects/projects.service";
import { createProjectSchema, updateProjectSchema } from "@/server/projects/projects.validation";

const handlers = collectionRoutes(projectsService, { create: createProjectSchema, update: updateProjectSchema });
export const GET = handlers.GET;
export const POST = handlers.POST;
