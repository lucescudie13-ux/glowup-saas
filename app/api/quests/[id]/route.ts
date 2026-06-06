import { itemRoutes } from "@/server/shared/route-factory";
import { questsService } from "@/server/quests/quests.service";
import { createQuestSchema, updateQuestSchema } from "@/server/quests/quests.validation";

const handlers = itemRoutes(questsService, { create: createQuestSchema, update: updateQuestSchema });
export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
