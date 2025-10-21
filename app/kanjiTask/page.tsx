import { Metadata } from "next"
import KanjiTask from "./kanjiTask"

export const metadata: Metadata = {
    title: "KanjiTask | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const KanjiTaskPage = () => {
    return (
        <KanjiTask/>
    )
}

export default KanjiTaskPage 