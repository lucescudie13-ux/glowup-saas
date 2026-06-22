import { collectionRoutes } from "@/server/shared/route-factory";
import { progressPhotosService } from "@/server/progress-photos/progress-photos.service";
import { createProgressPhotoSchema, updateProgressPhotoSchema } from "@/server/progress-photos/progress-photos.validation";

const handlers = collectionRoutes(progressPhotosService, { create: createProgressPhotoSchema, update: updateProgressPhotoSchema });
export const GET = handlers.GET;
export const POST = handlers.POST;
