// server/progress-photos/progress-photos.repository.ts
import { createCrudRepository } from "@/server/shared/crud";

export const progressPhotosRepository = createCrudRepository("progress_photos", {
  orderBy: "photo_date",
  ascending: false,
});
