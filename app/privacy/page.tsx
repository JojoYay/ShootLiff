import { Metadata } from "next"
import ExpenseList from "./privacy"

export const metadata: Metadata = {
    title: "Privacy Policy | Shoot Sunday",
}

const ExpensePage = () => {
    return <ExpenseList />
}

export default ExpensePage