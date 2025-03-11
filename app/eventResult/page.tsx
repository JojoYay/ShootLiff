import { Metadata } from "next"
import EventResult from "./eventResult"

export const metadata: Metadata = {
    title: "Team Input | Shoot Sunday",
}

const eventResult = () => {
    return <EventResult/>
}

export default eventResult
