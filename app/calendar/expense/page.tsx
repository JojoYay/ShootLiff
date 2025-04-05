import { Metadata } from "next"
import Expense from "./invoice"

export const metadata: Metadata = {
    title: "Expense | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const ExpensePage = () => {
    return <Expense />
}

export default ExpensePage