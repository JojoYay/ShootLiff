import { Metadata } from "next"
import Stats from "./stats"
import { LiffProvider } from "../liffProvider"

export const metadata: Metadata = {
    title: "Stats | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const StatsPage = () => {
    return (
        <LiffProvider liffId={process.env.LIFF_ID ?? ''}>
            <Stats />
        </LiffProvider>
    )
}

export default StatsPage