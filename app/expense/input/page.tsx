import { Metadata } from "next"
import InputExpense from "./input"

export const metadata: Metadata = {
    title: "Input Expense | Shoot Sunday",
}

const InputExpensePage = () => {
    return <InputExpense />
}

export default InputExpensePage