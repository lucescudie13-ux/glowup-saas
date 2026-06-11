// server/routines/routines.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const routinesRepository = createCrudRepository("routines", { orderBy: "position", ascending: true });
