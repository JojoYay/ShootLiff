import { Metadata } from "next"
import Calendar from "./calendar"

export const metadata: Metadata = {
    title: "Calendar | Shoot Sunday",
}

const CalendarPage = () => {
    return <Calendar/>
}

export default CalendarPage