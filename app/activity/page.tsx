import { Metadata } from "next"
import Activity from "./activity"

export const metadata: Metadata = {
    title: "Activity | Shoot Sunday",
}

const ActivityPage = () => {
    return <Activity/>
}

export default ActivityPage