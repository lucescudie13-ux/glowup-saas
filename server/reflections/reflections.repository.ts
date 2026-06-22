// server/reflections/reflections.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const reflectionsRepository = createCrudRepository("reflections", {
  orderBy: "created_at",
  ascending: false,
});
