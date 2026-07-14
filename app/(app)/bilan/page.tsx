import { redirect } from "next/navigation";

// Merged into the unified « Récap & bilan » page (weekly + monthly tabs).
export default function BilanPage() {
  redirect("/recap?view=mensuel");
}
