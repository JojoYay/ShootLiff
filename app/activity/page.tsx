import { Metadata } from "next"
import Activity from "./activity"

export const metadata: Metadata = {
    title: "Activity | " + process.env.NEXT_PUBLIC_APP_TITLE,
}

const ActivityPage = () => {
    return <Activity />
}

export default ActivityPage