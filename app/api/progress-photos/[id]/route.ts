import { itemRoutes } from "@/server/shared/route-factory";
import { progressPhotosService } from "@/server/progress-photos/progress-photos.service";
import { createProgressPhotoSchema, updateProgressPhotoSchema } from "@/server/progress-photos/progress-photos.validation";

const handlers = itemRoutes(progressPhotosService, { create: createProgressPhotoSchema, update: updateProgressPhotoSchema });
export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
