import { Metadata } from "next"
import CashBookPage from "./cashBook"
import { LiffProvider } from "../liffProvider"

export const metadata: Metadata = {
    title: "Cash Book | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const CashBook = () => {
    return (
        <LiffProvider liffId={process.env.LIFF_ID ?? ''}>
            <CashBookPage />
        </LiffProvider>
    )
}

export default CashBook