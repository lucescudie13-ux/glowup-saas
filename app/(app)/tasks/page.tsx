import { redirect } from "next/navigation";

// Merged into the unified « Journal de quêtes » hub.
export default function TasksPage() {
  redirect("/journal");
}
