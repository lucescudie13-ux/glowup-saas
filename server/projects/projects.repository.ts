// server/projects/projects.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const projectsRepository = createCrudRepository("projects", { ascending: true });
