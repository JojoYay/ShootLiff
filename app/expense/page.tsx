import { Metadata } from "next"
import ExpenseList from "./list"

export const metadata: Metadata = {
    title: "Expense | Shoot Sunday",
}

const ExpensePage = () => {
    return <ExpenseList />
}

export default ExpensePage