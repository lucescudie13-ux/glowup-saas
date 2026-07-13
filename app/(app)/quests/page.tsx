import { redirect } from "next/navigation";

// Merged into the unified « Journal de quêtes » hub.
export default function QuestsPage() {
  redirect("/journal");
}
