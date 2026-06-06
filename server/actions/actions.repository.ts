// server/actions/actions.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const actionsRepository = createCrudRepository("actions", { ascending: false });
