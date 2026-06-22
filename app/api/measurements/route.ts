import { collectionRoutes } from "@/server/shared/route-factory";
import { measurementsService } from "@/server/measurements/measurements.service";
import { createMeasurementSchema, updateMeasurementSchema } from "@/server/measurements/measurements.validation";

const handlers = collectionRoutes(measurementsService, { create: createMeasurementSchema, update: updateMeasurementSchema });
export const GET = handlers.GET;
export const POST = handlers.POST;
