import { Metadata } from "next"
import CreateExpense from "./create"

export const metadata: Metadata = {
    title: "Create Expense | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const CreateExPage = () => {
    return <CreateExpense/>
}

export default CreateExPage