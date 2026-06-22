import { itemRoutes } from "@/server/shared/route-factory";
import { measurementsService } from "@/server/measurements/measurements.service";
import { createMeasurementSchema, updateMeasurementSchema } from "@/server/measurements/measurements.validation";

const handlers = itemRoutes(measurementsService, { create: createMeasurementSchema, update: updateMeasurementSchema });
export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
