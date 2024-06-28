import { Metadata } from "next"
import Stats from "./stats"

export const metadata: Metadata = {
    title: "Stats | Shoot Sunday",
}

const StatsPage = () => {
    return <Stats/>
}

export default StatsPage