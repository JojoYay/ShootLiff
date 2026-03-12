import { Metadata } from "next";
import ExpenseList from "../../expense/list";

export const metadata: Metadata = {
  title: "Expense | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootExpensePage() {
  return <ExpenseList />;
}
