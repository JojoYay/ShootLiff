import { Metadata } from "next"
import Stats from "./stats"

export const metadata: Metadata = {
    title: "Stats | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const StatsPage = () => {
    return (
        <Stats />
    )
}

export default StatsPage