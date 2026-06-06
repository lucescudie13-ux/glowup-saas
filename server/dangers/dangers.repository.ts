// server/dangers/dangers.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const dangersRepository = createCrudRepository("dangers", { ascending: true });
