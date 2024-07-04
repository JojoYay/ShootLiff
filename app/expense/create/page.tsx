import { Metadata } from "next"
import CreateExpense from "./create"

export const metadata: Metadata = {
    title: "Create Expense | Shoot Sunday",
}

const CreateExPage = () => {
    return <CreateExpense/>
}

export default CreateExPage