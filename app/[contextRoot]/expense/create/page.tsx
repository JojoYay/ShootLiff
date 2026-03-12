import { Metadata } from "next";
import ExpenseCreate from "../../../expense/create/create";

export const metadata: Metadata = {
  title: "Expense Create | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootExpenseCreatePage() {
  return <ExpenseCreate />;
}
