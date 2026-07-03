import { redirect } from "next/navigation";

// Budget and financial goals are now merged into a single "Finances" page.
export default function FinancialGoalsPage() {
  redirect("/finance");
}
