import { Metadata } from "next";
import Expense from "../../../calendar/expense/invoice";

export const metadata: Metadata = {
  title: "Expense | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootCalendarExpensePage() {
  return <Expense />;
}
