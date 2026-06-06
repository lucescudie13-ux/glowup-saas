import { collectionRoutes } from "@/server/shared/route-factory";
import { questsService } from "@/server/quests/quests.service";
import { createQuestSchema, updateQuestSchema } from "@/server/quests/quests.validation";

const handlers = collectionRoutes(questsService, { create: createQuestSchema, update: updateQuestSchema });
export const GET = handlers.GET;
export const POST = handlers.POST;
