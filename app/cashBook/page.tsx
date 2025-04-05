import { Metadata } from "next"
import CashBook from "./cashBook"

export const metadata: Metadata = {
    title: "Cash Book | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const CashBookPage = () => {
    return <CashBook/>
}

export default CashBookPage