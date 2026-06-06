// server/mementos/mementos.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const mementosRepository = createCrudRepository("mementos", { ascending: false });
