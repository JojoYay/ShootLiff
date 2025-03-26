import { Metadata } from "next"
import ExpenseList from "./list"

export const metadata: Metadata = {
    title: "Expense | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const ExpensePage = () => {
    return <ExpenseList />
}

export default ExpensePage