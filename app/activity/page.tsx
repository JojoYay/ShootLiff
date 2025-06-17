import { Metadata } from "next"
import Activity from "./activity"
import { LiffProvider } from "../liffProvider"

export const metadata: Metadata = {
    title: "Activity | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const ActivityPage = () => {
    return (
        <LiffProvider liffId={process.env.LIFF_ID ?? ''}>
            <Activity />
        </LiffProvider>
    )
}

export default ActivityPage