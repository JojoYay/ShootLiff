import { Metadata } from "next"
import CashBookPage from "./cashBook"

export const metadata: Metadata = {
    title: "Cash Book | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const CashBook = () => {
    return (
        <CashBookPage />
    )
}

export default CashBook