import { Metadata } from "next"
import InputExpense from "./input"

export const metadata: Metadata = {
    title: "Input Expense | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const InputExpensePage = () => {
    return <InputExpense />
}

export default InputExpensePage