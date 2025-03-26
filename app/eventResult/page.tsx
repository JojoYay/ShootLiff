import { Metadata } from "next"
import EventResult from "./eventResult"

export const metadata: Metadata = {
    title: "Event Result | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const eventResult = () => {
    return <EventResult/>
}

export default eventResult
