import { Metadata } from "next"
import { LiffProvider } from "../liffProvider"
import KanjiTask from "./kanjiTask"

export const metadata: Metadata = {
    title: "KanjiTask | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const KanjiTaskPage = () => {
    return (
        <LiffProvider liffId={process.env.LIFF_ID ?? ''}>
            <KanjiTask/>
        </LiffProvider>
    )
}

export default KanjiTaskPage 