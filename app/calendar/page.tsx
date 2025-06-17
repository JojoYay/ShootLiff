import { Metadata } from "next"
import Calendar from "./calendar"
import { LiffProvider } from "../liffProvider"

export const metadata: Metadata = {
    title: "Calendar | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const CalendarPage = () => {
    // return <Calendar/>
    return (
        <LiffProvider liffId={process.env.LIFF_ID ?? ''}>
            <Calendar/>
        </LiffProvider>
    )
}

export default CalendarPage