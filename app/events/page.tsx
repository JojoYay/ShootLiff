import { Metadata } from "next"
import EventManager from "./eventManager"

export const metadata: Metadata = {
    title: "Event Manager | Shoot Sunday",
}

const EventManagerPage = () => {
    return <EventManager/>
}

export default EventManagerPage