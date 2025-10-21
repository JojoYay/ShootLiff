import { Metadata } from "next"
import Calendar from "./calendar"

export const metadata: Metadata = {
    title: "Calendar | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const CalendarPage = () => {
    // return <Calendar/>
    return (
        <Calendar/>
    )
}

export default CalendarPage