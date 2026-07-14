import { redirect } from "next/navigation";

// Merged into the unified « Objectifs & projets » page (objectifs + projets tabs).
export default function ProjectsPage() {
  redirect("/objectives?view=projets");
}
