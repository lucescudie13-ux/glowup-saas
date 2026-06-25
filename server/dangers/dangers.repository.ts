// server/dangers/dangers.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const dangersRepository = createCrudRepository("dangers", { orderBy: "position", ascending: true });
