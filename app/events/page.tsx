import { Metadata } from "next"
import EventManager from "./eventManager"

export const metadata: Metadata = {
    title: "Event Manager | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const EventManagerPage = () => {
    return <EventManager/>
}

export default EventManagerPage