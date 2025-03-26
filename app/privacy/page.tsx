import { Metadata } from "next"
import ExpenseList from "./privacy"

export const metadata: Metadata = {
    title: "Privacy Policy | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const ExpensePage = () => {
    return <ExpenseList />
}

export default ExpensePage