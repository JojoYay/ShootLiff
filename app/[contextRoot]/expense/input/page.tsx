import { Metadata } from "next";
import ExpenseInput from "../../../expense/input/input";

export const metadata: Metadata = {
  title: "Expense Input | " + process.env.NEXT_PUBLIC_APP_TITLE,
};

export default function ContextRootExpenseInputPage() {
  return <ExpenseInput />;
}
